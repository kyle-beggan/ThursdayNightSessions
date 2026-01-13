import { useContext, useMemo } from 'react';
import { ToastContext } from '@/providers/ToastProvider';

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    const { addToast } = context;

    return useMemo(() => ({
        success: (message: string) => addToast(message, 'success'),
        error: (message: string) => addToast(message, 'error'),
        info: (message: string) => addToast(message, 'info'),
    }), [addToast]);
}
