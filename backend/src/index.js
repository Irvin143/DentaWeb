import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json()); // comentario
app.use(cors());

import loginRutas from './routes/loginRutas.js';

app.use("/api/login", loginRutas);

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