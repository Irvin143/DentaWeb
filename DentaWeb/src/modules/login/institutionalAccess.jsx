import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Mail, MessageSquare, Smartphone, Stethoscope, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const InstitutionalAccess = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [institutionalEmail, setInstitutionalEmail] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [confirmAffiliation, setConfirmAffiliation] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Institutional access request:', {
      fullName,
      institutionalEmail,
      clinicName,
      role,
      message,
      confirmAffiliation,
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-login-background px-4 py-8">
      <div className="pointer-events-none fixed inset-0 bg-login-backdrop" />

      <div className="relative w-full max-w-120 rounded-3xl bg-on-primary p-8 shadow-login-card sm:p-10">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10">
              <img src="/logo.svg" alt="Logo DentalWeb" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary-container">ClinicWare</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-container opacity-60">
                Plataforma Odontológica
              </p>
            </div>
          </div>
          <p className="mt-2 text-center text-sm leading-relaxed text-login-muted">
            Ecosistema clínico digital para pacientes y especialistas dentales
          </p>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-login-heading sm:text-2xl">Solicitar acceso institucional</h2>
          <p className="mt-1 text-sm text-login-muted">
            Solicita acceso a ClinicWare a través de tu clínica o institución.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="institutional-full-name" className="mb-1.5 block text-sm font-medium text-on-surface-variant">
              Nombre completo
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <UserRound className="text-login-icon" size={18} />
              </div>
              <input
                id="institutional-full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Tu nombre completo"
                autoComplete="name"
                required
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
            </div>
          </div>

          <div>
            <label htmlFor="institutional-email" className="mb-1.5 block text-sm font-medium text-on-surface-variant">
              Correo institucional
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <Mail className="text-login-icon" size={18} />
              </div>
              <input
                id="institutional-email"
                type="email"
                value={institutionalEmail}
                onChange={(event) => setInstitutionalEmail(event.target.value)}
                placeholder="ejemplo@clinicware.tech"
                autoComplete="email"
                required
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
            </div>
          </div>

          <div>
            <label htmlFor="clinic-name" className="mb-1.5 block text-sm font-medium text-on-surface-variant">
              Nombre de la clínica o institución
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <Building2 className="text-login-icon" size={18} />
              </div>
              <input
                id="clinic-name"
                type="text"
                value={clinicName}
                onChange={(event) => setClinicName(event.target.value)}
                placeholder="Clínica Dental ClinicWare"
                autoComplete="organization"
                required
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
            </div>
          </div>

          <div>
            <label htmlFor="institutional-role" className="mb-1.5 block text-sm font-medium text-on-surface-variant">
              Cargo o función
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <Stethoscope className="text-login-icon" size={18} />
              </div>
              <input
                id="institutional-role"
                type="text"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Odontólogo, asistente o administrador"
                required
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
            </div>
          </div>

          <div>
            <label htmlFor="institutional-message" className="mb-1.5 block text-sm font-medium text-on-surface-variant">
              Mensaje adicional <span className="font-normal text-login-muted">(opcional)</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-3">
                <MessageSquare className="text-login-icon" size={18} />
              </div>
              <textarea
                id="institutional-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Cuéntanos brevemente por qué necesitas acceso"
                rows="3"
                className="w-full resize-none rounded-xl border border-transparent bg-login-input py-3 pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-login-muted">
            <input
              type="checkbox"
              checked={confirmAffiliation}
              onChange={(event) => setConfirmAffiliation(event.target.checked)}
              required
              className="mt-1 h-4 w-4 accent-login-active"
            />
            <span>Confirmo que pertenezco a la clínica o institución indicada.</span>
          </label>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-login-active text-sm font-semibold text-on-primary shadow-login-button transition-all duration-200 hover:-translate-y-px hover:bg-login-active-hover hover:shadow-login-button-hover"
          >
            Enviar solicitud
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>
      </div>

      <div className="relative mt-8 flex w-full max-w-120 flex-col items-center gap-3">
        <nav aria-label="Navegación legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-login-muted">
          <Link to="/legal/terminos" className="transition-colors hover:text-login-active">Términos de servicio</Link>
          <Link to="/legal/privacidad" className="transition-colors hover:text-login-active">Privacidad</Link>
          <Link to="/legal/cookies" className="transition-colors hover:text-login-active">Cookies</Link>
          <Link to="/legal/seguridad" className="transition-colors hover:text-login-active">Seguridad</Link>
        </nav>
        <div className="flex items-center gap-1.5">
          <Smartphone className="text-login-muted" size={14} />
          <span className="text-xs text-login-muted">Soporte clínico 24/7</span>
        </div>
        <p className="text-center text-[11px] text-login-icon">DentalWeb Medical Systems © 2026. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};

export default InstitutionalAccess;
