import React from 'react';

interface BaseVisualizationProps {
  children: React.ReactNode;
  className?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'ultra-compact';
}

export const BaseVisualization: React.FC<BaseVisualizationProps> = ({
  children,
  className = '',
  description,
  variant = 'ultra-compact'
}) => {
  const variantClasses = {
    'default': 'viz-default',
    'compact': 'viz-compact', 
    'ultra-compact': 'viz-ultra-compact'
  };

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {description && (
        <div className="viz-description">
          {description}
        </div>
      )}
      <div className="viz-content">
        {children}
      </div>
    </div>
  );
};
