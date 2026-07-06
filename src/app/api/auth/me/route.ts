import { NextResponse } from 'next/server';
import { getAppSession, getTakeASpotSession } from '@/lib/takeaspot/session';

export async function GET() {
    try {
        const takeaspotSession = await getTakeASpotSession();

        if (!takeaspotSession) {
            return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
        }

        const appSession = await getAppSession();

        return NextResponse.json({
            ok: true,
            email: appSession.email || 'Usuario'
        });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
