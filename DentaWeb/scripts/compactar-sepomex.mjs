import { writeFileSync, statSync } from 'fs';

const archivos = [
  'CP_AGUASCALIENTES.json',
  'CP_BAJA_CALIFORNIA_NORTE.json',
  'CP_BAJA_CALIFORNIA_SUR.json',
  'CP_CAMPECHE.json',
  'CP_CDMX.json',
  'CP_CHIAPAS.json',
  'CP_CHIHUAHUA.json',
  'CP_COAHUILA.json',
  'CP_COLIMA.json',
  'CP_DURANGO.json',
  'CP_EDO_MEX.json',
  'CP_GUANAJUATO.json',
  'CP_GUERRERO.json',
  'CP_HIDALGO.json',
  'CP_JALISCO.json',
  'CP_MICHOACAN.json',
  'CP_MORELOS.json',
  'CP_NAYARIT.json',
  'CP_NUEVO_LEON.json',
  'CP_OAXACA.json',
  'CP_PUEBLA.json',
  'CP_QUERETARO.json',
  'CP_QUINTANA_ROO.json',
  'CP_SAN_LUIS_POTOSI.json',
  'CP_SINALOA.json',
  'CP_SONORA.json',
  'CP_TABASCO.json',
  'CP_TAMAULIPAS.json',
  'CP_TLAXCALA.json',
  'CP_VERACRUZ.json',
  'CP_YUCATAN.json',
  'CP_ZACATECAS.json',
];

const mayus = (v) => String(v ?? '').trim().toLocaleUpperCase('es-MX');
const out = {};
const cola = [...archivos];

async function uno(nombre) {
  const url = `https://raw.githubusercontent.com/Swumplurd/cp-mexico/master/json/${nombre}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${nombre} ${res.status}`);
  const filas = await res.json();
  for (const fila of filas) {
    const cp = String(fila.d_codigo ?? '').padStart(5, '0');
    if (!/^\d{5}$/.test(cp)) continue;
    const colonia = mayus(fila.d_asenta);
    if (!colonia) continue;
    const ciudadOrigen = mayus(fila.d_ciudad);
    const ciudad = ciudadOrigen || mayus(fila.D_mnpio || fila.d_mnpio);
    if (!out[cp]) {
      out[cp] = {
        estado: mayus(fila.d_estado),
        ciudad,
        colonias: [],
      };
    } else if (!out[cp].ciudad && ciudad) {
      out[cp].ciudad = ciudad;
    } else if (ciudadOrigen && out[cp].ciudad !== ciudadOrigen) {
      out[cp].ciudad = ciudadOrigen;
    }
    if (!ciudadOrigen && ciudad && !globalThis.__ruralEjemplo) {
      globalThis.__ruralEjemplo = { cp, ciudad, estado: mayus(fila.d_estado) };
    }
    if (!out[cp].colonias.includes(colonia)) out[cp].colonias.push(colonia);
  }
  console.log('ok', nombre, 'filas', filas.length);
}

async function worker() {
  while (cola.length) {
    const n = cola.shift();
    await uno(n);
  }
}

await Promise.all(Array.from({ length: 4 }, worker));

for (const cp of Object.keys(out)) {
  out[cp].colonias.sort((a, b) => a.localeCompare(b, 'es-MX'));
}

const destino = new URL('../public/sepomex.json', import.meta.url);
writeFileSync(destino, JSON.stringify(out));
const cps = Object.keys(out);
const una = cps.filter((c) => out[c].colonias.length === 1);
console.log(
  'cps',
  cps.length,
  'multi',
  cps.length - una.length,
  'una',
  una.length,
  'bytes',
  statSync(destino).size
);
console.log('80000', out['80000']
  ? { estado: out['80000'].estado, ciudad: out['80000'].ciudad, n: out['80000'].colonias.length }
  : 'NO');
console.log('unaEjemplo', una[0], out[una[0]]);
console.log('ruralEjemplo', globalThis.__ruralEjemplo ?? 'NO');
