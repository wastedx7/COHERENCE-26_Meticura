import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import json
from pathlib import Path
from datetime import datetime, timedelta


def load_transactions():
    """Load transaction data from CSV"""
    csv_path = Path(__file__).parent / "output" / "transactions.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Transactions CSV not found: {csv_path}")
    
    df = pd.read_csv(csv_path)
    df['date'] = pd.to_datetime(df['date'])
    return df


def load_allocations():
    """Load budget allocation data"""
    csv_path = Path(__file__).parent / "output" / "budget_allocations.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Budget allocations CSV not found: {csv_path}")
    
    return pd.read_csv(csv_path)


def prepare_lapse_data(transactions_df, allocations_df):
    """
    Prepare training data for lapse prediction
    Returns X (day of year), y (cumulative spend%), and metadata
    """
    lapse_data = []
    
    # Get most recent allocations (2025 if available, else 2024)
    latest_fiscal_year = allocations_df['fiscal_year'].max()
    latest_allocs = allocations_df[allocations_df['fiscal_year'] == latest_fiscal_year]
    allocations_dict = dict(zip(latest_allocs['dept_id'], latest_allocs['total_amount']))
    
    print(f"   Using fiscal year {latest_fiscal_year} allocations")
    
    depts = transactions_df['dept_id'].unique()
    for i, dept_id in enumerate(depts, 1):
        if i % 100 == 0:
            print(f"   Processing department {i}/{len(depts)}...")
        
        dept_txns = transactions_df[transactions_df['dept_id'] == dept_id].sort_values('date').copy()
        
        if len(dept_txns) < 2:
            continue
        
        budget = allocations_dict.get(int(dept_id), 1000000)
        
        # Get fiscal year start from earliest transaction
        min_date = dept_txns['date'].min()
        fiscal_year_start = datetime(min_date.year, 1, 1)
        
        # Calculate cumulative spend and day of year
        dept_txns['days_into_fy'] = (dept_txns['date'] - fiscal_year_start).dt.days + 1
        dept_txns['cumsum'] = dept_txns['amount'].cumsum()
        dept_txns['spend_pct'] = (dept_txns['cumsum'] / budget * 100).clip(upper=100)
        
        lapse_data.append({
            'department_id': int(dept_id),
            'budget': float(budget),
            'transactions': dept_txns[['days_into_fy', 'spend_pct']].values,
            'total_spent': float(dept_txns['amount'].sum()),
            'tx_count': len(dept_txns),
        })
    
    return lapse_data


def train_department_models(lapse_data, max_days=365):
    """
    Train a linear regression model for each department to predict lapse point
    Lapse point = day when budget depleted (spend_pct reaches 100%)
    """
    X_list = []
    y_list = []
    dept_ids = []
    r2_scores = []
    predictions = []
    
    for dept in lapse_data:
        dept_id = dept['department_id']
        transactions = dept['transactions']
        
        if len(transactions) < 2:
            continue
        
        # Prepare training data
        X = transactions[:, 0].reshape(-1, 1)  # days_into_fy
        y = transactions[:, 1]  # spend_pct
        
        # Fit linear regression
        model = LinearRegression()
        model.fit(X, y)
        
        # Calculate metrics
        y_pred = model.predict(X)
        r2 = r2_score(y, y_pred)
        r2_scores.append(r2)
        
        # Predict lapse point (when spend_pct = 100%)
        # 100 = slope * x + intercept => x = (100 - intercept) / slope
        if model.coef_[0] > 0:
            lapse_day = (100 - model.intercept_) / model.coef_[0]
            lapse_day = int(max(1, min(lapse_day, max_days)))
        else:
            lapse_day = max_days  # No lapse predicted if spending slope negative
        
        predictions.append({
            'department_id': dept_id,
            'slope': float(model.coef_[0]),
            'intercept': float(model.intercept_),
            'r2_score': float(r2),
            'predicted_lapse_day': lapse_day,
            'historical_txns': len(transactions),
            'total_spent': float(dept['total_spent']),
            'budget': float(dept['budget']),
            'spending_index': float(dept['total_spent'] / dept['budget'] * 100),
        })
        
        X_list.append(X)
        y_list.append(y)
        dept_ids.append(dept_id)
    
    return predictions, r2_scores, dept_ids


