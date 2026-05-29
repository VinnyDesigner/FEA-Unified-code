import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import { useAuthStore } from '../../../stores/useAuthStore';

const Login = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('admin@fea.gov.ae');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login('AQMS', email, password);
      navigate('/AQMS/live-data');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-header">
        <h2>{t('login.title')}</h2>
        <p>{t('login.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="input-label">{t('login.email')}</label>
          <input
            type="email"
            className="input-glass"
            placeholder="admin@fea.gov.ae"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="input-label">{t('login.password')}</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="input-glass"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ paddingInlineEnd: '40px' }}
            required
          />
          <div
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: lang === 'en' ? '12px' : 'auto',
              left: lang === 'ar' ? '12px' : 'auto',
              bottom: '12px',
              cursor: 'pointer'
            }}
          >
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
          <button
            type="button"
            className="forgot-password"
            onClick={() => navigate('/AQMS/forgot-password')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {t('login.forgot_password')}
          </button>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', margin: '8px 0' }}>{error}</p>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Logging in…' : t('login.title')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </form>

      <div className="signup-link">
        {t('login.no_account')}{' '}
        <button
          type="button"
          onClick={() => navigate('/AQMS/signup')}
          style={{ background: 'none', border: 'none', color: '#5ef0ff', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
        >
          {t('login.sign_up')}
        </button>
      </div>
    </AuthLayout>
  );
};

export default Login;
