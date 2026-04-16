import appleLogo from "../../assets/applelogo.svg";
import googleLogo from "../../assets/googlelogo.svg";
import kakaoLogo from "../../assets/kakaologo.svg";

type LoginPageProps = {
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
};

export default function LoginPage({
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
}: LoginPageProps) {
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
            <input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="admin@verimarka.com" autoComplete="username" disabled={loading || submitting} />
          </label>
          <label className="login-field">
            <span>비밀번호</span>
            <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="비밀번호를 입력하세요" autoComplete="current-password" disabled={loading || submitting} />
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
