recommendation/
│
├── data/
│   ├── songs.csv              # (bạn đã có)
│   └── interactions.csv       # (tạo mới)
│
├── src/
│   ├── preprocess.py          # xử lý data
│   ├── content_based.py       # 🔥 làm đầu tiên
│   ├── collaborative.py       # CF
│   ├── hybrid.py              # combine
│   └── utils.py               # helper
│
├── api/
│   └── app.py                 # (để sau)
│
├── main.py                    # test nhanh
└── requirements.txt