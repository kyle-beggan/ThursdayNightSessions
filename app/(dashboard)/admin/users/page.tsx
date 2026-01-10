'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/admin/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useSortableData } from '@/hooks/useSortableData';

// Checking imports, I don't see toaster in the file list but I can check if it exists.
// Actually, I'll stick to 'alert' fallback if toast doesn't exist, but wait, the plan said "toast/notification".
// I'll check if Toaster content exists or simply use valid UI.
// Let's stick to using Modal for confirmation and simple alert/console for errors if no toast system.
// Wait, I can see Button and Modal are in components/ui.
// I'll add the logic now.

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

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const { items: sortedUsers, requestSort, sortConfig } = useSortableData(filteredUsers);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, statusFilter]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        if (statusFilter === 'admin') {
            filtered = filtered.filter(u => u.user_type === 'admin');
        } else if (statusFilter !== 'all') {
            filtered = filtered.filter(u => u.status === statusFilter);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term)
            );
        }

        setFilteredUsers(filtered);
    };

    const handleQuickAction = async (userId: string, action: 'approve' | 'reject' | 'make-admin') => {
        try {
            const updates: Partial<User> = {};

            if (action === 'approve') {
                updates.status = 'approved';
            } else if (action === 'reject') {
                updates.status = 'rejected';
            } else if (action === 'make-admin') {
                if (!confirm('Are you sure you want to make this user an admin?')) {
                    return;
                }
                updates.user_type = 'admin';
            }

            const response = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, updates }),
            });

            if (response.ok) {
                await fetchUsers();
            } else {
                alert('Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
        }
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/users?userId=${userToDelete.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remove from local state immediately for responsiveness
                setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('An unexpected error occurred');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-text-secondary">Loading users...</p>
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
                <h1 className="text-3xl font-bold text-text-primary mb-2">Manage Users</h1>
                <p className="text-text-secondary">View and manage all user accounts</p>
            </div>

            {/* Filters */}
            <div className="bg-surface border border-border rounded-lg p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'approved', 'rejected', 'admin'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                    ? 'bg-primary text-white'
                                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-text-secondary text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{users.length}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-text-secondary text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">
                        {users.filter(u => u.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-text-secondary text-sm">Approved</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                        {users.filter(u => u.status === 'approved').length}
                    </p>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-text-secondary text-sm">Admins</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                        {users.filter(u => u.user_type === 'admin').length}
                    </p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-surface-secondary">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('name')}>
                                Name {sortConfig?.key === 'name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('email')}>
                                Email {sortConfig?.key === 'email' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('status')}>
                                Status {sortConfig?.key === 'status' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('user_type')}>
                                Type {sortConfig?.key === 'user_type' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                Capabilities
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sortedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            sortedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-surface-secondary transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-text-primary">{user.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-sm ${user.user_type === 'admin' ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
                                            {user.user_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {user.capabilities.slice(0, 3).map(cap => (
                                                <span
                                                    key={cap.id}
                                                    className="px-2 py-0.5 bg-surface-tertiary text-text-secondary text-xs rounded"
                                                >
                                                    <span className="capitalize">{cap.name}</span>
                                                </span>
                                            ))}
                                            {user.capabilities.length > 3 && (
                                                <span className="px-2 py-0.5 text-text-secondary text-xs">
                                                    +{user.capabilities.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <div className="flex gap-2">
                                                {user.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleQuickAction(user.id, 'approve')}
                                                            className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-md transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleQuickAction(user.id, 'reject')}
                                                            className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {user.user_type !== 'admin' && user.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleQuickAction(user.id, 'make-admin')}
                                                        className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                                                    >
                                                        Make Admin
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                    className="px-3 py-1.5 text-xs font-medium bg-surface-tertiary text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete User"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-text-secondary">
                        Are you sure you want to delete <span className="font-semibold text-text-primary">{userToDelete?.name}</span>?
                        This action cannot be undone and will remove all their data and commitments.
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                        <Button
                            onClick={() => setIsDeleteModalOpen(false)}
                            variant="ghost"
                            disabled={isDeleting}
                            className="w-[100px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            variant="danger"
                            disabled={isDeleting}
                            className="w-[100px]"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
