import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Shield, Smartphone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Password recovery request:', { email });
    setSubmitted(true);
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

        {!submitted ? (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-login-heading sm:text-2xl">¿Olvidaste tu contraseña?</h2>
              <p className="mt-1 text-sm text-login-muted">
                Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-on-surface-variant">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className="text-login-icon" size={18} />
                  </div>
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ejemplo@correo.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-login-active text-sm font-semibold text-on-primary shadow-login-button transition-all duration-200 hover:-translate-y-px hover:bg-login-active-hover hover:shadow-login-button-hover"
              >
                Enviar instrucciones
                <ArrowRight size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="text-center" aria-live="polite">
            <CheckCircle2 className="mx-auto mb-4 text-login-active" size={42} />
            <h2 className="text-xl font-bold text-login-heading sm:text-2xl">Revisa tu correo</h2>
            <p className="mt-2 text-sm leading-relaxed text-login-muted">
              Si existe una cuenta asociada a este correo, recibirás instrucciones para restablecer tu contraseña.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-login-active px-6 text-sm font-semibold text-on-primary shadow-login-button transition-all duration-200 hover:-translate-y-px hover:bg-login-active-hover hover:shadow-login-button-hover"
            >
              Volver a iniciar sesión
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {!submitted && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"
            >
              <ArrowLeft size={16} />
              Volver a iniciar sesión
            </button>
          </div>
        )}
      </div>

      <div className="relative mt-8 flex w-full max-w-120 flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <Shield className="text-login-active" size={14} />
            <span className="text-xs font-medium text-login-muted">Privacidad y seguridad HIPAA</span>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-login-border" />
          <Link to="/" className="text-xs font-medium text-login-muted transition-colors hover:text-login-active">
            Términos de servicio
          </Link>
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone className="text-login-muted" size={14} />
          <span className="text-xs text-login-muted">Soporte clínico 24/7</span>
        </div>
        <p className="text-center text-[11px] text-login-icon">DentalWeb Medical Systems © 2026. Todos los derechos reservados.</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
