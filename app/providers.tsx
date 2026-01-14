'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

import { ToastProvider } from '@/providers/ToastProvider';
import { ConfirmProvider } from '@/providers/ConfirmProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <ToastProvider>
                    <ConfirmProvider>
                        {children}
                    </ConfirmProvider>
                </ToastProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
