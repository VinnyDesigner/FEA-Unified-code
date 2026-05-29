import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';
import * as queries from '../../../lib/queries';

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const resetToken = searchParams.get('token') || '';
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
      await queries.resetPassword({ module: 'MWQ', body: { email, resetToken, newPassword } });
      navigate('/MWQ/signin');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={t('auth.resetPassword')} subtitle={t('auth.resetPasswordSubtitle')}>
      <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
        <FormInput
          label={t('auth.newPassword')}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          rightIcon={showPassword ? Eye : EyeOff}
          onClickRightIcon={() => setShowPassword(!showPassword)}
          required
        />

        <FormInput
          label={t('auth.confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 h-[44px] text-[15px] text-white font-bold tracking-wide flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
            borderRadius: '29.455px',
            boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
          }}
        >
          {loading ? 'Updating…' : t('auth.updatePassword')}
          <ChevronRight size={18} strokeWidth={2.5} className="rtl:rotate-180" />
        </button>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
