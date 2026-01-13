'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { useSortableData } from '@/hooks/useSortableData';

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
    const toast = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const { items: sortedUsers, requestSort, sortConfig } = useSortableData(users);
    const [capabilities, setCapabilities] = useState<Capability[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchCapabilities();
    }, []);

    const fetchUsers = async () => {
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

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (selectedUsers.size === 0) {
            toast.error('Please select at least one user');
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
                const result = await response.json();
                if (result.errors && result.errors.length > 0) {
                    toast.info(`Processed with some errors: ${result.errors.join(', ')}`);
                } else {
                    toast.success(`Successfully ${action}d ${selectedUsers.size} user(s)`);
                }
                await fetchUsers();
                setSelectedUsers(new Set());
            } else {
                const error = await response.json();
                toast.error(`Error: ${error.error || 'Failed to process request'}`);
            }
        } catch (error) {
            console.error('Error processing bulk action:', error);
            toast.error(`Failed to ${action} users`);
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
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.size === users.length}
                                        onChange={handleSelectAll}
                                        className="rounded"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('name')}>
                                    Name {sortConfig?.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('email')}>
                                    Email {sortConfig?.key === 'email' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('status')}>
                                    Status {sortConfig?.key === 'status' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('created_at')}>
                                    Registered {sortConfig?.key === 'created_at' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                            </tr >
                        </thead >
        <tbody className="divide-y divide-border">
            {sortedUsers.map(user => (
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
                    </table >
                </div >
            </>
        )
}
    </div >
);
}
