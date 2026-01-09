'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'pending' | 'approved' | 'rejected';
    user_type: 'admin' | 'user';
    capabilities: { id: string; name: string }[];
    created_at: string;
};

type Capability = {
    id: string;
    name: string;
};

export default function ApprovalsPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [capabilities, setCapabilities] = useState<Capability[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPendingUsers();
        fetchCapabilities();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const response = await fetch('/api/admin/users?status=pending');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCapabilities = async () => {
        try {
            const response = await fetch('/api/admin/capabilities');
            if (response.ok) {
                const data = await response.json();
                setCapabilities(data);
            }
        } catch (error) {
            console.error('Error fetching capabilities:', error);
        }
    };

    const handleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map(u => u.id)));
        }
    };

    const handleAction = async (action: 'approve' | 'reject') => {
        if (selectedUsers.size === 0) {
            alert('Please select at least one user');
            return;
        }

        if (action === 'approve' && selectedCapabilities.length === 0) {
            if (!confirm('No capabilities selected. Continue with approval?')) {
                return;
            }
        }

        setActionLoading(true);
        try {
            const response = await fetch('/api/admin/approvals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: Array.from(selectedUsers),
                    action,
                    capabilities: action === 'approve' ? selectedCapabilities : undefined,
                }),
            });

            if (response.ok) {
                await fetchPendingUsers();
                setSelectedUsers(new Set());
                setSelectedCapabilities([]);
                alert(`Successfully ${action}d ${selectedUsers.size} user(s)`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || 'Failed to process request'}`);
            }
        } catch (error) {
            console.error(`Error ${action}ing users:`, error);
            alert(`Failed to ${action} users`);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleCapability = (capId: string) => {
        setSelectedCapabilities(prev =>
            prev.includes(capId)
                ? prev.filter(id => id !== capId)
                : [...prev, capId]
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-text-secondary">Loading pending approvals...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
                >
                    <span className="text-xl">←</span>
                    <span>Back to Admin</span>
                </Link>
                <h1 className="text-3xl font-bold text-text-primary mb-2">User Approvals</h1>
                <p className="text-text-secondary">Review and approve pending user registrations</p>
            </div>

            {users.length === 0 ? (
                <div className="bg-surface border border-border rounded-lg p-12 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                        No Pending Approvals
                    </h3>
                    <p className="text-text-secondary">
                        All users have been reviewed. Check back later for new registrations.
                    </p>
                </div>
            ) : (
                <>
                    {/* Bulk Actions */}
                    <div className="bg-surface border border-border rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div>
                                <p className="text-sm text-text-secondary mb-2">
                                    {selectedUsers.size} of {users.length} selected
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {capabilities.map(cap => (
                                        <button
                                            key={cap.id}
                                            onClick={() => toggleCapability(cap.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCapabilities.includes(cap.id)
                                                ? 'bg-primary text-white'
                                                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                                                }`}
                                        >
                                            {cap.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleAction('approve')}
                                    disabled={selectedUsers.size === 0 || actionLoading}
                                    variant="primary"
                                >
                                    Approve Selected
                                </Button>
                                <Button
                                    onClick={() => handleAction('reject')}
                                    disabled={selectedUsers.size === 0 || actionLoading}
                                    variant="ghost"
                                >
                                    Reject Selected
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-surface-secondary">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.size === users.length}
                                            onChange={handleSelectAll}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                        Registered
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-surface-secondary transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.has(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                                className="rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-text-primary">{user.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={user.status} />
                                        </td>
                                        <td className="px-4 py-3 text-text-secondary text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
