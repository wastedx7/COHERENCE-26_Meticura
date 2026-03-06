from __future__ import annotations

from typing import Dict, Tuple


DEFAULT_WEIGHTS = {
    "isolation_forest": 0.30,
    "lof": 0.20,
    "ocsvm": 0.15,
    "autoencoder": 0.20,
    "dbscan": 0.10,
    "elliptic_envelope": 0.05,
}


def calculate_ensemble_score(model_scores: Dict[str, float], weights: Dict[str, float] | None = None) -> float:
    effective_weights = weights or DEFAULT_WEIGHTS
    total = 0.0
    used_weight = 0.0

    for model_name, weight in effective_weights.items():
        if model_name in model_scores:
            total += float(model_scores[model_name]) * float(weight)
            used_weight += float(weight)

    if used_weight == 0:
        return 0.0
    return total / used_weight


def deduplicate_decision(rule_triggered: bool, ensemble_score: float, threshold: float = 0.5) -> Tuple[bool, str]:
    if rule_triggered:
        return True, "RULE_BASED"
    if ensemble_score > threshold:
        return True, "ML_DETECTED"
    return False, "NONE"
