import React, { useState } from 'react';

// ==========================================
// 1. COMPONENTE: Formulario de Iniciar Sesión
// ==========================================
function LoginForm({ email, setEmail, password, setPassword, rememberMe, setRememberMe }) {
return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-5 animate-fadeIn">
    {/* Campo Email */}
    <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Correo Electrónico Clínico
        </label>
        <div className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400 font-medium">@</span>
        <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dra.montes@dentalweb.clinic"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition"
        />
        </div>
    </div>

    {/* Campo Contraseña */}
    <div className="space-y-1.5">
        <div className="flex justify-between items-center">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Contraseña
        </label>
        <a href="#forgot" className="text-xs text-[#0284c7] hover:underline font-semibold">
            ¿Olvidaste tu contraseña?
        </a>
        </div>
        <div className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        </span>
        <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••••"
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition"
        />
        <button type="button" aria-label="Mostrar contraseña" className="absolute right-3.5 text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        </button>
        </div>
    </div>

    {/* Checkbox Recordar y Estado Terminal */}
    <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
        <input 
            type="checkbox" 
            checked={rememberMe} 
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#0284c7] focus:ring-[#0284c7]"
        />
        <span className="text-slate-600 font-medium">Recordar sesión en esta terminal clínica</span>
        </label>
        
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>Terminal Certificada</span>
        </div>
    </div>

    {/* Botón Principal */}
    <button 
        type="submit"
        className="w-full bg-[#00609c] hover:bg-[#004f80] active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition duration-200 text-sm tracking-wide"
    >
        Iniciar Sesión en DentalWeb
    </button>

    {/* Divisor */}
    <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-wider">o accede con proveedor médico</span>
        <div className="flex-grow border-t border-slate-200"></div>
    </div>

    {/* Proveedor Externo */}
    <button 
        type="button"
        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-2.5 transition text-sm shadow-sm"
    >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        Continuar con Google Workspace Clínico
    </button>
    </form>
);
}

