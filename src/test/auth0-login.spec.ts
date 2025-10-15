import { Auth0Helper, testUsers } from './helpers/auth0.helper';

describe('Auth0 Login Integration', () => {
  it('should login successfully with test users', async () => {
    // Solo probar con un usuario para no saturar Auth0
    const testUser = testUsers[0];

    console.log(`Testing login for: ${testUser.email}`);

    const tokens = await Auth0Helper.loginUser(
      testUser.email,
      testUser.password,
    );

    expect(tokens.access_token).toBeDefined();
    expect(tokens.id_token).toBeDefined();
    expect(tokens.token_type).toBe('Bearer');
    expect(tokens.expires_in).toBeGreaterThan(0);

    console.log(`✅ Login successful for ${testUser.email}`);
  }, 30000);

  it('should fail with invalid credentials', async () => {
    await expect(
      Auth0Helper.loginUser('invalid@email.com', 'wrong_password'),
    ).rejects.toThrow();
  });
});
