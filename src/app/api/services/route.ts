import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/takeaspot/api';
import { getTakeASpotSession } from '@/lib/takeaspot/session';

export async function GET(_request: NextRequest) {
    try {
        const session = await getTakeASpotSession();
        if (!session) {
            return NextResponse.json(
                { ok: false, error: 'Sesión expirada. Por favor, inicia sesión de nuevo.', code: 401 },
                { status: 401 }
            );
        }

        const result = await getServices(session);

        if (!result.ok) {
            return NextResponse.json(result, { status: result.code || 500 });
        }

        return NextResponse.json({ ok: true, data: result.data });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
