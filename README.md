# 관리자 페이지

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

권장 운영값:
- `ADMIN_FRONTEND_DEPLOY_PATH`: nginx가 바라보는 관리자 정적 경로
  `/usr/share/nginx/admin` 를 직접 쓰는 구조가 아니라면, 실제 서버에서 bind mount 원본인 `../verimarka-admin-frontend/dist` 경로를 넣어야 합니다.
- `ADMIN_FRONTEND_RELOAD_COMMAND`:
  ```zsh
  cd /opt/verimarka/verimarka-BACKEND && docker compose -f docker-compose.prod.yml exec -T verimarka-nginx nginx -s reload
  ```

현재 운영 compose 기준으로 nginx는 관리자 프론트를 아래 경로에서 읽습니다.
`../verimarka-admin-frontend/dist:/usr/share/nginx/admin:ro`
