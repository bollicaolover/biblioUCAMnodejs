'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SEATS } from '@/lib/constants/seats';
import { LIBRARY_SERVICE_ID } from '@/lib/constants/schedules';
import { BookingModal } from '@/components/booking/BookingModal';
import type { MapSeat, SelectedSeat, SeatStatus } from '@/types/ui';
import type { SlotsApiResponse, SlotTimeFrame, SlotFreeItem } from '@/types/api';

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

export function LibraryMap({ isLoggedIn, onSessionExpired, onBookingSuccess }: LibraryMapProps) {
    const [freeslots, setFreeslots] = useState<FreeslotsData>({});
    const [availability, setAvailability] = useState<AvailabilityMap>({});
    const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null);
    const [stats, setStats] = useState({ total: 0, available: 0, partially: 0, occupied: 0 });
    const [selectedDate, setSelectedDate] = useState<string>(todaySpain());
    const [showFree, setShowFree] = useState(false);
    const [showPartial, setShowPartial] = useState(false);
    const [showOccupied, setShowOccupied] = useState(false);
    const [selectedRow, setSelectedRow] = useState<string>('all');

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

    const loadAvailability = useCallback(async () => {
        try {
            const res = await fetch(`/api/slots/${LIBRARY_SERVICE_ID}`);
            const json = await res.json() as { ok: boolean; data?: SlotsApiResponse; error?: string; code?: number };
            if (!json.ok) { if (json.code === 401) onSessionExpired(); return; }
            const data = json.data?.data?.freeslots ?? {};
            setFreeslots(data);
            recomputeAvailability(data, selectedDate);
        } catch { /* silently fail */ }
    }, [onSessionExpired, selectedDate, recomputeAvailability]);

    const handleBookingSuccess = useCallback(() => {
        loadAvailability();
        onBookingSuccess?.();
    }, [loadAvailability, onBookingSuccess]);

    useEffect(() => { loadAvailability(); }, [loadAvailability]);

    useEffect(() => {
        if (Object.keys(freeslots).length > 0) recomputeAvailability(freeslots, selectedDate);
    }, [selectedDate, freeslots, recomputeAvailability]);

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

    function CompactSeat({ seat, onClick }: { seat: MapSeat; onClick: (s: MapSeat) => void }) {
        let colorClass = '';
        if (seat.status === 'available') {
            colorClass = 'bg-white text-[#16A34A] border border-[#16A34A] hover:bg-[#16A34A] hover:text-white cursor-pointer';
        } else if (seat.status === 'partially') {
            colorClass = 'bg-white text-[#D97706] border border-[#D97706] hover:bg-[#D97706] hover:text-white cursor-pointer';
        } else {
            colorClass = 'bg-white text-[#DC2626] border border-[#DC2626] hover:bg-[#DC2626] hover:text-white cursor-pointer';
        }
        return (
            <button
                onClick={() => onClick(seat)}
                className={`w-10 h-10 flex items-center justify-center font-semibold text-sm rounded-lg active:scale-95 transition-colors ${colorClass}`}
                title={`Mesa ${seat.seat} - ${seat.status}`}
            >
                {seat.seat}
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-[#F2F5F9]/95 backdrop-blur-sm pb-4 pt-2 -mt-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:-mt-0 sm:pt-0 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#002855] shrink-0">Mesas</h2>
                    <div className="flex-1 border-b border-[#CBD5E1]" aria-hidden />
                </div>

                {/* Date tabs + row filter */}
                {availableDates.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1">
                            {availableDates.map(date => {
                                const { short, full } = formatDateTab(date);
                                const isSelected = date === selectedDate;
                                return (
                                    <button
                                        key={date}
                                        onClick={() => setSelectedDate(date)}
                                        title={full}
                                        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap
                                            ${isSelected
                                                ? 'bg-[#002855] text-white border-[#002855]'
                                                : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#002855] hover:text-[#002855]'}`}
                                    >
                                        {short}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative flex-shrink-0">
                            <select
                                value={selectedRow}
                                onChange={(e) => setSelectedRow(e.target.value)}
                                className="appearance-none bg-white border border-[#E2E8F0] text-[#1E2940] text-sm font-medium px-4 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-[#0057A8] focus:ring-2 focus:ring-[#0057A8]/20 cursor-pointer shadow-sm transition-colors"
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
                )}

                {/* Stats / filtros */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[
                        { label: 'Libres', value: stats.available, color: '#16A34A', active: showFree, toggle: () => setShowFree(v => !v) },
                        { label: 'Parcialmente libres', value: stats.partially, color: '#D97706', active: showPartial, toggle: () => setShowPartial(v => !v) },
                        { label: 'Ocupadas', value: stats.occupied, color: '#DC2626', active: showOccupied, toggle: () => setShowOccupied(v => !v) },
                    ].map(({ label, value, color, active, toggle }) => (
                        <button
                            key={label}
                            onClick={toggle}
                            className="rounded-xl px-2 py-2 sm:py-3 text-center shadow-sm border transition-colors cursor-pointer"
                            style={active
                                ? { backgroundColor: color, borderColor: color, color: 'white' }
                                : { backgroundColor: 'white', borderColor: color, color }}
                        >
                            <p className="text-lg sm:text-xl font-bold">{value || '0'}</p>
                            <p className="text-[10px] sm:text-xs font-medium mt-0.5">{label}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            {filteredSeats.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
                    <p className="text-[#64748B] font-medium text-sm">No hay mesas que coincidan con los filtros.</p>
                    <button
                        onClick={() => { setShowFree(false); setShowPartial(false); setShowOccupied(false); setSelectedRow('all'); }}
                        className="mt-3 text-[#0057A8] font-semibold text-sm hover:underline"
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <div className="pb-10">
                    {sortedRows.map(row => (
                        <div key={`row-${row}`} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 mb-4">
                            <h4 className="text-sm font-semibold text-[#64748B] mb-3 uppercase tracking-wider">Fila {row}</h4>
                            <div className="flex flex-wrap gap-2">
                                {groupedByRow[row].sort((a, b) => a.seat - b.seat).map(seat => (
                                    <CompactSeat key={seat.pitchId} seat={seat} onClick={s => setSelectedSeat({ row: s.row, seat: s.seat, pitchId: s.pitchId })} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedSeat && (
                <BookingModal
                    seat={selectedSeat}
                    isLoggedIn={isLoggedIn}
                    onClose={() => setSelectedSeat(null)}
                    onSessionExpired={() => { setSelectedSeat(null); onSessionExpired(); }}
                    onBookingSuccess={handleBookingSuccess}
                />
            )}
        </div>
    );
}
