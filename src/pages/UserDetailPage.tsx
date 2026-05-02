import { useParams } from "react-router-dom";
import { ErrorBlock, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { DetailPageHeader } from "../components/common/DetailPrimitives";
import { UserActivityTable } from "../components/users/UserActivityTable";
import { UserDetailControls } from "../components/users/UserDetailControls";
import { UserInfoSections } from "../components/users/UserInfoSections";
import { useUserDetail } from "../hooks/useUserDetail";

export default function UserDetailPage() {
  const { userId } = useParams();
  const detail = useUserDetail(userId);

  return (
    <SectionLayout title="유저 상세">
      {detail.loading ? <LoadingBlock /> : null}
      {detail.error ? <ErrorBlock message={detail.error} /> : null}
      {detail.data ? (
        <article className="admin-card detail-shell">
          <DetailPageHeader title="유저 상세" headline={detail.data.email} backTo="/users" backLabel="목록으로" status={detail.data.status} />
          <UserDetailControls
            roleValue={detail.roleValue}
            statusValue={detail.statusValue}
            currentRole={detail.data.role}
            currentStatus={detail.data.status}
            savingRole={detail.savingRole}
            savingStatus={detail.savingStatus}
            onRoleChange={detail.setRoleValue}
            onStatusChange={detail.setStatusValue}
            onSaveRole={() => void detail.saveRole()}
            onSaveStatus={() => void detail.saveStatus()}
            saveError={detail.saveError}
            saveMessage={detail.saveMessage}
          />
          <UserInfoSections user={detail.data} />
          <UserActivityTable
            activities={detail.data.recent_activities}
            totalCount={detail.data.activity_total_count}
            page={detail.data.activity_page}
            totalPages={detail.data.activity_total_pages}
            loading={detail.loading}
            onPrev={() => detail.setActivityPage((current) => Math.max(1, current - 1))}
            onNext={() => detail.setActivityPage((current) => Math.min(detail.data!.activity_total_pages, current + 1))}
          />
        </article>
      ) : null}
    </SectionLayout>
  );
}
