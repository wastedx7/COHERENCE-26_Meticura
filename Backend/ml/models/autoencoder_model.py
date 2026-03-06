from __future__ import annotations

import numpy as np
from sklearn.neural_network import MLPRegressor


class AutoencoderModel:
    """Lightweight autoencoder approximation using MLPRegressor."""

    def __init__(self) -> None:
        self.model = MLPRegressor(
            hidden_layer_sizes=(16, 8, 4, 8, 16),
            activation="relu",
            random_state=42,
            max_iter=400,
        )

    def fit(self, X: np.ndarray) -> "AutoencoderModel":
        self.model.fit(X, X)
        return self

    def score(self, X: np.ndarray) -> np.ndarray:
        reconstructed = self.model.predict(X)
        return ((X - reconstructed) ** 2).mean(axis=1)
