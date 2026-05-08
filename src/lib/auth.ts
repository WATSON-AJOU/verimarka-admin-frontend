import type { AuthTokens } from "../types/admin";
import { appLogger, createClientRequestId } from "./logger";

const ACCESS_TOKEN_KEY = "verimarka_admin_access";
const REFRESH_TOKEN_KEY = "verimarka_admin_refresh";

export const ADMIN_GOOGLE_OAUTH_CODE_KEY = "verimarka:admin:oauth:google:last-code";
export const ADMIN_KAKAO_OAUTH_CODE_KEY = "verimarka:admin:oauth:kakao:last-code";
export const ADMIN_APPLE_OAUTH_CODE_KEY = "verimarka:admin:oauth:apple:last-code";
export const ADMIN_GOOGLE_OAUTH_STATE_KEY = "verimarka:admin:oauth:google:state";
export const ADMIN_KAKAO_OAUTH_STATE_KEY = "verimarka:admin:oauth:kakao:state";
export const ADMIN_APPLE_OAUTH_STATE_KEY = "verimarka:admin:oauth:apple:state";

export function getStoredTokens(): AuthTokens | null {
  const access = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!access) return null;
  return { access };
}

export function storeTokens(tokens: AuthTokens) {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function revokeAdminRefreshToken() {
  await fetch("/api/accounts/logout/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Request-Id": createClientRequestId() },
    credentials: "include",
  }).catch(() => undefined);
}

export async function refreshAdminAccessToken() {
  const requestId = createClientRequestId();
  appLogger.info("admin.auth.refresh.request", {
    request_id: requestId,
    path: "/api/auth/token/refresh/",
    method: "POST",
  });

  const response = await fetch("/api/auth/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
    credentials: "include",
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
  };
  storeTokens(nextTokens);
  return nextTokens;
}

export function getGoogleLoginUrl() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri =
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/auth/google/callback`;
  const state = crypto.randomUUID();
  window.sessionStorage.setItem(ADMIN_GOOGLE_OAUTH_STATE_KEY, state);
  return (
    "https://accounts.google.com/o/oauth2/v2/auth" +
    "?response_type=code" +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&scope=openid%20email%20profile" +
    "&access_type=offline" +
    `&state=${encodeURIComponent(state)}`
  );
}

export function getKakaoLoginUrl() {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
  const redirectUri =
    import.meta.env.VITE_KAKAO_REDIRECT_URI ||
    `${window.location.origin}/auth/kakao/callback`;
  const state = crypto.randomUUID();
  window.sessionStorage.setItem(ADMIN_KAKAO_OAUTH_STATE_KEY, state);
  return (
    "https://kauth.kakao.com/oauth/authorize" +
    "?response_type=code" +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`
  );
}

export function getAppleLoginUrl() {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Apple 로그인 설정이 누락되었습니다.");
  }
  const redirectUri =
    import.meta.env.VITE_APPLE_REDIRECT_URI ||
    `${window.location.origin}/auth/apple/callback`;
  const state = crypto.randomUUID();
  window.sessionStorage.setItem(ADMIN_APPLE_OAUTH_STATE_KEY, state);
  return (
    "https://appleid.apple.com/auth/authorize" +
    "?response_type=code" +
    "&response_mode=query" +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&scope=name%20email" +
    `&state=${encodeURIComponent(state)}`
  );
}
