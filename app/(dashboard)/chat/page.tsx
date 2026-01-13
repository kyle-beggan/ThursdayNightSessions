'use client';

import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-180px)] md:h-[calc(100vh-150px)] flex flex-col px-2 md:px-0">
            <div className="mb-4 md:mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-1 md:mb-2">Global Chat</h1>
                <p className="text-text-secondary text-sm md:text-base">Connect with everyone in the Sleepy Hollows community.</p>
            </div>

            <div className="flex-1 min-h-0">
                <ChatWindow className="h-full shadow-lg" />
            </div>
        </div>
    );
}
