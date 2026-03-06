from __future__ import annotations

import numpy as np
from sklearn.covariance import EllipticEnvelope


class EllipticEnvelopeModel:
    def __init__(self, contamination: float = 0.09) -> None:
        self.model = EllipticEnvelope(contamination=contamination, random_state=42)

    def fit(self, X: np.ndarray) -> "EllipticEnvelopeModel":
        self.model.fit(X)
        return self

    def score(self, X: np.ndarray) -> np.ndarray:
        return -self.model.decision_function(X)
