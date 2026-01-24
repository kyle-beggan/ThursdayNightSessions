'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string; // Added className prop
}

export default function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={cn(
                                    'w-full transform overflow-hidden rounded-2xl bg-surface border border-border p-6 text-left align-middle shadow-2xl transition-all',
                                    'backdrop-blur-xl bg-surface/95',
                                    sizes[size],
                                    className // Merging className
                                )}
                            >
                                {title && (
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold text-text-primary mb-4"
                                    >
                                        {title}
                                    </Dialog.Title>
                                )}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-secondary transition-colors"
                                    aria-label="Close modal"
                                >
                                    ✕
                                </button>
                                {children}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
