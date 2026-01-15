'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

type GuideSection = {
    id: string;
    title: string;
    icon: string;
    content: React.ReactNode;
};

export default function WalkthroughPage() {
    const [activeSection, setActiveSection] = useState<string>('dashboard');

    const sections: GuideSection[] = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: '🏠',
            content: (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-text-primary">Your Command Center</h3>
                    <p className="text-text-secondary">
                        The Dashboard is your landing page. Here you can see a calendar view of all upcoming Thursday Night Sessions.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-surface-secondary p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2">📅 Session Calendar</h4>
                            <p className="text-sm text-text-secondary">
                                View sessions by month. Click session details to access the <strong>Setlist</strong>, <strong>Session Chat</strong>, and <strong>Recordings</strong>.
                            </p>
                        </div>
                        <div className="bg-surface-secondary p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2">✅ RSVP Status</h4>
                            <p className="text-sm text-text-secondary">
                                Quickly mark yourself as &quot;In&quot; or &quot;Out&quot; for sessions. You can also specify which instruments you&apos;ll be playing.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'songs',
            title: 'Song Library',
            icon: '🎵',
            content: (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-text-primary">Master the Setlist</h3>
                    <p className="text-text-secondary">
                        The Song Library is where we manage our repertoire. You can search for existing songs or add new ones.
                    </p>
                    <ul className="space-y-3 mt-4">
                        <li className="flex items-start gap-3">
                            <span className="bg-primary/20 text-primary p-1 rounded">🔍</span>
                            <div>
                                <strong className="text-text-primary">Find Songs:</strong> Use the &quot;Find Songs&quot; button to search YouTube directly and add songs with auto-detected Key and Tempo.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-primary/20 text-primary p-1 rounded">👍</span>
                            <div>
                                <strong className="text-text-primary">Vote:</strong> Thumbs up songs you&apos;re interested in playing. This helps us prioritize what to learn next.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-primary/20 text-primary p-1 rounded">🎸</span>
                            <div>
                                <strong className="text-text-primary">Requirements:</strong> Check what instruments are needed for each song (e.g., &quot;Bass&quot;, &quot;Drums&quot;).
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-primary/20 text-primary p-1 rounded">▶️</span>
                            <div>
                                <strong className="text-text-primary">Practice:</strong> Click the &quot;Play&quot; button to open the reference track directly.
                            </div>
                        </li>
                    </ul>
                </div>
            )
        },
        {
            id: 'recordings',
            title: 'Recordings',
            icon: '🎙️',
            content: (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-text-primary">Session Archive</h3>
                    <p className="text-text-secondary">
                        Listen back to the magic (and the mistakes). The Recording Library holds all uploaded tracks from past sessions.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-surface-secondary p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2">📂 Library View</h4>
                            <p className="text-sm text-text-secondary">
                                Browse recordings by session date. Filter by song title or players involved.
                            </p>
                        </div>
                        <div className="bg-surface-secondary p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2">▶️ One-Click Pay</h4>
                            <p className="text-sm text-text-secondary">
                                Instant playback for any track. Relive the &quot;Seven Nation Army&quot; jam instantly.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'chat',
            title: 'Band Chat',
            icon: '💬',
            content: (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-text-primary">Stay in Sync</h3>
                    <p className="text-text-secondary">
                        A dedicated space for banter, logistics, and sudden bursts of musical inspiration.
                    </p>
                    <div className="bg-surface-secondary p-6 rounded-lg border border-border mt-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">K</div>
                            <div className="bg-surface-tertiary p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm relative group">
                                &quot;Hey everyone, don&apos;t forget we&apos;re recording &apos;Seven Nation Army&apos; next week!&quot;
                                <div className="absolute -bottom-2 right-0 bg-surface border border-border rounded-full px-1.5 py-0.5 text-[10px] shadow-sm">
                                    🔥 2
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary text-center italic">
                            Chats update in real-time. React with emojis to show your hype!
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'feedback',
            title: 'Feedback',
            icon: '💡',
            content: (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-text-primary">Have Your Say</h3>
                    <p className="text-text-secondary">
                        Help improve Thursday Night Sessions. Submit bugs, feature requests, or general ideas.
                    </p>
                    <div className="flex gap-4 mt-4">
                        <div className="flex-1 bg-surface-secondary p-4 rounded-lg text-center">
                            <div className="text-2xl mb-2">🗳️</div>
                            <div className="font-semibold">Vote</div>
                            <div className="text-xs text-text-secondary mt-1">Upvote ideas you like</div>
                        </div>
                        <div className="flex-1 bg-surface-secondary p-4 rounded-lg text-center">
                            <div className="text-2xl mb-2">💬</div>
                            <div className="font-semibold">Discuss</div>
                            <div className="text-xs text-text-secondary mt-1">Reply to feedback for clarification</div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'updates',
            title: 'Latest Updates',
            icon: '🚀',
            content: (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-text-primary">New Features & Refinements</h3>
                    <p className="text-text-secondary">
                        We&apos;re constantly improving the experience. Here&apos;s what&apos;s new in Jan 2026:
                    </p>

                    <div className="space-y-4 mt-4">
                        <div className="bg-surface-secondary p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                <span>📱</span> SMS Reminders
                            </h4>
                            <p className="text-sm text-text-secondary">
                                Admins can now send session reminders directly to your phone. Make sure your profile has a valid phone number to receive updates!
                            </p>
                        </div>

                        <div className="bg-surface-secondary p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                <span>🎨</span> UI Polish
                            </h4>
                            <ul className="text-sm text-text-secondary space-y-2 list-disc pl-4">
                                <li><strong>Tab Icons:</strong> Easier navigation in profiles and session details.</li>
                                <li><strong>Song Previews:</strong> New &quot;Play&quot; button in the song selector lets you listen before you choose.</li>
                                <li><strong>Better Grids:</strong> Capabilities now display in a cleaner 4-column layout on desktop.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-4 md:mb-8 px-2 md:px-0">
                <h1 className="text-xl md:text-3xl font-bold text-text-primary mb-2">App Walkthrough</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Navigation Tabs */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-2">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${activeSection === section.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            <span className="text-xl">{section.icon}</span>
                            <span className="font-medium">{section.title}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-h-[400px]">
                    <div className="bg-surface border border-border rounded-xl p-8 h-full shadow-sm">
                        {sections.find(s => s.id === activeSection)?.content}
                    </div>
                </div>
            </div>

            <div className="mt-12 p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20 text-center">
                <h3 className="text-lg font-bold text-text-primary mb-2">Ready to rock?</h3>
                <p className="text-text-secondary mb-4">
                    Explore the app and sign up for the next session!
                </p>
                <Button onClick={() => window.location.href = '/dashboard'} variant="primary">
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}
