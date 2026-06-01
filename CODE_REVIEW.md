# Phân Tích Toàn Bộ Mã Nguồn - VioTune

Tài liệu này tóm tắt phân tích codebase, các điểm mạnh, vấn đề cần chú ý và đề xuất hành động ưu tiên để cải thiện chất lượng, hiệu năng và vận hành.

**Tổng Quan**
- **Kiến trúc**: Ứng dụng gồm hai thành phần chính: `frontend` (React) và `recommendation` (Python + FastAPI).
- **Mô-đun chính**: Backend chứa các thuật toán recommendation (`src/collaborative.py`, `src/content_based.py`, `src/hybrid.py`) và API (`api/app.py`). Frontend là SPA React dùng context để quản lý auth/playback.

**Điểm mạnh nổi bật**
- **Thiết kế hybrid**: Kết hợp Content-Based (KNN/Annoy) và Collaborative (SVD) với trọng số linh hoạt (`alpha`) là cách tiếp cận thực tế, hỗ trợ cold-start.
- **Fallbacks & Pragmatism**: Content-based fallback về CSV khi SQLite không có; content có fallback khi `annoy` không cài.
- **Cơ chế cache Deezer**: Lưu preview vào SQLite giúp giảm gọi API bên thứ ba.
- **Fold-in projection**: `compute_user_latent_vector` trong SVD cho phép dự đoán thời gian thực cho người dùng mới mà không huấn luyện lại toàn bộ mô hình.

**Vấn đề chính & Rủi ro**

**1) Khởi tạo & side-effects khi import**
- `recommendation/src/collaborative.py` và `content_based.py` tải dữ liệu, khởi tạo/training model và thậm chí train tại thời điểm import: điều này gây chậm khởi động, khó test, và có thể chặn worker/process.
- Hành động nặng khi import làm cho `uvicorn`/FastAPI không phù hợp nếu chạy trong môi trường serverless hoặc scale nhanh.

**2) Trạng thái toàn cục & concurrency**
- Nhiều biến global (ví dụ `svd`, `user_index`, `track_index`, `songs`, `songs_df`, `user_likes`) dẫn đến khó khăn khi scale nhiều process/instance; `user_likes` chỉ lưu trong RAM→ mất khi restart.

**3) Hiệu năng & tài nguyên**
- KNN mặc định tìm `N_NEIGHBORS_TO_SEARCH = 1000` và fallback dùng `brute` cosine — tốn CPU/RAM cho dataset lớn.
- Training SVD tự viết bằng NumPy có thể chậm so với optimized libraries (Surprise, implicit, LightFM, or accelerated BLAS).

**4) Thiết kế API & reliability**
- Một số thao tác I/O (ví dụ `fetch_firestore_interactions`, retrain task) chạy đồng bộ/blocking hoặc bị gọi trong request path (một phần gọi trong `recommend_cf`). Thiết kế này có thể gây timeout.
- CORS được cấu hình từ env, nhưng mặc định `ALLOWED_ORIGINS` có thể là `*` → kiểm soát origin nên được chặt chẽ.

**5) Xử lý lỗi & tính nhất quán kiểu dữ liệu**
- Một vài function trả `str` để báo lỗi thay vì raise exception hoặc trả schema cố định (→ khiến controller phải kiểm tra kiểu trả về).
- Truy vấn DB/CSV thiếu xác thực/validation trên đầu vào.

**6) Bảo mật & cấu hình**
- Đường dẫn `FIREBASE_CREDENTIALS_PATH` đọc từ `.env` — cần đảm bảo file này không nằm trong repo và quyền truy cập được quản lý.
- Endpoint `/recommend/retrain` khởi động quá trình huấn luyện lại không có kiểm soát (auth/limit) → có thể bị abuse.

**Phân tích chi tiết theo module**

**`src/content_based.py`**
- Mô tả: chuẩn hóa features, build Annoy index nếu có, fallback to scikit-learn NearestNeighbors.
- Tốt: weighting features, boost theo genre/artist/popularity, support Annoy.
- Cần chú ý:
  - Cách chuyển `angular_distances` từ Annoy: code hiện tại tính `distances = np.array([float(d)**2 / 2.0 for d in angular_distances])` — hãy kiểm tra công thức với phiên bản Annoy/metric để đảm bảo không sai lệch (Annoy trả distance dạng angular already related to cosine).
  - Việc lấy artists bằng `split(";")` phụ thuộc vào định dạng dữ liệu; cần chuẩn hoá artists khi load.
  - Trả về `DataFrame` hoặc `str` (error) → không đồng nhất.

