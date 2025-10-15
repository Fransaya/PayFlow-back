import { BadRequestException } from '@nestjs/common';
import { InviteToken } from '@src/types/inviteToken';

export function validateInviteTokenEmail(
  inviteToken: InviteToken,
  userEmail: string,
): void {
  if (inviteToken.email_asociated !== userEmail) {
    throw new BadRequestException(
      'Invite token email does not match authenticated user email',
    );
  }
}
