import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'w-full px-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-secondary',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                        'transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error && 'border-danger focus:ring-danger',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-danger">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
