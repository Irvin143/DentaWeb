import express from 'express';
import cors from 'cors';

const app = express();

const origenesPermitidos = [
    'https://clinicware.tech',
    'https://www.clinicware.tech',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://denta-web-three.vercel.app',
    'https://denta-web-inky.vercel.app',
];

app.use(express.json()); // comentario
app.use(cors({
    origin(origin, callback) {
        if (!origin || origenesPermitidos.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

import loginRutas from './routes/loginRutas.js';
app.use("/api/login", loginRutas);

import pacienteRutas from './routes/pacienteRutas.js';
app.use("/api/pacientes", pacienteRutas);

import especialidadesRoutes from './routes/especialidadesRutas.js';
app.use('/api/especialidades', especialidadesRoutes);

import estudiosRoutes from './routes/estudiosRutas.js';
app.use('/api/estudios', estudiosRoutes);

import clinicasRoutes from './routes/clinicasRutas.js';
app.use('/api/clinicas', clinicasRoutes);

import serviciosRoutes from './routes/serviciosRutas.js';
app.use('/api/servicios', serviciosRoutes);

import consultorioRoutes from './routes/consultorioRutas.js';
app.use('/api/consultorios', consultorioRoutes);

import rolRoutes from './routes/rolRutas.js';
app.use('/api/roles', rolRoutes);

import paqueteRolRoutes from './routes/paqueteRolRutas.js';
app.use('/api/paquetes-roles', paqueteRolRoutes);

import odontologoRoutes from './routes/odontologosRutas.js';
app.use('/api/odontologos', odontologoRoutes);

import tipoCitaRoutes from './routes/tipoCitaRutas.js';
app.use('/api/tipos-cita', tipoCitaRoutes);

import tipoUsuarioRoutes from './routes/tiposUsuariosRutas.js';
app.use('/api/tipos-usuario', tipoUsuarioRoutes);

import usuarioRoutes from './routes/usuariosRutas.js';
app.use('/api/usuarios', usuarioRoutes);

app.use((err, req, res, next) => {
    if (err.status) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

const PUERTO = 3001;

app.listen(PUERTO,() => {
    console.log(`Servidor en ejecución en el puerto ${PUERTO}`);
})