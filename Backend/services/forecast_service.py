from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ForecastResult:
    avg_daily_spend: float
    predicted_total_spend: float
    predicted_lapse_amount: float
    predicted_lapse_pct: float
    risk_level: str


def forecast_lapse(
    allocation: float,
    total_spent: float,
    recent_30d_spend: float,
    days_into_year: int,
    days_remaining: int,
    recent_weight: float = 0.70,
    historical_weight: float = 0.30,
) -> ForecastResult:
    if allocation <= 0:
        return ForecastResult(0.0, total_spent, 0.0, 0.0, "LOW")

    if days_into_year <= 30:
        historical_daily = total_spent / max(days_into_year, 1)
    else:
        historical_daily = (total_spent - recent_30d_spend) / max(days_into_year - 30, 1)

    recent_daily = recent_30d_spend / 30.0
    avg_daily_spend = recent_daily * recent_weight + historical_daily * historical_weight

    predicted_total = total_spent + avg_daily_spend * max(days_remaining, 0)
    lapse_amount = max(0.0, allocation - predicted_total)
    lapse_pct = (lapse_amount / allocation) * 100

    if (total_spent / allocation) * 100 > 100:
        risk_level = "DEPLETED"
    elif days_remaining < 0:
        risk_level = "CRITICAL"
    elif lapse_pct > 25:
        risk_level = "HIGH"
    elif lapse_pct > 10:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return ForecastResult(
        avg_daily_spend=round(avg_daily_spend, 4),
        predicted_total_spend=round(predicted_total, 2),
        predicted_lapse_amount=round(lapse_amount, 2),
        predicted_lapse_pct=round(lapse_pct, 2),
        risk_level=risk_level,
    )
