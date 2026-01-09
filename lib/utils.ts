import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function formatDate(date: string | Date): string {
    let d: Date;
    if (typeof date === 'string') {
        // If date is YYYY-MM-DD, append T00:00:00 to force local time
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            d = new Date(date + 'T00:00:00');
        } else {
            d = new Date(date);
        }
    } else {
        d = date;
    }
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

export function isAdmin(userType: string): boolean {
    return userType === 'admin';
}
