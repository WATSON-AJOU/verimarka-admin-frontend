import type { AdminUser } from "../types/admin";

export function getAdminDisplayName(user: AdminUser | null) {
  if (!user) return "";
  return user.display_name || user.nickname || user.username || user.email.split("@")[0] || "관리자";
}

export function statusClass(value: string) {
  switch (value) {
    case "관리자":
      return "is-admin";
    case "완료":
    case "정상":
    case "등록 가능":
    case "ALLOW":
    case "찬성":
    case "활성":
      return "is-success";
    case "REVIEW":
    case "미정":
    case "미인증":
      return "is-warn";
    case "BLOCK":
    case "등록 거절":
    case "정지":
    case "반대":
    case "비활성":
      return "is-danger";
    case "진행중":
      return "is-blue";
    case "종료":
    case "없음":
      return "is-muted";
    default:
      return "is-default";
  }
}

export function formatNumber(value: number | null | undefined) {
  return (value ?? 0).toLocaleString();
}
