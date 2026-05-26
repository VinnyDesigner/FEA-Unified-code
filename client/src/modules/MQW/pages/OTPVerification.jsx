import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthCard from '../components/AuthCard';

const OTPVerification = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const [otp, setOtp] = useState(['', '', '', '']);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  return (
    <AuthCard 
      title={t('auth.enterYourPasscode')} 
      subtitle={t('auth.otpSentSubtitle')}
    >
      <form 
        className="w-full flex flex-col gap-6" 
        onSubmit={(e) => {
          e.preventDefault();
          navigate('/MQW/reset-password');
        }}
      >
        <div className="flex justify-between w-full gap-4 mt-4" dir="ltr">
          {[0, 1, 2, 3].map((index) => {
            const hasValue = otp[index] !== '';
            return (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                maxLength="1"
                placeholder="-"
                value={otp[index]}
                className={`w-12 h-12 sm:w-[70px] sm:h-[70px] text-center text-xl sm:text-2xl font-bold text-white transition-all focus:outline-none placeholder-gray-400
                  ${hasValue 
                    ? 'bg-[#1A454A] border border-[#009FAC] rounded-xl sm:rounded-2xl shadow-lg' 
                    : 'bg-transparent border-b-2 border-white rounded-none'
                  }
                `}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            );
          })}
        </div>

        <div className="text-center flex flex-col gap-1 mt-2">
          <p className="text-[13px] text-white font-medium tracking-wide">
            {t('auth.codeExpiresIn')} : <span className="text-[#19D9F3]">00 : 02</span>
          </p>
          <p className="text-[13px] text-white font-medium tracking-wide">
            {t('auth.didNotReceiveCode')}{' '}
            <button type="button" className="text-[#19D9F3] hover:underline cursor-pointer bg-transparent border-none outline-none font-bold">
              {t('auth.resendCode')}
            </button>
          </p>
        </div>

        <button 
          type="submit"
          className="w-full mt-4 h-[44px] text-[15px] text-white font-bold tracking-wide flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
            borderRadius: '29.455px',
            boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
          }}
        >
          {t('auth.verify')}
          <ChevronRight size={18} strokeWidth={2.5} className="rtl:rotate-180" />
        </button>

        <Link 
          to="/MQW/signin" 
          className="flex items-center justify-center gap-2 mt-1 text-xs text-white font-bold tracking-wide hover:text-[#19D9F3] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2.5} className="rtl:rotate-180" />
          {t('auth.backToLogin')}
        </Link>
      </form>
    </AuthCard>
  );
};

export default OTPVerification;
