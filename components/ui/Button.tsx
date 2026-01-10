import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background';

        const variants = {
            primary: 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] focus:ring-primary',
            secondary: 'bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/30 hover:scale-[1.02] focus:ring-secondary',
            danger: 'bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/20 hover:shadow-danger/30 hover:scale-[1.02] focus:ring-danger',
            ghost: 'bg-surface hover:bg-surface-hover text-text-primary border border-border focus:ring-primary',
        };

        const sizes = {
            sm: 'px-4 py-2 text-xs',
            md: 'px-6 py-2.5 text-sm',       // Standard padding
            lg: 'px-8 py-3 text-base',       // Standard large padding
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';

export default Button;
