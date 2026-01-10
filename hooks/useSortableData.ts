import { useState, useMemo } from 'react';

type SortConfig<T> = {
    key: keyof T | string; // string allows for nested keys or special keys
    direction: 'ascending' | 'descending';
};

export const useSortableData = <T>(items: T[], config: SortConfig<T> | null = null) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(config);

    const sortedItems = useMemo(() => {
        const sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                // Handle nested properties (e.g., 'user.name') implicitly via helper or explicit switch cases in caller?
                // For a generic hook, we'll try to resolve the value.

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getValue = (item: any, key: string) => {
                    const keys = key.split('.');
                    let value = item;
                    for (const k of keys) {
                        value = value?.[k];
                    }
                    return value;
                };

                const aValue = getValue(a, sortConfig.key as string);
                const bValue = getValue(b, sortConfig.key as string);

                // Handle string comparisons (case-insensitive)
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    if (aValue.toLowerCase() < bValue.toLowerCase()) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aValue.toLowerCase() > bValue.toLowerCase()) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                    return 0;
                }

                // Handle dates (if they are strings or Date objects)
                // Often better to let the caller pass comparable values, but we can try simple check
                // If it looks like a date string? No, simpler to rely on > < operators which work for ISO strings usually.

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: keyof T | string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'ascending'
        ) {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};
