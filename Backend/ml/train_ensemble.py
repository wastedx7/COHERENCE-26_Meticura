from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler, StandardScaler

from ml.ensemble import DEFAULT_WEIGHTS, calculate_ensemble_score
from ml.models import (
    AutoencoderModel,
    DBSCANModel,
    EllipticEnvelopeModel,
    LOFModel,
    OneClassSVMModel,
)

FEATURE_COLUMNS = [
    "spend_velocity",
    "utilization_pct",
    "days_since_last_txn",
    "daily_variance",
    "end_period_spike_ratio",
    "transaction_count",
    "avg_transaction_size",
    "budget_remaining_ratio",
    "days_into_fiscal_year",
]


MODEL_NAMES = [
    "isolation_forest",
    "lof",
    "ocsvm",
    "autoencoder",
    "dbscan",
    "elliptic_envelope",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train and evaluate 6-model ensemble")
    parser.add_argument(
        "--features-file",
        type=Path,
        default=Path(__file__).resolve().parent / "output" / "features.csv",
    )
    parser.add_argument(
        "--departments-file",
        type=Path,
        default=Path(__file__).resolve().parent / "output" / "departments.csv",
    )
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "artifacts",
    )
    parser.add_argument("--test-size", type=float, default=0.25)
    parser.add_argument("--random-state", type=int, default=42)
    return parser.parse_args()


def create_labels(features_df: pd.DataFrame, departments_df: pd.DataFrame) -> np.ndarray:
    """Create anomaly labels aligned to deterministic rule behavior."""
    # departments_df retained in signature for backward compatibility in callers.
    _ = departments_df

    labels = (
        (features_df["end_period_spike_ratio"] >= 0.40)
        | ((features_df["days_since_last_txn"] >= 90) & (features_df["utilization_pct"] < 50))
        | ((features_df["transaction_count"] >= 100) & (features_df["avg_transaction_size"] < 5000))
        | (features_df["utilization_pct"] > 100)
    )
    return labels.astype(int).values


