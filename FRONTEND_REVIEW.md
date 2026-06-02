# Phân Tích & Đánh Giá Chất Lượng Mã Nguồn Frontend - VioTune

Tài liệu này cung cấp báo cáo đánh giá chuyên sâu (Code Review) cho phần mã nguồn Frontend của ứng dụng VioTune (React SPA) từ góc nhìn của một kỹ sư dày dạn kinh nghiệm. Đánh giá tập trung vào kiến trúc hệ thống, rủi ro vận hành, hiệu năng, bảo mật và khả năng mở rộng.

---

## 1. Kiến Trúc & Quản Lý Trạng Thái (Architecture & State Management)

### Điểm Mạnh
* **Cấu Trúc React Context**: Việc tách biệt logic xác thực (`AuthContext`) và logic phát nhạc (`PlaybackContext`) giúp quản lý trạng thái toàn cục sạch sẽ, hạn chế triệt để tình trạng lặp đạo cụ (prop drilling).
* **Optimistic Updates**: Các hành động thích (`likeSong`) và bỏ thích (`unlikeSong`) trong `AuthContext.js` sử dụng kỹ thuật cập nhật giao diện trước khi API phản hồi (Optimistic Updates) và đảo ngược trạng thái (revert) nếu API lỗi. Thiết kế này mang lại trải nghiệm người dùng tức thì, mượt mà.

### Điểm Cần Cải Thiện
* **Rủi Ro Lệch Đồng Bộ Với Toggle API**: 
  Endpoint `/songs/{track_id}/like` trên backend được thiết kế dưới dạng toggle (chuyển đổi trạng thái thích/không thích qua cùng một phương thức POST).
  ```javascript
  // Trích AuthContext.js
  const res = await fetch(`${API_URL}/songs/${track.track_id}/like?user_id=${user.uid}`, {
    method: 'POST'
  });
  ```
  > [!WARNING]
  > Nếu xảy ra hiện tượng mất gói tin hoặc trễ mạng, người dùng click đúp (double-click) sẽ gửi hai request liên tục. API dạng toggle có thể đảo trạng thái hai lần ngoài ý muốn, làm sai lệch trạng thái yêu thích giữa giao diện người dùng và cơ sở dữ liệu SQLite.
  
  **Giải pháp đề xuất**: Thay đổi thiết kế API sang hướng tường minh (Idempotent):
  * Thích bài hát: `POST /songs/{track_id}/like`
  * Hủy thích bài hát: `DELETE /songs/{track_id}/like` (hoặc `POST /songs/{track_id}/unlike`)

---

## 2. Rủi Ro Nghiêm Trọng: Cấu Hình API Cứng (Hardcoded API Endpoint)

> [!CAUTION]
> Đây là lỗi nghiêm trọng nhất trong dự án hiện tại, cản trở việc triển khai ứng dụng lên môi trường Production thực tế.

