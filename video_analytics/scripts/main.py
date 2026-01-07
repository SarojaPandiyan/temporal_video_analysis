import cv2
import torch
from datetime import datetime
from ultralytics import YOLO

from utils.color_utils import detect_color
from utils.mongo_utils import save_event

# ---------------- CONFIG ---------------- #
VIDEO_PATH = "../videos/input2.mp4"
EXIT_THRESHOLD_SECONDS = 2

MODEL_NAME = "yolov8s.pt"   # better recall on CPU
CONFIDENCE = 0.25
IOU = 0.5

# --------------- OPTIMIZATION ------------ #
torch.set_num_threads(4)
cv2.setUseOptimized(True)

# ---------------- LOAD MODEL ------------- #
model = YOLO(MODEL_NAME)

cap = cv2.VideoCapture(VIDEO_PATH)
fps = int(cap.get(cv2.CAP_PROP_FPS))

active_objects = {}
last_event_check = datetime.now()

FRAME_SKIP = 5  # process 1 frame every 5 frames
frame_count = 0

print("Playing video — press 'q' to quit")

# ---------------- MAIN LOOP --------------- #
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    # Skip frames
    if frame_count % FRAME_SKIP != 0:
        continue

    current_time = datetime.now()

    #  Detect & track EVERY processed frame
    results = model.track(
        frame,
        persist=True,
        tracker="bytetrack.yaml",
        conf=CONFIDENCE,
        iou=IOU
    )

    seen_ids = set()

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            if box.id is None:
                continue

            track_id = int(box.id.item())
            cls_id = int(box.cls.item())
            label = model.names[cls_id]
            bbox = box.xyxy[0].tolist()

            seen_ids.add(track_id)

            # 🔹 Entry logic
            if track_id not in active_objects:
                color_name = detect_color(frame, bbox)
                active_objects[track_id] = {
                    "entry_time": current_time,
                    "last_seen": current_time,
                    "object_type": label,
                    "color": color_name
                }
            else:
                active_objects[track_id]["last_seen"] = current_time

            # 🔲 Draw bounding box
            x1, y1, x2, y2 = map(int, bbox)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            text = f"{label} | ID:{track_id} | {active_objects[track_id]['color']}"
            cv2.putText(
                frame,
                text,
                (x1, max(y1 - 10, 15)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )

    # 🟡 Entry/Exit evaluation once per second
    if (current_time - last_event_check).seconds >= 1:
        last_event_check = current_time

        for tid in list(active_objects.keys()):
            if tid not in seen_ids:
                delta = (current_time - active_objects[tid]["last_seen"]).seconds

                if delta > EXIT_THRESHOLD_SECONDS:
                    event = {
                        "object_id": tid,
                        "object_type": active_objects[tid]["object_type"],
                        "color": active_objects[tid]["color"],
                        "entry_time": active_objects[tid]["entry_time"],
                        "exit_time": current_time,
                        "video": VIDEO_PATH
                    }
                    save_event(event)
                    del active_objects[tid]

    # Show video
    cv2.imshow("YOLOv8 + ByteTrack Video Analytics", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
