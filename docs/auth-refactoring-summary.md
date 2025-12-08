# Refactorización del Sistema de Autenticación - Resumen

## Fecha: 7 de Diciembre, 2025

## Problemas Críticos Resueltos

### 1. ❌ **Problema: Scope de Cookies Sin Path Explícito**

**Causa:** Las cookies se establecían sin la propiedad `path: '/'`, por lo que el navegador solo las enviaba en la ruta específica donde fueron creadas (ej: `/auth/callback`).

**Solución Implementada:**

- ✅ Creación de métodos centralizados en `AuthService`:
  - `setAuthCookies(res, accessToken, refreshToken)` - Para cookies de la aplicación
  - `setGoogleTokenCookies(res, accessToken, refreshToken, idToken, expiresIn)` - Para cookies de Google
  - `clearAuthCookies(res)` - Para limpiar todas las cookies

- ✅ **CRÍTICO:** Todas las cookies ahora incluyen explícitamente `path: '/'` para que el navegador las envíe en todas las rutas de la aplicación.

### 2. ❌ **Problema: JwtGuard Intentaba Validar Múltiples Tipos de Tokens**

**Causa:** El guard intentaba validar tanto tokens de Google (`google_id_token`) como tokens de la aplicación (`access_token`), creando confusión y puntos de fallo.

**Solución Implementada:**

- ✅ **Simplificación total del JwtGuard:**
  - Ahora SOLO valida el `access_token` de la aplicación
  - Ya NO valida `google_id_token` como fallback
  - Lógica clara: Una vez que el usuario hace login (Google o local), el sistema emite sus propios JWT
  - Si el `access_token` falla o expira, lanza `401 Unauthorized` para que el frontend ejecute el refresh

### 3. ❌ **Problema: Lógica de Cookies Repetida en Múltiples Endpoints**

**Causa:** Código duplicado de `res.cookie()` en `handleAuthCallback`, `loginBusinessApp`, `refresh`, etc.

**Solución Implementada:**

- ✅ Eliminación de código duplicado en `AuthController`
- ✅ Uso consistente de los métodos centralizados del servicio
- ✅ En `logout`, uso de `clearAuthCookies()` con las mismas opciones de seguridad y `path: '/'` para garantizar que las cookies se borren correctamente

## Archivos Modificados

### 1. `src/modules/auth/services/auth.service.ts`

**Cambios:**

- Agregado import de `Response` de Express
- Agregados 3 métodos nuevos al final de la clase:
  ```typescript
  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void
  setGoogleTokenCookies(res: Response, accessToken: string, refreshToken: string | null, idToken: string, expiresIn: number): void
  clearAuthCookies(res: Response): void
  ```
- Cada método incluye documentación clara sobre la importancia de `path: '/'`

### 2. `src/guards/jwt.guard.ts`

**Cambios:**

- Eliminada la dependencia de `GoogleTokenService`
- Eliminada la lógica de validación de tokens de Google
- Simplificado a validar SOLO el `access_token` de las cookies
- Agregada documentación extensa explicando el flujo de validación
- Convertido a método síncrono (no necesita `async` ya que solo valida JWT)

### 3. `src/modules/auth/controllers/auth.controller.ts`

**Cambios en los endpoints:**

#### `POST /callback`

- Reemplazadas 5 llamadas a `res.cookie()` por 2 llamadas a métodos centralizados
- Usa `setGoogleTokenCookies()` para tokens de Google
- Usa `setAuthCookies()` para tokens de la app (si el login fue exitoso)

#### `POST /login-business/:tenantSlug`

- Reemplazadas 2 llamadas a `res.cookie()` por 1 llamada a `setAuthCookies()`

#### `POST /logout`

- Agregado parámetro `@Res({ passthrough: true }) res: Response`
- Agregada llamada a `clearAuthCookies()` para limpiar todas las cookies correctamente

#### `POST /refresh`

- Reemplazadas 4 llamadas a `res.cookie()` por 2 llamadas a métodos centralizados
- Usa `setAuthCookies()` para tokens renovados de la app
- Usa `setGoogleTokenCookies()` para tokens renovados de Google (si existen)
- Eliminados console.logs comentados

## Configuración de Cookies (Todas incluyen path: '/')

### Cookies de la Aplicación:

```typescript
{
  httpOnly: true,              // No accesible desde JavaScript
  secure: isProduction,        // Solo HTTPS en producción
  sameSite: 'lax',            // Protección CSRF
  path: '/',                  // ✅ CRÍTICO: Cookie disponible en todas las rutas
  maxAge: ...                 // Tiempo de expiración
}
```

**Cookies:**

- `access_token`: 1 hora
- `refresh_token`: 7 días

### Cookies de Google:

```typescript
{
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',                  // ✅ CRÍTICO: Cookie disponible en todas las rutas
  maxAge: ...
}
```

**Cookies:**

- `google_access_token`: Según `expires_in` de Google
- `google_refresh_token`: 30 días
- `google_id_token`: Según `expires_in` de Google

