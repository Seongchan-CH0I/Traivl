import math
import numpy as np
from sklearn.cluster import KMeans
from typing import List, Dict, Any

# Draft logic for clustering and time allocation
def draft_pipeline(candidates, days):
    # 1. Time allocation
    for c in candidates:
        if c.category == '박물관':
            c.stay_duration_mins = 120
        elif c.category == '카페':
            c.stay_duration_mins = 60
        else:
            c.stay_duration_mins = 90
            
    # 2. Clustering
    coords = np.array([[c.lat, c.lng] for c in candidates])
    kmeans = KMeans(n_clusters=days, random_state=42, n_init=10)
    labels = kmeans.fit_predict(coords)
    
    clusters = {i: [] for i in range(days)}
    for i, label in enumerate(labels):
        clusters[label].append(candidates[i])
        
    return clusters
