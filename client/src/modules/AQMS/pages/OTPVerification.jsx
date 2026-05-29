import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import AuthLayout from '../components/AuthLayout';
import * as queries from '../../../lib/queries';

const OTPVerification = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [timer, setTimer] = useState(300);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) otpInputRefs[index + 1].current.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpInputRefs[index - 1].current.focus();
  };

  const handleResendCode = async () => {
    try {
      await queries.forgotPassword({ module: 'AQMS', body: { email } });
      setOtp(['', '', '', '']);
      setTimer(300);
      if (otpInputRefs[0].current) otpInputRefs[0].current.focus();
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await queries.verifyOtp({ module: 'AQMS', body: { email, code: otp.join('') } });
      navigate(`/AQMS/reset-password?token=${encodeURIComponent(data.resetToken)}&email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-header">
        <h2>{t('login.enterYourPasscode')}</h2>
        <p>{t('login.otpSentSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-between w-full gap-4 mt-2 mb-6" dir="ltr" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3].map((index) => {
            const hasValue = otp[index] !== '';
            return (
              <input
                key={index}
                ref={otpInputRefs[index]}
                type="text"
                maxLength="1"
                placeholder="-"
                value={otp[index]}
                style={{
                  width: '64px', height: '64px', textAlign: 'center', fontSize: '1.4rem', fontWeight: '700',
                  color: 'white',
                  background: hasValue ? 'rgba(0, 159, 172, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  border: hasValue ? '1px solid #009fac' : '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px', outline: 'none',
                  boxShadow: hasValue ? '0 0 15px rgba(0, 159, 172, 0.3)' : 'none',
                  transition: 'all 0.2s', boxSizing: 'border-box'
                }}
                onChange={(e) => handleOtpChange(e, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
              />
            );
          })}
        </div>

        <div className="text-center flex flex-col gap-1 mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
            {t('login.codeExpiresIn')} : <span style={{ color: '#5ef0ff', fontWeight: 700 }}>{formatTimer(timer)}</span>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
            {t('login.didNotReceiveCode')}{' '}
            <button type="button" onClick={handleResendCode} style={{ background: 'none', border: 'none', color: '#5ef0ff', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              {t('login.resendCode')}
            </button>
          </p>
        </div>

        {error && <p style={{ color: '#f87171', fontSize: '12px', textAlign: 'center', margin: '8px 0' }}>{error}</p>}

        <button type="submit" className="login-btn" style={{ marginBottom: '20px' }} disabled={loading || otp.some((v) => !v)}>
          {loading ? 'Verifying…' : t('login.verify')}
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

export default OTPVerification;
