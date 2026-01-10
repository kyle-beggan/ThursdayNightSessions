'use client';

import { useState } from 'react';
import Link from 'next/link';
import BackupRestoreModal from './BackupRestoreModal';

export default function AdminQuickActions() {
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

    return (
        <div className="mt-8">
            <h2 className="text-xl font-semibold text-text-primary mt-[25px]">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 mt-[25px]">
                <Link
                    href="/admin/approvals"
                    className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
                >
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">✅</div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-1">
                                User Approvals
                            </h3>
                            <p className="text-text-secondary text-sm">
                                Review and approve pending user registrations
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/admin/users"
                    className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
                >
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">👥</div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-1">
                                Manage Users
                            </h3>
                            <p className="text-text-secondary text-sm">
                                View, edit, and manage all user accounts
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/admin/sessions"
                    className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
                >
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">📅</div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-1">
                                Manage Sessions
                            </h3>
                            <p className="text-text-secondary text-sm">
                                Create, edit, and delete studio sessions
                            </p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/admin/capabilities"
                    className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors"
                >
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">🎸</div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-1">
                                Manage Capabilities
                            </h3>
                            <p className="text-text-secondary text-sm">
                                Add, edit, and remove user capabilities
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Backup & Restore Action */}
                <div
                    onClick={() => setIsBackupModalOpen(true)}
                    className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer"
                >
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">🛢️</div>
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-1">
                                Backup & Restore
                            </h3>
                            <p className="text-text-secondary text-sm">
                                Export database backup or restore from file
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <BackupRestoreModal
                isOpen={isBackupModalOpen}
                onClose={() => setIsBackupModalOpen(false)}
            />
        </div>
    );
}
