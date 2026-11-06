import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Stethoscope } from 'lucide-react';
import { CatalogoPage } from '../../../components/CatalogoPage.jsx';
import { scrollAlPrimerCampo } from '../../../components/avisosFormulario.jsx';
import { odontologosApi, clinicasApi } from '../../../services/api.js';
import FormularioOdontologo from './FormularioOdontologo.jsx';
import {
  FORM_INICIAL,
  comoLista,
  idDeRespuesta,
  mapearOdontologo,
  mayus,
} from './services/datos.js';
import { agruparHorarios, bloqueNuevo, expandirBloques } from './services/horarios.js';
import {
  LIMPIAR_CEDULA,
  LIMPIAR_CORREO,
  LIMPIAR_NOMBRE,
  limitarTelefono,
  validarFormulario,
} from './services/validaciones.js';

export default function OdontologosPage() {
  const [odontologos, setOdontologos] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const formularioRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const [erroresCampos, setErroresCampos] = useState({});
  const [guardando, setGuardando] = useState(false);
  // Al editar, el horario y las especialidades se cargan aparte. Hasta que llegan no se
  // guardan, para no borrar por error lo que ya tenía el odontólogo.
  const [perfilListo, setPerfilListo] = useState(true);

  const creando = editandoId === null;

  /* ------------------------------------------------------------
     Carga de datos
     ------------------------------------------------------------ */
  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setErrorCarga(null);
      const data = await odontologosApi.listar();
      setOdontologos(comoLista(data, 'odontologos'));
    } catch (err) {
      console.error('Error al listar odontólogos:', err);
      setOdontologos([]);
      setErrorCarga(err.message || 'No se pudieron cargar los odontólogos.');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    try {
      setClinicas(comoLista(await clinicasApi.listar(), 'clinicas'));
    } catch (err) {
      console.error('Error al cargar clínicas:', err);
    }
    try {
      setEspecialidades(comoLista(await odontologosApi.catalogoPerfil(), 'especialidades'));
    } catch (err) {
      console.error('Error al cargar especialidades:', err);
    }
  }, []);

  useEffect(() => {
    cargar();
    cargarCatalogos();
  }, [cargar, cargarCatalogos]);

  // Clínicas activas, más las ya asignadas aunque estén inactivas
  const opcionesClinica = useMemo(
    () => clinicas.filter((c) => c.activo || form.ids_clinicas.includes(Number(c.id_clinica))),
    [clinicas, form.ids_clinicas]
  );

  // Clínicas marcadas: son las únicas donde se puede poner horario
  const clinicasSeleccionadas = useMemo(
    () => clinicas.filter((c) => form.ids_clinicas.includes(Number(c.id_clinica))),
    [clinicas, form.ids_clinicas]
  );

  /* ------------------------------------------------------------
     Cambios del formulario
     ------------------------------------------------------------ */
  const limpiarError = (campo) =>
    setErroresCampos((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });

  const handleChange = (campo) => (e) => {
    let valor = e.target.value;

    switch (campo) {
      case 'nombre':
      case 'ape_pat':
      case 'ape_mat':
        valor = valor.replace(LIMPIAR_NOMBRE, '').toUpperCase();
        break;
      case 'telefono':
        valor = limitarTelefono(valor);
        break;
      case 'cedula':
        valor = valor.replace(LIMPIAR_CEDULA, '');
        break;
      case 'correo':
        valor = valor.replace(LIMPIAR_CORREO, '').toLowerCase();
        break;
      default:
        break;
    }

    setForm((prev) => ({ ...prev, [campo]: valor }));
    limpiarError(campo);
  };

  const handleBlur = (campo) => () => {
    const todos = validarFormulario(form, creando, odontologos, editandoId);
    setErroresCampos((prev) => {
      const copia = { ...prev };
      if (todos[campo]) copia[campo] = todos[campo];
      else delete copia[campo];
      return copia;
    });
  };

  // Marca / desmarca una clínica. Al quitar una, también se quitan sus horarios.
  const toggleClinica = (idClinica) => {
    const id = Number(idClinica);
    setForm((prev) => {
      const quitando = prev.ids_clinicas.includes(id);
      return {
        ...prev,
        ids_clinicas: quitando
          ? prev.ids_clinicas.filter((x) => x !== id)
          : [...prev.ids_clinicas, id],
        bloques: quitando
          ? prev.bloques.filter((b) => Number(b.id_clinica) !== id)
          : prev.bloques,
      };
    });
    limpiarError('ids_clinicas');
    limpiarError('horarios');
  };

  const toggleEspecialidad = (idEspecialidad) => {
    const id = Number(idEspecialidad);
    setForm((prev) => ({
      ...prev,
      ids_especialidades: prev.ids_especialidades.includes(id)
        ? prev.ids_especialidades.filter((x) => x !== id)
        : [...prev.ids_especialidades, id],
    }));
  };

  /* ------------------------------------------------------------
     Horario semanal
     ------------------------------------------------------------ */
  const agregarBloque = () => {
    const primera = clinicasSeleccionadas[0];
    if (!primera) return;
    setForm((prev) => ({
      ...prev,
      bloques: [...prev.bloques, bloqueNuevo(Number(primera.id_clinica))],
    }));
    limpiarError('horarios');
  };

  const cambiarBloque = (clave, cambios) => {
    setForm((prev) => ({
      ...prev,
      bloques: prev.bloques.map((b) => (b.clave === clave ? { ...b, ...cambios } : b)),
    }));
    limpiarError('horarios');
  };

  const toggleDia = (clave, dia) => {
    setForm((prev) => ({
      ...prev,
      bloques: prev.bloques.map((b) => {
        if (b.clave !== clave) return b;
        const dias = b.dias.includes(dia) ? b.dias.filter((d) => d !== dia) : [...b.dias, dia];
        return { ...b, dias: dias.sort((a, c) => a - c) };
      }),
    }));
    limpiarError('horarios');
  };

  const quitarBloque = (clave) => {
    setForm((prev) => ({ ...prev, bloques: prev.bloques.filter((b) => b.clave !== clave) }));
    limpiarError('horarios');
  };

  /* ------------------------------------------------------------
     Guardar / editar / eliminar
     ------------------------------------------------------------ */
  const resetFormulario = () => {
    setForm(FORM_INICIAL);
    setEditandoId(null);
    setError(null);
    setErroresCampos({});
    setPerfilListo(true);
  };

  const handleGuardar = async () => {
    const errores = validarFormulario(form, creando, odontologos, editandoId);

    if (Object.keys(errores).length > 0) {
      setErroresCampos(errores);
      setError(null);
      requestAnimationFrame(() => scrollAlPrimerCampo(formularioRef.current, errores));
      return false;
    }

    try {
      setGuardando(true);
      setError(null);
      setErroresCampos({});

      const datosBase = {
        nombre: mayus(form.nombre),
        ape_pat: mayus(form.ape_pat),
        ape_mat: mayus(form.ape_mat),
        telefono: form.telefono.trim().replace(/[\s()-]/g, ''),
        cedula: mayus(form.cedula),
        ids_clinicas: form.ids_clinicas.map(Number),
      };

      // 1. Datos del odontólogo (y sus clínicas)
      let idGuardado = editandoId;
      if (editandoId) {
        await odontologosApi.actualizar(editandoId, {
          ...datosBase,
          idusuario: form.idusuario ? Number(form.idusuario) : null,
        });
      } else {
        const creado = await odontologosApi.crear({
          ...datosBase,
          correo: form.correo.trim().toLowerCase(),
          contrasena: form.contrasena,
        });
        idGuardado = idDeRespuesta(creado);

        // Si el backend no devuelve el id, se busca el odontólogo recién creado
        if (!idGuardado) {
          const lista = comoLista(await odontologosApi.listar(), 'odontologos');
          idGuardado =
            lista.find(
              (o) =>
                (datosBase.cedula && o.cedula === datosBase.cedula) ||
                o.telefono === datosBase.telefono
            )?.id_odontologo ?? null;
        }
      }

      // 2. Especialidades y horario semanal
      if (perfilListo && idGuardado) {
        try {
          await odontologosApi.guardarPerfil(idGuardado, {
            ids_especialidades: form.ids_especialidades.map(Number),
            horarios: expandirBloques(form.bloques),
          });
        } catch (err) {
          // El odontólogo ya quedó guardado: se pasa a modo edición para reintentar
          // sin crear otro duplicado.
          await cargar();
          setEditandoId(idGuardado);
          setForm((prev) => ({ ...prev, correo: '', contrasena: '', confirmarContrasena: '' }));
          setError(
            `El odontólogo se guardó, pero no se pudo guardar su horario o especialidades: ${
              err.message || 'error desconocido'
            }`
          );
          return false;
        }
      }

      resetFormulario();
      await cargar();
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar el odontólogo');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = async (id) => {
    const o = odontologos.find((x) => x.id_odontologo === id);
    if (!o) return;

    // El backend manda ids_clinicas; si no viniera, se arma desde clinicas
    const idsClinicas = Array.isArray(o.ids_clinicas)
      ? o.ids_clinicas
      : Array.isArray(o.clinicas)
        ? o.clinicas.map((c) => c.id_clinica)
        : [];

    setEditandoId(id);
    setError(null);
    setErroresCampos({});
    setPerfilListo(false);
    setForm({
      ...FORM_INICIAL,
      nombre: (o.nombre ?? '').toUpperCase(),
      ape_pat: (o.ape_pat ?? '').toUpperCase(),
      ape_mat: (o.ape_mat ?? '').toUpperCase(),
      telefono: o.telefono ?? '',
      cedula: o.cedula ?? '',
      ids_clinicas: idsClinicas.map(Number),
      idusuario: o.id_usuario != null ? String(o.id_usuario) : '',
    });

    // Especialidades y horario actuales
    try {
      const perfil = await odontologosApi.obtenerPerfil(id);
      setForm((prev) => ({
        ...prev,
        ids_especialidades: (perfil?.ids_especialidades ?? []).map(Number),
        bloques: agruparHorarios(perfil?.horarios ?? []),
      }));
      setPerfilListo(true);
    } catch (err) {
      console.error('Error al cargar el perfil del odontólogo:', err);
      setError(
        'No se pudieron cargar sus especialidades y horario. Puedes editar los demás datos; ' +
          'el horario no se modificará.'
      );
    }
  };

  const handleEliminar = async (id) => {
    await odontologosApi.eliminar(id);
    await cargar();
  };

  const handleReactivar = async (id) => {
    await odontologosApi.reactivar(id);
    await cargar();
  };

  /* ------------------------------------------------------------
     Render
     ------------------------------------------------------------ */
  const acciones = {
    cambiar: handleChange,
    blur: handleBlur,
    toggleClinica,
    toggleEspecialidad,
    agregarBloque,
    cambiarBloque,
    toggleDia,
    quitarBloque,
  };

  return (
    <CatalogoPage
      titulo="Odontólogos"
      subtitulo="Gestiona el personal odontológico, sus clínicas, especialidades y horarios."
      textoBotonNuevo="Agregar odontólogo"
      placeholderBusqueda="Buscar por nombre, cédula, correo o clínica..."
      datos={odontologos.map(mapearOdontologo)}
      cargando={cargando}
      errorCarga={errorCarga}
      onEditar={handleEditar}
      onEliminar={handleEliminar}
      onReactivar={handleReactivar}
      modal={{
        icono: <Stethoscope />,
        titulo: editandoId ? 'Editar Odontólogo' : 'Nuevo Odontólogo',
        textoGuardar: guardando ? 'Guardando...' : 'Guardar Odontólogo',
        contenido: (
          <FormularioOdontologo
            formularioRef={formularioRef}
            form={form}
            errores={erroresCampos}
            error={error}
            creando={creando}
            perfilListo={perfilListo}
            opcionesClinica={opcionesClinica}
            clinicasSeleccionadas={clinicasSeleccionadas}
            especialidades={especialidades}
            acciones={acciones}
          />
        ),
        onGuardar: handleGuardar,
        onCerrar: resetFormulario,
        guardando,
      }}
    />
  );
}