/**
 * Funciones tipadas para interactuar con la API de TakeASpot.
 * Equivalente a TakeASpotApi.kt — todos los endpoints de la API.
 */

import type { ApiResult, BookingRequest, BookingResult, MultiBookingResult, Session } from '@/types/domain';
import type { ServicesResponse, SlotsApiResponse, MultiBookingItem } from '@/types/api';
import { apiRequest, buildMultipartBody } from './httpClient';
import { extractSessionFromHeaders, saveTakeASpotSession } from './session';
import { getPitchIndex } from '@/lib/constants/seats';

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Realiza el login en TakeASpot.
 * URL correcta: https://reservas.ucam.edu/login (sin /myturner)
 * Flujo Laravel:
 *   1. GET /login → extraer _token oculto del formulario HTML
 *   2. POST /login con form url-encoded (_token, email, password)
 *   3. 302 redirect con cookies → login OK; redirect a /login → credenciales malas
 */
export async function login(
    email: string,
    password: string
): Promise<ApiResult<{ email: string }>> {
    // Paso 1: GET la página de login
    const pageResp = await apiRequest<string>('/login', {
        method: 'GET',
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    });

    const initialCookies = extractSessionFromHeaders(pageResp.responseHeaders, null);
    const tempSession: Session | null = initialCookies.sessionCookie
        ? { sessionCookie: initialCookies.sessionCookie, xsrfToken: initialCookies.xsrfToken, expiresAt: Date.now() + 60_000 }
        : null;

    // Extraer _token del HTML
    let csrfToken = '';
    if (pageResp.result.ok) {
        const html = pageResp.result.data as unknown as string;
        const patterns = [
            /<input[^>]+name="_token"[^>]+value="([^"]+)"/,
            /name="_token"[^>]+value="([^"]+)"/,
            /value="([^"]+)"[^>]+name="_token"/,
            /"_token":"([^"]+)"/,
        ];
        for (const pattern of patterns) {
            const match = pattern.exec(html);
            if (match) { csrfToken = match[1]; break; }
        }
    }

    if (!csrfToken && initialCookies.xsrfToken) {
        // Fallback: usar el XSRF token decodificado como _token
        try { csrfToken = decodeURIComponent(initialCookies.xsrfToken); } catch { csrfToken = initialCookies.xsrfToken ?? ''; }
    }

    console.log(`[TakeASpot Login] Extracted _token: ${csrfToken.substring(0, 10)}... | sessionId: ${initialCookies.sessionCookie?.substring(0, 10)}...`);

    // Paso 2: POST /login con form url-encoded
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

    if (!sessionCookie) {
        return { ok: false, error: 'Login incorrecto. Verifica tus credenciales UCAM.', code: 401 };
    }

    await saveTakeASpotSession(sessionCookie, xsrfToken, email);
    return { ok: true, data: { email } };
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getServices(session: Session): Promise<ApiResult<ServicesResponse>> {
    const { result } = await apiRequest<ServicesResponse>('/myturner/api/get-services', { session });
    return result;
}

// ─── Slots ────────────────────────────────────────────────────────────────────