## Flujo de Autenticación Refactorizado

### Login con Google:

1. Usuario inicia OAuth → `POST /auth/callback`
2. Se obtienen tokens de Google
3. Se establecen cookies de Google con `setGoogleTokenCookies()`
4. Si el usuario existe, se hace login automático
5. Se generan tokens JWT de la app
6. Se establecen cookies de la app con `setAuthCookies()`
7. **Todas las cookies tienen `path: '/'`** ✅

### Login Business (Local):

1. Usuario envía credenciales → `POST /auth/login-business/:tenantSlug`
2. Se validan credenciales
3. Se generan tokens JWT de la app
4. Se establecen cookies con `setAuthCookies()`
5. **Todas las cookies tienen `path: '/'`** ✅

### Refresh de Sesión:

1. Frontend detecta que `access_token` expiró (recibe 401)
2. Envía `refresh_token` → `POST /auth/refresh`
3. Se valida `refresh_token`
4. Se generan nuevos tokens JWT
5. Si hay `google_refresh_token`, se renuevan tokens de Google
6. Se establecen nuevas cookies con métodos centralizados
7. **Todas las cookies tienen `path: '/'`** ✅

### Logout:

1. Usuario cierra sesión → `POST /auth/logout`
2. Se elimina la sesión de la DB
3. Se limpian todas las cookies con `clearAuthCookies()`
4. **Las cookies se borran correctamente porque `clearCookie()` usa el mismo `path: '/'`** ✅

### Validación de Rutas Protegidas:

1. Request llega a una ruta con `@UseGuards(JwtGuard)`
2. `JwtGuard` extrae `access_token` de las cookies
3. `JwtGuard` valida el JWT de la aplicación (NO valida Google tokens)
4. Si es válido, adjunta el usuario a `request.user`
5. Si es inválido o expiró, lanza `401 Unauthorized`
6. Frontend intercepta el 401 y ejecuta refresh automáticamente

## Beneficios de la Refactorización

### ✅ Persistencia de Cookies Garantizada

- Las cookies ahora se envían en **todas las rutas** de la aplicación
- No más errores de "cookie no encontrada" en rutas diferentes a `/auth`

### ✅ Código Más Limpio y Mantenible

- Lógica centralizada en el servicio
- No hay duplicación de código
- Fácil cambiar configuración de cookies (solo en 3 métodos)

### ✅ Guard Simplificado

- Responsabilidad única: validar JWT de la app
- No más confusión entre tokens de Google y de la app
- Lógica de refresh clara y predecible

### ✅ Logout Funcional

- Las cookies se borran correctamente porque `clearCookie()` usa las mismas opciones
- No quedan cookies "fantasma" en el navegador

### ✅ Seguridad Mejorada

- Configuración consistente de cookies en todos los endpoints
- Opciones de seguridad (`httpOnly`, `secure`, `sameSite`) aplicadas uniformemente

## Próximos Pasos Recomendados

### Backend:

- [ ] Agregar IP address y user agent reales en `sessionData` (actualmente strings vacíos)
- [ ] Considerar agregar tipos más estrictos para evitar warnings de `any`
- [ ] Implementar rotación de refresh tokens para mayor seguridad
- [ ] Agregar rate limiting en endpoints de autenticación

### Frontend:

- [ ] Implementar interceptor de Axios/Fetch para detectar 401 y ejecutar refresh automáticamente
- [ ] Manejar el flujo de refresh con retry de la petición original
- [ ] Agregar máximo de reintentos para evitar loops infinitos
- [ ] Implementar logout automático si el refresh también falla

### Testing:

- [ ] Crear tests unitarios para los nuevos métodos de cookies
- [ ] Crear tests E2E para el flujo completo de autenticación
- [ ] Verificar que las cookies se envíen correctamente en diferentes rutas

## Notas Importantes

⚠️ **CRÍTICO:** El problema principal era que las cookies no tenían `path: '/'`. Esto hacía que el navegador solo las enviara en la ruta exacta donde fueron creadas. Ahora todas las cookies incluyen `path: '/'` explícitamente.

⚠️ **IMPORTANTE:** El `JwtGuard` ahora SOLO valida el JWT de la aplicación. No intenta validar tokens de Google como fallback. El flujo es: Login → JWT de la app → Validación del JWT de la app → Si expira → 401 → Frontend hace refresh.

✅ **VENTAJA:** Con los métodos centralizados, si necesitas cambiar la configuración de cookies (ej: `maxAge`, `sameSite`), solo tienes que modificar 3 métodos en lugar de múltiples lugares en el controlador.

## Compatibilidad

- ✅ Compatible con autenticación Google OAuth
- ✅ Compatible con autenticación local (business users)
- ✅ Compatible con el flujo de refresh existente
- ✅ No requiere cambios en la base de datos
- ✅ No rompe endpoints existentes

---

**Refactorización completada exitosamente** ✅
