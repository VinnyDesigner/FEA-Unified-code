import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';
import * as queries from '../../../lib/queries';

const SignUp = () => {
  const { t } = useTranslation();
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
      await queries.signup({ module: 'MWQ', body: formData });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard title={t('auth.createAnAccount')} subtitle="">
        <div className="text-center text-white py-6">
          <p className="text-sm font-semibold mb-4">Account pending approval. An admin will review your request.</p>
          <Link to="/MWQ/signin" className="text-[#19D9F3] font-bold hover:underline">{t('auth.signIn')}</Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('auth.createAnAccount')} subtitle={t('auth.joinPlatform')}>
      <form className="w-full flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <FormInput label={t('auth.firstName')} type="text" placeholder={t('auth.firstNamePlaceholder')} value={formData.firstName} onChange={handleChange('firstName')} required />
        <FormInput label={t('auth.lastName')} type="text" placeholder={t('auth.lastNamePlaceholder')} value={formData.lastName} onChange={handleChange('lastName')} required />
        <FormInput label={t('auth.email')} type="email" placeholder={t('auth.emailPlaceholder')} value={formData.email} onChange={handleChange('email')} required />
        <FormInput label={t('auth.phoneNumber')} type="tel" placeholder={t('auth.phoneNumberPlaceholder')} value={formData.phoneNumber} onChange={handleChange('phoneNumber')} />
        <FormInput label={t('auth.emiratesId')} type="text" placeholder={t('auth.emiratesIdPlaceholder')} value={formData.emiratesId} onChange={handleChange('emiratesId')} />
        <FormInput label={t('auth.password')} type="password" placeholder="••••••••••••" value={formData.password} onChange={handleChange('password')} required />

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-[44px] text-[15px] text-white font-bold tracking-wide flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
            borderRadius: '29.455px',
            boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
          }}
        >
          {loading ? 'Creating…' : t('auth.signUp')}
          <ChevronRight size={18} strokeWidth={2.5} className="rtl:rotate-180" />
        </button>

        <p className="text-center text-xs text-white font-medium tracking-wide mt-1">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/MWQ/signin" className="text-[#19D9F3] font-bold tracking-wide hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
};

export default SignUp;
