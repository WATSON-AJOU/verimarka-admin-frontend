import { NavLink } from "react-router-dom";
import { useAdminResource } from "../hooks/useAdminResource";
import { formatNumber } from "../lib/format";
import { ErrorBlock, GradientThumb, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import type { DashboardData } from "../types/admin";

export default function DashboardPage() {
  const { data, loading, error } = useAdminResource<DashboardData>("/api/accounts/admin/dashboard/");

  return (
    <SectionLayout title="운영 현황">
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {data ? (
        <>
          <div className="dashboard-grid">
            <article className="admin-card metric-panel">
              <div className="panel-title">유저 통계</div>
              <div className="big-metric">{formatNumber(data.total_users)}</div>
              <div className="panel-caption">총 유저 수</div>
            </article>
            <article className="admin-card compact-panel">
              <div className="panel-title">유저 인증 현황</div>
              <strong>ID 인증 완료: {formatNumber(data.verified_users)}명</strong>
              <strong>투표 권한 보유: {formatNumber(data.vote_eligible_users)}명</strong>
            </article>
            <article className="admin-card metric-panel">
              <div className="panel-title">이미지 현황</div>
              <div className="big-metric">{formatNumber(data.total_images)}</div>
              <div className="panel-caption">누적 업로드 이미지</div>
            </article>
            <article className="admin-card metric-panel">
              <div className="panel-title">오늘 업로드</div>
              <div className="big-metric">{formatNumber(data.images_uploaded_today)}장</div>
              <div className="panel-caption">최근 24시간 기준</div>
            </article>
            <article className="admin-card compact-panel">
              <div className="panel-title">투표 진행 상황</div>
              <strong>진행 중: {formatNumber(data.active_votes)}건</strong>
              <strong>오늘 종료: {formatNumber(data.closing_votes_today)}건</strong>
            </article>
            <article className="admin-card metric-panel is-alert">
              <div className="panel-title">처리 대기</div>
              <div className="big-metric">{formatNumber(data.pending_jobs)}건</div>
              <div className="panel-caption">빠른 확인이 필요합니다.</div>
            </article>
          </div>

          <article className="admin-card feed-panel">
            <div className="list-head">
              <h2>최근 활동 피드</h2>
            </div>
            <ul className="feed-list">
              {data.recent_feed.map((item) => (
                <li key={`${item.date}-${item.email}-${item.title}`}>
                  <div className="feed-item">
                    <GradientThumb src={item.preview_url} size="small" />
                    <div className="feed-item-body">
                      <div className="feed-item-main">
                        <span>{item.date}</span>
                        <span>·</span>
                        <span>{item.email}</span>
                        <span>·</span>
                        <span>{item.title}</span>
                        <span>·</span>
                        <span>{item.result}</span>
                      </div>
                      {item.detail_path ? (
                        <NavLink to={item.detail_path} className="text-link">
                          상세보기
                        </NavLink>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </>
      ) : null}
    </SectionLayout>
  );
}
