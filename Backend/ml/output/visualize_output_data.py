from __future__ import annotations

from pathlib import Path
import json

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


BASE_DIR = Path(__file__).resolve().parent
VIZ_DIR = BASE_DIR / "visualizations"
VIZ_DIR.mkdir(parents=True, exist_ok=True)

sns.set_theme(style="whitegrid")


def _load_csv(name: str) -> pd.DataFrame:
    path = BASE_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path}")
    return pd.read_csv(path)


def _save_feature_dictionary(
    features: pd.DataFrame,
    scored: pd.DataFrame,
    allocations: pd.DataFrame,
    transactions: pd.DataFrame,
) -> None:
    feature_descriptions = {
        "dept_id": "Unique department identifier",
        "fiscal_year": "Fiscal year for feature snapshot",
        "spend_velocity": "Average spend per day",
        "utilization_pct": "Budget utilization percentage",
        "days_since_last_txn": "Inactivity indicator (days)",
        "daily_variance": "Volatility in daily transaction spend",
        "end_period_spike_ratio": "Concentration of spend at period end",
        "transaction_count": "Number of transactions in period",
        "avg_transaction_size": "Average transaction amount",
        "budget_remaining_ratio": "Unspent budget share (0-1)",
        "days_into_fiscal_year": "Progress in fiscal timeline",
        "anomaly_score": "Isolation forest anomaly score",
        "outlier_flag": "Model outlier flag (-1 anomalous, 1 normal)",
        "is_anomaly": "Final anomaly label (1 anomalous, 0 normal)",
    }

    payload = {
        "rows": {
            "features": len(features),
            "scored_features": len(scored),
            "budget_allocations": len(allocations),
            "transactions": len(transactions),
        },
        "columns": {
            "features": list(features.columns),
            "scored_features": list(scored.columns),
            "budget_allocations": list(allocations.columns),
            "transactions": list(transactions.columns),
        },
        "descriptions": feature_descriptions,
    }

    with (VIZ_DIR / "feature_dictionary.json").open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def _plot_feature_distributions(features: pd.DataFrame) -> None:
    cols = [
        "spend_velocity",
        "utilization_pct",
        "days_since_last_txn",
        "end_period_spike_ratio",
        "transaction_count",
        "budget_remaining_ratio",
    ]

    fig, axes = plt.subplots(2, 3, figsize=(16, 9))
    axes = axes.flatten()

    for i, col in enumerate(cols):
        sns.histplot(features[col], kde=False, ax=axes[i], color="#1f77b4")
        axes[i].set_title(col.replace("_", " ").title())

    fig.suptitle("Core ML Feature Distributions", fontsize=16)
    fig.tight_layout()
    fig.savefig(VIZ_DIR / "feature_distributions.png", dpi=160)
    plt.close(fig)


def _plot_anomaly_views(scored: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.scatterplot(
        data=scored,
        x="spend_velocity",
        y="utilization_pct",
        hue="is_anomaly",
        style="is_anomaly",
        palette={0: "#2ca02c", 1: "#d62728"},
        ax=ax,
    )
    ax.set_title("Spend Velocity vs Utilization (Anomaly Overlay)")
    ax.set_xlabel("Spend Velocity")
    ax.set_ylabel("Utilization %")
    fig.tight_layout()
    fig.savefig(VIZ_DIR / "velocity_vs_utilization_anomaly.png", dpi=160)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(10, 5))
    sns.histplot(scored["anomaly_score"], bins=30, kde=False, color="#9467bd", ax=ax)
    ax.axvline(scored["anomaly_score"].quantile(0.05), color="red", linestyle="--", linewidth=1.5)
    ax.set_title("Anomaly Score Distribution")
    ax.set_xlabel("Anomaly Score")
    fig.tight_layout()
    fig.savefig(VIZ_DIR / "anomaly_score_distribution.png", dpi=160)
    plt.close(fig)


def _plot_feature_correlation(scored: pd.DataFrame) -> None:
    corr_cols = [
        "spend_velocity",
        "utilization_pct",
        "days_since_last_txn",
        "daily_variance",
        "end_period_spike_ratio",
        "transaction_count",
        "avg_transaction_size",
        "budget_remaining_ratio",
        "anomaly_score",
    ]

    corr = scored[corr_cols].corr(numeric_only=True)

    fig, ax = plt.subplots(figsize=(11, 8))
    sns.heatmap(corr, cmap="RdBu_r", center=0, annot=False, ax=ax)
    ax.set_title("Feature Correlation Matrix")
    fig.tight_layout()
    fig.savefig(VIZ_DIR / "feature_correlation_heatmap.png", dpi=160)
    plt.close(fig)


