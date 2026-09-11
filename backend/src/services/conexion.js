import pg from 'pg';
import dotenv from 'dotenv';

// Configuramos las variables de entorno
dotenv.config();

// Extraemos Pool de la librería pg
const { Pool } = pg;

const conexion = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
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