import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Login = () => {
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot' | 'otp' | 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { lang, toggleLanguage, t } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── OTP State ──────────────────────────────────────────────────
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [timer, setTimer] = useState(120); // 2 minutes in seconds

  useEffect(() => {
    let interval = null;
    if (view === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpInputRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs[index - 1].current.focus();
    }
  };

  const handleResendCode = () => {
    setOtp(['', '', '', '']);
    setTimer(120);
    if (otpInputRefs[0].current) {
      otpInputRefs[0].current.focus();
    }
  };

  // ── Form Submissions ───────────────────────────────────────────
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    navigate('/AQMS/live-data');
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setView('login');
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setView('otp');
    setTimer(120);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setView('reset');
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setView('login');
  };

  return (
    <div className="login-container" style={{ direction: 'ltr' }}>
      <div className="bg-overlay"></div>

      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div className="login-panel" style={{ 
        position: 'relative',
        paddingTop: isMobile ? '76px' : '96px', // Keep padding clean since elements are absolute-positioned at top
        direction: lang === 'ar' ? 'rtl' : 'ltr'
      }}>
        
        {/* Logo and Language Toggle Inline Row (Always Side-by-Side) */}
        <div className="login-header-bar" style={{
          display: 'flex',
          flexDirection: 'row', // Force side-by-side always
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'absolute',
          top: '24px',
          left: '32px',
          right: '32px',
          boxSizing: 'border-box',
          zIndex: 100
        }}>
          {/* Logo Container */}
          <div className="login-logo-area" style={{ margin: 0, width: 'auto', flexShrink: 1 }}>
            <img 
              src="/assets/AQMS/logo.png" 
              alt="Logo" 
              className="login-logo-img" 
              style={{ 
                display: 'block', 
                height: isMobile ? '36px' : '48px', // Reduced width/height to make some room on mobile
                width: 'auto',
                maxWidth: '60vw',
                objectFit: 'contain'
              }} 
            />
          </div>

          {/* Premium Sliding Compact Language Switcher Toggle */}
          <div 
            className={`lang-switcher-container ${lang}`}
            onClick={toggleLanguage}
            style={{
              width: '64px', // Compact width
              height: '28px', // Compact height
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              padding: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
              direction: 'ltr', // Force LTR for layout alignment inside toggle knob
              flexShrink: 0
            }}
            title="Change Language / تغيير اللغة"
          >
            {lang === 'en' && (
              <span 
                style={{
                  position: 'absolute',
                  left: '8px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: '700',
                  fontSize: '10px',
                  zIndex: 1
                }}
              >
                ع
              </span>
            )}
            {lang === 'ar' && (
              <span 
                style={{
                  position: 'absolute',
                  right: '8px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: '700',
                  fontSize: '9px',
                  fontFamily: "'Roboto', sans-serif",
                  zIndex: 1
                }}
              >
                En
              </span>
            )}
            <div 
              style={{
                position: 'absolute',
                top: '1px',
                left: '1px',
                width: '24px', // Compact knob width
                height: '24px', // Compact knob height
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00b8c8 0%, #008c9a 100%)',
                border: '1px solid rgba(0, 0, 0, 0.15)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: lang === 'en' ? 'translateX(36px)' : 'translateX(0)', // Compact sliding offset
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <span 
                style={{
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '10px',
                  lineHeight: 1
                }}
              >
                {lang === 'en' ? 'En' : 'ع'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Wrap */}
        <div className="login-form-wrapper">

          {/* ────────────────────────────────────────────────────────
              1. LOGIN VIEW
          ──────────────────────────────────────────────────────── */}
          {view === 'login' && (
            <>
              <div className="login-header">
                <h2>{t('login.title')}</h2>
                <p>{t('login.subtitle')}</p>
              </div>

              <form onSubmit={handleLoginSubmit}>
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
                    onClick={() => setView('forgot')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {t('login.forgot_password')}
                  </button>
                </div>

                <button type="submit" className="login-btn">
                  {t('login.title')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </form>

              <div className="signup-link">
                {t('login.no_account')}{' '}
                <button 
                  type="button" 
                  onClick={() => setView('signup')} 
                  style={{ background: 'none', border: 'none', color: '#5ef0ff', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {t('login.sign_up')}
                </button>
              </div>
            </>
          )}

          {/* ────────────────────────────────────────────────────────
              2. SIGNUP VIEW
          ──────────────────────────────────────────────────────── */}
          {view === 'signup' && (
            <>
              <div className="login-header">
                <h2>{t('login.createAnAccount')}</h2>
                <p>{t('login.joinPlatform')}</p>
              </div>

              <form onSubmit={handleSignUpSubmit}>
                <div className="signup-scrollable-form" style={{
                  maxHeight: '42vh',
                  overflowY: 'auto',
                  paddingInlineEnd: '4px',
                  marginBottom: '16px'
                }}>
                  <div className="form-group">
                    <label className="input-label">{t('login.firstName')}</label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder={t('login.firstNamePlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">{t('login.lastName')}</label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder={t('login.lastNamePlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">{t('login.email')}</label>
                    <input
                      type="email"
                      className="input-glass"
                      placeholder={t('login.emailPlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">{t('login.phoneNumber')}</label>
                    <input
                      type="tel"
                      className="input-glass"
                      placeholder={t('login.phoneNumberPlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">{t('login.emiratesId')}</label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder={t('login.emiratesIdPlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">{t('login.password')}</label>
                    <input
                      type="password"
                      className="input-glass"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn">
                  {t('login.createAnAccount')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </form>

              <div className="signup-link" style={{ marginTop: '12px' }}>
                {t('login.alreadyHaveAccount')}{' '}
                <button 
                  type="button" 
                  onClick={() => setView('login')} 
                  style={{ background: 'none', border: 'none', color: '#5ef0ff', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  {t('login.title')}
                </button>
              </div>
            </>
          )}

          {/* ────────────────────────────────────────────────────────
              3. FORGOT PASSWORD VIEW
          ──────────────────────────────────────────────────────── */}
          {view === 'forgot' && (
            <>
              <div className="login-header">
                <h2>{t('login.forgotPasswordTitle')}</h2>
                <p>{t('login.forgotPasswordSubtitle')}</p>
              </div>

              <form onSubmit={handleForgotSubmit}>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="input-label">{t('login.email')}</label>
                  <input
                    type="email"
                    className="input-glass"
                    placeholder="admin@fea.gov.ae"
                    required
                  />
                </div>

                <button type="submit" className="login-btn" style={{ marginBottom: '20px' }}>
                  {t('login.sendOtp')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </form>

              <div className="signup-link">
                <button 
                  type="button" 
                  onClick={() => setView('login')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'white', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    padding: 0, 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'en' ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  {t('login.backToLogin')}
                </button>
              </div>
            </>
          )}

          {/* ────────────────────────────────────────────────────────
              4. OTP VERIFICATION VIEW
          ──────────────────────────────────────────────────────── */}
          {view === 'otp' && (
            <>
              <div className="login-header">
                <h2>{t('login.enterYourPasscode')}</h2>
                <p>{t('login.otpSentSubtitle')}</p>
              </div>

              <form onSubmit={handleOtpSubmit}>
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
                          width: '64px',
                          height: '64px',
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          fontWeight: '700',
                          color: 'white',
                          background: hasValue ? 'rgba(0, 159, 172, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                          border: hasValue ? '1px solid #009fac' : '1px solid rgba(255, 255, 255, 0.25)',
                          borderRadius: '12px',
                          outline: 'none',
                          boxShadow: hasValue ? '0 0 15px rgba(0, 159, 172, 0.3)' : 'none',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box'
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
                    <button 
                      type="button" 
                      onClick={handleResendCode}
                      style={{ background: 'none', border: 'none', color: '#5ef0ff', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      {t('login.resendCode')}
                    </button>
                  </p>
                </div>

                <button type="submit" className="login-btn" style={{ marginBottom: '20px' }}>
                  {t('login.verify')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </form>

              <div className="signup-link">
                <button 
                  type="button" 
                  onClick={() => setView('login')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'white', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    padding: 0, 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'en' ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  {t('login.backToLogin')}
                </button>
              </div>
            </>
          )}

          {/* ────────────────────────────────────────────────────────
              5. RESET PASSWORD VIEW
          ──────────────────────────────────────────────────────── */}
          {view === 'reset' && (
            <>
              <div className="login-header">
                <h2>{t('login.resetPasswordTitle')}</h2>
                <p>{t('login.resetPasswordSubtitle')}</p>
              </div>

              <form onSubmit={handleResetSubmit}>
                <div className="form-group">
                  <label className="input-label">{t('login.newPassword')}</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-glass"
                    placeholder="••••••••••••"
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

                <div className="form-group" style={{ marginBottom: '28px' }}>
                  <label className="input-label">{t('login.confirmPassword')}</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-glass"
                    placeholder="••••••••••••"
                    required
                  />
                  <div 
                    className="password-toggle" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: lang === 'en' ? '12px' : 'auto',
                      left: lang === 'ar' ? '12px' : 'auto',
                      bottom: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {showConfirmPassword ? (
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

                <button type="submit" className="login-btn" style={{ marginBottom: '20px' }}>
                  {t('login.updatePassword')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </form>

              <div className="signup-link">
                <button 
                  type="button" 
                  onClick={() => setView('login')} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'white', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    padding: 0, 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === 'en' ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                  {t('login.backToLogin')}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
