import conexion from '../services/conexion.js';
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync('dummy-password', SALT_ROUNDS);

export async function registrarPaciente({
    correo, contrasena, nombre, ape_pat, ape_mat, telefono, id_odontologo = null,
    }) {
    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    try {
        const { rows } = await conexion.query(
        'SELECT * FROM fn_registrar_paciente($1, $2, $3, $4, $5, $6, $7)',
        [correo, hash, nombre, ape_pat, ape_mat, telefono, id_odontologo]
        );
        return rows[0];
    } catch (err) {
        if (err.code === '23505') {
        const error = new Error('El correo ya está registrado');
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
    // 1. Buscar al usuario con sus roles
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
    console.log("JWT_SECRET definido:", !!process.env.JWT_SECRET);
    // 4. Generar el token
    const token = jwt.sign(
        { sub: user.id_usuario, paquete: user.nombre_paquete, roles: user.roles },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return {
        token,
        usuario: {
        id: user.id_usuario,
        correo: user.correo,
        paquete: user.nombre_paquete,
        roles: user.roles,
        },
    };
}