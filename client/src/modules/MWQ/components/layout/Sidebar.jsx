import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Activity, Bell, Users, FolderKanban, FileText, Settings, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Monitoring', path: '/monitoring', icon: Activity },
  { name: 'Alerts', path: '/alerts', icon: Bell },
  { name: 'User Management', path: '/users', icon: Users },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-primary-dark text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3 border-b border-primary">
        <div className="w-10 h-10 bg-accent rounded-md flex items-center justify-center font-bold text-primary-dark text-xl">
          F
        </div>
        <div>
          <h2 className="font-bold leading-tight">Fujairah</h2>
          <p className="text-xs text-accent">Environment Authority</p>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive 
                  ? 'bg-primary text-accent font-medium' 
                  : 'text-gray-300 hover:bg-primary-light hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-primary">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-gray-300 hover:bg-primary-light hover:text-white rounded-md transition-colors">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
