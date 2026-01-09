import Image from 'next/image';

export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
            <div className="w-full max-w-md">
                <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-6">
                        <Image
                            src="/logo.png"
                            alt="Sleepy Hollows Studios"
                            width={100}
                            height={100}
                            className="rounded-lg mb-4"
                        />
                        <h1 className="text-2xl font-bold text-text-primary text-center">
                            Account Under Review
                        </h1>
                    </div>

                    {/* Message */}
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
                        <p className="text-text-primary text-center">
                            Your account is currently under review. An admin will approve your access soon.
                        </p>
                    </div>

                    <p className="text-text-secondary text-sm text-center">
                        You&apos;ll be notified by email once your account has been approved.
                        Please check back later or contact an administrator if you have questions.
                    </p>
                </div>
            </div>
        </div>
    );
}
