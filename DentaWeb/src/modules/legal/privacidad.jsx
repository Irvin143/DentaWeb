import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy = () => (
	<div className="flex min-h-screen flex-col items-center bg-login-background px-4 py-8">
		<div className="pointer-events-none fixed inset-0 bg-login-backdrop" />
		<main className="relative w-full max-w-4xl rounded-3xl bg-on-primary p-8 shadow-login-card sm:p-10">
			<header className="mb-8 flex flex-col items-center text-center"><div className="mb-3 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10"><img src="/logo.svg" alt="Logo DentalWeb" /></div><div className="text-left"><h1 className="text-2xl font-bold tracking-tight text-primary-container">ClinicWare</h1><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-container opacity-60">Plataforma Odontológica</p></div></div><p className="text-sm leading-relaxed text-login-muted">Política de privacidad</p></header>
			<article className="space-y-6 text-sm leading-7 text-login-heading">
				<p>Última actualización: 4 de octubre de 2026.</p>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">1. Quién trata los datos</h2><p>DentalWeb Medical Systems opera ClinicWare. Las solicitudes sobre datos personales se envían a soporte@clinicware.tech.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">2. Qué datos guarda la cuenta</h2><p>La cuenta puede incluir datos de identificación y de contacto, como nombre, apellidos, teléfono y correo. También guarda los datos clínicos o profesionales que el usuario registra en la plataforma, por ejemplo pacientes, odontólogos, clínicas, citas y notas asociadas a esos registros.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">3. Para qué se usan</h2><p>Esos datos se usan para operar ClinicWare: iniciar sesión, mostrar las pantallas que corresponden a la cuenta y atender solicitudes de soporte.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">4. No se venden</h2><p>DentalWeb Medical Systems no vende los datos de las cuentas ni los registros clínicos o profesionales cargados en ClinicWare.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">5. Con quién se comparten</h2><p>Se comparten solo con lo necesario para operar el servicio, por ejemplo el alojamiento que guarda la base de datos y entrega la aplicación. No se ceden para publicidad.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">6. Solicitudes</h2><p>Para consultar, corregir o pedir la baja de datos de una cuenta, se escribe a soporte@clinicware.tech.</p></section>
			</article>
			<div className="mt-8 flex justify-center"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"><ArrowLeft size={16} />Volver a iniciar sesión</Link></div>
		</main>
		<footer className="mt-8 flex w-full max-w-4xl flex-col items-center gap-3 text-center"><nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-login-muted"><Link to="/legal/terminos" className="transition-colors hover:text-login-active">Términos de servicio</Link><Link to="/legal/privacidad" className="text-primary-container">Privacidad</Link><Link to="/legal/cookies" className="transition-colors hover:text-login-active">Cookies</Link><Link to="/legal/seguridad" className="transition-colors hover:text-login-active">Seguridad</Link></nav></footer>
	</div>
);

export default Privacy;
