'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/admin/StatusBadge';

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
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

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        selectedCapabilities: [] as string[]
    });

    useEffect(() => {
        if (session) {
            fetchProfile();
            fetchCapabilities();
        }
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
                    selectedCapabilities: data.capabilities.map((c: Capability) => c.id)
                });
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
                    capabilities: formData.selectedCapabilities
                })
            });

            if (response.ok) {
                await fetchProfile();
                setIsEditing(false);
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
            </div>

            {/* Personal Information */}
            <div className="bg-surface border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Name
                        </label>
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
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Email
                        </label>
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
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Phone
                        </label>
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
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Status
                        </label>
                        <StatusBadge status={user.status} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Account Type
                        </label>
                        <p className={`text-sm font-medium ${user.user_type === 'admin' ? 'text-primary' : 'text-text-primary'}`}>
                            {user.user_type === 'admin' ? 'Administrator' : 'User'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Member Since
                        </label>
                        <p className="text-text-primary font-medium">
                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Capabilities */}
            <div className="bg-surface border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                    My Capabilities
                </h2>
                <p className="text-sm text-text-secondary mb-4">
                    {isEditing
                        ? 'Select the instruments and skills you can perform'
                        : 'Your assigned instruments and skills'}
                </p>

                {isEditing ? (
                    <div className="space-y-2">
                        {allCapabilities.map(cap => (
                            <button
                                key={cap.id}
                                onClick={() => toggleCapability(cap.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${formData.selectedCapabilities.includes(cap.id)
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${formData.selectedCapabilities.includes(cap.id)
                                    ? 'bg-white/20'
                                    : 'bg-primary/20'
                                    }`}>
                                    {cap.icon || '🎸'}
                                </div>
                                <span className="capitalize text-left flex-1">{cap.name}</span>
                                {formData.selectedCapabilities.includes(cap.id) && (
                                    <span className="text-lg">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {user.capabilities.length > 0 ? (
                            user.capabilities.map(cap => (
                                <div
                                    key={cap.id}
                                    className="flex items-center gap-3 px-4 py-3 bg-surface-secondary rounded-lg"
                                >
                                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-xl">
                                        {cap.icon || '🎸'}
                                    </div>
                                    <span className="font-medium text-text-primary capitalize">
                                        {cap.name}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-text-secondary italic">No capabilities assigned yet</p>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
                <div className="flex gap-4 justify-end">
                    <Button onClick={handleCancel} variant="ghost" disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
        </div>
    );
}
