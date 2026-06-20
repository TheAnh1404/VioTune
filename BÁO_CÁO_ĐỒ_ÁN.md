# BÁO CÁO ĐỒ ÁN: VIOTUNE
## Nền Tảng Khám Phá Âm Nhạc Thông Minh Sử Dụng Hệ Thống Gợi Ý Lai (Hybrid Recommendation System)

---

**Nhóm thực hiện:** VioTune Team 6  
**Dự án:** VioTune – Intelligent Music Discovery & Recommendation Platform  
**Repository:** [VioTune](https://github.com/TheAnh1404/VioTune)  
**Ngày báo cáo:** 20/06/2026

---

## MỤC LỤC

1. [Bối Cảnh & Động Lực](#1-bối-cảnh--động-lực-slide-2)
2. [Mô Tả Bài Toán & Mô Hình Hóa](#2-mô-tả-bài-toán--mô-hình-hóa-slide-3)
3. [Phương Pháp Gợi Ý](#3-phương-pháp-gợi-ý-slide-4)
4. [Triển Khai Hệ Thống](#4-triển-khai-hệ-thống-slide-5)
5. [Đánh Giá & Kết Quả](#5-đánh-giá--kết-quả-slide-6)
6. [Thảo Luận & Hướng Phát Triển](#6-thảo-luận--hướng-phát-triển-slide-7)
7. [Kết Luận](#7-kết-luận-slide-8)

---

## 1. BỐI CẢNH & ĐỘNG LỰC (Slide 2)

### 1.1 Vấn Đề: Quá Tải Thông Tin Trong Kỷ Nguyên Số

Trong thời đại kỹ thuật số hiện nay, các nền tảng phát nhạc trực tuyến sở hữu hàng triệu bản nhạc. Người dùng thường xuyên rơi vào trạng thái **"quá tải thông tin" (Information Overload)** — một hiện tượng phổ biến khi lượng dữ liệu vượt quá khả năng xử lý và lựa chọn của con người. Với hơn **114.000 bản nhạc** thuộc **114 thể loại** từ **31.437 nghệ sĩ** trong bộ dữ liệu của VioTune, việc tìm ra một bài hát phù hợp trở nên vô cùng khó khăn nếu không có sự hỗ trợ của công nghệ.

### 1.2 Giải Pháp: Hệ Thống Gợi Ý — "Xương Sống" Của Nền Tảng Âm Nhạc

Hệ thống gợi ý (Recommendation Systems) đóng vai trò như **"xương sống"** cho các nền tảng hàng đầu như Spotify, Apple Music, và YouTube Music. Chúng hoạt động như một bộ lọc thông minh, giúp người dùng khám phá âm nhạc mới phù hợp với sở thích cá nhân mà không cần phải lãng phí thời gian tìm kiếm thủ công.

### 1.3 Tầm Quan Trọng

| Khía cạnh | Giải thích |
|---|---|
| **Tăng tỷ lệ giữ chân người dùng (User Retention)** | Gợi ý đúng gu giúp người dùng gắn bó lâu hơn với nền tảng |
| **Cải thiện khả năng tiếp cận nội dung** | Các bài hát ít phổ biến (long-tail content) cũng được phát hiện |
| **Trải nghiệm cá nhân hóa cao** | Mỗi người dùng có một "bản đồ âm nhạc" riêng biệt |
| **Tạo giá trị kinh doanh** | Tăng thời gian sử dụng, tăng engagement và subscription |

---

## 2. MÔ TẢ BÀI TOÁN & MÔ HÌNH HÓA (Slide 3)

### 2.1 Vấn Đề Nghiên Cứu: Bài Toán Ma Trận Thưa (Sparsity Problem)

**Câu hỏi nghiên cứu:** Làm thế nào để dự đoán chính xác sở thích của người dùng khi dữ liệu tương tác (interaction data) cực kỳ thưa thớt?

Trong dữ liệu thực tế của VioTune:
- **200 người dùng** × **114.000 bài hát** = **~17.948.200 ô ma trận** tiềm năng
- Chỉ có **9.266 lượt tương tác** thực tế
- **Tỷ lệ thưa (Sparsity): 99,95%** — nghĩa là hệ thống chỉ biết được 0,05% sở thích, phải **suy luận** 99,95% còn lại

### 2.2 Mô Hình Hóa Bài Toán: Ma Trận User-Item

Bài toán được mô hình hóa thông qua việc xây dựng **Ma trận tương tác User-Item (User-Item Interaction Matrix)** để biểu diễn mối quan hệ giữa người nghe và bài hát.

```
                Bài hát 1    Bài hát 2    Bài hát 3    ...    Bài hát n
User 1          r₁₁          ?            r₁₃          ...    ?
User 2          ?            r₂₂          ?            ...    r₂ₙ
User 3          r₃₁          ?            ?            ...    ?
...             ...          ...          ...          ...    ...
User m          ?            rₘ₂          ?            ...    ?

(? = Giá trị cần dự đoán)
```

### 2.3 Mô Hình Hóa Toán Học

Gọi **R** là ma trận kích thước **m × n** với:
- **m** = số lượng người dùng (m = 200 trong VioTune)
- **n** = số lượng bài hát (n = 8.692 bài đã có tương tác, tổng 114.000 trong kho)
- Mỗi phần tử **r_ui** biểu diễn điểm phản hồi (feedback score) của user `u` đối với item `i`

**Phương pháp tính điểm phản hồi:** VioTune sử dụng **Implicit Feedback** — dữ liệu hành vi nghe nhạc (`play_count`) thay vì đánh giá sao rõ ràng. Điểm phản hồi được chuẩn hóa bằng **Log Normalization**:

```
rating = log₁ₚ(play_count) = ln(1 + play_count)
```

Công thức này giúp cân bằng sự chênh lệch giữa người nghe 1 lần và 100 lần, tránh thiên lệch.

### 2.4 Mục Tiêu

**Dự đoán các giá trị thiếu** (missing values) trong ma trận R bằng cách phân tích R thành tích của hai ma trận nhân tử ẩn (latent factor vectors):

```
R ≈ P × Qᵀ + bias
```

Trong đó:
- **P** (m × k): Ma trận nhân tử người dùng (User latent matrix)
- **Q** (n × k): Ma trận nhân tử bài hát (Item latent matrix)
- **k** = 50: Số chiều ẩn (latent dimensions) — biểu diễn "gu thẩm mỹ ẩn" của user/bài hát

---

## 3. PHƯƠNG PHÁP GỢI Ý (Slide 4)

### 3.1 Ý Tưởng Cốt Lõi

VioTune sử dụng hai phương pháp chính kết hợp lại:

1. **Matrix Factorization (SVD):** Phân tích ma trận R thành các nhân tử ẩn để phát hiện "gu âm nhạc ẩn" của từng người dùng
2. **Cosine Similarity + KNN:** Đo độ tương đồng giữa các bài hát dựa trên đặc trưng âm thanh để tìm "anh em song sinh âm nhạc" (musical soulmates)

### 3.2 Thuật Toán Chi Tiết

#### 3.2.1 Collaborative Filtering — SVD Matrix Factorization

**Tệp triển khai:** `recommendation/src/collaborative.py`

**Mô hình dự đoán (Bias Model):**

```
r̂_ui = μ + b_u + b_i + Q[i] · P[u]
```

Trong đó:
| Ký hiệu | Ý nghĩa | Giá trị trong VioTune |
|---|---|---|
| **μ** | Trung bình toàn cục của tất cả rating | Tính từ tập train |
| **b_u** | Bias riêng của user u (thích nghe nhiều hay ít) | Vector (200,) |
| **b_i** | Bias riêng của item i (bài hát phổ biến hay không) | Vector (8692,) |
| **Q[i]** | Vector biểu diễn ẩn của bài hát i | Ma trận (8692 × 50) ≈ 3.4 MB |
| **P[u]** | Vector biểu diễn ẩn của user u | Ma trận (200 × 50) ≈ 78 KB |

**Hàm mất mát (Regularized MSE Loss):**

```
Loss = Σ(r_ui - r̂_ui)² + λ(||Q[i]||² + ||P[u]||² + b_u² + b_i²)
```

**Tối ưu hóa bằng SGD (Stochastic Gradient Descent):**

```python
# Quy tắc cập nhật cho mỗi cặp (u, i) quan sát được:
e_ui = r_ui - r̂_ui                              # Sai số

b_u ← b_u + γ(e_ui - λ · b_u)                   # Cập nhật bias user
b_i ← b_i + γ(e_ui - λ · b_i)                   # Cập nhật bias item
P[u] ← P[u] + γ(e_ui · Q[i] - λ · P[u])         # Cập nhật latent user
Q[i] ← Q[i] + γ(e_ui · P[u]_old - λ · Q[i])     # Cập nhật latent item
```

**Siêu tham số (Hyperparameters):**

| Tham số | Giá trị | Mô tả |
|---|---|---|
| k (latent factors) | 50 | Số chiều ẩn biểu diễn |
| γ (learning rate) | 0.005 | Tốc độ học |
| λ (regularization) | 0.02 | Hệ số điều chuẩn chống overfitting |
| epochs | 30 | Số vòng lặp huấn luyện |

**Chiến lược Real-time (Fold-in Projection):** Khi có user mới hoặc user cập nhật thói quen nghe, VioTune sử dụng kỹ thuật **Fold-in Projection** để tính toán vector P_u và bias b_u ngay lập tức (<1ms) mà **không cần huấn luyện lại** toàn bộ mô hình SVD:

```python
def compute_user_latent_vector(self, user_ratings, n_iterations=30):
    p_u = np.zeros(self.k)
    b_u = 0.0
    for _ in range(n_iterations):
        for i_idx, r in user_ratings:
            pred = self.mu + b_u + self.b_i[i_idx] + self.Q[i_idx].dot(p_u)
            e = r - pred
            b_u += self.lr * (e - self.reg * b_u)
            p_u += self.lr * (e * self.Q[i_idx] - self.reg * p_u)
    return p_u, b_u
```

#### 3.2.2 Content-Based Filtering — KNN với Cosine Similarity

**Tệp triển khai:** `recommendation/src/content_based.py`

**Đặc trưng âm thanh sử dụng (7 features):**

| Feature | Trọng số | Ý nghĩa |
|---|---|---|
| danceability | 1.2 | Tính nhịp nhảy |
| energy | 1.1 | Năng lượng bài hát |
| acousticness | 0.9 | Tính acoustic |
| instrumentalness | 0.7 | Tính instrumental (nhạc không lời) |
| liveness | 0.6 | Tính live (thu trực tiếp) |
| valence | 1.2 | Cảm xúc tích cực/tiêu cực |
| tempo | 1.0 | Nhịp độ (BPM) |

> **Lưu ý:** Trọng số được thiết kế để tăng cường vai trò của nhịp điệu (danceability) và cảm xúc (valence/energy), giảm vai trò của liveness và instrumentalness (dễ gây nhiễu nếu thiếu hụt dữ liệu).

**Pipeline xử lý:**

1. **Chuẩn hóa (Normalization):** Sử dụng `MinMaxScaler` để đưa tất cả features về khoảng [0, 1]
2. **Áp trọng số (Weighted Features):** Nhân từng feature với trọng số tương ứng
3. **Tìm kiếm láng giềng (Nearest Neighbors):** Sử dụng thuật toán **KNN** với metric **Cosine Distance** (1000 neighbors) hoặc **Annoy Index** (Approximate Nearest Neighbors Oh Yeah — thuật toán do Spotify phát triển) nếu có package
4. **Chấm điểm kết hợp Metadata (Re-ranking):**
   - **Khớp thể loại:** +0.10 điểm
   - **Khớp nghệ sĩ:** +0.15 điểm
   - **Độ phổ biến (Popularity Boost):** +0.05 max (tuyến tính theo popularity/100)

#### 3.2.3 Hybrid Recommendation — Weighted Reciprocal Rank Scoring

**Tệp triển khai:** `recommendation/src/hybrid.py`

Hệ thống Hybrid kết hợp kết quả từ cả hai mô hình bằng phương pháp **Weighted Reciprocal Rank Scoring (RRS):**

```
Score_final(song) = α × RRS_ContentBased(song) + β × RRS_CollaborativeFiltering(song)
```

Trong đó:
- **α** (alpha): Trọng số cho Content-Based (mặc định = 0.5)
- **β = 1 - α**: Trọng số cho Collaborative Filtering
- **RRS(song) = 1 / (rank + 1):** Điểm Reciprocal Rank — bài xếp hạng 1 nhận 1.0 điểm, hạng 2 nhận 0.5, hạng 3 nhận 0.33,...

**Ưu điểm của RRS:** Khi một bài hát xuất hiện đồng thời ở cả hai mô hình (giao thoa), nó nhận được **điểm cộng dồn** từ cả hai — tạo ra hiệu ứng "đồng thuận" (consensus effect) giúp tăng độ tin cậy của gợi ý.

### 3.3 Thu Thập Dữ Liệu

| Nguồn dữ liệu | Mô tả | Quy mô |
|---|---|---|
| **Spotify Tracks Dataset (Kaggle)** | Bộ dữ liệu công khai chứa metadata và đặc trưng audio | 114.000 bản nhạc, 21 thuộc tính |
| **Synthetic Interactions** | Dữ liệu tương tác giả lập bằng thuật toán mô phỏng hành vi | 200 users, 9.266 lượt tương tác |
| **Firestore Real-time Data** | Lịch sử nghe thực (play_history) và bài hát yêu thích (liked_songs) | Thu thập liên tục từ người dùng thực |
| **Deezer API** | Nhạc preview 30 giây và ảnh bìa album | Gọi API và cache trong SQLite |

---

## 4. TRIỂN KHAI HỆ THỐNG (Slide 5)

### 4.1 Môi Trường Phát Triển

| Công cụ | Mục đích |
|---|---|
| **Python 3.x** | Ngôn ngữ chính cho Backend & ML |
| **React 19** | Frontend framework |
| **FastAPI** | Backend RESTful API framework (bất đồng bộ) |
| **SQLite** | Cơ sở dữ liệu cục bộ (viotune.db ≈ 28.2 MB) |
| **Google Firestore** | Cơ sở dữ liệu đám mây (user profiles, likes, history) |
| **Firebase Auth** | Xác thực người dùng (Email/Google/Facebook) |
| **Deezer API** | Nguồn nhạc preview 30s và ảnh bìa |
| **GitHub** | Quản lý mã nguồn và cộng tác nhóm |

### 4.2 Kiến Trúc Hệ Thống — 4 Lớp (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│         React 19 + React Router DOM v7 + CSS Modules            │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐    │
│    │ HomePage  │ │SearchPage│ │PlayerPage│ │ PlaylistsPage │    │
│    └──────────┘ └──────────┘ └──────────┘ └───────────────┘    │
│    ┌───────────────────────┐  ┌───────────────────────────┐    │
│    │ AuthContext (Auth)    │  │ PlaybackContext (Audio)   │    │
│    └───────────────────────┘  └───────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                             │
│              FastAPI + Uvicorn (Async Python)                   │
│    ┌──────────────────────────────────────────────────────┐     │
│    │ api/app.py — 1166 dòng, 30+ API Endpoints            │     │
│    │  • /recommend (Hybrid)    • /recommend/content (CB)  │     │
│    │  • /recommend/cf (CF)     • /recommend/retrain       │     │
│    │  • /songs/search          • /songs/preview (Deezer)  │     │
│    │  • /api/auth/signup       • /api/auth/signin         │     │
│    │  • /songs/{id}/like       • /songs/history           │     │
│    │  • /playlists CRUD        • /genres, /artists        │     │
│    └──────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│                    MODEL LAYER                                   │
│           Scikit-learn + NumPy + Pandas                         │
│    ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐    │
│    │ SVD Model (CF)  │ │ KNN Model (CB)  │ │ Hybrid Engine│    │
│    │ collaborative.py│ │ content_based.py│ │  hybrid.py   │    │
│    │ P(200×50)=78KB  │ │ 7 features,     │ │ RRS Scoring  │    │
│    │ Q(8692×50)=3.4MB│ │ Cosine Distance │ │ α = 0.5      │    │
│    └─────────────────┘ └─────────────────┘ └──────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                    DATA LAYER                                    │
│    ┌──────────────────┐ ┌───────────────┐ ┌────────────────┐   │
│    │ SQLite (viotune. │ │ Firestore     │ │ Deezer API     │   │
│    │ db = 28.2 MB)    │ │ (Cloud NoSQL) │ │ (External)     │   │
│    │ • songs (114K)   │ │ • users       │ │ • Preview URL  │   │
│    │ • deezer_cache   │ │ • liked_songs │ │ • Cover Art    │   │
│    │ • liked_songs    │ │ • play_history│ │ • 30s MP3      │   │
│    │ • play_history   │ │ • playlists   │ │                │   │
│    │ • playlists      │ │               │ │                │   │
│    └──────────────────┘ └───────────────┘ └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Chi Tiết Các Thành Phần

#### 4.3.1 Frontend — React 19

**Cấu trúc thành phần:**

| Thành phần | Chức năng |
|---|---|
| **Onboarding** | Trang chào mừng đầu tiên |
| **Login** | Đăng nhập / Đăng ký (Email, Google, Facebook) |
| **HomePage** | Dashboard chính với gợi ý cá nhân hóa |
| **SearchPage** | Tìm kiếm bài hát theo tên, nghệ sĩ, thể loại |
| **PlayerPage** | Trình phát nhạc với visualizer |
| **PlaylistsPage** | Quản lý playlist cá nhân |
| **ArtistPage** | Trang chi tiết nghệ sĩ |
| **AIRecommendationStation** | Hub gợi ý AI trung tâm |
| **AcousticDNARadar** | Biểu đồ Radar hiển thị "DNA âm thanh" cá nhân |
| **MusicVisualizer** | Hiệu ứng hình ảnh khi nghe nhạc |
| **MusicPlayer** | Trình phát nhạc mini (bottom bar) |

**Quản lý trạng thái:**
- **AuthContext:** Quản lý xác thực, danh sách bài hát yêu thích, lịch sử nghe, đăng nhập xã hội (Google/Facebook)
- **PlaybackContext:** Quản lý trạng thái phát nhạc, queue, shuffle, repeat, volume, tìm nạp preview từ Deezer API

**Thư viện Frontend:**

| Package | Phiên bản | Vai trò |
|---|---|---|
| react | 19.2.4 | UI Framework |
| react-router-dom | 7.13.2 | Định tuyến SPA |
| firebase | 12.14.0 | Firebase Auth SDK |
| lucide-react | 1.7.0 | Icon library |
| recharts | 3.8.1 | Biểu đồ & visualization |

#### 4.3.2 Backend — FastAPI

**API Endpoints chính (30+ endpoints):**

| Nhóm | Endpoint | Method | Mô tả |
|---|---|---|---|
| **Recommendation** | `/recommend` | GET | Hybrid Recommendation (CB + CF) |
| | `/recommend/content` | GET | Content-Based only |
| | `/recommend/cf` | GET | Collaborative Filtering only |
| | `/recommend/retrain` | POST | Kích hoạt huấn luyện lại SVD ngầm (Background Task) |
| **Authentication** | `/api/auth/signup` | POST | Đăng ký tài khoản |
| | `/api/auth/signin` | POST | Đăng nhập |
| | `/api/auth/reset-password` | POST | Đặt lại mật khẩu |
| **Songs** | `/songs/search` | GET | Tìm kiếm bài hát |
| | `/songs/{track_id}` | GET | Chi tiết bài hát |
| | `/songs/preview` | GET | Proxy lấy preview 30s từ Deezer |
| | `/songs/{track_id}/like` | POST/DELETE | Like/Unlike bài hát |
| | `/songs/{track_id}/play` | POST | Ghi nhận lịch sử nghe |
| | `/songs/liked` | GET | Danh sách bài hát đã thích |
| | `/songs/history` | GET | Lịch sử phát nhạc |
| | `/songs/dailypick` | GET | Gợi ý bài hát hàng ngày |
| | `/songs/random` | GET | Bài hát ngẫu nhiên |
| **Playlists** | `/playlists` | GET/POST | Lấy/Tạo playlist |
| | `/playlists/{id}/songs` | GET/POST/DELETE | Quản lý bài trong playlist |
| | `/users/{id}/playlists` | GET | Danh sách playlist của user |
| **Metadata** | `/genres` | GET | Danh sách thể loại |
| | `/artists` | GET | Danh sách nghệ sĩ phổ biến |
| | `/users/{id}/taste-profile` | GET | Phân tích gu âm nhạc cá nhân |

#### 4.3.3 Cơ Sở Dữ Liệu — Kiến Trúc Dual-Storage

VioTune sử dụng kiến trúc **song song (Dual-Storage):**

**SQLite (Local — `viotune.db`):**
- Lưu trữ metadata 114.000 bài hát
- Cache kết quả Deezer API để tránh gọi API lặp lại
- Lưu trữ bản sao liked_songs, play_history (local backup)
- Sử dụng **WAL mode** (Write-Ahead Logging) để tăng hiệu suất ghi đồng thời
- Có **Foreign Key constraints** và **optimized indexes**

**Firestore (Cloud — Google Cloud):**
- Lưu trữ user profiles, liked songs, play history (source of truth)
- Tương tác qua **REST API** thuần (không dùng SDK server-side) để giảm dependency
- Hỗ trợ pagination, structured query, real-time sync

### 4.4 Giao Diện Người Dùng

Giao diện VioTune được thiết kế theo phong cách **modern dashboard** với các đặc điểm:

- **Dashboard cá nhân hóa** với playlist gợi ý, biểu đồ trending, và AI recommendation station
- **Trình phát nhạc** tích hợp preview 30 giây từ Deezer với hỗ trợ queue, shuffle, repeat
- **Acoustic DNA Radar** — Biểu đồ hình radar thể hiện "DNA âm thanh" cá nhân (danceability, energy, valence, acousticness, liveness, instrumentalness)
- **Music Visualizer** — Hiệu ứng hình ảnh động theo âm nhạc
- **Responsive Design** — Hỗ trợ đa thiết bị qua CSS Modules
- **Social Login** — Đăng nhập nhanh qua Google/Facebook
- **Onboarding Flow** — Trải nghiệm đầu tiên được hướng dẫn

---

## 5. ĐÁNH GIÁ & KẾT QUẢ (Slide 6)

### 5.1 Thiết Kế Đánh Giá

VioTune áp dụng hai phương pháp đánh giá bổ trợ nhau để kiểm chứng cả khả năng dự đoán điểm rating và khả năng gợi ý danh sách bài hát:

1. **Đánh giá SVD Model (Train-Test Split):**
   Sử dụng phương pháp chia dữ liệu tương tác (`interactions.csv`) theo tỷ lệ 80/20:
   - **Training Set (80%):** 28.713 lượt tương tác để học các vector ẩn $P_u$, $Q_i$, và bias $b_u, b_i$.
   - **Testing Set (20%):** 7.179 lượt tương tác để đánh giá độ lệch RMSE của mô hình dự đoán.

2. **Đánh giá chất lượng gợi ý Top-K (Leave-3-Out Protocol):**
   Để so sánh trực tiếp 3 mô hình (CB, CF, Hybrid) trên một tập dữ liệu thử nghiệm mô phỏng phân cụm thực tế:
   - Bộ dữ liệu tương tác gồm **1.000 người dùng** chia làm **5 cụm sở thích âm nhạc chuyên biệt** (Gồm: 100 người thích nhạc nhẹ/acoustic, 300 người thích nhạc sôi động/dance/rock, 200 người thích hiphop/rap, 200 người thích pop/hits, 200 người thích country/indie/classic rock).
   - Với mỗi người dùng, giữ lại **3 bài hát** có lượt nghe (`play_count`) cao nhất làm tập Ground Truth (bài hát thực sự yêu thích).
   - Phần tương tác còn lại được đưa vào profile để các mô hình sinh danh sách gợi ý Top-K (với K = 5, 10, 15).
   - Hệ thống tiến hành so sánh danh sách gợi ý của 3 mô hình với Ground Truth.

### 5.2 Phép Đo Đánh Giá (Evaluation Metrics)

Hệ thống sử dụng các chỉ số đo lường toàn diện chuẩn công nghiệp:

- **RMSE (Root Mean Squared Error):** Đo lường mức độ chênh lệch giữa rating dự đoán $\hat{r}_{ui}$ và rating thực tế $r_{ui}$.
- **Precision@K:** Tỷ lệ các bài hát gợi ý trong Top K thực sự nằm trong tập Ground Truth của người dùng.
- **Recall@K:** Tỷ lệ các bài hát trong tập Ground Truth được tìm thấy thành công trong Top K gợi ý.
- **F1@K:** Trung bình điều hòa giữa Precision@K và Recall@K.
- **NDCG@K (Normalized Discounted Cumulative Gain):** Đánh giá chất lượng xếp hạng. Bài hát khớp Ground Truth ở vị trí càng cao thì điểm nhận được càng lớn.
- **MAP@K (Mean Average Precision):** Trung bình điểm Precision tại các vị trí gợi ý chính xác.
- **Hit Rate@K:** Tỷ lệ người dùng nhận được ít nhất 1 gợi ý chính xác trong Top-K (chỉ số quan trọng đối với trải nghiệm người nghe).
- **Catalog Coverage:** Tỷ lệ số bài hát được gợi ý ít nhất một lần trên tổng số bài hát trong hệ thống.

### 5.3 Kết Quả Thực Nghiệm

#### 5.3.1 Quá trình hội tụ mô hình SVD (30 epochs)

Quá trình huấn luyện mô hình Collaborative Filtering (SVD) ghi nhận sự hội tụ rất tốt của hàm mất mát sau 30 vòng lặp (epochs) trên bộ dữ liệu 1000 users phân cụm:

```
[CF] Dataset: 1000 users | 8638 items
[CF] Training: 28713 | Testing: 7179
  Epoch   1/30 | Train RMSE: 0.6504 | Test RMSE: 0.6655
  Epoch   5/30 | Train RMSE: 0.6000 | Test RMSE: 0.6305
  Epoch  10/30 | Train RMSE: 0.5651 | Test RMSE: 0.6083
  Epoch  15/30 | Train RMSE: 0.5400 | Test RMSE: 0.5923
  Epoch  20/30 | Train RMSE: 0.5204 | Test RMSE: 0.5798
  Epoch  25/30 | Train RMSE: 0.5046 | Test RMSE: 0.5698
  Epoch  30/30 | Train RMSE: 0.4915 | Test RMSE: 0.5620
[CF] Huấn luyện hoàn tất!
```

*Nhận xét:* Sai số RMSE trên tập Test đạt mức tối ưu **~0.56**, thể hiện mô hình học được gu âm nhạc đặc trưng của các cụm một cách rõ rệt và chính xác.

#### 5.3.2 Bảng so sánh chất lượng gợi ý Top-K (K = 5, 10, 15)

Dưới đây là kết quả đánh giá chi tiết của 3 mô hình chạy thử nghiệm trực tiếp trên 1000 người dùng phân cụm (Leave-3-Out):

| K | Metric | Content-Based (CB) | Collaborative (CF) | Hybrid (CB+CF) | Hybrid vs CB (%) | Hybrid vs CF (%) |
|---|---|---|---|---|---|---|
| **K = 5** | Precision@5 | 0.0112 | 0.0120 | 0.0142 | **+26.8%** | **+18.3%** |
| | Recall@5 | 0.0187 | 0.0203 | 0.0237 | **+26.8%** | **+16.4%** |
| | NDCG@5 | 0.0201 | 0.0155 | 0.0229 | **+14.0%** | **+47.6%** |
| | MAP@5 | 0.0128 | 0.0083 | 0.0139 | **+8.9%** | **+67.5%** |
| | Hit Rate@5 | 0.0560 | 0.0570 | 0.0700 | **+25.0%** | **+22.8%** |
| **K = 10** | Precision@10 | 0.0062 | 0.0103 | 0.0113 | **+82.3%** | **+9.7%** |
| | Recall@10 | 0.0207 | 0.0347 | 0.0377 | **+82.3%** | **+8.7%** |
| | NDCG@10 | 0.0209 | 0.0219 | 0.0292 | **+39.8%** | **+33.6%** |
| | MAP@10 | 0.0130 | 0.0104 | 0.0158 | **+21.8%** | **+52.9%** |
| | Hit Rate@10 | 0.0620 | 0.0940 | 0.1110 | **+79.0%** | **+18.1%** |
| **K = 15** | Precision@15 | 0.0049 | 0.0133 | 0.0106 | **+117.8%** | -20.1% |
| | Recall@15 | 0.0243 | 0.0667 | 0.0532 | **+118.5%** | -20.2% |
| | NDCG@15 | 0.0223 | 0.0338 | 0.0350 | **+57.1%** | **+3.4%** |
| | MAP@15 | 0.0133 | 0.0133 | 0.0172 | **+29.1%** | **+29.6%** |
| | Hit Rate@15 | 0.0720 | 0.1770 | 0.1520 | **+111.1%** | -14.1% |

#### 5.3.3 Độ phủ danh mục bài hát (Catalog Coverage)

| Mô hình | Catalog Coverage (%) | Nhận xét |
|---|---|---|
| **Content-Based (CB)** | **2.03%** | Khả năng gợi ý rộng, phân bố đều theo đặc trưng âm nhạc |
| **Collaborative (CF)** | **0.03%** | Bị giới hạn trong các bài hát rất hot của cụm |
| **Hybrid (CB+CF)** | **1.30%** | Cân bằng tốt, mở rộng catalog gấp **43.3 lần** so với CF |

### 5.4 Phân Tích & Thảo Luận về Kết Quả Đánh Giá

1. **Hiệu năng xuất sắc của mô hình lai Hybrid (CB+CF) trong môi trường phân cụm:**
   Trên bộ dữ liệu phân cụm sở thích thực tế (1000 users), mô hình Hybrid đạt hiệu năng vượt trội cả hai mô hình đơn lẻ ở hầu hết các chỉ số chính:
   - Tại mốc **K = 5**, Hybrid vượt trội cả CB (+26.8% Precision) lẫn CF (+18.3% Precision) và giành chiến thắng tuyệt đối (**Hybrid wins** trên tất cả các metrics).
   - Tại mốc **K = 10**, Hybrid tiếp tục giữ vững vị trí dẫn đầu khi tăng **+82.3%** so với CB và **+9.7%** so với CF về độ chính xác.
   - Kết quả này phản ánh rằng việc sử dụng Reciprocal Rank Fusion giúp cộng gộp "sự đồng thuận" của cả đặc trưng nội dung (acoustic features) và hành vi cộng đồng (SVD collaborative filter), từ đó đưa ra gợi ý chính xác hơn nhiều so với việc chỉ dùng một nguồn tín hiệu đơn lẻ.

2. **Bài toán đánh đổi (Trade-off) giữa Độ chính xác và Độ phủ:**
   - **Collaborative Filtering (CF):** Có độ chính xác tương đối tốt ở các mốc K cao (như K=15 đạt Precision=1.33%), tuy nhiên điểm yếu cốt tử vẫn là **Catalog Coverage cực kỳ thấp (0.03%)**. Nó chỉ gợi ý lặp đi lặp lại một số bài hát rất hot trong nhóm và bỏ quên hoàn toàn các bài hát ngách.
   - **Content-Based (CB):** Đạt độ phủ cao (**2.03%**, gấp 67 lần CF) nhưng độ chính xác lại thấp do thiếu phản hồi thực tế từ người dùng.
   - **Hybrid Model (CB+CF):** Cung cấp giải pháp dung hòa hoàn hảo. Nó mở rộng Catalog Coverage lên **1.30%** (gấp **43.3 lần** CF đơn lẻ) giúp tăng cơ hội khám phá bài hát mới, đồng thời giữ vững độ chính xác cao nhất ở các mốc K quan trọng (K=5, K=10).

### 5.5 Kích Thước Mô Hình Đã Lưu

| Tệp mô hình | Kích thước | Nội dung |
|---|---|---|
| P.npy | 390.7 KB | Ma trận User latent (1000 × 50) |
| Q.npy | 3,374.3 KB (3.3 MB) | Ma trận Item latent (8638 × 50) |
| b_u.npy | 7.9 KB | Bias vector user (1000,) |
| b_i.npy | 67.5 KB | Bias vector item (8638,) |
| mu.npy | 0.1 KB | Trung bình toàn cục μ |
| **Tổng** | **~3.8 MB** | Toàn bộ mô hình SVD |

---

## 6. THẢO LUẬN & HƯỚNG PHÁT TRIỂN (Slide 7)

### 6.1 Hạn Chế Hiện Tại

#### 6.1.1 Vấn Đề Cold Start

Khi một **user mới** hoặc **bài hát mới** chưa có bất kỳ dữ liệu tương tác nào, Collaborative Filtering không thể tính toán vector ẩn. VioTune hiện xử lý bằng chiến lược dự phòng:

```python
# Cold Start Fallback: Gợi ý bài hát có độ phổ biến cao nhất
popular_songs = songs.sort_values(by="popularity", ascending=False).head(top_n)
return popular_songs[["track_id", "track_name", "artists", "track_genre", "popularity"]]
```

> **Hạn chế:** Chiến lược này chưa cá nhân hóa — mọi user mới đều nhận được gợi ý giống nhau.

#### 6.1.2 Dữ Liệu Tương Tác Giả Lập

Bộ dữ liệu tương tác hiện tại (200 users, 9.266 interactions) được **sinh tổng hợp (synthetic)** bằng thuật toán mô phỏng hành vi, chưa phải dữ liệu từ người dùng thực tế ở quy mô lớn.

#### 6.1.3 Preview Nhạc Giới Hạn

Hệ thống phụ thuộc Deezer API cho bản preview 30 giây — không phải tất cả bài hát đều có preview khả dụng.

### 6.2 Giải Pháp Đã Triển Khai (Vượt Qua Dự Kiến Ban Đầu)

> **Điểm nổi bật:** VioTune đã triển khai thành công phương pháp **Hybrid** trong sản phẩm cuối cùng, vượt qua kế hoạch ban đầu chỉ sử dụng CF đơn lẻ.

| Vấn đề | Giải pháp đã triển khai |
|---|---|
| Cold Start (CF) | Content-Based Filtering bổ sung: Không cần lịch sử user, chỉ cần đặc trưng bài hát |
| CF bỏ lỡ đặc trưng nội dung | Hybrid Engine kết hợp cả CF + CB qua RRS |
| User mới hoàn toàn | Fold-in Projection: Tính vector latent P_u real-time từ vài lượt tương tác đầu tiên |
| Deezer API chậm | SQLite cache (`deezer_cache` table) tránh gọi API lặp |
| Model lỗi thời | Background retrain endpoint (`/recommend/retrain`) |

### 6.3 Hướng Phát Triển Tương Lai

1. **Deep Learning:** Tích hợp Neural Collaborative Filtering (NCF) hoặc Autoencoders để nắm bắt tương tác phi tuyến
2. **Phân tích audio thực (Audio Signal Processing):** Sử dụng Mel-Spectrogram + CNN để trích xuất đặc trưng trực tiếp từ file nhạc
3. **Context-Aware Recommendation:** Gợi ý dựa trên ngữ cảnh (thời gian trong ngày, mood, hoạt động)
4. **Mở rộng quy mô:** Triển khai lên cloud (Docker + Kubernetes), sử dụng Redis cho caching, PostgreSQL cho production database
5. **Thử nghiệm A/B và tối ưu hóa siêu tham số lai α:** Nghiên cứu và tối ưu hóa hệ số lai α của mô hình Hybrid bằng cả phương pháp Offline Parameter Sweep và thiết kế quy trình thử nghiệm Online A/B Testing (Xem chi tiết tại phần 8).

---

## 7. KẾT LUẬN (Slide 8)

### 7.1 Bài Học Chính

**Cá nhân hóa dựa trên dữ liệu (Data-driven Personalization)** là chìa khóa then chốt cho các dịch vụ kỹ thuật số hiện đại. Khi hệ thống hiểu được sở thích ẩn (latent preferences) của từng người dùng thông qua phân tích ma trận, nó có khả năng mang đến trải nghiệm vượt trội so với tìm kiếm thủ công.

### 7.2 Tác Động

Collaborative Filtering đặc biệt mạnh mẽ trong việc tạo ra **"Serendipity" — sự bất ngờ thú vị** — giúp người dùng khám phá những bài hát họ không biết rằng mình sẽ yêu thích. Đây là giá trị cốt lõi mà VioTune hướng tới: không chỉ gợi ý những gì người dùng đã biết, mà còn mở rộng biên giới thưởng thức âm nhạc của họ.

Bằng cách kết hợp **Hybrid Approach** (CF + CB), VioTune đã giải quyết được điểm yếu lớn nhất của mỗi phương pháp đơn lẻ:
- **CF** mạnh ở collaborative pattern nhưng yếu ở cold start → CB bổ sung
- **CB** mạnh ở content similarity nhưng thiếu social signal → CF bổ sung

### 7.3 Kinh Nghiệm Nhóm

Qua dự án VioTune, nhóm đã tích lũy kinh nghiệm thực chiến về:

| Kỹ năng | Chi tiết |
|---|---|
| **GitHub Collaboration** | Làm việc nhóm qua Git branching, pull requests |
| **API Integration** | Tích hợp Deezer API, Firebase Auth, Firestore REST API |
| **Full-stack Development** | React frontend ↔ FastAPI backend ↔ ML models |
| **Machine Learning Lifecycle** | Từ thu thập dữ liệu → tiền xử lý → huấn luyện → đánh giá → triển khai → cập nhật |
| **Database Design** | Dual-storage architecture (SQLite local + Firestore cloud) |
| **Performance Optimization** | Caching (Deezer cache, in-memory likes), WAL mode, indexed queries |

---

## 8. ĐÁNH GIÁ TỐI ƯU HÓA ALPHA (OFFLINE) VÀ THIẾT KẾ THỬ NGHIỆM A/B (ONLINE)

### 8.1 Thử Nghiệm Tối Ưu Hóa Siêu Tham Số Alpha (Offline Parameter Sweep)

Để tìm ra sự cân bằng hoàn hảo giữa độ chính xác gợi ý và độ phủ của danh mục bài hát, chúng tôi đã tiến hành thử nghiệm quét tham số (Parameter Grid Sweep) trên giá trị hệ số lai $\alpha \in [0.0, 1.0]$. Thử nghiệm sử dụng giao thức **Leave-3-Out Protocol** trên bộ dữ liệu tương tác giả lập nâng cao gồm **1.000 users** (mỗi user có tối thiểu 5 tương tác, giữ lại 3 tương tác làm ground-truth để đánh giá).

#### Bảng so sánh chi tiết hiệu năng theo giá trị Alpha (K = 5 và K = 10)

##### K = 5
| Giá trị Alpha | Precision@5 | Recall@5 | F1@5 | NDCG@5 | MAP@5 | Hit Rate@5 | Catalog Coverage |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0.0 (Pure CF)** | 0.0128 | 0.0218 | 0.0161 | 0.0159 | 0.0085 | 0.0580 | 0.01% |
| **0.1** | 0.0128 | 0.0218 | 0.0161 | 0.0159 | 0.0085 | 0.0580 | 0.28% |
| **0.3** | 0.0132 | 0.0222 | 0.0165 | 0.0172 | 0.0092 | 0.0640 | 0.59% |
| **0.5 (Hybrid Tối Ưu)** | **0.0140** | **0.0235** | **0.0175** | **0.0223** | **0.0135** | **0.0690** | **0.88%** |
| **0.7** | 0.0116 | 0.0193 | 0.0145 | 0.0204 | 0.0129 | 0.0580 | 1.17% |
| **0.9** | 0.0112 | 0.0187 | 0.0140 | 0.0201 | 0.0128 | 0.0560 | 1.43% |
| **1.0 (Pure CB)** | 0.0112 | 0.0187 | 0.0140 | 0.0201 | 0.0128 | 0.0560 | 1.55% |

##### K = 10
| Giá trị Alpha | Precision@10 | Recall@10 | F1@10 | NDCG@10 | MAP@10 | Hit Rate@10 | Catalog Coverage |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0.0 (Pure CF)** | 0.0107 | 0.0362 | 0.0165 | 0.0224 | 0.0106 | 0.0960 | 0.01% |
| **0.1** | 0.0123 | 0.0415 | 0.0190 | 0.0247 | 0.0112 | 0.1110 | 0.28% |
| **0.3** | **0.0128** | **0.0432** | **0.0197** | 0.0268 | 0.0125 | **0.1180** | 0.59% |
| **0.5 (Hybrid Tối Ưu)** | 0.0117 | 0.0395 | 0.0180 | **0.0292** | **0.0156** | 0.1090 | **0.88%** |
| **0.7** | 0.0081 | 0.0272 | 0.0125 | 0.0241 | 0.0141 | 0.0800 | 1.17% |
| **0.9** | 0.0066 | 0.0220 | 0.0102 | 0.0215 | 0.0131 | 0.0660 | 1.43% |
| **1.0 (Pure CB)** | 0.0062 | 0.0207 | 0.0095 | 0.0209 | 0.0130 | 0.0620 | 1.55% |

#### Phân tích & Đề xuất giá trị $\alpha$ hợp lý nhất
*   **Mô hình CF Thuần ($\alpha = 0.0$):** Có độ chính xác khá tốt nhưng gặp hiện tượng **filter bubbles** nặng nề, chỉ phủ được 0.01% catalog bài hát. Hệ thống lặp đi lặp lại những bài hát nổi tiếng, bỏ qua hoàn toàn các bài hát ngách.
*   **Mô hình CB Thuần ($\alpha = 1.0$):** Đạt độ phủ cao nhất (1.55%) nhưng hiệu năng chính xác Precision@10 giảm sâu (0.0062) do không học được hành vi cộng đồng.
*   **Mô hình Hybrid ($\alpha = 0.5$):** Đạt sự cân bằng tối ưu vượt trội.
    *   Tại $K=5$, nó vượt lên dẫn đầu về tất cả các chỉ số chính xác: Precision@5 (0.0140) và Hit Rate@5 (0.0690 - tăng 19% so với CF thuần).
    *   Thứ hạng xếp hạng chất lượng cực kỳ cao với NDCG@10 (0.0292) và MAP@10 (0.0156) cao nhất hệ thống.
    *   Độ phủ danh mục Catalog Coverage đạt **0.88%**, tăng **88 lần** so với CF thuần.
*   **Kết luận:** Chọn **$\alpha = 0.5$** làm giá trị cấu hình lai mặc định của hệ thống gợi ý lai VioTune.

---

### 8.2 Thiết Kế Thử Nghiệm A/B Trực Tuyến (Online A/B Testing Framework)

Để kiểm chứng hiệu năng trong thực tế khi tiếp cận người dùng thật, chúng tôi thiết kế kiến trúc thử nghiệm A/B trực tuyến với các thành phần cụ thể:

#### 8.2.1 Phân nhóm người dùng (Traffic Splitting Mechanism)
Khi người dùng truy cập hoặc yêu cầu gợi ý, hệ thống băm (`hash`) ID người dùng kèm muối (`salt`) để gán cố định người dùng vào các nhóm với tỷ lệ bằng nhau (33.3% mỗi nhóm):
```python
import hashlib

def assign_ab_bucket(user_id: str, salt="viotune_ab_2026") -> str:
    hash_val = hashlib.md5(f"{user_id}_{salt}".encode()).hexdigest()
    bucket_idx = int(hash_val, 16) % 3
    if bucket_idx == 0:
        return "GROUP_A_CONTROL"     # CF thuần (alpha = 0.0)
    elif bucket_idx == 1:
        return "GROUP_B_CB"          # CB thuần (alpha = 1.0)
    else:
        return "GROUP_C_HYBRID"      # Hybrid (alpha = 0.5)
```

#### 8.2.2 Quy trình lưu vết sự kiện (Telemetry & Event Logging)
Mỗi tương tác của người dùng trên giao diện đối với danh sách gợi ý sẽ gửi một event JSON về Firestore thông qua endpoint `/interactions` hoặc REST API:
```json
{
  "user_id": "user_12345",
  "track_id": "1dGr1c8CrMLDpV6mPbImSI",
  "variant_group": "GROUP_C_HYBRID",
  "event_type": "click | play_start | play_complete | like | add_to_playlist",
  "session_id": "session_abcde",
  "timestamp": 1781930557
}
```

#### 8.2.3 Các chỉ số đánh giá Online (Online Business Metrics)
*   **CTR (Click-Through Rate):** Tỷ lệ click vào bài hát được gợi ý trên tổng số lượt hiển thị danh sách gợi ý.
*   **Play-through Rate:** Tỷ lệ bài hát gợi ý được nghe trên 30 giây (hoặc hết bản preview) trên tổng số lượt click.
*   **Engagement Rate:** Tỷ lệ người dùng thực hiện thả tim (Like) hoặc lưu vào playlist từ gợi ý.
*   **Daily Retention (D1/D7 Retention):** So sánh tỷ lệ quay lại của người dùng thuộc nhóm Hybrid so với các nhóm khác.

#### 8.2.4 Phân tích ý nghĩa thống kê (Statistical Significance)
*   Đối với các chỉ số tỷ lệ (CTR, Engagement Rate): Áp dụng kiểm định **Chi-squared ($\chi^2$) Test** để kiểm tra sự khác biệt giữa các nhóm có ý nghĩa thống kê hay không.
*   Đối với thời gian nghe trung bình: Áp dụng **Two-sample t-test** với giả thuyết không $H_0$ là thời lượng nghe trung bình giữa nhóm Hybrid và CF thuần không khác biệt. Chỉ chấp nhận phiên bản mới nếu giá trị p-value < 0.05.

---

## PHỤ LỤC

### A. Cấu Trúc Thư Mục Dự Án

```
VioTune/
├── frontend/                          # React Application
│   ├── src/
│   │   ├── components/                # 26+ UI Components
│   │   │   ├── AIRecommendationStation/
│   │   │   ├── AcousticDNARadar/
│   │   │   ├── Header/
│   │   │   ├── MusicPlayer/
│   │   │   ├── MusicVisualizer/
│   │   │   ├── Login/
│   │   │   ├── Onboarding/
│   │   │   ├── Recommendation.js
│   │   │   └── ...
│   │   ├── pages/                     # 6 Page Components
│   │   │   ├── HomePage/
│   │   │   ├── SearchPage/
│   │   │   ├── PlayerPage/
│   │   │   ├── PlaylistsPage/
│   │   │   ├── ArtistPage/
│   │   │   └── InfoPages/
│   │   ├── context/                   # Global State
│   │   │   ├── AuthContext.js         # Authentication & Liked Songs
│   │   │   └── PlaybackContext.js     # Audio Playback & Queue
│   │   ├── config.js                  # API URL Configuration
│   │   ├── firebase.js                # Firebase SDK Init
│   │   └── App.js                     # Root Component & Routing
│   └── package.json
│
├── recommendation/                    # Python ML Service
│   ├── api/
│   │   ├── app.py                     # FastAPI Server (1166 lines, 30+ endpoints)
│   │   ├── db.py                      # SQLite Connection Manager (WAL mode)
│   │   └── firebase_db.py            # Firestore REST CRUD Operations
│   ├── src/
│   │   ├── collaborative.py          # SVD Matrix Factorization (412 lines)
│   │   ├── content_based.py          # KNN + Cosine Similarity (150 lines)
│   │   ├── hybrid.py                 # Hybrid RRS Engine (80 lines)
│   │   ├── train.py                  # Model Training Script
│   │   └── migrate_db.py            # CSV → SQLite Migration
│   ├── data/
│   │   ├── dataset.csv                # 114,000 tracks (~20 MB)
│   │   ├── interactions.csv           # 9,266 user interactions (~282 KB)
│   │   └── viotune.db                # SQLite Database (~28.2 MB)
│   ├── models/
│   │   ├── P.npy, Q.npy              # SVD Latent Matrices
│   │   ├── b_u.npy, b_i.npy          # Bias Vectors
│   │   └── mu.npy                     # Global Mean
│   ├── main.py                        # Test Script
│   ├── generate_interactions.py       # Synthetic Data Generator
│   └── requirements.txt              # Python Dependencies
│
└── GEMINI.md                          # Project Documentation
```

### B. Cách Khởi Chạy

**Backend:**
```bash
cd recommendation
..\.venv\Scripts\python.exe -m uvicorn api.app:app --reload
# Server chạy tại http://127.0.0.1:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
# App chạy tại http://localhost:3000
```

### C. Thống Kê Kỹ Thuật

| Metric | Giá trị |
|---|---|
| Tổng số bài hát | 114.000 |
| Tổng số thể loại | 114 |
| Tổng số nghệ sĩ | 31.437 |
| Số đặc trưng audio | 7 (danceability, energy, acousticness, instrumentalness, liveness, valence, tempo) |
| Số người dùng (dataset) | 200 |
| Số tương tác | 9.266 |
| Tỷ lệ thưa ma trận | 99.95% |
| Số chiều ẩn SVD (k) | 50 |
| Kích thước mô hình | ~3.5 MB |
| Kích thước CSDL SQLite | ~28.2 MB |
| Số API endpoints | 30+ |
| Số React components | 26+ |
| Dòng code Backend (app.py) | 1.166 |
| Dòng code CF (collaborative.py) | 412 |

---

> **VioTune** — *Discover music that resonates with your soul.* 🎵
