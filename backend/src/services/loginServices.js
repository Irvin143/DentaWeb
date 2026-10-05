import conexion from '../services/conexion.js';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync('dummy-password', SALT_ROUNDS);

export async function registrarPaciente({
    correo, contrasena, nombre, ape_pat, ape_mat, telefono, id_odontologo = null,
}) {
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
    const tel = telefono?.toString().trim() || null;

    try {
        const { rows } = await conexion.query(
            'SELECT * FROM fn_registrar_paciente($1, $2, $3, $4, $5, $6, $7)',
            [correo, hash, nombre, ape_pat, ape_mat, tel, id_odontologo]
        );
        return rows[0];
    } catch (err) {
        if (err.code === '23505') {
            const error = new Error(
                err.constraint === 'ux_pacientes_telefono'
                    ? 'Ya existe un paciente con ese teléfono'
                    : 'El correo ya está registrado'
            );
            error.status = 409;
            throw error;
        }
        if (err.code === '23503') { // el odontólogo no existe
            const error = new Error('El odontólogo indicado no existe');
            error.status = 400;
            throw error;
        }
        throw err;
    }
}
export async function login({ correo, contrasena }) {
    // 1. Buscar al usuario con su tipo, paquete y roles
    const { rows } = await conexion.query('SELECT * FROM fn_login_usuario($1)', [correo]);
    const user = rows[0];

    // 2. Siempre se ejecuta compare, exista o no el usuario
    const coincide = await bcrypt.compare(contrasena, user?.contrasena ?? DUMMY_HASH);

    // 3. Mismo error para correo inexistente, inactivo o contraseña incorrecta
    if (!user || !user.activo || !coincide) {
        const error = new Error('Credenciales inválidas');
        error.status = 401;
        throw error;
    }

    // 4. Generar el token
    const token = jwt.sign(
        {
            sub: user.id_usuario,
            tipo: user.tipo,
            paquete: user.nombre_paquete,
            roles: user.roles,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    const usuario = {
        id: user.id_usuario,
        correo: user.correo,
        tipo: user.tipo,
        paquete: user.nombre_paquete,
        roles: user.roles,
    };
    if (user.nombre) usuario.nombre = user.nombre;
    if (user.ape_pat) usuario.ape_pat = user.ape_pat;

    return { token, usuario };
}

// Cambia la contraseña del usuario del token. actual y nueva llegan sin trim.
export async function cambiarContrasenaPropia({ idUsuario, actual, nueva }) {
    const { rows } = await conexion.query(
        'SELECT contrasena FROM usuarios WHERE idUsuario = $1 AND activo',
        [idUsuario]
    );
    const hashGuardado = rows[0]?.contrasena;

    if (typeof hashGuardado !== 'string' || hashGuardado.length === 0) {
        await bcrypt.compare(actual, DUMMY_HASH);
        const error = new Error('Usuario no encontrado o desactivado');
        error.status = 404;
        throw error;
    }

    const coincide = await bcrypt.compare(actual, hashGuardado);
    if (!coincide) {
        const error = new Error('La contraseña actual no es correcta');
        error.status = 401;
        throw error;
    }

    const hash = await bcrypt.hash(nueva, SALT_ROUNDS);
    const { rowCount } = await conexion.query(
        'UPDATE usuarios SET contrasena = $2 WHERE idUsuario = $1 AND activo',
        [idUsuario, hash]
    );
    if (!rowCount) {
        const error = new Error('Usuario no encontrado o desactivado');
        error.status = 404;
        throw error;
    }
}