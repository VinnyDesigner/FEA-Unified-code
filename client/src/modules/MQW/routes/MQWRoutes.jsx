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
import '../i18n/i18n'; // Initialize MQW translations

const MQWThemeWrapper = () => {
  useEffect(() => {
    // Apply MQW-specific classes and styles to the body
    document.body.classList.add('mqw-theme');
    
    // Read current language setting and apply to documentElement
    const savedLanguage = localStorage.getItem('appLanguage') || 'en';
    document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
    if (savedLanguage === 'ar') {
      document.documentElement.classList.add('font-arabic');
    } else {
      document.documentElement.classList.remove('font-arabic');
    }

    return () => {
      // Clean up body classes when leaving the MQW module
      document.body.classList.remove('mqw-theme');
      document.documentElement.classList.remove('font-arabic');
    };
  }, []);

  return (
    <div className="mqw-theme w-full min-h-screen">
      <Outlet />
    </div>
  );
};

const MQWRoutes = () => {
  return (
    <Routes>
      <Route element={<MQWThemeWrapper />}>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="verify-otp" element={<OTPVerification />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* Dashboard & Sections */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="mis-analytics" element={<MISAnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="faq" element={<FAQPage />} />
        {/* Profile & User Management Routes (Commented out for future use)
        <Route path="profile" element={<ProfilePage />} />
        <Route path="user-management" element={<UserManagementPage />} />
        */}

        {/* Internal Redirects */}
        <Route path="" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default MQWRoutes;
