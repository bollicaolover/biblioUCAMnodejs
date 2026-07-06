'use client';

import { sendGAEvent } from '@next/third-parties/google';

const isEnabled = () => Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

function track(event: string, params?: Record<string, string | number | boolean>) {
  if (!isEnabled()) return;
  sendGAEvent('event', event, params ?? {});
}

/** GA4 recommended: https://developers.google.com/analytics/devguides/collection/ga4/reference/events#login */
export function trackLogin() {
  track('login', { method: 'ucam' });
}

export function trackLoginFailed(reason: 'invalid_credentials' | 'rate_limit' | 'network' | 'api_error') {
  track('login_failed', { reason });
}

export function trackLogout() {
  track('logout');
}

export function trackSessionExpired() {
  track('session_expired');
}

export function trackAccountSwitch() {
  track('account_switch');
}

/** Usuario abre el modal de reserva para una mesa */
export function trackSelectSeat(pitchId: string) {
  track('select_seat', { pitch_id: pitchId });
}

export function trackBookingCreated(params: {
  pitchId: string;
  row: number;
  seat: number;
  slotsCount: number;
  datesCount: number;
}) {
  track('booking_created', {
    pitch_id: params.pitchId,
    row: params.row,
    seat: params.seat,
    slots_count: params.slotsCount,
    dates_count: params.datesCount,
  });
}

export function trackBookingCancelled() {
  track('booking_cancelled');
}

export function trackCheckIn() {
  track('check_in');
}
