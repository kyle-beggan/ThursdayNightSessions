'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';

interface FeedbackItem {
    id: string;
    category: string;
    message: string;
    status: string;
    created_at: string;
    user_name: string;
    upvotes: number;
    downvotes: number;
    user_vote: 'up' | 'down' | null;
    replies?: {
        id: string;
        message: string;
        created_at: string;
        user: { name: string };
    }[];
}

export default function FeedbackPage() {
    const { data: session } = useSession();
    const [category, setCategory] = useState('feature_request');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFeedback = useCallback(async () => {
        try {
            const res = await fetch('/api/feedback');
            if (res.ok) {
                const data = await res.json();
                setFeedbackList(data);
            }
        } catch (error) {
            console.error('Error fetching feedback:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (session?.user) {
            fetchFeedback();
        }
    }, [session, fetchFeedback]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, message })
            });

            if (res.ok) {
                setMessage('');
                setCategory('feature_request');
                fetchFeedback(); // Refresh list
                alert('Feedback submitted successfully!');
            } else {
                alert('Failed to submit feedback.');
            }
        } catch (err) {
            console.error('Feedback submission error:', err);
            alert('An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (feedbackId: string, type: 'up' | 'down') => {
        const item = feedbackList.find(i => i.id === feedbackId);
        if (!item) return;

        // Determine new vote state for optimistic update
        const isRemoving = item.user_vote === type;
        const newVote = isRemoving ? null : type;

        // Optimistic Update
        setFeedbackList(prev => prev.map(f => {
            if (f.id !== feedbackId) return f;

            let upChange = 0;
            let downChange = 0;

            // Remove old vote
            if (f.user_vote === 'up') upChange = -1;
            if (f.user_vote === 'down') downChange = -1;

            // Add new vote
            if (newVote === 'up') upChange += 1;
            if (newVote === 'down') downChange += 1;

            return {
                ...f,
                user_vote: newVote,
                upvotes: f.upvotes + upChange,
                downvotes: f.downvotes + downChange
            };
        }));

        try {
            await fetch('/api/feedback/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback_id: feedbackId,
                    vote_type: isRemoving ? 'none' : type
                })
            });
        } catch (error) {
            console.error('Error voting:', error);
            fetchFeedback(); // Revert on error
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'feature_request': return '💡';
            case 'bug': return '🐛';
            case 'general': return '💭';
            default: return '❓';
        }
    };

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'feature_request': return 'Feature Request';
            case 'bug': return 'Bug Report';
            case 'general': return 'General';
            default: return 'Other';
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Submit Form */}
            <div className="lg:col-span-1 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">Feedback</h1>
                    <p className="text-text-secondary text-sm">
                        Help us improve the band app!
                    </p>
                </div>

                <div className="bg-surface border border-border rounded-xl p-6 shadow-sm sticky top-24">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Submit New Idea</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="category" className="block text-xs font-medium text-text-secondary uppercase">
                                Category
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary appearance-none text-sm"
                            >
                                <option value="feature_request">💡 Feature Request</option>
                                <option value="bug">🐛 Bug Report</option>
                                <option value="general">💭 General Comment</option>
                                <option value="other">❓ Other</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="message" className="block text-xs font-medium text-text-secondary uppercase">
                                Message
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Describe your idea..."
                                rows={4}
                                required
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || !message.trim()}
                            className="w-full"
                        >
                            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Right Column: Community List */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold text-text-primary">Community Feedback</h3>

                {isLoading ? (
                    <div className="text-center py-10 text-text-secondary">Loading feedback...</div>
                ) : feedbackList.length === 0 ? (
                    <div className="text-center py-10 bg-surface/30 rounded-xl border border-border border-dashed">
                        <p className="text-text-secondary">No feedback submitted yet. Be the first!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbackList.map((item) => (
                            <div key={item.id} className="bg-surface border border-border rounded-xl p-5 flex gap-4 transition-all hover:border-primary/30">
                                {/* Vote Controls */}
                                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                                    <button
                                        onClick={() => handleVote(item.id, 'up')}
                                        className={`p-1 rounded hover:bg-surface-hover transition-colors ${item.user_vote === 'up' ? 'text-green-500 bg-green-500/10' : 'text-text-secondary'}`}
                                        title="Upvote"
                                    >
                                        👍
                                    </button>
                                    <span className={`text-sm font-bold ${item.upvotes - item.downvotes > 0 ? 'text-green-500' : item.upvotes - item.downvotes < 0 ? 'text-red-500' : 'text-text-secondary'}`}>
                                        {item.upvotes - item.downvotes}
                                    </span>
                                    <button
                                        onClick={() => handleVote(item.id, 'down')}
                                        className={`p-1 rounded hover:bg-surface-hover transition-colors ${item.user_vote === 'down' ? 'text-red-500 bg-red-500/10' : 'text-text-secondary'}`}
                                        title="Downvote"
                                    >
                                        👎
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary text-xs font-medium text-text-secondary border border-border">
                                            <span>{getCategoryIcon(item.category)}</span>
                                            <span>{getCategoryLabel(item.category)}</span>
                                        </span>
                                        <span className="text-xs text-text-secondary whitespace-nowrap">
                                            {formatDate(item.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed mb-3">
                                        {item.message}
                                    </p>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-xs text-text-secondary">
                                            by <span className="font-medium text-text-primary">{item.user_name}</span>
                                        </div>
                                        {item.status !== 'pending' && (
                                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${item.status === 'implemented' ? 'bg-green-500/20 text-green-400' :
                                                item.status === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {item.status}
                                            </span>
                                        )}
                                    </div>

                                    {/* Replies Section */}
                                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                                        {item.replies?.map(reply => (
                                            <div key={reply.id} className="flex gap-3 text-sm bg-surface-secondary/50 p-3 rounded-lg">
                                                <div className="font-bold text-text-primary text-xs shrink-0 mt-0.5">
                                                    {reply.user?.name || 'User'}:
                                                </div>
                                                <div className="flex-1 text-text-secondary">
                                                    {reply.message}
                                                </div>
                                                <div className="text-[10px] text-text-tertiary shrink-0">
                                                    {formatDate(reply.created_at)}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Reply Input */}
                                        <div className="flex gap-2 items-center mt-2">
                                            <input
                                                type="text"
                                                placeholder="Write a reply..."
                                                className="flex-1 bg-surface-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-text-tertiary"
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        const target = e.target as HTMLInputElement;
                                                        const val = target.value.trim();
                                                        if (!val) return;

                                                        // Disable input while sending
                                                        target.disabled = true;

                                                        try {
                                                            const res = await fetch('/api/feedback/reply', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ feedback_id: item.id, message: val })
                                                            });

                                                            if (res.ok) {
                                                                const newReply = await res.json();
                                                                setFeedbackList(prev => prev.map(f => {
                                                                    if (f.id === item.id) {
                                                                        return {
                                                                            ...f,
                                                                            replies: [...(f.replies || []), newReply]
                                                                        };
                                                                    }
                                                                    return f;
                                                                }));
                                                                target.value = '';
                                                            }
                                                        } catch (err) {
                                                            console.error('Error replying', err);
                                                        } finally {
                                                            target.disabled = false;
                                                            target.focus();
                                                        }
                                                    }
                                                }}
                                            />
                                            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Press Enter</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
