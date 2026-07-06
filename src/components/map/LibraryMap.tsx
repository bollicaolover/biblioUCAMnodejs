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
}

type AvailabilityMap = Record<number, Record<number, SeatStatus>>;

/** Determina el estado de una mesa en base a los slots del día de hoy */
function computeSeatStatus(
    pitchId: string,
    freeslots: SlotsApiResponse['data']['freeslots']
): SeatStatus {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const todaySlots = freeslots[today];
    if (!todaySlots) return 'available';

    let totalSlots = todaySlots.length;
    let availableSlots = 0;
    let occupiedNow = false;

    for (const frame of todaySlots as SlotTimeFrame[]) {
        const freeItems: SlotFreeItem[] = Array.isArray(frame.free)
            ? frame.free
            : Object.values(frame.free);
        const names = freeItems.map((f) => f.name);
        const isFree = names.includes(pitchId);

        if (isFree) availableSlots++;

        const [startH, startM] = frame.start.split(':').map(Number);
        const [endH, endM] = frame.end.split(':').map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;
        if (nowMinutes >= startMin && nowMinutes <= endMin && !isFree) {
            occupiedNow = true;
        }
    }

    if (occupiedNow) return 'occupied';
    if (availableSlots === totalSlots) return 'available';
    if (availableSlots > 0) return 'partially';
    return 'occupied';
}

