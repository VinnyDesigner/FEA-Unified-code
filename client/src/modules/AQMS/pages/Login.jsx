import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/AQMS/live-data');
  };

  return (
    <div className="login-container">
      <div className="bg-overlay"></div>

      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div className="login-panel">
        {/* Logo */}
        <div className="login-logo-area">
          <img src="/assets/AQMS/logo.png" alt="Logo" className="login-logo-img" />
        </div>

        {/* Form */}
        <div className="login-form-wrapper">
          <div className="login-header">
            <h2>{t('login.title')}</h2>
            <p>{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="input-label">{t('login.email')}</label>
              <input
                type="email"
                className="input-glass"
                placeholder="admin@fea.gov.ae"
                defaultValue="admin@fea.gov.ae"
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">{t('login.password')}</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-glass"
                defaultValue="password123"
                style={{ paddingRight: '40px' }}
                required
              />
              <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                {t('login.remember_me')}
              </label>
              <a href="#" className="forgot-password">{t('login.forgot_password')}</a>
            </div>

            <button type="submit" className="login-btn">
              {t('login.title')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </form>

          <div className="signup-link">
            {t('login.no_account')} <a href="#">{t('login.sign_up')}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
