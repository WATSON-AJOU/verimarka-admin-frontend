import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { PaginationControls, ErrorBlock, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { useAdminResource } from "../hooks/useAdminResource";
import { statusClass } from "../lib/format";
import { LIST_PAGE_SIZE, type AdminUserListItem } from "../types/admin";

export default function UsersPage() {
  const { data, loading, error } = useAdminResource<AdminUserListItem[]>("/api/accounts/admin/users/");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체 회원");
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const source = data ?? [];
    return source.filter((user) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        String(user.id).includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.nickname.toLowerCase().includes(q);
      const matchesFilter =
        filter === "전체 회원" ||
        (filter === "관리자" && user.role === "관리자") ||
        (filter === "정상" && user.status === "정상") ||
        (filter === "정지" && user.status === "정지");
      return matchesQuery && matchesFilter;
    });
  }, [data, filter, query]);

  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * LIST_PAGE_SIZE;
    return filteredUsers.slice(start, start + LIST_PAGE_SIZE);
  }, [currentPage, filteredUsers]);

  return (
    <SectionLayout title="유저 관리">
      <article className="admin-card">
        <div className="page-head">
          <h1>유저 관리</h1>
        </div>
        <div className="filter-stack">
          <div className="search-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="search-input"
              placeholder="ID, 이메일, 닉네임 검색..."
            />
            <button className="action-button">검색</button>
          </div>
          <div className="filter-row">
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="filter-select">
              <option>전체 회원</option>
              <option>관리자</option>
              <option>정상</option>
              <option>정지</option>
            </select>
            <button className="action-button secondary">적용</button>
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
                    <th>ID</th>
                    <th>이메일</th>
                    <th>닉네임</th>
                    <th>권한</th>
                    <th>SMS인증</th>
                    <th>NFT</th>
                    <th>가입일</th>
                    <th>마지막 로그인</th>
                    <th>상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.nickname}</td>
                      <td>
                        <span className={`pill ${statusClass(user.role)}`}>{user.role}</span>
                      </td>
                      <td>
                        <span className={`pill ${statusClass(user.verification)}`}>{user.verification}</span>
                      </td>
                      <td>{user.nft_count ?? "-"}</td>
                      <td>{user.joined_at}</td>
                      <td>{user.last_login}</td>
                      <td>
                        <span className={`pill ${statusClass(user.status)}`}>{user.status}</span>
                      </td>
                      <td>
                        <NavLink className="table-link" to={`/users/${user.id}`}>
                          보기
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              totalCount={filteredUsers.length}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </>
        ) : null}
      </article>
    </SectionLayout>
  );
}
