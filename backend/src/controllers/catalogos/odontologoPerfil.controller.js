import * as perfilService from '../../services/catalogos/odontologoPerfilServices.js';

const responderError = (res, err) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
};

const idValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0;

// 'HH:mm' de 24 horas
const horaValida = (valor) => /^([01]\d|2[0-3]):[0-5]\d$/.test(valor ?? '');
const aMinutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// GET /odontologos/perfil/catalogo
export const catalogo = async (req, res) => {
    try {
        res.json(await perfilService.obtenerCatalogoPerfil());
    } catch (err) {
        responderError(res, err);
    }
};

// GET /odontologos/:id/perfil
export const obtener = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'id debe ser un entero positivo' });
    try {
        const { paquete, sub } = req.usuario || {};
        const alcance = await perfilService.resolverAlcance({ paquete, idUsuario: sub });
        res.json(await perfilService.obtenerPerfil({ idOdontologo: Number(id), alcance }));
    } catch (err) {
        responderError(res, err);
    }
};

// PUT /odontologos/:id/perfil
// body: { ids_especialidades: [int], horarios: [{ id_clinica, dia_semana, hora_inicio,
//         hora_fin, duracion_cita_min }] }
export const guardar = async (req, res) => {
    const { id } = req.params;
    if (!idValido(id)) return res.status(400).json({ error: 'id debe ser un entero positivo' });

    const idsEspecialidades = req.body?.ids_especialidades ?? [];
    const horarios = req.body?.horarios ?? [];

    if (!Array.isArray(idsEspecialidades) || !idsEspecialidades.every(idValido)) {
        return res.status(400).json({ error: 'ids_especialidades debe ser una lista de enteros' });
    }
    if (!Array.isArray(horarios)) {
        return res.status(400).json({ error: 'horarios debe ser una lista' });
    }

    const limpios = [];
    for (const h of horarios) {
        const dia = Number(h?.dia_semana);
        const duracion = Number(h?.duracion_cita_min);
        if (!idValido(h?.id_clinica)) {
            return res.status(400).json({ error: 'Cada horario necesita una clínica' });
        }
        if (!Number.isInteger(dia) || dia < 1 || dia > 7) {
            return res.status(400).json({ error: 'dia_semana debe ser de 1 (lunes) a 7 (domingo)' });
        }
        if (!horaValida(h?.hora_inicio) || !horaValida(h?.hora_fin)) {
            return res.status(400).json({ error: 'Las horas deben tener el formato HH:mm' });
        }
        if (aMinutos(h.hora_fin) <= aMinutos(h.hora_inicio)) {
            return res.status(400).json({ error: 'La hora de fin debe ser posterior a la de inicio' });
        }
        if (!Number.isInteger(duracion) || duracion < 5 || duracion > 240) {
            return res.status(400).json({ error: 'La duración de la cita debe ser de 5 a 240 minutos' });
        }
        if (aMinutos(h.hora_fin) - aMinutos(h.hora_inicio) < duracion) {
            return res
                .status(400)
                .json({ error: 'El bloque de horario es más corto que la duración de una cita' });
        }
        limpios.push({
            id_clinica: Number(h.id_clinica),
            dia_semana: dia,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            duracion_cita_min: duracion,
        });
    }

    try {
        const { paquete, sub } = req.usuario || {};
        const alcance = await perfilService.resolverAlcance({ paquete, idUsuario: sub });
        const resultado = await perfilService.guardarPerfil({
            idOdontologo: Number(id),
            idsEspecialidades: [...new Set(idsEspecialidades.map(Number))],
            horarios: limpios,
            alcance,
        });
        res.json(resultado);
    } catch (err) {
        responderError(res, err);
    }
};