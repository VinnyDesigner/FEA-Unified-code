import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';
import { useAuthStore } from '../../../stores/useAuthStore';

const SignIn = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login('MWQ', email, password);
      navigate('/MWQ/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={t('auth.welcomeBack')}
      subtitle={t('auth.welcomeSubtitle')}
    >
      <form className="w-full flex flex-col gap-3 sm:gap-5" onSubmit={handleSubmit}>
        <FormInput
          label={t('auth.email')}
          type="email"
          placeholder="admin@fea.gov.ae"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <FormInput
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightIcon={showPassword ? Eye : EyeOff}
          onClickRightIcon={() => setShowPassword(!showPassword)}
          required
        />

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <div className="flex items-center justify-between mt-[-4px]">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="w-[14px] h-[14px] rounded-[3px] border border-[#009FAC] flex items-center justify-center bg-transparent group-hover:border-[#19D9F3] transition-colors relative">
              <input type="checkbox" className="opacity-0 absolute w-full h-full cursor-pointer" />
            </div>
            <span className="text-xs font-medium text-white tracking-wide">{t('auth.rememberMe')}</span>
          </label>
          <Link to="/MWQ/forgot-password" className="text-xs font-bold text-white hover:underline hover:text-[#19D9F3] transition-colors tracking-wide underline underline-offset-2">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 sm:mt-4 h-[40px] sm:h-[44px] text-[13px] sm:text-[15px] text-white font-bold tracking-wide flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
            borderRadius: '29.455px',
            boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
          }}
        >
          {loading ? t('auth.loggingIn') || 'Logging in…' : t('auth.login')}
          <ChevronRight size={18} strokeWidth={2.5} className="rtl:rotate-180" />
        </button>

        <p className="text-center text-[11px] sm:text-xs text-white font-medium tracking-wide mt-1 sm:mt-2">
          {t('auth.noAccount')}{' '}
          <Link to="/MWQ/signup" className="text-[#19D9F3] font-bold tracking-wide hover:underline">
            {t('auth.signUp')}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
};

export default SignIn;
