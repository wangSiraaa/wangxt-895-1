# Trae Preflight

This folder is prepared for `wangxt-895-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18195
- API_PORT: 19195
- WEB_PORT: 20195
- DB_PORT: 21195
- REDIS_PORT: 22195

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
