'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { FaSpinner, FaCheckCircle, FaMobileAlt } from 'react-icons/fa';

export default function SMSOptInPage() {
    const { status, update: updateSession } = useSession();
    const router = useRouter();
    const toast = useToast();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const [isOptedIn, setIsOptedIn] = useState(false);

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
                setIsOptedIn(!!data.text_opt_in);
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

    const handleUpdateOptIn = async (shouldOptIn: boolean) => {
        if (shouldOptIn && !agreed) {
            toast.error('You must agree to the terms to opt-in.');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text_opt_in: shouldOptIn
                })
            });

            if (response.ok) {
                await updateSession();
                setIsOptedIn(shouldOptIn);
                toast.success(shouldOptIn 
                    ? 'You have successfully opted-in to SMS notifications!' 
                    : 'You have successfully opted-out of SMS notifications.');
                router.push('/profile');
            } else {
                toast.error(`Failed to ${shouldOptIn ? 'opt-in' : 'opt-out'}.`);
            }
        } catch (error) {
            console.error('Error updating opt-in:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirm = async () => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/sms-opt-in');
            return;
        }
        await handleUpdateOptIn(true);
    };

    const handleOptOut = async () => {
        if (status === 'unauthenticated') return;
        await handleUpdateOptIn(false);
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
            <h1 className="text-3xl font-bold text-text-primary mb-2">Sleepy Hollows SMS Consent</h1>
            
            <div className="bg-surface border border-border shadow-sm rounded-xl p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-surface-secondary/50 rounded-lg border border-border">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-text-primary">Current Status</p>
                        <p className={`text-sm font-medium ${isOptedIn ? 'text-green-500' : 'text-text-secondary'}`}>
                            {isOptedIn ? 'Opted In' : 'Not Opted In'}
                        </p>
                    </div>
                </div>

                <div className="bg-surface-secondary/30 rounded-lg border border-border p-5 space-y-3 shadow-inner">
                    <div className="flex items-center gap-2.5 text-primary">
                        <FaMobileAlt className="h-4.5 w-4.5" />
                        <span className="text-sm font-bold uppercase tracking-wider">Alternative: Quick Opt-in</span>
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed">
                        Text <code className="bg-primary/20 px-2 py-0.5 rounded font-mono font-bold text-primary border border-primary/20 shadow-sm mx-1">TIPTOE</code> to 
                        <span className="font-bold ml-1.5">(571) 500-4807</span> to opt in. 
                        You will receive a confirmation message from Sleepy Hollows.
                    </p>
                </div>

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
                                You can unsubscribe or manage your preferences at any time.
                            </p>
                        </div>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
                        {isOptedIn ? (
                            <button
                                onClick={handleOptOut}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-6 py-3 text-sm font-semibold text-red-500 shadow-sm hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                                {saving ? <FaSpinner className="h-4 w-4 animate-spin" /> : null}
                                {saving ? 'Updating...' : 'Revoke SMS Opt-in'}
                            </button>
                        ) : (
                            <button
                                onClick={handleConfirm}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-all disabled:opacity-50"
                            >
                                {saving ? <FaSpinner className="h-4 w-4 animate-spin" /> : <FaCheckCircle className="h-4 w-4" />}
                                {saving ? 'Confirming...' : (status === 'authenticated' ? 'Confirm SMS Opt-in' : 'Log in to Opt-in')}
                            </button>
                        )}
                        
                        <Link
                            href="/profile"
                            className="flex-1 flex items-center justify-center rounded-lg bg-surface border border-border px-6 py-3 text-sm font-semibold text-text-primary shadow-sm hover:bg-surface-hover transition-all"
                        >
                            Return to Profile
                        </Link>
                    </div>
                </div>

                <div className="pt-6 border-t border-border text-center space-y-2">
                    <p className="text-xs text-text-secondary font-medium italic">
                        By using this service, you acknowledge that you have read and agree to our 
                        <Link href="/terms" className="text-primary hover:underline mx-1 font-bold">Terms and Conditions</Link> 
                        and 
                        <Link href="/privacy" className="text-primary hover:underline mx-1 font-bold">Privacy Policy</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
