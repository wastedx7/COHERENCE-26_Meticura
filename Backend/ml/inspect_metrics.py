#!/usr/bin/env python3
"""
Quick inspection script for model evaluation metrics
"""
import json
from pathlib import Path


def main():
    metrics_path = Path(__file__).parent / "artifacts" / "evaluation_metrics.json"
    
    if not metrics_path.exists():
        print(f"Error: {metrics_path} not found")
        print("Run: python -m ml.train_with_eval first")
        return
    
    with open(metrics_path) as f:
        metrics = json.load(f)
    
    print("=" * 70)
    print("ISOLATION FOREST MODEL EVALUATION")
    print("=" * 70)
    print()
    
    print(f"Model Type:        {metrics['model_type']}")
    print(f"Training Samples:  {metrics['training_samples']}")
    print(f"Features Used:     {metrics['features_count']}")
    print(f"Contamination:     {metrics['contamination']}")
    print(f"Random State:      {metrics['random_state']}")
    print()
    
    print("Features:")
    for i, feat in enumerate(metrics['feature_names'], 1):
        print(f"  {i}. {feat}")
    print()
    
    cm = metrics['confusion_matrix']
    print("Confusion Matrix:")
    print("┌─────────────┬──────────────────────┐")
    print("│             │     Predicted        │")
    print("│   Actual    ├──────────┬───────────┤")
    print("│             │ Healthy  │ Anomalous │")
    print("├─────────────┼──────────┼───────────┤")
    print(f"│ Healthy     │  {cm['true_negatives']:4d}    │   {cm['false_positives']:4d}    │")
    print(f"│ Anomalous   │  {cm['false_negatives']:4d}    │   {cm['true_positives']:4d}    │")
    print("└─────────────┴──────────┴───────────┘")
    print()
    
    m = metrics['metrics']
    print(f"Performance Metrics:")
    print(f"  Accuracy:   {m['accuracy']:.4f}  ({m['accuracy']*100:.2f}%)")
    print(f"  Precision:  {m['precision']:.4f}  ({m['precision']*100:.2f}%)")
    print(f"  Recall:     {m['recall']:.4f}  ({m['recall']*100:.2f}%)")
    print(f"  F1-Score:   {m['f1_score']:.4f}")
    print()
    
    pd = metrics['prediction_distribution']
    print("Prediction Distribution:")
    print(f"  True Anomalies:       {pd['true_anomalies']:3d}")
    print(f"  Predicted Anomalies:  {pd['predicted_anomalies']:3d}")
    print(f"  True Healthy:         {pd['true_healthy']:3d}")
    print(f"  Predicted Healthy:    {pd['predicted_healthy']:3d}")
    print()
    
    stats = metrics['score_statistics']
    print("Anomaly Score Statistics:")
    print(f"  Min:   {stats['min_score']:.6f}")
    print(f"  Max:   {stats['max_score']:.6f}")
    print(f"  Mean:  {stats['mean_score']:.6f}")
    print(f"  Std:   {stats['std_score']:.6f}")
    print()
    
    print("Classification Report:")
    cr = metrics['classification_report']
    for label in ['healthy', 'anomalous']:
        print(f"\n  {label.capitalize()}:")
        print(f"    Precision: {cr[label]['precision']:.4f}")
        print(f"    Recall:    {cr[label]['recall']:.4f}")
        print(f"    F1-Score:  {cr[label]['f1-score']:.4f}")
        print(f"    Support:   {int(cr[label]['support'])}")
    
    print()
    print("=" * 70)


if __name__ == "__main__":
    main()
