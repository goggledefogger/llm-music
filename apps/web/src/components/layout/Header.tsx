import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export const Header: React.FC = () => {
  const location = useLocation();

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
          <button className="btn btn-ghost btn-sm">
            <span className="sm:mr-2">🎧</span>
            <span className="hidden sm:inline">Audio</span>
          </button>
          <button className="btn btn-ghost btn-sm">
            <span className="sm:mr-2">🤖</span>
            <span className="hidden sm:inline">AI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
