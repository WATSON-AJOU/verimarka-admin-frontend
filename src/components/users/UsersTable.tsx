import { NavLink } from "react-router-dom";
import type { AdminUserListItem } from "../../types/admin";
import { EmptyTableRow } from "../common/AdminShared";
import { StatusPill } from "../common/StatusPill";

export function UsersTable({ users }: { users: AdminUserListItem[] }) {
  return (
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
          {users.length === 0 ? (
            <EmptyTableRow colSpan={10} message="조건에 맞는 유저가 없습니다." />
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.nickname}</td>
                <td>
                  <StatusPill value={user.role} />
                </td>
                <td>
                  <StatusPill value={user.verification} />
                </td>
                <td>{user.nft_count ?? "-"}</td>
                <td>{user.joined_at}</td>
                <td>{user.last_login}</td>
                <td>
                  <StatusPill value={user.status} />
                </td>
                <td>
                  <NavLink className="table-link" to={`/users/${user.id}`}>
                    보기
                  </NavLink>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
