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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#f0f5f5' }}>

      {/* Background decorative gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(19,111,131,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(56,178,172,0.06) 0%, transparent 50%)'
      }} />

      {/* Main Card */}
      <div className="relative w-full max-w-[480px] bg-white rounded-3xl p-8 sm:p-10"
        style={{
          boxShadow: '0 8px 24px -4px rgba(19, 111, 131, 0.06), 0 2px 6px -1px rgba(19, 111, 131, 0.03)'
        }}>

        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(19,111,131,0.08)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#136F83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5.5c-1.5-2-4-2.5-5.5-1.5S4 7.5 4.5 10c.5 2.5 2 5 3.5 7 .8 1.1 1.7 1.5 2.5 1.5s1.5-.5 1.5-1.5V5.5z" />
                <path d="M12 5.5c1.5-2 4-2.5 5.5-1.5S20 7.5 19.5 10c-.5 2.5-2 5-3.5 7-.8 1.1-1.7 1.5-2.5 1.5s-1.5-.5-1.5-1.5V5.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#136F83', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                ClinicWare
              </h1>
              <p className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: '#136F83', opacity: 0.6 }}>
                Plataforma Odontológica
              </p>
            </div>
          </div>
          <p className="text-sm text-center mt-2 leading-relaxed" style={{ color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ecosistema clínico digital para pacientes y especialistas dentales
          </p>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1E293B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Bienvenid@ de nuevo
          </h2>
          <p className="text-sm mt-1" style={{ color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ingresa a tu cuenta para gestionar tus citas y salud bucal
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-full p-1 mb-6" style={{ backgroundColor: '#F1F4F3' }}>
          <button
            onClick={() => setActiveTab('paciente')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeTab === 'paciente' ? '#2A9D8F' : 'transparent',
              color: activeTab === 'paciente' ? '#FFFFFF' : '#64748B',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: activeTab === 'paciente' ? '0 2px 8px rgba(42,157,143,0.3)' : 'none'
            }}
          >
            <User size={16} />
            Paciente
          </button>
          <button
            onClick={() => setActiveTab('clinica')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeTab === 'clinica' ? '#2A9D8F' : 'transparent',
              color: activeTab === 'clinica' ? '#FFFFFF' : '#64748B',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: activeTab === 'clinica' ? '0 2px 8px rgba(42,157,143,0.3)' : 'none'
            }}
          >
            <Stethoscope size={16} />
            Personal de clínica
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#3F484B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Mail size={18} style={{ color: '#94A3B8' }} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full h-12 pl-12 pr-4 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  backgroundColor: '#F1F4F3',
                  border: '1px solid transparent',
                  color: '#1E293B',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #2A9D8F';
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(42,157,143,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid transparent';
                  e.target.style.backgroundColor = '#F1F4F3';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium" style={{ color: '#3F484B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Contraseña
              </label>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2A9D8F', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Acceso Paciente
              </span>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock size={18} style={{ color: '#94A3B8' }} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-12 pr-12 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  backgroundColor: '#F1F4F3',
                  border: '1px solid transparent',
                  color: '#1E293B',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #2A9D8F';
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(42,157,143,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid transparent';
                  e.target.style.backgroundColor = '#F1F4F3';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPassword
                  ? <EyeOff size={18} style={{ color: '#94A3B8' }} />
                  : <Eye size={18} style={{ color: '#94A3B8' }} />
                }
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
                style={{
                  border: rememberMe ? 'none' : '1.5px solid #CBD5E1',
                  backgroundColor: rememberMe ? '#2A9D8F' : 'transparent',
                }}
              >
                {rememberMe && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm" style={{ color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Recordar mis datos
              </span>
            </label>
            <a href="#" className="text-sm font-medium transition-colors"
              style={{ color: '#2A9D8F', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              onMouseEnter={(e) => e.target.style.color = '#136F83'}
              onMouseLeave={(e) => e.target.style.color = '#2A9D8F'}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              backgroundColor: '#2A9D8F',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: '0 4px 14px rgba(42,157,143,0.35)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#238B7E';
              e.target.style.boxShadow = '0 6px 20px rgba(42,157,143,0.45)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#2A9D8F';
              e.target.style.boxShadow = '0 4px 14px rgba(42,157,143,0.35)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Iniciar sesión
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
          <span className="text-xs font-medium" style={{ color: '#94A3B8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            o continuar con
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#E2E8F0' }} />
        </div>

        {/* Social Buttons */}
        <div className="flex gap-3">
          <button
            className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2.5 text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: '#F1F4F3',
              color: '#3F484B',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#E8ECEB';
              e.target.style.border = '1px solid #D1D9D8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#F1F4F3';
              e.target.style.border = '1px solid transparent';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2.5 text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: '#F1F4F3',
              color: '#3F484B',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#E8ECEB';
              e.target.style.border = '1px solid #D1D9D8';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#F1F4F3';
              e.target.style.border = '1px solid transparent';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A9D8F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 20v-4h4v4" />
              <path d="M17 20v-8h-4v3" />
              <path d="M7 10h.01" />
            </svg>
            Firma Digital
          </button>
        </div>

        {/* Register Link */}
        <p className="text-center text-sm mt-8" style={{ color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          ¿Aún no tienes cuenta?{' '}
          <a href="#" className="font-semibold transition-colors"
            style={{ color: '#136F83' }}
            onMouseEnter={(e) => e.target.style.color = '#2A9D8F'}
            onMouseLeave={(e) => e.target.style.color = '#136F83'}>
            Regístrate aquí
          </a>
        </p>
      </div>

      {/* Footer */}
      <div className="relative mt-8 flex flex-col items-center gap-3 max-w-[480px] w-full">
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <Shield size={14} style={{ color: '#2A9D8F' }} />
            <span className="text-xs font-medium" style={{ color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Privacidad y seguridad HIPAA
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#CBD5E1' }} />
          <a href="#" className="text-xs font-medium transition-colors"
            style={{ color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            onMouseEnter={(e) => e.target.style.color = '#2A9D8F'}
            onMouseLeave={(e) => e.target.style.color = '#64748B'}>
            Términos de servicio
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <Smartphone size={14} style={{ color: '#64748B' }} />
          <span className="text-xs" style={{ color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Soporte clínico 24/7
          </span>
        </div>
        <p className="text-[11px] text-center" style={{ color: '#94A3B8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          DentalWeb Medical Systems © 2026. Todos los derechos reservados.
        </p>
      </div>

      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
    </div>
  );
};

export default DentalWebLogin;