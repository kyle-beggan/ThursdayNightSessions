'use client';

import { useState, useEffect } from 'react';
import { Song } from '@/lib/types';

interface SongPickerProps {
    onSelect: (song: Song) => void;
    onCancel: () => void;
}

export default function SongPicker({ onSelect, onCancel }: SongPickerProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const fetchSongs = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/songs?search=${encodeURIComponent(query)}&available_only=false`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error('Error searching songs:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSongs, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div className="bg-surface border border-border rounded-lg p-3 space-y-3 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-text-primary">Add Song to Session</h4>
                <button onClick={onCancel} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>

            <div className="relative">
                <input
                    type="text"
                    autoFocus
                    placeholder="Search song library..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                    }}
                />

                {query && (
                    <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-md shadow-xl max-h-48 overflow-y-auto">
                        {loading ? (
                            <div className="p-2 text-xs text-text-secondary text-center">Searching...</div>
                        ) : results.length > 0 ? (
                            <ul className="py-1">
                                {results.map(song => (
                                    <li
                                        key={song.id}
                                        onClick={() => onSelect(song)}
                                        className="px-3 py-2 hover:bg-surface-hover cursor-pointer flex flex-col"
                                    >
                                        <span className="text-sm font-medium text-text-primary">{song.title}</span>
                                        <span className="text-xs text-text-secondary">{song.artist}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-2 text-xs text-text-secondary text-center">No songs found.</div>
                        )}
                    </div>
                )}
            </div>
            <div className="text-xs text-text-secondary text-center">
                Search for an existing song to add it to this session.
            </div>
        </div>
    );
}
