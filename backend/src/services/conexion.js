import pg from 'pg';
import dotenv from 'dotenv';

// Configuramos las variables de entorno
dotenv.config();

// Extraemos Pool de la librería pg
const { Pool } = pg;

const conexion = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20,
});

conexion.on("connect", () => {
    console.log("Conexión a la base de datos establecida");
});

// Opcional pero recomendado: Manejo de errores de clientes ociosos
conexion.on("error", (err, client) => {
    console.error("Error inesperado en un cliente inactivo", err);
    process.exit(-1);
});

export default conexion;