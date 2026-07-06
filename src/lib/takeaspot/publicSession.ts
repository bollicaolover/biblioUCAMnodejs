/**
 * Sesión pública del servidor — equivalente a crear_sesion_publica() en streamlit_app.py.
 *
 * Mantiene en memoria del proceso Node.js una sesión autenticada con las
 * credenciales públicas del .env.local. Se reutiliza entre requests y se
 * refresca automáticamente si expira.
 *
 * ⚠️ Sólo se usa para LECTURA (ver disponibilidad del mapa).
 *    Las reservas siempre requieren la sesión personal del usuario.
 */

import type { Session } from '@/types/domain';
import { login } from './api';

// Cache en memoria del proceso (sobrevive entre requests en dev y prod)
let cachedPublicSession: Session | null = null;
let loginInProgress: Promise<Session | null> | null = null;

/**
 * Obtiene o crea la sesión pública del servidor.
 * Si no hay credenciales configuradas devuelve null.
 */
export async function getPublicSession(): Promise<Session | null> {
    const email = process.env.PUBLIC_UCAM_EMAIL;
    const password = process.env.PUBLIC_UCAM_PASSWORD;

    if (!email || !password) return null;

    // Si la sesión cache es válida, la reutilizamos
    if (cachedPublicSession && Date.now() < cachedPublicSession.expiresAt - 60_000) {
        return cachedPublicSession;
    }

    // Evitar múltiples logins simultáneos (race condition)
    if (loginInProgress) {
        return loginInProgress;
    }

    loginInProgress = (async () => {
        try {
            const result = await login(email, password);
            if (result.ok) {
                // El login guarda la sesión en iron-session (cookie del usuario actual),
                // pero la sesión pública la guardamos en memoria del servidor sin cookie.
                // Necesitamos construir la sesión directamente del login.
                // Re-usamos la misma sesión que se guardó con saveTakeASpotSession
                // leyendo desde el store interno.
                cachedPublicSession = await getPublicSessionFromLogin(email, password);
                return cachedPublicSession;
            }
            return null;
        } catch {
            return null;
        } finally {
            loginInProgress = null;
        }
    })();

    return loginInProgress;
}

/**
 * Login directo que retorna la Session sin usar iron-session.
 * Necesitamos el httpClient directamente para capturar las cookies.
 */
async function getPublicSessionFromLogin(
    email: string,
    password: string
): Promise<Session | null> {
    const { apiRequest } = await import('./httpClient');
    const { extractSessionFromHeaders } = await import('./session');
    const { SESSION_DURATION_MS } = await import('@/lib/constants/schedules');

    // GET login page
    const pageResp = await apiRequest<string>('/login', {
        method: 'GET',
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    });

    const initialCookies = extractSessionFromHeaders(pageResp.responseHeaders, null);
    const tempSession: Session | null = initialCookies.sessionCookie
        ? { sessionCookie: initialCookies.sessionCookie, xsrfToken: initialCookies.xsrfToken, expiresAt: Date.now() + 60_000 }
        : null;

    // Extraer _token del HTML
    let csrfToken = initialCookies.xsrfToken ?? '';
    if (pageResp.result.ok) {
        const html = pageResp.result.data as unknown as string;
        const match = /<input[^>]+name="_token"[^>]+value="([^"]+)"/.exec(html)
            ?? /name="_token"\s+value="([^"]+)"/.exec(html)
            ?? /value="([^"]+)"\s+name="_token"/.exec(html);
        if (match) csrfToken = match[1];
    }

    console.log(`[TakeASpot Public Login] Extracted _token: ${csrfToken.substring(0, 10)}... | sessionId: ${initialCookies.sessionCookie?.substring(0, 10)}...`);

    // POST login
    const formBody = new URLSearchParams({ _token: csrfToken, email, password, remember: 'on' }).toString();
    const loginResp = await apiRequest<unknown>('/login', {
        method: 'POST',
        body: formBody,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Referer': 'https://reservas.ucam.edu/login',
            'Origin': 'https://reservas.ucam.edu',
        },
        session: tempSession,
    });

    const { sessionCookie, xsrfToken } = extractSessionFromHeaders(loginResp.responseHeaders, tempSession);

    if (!sessionCookie) return null;

    return {
        sessionCookie,
        xsrfToken,
        expiresAt: Date.now() + SESSION_DURATION_MS,
    };
}

/** Invalida la caché (útil si la sesión pública falla con 401) */
export function invalidatePublicSession(): void {
    cachedPublicSession = null;
}
