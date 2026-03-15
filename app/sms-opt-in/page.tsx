'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { FaSpinner, FaCheckCircle } from 'react-icons/fa';

export default function SMSOptInPage() {
    const { status, update: updateSession } = useSession();
    const router = useRouter();
    const toast = useToast();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            setLoading(false);
            return;
        }

        if (status === 'authenticated') {
            fetchProfile();
        }
    }, [status]);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const data = await response.json();
                if (data.text_opt_in) {
                    setAgreed(true);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/sms-opt-in');
            return;
        }

        if (!agreed) {
            toast.error('You must agree to the terms to opt-in.');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text_opt_in: true
                })
            });

            if (response.ok) {
                await updateSession();
                toast.success('You have successfully opted-in to SMS notifications!');
                router.push('/profile');
            } else {
                toast.error('Failed to update opt-in status.');
            }
        } catch (error) {
            console.error('Error updating opt-in:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <FaSpinner className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-10 px-4 pb-20">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Sleepy Hollows SMS Opt-in</h1>
            
            <div className="bg-surface border border-border shadow-sm rounded-xl p-6 md:p-8 space-y-6">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 italic text-text-primary text-sm">
                    &quot;By providing your mobile phone number, you consent to receive informational text messages from Sleepy Hollows related to your account activity, notifications, and updates. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for assistance.&quot;
                </div>

                <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-surface-hover transition-colors group">
                        <div className="mt-1">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-text-primary">
                                I agree to receive informational text messages from Sleepy Hollows at the number provided in my profile.
                            </p>
                            <p className="text-xs text-text-secondary">
                                You can unsubscribe or manage your preferences at any time from your profile page.
                            </p>
                        </div>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
                        <button
                            onClick={handleConfirm}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-all disabled:opacity-50"
                        >
                            {saving ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaCheckCircle className="h-4 w-4" />}
                            {saving ? 'Confirming...' : (status === 'authenticated' ? 'Confirm SMS Opt-in' : 'Log in to Opt-in')}
                        </button>
                        
                        <Link
                            href="/profile"
                            className="flex-1 flex items-center justify-center rounded-lg bg-surface border border-border px-6 py-3 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-hover transition-all"
                        >
                            Cancel and Return to Profile
                        </Link>
                    </div>
                </div>

                <div className="pt-6 border-t border-border text-center space-y-2">
                    <p className="text-xs text-text-secondary font-medium italic">
                        By clicking &quot;Confirm&quot;, you acknowledge that you have read and agree to our 
                        <Link href="/terms" className="text-primary hover:underline mx-1 font-bold">Terms and Conditions</Link> 
                        and 
                        <Link href="/privacy" className="text-primary hover:underline mx-1 font-bold">Privacy Policy</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
