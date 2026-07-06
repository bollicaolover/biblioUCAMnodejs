import { NextRequest, NextResponse } from 'next/server';
import { getServiceSlots } from '@/lib/takeaspot/api';
import { getTakeASpotSession } from '@/lib/takeaspot/session';
import { getPublicSession, invalidatePublicSession } from '@/lib/takeaspot/publicSession';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ serviceId: string }> }
) {
    try {
        const { serviceId } = await params;
        const id = parseInt(serviceId, 10);

        if (isNaN(id)) {
            return NextResponse.json(
                { ok: false, error: 'serviceId inválido.' },
                { status: 400 }
            );
        }

        // Intentar usar la sesión del usuario primero, si no hay → sesión pública
        let session = await getTakeASpotSession();

        if (!session) {
            session = await getPublicSession();
        }

        if (!session) {
            return NextResponse.json(
                { ok: false, error: 'Sin sesión. Inicia sesión o configura PUBLIC_UCAM_EMAIL en .env.local.', code: 401 },
                { status: 401 }
            );
        }

        const result = await getServiceSlots(session, id);

        if (!result.ok) {
            // Si la sesión pública expira, invalidar cache para forzar re-login
            if (result.code === 401) {
                invalidatePublicSession();
            }
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
