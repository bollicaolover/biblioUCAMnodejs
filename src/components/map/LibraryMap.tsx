'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { SEATS } from '@/lib/constants/seats';
import { LIBRARY_SERVICE_ID } from '@/lib/constants/schedules';
import { BookingModal } from '@/components/booking/BookingModal';
import { MapGridSkeleton } from '@/components/map/MapSkeleton';
import { BookingSuccessToast } from '@/components/ui/BookingSuccessToast';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import type { MapSeat, SelectedSeat, SeatStatus } from '@/types/ui';
import type { SlotsApiResponse, SlotTimeFrame, SlotFreeItem } from '@/types/api';
import { trackSelectSeat } from '@/lib/analytics/events';

interface LibraryMapProps {
    isLoggedIn: boolean;
    onSessionExpired: () => void;
    onBookingSuccess?: () => void;
}

type AvailabilityMap = Record<number, Record<number, SeatStatus>>;
type FreeslotsData = SlotsApiResponse['data']['freeslots'];

function todaySpain() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

function computeSeatStatus(pitchId: string, freeslots: FreeslotsData, selectedDate: string): SeatStatus {
    const isToday = selectedDate === todaySpain();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const daySlots = freeslots[selectedDate];
    if (!daySlots) return 'available';

    const totalSlots = daySlots.length;
    let availableSlots = 0;
    let occupiedNow = false;

    for (const frame of daySlots as SlotTimeFrame[]) {
        const freeItems: SlotFreeItem[] = Array.isArray(frame.free) ? frame.free : Object.values(frame.free);
        const isFree = freeItems.map((f) => f.name).includes(pitchId);

        if (isFree) availableSlots++;

        if (isToday) {
            const [startH, startM] = frame.start.split(':').map(Number);
            const [endH, endM] = frame.end.split(':').map(Number);
            if (nowMinutes >= startH * 60 + startM && nowMinutes <= endH * 60 + endM && !isFree) {
                occupiedNow = true;
            }
        }
    }

    if (occupiedNow) return 'occupied';
    if (availableSlots === totalSlots) return 'available';
    if (availableSlots > 0) return 'partially';
    return 'occupied';
}

function formatDateTab(dateStr: string): { short: string; full: string } {
    const today = todaySpain();
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
    if (dateStr === today) return { short: 'Hoy', full: 'Hoy' };
    if (dateStr === tomorrow) return { short: 'Mañana', full: 'Mañana' };
    const date = new Date(dateStr + 'T12:00:00');
    const short = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    const full = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return { short: short.charAt(0).toUpperCase() + short.slice(1), full };
}

function StatFilterButton({
    label,
    value,
    color,
    active,
    onToggle,
    bumpKey,
}: {
    label: string;
    value: number;
    color: string;
    active: boolean;
    onToggle: () => void;
    bumpKey: string;
}) {
    const animated = useAnimatedNumber(value, 320);

    return (
        <button
            type="button"
            onClick={onToggle}
            className="min-w-0 overflow-hidden rounded-xl px-2 py-2 sm:py-3 text-center shadow-sm border transition-[color,background-color,border-color,transform,box-shadow] duration-200 cursor-pointer active:scale-[0.98]"
            style={active
                ? { backgroundColor: color, borderColor: color, color: 'white' }
                : { backgroundColor: 'white', borderColor: color, color }}
        >
            <p key={bumpKey} className="text-lg sm:text-xl font-bold stat-pop">{animated}</p>
            <p className="text-[10px] sm:text-xs font-medium mt-0.5 truncate">{label}</p>
        </button>
    );
}

function DateTabs({
    dates,
    selectedDate,
    onSelect,
}: {
    dates: string[];
    selectedDate: string;
    onSelect: (date: string) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [pill, setPill] = useState({ left: 0, width: 0 });

    useEffect(() => {
        function updatePill() {
            const el = tabRefs.current[selectedDate];
            const container = containerRef.current;
            if (!el || !container) return;
            setPill({ left: el.offsetLeft, width: el.offsetWidth });
        }
        updatePill();
        const frame = requestAnimationFrame(updatePill);
        window.addEventListener('resize', updatePill);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', updatePill);
        };
    }, [selectedDate, dates]);

    return (
        <div className="overflow-x-auto scrollbar-none">
            <div ref={containerRef} className="relative flex gap-2 w-max min-w-full">
                <div
                    className="date-pill-indicator absolute top-0 bottom-0 rounded-full bg-[#002855] pointer-events-none"
                    style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
                    aria-hidden
                />
            {dates.map((date) => {
                const { short, full } = formatDateTab(date);
                const isSelected = date === selectedDate;
                return (
                    <button
                        key={date}
                        ref={(el) => { tabRefs.current[date] = el; }}
                        type="button"
                        onClick={() => onSelect(date)}
                        title={full}
                        className={`relative z-10 flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 ${isSelected ? 'text-white' : 'text-[#64748B] hover:text-[#002855]'}`}
                    >
                        {short}
                    </button>
                );
            })}
            </div>
        </div>
    );
}

