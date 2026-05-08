import { useMemo } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { getAdminDisplayName } from "../../lib/format";
import type { AdminUser } from "../../types/admin";
import DashboardPage from "../../pages/DashboardPage";
import ImagesPage from "../../pages/ImagesPage";
import ImageDetailPage from "../../pages/ImageDetailPage";
import UsersPage from "../../pages/UsersPage";
import UserDetailPage from "../../pages/UserDetailPage";
import VotesPage from "../../pages/VotesPage";
import VoteDetailPage from "../../pages/VoteDetailPage";
import ErrorPage from "../../pages/ErrorPage";

type AdminLayoutProps = {
  user: AdminUser;
  onLogout: () => void;
};

export default function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const displayName = useMemo(() => getAdminDisplayName(user), [user]);
  const sectionTitle = useMemo(() => {
    if (location.pathname.startsWith("/users/")) return "유저 상세";
    if (location.pathname.startsWith("/users")) return "유저 관리";
    if (location.pathname.startsWith("/images/")) return "이미지 상세";
    if (location.pathname.startsWith("/images")) return "이미지 관리";
    if (location.pathname.startsWith("/votes/")) return "투표 상세";
    if (location.pathname.startsWith("/votes")) return "투표 관리";
    return "운영 현황";
  }, [location.pathname]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-card">
          <div className="brand-avatar">V</div>
          <div>
            <strong>VeriMarka</strong>
            <span>관리자 콘솔</span>
          </div>
        </div>
        <nav className="side-nav">
          <NavLink to="/" end className="side-link">홈</NavLink>
          <NavLink to="/users" className="side-link">유저</NavLink>
          <NavLink to="/images" className="side-link">이미지</NavLink>
          <NavLink to="/votes" className="side-link">투표</NavLink>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-title">{sectionTitle}</div>
          <div className="header-tools">
            <a href="https://verimarka.com" target="_blank" rel="noreferrer">유저 사이트 보기</a>
            <span>{displayName} · {user.email}</span>
            <button type="button" className="header-tool-button danger" onClick={onLogout}>로그아웃</button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
          <Route path="/images" element={<ImagesPage />} />
          <Route path="/images/:imageId" element={<ImageDetailPage />} />
          <Route path="/votes" element={<VotesPage />} />
          <Route path="/votes/:voteId" element={<VoteDetailPage />} />
          <Route path="*" element={<ErrorPage statusCode={404} />} />
        </Routes>
      </main>
    </div>
  );
}
