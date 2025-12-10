import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

export class PhoneHelper {
  private static phoneUtil = PhoneNumberUtil.getInstance();

  /**
   * Recibe un número "sucio" (ej: 0353 15 4060236) y devuelve formato WhatsApp (5493534060236)
   */
  static normalizeWhatsApp(
    rawNumber: string,
    countryCode: string = 'AR',
  ): string {
    try {
      // 1. Parsear el número basado en el país (AR por defecto)
      const number = this.phoneUtil.parseAndKeepRawInput(
        rawNumber,
        countryCode,
      );

      // 2. Validar si es un número posible
      if (!this.phoneUtil.isValidNumber(number)) {
        throw new Error('Número de teléfono inválido');
      }

      // 3. Formatear a E.164 (Estándar internacional: +549353...)
      const e164 = this.phoneUtil.format(number, PhoneNumberFormat.E164);

      // 4. Quitar el símbolo "+" para la API de WhatsApp
      return e164.replace('+', '');
    } catch (error) {
      console.error(`Error normalizando teléfono ${rawNumber}:`, error.message);
      // Fallback: Si falla, devolvemos lo que entró limpio de caracteres no numéricos
      return rawNumber.replace(/\D/g, '');
    }
  }
}
