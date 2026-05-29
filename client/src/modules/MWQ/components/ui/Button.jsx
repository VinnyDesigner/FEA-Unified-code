import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-accent text-primary-dark hover:bg-accent-hover px-4 py-2 shadow",
    outline: "border border-accent text-accent hover:bg-accent hover:text-primary-dark px-4 py-2",
    ghost: "hover:bg-primary-light hover:text-surface text-text-main px-4 py-2",
    icon: "p-2 hover:bg-primary-light rounded-full text-text-main",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
