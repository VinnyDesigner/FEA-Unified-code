import React from 'react';
import { ChevronDown } from 'lucide-react';

const LanguageSelector = () => {
  return (
    <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-400 bg-transparent text-white hover:bg-white/10 transition-colors">
      <span className="text-sm font-medium">English</span>
      <ChevronDown size={16} />
    </button>
  );
};

export default LanguageSelector;
