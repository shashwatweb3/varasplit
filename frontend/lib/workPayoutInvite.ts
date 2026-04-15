'use client';

export const WORK_PAYOUT_INVITE_CODE = 'SHSHWT';
export const WORK_PAYOUT_INVITE_KEY = 'varasplit.workPayoutsInviteAccepted';

export function hasWorkPayoutInviteAccess() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(WORK_PAYOUT_INVITE_KEY) === 'true';
}

export function acceptWorkPayoutInvite() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(WORK_PAYOUT_INVITE_KEY, 'true');
}
