import { BadRequestException, Logger } from '@nestjs/common';
import { Auth0TokenService } from '@src/modules/auth/service/auth0-token.service';

export async function validateAndDecodeToken(idToken: string) {
  if (!idToken?.trim()) {
    throw new BadRequestException('ID token is required');
  }

  const logger = new Logger();

  try {
    const auth0TokenService = new Auth0TokenService();
    const user_decoded = await auth0TokenService.decodeIdToken(idToken);

    if (!user_decoded?.email) {
      throw new BadRequestException('Invalid token: email not found');
    }

    return user_decoded;
  } catch (error: any) {
    logger.error(`Token validation failed: ${error}`);
    throw new BadRequestException('Invalid or expired token');
  }
}
