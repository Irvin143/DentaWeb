import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-blue-600">
            DentaWeb
          </h1>

          <div className="flex gap-6 text-gray-600">
            <a href="#" className="hover:text-blue-600">
              Inicio
            </a>
            <a href="#" className="hover:text-blue-600">
              Citas
            </a>
            <a href="#" className="hover:text-blue-600">
              Pacientes
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl bg-white p-10 text-center shadow">
          <h2 className="mb-4 text-4xl font-bold text-gray-800">
            Sistema de gestión dental
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-gray-500">
            Administra pacientes, odontólogos y citas desde un solo lugar.
          </p>

          <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
            Agendar cita
          </button>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Pacientes
            </h3>
            <p className="text-gray-500">
              Consulta y administra la información de los pacientes.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Citas
            </h3>
            <p className="text-gray-500">
              Organiza las citas y consulta la agenda.
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              Odontólogos
            </h3>
            <p className="text-gray-500">
              Gestiona los odontólogos y sus especialidades.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;