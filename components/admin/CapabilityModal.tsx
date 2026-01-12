'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CapabilityIcon from '@/components/ui/CapabilityIcon';

type CapabilityModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, icon: string) => void;
    initialName?: string;
    initialIcon?: string;
    title: string;
};

const MUSICAL_ICONS = [
    { emoji: '🎸', label: 'Guitar' },
    { emoji: '🎹', label: 'Keyboard' },
    { emoji: '🥁', label: 'Drums' },
    { emoji: '🎤', label: 'Microphone' },
    { emoji: '🎷', label: 'Saxophone' },
    { emoji: '🎺', label: 'Trumpet' },
    { emoji: '🎻', label: 'Violin' },
    { emoji: '🪕', label: 'Banjo' },
    { emoji: '🪘', label: 'Drum' },
    { emoji: '🎼', label: 'Music Score' },
    { emoji: '🎵', label: 'Music Note' },
    { emoji: '🎶', label: 'Musical Notes' },
    { emoji: '🎧', label: 'Headphones' },
    { emoji: '🎛️', label: 'Control Knobs' },
    { emoji: '🎚️', label: 'Level Slider' },
    { emoji: '📹', label: 'Video Camera' },
    { emoji: '📷', label: 'Camera' },
    { emoji: '🔊', label: 'Speaker' },
    { emoji: '🛋️', label: 'Couch' },
];

export default function CapabilityModal({
    isOpen,
    onClose,
    onSave,
    initialName = '',
    initialIcon = '🎸',
    title
}: CapabilityModalProps) {
    const [name, setName] = useState(initialName);
    const [selectedIcon, setSelectedIcon] = useState(initialIcon);

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
            alert('Please enter a capability name');
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
                <h2 className="text-2xl font-bold text-text-primary mb-6">{title}</h2>

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
                            onClick={() => setSelectedIcon('')}
                            className={`p-3 text-xs flex items-center justify-center rounded-lg transition-all border border-dashed border-text-secondary/30 ${!selectedIcon
                                ? 'bg-primary text-white ring-2 ring-primary'
                                : 'bg-surface-secondary hover:bg-surface-tertiary text-text-secondary'
                                }`}
                            title="Auto-detect based on name"
                        >
                            Auto
                        </button>

                        {MUSICAL_ICONS.map((icon) => (
                            <button
                                key={icon.emoji}
                                onClick={() => setSelectedIcon(icon.emoji)}
                                className={`p-3 text-2xl rounded-lg transition-all ${selectedIcon === icon.emoji
                                    ? 'bg-primary text-white ring-2 ring-primary scale-110'
                                    : 'bg-surface-secondary hover:bg-surface-tertiary'
                                    }`}
                                title={icon.label}
                            >
                                {icon.emoji}
                            </button>
                        ))}
                    </div>
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
                    <Button onClick={handleClose} variant="ghost">
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
