import { NextRequest, NextResponse } from 'next/server';
import { getMyBookings, makeBooking } from '@/lib/takeaspot/api';
import { getTakeASpotSession } from '@/lib/takeaspot/session';

// GET /api/bookings — obtener reservas del usuario
export async function GET(_request: NextRequest) {
    try {
        const session = await getTakeASpotSession();
        if (!session) {
            return NextResponse.json({ ok: false, error: 'Sesión expirada.', code: 401 }, { status: 401 });
        }
        const result = await getMyBookings(session);
        if (!result.ok) return NextResponse.json(result, { status: result.code || 500 });
        return NextResponse.json({ ok: true, data: result.data });
    } catch {
        return NextResponse.json({ ok: false, error: 'Error interno del servidor.' }, { status: 500 });
    }
}

// POST /api/bookings — crear nueva reserva
export async function POST(request: NextRequest) {
    try {
        const session = await getTakeASpotSession();
        if (!session) {
            return NextResponse.json({ ok: false, error: 'Sesión expirada.', code: 401 }, { status: 401 });
        }

        const body = await request.json();
        const { pitchId, date, start, end, serviceId } = body;

        if (!pitchId || !date || !start || !end || !serviceId) {
            return NextResponse.json({ ok: false, error: 'Faltan parámetros requeridos.', code: 400 }, { status: 400 });
        }

        const result = await makeBooking(session, {
            serviceId: Number(serviceId),
            date,
            start,
            end,
            pitchId
        });

        if (!result.ok) return NextResponse.json(result, { status: result.code || 500 });
        return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ ok: false, error: 'Error interno del servidor.' }, { status: 500 });
    }
}

