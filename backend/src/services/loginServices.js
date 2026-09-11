import conexion from "./conexion.js"; // ajusta a como exportas tu conexión real
import bcrypt from "bcrypt";

export const verificarCredenciales = async (email, password) => {
    try {
        if (!email || !password) {
            return { success: false, error: "Email y contraseña son requeridos" };
        }

        const resultado = await conexion.query(
            "SELECT id, nombre, email, password FROM clientes WHERE email = $1",
            [email]
        );

        const cliente = resultado.rows[0];

        if (!cliente) {
            return { success: false, error: "Credenciales inválidas" };
        }

        const passwordValido = await bcrypt.compare(password, cliente.password);

        if (!passwordValido) {
            return { success: false, error: "Credenciales inválidas" };
        }

        const { password: _, ...clienteSinPassword } = cliente;

        return { success: true, cliente: clienteSinPassword };

    } catch (error) {
        console.error("Error al verificar credenciales:", error.message);
        return { success: false, error: "Error en el servidor" };
    }
};

export const obtenerClientes = async () => {
    try {
        const resultado = await conexion.query("SELECT id, nombre, email FROM clientes");
        return { success: true, clientes: resultado.rows };
    }
    catch (error) {
        console.error("Error al obtener clientes:", error.message);
        return { success: false, error: "Error en el servidor" };
    }
};

export default { verificarCredenciales, obtenerClientes };
