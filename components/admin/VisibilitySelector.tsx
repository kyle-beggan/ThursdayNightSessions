'use client';


import { User } from '@/lib/types';
import Button from '@/components/ui/Button';
import { FaGlobe, FaLock } from 'react-icons/fa';

interface VisibilitySelectorProps {
    users: User[];
    selectedUserIds: string[];
    isPublic: boolean;
    onChange: (isPublic: boolean, selectedIds: string[]) => void;
}

export default function VisibilitySelector({ users, selectedUserIds, isPublic, onChange }: VisibilitySelectorProps) {
    const handleTogglePublic = (publicState: boolean) => {
        onChange(publicState, selectedUserIds);
    };

    const handleUserToggle = (userId: string) => {
        const newSelected = selectedUserIds.includes(userId)
            ? selectedUserIds.filter(id => id !== userId)
            : [...selectedUserIds, userId];
        onChange(false, newSelected);
    };

    const handleSelectAll = () => {
        onChange(false, users.map(u => u.id));
    };

    const handleClearAll = () => {
        onChange(false, []);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Session Visibility</h3>

            <div className="flex gap-4 mb-4">
                <button
                    type="button"
                    onClick={() => handleTogglePublic(true)}
                    className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${isPublic
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-secondary'
                        }`}
                >
                    <FaGlobe className="w-4 h-4" />
                    <span>Visible to All Players</span>
                </button>
                <button
                    type="button"
                    onClick={() => handleTogglePublic(false)}
                    className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${!isPublic
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-surface border-border text-text-secondary hover:bg-surface-secondary'
                        }`}
                >
                    <FaLock className="w-4 h-4" />
                    <span>Specific Players Only</span>
                </button>
            </div>

            {!isPublic && (
                <div className="bg-surface/50 border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-text-secondary">Select who can see this session:</span>
                        <div className="flex gap-2">
                            <Button type="button" size="sm" variant="ghost" onClick={handleSelectAll} className="h-7 text-xs">All</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={handleClearAll} className="h-7 text-xs">Clear</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                        {users.map(user => (
                            <div
                                key={user.id}
                                onClick={() => handleUserToggle(user.id)}
                                className={`
                                    cursor-pointer p-2 rounded border text-sm flex items-center gap-2 transition-colors
                                    ${selectedUserIds.includes(user.id)
                                        ? 'bg-primary/10 border-primary text-text-primary'
                                        : 'bg-surface border-border text-text-secondary hover:bg-surface-secondary'
                                    }
                                `}
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedUserIds.includes(user.id) ? 'bg-primary border-primary' : 'border-text-secondary'
                                    }`}>
                                    {selectedUserIds.includes(user.id) && <span className="text-white text-[10px]">✓</span>}
                                </div>
                                <span className="truncate">{user.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
