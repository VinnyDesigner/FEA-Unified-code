import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import * as queries from '../../../lib/queries';

const ResetPassword = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const resetToken = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await queries.resetPassword({ module: 'AQMS', body: { email, resetToken, newPassword } });
      navigate('/AQMS/login');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const eyeOpen = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
  const eyeClosed = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  );

  return (
    <AuthLayout>
      <div className="login-header">
        <h2>{t('login.resetPasswordTitle')}</h2>
        <p>{t('login.resetPasswordSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="input-label">{t('login.newPassword')}</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="input-glass"
            placeholder="••••••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ paddingInlineEnd: '40px' }}
            required
          />
          <div className="password-toggle" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: lang === 'en' ? '12px' : 'auto', left: lang === 'ar' ? '12px' : 'auto', bottom: '12px', cursor: 'pointer' }}>
            {showPassword ? eyeOpen : eyeClosed}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '28px' }}>
          <label className="input-label">{t('login.confirmPassword')}</label>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            className="input-glass"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ paddingInlineEnd: '40px' }}
            required
          />
          <div className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: lang === 'en' ? '12px' : 'auto', left: lang === 'ar' ? '12px' : 'auto', bottom: '12px', cursor: 'pointer' }}>
            {showConfirmPassword ? eyeOpen : eyeClosed}
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', margin: '8px 0' }}>{error}</p>}

        <button type="submit" className="login-btn" style={{ marginBottom: '20px' }} disabled={loading}>
          {loading ? 'Updating…' : t('login.updatePassword')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </form>

      <div className="signup-link">
        <button
          type="button"
          onClick={() => navigate('/AQMS/login')}
          style={{ background: 'none', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'en' ? 'rotate(180deg)' : 'none' }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          {t('login.backToLogin')}
        </button>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
