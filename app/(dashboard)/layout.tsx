import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Development mode: No auth checks, just show the content
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 w-full py-8 flex justify-center">
                    <div className="w-full max-w-7xl px-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
