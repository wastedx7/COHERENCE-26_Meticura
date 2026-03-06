from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Literal

import numpy as np
import pandas as pd
from faker import Faker

Archetype = Literal["healthy", "slow_spender", "year_end_dumper", "burst_spender"]

CATEGORIES = [
    "Roads",
    "Health",
    "Education",
    "Water",
    "Social Welfare",
    "Agriculture",
]

DISTRICTS = [
    "Northfield",
    "Riverbend",
    "Lakemont",
    "Greenvale",
    "Ashbury",
    "Hillcrest",
    "Meadowpark",
    "Stonebridge",
    "Willowdale",
    "Cedarpoint",
]

ARCHETYPE_WEIGHTS = {
    "healthy": 0.70,
    "slow_spender": 0.15,
    "year_end_dumper": 0.08,
    "burst_spender": 0.07,
}


@dataclass
class DepartmentRecord:
    dept_id: int
    name: str
    district: str
    category: str
    archetype: Archetype


@dataclass
class FiscalWindow:
    start: date
    end: date


def get_fiscal_window(fiscal_year: int) -> FiscalWindow:
    # Fiscal year is Apr 1 to Mar 31
    return FiscalWindow(start=date(fiscal_year, 4, 1), end=date(fiscal_year + 1, 3, 31))


def weighted_choice(rng: np.random.Generator) -> Archetype:
    keys = list(ARCHETYPE_WEIGHTS.keys())
    probs = [ARCHETYPE_WEIGHTS[k] for k in keys]
    return rng.choice(keys, p=probs).item()


def random_allocation(rng: np.random.Generator) -> float:
    # INR 0.8 Cr to 10 Cr in rupee units
    return float(rng.uniform(8_000_000, 100_000_000))


def monthly_weights(archetype: Archetype) -> np.ndarray:
    if archetype == "healthy":
        weights = np.array([1.0] * 12)
    elif archetype == "slow_spender":
        weights = np.array([0.2, 0.4, 0.5, 0.6, 0.75, 0.85, 1.0, 1.15, 1.2, 1.3, 1.4, 1.55])
    elif archetype == "year_end_dumper":
        weights = np.array([0.45] * 10 + [2.9, 3.2])
    else:
        weights = np.array([2.9, 2.6, 2.2, 1.3, 0.8, 0.6, 0.45, 0.4, 0.35, 0.25, 0.2, 0.2])

    return weights / weights.sum()


def utilization_target(archetype: Archetype, rng: np.random.Generator) -> float:
    if archetype == "healthy":
        return float(rng.uniform(0.75, 0.95))
    if archetype == "slow_spender":
        return float(rng.uniform(0.20, 0.55))
    if archetype == "year_end_dumper":
        return float(rng.uniform(0.88, 1.05))
    return float(rng.uniform(0.90, 1.12))


def txn_count_for_month(archetype: Archetype, month_idx: int, rng: np.random.Generator) -> int:
    if archetype == "healthy":
        return int(rng.integers(8, 16))

    if archetype == "slow_spender":
        if month_idx < 5:
            return int(rng.integers(1, 5))
        return int(rng.integers(3, 9))

    if archetype == "year_end_dumper":
        if month_idx < 10:
            return int(rng.integers(3, 8))
        return int(rng.integers(14, 30))

    # burst_spender
    if month_idx < 3:
        return int(rng.integers(18, 35))
    if month_idx < 6:
        return int(rng.integers(6, 14))
    return int(rng.integers(0, 4))


def month_start_dates(window: FiscalWindow) -> list[date]:
    starts: list[date] = []
    current = window.start
    for _ in range(12):
        starts.append(current)
        year = current.year + (1 if current.month == 12 else 0)
        month = 1 if current.month == 12 else current.month + 1
        current = date(year, month, 1)
    return starts


def month_end(start_day: date) -> date:
    year = start_day.year + (1 if start_day.month == 12 else 0)
    month = 1 if start_day.month == 12 else start_day.month + 1
    first_next = date(year, month, 1)
    return first_next - timedelta(days=1)


def generate_departments(num_departments: int, faker: Faker, rng: np.random.Generator) -> list[DepartmentRecord]:
    departments: list[DepartmentRecord] = []
    for dept_id in range(1, num_departments + 1):
        category = str(rng.choice(CATEGORIES).item())
        district = str(rng.choice(DISTRICTS).item())
        archetype = weighted_choice(rng)
        name = f"{category} {faker.city()} Unit"
        departments.append(
            DepartmentRecord(
                dept_id=dept_id,
                name=name,
                district=district,
                category=category,
                archetype=archetype,
            )
        )
    return departments


