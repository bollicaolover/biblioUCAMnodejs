import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/takeaspot/api';
import { destroySession } from '@/lib/takeaspot/session';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { email?: string; password?: string };
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { ok: false, error: 'Email y contraseña son requeridos.' },
                { status: 400 }
            );
        }

        const result = await login(email, password);

        if (!result.ok) {
            const status = result.code === 401 ? 401 : 400;
            return NextResponse.json({ ok: false, error: result.error }, { status });
        }

        return NextResponse.json({ ok: true, email: result.data.email });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        await destroySession();
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'Error al cerrar sesión.' },
            { status: 500 }
        );
    }
}
