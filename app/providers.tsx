'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

import { ToastProvider } from '@/providers/ToastProvider';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ToastProvider>
                {children}
            </ToastProvider>
        </SessionProvider>
    );
}
