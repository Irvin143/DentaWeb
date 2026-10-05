import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Cookies = () => (
	<div className="flex min-h-screen flex-col items-center bg-login-background px-4 py-8">
		<div className="pointer-events-none fixed inset-0 bg-login-backdrop" />
		<main className="relative w-full max-w-4xl rounded-3xl bg-on-primary p-8 shadow-login-card sm:p-10">
			<header className="mb-8 flex flex-col items-center text-center"><div className="mb-3 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10"><img src="/logo.svg" alt="Logo DentalWeb" /></div><div className="text-left"><h1 className="text-2xl font-bold tracking-tight text-primary-container">ClinicWare</h1><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-container opacity-60">Plataforma Odontológica</p></div></div><p className="text-sm leading-relaxed text-login-muted">Política de cookies</p></header>
			<article className="space-y-6 text-sm leading-7 text-login-heading">
				<p>Última actualización: 4 de octubre de 2026.</p>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">1. Dónde se guarda la sesión</h2><p>ClinicWare no usa cookies para iniciar sesión. La sesión se guarda en el almacenamiento del navegador. Si la persona marca "Mantener sesión iniciada", queda en localStorage y sigue disponible al cerrar el navegador. Si no la marca, queda en sessionStorage y se borra al cerrar la pestaña.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">2. Publicidad y analítica</h2><p>ClinicWare no usa cookies de publicidad ni de analítica de terceros.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">3. Contacto</h2><p>Las dudas sobre esta página se envían a soporte@clinicware.tech.</p></section>
			</article>
			<div className="mt-8 flex justify-center"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"><ArrowLeft size={16} />Volver a iniciar sesión</Link></div>
		</main>
		<footer className="mt-8 flex w-full max-w-4xl flex-col items-center gap-3 text-center"><nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-login-muted"><Link to="/legal/terminos" className="transition-colors hover:text-login-active">Términos de servicio</Link><Link to="/legal/privacidad" className="transition-colors hover:text-login-active">Privacidad</Link><Link to="/legal/cookies" className="text-primary-container">Cookies</Link><Link to="/legal/seguridad" className="transition-colors hover:text-login-active">Seguridad</Link></nav></footer>
	</div>
);

export default Cookies;
