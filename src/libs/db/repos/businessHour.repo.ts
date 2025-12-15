import { Prisma } from '@prisma/client';
import { BusinessHourResponse } from '@src/types/business-hour';

/**
 * Helper para formatear Date (TIME) a string HH:mm
 */
function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5); // "HH:mm:ss" -> "HH:mm"
}

/**
 * Helper para convertir string HH:mm a Date (TIME compatible con PostgreSQL)
 * Sin conversión de zona horaria para que se guarde tal cual
 */
function parseTime(timeString: string): Date {
  // Asegurar formato HH:mm:ss
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  const seconds = parseInt(timeParts[2] || '0', 10);

  // Crear fecha en UTC sin aplicar zona horaria local
  const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));

  return date;
}

/**
 * Helper para transformar el resultado de la DB a BusinessHourResponse
 */
function toBusinessHourResponse(hour: {
  hour_id: string;
  day_of_week: number;
  open_time: Date;
  close_time: Date;
}): BusinessHourResponse {
  return {
    hour_id: hour.hour_id,
    day_of_week: hour.day_of_week,
    open_time: formatTime(hour.open_time),
    close_time: formatTime(hour.close_time),
  };
}

export function BusinessHourRepo(tx: Prisma.TransactionClient) {
  return {
    async getBusinessHoursByTenantId(
      tenant_id: string,
    ): Promise<BusinessHourResponse[]> {
      const hours = await (tx as any).business_hours.findMany({
        where: { tenant_id },
        orderBy: { day_of_week: 'asc' },
        select: {
          hour_id: true,
          day_of_week: true,
          open_time: true,
          close_time: true,
        },
      });

      return hours.map(toBusinessHourResponse);
    },

    async getBusinessIsOpen(
      tenant_id: string,
      day_of_week: number,
      time: string,
    ): Promise<boolean> {
      const timeDate = new Date(`1970-01-01T${time}:00`);
      const hour = await (tx as any).business_hours.findFirst({
        where: {
          tenant_id,
          day_of_week,
          open_time: { lte: timeDate },
          close_time: { gte: timeDate },
        },
        select: {
          hour_id: true,
        },
      });

      return hour !== null;
    },

    async createBusinessHour(data: {
      tenant_id: string;
      day_of_week: number;
      open_time: string;
      close_time: string;
    }): Promise<BusinessHourResponse> {
      const hour = await tx.business_hours.create({
        data: {
          tenant_id: data.tenant_id,
          day_of_week: data.day_of_week,
          open_time: parseTime(data.open_time),
          close_time: parseTime(data.close_time),
        },
        select: {
          hour_id: true,
          day_of_week: true,
          open_time: true,
          close_time: true,
        },
      });

      return toBusinessHourResponse(hour);
    },

    async updateBusinessHour(
      hour_id: string,
      tenant_id: string,
      data: {
        day_of_week?: number;
        open_time?: string;
        close_time?: string;
      },
    ): Promise<BusinessHourResponse> {
      const hour = await tx.business_hours.update({
        where: { hour_id, tenant_id },
        data: {
          ...(data.day_of_week !== undefined && {
            day_of_week: data.day_of_week,
          }),
          ...(data.open_time && {
            open_time: parseTime(data.open_time),
          }),
          ...(data.close_time && {
            close_time: parseTime(data.close_time),
          }),
        },
        select: {
          hour_id: true,
          day_of_week: true,
          open_time: true,
          close_time: true,
        },
      });

      return toBusinessHourResponse(hour);
    },

    async deleteBusinessHour(
      hour_id: string,
      tenant_id: string,
    ): Promise<{ message: string }> {
      await tx.business_hours.delete({
        where: { hour_id, tenant_id },
      });

      return { message: 'Horario eliminado correctamente' };
    },
  };
}
