'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [dialogConfig, setDialogConfig] = useState<ConfirmOptions | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions) => {
        console.log('ConfirmProvider: confirm called', options);
        setDialogConfig(options);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            console.log('ConfirmProvider: setting resolver');
            setResolver(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        console.log('ConfirmProvider: handleConfirm called, resolver exists?', !!resolver);
        if (resolver) {
            resolver(true);
            console.log('ConfirmProvider: resolved true');
        }
        setIsOpen(false);
    };

    const handleCancel = () => {
        console.log('ConfirmProvider: handleCancel called');
        if (resolver) resolver(false);
        setIsOpen(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {dialogConfig && (
                <ConfirmDialog
                    isOpen={isOpen}
                    title={dialogConfig.title}
                    message={dialogConfig.message}
                    confirmLabel={dialogConfig.confirmLabel}
                    cancelLabel={dialogConfig.cancelLabel}
                    variant={dialogConfig.variant}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