**`src/collaborative.py`**
- Mô tả: SVD tự triển khai bằng NumPy, fold-in projection, lưu `.npy` files.
- Tốt: có cơ chế lưu/tải model, compute_user_latent_vector hỗ trợ realtime personalization.
- Cần cải thiện:
  - Huấn luyện model ở thời điểm import (nên tách process huấn luyện riêng hoặc lazy-load model đã train).
  - Vòng lặp SGD hiện tại không vectorized cho tất cả cập nhật — có thể tối ưu bằng numba/numexpr hoặc chuyển sang thư viện optimized.
  - `fetch_firestore_interactions` có 2 cơ chế; tốt nhưng cần retry, backoff, và rate-limit.

**`src/hybrid.py`**
- Mô tả: Kết hợp kết quả từ content và cf bằng Reciprocal Rank Scoring với trọng số `alpha`.
- Gợi ý: kết quả dùng `track_name` làm key để hợp nhất — có thể có collision (2 track_name giống nhau khác track_id). Nên dùng `track_id` làm key chính.

**`api/app.py`**
- Mô tả: FastAPI endpoints cho recommend, search, preview, playlists, v.v.
- Cần chú ý:
  - Một số endpoint thao tác trực tiếp với filesystem/DB tại runtime; nên dùng connection pooling cho SQLite hoặc chuyển sang Postgres cho production.
  - Endpoint `/songs/preview` ghi cache SQLite trong request — cần transaction an toàn và TTL cho cache; thêm background job để refresh cache.
  - Thiếu validation bằng Pydantic models cho payload/response (hiện dùng dicts/DataFrame conversion).

**`frontend`**
- Mô tả: React SPA, routing có `ProtectedRoute`, context cho Auth/Playback.
- Gợi ý cải thiện:
  - Tạo một API client (axios/fetch wrapper) tập trung để xử lý lỗi, retry, cancel token và base URL.
  - Thêm skeleton/loading UI, error boundaries, và quản lý trạng thái theo cách tránh prop drilling (hiện đã dùng Context tốt).
  - Thiết lập unit test cho critical components; có `App.test.js` nhưng coverage có thể mở rộng.

**Best Practices & Quick Wins (Ưu tiên)**
- **1. Ngăn chặn huấn luyện tại import**: di chuyển logic train vào script CLI riêng (`train.py`) hoặc job queue; khi khởi động API chỉ load model đã train.
- **2. Chuẩn hoá trả về API**: dùng Pydantic schemas cho response/requests để đồng nhất và dễ test.
- **3. Thay global state bằng storage/caches**: `user_likes` -> persistent store (Redis/Postgres); model artifacts -> object storage.
- **4. Cải thiện caching Deezer**: thêm TTL, backoff, và kiểm soát lỗi; tách ra service/celery job.
- **5. Thêm CI lint/test**: flake8/black/isort, eslint, unit tests cho backend và frontend.
- **6. Bảo mật endpoint nhạy cảm**: bảo vệ `/recommend/retrain` bằng auth và rate-limiting.

**Kiến nghị dài hạn (Architecture / Ops)**
- Containerize backend (`Dockerfile`) và frontend, dùng orchestration (k8s) cho scale.
- Dùng task queue (Celery/RQ) cho việc huấn luyện lại và các job nặng.
- Thay SQLite bằng DB production (Postgres) nếu muốn scale tính năng search/joins hoặc cache metadata lớn.
- Sử dụng FAISS/Annoy prebuilt indices lưu trên đĩa để load nhanh.

**Checklist hành động gợi ý (ngắn hạn, 30 ngày)**
1. Tách `train` khỏi import, thêm script `recommendation/train.py` và test chạy offline.
2. Thêm Pydantic models cho endpoints chính (`/recommend`, `/recommend/content`, `/songs/preview`).
3. Di chuyển `user_likes` vào Redis hoặc DB nhỏ; thêm migration script.
4. Bảo vệ endpoint retrain (Auth + Rate limiting) và log audit.
5. Thiết lập linting + pre-commit và chạy tests trong CI.

---
Nếu bạn muốn, tôi có thể:
- Tạo PR mẫu tách logic huấn luyện ra file `train.py` và thay import hiện tại bằng lazy-load model đã train.
- Viết Pydantic schemas cho một hoặc hai endpoints mẫu.

File này được tạo tự động bằng phân tích nhanh các file chính; nếu bạn muốn, tôi có thể mở rộng chi tiết từng file cụ thể và chỉ ra dòng code đề xuất sửa.
