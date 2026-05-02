import { useEffect, useMemo, useState } from "react";

export function usePagedList<T>(items: T[], pageSize: number, resetKeys: readonly unknown[]) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, resetKeys);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    page: currentPage,
    setPage,
    totalPages,
    pagedItems,
  };
}
