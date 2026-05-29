import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import OTPVerification from '../pages/OTPVerification';
import ResetPassword from '../pages/ResetPassword';
import LiveData from '../pages/LiveData';
import Analytics from '../pages/Analytics';
import DataCapture from '../pages/DataCapture';
import AuthGate from '../../../components/AuthGate';

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
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<AuthGate><DashboardLayout /></AuthGate>}>
          <Route path="/live-data" element={<LiveData />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/data-capture" element={<DataCapture />} />
        </Route>

        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </LanguageProvider>
  );
};

export default AQMSRoutes;
