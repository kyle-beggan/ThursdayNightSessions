'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme') as Theme;
            if (saved) return saved;
        }
        return 'dark';
    });

    useEffect(() => {
        // Sync the HTML attribute with current theme
        document.documentElement.setAttribute('data-theme', theme);
        // Also persist to localStorage (though toggleTheme handles this, ensuring on mount is good)
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // prevent hydration mismatch
    // However, we MUST wrap in Provider, otherwise children calling useTheme will crash.
    // We suppress hydration warning on the html element usually, but here we just accept 
    // that 'theme' is 'dark' on first render. The Effect updates it.

    // If we really want to prevent hydration mismatch for the specific UI that depends on theme,
    // We must provide context even during hydration/SSR to prevent consuming components from crashing.
    // The initial state matches the default 'dark', so hydration is consistent if server defaults to dark.
    // Actually, simpler: Just render the provider. The state starts as 'dark'.

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {/* 
              We can render children always. 
              If children use theme for styling that differs from server, 
              React might warn. But crashing is worse.
            */}
            {children}
        </ThemeContext.Provider>
    );
}

// Actually, I'll allow the rewrite to standard form:
// Always return Provider.


export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
