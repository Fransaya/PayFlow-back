import { Injectable } from '@nestjs/common';

import { DbService, roleRepo } from '@src/libs/db';

// import { PERMISSIONS_KEY } from './permissions.decorator';
// import { AppPermission } from '@src/enum/permission.enum';

@Injectable()
export class RoleService {
  constructor(private dbService: DbService) {}

  /**
   * Obtiene los permisos asociados a un rol específico dentro de un tenant
   * @param tenantId ID del tenant
   * @param roleId ID del rol
   * @returns Array de permisos asociados al rol
   */
  async getPermissionsForRole(tenantId: string, roleId: string): Promise<any> {
    const role = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        const repo = roleRepo(tx);
        return repo.getRolesByUserIdWithTenant(roleId, tenantId);
      },
    );

    if (!role) {
      throw new Error('Role not found for the specified tenant');
    }

    return role;
  }

  async getAllRolesForTenant(tenantId: string): Promise<any> {
    const roles = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        const repo = roleRepo(tx);
        return repo.getAllRolesByTenant(tenantId);
      },
    );

    return roles;
  }

  async getRoleByIdAndTenant(roleId: string, tenantId: string) {
    const role = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        const repo = roleRepo(tx);
        return repo.getRoleByIdAndTenant(roleId, tenantId);
      },
    );

    if (!role) {
      throw new Error('Role not found for the specified tenant');
    }

    return role;
  }

  async createRoleForTenant(tenantId: string, roleData: any): Promise<any> {
    const newRole = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        const repo = roleRepo(tx);
        return repo.createRole({ tenant_id: tenantId, ...roleData });
      },
    );

    return newRole;
  }

  async updateRoleForTenant(
    tenantId: string,
    roleId: string,
    roleData: any,
  ): Promise<any> {
    const updatedRole = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        const repo = roleRepo(tx);
        return repo.updateRole(roleId, { ...roleData });
      },
    );

    return updatedRole;
  }

  async deleteRoleForTenant(tenantId: string, roleId: string): Promise<any> {
    const deletedRole = await this.dbService.runInTransaction(
      { tenantId },
      async (tx) => {
        const repo = roleRepo(tx);
        return repo.deleteRole(roleId);
      },
    );

    return deletedRole;
  }
}
