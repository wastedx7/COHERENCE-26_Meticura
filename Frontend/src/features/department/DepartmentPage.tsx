import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardTitle, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ErrorState, LoadingState, EmptyState } from '../../components/ui/States';
import { useDepartmentDetail, useAddTransaction } from '../../api/hooks/useBudget';
import { useDepartmentAnomalies, useResolveAnomaly } from '../../api/hooks/useAnomalies';
import { useDepartmentPrediction } from '../../api/hooks/usePredictions';
import { KPICard } from '../../components/common/KPICard';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { DateDisplay } from '../../components/common/DateDisplay';
import { UtilizationBar } from '../../components/common/UtilizationBar';
import { RiskIndicator } from '../../components/common/RiskIndicator';
import { AnomalyBadge } from '../../components/common/AnomalyBadge';
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatPercent } from '../../lib/utils';

export const DepartmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'anomalies'>('overview');

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
  });
  const [formError, setFormError] = useState('');

  // Queries
  const { data: dept, isLoading: deptLoading, error: deptError } = useDepartmentDetail(id || '');
  const { data: anomalies } = useDepartmentAnomalies(id || '');
  const { data: prediction } = useDepartmentPrediction(id || '');

  // Mutations
  const { mutate: addTransaction, isPending: isAddingTransaction } = useAddTransaction(id || '');
  const { mutate: resolveAnomaly, isPending: isResolvingAnomaly } = useResolveAnomaly();

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.amount || !formData.category) {
      setFormError('Please fill in all required fields');
      return;
    }

    addTransaction(
      {
        amount: parseFloat(formData.amount),
        date: formData.date,
        category: formData.category,
        description: formData.description,
      },
      {
        onSuccess: () => {
          setFormData({
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: '',
            description: '',
          });
          setIsTransactionModalOpen(false);
        },
      }
    );
  };

  if (!id) {
    return (
      <div>
        <PageHeader title="Department Detail" />
        <ErrorState message="No department ID provided" />
      </div>
    );
  }

  if (deptLoading) {
    return (
      <div>
        <PageHeader title="Department Detail" />
        <LoadingState message="Loading department data..." />
      </div>
    );
  }

  if (deptError || !dept) {
    return (
      <div>
        <PageHeader title="Department Detail" />
        <ErrorState message="Failed to load department details" />
      </div>
    );
  }

  const deptAnomalies = anomalies || [];

  return (
    <div>
      <PageHeader
        title={dept.department.name}
        breadcrumbs={[
          { label: 'Districts', path: '/dashboard/districts' },
          { label: dept.department.district_name },
          { label: dept.department.name },
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsTransactionModalOpen(true)}>
            <Plus size={20} className="mr-2" />
            Add Transaction
          </Button>
        }
      />

      {/* KPI Cards */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Allocated"
            value={dept.budget.allocated}
            isCurrency
          />
          <KPICard
            title="Spent"
            value={dept.budget.spent}
            isCurrency
          />
          <KPICard
            title="Remaining"
            value={dept.budget.remaining}
            isCurrency
          />
          <KPICard
            title="Utilization"
            value={formatPercent(dept.budget.utilization_pct)}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {(['overview', 'transactions', 'anomalies'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'anomalies' ? `Anomalies (${deptAnomalies.length})` : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Budget Utilization */}
          <Card>
            <CardContent>
              <CardTitle className="mb-4">Budget Utilization</CardTitle>
              <UtilizationBar
                allocated={dept.budget.allocated}
                spent={dept.budget.spent}
                remaining={dept.budget.remaining}
                showLabels
                height="lg"
              />
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                <p className="text-2xl font-bold">{dept.metrics.transaction_count}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Days Since Last Transaction</p>
                <p className="text-2xl font-bold">{dept.metrics.days_since_last_transaction}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-gray-600 mb-1">Average Transaction</p>
                <p className="text-lg font-bold font-mono">
                  <CurrencyDisplay amount={dept.metrics.avg_transaction_amount} compact />
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Prediction */}
          {prediction && (
            <Card>
              <CardContent>
                <div className="flex items-start justify-between mb-3">
                  <CardTitle>Lapse Prediction</CardTitle>
                  <RiskIndicator risk={prediction.risk_level} />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Predicted Lapse:</span>
                    <span className="font-bold font-mono">
                      <CurrencyDisplay amount={prediction.predicted_lapse} compact />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence Score:</span>
                    <span className="font-bold font-mono">
                      {formatPercent(prediction.confidence_score)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Generated:</span>
                    <DateDisplay date={prediction.generated_at} format="relative" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <Card>
          <CardContent>
            {dept.recent_transactions.length === 0 ? (
              <EmptyState title="No transactions" description="No transactions have been recorded yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold">Date</th>
                      <th className="text-left px-4 py-3 font-semibold">Category</th>
                      <th className="text-right px-4 py-3 font-semibold">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dept.recent_transactions.map((txn) => (
                      <tr key={txn.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <DateDisplay date={txn.date} format="short" />
                        </td>
                        <td className="px-4 py-3">{txn.category}</td>
                        <td className="text-right px-4 py-3 font-mono">
                          <CurrencyDisplay amount={txn.amount} />
                        </td>
                        <td className="px-4 py-3 text-gray-600">{txn.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          {deptAnomalies.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={<AlertTriangle size={48} className="text-green-500" />}
                  title="No anomalies"
                  description="All systems operating normally"
                />
              </CardContent>
            </Card>
          ) : (
            deptAnomalies.map((anomaly) => (
              <Card key={anomaly.id}>
                <CardContent>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AnomalyBadge severity={anomaly.severity} />
                        <span className="text-sm text-gray-600">
                          <DateDisplay date={anomaly.detected_at} format="relative" />
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{anomaly.anomaly_type}</p>
                    </div>
                    {!anomaly.resolved_at && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          resolveAnomaly({ anomalyId: anomaly.id }, { onSuccess: () => {} })
                        }
                        isLoading={isResolvingAnomaly}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>

                  {anomaly.resolved_at && (
                    <div className="px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      ✓ Resolved on {' '}
                      <DateDisplay date={anomaly.resolved_at} format="short" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="Add Transaction"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsTransactionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddTransaction}
              isLoading={isAddingTransaction}
            >
              Add Transaction
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {formError}
            </div>
          )}

          <Input
            label="Amount"
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />

          <Input
            label="Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <Select
            label="Category"
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: 'Select category' },
              { value: 'salary', label: 'Salary' },
              { value: 'supplies', label: 'Supplies' },
              { value: 'equipment', label: 'Equipment' },
              { value: 'travel', label: 'Travel' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </form>
      </Modal>
    </div>
  );
};
