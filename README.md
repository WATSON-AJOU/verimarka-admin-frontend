# 관리자 페이지

로컬 기본 주소: `http://127.0.0.1:5174/`

## 로컬 실행

### 1. 의존성 설치
```bash
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-admin-frontend
npm install
```

### 2. 환경변수 확인
로컬 백엔드를 함께 띄우는 경우 API 주소는 보통 아래 값을 사용합니다.

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

필요하면 프로젝트 루트에 `.env.local`을 만들고 값을 넣습니다.

```bash
VITE_APP_NAME=VeriMarka Admin
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3. 개발 서버 실행
사용자 프론트의 기본 포트 `5173`과 충돌하지 않도록 관리자 프론트는 `5174`를 사용합니다.

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

브라우저에서 `http://127.0.0.1:5174/`로 접속합니다.

### 4. 빌드 확인
```bash
npm run build
```

## 백엔드와 같이 실행
백엔드는 별도 터미널에서 먼저 실행합니다.

```bash
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-BACKEND
USE_FAKE_REDIS=1 USE_FAKE_CELERY=1 DJANGO_SETTINGS_MODULE=config.settings.dev .venv/bin/python manage.py runserver 127.0.0.1:8000
```

관리자 로그인을 하려면 백엔드에서 관리자 계정을 만들어야 합니다.

## 관리자 계정 만들기
```zsh
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-BACKEND
python manage.py createsuperuser --settings=config.settings.dev

-- 운영
docker compose -f docker-compose.prod.yml exec verimarka-api python manage.py createsuperuser --settings=config.settings.prod

```

## CI/CD
GitHub Actions 워크플로는 `main` 브랜치 push 또는 수동 실행 시 관리자 프론트를 빌드한 뒤, 서버의 관리자 정적 경로로 `dist` 를 동기화합니다.

워크플로 파일:
`/.github/workflows/deploy-admin-frontend.yml`

필수 GitHub Secrets:
- `VITE_API_BASE_URL`
- `VITE_APP_NAME`
- `VITE_GOOGLE_REDIRECT_URI`
- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_KAKAO_CLIENT_ID`
- `ADMIN_FRONTEND_DEPLOY_HOST`
- `ADMIN_FRONTEND_DEPLOY_PORT`
- `ADMIN_FRONTEND_DEPLOY_USER`
- `ADMIN_FRONTEND_DEPLOY_SSH_KEY`
- `ADMIN_FRONTEND_DEPLOY_PATH`

선택 GitHub Secret:
- `ADMIN_FRONTEND_RELOAD_COMMAND`
- `ADMIN_FRONTEND_HEALTHCHECK_URL`
- `ADMIN_FRONTEND_HEALTHCHECK_RETRIES`
- `ADMIN_FRONTEND_HEALTHCHECK_INTERVAL_SECONDS`

권장 운영값:
- `ADMIN_FRONTEND_DEPLOY_PATH`: nginx가 바라보는 관리자 정적 경로
  `/usr/share/nginx/admin` 를 직접 쓰는 구조가 아니라면, 실제 서버에서 bind mount 원본인 `../verimarka-admin-frontend/dist` 경로를 넣어야 합니다.
- `ADMIN_FRONTEND_RELOAD_COMMAND`:
  ```zsh
  cd /opt/verimarka/verimarka-BACKEND && docker compose -f docker-compose.prod.yml exec -T verimarka-nginx nginx -s reload
  ```
- `ADMIN_FRONTEND_HEALTHCHECK_URL`: 배포 직후 관리자 프론트 확인용 URL
  예: `https://admin.verimarka.com/health/`
- `ADMIN_FRONTEND_HEALTHCHECK_RETRIES`: 헬스체크 재시도 횟수
- `ADMIN_FRONTEND_HEALTHCHECK_INTERVAL_SECONDS`: 헬스체크 재시도 간격(초)

현재 운영 compose 기준으로 nginx는 관리자 프론트를 아래 경로에서 읽습니다.
`../verimarka-admin-frontend/dist:/usr/share/nginx/admin:ro`

배포 중 `rsync`, nginx reload, `ADMIN_FRONTEND_HEALTHCHECK_URL` 검증 중 하나라도 실패하면 직전 `dist` 백업본으로 자동 복원합니다.

기본 헬스 엔드포인트는 `GET /health/` 입니다.