// ==========================================
// 2. COMPONENTE: Formulario de Registro
// ==========================================
function RegisterForm() {
const [fullName, setFullName] = useState('');
const [regEmail, setRegEmail] = useState('');
const [regPassword, setRegPassword] = useState('');
const [especialidad, setEspecialidad] = useState('Odontología General');

return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4 animate-fadeIn">
    {/* Nombre Completo */}
    <div className="space-y-1">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Nombre y Apellidos
        </label>
        <input 
        type="text" 
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Dr. Roberto Gómez"
        required
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition"
        />
    </div>

    {/* Correo Electrónico */}
    <div className="space-y-1">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Correo Electrónico Profesional
        </label>
        <input 
        type="email" 
        value={regEmail}
        onChange={(e) => setRegEmail(e.target.value)}
        placeholder="roberto.gomez@dentalweb.clinic"
        required
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition"
        />
    </div>

    {/* Especialidad */}
    <div className="space-y-1">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Especialidad Médica / Rol
        </label>
        <select 
        value={especialidad}
        onChange={(e) => setEspecialidad(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition"
        >
        <option>Odontología General</option>
        <option>Ortodoncia</option>
        <option>Endodoncia</option>
        <option>Cirugía Maxilofacial</option>
        <option>Administración / Recepción</option>
        </select>
    </div>

    {/* Contraseña */}
    <div className="space-y-1">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        Contraseña Segura
        </label>
        <input 
        type="password" 
        value={regPassword}
        onChange={(e) => setRegPassword(e.target.value)}
        placeholder="Mínimo 8 caracteres"
        required
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:bg-white transition"
        />
    </div>

    {/* Botón de Registro */}
    <button 
        type="submit"
        className="w-full bg-[#00609c] hover:bg-[#004f80] active:scale-[0.99] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition duration-200 text-sm tracking-wide mt-2"
    >
        Crear Cuenta en DentalWeb
    </button>
    </form>
);
}

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export default function Login() {
const [activeTab, setActiveTab] = useState('login'); // 'login' o 'register'
const [email, setEmail] = useState('dra.montes@dentalweb.clinic');
const [password, setPassword] = useState('••••••••••••••••');
const [rememberMe, setRememberMe] = useState(true);

return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] text-slate-800 font-sans">
    
    {/* PANEL IZQUIERDO: Branding y Estadísticas */}
    <section className="w-full lg:w-[48%] bg-gradient-to-br from-[#f0f4ff] via-[#e2ecff] to-[#d4e4fc] p-6 sm:p-10  flex flex-col justify-between border-r border-slate-200/60">
        <header className="space-y-6">
        <div className="flex items-center gap-2">
            <div className="bg-[#0284c7] text-white p-2 rounded-xl shadow-md flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            </div>
            <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">DentalWeb</span>
            <span className="text-[10px] uppercase tracking-widest text-[#0284c7] font-semibold">Clinical Elite</span>
            </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-blue-100/80 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold text-[#0284c7]">
            <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse"></span>
            V2.4 • HIPAA & NOM SALUD
        </div>

        <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Gestión inteligente para clínicas odontológicas
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Centraliza citas, odontograma 3D interactivo, expedientes clínicos digitales, recetas y control multisede en una sola suite médica segura.
            </p>
        </div>
        </header>

        <article className="my-8 relative rounded-2xl overflow-hidden shadow-2xl border border-white/60 bg-slate-900 group">
        <img 
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80" 
            alt="Clínica odontológica moderna con tecnología 3D" 
            className="w-full h-56 sm:h-64 object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-between p-4 text-white">
            <div className="flex justify-between items-start">
            <span className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Odontograma Cloud 3D
            </span>
            </div>
            <div className="flex justify-between items-end text-xs font-medium">
            <span className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                🔒 Cifrado SHA-256 Clínico
            </span>
            <span className="bg-emerald-600/90 text-emerald-100 px-2.5 py-1 rounded-md">
                99.98% Uptime
            </span>
            </div>
        </div>
        </article>

        <footer>
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/80 p-4 rounded-xl flex items-center gap-4 shadow-sm">
            <div className="flex -space-x-2 overflow-hidden">
            <span className="inline-block w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">D</span>
            <span className="inline-block w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">O</span>
            <span className="inline-block w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">C</span>
            </div>
            <div>
            <p className="text-sm font-bold text-slate-900">450+ Clínicas</p>
            <p className="text-xs text-slate-500">1.2M expedientes y recetas procesadas</p>
            </div>
        </div>
        </footer>
    </section>

    {/* PANEL DERECHO: Contenedor Dinámico de Formularios */}
    <section className="w-full lg:w-[52%] bg-white p-6 sm:p-10  flex flex-col justify-between">
        
        {/* Barra superior de navegación por pestañas */}
        <header className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button 
                onClick={() => setActiveTab('login')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
                Iniciar Sesión
            </button>
            <button 
                onClick={() => setActiveTab('register')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
                Crear Cuenta
            </button>
            </div>

        </div>

        </header>

        {/* Zona Dinámica (Se oculta uno y aparece el otro según el estado activeTab) */}
        <div className="my-auto max-w-md w-full mx-auto py-8 transition-all duration-300">
        <div className="mb-6 space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {activeTab === 'login' ? 'Bienvenido a DentalWeb' : 'Registro de Nueva Cuenta'}
            </h2>
            <p className="text-slate-500 text-sm">
            {activeTab === 'login' 
                ? 'Inicia sesión con tus credenciales clínicas o corporativas.' 
                : 'Completa los datos profesionales para unirte a la red médica.'}
            </p>
        </div>

        {/* Renderizado condicional limpio basado en el estado */}
        {activeTab === 'login' ? (
            <LoginForm 
            email={email} 
            setEmail={setEmail} 
            password={password} 
            setPassword={setPassword} 
            rememberMe={rememberMe} 
            setRememberMe={setRememberMe} 
            />
        ) : (
            <RegisterForm />
        )}

        {/* Enlace alternativo rápido en el pie del formulario */}
        <p className="text-center text-xs text-slate-500 pt-6">
            {activeTab === 'login' ? (
            <>¿No tienes una cuenta? <button onClick={() => setActiveTab('register')} className="text-[#0284c7] font-semibold hover:underline">Crear cuenta de usuario</button></>
            ) : (
            <>¿Ya tienes una cuenta? <button onClick={() => setActiveTab('login')} className="text-[#0284c7] font-semibold hover:underline">Inicia sesión aquí</button></>
            )}
        </p>
        </div>

        {/* Footer Derecho */}
        <footer className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-600">Servidor DentalWeb Central: Operativo (Latencia 18ms)</span>
        </div>
        <div className="flex items-center gap-4">
            <a href="#soporte" className="hover:underline">Soporte 24/7 Clínico</a>
            <span>•</span>
            <span className="font-mono">SSL 256-BIT</span>
        </div>
        </footer>

    </section>

    </main>
);
}