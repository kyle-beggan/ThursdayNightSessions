'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/admin/StatusBadge';
import Image from 'next/image';

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    image?: string;
    status: 'pending' | 'approved' | 'rejected';
    user_type: 'admin' | 'user';
    created_at: string;
    capabilities: { id: string; name: string; icon?: string }[];
};

type Capability = {
    id: string;
    name: string;
    icon?: string;
};

export default function ProfilePage() {
    const { data: session } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [allCapabilities, setAllCapabilities] = useState<Capability[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'capabilities' | 'avatar'>('details');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        image: '',
        selectedCapabilities: [] as string[]
    });

    useEffect(() => {
        if (session) {
            fetchProfile();
            fetchCapabilities();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const data = await response.json();
                setUser(data);
                setFormData({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    image: data.image || '',
                    selectedCapabilities: data.capabilities.map((c: Capability) => c.id)
                });

                // SYNC: If session image differs from DB image, update DB to match session (Source of Truth)
                if (session?.user?.image && session.user.image !== data.image) {
                    console.log('Syncing avatar from session to DB...');
                    // Update local state immediately for UI
                    setUser((prev) => prev ? { ...prev, image: session.user.image! } : null); // Non-null assertion safe due to if check
                    setFormData((prev) => ({ ...prev, image: session.user.image! })); // Non-null assertion safe due to if check

                    // Update DB in background
                    fetch('/api/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: session.user.image })
                    }).catch(err => console.error('Failed to sync avatar:', err));
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCapabilities = async () => {
        try {
            const response = await fetch('/api/admin/capabilities');
            if (response.ok) {
                const data = await response.json();
                setAllCapabilities(data);
            }
        } catch (error) {
            console.error('Error fetching capabilities:', error);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                phone: user.phone,
                image: user.image || '',
                selectedCapabilities: user.capabilities.map(c => c.id)
            });
        }
        setIsEditing(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    image: formData.image,
                    capabilities: formData.selectedCapabilities
                })
            });

            if (response.ok) {
                await fetchProfile();
                setIsEditing(false);
                // Force reload to update session/header avatar if needed
                window.location.reload();
            } else {
                alert('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCapability = (capId: string) => {
        if (!isEditing) return;
        setFormData(prev => ({
            ...prev,
            selectedCapabilities: prev.selectedCapabilities.includes(capId)
                ? prev.selectedCapabilities.filter(id => id !== capId)
                : [...prev.selectedCapabilities, capId]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-text-secondary">Loading profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-text-secondary">Failed to load profile</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-2">My Profile</h1>
                    <p className="text-text-secondary">Manage your personal information and capabilities</p>
                </div>
                {!isEditing && (
                    <Button onClick={handleEdit} variant="primary">
                        Edit Profile
                    </Button>
                )}
                {isEditing && (
                    <div className="flex gap-3">
                        <Button onClick={handleCancel} variant="ghost" disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} variant="primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Current Avatar Header (Always visible) */}
            <div className="flex items-center gap-4 bg-surface/50 border border-border rounded-lg p-4">
                <div className="w-16 h-16 rounded-full bg-surface-secondary overflow-hidden border-2 border-primary/20">
                    {formData.image ? (
                        <Image
                            src={formData.image}
                            alt="Avatar"
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized={formData.image.includes('supabase.co')}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                            👤
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-text-primary">{formData.name || user.name}</h2>
                    <p className="text-sm text-text-secondary">{formData.email || user.email}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-surface-secondary/30 border border-border rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`flex-1 px-4 py-3 text-lg font-bold rounded-lg transition-all duration-300 ${activeTab === 'details'
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.02]'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        }`}
                >
                    Profile Details
                </button>
                <button
                    onClick={() => setActiveTab('capabilities')}
                    className={`flex-1 px-4 py-3 text-lg font-bold rounded-lg transition-all duration-300 ${activeTab === 'capabilities'
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-[1.02]'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                        }`}
                >
                    Capabilities
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-surface border border-border rounded-lg p-6 min-h-[400px]">

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            ) : (
                                <p className="text-text-primary font-medium">{user.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                            {isEditing ? (
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            ) : (
                                <p className="text-text-primary font-medium">{user.email}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Phone</label>
                            {isEditing ? (
                                <Input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            ) : (
                                <p className="text-text-primary font-medium">{user.phone}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
                            <StatusBadge status={user.status} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Account Type</label>
                            <p className="text-text-primary font-medium capitalize">{user.user_type}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Member Since</label>
                            <p className="text-text-primary font-medium">
                                {new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                )}

                {/* Capabilities Tab */}
                {activeTab === 'capabilities' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-text-primary">Assigned Instruments & Skills</h2>
                            <p className="text-xs text-text-secondary">
                                {isEditing ? 'Tap to select/deselect' : `${user.capabilities.length} selected`}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(isEditing ? allCapabilities : user.capabilities).map(cap => {
                                const isSelected = isEditing
                                    ? formData.selectedCapabilities.includes(cap.id)
                                    : true; // In view mode, we iterate over user.capabilities which are all selected by definition

                                return (
                                    <div
                                        key={cap.id}
                                        onClick={() => toggleCapability(cap.id)}
                                        className={`
                                            p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center h-[120px] relative group
                                            ${isEditing ? 'cursor-pointer' : ''}
                                            ${isSelected
                                                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                                : isEditing
                                                    ? 'bg-surface border-border hover:border-primary/50 opacity-60 hover:opacity-100' // Unselected in edit mode
                                                    : 'bg-surface border-border' // View mode only sees selected
                                            }
                                        `}
                                    >
                                        {isSelected && isEditing && (
                                            <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full text-xs font-bold">
                                                ✓
                                            </div>
                                        )}
                                        <div className="text-3xl mb-2">
                                            {cap.icon || '🎸'}
                                        </div>
                                        <h4 className={`font-medium text-sm capitalize ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                                            {cap.name}
                                        </h4>
                                    </div>
                                );
                            })}

                            {/* Empty State for View Mode */}
                            {!isEditing && user.capabilities.length === 0 && (
                                <div className="col-span-full text-center py-8 text-text-secondary italic bg-surface-secondary rounded-lg border border-border border-dashed">
                                    No capabilities assigned yet. Click Edit to add some!
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
