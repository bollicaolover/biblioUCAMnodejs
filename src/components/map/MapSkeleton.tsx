import type { CSSProperties } from 'react';
import { SEATS } from '@/lib/constants/seats';

function Shimmer({ className, style, variant }: { className?: string; style?: CSSProperties; variant?: 'default' | 'green' | 'orange' | 'red' }) {
    const variantClass =
        variant === 'green' ? 'ucam-shimmer--green'
        : variant === 'orange' ? 'ucam-shimmer--orange'
        : variant === 'red' ? 'ucam-shimmer--red'
        : 'ucam-shimmer';
    return <div className={`${variantClass} ${className ?? ''}`} style={style} aria-hidden />;
}

const STAT_FILTERS = [
    { color: '#16A34A', variant: 'green' as const },
    { color: '#D97706', variant: 'orange' as const },
    { color: '#DC2626', variant: 'red' as const },
];

export function MapDateTabsSkeleton() {
    return (
        <div className="flex gap-2 overflow-hidden">
            {[72, 88, 96, 80, 76].map((w, i) => (
                <Shimmer key={i} className="h-9 rounded-full flex-shrink-0" style={{ width: w }} />
            ))}
        </div>
    );
}

export function MapStatsSkeleton() {
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {STAT_FILTERS.map(({ color, variant }) => (
                <div
                    key={color}
                    className="rounded-xl border bg-white px-2 py-2 sm:py-3 shadow-sm"
                    style={{ borderColor: color }}
                >
                    <Shimmer variant={variant} className="h-6 sm:h-7 w-10 mx-auto mb-2 rounded-md" />
                    <Shimmer variant={variant} className="h-3 w-20 max-w-full mx-auto rounded" />
                </div>
            ))}
        </div>
    );
}

export function MapGridSkeleton({ selectedRow }: { selectedRow: string }) {
    const rows = Object.entries(SEATS)
        .map(([rowStr, rowSeats]) => ({
            row: Number(rowStr),
            count: Object.keys(rowSeats).length,
        }))
        .filter(({ row }) => selectedRow === 'all' || row === Number(selectedRow))
        .sort((a, b) => a.row - b.row);

    return (
        <div className="pb-10">
            {rows.map(({ row, count }) => (
                <div key={row} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 mb-4">
                    <Shimmer className="h-4 w-14 mb-3 rounded" />
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: count }).map((_, i) => (
                            <Shimmer key={i} className="w-10 h-10 rounded-lg" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
