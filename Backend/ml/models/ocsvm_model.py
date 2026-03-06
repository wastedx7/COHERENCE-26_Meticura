from __future__ import annotations

import numpy as np
from sklearn.svm import OneClassSVM


class OneClassSVMModel:
    def __init__(self, nu: float = 0.09, gamma: str = "scale") -> None:
        self.model = OneClassSVM(kernel="rbf", nu=nu, gamma=gamma)

    def fit(self, X: np.ndarray) -> "OneClassSVMModel":
        self.model.fit(X)
        return self

    def score(self, X: np.ndarray) -> np.ndarray:
        return -self.model.decision_function(X)
