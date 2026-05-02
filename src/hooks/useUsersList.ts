import { useMemo, useState } from "react";
import { LIST_PAGE_SIZE, type AdminUserListItem } from "../types/admin";
import { usePagedList } from "./usePagedList";

export function useUsersList(users: AdminUserListItem[] | null | undefined) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체 회원");

  const filteredUsers = useMemo(() => {
    const source = users ?? [];
    const normalizedQuery = query.trim().toLowerCase();

    return source.filter((user) => {
      const matchesQuery =
        normalizedQuery === "" ||
        String(user.id).includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.nickname.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filter === "전체 회원" ||
        (filter === "관리자" && user.role === "관리자") ||
        (filter === "정상" && user.status === "정상") ||
        (filter === "정지" && user.status === "정지");

      return matchesQuery && matchesFilter;
    });
  }, [filter, query, users]);

  const pagination = usePagedList(filteredUsers, LIST_PAGE_SIZE, [query, filter]);

  return {
    query,
    setQuery,
    filter,
    setFilter,
    filteredUsers,
    ...pagination,
  };
}
