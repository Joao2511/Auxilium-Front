class Utils {
  static showMessageToast(type, title, message, timer = 5000) {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className =
        "fixed bottom-5 left-0 right-0 flex flex-col items-center pointer-events-none z-50 px-4";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className =
      "w-full max-w-md bg-white dark:bg-neutral-800 rounded-[14px] backdrop-blur-ios overflow-hidden pointer-events-auto shadow-xl mb-3";

    let iconClass, iconColor, badge;
    switch (type) {
      case "success":
        iconClass = "fa-check-circle";
        iconColor = "text-green-400";
        badge = "green";
        break;
      case "warning":
        iconClass = "fa-exclamation-triangle";
        iconColor = "text-yellow-400";
        badge = "yellow";
        break;
      case "error":
      default:
        iconClass = "fa-exclamation-circle";
        iconColor = "text-red-400";
        badge = "red";
    }

    toast.innerHTML = `
      <div class="flex items-start justify-between px-4 py-3 gap-4">
        <div class="flex items-start gap-3 flex-1">
          <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-${badge}-500/30">
            <i class="fas ${iconClass} ${iconColor} text-lg"></i>
          </div>
          <div>
            <h3 class="font-bold dark:text-white">${title}</h3>
            <p class="text-sm dark:text-white mt-1 leading-tight">${message}</p>
          </div>
        </div>
        <button class="close-toast bg-gray-300/50 dark:bg-neutral-700/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-600/50 transition-colors">
          <i class="fas fa-times dark:text-white"></i>
        </button>
      </div>
    `;

    toast.style.animation =
      "toastUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards";
    container.appendChild(toast);

    const autoRemoveTimer = setTimeout(() => Utils.removeToast(toast), timer);
    const closeBtn = toast.querySelector(".close-toast");
    closeBtn.addEventListener("click", () => {
      clearTimeout(autoRemoveTimer);
      Utils.removeToast(toast);
    });
  }

  static removeToast(toast) {
    toast.style.animation =
      "toastDown 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards";
    setTimeout(() => toast.remove(), 500);
  }

  static getAuthToken() {
    const v =
      localStorage.getItem("authToken") ??
      sessionStorage.getItem("authToken") ??
      "";
    if (!v || v === "undefined" || v === "null" || /^\s*$/.test(v)) return null;
    return v;
  }

  static setAuthToken(token, { persist = "local" } = {}) {
    if (persist === "session") sessionStorage.setItem("authToken", token);
    else localStorage.setItem("authToken", token);
  }

  static clearAuth() {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
  }

  static headersDefaultRequests(extra = {}) {
    const token = Utils.getAuthToken();
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      client_token:
        localStorage.getItem("client_token") ||
        sessionStorage.getItem("client_token") ||
        "",
      ...extra,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }
  static async apiFetch(
    path,
    {
      method = "GET",
      body = null,
      params = null,
      headers = {},
      timeout = 20000,
      raw = false,
      skipAuth = false,
    } = {}
  ) {
    const base = Utils.API_BASE_URL.replace(/\/+$/, "");
    const isAbs = /^https?:\/\//i.test(path);
    const url = new URL(
      isAbs ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`
    );

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.append(k, v);
      });
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    let res;
    try {
      const baseHeaders = Utils.headersDefaultRequests(headers);

      const isLogin =
        typeof path === "string" &&
        /\/(auth|usuarios)\/login(?:$|\?)/i.test(path);
      if (skipAuth || isLogin) {
        if ("Authorization" in baseHeaders) delete baseHeaders.Authorization;
      }

      res = await fetch(url.toString(), {
        method,
        headers: baseHeaders,
        body: body && !raw ? JSON.stringify(body) : body,
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(id);
      Utils.showMessageToast(
        "error",
        "Falha de rede",
        e.message || "Não foi possível conectar ao servidor."
      );
      throw e;
    }
    clearTimeout(id);

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const rawBody = await res.text();
    let data = null;
    if (ct.includes("application/json")) {
      try {
        data = JSON.parse(rawBody);
      } catch {}
    }

    if (!res.ok) {
      const msg =
        (data && (data.message || data.error || data.msg)) ||
        rawBody?.slice(0, 200) ||
        res.statusText ||
        "Erro inesperado";

      Utils.showMessageToast("error", `Erro ${res.status}`, msg);
      if (res.status === 401) {
      }
      throw new Error(`HTTP ${res.status} – ${msg}`);
    }

    return data !== null ? data : rawBody;
  }

  static api = {
    get: (path, params, opts) =>
      Utils.apiFetch(path, { method: "GET", params, ...(opts || {}) }),
    post: (path, body, opts) =>
      Utils.apiFetch(path, { method: "POST", body, ...(opts || {}) }),
    put: (path, body, opts) =>
      Utils.apiFetch(path, { method: "PUT", body, ...(opts || {}) }),
    delete: (path, params, opts) =>
      Utils.apiFetch(path, { method: "DELETE", params, ...(opts || {}) }),
  };

  static serializeJson(formOrString) {
    const serialized =
      typeof formOrString === "string"
        ? formOrString
        : window.$
        ? $(formOrString).serialize()
        : new URLSearchParams(new FormData(formOrString)).toString();
    return Object.fromEntries(new URLSearchParams(serialized));
  }

  static scrollParaTopo() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export default Utils;
