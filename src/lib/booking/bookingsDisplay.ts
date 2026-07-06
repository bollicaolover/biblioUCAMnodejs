import type { MyBooking } from '@/lib/takeaspot/api';

export function parseBookingTimes(booking: MyBooking): { start: Date; end: Date } | null {
    const [y, m, d] = booking.date.split('-').map(Number);
    const [fh, fm] = booking.timeFrom.split(':').map(Number);
    const [th, tm] = booking.timeTo.split(':').map(Number);
    if (!y || !m || !d || Number.isNaN(fh) || Number.isNaN(fm) || Number.isNaN(th) || Number.isNaN(tm)) {
        return null;
    }
    return {
        start: new Date(y, m - 1, d, fh, fm, 0),
        end: new Date(y, m - 1, d, th, tm, 0),
    };
}

export function isBookingActiveNow(booking: MyBooking, now = new Date()): boolean {
    const times = parseBookingTimes(booking);
    if (!times) return false;
    const t = now.getTime();
    return t >= times.start.getTime() && t < times.end.getTime();
}

export function isBookingPast(booking: MyBooking, now = new Date()): boolean {
    const times = parseBookingTimes(booking);
    if (!times) return false;
    return times.end.getTime() <= now.getTime();
}

export function isBookingUpcoming(booking: MyBooking, now = new Date()): boolean {
    const times = parseBookingTimes(booking);
    if (!times) return false;
    return times.start.getTime() > now.getTime();
}

export function partitionBookings(bookings: MyBooking[], now = new Date()) {
    const past: MyBooking[] = [];
    const active: MyBooking[] = [];
    const upcoming: MyBooking[] = [];

    for (const b of bookings) {
        if (isBookingPast(b, now)) past.push(b);
        else if (isBookingActiveNow(b, now)) active.push(b);
        else upcoming.push(b);
    }

    const byStartAsc = (a: MyBooking, b: MyBooking) => {
        const ta = parseBookingTimes(a)?.start.getTime() ?? 0;
        const tb = parseBookingTimes(b)?.start.getTime() ?? 0;
        return ta - tb;
    };

    const byStartDesc = (a: MyBooking, b: MyBooking) => -byStartAsc(a, b);

    active.sort(byStartAsc);
    upcoming.sort(byStartAsc);
    past.sort(byStartDesc);

    const featured = active[0] ?? upcoming[0] ?? null;

    // Todas las reservas actuales/futuras excepto la destacada (incluye otras activas y próximas)
    const rest = bookings
        .filter((b) => {
            if (featured?.id === b.id) return false;
            if (isBookingPast(b, now)) return false;
            return true;
        })
        .sort(byStartAsc);

    return { past, featured, rest };
}
