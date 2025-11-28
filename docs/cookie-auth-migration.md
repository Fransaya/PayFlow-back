# Guía de Migración a Autenticación por Cookies

Esta guía detalla los cambios realizados en el backend para manejar la autenticación mediante cookies `HttpOnly` y cómo adaptar el frontend para soportar este flujo.

## Cambios en el Backend

El endpoint `POST /auth/callback` ha sido modificado para establecer los siguientes tokens como cookies `HttpOnly` en la respuesta, en lugar de (o además de) devolverlos en el cuerpo de la respuesta:

### Cookies Establecidas

| Nombre Cookie          | Descripción                                                 | Duración               |
| ---------------------- | ----------------------------------------------------------- | ---------------------- |
| `google_access_token`  | Token de acceso de Google                                   | `expires_in` de Google |
| `google_refresh_token` | Token de refresco de Google (si existe)                     | 30 días                |
| `google_id_token`      | ID Token de Google                                          | `expires_in` de Google |
| `access_token`         | Token de acceso de la Aplicación (si el login es exitoso)   | 1 hora                 |
| `refresh_token`        | Token de refresco de la Aplicación (si el login es exitoso) | 7 días                 |

**Nota:** Todas las cookies están configuradas como `HttpOnly`, lo que significa que no pueden ser accedidas mediante JavaScript en el navegador, aumentando la seguridad contra ataques XSS.

## Adaptación del Frontend

Para que el frontend funcione correctamente con este nuevo sistema, debes realizar los siguientes ajustes:

### 1. Configuración de Peticiones (Axios / Fetch)

Debes asegurarte de que todas las peticiones al backend incluyan las credenciales (cookies).

**Si usas Axios:**
Configura `withCredentials: true` en tu instancia de axios o en cada petición.

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Tu URL del backend
  withCredentials: true, // <--- IMPORTANTE
});
```

**Si usas Fetch:**
Añade `credentials: 'include'` a tus opciones.

```javascript
fetch('http://localhost:3000/auth/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: '...' }),
  credentials: 'include', // <--- IMPORTANTE
});
```

### 2. Manejo de la Respuesta de Login

Ya no necesitas guardar manualmente los tokens en `localStorage` o `Cookies` desde el código del cliente. El navegador guardará automáticamente las cookies `HttpOnly` recibidas.

**Antes:**

```javascript
const response = await api.post('/auth/callback', { code });
localStorage.setItem('access_token', response.data.access_token);
```

**Ahora:**

```javascript
await api.post('/auth/callback', { code });
// El navegador ya tiene las cookies. Puedes redirigir al usuario.
window.location.href = '/dashboard';
```

### 3. Consideraciones Adicionales

- **Logout:** El endpoint de logout debería encargarse de limpiar estas cookies. Asegúrate de llamar al endpoint de logout del backend al cerrar sesión.
- **Lectura de Datos del Usuario:** Como no puedes leer el `access_token` para decodificarlo en el frontend, deberías confiar en la información de usuario que devuelve el endpoint de login en su cuerpo (JSON), o consultar un endpoint tipo `/auth/me` o `/users/profile` para obtener los datos del usuario actual.
- **Entorno de Desarrollo vs Producción:** Las cookies están configuradas con `SameSite: 'Lax'`. Asegúrate de que tu frontend y backend estén configurados correctamente para compartir cookies si están en dominios diferentes (CORS y `SameSite: None; Secure` podrían ser necesarios en producción si son dominios cruzados).
