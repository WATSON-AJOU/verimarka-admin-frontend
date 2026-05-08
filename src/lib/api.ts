import { getStoredTokens, refreshAdminAccessToken } from "./auth";
import { appLogger, createClientRequestId } from "./logger";
import { captureSentryMessage } from "./sentry";

export class AdminApiError extends Error {
  status: number;
  requestId: string | null;
  responseId: string | null;
  path: string;

  constructor(
    message: string,
    options: { status: number; requestId?: string | null; responseId?: string | null; path: string },
  ) {
    super(message);
    this.name = "AdminApiError";
    this.status = options.status;
    this.requestId = options.requestId ?? null;
    this.responseId = options.responseId ?? null;
    this.path = options.path;
  }
}

export async function adminJsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const requestId = createClientRequestId();
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Request-Id", requestId);

  appLogger.info("admin.api.request", {
    request_id: requestId,
    path,
    method: init?.method || "GET",
  });

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
  });
  const payload = await response.json().catch(() => ({}));
  const responseRequestId = response.headers.get("X-Request-Id") || requestId;
  const responseId = response.headers.get("X-Response-Id");

  appLogger.info("admin.api.response", {
    request_id: responseRequestId,
    response_id: responseId,
    path,
    method: init?.method || "GET",
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const message =
      (payload as { detail?: string; message?: string; non_field_errors?: string[] }).detail ||
      (payload as { detail?: string; message?: string; non_field_errors?: string[] }).message ||
      (payload as { non_field_errors?: string[] }).non_field_errors?.[0] ||
      "관리자 요청 처리에 실패했습니다.";
    const error = new AdminApiError(message, {
      status: response.status,
      requestId: responseRequestId,
      responseId,
      path,
    });
    appLogger.error("admin.api.error", {
      path,
      status: response.status,
      request_id: responseRequestId,
      response_id: responseId,
      response: payload,
    });
    captureSentryMessage("admin.api.error", {
      level: response.status >= 500 ? "error" : "warning",
      extra: {
        path,
        status: response.status,
        request_id: responseRequestId,
        response_id: responseId,
        response: payload,
      },
    });
    throw error;
  }

  return payload as T;
}

export async function authenticatedAdminFetch(path: string, init?: RequestInit) {
  const stored = getStoredTokens();
  if (!stored) {
    throw new Error("관리자 로그인이 필요합니다.");
  }

  const requestId = createClientRequestId();
  const requestWithAccess = async (access: string) =>
    fetch(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${access}`,
        "X-Request-Id": requestId,
      },
      credentials: init?.credentials ?? "include",
    });

  appLogger.info("admin.authenticated_fetch.request", {
    request_id: requestId,
    path,
    method: init?.method || "GET",
  });

  let response = await requestWithAccess(stored.access);
  appLogger.info("admin.authenticated_fetch.response", {
    request_id: response.headers.get("X-Request-Id") || requestId,
    response_id: response.headers.get("X-Response-Id"),
    path,
    method: init?.method || "GET",
    status: response.status,
    ok: response.ok,
  });
  if (response.status !== 401) return response;

  const refreshed = await refreshAdminAccessToken();
  response = await requestWithAccess(refreshed.access);
  appLogger.info("admin.authenticated_fetch.retry_response", {
    request_id: response.headers.get("X-Request-Id") || requestId,
    response_id: response.headers.get("X-Response-Id"),
    path,
    method: init?.method || "GET",
    status: response.status,
    ok: response.ok,
  });
  return response;
}

export async function fetchAdminJson<T>(path: string): Promise<T> {
  const response = await authenticatedAdminFetch(path);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (payload as { detail?: string; message?: string }).detail ||
        (payload as { detail?: string; message?: string }).message ||
        "관리자 데이터를 불러오지 못했습니다.",
    );
  }
  return payload as T;
}

export async function mutateAdminJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await authenticatedAdminFetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (payload as { detail?: string; message?: string; non_field_errors?: string[] }).detail ||
        (payload as { detail?: string; message?: string; non_field_errors?: string[] }).message ||
        (payload as { non_field_errors?: string[] }).non_field_errors?.[0] ||
        "관리자 저장에 실패했습니다.",
    );
  }
  return payload as T;
}
