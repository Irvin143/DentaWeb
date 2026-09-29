import { ArrowLeft, Shield, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Security = () => (
	<div className="flex min-h-screen flex-col items-center bg-login-background px-4 py-8">
		<div className="pointer-events-none fixed inset-0 bg-login-backdrop" />
		<main className="relative w-full max-w-4xl rounded-3xl bg-on-primary p-8 shadow-login-card sm:p-10">
			<header className="mb-8 flex flex-col items-center text-center"><div className="mb-3 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10"><img src="/logo.svg" alt="Logo DentalWeb" /></div><div className="text-left"><h1 className="text-2xl font-bold tracking-tight text-primary-container">ClinicWare</h1><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-container opacity-60">Plataforma Odontológica</p></div></div><p className="text-sm leading-relaxed text-login-muted">Seguridad de la información</p></header>
			<article className="space-y-6 text-sm leading-7 text-login-heading">
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">1. Protección de cuentas</h2><p>Los usuarios deben utilizar credenciales únicas, mantenerlas privadas y reportar cualquier actividad sospechosa.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">2. Autenticación y sesiones</h2><p>ClinicWare debe aplicar controles de autenticación, expiración de sesiones y recuperación de acceso adecuados al tipo de cuenta.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">3. Cifrado durante el transporte</h2><p>Las comunicaciones de producción deberán protegerse mediante HTTPS y configuraciones TLS mantenidas de forma segura.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">4. Infraestructura y control de acceso</h2><p>El acceso a sistemas e información debe limitarse según necesidad, función y autorización. La configuración concreta dependerá de la infraestructura definitiva.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">5. Registro y monitoreo</h2><p>Los eventos relevantes deberían registrarse y revisarse para detectar accesos anómalos, errores y posibles incidentes.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">6. Gestión de incidentes</h2><p>ClinicWare deberá contar con procedimientos para identificar, contener, investigar y comunicar incidentes de seguridad conforme a las obligaciones aplicables.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">7. Responsabilidades del usuario</h2><p>El usuario debe proteger sus dispositivos, no compartir credenciales y evitar descargar o introducir información que pueda comprometer la plataforma.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">8. Reporte de vulnerabilidades</h2><p>Los posibles problemas de seguridad pueden reportarse a [correo de seguridad]. No incluyas información sensible en el primer contacto.</p></section>
				<section><h2 className="mb-2 text-lg font-bold text-primary-container">9. Estado de este documento</h2><p>Esta información es provisional y no constituye una certificación ni una declaración de cumplimiento normativo. Debe revisarse antes del lanzamiento.</p></section>
			</article>
			<div className="mt-8 flex justify-center"><Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"><ArrowLeft size={16} />Volver a iniciar sesión</Link></div>
		</main>
		<footer className="mt-8 flex w-full max-w-4xl flex-col items-center gap-3 text-center"><nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-login-muted"><Link to="/legal/terminos" className="transition-colors hover:text-login-active">Términos de servicio</Link><Link to="/legal/privacidad" className="transition-colors hover:text-login-active">Privacidad</Link><Link to="/legal/cookies" className="transition-colors hover:text-login-active">Cookies</Link><Link to="/legal/seguridad" className="text-primary-container">Seguridad</Link></nav><div className="flex items-center gap-1.5 text-xs text-login-muted"><Shield size={14} /><Smartphone size={14} /><span>Soporte clínico 24/7</span></div></footer>
	</div>
);

export default Security;
