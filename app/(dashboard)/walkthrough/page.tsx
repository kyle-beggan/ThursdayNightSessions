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
                                View sessions by month. Click on any session to see details, who's attending, and the setlist.
                            </p>
                        </div>
                        <div className="bg-surface-secondary p-4 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2">✅ RSVP Status</h4>
                            <p className="text-sm text-text-secondary">
                                Quickly mark yourself as "In" or "Out" for sessions. You can also specify which instruments you'll be playing.
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
                                <strong className="text-text-primary">Find Songs:</strong> Use the "Find Songs" button to search YouTube directly and add songs with auto-detected Key and Tempo.
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-primary/20 text-primary p-1 rounded">🎸</span>
                            <div>
                                <strong className="text-text-primary">Requirements:</strong> Check what instruments are needed for each song (e.g., "Bass", "Drums").
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-primary/20 text-primary p-1 rounded">▶️</span>
                            <div>
                                <strong className="text-text-primary">Practice:</strong> Click the "Play" button to open the reference track directly.
                            </div>
                        </li>
                    </ul>
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
                            <div className="bg-surface-tertiary p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl text-sm">
                                "Hey everyone, don't forget we're recording 'Seven Nation Army' next week!"
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary text-center italic">
                            Chats update in real-time. You'll see unread counts in the sidebar.
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
                            <div className="text-2xl mb-2">📝</div>
                            <div className="font-semibold">Submit</div>
                            <div className="text-xs text-text-secondary mt-1">Share your own thoughts</div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2">App Walkthrough</h1>
                <p className="text-text-secondary">
                    Get to know the features of Thursday Night Sessions.
                </p>
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
