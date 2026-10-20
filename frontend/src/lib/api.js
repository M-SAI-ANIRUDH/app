import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("bta_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const imgSrc = (url) => {
  if (!url) return "/placeholder.svg";
  if (url.startsWith("http")) return url;
  return `${BACKEND_URL}${url}`;
};

export const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export const formatApiError = (e, fallback = "Something went wrong. Please try again.") => {
  const detail = e?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d?.msg || "").filter(Boolean).join(" ") || fallback;
  return fallback;
};
