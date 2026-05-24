import { NavLink, useParams } from "react-router-dom";
import { useState } from "react";
import { ContentThumb, ErrorBlock, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { useAdminResource } from "../hooks/useAdminResource";
import { mutateAdminJson } from "../lib/api";
import { statusClass } from "../lib/format";
import { normalizeUuidParam } from "../lib/routeParams";
import type { AdminImageDetail } from "../types/admin";

export default function ImageDetailPage() {
  const { imageId } = useParams();
  const safeImageId = normalizeUuidParam(imageId);
  const [moderationAction, setModerationAction] = useState("needs_review");
  const [moderationReason, setModerationReason] = useState("");
  const [moderationMessage, setModerationMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAdminResource<AdminImageDetail>(
    safeImageId ? `/api/accounts/admin/images/${safeImageId}/?r=${refreshKey}` : null,
    { refreshMs: 3000 },
  );

  async function submitModeration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!safeImageId) return;
    const approved = window.confirm(`저작물 판정을 "${moderationAction}"로 처리할까요? 입력한 사유가 감사 로그에 남습니다.`);
    if (!approved) return;
    setModerationMessage("");
    await mutateAdminJson("/api/operations/admin/moderation-cases/", {
      method: "POST",
      body: JSON.stringify({
        content_public_id: safeImageId,
        action: moderationAction,
        reason: moderationReason,
      }),
    });
    setModerationReason("");
    setModerationMessage("수동 심사 결과가 저장되었습니다.");
    setRefreshKey((value) => value + 1);
  }

  return (
    <SectionLayout title="저작물 상세">
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {data ? (
        <article className="admin-card detail-shell">
          <div className="page-head with-action">
            <div>
              <h1>저작물 상세</h1>
              <div className="hero-name">{data.file_name}</div>
            </div>
            <div className="page-head-actions">
              <NavLink className="ghost-button" to="/images">목록으로</NavLink>
              <span className={`pill ${statusClass(data.decision)}`}>{data.decision}</span>
            </div>
          </div>

          <div className="detail-grid wide">
            {data.latest_job && ["queued", "running"].includes(data.latest_job.status) ? (
              <article className="detail-card full-span">
                <h2>실시간 처리 진행률</h2>
                <div className="job-progress-cell is-detail">
                  <div className="job-progress-meta">
                    <span>{data.latest_job.job_type}</span>
                    <strong>{data.latest_job.progress}%</strong>
                  </div>
                  <div className="job-progress-track">
                    <div className="job-progress-fill" style={{ width: `${data.latest_job.progress}%` }} />
                  </div>
                  <span className="job-progress-message">{data.latest_job.progress_message || data.latest_job.status}</span>
                </div>
              </article>
            ) : null}

            <article className="detail-card">
              <h2>저작물 정보</h2>
              <div className="image-compare-grid">
                <div>
                  <div className="image-label">원본</div>
                  <ContentThumb src={data.preview_url} contentType={data.content_type} size="large" />
                </div>
                <div>
                  <div className="image-label">{data.comparison_label || "비교 저작물"}</div>
                  {!data.comparison_preview_url && data.decision === "ALLOW" ? (
                    <div className="image-placeholder-message">워터마크 파일이 없습니다.</div>
                  ) : (
                    <ContentThumb src={data.comparison_preview_url} contentType={data.content_type} size="large" />
                  )}
                </div>
              </div>
            </article>

            <article className="detail-card">
              <h2>AI 분석 결과</h2>
              <div className="metric-bars">
                <div className="metric-bar-row">
                  <span>Embedding 유사도</span>
                  <div className="metric-track"><div className="metric-fill blue" style={{ width: `${data.embedding_similarity ?? 0}%` }} /></div>
                  <strong>{data.embedding_similarity ?? 0}%</strong>
                </div>
                <div className="metric-bar-row">
                  <span>pHash 유사도</span>
                  <div className="metric-track"><div className="metric-fill blue soft" style={{ width: `${data.phash_similarity ?? 0}%` }} /></div>
                  <strong>{data.phash_similarity ?? 0}</strong>
                </div>
                <div className="metric-bar-row">
                  <span>Threshold 결과</span>
                  <div className="metric-track"><div className="metric-fill green" style={{ width: `${data.threshold_result ?? 0}%` }} /></div>
                  <strong>{data.threshold_result ?? 0}%</strong>
                </div>
              </div>
            </article>

            <article className="detail-card">
              <h2>연결된 투표 정보</h2>
              <dl className="detail-list">
                <div><dt>투표 상태</dt><dd>{data.linked_vote?.status || "-"}</dd></div>
                <div><dt>투표 ID</dt><dd>{data.linked_vote?.vote_id || "-"}</dd></div>
                <div><dt>찬성 비율</dt><dd>{data.linked_vote?.yes_rate ?? "-"}%</dd></div>
                <div><dt>반대 비율</dt><dd>{data.linked_vote?.no_rate ?? "-"}%</dd></div>
                <div><dt>남은 기간</dt><dd>{data.linked_vote?.deadline || "-"}</dd></div>
              </dl>
            </article>

            <article className="detail-card">
              <h2>블록체인 정보</h2>
              <dl className="detail-list">
                <div><dt>Token ID</dt><dd>{data.blockchain?.token_id || "-"}</dd></div>
                <div><dt>Transaction Hash</dt><dd>{data.blockchain?.tx_hash || "-"}</dd></div>
                <div><dt>블록 번호</dt><dd>{data.blockchain?.block_number || "-"}</dd></div>
                <div><dt>발행일</dt><dd>{data.blockchain?.minted_at || "-"}</dd></div>
                <div><dt>AI 판정</dt><dd>{data.blockchain?.decision || "-"}</dd></div>
              </dl>
            </article>

            <article className="detail-card full-span">
              <h2>수동 심사</h2>
              {moderationMessage ? <div className="operation-toast inline">{moderationMessage}</div> : null}
              <form className="operation-form horizontal" onSubmit={(event) => void submitModeration(event)}>
                <select value={moderationAction} onChange={(event) => setModerationAction(event.target.value)} className="filter-select">
                  <option value="approve">승인</option>
                  <option value="reject">반려</option>
                  <option value="needs_review">투표/재검토</option>
                  <option value="hide">숨김</option>
                  <option value="restore">복구</option>
                  <option value="reanalyze">재분석</option>
                </select>
                <input required value={moderationReason} onChange={(event) => setModerationReason(event.target.value)} placeholder="운영 처리 사유" />
                <button type="submit" className="action-button">저장</button>
              </form>
            </article>
          </div>
        </article>
      ) : null}
    </SectionLayout>
  );
}
