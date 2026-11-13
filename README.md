# The Global Chronicle

The Global Chronicle combines original newsroom reporting with live third-party headlines. Django/DRF owns accounts, roles, publishing, interactions, and provider credentials; the existing Next.js interface remains the reader experience.

## Local setup

1. Create and activate a Python virtual environment, then install dependencies:

   ```powershell
   .\venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

2. Copy [`.env.example`](.env.example) to a new root `.env` file and replace the placeholders. Django reads this file automatically; it is ignored by Git. Alternatively, set the same variables in PowerShell:

   ```powershell
   $env:DJANGO_SECRET_KEY = "replace-with-a-long-random-value"
   $env:NEWS_API_KEY = "your_newsapi_key"
   $env:GNEWS_API_KEY = "your_gnews_key"
   ```

   Keep these values on the Django server only. Do not use a `NEXT_PUBLIC_` prefix.

3. Create the database and an initial editor/admin user:

   ```powershell
   .\venv\Scripts\python.exe manage.py migrate
   .\venv\Scripts\python.exe manage.py createsuperuser
   ```

4. Start Django in one terminal:

   ```powershell
   .\venv\Scripts\python.exe manage.py runserver
   ```

5. In another terminal, start the frontend:

   ```powershell
   Set-Location .\nexa
   npm install
   npm run dev
   ```

   `nexa/.env.local` contains only the local Django API address and the site name. Adjust `DJANGO_API_URL` if Django uses a different host or port.

## Contribution and editorial roles

- New registrations are **authors**, so every registered user can upload original news and submit it for review.
- Promote users to **author** or **editor** through `/admin/` → Profiles.
- Authors create drafts in the in-app Publisher Studio and submit them.
- Editors publish submitted stories from Publisher Studio or Django admin. Django staff/superusers can also moderate comments.

## API behavior

- `GET /api/feed/` merges published Chronicle articles and third-party headlines, labelling each with `kind` (`original` or `external`).
- External interactions use a stable SHA-256-derived identifier based on the canonical publisher URL. Provider metadata is cached for three minutes and only minimal metadata is persisted for comments/bookmarks.
- If GNews or NewsAPI is unavailable, the feed still returns published original articles and includes a non-sensitive `provider_errors` field.
- Authentication uses DRF tokens. The frontend sends these only through its same-origin proxy routes.

## Verification

```powershell
.\venv\Scripts\python.exe manage.py test core -v 2
Set-Location .\nexa
npm run build
```

## Deployment

- `render.yaml` provisions the Django API and PostgreSQL database on Render.
- Deploy the `nexa` directory as the Vercel project and set `DJANGO_API_URL` to the Render API URL ending in `/api`.
- Set `NEWS_API_KEY` and `GNEWS_API_KEY` only on Render. Never add either key to Vercel or a `NEXT_PUBLIC_` variable.
- Render's filesystem is ephemeral by default. Attach a persistent disk and set `DJANGO_MEDIA_ROOT` to its mount path if uploaded cover images must persist across deploys.
