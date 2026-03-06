import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/landing';
import { DashboardLayout } from '../features/layout/DashboardLayout';
import { OverviewPage } from '../features/overview/OverviewPage';
import { DistrictsPage } from '../features/districts/DistrictsPage';
import { DistrictDetailPage } from '../features/districts/DistrictDetailPage';
import { DepartmentPage } from '../features/department/DepartmentPage';
import { AlertsPage } from '../features/alerts/AlertsPage';
import { ReallocationPage } from '../features/reallocation/ReallocationPage';
import { BudgetAnalysisDashboard } from '../features/analysis/BudgetAnalysisDashboard';
import { SignInPage } from '../pages/auth/SignInPage';
import { SignUpPage } from '../pages/auth/SignUpPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="analysis" element={<BudgetAnalysisDashboard />} />
          <Route path="districts" element={<DistrictsPage />} />
          <Route path="districts/:id" element={<DistrictDetailPage />} />
          <Route path="department/:id" element={<DepartmentPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reallocation" element={<ReallocationPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
