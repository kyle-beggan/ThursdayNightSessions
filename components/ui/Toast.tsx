'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
}

export default function Toast({ id, message, type, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for exit animation
        setTimeout(() => onClose(id), 300);
    };

    let bgClass = '';
    let icon = '';

    switch (type) {
        case 'success':
            bgClass = 'bg-green-500 text-white';
            icon = '✓';
            break;
        case 'error':
            bgClass = 'bg-red-500 text-white';
            icon = '✕';
            break;
        case 'info':
        default:
            bgClass = 'bg-blue-500 text-white';
            icon = 'ℹ';
            break;
    }

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg mb-3 mr-4 transition-all duration-300 ease-in-out transform
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                ${bgClass}
            `}
            style={{ minWidth: '300px', maxWidth: '400px' }}
        >
            <span className="font-bold text-lg">{icon}</span>
            <span className="flex-1 text-sm font-medium">{message}</span>
            <button
                onClick={handleClose}
                className="opacity-70 hover:opacity-100 transition-opacity ml-2 text-xl leading-none"
            >
                &times;
            </button>
        </div>
    );
}
