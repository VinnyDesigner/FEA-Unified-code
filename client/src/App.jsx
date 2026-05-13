import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './components/AuthLayout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import OTPVerification from './pages/OTPVerification';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import MISAnalyticsPage from './pages/MISAnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import FAQPage from './pages/FAQPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignIn />} /> {/* Syncing with project auth pattern */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Dashboard & Other Sections */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mis-analytics" element={<MISAnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/faq" element={<FAQPage />} />

        {/* Default redirect to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
