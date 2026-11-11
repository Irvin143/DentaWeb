![ClinicWare - Plataforma odontológica](.github/assets/readme_banner.jpeg)
---

Plataforma web para la gestión de clínicas odontológicas, pacientes, odontólogos, citas y catálogos administrativos.

Estado actual: **desarrollo funcional e integración**. El flujo principal de autenticación, permisos por rol, catálogos, agenda y citas ya está implementado; continúan el endurecimiento de seguridad, la cobertura de pruebas y el refinamiento de algunos módulos.

## Funcionalidades actuales

- Autenticación, registro y cambio de contraseña.
- Acceso protegido por paquete y rol: administrador, clínica, odontólogo y paciente.
- Catálogos de pacientes, odontólogos, clínicas, consultorios, servicios, especialidades y estudios.
- Catálogos administrativos de tipos de cita, paquetes, roles, tipos de usuario y usuarios.
- Agenda, disponibilidad, agendamiento, consulta de citas y atención de urgencias.
- Interfaz responsive con tema claro/oscuro y componentes reutilizables.

## Arquitectura

```text
DentaWeb/
	Frontend React + Vite + Tailwind CSS
	src/modules/       Funcionalidades por dominio
	src/components/    Componentes compartidos
	src/services/api.js Cliente HTTP centralizado

backend/
	API Node.js + Express
	src/routes/        Rutas HTTP
	src/controllers/   Validacion y control de flujo
	src/services/      Logica de datos y PostgreSQL
```

El frontend se publica como una SPA y el backend expone rutas bajo `/api`. La persistencia usa PostgreSQL; la autenticación usa JWT con `HS256` y las contraseñas se protegen con `bcrypt`.

## Requisitos

- Node.js 20 o superior.
- pnpm.
- PostgreSQL accesible mediante una cadena de conexión.

## Instalación y desarrollo

Instalar dependencias del frontend:

```bash
cd DentaWeb
pnpm install
pnpm dev
```

En otra terminal, instalar y ejecutar el backend:

```bash
cd backend
pnpm install
pnpm dev
```

El frontend se inicia normalmente en `http://localhost:5173` y el backend en `http://localhost:3001`.

## Variables de entorno

Crear `backend/.env` con:

```env
DATABASE_URL=postgresql://usuario:contrasena@host:5432/base_de_datos
JWT_SECRET=clave_secreta
```

Crear `DentaWeb/.env` con:

```env
VITE_API_URL=http://localhost:3001
```

Para el envío de correos pueden configurarse también `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` y `MAIL_DESTINO_PRUEBA`.

## Comandos principales

Desde `DentaWeb/`:

```bash
pnpm dev       # Desarrollo
pnpm lint      # ESLint
pnpm build     # Compilacion de produccion
pnpm preview   # Previsualizacion del build
```

Desde `backend/`:

```bash
pnpm dev       # Desarrollo con nodemon
```

## Siguiente etapa

- Incorporar pruebas automatizadas para autenticación, permisos, alcance de datos y contratos API.
- Completar la recuperación de contraseña.
- Reforzar el manejo de sesiones, límites de intentos y alcance de datos por clínica o paciente.
- Continuar el refinamiento visual y funcional de los módulos pendientes.

Proyecto académico desarrollado para Ingeniería Web y Proyecto Integrador, Instituto Tecnológico de Culiacán, agosto-diciembre de 2026.
