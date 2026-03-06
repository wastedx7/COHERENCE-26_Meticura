from __future__ import annotations

import numpy as np
from sklearn.neighbors import LocalOutlierFactor


class LOFModel:
    def __init__(self, contamination: float = 0.09, n_neighbors: int = 20) -> None:
        self.model = LocalOutlierFactor(
            n_neighbors=n_neighbors,
            contamination=contamination,
            novelty=True,
        )

    def fit(self, X: np.ndarray) -> "LOFModel":
        self.model.fit(X)
        return self

    def score(self, X: np.ndarray) -> np.ndarray:
        return -self.model.decision_function(X)
