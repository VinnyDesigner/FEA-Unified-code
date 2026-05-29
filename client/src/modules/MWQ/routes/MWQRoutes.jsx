import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import OTPVerification from '../pages/OTPVerification';
import ResetPassword from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import MISAnalyticsPage from '../pages/MISAnalyticsPage';
import ReportsPage from '../pages/ReportsPage';
import FAQPage from '../pages/FAQPage';
import ProfilePage from '../pages/ProfilePage';
import UserManagementPage from '../pages/UserManagementPage';
import AuthGate from '../../../components/AuthGate';
import RequireRole from '../../../components/RequireRole';
import '../i18n/i18n'; // Initialize MWQ translations

const MWQThemeWrapper = () => {
  useEffect(() => {
    document.body.classList.add('mwq-theme');

    const savedLanguage = localStorage.getItem('appLanguage') || 'en';
    document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
    if (savedLanguage === 'ar') {
      document.documentElement.classList.add('font-arabic');
    } else {
      document.documentElement.classList.remove('font-arabic');
    }

    return () => {
      document.body.classList.remove('mwq-theme');
      document.documentElement.classList.remove('font-arabic');
    };
  }, []);

  return (
    <div className="mwq-theme w-full min-h-screen">
      <Outlet />
    </div>
  );
};

const MWQRoutes = () => {
  return (
    <Routes>
      <Route element={<MWQThemeWrapper />}>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="verify-otp" element={<OTPVerification />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Dashboard & Sections */}
        <Route path="dashboard" element={<AuthGate><Dashboard /></AuthGate>} />
        <Route path="mis-analytics" element={<AuthGate><MISAnalyticsPage /></AuthGate>} />
        <Route path="reports" element={<AuthGate><ReportsPage /></AuthGate>} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="profile" element={<AuthGate><ProfilePage /></AuthGate>} />
        <Route path="user-management" element={<AuthGate><RequireRole roles={['ADMIN']}><UserManagementPage /></RequireRole></AuthGate>} />

        {/* Internal Redirects */}
        <Route path="" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default MWQRoutes;
