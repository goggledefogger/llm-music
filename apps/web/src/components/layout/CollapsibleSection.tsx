import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  icon?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
  icon,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  
  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggleExpanded = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className={`bg-background-secondary rounded-lg border border-border ${className}`}>
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className={`w-full flex items-center justify-between ultra-compact-padding text-left collapsible-header ${headerClassName}`}
      >
        <div className="flex items-center space-x-2">
          {icon && <span className="text-sm">{icon}</span>}
          <h3 className="ultra-compact-text font-semibold">{title}</h3>
        </div>
        <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border">
          <div className={`ultra-compact-padding ${contentClassName}`}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
