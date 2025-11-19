// src/modules/auth/roles/permissions.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { DbService, roleRepo } from '@src/libs/db';

import { PERMISSIONS_KEY } from './permissions.decorator';
import { AppPermission } from '@src/enum/permission.enum';

// Definición de la interfaz del usuario después de pasar el AuthGuard
// Asumimos que el AuthGuard adjunta estos campos al request.user
interface AuthUser {
  user_id: string;
  tenant_id: string;
  // Opcional: Para el caso especial del Owner (el que creó el tenant)
  is_owner?: boolean;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dbService: DbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Obtener los permisos requeridos por la ruta (del Decorator @CheckPermissions)
    const requiredPermissions = this.reflector.getAllAndOverride<
      AppPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // Si la ruta no tiene el decorador @CheckPermissions, permitimos el acceso.
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    // 2. Validar el Contexto de Autenticación (AuthGuard ya debería haberlo hecho)
    if (!user?.tenant_id || !user?.user_id) {
      // Esto indica un fallo de configuración donde el AuthGuard no funcionó correctamente.
      throw new InternalServerErrorException(
        'Contexto de usuario o Tenant no disponible.',
      );
    }

    // 3. Lógica para el Owner (Regla de Súper-Usuario)
    // Si el usuario es el Owner del negocio, siempre tiene todos los permisos.
    // Esto evita consultas a la tabla role para el administrador principal.
    if (user.is_owner === true) {
      return true;
    }

    // 4. Consulta Multi-Tenant: Obtener los permisos del usuario
    // Usamos el repositorio de roles con la transacción de la base de datos
    const uniqueUserPermissions = await this.dbService.runInTransaction(
      {},
      async (tx) => {
        const repository = roleRepo(tx);
        return await repository.getPermissionsByUserId(
          user.user_id,
          user.tenant_id,
        );
      },
    );

    // 5. Autorización: Verificar si el usuario tiene TODOS los permisos requeridos
    // `every` comprueba si CADA permiso requerido existe en el conjunto de permisos del usuario.
    const isAuthorized = requiredPermissions.every((permission) =>
      uniqueUserPermissions.includes(permission),
    );

    if (!isAuthorized) {
      // En un entorno real, podrías loggear el intento fallido.
      throw new ForbiddenException(
        `Permisos insuficientes. Requiere: [${requiredPermissions.join(', ')}]`,
      );
    }

    return true; // Acceso concedido
  }
}
