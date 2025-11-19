// src/modules/auth/roles/permissions.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { AppPermission } from '@src/enum/permission.enum';

/**
 * Clave utilizada por el Reflector en el PermissionsGuard
 * para obtener los metadatos (la lista de permisos requeridos)
 * que son adjuntados a la ruta.
 */
export const PERMISSIONS_KEY = 'required_permissions';

/**
 * Decorador personalizado para adjuntar la lista de permisos
 * requeridos a una ruta (método de controlador).
 * * @param permissions La lista de permisos de AppPermission[] necesarios para el acceso.
 */
export const CheckPermissions = (...permissions: AppPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
