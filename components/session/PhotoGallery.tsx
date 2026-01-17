'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SessionPhoto } from '@/lib/types';

import UploadPhotoModal from './UploadPhotoModal';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase/client';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/hooks/useToast';

export default function PhotoGallery({ sessionId, onUpdate }: { sessionId: string; onUpdate?: (count?: number) => void }) {
    const { data: session } = useSession();
    const { confirm } = useConfirm();
    const toast = useToast();
    const [photos, setPhotos] = useState<SessionPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<SessionPhoto | null>(null);
    const supabase = createClient();

    const fetchPhotos = useCallback(async () => {
        try {
            const res = await fetch(`/api/sessions/${sessionId}/photos`);
            if (res.ok) {
                const data = await res.json();
                setPhotos(data);
            }
        } catch (error) {
            console.error('Failed to load photos', error);
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    // Sync photo count with parent
    useEffect(() => {
        if (onUpdate) onUpdate(photos.length);
    }, [photos.length, onUpdate]);

    const getPhotoUrl = (path: string) => {
        const { data } = supabase.storage.from('session-media').getPublicUrl(path);
        return data.publicUrl;
    };

    const handleDelete = async (photo: SessionPhoto) => {
        if (!await confirm({
            title: 'Delete Photo',
            message: 'Are you sure you want to delete this photo? This action cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger'
        })) return;

        try {
            const res = await fetch(`/api/photos/${photo.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Photo deleted');
                setPhotos(prev => prev.filter(p => p.id !== photo.id));
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete photo');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            toast.error('Failed to delete photo');
        }
    };

    const handleUploadComplete = () => {
        fetchPhotos();
        if (onUpdate) onUpdate();
    };

    if (loading) return <div className="h-40 animate-pulse bg-surface-secondary rounded-xl" />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Photos
                </h4>
                {session?.user && (
                    <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="cursor-pointer inline-flex items-center justify-center rounded-lg font-medium transition-colors text-xs h-6 px-2 text-primary bg-surface border border-border hover:bg-primary/10"
                    >
                        + Add Photo
                    </button>
                )}
            </div>

            {photos.length === 0 ? (
                <div className="text-center py-10 bg-surface rounded-xl border border-border border-dashed">
                    <p className="text-text-secondary text-sm">No photos yet.</p>
                    <p className="text-text-tertiary text-xs mt-1">Capture the moment!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-black/10"
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <Image
                                src={getPhotoUrl(photo.storage_path)}
                                alt="Session photo"
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                sizes="(max-width: 768px) 50vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            {/* Delete Button */}
                            {session?.user && (
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                (session.user.userType === 'admin' || session.user.id === photo.user_id) && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDelete(photo);
                                        }}
                                        className="absolute top-2 right-2 w-6 h-6 bg-surface/80 backdrop-blur-sm border border-white/20 rounded-full text-xs text-text-primary hover:text-red-500 hover:bg-white hover:shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center z-10"
                                        title="Delete photo"
                                    >
                                        ✕
                                    </button>
                                )
                            )}
                            {photo.user && (
                                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="text-[10px] text-white font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full w-fit">
                                        by {photo.user.name}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <UploadPhotoModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                sessionId={sessionId}
                onUploadComplete={handleUploadComplete}
            />

            {/* Simple Lightbox Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative w-full max-w-5xl h-full max-h-[85vh]">
                        <Image
                            src={getPhotoUrl(selectedPhoto.storage_path)}
                            alt="Session photo full"
                            fill
                            className="object-contain"
                            priority
                            quality={100}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
