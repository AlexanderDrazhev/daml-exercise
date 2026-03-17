import React from 'react';
import { cn } from '../../lib/utils';
import style from './Button.module.css';

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost'] as const;
const SIZES = ['default', 'sm', 'lg'] as const;

type ButtonVariant = (typeof VARIANTS)[number];
type ButtonSize = (typeof SIZES)[number];

interface ButtonProps extends React.ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(style.root, style[variant], style[size], className)}
      {...props}
    />
  );
}