def _plot_top_departments(features: pd.DataFrame) -> None:
    top_util = features.nlargest(10, "utilization_pct")[
        ["dept_id", "utilization_pct", "transaction_count", "spend_velocity"]
    ].copy()

    fig, ax = plt.subplots(figsize=(11, 6))
    sns.barplot(data=top_util, x="dept_id", y="utilization_pct", color="#17becf", ax=ax)
    ax.set_title("Top 10 Departments by Budget Utilization")
    ax.set_xlabel("Department ID")
    ax.set_ylabel("Utilization %")
    fig.tight_layout()
    fig.savefig(VIZ_DIR / "top_departments_utilization.png", dpi=160)
    plt.close(fig)


def _plot_allocation_vs_spend(allocations: pd.DataFrame, transactions: pd.DataFrame) -> None:
    annual_alloc = (
        allocations.groupby("dept_id", as_index=False)["total_amount"]
        .sum()
        .rename(columns={"total_amount": "allocated_total"})
    )

    annual_spend = (
        transactions.groupby("dept_id", as_index=False)["amount"]
        .sum()
        .rename(columns={"amount": "spent_total"})
    )

    merged = annual_alloc.merge(annual_spend, on="dept_id", how="left").fillna(0)
    merged["utilization_pct"] = (merged["spent_total"] / merged["allocated_total"] * 100).clip(upper=200)

    fig, ax = plt.subplots(figsize=(10, 6))
    sns.scatterplot(
        data=merged,
        x="allocated_total",
        y="spent_total",
        hue="utilization_pct",
        palette="viridis",
        size="utilization_pct",
        ax=ax,
    )
    ax.set_title("Department Allocation vs Spend")
    ax.set_xlabel("Total Allocation")
    ax.set_ylabel("Total Spend")
    fig.tight_layout()
    fig.savefig(VIZ_DIR / "allocation_vs_spend.png", dpi=160)
    plt.close(fig)


def _plot_monthly_spend_trend(transactions: pd.DataFrame) -> None:
    tx = transactions.copy()
    tx["date"] = pd.to_datetime(tx["date"], errors="coerce")
    tx = tx.dropna(subset=["date"])
    tx["year_month"] = tx["date"].dt.to_period("M").astype(str)

    monthly = tx.groupby("year_month", as_index=False)["amount"].sum()

    fig, ax = plt.subplots(figsize=(12, 5))
    sns.lineplot(data=monthly, x="year_month", y="amount", marker="o", ax=ax, color="#ff7f0e")
    ax.set_title("Monthly Spend Trend")
    ax.set_xlabel("Year-Month")
    ax.set_ylabel("Total Spend")
    ax.tick_params(axis="x", rotation=45)
    fig.tight_layout()
    fig.savefig(VIZ_DIR / "monthly_spend_trend.png", dpi=160)
    plt.close(fig)


