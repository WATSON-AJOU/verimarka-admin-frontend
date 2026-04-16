import type { ReactNode } from "react";

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="table-pagination">
      <span className="subtle-text">전체 {totalCount.toLocaleString()}건</span>
      <div className="pagination-actions">
        <button type="button" className="ghost-button" onClick={onPrev} disabled={page <= 1}>
          이전
        </button>
        <span className="subtle-text">
          {page} / {totalPages}
        </span>
        <button type="button" className="ghost-button" onClick={onNext} disabled={page >= totalPages}>
          다음
        </button>
      </div>
    </div>
  );
}

export function GradientThumb({ src, size = "medium" }: { src?: string | null; size?: "small" | "medium" | "large" }) {
  if (!src) {
    return <div className={`gradient-thumb ${size} is-empty`} />;
  }

  return <img className={`gradient-thumb ${size} is-image`} src={src} alt="" />;
}

export function LoadingBlock() {
  return (
    <article className="admin-card loading-block">
      <div className="eyebrow">Loading</div>
      <p>데이터를 불러오는 중입니다.</p>
    </article>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <article className="admin-card error-block">
      <div className="eyebrow">Error</div>
      <p>{message}</p>
    </article>
  );
}

export function SectionLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section-layout">
      <div className="section-topbar">
        <strong>{title}</strong>
      </div>
      <div className="section-content">{children}</div>
    </section>
  );
}
