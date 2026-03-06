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

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="districts" element={<DistrictsPage />} />
          <Route path="districts/:id" element={<DistrictDetailPage />} />
          <Route path="department/:id" element={<DepartmentPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reallocation" element={<ReallocationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
