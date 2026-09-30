## Endpoints de autenticación

Prefijo base: `/api/login`. Ambos endpoints son **públicos** (no requieren token).

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/login/registrar` | Público | Crea usuario, paciente y expediente |
| POST | `/api/login/login` | Público | Valida credenciales y devuelve un token JWT (1 h) |

---

### POST `/api/login/registrar`

Crea una cuenta de paciente. En una sola operación crea el usuario, el paciente y su expediente vacío.

**Body (JSON):**

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `correo` | string | Sí | Formato válido, máx. 150 caracteres |
| `contrasena` | string | Sí | Entre 8 y 72 caracteres |
| `nombre` | string | Sí | Máx. 100 caracteres |
| `ape_pat` | string | Sí | Máx. 100 caracteres |
| `ape_mat` | string | No | |
| `telefono` | string | No | Máx. 20 caracteres |

**Ejemplo de petición:**
```json
{
  "correo": "ana@mail.com",
  "contrasena": "MiClave123",
  "nombre": "Ana",
  "ape_pat": "Pérez"
}
```

**Ejemplo de respuesta `201`:**
```json
{
  "id_usuario": 1,
  "id_paciente": 1,
  "id_expediente": 1,
  "correo": "ana@mail.com"
}
```

---

### POST `/api/login/login`

Valida las credenciales y entrega un token JWT con vigencia de 1 hora.

**Body (JSON):**

| Campo | Tipo | Obligatorio |
|---|---|---|
| `correo` | string | Sí |
| `contrasena` | string | Sí |

**Ejemplo de petición:**
```json
{
  "correo": "ana@mail.com",
  "contrasena": "MiClave123"
}
```

**Ejemplo de respuesta `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "correo": "ana@mail.com",
    "paquete": "Paciente",
    "roles": []
  }
}
```