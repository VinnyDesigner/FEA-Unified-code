import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';

const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <AuthCard 
      title="Forgot Password?" 
      subtitle="Enter your email to receive a password reset code."
    >
      <form 
        className="w-full flex flex-col gap-5" 
        onSubmit={(e) => {
          e.preventDefault();
          navigate('/verify-otp');
        }}
      >
        <FormInput 
          label="Email" 
          type="email" 
          placeholder="admin@fea.gov.ae" 
        />

        <button 
          type="submit"
          className="w-full mt-4 h-[44px] text-[15px] text-white font-bold tracking-wide flex items-center justify-center gap-1 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'radial-gradient(50% 50% at 50% 50%, #1DCDDD 0%, #009FAC 100%)',
            borderRadius: '29.455px',
            boxShadow: '0 0 70px 0 rgba(0, 159, 172, 0.40), 0 0 1px 4px rgba(255, 255, 255, 0.10), 0 -4px 2px 0 rgba(0, 0, 0, 0.25) inset, 0 2px 1px 0 rgba(255, 255, 255, 0.25) inset'
          }}
        >
          Send OTP
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>

        <Link 
          to="/signin" 
          className="flex items-center justify-center gap-2 mt-2 text-xs text-white font-bold tracking-wide hover:text-[#19D9F3] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          Back to Login
        </Link>
      </form>
    </AuthCard>
  );
};

export default ForgotPassword;
