import { useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import appleLogo from "./assets/applelogo.svg";
import googleLogo from "./assets/googlelogo.svg";
import kakaoLogo from "./assets/kakaologo.svg";

type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  display_name: string;
  email: string;
  last_login_at: string | null;
  is_staff: boolean;
  is_superuser: boolean;
};

type AuthTokens = {
  access: string;
  refresh: string;
};

const LIST_PAGE_SIZE = 15;

type DashboardData = {
  total_users: number;
  verified_users: number;
  vote_eligible_users: number;
  total_images: number;
  images_uploaded_today: number;
  active_votes: number;
  closing_votes_today: number;
  pending_jobs: number;
  recent_feed: Array<{
    date: string;
    email: string;
    title: string;
    result: string;
    preview_url?: string | null;
    detail_path?: string;
  }>;
};

type AdminUserListItem = {
  id: number;
  email: string;
  nickname: string;
  role: string;
  verification: string;
  nft_count: number | null;
  joined_at: string;
  last_login: string;
  status: string;
};

type RecentActivity = {
  title: string;
  result: string;
  date: string;
  preview_url?: string | null;
  image_public_id?: string | null;
  detail_path?: string;
  detail_label?: string;
  meta?: string;
};

type AdminUserDetail = AdminUserListItem & {
  recent_ip: string;
  sms_verification: string;
  email_verification: string;
  wallet_address: string;
  wallet_method: string;
  wallet_linked_at: string;
  vote_permission: string;
  activity_page: number;
  activity_page_size: number;
  activity_total_count: number;
  activity_total_pages: number;
  recent_activities: RecentActivity[];
};

type AdminImageListItem = {
  public_id: string;
  file_name: string;
  uploader_email: string;
  uploaded_at: string;
  decision: string;
  vote_status: string;
  preview_url: string | null;
};

type AdminImageDetail = {
  public_id: string;
  file_name: string;
  uploader_email: string;
  uploaded_at: string;
  decision: string;
  preview_url: string | null;
  watermark_preview_url: string | null;
  comparison_preview_url?: string | null;
  comparison_label?: string;
  comparison_file_name?: string;
  comparison_public_id?: string;
  embedding_similarity: number | null;
  phash_similarity: number | null;
  threshold_result: number | null;
  linked_vote?: {
    vote_id?: string;
    status?: string;
    yes_rate?: number;
    no_rate?: number;
    deadline?: string;
  };
  blockchain?: {
    token_id?: string | number;
    tx_hash?: string;
    block_number?: string | number;
    minted_at?: string;
    decision?: string;
  };
};

type AdminVoteListItem = {
  public_id: string;
  vote_id: string;
  file_name: string;
  uploader_email: string;
  status: string;
  start_date: string;
  end_date: string;
  yes_rate: number;
  no_rate: number;
  participant_count: number;
  decision: string;
  preview_url: string | null;
};

type VoteParticipant = {
  user_id: number;
  email: string;
  wallet: string;
  choice: string;
  nft_count: number | null;
  voted_at: string;
};

type AdminVoteDetail = AdminVoteListItem & {
  image_id: string;
  voter_records: VoteParticipant[];
};

const ACCESS_TOKEN_KEY = "verimarka_admin_access";
const REFRESH_TOKEN_KEY = "verimarka_admin_refresh";
const ADMIN_GOOGLE_OAUTH_CODE_KEY = "verimarka:admin:oauth:google:last-code";
const ADMIN_KAKAO_OAUTH_CODE_KEY = "verimarka:admin:oauth:kakao:last-code";

function getStoredTokens(): AuthTokens | null {
  const access = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!access || !refresh) return null;
  return { access, refresh };
}

function storeTokens(tokens: AuthTokens) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAdminAccessToken(refresh: string) {
  const response = await fetch("/api/auth/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access) {
    throw new Error(payload.detail || "관리자 인증을 갱신할 수 없습니다.");
  }

  const nextTokens = {
    access: String(payload.access),
    refresh: payload.refresh ? String(payload.refresh) : refresh,
  };
  storeTokens(nextTokens);
  return nextTokens;
}

