import conexion from "./conexion.js"; // ajusta a como exportas tu conexión real
import bcrypt from "bcrypt";

export const verificarCredenciales = async (email, password) => {
    try {
        if (!email || !password) {
            return { success: false, error: "Email y contraseña son requeridos" };
        }
        
        const resultado = await conexion.query(
            "SELECT id, nombre, email, telefono, password FROM clientes WHERE email = $1",
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

export default verificarCredenciales;

// const middlewareVerificarToken = (req, res, next) => {
//     // 1. El frontend suele mandar el token en los headers (Authorization)
//     const token = req.headers['authorization']?.split(' ')[1]; // Extrae el token

//     if (!token) {
//         return res.status(403).json({ error: "No se proporcionó un token" });
//     }

//     try {
//         // 2. Verificamos la "firma" del token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        
//         // 3. Guardamos los datos del usuario en la request para usarlos después
//         req.usuario = decoded; 
        
//         // 4. Le decimos a Express: "Todo en orden, déjalo pasar a la ruta"
//         next(); 
//     } catch (error) {
//         console.error("Error al verificar token:", error.message);
//         return res.status(401).json({ error: "Token inválido o expirado" });
//     }
// };

