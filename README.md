# 관리자 페이지

## 관리자 계정 만들기
```zsh
cd /Users/emfpdlzj/Desktop/verimarka/verimarka-BACKEND
python manage.py createsuperuser --settings=config.settings.dev

-- 운영
docker compose -f docker-compose.prod.yml exec verimarka-api python manage.py createsuperuser --settings=config.settings.prod

```