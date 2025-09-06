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
    <header className="border-b border-border bg-background-secondary">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-accent">ASCII Sequencer</h1>
          <span className="text-xs text-foreground-muted bg-background-tertiary px-2 py-1 rounded">
            v0.1.0
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'btn btn-ghost btn-sm',
                location.pathname === item.path && 'bg-background-tertiary'
              )}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <button className="btn btn-ghost btn-sm">
            <span className="mr-2">🎧</span>
            Audio
          </button>
          <button className="btn btn-ghost btn-sm">
            <span className="mr-2">🤖</span>
            AI
          </button>
        </div>
      </div>
    </header>
  );
};
