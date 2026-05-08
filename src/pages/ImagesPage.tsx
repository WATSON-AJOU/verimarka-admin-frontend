import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { PaginationControls, ContentThumb, EmptyTableRow, ErrorBlock, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { StatusPill } from "../components/common/StatusPill";
import { useAdminResource } from "../hooks/useAdminResource";
import { LIST_PAGE_SIZE, type AdminImageListItem, type PaginatedResponse } from "../types/admin";

export default function ImagesPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("모든 상태");
  const [sortBy, setSortBy] = useState("최신순");
  const [page, setPage] = useState(1);

  const resourcePath = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(LIST_PAGE_SIZE),
      q: query,
      status: statusFilter,
      sort: sortBy,
    });
    return `/api/accounts/admin/images/?${params.toString()}`;
  }, [page, query, sortBy, statusFilter]);
  const { data, loading, error } = useAdminResource<PaginatedResponse<AdminImageListItem>>(resourcePath);
  const images = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleSortChange(value: string) {
    setSortBy(value);
    setPage(1);
  }

  return (
    <SectionLayout title="저작물 관리">
      <article className="admin-card">
        <div className="page-head">
          <h1>저작물 관리</h1>
        </div>
        <div className="filter-stack">
          <div className="search-row">
            <input value={query} onChange={(event) => handleQueryChange(event.target.value)} className="search-input" placeholder="파일명, 업로더 검색..." />
            <button className="action-button">검색</button>
          </div>
          <div className="filter-row">
            <select value={statusFilter} onChange={(event) => handleStatusChange(event.target.value)} className="filter-select">
              <option>모든 상태</option>
              <option>ALLOW</option>
              <option>REVIEW</option>
              <option>BLOCK</option>
              <option>진행중</option>
              <option>종료</option>
            </select>
            <select value={sortBy} onChange={(event) => handleSortChange(event.target.value)} className="filter-select">
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
                  {images.length === 0 ? (
                    <EmptyTableRow colSpan={7} message="조건에 맞는 저작물이 없습니다." />
                  ) : (
                    images.map((image) => (
                      <tr key={image.public_id}>
                        <td><ContentThumb src={image.preview_url} contentType={image.content_type} size="small" /></td>
                        <td>{image.file_name}</td>
                        <td>{image.uploader_email}</td>
                        <td>{image.uploaded_at}</td>
                        <td><StatusPill value={image.decision} /></td>
                        <td><StatusPill value={image.vote_status} /></td>
                        <td><NavLink className="table-link" to={`/images/${image.public_id}`}>보기</NavLink></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={data?.page ?? page}
              totalPages={totalPages}
              totalCount={data?.total_count ?? 0}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </>
        ) : null}
      </article>
    </SectionLayout>
  );
}
