import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Smartphone,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apePat, setApePat] = useState("");
  const [apeMat, setApeMat] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      correo: email,
      contrasena: password,
      nombre,
      ape_pat: apePat,
      ape_mat: apeMat || null,
    };

    console.log("Registration payload:", payload);
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

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-login-heading sm:text-2xl">
            Crear cuenta
          </h2>
          <p className="mt-1 text-sm text-login-muted">
            Regístrate para gestionar tus citas y tu salud bucal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="register-name"
              className="mb-1.5 block text-sm font-medium text-on-surface-variant"
            >
              Nombre(s)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <UserRound className="text-login-icon" size={18} />
              </div>
              <input
                id="register-name"
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ana"
                autoComplete="given-name"
                required
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-last-name"
              className="mb-1.5 block text-sm font-medium text-on-surface-variant"
            >
              Apellido paterno
            </label>
            <input
              id="register-last-name"
              type="text"
              value={apePat}
              onChange={(event) => setApePat(event.target.value)}
              placeholder="Pérez"
              autoComplete="family-name"
              required
              className="h-12 w-full rounded-xl border border-transparent bg-login-input px-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
            />
          </div>

          <div>
            <label
              htmlFor="register-second-last-name"
              className="mb-1.5 block text-sm font-medium text-on-surface-variant"
            >
              Apellido materno{" "}
              <span className="font-normal text-login-icon">(opcional)</span>
            </label>
            <input
              id="register-second-last-name"
              type="text"
              value={apeMat}
              onChange={(event) => setApeMat(event.target.value)}
              placeholder="García"
              autoComplete="additional-name"
              className="h-12 w-full rounded-xl border border-transparent bg-login-input px-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="mb-1.5 block text-sm font-medium text-on-surface-variant"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <Mail className="text-login-icon" size={18} />
              </div>
              <input
                id="register-email"
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

          <div>
            <label
              htmlFor="register-password"
              className="mb-1.5 block text-sm font-medium text-on-surface-variant"
            >
              Contraseña
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="text-login-icon" size={18} />
              </div>
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-12 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="text-login-icon" size={18} />
                ) : (
                  <Eye className="text-login-icon" size={18} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 block text-sm font-medium text-on-surface-variant"
            >
              Confirmar contraseña
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="text-login-icon" size={18} />
              </div>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                minLength={8}
                required
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-12 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación de contraseña"
                    : "Mostrar confirmación de contraseña"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <EyeOff className="text-login-icon" size={18} />
                ) : (
                  <Eye className="text-login-icon" size={18} />
                )}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-login-muted">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              required
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-200 ${acceptTerms ? "border-login-active bg-login-active" : "border-login-border bg-transparent"}`}
            >
              {acceptTerms && (
                <Check className="text-on-primary" size={13} strokeWidth={3} />
              )}
            </span>
            <span>
              Acepto los{" "}
              <Link
                to="/legal/terminos"
                className="font-semibold text-primary-container hover:text-login-active"
              >
                términos de servicio
              </Link>{" "}
              y la{" "}
              <Link
                to="/legal/privacidad"
                className="font-semibold text-primary-container hover:text-login-active"
              >
                política de privacidad
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-login-active text-sm font-semibold text-on-primary shadow-login-button transition-all duration-200 hover:-translate-y-px hover:bg-login-active-hover hover:shadow-login-button-hover"
          >
            Crear cuenta
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-container transition-colors hover:text-login-active"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>
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
        <div className="flex items-center gap-1.5">
          <Smartphone className="text-login-muted" size={14} />
          <span className="text-xs text-login-muted">Soporte clínico 24/7</span>
        </div>
        <p className="text-center text-[11px] text-login-icon">
          DentalWeb Medical Systems © 2026. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Register;
