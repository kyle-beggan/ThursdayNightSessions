'use client';

export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
            <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
                <p className="text-text-secondary">
                    At Sleepy Hollows Studios, we take your privacy seriously. This privacy policy describes how your personal information is collected, used, and shared.
                </p>
                <h2 className="text-xl font-semibold text-text-primary mt-6">1. Information We Collect</h2>
                <p className="text-text-secondary">
                    We collect information you provide directly to us, such as your name, email address, phone number, and any other details you choose to share in your profile.
                </p>
                <h2 className="text-xl font-semibold text-text-primary mt-6">2. How We Use Your Information</h2>
                <p className="text-text-secondary">
                    We use the information we collect to operate, maintain, and provide you with the features of the application, including communicating with you via SMS for account updates and notifications.
                </p>
                <h2 className="text-xl font-semibold text-text-primary mt-6">3. SMS Communications</h2>
                <p className="text-text-secondary">
                    By providing your phone number, you explicitly consent to receive informational text messages. We do not sell or share your phone number with third parties for promotional purposes. You can reply STOP to any message to opt out.
                </p>
                {/* Additional placeholder details can go here */}
            </div>
        </div>
    );
}
