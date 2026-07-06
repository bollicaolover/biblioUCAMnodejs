/**
 * DTOs de la API TakeASpot — equivalentes exactos de los Kotlin DTOs:
 * ServicesDto.kt, SlotsDto.kt, MultiBookingDto.kt
 */

// ─── Services ────────────────────────────────────────────────────────────────

export interface ServicesResponse {
    data: ServiceDataDto[];
}

export interface ServiceDataDto {
    id: number;
    name: string | null;
    /** Serialized as "properties" in JSON */
    properties: ServicePropertiesDto;
    timetable: Record<string, TimetableEntryDto[]> | null;
}

export interface ServicePropertiesDto {
    /** Serialized as "total_pitches" */
    total_pitches: string;
    /** Serialized as "pitches_names" */
    pitches_names: PitchDto[];
}

export interface PitchDto {
    name: string;
    status: string;
}

export interface TimetableEntryDto {
    open: string;
    close: string;
    /** Serialized as "_gbid" */
    _gbid: string | null;
}

// ─── Slots ────────────────────────────────────────────────────────────────────

/**
 * Respuesta principal de la API de slots.
 * Estructura: { data: { freeslots: { "YYYY-MM-DD": SlotTimeFrame[] } } }
 * La API devuelve el objeto envuelto en { data: { freeslots: ... } }
 */
export interface SlotsApiResponse {
    data: {
        freeslots: Record<string, SlotTimeFrame[]>;
    };
}

/** Una franja horaria con las mesas libres dentro */
export interface SlotTimeFrame {
    start: string;
    end: string;
    /** Puede ser un array o un objeto indexado por ID */
    free: SlotFreeItem[] | Record<string, SlotFreeItem>;
}

export interface SlotFreeItem {
    id: string;
    name?: string;
}

/**
 * SlotItemDto — representa el estado de una mesa en un horario concreto.
 * Equivalente a SlotItemDto.kt
 */
export interface SlotItemDto {
    name: string | null;
    start: string | null;
    end: string | null;
    available: number | null;
    booked: number | null;
    blocked: boolean | null;
    capacity: number | null;
}

/** Función pura equivalente al método isBookable() de Kotlin */
export function isBookable(slot: SlotItemDto): boolean {
    return (
        slot.available === 1 &&
        slot.blocked === false &&
        (slot.booked ?? 0) < (slot.capacity ?? 1)
    );
}

// ─── Multi-Booking ────────────────────────────────────────────────────────────

/**
 * MultiBookingItem — equivalente exacto de MultiBookingDto.kt
 */
export interface MultiBookingItem {
    /** Formato: "2026-01-07" */
    date: string;
    /** Formato: "10:30" */
    start: string;
    /** Formato: "12:30" */
    end: string;
    /** ID de la mesa como string, ej: "215" */
    pitch: string;
}
