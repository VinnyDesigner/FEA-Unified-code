import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import FormInput from '../components/FormInput';

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthCard 
      title="Create an Account" 
      subtitle="Join the environmental monitoring platform."
    >
      <form className="w-full flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <FormInput 
          label="Full Name" 
          type="text" 
          placeholder="Bhavani" 
        />
        
        <FormInput 
          label="Email" 
          type="email" 
          placeholder="admin@fea.gov.ae" 
        />
        
        <FormInput 
          label="Password" 
          type={showPassword ? "text" : "password"} 
          placeholder="••••••••••••"
          rightIcon={showPassword ? Eye : EyeOff}
          onClickRightIcon={() => setShowPassword(!showPassword)}
        />

        <FormInput 
          label="Confirm Password" 
          type={showPassword ? "text" : "password"} 
          placeholder="••••••••••••"
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
          Sign Up
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>

        <p className="text-center text-xs text-white font-medium tracking-wide mt-1">
          Already have an account? <Link to="/signin" className="text-[#19D9F3] font-bold tracking-wide hover:underline">Sign In</Link>
        </p>
      </form>
    </AuthCard>
  );
};

export default SignUp;
