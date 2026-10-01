const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
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

  const response = await fetch(url, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
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
