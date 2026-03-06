from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd


@dataclass
class FiscalWindow:
    start: date
    end: date


def get_fiscal_window(fiscal_year: int) -> FiscalWindow:
    # FY: Apr 1 (fiscal_year) -> Mar 31 (fiscal_year + 1)
    return FiscalWindow(start=date(fiscal_year, 4, 1), end=date(fiscal_year + 1, 3, 31))


def days_into_fiscal_year(as_of: date, fiscal_year: int) -> int:
    window = get_fiscal_window(fiscal_year)
    if as_of < window.start:
        return 0
    if as_of > window.end:
        return (window.end - window.start).days + 1
    return (as_of - window.start).days + 1


def _safe_div(a: float, b: float) -> float:
    return float(a / b) if b else 0.0


def build_feature_vector(
    dept_id: int,
    fiscal_year: int,
    allocations_df: pd.DataFrame,
    transactions_df: pd.DataFrame,
    as_of: date,
) -> dict:
    allocation_rows = allocations_df[
        (allocations_df["dept_id"] == dept_id)
        & (allocations_df["fiscal_year"] == fiscal_year)
    ]

    if allocation_rows.empty:
        raise ValueError(f"No allocation found for dept_id={dept_id}, fiscal_year={fiscal_year}")

    allocated = float(allocation_rows.iloc[0]["total_amount"])

    # transactions_df is already pre-filtered by fiscal window in build_feature_frame
    # Just filter by dept_id
    txns = transactions_df[transactions_df["dept_id"] == dept_id].sort_values("date")

    days_elapsed = max(days_into_fiscal_year(as_of, fiscal_year), 1)
    tx_count = int(len(txns))
    total_spent = float(txns["amount"].sum()) if tx_count else 0.0
    utilization_pct = _safe_div(total_spent * 100.0, allocated)
    spend_velocity = _safe_div(total_spent, days_elapsed)
    budget_remaining_ratio = _safe_div(max(allocated - total_spent, 0.0), allocated)
    avg_txn_size = _safe_div(total_spent, tx_count)

    if tx_count:
        last_txn_date = txns["date"].max()
        days_since_last_txn = (as_of - last_txn_date).days
    else:
        days_since_last_txn = days_elapsed

    if tx_count:
        daily_spend = (
            txns.groupby("date", as_index=False)["amount"].sum()["amount"].astype(float)
        )
        daily_variance = float(np.var(daily_spend))
    else:
        daily_variance = 0.0

    window = get_fiscal_window(fiscal_year)
    period_end = window.end
    period_start_date = period_end - timedelta(days=29)

    end_period_spend = float(
        txns[(txns["date"] >= period_start_date) & (txns["date"] <= period_end)]["amount"].sum()
    )
    end_period_spike_ratio = _safe_div(end_period_spend, total_spent)

    return {
        "dept_id": dept_id,
        "fiscal_year": fiscal_year,
        "spend_velocity": round(spend_velocity, 6),
        "utilization_pct": round(utilization_pct, 6),
        "days_since_last_txn": int(days_since_last_txn),
        "daily_variance": round(daily_variance, 6),
        "end_period_spike_ratio": round(end_period_spike_ratio, 6),
        "transaction_count": tx_count,
        "avg_transaction_size": round(avg_txn_size, 6),
        "budget_remaining_ratio": round(budget_remaining_ratio, 6),
        "days_into_fiscal_year": days_elapsed,
    }


def build_feature_frame(
    allocations_df: pd.DataFrame,
    transactions_df: pd.DataFrame,
    fiscal_year: int,
    as_of: date,
) -> pd.DataFrame:
    # Pre-convert dates once for performance
    txns = transactions_df.copy()
    txns["date"] = pd.to_datetime(txns["date"]).dt.date
    
    # Filter fiscal year window once
    window = get_fiscal_window(fiscal_year)
    txns = txns[(txns["date"] >= window.start) & (txns["date"] <= as_of)]
    
    dept_ids = sorted(allocations_df[allocations_df["fiscal_year"] == fiscal_year]["dept_id"].unique())
    rows = [
        build_feature_vector(
            dept_id=int(dept_id),
            fiscal_year=fiscal_year,
            allocations_df=allocations_df,
            transactions_df=txns,  # Pass pre-filtered dataframe
            as_of=as_of,
        )
        for dept_id in dept_ids
    ]
    return pd.DataFrame(rows)


def load_generated_data(output_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame]:
    allocations = pd.read_csv(output_dir / "budget_allocations.csv")
    transactions = pd.read_csv(output_dir / "transactions.csv")
    return allocations, transactions
