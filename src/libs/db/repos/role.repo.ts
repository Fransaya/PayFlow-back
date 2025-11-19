import { Prisma } from '@prisma/client';

export function roleRepo(tx: Prisma.TransactionClient) {
  return {
    async getRolesByUserId(user_id: string) {
      return tx.role.findMany({
        where: {
          user_role: {
            some: {
              user_id,
            },
          },
        },
      });
    },

    /**
     * Obtiene los roles de un usuario con filtro de seguridad por tenant
     * Solo retorna roles activos que pertenecen al tenant del usuario
     */
    async getRolesByUserIdWithTenant(user_id: string, tenant_id: string) {
      return tx.user_role.findMany({
        where: {
          user_id,
          // 🔒 Filtro de Seguridad CRÍTICO: Aseguramos que los roles
          // solo son válidos si pertenecen al tenant del usuario.
          role: {
            tenant_id,
            active: true, // Solo roles activos
          },
        },
        select: {
          role: {
            select: {
              role_id: true,
              name: true,
              permissions: true, // Array de permisos
              description: true,
            },
          },
        },
      });
    },

    /**
     * Obtiene solo los permisos de un usuario (sin metadata adicional)
     */
    async getPermissionsByUserId(
      user_id: string,
      tenant_id: string,
    ): Promise<string[]> {
      const userRoles = await tx.user_role.findMany({
        where: {
          user_id,
          role: {
            tenant_id,
            active: true,
          },
        },
        select: {
          role: {
            select: {
              permissions: true,
            },
          },
        },
      });

      // Aplanar y deduplicar permisos de todos los roles
      const allPermissions = userRoles.flatMap(
        (ur) => ur.role.permissions || [],
      );
      return [...new Set(allPermissions)]; // Eliminar duplicados
    },

    // METODOS ASOCIADOS A EL CRUD DE ROLES
    async getAllRolesByTenant(tenant_id: string) {
      return tx.role.findMany({
        where: {
          tenant_id,
        },
      });
    },

    async getRoleByIdAndTenant(role_id: string, tenant_id: string) {
      return tx.role.findFirst({
        where: {
          role_id,
          tenant_id,
        },
      });
    },

    async createRole(data: {
      name: string;
      description?: string | null;
      permissions: string[];
      tenant_id: string;
    }) {
      return tx.role.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          permissions: data.permissions,
          tenant_id: data.tenant_id.trim(),
          active: true,
        },
      });
    },

    async updateRole(
      role_id: string,
      data: {
        name?: string;
        description?: string | null;
        permissions?: string[];
        active?: boolean;
      },
    ) {
      const updateData: {
        name?: string;
        description?: string | null;
        permissions?: string[];
        active?: boolean;
      } = {};

      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined)
        updateData.description = data.description?.trim() || null;
      if (data.permissions !== undefined)
        updateData.permissions = data.permissions;
      if (data.active !== undefined) updateData.active = data.active;

      return tx.role.update({
        where: { role_id },
        data: updateData,
      });
    },

    async deleteRole(role_id: string) {
      return tx.role.delete({
        where: { role_id },
      });
    },
  };
}
