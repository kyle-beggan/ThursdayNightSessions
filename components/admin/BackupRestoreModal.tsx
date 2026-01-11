import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface BackupRestoreModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BackupRestoreModal({ isOpen, onClose }: BackupRestoreModalProps) {
    const [isRestoring, setIsRestoring] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [restoreResult, setRestoreResult] = useState<{ success: boolean; details?: unknown; error?: string } | null>(null);

    const handleBackup = () => {
        // Trigger download via direct link
        window.location.href = '/api/admin/backup';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setRestoreResult(null);
        }
    };

    const handleRestore = async () => {
        if (!file) return;

        if (!confirm('WARNING: This will overwrite existing data with the data from the backup file. Are you sure you want to proceed?')) {
            return;
        }

        setIsRestoring(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/restore', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setRestoreResult({ success: true, details: data.results });
                alert('Restore completed successfully!');
            } else {
                setRestoreResult({ success: false, error: data.error });
                alert(`Restore failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Restore error:', error);
            setRestoreResult({ success: false, error: 'Network or server error' });
            alert('Restore failed due to an error.');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Data Backup & Restore">
            <div className="space-y-8">
                {/* Backup Section */}
                <div className="bg-surface-secondary/30 p-4 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Backup Data</h3>
                    <p className="text-sm text-text-secondary mb-4">
                        Download a complete backup of the database (Users, Sessions, Songs, etc.) as an Excel file.
                    </p>
                    <Button onClick={handleBackup} variant="secondary" className="w-full sm:w-auto border border-border">
                        📥 Download Backup (.xlsx)
                    </Button>
                </div>

                <div className="border-t border-border"></div>

                {/* Restore Section */}
                <div className="bg-surface-secondary/30 p-4 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Restore Data</h3>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 mb-4">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                            ⚠️ Warning: Restoring data will update existing records and insert new ones. Please ensure your backup file is valid.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                                Select Backup File (.xlsx)
                            </label>
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-text-secondary
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary/10 file:text-primary
                                    hover:file:bg-primary/20
                                "
                            />
                        </div>

                        {file && (
                            <Button
                                onClick={handleRestore}
                                variant="primary"
                                disabled={isRestoring}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 border-red-600"
                            >
                                {isRestoring ? 'Restoring...' : '🔄 Restore from Backup'}
                            </Button>
                        )}

                        {restoreResult && (
                            <div className={`text-sm p-3 rounded ${restoreResult.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                {restoreResult.success ? (
                                    <div className="whitespace-pre-wrap font-mono text-xs">
                                        Success! Tables processed:
                                        {JSON.stringify(restoreResult.details, null, 2)}
                                    </div>
                                ) : (
                                    <span>Error: {restoreResult.error}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={onClose} variant="ghost">
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