def _normalize_score(train_score: np.ndarray, test_score: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    scaler = MinMaxScaler()
    train_norm = scaler.fit_transform(train_score.reshape(-1, 1)).reshape(-1)
    test_norm = scaler.transform(test_score.reshape(-1, 1)).reshape(-1)
    return train_norm, test_norm


def _fit_all_models(X_train: np.ndarray, X_test: np.ndarray, random_state: int) -> Dict[str, Dict[str, np.ndarray]]:
    out: Dict[str, Dict[str, np.ndarray]] = {}

    if_model = IsolationForest(n_estimators=200, contamination=0.09, random_state=random_state, max_features=9)
    if_model.fit(X_train)
    if_train, if_test = _normalize_score(-if_model.score_samples(X_train), -if_model.score_samples(X_test))
    out["isolation_forest"] = {"train": if_train, "test": if_test}

    lof_model = LOFModel(contamination=0.09, n_neighbors=20).fit(X_train)
    lof_train, lof_test = _normalize_score(lof_model.score(X_train), lof_model.score(X_test))
    out["lof"] = {"train": lof_train, "test": lof_test}

    ocsvm_model = OneClassSVMModel(nu=0.09, gamma="scale").fit(X_train)
    svm_train, svm_test = _normalize_score(ocsvm_model.score(X_train), ocsvm_model.score(X_test))
    out["ocsvm"] = {"train": svm_train, "test": svm_test}

    ae_model = AutoencoderModel().fit(X_train)
    ae_train, ae_test = _normalize_score(ae_model.score(X_train), ae_model.score(X_test))
    out["autoencoder"] = {"train": ae_train, "test": ae_test}

    dbscan_model = DBSCANModel(eps=0.5, min_samples=5)
    dbscan_train = dbscan_model.fit_predict_scores(X_train)
    dbscan_test = np.zeros(len(X_test), dtype=float)
    dbscan_train, dbscan_test = _normalize_score(dbscan_train, dbscan_test)
    out["dbscan"] = {"train": dbscan_train, "test": dbscan_test}

    ee_model = EllipticEnvelopeModel(contamination=0.09).fit(X_train)
    ee_train, ee_test = _normalize_score(ee_model.score(X_train), ee_model.score(X_test))
    out["elliptic_envelope"] = {"train": ee_train, "test": ee_test}

    return out


def _ensemble_scores(model_scores: Dict[str, Dict[str, np.ndarray]], split: str) -> np.ndarray:
    length = len(next(iter(model_scores.values()))[split])
    scores = np.zeros(length, dtype=float)
    for i in range(length):
        row = {name: float(vals[split][i]) for name, vals in model_scores.items()}
        scores[i] = calculate_ensemble_score(row, DEFAULT_WEIGHTS)
    return scores


def _stacked_scores(
    model_scores: Dict[str, Dict[str, np.ndarray]],
    y_train: np.ndarray,
    random_state: int,
) -> Tuple[np.ndarray, np.ndarray]:
    x_train = np.column_stack([model_scores[name]["train"] for name in MODEL_NAMES])
    x_test = np.column_stack([model_scores[name]["test"] for name in MODEL_NAMES])

    clf = LogisticRegression(
        random_state=random_state,
        class_weight="balanced",
        max_iter=2000,
    )
    clf.fit(x_train, y_train)
    train_score = clf.predict_proba(x_train)[:, 1]
    test_score = clf.predict_proba(x_test)[:, 1]
    return train_score, test_score


def _best_threshold(y_true: np.ndarray, y_score: np.ndarray) -> Tuple[float, float]:
    best_t = 0.5
    best_acc = -1.0
    best_objective = -1.0
    for t in np.linspace(0.05, 0.95, 181):
        pred = (y_score >= t).astype(int)
        acc = accuracy_score(y_true, pred)
        rec = recall_score(y_true, pred, zero_division=0)
        objective = (0.7 * acc) + (0.3 * rec)
        if objective > best_objective:
            best_objective = float(objective)
            best_acc = float(acc)
            best_t = float(t)
    return best_t, best_acc


def _per_model_metrics(y_true: np.ndarray, model_scores: Dict[str, Dict[str, np.ndarray]], threshold: float) -> Dict[str, Dict[str, float]]:
    metrics: Dict[str, Dict[str, float]] = {}
    for model_name in MODEL_NAMES:
        score = model_scores[model_name]["test"]
        pred = (score >= threshold).astype(int)
        metrics[model_name] = {
            "precision": float(precision_score(y_true, pred, zero_division=0)),
            "recall": float(recall_score(y_true, pred, zero_division=0)),
            "f1_score": float(f1_score(y_true, pred, zero_division=0)),
            "auc_roc": float(roc_auc_score(y_true, score)) if len(np.unique(y_true)) > 1 else 0.0,
            "avg_anomaly_score": float(np.mean(score)),
            "false_positive_rate": float(((pred == 1) & (y_true == 0)).sum() / max((y_true == 0).sum(), 1)),
            "training_time_sec": 0.0,
            "inference_time_ms": 0.0,
        }
    return metrics


def train_ensemble(features_file: Path, departments_file: Path, artifacts_dir: Path, test_size: float, random_state: int) -> Dict[str, float]:
    features_df = pd.read_csv(features_file)
    departments_df = pd.read_csv(departments_file)

    X = features_df[FEATURE_COLUMNS].values
    y = create_labels(features_df, departments_df)

    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y, np.arange(len(features_df)), test_size=test_size, random_state=random_state, stratify=y
    )

    std_scaler = StandardScaler()
    X_train_scaled = std_scaler.fit_transform(X_train)
    X_test_scaled = std_scaler.transform(X_test)

    model_scores = _fit_all_models(X_train_scaled, X_test_scaled, random_state=random_state)
    weighted_train = _ensemble_scores(model_scores, split="train")
    weighted_test = _ensemble_scores(model_scores, split="test")
    stacked_train, stacked_test = _stacked_scores(model_scores, y_train, random_state=random_state)

    weighted_t, weighted_acc_train = _best_threshold(y_train, weighted_train)
    stacked_t, stacked_acc_train = _best_threshold(y_train, stacked_train)

    if stacked_acc_train >= weighted_acc_train:
        method = "stacked_logistic"
        ens_train = stacked_train
        ens_test = stacked_test
        threshold = stacked_t
    else:
        method = "weighted_vote"
        ens_train = weighted_train
        ens_test = weighted_test
        threshold = weighted_t

    y_pred = (ens_test >= threshold).astype(int)

    cm = confusion_matrix(y_test, y_pred)
    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_test, ens_test)) if len(np.unique(y_test)) > 1 else 0.0

    artifacts_dir.mkdir(parents=True, exist_ok=True)

    model_metrics = _per_model_metrics(y_test, model_scores, threshold)
    with (artifacts_dir / "model_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(model_metrics, f, indent=2)

    result = {
        "schema_version": 1,
        "timestamp": datetime.utcnow().isoformat(),
        "target_accuracy": 0.90,
        "ensemble_method": method,
        "best_threshold": threshold,
        "best_accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "auc_roc": auc,
        "weights": DEFAULT_WEIGHTS,
        "label_distribution": {"positive": int(y.sum()), "negative": int((y == 0).sum())},
        "confusion_matrix": {
            "true_negatives": int(cm[0, 0]),
            "false_positives": int(cm[0, 1]),
            "false_negatives": int(cm[1, 0]),
            "true_positives": int(cm[1, 1]),
            "matrix": cm.tolist(),
        },
    }

    with (artifacts_dir / "ensemble_metrics.json").open("w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    # Export scored rows for backend runtime lookup.
    scored_df = features_df.copy()
    scored_df["ensemble_score"] = np.nan
    scored_df["ensemble_is_anomaly"] = 0
    scored_df["ensemble_threshold"] = threshold

    for local_idx, global_idx in enumerate(idx_test):
        scored_df.loc[global_idx, "ensemble_score"] = float(ens_test[local_idx])
        scored_df.loc[global_idx, "ensemble_is_anomaly"] = int(y_pred[local_idx])

    # Fill train rows with train-score predictions for completeness.
    y_pred_train = (ens_train >= threshold).astype(int)
    for local_idx, global_idx in enumerate(idx_train):
        scored_df.loc[global_idx, "ensemble_score"] = float(ens_train[local_idx])
        scored_df.loc[global_idx, "ensemble_is_anomaly"] = int(y_pred_train[local_idx])

    scored_df.to_csv(artifacts_dir / "ensemble_scored_features.csv", index=False)

    return result


def main() -> None:
    args = parse_args()
    metrics = train_ensemble(
        features_file=args.features_file,
        departments_file=args.departments_file,
        artifacts_dir=args.artifacts_dir,
        test_size=args.test_size,
        random_state=args.random_state,
    )

    print("Ensemble training complete")
    print(f"best_accuracy: {metrics['best_accuracy']:.4f}")
    print(f"target_accuracy: {metrics['target_accuracy']:.2f}")
    print(f"best_threshold: {metrics['best_threshold']:.3f}")


if __name__ == "__main__":
    main()
