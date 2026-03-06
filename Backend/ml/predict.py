from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd
from joblib import load

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
    parser = argparse.ArgumentParser(description="Score features using trained Isolation Forest")
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
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path(__file__).resolve().parent / "output" / "scored_features.csv",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    df = pd.read_csv(args.features_file)
    model = load(args.artifacts_dir / "model.pkl")
    scaler = load(args.artifacts_dir / "scaler.pkl")

    X = df[FEATURE_COLUMNS].copy()
    X_scaled = scaler.transform(X)

    df["anomaly_score"] = model.score_samples(X_scaled)
    df["outlier_flag"] = model.predict(X_scaled)
    df["is_anomaly"] = (df["outlier_flag"] == -1).astype(int)

    args.output_file.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output_file, index=False)

    print("Prediction complete")
    print(f"rows: {len(df)}")
    print(f"anomaly_rows: {int(df['is_anomaly'].sum())}")
    print(f"output_file: {args.output_file}")


if __name__ == "__main__":
    main()
