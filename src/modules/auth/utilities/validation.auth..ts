import { InviteToken } from '@src/types/inviteToken';

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidInviteTokenPayload(
  payload: InviteToken,
): payload is InviteToken {
  return (
    payload &&
    typeof payload.tenant_id === 'string' &&
    payload.tenant_id.trim() !== '' &&
    typeof payload.role_id === 'string' &&
    payload.role_id.trim() !== '' &&
    typeof payload.email_asociated === 'string' &&
    isValidEmail(payload.email_asociated) &&
    (payload.expires_at === undefined ||
      typeof payload.expires_at === 'number') &&
    (payload.status === undefined || typeof payload.status === 'string')
  );
}