async function authenticatedAdminFetch(path: string, init?: RequestInit) {
  const stored = getStoredTokens();
  if (!stored) {
    throw new Error("관리자 로그인이 필요합니다.");
  }

  const requestWithAccess = async (access: string) =>
    fetch(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${access}`,
      },
    });

  let response = await requestWithAccess(stored.access);
  if (response.status !== 401) return response;

  const refreshed = await refreshAdminAccessToken(stored.refresh);
  return requestWithAccess(refreshed.access);
}

async function fetchAdminJson<T>(path: string): Promise<T> {
  const response = await authenticatedAdminFetch(path);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (payload as { detail?: string; message?: string }).detail ||
        (payload as { detail?: string; message?: string }).message ||
        "관리자 데이터를 불러오지 못했습니다.",
    );
  }
  return payload as T;
}

async function mutateAdminJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await authenticatedAdminFetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (payload as { detail?: string; message?: string; non_field_errors?: string[] }).detail ||
        (payload as { detail?: string; message?: string; non_field_errors?: string[] }).message ||
        (payload as { non_field_errors?: string[] }).non_field_errors?.[0] ||
        "관리자 저장에 실패했습니다.",
    );
  }
  return payload as T;
}

function useAdminResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    void fetchAdminJson<T>(path)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, loading, error, setData };
}

function getAdminDisplayName(user: AdminUser | null) {
  if (!user) return "";
  return user.display_name || user.nickname || user.username || user.email.split("@")[0] || "관리자";
}

function statusClass(value: string) {
  switch (value) {
    case "관리자":
      return "is-admin";
    case "완료":
    case "정상":
    case "등록 가능":
    case "ALLOW":
    case "찬성":
    case "활성":
      return "is-success";
    case "REVIEW":
    case "미정":
    case "미인증":
      return "is-warn";
    case "BLOCK":
    case "등록 거절":
    case "정지":
    case "반대":
    case "비활성":
      return "is-danger";
    case "진행중":
      return "is-blue";
    case "종료":
    case "없음":
      return "is-muted";
    default:
      return "is-default";
  }
}

function formatNumber(value: number | null | undefined) {
  return (value ?? 0).toLocaleString();
}

function PaginationControls({
  page,
  totalPages,
  totalCount,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="table-pagination">
      <span className="subtle-text">전체 {totalCount.toLocaleString()}건</span>
      <div className="pagination-actions">
        <button type="button" className="ghost-button" onClick={onPrev} disabled={page <= 1}>
          이전
        </button>
        <span className="subtle-text">
          {page} / {totalPages}
        </span>
        <button type="button" className="ghost-button" onClick={onNext} disabled={page >= totalPages}>
          다음
        </button>
      </div>
    </div>
  );
}

function getGoogleLoginUrl() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/google/callback`;
  return (
    "https://accounts.google.com/o/oauth2/v2/auth" +
    "?response_type=code" +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    "&scope=openid%20email%20profile" +
    "&access_type=offline"
  );
}

function getKakaoLoginUrl() {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
  const redirectUri = `${window.location.origin}/auth/kakao/callback`;
  return (
    "https://kauth.kakao.com/oauth/authorize" +
    "?response_type=code" +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`
  );
}

function GradientThumb({ src, size = "medium" }: { src?: string | null; size?: "small" | "medium" | "large" }) {
  if (!src) {
    return <div className={`gradient-thumb ${size} is-empty`} />;
  }

  return <img className={`gradient-thumb ${size} is-image`} src={src} alt="" />;
}

function LoadingBlock() {
  return (
    <article className="admin-card loading-block">
      <div className="eyebrow">Loading</div>
      <p>데이터를 불러오는 중입니다.</p>
    </article>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <article className="admin-card error-block">
      <div className="eyebrow">Error</div>
      <p>{message}</p>
    </article>
  );
}

function SectionLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="section-layout">
      <div className="section-topbar">
        <strong>{title}</strong>
      </div>
      <div className="section-content">{children}</div>
    </section>
  );
}

function DashboardPage() {
  const { data, loading, error } = useAdminResource<DashboardData>("/api/accounts/admin/dashboard/");

  return (
    <SectionLayout title="운영 현황">
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {data ? (
        <>
          <div className="dashboard-grid">
            <article className="admin-card metric-panel">
              <div className="panel-title">유저 통계</div>
              <div className="big-metric">{formatNumber(data.total_users)}</div>
              <div className="panel-caption">총 유저 수</div>
            </article>
            <article className="admin-card compact-panel">
              <div className="panel-title">유저 인증 현황</div>
              <strong>ID 인증 완료: {formatNumber(data.verified_users)}명</strong>
              <strong>투표 권한 보유: {formatNumber(data.vote_eligible_users)}명</strong>
            </article>
            <article className="admin-card metric-panel">
              <div className="panel-title">이미지 현황</div>
              <div className="big-metric">{formatNumber(data.total_images)}</div>
              <div className="panel-caption">누적 업로드 이미지</div>
            </article>
            <article className="admin-card metric-panel">
              <div className="panel-title">오늘 업로드</div>
              <div className="big-metric">{formatNumber(data.images_uploaded_today)}장</div>
              <div className="panel-caption">최근 24시간 기준</div>
            </article>
            <article className="admin-card compact-panel">
              <div className="panel-title">투표 진행 상황</div>
              <strong>진행 중: {formatNumber(data.active_votes)}건</strong>
              <strong>오늘 종료: {formatNumber(data.closing_votes_today)}건</strong>
            </article>
            <article className="admin-card metric-panel is-alert">
              <div className="panel-title">처리 대기</div>
              <div className="big-metric">{formatNumber(data.pending_jobs)}건</div>
              <div className="panel-caption">빠른 확인이 필요합니다.</div>
            </article>
          </div>

          <article className="admin-card feed-panel">
            <div className="list-head">
              <h2>최근 활동 피드</h2>
            </div>
            <ul className="feed-list">
              {data.recent_feed.map((item) => (
                <li key={`${item.date}-${item.email}-${item.title}`}>
                  <div className="feed-item">
                    <GradientThumb src={item.preview_url} size="small" />
                    <div className="feed-item-body">
                      <div className="feed-item-main">
                        <span>{item.date}</span>
                        <span>·</span>
                        <span>{item.email}</span>
                        <span>·</span>
                        <span>{item.title}</span>
                        <span>·</span>
                        <span>{item.result}</span>
                      </div>
                      {item.detail_path ? (
                        <NavLink to={item.detail_path} className="text-link">
                          상세보기
                        </NavLink>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </>
      ) : null}
    </SectionLayout>
  );
}

function UsersPage() {
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

function UserDetailPage() {
  const { userId } = useParams();
  const [activityPage, setActivityPage] = useState(1);
  const { data, loading, error, setData } = useAdminResource<AdminUserDetail>(
    userId ? `/api/accounts/admin/users/${userId}/?page=${activityPage}&page_size=10` : null,
  );
  const [roleValue, setRoleValue] = useState("일반회원");
  const [statusValue, setStatusValue] = useState("정상");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!data) return;
    setRoleValue(data.role);
    setStatusValue(data.status);
    setSaveError("");
    setSaveMessage("");
  }, [data]);

  useEffect(() => {
    setActivityPage(1);
  }, [userId]);

  const saveRole = async () => {
    if (!userId || !data || roleValue === data.role) return;
    setSavingRole(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const next = await mutateAdminJson<AdminUserDetail>(`/api/accounts/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ role: roleValue }),
      });
      setData(next);
      setSaveMessage("권한이 저장되었습니다.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "권한 저장에 실패했습니다.");
    } finally {
      setSavingRole(false);
    }
  };

  const saveStatus = async () => {
    if (!userId || !data || statusValue === data.status) return;
    setSavingStatus(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const next = await mutateAdminJson<AdminUserDetail>(`/api/accounts/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusValue }),
      });
      setData(next);
      setSaveMessage("계정 상태가 저장되었습니다.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "계정 상태 저장에 실패했습니다.");
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <SectionLayout title="유저 상세">
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {data ? (
        <article className="admin-card detail-shell">
          <div className="page-head with-action">
            <div>
              <h1>유저 상세</h1>
              <div className="hero-name">{data.email}</div>
            </div>
            <div className="page-head-actions">
              <NavLink className="ghost-button" to="/users">
                목록으로
              </NavLink>
              <span className={`pill ${statusClass(data.status)}`}>{data.status}</span>
            </div>
          </div>

          <div className="control-grid">
            <div className="control-panel">
              <label>권한 변경</label>
              <div className="inline-controls">
                <select className="filter-select" value={roleValue} onChange={(event) => setRoleValue(event.target.value)}>
                  <option value="일반회원">일반회원</option>
                  <option value="관리자">관리자</option>
                </select>
                <button
                  className="action-button secondary"
                  onClick={() => void saveRole()}
                  disabled={savingRole || roleValue === data.role}
                >
                  {savingRole ? "저장 중..." : "권한 저장"}
                </button>
              </div>
            </div>
            <div className="control-panel">
              <label>계정 상태 변경</label>
              <div className="inline-controls">
                <select className="filter-select" value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
                  <option value="정상">정상</option>
                  <option value="정지">정지</option>
                </select>
                <button
                  className="action-button secondary"
                  onClick={() => void saveStatus()}
                  disabled={savingStatus || statusValue === data.status}
                >
                  {savingStatus ? "저장 중..." : "상태 저장"}
                </button>
              </div>
            </div>
          </div>

          {saveError ? <p className="control-feedback is-error">{saveError}</p> : null}
          {saveMessage ? <p className="control-feedback is-success">{saveMessage}</p> : null}

          <div className="detail-grid">
            <article className="detail-card">
              <h2>기본 정보</h2>
              <dl className="detail-list">
                <div><dt>이메일</dt><dd>{data.email}</dd></div>
                <div><dt>닉네임</dt><dd>{data.nickname}</dd></div>
                <div><dt>권한</dt><dd>{data.role}</dd></div>
                <div><dt>유저 ID</dt><dd>{data.id}</dd></div>
                <div><dt>가입일</dt><dd>{data.joined_at}</dd></div>
                <div><dt>마지막 로그인</dt><dd>{data.last_login}</dd></div>
                <div><dt>최근 로그인 IP</dt><dd>{data.recent_ip || "-"}</dd></div>
              </dl>
            </article>

            <article className="detail-card">
              <h2>인증/권한 정보</h2>
              <dl className="detail-list">
                <div><dt>SMS 인증</dt><dd>{data.sms_verification}</dd></div>
                <div><dt>이메일 인증</dt><dd>{data.email_verification}</dd></div>
                <div><dt>보유 NFT</dt><dd>{data.nft_count == null ? "-" : `${data.nft_count}개`}</dd></div>
                <div><dt>투표 권한</dt><dd>{data.vote_permission}</dd></div>
                <div><dt>계정 상태</dt><dd>{data.status}</dd></div>
              </dl>
            </article>

            <article className="detail-card">
              <h2>연결된 지갑 정보</h2>
              <dl className="detail-list">
                <div><dt>지갑 주소</dt><dd>{data.wallet_address || "-"}</dd></div>
                <div><dt>연결 방식</dt><dd>{data.wallet_method || "-"}</dd></div>
                <div><dt>연결일</dt><dd>{data.wallet_linked_at || "-"}</dd></div>
              </dl>
            </article>
          </div>

          <article className="detail-card full-span">
            <div className="activity-log-head">
              <h2>최근 활동 로그</h2>
              <span className="subtle-text">전체 {data.activity_total_count.toLocaleString()}건</span>
            </div>
            <table className="mini-table">
              <thead>
                <tr>
                  <th>미리보기</th>
                  <th>파일명</th>
                  <th>구분</th>
                  <th>상태</th>
                  <th>날짜</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_activities.map((activity) => (
                  <tr key={`${activity.title}-${activity.date}-${activity.result}`}>
                    <td><GradientThumb src={activity.preview_url} size="small" /></td>
                    <td>{activity.title}</td>
                    <td>{activity.meta || "-"}</td>
                    <td>{activity.result}</td>
                    <td>{activity.date}</td>
                    <td>
                      {activity.detail_path ? (
                        <NavLink className="table-link" to={activity.detail_path}>
                          {activity.detail_label || "상세보기"}
                        </NavLink>
                      ) : (
                        <span className="subtle-text">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-pagination">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setActivityPage((current) => Math.max(1, current - 1))}
                disabled={loading || data.activity_page <= 1}
              >
                이전
              </button>
              <span className="subtle-text">
                {data.activity_page} / {data.activity_total_pages}
              </span>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setActivityPage((current) => Math.min(data.activity_total_pages, current + 1))}
                disabled={loading || data.activity_page >= data.activity_total_pages}
              >
                다음
              </button>
            </div>
          </article>
        </article>
      ) : null}
    </SectionLayout>
  );
}

function ImagesPage() {
  const { data, loading, error } = useAdminResource<AdminImageListItem[]>("/api/accounts/admin/images/");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("모든 상태");
  const [sortBy, setSortBy] = useState("최신순");
  const [page, setPage] = useState(1);

  const filteredImages = useMemo(() => {
    const source = data ?? [];
    const next = source.filter((image) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        image.file_name.toLowerCase().includes(q) ||
        image.uploader_email.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "모든 상태" ||
        image.decision === statusFilter ||
        image.vote_status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return [...next].sort((a, b) => {
      if (sortBy === "오래된순") return a.uploaded_at.localeCompare(b.uploaded_at);
      return b.uploaded_at.localeCompare(a.uploaded_at);
    });
  }, [data, query, statusFilter, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredImages.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedImages = useMemo(() => {
    const start = (currentPage - 1) * LIST_PAGE_SIZE;
    return filteredImages.slice(start, start + LIST_PAGE_SIZE);
  }, [currentPage, filteredImages]);

  return (
    <SectionLayout title="이미지 관리">
      <article className="admin-card">
        <div className="page-head">
          <h1>이미지 관리</h1>
        </div>
        <div className="filter-stack">
          <div className="search-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="search-input"
              placeholder="파일명, 업로더 검색..."
            />
            <button className="action-button">검색</button>
          </div>
          <div className="filter-row">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="filter-select">
              <option>모든 상태</option>
              <option>ALLOW</option>
              <option>REVIEW</option>
              <option>BLOCK</option>
              <option>진행중</option>
              <option>종료</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="filter-select">
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
                  {pagedImages.map((image) => (
                    <tr key={image.public_id}>
                      <td><GradientThumb src={image.preview_url} size="small" /></td>
                      <td>{image.file_name}</td>
                      <td>{image.uploader_email}</td>
                      <td>{image.uploaded_at}</td>
                      <td><span className={`pill ${statusClass(image.decision)}`}>{image.decision}</span></td>
                      <td><span className={`pill ${statusClass(image.vote_status)}`}>{image.vote_status}</span></td>
                      <td><NavLink className="table-link" to={`/images/${image.public_id}`}>보기</NavLink></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              totalCount={filteredImages.length}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </>
        ) : null}
      </article>
    </SectionLayout>
  );
}

function ImageDetailPage() {
  const { imageId } = useParams();
  const { data, loading, error } = useAdminResource<AdminImageDetail>(
    imageId ? `/api/accounts/admin/images/${imageId}/` : null,
  );

  return (
    <SectionLayout title="이미지 상세">
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {data ? (
        <article className="admin-card detail-shell">
          <div className="page-head with-action">
            <div>
              <h1>이미지 상세</h1>
              <div className="hero-name">{data.file_name}</div>
            </div>
            <div className="page-head-actions">
              <NavLink className="ghost-button" to="/images">목록으로</NavLink>
              <span className={`pill ${statusClass(data.decision)}`}>{data.decision}</span>
            </div>
          </div>

          <div className="detail-grid wide">
            <article className="detail-card">
              <h2>이미지 정보</h2>
              <div className="image-compare-grid">
                <div>
                  <div className="image-label">원본</div>
                  <GradientThumb src={data.preview_url} size="large" />
                </div>
                <div>
                  <div className="image-label">{data.comparison_label || "비교 이미지"}</div>
                  {!data.comparison_preview_url && data.decision === "ALLOW" ? (
                    <div className="image-placeholder-message">워터마크 이미지가 없습니다.</div>
                  ) : (
                    <GradientThumb src={data.comparison_preview_url} size="large" />
                  )}
                </div>
              </div>
            </article>

            <article className="detail-card">
              <h2>AI 분석 결과</h2>
              <div className="metric-bars">
                <div className="metric-bar-row">
                  <span>Embedding 유사도</span>
                  <div className="metric-track"><div className="metric-fill blue" style={{ width: `${data.embedding_similarity ?? 0}%` }} /></div>
                  <strong>{data.embedding_similarity ?? 0}%</strong>
                </div>
                <div className="metric-bar-row">
                  <span>pHash 유사도</span>
                  <div className="metric-track"><div className="metric-fill blue soft" style={{ width: `${data.phash_similarity ?? 0}%` }} /></div>
                  <strong>{data.phash_similarity ?? 0}</strong>
                </div>
                <div className="metric-bar-row">
                  <span>Threshold 결과</span>
                  <div className="metric-track"><div className="metric-fill green" style={{ width: `${data.threshold_result ?? 0}%` }} /></div>
                  <strong>{data.threshold_result ?? 0}%</strong>
                </div>
              </div>
            </article>

            <article className="detail-card">
              <h2>연결된 투표 정보</h2>
              <dl className="detail-list">
                <div><dt>투표 상태</dt><dd>{data.linked_vote?.status || "-"}</dd></div>
                <div><dt>투표 ID</dt><dd>{data.linked_vote?.vote_id || "-"}</dd></div>
                <div><dt>찬성 비율</dt><dd>{data.linked_vote?.yes_rate ?? "-"}%</dd></div>
                <div><dt>반대 비율</dt><dd>{data.linked_vote?.no_rate ?? "-"}%</dd></div>
                <div><dt>남은 기간</dt><dd>{data.linked_vote?.deadline || "-"}</dd></div>
              </dl>
            </article>

            <article className="detail-card">
              <h2>블록체인 정보</h2>
              <dl className="detail-list">
                <div><dt>Token ID</dt><dd>{data.blockchain?.token_id || "-"}</dd></div>
                <div><dt>Transaction Hash</dt><dd>{data.blockchain?.tx_hash || "-"}</dd></div>
                <div><dt>블록 번호</dt><dd>{data.blockchain?.block_number || "-"}</dd></div>
                <div><dt>발행일</dt><dd>{data.blockchain?.minted_at || "-"}</dd></div>
                <div><dt>AI 판정</dt><dd>{data.blockchain?.decision || "-"}</dd></div>
              </dl>
            </article>
          </div>
        </article>
      ) : null}
    </SectionLayout>
  );
}

function VotesPage() {
  const { data, loading, error } = useAdminResource<AdminVoteListItem[]>("/api/accounts/admin/votes/");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("모든 상태");
  const [sortBy, setSortBy] = useState("최신순");
  const [page, setPage] = useState(1);

  const filteredVotes = useMemo(() => {
    const source = data ?? [];
    const next = source.filter((vote) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        vote.vote_id.toLowerCase().includes(q) ||
        vote.file_name.toLowerCase().includes(q) ||
        vote.uploader_email.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "모든 상태" ||
        vote.status === statusFilter ||
        vote.decision === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return [...next].sort((a, b) => {
      if (sortBy === "오래된순") return a.start_date.localeCompare(b.start_date);
      return b.start_date.localeCompare(a.start_date);
    });
  }, [data, query, sortBy, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, sortBy, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVotes.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedVotes = useMemo(() => {
    const start = (currentPage - 1) * LIST_PAGE_SIZE;
    return filteredVotes.slice(start, start + LIST_PAGE_SIZE);
  }, [currentPage, filteredVotes]);

  return (
    <SectionLayout title="투표 관리">
      <article className="admin-card">
        <div className="page-head">
          <h1>투표 관리</h1>
        </div>
        <div className="filter-stack">
          <div className="search-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="search-input"
              placeholder="투표ID, 파일명, 업로더 검색..."
            />
            <button className="action-button">검색</button>
          </div>
          <div className="filter-row">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="filter-select">
              <option>모든 상태</option>
              <option>진행중</option>
              <option>종료</option>
              <option>등록 가능</option>
              <option>등록 거절</option>
              <option>미정</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="filter-select">
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
                  {pagedVotes.map((vote) => (
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
                      <td><span className={`pill ${statusClass(vote.status)}`}>{vote.status}</span></td>
                      <td>{vote.start_date}</td>
                      <td>{vote.end_date}</td>
                      <td>{vote.yes_rate}%</td>
                      <td>{vote.no_rate}%</td>
                      <td>{formatNumber(vote.participant_count)}명</td>
                      <td><span className={`pill ${statusClass(vote.decision)}`}>{vote.decision}</span></td>
                      <td><NavLink className="table-link" to={`/votes/${vote.public_id}`}>보기</NavLink></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={currentPage}
              totalPages={totalPages}
              totalCount={filteredVotes.length}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
            />
          </>
        ) : null}
      </article>
    </SectionLayout>
  );
}

function VoteDetailPage() {
  const { voteId } = useParams();
  const { data, loading, error } = useAdminResource<AdminVoteDetail>(
    voteId ? `/api/accounts/admin/votes/${voteId}/` : null,
  );

  return (
    <SectionLayout title="투표 상세">
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {data ? (
        <article className="admin-card detail-shell">
          <div className="page-head with-action">
            <div>
              <h1>투표 상세</h1>
              <div className="hero-name">{data.vote_id}</div>
            </div>
            <div className="page-head-actions">
              <NavLink className="ghost-button" to="/votes">목록으로</NavLink>
              <span className={`pill ${statusClass(data.status)}`}>{data.status}</span>
            </div>
          </div>

          <div className="detail-grid wide">
            <article className="detail-card">
              <h2>이미지 정보</h2>
              <div className="vote-detail-image">
                <GradientThumb src={data.preview_url} size="large" />
                <dl className="detail-list compact">
                  <div><dt>파일명</dt><dd>{data.file_name}</dd></div>
                  <div><dt>이미지 ID</dt><dd>{data.image_id}</dd></div>
                  <div><dt>업로더</dt><dd>{data.uploader_email}</dd></div>
                  <div><dt>찬성 비율</dt><dd>{data.yes_rate}%</dd></div>
                </dl>
              </div>
            </article>

            <article className="detail-card">
              <h2>투표 진행 정보</h2>
              <dl className="detail-list">
                <div><dt>진행상태</dt><dd>{data.status}</dd></div>
                <div><dt>시작일</dt><dd>{data.start_date}</dd></div>
                <div><dt>종료일</dt><dd>{data.end_date}</dd></div>
                <div><dt>참여수</dt><dd>{formatNumber(data.participant_count)}명</dd></div>
                <div><dt>최종 판정</dt><dd>{data.decision}</dd></div>
              </dl>
              <div className="metric-bars vote-bars">
                <div className="metric-bar-row">
                  <span>찬성</span>
                  <div className="metric-track"><div className="metric-fill blue" style={{ width: `${data.yes_rate}%` }} /></div>
                  <strong>{data.yes_rate}%</strong>
                </div>
                <div className="metric-bar-row">
                  <span>반대</span>
                  <div className="metric-track"><div className="metric-fill green" style={{ width: `${data.no_rate}%` }} /></div>
                  <strong>{data.no_rate}%</strong>
                </div>
              </div>
            </article>
          </div>

          <article className="detail-card full-span">
            <div className="list-head">
              <h2>투표 참여 유저 기록</h2>
              <span className="subtle-text">지금부터 발생하는 투표 참여 내역이 이 영역에 누적됩니다.</span>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>유저 ID</th>
                    <th>이메일</th>
                    <th>지갑 주소</th>
                    <th>선택</th>
                    <th>보유 NFT</th>
                    <th>투표 시각</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {data.voter_records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-row">아직 저장된 투표 참여 기록이 없습니다.</td>
                    </tr>
                  ) : (
                    data.voter_records.map((record) => (
                      <tr key={`${record.user_id}-${record.voted_at}`}>
                        <td>{record.user_id}</td>
                        <td>{record.email}</td>
                        <td>{record.wallet}</td>
                        <td><span className={`pill ${statusClass(record.choice)}`}>{record.choice}</span></td>
                        <td>{record.nft_count ?? "-"}</td>
                        <td>{record.voted_at}</td>
                        <td><NavLink className="table-link" to={`/users/${record.user_id}`}>유저 보기</NavLink></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </article>
      ) : null}
    </SectionLayout>
  );
}

function LoginPage({
  loading,
  submitting,
  error,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onGoogleLogin,
  onKakaoLogin,
}: {
  loading: boolean;
  submitting: boolean;
  error: string;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  onKakaoLogin: () => void;
}) {
  return (
    <div className="login-modal-shell">
      <section className="login-modal-card">
        <div className="login-modal-head">
          <h2>VERIMARKA 관리자</h2>
          <p>로그인</p>
        </div>

        <div className="social-login-stack">
          <button className="social-login-button google" type="button" onClick={onGoogleLogin} disabled={loading || submitting}>
            <img className="social-login-icon-image" src={googleLogo} alt="" aria-hidden="true" />
            <span>Google로 계속하기</span>
          </button>
          <button className="social-login-button apple" type="button" disabled title="준비중">
            <img className="social-login-icon-image" src={appleLogo} alt="" aria-hidden="true" />
            <span>Apple로 계속하기</span>
          </button>
          <button className="social-login-button kakao" type="button" onClick={onKakaoLogin} disabled={loading || submitting}>
            <img className="social-login-icon-image" src={kakaoLogo} alt="" aria-hidden="true" />
            <span>Kakao로 계속하기</span>
          </button>
        </div>

        <form className="login-form login-form-card" onSubmit={onSubmit}>
          <label className="login-field">
            <span>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="admin@verimarka.com"
              autoComplete="username"
              disabled={loading || submitting}
            />
          </label>
          <label className="login-field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              disabled={loading || submitting}
            />
          </label>
          {error ? <div className="login-error">{error}</div> : null}
          <button className="login-submit" type="submit" disabled={loading || submitting}>
            {submitting ? "로그인 중..." : "이메일 로그인"}
          </button>
        </form>

        <div className="login-footnote">
          회원가입을 진행하면 <a href="/terms" target="_blank" rel="noreferrer">이용약관</a> 및 <a href="/privacy" target="_blank" rel="noreferrer">개인정보 처리방침</a>에 동의하게 됩니다.
        </div>
      </section>
    </div>
  );
}

function OAuthCallbackPage({
  provider,
  endpoint,
  onAuthenticated,
}: {
  provider: "Google" | "Kakao";
  endpoint: string;
  onAuthenticated: (user: AdminUser, tokens: AuthTokens) => void;
}) {
  const navigate = useNavigate();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (!code) throw new Error(`${provider} authorization code가 없습니다.`);
        const oauthCodeStorageKey =
          provider === "Google" ? ADMIN_GOOGLE_OAUTH_CODE_KEY : ADMIN_KAKAO_OAUTH_CODE_KEY;
        const lastHandledCode = window.sessionStorage.getItem(oauthCodeStorageKey);
        if (lastHandledCode === code) {
          return;
        }
        window.sessionStorage.setItem(oauthCodeStorageKey, code);
        const redirect_uri = `${window.location.origin}/auth/${provider.toLowerCase()}/callback`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirect_uri }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const detail =
            (payload as { detail?: string; message?: string }).detail ||
            (payload as { detail?: string; message?: string }).message ||
            `${provider} 관리자 로그인에 실패했습니다.`;
          throw new Error(detail);
        }

        const tokens = {
          access: String((payload as { access: string }).access),
          refresh: String((payload as { refresh: string }).refresh),
        };
        storeTokens(tokens);
        const oauthUser = (payload as { user?: AdminUser }).user;
        if (!oauthUser || (!oauthUser.is_staff && !oauthUser.is_superuser)) {
          throw new Error("관리자 로그인이 필요합니다.");
        }
        if (!cancelled) {
          onAuthenticated(oauthUser, tokens);
          window.location.replace("/");
        }
      } catch (error) {
        clearTokens();
        if (!cancelled) {
          navigate("/login", {
            replace: true,
            state: {
              loginError: error instanceof Error ? error.message : `${provider} 관리자 로그인에 실패했습니다.`,
            },
          });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [endpoint, navigate, onAuthenticated, provider]);

  return <div className="login-loading"><div className="login-loading-card"><div className="eyebrow">OAuth</div><h1>{provider} 관리자 로그인 처리 중입니다.</h1><p>잠시만 기다려주세요.</p></div></div>;
}

function AdminLayout({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const routedError = (location.state as { loginError?: string } | null)?.loginError;
    if (routedError) {
      setLoginError(routedError);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const stored = getStoredTokens();
      if (!stored) {
        if (!cancelled) setAuthReady(true);
        return;
      }

      setAuthLoading(true);
      try {
        const payload = await fetchAdminJson<AdminUser>("/api/accounts/admin/me/");
        if (!cancelled) setAdminUser(payload);
      } catch (error) {
        clearTokens();
        if (!cancelled) {
          setAdminUser(null);
          setLoginError(error instanceof Error ? error.message : "관리자 인증을 확인할 수 없습니다.");
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
          setAuthReady(true);
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authReady || authLoading) return;
    if (adminUser && location.pathname === "/login") {
      navigate("/", { replace: true });
      return;
    }
    const isAuthRoute = location.pathname === "/login" || location.pathname.startsWith("/auth/");
    if (!adminUser && !isAuthRoute) {
      navigate("/login", { replace: true });
    }
  }, [adminUser, authLoading, authReady, location.pathname, navigate]);

  function handleAdminAuthenticated(user: AdminUser, _tokens: AuthTokens) {
    setAdminUser(user);
    setLoginError("");
    setLoginPassword("");
  }

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoginSubmitting(true);

    try {
      const response = await fetch("/api/accounts/admin/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail =
          (payload as { detail?: string; non_field_errors?: string[]; message?: string }).detail ||
          (payload as { detail?: string; non_field_errors?: string[]; message?: string }).non_field_errors?.[0] ||
          (payload as { detail?: string; non_field_errors?: string[]; message?: string }).message ||
          "관리자 로그인에 실패했습니다.";
        throw new Error(String(detail));
      }

      storeTokens({
        access: String((payload as { access: string }).access),
        refresh: String((payload as { refresh: string }).refresh),
      });
      setAdminUser((payload as { user: AdminUser }).user);
      setLoginPassword("");
      navigate("/", { replace: true });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "관리자 로그인에 실패했습니다.");
    } finally {
      setLoginSubmitting(false);
    }
  }

  function handleLogout() {
    clearTokens();
    setAdminUser(null);
    setLoginPassword("");
    navigate("/login", { replace: true });
  }

  if (!authReady || authLoading) {
    return (
      <div className="login-loading">
        <div className="login-loading-card">
          <div className="eyebrow">Loading</div>
          <h1>관리자 인증 상태를 확인하는 중입니다.</h1>
          <p>잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          adminUser ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage
              loading={authLoading}
              submitting={loginSubmitting}
              error={loginError}
              email={loginEmail}
              password={loginPassword}
              onEmailChange={setLoginEmail}
              onPasswordChange={setLoginPassword}
              onSubmit={handleLoginSubmit}
              onGoogleLogin={() => {
                window.location.href = getGoogleLoginUrl();
              }}
              onKakaoLogin={() => {
                window.location.href = getKakaoLoginUrl();
              }}
            />
          )
        }
      />
      <Route
        path="/auth/google/callback"
        element={<OAuthCallbackPage provider="Google" endpoint="/api/accounts/auth/oauth/google/" onAuthenticated={handleAdminAuthenticated} />}
      />
      <Route
        path="/auth/kakao/callback"
        element={<OAuthCallbackPage provider="Kakao" endpoint="/api/accounts/auth/oauth/kakao/" onAuthenticated={handleAdminAuthenticated} />}
      />
      <Route path="/*" element={adminUser ? <AdminLayout user={adminUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
