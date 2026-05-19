import { NavLink, useParams } from "react-router-dom";
import { ContentThumb, ErrorBlock, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { useAdminResource } from "../hooks/useAdminResource";
import { statusClass } from "../lib/format";
import { normalizeUuidParam } from "../lib/routeParams";
import type { AdminImageDetail } from "../types/admin";

export default function ImageDetailPage() {
  const { imageId } = useParams();
  const safeImageId = normalizeUuidParam(imageId);
  const { data, loading, error } = useAdminResource<AdminImageDetail>(
    safeImageId ? `/api/accounts/admin/images/${safeImageId}/` : null,
    { refreshMs: 3000 },
  );

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
          </div>
        </article>
      ) : null}
    </SectionLayout>
  );
}
