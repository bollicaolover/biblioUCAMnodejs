'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MyBooking } from '@/lib/takeaspot/api';

interface MyBookingsPanelProps {
    isLoggedIn: boolean;
    onSessionExpired: () => void;
    refreshTrigger?: number;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    const str = date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function MyBookingsPanel({ isLoggedIn, onSessionExpired, refreshTrigger = 0 }: MyBookingsPanelProps) {
    const [bookings, setBookings] = useState<MyBooking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionStatus, setActionStatus] = useState<Record<string, 'loading' | 'done' | 'error' | 'checkin_loading' | 'checkin_error' | 'checkin_done'>>({});
    const [expanded, setExpanded] = useState(false);

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

    useEffect(() => {
        if (refreshTrigger > 0) loadBookings();
    }, [refreshTrigger, loadBookings]);

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
            loadBookings();
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
            loadBookings();
        } catch {
            alert('Error de red al confirmar reserva.');
            setActionStatus((prev) => ({ ...prev, [bookingId]: 'checkin_error' }));
        }
    }

    function canCheckin(b: MyBooking): boolean {
        const [y, m, d] = b.date.split('-');
        const [hourStr, minStr] = b.timeFrom.split(':');
        const [endHourStr, endMinStr] = b.timeTo.split(':');

        if (!y || !m || !d || !hourStr || !minStr || !endHourStr || !endMinStr) return false;

        const startTime = new Date(Number(y), Number(m) - 1, Number(d), Number(hourStr), Number(minStr), 0);
        const endTime = new Date(Number(y), Number(m) - 1, Number(d), Number(endHourStr), Number(endMinStr), 0);
        const now = new Date();

        const diffStartMin = (startTime.getTime() - now.getTime()) / (1000 * 60);
        const diffEndMin = (endTime.getTime() - now.getTime()) / (1000 * 60);

        return diffStartMin <= 0 && diffStartMin > -30 && diffEndMin > 0;
    }

    if (!isLoggedIn) {
        return (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center text-[#64748B] text-sm shadow-sm">
                <svg className="w-8 h-8 mx-auto mb-2 text-[#CBD5E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Inicia sesión para ver tus reservas
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-[#002855] shrink-0">Mis reservas</h2>
                <div className="flex-1 border-b border-[#CBD5E1]" aria-hidden />
            </div>

            <div className="flex flex-col gap-3">
                {error && (
                    <div className="px-4 py-3 text-[#DC2626] bg-[#FEF2F2] text-xs font-medium border border-[#FECACA] rounded-xl">{error}</div>
                )}

                {isLoading && bookings.length === 0 && (
                    <div className="flex items-center justify-center py-8 text-[#64748B] gap-2">
                        <span className="h-4 w-4 border-2 border-[#0057A8]/30 border-t-[#0057A8] animate-spin rounded-full" />
                        <span className="text-sm">Cargando reservas...</span>
                    </div>
                )}

                {!isLoading && !error && bookings.length === 0 && (
                    <div className="py-8 text-[#64748B] text-sm text-center bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
                        No tienes reservas activas
                    </div>
                )}

                {(() => {
                    const active = bookings.filter(b => actionStatus[b.id] !== 'done');
                    const first = active[0];
                    const rest = active.slice(1);

                    const renderCard = (b: MyBooking) => {
                        const status = actionStatus[b.id];
                        const isDentro = b.status.toLowerCase().includes('dentro');
                        const isAusente = b.status.toLowerCase().includes('ausente');
                        const isCheckinEligible = !isDentro && !isAusente && canCheckin(b);

                        return (
                            <div
                                key={b.id}
                                className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2 ${isDentro ? 'border-[#16A34A] ring-1 ring-[#16A34A]/20' : 'border-[#E2E8F0]'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-[#1E2940] font-semibold text-sm">{formatDate(b.date)}</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDentro ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                                        {b.status || 'Aceptado'}
                                    </span>
                                </div>
                                <div className={`font-bold text-xl tracking-wide ${isDentro ? 'text-[#16A34A]' : 'text-[#002855]'}`}>
                                    {b.timeFrom} – {b.timeTo}
                                </div>
                                <div className="text-[#0057A8] font-semibold text-sm bg-[#EEF4FB] rounded-lg py-1.5 px-3 inline-block self-start">
                                    {b.seat || b.location}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    {isCheckinEligible && (
                                        <button
                                            onClick={() => handleCheckin(b.id)}
                                            disabled={status === 'checkin_loading' || status === 'checkin_done'}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-[#16A34A] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] font-semibold text-sm disabled:opacity-50 transition-colors"
                                        >
                                            {status === 'checkin_loading' ? (
                                                <><span className="h-4 w-4 border-2 border-[#16A34A]/30 border-t-[#16A34A] animate-spin inline-block rounded-full" /> Confirmando...</>
                                            ) : status === 'checkin_error' ? 'Error — reintentar'
                                            : status === 'checkin_done' ? 'Confirmado ✓'
                                            : 'Check-in'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleCancel(b.id)}
                                        disabled={status === 'loading' || status === 'checkin_loading' || isDentro}
                                        title={isDentro ? 'Estás dentro de la instalación' : 'Cancelar reserva'}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-[#DC2626] bg-white hover:bg-[#DC2626] hover:text-white text-[#DC2626] font-semibold text-sm disabled:opacity-50 transition-colors ${!isCheckinEligible ? 'w-full' : ''} ${isDentro ? 'cursor-not-allowed' : ''}`}
                                    >
                                        {status === 'loading' ? (
                                            <span className="h-4 w-4 border-2 border-[#DC2626]/30 border-t-[#DC2626] animate-spin inline-block rounded-full" />
                                        ) : status === 'error' ? 'Error'
                                        : isDentro ? 'Dentro'
                                        : 'Cancelar'}
                                    </button>
                                </div>
                            </div>
                        );
                    };

                    return (
                        <>
                            {first && renderCard(first)}

                            {/* Collapsible rest — grid-rows trick for height:auto animation */}
                            {rest.length > 0 && (
                                <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                    <div className="overflow-hidden flex flex-col gap-3">
                                        <div className="pt-0 flex flex-col gap-3">
                                            {rest.map(renderCard)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {rest.length > 0 && (
                                <button
                                    onClick={() => setExpanded(v => !v)}
                                    className="flex items-center justify-center gap-1.5 w-full py-2 text-sm text-[#64748B] hover:text-[#002855] font-medium transition-colors"
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    {expanded ? 'Ocultar reservas' : `Ver todas mis reservas (${active.length})`}
                                </button>
                            )}
                        </>
                    );
                })()}
            </div>
        </div>
    );
}
