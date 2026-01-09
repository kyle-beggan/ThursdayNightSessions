type StatusBadgeProps = {
    status: 'pending' | 'approved' | 'rejected';
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const styles = {
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        approved: 'bg-green-500/20 text-green-400 border-green-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const icons = {
        pending: '⏳',
        approved: '✅',
        rejected: '❌',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
            <span>{icons[status]}</span>
            <span className="capitalize">{status}</span>
        </span>
    );
}
