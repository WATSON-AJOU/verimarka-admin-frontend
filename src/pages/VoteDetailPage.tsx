import { NavLink, useParams } from "react-router-dom";
import { ContentThumb, ErrorBlock, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { useAdminResource } from "../hooks/useAdminResource";
import { formatNumber, statusClass } from "../lib/format";
import { normalizeUuidParam } from "../lib/routeParams";
import type { AdminVoteDetail } from "../types/admin";

export default function VoteDetailPage() {
  const { voteId } = useParams();
  const safeVoteId = normalizeUuidParam(voteId);
  const { data, loading, error } = useAdminResource<AdminVoteDetail>(
    safeVoteId ? `/api/accounts/admin/votes/${safeVoteId}/` : null,
  );

  return (
    <SectionLayout title="투표 상세">
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {data ? (
        <article className="admin-card detail-shell">
          <div className="page-head with-action">
            <div>
              <h1>투표 상세</h1>
              <div className="hero-name">{data.vote_id}</div>
            </div>
            <div className="page-head-actions">
              <NavLink className="ghost-button" to="/votes">목록으로</NavLink>
              <span className={`pill ${statusClass(data.status)}`}>{data.status}</span>
            </div>
          </div>

          <div className="detail-grid wide">
            <article className="detail-card">
              <h2>저작물 정보</h2>
              <div className="vote-detail-image vote-detail-image-stack">
                <div className="vote-compare-grid">
                  <div>
                    <div className="image-label">투표 대상</div>
                    <ContentThumb src={data.original_preview_url || data.preview_url} contentType={data.content_type} size="large" />
                  </div>
                  <div>
                    <div className="image-label">{data.comparison_label || "유사 후보"}</div>
                    <ContentThumb src={data.comparison_preview_url} contentType={data.content_type} size="large" />
                  </div>
                </div>
                <dl className="detail-list compact">
                  <div><dt>파일명</dt><dd>{data.file_name}</dd></div>
                  <div><dt>저작물 ID</dt><dd>{data.image_id}</dd></div>
                  <div><dt>업로더</dt><dd>{data.uploader_email}</dd></div>
                  <div><dt>비교 파일</dt><dd>{data.comparison_file_name || "-"}</dd></div>
                  <div><dt>Embedding 유사도</dt><dd>{data.embedding_similarity ?? "-"}%</dd></div>
                  <div><dt>Threshold</dt><dd>{data.threshold_result ?? "-"}%</dd></div>
                  <div><dt>찬성 비율</dt><dd>{data.yes_rate}%</dd></div>
                </dl>
              </div>
            </article>

            <article className="detail-card">
              <h2>투표 진행 정보</h2>
              <dl className="detail-list">
                <div><dt>진행상태</dt><dd>{data.status}</dd></div>
                <div><dt>시작일</dt><dd>{data.start_date}</dd></div>
                <div><dt>종료일</dt><dd>{data.end_date}</dd></div>
                <div><dt>참여수</dt><dd>{formatNumber(data.participant_count)}명</dd></div>
                <div><dt>최종 판정</dt><dd>{data.decision}</dd></div>
              </dl>
              <div className="metric-bars vote-bars">
                <div className="metric-bar-row">
                  <span>찬성</span>
                  <div className="metric-track"><div className="metric-fill blue" style={{ width: `${data.yes_rate}%` }} /></div>
                  <strong>{data.yes_rate}%</strong>
                </div>
                <div className="metric-bar-row">
                  <span>반대</span>
                  <div className="metric-track"><div className="metric-fill green" style={{ width: `${data.no_rate}%` }} /></div>
                  <strong>{data.no_rate}%</strong>
                </div>
              </div>
            </article>
          </div>

          <article className="detail-card full-span">
            <div className="list-head">
              <h2>투표 참여 유저 기록</h2>
              <span className="subtle-text">지금부터 발생하는 투표 참여 내역이 이 영역에 누적됩니다.</span>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>유저 ID</th>
                    <th>이메일</th>
                    <th>지갑 주소</th>
                    <th>선택</th>
                    <th>보유 NFT</th>
                    <th>투표 시각</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {data.voter_records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-row">아직 저장된 투표 참여 기록이 없습니다.</td>
                    </tr>
                  ) : (
                    data.voter_records.map((record) => (
                      <tr key={`${record.user_id}-${record.voted_at}`}>
                        <td>{record.user_id}</td>
                        <td>{record.email}</td>
                        <td>{record.wallet}</td>
                        <td><span className={`pill ${statusClass(record.choice)}`}>{record.choice}</span></td>
                        <td>{record.nft_count ?? "-"}</td>
                        <td>{record.voted_at}</td>
                        <td><NavLink className="table-link" to={`/users/${record.user_id}`}>유저 보기</NavLink></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </article>
      ) : null}
    </SectionLayout>
  );
}