export async function getServiceSlots(session: Session, serviceId: number): Promise<ApiResult<SlotsApiResponse>> {
    const { result } = await apiRequest<SlotsApiResponse>(`/myturner/api/service-slots/${serviceId}`, { session });
    return result;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export interface BookingApiResponse {
    booking_id?: number;
    id?: number;
    message?: string | null;
    error?: string;
    data?: {
        booking_id?: number;
        start_at?: { date: string };
        end_at?: { date: string };
        service?: string;
        multi?: unknown[];
    };
    status?: string;
}

/**
 * Reserva individual.
 * myturn_pitch acepta el ÍNDICE NUMÉRICO (1-based) de la mesa en pitches_names[].
 */
export async function makeBooking(session: Session, params: BookingRequest): Promise<ApiResult<BookingResult>> {
    const hourStr = `${params.start}-${params.end}`;
    const pitchIndex = getPitchIndex(params.pitchId);

    const body = buildMultipartBody({
        people: '1',
        date: params.date,
        hour: hourStr,
        service: String(params.serviceId),
        myturn_pitch: pitchIndex,
    });

    const { result } = await apiRequest<BookingApiResponse>('/myturner/api/make-booking', { method: 'POST', body, session });
    if (!result.ok) return result;

    const resp = result.data;
    // La respuesta viene envuelta: {status:"ok", data:{booking_id:...}}
    const bookingId = resp.data?.booking_id ?? (resp as BookingApiResponse).booking_id ?? (resp as BookingApiResponse).id;

    if (resp.status === 'ok' && bookingId) {
        return { ok: true, data: { bookingId: String(bookingId) } };
    }

    if (resp.error) {
        const isLimit = resp.error.toLowerCase().includes('limit') || resp.error.toLowerCase().includes('maximum');
        return { ok: false, error: isLimit ? 'Límite alcanzado: máximo 6 reservas por día.' : resp.error, code: 422 };
    }

    return { ok: false, error: 'Respuesta inesperada del servidor.', code: 500 };
}

/**
 * Multireserva — requiere booking_id de una reserva previa del mismo día.
 */
export async function makeMultiBooking(session: Session, bookingId: string, items: MultiBookingItem[]): Promise<ApiResult<MultiBookingResult>> {
    const body = buildMultipartBody({ bookingId, mbdata: JSON.stringify(items) });
    const { result } = await apiRequest<{ status?: string; data?: number[]; error?: string }>('/myturner/api/make-multi-booking', { method: 'POST', body, session });

    if (!result.ok) {
        if (result.code === 403 || (typeof result.error === 'string' && result.error.includes('Acción no permitida'))) {
            return { ok: false, error: 'Límite de reservas alcanzado. Se reservaron las franjas permitidas.', code: 422 };
        }
        return result;
    }

    if (result.data.error) return { ok: false, error: result.data.error, code: 422 };
    return { ok: true, data: { bookingIds: (result.data.data ?? []).map(String) } };
}

/**
 * Cancela una reserva por su ID numérico.
 */
export async function cancelBooking(session: Session, bookingId: string): Promise<ApiResult<void>> {
    const body = buildMultipartBody({ booking: bookingId });
    const { result } = await apiRequest<{ status?: string; error?: string }>('/myturner/api/cancel-booking', { method: 'POST', body, session });

    if (!result.ok) return result;
    if (result.data?.error) return { ok: false, error: result.data.error, code: 422 };
    return { ok: true, data: undefined };
}

// ─── My Bookings ─────────────────────────────────────────────────────────────

export interface MyBooking {
    id: string;
    date: string;
    timeFrom: string;
    timeTo: string;
    location: string;   // "BIBLIOTECA MURCIA"
    seat: string;       // "Fila 11 - Mesa 11"
    status: string;     // "Aceptado" | "Cancelado" | ...
}

/**
 * Obtiene las reservas del usuario scrapeando el HTML de GET /bookings.
 * La página HTML contiene <li class="table-row" data-id="ID">...</li>
 */
export async function getMyBookings(session: Session): Promise<ApiResult<MyBooking[]>> {
    const { result } = await apiRequest<string>('/bookings', {
        method: 'GET',
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        session,
    });

    if (!result.ok) return result;

    const html = result.data as unknown as string;
    const bookings = parseBookingsHtml(html);
    return { ok: true, data: bookings };
}

/**
 * Parsea el HTML de /bookings para extraer las reservas.
 * Formato: <li class="... table-row" data-id="ID">...</li>
 */
function parseBookingsHtml(html: string): MyBooking[] {
    const bookings: MyBooking[] = [];

    // Extraer fecha del día (aparece antes de cada grupo de reservas)
    // <div class="col col-full">Miércoles, 07/01/2026</div>
    let currentDate = '';

    // Split por bloques de reserva
    // Cada li tiene data-id y contiene: hora, ubicación, mesa, estado
    const liPattern = /<li[^>]+class="[^"]*table-row[^"]*"[^>]+data-id="(\d+)"[^>]*>([\s\S]*?)<\/li>/g;
    const datePattern = /<div[^>]+class="[^"]*col-full[^"]*"[^>]*>([^<]+)<\/div>/g;

    // Reconstruir en orden lineal parseando todo el HTML
    let pos = 0;
    let dateMatch: RegExpExecArray | null;
    let liMatch: RegExpExecArray | null;

    datePattern.lastIndex = 0;
    liPattern.lastIndex = 0;

    // Recolectar posiciones de fechas
    const datePositions: Array<{ pos: number; date: string }> = [];
    while ((dateMatch = datePattern.exec(html)) !== null) {
        const raw = dateMatch[1].trim();
        // Formato "Miércoles, 07/01/2026" → "2026-01-07"
        const dateNum = /(\d{2})\/(\d{2})\/(\d{4})/.exec(raw);
        if (dateNum) {
            datePositions.push({ pos: dateMatch.index, date: `${dateNum[3]}-${dateNum[2]}-${dateNum[1]}` });
        }
    }

    let dateIdx = 0;
    while ((liMatch = liPattern.exec(html)) !== null) {
        const liPos = liMatch.index;
        // Avanzar la fecha actual si corresponde
        while (dateIdx < datePositions.length - 1 && datePositions[dateIdx + 1].pos < liPos) {
            dateIdx++;
        }
        if (datePositions[dateIdx] && datePositions[dateIdx].pos < liPos) {
            currentDate = datePositions[dateIdx].date;
        }

        const id = liMatch[1];
        const content = liMatch[2];

        // Extraer fromtime y totime
        const fromMatch = /<span[^>]+class="fromtime"[^>]*>\s*(\d{2}:\d{2})\s*<\/span>/.exec(content);
        const toMatch = /<span[^>]+class="totime"[^>]*>\s*(\d{2}:\d{2})\s*<\/span>/.exec(content);

        // Ubicación (ej. BIBLIOTECA MURCIA) y mesa (ej. Fila 11 - Mesa 11)
        const locationMatch = /<div[^>]+class="[^"]*booking-l[^"]*"[^>]*>\s*([A-Z\s]+)\s*<p>([^<]+)<\/p>/.exec(content);

        // Estado
        const statusMatch = /<div[^>]+class="[^"]*col-6[^"]*"[^>]*>\s*([^\s<][^<]*?)\s*<\/div>/.exec(content);

        bookings.push({
            id,
            date: currentDate,
            timeFrom: fromMatch?.[1] ?? '',
            timeTo: toMatch?.[1] ?? '',
            location: locationMatch?.[1]?.trim() ?? 'BIBLIOTECA MURCIA',
            seat: locationMatch?.[2]?.trim() ?? '',
            status: statusMatch?.[1]?.trim() ?? '',
        });
    }

    return bookings;
}

/**
 * Realiza el check-in (confirmación) de una reserva.
 */
export async function checkinBooking(session: Session, bookingId: string, people: number = 1, freeCapacity: boolean = true): Promise<ApiResult<void>> {
    const body = buildMultipartBody({
        people: String(people),
        booking_id: bookingId,
        freecapacity: String(freeCapacity)
    });

    // El servidor devuelve algo como { status: "ok", data: { result: true } }
    const { result } = await apiRequest<{ status?: string; data?: { result?: boolean }; error?: string }>('/myturner/api/make-checkin', {
        method: 'POST',
        body,
        session
    });

    if (!result.ok) return result;

    // A veces la API falla "suavemente"
    if (result.data?.status === 'ok' && result.data?.data?.result === true) {
        return { ok: true, data: undefined };
    }

    if (result.data?.error) {
        return { ok: false, error: result.data.error, code: 422 };
    }

    return { ok: false, error: 'No se pudo completar el check-in', code: 500 };
}
