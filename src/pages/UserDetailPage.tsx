import { useEffect, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { ErrorBlock, GradientThumb, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { useAdminResource } from "../hooks/useAdminResource";
import { mutateAdminJson } from "../lib/api";
import { statusClass } from "../lib/format";
import type { AdminUserDetail } from "../types/admin";

export default function UserDetailPage() {
  const { userId } = useParams();
  const [activityPage, setActivityPage] = useState(1);
  const { data, loading, error, setData } = useAdminResource<AdminUserDetail>(
    userId ? `/api/accounts/admin/users/${userId}/?page=${activityPage}&page_size=10` : null,
  );
  const [roleValue, setRoleValue] = useState("일반회원");
  const [statusValue, setStatusValue] = useState("정상");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!data) return;
    setRoleValue(data.role);
    setStatusValue(data.status);
    setSaveError("");
    setSaveMessage("");
  }, [data]);

  useEffect(() => {
    setActivityPage(1);
  }, [userId]);

  const saveRole = async () => {
    if (!userId || !data || roleValue === data.role) return;
    setSavingRole(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const next = await mutateAdminJson<AdminUserDetail>(`/api/accounts/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ role: roleValue }),
      });
      setData(next);
      setSaveMessage("권한이 저장되었습니다.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "권한 저장에 실패했습니다.");
    } finally {
      setSavingRole(false);
    }
  };

  const saveStatus = async () => {
    if (!userId || !data || statusValue === data.status) return;
    setSavingStatus(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const next = await mutateAdminJson<AdminUserDetail>(`/api/accounts/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusValue }),
      });
      setData(next);
      setSaveMessage("계정 상태가 저장되었습니다.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "계정 상태 저장에 실패했습니다.");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <SectionLayout title="유저 상세">
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {data ? (
        <article className="admin-card detail-shell">
          <div className="page-head with-action">
            <div>
              <h1>유저 상세</h1>
              <div className="hero-name">{data.email}</div>
            </div>
            <div className="page-head-actions">
              <NavLink className="ghost-button" to="/users">
                목록으로
              </NavLink>
              <span className={`pill ${statusClass(data.status)}`}>{data.status}</span>
            </div>
          </div>

          <div className="control-grid">
            <div className="control-panel">
              <label>권한 변경</label>
              <div className="inline-controls">
                <select className="filter-select" value={roleValue} onChange={(event) => setRoleValue(event.target.value)}>
                  <option value="일반회원">일반회원</option>
                  <option value="관리자">관리자</option>
                </select>
                <button className="action-button secondary" onClick={() => void saveRole()} disabled={savingRole || roleValue === data.role}>
                  {savingRole ? "저장 중..." : "권한 저장"}
                </button>
              </div>
            </div>
            <div className="control-panel">
              <label>계정 상태 변경</label>
              <div className="inline-controls">
                <select className="filter-select" value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
                  <option value="정상">정상</option>
                  <option value="정지">정지</option>
                </select>
                <button className="action-button secondary" onClick={() => void saveStatus()} disabled={savingStatus || statusValue === data.status}>
                  {savingStatus ? "저장 중..." : "상태 저장"}
                </button>
              </div>
            </div>
          </div>

          {saveError ? <p className="control-feedback is-error">{saveError}</p> : null}
          {saveMessage ? <p className="control-feedback is-success">{saveMessage}</p> : null}

          <div className="detail-grid">
            <article className="detail-card">
              <h2>기본 정보</h2>
              <dl className="detail-list">
                <div><dt>이메일</dt><dd>{data.email}</dd></div>
                <div><dt>닉네임</dt><dd>{data.nickname}</dd></div>
                <div><dt>권한</dt><dd>{data.role}</dd></div>
                <div><dt>유저 ID</dt><dd>{data.id}</dd></div>
                <div><dt>가입일</dt><dd>{data.joined_at}</dd></div>
                <div><dt>마지막 로그인</dt><dd>{data.last_login}</dd></div>
                <div><dt>최근 로그인 IP</dt><dd>{data.recent_ip || "-"}</dd></div>
              </dl>
            </article>

            <article className="detail-card">
              <h2>인증/권한 정보</h2>
              <dl className="detail-list">
                <div><dt>SMS 인증</dt><dd>{data.sms_verification}</dd></div>
                <div><dt>이메일 인증</dt><dd>{data.email_verification}</dd></div>
                <div><dt>보유 NFT</dt><dd>{data.nft_count == null ? "-" : `${data.nft_count}개`}</dd></div>
                <div><dt>투표 권한</dt><dd>{data.vote_permission}</dd></div>
                <div><dt>계정 상태</dt><dd>{data.status}</dd></div>
              </dl>
            </article>

            <article className="detail-card">
              <h2>연결된 지갑 정보</h2>
              <dl className="detail-list">
                <div><dt>지갑 주소</dt><dd>{data.wallet_address || "-"}</dd></div>
                <div><dt>연결 방식</dt><dd>{data.wallet_method || "-"}</dd></div>
                <div><dt>연결일</dt><dd>{data.wallet_linked_at || "-"}</dd></div>
              </dl>
            </article>
          </div>

          <article className="detail-card full-span">
            <div className="activity-log-head">
              <h2>최근 활동 로그</h2>
              <span className="subtle-text">전체 {data.activity_total_count.toLocaleString()}건</span>
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
                {data.recent_activities.map((activity) => (
                  <tr key={`${activity.title}-${activity.date}-${activity.result}`}>
                    <td><GradientThumb src={activity.preview_url} size="small" /></td>
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
              <button type="button" className="ghost-button" onClick={() => setActivityPage((current) => Math.max(1, current - 1))} disabled={loading || data.activity_page <= 1}>
                이전
              </button>
              <span className="subtle-text">
                {data.activity_page} / {data.activity_total_pages}
              </span>
              <button type="button" className="ghost-button" onClick={() => setActivityPage((current) => Math.min(data.activity_total_pages, current + 1))} disabled={loading || data.activity_page >= data.activity_total_pages}>
                다음
              </button>
            </div>
          </article>
        </article>
      ) : null}
    </SectionLayout>
  );
}
