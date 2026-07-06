'use client';

import { useEffect, useState } from 'react';

interface BookingSuccessToastProps {
    show: boolean;
    onHide: () => void;
    message?: string;
}

export function BookingSuccessToast({ show, onHide, message = 'Reserva confirmada' }: BookingSuccessToastProps) {
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!show) return;

        setMounted(true);
        const openFrame = requestAnimationFrame(() => setVisible(true));
        const hideTimer = window.setTimeout(() => setVisible(false), 3200);
        const unmountTimer = window.setTimeout(() => {
            setMounted(false);
            onHide();
        }, 3500);

        return () => {
            cancelAnimationFrame(openFrame);
            clearTimeout(hideTimer);
            clearTimeout(unmountTimer);
        };
    }, [show, onHide]);

    if (!mounted) return null;

    return (
        <div
            className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[60] flex justify-center pointer-events-none"
            role="status"
            aria-live="polite"
        >
            <div className={`booking-toast flex items-center gap-3 bg-[#002855] text-white px-5 py-3.5 rounded-2xl shadow-lg ${visible ? 'booking-toast--visible' : ''}`}>
                <div className="booking-toast-check flex-shrink-0 w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path className="booking-toast-check-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <span className="font-semibold text-sm">{message}</span>
            </div>
        </div>
    );
}
