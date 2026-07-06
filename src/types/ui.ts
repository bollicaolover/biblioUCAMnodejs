/**
 * Tipos de interfaz de usuario — usados exclusivamente en Client Components.
 */

// ─── Map ──────────────────────────────────────────────────────────────────────

/** Estado visual de una mesa en el mapa */
export type SeatStatus = 'available' | 'partially' | 'occupied' | 'unknown';

/** Colores y etiquetas correspondientes a cada estado */
export const SEAT_STATUS_CONFIG: Record<
    SeatStatus,
    { bg: string; label: string; emoji: string }
> = {
    available: { bg: '#10b981', label: 'Disponible', emoji: '🟢' },
    partially: { bg: '#EDAB00', label: 'Parcialmente disponible', emoji: '🟡' },
    occupied: { bg: '#FF4444', label: 'Ocupado', emoji: '🔴' },
    unknown: { bg: '#6c757d', label: 'Desconocido', emoji: '⚫' },
};

/** Una mesa con su estado actual */
export interface MapSeat {
    row: number;
    seat: number;
    pitchId: string;
    status: SeatStatus;
}

// ─── Schedule / Booking UI ────────────────────────────────────────────────────

/** Una franja horaria con su estado de disponibilidad para una mesa concreta */
export interface ScheduleSlot {
    start: string;
    end: string;
    /** "Disponible" | "Reservado" */
    estado: 'Disponible' | 'Reservado';
}

/** Disponibilidad de una mesa por fecha */
export interface SeatAvailability {
    [date: string]: ScheduleSlot[];
}

/** Mesa seleccionada en el mapa — se pasa al modal */
export interface SelectedSeat {
    row: number;
    seat: number;
    pitchId: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
    isLoggedIn: boolean;
    email: string | null;
}
