import { cn } from '@/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
    const variants = {
        default: 'bg-primary/20 text-primary border-primary/30',
        success: 'bg-success/20 text-success border-success/30',
        warning: 'bg-warning/20 text-warning border-warning/30',
        danger: 'bg-danger/20 text-danger border-danger/30',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
