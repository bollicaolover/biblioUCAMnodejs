'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SelectedSeat, ScheduleSlot, SeatAvailability } from '@/types/ui';
import { SCHEDULES } from '@/lib/constants/schedules';
import { getPitchIndex } from '@/lib/constants/seats';
import type { SlotsApiResponse, SlotTimeFrame, SlotFreeItem } from '@/types/api';
import { LIBRARY_SERVICE_ID } from '@/lib/constants/schedules';
import type { MultiBookingItem } from '@/types/api';

interface BookingModalProps {
    seat: SelectedSeat;
    isLoggedIn: boolean;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onClose: () => void;
    onSessionExpired: () => void;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
}

function todaySpain(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

export function BookingModal({ seat, isLoggedIn, isFavorite, onToggleFavorite, onClose, onSessionExpired }: BookingModalProps) {
    const [availability, setAvailability] = useState<SeatAvailability | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingStatus, setBookingStatus] = useState<Record<string, string>>({});
    const [selectedSlots, setSelectedSlots] = useState<{ date: string; start: string; end: string }[]>([]);

    const loadSlots = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/slots/${LIBRARY_SERVICE_ID}`);
            const json = await res.json() as { ok: boolean; data?: SlotsApiResponse; error?: string; code?: number };

            if (!json.ok) {
                if (json.code === 401) { onSessionExpired(); onClose(); return; }
                setError(json.error ?? 'Error al obtener disponibilidad.');
                return;
            }

            const freeslots = json.data?.data?.freeslots ?? {};
            const result: SeatAvailability = {};

            for (const [date, timeFrames] of Object.entries(freeslots)) {
                result[date] = (timeFrames as SlotTimeFrame[]).map((frame) => {
                    const freeItems: SlotFreeItem[] = Array.isArray(frame.free)
                        ? frame.free
                        : Object.values(frame.free);
                    const names = freeItems.map((f) => f.name);
                    return {
                        start: frame.start,
                        end: frame.end,
                        estado: names.includes(seat.pitchId) ? 'Disponible' : 'Reservado',
                    };
                });
            }

            setAvailability(result);
        } catch {
            setError('Error de red al cargar horarios.');
        } finally {
            setIsLoading(false);
        }
    }, [seat.pitchId, onClose, onSessionExpired]);

    useEffect(() => { loadSlots(); }, [loadSlots]);

    async function handleBookSelection() {
        if (!isLoggedIn || selectedSlots.length === 0) return;

        const byDate = selectedSlots.reduce((acc, slot) => {
            if (!acc[slot.date]) acc[slot.date] = [];
            acc[slot.date].push(slot);
            return acc;
        }, {} as Record<string, typeof selectedSlots>);

        for (const [date, slots] of Object.entries(byDate)) {
            const dateKey = `${date}-selection`;
            setBookingStatus((prev) => ({ ...prev, [dateKey]: 'loading' }));

            try {
                const [first, ...rest] = slots;
                const res1 = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pitchId: seat.pitchId, date, start: first.start, end: first.end, serviceId: LIBRARY_SERVICE_ID }),
                });
                const json1 = await res1.json() as { ok: boolean; data?: { bookingId: string }; error?: string; code?: number };

                if (!json1.ok || !json1.data?.bookingId) {
                    if (json1.code === 401) { onSessionExpired(); return; }
                    setBookingStatus((prev) => ({ ...prev, [dateKey]: `error:${json1.error ?? 'Fallo inicial'}` }));
                    continue;
                }

                const mainBookingId = json1.data.bookingId;

                if (rest.length > 0) {
                    const items: MultiBookingItem[] = rest.map((s) => ({
                        date,
                        start: s.start,
                        end: s.end,
                        pitch: getPitchIndex(seat.pitchId),
                    }));

                    const res2 = await fetch('/api/bookings/multi', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bookingId: mainBookingId, items }),
                    });

                    const json2 = await res2.json() as { ok: boolean; error?: string; code?: number };

                    if (!json2.ok) {
                        if (json2.code === 401) { onSessionExpired(); return; }
                        if (json2.code === 422 && json2.error?.includes('Límite')) {
                            setBookingStatus((prev) => ({ ...prev, [dateKey]: `warning:${json2.error}` }));
                        } else {
                            setBookingStatus((prev) => ({ ...prev, [dateKey]: `error:1ª ok, fallo multi: ${json2.error ?? ''}` }));
                        }
                        continue;
                    }
                }

                setBookingStatus((prev) => ({ ...prev, [dateKey]: 'success' }));
            } catch {
                setBookingStatus((prev) => ({ ...prev, [dateKey]: 'error:Error de red al reservar la selección.' }));
            }
        }

        setSelectedSlots([]);
        await loadSlots();
    }

    function toggleSlot(date: string, start: string, end: string) {
        setSelectedSlots(prev => {
            const isSelected = prev.some(s => s.date === date && s.start === start);
            if (isSelected) return prev.filter(s => !(s.date === date && s.start === start));
            if (prev.length >= 6) return prev;
            return [...prev, { date, start, end }];
        });
    }

    const today = todaySpain();

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-[#0a0a0a] border border-[#00FF41] w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col relative">
                {/* Header */}
                <div className="bg-[#050505] border-b border-[#00FF41] px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-[#00FF41] font-bold text-lg flex items-center gap-2">
                            &gt; FILA_{seat.row} · MESA_{seat.seat}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleFavorite}
                            className="text-[#FFD700] hover:scale-110 flex items-center justify-center p-1"
                            title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                            aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                        >
                            <span className="text-xl">{isFavorite ? '★' : '☆'}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-[#FF003C] hover:text-[#FF003C] text-2xl leading-none"
                            aria-label="Cerrar"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 pb-24">
                    {!isLoggedIn && (
                        <div className="mb-4 bg-transparent border border-[#FFD700] px-4 py-3 text-[#FFD700] text-sm flex gap-2">
                            <span className="flex-shrink-0">[!]</span>
                            <span>INICIA SESIÓN PARA REALIZAR RESERVAS.</span>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex items-center justify-center h-32 gap-3 text-[#00FF41]">
                            <span className="h-5 w-5 border-2 border-[#00FF41]/30 border-t-[#00FF41] animate-spin" />
                            CARGANDO DISPONIBILIDAD...
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="text-[#FF003C] bg-transparent border border-[#FF003C] px-4 py-3 text-sm flex gap-2">
                            <span className="flex-shrink-0">[ERR]</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {availability && !isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {Object.entries(availability).map(([date, slots]) => {
                                const isToday = date === today;
                                const hora = new Date().getHours() * 60 + new Date().getMinutes();
                                const dateKey = `${date}-selection`;

                                return (
                                    <div key={date} className="bg-[#050505] border border-[#00FF41]/40 p-4">
                                        <h3 className="text-[#00FF41] font-bold text-sm mb-3 capitalize border-b border-[#00FF41]/30 pb-2">
                                            &gt; {formatDate(date)}
                                        </h3>
                                        <div className="flex flex-col gap-1 mb-2">
                                            {slots.map((slot) => {
                                                const startMin = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
                                                const passed = isToday && hora > startMin;
                                                const isSelected = selectedSlots.some(s => s.date === date && s.start === slot.start);

                                                if (slot.estado === 'Reservado' || passed) {
                                                    return (
                                                        <div key={slot.start} className="flex items-center gap-2 p-1.5 text-[#666666] line-through">
                                                            <span className="font-mono text-sm">[-] {slot.start}–{slot.end}</span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        key={slot.start}
                                                        onClick={() => toggleSlot(date, slot.start, slot.end)}
                                                        disabled={!isSelected && selectedSlots.length >= 6}
                                                        className={`flex items-center gap-2 p-1.5 text-left w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                                                            ${isSelected
                                                                ? 'text-[#00FF41] bg-[#00FF41]/10 border border-[#00FF41]/30'
                                                                : 'text-[#E0E0E0] hover:text-[#00FF41] hover:bg-[#00FF41]/5 border border-transparent'
                                                            }`}
                                                    >
                                                        <span className="font-mono text-sm">
                                                            {isSelected ? '[X]' : '[ ]'} {slot.start}–{slot.end}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {bookingStatus[dateKey] && (
                                            <div className="mt-3">
                                                {bookingStatus[dateKey].startsWith('error:') && (
                                                    <p className="text-[#FF003C] text-xs font-medium flex items-center gap-1">
                                                        [ERR] <span>{bookingStatus[dateKey].replace('error:', '')}</span>
                                                    </p>
                                                )}
                                                {bookingStatus[dateKey].startsWith('warning:') && (
                                                    <p className="text-[#FFD700] text-xs font-medium flex items-center gap-1">
                                                        [!] <span>{bookingStatus[dateKey].replace('warning:', '')}</span>
                                                    </p>
                                                )}
                                                {bookingStatus[dateKey] === 'success' && (
                                                    <p className="text-[#00FF41] text-xs font-medium flex items-center gap-1">
                                                        [OK] <span>RESERVAS CONFIRMADAS</span>
                                                    </p>
                                                )}
                                                {bookingStatus[dateKey] === 'loading' && (
                                                    <p className="text-[#00FF41] text-xs font-medium animate-pulse">[...] PROCESANDO...</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Floating Bottom Bar for Multi-select */}
                {selectedSlots.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#00FF41] p-4 px-6 flex items-center justify-between">
                        <div>
                            <p className="text-[#00FF41] font-bold">
                                {selectedSlots.length} HORA{selectedSlots.length > 1 ? 'S' : ''} SELECCIONADA{selectedSlots.length > 1 ? 'S' : ''}
                            </p>
                            <p className="text-xs text-[#E0E0E0]/50 font-medium">MÁXIMO 6 PERMITIDAS.</p>
                        </div>
                        <button
                            onClick={handleBookSelection}
                            className="bg-transparent border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-[#050505] px-6 py-2.5 font-bold glow-green flex items-center gap-2 disabled:opacity-50"
                        >
                            [ RESERVAR ]
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
