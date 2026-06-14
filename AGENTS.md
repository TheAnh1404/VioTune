# Repository Guidelines

## Project Structure & Module Organization

VioTune is split into two applications:

- `frontend/` contains the React 19 client. Put reusable UI in `src/components/`, route-level views in `src/pages/`, shared state in `src/context/`, and images in `src/assets/`. Component styles are colocated as `ComponentName.module.css`.
- `recommendation/` contains the FastAPI and recommendation service. API routes and database adapters live in `api/`; content-based, collaborative, and hybrid algorithms live in `src/`; datasets and SQLite state live in `data/`; trained NumPy weights live in `models/`.

Keep API behavior out of React components and keep HTTP routing separate from recommendation algorithms.

## Build, Test, and Development Commands

Run frontend commands from `frontend/`:

- `npm ci` installs the locked dependency set.
- `npm start` starts the development server at `http://localhost:3000`.
- `npm test -- --watchAll=false` runs Jest and React Testing Library once.
- `npm run build` creates the production bundle in `build/`.

Run backend commands from `recommendation/` after activating the root `.venv`:

- `python -m pip install -r requirements.txt` installs Python dependencies.
- `uvicorn api.app:app --reload` starts the API at `http://127.0.0.1:8000`.
- `python -m unittest discover -s tests -v` runs backend security/API tests.
- `python test_content.py` exercises content recommendations.

## Coding Style & Naming Conventions

Use two-space indentation and single quotes in JavaScript. Prefer functional React components and hooks. Name components and their folders in PascalCase, such as `MusicPlayer/MusicPlayer.js`; use camelCase for props and functions. Use CSS Modules instead of global styles for component-specific rules.

Follow PEP 8 for Python: four-space indentation, snake_case functions and modules, and PascalCase Pydantic models. Add endpoints in `api/app.py` and reusable recommendation logic in `src/`.

## Testing Guidelines

Name frontend tests `*.test.js` and colocate them near the tested module. Backend tests live in `recommendation/tests/` and use `unittest`. Add focused tests for changed API behavior, recommendation ranking, or database constraints. No coverage threshold is currently enforced.

## Commit & Pull Request Guidelines

History follows Conventional Commit-style subjects, primarily `feat:` and `chore:`. Use an imperative, scoped summary, for example `feat: add playlist recommendation endpoint`. Pull requests should explain behavior changes, list verification commands, link related issues, and include screenshots for visible UI changes.

## Security & Configuration

Frontend and backend settings live in their respective `.env` files. Do not introduce new secrets or expose credentials in logs. Treat changes to `data/`, `models/`, and `viotune.db` as intentional artifacts; document why regenerated files are included.
