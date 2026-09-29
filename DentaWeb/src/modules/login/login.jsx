import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Smartphone, Stethoscope, User } from 'lucide-react';

const DentalWebLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState('paciente');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password, rememberMe, activeTab });
  };

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

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-login-heading sm:text-2xl">
            Bienvenid@ de nuevo
          </h2>
          <p className="mt-1 text-sm text-login-muted">
            Ingresa a tu cuenta para gestionar tus citas y salud bucal
          </p>
        </div>

        {/* Tab Selector */}
        <div className="mb-6 flex rounded-full bg-login-input p-1">
          <button
            onClick={() => setActiveTab('paciente')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all duration-200 ${activeTab === 'paciente' ? 'bg-login-active text-on-primary shadow-login-tab' : 'text-login-muted'}`}
          >
            <User size={16} />
            Paciente
          </button>
          <button
            onClick={() => setActiveTab('clinica')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-all duration-200 ${activeTab === 'clinica' ? 'bg-login-active text-on-primary shadow-login-tab' : 'text-login-muted'}`}
          >
            <Stethoscope size={16} />
            Personal de clínica
          </button>
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
                placeholder="ejemplo@correo.com"
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-4 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-on-surface-variant">
                Contraseña
              </label>
              <span className="rounded-full bg-login-active/10 px-2.5 py-1 text-[11px] font-semibold text-login-active">
                Acceso Paciente
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock className="text-login-icon" size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-transparent bg-login-input pl-12 pr-12 text-sm text-login-heading outline-none transition-all duration-200 focus:border-2 focus:border-login-active focus:bg-on-primary focus:shadow-login-input-focus"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword
                  ? <EyeOff className="text-login-icon" size={18} />
                  : <Eye className="text-login-icon" size={18} />
                }
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`flex h-5 w-5 items-center justify-center rounded border transition-all duration-200 ${rememberMe ? 'border-login-active bg-login-active' : 'border-login-border bg-transparent'}`}
              >
                {rememberMe && (
                  <svg className="text-on-primary" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-login-muted">
                Recordar mis datos
              </span>
            </label>
            <a href="#" className="text-sm font-medium text-login-active transition-colors hover:text-primary-container">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-login-active text-sm font-semibold text-on-primary shadow-login-button transition-all duration-200 hover:-translate-y-px hover:bg-login-active-hover hover:shadow-login-button-hover"
          >
            Iniciar sesión
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="h-px flex-1 bg-login-divider" />
          <span className="text-xs font-medium text-login-icon">
            o continuar con
          </span>
          <div className="h-px flex-1 bg-login-divider" />
        </div>

        {/* Social Buttons */}
        <div className="flex gap-3">
          <button
            className="flex h-12 flex-1 items-center justify-center gap-2.5 rounded-xl border border-transparent bg-login-input text-sm font-medium text-on-surface-variant transition-all duration-200 hover:border-login-social-border hover:bg-login-social-hover"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path className="text-login-google-blue" fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path className="text-login-google-green" fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path className="text-login-google-yellow" fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path className="text-login-google-red" fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            className="flex h-12 flex-1 items-center justify-center gap-2.5 rounded-xl border border-transparent bg-login-input text-sm font-medium text-on-surface-variant transition-all duration-200 hover:border-login-social-border hover:bg-login-social-hover"
          >
            <svg className="text-login-active" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 20v-4h4v4" />
              <path d="M17 20v-8h-4v3" />
              <path d="M7 10h.01" />
            </svg>
            Firma Digital
          </button>
        </div>

        {/* Register Link */}
        <p className="mt-8 text-center text-sm text-login-muted">
          ¿Aún no tienes cuenta?{' '}
          <a href="#" className="font-semibold text-primary-container transition-colors hover:text-login-active">
            Regístrate aquí
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="relative mt-8 flex w-full max-w-120 flex-col items-center gap-3">
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <Shield className="text-login-active" size={14} />
            <span className="text-xs font-medium text-login-muted">
              Privacidad y seguridad HIPAA
            </span>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-login-border" />
          <a href="#" className="text-xs font-medium text-login-muted transition-colors hover:text-login-active">
            Términos de servicio
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone className="text-login-muted" size={14} />
          <span className="text-xs text-login-muted">
            Soporte clínico 24/7
          </span>
        </div>
        <p className="text-center text-[11px] text-login-icon">
          DentalWeb Medical Systems © 2026. Todos los derechos reservados.
        </p>
      </div>

    </div>
  );
};

export default DentalWebLogin;