import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { PaginationControls, ErrorBlock, GradientThumb, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { StatusPill } from "../components/common/StatusPill";
import { useAdminResource } from "../hooks/useAdminResource";
import { formatNumber } from "../lib/format";
import { LIST_PAGE_SIZE, type AdminVoteListItem, type PaginatedResponse } from "../types/admin";

export default function VotesPage() {
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
    return `/api/accounts/admin/votes/?${params.toString()}`;
  }, [page, query, sortBy, statusFilter]);
  const { data, loading, error } = useAdminResource<PaginatedResponse<AdminVoteListItem>>(resourcePath);
  const votes = data?.results ?? [];
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
    <SectionLayout title="투표 관리">
      <article className="admin-card">
        <div className="page-head">
          <h1>투표 관리</h1>
        </div>
        <div className="filter-stack">
          <div className="search-row">
            <input value={query} onChange={(event) => handleQueryChange(event.target.value)} className="search-input" placeholder="투표ID, 파일명, 업로더 검색..." />
            <button className="action-button">검색</button>
          </div>
          <div className="filter-row">
            <select value={statusFilter} onChange={(event) => handleStatusChange(event.target.value)} className="filter-select">
              <option>모든 상태</option>
              <option>진행중</option>
              <option>종료</option>
              <option>등록 가능</option>
              <option>등록 거절</option>
              <option>미정</option>
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
                    <th>투표ID</th>
                    <th>이미지</th>
                    <th>상태</th>
                    <th>시작일</th>
                    <th>종료일</th>
                    <th>찬성%</th>
                    <th>반대%</th>
                    <th>참여수</th>
                    <th>최종 판정</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((vote) => (
                    <tr key={vote.public_id}>
                      <td className="strong-cell">{vote.vote_id}</td>
                      <td>
                        <div className="image-cell">
                          <GradientThumb src={vote.preview_url} size="small" />
                          <div>
                            <strong>{vote.file_name}</strong>
                            <span>{vote.uploader_email}</span>
                          </div>
                        </div>
                      </td>
                      <td><StatusPill value={vote.status} /></td>
                      <td>{vote.start_date}</td>
                      <td>{vote.end_date}</td>
                      <td>{vote.yes_rate}%</td>
                      <td>{vote.no_rate}%</td>
                      <td>{formatNumber(vote.participant_count)}명</td>
                      <td><StatusPill value={vote.decision} /></td>
                      <td><NavLink className="table-link" to={`/votes/${vote.public_id}`}>보기</NavLink></td>
                    </tr>
                  ))}
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
