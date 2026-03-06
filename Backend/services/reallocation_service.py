from __future__ import annotations

from dataclasses import dataclass
from typing import List


@dataclass
class DepartmentForecast:
    department_id: int
    district_id: int
    allocation: float
    predicted_total_spend: float
    predicted_lapse_amount: float
    predicted_lapse_pct: float
    days_remaining: int


@dataclass
class ReallocationSuggestion:
    donor_department_id: int
    recipient_department_id: int
    suggested_amount: float
    reason: str
    priority: str
    same_district: bool


def generate_reallocation_suggestions(forecasts: List[DepartmentForecast]) -> List[ReallocationSuggestion]:
    donors = [f for f in forecasts if f.predicted_lapse_pct > 20]
    recipients = [f for f in forecasts if f.predicted_total_spend > (0.95 * f.allocation) and f.days_remaining > 60]

    donors.sort(key=lambda x: x.predicted_lapse_amount, reverse=True)
    recipients.sort(key=lambda x: ((x.predicted_total_spend - x.allocation) / max(x.allocation, 1.0)), reverse=True)

    suggestions: List[ReallocationSuggestion] = []

    for recipient in recipients:
        remaining_deficit = max(0.0, recipient.predicted_total_spend - recipient.allocation)
        if remaining_deficit <= 0:
            continue

        ordered_donors = sorted(
            donors,
            key=lambda d: (d.district_id != recipient.district_id, -d.predicted_lapse_amount),
        )

        for donor in ordered_donors:
            donor_cap = max(0.0, donor.predicted_lapse_amount * 0.70)
            if donor_cap <= 0:
                continue

            amount = min(donor_cap, remaining_deficit)
            if amount <= 0:
                continue

            same_district = donor.district_id == recipient.district_id
            suggestions.append(
                ReallocationSuggestion(
                    donor_department_id=donor.department_id,
                    recipient_department_id=recipient.department_id,
                    suggested_amount=round(amount, 2),
                    reason=(
                        f"Donor {donor.department_id} projected {donor.predicted_lapse_pct:.1f}% lapse; "
                        f"recipient {recipient.department_id} projected deficit {remaining_deficit:.2f}."
                    ),
                    priority="high" if same_district else "medium",
                    same_district=same_district,
                )
            )

            donor.predicted_lapse_amount = max(0.0, donor.predicted_lapse_amount - amount)
            remaining_deficit = max(0.0, remaining_deficit - amount)
            if remaining_deficit == 0:
                break

    return suggestions
