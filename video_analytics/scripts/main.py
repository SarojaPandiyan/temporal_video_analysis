# main.py
import cv2
import torch
import time
from datetime import datetime
import numpy as np
from ultralytics import YOLO
from ultralytics import checks

from utils.color_utils import detect_color
from utils.mongo_utils import save_event

# ========================= CONFIG =========================
MODEL_NAME = "yolov8m.pt"
CONFIDENCE = 0.15
IOU = 0.5
FRAME_SKIP = 1                    # Lower = smoother, higher = less CPU

EXIT_THRESHOLD_SECONDS = 2
EVENT_CHECK_INTERVAL_SECONDS = 1

# Fixed cell size for every camera in the grid
CELL_WIDTH = 640
CELL_HEIGHT = 480

LONG_STAY_THRESHOLDS = {
    "person": 45,
    "bag": 60,
    "backpack": 60,
    "car": 300,
    "truck": 300,
    "bike": 180,
    "motorcycle": 180,
}

torch.set_num_threads(4)
cv2.setUseOptimized(True)

model = YOLO(MODEL_NAME)
print("✅ YOLOv8 model loaded successfully\n")


# ====================== GLOBAL STORAGE ======================
active_objects_per_camera = {}   # {camera_id: {track_id: {...}}}
frame_counters = {}              # {camera_id: int}
last_event_check = {}            # {camera_id: datetime}


def has_moved(bbox1, bbox2, threshold=20):
    """Simple center-point movement detection."""
    cx1 = (bbox1[0] + bbox1[2]) / 2
    cy1 = (bbox1[1] + bbox1[3]) / 2
    cx2 = (bbox2[0] + bbox2[2]) / 2
    cy2 = (bbox2[1] + bbox2[3]) / 2
    return abs(cx1 - cx2) > threshold or abs(cy1 - cy2) > threshold


def check_and_fire_events(camera_id, current_time, active_objects, seen_ids):
    """Fire long_stay and exit events for tracked objects."""
    to_remove = []

    for track_id, obj in active_objects.items():
        obj_type = obj["object_type"]
        duration = (current_time - obj["entry_time"]).total_seconds()

        # Exit event: object not seen for EXIT_THRESHOLD_SECONDS
        if track_id not in seen_ids:
            since_last = (current_time - obj["last_seen"]).total_seconds()
            if since_last >= EXIT_THRESHOLD_SECONDS:
                save_event({
                    "camera_id": camera_id,
                    "event": "exit",
                    "track_id": track_id,
                    "object_type": obj_type,
                    "color": obj["color"],
                    "entry_time": obj["entry_time"],
                    "exit_time": current_time,
                    "duration_seconds": round(duration, 2),
                    "movement_count": obj["movement_count"],
                })
                to_remove.append(track_id)
            continue

        # Long-stay event: object present beyond threshold
        threshold = LONG_STAY_THRESHOLDS.get(obj_type)
        if threshold and duration >= threshold and not obj.get("long_stay_fired"):
            save_event({
                "camera_id": camera_id,
                "event": "long_stay",
                "track_id": track_id,
                "object_type": obj_type,
                "color": obj["color"],
                "entry_time": obj["entry_time"],
                "duration_seconds": round(duration, 2),
                "movement_count": obj["movement_count"],
            })
            obj["long_stay_fired"] = True

    for track_id in to_remove:
        del active_objects[track_id]


