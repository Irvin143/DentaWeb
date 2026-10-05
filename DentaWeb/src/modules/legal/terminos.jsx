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
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">1. Introducción y aceptación</h2><p>Estos términos describen las condiciones generales de uso de ClinicWare. Al acceder o utilizar la plataforma, el usuario declara que ha leído y comprende este documento. Este contenido es provisional y debe ser revisado por asesoría legal antes de su publicación.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">2. Descripción de ClinicWare</h2><p>ClinicWare es una plataforma digital orientada a apoyar la gestión de clínicas odontológicas, pacientes, citas y procesos administrativos. Las funciones disponibles pueden cambiar durante el desarrollo del producto.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">3. Usuarios y cuentas</h2><p>El usuario debe proporcionar información completa y mantenerla actualizada. Las cuentas institucionales pueden requerir validación o habilitación por parte de una organización autorizada.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">4. Credenciales</h2><p>Las credenciales son personales. El usuario debe protegerlas, evitar compartirlas y avisar oportunamente si sospecha de un acceso no autorizado.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">5. Uso permitido</h2><p>La plataforma debe utilizarse de forma lícita, responsable y coherente con su finalidad. No está permitido interferir con el servicio, intentar acceder a cuentas ajenas o introducir contenido malicioso.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">6. Información clínica</h2><p>La información clínica debe manejarse conforme a las responsabilidades profesionales y organizacionales aplicables. ClinicWare no sustituye el criterio profesional ni las obligaciones del prestador de servicios de salud.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">7. Disponibilidad y mantenimiento</h2><p>El servicio puede requerir pausas por mantenimiento, actualizaciones o incidentes. Se procurará informar los cambios relevantes cuando sea razonablemente posible.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">8. Propiedad intelectual</h2><p>La interfaz, identidad visual, software y contenidos de ClinicWare pertenecen a sus respectivos titulares. Estos términos no transfieren derechos de propiedad intelectual al usuario.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">9. Limitación de responsabilidad</h2><p>ClinicWare es una herramienta de apoyo. El usuario y la institución son responsables de sus decisiones profesionales, de la información introducida y de la configuración de sus procesos internos.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">10. Suspensión o cancelación</h2><p>Una cuenta puede suspenderse cuando exista incumplimiento de estos términos, riesgo para la plataforma o requerimiento de la organización responsable.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">11. Modificaciones</h2><p>Estos términos pueden actualizarse para reflejar cambios del producto o requisitos aplicables. La versión vigente se publicará en esta página.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">12. Legislación y contacto</h2><p>La legislación aplicable y la información del responsable legal deberán definirse antes del lanzamiento. Contacto provisional: [correo legal].</p></section>
			</article>

			<div className="mt-8 flex justify-center"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"><ArrowLeft size={16} />Volver a iniciar sesión</Link></div>
		</main>
		<LegalFooter />
	</div>
);

export default Terms;
