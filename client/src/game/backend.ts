export const BACKEND_URL = import.meta.env.DEV
    ? "ws://localhost:2567"
    : import.meta.env.VITE_BACKEND_URL;

export const BACKEND_HTTP_URL = BACKEND_URL.replace(/^ws/, "http");
