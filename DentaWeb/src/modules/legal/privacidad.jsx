import { ArrowLeft, Shield, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy = () => (
	<div className="flex min-h-screen flex-col items-center bg-login-background px-4 py-8">
		<div className="pointer-events-none fixed inset-0 bg-login-backdrop" />
		<main className="relative w-full max-w-4xl rounded-3xl bg-on-primary p-8 shadow-login-card sm:p-10">
			<header className="mb-8 flex flex-col items-center text-center"><div className="mb-3 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10"><img src="/logo.svg" alt="Logo DentalWeb" /></div><div className="text-left"><h1 className="text-2xl font-bold tracking-tight text-primary-container">ClinicWare</h1><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-container opacity-60">Plataforma Odontológica</p></div></div><p className="text-sm leading-relaxed text-login-muted">Política de privacidad</p></header>
			<article className="space-y-6 text-sm leading-7 text-login-heading">
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">1. Responsable del tratamiento</h2><p>La identidad y los datos del responsable legal deberán completarse antes de producción: [Nombre legal de la empresa], [domicilio legal] y [correo legal].</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">2. Datos que se recopilan</h2><p>ClinicWare puede recopilar datos de identificación, contacto, información profesional o institucional y datos técnicos relacionados con el uso de la plataforma.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">3. Datos profesionales y clínicos</h2><p>La información profesional o clínica debe introducirse únicamente cuando exista una finalidad legítima y autorización para hacerlo. Los usuarios deben respetar sus obligaciones profesionales y organizacionales.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">4. Finalidades</h2><p>Los datos pueden utilizarse para gestionar cuentas, operar funciones de la plataforma, atender solicitudes, mejorar el servicio, prevenir abusos y cumplir obligaciones aplicables.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">5. Base legal</h2><p>La base legal de cada tratamiento deberá definirse según la jurisdicción, el tipo de usuario y la finalidad concreta antes del lanzamiento.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">6. Conservación y almacenamiento</h2><p>Los datos se conservarán solo durante el tiempo necesario para las finalidades informadas o durante el plazo exigido por obligaciones aplicables. Los detalles de infraestructura deberán documentarse antes de producción.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">7. Compartición</h2><p>Los datos podrán compartirse con proveedores que presten servicios necesarios para operar ClinicWare, bajo acuerdos y controles apropiados. No se deben incorporar proveedores reales a esta página sin validación contractual.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">8. Derechos de los usuarios</h2><p>Los usuarios podrán ejercer los derechos reconocidos por la normativa aplicable. Las solicitudes deberán dirigirse a [correo de privacidad].</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">9. Seguridad de la información</h2><p>ClinicWare implementará controles técnicos y organizacionales proporcionales a los riesgos identificados. No se afirma mediante esta página ninguna certificación o cumplimiento normativo.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">10. Cambios y contacto</h2><p>Esta política podrá actualizarse. La versión vigente indicará su fecha de revisión. Este contenido es provisional y requiere revisión legal antes de producción. Contacto: [correo legal].</p></section>
			</article>
			<div className="mt-8 flex justify-center"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"><ArrowLeft size={16} />Volver a iniciar sesión</Link></div>
		</main>
		<footer className="mt-8 flex w-full max-w-4xl flex-col items-center gap-3 text-center"><nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-login-muted"><Link to="/legal/terminos" className="transition-colors hover:text-login-active">Términos de servicio</Link><Link to="/legal/privacidad" className="text-primary-container">Privacidad</Link><Link to="/legal/cookies" className="transition-colors hover:text-login-active">Cookies</Link><Link to="/legal/seguridad" className="transition-colors hover:text-login-active">Seguridad</Link></nav><div className="flex items-center gap-1.5 text-xs text-login-muted"><Shield size={14} /><Smartphone size={14} /><span>Soporte clínico 24/7</span></div></footer>
	</div>
);

export default Privacy;
