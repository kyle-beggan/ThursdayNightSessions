export type UserType = 'admin' | 'user';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'session_reminder' | 'broadcast';
export type NotificationChannel = 'sms' | 'email';
export type SongStatus = 'active' | 'archived' | 'proposed';

export interface Song {
    id: string;
    title: string;
    artist?: string;
    key?: string;
    tempo?: string;
    resource_url?: string;
    status: SongStatus;
    created_by?: string;
    created_at: string;
    updated_at: string;
    session_date?: string; // Derived field for display
    session_id?: string;   // Derived field for linking
    capabilities?: { id: string; name: string; icon?: string }[];
}

export interface User {
    id: string;
    email: string;
    phone: string;
    name: string;
    user_type: UserType;
    status: UserStatus;
    created_at: string;
    updated_at: string;
}

export interface Capability {
    id: string;
    name: string;
    icon?: string;
    created_at: string;
}

export interface UserCapability {
    id: string;
    user_id: string;
    capability_id: string;
    capability?: Capability;
}

export interface Session {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    songs?: SessionSong[];
    commitments?: SessionCommitment[];
}

export interface SessionSong {
    id: string;
    session_id: string;
    song_name: string;
    song_url?: string;
    order: number;
    song_artist?: string; // Enriched from songs table
    capabilities?: Capability[]; // Enriched from songs table
}

export interface SessionCommitment {
    id: string;
    session_id: string;
    user_id: string;
    committed_at: string;
    user?: User;
    capabilities?: Capability[];
}

export interface Notification {
    id: string;
    sent_by: string;
    notification_type: NotificationType;
    channel: NotificationChannel;
    session_id?: string;
    message: string;
    recipient_count: number;
    sent_at: string;
}

// Extended types with relations
export interface SessionRecording {
    id: string;
    session_id: string;
    url: string;
    title: string;
    created_at: string;
    created_by?: string;
}

export interface UserWithCapabilities extends User {
    capabilities: Capability[];
}

export interface SessionWithDetails extends Session {
    songs: SessionSong[];
    commitments: (SessionCommitment & { user: UserWithCapabilities })[];
    recordings?: SessionRecording[];
}
