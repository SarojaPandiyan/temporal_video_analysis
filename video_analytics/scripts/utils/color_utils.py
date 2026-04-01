import cv2
import numpy as np
from sklearn.cluster import KMeans

# Stable CSS color palette
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


def closest_color_name(rgb):
    """Return the CSS color name closest to the given RGB tuple."""
    min_dist = float("inf")
    closest_name = "unknown"
    rgb_arr = np.array(rgb)
    for name, value in CSS_COLORS.items():
        dist = np.sum((np.array(value) - rgb_arr) ** 2)
        if dist < min_dist:
            min_dist = dist
            closest_name = name
    return closest_name


def detect_color(frame, bbox, k=3):
    """
    Detect the dominant color inside a bounding box.

    Picks the cluster with the most pixels (by label count),
    not just cluster index 0, so the result reflects the actual
    dominant colour rather than an arbitrary centroid ordering.
    """
    x1, y1, x2, y2 = map(int, bbox)
    crop = frame[y1:y2, x1:x2]

    if crop.size == 0:
        return "unknown"

    crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    pixels = crop_rgb.reshape(-1, 3)

    # Speed optimisation: subsample on CPU
    if len(pixels) > 2000:
        idx = np.random.choice(len(pixels), 2000, replace=False)
        pixels = pixels[idx]

    kmeans = KMeans(n_clusters=k, n_init=10, random_state=0)
    kmeans.fit(pixels)

    # Find the centroid that owns the most pixels
    counts = np.bincount(kmeans.labels_)
    dominant_idx = counts.argmax()
    dominant_color = kmeans.cluster_centers_[dominant_idx].astype(int)

    return closest_color_name(dominant_color)