# utils/color_utils.py
import cv2
import numpy as np
from sklearn.cluster import KMeans

# Stable CSS color palette (BGR values stored as RGB for readability)
CSS_COLORS = {
    "black":   (0, 0, 0),
    "white":   (255, 255, 255),
    "red":     (255, 0, 0),
    "lime":    (0, 255, 0),
    "blue":    (0, 0, 255),
    "yellow":  (255, 255, 0),
    "cyan":    (0, 255, 255),
    "magenta": (255, 0, 255),
    "silver":  (192, 192, 192),
    "gray":    (128, 128, 128),
    "maroon":  (128, 0, 0),
    "olive":   (128, 128, 0),
    "green":   (0, 128, 0),
    "purple":  (128, 0, 128),
    "teal":    (0, 128, 128),
    "navy":    (0, 0, 128),
    "orange":  (255, 165, 0),
    "brown":   (165, 42, 42),
    "pink":    (255, 192, 203),
    "beige":   (245, 245, 220),
}

# Histogram parameters
HIST_BINS  = 32   # bins per channel (H and S)
HIST_RANGE = [0, 180, 0, 256]   # H: 0-179, S: 0-255


def closest_color_name(rgb) -> str:
    """Return the CSS color name closest to the given RGB tuple."""
    min_dist   = float("inf")
    closest    = "unknown"
    rgb_arr    = np.array(rgb)
    for name, value in CSS_COLORS.items():
        dist = np.sum((np.array(value) - rgb_arr) ** 2)
        if dist < min_dist:
            min_dist = dist
            closest  = name
    return closest


def _safe_crop(frame, bbox):
    """Return the cropped region, or None if the box is degenerate."""
    x1, y1, x2, y2 = map(int, bbox)
    x1, y1 = max(x1, 0), max(y1, 0)
    x2, y2 = min(x2, frame.shape[1]), min(y2, frame.shape[0])
    if x2 <= x1 or y2 <= y1:
        return None
    return frame[y1:y2, x1:x2]


def detect_color(frame, bbox, k: int = 3) -> str:
    """
    Detect the dominant color inside a bounding box.

    Uses KMeans in RGB space; returns the CSS name closest to the
    centroid that owns the most pixels.
    """
    crop = _safe_crop(frame, bbox)
    if crop is None or crop.size == 0:
        return "unknown"

    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    pixels   = crop_rgb.reshape(-1, 3).astype(np.float32)

    # Subsample for speed
    if len(pixels) > 2000:
        idx     = np.random.choice(len(pixels), 2000, replace=False)
        pixels  = pixels[idx]

    kmeans = KMeans(n_clusters=k, n_init=10, random_state=0)
    kmeans.fit(pixels)

    counts        = np.bincount(kmeans.labels_)
    dominant_idx  = counts.argmax()
    dominant_rgb  = kmeans.cluster_centers_[dominant_idx].astype(int)

    return closest_color_name(dominant_rgb)


def extract_histogram(frame, bbox) -> np.ndarray:
    """
    Extract a 2-D HS histogram from the bounding box in HSV space.

    Returns a flat, L2-normalised float32 array for Bhattacharyya
    comparison.  Falls back to a zero vector on degenerate inputs.
    """
    crop = _safe_crop(frame, bbox)
    zero = np.zeros(HIST_BINS * HIST_BINS, dtype=np.float32)

    if crop is None or crop.size == 0:
        return zero

    hsv  = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist(
        [hsv], [0, 1], None,
        [HIST_BINS, HIST_BINS],
        HIST_RANGE,
    )
    cv2.normalize(hist, hist, alpha=1, beta=0, norm_type=cv2.NORM_L2)
    return hist.flatten()