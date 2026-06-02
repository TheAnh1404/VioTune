// ─── VioTune API Configuration ────────────────────────────────────────────────
// Single source of truth for the backend API base URL.
// All components must import API_URL from here instead of hardcoding localhost.
export const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
