# main.py
"""
Multi-Camera CCTV Surveillance System
- Pure detection (no ByteTrack) — works on any RTSP stream
- Simple IoU overlap matching between frames to link detections
- Events: entry, exit, long_stay saved to MongoDB
- Cross-camera appearance re-identification via HS histogram
"""

import cv2
import torch
import time
import threading
import signal
import sys
from datetime import datetime

import numpy as np
from ultralytics import YOLO

from utils.color_utils import detect_color, extract_histogram
from utils.mongo_utils import save_event

# ========================= CONFIG =========================
MODEL_NAME    = "yolov8s.pt"
CONFIDENCE    = 0.35
IOU           = 0.50
FRAME_SKIP    = 1
FRAME_ENHANCE = True
INPUT_SIZE    = 1024

# How many frames an object can be missing before it is considered gone
MISS_TOLERANCE = 8

# Minimum IoU overlap to consider two detections the same object
IOU_MATCH_THRESHOLD = 0.30

EXIT_THRESHOLD_SECONDS       = 3
EVENT_CHECK_INTERVAL_SECONDS = 1

TRAIL_MAX_POINTS = 60

LONG_STAY_THRESHOLDS = {
    "person":     45,
    "bag":        60,
    "backpack":   60,
    "car":       300,
    "truck":     300,
    "bike":      180,
    "motorcycle":180,
}

torch.set_num_threads(4)
cv2.setUseOptimized(True)

model_lock = threading.Lock()
model      = YOLO(MODEL_NAME)
print("✅ YOLOv8 model loaded\n")

_clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))


def enhance_frame(frame: np.ndarray) -> np.ndarray:
    if not FRAME_ENHANCE:
        return frame
    lab     = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l_eq    = _clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l_eq, a, b]), cv2.COLOR_LAB2BGR)


# ====================== SHARED STATE ======================
shutdown_event = threading.Event()


# ====================== IoU HELPER ======================
def compute_iou(boxA, boxB):
    """Compute IoU between two [x1,y1,x2,y2] boxes."""
    xA = max(boxA[0], boxB[0]);  yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2]);  yB = min(boxA[3], boxB[3])
    inter = max(0, xB - xA) * max(0, yB - yA)
    if inter == 0:
        return 0.0
    areaA = (boxA[2]-boxA[0]) * (boxA[3]-boxA[1])
    areaB = (boxB[2]-boxB[0]) * (boxB[3]-boxB[1])
    return inter / float(areaA + areaB - inter)


# ====================== FRAME GRABBER ======================
class FrameGrabber:
    def __init__(self, camera_id, rtsp_url):
        self.camera_id = camera_id
        self.rtsp_url  = rtsp_url
        self._lock     = threading.Lock()
        self._frame    = None
        self._ok       = False
        self._thread   = threading.Thread(target=self._grab_loop,
                                          name=f"grabber-{camera_id}",
                                          daemon=True)

    def start(self):  self._thread.start()

    def read(self):
        with self._lock:
            return self._ok, (self._frame.copy() if self._frame is not None else None)

    def _open(self):
        cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return cap

    def _grab_loop(self):
        cap = self._open();  backoff = 1
        while not shutdown_event.is_set():
            ret, frame = cap.read()
            if ret and frame is not None:
                with self._lock:
                    self._frame = frame;  self._ok = True
                backoff = 1
            else:
                with self._lock:
                    self._ok = False
                cap.release();  time.sleep(backoff)
                backoff = min(backoff * 2, 30);  cap = self._open()
        cap.release()


# ====================== SYNC BARRIER ======================
class SyncBarrier:
    def __init__(self, grabbers):  self._grabbers = grabbers

    def wait(self, timeout=15.0):
        deadline = time.time() + timeout
        while time.time() < deadline and not shutdown_event.is_set():
            if all(g.read()[0] for g in self._grabbers):
                return True
            time.sleep(0.05)
        return False


