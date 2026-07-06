const CHECKIN_WINDOW_MS = 30 * 60 * 1000;
const BOOKED_AT_STORAGE_KEY = 'takispot-booked-at';

export function parseBookingDateTime(date: string, time: string): Date | null {
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    if (!y || !m || !d || Number.isNaN(h) || Number.isNaN(min)) return null;
    return new Date(y, m - 1, d, h, min, 0);
}

export function getBookedAtMap(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = sessionStorage.getItem(BOOKED_AT_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
        return {};
    }
}

/** Guarda el momento de reserva para calcular la ventana de check-in (30 min desde entonces). */
export function recordBookingCheckinAnchor(bookingIds: string[]) {
    if (typeof window === 'undefined' || bookingIds.length === 0) return;
    const now = new Date().toISOString();
    const map = getBookedAtMap();
    for (const id of bookingIds) {
        if (id) map[id] = now;
    }
    sessionStorage.setItem(BOOKED_AT_STORAGE_KEY, JSON.stringify(map));
}

export function mergeBookedAt<T extends { id: string }>(bookings: T[]): (T & { bookedAt?: string })[] {
    const map = getBookedAtMap();
    return bookings.map((b) => ({
        ...b,
        bookedAt: map[b.id],
    }));
}

/**
 * Check-in permitido durante la franja reservada, en una ventana de 30 minutos que empieza
 * en max(inicio de franja, momento de reserva). No puede pasar el fin de la franja.
 */
export function canCheckin(
    booking: { date: string; timeFrom: string; timeTo: string; bookedAt?: string },
    now = new Date(),
): boolean {
    const startTime = parseBookingDateTime(booking.date, booking.timeFrom);
    const endTime = parseBookingDateTime(booking.date, booking.timeTo);
    if (!startTime || !endTime) return false;

    const nowMs = now.getTime();
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();

    if (nowMs >= endMs) return false;

    const bookedAt = booking.bookedAt ? new Date(booking.bookedAt) : null;
    let windowStartMs: number;

    if (bookedAt && !Number.isNaN(bookedAt.getTime())) {
        windowStartMs = Math.max(startMs, bookedAt.getTime());
    } else if (nowMs > startMs + CHECKIN_WINDOW_MS) {
        // Reserva tardía sin hora guardada: ventana desde ahora (p. ej. acabas de reservar en la biblio)
        windowStartMs = nowMs;
    } else {
        windowStartMs = startMs;
    }

    const windowEndMs = Math.min(endMs, windowStartMs + CHECKIN_WINDOW_MS);
    return nowMs >= windowStartMs && nowMs < windowEndMs;
}
