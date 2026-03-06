from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from joblib import dump
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import StandardScaler

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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Isolation Forest with evaluation metrics")
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
    parser.add_argument("--contamination", type=float, default=0.09)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--n-estimators", type=int, default=300)
    return parser.parse_args()


def backup_existing_model(artifacts_dir: Path) -> None:
    model_path = artifacts_dir / "model.pkl"
    backup_path = artifacts_dir / "model_backup.pkl"
    if model_path.exists():
        backup_path.write_bytes(model_path.read_bytes())


def create_ground_truth_labels(departments_df: pd.DataFrame, features_df: pd.DataFrame) -> np.ndarray:
    """Use archetypes as ground truth: non-healthy archetypes are 'anomalous'"""
    merged = features_df.merge(departments_df[["id", "archetype"]], left_on="dept_id", right_on="id")
    # Consider slow_spender, year_end_dumper, burst_spender as anomalous
    ground_truth = merged["archetype"].isin(["slow_spender", "year_end_dumper", "burst_spender"])
    return ground_truth.astype(int).values


def main() -> None:
    args = parse_args()
    args.artifacts_dir.mkdir(parents=True, exist_ok=True)

    features_df = pd.read_csv(args.features_file)
    departments_df = pd.read_csv(args.departments_file)
    
    X = features_df[FEATURE_COLUMNS].copy()

    # Create ground truth labels for evaluation
    y_true = create_ground_truth_labels(departments_df, features_df)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=args.n_estimators,
        contamination=args.contamination,
        random_state=args.random_state,
    )
    model.fit(X_scaled)

    # Get predictions
    raw_scores = model.score_samples(X_scaled)
    outlier_flags = model.predict(X_scaled)
    y_pred = (outlier_flags == -1).astype(int)

    # Calculate metrics
    cm = confusion_matrix(y_true, y_pred)
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    # Classification report as dict
    class_report = classification_report(
        y_true, y_pred, target_names=["healthy", "anomalous"], output_dict=True, zero_division=0
    )

    # Build evaluation metrics dictionary
    evaluation_metrics = {
        "model_type": "IsolationForest",
        "n_estimators": args.n_estimators,
        "contamination": args.contamination,
        "random_state": args.random_state,
        "training_samples": int(len(features_df)),
        "features_count": len(FEATURE_COLUMNS),
        "feature_names": FEATURE_COLUMNS,
        "confusion_matrix": {
            "true_negatives": int(cm[0, 0]),
            "false_positives": int(cm[0, 1]),
            "false_negatives": int(cm[1, 0]),
            "true_positives": int(cm[1, 1]),
            "matrix": cm.tolist(),
        },
        "metrics": {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
        },
        "score_statistics": {
            "min_score": float(raw_scores.min()),
            "max_score": float(raw_scores.max()),
            "mean_score": float(raw_scores.mean()),
            "std_score": float(raw_scores.std()),
        },
        "prediction_distribution": {
            "predicted_anomalies": int(y_pred.sum()),
            "predicted_healthy": int((y_pred == 0).sum()),
            "true_anomalies": int(y_true.sum()),
            "true_healthy": int((y_true == 0).sum()),
        },
        "classification_report": class_report,
    }

    # Save artifacts
    backup_existing_model(args.artifacts_dir)
    dump(model, args.artifacts_dir / "model.pkl")
    dump(scaler, args.artifacts_dir / "scaler.pkl")

    # Save evaluation metrics
    metrics_path = args.artifacts_dir / "evaluation_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(evaluation_metrics, f, indent=2)

    # Print summary
    print("Model training and evaluation complete")
    print(f"training_samples: {len(features_df)}")
    print(f"features: {len(FEATURE_COLUMNS)}")
    print(f"contamination: {args.contamination}")
    print(f"\nConfusion Matrix:")
    print(f"  TN: {cm[0, 0]:4d}  FP: {cm[0, 1]:4d}")
    print(f"  FN: {cm[1, 0]:4d}  TP: {cm[1, 1]:4d}")
    print(f"\nMetrics:")
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1-Score:  {f1:.4f}")
    print(f"\nEvaluation saved to: {metrics_path}")


if __name__ == "__main__":
    main()
