import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';

const SignUp = () => {
  const { t } = useTranslation();

  return (
    <AuthCard 
      title={t('auth.createAnAccount')} 
      subtitle={t('auth.joinPlatform')}
    >
      <form className="w-full flex flex-col gap-3.5" onSubmit={(e) => e.preventDefault()}>
        <FormInput 
          label={t('auth.firstName')} 
          type="text" 
          placeholder={t('auth.firstNamePlaceholder')} 
        />
        
        <FormInput 
          label={t('auth.lastName')} 
          type="text" 
          placeholder={t('auth.lastNamePlaceholder')} 
        />
        
        <FormInput 
          label={t('auth.email')} 
          type="email" 
          placeholder={t('auth.emailPlaceholder')} 
        />
        
        <FormInput 
          label={t('auth.phoneNumber')} 
          type="tel" 
          placeholder={t('auth.phoneNumberPlaceholder')} 
        />

        <FormInput 
          label={t('auth.emiratesId')} 
          type="text" 
          placeholder={t('auth.emiratesIdPlaceholder')} 
        />

        <button 
          type="submit"
          className="w-full mt-2 h-[44px] text-[15px] text-white font-bold tracking-wide flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
            borderRadius: '29.455px',
            boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
          }}
        >
          {t('auth.signUp')}
          <ChevronRight size={18} strokeWidth={2.5} className="rtl:rotate-180" />
        </button>

        <p className="text-center text-xs text-white font-medium tracking-wide mt-1">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/MQW/signin" className="text-[#19D9F3] font-bold tracking-wide hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </form>
    </AuthCard>
  );
};

export default SignUp;
