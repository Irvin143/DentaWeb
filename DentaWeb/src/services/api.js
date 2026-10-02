const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function obtenerToken() {
  try {
    const auth = JSON.parse(sessionStorage.getItem("clinicware_auth") || "null");
    return auth?.token ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const {
    body,
    query,
    headers = {},
    ...requestOptions
  } = options;

  const url = new URL(`${API_URL}${endpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const requestBody = body === undefined
    ? undefined
    : typeof body === "string"
      ? body
      : JSON.stringify(body);

  const token = obtenerToken();

  const response = await fetch(url, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: requestBody,
  });

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const message = typeof data === "object" && data?.error
      ? data.error
      : typeof data === "object" && data?.message
        ? data.message
        : response.statusText || "Error en la solicitud";

    throw new ApiError(message, {
      status: response.status,
      data,
    });
  }

  return data;
}

export const authApi = {
  login(payload) {
    return apiRequest("/api/login/login", {
      method: "POST",
      body: payload,
    });
  },

  register(payload) {
    return apiRequest("/api/login/registrar", {
      method: "POST",
      body: payload,
    });
  },
};

export const clinicasApi = {
  listar() {
    return apiRequest("/api/clinicas", { method: "GET" });
  },

  crear(payload) {
    return apiRequest("/api/clinicas", { method: "POST", body: payload });
  },

  actualizar(id, payload) {
    return apiRequest(`/api/clinicas/${id}`, { method: "PUT", body: payload });
  },

  eliminar(id) {
    return apiRequest(`/api/clinicas/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/clinicas/${id}/reactivar`, { method: "PATCH" });
  },
};

export const pacientesApi = {
  listar() {
    return apiRequest("/api/pacientes", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/pacientes", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/pacientes/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/pacientes/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/pacientes/${id}/reactivar`, { method: "PUT" });
  },
};

export const odontologosApi = {
  listar() {
    return apiRequest("/api/odontologos", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/odontologos", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/odontologos/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/odontologos/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/odontologos/${id}/reactivar`, { method: "PATCH" });
  },
};

export const especialidadesApi = {
  listar() {
    return apiRequest("/api/especialidades", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/especialidades", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/especialidades/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/especialidades/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/especialidades/${id}/reactivar`, { method: "PUT" });
  },
};

export const consultoriosApi = {
  listar() {
    return apiRequest("/api/consultorios", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/consultorios", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/consultorios/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/consultorios/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/consultorios/${id}/reactivar`, { method: "PATCH" });
  },
};

export const estudiosApi = {
  listar() {
    return apiRequest("/api/estudios", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/estudios", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/estudios/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/estudios/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/estudios/${id}/reactivar`, { method: "PUT" });
  },
};

export const rolesApi = {
  listar() {
    return apiRequest("/api/roles", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/roles", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/roles/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/roles/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/roles/${id}/reactivar`, { method: "PATCH" });
  },
};

export const paquetesApi = {
  listar() {
    return apiRequest("/api/paquetes-roles", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/paquetes-roles", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/paquetes-roles/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/paquetes-roles/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/paquetes-roles/${id}/reactivar`, { method: "PATCH" });
  },
};

export const serviciosApi = {
  listar() {
    return apiRequest("/api/servicios", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/servicios", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/servicios/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/servicios/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/servicios/${id}/reactivar`, { method: "PATCH" });
  },
};

export const tiposCitaApi = {
  listar() {
    return apiRequest("/api/tipos-cita", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/tipos-cita", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/tipos-cita/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/tipos-cita/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/tipos-cita/${id}/reactivar`, { method: "PATCH" });
  },
};

export const tiposUsuarioApi = {
  listar() {
    return apiRequest("/api/tipos-usuario", { method: "GET" });
  },
  crear(payload) {
    return apiRequest("/api/tipos-usuario", { method: "POST", body: payload });
  },
  actualizar(id, payload) {
    return apiRequest(`/api/tipos-usuario/${id}`, { method: "PUT", body: payload });
  },
  eliminar(id) {
    return apiRequest(`/api/tipos-usuario/${id}`, { method: "DELETE" });
  },

  reactivar(id) {
    return apiRequest(`/api/tipos-usuario/${id}/reactivar`, { method: "PATCH" });
  },
};