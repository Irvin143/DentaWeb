## Endpoints de pacientes

Prefijo base: `/api/pacientes`. Los datos son personales: cuando tengas el middleware, todos requerirán token (`Authorization: Bearer <token>`) y el rol correspondiente.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/pacientes` | Protegido | Lista pacientes con paginación |
| POST | `/api/pacientes` | Protegido | Crea usuario, paciente y expediente, con odontólogo opcional |
| PUT | `/api/pacientes/:id` | Protegido | Actualiza datos del paciente y su odontólogo |
| DELETE | `/api/pacientes/:id` | Protegido | Desactiva la cuenta (borrado lógico) |

---

### GET `/api/pacientes`

Lista los pacientes con paginación por offset.

**Query params:**

| Parámetro | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `pagina` | number | No | Mínimo 1. Por defecto 1 |
| `limite` | number | No | Entre 1 y 100. Por defecto 20 |

**Ejemplo de petición:** `GET /api/pacientes?pagina=1&limite=10`

**Ejemplo de respuesta `200`:**
```json
{
  "pagina": 1,
  "limite": 10,
  "total": 34,
  "total_paginas": 4,
  "pacientes": [
    {
      "id_paciente": 1,
      "id_usuario": 1,
      "nombre": "Ana",
      "ape_pat": "Pérez",
      "ape_mat": null,
      "telefono": "6671234567",
      "activo": true,
      "correo": "ana@mail.com",
      "id_odontologo": 3,
      "nombre_odontologo": "Carlos Ramírez Soto"
    }
  ]
}
```

Si el paciente no tiene odontólogo, `id_odontologo` y `nombre_odontologo` llegan `null`.

---

### POST `/api/pacientes`

Crea una cuenta de paciente en una sola transacción: usuario, paciente y expediente vacío. Si algo falla, no se crea nada.

**Body (JSON):**

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `correo` | string | Sí | Formato válido, máx. 150 caracteres |
| `contrasena` | string | Sí | Entre 8 y 72 caracteres |
| `nombre` | string | Sí | Máx. 100 caracteres |
| `ape_pat` | string | Sí | Máx. 100 caracteres |
| `ape_mat` | string | No | Máx. 100 caracteres |
| `telefono` | string | No | Máx. 20 caracteres |
| `id_odontologo` | number \| null | No | Entero positivo de un odontólogo existente |

**Ejemplo de petición:**
```json
{
  "correo": "luis@mail.com",
  "contrasena": "Temporal123",
  "nombre": "Luis",
  "ape_pat": "López",
  "id_odontologo": 1
}
```

**Ejemplo de respuesta `201`:**
```json
{
  "id_usuario": 10,
  "id_paciente": 8,
  "id_expediente": 8,
  "correo": "luis@mail.com",
  "id_odontologo": 1
}
```

**Errores:**

| Código | Causa |
|---|---|
| `400` | Datos inválidos o `id_odontologo` inexistente |
| `409` | El correo ya está registrado |

---

### PUT `/api/pacientes/:id`

Actualiza los datos del paciente. Solo se modifican los campos enviados. Para el odontólogo, `null` lo deja sin asignar y omitir el campo lo deja como estaba.

**Params:** `id` (number): `id_paciente`.

**Body (JSON):** al menos un campo.

| Campo | Tipo | Regla |
|---|---|---|
| `nombre` | string | Máx. 100 caracteres |
| `ape_pat` | string | Máx. 100 caracteres |
| `ape_mat` | string | Máx. 100 caracteres |
| `telefono` | string | Máx. 20 caracteres |
| `id_odontologo` | number \| null | Odontólogo existente, o `null` para quitarlo |

**Ejemplo de petición:**
```json
{
  "telefono": "6671234567",
  "id_odontologo": null
}
```

**Ejemplo de respuesta `200`:**
```json
{
  "id_paciente": 1,
  "nombre": "Ana",
  "ape_pat": "Pérez",
  "ape_mat": null,
  "telefono": "6671234567",
  "id_odontologo": null
}
```

**Errores:**

| Código | Causa |
|---|---|
| `400` | ID inválido, datos inválidos, body sin campos o odontólogo inexistente |
| `404` | Paciente no encontrado |

---

### DELETE `/api/pacientes/:id`

Borrado lógico: desactiva la cuenta del paciente (`Usuarios.activo = false`). Conserva su expediente y citas, y el login deja de funcionar para esa cuenta.

**Params:** `id` (number): `id_paciente`.

**Ejemplo de respuesta `200`:**
```json
{ "mensaje": "Paciente desactivado correctamente" }
```

**Errores:** `400` ID inválido, `404` paciente no encontrado.

---

## Endpoints de estudios

Prefijo base: `/api/estudios`. Catálogo con borrado lógico. El `GET` puede quedar más abierto (lo usan los selects); `POST`, `PUT` y `DELETE` deben requerir token y rol de administración.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/estudios` | Protegido | Lista estudios con paginación y filtro por estado |
| POST | `/api/estudios` | Protegido | Crea un estudio |
| PUT | `/api/estudios/:id` | Protegido | Actualiza nombre y descripción |
| DELETE | `/api/estudios/:id` | Protegido | Desactiva el estudio (borrado lógico) |
| PUT | `/api/estudios/:id/reactivar` | Protegido | Reactiva un estudio desactivado |

