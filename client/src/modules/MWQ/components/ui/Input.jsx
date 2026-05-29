import React from 'react';

const Input = React.forwardRef(({ className = '', type = 'text', icon: Icon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        className={`w-full rounded-md border border-gray-300 bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-shadow ${
          Icon ? 'pl-10' : ''
        } ${className}`}
        ref={ref}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
