'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MyBooking } from '@/lib/takeaspot/api';

interface MyBookingsPanelProps {
    isLoggedIn: boolean;
    onSessionExpired: () => void;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    const str = date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function MyBookingsPanel({ isLoggedIn, onSessionExpired }: MyBookingsPanelProps) {
    const [bookings, setBookings] = useState<MyBooking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionStatus, setActionStatus] = useState<Record<string, 'loading' | 'done' | 'error' | 'checkin_loading' | 'checkin_error' | 'checkin_done'>>({});

    const loadBookings = useCallback(async () => {
        if (!isLoggedIn) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/bookings');
            const json = await res.json() as { ok: boolean; data?: MyBooking[]; error?: string; code?: number };
            if (!json.ok) {
                if (json.code === 401) { onSessionExpired(); return; }
                setError(json.error ?? 'Error al cargar reservas.');
                return;
            }
            setBookings(json.data ?? []);
        } catch {
            setError('Error de red.');
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn, onSessionExpired]);

    useEffect(() => { loadBookings(); }, [loadBookings]);

    async function handleCancel(bookingId: string) {
        setActionStatus((prev) => ({ ...prev, [bookingId]: 'loading' }));
        try {
            const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
            const json = await res.json() as { ok: boolean; code?: number; error?: string };
            if (!json.ok) {
                if (json.code === 401) { onSessionExpired(); return; }
                setActionStatus((prev) => ({ ...prev, [bookingId]: 'error' }));
                return;
            }
            setActionStatus((prev) => ({ ...prev, [bookingId]: 'done' }));
            setTimeout(loadBookings, 500);
        } catch {
            setActionStatus((prev) => ({ ...prev, [bookingId]: 'error' }));
        }
    }

