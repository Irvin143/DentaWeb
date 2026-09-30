import pg from 'pg';
import dotenv from 'dotenv';

// Configuramos las variables de entorno
dotenv.config();

// Extraemos Pool de la librería pg
const { Pool } = pg;

const conexion = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

conexion.on("connect", () => {
    console.log("Conexión a la base de datos establecida");
});

// Opcional pero recomendado: Manejo de errores de clientes ociosos
conexion.on("error", (err) => {
    console.error("Error inesperado en un cliente inactivo", err);
});
export default conexion;