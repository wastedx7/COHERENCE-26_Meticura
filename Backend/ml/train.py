from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd
from joblib import dump
from sklearn.ensemble import IsolationForest
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
    parser = argparse.ArgumentParser(description="Train Isolation Forest on feature vectors")
    parser.add_argument(
        "--features-file",
        type=Path,
        default=Path(__file__).resolve().parent / "output" / "features.csv",
    )
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "artifacts",
    )
    parser.add_argument("--contamination", type=float, default=0.09)
    parser.add_argument("--random-state", type=int, default=42)
    parser.add_argument("--n-estimators", type=int, default=200)
    return parser.parse_args()


def backup_existing_model(artifacts_dir: Path) -> None:
    model_path = artifacts_dir / "model.pkl"
    backup_path = artifacts_dir / "model_backup.pkl"
    if model_path.exists():
        backup_path.write_bytes(model_path.read_bytes())


def train_anomaly_model(
    features_file: Path | None = None,
    artifacts_dir: Path | None = None,
    contamination: float = 0.09,
    random_state: int = 42,
    n_estimators: int = 200,
) -> dict:
    features_file = features_file or (Path(__file__).resolve().parent / "output" / "features.csv")
    artifacts_dir = artifacts_dir or (Path(__file__).resolve().parent / "artifacts")
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(features_file)
    X = df[FEATURE_COLUMNS].copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=n_estimators,
        contamination=contamination,
        random_state=random_state,
        max_features=len(FEATURE_COLUMNS),
    )
    model.fit(X_scaled)

    backup_existing_model(artifacts_dir)
    dump(model, artifacts_dir / "model.pkl")
    dump(scaler, artifacts_dir / "scaler.pkl")

    raw_scores = model.score_samples(X_scaled)
    outlier_flags = model.predict(X_scaled)
    anomaly_count = int((outlier_flags == -1).sum())

    return {
        "rows": int(len(df)),
        "features": int(len(FEATURE_COLUMNS)),
        "contamination": float(contamination),
        "detected_outliers_on_train": anomaly_count,
        "min_score": float(raw_scores.min()),
        "max_score": float(raw_scores.max()),
        "accuracy": float(1.0 - anomaly_count / max(len(df), 1)),
    }


def main() -> None:
    args = parse_args()
    metrics = train_anomaly_model(
        features_file=args.features_file,
        artifacts_dir=args.artifacts_dir,
        contamination=args.contamination,
        random_state=args.random_state,
        n_estimators=args.n_estimators,
    )

    print("Model training complete")
    print(f"rows: {metrics['rows']}")
    print(f"features: {metrics['features']}")
    print(f"contamination: {metrics['contamination']}")
    print(f"detected_outliers_on_train: {metrics['detected_outliers_on_train']}")
    print(f"min_score: {metrics['min_score']:.6f}")
    print(f"max_score: {metrics['max_score']:.6f}")


if __name__ == "__main__":
    main()
