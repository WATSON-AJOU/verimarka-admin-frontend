import { useEffect, useState } from "react";
import { useAdminResource } from "./useAdminResource";
import { mutateAdminJson } from "../lib/api";
import type { AdminUserDetail } from "../types/admin";

export function useUserDetail(userId: string | undefined) {
  const [activityPage, setActivityPage] = useState(1);
  const [roleValue, setRoleValue] = useState("일반회원");
  const [statusValue, setStatusValue] = useState("정상");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const resource = useAdminResource<AdminUserDetail>(
    userId ? `/api/accounts/admin/users/${userId}/?page=${activityPage}&page_size=10` : null,
  );

  useEffect(() => {
    if (!resource.data) return;

    setRoleValue(resource.data.role);
    setStatusValue(resource.data.status);
    setSaveError("");
    setSaveMessage("");
  }, [resource.data]);

  useEffect(() => {
    setActivityPage(1);
  }, [userId]);

  async function saveField(field: "role" | "status", value: string, successMessage: string) {
    if (!userId || !resource.data || value === resource.data[field]) return;

    const setSaving = field === "role" ? setSavingRole : setSavingStatus;
    setSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      const next = await mutateAdminJson<AdminUserDetail>(`/api/accounts/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
      resource.setData(next);
      setSaveMessage(successMessage);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : field === "role"
            ? "권한 저장에 실패했습니다."
            : "계정 상태 저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  return {
    ...resource,
    activityPage,
    setActivityPage,
    roleValue,
    setRoleValue,
    statusValue,
    setStatusValue,
    saveError,
    saveMessage,
    savingRole,
    savingStatus,
    saveRole: () => saveField("role", roleValue, "권한이 저장되었습니다."),
    saveStatus: () => saveField("status", statusValue, "계정 상태가 저장되었습니다."),
  };
}
