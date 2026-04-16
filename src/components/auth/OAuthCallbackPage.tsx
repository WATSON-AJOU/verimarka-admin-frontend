import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ADMIN_GOOGLE_OAUTH_CODE_KEY,
  ADMIN_KAKAO_OAUTH_CODE_KEY,
  clearTokens,
  storeTokens,
} from "../../lib/auth";
import type { AdminUser, AuthTokens } from "../../types/admin";

type OAuthCallbackPageProps = {
  provider: "Google" | "Kakao";
  endpoint: string;
  onAuthenticated: (user: AdminUser, tokens: AuthTokens) => void;
};

export default function OAuthCallbackPage({ provider, endpoint, onAuthenticated }: OAuthCallbackPageProps) {
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
        const oauthCodeStorageKey = provider === "Google" ? ADMIN_GOOGLE_OAUTH_CODE_KEY : ADMIN_KAKAO_OAUTH_CODE_KEY;
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

  return (
    <div className="login-loading">
      <div className="login-loading-card">
        <div className="eyebrow">OAuth</div>
        <h1>{provider} 관리자 로그인 처리 중입니다.</h1>
        <p>잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}
