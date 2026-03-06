from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List


ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "ml" / "artifacts"
ACTIVE_MODEL_FILE = ARTIFACTS_DIR / "active_model.json"

MODEL_NAMES = [
    "isolation_forest",
    "lof",
    "ocsvm",
    "autoencoder",
    "dbscan",
    "elliptic_envelope",
]


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _default_metrics() -> Dict[str, float]:
    return {
        "precision": 0.0,
        "recall": 0.0,
        "f1_score": 0.0,
        "auc_roc": 0.0,
        "avg_anomaly_score": 0.0,
        "false_positive_rate": 0.0,
        "training_time_sec": 0.0,
        "inference_time_ms": 0.0,
    }


def _build_metrics_from_artifacts() -> Dict[str, Dict[str, Any]]:
    model_metrics = _read_json(ARTIFACTS_DIR / "model_metrics.json", {})
    if model_metrics:
        per_model: Dict[str, Dict[str, Any]] = {}
        for model_name in MODEL_NAMES:
            vals = dict(_default_metrics())
            vals.update(model_metrics.get(model_name, {}))
            per_model[model_name] = vals
        return per_model

    # Fallback to historical IF-only artifact contract.
    eval_metrics = _read_json(ARTIFACTS_DIR / "evaluation_metrics.json", {})
    metrics = eval_metrics.get("metrics", {})
    shared = _default_metrics()
    shared.update(
        {
            "precision": float(metrics.get("precision", 0.0)),
            "recall": float(metrics.get("recall", 0.0)),
            "f1_score": float(metrics.get("f1_score", 0.0)),
            "auc_roc": float(eval_metrics.get("auc_roc", 0.0)),
        }
    )

    per_model = {model_name: dict(shared) for model_name in MODEL_NAMES}
    return per_model


def get_metrics() -> List[Dict[str, Any]]:
    per_model = _build_metrics_from_artifacts()
    return [{"model_name": k, **v} for k, v in per_model.items()]


def get_metric(model_name: str) -> Dict[str, Any]:
    per_model = _build_metrics_from_artifacts()
    if model_name not in per_model:
        raise KeyError(model_name)

    metric = per_model[model_name]
    ensemble = _read_json(ARTIFACTS_DIR / "ensemble_metrics.json", {})
    cm = ensemble.get("confusion_matrix", {})

    return {
        "model_name": model_name,
        **metric,
        "confusion_matrix": {
            "tp": int(cm.get("true_positives", 0)),
            "fp": int(cm.get("false_positives", 0)),
            "tn": int(cm.get("true_negatives", 0)),
            "fn": int(cm.get("false_negatives", 0)),
        },
        "roc_curve_data": [
            {"fpr": 0.0, "tpr": 0.0},
            {"fpr": 0.2, "tpr": min(1.0, metric["recall"] + 0.1)},
            {"fpr": 0.5, "tpr": min(1.0, metric["recall"] + 0.2)},
            {"fpr": 1.0, "tpr": 1.0},
        ],
        "score_distribution": {
            "normal": [0.05, 0.1, 0.15, 0.2, 0.25],
            "anomaly": [0.55, 0.62, 0.71, 0.84, 0.93],
        },
    }


def get_history() -> List[Dict[str, Any]]:
    metrics = get_metrics()
    now = datetime.utcnow().isoformat()
    history: List[Dict[str, Any]] = []
    for m in metrics:
        history.append(
            {
                "run_id": f"run-{m['model_name']}",
                "run_date": now,
                "model_name": m["model_name"],
                "f1_score": m["f1_score"],
                "auc_roc": m["auc_roc"],
            }
        )
    return history


def get_active_model() -> Dict[str, Any]:
    data = _read_json(ACTIVE_MODEL_FILE, {})
    if not data:
        return {
            "model_name": "isolation_forest",
            "set_at": datetime.utcnow().isoformat(),
            "set_by_user_id": "system",
        }
    return data


def set_active_model(model_name: str, user_id: str) -> Dict[str, Any]:
    if model_name not in MODEL_NAMES:
        raise ValueError(f"Unsupported model_name: {model_name}")

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "model_name": model_name,
        "set_at": datetime.utcnow().isoformat(),
        "set_by_user_id": user_id,
    }
    with ACTIVE_MODEL_FILE.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    return payload
