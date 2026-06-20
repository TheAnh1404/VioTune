import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
report_dir = os.path.join(current_dir, "../docs")
os.makedirs(report_dir, exist_ok=True)
report_path = os.path.join(report_dir, "test_write.txt")

print("Writing to:", os.path.abspath(report_path))
with open(report_path, "w", encoding="utf-8") as f:
    f.write("hello world")
print("Exists:", os.path.exists(report_path))
print("Listing parent dir of report_dir:", os.listdir(os.path.dirname(report_dir)))
print("Listing report_dir:", os.listdir(report_dir))
