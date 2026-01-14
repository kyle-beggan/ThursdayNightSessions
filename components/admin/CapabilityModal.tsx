'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import Input from '@/components/ui/Input';
import CapabilityIcon from '@/components/ui/CapabilityIcon';
import { INSTRUMENT_ICONS } from '@/lib/icons';

type CapabilityModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, icon: string) => void;
    initialName?: string;
    initialIcon?: string;
    title: string;
};

export default function CapabilityModal({
    isOpen,
    onClose,
    onSave,
    initialName = '',
    initialIcon = '🎸',
    title
}: CapabilityModalProps) {
    const toast = useToast();
    const [name, setName] = useState(initialName);
    const [selectedIcon, setSelectedIcon] = useState(initialIcon);

    const [customIcons, setCustomIcons] = useState<{ name: string; path: string }[]>([]);

    useEffect(() => {
        const fetchCustomIcons = async () => {
            try {
                const res = await fetch('/api/admin/icons');
                if (res.ok) {
                    const data = await res.json();
                    setCustomIcons(data);
                }
            } catch (e) {
                console.error("Failed to load custom icons", e);
            }
        };
        if (isOpen) fetchCustomIcons();
    }, [isOpen]);

    // Update state when modal opens with new initial values
    useEffect(() => {
        if (isOpen) {
            if (initialName !== name) setName(initialName);
            if (initialIcon !== selectedIcon) setSelectedIcon(initialIcon);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialName, initialIcon]);

    const handleSave = () => {
        if (!name.trim()) {
            toast.error('Please enter a capability name');
            return;
        }
        onSave(name.trim(), selectedIcon);
        onClose();
    };

    const handleClose = () => {
        setName(initialName);
        setSelectedIcon(initialIcon);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                    <button
                        onClick={handleClose}
                        className="text-text-secondary hover:text-text-primary transition-colors p-1"
                        aria-label="Close"
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Name Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Capability Name
                    </label>
                    <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., bass guitar, keyboards, vocals"
                        autoFocus
                    />
                </div>

                {/* Icon Picker */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-3">
                        Select Icon
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                        {/* Auto/Default Option */}
                        <button
                            type="button"
                            onClick={() => setSelectedIcon('')}
                            className={`p-3 text-xs flex items-center justify-center rounded-lg transition-all border border-dashed border-text-secondary/30 ${!selectedIcon
                                ? 'bg-primary text-white ring-2 ring-primary'
                                : 'bg-surface-secondary hover:bg-surface-tertiary text-text-secondary'
                                }`}
                            title="Auto-detect based on name"
                        >
                            Auto
                        </button>

                        {/* Custom Icons (Uploaded) */}
                        {customIcons.map((icon) => (
                            <button
                                type="button"
                                key={icon.path}
                                onClick={() => setSelectedIcon(icon.path)}
                                className={`p-2 rounded-lg transition-all flex items-center justify-center ${selectedIcon === icon.path
                                    ? 'bg-primary/20 ring-2 ring-primary'
                                    : 'bg-surface-secondary hover:bg-surface-tertiary'
                                    }`}
                                title={icon.name}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={icon.path} alt={icon.name} className="w-6 h-6 object-contain" />
                            </button>
                        ))}

                        {/* Standard GameIcons */}
                        {INSTRUMENT_ICONS.map((inst) => (
                            <button
                                type="button"
                                key={inst.id}
                                onClick={() => setSelectedIcon(inst.id)}
                                className={`p-3 text-2xl rounded-lg transition-all flex items-center justify-center ${selectedIcon === inst.id
                                    ? 'bg-primary text-white ring-2 ring-primary scale-110'
                                    : 'bg-surface-secondary hover:bg-surface-tertiary text-text-secondary'
                                    }`}
                                title={inst.label}
                            >
                                <inst.icon />
                            </button>
                        ))}
                    </div>
                    {customIcons.length > 0 && (
                        <p className="text-xs text-text-secondary mt-2">
                            * Custom icons loaded from /public/icons
                        </p>
                    )}
                </div>

                {/* Preview */}
                <div className="mb-6 p-4 bg-surface-secondary rounded-lg">
                    <p className="text-sm text-text-secondary mb-2">Preview:</p>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-2xl">
                            {/* Use CapabilityIcon for accurate preview */}
                            <div className="w-8 h-8 flex items-center justify-center">
                                <CapabilityIcon
                                    capability={{ name: name || 'Capability', icon: selectedIcon }}
                                    className="w-8 h-8"
                                />
                            </div>
                        </div>
                        <div>
                            <p className="font-medium text-text-primary capitalize">
                                {name || 'Capability Name'}
                            </p>
                            <p className="text-xs text-text-secondary">
                                {selectedIcon ? 'Custom Icon' : 'Auto-detected Icon'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Button type="button" onClick={handleClose} variant="ghost">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="primary">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
