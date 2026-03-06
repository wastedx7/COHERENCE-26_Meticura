from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List

import numpy as np
import pandas as pd


SEASONAL_WEIGHTS = np.array([0.7, 0.8, 0.9, 1.0, 1.0, 1.1, 1.0, 0.9, 1.0, 1.1, 1.2, 1.5])


@dataclass
class DepartmentProfile:
    dept_id: int
    archetype: str
    district_id: int
    base_budget: float


class SyntheticBudgetDataGenerator:
    """Generate reproducible synthetic spending data for model development."""

    def __init__(self, n_departments: int = 200, months: int = 24, seed: int = 42) -> None:
        self.n_departments = n_departments
        self.months = months
        self.seed = seed
        self.rng = np.random.default_rng(seed)
        self.start_date = datetime(2024, 1, 1)
        self.profiles = self._build_profiles()

    def _build_profiles(self) -> List[DepartmentProfile]:
        archetypes = (
            ["healthy"] * int(self.n_departments * 0.70)
            + ["slow_spender"] * int(self.n_departments * 0.15)
            + ["end_of_year_dumper"] * int(self.n_departments * 0.08)
            + ["burst_spender"] * (self.n_departments - int(self.n_departments * 0.70) - int(self.n_departments * 0.15) - int(self.n_departments * 0.08))
        )
        self.rng.shuffle(archetypes)

        profiles: List[DepartmentProfile] = []
        for i in range(self.n_departments):
            profiles.append(
                DepartmentProfile(
                    dept_id=i + 1,
                    archetype=archetypes[i],
                    district_id=(i % 20) + 1,
                    base_budget=float(self.rng.uniform(2_000_000, 15_000_000)),
                )
            )
        return profiles

    def _archetype_multiplier(self, archetype: str, day_of_year: int) -> float:
        if archetype == "healthy":
            return 1.0
        if archetype == "slow_spender":
            return 0.55 if day_of_year < 220 else 1.35
        if archetype == "end_of_year_dumper":
            return 0.45 if day_of_year < 300 else 2.7
        if archetype == "burst_spender":
            return 2.0 if day_of_year < 90 else 0.40
        return 1.0

    def generate_transactions(self) -> pd.DataFrame:
        rows: List[Dict] = []

        for profile in self.profiles:
            for m in range(self.months):
                month_start = self.start_date + pd.DateOffset(months=m)
                month_start = pd.Timestamp(month_start).to_pydatetime()
                fiscal_growth = 1.0 + (0.05 + self.rng.uniform(0.0, 0.07)) * (m // 12)
                month_factor = SEASONAL_WEIGHTS[month_start.month - 1]
                month_budget = (profile.base_budget * fiscal_growth) / 12.0
                tx_count = int(self.rng.integers(18, 52))

                for _ in range(tx_count):
                    day = int(self.rng.integers(0, 28))
                    tx_date = month_start + timedelta(days=day)
                    day_of_year = tx_date.timetuple().tm_yday
                    archetype_mult = self._archetype_multiplier(profile.archetype, day_of_year)

                    mean_amount = month_budget / max(tx_count, 1)
                    noise = float(self.rng.normal(0, mean_amount * 0.08))
                    base_amount = max(1000.0, mean_amount * month_factor * archetype_mult + noise)

                    if self.rng.uniform() < 0.03:
                        base_amount *= float(self.rng.uniform(2.0, 4.0))

                    rows.append(
                        {
                            "dept_id": profile.dept_id,
                            "district_id": profile.district_id,
                            "date": tx_date.date().isoformat(),
                            "amount": round(base_amount, 2),
                            "archetype": profile.archetype,
                            "fiscal_year": tx_date.year,
                            "category": self.rng.choice(["infra", "ops", "health", "education", "admin"]),
                        }
                    )

        return pd.DataFrame(rows).sort_values(["dept_id", "date"]).reset_index(drop=True)

    def generate_feature_vectors(self) -> pd.DataFrame:
        tx = self.generate_transactions()
        tx["date"] = pd.to_datetime(tx["date"])
        tx["month"] = tx["date"].dt.to_period("M").astype(str)

        grouped = tx.groupby(["dept_id", "month"], as_index=False).agg(
            total_spent=("amount", "sum"),
            transaction_count=("amount", "count"),
            avg_transaction_size=("amount", "mean"),
            daily_variance=("amount", "std"),
            last_txn=("date", "max"),
        )

        grouped["daily_variance"] = grouped["daily_variance"].fillna(0.0)
        grouped["days_since_last_txn"] = (pd.Timestamp(datetime.utcnow().date()) - grouped["last_txn"]).dt.days

        allocation_map = {p.dept_id: p.base_budget * 1.08 for p in self.profiles}
        grouped["allocation"] = grouped["dept_id"].map(allocation_map)
        grouped["utilization_pct"] = (grouped["total_spent"] / grouped["allocation"] * 100).clip(lower=0)
        grouped["budget_remaining_ratio"] = ((grouped["allocation"] - grouped["total_spent"]).clip(lower=0) / grouped["allocation"]).clip(0, 1)
        grouped["days_into_fiscal_year"] = 180
        grouped["spend_velocity"] = grouped["total_spent"] / grouped["days_into_fiscal_year"]
        grouped["end_period_spike_ratio"] = np.where(grouped["month"].str.endswith("-12"), 0.45, 0.12)

        return grouped[
            [
                "dept_id",
                "month",
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
        ].reset_index(drop=True)

    def generate_anomaly_labels(self) -> pd.Series:
        df = self.generate_feature_vectors()
        labels = (
            (df["end_period_spike_ratio"] > 0.40)
            | ((df["utilization_pct"] < 45) & (df["days_since_last_txn"] > 60))
            | ((df["transaction_count"] > 100) & (df["avg_transaction_size"] < 5000))
        )
        return labels.astype(int)
