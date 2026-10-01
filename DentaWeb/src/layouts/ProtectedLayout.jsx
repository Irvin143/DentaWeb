import { Navigate, Outlet } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";

export const getAuth = () => {
  try {
    return JSON.parse(sessionStorage.getItem("clinicware_auth"));
  } catch {
    return null;
  }
};

export default function ProtectedLayout() {
  const auth = getAuth();

  // Sin sesión, de vuelta al login (que está en "/")
  if (!auth?.token) return <Navigate to="/" replace />;

  return (
    <MainLayout paqueteRoles={auth.usuario?.paquete}>
      <Outlet />
    </MainLayout>
  );
}