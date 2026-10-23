// Recorte SEPOMEX vía github.com/Swumplurd/cp-mexico (datos de Correos de México). Recorte de septiembre 2021.

const URL_CATALOGO = '/sepomex.json';

let catalogo = undefined;
let carga = null;

const esCp = (valor) => /^\d{5}$/.test(String(valor ?? ''));

export function entradaSepomex(catalogoCp, codigoPostal) {
  if (!catalogoCp || !esCp(codigoPostal)) return null;
  return catalogoCp[codigoPostal] ?? null;
}

export function avisoCpInexistente(catalogoCp, codigoPostal) {
  if (!catalogoCp || !esCp(codigoPostal)) return null;
  return catalogoCp[codigoPostal] ? null : 'Ese código postal no existe.';
}

export function aplicarCodigoPostal(form, catalogoCp, codigoPostal) {
  const siguiente = {
    ...form,
    codigo_postal: codigoPostal,
    estado: '',
    ciudad: '',
    colonia: '',
  };
  const entrada = entradaSepomex(catalogoCp, codigoPostal);
  if (!entrada) return siguiente;
  siguiente.estado = entrada.estado;
  siguiente.ciudad = entrada.ciudad;
  if (entrada.colonias.length === 1) {
    siguiente.colonia = entrada.colonias[0];
  }
  return siguiente;
}

export function ajustarConCatalogo(form, catalogoCp) {
  const entrada = entradaSepomex(catalogoCp, form.codigo_postal);
  if (!entrada) return form;
  const siguiente = {
    ...form,
    estado: entrada.estado,
    ciudad: entrada.ciudad,
  };
  if (entrada.colonias.length === 1) {
    siguiente.colonia = entrada.colonias[0];
  } else if (form.colonia && !entrada.colonias.includes(form.colonia)) {
    siguiente.colonia = '';
  }
  return siguiente;
}

export function cargarCatalogoSepomex() {
  if (catalogo !== undefined) return Promise.resolve(catalogo);
  if (!carga) {
    carga = fetch(URL_CATALOGO)
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar el catálogo postal');
        return res.json();
      })
      .then((data) => {
        catalogo = data && typeof data === 'object' ? data : null;
        return catalogo;
      })
      .catch(() => {
        catalogo = null;
        carga = null;
        return null;
      });
  }
  return carga;
}
