import { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api.js";
import { borrarSesion, getAuth, guardarSesion, primeraRutaPermitida } from "../../config/permisos.js";

let avisoCierreHasta = 0;

const DentalWebLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cierreMensaje, setCierreMensaje] = useState(() => Date.now() < avisoCierreHasta);

  const navigate = useNavigate();
  const location = useLocation();
  const redireccion = useRef(null);

  useEffect(() => {
    return () => {
      if (redireccion.current) clearTimeout(redireccion.current);
    };
  }, []);

  if (location.state?.sesionCerrada) {
    if (Date.now() >= avisoCierreHasta) avisoCierreHasta = Date.now() + 3000;
    if (!cierreMensaje) setCierreMensaje(true);
  }

  useEffect(() => {
    if (!location.state?.sesionCerrada) return;
    if (Date.now() >= avisoCierreHasta) avisoCierreHasta = Date.now() + 3000;
    navigate("/", { replace: true, state: null });
  }, [location.state, navigate]);

  useEffect(() => {
    if (!cierreMensaje) return;
    const restante = Math.max(0, avisoCierreHasta - Date.now());
    const aviso = setTimeout(() => setCierreMensaje(false), restante);
    return () => clearTimeout(aviso);
  }, [cierreMensaje]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage("");
    setSuccessMessage("");
    setCierreMensaje(false);

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password.trim()) {
      setErrorMessage("El correo y la contraseña son obligatorios.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        correo: normalizedEmail,
        contrasena: password,
      };
      const response = await authApi.login(payload);

      const destino = primeraRutaPermitida(response.usuario);
      if (!destino) {
        borrarSesion();
        setErrorMessage("Tu cuenta no tiene acceso a ninguna pantalla.");
        return;
      }

      guardarSesion({ token: response.token, usuario: response.usuario }, rememberMe);
      setSuccessMessage("Sesión iniciada correctamente.");
      redireccion.current = setTimeout(() => {
        navigate(destino, { replace: true });
      }, 1000);
    } catch (error) {
      console.error("Login falló:", error?.status, error?.message, error?.data);
      if (error?.status === 400 || error?.status === 401) {
        setErrorMessage("El correo o la contraseña no son válidos.");
      } else {
        setErrorMessage("No fue posible iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      if (!redireccion.current) setIsSubmitting(false);
    }
  };

  const destinoSesion = primeraRutaPermitida(getAuth()?.usuario);
  if (destinoSesion && !successMessage) {
    return <Navigate to={destinoSesion} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-login-background px-4 py-8">
      {/* Background decorative gradient */}
      <div className="fixed inset-0 pointer-events-none bg-login-backdrop" />

      {/* Main Card */}
      <div className="relative w-full max-w-120 rounded-3xl bg-on-primary p-8 shadow-login-card sm:p-10">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
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
            Bienvenid@ de nuevo
          </h2>
          <p className="mt-1 text-sm text-login-muted">
            Ingresa a tu cuenta para gestionar tus citas y salud bucal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-on-surface-variant">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail className="text-login-icon" size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@correo.com"
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="mb-1.5">
              <label className="text-sm font-medium text-on-surface-variant">
                Contraseña
              </label>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="text-login-icon" size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-12 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="text-login-icon" size={18} />
                ) : (
                  <Eye className="text-login-icon" size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex flex-nowrap items-center justify-between gap-2">
            <label className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 items-center justify-center rounded border transition-all duration-200 ${rememberMe ? "border-login-active bg-login-active" : "border-login-border bg-transparent"}`}
              >
                {rememberMe && (
                  <svg
                    className="text-on-primary"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <span className="whitespace-nowrap text-xs text-login-muted sm:text-sm">
                Mantener sesión iniciada
              </span>
            </label>
            <Link
              to="/recuperar-contrasena"
              className="shrink-0 whitespace-nowrap text-xs font-medium text-login-active transition-colors hover:text-primary-container sm:text-sm"
            >
              ¿Olvidaste tu contraseña?
            </Link>{" "}
          </div>

          {errorMessage && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="rounded-xl bg-login-active/10 px-4 py-3 text-sm text-primary" role="status" aria-live="polite">
              {successMessage}
            </p>
          )}

          {cierreMensaje && (
            <p className="rounded-xl bg-login-active/10 px-4 py-3 text-sm text-primary" role="status" aria-live="polite">
              Sesión cerrada correctamente.
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || Boolean(successMessage)}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-login-active text-sm font-semibold text-on-primary shadow-login-button transition-all duration-200 hover:-translate-y-px hover:bg-login-active-hover hover:shadow-login-button-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-6 text-center text-sm text-login-muted">
          ¿Aún no tienes cuenta?{" "}
          <Link
            to="/registro"
            className="font-semibold text-primary-container transition-colors hover:text-login-active"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>

      {/* Footer */}
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

export default DentalWebLogin;
