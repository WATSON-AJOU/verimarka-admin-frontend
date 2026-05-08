import { PaginationControls, ErrorBlock, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { UsersFilterBar } from "../components/users/UsersFilterBar";
import { UsersTable } from "../components/users/UsersTable";
import { useAdminResource } from "../hooks/useAdminResource";
import { LIST_PAGE_SIZE, type AdminUserListItem, type PaginatedResponse } from "../types/admin";
import { useMemo, useState } from "react";

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체 회원");
  const [page, setPage] = useState(1);
  const resourcePath = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(LIST_PAGE_SIZE),
      q: query,
      filter,
    });
    return `/api/accounts/admin/users/?${params.toString()}`;
  }, [filter, page, query]);
  const { data, loading, error } = useAdminResource<PaginatedResponse<AdminUserListItem>>(resourcePath);
  const users = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleFilterChange(value: string) {
    setFilter(value);
    setPage(1);
  }

  return (
    <SectionLayout title="유저 관리">
      <article className="admin-card">
        <div className="page-head">
          <h1>유저 관리</h1>
        </div>
        <UsersFilterBar query={query} filter={filter} onQueryChange={handleQueryChange} onFilterChange={handleFilterChange} />

        {loading ? <LoadingBlock /> : null}
        {error ? <ErrorBlock message={error} /> : null}
        {!loading && !error ? (
          <>
            <UsersTable users={users} />
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
