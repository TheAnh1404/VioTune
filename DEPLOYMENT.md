# Production Deployment

## Required Configuration

Copy values from the `.env.example` files into the deployment platform's secret manager. Do not deploy repository `.env` files.

The backend must run with:

- `ENVIRONMENT=production`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_USE_ADMIN_SDK=true`
- Application Default Credentials or `FIREBASE_CREDENTIALS_PATH`
- `ALLOWED_ORIGINS` set to the deployed frontend origin

Deploy `firestore.rules` so direct client access is denied. The FastAPI service uses the Firestore server SDK and IAM.

`viotune.db` is a runtime artifact and is not committed. On first startup, the backend creates it and imports the song catalog from `recommendation/data/dataset.csv`.

## Build and Start

```bash
docker build -t viotune-api recommendation
docker run --env-file recommendation/.env -p 8000:8000 viotune-api
```

Build the frontend with its Firebase web configuration and production API URL:

```bash
cd frontend
npm ci
npm run lint
npm test -- --watchAll=false --runInBand
npm run build
```

For the frontend container, pass the same `REACT_APP_*` values as Docker build arguments.

## Release Checks

- `GET /health/live` returns `{"status":"ok"}`.
- `GET /health/ready` reports the loaded song count.
- Unauthenticated private API requests return `401`.
- A user cannot read or mutate another user's likes, history, recommendations, or playlists.
- Only a Firebase token with custom claim `admin=true` can call `POST /recommend/retrain`.

Set the `admin` custom claim with trusted Firebase Admin tooling. The user must refresh their ID token or sign in again before the frontend exposes retraining controls.
