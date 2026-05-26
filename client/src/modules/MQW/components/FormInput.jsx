import React from 'react';

const FormInput = React.forwardRef(({ label, type = 'text', rightIcon: RightIcon, onClickRightIcon, ...props }, ref) => {
  const isRtl = document.documentElement.dir === 'rtl';

  return (
    <div className="flex flex-col gap-[5px] w-full">
      {label && <label className="text-[11px] sm:text-xs font-bold text-white tracking-wide">{label}</label>}
      <div className="relative w-full">
        <input
          type={type}
          ref={ref}
          className="w-full bg-transparent text-white text-xs sm:text-sm placeholder-gray-300 focus:outline-none focus:border-[#19D9F3] focus:ring-1 focus:ring-[#19D9F3] transition-all"
          style={{
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.30)',
            display: 'flex',
            height: '54px',
            padding: RightIcon 
              ? (isRtl ? '16px 20px 16px 45px' : '16px 45px 16px 20px') 
              : '16px 20px',
            alignItems: 'center',
            gap: '20px',
            alignSelf: 'stretch',
          }}
          {...props}
        />
        {RightIcon && (
          <button 
            type="button" 
            onClick={onClickRightIcon} 
            className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-white bg-transparent border-none outline-none cursor-pointer flex items-center justify-center`}
          >
            <RightIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
