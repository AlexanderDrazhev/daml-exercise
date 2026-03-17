import React from 'react';
import { cn } from '../../lib/utils';
import style from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <div className={cn(style.root, className)}>{children}</div>;
}

interface CardHeaderProps {
  title: string;
  subheader?: string;
  className?: string;
}

export function CardHeader({ title, subheader, className }: CardHeaderProps) {
  return (
    <div className={cn(style.header, className)}>
      <h3 className={style.headerTitle}>{title}</h3>
      {subheader && <p className={style.headerSubheader}>{subheader}</p>}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(style.content, className)}>{children}</div>;
}
