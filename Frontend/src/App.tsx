import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './landing/page';

// Layout & Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';

// Pages
import AuthPage from './pages/auth';
import DashboardPage from './pages/dashboard';
import BudgetPage from './pages/budget';
import { DeptBudgetPage } from './pages/budget/DeptBudgetPage';
import { BudgetComparePage } from './pages/budget/BudgetComparePage';
import { ForecastPage } from './pages/budget/ForecastPage';
import AnomalyPage from './pages/anomalies';
import { CriticalAnomaliesPage } from './pages/anomalies/CriticalAnomaliesPage';
import { DeptAnomalyPage } from './pages/anomalies/DeptAnomalyPage';
import { AdvancedAnomalyPage } from './pages/anomalies/AdvancedAnomalyPage';
import LapsePage from './pages/lapse';
import { DeptLapsePage } from './pages/lapse/DeptLapsePage';
import ReallocationPage from './pages/reallocation';
import { SuggestionDetailPage } from './pages/reallocation/SuggestionDetailPage';
import TreePage from './pages/tree';
import ReportsPage from './pages/reports';
import UsersPage from './pages/users';
import EnginePage from './pages/engine';
import MyModelsPage from './pages/my-models';
import TransactionsPage from './pages/transactions';
import CitizenPage from './pages/citizen';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse flex space-x-4"><div className="rounded-full bg-slate-200 h-10 w-10"></div></div></div>;

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<AuthPage />} />

        {/* Dashboard / Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Budget */}
          <Route path="budget" element={<BudgetPage />} />
          <Route path="budget/department/:id" element={<DeptBudgetPage />} />
          <Route path="budget/compare" element={<BudgetComparePage />} />
          <Route path="budget/forecast" element={<ForecastPage />} />

          {/* Anomalies */}
          <Route path="anomalies" element={<AnomalyPage />} />
          <Route path="anomalies/critical" element={<CriticalAnomaliesPage />} />
          <Route path="anomalies/department/:id" element={<DeptAnomalyPage />} />
          <Route path="anomalies/advanced" element={<AdvancedAnomalyPage />} />

          {/* Lapse */}
          <Route path="lapse" element={<LapsePage />} />
          <Route path="lapse/department/:id" element={<DeptLapsePage />} />

          {/* Reallocation */}
          <Route path="reallocation" element={<ReallocationPage />} />
          <Route path="reallocation/:id" element={<SuggestionDetailPage />} />

          {/* Tree */}
          <Route path="tree" element={<TreePage />} />

          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />

          {/* Engine */}
          <Route path="engine" element={<EnginePage />} />

          {/* ML Models */}
          <Route path="my-models" element={<MyModelsPage />} />

          {/* Role-gated: Center Admin */}
          <Route path="users" element={<ProtectedRoute allowedRoles={['center_admin']}><UsersPage /></ProtectedRoute>} />

          {/* Role-gated: Dept Admin */}
          <Route path="transactions" element={<ProtectedRoute allowedRoles={['dept_admin']}><TransactionsPage /></ProtectedRoute>} />
        </Route>

        {/* Citizen Dashboard (Public transparent portal) */}
        <Route path="/citizen" element={<CitizenPage />} />

        {/* 404 */}
        <Route path="*" element={<div className="flex justify-center flex-col items-center h-screen bg-slate-50">
          <h1 className="text-4xl font-bold text-slate-800">404</h1>
          <p className="text-slate-500 mt-2">Page not found</p>
        </div>} />
      </Routes>
    </AuthProvider>
  );
}
