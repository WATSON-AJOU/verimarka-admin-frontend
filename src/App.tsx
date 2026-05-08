import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./styles.css";
import LoginPage from "./components/auth/LoginPage";
import OAuthCallbackPage from "./components/auth/OAuthCallbackPage";
import AdminLayout from "./components/layout/AdminLayout";
import ErrorPage from "./pages/ErrorPage";
import {
  clearTokens,
  getAppleLoginUrl,
  getGoogleLoginUrl,
  getKakaoLoginUrl,
  getStoredTokens,
  refreshAdminAccessToken,
  revokeAdminRefreshToken,
  storeTokens,
} from "./lib/auth";
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
      setAuthLoading(true);
      try {
        let stored = getStoredTokens();
        if (!stored) {
          stored = await refreshAdminAccessToken();
        }
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
    const isPublicErrorRoute = location.pathname === "/403" || location.pathname === "/404";
    if (!adminUser && !isAuthRoute && !isPublicErrorRoute) {
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
      const payload = await adminJsonRequest<{ access: string; user: AdminUser }>("/api/accounts/admin/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      storeTokens({
        access: String(payload.access),
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
    void revokeAdminRefreshToken().finally(() => {
      clearTokens();
      setAdminUser(null);
      setLoginPassword("");
      navigate("/login", { replace: true });
    });
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
              onAppleLogin={() => {
                window.location.href = getAppleLoginUrl();
              }}
              onKakaoLogin={() => {
                window.location.href = getKakaoLoginUrl();
              }}
            />
          )
        }
      />
      <Route
        path="/auth/apple/callback"
        element={<OAuthCallbackPage provider="Apple" endpoint="/api/accounts/admin/auth/oauth/apple/" onAuthenticated={handleAdminAuthenticated} />}
      />
      <Route
        path="/auth/google/callback"
        element={<OAuthCallbackPage provider="Google" endpoint="/api/accounts/admin/auth/oauth/google/" onAuthenticated={handleAdminAuthenticated} />}
      />
      <Route
        path="/auth/kakao/callback"
        element={<OAuthCallbackPage provider="Kakao" endpoint="/api/accounts/admin/auth/oauth/kakao/" onAuthenticated={handleAdminAuthenticated} />}
      />
      <Route path="/403" element={<ErrorPage statusCode={403} />} />
      <Route path="/404" element={<ErrorPage statusCode={404} />} />
      <Route path="/*" element={adminUser ? <AdminLayout user={adminUser} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
