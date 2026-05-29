import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import * as queries from '../../../lib/queries';

const ForgotPassword = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await queries.forgotPassword({ module: 'AQMS', body: { email } });
      navigate(`/AQMS/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-header">
        <h2>{t('login.forgotPasswordTitle')}</h2>
        <p>{t('login.forgotPasswordSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '24px' }}>
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

        {error && <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', margin: '8px 0' }}>{error}</p>}

        <button type="submit" className="login-btn" style={{ marginBottom: '20px' }} disabled={loading}>
          {loading ? 'Sending…' : t('login.sendOtp')}
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

export default ForgotPassword;
