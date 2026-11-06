import { KeyRound } from 'lucide-react';
import { ChecklistContrasena } from '../../../components/ChecklistContrasena.jsx';
import { AvisoGeneral } from '../../../components/avisosFormulario.jsx';
import {
  CampoContrasena,
  CampoTexto,
  ContadorSeleccion,
  Etiqueta,
  ListaChecks,
  Seccion,
} from './Campos.jsx';
import SeccionHorario from './SeccionHorario.jsx';
import { MAX_CEDULA, MAX_CORREO, MAX_NOMBRE } from './services/validaciones.js';

/* Formulario del odontólogo. No tiene estado propio: la página le pasa el form,
   los errores y las acciones. */
export default function FormularioOdontologo({
  formularioRef,
  form,
  errores,
  error,
  creando,
  perfilListo,
  opcionesClinica,
  clinicasSeleccionadas,
  especialidades,
  acciones,
}) {
  // value + onChange + onBlur de un campo del form
  const enlazar = (campo) => ({
    value: form[campo],
    onChange: acciones.cambiar(campo),
    onBlur: acciones.blur(campo),
    error: errores[campo],
  });

  const itemsClinicas = opcionesClinica.map((c) => ({
    id: Number(c.id_clinica),
    nombre: c.nombre,
    inactivo: !c.activo,
  }));

  const itemsEspecialidades = especialidades.map((e) => ({
    id: Number(e.id_especialidad),
    nombre: e.nombre,
  }));

  return (
    <>
      <AvisoGeneral mensaje={error} />
      <div
        ref={formularioRef}
        className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto pr-1 md:max-h-[72vh] md:gap-7 md:px-2"
      >
        <Seccion titulo="Datos personales">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <CampoTexto
              campo="nombre"
              etiqueta="Nombre(s):"
              requerido
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. LAURA"
              {...enlazar('nombre')}
            />
            <CampoTexto
              campo="telefono"
              etiqueta="Teléfono:"
              requerido
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Ej. 6671234567"
              {...enlazar('telefono')}
            />
            <CampoTexto
              campo="ape_pat"
              etiqueta="Apellido paterno:"
              requerido
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. GÓMEZ"
              {...enlazar('ape_pat')}
            />
            <CampoTexto
              campo="ape_mat"
              etiqueta="Apellido materno:"
              type="text"
              maxLength={MAX_NOMBRE}
              placeholder="Ej. RÍOS"
              {...enlazar('ape_mat')}
            />
          </div>
        </Seccion>

        <Seccion titulo="Datos profesionales">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
            <CampoTexto
              campo="cedula"
              etiqueta="Cédula profesional:"
              type="text"
              inputMode="numeric"
              maxLength={MAX_CEDULA}
              placeholder="Ej. 12345678"
              {...enlazar('cedula')}
            />

            <div data-campo="ids_clinicas" className="md:col-span-2">
              <Etiqueta requerido={creando}>
                Clínicas donde trabaja
                <ContadorSeleccion cantidad={form.ids_clinicas.length} />:
              </Etiqueta>
              <ListaChecks
                items={itemsClinicas}
                seleccionados={form.ids_clinicas}
                onToggle={acciones.toggleClinica}
                vacio="No hay clínicas disponibles."
                error={errores.ids_clinicas}
              />
              {errores.ids_clinicas && (
                <p className="mt-1 text-xs text-red-600 dark:text-error">{errores.ids_clinicas}</p>
              )}
            </div>

            <div data-campo="ids_especialidades" className="md:col-span-2">
              <Etiqueta>
                Especialidades
                <ContadorSeleccion cantidad={form.ids_especialidades.length} />:
              </Etiqueta>
              <ListaChecks
                items={itemsEspecialidades}
                seleccionados={form.ids_especialidades}
                onToggle={acciones.toggleEspecialidad}
                cargando={!perfilListo}
                textoCargando="Cargando especialidades..."
                vacio="No hay especialidades disponibles."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-on-surface-variant">
                Un servicio que requiere una especialidad solo se agenda con quien la tenga.
              </p>
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Horario de atención">
          <SeccionHorario
            bloques={form.bloques}
            perfilListo={perfilListo}
            clinicasSeleccionadas={clinicasSeleccionadas}
            error={errores.horarios}
            acciones={acciones}
          />
        </Seccion>

        {creando && (
          <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 pb-3 pt-1 md:gap-5 md:rounded-xl md:px-5 md:pb-5 md:pt-2 dark:border-outline-variant dark:bg-surface-container">
            <legend className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-teal-700 md:px-2 md:text-sm dark:text-teal-400">
              <KeyRound size={14} aria-hidden="true" /> Datos de acceso
            </legend>
            <p className="hidden text-sm text-slate-500 md:block dark:text-on-surface-variant">
              Con estos datos el odontólogo iniciará sesión en el sistema.
            </p>

            <CampoTexto
              campo="correo"
              etiqueta="Correo electrónico:"
              requerido
              type="email"
              autoComplete="off"
              maxLength={MAX_CORREO}
              placeholder="odontologo@correo.com"
              {...enlazar('correo')}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
              <CampoContrasena
                campo="contrasena"
                etiqueta="Contraseña:"
                placeholder="Crea una contraseña"
                {...enlazar('contrasena')}
              >
                <ChecklistContrasena contrasena={form.contrasena} />
              </CampoContrasena>
              <CampoContrasena
                campo="confirmarContrasena"
                etiqueta="Confirmar contraseña:"
                placeholder="Repite la contraseña"
                {...enlazar('confirmarContrasena')}
              />
            </div>
          </fieldset>
        )}
      </div>
    </>
  );
}