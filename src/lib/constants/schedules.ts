/**
 * Horarios disponibles en la biblioteca UCAM.
 * Migrado desde mapa_interactivo.py: HORARIOS = [...]
 */

export const SCHEDULES = [
    '08:30-10:30',
    '10:30-12:30',
    '12:30-14:30',
    '14:30-16:30',
    '16:30-18:30',
    '18:30-20:30',
    '20:30-22:30',
] as const;

export type Schedule = (typeof SCHEDULES)[number];

/** Parsea un string "HH:MM-HH:MM" en sus partes */
export function parseSchedule(schedule: Schedule): { start: string; end: string } {
    const [start, end] = schedule.split('-');
    return { start, end };
}

/** El serviceId de la biblioteca UCAM en TakeASpot */
export const LIBRARY_SERVICE_ID = 845;

/** Duración de sesión: 4.8 horas en ms — igual que en SessionCookieJar.kt */
export const SESSION_DURATION_MS = 17_400_000;

/** Límite máximo de reservas por día */
export const MAX_BOOKINGS_PER_DAY = 6;

/** Base URL de la API de TakeASpot — Host confirmado en API.txt */
export const TAKEASPOT_BASE_URL = 'https://reservas.ucam.edu';
