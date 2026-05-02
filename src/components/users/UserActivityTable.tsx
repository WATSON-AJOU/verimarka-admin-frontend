import { NavLink } from "react-router-dom";
import { GradientThumb } from "../common/AdminShared";
import { DetailCard } from "../common/DetailPrimitives";
import type { RecentActivity } from "../../types/admin";

type UserActivityTableProps = {
  activities: RecentActivity[];
  totalCount: number;
  page: number;
  totalPages: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function UserActivityTable({
  activities,
  totalCount,
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
}: UserActivityTableProps) {
  return (
    <DetailCard title="최근 활동 로그" className="full-span">
      <div className="activity-log-head">
        <span className="subtle-text">전체 {totalCount.toLocaleString()}건</span>
      </div>
      <table className="mini-table">
        <thead>
          <tr>
            <th>미리보기</th>
            <th>파일명</th>
            <th>구분</th>
            <th>상태</th>
            <th>날짜</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={`${activity.title}-${activity.date}-${activity.result}`}>
              <td>
                <GradientThumb src={activity.preview_url} size="small" />
              </td>
              <td>{activity.title}</td>
              <td>{activity.meta || "-"}</td>
              <td>{activity.result}</td>
              <td>{activity.date}</td>
              <td>
                {activity.detail_path ? (
                  <NavLink className="table-link" to={activity.detail_path}>
                    {activity.detail_label || "상세보기"}
                  </NavLink>
                ) : (
                  <span className="subtle-text">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-pagination">
        <button type="button" className="ghost-button" onClick={onPrev} disabled={loading || page <= 1}>
          이전
        </button>
        <span className="subtle-text">
          {page} / {totalPages}
        </span>
        <button type="button" className="ghost-button" onClick={onNext} disabled={loading || page >= totalPages}>
          다음
        </button>
      </div>
    </DetailCard>
  );
}
