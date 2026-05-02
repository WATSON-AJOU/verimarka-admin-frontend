import { PaginationControls, ErrorBlock, LoadingBlock, SectionLayout } from "../components/common/AdminShared";
import { UsersFilterBar } from "../components/users/UsersFilterBar";
import { UsersTable } from "../components/users/UsersTable";
import { useAdminResource } from "../hooks/useAdminResource";
import { useUsersList } from "../hooks/useUsersList";
import type { AdminUserListItem } from "../types/admin";

export default function UsersPage() {
  const { data, loading, error } = useAdminResource<AdminUserListItem[]>("/api/accounts/admin/users/");
  const { query, setQuery, filter, setFilter, filteredUsers, page, setPage, totalPages, pagedItems } = useUsersList(data);

  return (
    <SectionLayout title="유저 관리">
      <article className="admin-card">
        <div className="page-head">
          <h1>유저 관리</h1>
        </div>
        <UsersFilterBar query={query} filter={filter} onQueryChange={setQuery} onFilterChange={setFilter} />

        {loading ? <LoadingBlock /> : null}
        {error ? <ErrorBlock message={error} /> : null}
        {!loading && !error ? (
          <>
            <UsersTable users={pagedItems} />
            <PaginationControls
              page={page}
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