export function LibraryMap({ isLoggedIn, onSessionExpired }: LibraryMapProps) {
    const [availability, setAvailability] = useState<AvailabilityMap>({});
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null);
    const [stats, setStats] = useState({ total: 0, available: 0, partially: 0, occupied: 0 });

    // Local Storage for favorites
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    // Filters
    const [showFavorites, setShowFavorites] = useState(false);
    const [showFree, setShowFree] = useState(false);
    const [showPartial, setShowPartial] = useState(false);
    const [selectedRow, setSelectedRow] = useState<string>('all');

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem('lib_favorites');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch {
                // Ignore parse errors
            }
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('lib_favorites', JSON.stringify(favorites));
        }
    }, [favorites, isMounted]);

    const handleToggleFavorite = useCallback((pitchId: string) => {
        setFavorites(prev =>
            prev.includes(pitchId)
                ? prev.filter(id => id !== pitchId)
                : [...prev, pitchId]
        );
    }, []);

    const loadAvailability = useCallback(async () => {
        setIsLoadingAvailability(true);
        try {
            const res = await fetch(`/api/slots/${LIBRARY_SERVICE_ID}`);
            const json = await res.json() as { ok: boolean; data?: SlotsApiResponse; error?: string; code?: number };

            if (!json.ok) {
                if (json.code === 401) onSessionExpired();
                return;
            }

            const freeslots = json.data?.data?.freeslots ?? {};
            const newAvailability: AvailabilityMap = {};
            let av = 0, pa = 0, oc = 0, tot = 0;

            for (const [rowStr, rowData] of Object.entries(SEATS)) {
                const row = Number(rowStr);
                newAvailability[row] = {};
                for (const [seatStr, pitchId] of Object.entries(rowData)) {
                    const seat = Number(seatStr);
                    const status = computeSeatStatus(pitchId, freeslots);
                    newAvailability[row][seat] = status;
                    tot++;
                    if (status === 'available') av++;
                    else if (status === 'partially') pa++;
                    else if (status === 'occupied') oc++;
                }
            }

            setAvailability(newAvailability);
            setStats({ total: tot, available: av, partially: pa, occupied: oc });
        } catch {
            // silently fail 
        } finally {
            setIsLoadingAvailability(false);
        }
    }, [onSessionExpired]);

    useEffect(() => {
        loadAvailability();
    }, [loadAvailability]);

    const seats: MapSeat[] = useMemo(() => {
        const result: MapSeat[] = [];
        for (const [rowStr, rowSeats] of Object.entries(SEATS)) {
            const row = Number(rowStr);
            for (const [seatStr, pitchId] of Object.entries(rowSeats)) {
                const seat = Number(seatStr);
                const status: SeatStatus = availability[row]?.[seat] ?? 'unknown';
                result.push({ row, seat, pitchId, status });
            }
        }
        return result;
    }, [availability]);

    const rowsAvailable = useMemo(() => {
        const rows = new Set(seats.map(s => s.row));
        return Array.from(rows).sort((a, b) => a - b);
    }, [seats]);

    const filteredSeats = useMemo(() => {
        let list = [...seats];

        const hasFilter = showFavorites || showFree || showPartial || selectedRow !== 'all';

        list = list.filter(seat => {
            if (selectedRow !== 'all' && seat.row !== Number(selectedRow)) return false;

            if (hasFilter) {
                const isFav = showFavorites && favorites.includes(seat.pitchId);
                const isFree = showFree && seat.status === 'available';
                const isPartial = showPartial && seat.status === 'partially';

                const hasStatusOrFavFilter = showFavorites || showFree || showPartial;
                if (hasStatusOrFavFilter) {
                    if (!isFav && !isFree && !isPartial) return false;
                } else {
                    if (seat.status === 'occupied') return false;
                }
            }

            return true;
        });

        if (hasFilter && !showFavorites && !showFree && !showPartial) {
            list = list.filter(s => s.status !== 'occupied');
        }

        list.sort((a, b) => {
            const getPriority = (s: MapSeat) => {
                const isFav = favorites.includes(s.pitchId);
                if (isFav && (s.status === 'available' || s.status === 'unknown')) return 1;
                if (isFav && s.status === 'partially') return 2;
                if (s.status === 'available' || s.status === 'unknown') return 3;
                if (s.status === 'partially') return 4;
                return 5;
            };
            const pA = getPriority(a);
            const pB = getPriority(b);
            if (pA !== pB) return pA - pB;
            if (a.row !== b.row) return a.row - b.row;
            return a.seat - b.seat;
        });

        return list;
    }, [seats, showFavorites, showFree, showPartial, selectedRow, favorites]);

    // Groupings for high-density rendering
    const favsToShow = filteredSeats.filter(s => favorites.includes(s.pitchId));
    const othersToShow = filteredSeats.filter(s => !favorites.includes(s.pitchId));

    function groupSeatsByRow(seatsList: MapSeat[]) {
        const grouped: Record<number, MapSeat[]> = {};
        for (const seat of seatsList) {
            if (!grouped[seat.row]) grouped[seat.row] = [];
            grouped[seat.row].push(seat);
        }
        return grouped;
    }

    const groupedFavs = groupSeatsByRow(favsToShow);
    const groupedOthers = groupSeatsByRow(othersToShow);

    const sortedFavRows = Object.keys(groupedFavs).map(Number).sort((a, b) => a - b);
    const sortedOtherRows = Object.keys(groupedOthers).map(Number).sort((a, b) => a - b);

    function CompactSeat({ seat, onClick }: { seat: MapSeat, onClick: (s: MapSeat) => void }) {
        let colorClass = '';
        if (seat.status === 'available') {
            colorClass = 'bg-transparent text-[#00FF41] border border-[#00FF41] hover:bg-[#00FF41] hover:text-[#050505] cursor-pointer';
        } else if (seat.status === 'partially') {
            colorClass = 'bg-transparent text-[#FFD700] border border-[#FFD700] hover:bg-[#FFD700] hover:text-[#050505] cursor-pointer';
        } else {
            colorClass = 'bg-transparent text-[#666666] border border-[#FF003C]/50 cursor-not-allowed';
        }

        return (
            <button
                onClick={() => onClick(seat)}
                className={`w-10 h-10 flex items-center justify-center font-semibold text-sm active:scale-95 ${colorClass}`}
                title={`Mesa ${seat.seat} - ${seat.status}`}
            >
                {seat.seat}
            </button>
        );
    }

    const handleSeatClick = (seat: MapSeat) => {
        setSelectedSeat({ row: seat.row, seat: seat.seat, pitchId: seat.pitchId });
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Sticky Header Stats */}
            <div className="sticky top-0 z-20 bg-[#050505]/95 pb-4 pt-2 -mt-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:-mt-0 sm:pt-0 border-b border-[#00FF41]/40">
                <div className="flex items-center justify-between mb-4 border-b border-[#00FF41]/40 pb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#00FF41] tracking-wider">&gt; MESAS_LIBRES</h2>
                    <button
                        onClick={loadAvailability}
                        disabled={isLoadingAvailability}
                        className="bg-transparent border border-[#00FF41] hover:bg-[#00FF41] hover:text-[#050505] disabled:border-[#666666] disabled:text-[#666666] text-[#00FF41] text-sm font-semibold px-3 py-1.5 flex items-center gap-2"
                    >
                        {isLoadingAvailability ? (
                            <><span className="h-3.5 w-3.5 border-2 border-[#00FF41]/40 border-t-[#00FF41] animate-spin" />ACTUALIZANDO...</>
                        ) : (
                            '↻ ACTUALIZAR'
                        )}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[
                        { label: 'Libres', value: stats.available, color: 'text-[#00FF41]', borderColor: 'border-[#00FF41]' },
                        { label: 'Medio Libres', value: stats.partially, color: 'text-[#FFD700]', borderColor: 'border-[#FFD700]' },
                        { label: 'Ocupadas', value: stats.occupied, color: 'text-[#FF003C]', borderColor: 'border-[#FF003C]' },
                    ].map(({ label, value, color, borderColor }) => (
                        <div key={label} className={`border ${borderColor} px-2 py-2 sm:py-3 text-center bg-transparent`}>
                            <p className={`text-lg sm:text-xl font-bold ${color}`}>{value || '0'}</p>
                            <p className="text-[10px] sm:text-xs text-[#E0E0E0]/60 font-medium uppercase tracking-wide">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                    onClick={() => setShowFavorites(!showFavorites)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 border text-sm font-medium flex items-center gap-1.5
                        ${showFavorites
                            ? 'bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]'
                            : 'bg-transparent border-[#E0E0E0]/30 text-[#E0E0E0]/60 hover:border-[#FFD700] hover:text-[#FFD700]'}`}
                >
                    ★ <span className="hidden sm:inline">FAVORITOS</span>
                </button>
                <button
                    onClick={() => setShowFree(!showFree)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 border text-sm font-medium flex items-center gap-1.5
                        ${showFree
                            ? 'bg-[#00FF41]/10 border-[#00FF41] text-[#00FF41]'
                            : 'bg-transparent border-[#E0E0E0]/30 text-[#E0E0E0]/60 hover:border-[#00FF41] hover:text-[#00FF41]'}`}
                >
                    <span className="w-2.5 h-2.5 bg-[#00FF41]"></span> LIBRES
                </button>

                <div className="relative ml-auto">
                    <select
                        value={selectedRow}
                        onChange={(e) => setSelectedRow(e.target.value)}
                        className="appearance-none bg-[#0a0a0a] border border-[#00FF41]/40 text-[#00FF41] text-sm font-medium px-4 py-1.5 sm:py-2 pr-8 focus:outline-none focus:border-[#00FF41] cursor-pointer"
                    >
                        <option value="all">TODAS LAS FILAS</option>
                        {rowsAvailable.map(row => (
                            <option key={row} value={row.toString()}>FILA {row}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#00FF41]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            {/* Results Layout: High Density Rows */}
            {filteredSeats.length === 0 ? (
                <div className="text-center py-12 bg-transparent border border-[#00FF41]/30 border-dashed">
                    <p className="text-[#E0E0E0]/60 font-medium">NO HAY MESAS QUE COINCIDAN CON LOS FILTROS.</p>
                    <button
                        onClick={() => {
                            setShowFavorites(false);
                            setShowFree(false);
                            setShowPartial(false);
                            setSelectedRow('all');
                        }}
                        className="mt-4 text-[#00FF41] font-semibold hover:underline"
                    >
                        [ LIMPIAR_FILTROS ]
                    </button>
                </div>
            ) : (
                <div className="pb-10">
                    {/* Favorites Block */}
                    {sortedFavRows.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-[#FFD700] mb-4 flex items-center gap-2">
                                ★ &gt; FAVORITOS
                            </h3>
                            {sortedFavRows.map(row => (
                                <div key={`fav-row-${row}`} className="bg-[#0a0a0a] border border-[#00FF41]/30 p-4 mb-4">
                                    <h4 className="text-lg font-bold text-[#00FF41] mb-3">&gt; FILA_{row}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedFavs[row].sort((a, b) => a.seat - b.seat).map(seat => (
                                            <CompactSeat key={seat.pitchId} seat={seat} onClick={handleSeatClick} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Others Block */}
                    {sortedOtherRows.length > 0 && (
                        <div>
                            {sortedFavRows.length > 0 && (
                                <h3 className="text-xl font-bold text-[#00FF41] mb-4 flex items-center gap-2">
                                    &gt; RESTO_DE_MESAS
                                </h3>
                            )}
                            {sortedOtherRows.map(row => (
                                <div key={`row-${row}`} className="bg-[#0a0a0a] border border-[#00FF41]/30 p-4 mb-4">
                                    <h4 className="text-lg font-bold text-[#00FF41] mb-3">&gt; FILA_{row}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {groupedOthers[row].sort((a, b) => a.seat - b.seat).map(seat => (
                                            <CompactSeat key={seat.pitchId} seat={seat} onClick={handleSeatClick} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de reserva */}
            {selectedSeat && (
                <BookingModal
                    seat={selectedSeat}
                    isLoggedIn={isLoggedIn}
                    isFavorite={favorites.includes(selectedSeat.pitchId)}
                    onToggleFavorite={() => handleToggleFavorite(selectedSeat.pitchId)}
                    onClose={() => setSelectedSeat(null)}
                    onSessionExpired={() => { setSelectedSeat(null); onSessionExpired(); }}
                />
            )}
        </div>
    );
}
