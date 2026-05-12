/**
 * Cliente API, sesión y utilidades compartidas (todas las pantallas).
 */
const TOKEN_KEY = "mesa_token";
const USER_KEY = "mesa_user";

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

/**
 * Validación mínima para enviar el login (compatible con contraseñas ya guardadas en MongoDB).
 * @returns {string} mensaje de error o cadena vacía si puede intentarse el inicio de sesión
 */
function validateLoginPasswordSubmit(password) {
  if (!password) return "La contraseña es obligatoria.";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (password.length > 128) return "La contraseña no puede superar 128 caracteres.";
  return "";
}

/**
 * Actualiza pistas visuales de fortaleza (no bloquea el envío).
 */
function updateLoginPasswordHints(password) {
  const rules = document.querySelectorAll("#passwordRules [data-rule]");
  const checks = {
    len: password.length >= 8 && password.length <= 128,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  rules.forEach((el) => {
    const key = el.getAttribute("data-rule");
    el.classList.toggle("password-rule-ok", !!checks[key]);
    el.classList.toggle("password-rule-no", password.length > 0 && !checks[key]);
  });
}

const API = {
  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(path, { ...options, headers });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || "Respuesta no válida del servidor." };
    }

    if (!res.ok) {
      if (res.status === 401 && localStorage.getItem(TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = "index.html";
      }
      const msg = data.message || `Error ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  get(path) {
    return this.request(path, { method: "GET" });
  },

  post(path, body) {
    return this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(path, body) {
    return this.request(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(path) {
    return this.request(path, { method: "DELETE" });
  },
};

const Auth = {
  login(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "index.html";
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "index.html";
    }
  },
};

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

function showAlert(containerId, message, type = "info") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
  if (type === "success" || type === "info") {
    setTimeout(() => {
      el.innerHTML = "";
    }, 5000);
  }
}

window.API = API;
window.Auth = Auth;
window.formatDate = formatDate;
window.showAlert = showAlert;
window.validateLoginPasswordSubmit = validateLoginPasswordSubmit;
window.updateLoginPasswordHints = updateLoginPasswordHints;
