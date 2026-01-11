'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import CreateSessionModal from '@/components/admin/CreateSessionModal';

export default function Header() {
    const { data: session } = useSession();

    // Extract first name from full name
    const getFirstName = (fullName: string | null | undefined) => {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const onOpenCreateSession = () => setIsCreateModalOpen(true);

    return (
        <>
            <header className="w-full bg-surface/50 backdrop-blur-lg border-b border-border sticky top-0 z-40">
                <div className="w-full flex justify-center py-4">
                    <div className="w-full max-w-7xl px-4 relative flex items-center justify-center">
                        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                            <Image
                                src="/logo.png"
                                alt="Sleepy Hollows Studios"
                                width={50}
                                height={50}
                                className="rounded-lg"
                            />
                            <div className="text-center">
                                <h1 className="text-xl font-bold text-text-primary">Sleepy Hollows Studios</h1>
                                <p className="text-sm text-text-secondary">Thursday Night Sessions</p>
                            </div>
                        </Link>

                        {session?.user?.name && (
                            <div className="absolute right-4">
                                <Menu as="div" className="relative inline-block text-left">
                                    <Menu.Button className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border bg-surface-secondary">
                                            {session.user.image ? (
                                                <Image
                                                    src={session.user.image}
                                                    alt="Avatar"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-xs font-bold">
                                                    {getFirstName(session.user.name).charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <span>{getFirstName(session.user.name)}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-70">
                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </Menu.Button>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-surface border border-border rounded-lg shadow-xl focus:outline-none divide-y divide-border z-50">
                                            <div className="py-1">
                                                {session.user.userType === 'admin' && (
                                                    <Menu.Item>
                                                        {({ active }) => (
                                                            <button
                                                                onClick={onOpenCreateSession}
                                                                className={`${active ? 'bg-surface-hover' : ''
                                                                    } block w-full text-left px-4 py-2 text-sm text-text-primary transition-colors`}
                                                            >
                                                                Add Session
                                                            </button>
                                                        )}
                                                    </Menu.Item>
                                                )}
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <Link
                                                            href="/profile"
                                                            className={`${active ? 'bg-surface-hover' : ''
                                                                } block px-4 py-2 text-sm text-text-primary transition-colors`}
                                                        >
                                                            My Profile
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            </div>
                                            <div className="py-1">
                                                <Menu.Item>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={() => signOut({ callbackUrl: '/login' })}
                                                            className={`${active ? 'bg-surface-hover' : ''
                                                                } block w-full text-left px-4 py-2 text-sm text-red-400 transition-colors`}
                                                        >
                                                            Logout
                                                        </button>
                                                    )}
                                                </Menu.Item>
                                            </div>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <CreateSessionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSessionCreated={() => {
                    window.location.reload();
                }}
            />
        </>
    );
}
