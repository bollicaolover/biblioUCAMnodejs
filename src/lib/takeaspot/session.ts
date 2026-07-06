/**
 * Gestión de sesión en el servidor.
 * Equivalente a SessionCookieJar.kt — persiste takeaspot_session y XSRF-TOKEN
 * en una cookie HttpOnly cifrada via iron-session.
 */

import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { Session } from '@/types/domain';
import { SESSION_DURATION_MS } from '@/lib/constants/schedules';

/** La sesión que iron-session almacena en la cookie cifrada */
export interface AppSessionData {
    accounts?: Record<string, Session>;
    activeEmail?: string;
}

export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-change-in-production-32chars',
    cookieName: 'ucam_reservas_session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: SESSION_DURATION_MS / 1000, // iron-session usa segundos
    },
};

/** Obtiene la sesión iron-session desde las cookies del request actual */
export async function getAppSession(): Promise<IronSession<AppSessionData>> {
    const cookieStore = await cookies();
    return getIronSession<AppSessionData>(cookieStore, sessionOptions);
}

/** Lee la sesión de TakeASpot desde la cookie cifrada */
export async function getTakeASpotSession(): Promise<Session | null> {
    const session = await getAppSession();
    if (!session.activeEmail || !session.accounts || !session.accounts[session.activeEmail]) return null;

    const activeSession = session.accounts[session.activeEmail];

    // Verificar si la sesión ha expirado
    if (Date.now() > activeSession.expiresAt) {
        delete session.accounts[session.activeEmail];
        if (Object.keys(session.accounts).length === 0) {
            session.activeEmail = undefined;
        } else {
            session.activeEmail = Object.keys(session.accounts)[0];
        }
        await session.save();
        return null;
    }

    return activeSession;
}

/** Guarda la sesión de TakeASpot en la cookie cifrada */
export async function saveTakeASpotSession(
    sessionCookie: string,
    xsrfToken: string | null,
    email?: string
): Promise<void> {
    const session = await getAppSession();
    if (!session.accounts) session.accounts = {};

    const targetEmail = email ?? session.activeEmail;

    if (targetEmail && targetEmail !== process.env.PUBLIC_UCAM_EMAIL) {
        session.accounts[targetEmail] = {
            sessionCookie,
            xsrfToken,
            expiresAt: Date.now() + SESSION_DURATION_MS,
        };
        session.activeEmail = targetEmail;

        // Mantener como máximo 4 cuentas
        const emails = Object.keys(session.accounts);
        if (emails.length > 4) {
            const oldestEmail = emails.find(e => e !== targetEmail); // Borramos la primera que no sea la que acabamos de guardar
            if (oldestEmail) delete session.accounts[oldestEmail];
        }
    }

    await session.save();
}

/** Cambia la cuenta activa */
export async function switchActiveAccount(email: string): Promise<boolean> {
    const session = await getAppSession();
    if (session.accounts && session.accounts[email]) {
        session.activeEmail = email;
        await session.save();
        return true;
    }
    return false;
}

/** Borra una cuenta específica */
export async function removeAccount(email: string): Promise<void> {
    const session = await getAppSession();
    if (session.accounts && session.accounts[email]) {
        delete session.accounts[email];

        if (session.activeEmail === email) {
            const remaining = Object.keys(session.accounts);
            session.activeEmail = remaining.length > 0 ? remaining[0] : undefined;
        }
        await session.save();
    }
}

/** Destruye la sesión */
export async function destroySession(): Promise<void> {
    const session = await getAppSession();
    session.destroy();
    await session.save();
}

/**
 * Extrae cookies de TakeASpot de los headers de una respuesta fetch.
 * Equivalente a la lógica saveFromResponse de SessionCookieJar.kt.
 */
export function extractSessionFromHeaders(
    headers: Headers,
    currentSession: Session | null
): { sessionCookie: string | null; xsrfToken: string | null } {
    let sessionCookie: string | null = null;
    let xsrfToken: string | null = null;

    // getSetCookie() devuelve un array limpio de cada Set-Cookie header
    // sin los problemas de separar por comas (que rompen las fechas 'expires=Wed, ...')
    const setCookies = typeof headers.getSetCookie === 'function'
        ? headers.getSetCookie()
        : [];

    for (const cookieStr of setCookies) {
        const nameValue = cookieStr.split(';')[0].trim();
        const eqIdx = nameValue.indexOf('=');
        if (eqIdx === -1) continue;

        const name = nameValue.slice(0, eqIdx).trim();
        const value = nameValue.slice(eqIdx + 1).trim();

        if (name === 'takeaspot_session') sessionCookie = value;
        // La cookie XSRF-TOKEN viene URL-encoded (%3D%3D), hay que decodificarla
        if (name === 'XSRF-TOKEN') xsrfToken = decodeURIComponent(value);
    }

    // Mantener valores anteriores si los nuevos no llegaron
    return {
        sessionCookie: sessionCookie ?? currentSession?.sessionCookie ?? null,
        xsrfToken: xsrfToken ?? currentSession?.xsrfToken ?? null,
    };
}
