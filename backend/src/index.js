import express from 'express';
import cors from 'cors';
const app = express();

app.use(express.json()); // comentario
app.use(cors());


const PUERTO = 3001;

//Ruta de ejemplo
// app.get('/',(_req,res) =>{
//     res.send("Ruta raíz de la API");
// })

app.listen(PUERTO,() => {
    console.log(`Servidor en ejecución en el puerto ${PUERTO}`);
})