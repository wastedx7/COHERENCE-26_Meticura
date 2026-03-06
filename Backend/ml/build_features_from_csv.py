from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from ml.feature_engineering import build_feature_frame, load_generated_data


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build feature vectors from generated CSV data")
    parser.add_argument("--fiscal-year", type=int, default=2024)
    parser.add_argument("--as-of", type=str, default="2025-03-31")
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "output",
    )
    parser.add_argument(
        "--output-file",
        type=Path,
        default=Path(__file__).resolve().parent / "output" / "features.csv",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    as_of = date.fromisoformat(args.as_of)

    allocations_df, transactions_df = load_generated_data(args.input_dir)
    features_df = build_feature_frame(
        allocations_df=allocations_df,
        transactions_df=transactions_df,
        fiscal_year=args.fiscal_year,
        as_of=as_of,
    )
    features_df.to_csv(args.output_file, index=False)

    print("Feature generation complete")
    print(f"rows: {len(features_df)}")
    print(f"output_file: {args.output_file}")


if __name__ == "__main__":
    main()
