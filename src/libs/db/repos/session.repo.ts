// src/libs/db/repos/session.repo.ts
import { Prisma } from '@prisma/client';
import {
  UpdateSessionAppDto,
  SessionAppInternalDto,
} from '@src/modules/auth/dto/session.dto';

export function sessionRepo(tx: Prisma.TransactionClient) {
  return {
    async getSession(
      session_id: string,
    ): Promise<SessionAppInternalDto | null> {
      return tx.session_app.findUnique({
        where: { session_id },
        select: {
          session_id: true,
          user_owner_id: true,
          user_id: true,
          tenant_id: true,
          provider: true,
          refresh_token_enc: true,
          refresh_expires_at: true,
          created_at: true,
          last_used_at: true,
          ip_address: true,
          user_agent: true,
        },
      });
    },

    async validateExistSession(session_id: string): Promise<boolean> {
      const session = await tx.session_app.findUnique({
        where: { session_id },
        select: { session_id: true },
      });
      return Boolean(session);
    },

    async updateSession(
      session_data: UpdateSessionAppDto,
      session_id: string,
    ): Promise<SessionAppInternalDto> {
      return tx.session_app.update({
        where: { session_id },
        data: session_data,
      });
    },

    async deleteSession(session_id: string): Promise<boolean> {
      const session = await tx.session_app.delete({
        where: { session_id },
      });
      return Boolean(session);
    },

    async deleteSessionForUser(user_id: string): Promise<boolean> {
      if (!user_id?.trim()) throw new Error('User ID is required');
      console.log('Deleting sessions for user_id:', user_id);

      const session = await tx.session_app.deleteMany({
        where: {
          OR: [
            user_id?.trim() ? { user_id: user_id.trim() } : {},
            user_id?.trim() ? { user_owner_id: user_id.trim() } : {},
          ],
        },
      });

      console.log('Deleted sessions count:', session.count);
      return Boolean(session);
    },

    // Método para crear sesión de app
    async createAppSession(sessionData: {
      user_owner_id?: string;
      user_id?: string;
      tenant_id: string;
      provider?: string;
      refresh_token_enc: string;
      refresh_expires_at: Date;
      ip_address?: string;
      user_agent?: string;
    }) {
      return await tx.session_app.create({
        data: {
          ...(sessionData.user_owner_id && {
            user_owner_id: sessionData.user_owner_id,
          }),
          ...(sessionData.user_id && { user_id: sessionData.user_id }),
          tenant_id: sessionData.tenant_id,
          ...(sessionData.provider && { provider: sessionData.provider }),
          refresh_token_enc: sessionData.refresh_token_enc,
          refresh_expires_at: sessionData.refresh_expires_at,
          ...(sessionData.ip_address && { ip_address: sessionData.ip_address }),
          ...(sessionData.user_agent && { user_agent: sessionData.user_agent }),
          last_used_at: new Date(),
        },
      });
    },

    // Método para actualizar última vez usada en sesión
    async updateSessionLastUsed(sessionId: string, ip_address?: string) {
      if (!sessionId?.trim()) throw new Error('Session ID is required');

      return await tx.session_app.update({
        where: { session_id: sessionId.trim() },
        data: {
          last_used_at: new Date(),
          ip_address: ip_address || null,
        },
      });
    },

    // Método para eliminar sesiones expiradas
    async cleanExpiredSessions() {
      return await tx.session_app.deleteMany({
        where: {
          refresh_expires_at: {
            lt: new Date(),
          },
        },
      });
    },

    // Método para obtener sesión por refresh token
    async getSessionByRefreshToken(refresh_token_enc: string) {
      if (!refresh_token_enc?.trim())
        throw new Error('Refresh token is required');

      return await tx.session_app.findFirst({
        where: {
          refresh_token_enc: refresh_token_enc.trim(),
          refresh_expires_at: {
            gt: new Date(),
          },
        },
        include: {
          user_owner: {
            select: {
              user_owner_id: true,
              name: true,
              email: true,
              active: true,
            },
          },
          user_business: {
            select: {
              user_id: true,
              name: true,
              email: true,
              status: true,
            },
          },
          tenant: {
            select: {
              tenant_id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    },

    // Método para upsert de sesión (crear o actualizar)
    async upsertSession(sessionData: {
      user_owner_id?: string;
      user_id?: string;
      tenant_id: string;
      provider?: string;
      refresh_token_enc: string;
      refresh_expires_at: Date;
      ip_address?: string;
      user_agent?: string;
    }) {
      if (!sessionData.tenant_id?.trim()) {
        throw new Error('Tenant ID is required');
      }

      // Determinar qué tipo de usuario es
      const isOwner = Boolean(sessionData.user_owner_id);
      const isBusiness = Boolean(sessionData.user_id);

      if (!isOwner && !isBusiness) {
        throw new Error('Either user_owner_id or user_id must be provided');
      }

      // Buscar sesión existente activa para el usuario y tenant
      const whereCondition = isOwner
        ? {
            user_owner_id: sessionData.user_owner_id,
            tenant_id: sessionData.tenant_id,
            refresh_expires_at: {
              gt: new Date(),
            },
          }
        : {
            user_id: sessionData.user_id,
            tenant_id: sessionData.tenant_id,
            refresh_expires_at: {
              gt: new Date(),
            },
          };

      const existingSession = await tx.session_app.findFirst({
        where: whereCondition,
        orderBy: {
          created_at: 'desc',
        },
      });

      // Si existe una sesión activa, actualizarla
      if (existingSession) {
        return await tx.session_app.update({
          where: { session_id: existingSession.session_id },
          data: {
            refresh_token_enc: sessionData.refresh_token_enc,
            refresh_expires_at: sessionData.refresh_expires_at,
            provider: sessionData.provider || null,
            ip_address: sessionData.ip_address || null,
            user_agent: sessionData.user_agent || null,
            last_used_at: new Date(),
          },
        });
      }

      // Si no existe, crear una nueva sesión
      return await tx.session_app.create({
        data: {
          ...(sessionData.user_owner_id && {
            user_owner_id: sessionData.user_owner_id,
          }),
          ...(sessionData.user_id && { user_id: sessionData.user_id }),
          tenant_id: sessionData.tenant_id,
          ...(sessionData.provider && { provider: sessionData.provider }),
          refresh_token_enc: sessionData.refresh_token_enc,
          refresh_expires_at: sessionData.refresh_expires_at,
          ...(sessionData.ip_address && { ip_address: sessionData.ip_address }),
          ...(sessionData.user_agent && { user_agent: sessionData.user_agent }),
          last_used_at: new Date(),
        },
      });
    },
  };
}
