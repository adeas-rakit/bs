
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  className?: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  className,
  icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed bg-gray-50/50 dark:bg-gray-900 p-12 text-center',
        className
      )}
    >
      {icon && React.isValidElement(icon) && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          {(() => {
            const iconElement = icon as React.ReactElement<any>;
            return React.cloneElement(iconElement, {
              className: cn('h-10 w-10', iconElement.props.className),
            });
          })()}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
