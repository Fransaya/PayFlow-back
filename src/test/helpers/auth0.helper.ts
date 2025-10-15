import axios from 'axios';

export interface Auth0LoginResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

export interface TestUser {
  email: string;
  password: string;
  role?: string;
}

export const testUsers: TestUser[] = [
  { email: 'test@example.com', password: '12345678.Test', role: 'owner' },
  { email: 'test1@gmail.com', password: '12345678.Test', role: 'business' },
  { email: 'test2@gmail.com', password: '12345678.Test', role: 'business' },
  { email: 'test3@gmail.com', password: '12345678.Test', role: 'business' },
];

export class Auth0Helper {
  private static readonly AUTH0_TOKEN_URL = `https://${process.env.AUTH0_DOMAIN}/oauth/token`;

  static async loginUser(
    email: string,
    password: string,
  ): Promise<Auth0LoginResponse> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', email);
      params.append('password', password);
      params.append('scope', 'openid profile email');
      params.append('client_id', process.env.AUTH0_CLIENT_ID!);
      params.append('client_secret', process.env.AUTH0_CLIENT_SECRET!);
      params.append(
        'realm',
        process.env.AUTH0_REALM || 'Username-Password-Authentication',
      );

      const response = await axios.post(this.AUTH0_TOKEN_URL, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        'Auth0 Login Error:',
        error.response?.data || error.message,
      );
      throw new Error(
        `Failed to login with Auth0: ${error.response?.data?.error_description || error.message}`,
      );
    }
  }

  static async getTokensForTestUser(
    userEmail: string,
  ): Promise<Auth0LoginResponse> {
    const testUser = testUsers.find((user) => user.email === userEmail);
    if (!testUser) {
      throw new Error(`Test user with email ${userEmail} not found`);
    }

    return this.loginUser(testUser.email, testUser.password);
  }

  static async getIdTokenForUser(userEmail: string): Promise<string> {
    const tokens = await this.getTokensForTestUser(userEmail);
    return tokens.id_token;
  }
}
