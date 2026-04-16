import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { PaginationControls, ErrorBlock, GradientThumb, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { useAdminResource } from "../hooks/useAdminResource";
import { statusClass } from "../lib/format";
import { LIST_PAGE_SIZE, type AdminImageListItem } from "../types/admin";

export default function ImagesPage() {
  const { data, loading, error } = useAdminResource<AdminImageListItem[]>("/api/accounts/admin/images/");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("모든 상태");
  const [sortBy, setSortBy] = useState("최신순");
  const [page, setPage] = useState(1);

  const filteredImages = useMemo(() => {
    const source = data ?? [];
    const next = source.filter((image) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = q === "" || image.file_name.toLowerCase().includes(q) || image.uploader_email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "모든 상태" || image.decision === statusFilter || image.vote_status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return [...next].sort((a, b) => {
      if (sortBy === "오래된순") return a.uploaded_at.localeCompare(b.uploaded_at);
      return b.uploaded_at.localeCompare(a.uploaded_at);
    });
  }, [data, query, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredImages.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedImages = useMemo(() => {
    const start = (currentPage - 1) * LIST_PAGE_SIZE;
    return filteredImages.slice(start, start + LIST_PAGE_SIZE);
  }, [currentPage, filteredImages]);

  return (
    <SectionLayout title="이미지 관리">
      <article className="admin-card">
        <div className="page-head">
          <h1>이미지 관리</h1>
        </div>
        <div className="filter-stack">
          <div className="search-row">
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="search-input" placeholder="파일명, 업로더 검색..." />
            <button className="action-button">검색</button>
          </div>
          <div className="filter-row">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="filter-select">
              <option>모든 상태</option>
              <option>ALLOW</option>
              <option>REVIEW</option>
              <option>BLOCK</option>
              <option>진행중</option>
              <option>종료</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="filter-select">
              <option>최신순</option>
              <option>오래된순</option>
            </select>
          </div>
        </div>
        {loading ? <LoadingBlock /> : null}
        {error ? <ErrorBlock message={error} /> : null}
        {!loading && !error ? (
          <>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>미리보기</th>
                    <th>파일명</th>
                    <th>업로더</th>
                    <th>업로드일</th>
                    <th>상태</th>
                    <th>투표 상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedImages.map((image) => (
                    <tr key={image.public_id}>
                      <td><GradientThumb src={image.preview_url} size="small" /></td>
                      <td>{image.file_name}</td>
                      <td>{image.uploader_email}</td>
                      <td>{image.uploaded_at}</td>
                      <td><span className={`pill ${statusClass(image.decision)}`}>{image.decision}</span></td>
                      <td><span className={`pill ${statusClass(image.vote_status)}`}>{image.vote_status}</span></td>
                      <td><NavLink className="table-link" to={`/images/${image.public_id}`}>보기</NavLink></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              totalCount={filteredImages.length}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </>
        ) : null}
      </article>
    </SectionLayout>
  );
}
