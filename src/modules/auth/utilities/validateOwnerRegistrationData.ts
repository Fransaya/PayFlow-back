import { BadRequestException } from '@nestjs/common';
import { RegisterOwnerDto } from '../dto/auth.dto';

export function validateOwnerRegistrationData(body: RegisterOwnerDto): void {
  const { tenant, user } = body;

  // Validar tenant data
  if (!tenant?.name?.trim()) {
    throw new BadRequestException('Tenant name is required');
  }

  if (!tenant?.slug?.trim()) {
    throw new BadRequestException('Tenant slug is required');
  }

  // Validar formato del slug (solo letras, números y guiones)
  if (!/^[a-z0-9-]+$/.test(tenant.slug)) {
    throw new BadRequestException(
      'Tenant slug must contain only lowercase letters, numbers, and hyphens',
    );
  }

  // Validar user data
  if (!user?.display_name?.trim()) {
    throw new BadRequestException('User display name is required');
  }

  if (user.display_name.length < 2) {
    throw new BadRequestException(
      'Display name must be at least 2 characters long',
    );
  }

  if (user.display_name.length > 100) {
    throw new BadRequestException(
      'Display name must be less than 100 characters',
    );
  }

  if (!user?.phone?.trim()) {
    throw new BadRequestException('El Telefono es obligatorio');
  }
}
