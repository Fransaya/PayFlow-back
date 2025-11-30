export function extractBearerToken(bearerToken: string) {
  const token = bearerToken.split(' ')[1];

  return token;
}
