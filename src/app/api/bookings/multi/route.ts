import { NextRequest, NextResponse } from 'next/server';
import { makeMultiBooking } from '@/lib/takeaspot/api';
import { getTakeASpotSession } from '@/lib/takeaspot/session';
import type { MultiBookingItem } from '@/types/api';

// POST /api/bookings/multi — crear múltiples reservas vinculadas
export async function POST(request: NextRequest) {
    try {
        const session = await getTakeASpotSession();
        if (!session) {
            return NextResponse.json({ ok: false, error: 'Sesión expirada.', code: 401 }, { status: 401 });
        }

        const body = await request.json();
        const { bookingId, items } = body as { bookingId: string; items: MultiBookingItem[] };

        if (!bookingId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ ok: false, error: 'Faltan parámetros de multireserva.', code: 400 }, { status: 400 });
        }

        const result = await makeMultiBooking(session, bookingId, items);

        if (!result.ok) return NextResponse.json(result, { status: result.code || 500 });
        return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ ok: false, error: 'Error interno de multireserva.' }, { status: 500 });
    }
}
