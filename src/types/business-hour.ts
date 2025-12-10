/**
 * Interfaz para los horarios de negocio
 */
export interface BusinessHour {
  hour_id: string;
  tenant_id: string;
  day_of_week: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  open_time: string; // Formato: "HH:mm"
  close_time: string; // Formato: "HH:mm"
  created_at?: Date;
  updated_at?: Date;
}

/**
 * DTO para crear un horario de negocio
 */
export interface CreateBusinessHourDto {
  day_of_week: number;
  open_time: string;
  close_time: string;
}

/**
 * DTO para actualizar un horario de negocio
 */
export interface UpdateBusinessHourDto {
  day_of_week?: number;
  open_time?: string;
  close_time?: string;
}

/**
 * Respuesta de la API para un horario de negocio
 */
export interface BusinessHourResponse {
  hour_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

/**
 * Respuesta de la API para lista de horarios
 */
export interface BusinessHoursListResponse {
  hours: BusinessHourResponse[];
  total: number;
}