# ====================== PER-CAMERA PROCESSOR ======================
class CameraProcessor:
    def __init__(self, camera_id, rtsp_url, grabber):
        self.camera_id  = camera_id
        self.rtsp_url   = rtsp_url
        self.grabber    = grabber
        self.window_name = f"CAM {camera_id}"

        # Internal object ID counter (local to this camera)
        self._next_local_id  = 1

        # local_id → object state dict
        self.active_objects: dict = {}

        self.frame_counter    = 0
        self.last_event_check = datetime.now()

    # ── local ID management ──────────────────────────────────────────────

    def _alloc_local_id(self):
        lid = self._next_local_id
        self._next_local_id += 1
        return lid

    # ── IoU matching: assign detections to existing objects ─────────────

    def _match_detections(self, detections):
        """
        detections: list of (label, bbox)
        Returns:
          matched  : { local_id: (label, bbox) }   existing obj → new bbox
          new_dets : [ (label, bbox) ]              unmatched → new objects
        """
        matched   = {}
        used_dets = set()

        for lid, obj in self.active_objects.items():
            best_iou  = IOU_MATCH_THRESHOLD
            best_didx = -1
            for didx, (label, bbox) in enumerate(detections):
                if didx in used_dets:
                    continue
                if label != obj["object_type"]:
                    continue
                iou = compute_iou(obj["last_position"], bbox)
                if iou > best_iou:
                    best_iou  = iou
                    best_didx = didx
            if best_didx >= 0:
                matched[lid] = detections[best_didx]
                used_dets.add(best_didx)

        new_dets = [d for i, d in enumerate(detections) if i not in used_dets]
        return matched, new_dets

    def _register_entry(self, local_id, obj_type, color, entry_time):
        save_event({"camera_id": self.camera_id, "event": "entry",
                    "local_id": local_id, "object_type": obj_type,
                    "color": color, "entry_time": entry_time})

    def _register_exit(self, local_id, obj, exit_time):
        duration = (exit_time - obj["entry_time"]).total_seconds()
        save_event({"camera_id": self.camera_id, "event": "exit",
                    "local_id": local_id, "object_type": obj["object_type"],
                    "color": obj["color"], "entry_time": obj["entry_time"],
                    "exit_time": exit_time,
                    "duration_seconds": round(duration, 2),
                    "movement_count": obj["movement_count"]})

    # ── has moved ────────────────────────────────────────────────────────

    @staticmethod
    def _has_moved(bbox1, bbox2, threshold=20):
        cx1 = (bbox1[0]+bbox1[2])/2;  cy1 = (bbox1[1]+bbox1[3])/2
        cx2 = (bbox2[0]+bbox2[2])/2;  cy2 = (bbox2[1]+bbox2[3])/2
        return abs(cx1-cx2) > threshold or abs(cy1-cy2) > threshold

    # ── event checker ────────────────────────────────────────────────────

    def _check_and_fire_events(self, current_time, matched_ids):
        to_remove = []
        for local_id, obj in list(self.active_objects.items()):
            obj_type = obj["object_type"]
            duration = (current_time - obj["entry_time"]).total_seconds()

            if local_id not in matched_ids:
                # Object not seen this frame — increment miss counter
                obj["miss_count"] = obj.get("miss_count", 0) + 1
                if obj["miss_count"] >= MISS_TOLERANCE:
                    self._register_exit(local_id, obj, current_time)
                    to_remove.append(local_id)
                continue

            # Reset miss counter when seen
            obj["miss_count"] = 0

            # Long-stay check
            threshold = LONG_STAY_THRESHOLDS.get(obj_type)
            if threshold and duration >= threshold and not obj.get("long_stay_fired"):
                save_event({"camera_id": self.camera_id, "event": "long_stay",
                            "local_id": local_id, "object_type": obj_type,
                            "color": obj["color"], "entry_time": obj["entry_time"],
                            "duration_seconds": round(duration, 2),
                            "movement_count": obj["movement_count"]})
                obj["long_stay_fired"] = True

            # Stationary check
            if obj.get("is_stationary") and not obj.get("stationary_logged"):
                save_event({"camera_id": self.camera_id, "event": "stationary",
                            "local_id": local_id, "object_type": obj_type,
                            "color": obj["color"], "timestamp": current_time,
                            "position": obj["last_position"]})
                obj["stationary_logged"] = True

        for local_id in to_remove:
            del self.active_objects[local_id]

    # ── main frame processing ────────────────────────────────────────────

    def process_frame(self, frame):
        self.frame_counter += 1
        if self.frame_counter % max(1, FRAME_SKIP) != 0:
            return frame

        current_time = datetime.now()

        # ── Run detection (NO tracking) ───────────────────────────────────
        with model_lock:
            enhanced = enhance_frame(frame)
            results  = model.predict(
                enhanced,
                conf=CONFIDENCE, iou=IOU, imgsz=INPUT_SIZE,
                verbose=False, agnostic_nms=True,
            )

        # Collect raw detections this frame
        detections = []   # [(label, [x1,y1,x2,y2]), …]
        for r in results:
            if r.boxes is None:
                continue
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                label = model.names[int(box.cls.item())].lower()
                detections.append((label, [x1, y1, x2, y2]))

        # ── Match detections to existing objects via IoU ──────────────────
        matched, new_dets = self._match_detections(detections)
        matched_ids = set(matched.keys())

        # Update existing matched objects
        for local_id, (label, bbox) in matched.items():
            obj = self.active_objects[local_id]
            obj["last_seen"] = current_time

            moved = self._has_moved(bbox, obj["last_position"])
            if moved:
                if obj.get("is_stationary"):
                    obj["is_stationary"]    = False
                    obj["stationary_logged"] = False
                    save_event({"camera_id": self.camera_id,
                                "event": "resumed_moving",
                                "local_id": local_id,
                                "object_type": obj["object_type"],
                                "color": obj["color"],
                                "timestamp": current_time})
                obj["movement_count"] += 1
                obj["last_position"]   = bbox
                obj["histogram"]       = extract_histogram(frame, bbox)
            else:
                if not obj.get("is_stationary"):
                    obj["is_stationary"]    = True
                    obj["stationary_logged"] = False   # will be logged in event check

        # Register brand-new detections
        for label, bbox in new_dets:
            local_id   = self._alloc_local_id()
            color_name = detect_color(frame, bbox)
            histogram  = extract_histogram(frame, bbox)
            self.active_objects[local_id] = {
                "entry_time":        current_time,
                "last_seen":         current_time,
                "object_type":       label,
                "color":             color_name,
                "histogram":         histogram,
                "last_position":     bbox,
                "movement_count":    0,
                "long_stay_fired":   False,
                "is_stationary":     False,
                "stationary_logged": False,
                "miss_count":        0,
                "trail":             [],
            }
            self._register_entry(local_id, label, color_name, current_time)

        # ── Throttled event checking ──────────────────────────────────────
        elapsed = (current_time - self.last_event_check).total_seconds()
        if elapsed >= EVENT_CHECK_INTERVAL_SECONDS:
            self._check_and_fire_events(current_time, matched_ids)
            self.last_event_check = current_time

        # ── Draw all active objects ───────────────────────────────────────
        for local_id, obj in self.active_objects.items():
            bbox = obj["last_position"]
            x1, y1, x2, y2 = bbox

            # Update trail
            cx, cy = int((x1+x2)/2), int((y1+y2)/2)
            obj["trail"].append((cx, cy))
            if len(obj["trail"]) > TRAIL_MAX_POINTS:
                obj["trail"].pop(0)

            # Determine box colour
            is_still  = obj.get("is_stationary", False)
            box_color = (0, 215, 255) if is_still else (0, 255, 0)  # yellow or green

            # Draw fading trail
            trail_pts = obj["trail"]
            n_pts     = len(trail_pts)
            if n_pts >= 2:
                overlay = frame.copy()
                for i in range(1, n_pts):
                    alpha = i / n_pts
                    faded = tuple(int(c * alpha) for c in box_color)
                    cv2.line(overlay, trail_pts[i-1], trail_pts[i],
                             faded, max(1, int(alpha*3)), cv2.LINE_AA)
                cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

            # Draw bounding box + label
            cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)
            status = " [STILL]" if is_still else ""
            label_text = obj["object_type"]
            color_lbl  = obj["color"]
            tag = f"{label_text} [{color_lbl}]{status} #{local_id}"
            cv2.putText(frame, tag, (x1, max(y1-10, 15)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 1)

        # ── HUD overlay ──────────────────────────────────────────────────
        ts = current_time.strftime("%Y-%m-%d  %H:%M:%S")
        cv2.putText(frame, f"CAM {self.camera_id}  |  {ts}",
                    (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 1)
        cv2.putText(frame, f"Detected: {len(self.active_objects)}",
                    (8, 44), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (0, 255, 255), 1)
        return frame

    def flush_exits(self):
        current_time = datetime.now()
        for local_id, obj in list(self.active_objects.items()):
            self._register_exit(local_id, obj, current_time)
        self.active_objects.clear()

    # ── window helpers ───────────────────────────────────────────────────

    def position_window(self, total_cameras):
        COLS      = min(2, total_cameras)
        CELL_W, CELL_H, TITLE_BAR = 700, 430, 30
        idx = self.camera_id - 1
        col, row = idx % COLS, idx // COLS
        cv2.resizeWindow(self.window_name, CELL_W, CELL_H)
        cv2.moveWindow(self.window_name, col * CELL_W, row * (CELL_H + TITLE_BAR))

    def run(self, total_cameras=1):
        print(f"🎥 CAM {self.camera_id}: processor started")
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        self.position_window(total_cameras)
        blank = np.zeros((480, 640, 3), dtype=np.uint8)

        while not shutdown_event.is_set():
            ok, frame = self.grabber.read()
            if not ok or frame is None:
                no_sig = blank.copy()
                cv2.putText(no_sig, f"CAM {self.camera_id} — NO SIGNAL",
                            (30, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
                cv2.imshow(self.window_name, no_sig)
                cv2.waitKey(1);  time.sleep(0.05);  continue

            processed = self.process_frame(frame)
            cv2.imshow(self.window_name, processed)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("🛑 'q' pressed — shutting down")
                shutdown_event.set();  break

        self.flush_exits()
        cv2.destroyWindow(self.window_name)
        print(f"✅ CAM {self.camera_id}: stopped")


# ========================= MAIN =========================
def main():
    def _sigint(sig, frame):
        print("\n🛑 Interrupt received — shutting down…")
        shutdown_event.set()
    signal.signal(signal.SIGINT, _sigint)

    print("=" * 70)
    print("🎥  MULTI-CAMERA CCTV  |  Detection-Only + DB Events")
    print("=" * 70)

    try:
        num_cameras = int(input("\nEnter number of cameras: ").strip())
    except (ValueError, EOFError):
        num_cameras = 2

    rtsp_urls = []
    print(f"\nEnter RTSP URLs for {num_cameras} camera(s):\n")
    for i in range(num_cameras):
        url = input(f"  Camera {i+1} RTSP URL: ").strip()
        if url:
            rtsp_urls.append(url)

    if not rtsp_urls:
        print("❌ No URLs entered.");  sys.exit(1)

    processors = [
        CameraProcessor(camera_id=i+1, rtsp_url=url,
                        grabber=FrameGrabber(camera_id=i+1, rtsp_url=url))
        for i, url in enumerate(rtsp_urls)
    ]

    grabbers = [p.grabber for p in processors]
    for g in grabbers:
        g.start()

    print("⏳ Waiting for all cameras to produce first frame…")
    if SyncBarrier(grabbers).wait(timeout=20):
        print("✅ All cameras synced — starting processors\n")
    else:
        print("⚠️  Some cameras timed out — starting anyway\n")

    print(f"🚀 Launching {len(processors)} camera window(s) … Press 'q' to quit\n")

    threads = []
    for proc in processors:
        t = threading.Thread(target=proc.run, args=(len(processors),),
                             name=f"cam-{proc.camera_id}", daemon=True)
        t.start();  threads.append(t)

    shutdown_event.wait()
    print("⏳ Waiting for threads to finish…")
    for t in threads:
        t.join(timeout=5)
    cv2.destroyAllWindows()
    print("👋 Goodbye.")


if __name__ == "__main__":
    main()