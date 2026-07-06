/**
 * Cliente HTTP para la API de TakeASpot (reservas.ucam.edu).
 *
 * Headers observados en API.txt:
 * - Peticiones de API (/myturner/api/*): X-CSRF-TOKEN + X-Requested-With
 * - Peticiones de página web (/login, /bookings): Accept: text/html
 *
 * Cookies necesarias: takeaspot_session + XSRF-TOKEN
 * El token CSRF en headers se llama X-CSRF-TOKEN (decodificado del XSRF-TOKEN cookie).
 */

import { ApiResult } from '@/types/domain';
import { Session } from '@/types/domain';
import { TAKEASPOT_BASE_URL } from '@/lib/constants/schedules';

const BROWSER_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0';

export interface ApiRequestOptions {
    method?: 'GET' | 'POST';
    body?: BodyInit;
    headers?: Record<string, string>;
    session?: Session | null;
}

export interface ApiResponse<T> {
    result: ApiResult<T>;
    responseHeaders: Headers;
}

export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers: extraHeaders = {}, session } = options;

    const isApiCall = path.includes('/api/');
    const isHtmlRequest = extraHeaders['Accept']?.includes('text/html');

    // Headers base — User-Agent real de Firefox (igual al API.txt)
    const requestHeaders: Record<string, string> = {
        'User-Agent': BROWSER_USER_AGENT,
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept': isHtmlRequest
            ? 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            : '*/*',
        'Referer': `${TAKEASPOT_BASE_URL}/myturner`,
        'Origin': TAKEASPOT_BASE_URL,
        ...extraHeaders,
    };

    // Añadir X-Requested-With solo en llamadas de API (no en páginas HTML)
    if (isApiCall) {
        requestHeaders['X-Requested-With'] = 'XMLHttpRequest';
    }

    // Inyectar cookies de sesión y header CSRF
    if (session) {
        const cookieParts: string[] = [`takeaspot_session=${session.sessionCookie}`];

        if (session.xsrfToken) {
            cookieParts.push(`XSRF-TOKEN=${session.xsrfToken}`);
            // Si usamos el valor cifrado (eyJpdi...), EL HEADER DEBE SER X-XSRF-TOKEN 
            // para que el middleware VerifyCsrfToken de Laravel lo descifre.
            // (X-CSRF-TOKEN espera el string en texto plano de 40 chars).
            try {
                requestHeaders['X-XSRF-TOKEN'] = decodeURIComponent(session.xsrfToken);
            } catch {
                requestHeaders['X-XSRF-TOKEN'] = session.xsrfToken;
            }
        }

        requestHeaders['Cookie'] = cookieParts.join('; ');
    }

    let response: Response;
    try {
        console.log(`[TakeASpot] ${method} ${TAKEASPOT_BASE_URL}${path}`);
        response = await fetch(`${TAKEASPOT_BASE_URL}${path}`, {
            method,
            headers: requestHeaders,
            body,
            redirect: 'manual',   // Capturar cookies de 302
            cache: 'no-store',
        });
        console.log(`[TakeASpot] → ${response.status} ${response.statusText}`);
    } catch (networkError) {
        console.error(`[TakeASpot] Network error on ${path}:`, networkError);
        return {
            result: { ok: false, error: `Error de red: ${(networkError as Error).message}`, code: 0 },
            responseHeaders: new Headers(),
        };
    }

    // 302 = login exitoso (redirect tras autenticar) → OK con cookies
    if (response.status === 302 || response.status === 301) {
        return {
            result: { ok: true, data: null as unknown as T },
            responseHeaders: response.headers,
        };
    }

    if (!response.ok) {
        const errorResult = handleHttpError(response.status);
        return { result: errorResult, responseHeaders: response.headers };
    }

    // Parsear respuesta: JSON primero, fallback a texto plano (HTML, etc.)
    let data: T;
    try {
        const text = await response.text();
        if (!text) {
            data = null as unknown as T;
        } else {
            try {
                data = JSON.parse(text) as T;
            } catch {
                data = text as unknown as T;
            }
        }
    } catch {
        return {
            result: { ok: false, error: 'Respuesta inválida del servidor.', code: response.status },
            responseHeaders: response.headers,
        };
    }

    return {
        result: { ok: true, data },
        responseHeaders: response.headers,
    };
}

function handleHttpError(code: number): ApiResult<never> {
    const messages: Record<number, string> = {
        401: 'Sesión expirada. Por favor, vuelve a iniciar sesión.',
        403: 'Acción no permitida.',
        419: 'Token CSRF expirado. Recarga la página.',
        422: 'Datos inválidos.',
        429: 'Demasiadas peticiones. Espera un momento.',
        500: 'Error interno del servidor de TakeASpot.',
    };
    return { ok: false, error: messages[code] ?? `Error HTTP: ${code}`, code };
}

export function buildMultipartBody(fields: Record<string, string>): FormData {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value);
    }
    return formData;
}
