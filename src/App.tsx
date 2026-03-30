import { NavLink, Route, Routes } from "react-router-dom";

function DashboardPage() {
  return (
    <section className="panel-grid">
      <article className="card hero-card">
        <div className="eyebrow">Admin</div>
        <h1>운영 대시보드</h1>
        <p>
          관리자 프론트 초기 뼈대입니다. 사용자 관리, 로그 조회, 검토 처리 화면을
          여기에 확장하면 됩니다.
        </p>
      </article>
      <article className="card metric-card">
        <div className="metric-label">대기 검토</div>
        <div className="metric-value">0건</div>
      </article>
      <article className="card metric-card">
        <div className="metric-label">신규 가입</div>
        <div className="metric-value">0명</div>
      </article>
      <article className="card metric-card">
        <div className="metric-label">오류 로그</div>
        <div className="metric-value">0건</div>
      </article>
      <article className="card list-card">
        <h2>최근 작업</h2>
        <ul>
          <li>초기 관리자 프론트 생성</li>
          <li>도메인: admin.verimarka.com</li>
          <li>API 프록시: /api → backend</li>
        </ul>
      </article>
    </section>
  );
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="card placeholder-card">
      <div className="eyebrow">준비 중</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-kicker">VeriMarka</div>
          <div className="brand-title">Admin</div>
        </div>
        <nav className="nav-menu">
          <NavLink to="/" end className="nav-link">
            대시보드
          </NavLink>
          <NavLink to="/users" className="nav-link">
            사용자 관리
          </NavLink>
          <NavLink to="/reviews" className="nav-link">
            검토 관리
          </NavLink>
          <NavLink to="/logs" className="nav-link">
            로그 보기
          </NavLink>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <div className="topbar-kicker">관리자 사이트</div>
            <strong>admin.verimarka.com</strong>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/users"
            element={
              <PlaceholderPage
                title="사용자 관리"
                description="사용자 검색, 인증 상태 조회, 지갑 연결 현황을 여기에 구현합니다."
              />
            }
          />
          <Route
            path="/reviews"
            element={
              <PlaceholderPage
                title="검토 관리"
                description="REVIEW 케이스 검토와 수동 처리 기능을 여기에 구현합니다."
              />
            }
          />
          <Route
            path="/logs"
            element={
              <PlaceholderPage
                title="로그 보기"
                description="등록, 검증, 투표, 민팅 관련 운영 로그를 여기에 연결합니다."
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