def _plot_project_dashboard(
    features: pd.DataFrame,
    scored: pd.DataFrame,
    allocations: pd.DataFrame,
    transactions: pd.DataFrame,
) -> None:
    tx = transactions.copy()
    tx["date"] = pd.to_datetime(tx["date"], errors="coerce")
    tx = tx.dropna(subset=["date"])

    monthly = tx.assign(year_month=tx["date"].dt.to_period("M").astype(str)).groupby(
        "year_month", as_index=False
    )["amount"].sum()

    alloc_spend = (
        allocations.groupby("dept_id", as_index=False)["total_amount"]
        .sum()
        .rename(columns={"total_amount": "allocated_total"})
        .merge(
            transactions.groupby("dept_id", as_index=False)["amount"]
            .sum()
            .rename(columns={"amount": "spent_total"}),
            on="dept_id",
            how="left",
        )
        .fillna(0)
    )

    alloc_spend["utilization_pct"] = (
        alloc_spend["spent_total"] / alloc_spend["allocated_total"] * 100
    ).clip(upper=200)

    top_util = features.nlargest(8, "utilization_pct")[["dept_id", "utilization_pct"]]

    fig = plt.figure(figsize=(18, 12))
    gs = fig.add_gridspec(3, 3, hspace=0.4, wspace=0.28)

    # KPI text panel
    ax_kpi = fig.add_subplot(gs[0, 0])
    ax_kpi.axis("off")
    total_depts = int(features["dept_id"].nunique())
    anomaly_count = int((scored["is_anomaly"] == 1).sum())
    anomaly_rate = (anomaly_count / len(scored) * 100) if len(scored) else 0
    avg_util = float(features["utilization_pct"].mean())
    avg_velocity = float(features["spend_velocity"].mean())
    ax_kpi.text(
        0,
        1,
        "Project Snapshot\n"
        f"Departments: {total_depts}\n"
        f"Scored Entities: {len(scored)}\n"
        f"Anomalies: {anomaly_count} ({anomaly_rate:.1f}%)\n"
        f"Avg Utilization: {avg_util:.1f}%\n"
        f"Avg Spend Velocity: {avg_velocity:,.0f}",
        va="top",
        fontsize=12,
        family="monospace",
    )

    # Anomaly score distribution
    ax1 = fig.add_subplot(gs[0, 1])
    sns.histplot(scored["anomaly_score"], bins=25, kde=False, color="#8c564b", ax=ax1)
    ax1.set_title("Anomaly Score Distribution")

    # Velocity vs utilization
    ax2 = fig.add_subplot(gs[0, 2])
    sns.scatterplot(
        data=scored,
        x="spend_velocity",
        y="utilization_pct",
        hue="is_anomaly",
        palette={0: "#2ca02c", 1: "#d62728"},
        ax=ax2,
    )
    ax2.set_title("Velocity vs Utilization")
    ax2.set_xlabel("Spend Velocity")
    ax2.set_ylabel("Utilization %")

    # Monthly trend
    ax3 = fig.add_subplot(gs[1, :2])
    sns.lineplot(data=monthly, x="year_month", y="amount", marker="o", color="#1f77b4", ax=ax3)
    ax3.set_title("Monthly Spend Trend")
    ax3.tick_params(axis="x", rotation=45)
    ax3.set_xlabel("Year-Month")
    ax3.set_ylabel("Total Spend")

    # Allocation vs spend
    ax4 = fig.add_subplot(gs[1, 2])
    sns.scatterplot(
        data=alloc_spend,
        x="allocated_total",
        y="spent_total",
        hue="utilization_pct",
        palette="viridis",
        legend=False,
        ax=ax4,
    )
    ax4.set_title("Allocation vs Spend")
    ax4.set_xlabel("Allocated")
    ax4.set_ylabel("Spent")

    # Top utilization
    ax5 = fig.add_subplot(gs[2, :])
    sns.barplot(data=top_util, x="dept_id", y="utilization_pct", color="#17becf", ax=ax5)
    ax5.set_title("Top Departments by Utilization")
    ax5.set_xlabel("Department ID")
    ax5.set_ylabel("Utilization %")

    fig.suptitle("Budget Watchdog ML Output Dashboard", fontsize=18, y=0.99)
    fig.tight_layout()
    fig.savefig(VIZ_DIR / "project_ml_dashboard.png", dpi=170)
    plt.close(fig)


def _save_attribute_summary(features: pd.DataFrame, scored: pd.DataFrame) -> None:
    summary_cols = [
        "spend_velocity",
        "utilization_pct",
        "days_since_last_txn",
        "daily_variance",
        "end_period_spike_ratio",
        "transaction_count",
        "avg_transaction_size",
        "budget_remaining_ratio",
        "anomaly_score",
    ]

    stats = scored[summary_cols].describe().transpose()
    stats.to_csv(VIZ_DIR / "feature_attribute_summary.csv")

    anomaly_breakdown = (
        scored.groupby("is_anomaly", as_index=False)
        .agg(
            dept_count=("dept_id", "count"),
            avg_utilization=("utilization_pct", "mean"),
            avg_velocity=("spend_velocity", "mean"),
        )
        .sort_values("is_anomaly")
    )
    anomaly_breakdown.to_csv(VIZ_DIR / "anomaly_group_summary.csv", index=False)


def main() -> None:
    features = _load_csv("features.csv")
    scored = _load_csv("scored_features.csv")
    allocations = _load_csv("budget_allocations.csv")
    transactions = _load_csv("transactions.csv")

    _save_feature_dictionary(features, scored, allocations, transactions)
    _plot_feature_distributions(features)
    _plot_anomaly_views(scored)
    _plot_feature_correlation(scored)
    _plot_top_departments(features)
    _plot_allocation_vs_spend(allocations, transactions)
    _plot_monthly_spend_trend(transactions)
    _plot_project_dashboard(features, scored, allocations, transactions)
    _save_attribute_summary(features, scored)

    print("Visualization complete. Files saved to:")
    print(VIZ_DIR)


if __name__ == "__main__":
    main()
