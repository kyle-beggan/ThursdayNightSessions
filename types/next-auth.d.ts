import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            userType: string;
            status: string;
            phone?: string | null;
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
        userType: string;
        status: string;
        phone?: string | null;
    }
}
