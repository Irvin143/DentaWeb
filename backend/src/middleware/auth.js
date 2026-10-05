import jwt from 'jsonwebtoken';

// Igual que permisos.js: minúsculas, sin acentos y sin espacios sobrantes.
const limpiar = (valor) =>
    String(valor?.nombre ?? valor ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

// Exige un JWT HS256. La identidad es el paquete más los roles del token.
export function exigirAcceso(permitidos) {
    const permitidosNorm = permitidos.map(limpiar);

    return function exigirAccesoMiddleware(req, res, next) {
        const header = req.headers.authorization;
        if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        let payload;
        try {
            payload = jwt.verify(header.slice('Bearer '.length), process.env.JWT_SECRET, {
                algorithms: ['HS256'],
            });
        } catch {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const idUsuario = Number(payload?.sub);
        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const roles = Array.isArray(payload.roles) ? payload.roles : [];
        const identidades = [payload.paquete, ...roles].filter(Boolean).map(limpiar);
        const permitido = identidades.some((identidad) => permitidosNorm.includes(identidad));
        if (!permitido) {
            return res.status(403).json({ error: 'No tienes permiso para esta acción.' });
        }

        return next();
    };
}
