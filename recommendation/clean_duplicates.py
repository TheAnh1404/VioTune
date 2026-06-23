import pandas as pd
import sqlite3
import os
import subprocess

print("1. Loading dataset...")
dataset_path = 'data/dataset.csv'
df = pd.read_csv(dataset_path)

print(f"Original shape: {df.shape}")

# Drop rows with missing crucial data
df = df.dropna(subset=['track_id', 'track_name', 'artists'])

# Sort by popularity descending so we keep the most popular version of a duplicate song
df = df.sort_values(by='popularity', ascending=False)

# Drop duplicates by track_id
df = df.drop_duplicates(subset=['track_id'], keep='first')
print(f"Shape after dropping duplicate track_ids: {df.shape}")

# Drop duplicates by track_name and artists (same song, different ID/album)
df = df.drop_duplicates(subset=['track_name', 'artists'], keep='first')
print(f"Shape after dropping duplicate name+artists: {df.shape}")

# Save back to CSV
df.to_csv(dataset_path, index=False)
print("Saved cleaned dataset to CSV.")

print("2. Updating SQLite Database...")
conn = sqlite3.connect('data/viotune.db')
df.to_sql('songs', conn, if_exists='replace', index=False)
conn.commit()

# Recreate index
conn.execute("CREATE INDEX IF NOT EXISTS idx_track_name ON songs(track_name);")
conn.execute("CREATE INDEX IF NOT EXISTS idx_artists ON songs(artists);")
conn.execute("CREATE INDEX IF NOT EXISTS idx_popularity ON songs(popularity);")
conn.close()
print("Database updated.")

print("3. Regenerating Interactions...")
# We must regenerate interactions because some track_ids may have been removed
subprocess.run(["python", "generate_interactions.py"], check=True)

print("4. Retraining SVD Model...")
subprocess.run(["python", "src/train.py"], check=True)

print("DONE!")
