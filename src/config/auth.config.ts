interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  auth0: {
    domain: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    audience: string;
  };
}

export default (): AuthConfig => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return {
    jwt: {
      secret,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    auth0: {
      domain: process.env.AUTH0_DOMAIN || '',
      clientId: process.env.AUTH0_CLIENT_ID || '',
      clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
      redirectUri: process.env.AUTH0_REDIRECT_URI || '',
      audience: process.env.AUTH0_AUDIENCE || '',
    },
  };
};
