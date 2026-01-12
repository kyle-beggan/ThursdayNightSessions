'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function FeedbackPage() {
    const [category, setCategory] = useState('feature_request');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, message })
            });

            if (res.ok) {
                setSubmitted(true);
                setMessage('');
                setCategory('feature_request');
            } else {
                setError('Failed to submit feedback. Please try again.');
            }
        } catch (err) {
            console.error('Feedback submission error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in duration-500">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8">
                    <div className="text-4xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Thank you!</h2>
                    <p className="text-text-secondary mb-6">
                        Your feedback has been received. We appreciate your help in making this app better for the band!
                    </p>
                    <Button
                        onClick={() => setSubmitted(false)}
                        variant="primary"
                    >
                        Submit Another
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Feedback & Suggestions</h1>
                <p className="text-text-secondary">
                    Have an idea for a new feature? Found a bug? Let us know!
                </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 md:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label htmlFor="category" className="block text-sm font-medium text-text-primary">
                            Category
                        </label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                            <option value="feature_request">💡 Feature Request</option>
                            <option value="bug">🐛 Bug Report</option>
                            <option value="general">💭 General Comment</option>
                            <option value="other">❓ Other</option>
                        </select>
                    </div>

                    {/* Message Area */}
                    <div className="space-y-2">
                        <label htmlFor="message" className="block text-sm font-medium text-text-primary">
                            Your Message
                        </label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your idea or issue in detail..."
                            rows={6}
                            required
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || !message.trim()}
                            className="px-8 py-2.5"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Feedback'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Context/Help Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-surface/50 rounded-lg border border-border">
                    <div className="text-xl mb-2">💡</div>
                    <h4 className="font-bold text-text-primary mb-1">Feature Requests</h4>
                    <p className="text-xs text-text-secondary">Suggest new tools or improvements for managing sessions, songs, or setlists.</p>
                </div>
                <div className="p-4 bg-surface/50 rounded-lg border border-border">
                    <div className="text-xl mb-2">🐛</div>
                    <h4 className="font-bold text-text-primary mb-1">Bug Reports</h4>
                    <p className="text-xs text-text-secondary">Something broken? Let us know what happened and how to reproduce it.</p>
                </div>
                <div className="p-4 bg-surface/50 rounded-lg border border-border">
                    <div className="text-xl mb-2">🚀</div>
                    <h4 className="font-bold text-text-primary mb-1">Future Limits</h4>
                    <p className="text-xs text-text-secondary">We're constantly updating. Your input helps prioritize what gets built next!</p>
                </div>
            </div>
        </div>
    );
}
