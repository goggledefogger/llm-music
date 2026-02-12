import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/editor', label: 'Editor', icon: '✏️' },
    { path: '/patterns', label: 'Patterns', icon: '🎵' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className={clsx(
      'hidden lg:block bg-background-secondary border-r border-border transition-all duration-300 flex-shrink-0',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-ghost btn-sm w-full justify-start"
          >
            <span className="text-lg">🎼</span>
            {!isCollapsed && <span className="ml-2">ASCII Sequencer</span>}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'btn btn-ghost btn-sm w-full justify-start',
                location.pathname === item.path && 'bg-background-tertiary',
                isCollapsed && 'justify-center'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && <span className="ml-2">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-foreground-muted">
            {!isCollapsed && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Status: Ready
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  Audio: Connected
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                  AI: Available
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
