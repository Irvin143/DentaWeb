import jwt from 'jsonwebtoken';

// Minúsculas, sin acentos y sin espacios sobrantes (igual que permisos.js).
const limpiar = (valor) =>
    String(valor?.nombre ?? valor ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

// Verifica el JWT y devuelve { usuario } o { error: { status, mensaje } }.
function leerToken(req) {
    const header = req.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
        return { error: { status: 401, mensaje: 'No autorizado' } };
    }

    let payload;
    try {
        payload = jwt.verify(header.slice('Bearer '.length), process.env.JWT_SECRET, {
            algorithms: ['HS256'],
        });
    } catch (err) {
        const mensaje = err?.name === 'TokenExpiredError' ? 'La sesión expiró' : 'No autorizado';
        return { error: { status: 401, mensaje } };
    }

    const id = Number(payload?.sub);
    if (!Number.isInteger(id) || id <= 0) {
        return { error: { status: 401, mensaje: 'No autorizado' } };
    }

    const roles = Array.isArray(payload.roles) ? payload.roles : [];

    return {
        usuario: {
            id,                          // payload.sub
            tipo: payload.tipo,
            paquete: payload.paquete,
            roles,
            idClinica: payload.idClinica ?? null, // solo si lo agregas al token en login()
        },
    };
}

export function exigirAcceso(permitidos = []) {
    const permitidosNorm = permitidos.map(limpiar);

    return function exigirAccesoMiddleware(req, res, next) {
        // El preflight de CORS no lleva token
        if (req.method === 'OPTIONS') return next();

        const { usuario, error } = leerToken(req);
        if (error) return res.status(error.status).json({ error: error.mensaje });

        if (permitidosNorm.length > 0) {
            const identidades = [usuario.paquete, ...usuario.roles].filter(Boolean).map(limpiar);
            const permitido = identidades.some((identidad) => permitidosNorm.includes(identidad));
            if (!permitido) {
                return res.status(403).json({ error: 'No tienes permiso para esta acción.' });
            }
        }

        req.usuario = usuario;
        return next();
    };
}

// Atajo: cualquier usuario con sesión válida
export const exigirSesion = exigirAcceso();