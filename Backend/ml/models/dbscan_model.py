from __future__ import annotations

import numpy as np
from sklearn.cluster import DBSCAN


class DBSCANModel:
    def __init__(self, eps: float = 0.5, min_samples: int = 5) -> None:
        self.model = DBSCAN(eps=eps, min_samples=min_samples, metric="euclidean")

    def fit_predict_scores(self, X: np.ndarray) -> np.ndarray:
        labels = self.model.fit_predict(X)
        return (labels == -1).astype(float)
