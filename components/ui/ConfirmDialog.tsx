'use client';

import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
    isOpen,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'danger'
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
            <div className="space-y-6">
                <p className="text-text-secondary">{message}</p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button variant={variant} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
