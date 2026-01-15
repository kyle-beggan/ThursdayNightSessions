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

export function formatPhoneNumber(value: string): string {
    const numbers = value.replace(/\D/g, '');

    // Limit to 10 digits
    const truncated = numbers.slice(0, 10);

    // Format: 555-555-5555
    if (truncated.length > 6) {
        return `${truncated.slice(0, 3)}-${truncated.slice(3, 6)}-${truncated.slice(6)}`;
    }
    if (truncated.length > 3) {
        return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
    }
    return truncated;
}

export function isAdmin(userType: string): boolean {
    return userType === 'admin';
}

export function generateGoogleCalendarLink(session: { date: string, start_time: string, end_time: string, id: string }): string {
    // Combine date and time
    const startDateTime = new Date(`${session.date}T${session.start_time}`);
    const endDateTime = new Date(`${session.date}T${session.end_time}`);

    // Format for Google Calendar: YYYYMMDDTHHmmssZ (approximate, handling timezone manually or assuming UTC/Local)
    // Actually, Google Calendar URL prefers YYYYMMDDTHHmmss without Z for floating time (local), or with Z for UTC.
    // Since we store times as strings and assume EST generally in the UI but DB might vary...
    // Let's rely on the browser's local time interpretation of the string construction above,
    // then convert to simple string format.
    // Ideally, we'd use a library like date-fns, but let's do simple formatting.

    const formatGCalDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const start = formatGCalDate(startDateTime);
    const end = formatGCalDate(endDateTime);

    const title = encodeURIComponent("Thursday Night Session");
    const details = encodeURIComponent("Rehearsal Session. Check the app for setlist and details.");
    const location = encodeURIComponent("The Studio"); // Or make dynamic if we tracked location

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export function downloadICSFile(session: { date: string, start_time: string, end_time: string, id: string }) {
    const startDateTime = new Date(`${session.date}T${session.start_time}`);
    const endDateTime = new Date(`${session.date}T${session.end_time}`);

    const formatDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SleepyHollows//ThursdayNightSessions//EN
BEGIN:VEVENT
UID:${session.id}@sleepyhollows.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDateTime)}
DTEND:${formatDate(endDateTime)}
SUMMARY:Thursday Night Session
DESCRIPTION:Rehearsal Session. Check the app for setlist and details.
LOCATION:The Studio
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `session-${session.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
