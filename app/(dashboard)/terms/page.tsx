'use client';

import Link from 'next/link';

export default function TermsAndConditionsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Terms and Conditions</h1>
            <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
                <p className="text-text-secondary">
                    Welcome to Sleepy Hollows Studios Thursday Night Sessions. By using our application, you agree to comply with and be bound by the following terms and conditions of use.
                </p>
                <h2 className="text-xl font-semibold text-text-primary mt-6">1. Usage</h2>
                <p className="text-text-secondary">
                    You agree to use this application only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else&apos;s use and enjoyment of the application.
                </p>
                <h2 className="text-xl font-semibold text-text-primary mt-6">2. Content</h2>
                <p className="text-text-secondary">
                    The content of the pages of this application is for your general information and use only. It is subject to change without notice.
                </p>
                <h2 className="text-xl font-semibold text-text-primary mt-6">3. SMS Communications</h2>
                <p className="text-text-secondary">
                    A. By opting into SMS messaging from Sleepy Hollows, you agree to receive informational messages regarding account notifications, updates, and service alerts. Message frequency varies. Message and data rates may apply. You may opt out at any time by replying STOP. Reply HELP for support.
                    <br></br><br></br>B. We will only send communication with band mates to remind them of upcoming recording sessions and other texts to coordinate band activities.
                    <br></br><br></br>B. You can cancel the SMS service at any time. Just text <b>&quot;STOP&quot;</b> to the short code. After you send the SMS message &quot;STOP&quot; to us, we will send you an SMS message to confirm that you have been unsubscribed. After this, you will no longer receive SMS messages from us. If you want to join again, just sign up as you did the first time and we will start sending SMS messages to you again.
                    <br></br><br></br>C. If you are experiencing issues with the messaging program you can reply with the keyword HELP for more assistance, or you can get help directly by texting Neal or Kyle at the phone numbers in their profile.
                    <br></br><br></br>D. Carriers are not liable for delayed or undelivered messages.
                    <br></br><br></br>E. As always, message and data rates may apply for any messages sent to you from us and to us from you. You could receive daily text messages, especially leading up to a session. If you have any questions about your text plan or data plan, it is best to contact your wireless provider.
                    <br></br><br></br>F. If you have any questions regarding privacy, please read our <Link href="/privacy" className="text-primary hover:underline font-bold transition-colors">privacy policy</Link>.
                </p>
                {/* Additional placeholder terms can go here */}
            </div>
        </div>
    );
}
