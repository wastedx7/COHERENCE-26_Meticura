import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './landing/page';

// Layout & Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/layout/AppShell';

// Pages
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
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
import { BudgetProvider } from './context/BudgetContext';
import { AnomalyProvider } from './context/AnomalyContext';
import { LapseProvider } from './context/LapseContext';
import { ReallocationProvider } from './context/ReallocationContext';
import { DashboardProvider } from './context/DashboardContext';
import { UsersProvider } from './context/UsersContext';
import { EngineProvider } from './context/EngineContext';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { role, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access on routes with allowedRoles
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const DataProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardProvider>
      <BudgetProvider>
        <AnomalyProvider>
          <LapseProvider>
            <ReallocationProvider>
              <UsersProvider>
                <EngineProvider>
                  {children}
                </EngineProvider>
              </UsersProvider>
            </ReallocationProvider>
          </LapseProvider>
        </AnomalyProvider>
      </BudgetProvider>
    </DashboardProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        {/* Dashboard / Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <DataProviders>
              <AppShell />
            </DataProviders>
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Budget */}
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/budget/department/:id" element={<DeptBudgetPage />} />
          <Route path="/budget/compare" element={<BudgetComparePage />} />
          <Route path="/budget/forecast" element={<ForecastPage />} />

          {/* Anomalies */}
          <Route path="/anomalies" element={<AnomalyPage />} />
          <Route path="/anomalies/critical" element={<CriticalAnomaliesPage />} />
          <Route path="/anomalies/department/:id" element={<DeptAnomalyPage />} />
          <Route path="/anomalies/advanced" element={<AdvancedAnomalyPage />} />

          {/* Lapse */}
          <Route path="/lapse" element={<LapsePage />} />
          <Route path="/lapse/department/:id" element={<DeptLapsePage />} />

          {/* Reallocation - Manager and Admin only */}
          <Route path="/reallocation" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ReallocationPage /></ProtectedRoute>} />
          <Route path="/reallocation/:id" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><SuggestionDetailPage /></ProtectedRoute>} />

          {/* Tree */}
          <Route path="/tree" element={<TreePage />} />

          {/* Reports - Admin, Manager, and Analyst only */}
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'analyst']}><ReportsPage /></ProtectedRoute>} />

          {/* Engine - Admin only */}
          <Route path="/engine" element={<ProtectedRoute allowedRoles={['admin']}><EnginePage /></ProtectedRoute>} />

          {/* ML Models - Admin, Manager, and Analyst only */}
          <Route path="/my-models" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'analyst']}><MyModelsPage /></ProtectedRoute>} />

          {/* Users - Admin only */}
          <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />

          {/* Transactions - Admin and Manager only */}
          <Route path="/transactions" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><TransactionsPage /></ProtectedRoute>} />
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