def process_frame(camera_id, frame):
    global active_objects_per_camera, frame_counters, last_event_check

    # Init per-camera state
    if camera_id not in active_objects_per_camera:
        active_objects_per_camera[camera_id] = {}
        frame_counters[camera_id] = 0
        last_event_check[camera_id] = datetime.now()

    active_objects = active_objects_per_camera[camera_id]

    frame_counters[camera_id] += 1
    if frame_counters[camera_id] % FRAME_SKIP != 0:
        return frame

    current_time = datetime.now()

    results = model.track(
        frame, persist=True, tracker="bytetrack.yaml",
        conf=CONFIDENCE, iou=IOU, verbose=False
    )

    seen_ids = set()

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            if box.id is None:
                continue

            track_id = int(box.id.item())
            label = model.names[int(box.cls.item())].lower()
            bbox = box.xyxy[0].tolist()

            seen_ids.add(track_id)

            if track_id not in active_objects:
                color_name = detect_color(frame, bbox)
                active_objects[track_id] = {
                    "entry_time": current_time,
                    "last_seen": current_time,
                    "first_seen": current_time,
                    "object_type": label,
                    "color": color_name,
                    "last_position": bbox,
                    "movement_count": 0,
                    "long_stay_fired": False,
                }
            else:
                obj = active_objects[track_id]
                obj["last_seen"] = current_time
                if has_moved(bbox, obj["last_position"]):
                    obj["movement_count"] += 1
                    obj["last_position"] = bbox

            # Draw bounding box
            x1, y1, x2, y2 = map(int, bbox)
            color_label = active_objects[track_id]["color"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            text = f"{label} | {color_label}"
            cv2.putText(frame, text, (x1, max(y1 - 10, 15)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Throttled event checking
    elapsed = (current_time - last_event_check[camera_id]).total_seconds()
    if elapsed >= EVENT_CHECK_INTERVAL_SECONDS:
        check_and_fire_events(camera_id, current_time, active_objects, seen_ids)
        last_event_check[camera_id] = current_time

    return frame


def flush_camera_exits(camera_id):
    """Call on shutdown to emit exit events for all still-tracked objects."""
    active_objects = active_objects_per_camera.get(camera_id, {})
    current_time = datetime.now()
    for track_id, obj in active_objects.items():
        duration = (current_time - obj["entry_time"]).total_seconds()
        save_event({
            "camera_id": camera_id,
            "event": "exit",
            "track_id": track_id,
            "object_type": obj["object_type"],
            "color": obj["color"],
            "entry_time": obj["entry_time"],
            "exit_time": current_time,
            "duration_seconds": round(duration, 2),
            "movement_count": obj["movement_count"],
        })


def create_cctv_dashboard(frames, camera_ids):
    """
    Combine all camera feeds into one grid dashboard.

    Every frame is resized to (CELL_WIDTH x CELL_HEIGHT) before placement
    so cameras with different native resolutions all fit cleanly into the
    same grid without overflowing or hiding each other.
    """
    n = len(frames)
    if n == 0:
        return np.zeros((CELL_HEIGHT, CELL_WIDTH, 3), dtype=np.uint8)

    cols = min(3, n)
    rows = (n + cols - 1) // cols  # ceiling division

    title_bar_h = 45
    grid_h = CELL_HEIGHT * rows + title_bar_h
    grid_w = CELL_WIDTH * cols

    grid = np.zeros((grid_h, grid_w, 3), dtype=np.uint8)

    # Title bar
    cv2.rectangle(grid, (0, 0), (grid_w, title_bar_h), (20, 20, 20), -1)
    cv2.putText(grid, "MULTI-CAMERA CCTV SURVEILLANCE SYSTEM", (15, 33),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)

    for i, frame in enumerate(frames):
        row = i // cols
        col = i % cols

        # Pixel origin for this cell (offset by title bar)
        y = title_bar_h + row * CELL_HEIGHT
        x = col * CELL_WIDTH

        # Resize every frame to exactly the cell size
        cell = cv2.resize(frame, (CELL_WIDTH, CELL_HEIGHT))
        grid[y:y + CELL_HEIGHT, x:x + CELL_WIDTH] = cell

        # Thin border to visually separate cells
        cv2.rectangle(grid, (x, y), (x + CELL_WIDTH - 1, y + CELL_HEIGHT - 1),
                      (60, 60, 60), 1)

        # Camera label — bottom-left of cell, clear of the title bar
        cv2.putText(grid, f"CAM {camera_ids[i]}",
                    (x + 8, y + CELL_HEIGHT - 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 255), 2)

    return grid


def open_camera(url):
    cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)   # reduce latency
    return cap


# ====================== MAIN ======================
if __name__ == "__main__":
    print("=" * 80)
    print("🎥 MULTI-CAMERA CCTV DASHBOARD (Single Window)")
    print("=" * 80)

    try:
        num_cameras = int(input("\nEnter number of cameras: ").strip())
    except (ValueError, EOFError):
        num_cameras = 2

    print(f"\nEnter RTSP URLs for {num_cameras} cameras:\n")
    rtsp_urls = []
    for i in range(num_cameras):
        url = input(f"Camera {i + 1} RTSP URL: ").strip()
        if url:
            rtsp_urls.append(url)

    if not rtsp_urls:
        print("❌ No RTSP URLs entered!")
        exit()

    print(f"\n🚀 Starting dashboard with {len(rtsp_urls)} cameras...")
    print("Press 'q' to exit\n")

    caps = [open_camera(url) for url in rtsp_urls]
    camera_ids = list(range(1, len(rtsp_urls) + 1))

    # Pre-allocated blank frame for cameras with no signal
    blank_frame = np.zeros((CELL_HEIGHT, CELL_WIDTH, 3), dtype=np.uint8)

    while True:
        frames = []
        for i, (cap, url) in enumerate(zip(caps, rtsp_urls)):
            ret, frame = cap.read()

            # Auto-reconnect on stream failure
            if not ret:
                print(f"⚠️  Camera {camera_ids[i]} lost signal. Reconnecting...")
                cap.release()
                caps[i] = open_camera(url)
                ret, frame = caps[i].read()

            if not ret or frame is None:
                # Use a fresh copy of the blank so putText doesn't accumulate
                no_signal = blank_frame.copy()
                cv2.putText(no_signal, f"CAM {camera_ids[i]} - NO SIGNAL",
                            (50, CELL_HEIGHT // 2),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                frames.append(no_signal)
            else:
                frames.append(process_frame(camera_ids[i], frame))

        dashboard = create_cctv_dashboard(frames, camera_ids)
        cv2.imshow("CCTV Surveillance Dashboard", dashboard)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("🛑 System shutdown by user.")
            break

    # Flush remaining tracked objects as exits
    for cam_id in camera_ids:
        flush_camera_exits(cam_id)

    for cap in caps:
        cap.release()
    cv2.destroyAllWindows()