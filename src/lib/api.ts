import { getStoredTokens, refreshAdminAccessToken } from "./auth";

export async function authenticatedAdminFetch(path: string, init?: RequestInit) {
  const stored = getStoredTokens();
  if (!stored) {
    throw new Error("관리자 로그인이 필요합니다.");
  }

  const requestWithAccess = async (access: string) =>
    fetch(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${access}`,
      },
    });

  let response = await requestWithAccess(stored.access);
  if (response.status !== 401) return response;

  const refreshed = await refreshAdminAccessToken(stored.refresh);
  return requestWithAccess(refreshed.access);
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
