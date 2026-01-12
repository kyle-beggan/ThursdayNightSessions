import React from 'react';

interface CapabilityIconProps {
    capability: {
        name: string;
        icon?: string;
    };
    className?: string;
}

const CapabilityIcon: React.FC<CapabilityIconProps> = ({ capability, className = "w-4 h-4" }) => {
    const name = capability.name.toLowerCase();
    const dbIcon = capability.icon;

    // Helper for common SVG props
    const svgProps = {
        className: `fill-current ${className}`,
        viewBox: "0 0 24 24",
        xmlns: "http://www.w3.org/2000/svg"
    };

    // If a specific icon is set in the DB, use it
    if (dbIcon) {
        return <span className={className}>{dbIcon}</span>;
    }

    // --- Guitars ---

    // Acoustic Guitar: Rounded body, sound hole
    if (name.includes('acoustic')) {
        return (
            <svg {...svgProps}>
                <path d="M6 3L8 3L8 8C8 8 7 9 7 10C7 11 8 13 8 13L9 13C10 13 11 12 11 11L11 3L13 3L13 11C13 12 14 13 15 13L16 13C16 13 17 11 17 10C17 9 16 8 16 8L16 3L18 3L18 8C18 10 19 12 19 15C19 19 16 22 12 22C8 22 5 19 5 15C5 12 6 10 6 8L6 3Z" />
                <circle cx="12" cy="16" r="2.5" className="fill-background stroke-current stroke-1" />
            </svg>
        );
    }

    // Bass Guitar: Longer neck, distinct body 
    if (name.includes('bass')) {
        return (
            <svg {...svgProps}>
                <path d="M10.5 2L13.5 2L13.5 9L15 9C16.5 9 17.5 10.5 17.5 12.5C17.5 16 16.5 22 12 22C7.5 22 6.5 16 6.5 12.5C6.5 10.5 7.5 9 9 9L10.5 9L10.5 2Z" />
                <path d="M12 2L12 22" className="stroke-background stroke-1" fill="none" />
            </svg>
        );
    }

    // Rhythm Guitar: Electric shape with a chord symbol overlay or just solid blocking
    if (name.includes('rhythm')) {
        return (
            <svg {...svgProps}>
                <path d="M9 2L15 2L15 8L17 8L18 12L17 18L15 22L9 22L7 18L6 12L7 8L9 8L9 2Z" />
                {/* 'R' for Rhythm or Chord shape */}
                <text x="12" y="16" fontSize="8" textAnchor="middle" fill="white" fontWeight="bold">R</text>
            </svg>
        );
    }

    // Lead Guitar: Sharp, angular, maybe a lightning bolt feel
    if (name.includes('lead')) {
        return (
            <svg {...svgProps}>
                <path d="M12 2L14 10L19 10L15 14L17 21L12 17L7 21L9 14L5 10L10 10L12 2Z" />
            </svg>
        );
    }

    // Generic Electric
    if (name.includes('electric') || name.includes('guitar')) {
        return (
            <svg {...svgProps}>
                <path d="M11 2L13 2L13 9L16 9L17 12L16 18L14 22L10 22L8 18L7 12L8 9L11 9L11 2Z" />
            </svg>
        );
    }

    // --- Saxophones ---

    // Alto Sax: Straight neck curve
    if (name.includes('alto')) {
        return (
            <svg {...svgProps}>
                <path d="M9 2C9 2 11 2 11 4V14C11 17 13 19 16 19C18 19 19 17 19 17L21 18C21 18 19 22 15 22C10 22 7 18 7 14V6C7 4 8 3 9 2Z" />
                <path d="M11 6L7 6" className="stroke-current stroke-2" />
            </svg>
        );
    }

    // Tenor Sax: Larger gooseneck
    if (name.includes('tenor')) {
        return (
            <svg {...svgProps}>
                <path d="M8 2C10 2 10 4 10 5V15C10 19 13 22 16 22C19 22 21 19 21 19L19 17C19 17 18 19 16 19C14 19 13 17 13 14V6C13 3 10 0 7 0L6 2L8 2Z" />
            </svg>
        );
    }

    // Baritone Sax: Looped neck
    if (name.includes('bari')) {
        return (
            <svg {...svgProps}>
                <path d="M6 4C6 2 8 2 8 2V12C8 16 11 19 15 19C18 19 19 17 19 17L21 18C21 18 18 22 14 22C9 22 4 17 4 12V6C4 4 6 4 6 4Z" />
                <circle cx="7" cy="6" r="2" />
            </svg>
        );
    }

    // Soprano: Straight
    if (name.includes('soprano')) {
        return (
            <svg {...svgProps}>
                <path d="M11 2L13 2L14 20C14 21 13 22 12 22C11 22 10 21 10 20L11 2Z" />
                <circle cx="12" cy="18" r="1.5" className="fill-background" />
            </svg>
        );
    }

    // Generic Sax
    if (name.includes('sax')) {
        return (
            <svg {...svgProps}>
                <path d="M9 2C9 2 11 2 11 4V14C11 17 13 19 16 19C18 19 19 17 19 17L21 18C21 18 19 22 15 22C10 22 7 18 7 14V6C7 4 8 3 9 2Z" />
            </svg>
        );
    }

    // --- Others / Fallback ---

    // Drums
    if (name.includes('drum')) {
        return <span className={className}>🥁</span>;
    }

    // Vocals
    if (name.includes('vocal') || name.includes('voice')) {
        return <span className={className}>🎤</span>;
    }


    // Default Database Icon or Emoji
    return <span className={className}>{dbIcon || '🎵'}</span>;
};

export default CapabilityIcon;
