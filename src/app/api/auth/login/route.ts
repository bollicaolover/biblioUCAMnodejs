import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/takeaspot/api';
import { destroySession } from '@/lib/takeaspot/session';

// Max 10 intentos por IP en una ventana de 15 minutos
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

interface RateLimitRecord { count: number; resetAt: number }
const attempts = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
    const now = Date.now();

    // Limpiar entradas expiradas ocasionalmente para evitar memory leaks
    if (attempts.size > 500) {
        for (const [key, rec] of attempts) {
            if (now > rec.resetAt) attempts.delete(key);
        }
    }

    const rec = attempts.get(ip);
    if (!rec || now > rec.resetAt) {
        attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, retryAfter: 0 };
    }
    if (rec.count >= MAX_ATTEMPTS) {
        return { allowed: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
    }
    rec.count++;
    return { allowed: true, retryAfter: 0 };
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
    const { allowed, retryAfter } = checkRateLimit(ip);

    if (!allowed) {
        return NextResponse.json(
            { ok: false, error: 'Demasiados intentos. Espera unos minutos.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

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
