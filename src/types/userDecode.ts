// Interfaces de tipos de datos devueltos por Auth0
export interface UserDecode {
  id: string;
  email: string;
  picture: string;
  verified_email: boolean;
  name: string;
  given_name: string;
}
