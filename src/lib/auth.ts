import type { AuthTokens } from "../types/admin";
import { appLogger, createClientRequestId } from "./logger";

const ACCESS_TOKEN_KEY = "verimarka_admin_access";
const REFRESH_TOKEN_KEY = "verimarka_admin_refresh";

export const ADMIN_GOOGLE_OAUTH_CODE_KEY = "verimarka:admin:oauth:google:last-code";
export const ADMIN_KAKAO_OAUTH_CODE_KEY = "verimarka:admin:oauth:kakao:last-code";

export function getStoredTokens(): AuthTokens | null {
  const access = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export function storeTokens(tokens: AuthTokens) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function refreshAdminAccessToken(refresh: string) {
  const requestId = createClientRequestId();
  appLogger.info("admin.auth.refresh.request", {
    request_id: requestId,
    path: "/api/auth/token/refresh/",
    method: "POST",
  });

  const response = await fetch("/api/auth/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
    body: JSON.stringify({ refresh }),
  });

  const payload = await response.json().catch(() => ({}));
  appLogger.info("admin.auth.refresh.response", {
    request_id: response.headers.get("X-Request-Id") || requestId,
    response_id: response.headers.get("X-Response-Id"),
    path: "/api/auth/token/refresh/",
    method: "POST",
    status: response.status,
    ok: response.ok,
  });
  if (!response.ok || !payload.access) {
    throw new Error(payload.detail || "관리자 인증을 갱신할 수 없습니다.");
  }

  const nextTokens = {
    access: String(payload.access),
    refresh: payload.refresh ? String(payload.refresh) : refresh,
  };
  storeTokens(nextTokens);
  return nextTokens;
}

export function getGoogleLoginUrl() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  return (
    "https://accounts.google.com/o/oauth2/v2/auth" +
    "?response_type=code" +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&scope=openid%20email%20profile" +
    "&access_type=offline"
  );
}

export function getKakaoLoginUrl() {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/kakao/callback`;
  return (
    "https://kauth.kakao.com/oauth/authorize" +
    "?response_type=code" +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`
  );
}
