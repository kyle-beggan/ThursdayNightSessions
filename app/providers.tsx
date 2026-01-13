'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

import { ConfirmProvider } from '@/providers/ConfirmProvider';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ToastProvider>
                <ConfirmProvider>
                    {children}
                </ConfirmProvider>
            </ToastProvider>
        </SessionProvider>
    );
}
