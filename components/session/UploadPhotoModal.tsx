'use client';

import { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import { useToast } from '@/hooks/useToast';
import Modal from '@/components/ui/Modal'; // Assuming generic Modal exists, or I will adapt

interface UploadPhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
    onUploadComplete: () => void;
}

export default function UploadPhotoModal({ isOpen, onClose, sessionId, onUploadComplete }: UploadPhotoModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Basic validation
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('File size must be less than 5MB');
                return;
            }

            if (!selectedFile.type.startsWith('image/')) {
                toast.error('Only image files are allowed');
                return;
            }

            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/api/sessions/${sessionId}/photos/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to upload photo');
            }

            toast.success('Photo uploaded successfully!');
            onUploadComplete();
            handleClose();
        } catch (error) {
            console.error('Upload error:', error);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toast.error((error as any).message || 'Failed to upload photo');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload Photo">
            <div className="space-y-6">

                {/* File Selection Area */}
                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer bg-surface md:hover:bg-surface-hover"
                    >
                        <svg className="w-12 h-12 text-text-secondary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-text-primary font-medium">Click to select photo</p>
                        <p className="text-text-tertiary text-sm mt-1">JPG, PNG up to 5MB</p>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden border border-border aspect-video bg-black/50">
                        {previewUrl && (
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                fill
                                className="object-contain"
                            />
                        )}
                        <button
                            onClick={() => {
                                setFile(null);
                                setPreviewUrl(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                />

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
