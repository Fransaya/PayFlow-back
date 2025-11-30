import { BadRequestException, Logger } from '@nestjs/common';
import { GoogleTokenService } from '@src/modules/auth/services/google-token.service';

export async function validateAndDecodeToken(idToken: string) {
  if (!idToken?.trim()) {
    throw new BadRequestException('ID token is required');
  }

  const logger = new Logger();

  try {
    const googleTokenService = new GoogleTokenService();
    const user_decoded = await googleTokenService.decodeIdToken(idToken);

    if (!user_decoded?.email) {
      throw new BadRequestException('Invalid token: email not found');
    }

    return user_decoded;
  } catch (error: any) {
    logger.error(`Token validation failed: ${error}`);
    throw new BadRequestException('Invalid or expired token');
  }
}