    async function handleCheckin(bookingId: string) {
        setActionStatus((prev) => ({ ...prev, [bookingId]: 'checkin_loading' }));
        try {
            const res = await fetch(`/api/bookings/${bookingId}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ people: 1, freeCapacity: true })
            });
            const json = await res.json() as { ok: boolean; code?: number; error?: string };
            if (!json.ok) {
                if (json.code === 401) { onSessionExpired(); return; }
                alert(`Error al confirmar reserva: ${json.error}`);
                setActionStatus((prev) => ({ ...prev, [bookingId]: 'checkin_error' }));
                return;
            }
            setActionStatus((prev) => ({ ...prev, [bookingId]: 'checkin_done' }));
            setTimeout(loadBookings, 500);
        } catch {
            alert('Error de red al confirmar reserva.');
            setActionStatus((prev) => ({ ...prev, [bookingId]: 'checkin_error' }));
        }
    }

    // Comprueba si la reserva está lista para hacer check-in (15 mins antes hasta el final)
    function canCheckin(b: MyBooking): boolean {
        // Asume formato "YYYY-MM-DD" y "HH:MM"
        const [y, m, d] = b.date.split('-');
        const [hourStr, minStr] = b.timeFrom.split(':');

        if (!y || !m || !d || !hourStr || !minStr) return false;

        const startTime = new Date(Number(y), Number(m) - 1, Number(d), Number(hourStr), Number(minStr), 0);
        const now = new Date();

        // Calculamos la diferencia en minutos (puede ser negativa si es en el pasado)
        const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);

        // Permitir check-in desde 15 minutos antes
        // O si ya ha empezado (diffMinutes <= 0) pero aún no termina.
        // Para simplificar, asumiremos que si NO es "Dentro" y "diffMinutes < 15", podemos hacer checkin.
        if (diffMinutes <= 15) {
            return true;
        }

        return false;
    }

    if (!isLoggedIn) {
        return (
            <div className="bg-transparent border border-[#00FF41]/30 p-4 text-[#E0E0E0]/50 text-sm text-center font-medium">
                INICIA SESIÓN PARA VER TUS RESERVAS
            </div>
        );
    }

    return (
        <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-4 border-b border-[#00FF41]/40 pb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[#00FF41] tracking-wider">&gt; MIS_RESERVAS</h2>
            </div>

            <div className="max-h-[400px] overflow-y-auto flex flex-col gap-3 pb-2 px-1">
                {error && (
                    <div className="px-4 py-3 text-[#FF003C] bg-transparent text-xs font-medium border border-[#FF003C]">[ERR] {error}</div>
                )}

                {!isLoading && !error && bookings.length === 0 && (
                    <div className="py-6 text-[#E0E0E0]/50 text-sm text-center font-medium bg-transparent border border-[#00FF41]/20">
                        NO TIENES RESERVAS ACTIVAS
                    </div>
                )}

                {bookings.map((b) => {
                    const status = actionStatus[b.id];
                    const isDone = status === 'done';
                    if (isDone) return null;

                    const isDentro = b.status.toLowerCase().includes('dentro');
                    const isCheckinEligible = !isDentro && canCheckin(b);

                    return (
                        <div
                            key={b.id}
                            className={`bg-[#050505] border ${isDentro ? 'border-[#00FF41]' : 'border-[#00FF41]/30'} p-4 flex flex-col gap-1`}
                        >
                            {/* Primera fila: Fecha y Estado */}
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2 text-[#00FF41] font-bold text-sm">
                                    <span>&gt;</span>
                                    <span>{formatDate(b.date)}</span>
                                </div>
                                <span className={`text-xs font-bold ${isDentro ? 'text-[#00FF41] animate-pulse' : 'text-[#00FF41]/60'}`}>
                                    [{b.status || 'ACEPTADO'}]
                                </span>
                            </div>

                            {/* Segunda fila: Horario */}
                            <div className={`font-bold text-lg tracking-wide ${isDentro ? 'text-[#00FF41]' : 'text-[#E0E0E0]'}`}>
                                {b.timeFrom} - {b.timeTo}
                            </div>

                            {/* Tercera fila: Mesa */}
                            <div className="text-[#00FF41] font-bold text-sm bg-[#00FF41]/10 border border-[#00FF41]/30 py-1.5 px-3 mb-2 uppercase tracking-wide inline-block self-start">
                                [ {b.seat || b.location} ]
                            </div>

                            {/* Botonera inferior */}
                            {!isDentro && (
                                <div className="mt-2 flex items-center gap-2">
                                    {isCheckinEligible && (
                                        <button
                                            onClick={() => handleCheckin(b.id)}
                                            disabled={status === 'checkin_loading' || status === 'checkin_done'}
                                            title="Confirmar asistencia (Check-in)"
                                            className="flex-1 flex items-center justify-center gap-2 py-2 border border-[#00FF41] hover:bg-[#00FF41] hover:text-[#050505] bg-[#00FF41]/10 text-[#00FF41] font-bold text-sm disabled:opacity-50 transition-colors"
                                        >
                                            {status === 'checkin_loading' ? (
                                                <><span className="h-4 w-4 border-2 border-[#00FF41]/30 border-t-[#00FF41] animate-spin inline-block" /> CONFIRMANDO...</>
                                            ) : status === 'checkin_error' ? (
                                                '[ERR] REINTENTAR'
                                            ) : status === 'checkin_done' ? (
                                                'CONFIRMADO'
                                            ) : (
                                                '[ CHECK-IN ]'
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleCancel(b.id)}
                                        disabled={status === 'loading' || status === 'checkin_loading'}
                                        title="Cancelar reserva"
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 border border-[#FF003C] hover:bg-[#FF003C] hover:text-[#050505] bg-transparent text-[#FF003C] font-bold text-sm disabled:opacity-50 transition-colors ${!isCheckinEligible && 'w-full'}`}
                                    >
                                        {status === 'loading' ? (
                                            <span className="h-4 w-4 border-2 border-[#FF003C]/30 border-t-[#FF003C] animate-spin inline-block" />
                                        ) : status === 'error' ? (
                                            '[ERR]'
                                        ) : (
                                            '[ CANCELAR ]'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