---

### GET `/api/estudios`

Lista los estudios, activos primero. Sin filtro devuelve activos e inactivos.

**Query params:**

| Parámetro | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `pagina` | number | No | Mínimo 1. Por defecto 1 |
| `limite` | number | No | Entre 1 y 100. Por defecto 20 |
| `activo` | string | No | `true`, `false` o sin valor (todos) |

**Ejemplo de petición:** `GET /api/estudios?pagina=1&limite=10&activo=true`

**Ejemplo de respuesta `200`:**
```json
{
  "pagina": 1,
  "limite": 10,
  "total": 3,
  "total_paginas": 1,
  "estudios": [
    {
      "id_estudio": 1,
      "nombre": "Radiografía panorámica",
      "descripcion": "Vista general de ambas arcadas",
      "activo": true
    }
  ]
}
```

---

### POST `/api/estudios`

Crea un estudio.

**Body (JSON):**

| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `nombre` | string | Sí | Máx. 100 caracteres. Único entre estudios activos (sin distinguir mayúsculas) |
| `descripcion` | string | No | Máx. 1000 caracteres |

**Ejemplo de petición:**
```json
{
  "nombre": "Radiografía panorámica",
  "descripcion": "Vista general de ambas arcadas"
}
```

**Ejemplo de respuesta `201`:**
```json
{
  "id_estudio": 1,
  "nombre": "Radiografía panorámica",
  "descripcion": "Vista general de ambas arcadas",
  "activo": true
}
```

**Errores:** `400` datos inválidos, `409` ya existe un estudio activo con ese nombre.

---

### PUT `/api/estudios/:id`

Reemplaza nombre y descripción de un estudio **activo**. Si no se envía `descripcion`, queda en `null`.

**Params:** `id` (number): `id_estudio`.

**Body (JSON):** mismos campos y reglas que `POST`.

**Ejemplo de petición:**
```json
{
  "nombre": "Radiografía panorámica digital",
  "descripcion": null
}
```

**Ejemplo de respuesta `200`:**
```json
{
  "id_estudio": 1,
  "nombre": "Radiografía panorámica digital",
  "descripcion": null,
  "activo": true
}
```

**Errores:** `400` ID o datos inválidos, `404` no existe o está desactivado, `409` nombre repetido.

---

### DELETE `/api/estudios/:id`

Borrado lógico: marca el estudio como inactivo. Las asignaciones existentes en expedientes se conservan.

**Ejemplo de respuesta `200`:**
```json
{ "mensaje": "Estudio desactivado correctamente" }
```

**Errores:** `400` ID inválido, `404` no existe o ya estaba desactivado.

---

### PUT `/api/estudios/:id/reactivar`

Vuelve a activar un estudio desactivado. No requiere body.

**Ejemplo de respuesta `200`:**
```json
{
  "id_estudio": 1,
  "nombre": "Radiografía panorámica",
  "descripcion": "Vista general de ambas arcadas",
  "activo": true
}
```

**Errores:** `400` ID inválido, `404` no existe o ya está activo, `409` otro estudio activo ya usa ese nombre.