### Chi Tiết Vấn Đề
Trong khi `AuthContext.js` đã hỗ trợ đọc cấu hình từ biến môi trường:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
```
Thì hầu hết các component và page quan trọng khác lại đang bị **hardcode cứng** địa chỉ localhost `http://127.0.0.1:8000`:
1. **[PlaybackContext.js](file:///d:/TheAnhProject/VioTune/frontend/src/context/PlaybackContext.js#L43)**: Gọi `/songs/preview` để lấy nhạc thử từ Deezer.
2. **[PlayerPage.js](file:///d:/TheAnhProject/VioTune/frontend/src/pages/PlayerPage/PlayerPage.js#L77)**: Gọi `/recommend/content` để lấy gợi ý tương đồng.
3. **[HomePage.js](file:///d:/TheAnhProject/VioTune/frontend/src/pages/HomePage/HomePage.js#L62)**: Gọi `/artists` và `/songs/random`.
4. **[SearchPage.js](file:///d:/TheAnhProject/VioTune/frontend/src/pages/SearchPage/SearchPage.js#L51)**: Gọi `/songs/search` khi gõ tìm kiếm.
5. **[Recommendation.js](file:///d:/TheAnhProject/VioTune/frontend/src/components/Recommendation.js#L29)**: Gọi các thuật toán sandbox.

### Hậu Quả
Khi ứng dụng được deploy lên hosting cloud và cấu hình biến môi trường `REACT_APP_API_URL` trỏ tới server API thực tế:
* Chức năng đăng nhập, đăng ký vẫn chạy ổn định (do dùng `AuthContext`).
* Tuy nhiên, toàn bộ tính năng phát nhạc, tìm kiếm bài hát và gợi ý AI sẽ bị sập hoàn toàn do trình duyệt cố gắng gửi yêu cầu tới localhost (`127.0.0.1:8000`) của máy khách hàng.

### Giải Pháp Đề Xuất
* **Xuất tập trung**: Khai báo và xuất `API_URL` duy nhất tại một nơi (ví dụ `AuthContext.js` hoặc một file cấu hình `config.js`).
* **Đồng bộ hóa import**: Cập nhật tất cả các tệp tin trên để import `API_URL` thay vì viết chuỗi tĩnh.
* **Xây dựng API Client**: Khởi tạo một Axios instance hoặc một fetch wrapper tập trung để đính kèm sẵn `baseURL: API_URL` và tự động xử lý mã lỗi HTTP.

---

## 3. Rò Rỉ Thông Tin & Firebase Dư Thừa (Unused Firebase & Credential Leak)

### Chi Tiết Vấn Đề
1. **Dữ Liệu Nhạy Cảm Bị Lộ Diện**: Tệp tin `firebase.js` chứa đầy đủ thông tin xác thực Firebase thực tế, bao gồm cả `apiKey` và `appId`.
2. **Kiến Trúc Thay Đổi Nhưng Chưa Dọn Dẹp**: Toàn bộ hệ thống xác thực hiện tại đã được chuyển hướng sang tự vận hành trên FastAPI backend kèm SQLite. Firebase hoàn toàn không được import hay sử dụng ở bất kỳ component nào trong thư mục `src`.
3. **Comment Gây Hiểu Nhầm**: Nhiều ghi chú trong `HomePage.js` và `PlayerPage.js` vẫn ghi là xác thực qua Firebase.
4. **Phình Bundle Size (Bundle Bloat)**: Trong `package.json`, thư viện `firebase` vẫn được khai báo:
   ```json
   "firebase": "^12.14.0"
   ```

### Hậu Quả
* Việc phơi bày `apiKey` và thông tin dự án lên hệ thống quản lý mã nguồn (Git) tạo ra rủi ro bảo mật lớn nếu tài khoản Firebase đó không được thiết lập giới hạn origin chặt chẽ.
* Việc đóng gói một thư viện nặng như Firebase (`firebase/app`, `firebase/auth`, `firebase/firestore`) mà không sử dụng sẽ làm tăng đáng kể kích thước tệp tải về của người dùng cuối, làm chậm tốc độ tải trang ban đầu.

### Giải Pháp Đề Xuất
* **Xóa bỏ triệt để**: Xóa bỏ tệp tin `src/firebase.js`.
* **Gỡ bỏ gói cài đặt**: Chạy lệnh `npm uninstall firebase` để loại bỏ thư viện dư thừa khỏi `package.json`.
* **Dọn dẹp mã nguồn**: Cập nhật các comment lỗi thời để phản ánh đúng kiến trúc FastAPI + SQLite hiện tại.

---

## 4. Lỗi Bất Đồng Bộ & Cuộc Đua Dữ Liệu (Async Race Conditions)

Giao diện SPA React giao tiếp liên tục với các API phản hồi trễ (như Deezer proxy hay thuật toán gợi ý AI). Hiện tại, mã nguồn đang gặp phải 3 điểm rủi ro liên quan đến Race Conditions khi người dùng thao tác nhanh.

### 4.1 Điểm Rủi Ro 1: Phát Nhạc Khi Skip Liên Tục (`PlaybackContext.js`)
Trong `PlaybackContext.js`, effect lắng nghe sự thay đổi của `currentSong` và `isPlaying` để gọi API lấy link nhạc 30s Deezer:
```javascript
useEffect(() => {
  if (currentSong && currentSong.track_id) {
    const applyPlayback = async () => {
      const deezerUrl = await fetchDeezerPreview(currentSong);
      setPreviewUrl(deezerUrl);
      // Gán src và phát nhạc...
    };
    applyPlayback();
  }
}, [currentSong, isPlaying]);
```
> [!WARNING]
> Nếu người dùng nhấn nút Next liên tục qua 3-4 bài hát trong vòng 1 giây:
> * Nhiều luồng `applyPlayback` sẽ chạy song song.
> * Luồng của bài hát trước đó có thể nhận được phản hồi từ mạng muộn hơn bài hát hiện tại. Kết quả là trình phát nhạc sẽ bị gán sai nguồn phát (`src`), phát bài hát cũ nhưng giao diện lại hiển thị tên bài hát mới.

**Giải pháp đề xuất (Sử dụng cờ hiệu hoạt động `active`)**:
```javascript
useEffect(() => {
  let active = true;
  if (!audioRef.current) return;

  if (currentSong && currentSong.track_id) {
    const applyPlayback = async () => {
      const deezerUrl = await fetchDeezerPreview(currentSong);
      if (!active) return; // Bỏ qua nếu bài hát đã bị skip
      
      setPreviewUrl(deezerUrl);
      if (!deezerUrl) {
        audioRef.current.pause();
        return;
      }
      // Thực hiện gán src và play...
    };
    applyPlayback();
  } else {
    audioRef.current.pause();
  }

  return () => {
    active = false; // Cleanup khi currentSong thay đổi
  };
}, [currentSong, isPlaying]);
```

### 4.2 Điểm Rủi Ro 2: Tìm Kiếm Gối Đầu Nhau (`SearchPage.js`)
Tác vụ tìm kiếm bài hát sử dụng kỹ thuật `setTimeout` để trì hoãn cuộc gọi API (Debounce 400ms):
```javascript
useEffect(() => {
  setLoading(true);
  const delayDebounce = setTimeout(async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/songs/search?q=${encodeURIComponent(query)}&limit=20`);
      const json = await res.json();
      if (json.status === "success") {
        setResults(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, 400);
  return () => clearTimeout(delayDebounce);
}, [query]);
```
> [!WARNING]
> Nếu người dùng gõ chậm (khoảng 500ms một ký tự):
> * Mỗi ký tự gõ vào sẽ vượt qua thời gian trì hoãn 400ms và gửi một request lên API.
> * Các request này chạy song song. Nếu request tìm kiếm ký tự ngắn hơn phản hồi chậm hơn request ký tự đầy đủ, kết quả hiển thị trên bảng sẽ bị giật cục và hiển thị sai lệch từ khóa mong muốn.

**Giải pháp đề xuất (Sử dụng AbortController)**:
```javascript
useEffect(() => {
  if (!query.trim()) {
    setResults([]);
    return;
  }
  setLoading(true);
  let active = true;
  const controller = new AbortController();

  const delayDebounce = setTimeout(async () => {
    try {
      const res = await fetch(
        `${API_URL}/songs/search?q=${encodeURIComponent(query)}&limit=20`,
        { signal: controller.signal }
      );
      const json = await res.json();
      if (active && json.status === "success") {
        setResults(json.data);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && active) {
        console.error("Search failed:", err);
      }
    } finally {
      if (active) setLoading(false);
    }
  }, 400);

  return () => {
    active = false;
    controller.abort(); // Hủy request in-flight ngay lập tức
    clearTimeout(delayDebounce);
  };
}, [query]);
```

---

## 5. Trải Nghiệm Người Dùng (UX) & Clean Code

### Điểm Mạnh
* **CSS Module Cô Lập Tốt**: Dự án áp dụng CSS Module (`HomePage.module.css`, `PlayerPage.module.css`) giúp loại bỏ hoàn toàn rủi ro xung đột bộ chọn giữa các trang.
* **Giao Diện Đẹp Mắt**: Thiết kế tận dụng các thuộc tính CSS cao cấp như `backdrop-filter` cho hiệu ứng mờ kính (glassmorphism), các vòng tròn phát sáng khuếch tán (ambient glow) theo ảnh bìa đĩa nhạc tạo cảm giác cao cấp.
* **Tự Động Cuộn Lời Bài Hát**: Tính năng lời bài hát đồng bộ thời gian sử dụng tham chiếu cuộn mượt mà (`scrollIntoView({ behavior: 'smooth' })`) mang lại tiện ích lớn cho người dùng.

### Điểm Cần Cải Thiện
1. **Thiếu Error Boundary**: 
   Nếu một trong các component phụ trợ (như `DailyPick` hoặc `ArtistUpdates`) gặp lỗi không thể đọc dữ liệu hoặc lỗi kết xuất React, toàn bộ ứng dụng SPA sẽ bị sập thành màn hình trắng. Cần bọc các khối nội dung lớn bằng một component `ErrorBoundary` để cô lập lỗi cục bộ.
2. **Trải Nghiệm Tải Dữ Liệu Đồng Bộ**:
   Hiện tại, việc chuyển trang từ Home sang Player sẽ tự động kích hoạt cuộc gọi API gợi ý tương đồng (`/recommend/content`) gây trễ nhẹ cho bảng sidebar. Hãy bổ sung thêm skeleton loading riêng cho danh mục này giống như cách đã làm rất tốt tại `SearchPage.js`.

---

## Tóm Tắt Khuyến Nghị Ưu Tiên (30 ngày)

| Mức độ ưu tiên | Hành động chi tiết | Tệp tin ảnh hưởng |
| :--- | :--- | :--- |
| **Khẩn cấp (P0)** | Thay thế toàn bộ chuỗi hardcode `http://127.0.0.1:8000` bằng biến môi trường `API_URL` được import tập trung. | `PlaybackContext.js`, `PlayerPage.js`, `HomePage.js`, `SearchPage.js`, `Recommendation.js` |
| **Cao (P1)** | Khai tử tệp tin `firebase.js`, gỡ cài đặt `firebase` package khỏi `package.json` để giảm kích thước bundle. | `firebase.js`, `package.json`, `HomePage.js` |
| **Cao (P1)** | Sửa lỗi Race Conditions trong trình phát nhạc bằng cờ hiệu `active` và trong ô tìm kiếm bằng `AbortController`. | `PlaybackContext.js`, `SearchPage.js` |
| **Trung bình (P2)** | Tái cấu trúc API Endpoint thích bài hát từ dạng Toggle sang Explicit RESTful (`POST` và `DELETE`). | `AuthContext.js` (Frontend) & `app.py` (Backend) |
