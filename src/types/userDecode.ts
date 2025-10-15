// Interfaces de tipos de datos devueltos por Auth0
export interface UserDecode {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  iss: string;
  aud: string;
  sub: string;
  ext: number;
}
