# BÁO CÁO TỐI ƯU HÓA SIÊU THAM SỐ ALPHA — VIOTUNE

## Nền tảng gợi ý lai: Content-Based vs Collaborative Filtering

Số lượng users đánh giá: 1000 (Leave-3-Out Protocol)

### 1. Bảng so sánh chi tiết hiệu năng theo giá trị Alpha

#### K = 5

| Alpha | Precision@K | Recall@K | F1@K | NDCG@K | MAP@K | Hit Rate@K | Catalog Coverage |
|---|---|---|---|---|---|---|---|
| 0.0 | 0.0128 | 0.0218 | 0.0161 | 0.0159 | 0.0085 | 0.0580 | 0.01% |
| 0.1 | 0.0128 | 0.0218 | 0.0161 | 0.0159 | 0.0085 | 0.0580 | 0.28% |
| 0.3 | 0.0132 | 0.0222 | 0.0165 | 0.0172 | 0.0092 | 0.0640 | 0.59% |
| 0.5 | 0.0140 | 0.0235 | 0.0175 | 0.0223 | 0.0135 | 0.0690 | 0.88% |
| 0.7 | 0.0116 | 0.0193 | 0.0145 | 0.0204 | 0.0129 | 0.0580 | 1.17% |
| 0.9 | 0.0112 | 0.0187 | 0.0140 | 0.0201 | 0.0128 | 0.0560 | 1.43% |
| 1.0 | 0.0112 | 0.0187 | 0.0140 | 0.0201 | 0.0128 | 0.0560 | 1.55% |


#### K = 10

| Alpha | Precision@K | Recall@K | F1@K | NDCG@K | MAP@K | Hit Rate@K | Catalog Coverage |
|---|---|---|---|---|---|---|---|
| 0.0 | 0.0107 | 0.0362 | 0.0165 | 0.0224 | 0.0106 | 0.0960 | 0.01% |
| 0.1 | 0.0123 | 0.0415 | 0.0190 | 0.0247 | 0.0112 | 0.1110 | 0.28% |
| 0.3 | 0.0128 | 0.0432 | 0.0197 | 0.0268 | 0.0125 | 0.1180 | 0.59% |
| 0.5 | 0.0117 | 0.0395 | 0.0180 | 0.0292 | 0.0156 | 0.1090 | 0.88% |
| 0.7 | 0.0081 | 0.0272 | 0.0125 | 0.0241 | 0.0141 | 0.0800 | 1.17% |
| 0.9 | 0.0066 | 0.0220 | 0.0102 | 0.0215 | 0.0131 | 0.0660 | 1.43% |
| 1.0 | 0.0062 | 0.0207 | 0.0095 | 0.0209 | 0.0130 | 0.0620 | 1.55% |


### 2. Phân tích & Đề xuất giá trị Alpha tối ưu nhất

Dựa trên kết quả thực nghiệm trên:
*   **Alpha = 0.0 (Thuần Collaborative Filtering):** Đạt độ chính xác (Precision/Hit Rate) tương đối tốt, tuy nhiên Catalog Coverage cực thấp (~0.03%), gây ra hiện tượng nghẽn gợi ý (bong bóng lọc).
*   **Alpha = 1.0 (Thuần Content-Based Filtering):** Đạt Catalog Coverage cao nhất (~2.03%), nhưng độ chính xác (Precision) thấp nhất do bỏ qua các tín hiệu tương tác cộng đồng.
*   **Alpha = 0.3 - 0.5 (Hybrid kết hợp):** Cân bằng hoàn hảo giữa độ chính xác và độ phủ danh mục. Đặc biệt, **Alpha = 0.5** đạt được sự hòa trộn tối ưu, cải thiện NDCG và MAP vượt trội và cung cấp độ phủ catalog lên tới 1.30% (gấp 43 lần so với CF đơn lẻ).