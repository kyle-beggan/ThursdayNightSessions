
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Capability } from '@/lib/types';
import { useToast } from '@/hooks/useToast';
import CapabilityIcon from '@/components/ui/CapabilityIcon';
import { formatPhoneNumber } from '@/lib/utils';

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    user_type: 'admin' | 'user';
    status: 'pending' | 'approved' | 'rejected';
    capabilities: Capability[];
}

export default function EditUserPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.userId as string;
    const toast = useToast(); // Initialized useToast

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allCapabilities, setAllCapabilities] = useState<Capability[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        user_type: 'user',
        status: 'pending'
    });
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);



    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch all capabilities for selection
            const capRes = await fetch('/api/admin/capabilities');
            if (capRes.ok) {
                const caps = await capRes.json();
                // Filter out 'hanging out' capability
                const filteredCaps = caps.filter((c: Capability) => c.name.toLowerCase() !== 'hanging out');
                setAllCapabilities(filteredCaps);
            }

            // Fetch user details
            const userRes = await fetch('/api/admin/users');
            // Note: The list endpoint returns all users. Ideally we'd have a specific GET /id, 
            // but the list endpoint is filterable or we can just find it. 
            // Better: Update the GET endpoint to handle a single ID or use the list and find.
            // Let's filter the list for now since we don't have a dedicated single-user admin endpoint yet, 
            // or we can add one. 
            // Actually, the implementation plan mentioned "Fetch user details by ID".
            // Let's see if the existing API supports it. The GET route supports filtering by status/search.
            // I'll grab the whole list and find the user for now to keep it simple without changing the backend yet again,
            // unless the list is huge. 

            if (userRes.ok) {
                const users = await userRes.json();
                const foundUser = users.find((u: User) => u.id === userId);

                if (foundUser) {
                    setUser(foundUser);
                    setFormData({
                        name: foundUser.name || '',
                        email: foundUser.email || '',
                        phone: foundUser.phone || '',
                        user_type: foundUser.user_type,
                        status: foundUser.status
                    });
                    setSelectedCapabilities(foundUser.capabilities.map((c: Capability) => c.id));
                } else {
                    // Handle user not found
                    toast.error('User not found'); // Replaced alert
                    router.push('/admin/users');
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error loading user data'); // Replaced alert
        } finally {
            setLoading(false);
        }
    }, [userId, router, toast]); // Added toast to dependency array

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [userId, fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Update user details
            const updates = {
                ...formData,
                capabilities: selectedCapabilities
            };

            // Call PATCH for basic info and capabilities
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, updates })
            });

            if (!res.ok) {
                throw new Error('Failed to update user info');
            }

            toast.success('User updated successfully'); // Replaced alert
            router.push('/admin/users');
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Failed to update user'); // Replaced alert
        } finally {
            setSaving(false);
        }
    };

    const toggleCapability = (capId: string) => {
        setSelectedCapabilities(prev =>
            prev.includes(capId)
                ? prev.filter(id => id !== capId)
                : [...prev, capId]
        );
    };

    if (loading) return <div className="p-8 text-center text-text-secondary">Loading...</div>;
    if (!user) return <div className="p-8 text-center text-text-secondary">User not found</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
                >
                    <span>←</span> Back to Users
                </Link>
                <h1 className="text-3xl font-bold text-text-primary">Edit User</h1>
                <p className="text-text-secondary">Manage settings for {user.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary">Basic Information</h3>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                        <Input
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            type="email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                        <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                            type="tel"
                            placeholder="555-555-5555"
                            maxLength={12}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-text-primary">Account Status & Type</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'approved' | 'rejected' })}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">User Type</label>
                            <select
                                value={formData.user_type}
                                onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'user' | 'admin' })}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-lg font-semibold text-text-primary">Capabilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {allCapabilities.map(cap => (
                            <label
                                key={cap.id}
                                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedCapabilities.includes(cap.id)
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-surface-secondary border-transparent hover:bg-surface-tertiary'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedCapabilities.includes(cap.id)}
                                    onChange={() => toggleCapability(cap.id)}
                                />
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <CapabilityIcon capability={cap} className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-text-primary capitalize">{cap.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                    <Link href="/admin/users">
                        <Button type="button" variant="ghost">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
