import { UserDecode } from './userDecode';

/* Tipos útiles */
export interface IdTokenPayload extends UserDecode {
  [key: string]: any;
}
