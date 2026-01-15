'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfileGuard() {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!session?.user) return;

        // Condition: Approved user but no phone number
        const needsPhone = session.user.status === 'approved' && !session.user.phone;

        if (needsPhone) {
            // Allow access to /profile and api routes (implicitly)
            if (pathname !== '/profile') {
                router.push('/profile');
            }
        }
    }, [session, pathname, router]);

    return null;
}
