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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {allCapabilities.map(cap => {
                            const isSelected = formData.selectedCapabilities.includes(cap.id);
                            return (
                                <div
                                    key={cap.id}
                                    onClick={() => toggleCapability(cap.id)}
                                    className={`
                                        cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center h-[120px] relative group
                                        ${isSelected
                                            ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                            : 'bg-surface border-border hover:border-primary/50 hover:bg-surface-hover hover:shadow-lg'
                                        }
                                    `}
                                >
                                    {isSelected && (
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
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {user.capabilities.length > 0 ? (
                            user.capabilities.map(cap => (
                                <div
                                    key={cap.id}
                                    className="p-4 rounded-xl border border-border bg-surface flex flex-col items-center justify-center text-center h-[120px]"
                                >
                                    <div className="text-3xl mb-2">
                                        {cap.icon || '🎸'}
                                    </div>
                                    <h4 className="font-medium text-sm text-text-primary capitalize">
                                        {cap.name}
                                    </h4>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-8 text-text-secondary italic bg-surface-secondary rounded-lg border border-border border-dashed">
                                No capabilities assigned yet
                            </div>
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