def evaluate_model(predictions):
    """Calculate evaluation metrics"""
    lapse_predictions = np.array([p['predicted_lapse_day'] for p in predictions])
    r2_scores = np.array([p['r2_score'] for p in predictions])
    
    metrics = {
        'total_departments': len(predictions),
        'avg_predicted_lapse_day': float(np.mean(lapse_predictions)),
        'median_predicted_lapse_day': float(np.median(lapse_predictions)),
        'min_lapse_day': int(np.min(lapse_predictions)),
        'max_lapse_day': int(np.max(lapse_predictions)),
        'std_lapse_days': float(np.std(lapse_predictions)),
        'avg_r2_score': float(np.mean(r2_scores)),
        'high_confidence_models': int(np.sum(r2_scores > 0.8)),  # R² > 0.8
        'medium_confidence_models': int(np.sum((r2_scores > 0.5) & (r2_scores <= 0.8))),
        'low_confidence_models': int(np.sum(r2_scores <= 0.5)),
        'timestamp': datetime.now().isoformat(),
    }
    
    return metrics


def save_predictions(predictions, filename='lapse_predictions.json'):
    """Save predictions to JSON"""
    output_dir = Path(__file__).parent / "artifacts"
    output_dir.mkdir(exist_ok=True)
    
    output_path = output_dir / filename
    with open(output_path, 'w') as f:
        json.dump(predictions, f, indent=2)
    
    return output_path


def train_lapse_model() -> dict:
    """Train lapse models and return summary metrics for task orchestration."""
    transactions_df = load_transactions()
    allocations_df = load_allocations()
    lapse_data = prepare_lapse_data(transactions_df, allocations_df)
    predictions, r2_scores, _ = train_department_models(lapse_data)
    metrics = evaluate_model(predictions)
    save_predictions(predictions)

    metrics_dir = Path(__file__).parent / "artifacts"
    metrics_dir.mkdir(exist_ok=True)
    with open(metrics_dir / "lapse_metrics.json", 'w') as f:
        json.dump(metrics, f, indent=2)

    return {
        "r2_score": float(np.mean(r2_scores)) if r2_scores else 0.0,
        "total_departments": int(len(predictions)),
        "metrics": metrics,
    }


def main():
    print(" Training Lapse Predictor Model...")

    # Load data
    print("\n Loading transaction data...")
    transactions_df = load_transactions()
    allocations_df = load_allocations()
    print(f"   Loaded {len(transactions_df)} transactions for {transactions_df['dept_id'].nunique()} departments")
    
    # Prepare data
    print("\n Preparing training data...")
    lapse_data = prepare_lapse_data(transactions_df, allocations_df)
    print(f"   Prepared data for {len(lapse_data)} departments")
    
    # Train models
    print("\n Training linear regression models...")
    predictions, r2_scores, dept_ids = train_department_models(lapse_data)
    print(f"   Trained {len(predictions)} models")
    print(f"   Average R² score: {np.mean(r2_scores):.4f}")
    
    # Evaluate
    print("\n Evaluating model...")
    metrics = evaluate_model(predictions)
    print(f"   Average predicted lapse day: {metrics['avg_predicted_lapse_day']:.1f}")
    print(f"   Median predicted lapse day: {metrics['median_predicted_lapse_day']:.1f}")
    print(f"   High confidence models (R²>0.8): {metrics['high_confidence_models']}")
    print(f"   Medium confidence models (R²>0.5): {metrics['medium_confidence_models']}")
    print(f"   Low confidence models (R²≤0.5): {metrics['low_confidence_models']}")
    
    # Save predictions
    print("\n Saving predictions...")
    preds_path = save_predictions(predictions)
    print(f"    Saved to {preds_path}")
    
    # Save evaluation metrics
    print("\n💾 Saving evaluation metrics...")
    metrics_dir = Path(__file__).parent / "artifacts"
    metrics_dir.mkdir(exist_ok=True)
    metrics_path = metrics_dir / "lapse_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"    Saved to {metrics_path}")
    
    # Display sample predictions
    print("\n Sample predictions (first 10 departments):")
    for pred in predictions[:10]:
        print(f"   Dept {pred['department_id']:03d}: Lapse day {pred['predicted_lapse_day']:3d} (R²={pred['r2_score']:.3f}, slope={pred['slope']:.6f})")
    
    print("\n Lapse predictor training complete!")


if __name__ == "__main__":
    main()
