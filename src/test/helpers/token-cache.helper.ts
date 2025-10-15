import { Auth0Helper, Auth0LoginResponse } from './auth0.helper';

class TokenCache {
  private cache: Map<
    string,
    { tokens: Auth0LoginResponse; expiresAt: number }
  > = new Map();

  async getTokensForUser(email: string): Promise<Auth0LoginResponse> {
    const cached = this.cache.get(email);

    if (cached && Date.now() < cached.expiresAt - 5 * 60 * 1000) {
      return cached.tokens;
    }

    const tokens = await Auth0Helper.getTokensForTestUser(email);
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    this.cache.set(email, { tokens, expiresAt });

    return tokens;
  }

  async getIdTokenForUser(email: string): Promise<string> {
    const tokens = await this.getTokensForUser(email);
    return tokens.id_token;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const tokenCache = new TokenCache();
