'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SelectedSeat, ScheduleSlot, SeatAvailability } from '@/types/ui';
import { SCHEDULES } from '@/lib/constants/schedules';
import { getPitchIndex } from '@/lib/constants/seats';
import type { SlotsApiResponse, SlotTimeFrame, SlotFreeItem } from '@/types/api';
import { LIBRARY_SERVICE_ID } from '@/lib/constants/schedules';
import type { MultiBookingItem } from '@/types/api';
import { recordBookingCheckinAnchor } from '@/lib/booking/checkin';
import { trackBookingCreated } from '@/lib/analytics/events';

interface BookingModalProps {
    seat: SelectedSeat;
    isLoggedIn: boolean;
    onClose: () => void;
    onSessionExpired: () => void;
    onBookingSuccess?: () => void;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
}

function todaySpain(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

export function BookingModal({ seat, isLoggedIn, onClose, onSessionExpired, onBookingSuccess }: BookingModalProps) {
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

        let hadSuccess = false;
        let totalSlotsCreated = 0;
        let successDatesCount = 0;

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
                const createdIds = [mainBookingId];

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

                    const json2 = await res2.json() as { ok: boolean; data?: { bookingIds?: string[] }; error?: string; code?: number };

                    if (!json2.ok) {
                        if (json2.code === 401) { onSessionExpired(); return; }
                        if (json2.code === 422 && json2.error?.includes('Límite')) {
                            setBookingStatus((prev) => ({ ...prev, [dateKey]: `warning:${json2.error}` }));
                        } else {
                            setBookingStatus((prev) => ({ ...prev, [dateKey]: `error:1ª reserva ok, fallo en múltiple: ${json2.error ?? ''}` }));
                        }
                        recordBookingCheckinAnchor(createdIds);
                        continue;
                    }

                    if (json2.data?.bookingIds?.length) {
                        createdIds.push(...json2.data.bookingIds);
                    }
                }

                recordBookingCheckinAnchor(createdIds);
                setBookingStatus((prev) => ({ ...prev, [dateKey]: 'success' }));
                totalSlotsCreated += createdIds.length;
                successDatesCount += 1;
                hadSuccess = true;
            } catch {
                setBookingStatus((prev) => ({ ...prev, [dateKey]: 'error:Error de red al reservar.' }));
            }
        }

        setSelectedSlots([]);
        await loadSlots();
        if (hadSuccess) {
            trackBookingCreated({
                pitchId: seat.pitchId,
                row: seat.row,
                seat: seat.seat,
                slotsCount: totalSlotsCreated,
                datesCount: successDatesCount,
            });
            onBookingSuccess?.();
        }
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl border border-[#E2E8F0] w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl">
                {/* Header */}
                <div className="bg-[#002855] px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-white font-bold text-base">
                            Fila {seat.row} · Mesa {seat.seat}
                        </h2>
                        <p className="text-white/50 text-xs mt-0.5">Selecciona los horarios para reservar</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="text-white/60 hover:text-white text-2xl leading-none p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            aria-label="Cerrar"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 pb-24 bg-[#F8FAFC]">
                    {!isLoggedIn && (
                        <div className="mb-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-4 py-3 text-[#D97706] text-sm flex gap-2 items-start">
                            <span className="flex-shrink-0 font-bold">!</span>
                            <span>Inicia sesión para realizar reservas.</span>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex items-center justify-center h-32 gap-3 text-[#64748B]">
                            <span className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            <span className="text-sm">Cargando disponibilidad...</span>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 text-sm flex gap-2 items-start">
                            <span className="flex-shrink-0 font-bold">!</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {availability && !isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(availability).map(([date, slots]) => {
                                const isToday = date === today;
                                const hora = new Date().getHours() * 60 + new Date().getMinutes();
                                const dateKey = `${date}-selection`;

                                return (
                                    <div key={date} className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm">
                                        <h3 className="text-[#002855] font-semibold text-sm mb-3 capitalize border-b border-[#E2E8F0] pb-2">
                                            {formatDate(date)}
                                        </h3>
                                        <div className="flex flex-col gap-1 mb-2">
                                            {slots.map((slot) => {
                                                const endMin = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
                                                const passed = isToday && hora >= endMin;
                                                const isSelected = selectedSlots.some(s => s.date === date && s.start === slot.start);

                                                if (slot.estado === 'Reservado' || passed) {
                                                    return (
                                                        <div key={slot.start} className="flex items-center gap-2 p-1.5 text-[#CBD5E1] line-through">
                                                            <span className="text-sm">{slot.start}–{slot.end}</span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        key={slot.start}
                                                        onClick={() => toggleSlot(date, slot.start, slot.end)}
                                                        disabled={!isSelected && selectedSlots.length >= 6}
                                                        className={`flex items-center gap-2 p-1.5 text-left w-full rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors
                                                            ${isSelected
                                                                ? 'text-[#002855] bg-[#EEF4FB] border border-[#CBD5E1]'
                                                                : 'text-[#1E2940] hover:text-[#002855] hover:bg-[#EEF4FB] border border-transparent'
                                                            }`}
                                                    >
                                                        <span className="text-sm font-medium">
                                                            {slot.start}–{slot.end}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="ml-auto text-[#002855]">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {bookingStatus[dateKey] && (
                                            <div className="mt-3">
                                                {bookingStatus[dateKey].startsWith('error:') && (
                                                    <p className="text-[#DC2626] text-xs font-medium bg-[#FEF2F2] rounded-lg px-2 py-1.5">
                                                        {bookingStatus[dateKey].replace('error:', '')}
                                                    </p>
                                                )}
                                                {bookingStatus[dateKey].startsWith('warning:') && (
                                                    <p className="text-[#D97706] text-xs font-medium bg-[#FFFBEB] rounded-lg px-2 py-1.5">
                                                        {bookingStatus[dateKey].replace('warning:', '')}
                                                    </p>
                                                )}
                                                {bookingStatus[dateKey] === 'success' && (
                                                    <p className="text-[#16A34A] text-xs font-medium bg-[#F0FDF4] rounded-lg px-2 py-1.5">
                                                        ✓ Reservas confirmadas
                                                    </p>
                                                )}
                                                {bookingStatus[dateKey] === 'loading' && (
                                                    <p className="text-[#64748B] text-xs font-medium animate-pulse px-2 py-1.5">Procesando...</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Floating Bottom Bar */}
                {selectedSlots.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] p-4 px-6 flex items-center justify-between shadow-lg">
                        <div>
                            <p className="text-[#002855] font-semibold text-sm">
                                {selectedSlots.length} hora{selectedSlots.length > 1 ? 's' : ''} seleccionada{selectedSlots.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-[#64748B]">Máximo 6 permitidas</p>
                        </div>
                        <button
                            onClick={handleBookSelection}
                            className="bg-[#002855] hover:bg-[#004A8F] text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
                        >
                            Confirmar reserva
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
