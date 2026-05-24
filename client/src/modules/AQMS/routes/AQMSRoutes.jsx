import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import LiveData from '../pages/LiveData';
import Analytics from '../pages/Analytics';
import DataCapture from '../pages/DataCapture';

const DashboardLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const AQMSRoutes = () => {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<DashboardLayout />}>
          <Route path="/live-data" element={<LiveData />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/data-capture" element={<DataCapture />} />
        </Route>

        {/* Redirects inside AQMS */}
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </LanguageProvider>
  );
};

export default AQMSRoutes;
