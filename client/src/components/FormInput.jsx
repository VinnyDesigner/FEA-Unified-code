import React from 'react';

const FormInput = React.forwardRef(({ label, type = 'text', rightIcon: RightIcon, onClickRightIcon, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-[5px] w-full">
      {label && <label className="text-[11px] sm:text-xs font-bold text-white tracking-wide">{label}</label>}
      <div className="relative w-full">
        <input
          type={type}
          ref={ref}
          className="w-full h-[40px] sm:h-[44px] px-3 sm:px-4 py-2 bg-transparent border border-[#009FAC] rounded-xl text-white text-xs sm:text-sm placeholder-gray-300 focus:outline-none focus:border-[#19D9F3] focus:ring-1 focus:ring-[#19D9F3] transition-all"
          {...props}
        />
        {RightIcon && (
          <button type="button" onClick={onClickRightIcon} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
            <RightIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
