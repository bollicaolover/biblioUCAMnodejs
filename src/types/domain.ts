/**
 * Modelos de dominio — equivalentes a las clases de dominio de Kotlin.
 * Incluye también el tipo de resultado genérico para reemplazar el manejo
 * de excepciones de ApiErrorHandler.kt
 */

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Sesión de TakeASpot — equivalente al modelo Session de Kotlin.
 * Se almacena cifrada en una cookie HttpOnly via iron-session.
 */
export interface Session {
    sessionCookie: string;
    xsrfToken: string | null;
    /** Timestamp Unix en ms — equivalente a expiresAt de SessionCookieJar.kt */
    expiresAt: number;
}

// ─── Library Service ──────────────────────────────────────────────────────────

export interface LibraryService {
    id: number;
    name: string;
    capacity: number;
    tables: TableSlot[];
    timetable: Record<string, TimeSlot[]>;
}

export interface TableSlot {
    name: string;
    status: string;
}

export interface TimeSlot {
    open: string;
    close: string;
    gbid: string | null;
}

// ─── API Result ───────────────────────────────────────────────────────────────

/**
 * Tipo de resultado genérico — reemplaza el sistema de excepciones de
 * ApiErrorHandler.kt con un tipo discriminado seguro.
 *
 * Casos de error conocidos:
 * - code 401: sesión expirada
 * - error "BOOKING_LIMIT": límite de 6 reservas diarias alcanzado
 */
export type ApiResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; code: number };

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface BookingRequest {
    pitchId: string;
    date: string;
    /** Formato "HH:MM" */
    start: string;
    /** Formato "HH:MM" */
    end: string;
    serviceId: number;
}

export interface BookingResult {
    bookingId: string;
}

export interface MultiBookingResult {
    bookingIds: string[];
}
