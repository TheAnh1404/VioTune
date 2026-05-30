import os
import sqlite3
import pandas as pd

def migrate():
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(current_dir, "data/dataset.csv")
    db_path = os.path.join(current_dir, "data/viotune.db")

    if not os.path.exists(csv_path):
        print(f"CSV file not found at {csv_path}")
        return

    print("Reading CSV dataset...")
    # Load columns needed
    df = pd.read_csv(csv_path)

    # Basic cleaning
    df = df.dropna(subset=["track_id", "track_name", "artists", "track_genre"])
    # Drop the unnamed index column if it exists
    if df.columns[0] == "":
        df = df.drop(df.columns[0], axis=1)
    elif "Unnamed: 0" in df.columns:
        df = df.drop("Unnamed: 0", axis=1)

    print(f"Loaded {len(df)} rows. Creating SQLite database at {db_path}...")
    
    # Remove existing db if any to clean start
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    
    # Write to sql
    df.to_sql("songs", conn, if_exists="replace", index=False)
    
    print("Creating indices for high-performance queries...")
    cursor = conn.cursor()
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_track_id ON songs(track_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_track_name ON songs(track_name);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_artists ON songs(artists);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_track_genre ON songs(track_genre);")
    conn.commit()
    conn.close()
    
    print("Database migration completed successfully!")

if __name__ == "__main__":
    migrate()
