import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/editor', label: 'Editor', icon: '✏️' },
    { path: '/patterns', label: 'Patterns', icon: '🎵' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <header className="flex-shrink-0 border-b border-border bg-background-secondary" style={{ background: 'linear-gradient(to bottom, #18181d, #141417)' }}>
      <div className="flex items-center justify-between px-3 sm:px-6 py-3">
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-bold text-accent tracking-tight hidden sm:block">ASCII Sequencer</h1>
          <h1 className="text-lg font-bold text-accent tracking-tight sm:hidden">ASQ</h1>
          <span className="text-[10px] text-foreground-muted bg-background-tertiary px-1.5 py-0.5 rounded font-mono hidden sm:inline">
            v0.1.0
          </span>
        </div>

        <nav className="flex items-center space-x-0.5 sm:space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'btn btn-ghost btn-sm',
                location.pathname === item.path && 'bg-background-tertiary'
              )}
            >
              <span className="md:mr-2">{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {user && (
            <span className="text-xs text-foreground-muted truncate max-w-[120px] sm:max-w-[180px] hidden sm:inline" title={user.email}>
              {user.email}
            </span>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={signOut}
            title="Sign out"
          >
            <span className="sm:mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </span>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