def generate_transactions_for_department(
    dept: DepartmentRecord,
    fiscal_year: int,
    allocated_amount: float,
    faker: Faker,
    rng: np.random.Generator,
) -> list[dict]:
    window = get_fiscal_window(fiscal_year)
    starts = month_start_dates(window)
    weights = monthly_weights(dept.archetype)
    target_util = utilization_target(dept.archetype, rng)
    yearly_target_spend = allocated_amount * target_util

    monthly_spends = yearly_target_spend * weights
    txns: list[dict] = []

    for idx, month_start in enumerate(starts):
        month_stop = month_end(month_start)
        tx_count = txn_count_for_month(dept.archetype, idx, rng)
        if tx_count <= 0:
            continue

        # Dirichlet keeps monthly amounts positive while preserving the monthly total.
        raw_splits = rng.dirichlet(np.ones(tx_count))
        amounts = monthly_spends[idx] * raw_splits

        month_days = (month_stop - month_start).days + 1
        for amount in amounts:
            day_offset = int(rng.integers(0, month_days))
            txn_date = month_start + timedelta(days=day_offset)
            txns.append(
                {
                    "dept_id": dept.dept_id,
                    "amount": round(float(amount), 2),
                    "date": txn_date.isoformat(),
                    "category": dept.category,
                    "description": faker.sentence(nb_words=7),
                }
            )

    return txns


def generate_dataset(
    num_departments: int,
    fiscal_years: list[int],
    seed: int,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    faker = Faker("en_IN")
    Faker.seed(seed)
    rng = np.random.default_rng(seed)

    departments = generate_departments(num_departments, faker, rng)

    dept_rows: list[dict] = []
    allocation_rows: list[dict] = []
    txn_rows: list[dict] = []

    for dept in departments:
        dept_rows.append(
            {
                "id": dept.dept_id,
                "name": dept.name,
                "district": dept.district,
                "category": dept.category,
                "archetype": dept.archetype,
            }
        )

        for fiscal_year in fiscal_years:
            allocated = round(random_allocation(rng), 2)
            allocation_rows.append(
                {
                    "dept_id": dept.dept_id,
                    "fiscal_year": fiscal_year,
                    "total_amount": allocated,
                }
            )
            txn_rows.extend(
                generate_transactions_for_department(
                    dept=dept,
                    fiscal_year=fiscal_year,
                    allocated_amount=allocated,
                    faker=faker,
                    rng=rng,
                )
            )

    departments_df = pd.DataFrame(dept_rows)
    allocations_df = pd.DataFrame(allocation_rows)
    transactions_df = pd.DataFrame(txn_rows)

    return departments_df, allocations_df, transactions_df


def write_outputs(
    departments_df: pd.DataFrame,
    allocations_df: pd.DataFrame,
    transactions_df: pd.DataFrame,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    departments_df.to_csv(output_dir / "departments.csv", index=False)
    allocations_df.to_csv(output_dir / "budget_allocations.csv", index=False)
    transactions_df.to_csv(output_dir / "transactions.csv", index=False)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate synthetic budget watchdog data.")
    parser.add_argument("--departments", type=int, default=200, help="Number of departments")
    parser.add_argument(
        "--fiscal-start",
        type=int,
        default=2024,
        help="First fiscal year start (e.g. 2024 means FY 2024-2025)",
    )
    parser.add_argument(
        "--years",
        type=int,
        default=2,
        help="Number of fiscal years to generate",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "output",
        help="Output directory for CSV files",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    fiscal_years = [args.fiscal_start + i for i in range(args.years)]

    departments_df, allocations_df, transactions_df = generate_dataset(
        num_departments=args.departments,
        fiscal_years=fiscal_years,
        seed=args.seed,
    )

    write_outputs(departments_df, allocations_df, transactions_df, args.output_dir)

    print("Synthetic data generation complete")
    print(f"departments: {len(departments_df)}")
    print(f"budget_allocations: {len(allocations_df)}")
    print(f"transactions: {len(transactions_df)}")
    print(f"output_dir: {args.output_dir}")


if __name__ == "__main__":
    main()
