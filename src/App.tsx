import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./styles.css";
import LoginPage from "./components/auth/LoginPage";
import OAuthCallbackPage from "./components/auth/OAuthCallbackPage";
import AdminLayout from "./components/layout/AdminLayout";
import { clearTokens, getGoogleLoginUrl, getKakaoLoginUrl, getStoredTokens, storeTokens } from "./lib/auth";
import { adminJsonRequest, fetchAdminJson } from "./lib/api";
import type { AdminUser, AuthTokens } from "./types/admin";

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
      const payload = await adminJsonRequest<{ access: string; refresh: string; user: AdminUser }>("/api/accounts/admin/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      storeTokens({
        access: String(payload.access),
        refresh: String(payload.refresh),
      });
      setAdminUser(payload.user);
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