export function LibraryMap({ isLoggedIn, onSessionExpired, onBookingSuccess }: LibraryMapProps) {
    const [freeslots, setFreeslots] = useState<FreeslotsData>({});
    const [availability, setAvailability] = useState<AvailabilityMap>({});
    const [hasLoaded, setHasLoaded] = useState(false);
    const [isDateSwitching, setIsDateSwitching] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null);
    const [stats, setStats] = useState({ total: 0, available: 0, partially: 0, occupied: 0 });
    const [selectedDate, setSelectedDate] = useState<string>(todaySpain());
    const [showFree, setShowFree] = useState(false);
    const [showPartial, setShowPartial] = useState(false);
    const [showOccupied, setShowOccupied] = useState(false);
    const [selectedRow, setSelectedRow] = useState<string>('all');
    const [pulsePitchId, setPulsePitchId] = useState<string | null>(null);
    const [mapRowsKey, setMapRowsKey] = useState(0);
    const [headerScrolled, setHeaderScrolled] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successToastId, setSuccessToastId] = useState(0);
    const scrollSentinelRef = useRef<HTMLDivElement>(null);
    const selectedDateRef = useRef(selectedDate);
    const dateSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    selectedDateRef.current = selectedDate;

    const showMapSkeleton = !hasLoaded || isDateSwitching;

    const recomputeAvailability = useCallback((data: FreeslotsData, date: string) => {
        const newAvailability: AvailabilityMap = {};
        let av = 0, pa = 0, oc = 0, tot = 0;

        for (const [rowStr, rowData] of Object.entries(SEATS)) {
            const row = Number(rowStr);
            newAvailability[row] = {};
            for (const [seatStr, pitchId] of Object.entries(rowData)) {
                const seat = Number(seatStr);
                const status = computeSeatStatus(pitchId, data, date);
                newAvailability[row][seat] = status;
                tot++;
                if (status === 'available') av++;
                else if (status === 'partially') pa++;
                else if (status === 'occupied') oc++;
            }
        }

        setAvailability(newAvailability);
        setStats({ total: tot, available: av, partially: pa, occupied: oc });
    }, []);

    const loadAvailability = useCallback(async (background = false) => {
        if (!background) setHasLoaded(false);
        try {
            const res = await fetch(`/api/slots/${LIBRARY_SERVICE_ID}`);
            const json = await res.json() as { ok: boolean; data?: SlotsApiResponse; error?: string; code?: number };
            if (!json.ok) { if (json.code === 401) onSessionExpired(); return; }
            const data = json.data?.data?.freeslots ?? {};
            setFreeslots(data);
            recomputeAvailability(data, selectedDateRef.current);
        } catch { /* silently fail */ } finally {
            if (!background) {
                setHasLoaded(true);
                setMapRowsKey((k) => k + 1);
            }
        }
    }, [onSessionExpired, recomputeAvailability]);

    const handleBookingSuccess = useCallback(() => {
        const pitchId = selectedSeat?.pitchId ?? null;
        if (pitchId) {
            setPulsePitchId(pitchId);
            window.setTimeout(() => setPulsePitchId(null), 450);
        }
        setSuccessToastId((id) => id + 1);
        setShowSuccessToast(true);
        loadAvailability(true);
        onBookingSuccess?.();
    }, [selectedSeat, loadAvailability, onBookingSuccess]);

    useEffect(() => {
        const sentinel = scrollSentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => setHeaderScrolled(!entry.isIntersecting),
            { threshold: 0 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    useEffect(() => { loadAvailability(); }, [loadAvailability]);

    useEffect(() => {
        if (Object.keys(freeslots).length === 0) return;
        recomputeAvailability(freeslots, selectedDate);
        if (dateSwitchTimerRef.current) clearTimeout(dateSwitchTimerRef.current);
        dateSwitchTimerRef.current = setTimeout(() => {
            setIsDateSwitching(false);
            setMapRowsKey((k) => k + 1);
        }, 150);
        return () => {
            if (dateSwitchTimerRef.current) clearTimeout(dateSwitchTimerRef.current);
        };
    }, [selectedDate, freeslots, recomputeAvailability]);

    function handleDateSelect(date: string) {
        if (date === selectedDate) return;
        setIsDateSwitching(true);
        setSelectedDate(date);
    }

    const availableDates = useMemo(() => Object.keys(freeslots).sort(), [freeslots]);

    const seats: MapSeat[] = useMemo(() => {
        const result: MapSeat[] = [];
        for (const [rowStr, rowSeats] of Object.entries(SEATS)) {
            const row = Number(rowStr);
            for (const [seatStr, pitchId] of Object.entries(rowSeats)) {
                const seat = Number(seatStr);
                result.push({ row, seat, pitchId, status: availability[row]?.[seat] ?? 'unknown' });
            }
        }
        return result;
    }, [availability]);

    const rowsAvailable = useMemo(() => {
        return Array.from(new Set(seats.map(s => s.row))).sort((a, b) => a - b);
    }, [seats]);

    const filteredSeats = useMemo(() => {
        const hasStatusFilter = showFree || showPartial || showOccupied;
        let list = seats.filter(seat => {
            if (selectedRow !== 'all' && seat.row !== Number(selectedRow)) return false;
            if (hasStatusFilter) {
                const matches =
                    (showFree && seat.status === 'available') ||
                    (showPartial && seat.status === 'partially') ||
                    (showOccupied && seat.status === 'occupied');
                if (!matches) return false;
            }
            return true;
        });

        list.sort((a, b) => {
            const priority = (s: MapSeat) => {
                if (s.status === 'available' || s.status === 'unknown') return 1;
                if (s.status === 'partially') return 2;
                return 3;
            };
            const diff = priority(a) - priority(b);
            if (diff !== 0) return diff;
            if (a.row !== b.row) return a.row - b.row;
            return a.seat - b.seat;
        });

        return list;
    }, [seats, showFree, showPartial, showOccupied, selectedRow]);

    const groupedByRow = useMemo(() => {
        const grouped: Record<number, MapSeat[]> = {};
        for (const seat of filteredSeats) {
            if (!grouped[seat.row]) grouped[seat.row] = [];
            grouped[seat.row].push(seat);
        }
        return grouped;
    }, [filteredSeats]);

    const sortedRows = Object.keys(groupedByRow).map(Number).sort((a, b) => a - b);

    function CompactSeat({
        seat,
        onClick,
        pulse,
    }: {
        seat: MapSeat;
        onClick: (s: MapSeat) => void;
        pulse?: boolean;
    }) {
        let colorClass = '';
        if (seat.status === 'available') {
            colorClass = 'bg-white text-[#16A34A] border border-[#16A34A] hover:bg-[#16A34A] hover:text-white cursor-pointer';
        } else if (seat.status === 'partially') {
            colorClass = 'bg-white text-[#D97706] border border-[#D97706] hover:bg-[#D97706] hover:text-white cursor-pointer';
        } else if (seat.status === 'occupied') {
            colorClass = 'bg-white text-[#DC2626] border border-[#DC2626] hover:bg-[#DC2626] hover:text-white cursor-pointer';
        } else {
            return <div className="ucam-shimmer w-10 h-10 rounded-lg" aria-hidden />;
        }
        return (
            <button
                type="button"
                onClick={() => onClick(seat)}
                className={`w-10 h-10 flex items-center justify-center font-semibold text-sm rounded-lg cursor-pointer seat-tap active:scale-[0.92] active:shadow-md ${colorClass} ${pulse ? 'seat-pulse-success' : ''}`}
                title={`Mesa ${seat.seat} - ${seat.status}`}
            >
                {seat.seat}
            </button>
        );
    }

    const statsBumpKey = `${selectedDate}-${stats.available}-${stats.partially}-${stats.occupied}`;

    const mapGridContent = filteredSeats.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
            <p className="text-[#64748B] font-medium text-sm">No hay mesas que coincidan con los filtros.</p>
            <button
                onClick={() => { setShowFree(false); setShowPartial(false); setShowOccupied(false); setSelectedRow('all'); }}
                className="mt-3 text-[#002855] font-semibold text-sm hover:underline"
            >
                Limpiar filtros
            </button>
        </div>
    ) : (
        <div className="pb-10" key={mapRowsKey}>
            {sortedRows.map((row, index) => (
                <div
                    key={`row-${row}`}
                    className="map-row-enter bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 mb-4"
                    style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
                >
                    <h4 className="text-sm font-semibold text-[#64748B] mb-3 uppercase tracking-wider">Fila {row}</h4>
                    <div className="flex flex-wrap gap-2">
                        {groupedByRow[row].sort((a, b) => a.seat - b.seat).map(seat => (
                            <CompactSeat
                                key={seat.pitchId}
                                seat={seat}
                                pulse={pulsePitchId === seat.pitchId}
                                onClick={s => {
                                    trackSelectSeat(s.pitchId);
                                    setSelectedSeat({ row: s.row, seat: s.seat, pitchId: s.pitchId });
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <div ref={scrollSentinelRef} className="h-px -mb-px pointer-events-none" aria-hidden />

            {/* Sticky Header */}
            <div className={`sticky top-0 z-20 bg-[#F2F5F9]/95 backdrop-blur-sm pb-4 pt-2 -mt-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:-mt-0 sm:pt-0 border-b border-[#E2E8F0] overflow-x-hidden ${headerScrolled ? 'sticky-header-shadow' : ''}`}>
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#002855] shrink-0">Reservar Sitio</h2>
                    <div className="flex-1 min-w-0 border-b border-[#CBD5E1]" aria-hidden />
                    <div className="relative shrink-0">
                        <select
                            value={selectedRow}
                            onChange={(e) => setSelectedRow(e.target.value)}
                            className="appearance-none bg-white border border-[#E2E8F0] text-[#1E2940] text-sm font-medium px-3 sm:px-4 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-[#002855] focus:ring-2 focus:ring-[#002855]/20 cursor-pointer shadow-sm transition-colors"
                        >
                            <option value="all">Todas las filas</option>
                            {rowsAvailable.map(row => (
                                <option key={row} value={row.toString()}>Fila {row}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#64748B]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Date tabs */}
                {availableDates.length > 0 && (
                    <div className="mb-4">
                        <DateTabs
                            dates={availableDates}
                            selectedDate={selectedDate}
                            onSelect={handleDateSelect}
                        />
                    </div>
                )}

                {/* Stats / filtros */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 overflow-x-hidden">
                    <StatFilterButton
                        label="Libres"
                        value={stats.available}
                        color="#16A34A"
                        active={showFree}
                        onToggle={() => setShowFree((v) => !v)}
                        bumpKey={`free-${statsBumpKey}`}
                    />
                    <StatFilterButton
                        label="Parcialmente libres"
                        value={stats.partially}
                        color="#D97706"
                        active={showPartial}
                        onToggle={() => setShowPartial((v) => !v)}
                        bumpKey={`partial-${statsBumpKey}`}
                    />
                    <StatFilterButton
                        label="Ocupadas"
                        value={stats.occupied}
                        color="#DC2626"
                        active={showOccupied}
                        onToggle={() => setShowOccupied((v) => !v)}
                        bumpKey={`occupied-${statsBumpKey}`}
                    />
                </div>
            </div>

            {/* Results */}
            <div className="relative">
                <div
                    className={`crossfade-skeleton ${showMapSkeleton ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
                    aria-hidden={!showMapSkeleton}
                >
                    <MapGridSkeleton selectedRow={selectedRow} />
                </div>
                <div className={`crossfade-content ${showMapSkeleton ? 'opacity-0' : 'opacity-100'}`}>
                    {mapGridContent}
                </div>
            </div>

            {selectedSeat && (
                <BookingModal
                    seat={selectedSeat}
                    isLoggedIn={isLoggedIn}
                    onClose={() => setSelectedSeat(null)}
                    onSessionExpired={() => { setSelectedSeat(null); onSessionExpired(); }}
                    onBookingSuccess={handleBookingSuccess}
                />
            )}

            <BookingSuccessToast
                key={successToastId}
                show={showSuccessToast}
                onHide={() => setShowSuccessToast(false)}
            />
        </div>
    );
}
