import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState, EmptyState } from '../../components/ui/States';
import { useReallocationSuggestions, useApproveSuggestion, useRejectSuggestion } from '../../api/hooks/useReallocation';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { RiskIndicator } from '../../components/common/RiskIndicator';
import { DateDisplay } from '../../components/common/DateDisplay';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ReallocationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const { data: reallocationsData, isLoading, error } = useReallocationSuggestions();
  const { mutate: approveSuggestion, isPending: isApproving } = useApproveSuggestion();
  const { mutate: rejectSuggestion, isPending: isRejecting } = useRejectSuggestion();

  const suggestions = reallocationsData?.suggestions || [];

  // Filter suggestions by status
  const filteredSuggestions = suggestions.filter((s) => s.status === activeTab);

  // Group by district
  const groupedByDistrict = filteredSuggestions.reduce(
    (acc, suggestion) => {
      const district = suggestion.donor_dept_name?.split(' ')[0] || 'Unknown';
      if (!acc[district]) {
        acc[district] = [];
      }
      acc[district].push(suggestion);
      return acc;
    },
    {} as Record<string, typeof suggestions>
  );

  const handleApprove = (suggestionId: string) => {
    approveSuggestion(suggestionId, {
      onSuccess: () => {
        setSelectedSuggestions((prev) => {
          const next = new Set(prev);
          next.delete(suggestionId);
          return next;
        });
      },
    });
  };

  const handleReject = (suggestionId: string) => {
    rejectSuggestion(
      { suggestionId },
      {
        onSuccess: () => {
          setSelectedSuggestions((prev) => {
            const next = new Set(prev);
            next.delete(suggestionId);
            return next;
          });
        },
      }
    );
  };

  const handleToggleSelect = (suggestionId: string) => {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(suggestionId)) {
        next.delete(suggestionId);
      } else {
        next.add(suggestionId);
      }
      return next;
    });
  };

  const handleBulkApprove = () => {
    if (selectedSuggestions.size === 0) return;
    selectedSuggestions.forEach((id) => handleApprove(id));
    toast.success(`Approved ${selectedSuggestions.size} reallocation(s)`);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Reallocation Hub" description="Manage budget reallocations" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Reallocation Hub" description="Manage budget reallocations" />
        <ErrorState message="Failed to load reallocation suggestions" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reallocation Hub"
        description="Reallocate budget between departments"
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {(['pending', 'approved', 'rejected'] as const).map((tab) => {
          const tabCount = suggestions.filter((s) => s.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedSuggestions(new Set());
              }}
              className={`px-4 py-2 font-medium capitalize transition-colors flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                {tabCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk Actions */}
      {activeTab === 'pending' && selectedSuggestions.size > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedSuggestions.size} reallocation(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedSuggestions(new Set())}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkApprove}
              isLoading={isApproving}
            >
              Approve All
            </Button>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {filteredSuggestions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title={`No ${activeTab} reallocations`}
              description={
                activeTab === 'pending'
                  ? 'No pending reallocation suggestions'
                  : `No ${activeTab} reallocations`
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDistrict).map(([district, districtSuggestions]) => (
            <div key={district}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 px-4">
                {district} District
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {districtSuggestions.map((suggestion) => (
                  <Card key={suggestion.id}>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                {suggestion.priority.toUpperCase()}
                              </span>
                              {suggestion.status === 'approved' && (
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1">
                                  <CheckCircle size={12} /> Approved
                                </span>
                              )}
                              {suggestion.status === 'rejected' && (
                                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold flex items-center gap-1">
                                  <XCircle size={12} /> Rejected
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{suggestion.reason}</p>
                          </div>
                        </div>

                        {/* Transfer Flow */}
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">From</p>
                            <p className="font-medium text-gray-900">
                              {suggestion.donor_dept_name || `Dept ${suggestion.donor_dept_id}`}
                            </p>
                          </div>

                          <div className="flex items-center justify-center py-1">
                            <ArrowRight className="text-gray-400" size={20} />
                          </div>

                          <div>
                            <p className="text-xs text-gray-600 mb-1">To</p>
                            <p className="font-medium text-gray-900">
                              {suggestion.recipient_dept_name || `Dept ${suggestion.recipient_dept_id}`}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Amount</p>
                            <p className="text-lg font-bold font-mono">
                              <CurrencyDisplay amount={suggestion.amount} />
                            </p>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="text-xs text-gray-600 space-y-1">
                          {suggestion.processed_at && (
                            <p>
                              Processed: <DateDisplay date={suggestion.processed_at} format="short" />
                            </p>
                          )}
                          <p>Generated: <DateDisplay date={suggestion.generated_at} format="short" /></p>
                        </div>

                        {/* Actions */}
                        {suggestion.status === 'pending' && (
                          <div className="flex gap-2 pt-2 border-t border-gray-200">
                            <input
                              type="checkbox"
                              checked={selectedSuggestions.has(suggestion.id)}
                              onChange={() => handleToggleSelect(suggestion.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(suggestion.id)}
                              isLoading={isApproving}
                              className="flex-1"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReject(suggestion.id)}
                              isLoading={isRejecting}
                              className="flex-1"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
