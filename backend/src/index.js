import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json()); // comentario
app.use(cors());

import loginRutas from './routes/loginRutas.js';

app.use("/api/login", loginRutas);

app.get('/', (req, res) => {
    res.send("¡Hola! Mi servidor está funcionando.");
});

const PUERTO = 3001;

//Ruta de ejemplo
// app.get('/',(_req,res) =>{
//     res.send("Ruta raíz de la API");
// })

app.listen(PUERTO,() => {
    console.log(`Servidor en ejecución en el puerto ${PUERTO}`);
})