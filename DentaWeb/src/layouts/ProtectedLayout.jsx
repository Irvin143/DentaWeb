import { Navigate, Outlet, useLocation } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { PERMISOS_RUTAS, puedeVer, primeraRutaPermitida } from "../config/permisos.js";

export const getAuth = () => {
  try {
    return JSON.parse(sessionStorage.getItem("clinicware_auth"));
  } catch {
    return null;
  }
};

export default function ProtectedLayout() {
  const auth = getAuth();
  const { pathname } = useLocation();

  // Sin sesión, de vuelta al login (que está en "/")
  if (!auth?.token) return <Navigate to="/" replace />;

  if (Object.hasOwn(PERMISOS_RUTAS, pathname) && !puedeVer(pathname, auth.usuario)) {
    return <Navigate to={primeraRutaPermitida(auth.usuario) ?? "/"} replace />;
  }

  return (
    <MainLayout paqueteRoles={auth.usuario?.paquete}>
      <Outlet />
    </MainLayout>
  );
}