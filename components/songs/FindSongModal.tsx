'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import CapabilityIcon from '@/components/ui/CapabilityIcon';
import { Capability } from '@/lib/types';

interface RecommendedSong {
    title: string;
    artist: string;
    key: string;
    tempo: string;
    youtubeUrl: string;
}

interface FindSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSongs: (songs: RecommendedSong[]) => void;
}

export default function FindSongModal({ isOpen, onClose, onAddSongs }: FindSongModalProps) {
    const [step, setStep] = useState<'capabilities' | 'results'>('capabilities');
    const [capabilities, setCapabilities] = useState<Capability[]>([]);
    const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]); // URLs of capabilities
    const [selectedCapabilityNames, setSelectedCapabilityNames] = useState<string[]>([]); // Names for API
    const [isLoadingCaps, setIsLoadingCaps] = useState(false);

    // Recommendations state
    const [recommendations, setRecommendations] = useState<RecommendedSong[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set()); // Indices of selected songs

    // Fetch capabilities on mount/open
    useEffect(() => {
        if (isOpen && capabilities.length === 0) {
            fetchCapabilities();
        }
        if (!isOpen) {
            // Reset state on close
            setStep('capabilities');
            setSelectedCapabilities([]);
            setSelectedCapabilityNames([]);
            setRecommendations([]);
            setSelectedSongs(new Set());
            setSearchError(null);
        }
    }, [isOpen, capabilities.length]);

    const fetchCapabilities = async () => {
        setIsLoadingCaps(true);
        try {
            const res = await fetch('/api/capabilities');
            if (res.ok) {
                const data = await res.json();
                setCapabilities(data);
            }
        } catch (error) {
            console.error('Error fetching capabilities', error);
        } finally {
            setIsLoadingCaps(false);
        }
    };

    const handleCapabilityToggle = (cap: Capability) => {
        if (selectedCapabilities.includes(cap.id)) {
            setSelectedCapabilities(prev => prev.filter(c => c !== cap.id));
            setSelectedCapabilityNames(prev => prev.filter(n => n !== cap.name));
        } else {
            setSelectedCapabilities(prev => [...prev, cap.id]);
            setSelectedCapabilityNames(prev => [...prev, cap.name]);
        }
    };

    const handleFind = async () => {
        if (selectedCapabilityNames.length === 0) return;

        setIsSearching(true);
        setSearchError(null);

        try {
            const res = await fetch('/api/songs/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capabilities: selectedCapabilityNames })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to fetch recommendations');
            }

            const data = await res.json();
            setRecommendations(data);
            setStep('results');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Search error:', error);
            setSearchError(error.message || 'Something went wrong finding songs.');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleSongSelection = (index: number) => {
        const newSelected = new Set(selectedSongs);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedSongs(newSelected);
    };

    const handleConfirmAdd = () => {
        const songsToAdd = recommendations.filter((_, index) => selectedSongs.has(index));
        onAddSongs(songsToAdd);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'capabilities' ? "Find Songs by Instrument" : "Recommended Songs"}
            size="xl"

        >
            <div>
                {step === 'capabilities' ? (
                    <>
                        <p className="text-text-secondary mb-4">
                            Select one or more instruments and ChatGPT will recommend some songs that feature them.
                        </p>

                        {isLoadingCaps ? (
                            <div className="text-center py-8">Loading capabilities...</div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto mb-6">
                                {capabilities.map(cap => {
                                    const isSelected = selectedCapabilities.includes(cap.id);
                                    return (
                                        <div
                                            key={cap.id}
                                            onClick={() => handleCapabilityToggle(cap)}
                                            className={`
                                                cursor-pointer p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center text-center h-[100px] relative group
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
                                            <div className="absolute top-2 left-2 text-xl">
                                                <CapabilityIcon capability={cap} className="w-6 h-6" />
                                            </div>
                                            <div className="mt-4 font-medium text-text-primary capitalize text-sm">
                                                {cap.name}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {searchError && (
                            <div className="mb-4 text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">
                                {searchError}
                            </div>
                        )}

                        <div className="flex justify-between pt-4 border-t border-border">
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                className="text-text-secondary"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={handleFind}
                                disabled={selectedCapabilities.length === 0 || isSearching}
                                variant="primary"
                                className="w-full md:w-auto min-w-[150px]"
                            >
                                {isSearching ? 'Finding Songs...' : 'Find Songs'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-text-secondary mb-4">
                            Select the songs you want to add to the library.
                        </p>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto mb-6">
                            {recommendations.map((song, index) => {
                                const isSelected = selectedSongs.has(index);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => toggleSongSelection(index)}
                                        className={`
                                            flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                            ${isSelected
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-surface border-border hover:border-primary/30'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`
                                                w-5 h-5 rounded border flex items-center justify-center shrink-0
                                                ${isSelected ? 'bg-primary border-primary' : 'border-text-secondary'}
                                            `}>
                                                {isSelected && <span className="text-white text-xs">✓</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-text-primary truncate">{song.title}</div>
                                                <div className="text-sm text-text-secondary truncate">{song.artist}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0 text-xs">
                                            <div className="text-text-secondary text-right hidden md:block">
                                                <div>{song.key}</div>
                                                <div>{song.tempo}</div>
                                            </div>
                                            <a
                                                href={song.youtubeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-primary hover:underline"
                                            >
                                                Listen
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between pt-4 border-t border-border">
                            <Button
                                onClick={() => setStep('capabilities')}
                                variant="ghost"
                                className="text-text-secondary"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleConfirmAdd}
                                disabled={selectedSongs.size === 0}
                                variant="primary"
                            >
                                Add Selected Songs ({selectedSongs.size})
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
