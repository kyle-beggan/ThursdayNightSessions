'use client';

import Button from '@/components/ui/Button';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { useTheme } from '@/providers/ThemeProvider';
import { useEffect, useState } from 'react';

export default function PendingPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full text-center space-y-8 bg-surface border border-border p-8 rounded-2xl shadow-xl">

                {/* Logo or Icon */}
                <div className="mx-auto w-24 h-24 relative mb-6">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className={`object-contain ${mounted && theme === 'light' ? 'invert' : ''}`}
                        priority
                    />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-text-primary">Account Under Review</h1>

                    <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                        <p className="text-text-secondary leading-relaxed">
                            Thanks for joining! Your account request has been received and is currently being reviewed by an administrator.
                        </p>
                    </div>

                    <p className="text-sm text-text-secondary">
                        You will receive an email once your account has been approved.
                        <br />
                        Please check back shortly.
                    </p>
                </div>

                <div className="pt-4 border-t border-border">
                    <Button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        variant="secondary"
                        className="w-full"
                    >
                        Return to Login
                    </Button>
                </div>
            </div>
        </div>
    );
}
