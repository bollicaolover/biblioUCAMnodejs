import { NextRequest, NextResponse } from 'next/server';
import { cancelBooking } from '@/lib/takeaspot/api';
import { getTakeASpotSession } from '@/lib/takeaspot/session';

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { ok: false, error: 'ID de reserva requerido.' },
                { status: 400 }
            );
        }

        const session = await getTakeASpotSession();
        if (!session) {
            return NextResponse.json(
                { ok: false, error: 'Sesión expirada. Por favor, inicia sesión de nuevo.', code: 401 },
                { status: 401 }
            );
        }

        const result = await cancelBooking(session, id);

        if (!result.ok) {
            return NextResponse.json(result, { status: result.code || 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
