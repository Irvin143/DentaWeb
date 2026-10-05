import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LegalFooter = () => (
	<footer className="mt-8 flex w-full max-w-4xl flex-col items-center gap-3 text-center">
		<nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-login-muted">
			<Link to="/legal/terminos" className="text-primary-container">Términos de servicio</Link>
			<Link to="/legal/privacidad" className="transition-colors hover:text-login-active">Privacidad</Link>
			<Link to="/legal/cookies" className="transition-colors hover:text-login-active">Cookies</Link>
			<Link to="/legal/seguridad" className="transition-colors hover:text-login-active">Seguridad</Link>
		</nav>
	</footer>
);

const Terms = () => (
	<div className="flex min-h-screen flex-col items-center bg-login-background px-4 py-8">
		<div className="pointer-events-none fixed inset-0 bg-login-backdrop" />
		<main className="relative w-full max-w-4xl rounded-3xl bg-on-primary p-8 shadow-login-card sm:p-10">
			<header className="mb-8 flex flex-col items-center text-center">
				<div className="mb-3 flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10">
						<img src="/logo.svg" alt="Logo DentalWeb" />
					</div>
					<div className="text-left">
						<h1 className="text-2xl font-bold tracking-tight text-primary-container">ClinicWare</h1>
						<p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-container opacity-60">Plataforma Odontológica</p>
					</div>
				</div>
				<p className="max-w-2xl text-sm leading-relaxed text-login-muted">Términos de servicio</p>
			</header>

			<article className="space-y-6 text-sm leading-7 text-login-heading">
				<p>Última actualización: 4 de octubre de 2026.</p>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">1. Uso de ClinicWare</h2><p>ClinicWare es la plataforma de DentalWeb Medical Systems para la gestión de clínicas odontológicas. Al crear una cuenta o iniciar sesión, la persona acepta estas condiciones.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">2. Cuentas</h2><p>Cada cuenta corresponde a una persona. Los datos de la cuenta deben ser verdaderos y mantenerse al día. La organización que da de alta a un usuario puede definir a qué pantallas tiene acceso.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">3. Credenciales</h2><p>El correo y la contraseña son personales. No se comparten. Si hay sospecha de un acceso ajeno, la persona debe cambiar su contraseña y escribir a soporte@clinicware.tech.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">4. Datos que carga el usuario</h2><p>Quien registra pacientes, odontólogos, clínicas u otra información responde por contar con autorización para hacerlo y por que esos datos sean correctos. ClinicWare guarda lo que el usuario introduce para operar el servicio.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">5. Funciones</h2><p>Las pantallas y funciones de ClinicWare pueden cambiar. La versión publicada en clinicware.tech es la que está en uso.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">6. Contacto</h2><p>Las dudas sobre estas condiciones se envían a soporte@clinicware.tech.</p></section>
			</article>

			<div className="mt-8 flex justify-center"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"><ArrowLeft size={16} />Volver a iniciar sesión</Link></div>
		</main>
		<LegalFooter />
	</div>
);

export default Terms;
