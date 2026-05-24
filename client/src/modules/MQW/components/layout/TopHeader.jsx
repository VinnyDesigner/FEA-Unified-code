import React from 'react';
import { Search, Bell, Globe } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const TopHeader = () => {
  return (
    <header className="h-20 bg-surface border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="w-96">
        <Input 
          icon={Search} 
          placeholder="Search for projects, stations, or metrics..." 
          className="bg-background border-none rounded-full"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="icon">
          <Globe size={20} className="text-text-muted" />
        </Button>
        <div className="relative">
          <Button variant="icon">
            <Bell size={20} className="text-text-muted" />
          </Button>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </div>
        
        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-text-main">Bhavani</p>
            <p className="text-xs text-text-muted">Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center font-bold">
            B
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
