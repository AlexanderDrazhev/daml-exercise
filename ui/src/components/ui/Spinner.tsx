import React from 'react';
import { cn } from '../../lib/utils';
import style from './Spinner.module.css';

const SIZES = ['sm', 'md', 'lg'] as const;
type SpinnerSize = (typeof SIZES)[number];

interface SpinnerProps {
  className?: string;
  size?: SpinnerSize;
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <div
      className={cn(style.root, style[size], className)}
      role="status"
      aria-label="Loading"
    />
  );
}
