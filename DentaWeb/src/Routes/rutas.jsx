import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../modules/login/login.jsx";
import Register from "../modules/login/register.jsx";
import InstitutionalAccess from "../modules/login/institutionalAccess.jsx";
import ForgotPassword from "../modules/login/forgotPassword.jsx";
import Terms from "../modules/legal/terminos.jsx";
import Privacy from "../modules/legal/privacidad.jsx";
import Cookies from "../modules/legal/cookies.jsx";
import Security from "../modules/legal/seguridad.jsx";
import ClinicasPage from "../modules/clinicas/ClinicasPage.jsx";
import PacientesPage from "../modules/pacientes/PacientesPage.jsx";
import OdontologosPage from "../modules/odontologos/OdontologosPage.jsx";
import EspecialidadesPage from "../modules/especialidades/EspecialidadesPage.jsx";
import ConsultoriosPage from "../modules/consultorios/ConsultorioPage.jsx";
import EstudiosPage from "../modules/estudios/EstudiosPage.jsx";
import RolesPage from "../modules/roles/RolesPage.jsx";
import PaquetesRolesPage from "../modules/paqueteRol/PaqueteRolPage.jsx";
import ServiciosPage from "../modules/servicios/ServiciosPage.jsx"; 
import TipoCitaPage from "../modules/tipoCita/TipoCItaPage.jsx";  

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/solicitar-acceso" element={<InstitutionalAccess />} />
        <Route path="/recuperar-contrasena" element={<ForgotPassword />} />
        <Route path="/legal/terminos" element={<Terms />} />
        <Route path="/legal/privacidad" element={<Privacy />} />
        <Route path="/legal/cookies" element={<Cookies />} />
        <Route path="/legal/seguridad" element={<Security />} />
        <Route path="/clinicas" element={<ClinicasPage />} />
        <Route path="/pacientes" element={<PacientesPage />} />
        <Route path="/odontologos" element={<OdontologosPage />} />
        <Route path="/especialidades" element={<EspecialidadesPage />} />
        <Route path="/consultorios" element={<ConsultoriosPage />} />
        <Route path="/estudios" element={<EstudiosPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/paquetes" element={<PaquetesRolesPage />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/tipos-cita" element={<TipoCitaPage />} />
        {/* <Route path="/administracion" element={<Panel />}>
          <Route index element={<PanelCitas/>}/>
          <Route path="rituales" element={<PanelRituales />} />
          <Route path="citas" element={<PanelCitas />} />
          <Route path="satori" element={<PanelSatori />} />
        </Route> */}
      </Routes>
    </BrowserRouter>
  );
}
