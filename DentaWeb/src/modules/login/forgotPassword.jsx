import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const correo = email.trim();
    if (!correo) {
      setErrorMessage("El correo electrónico es obligatorio.");
      return;
    }
    if (!EMAIL_RE.test(correo)) {
      setErrorMessage("Introduce un correo electrónico válido.");
      return;
    }
    setErrorMessage("");
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
              <h1 className="text-2xl font-bold tracking-tight text-primary-container">
                ClinicWare
              </h1>
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
              <h2 className="text-xl font-bold text-login-heading sm:text-2xl">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="mt-1 text-sm text-login-muted">
                Ingresa tu correo electrónico.
              </p>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="mb-1.5 block text-sm font-medium text-on-surface-variant"
                >
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
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="ejemplo@correo.com"
                    autoComplete="email"
                    required
                    className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
                  />
                </div>
              </div>

              {errorMessage && (
                <p className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-login-active text-sm font-semibold text-on-primary shadow-login-button transition-all duration-200 hover:-translate-y-px hover:bg-login-active-hover hover:shadow-login-button-hover"
              >
                Continuar
                <ArrowRight size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="text-center" aria-live="polite">
            <h2 className="text-xl font-bold text-login-heading sm:text-2xl">
              Restablecer la contraseña todavía no está disponible.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-login-muted">
              Puedes volver al inicio de sesión.
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-login-active px-6 text-sm font-semibold text-on-primary shadow-login-button transition-all duration-200 hover:-translate-y-px hover:bg-login-active-hover hover:shadow-login-button-hover"
            >
              Volver
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {!submitted && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"
            >
              <ArrowLeft size={16} />
              Volver
            </button>
          </div>
        )}
      </div>

      <div className="relative mt-8 flex w-full max-w-120 flex-col items-center gap-3">
        <nav
          aria-label="Navegación legal"
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-login-muted"
        >
          <Link
            to="/legal/terminos"
            className="transition-colors hover:text-login-active"
          >
            Términos de servicio
          </Link>
          <Link
            to="/legal/privacidad"
            className="transition-colors hover:text-login-active"
          >
            Privacidad
          </Link>
          <Link
            to="/legal/cookies"
            className="transition-colors hover:text-login-active"
          >
            Cookies
          </Link>
          <Link
            to="/legal/seguridad"
            className="transition-colors hover:text-login-active"
          >
            Seguridad
          </Link>
        </nav>
        <p className="text-center text-[11px] text-login-icon">
          DentalWeb Medical Systems © 2026. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
