export function avisoTelefonoOcupado(
  digitos,
  { pacientes = [], odontologos = [], idPaciente = null, idOdontologo = null } = {},
) {
  if (!/^\d{10}$/.test(digitos)) return null;
  const igual = (telefono) => String(telefono ?? '').replace(/\D/g, '') === digitos;
  const esOtro = (id, propio) => propio == null || String(id) !== String(propio);
  if (pacientes.some((p) => igual(p.telefono) && esOtro(p.id_paciente, idPaciente))) {
    return 'Ese teléfono ya pertenece a un paciente.';
  }
  if (odontologos.some((o) => igual(o.telefono) && esOtro(o.id_odontologo, idOdontologo))) {
    return 'Ese teléfono ya pertenece a un odontólogo.';
  }
  return null;
}
