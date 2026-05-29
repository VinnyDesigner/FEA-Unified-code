import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import * as queries from '../../../lib/queries';

const SignUp = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', emiratesId: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => setFormData((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await queries.signup({ module: 'AQMS', body: formData });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="login-header">
          <h2>{t('login.createAnAccount')}</h2>
        </div>
        <div style={{ color: 'white', textAlign: 'center', padding: '24px 0' }}>
          <p style={{ marginBottom: '16px', fontSize: '14px' }}>Account pending approval. An admin will review your request.</p>
          <button
            type="button"
            onClick={() => navigate('/AQMS/login')}
            style={{ background: 'none', border: 'none', color: '#5ef0ff', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {t('login.title')}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="login-header">
        <h2>{t('login.createAnAccount')}</h2>
        <p>{t('login.joinPlatform')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="signup-scrollable-form" style={{ maxHeight: '42vh', overflowY: 'auto', paddingInlineEnd: '4px', marginBottom: '16px' }}>
          <div className="form-group">
            <label className="input-label">{t('login.firstName')}</label>
            <input type="text" className="input-glass" placeholder={t('login.firstNamePlaceholder')} value={formData.firstName} onChange={handleChange('firstName')} required />
          </div>
          <div className="form-group">
            <label className="input-label">{t('login.lastName')}</label>
            <input type="text" className="input-glass" placeholder={t('login.lastNamePlaceholder')} value={formData.lastName} onChange={handleChange('lastName')} required />
          </div>
          <div className="form-group">
            <label className="input-label">{t('login.email')}</label>
            <input type="email" className="input-glass" placeholder={t('login.emailPlaceholder')} value={formData.email} onChange={handleChange('email')} required />
          </div>
          <div className="form-group">
            <label className="input-label">{t('login.phoneNumber')}</label>
            <input type="tel" className="input-glass" placeholder={t('login.phoneNumberPlaceholder')} value={formData.phoneNumber} onChange={handleChange('phoneNumber')} />
          </div>
          <div className="form-group">
            <label className="input-label">{t('login.emiratesId')}</label>
            <input type="text" className="input-glass" placeholder={t('login.emiratesIdPlaceholder')} value={formData.emiratesId} onChange={handleChange('emiratesId')} />
          </div>
          <div className="form-group">
            <label className="input-label">{t('login.password')}</label>
            <input type="password" className="input-glass" placeholder="••••••••••••" value={formData.password} onChange={handleChange('password')} required />
          </div>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', margin: '8px 0' }}>{error}</p>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Creating…' : t('login.createAnAccount')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </form>

      <div className="signup-link" style={{ marginTop: '12px' }}>
        {t('login.alreadyHaveAccount')}{' '}
        <button
          type="button"
          onClick={() => navigate('/AQMS/login')}
          style={{ background: 'none', border: 'none', color: '#5ef0ff', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
        >
          {t('login.title')}
        </button>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
