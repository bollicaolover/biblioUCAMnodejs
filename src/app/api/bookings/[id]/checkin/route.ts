import { NextRequest, NextResponse } from 'next/server';
import { getTakeASpotSession } from '@/lib/takeaspot/session';
import { checkinBooking } from '@/lib/takeaspot/api';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getTakeASpotSession();
        if (!session) {
            return NextResponse.json(
                { ok: false, error: 'No autorizado', code: 401 },
                { status: 401 }
            );
        }

        const resolvedParams = await params;
        const bookingId = resolvedParams.id;
        if (!bookingId) {
            return NextResponse.json(
                { ok: false, error: 'Falta ID de reserva', code: 400 },
                { status: 400 }
            );
        }

        let people = 1;
        let freeCapacity = true;
        try {
            const body = await req.json();
            if (body.people !== undefined) people = Number(body.people);
            if (body.freeCapacity !== undefined) freeCapacity = Boolean(body.freeCapacity);
        } catch {
            // Body vacío o no parseable, ignorar y usar defaults
        }

        const result = await checkinBooking(session, bookingId, people, freeCapacity);

        if (result.ok) {
            return NextResponse.json({ ok: true });
        } else {
            return NextResponse.json(
                { ok: false, error: result.error, code: result.code },
                { status: result.code || 500 }
            );
        }
    } catch (error: any) {
        console.error('Error in checkin route:', error);
        return NextResponse.json(
            { ok: false, error: 'Error interno del servidor', code: 500 },
            { status: 500 }
        );
    }
}
