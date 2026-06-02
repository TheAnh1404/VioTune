import os
import sys
import sqlite3
import threading
import time

# Configure python path to access api.db
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(CURRENT_DIR)

from api.db import get_db_connection

def test_db_structure():
    print("Testing DB structures and indexes...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Verify tables exist
    tables = ["users", "songs", "liked_songs", "play_history", "deezer_cache", "playlists", "playlist_tracks"]
    for t in tables:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (t,))
        row = cursor.fetchone()
        assert row is not None, f"Table '{t}' is missing from SQLite database"
        print(f"  [OK] Table '{t}' exists.")
        
    # 2. Verify indexes exist
    indexes = ["idx_liked_user_track", "idx_history_user", "idx_deezer_cache_key", "idx_playlist_user", "idx_playlist_track"]
    for idx in indexes:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name=?", (idx,))
        row = cursor.fetchone()
        assert row is not None, f"Index '{idx}' is missing from SQLite database"
        print(f"  [OK] Index '{idx}' exists.")
        
    # 3. Verify WAL mode is active
    cursor.execute("PRAGMA journal_mode;")
    mode = cursor.fetchone()[0]
    assert mode.lower() == "wal", f"SQLite is not running in WAL mode (current: {mode})"
    print(f"  [OK] Database is running in WAL mode.")
    
    # 4. Verify Foreign Key check is active
    cursor.execute("PRAGMA foreign_keys;")
    fk_active = cursor.fetchone()[0]
    assert fk_active == 1, "SQLite foreign keys constraints are not enabled"
    print(f"  [OK] Foreign Keys are enabled.")
    
    conn.close()
    print("All structural tests passed successfully!")

def test_foreign_key_constraints():
    print("\nTesting Foreign Key Integrity constraints...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Attempting to insert a liked song for non-existing user/song should fail
    try:
        cursor.execute("INSERT INTO liked_songs (user_id, track_id, liked_at) VALUES ('non_exist_user', 'non_exist_track', '2026-06-02');")
        conn.commit()
        # Should not reach here
        assert False, "Violation: Inserted liked song with invalid user_id and track_id without foreign key failure"
    except sqlite3.IntegrityError as e:
        print(f"  [OK] Successfully blocked invalid liked song insert (Foreign Key constraint triggered: {e})")
    finally:
        conn.rollback()
        conn.close()

def test_wal_concurrency():
    print("\nTesting WAL Concurrent Concurrency...")
    
    # We will simulate high concurrency: a thread reading songs repeatedly, and another thread performing writes
    read_ok = True
    write_ok = True
    
    def reader_thread():
        nonlocal read_ok
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            for _ in range(50):
                cursor.execute("SELECT * FROM songs LIMIT 10;")
                cursor.fetchall()
                time.sleep(0.01)
            conn.close()
        except Exception as e:
            print(f"Reader thread failed: {e}")
            read_ok = False
            
    def writer_thread():
        nonlocal write_ok
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            # Write a dummy user
            user_id = "test_resiliency_user_wal"
            cursor.execute("INSERT OR REPLACE INTO users (uid, email, display_name) VALUES (?, ?, ?);", (user_id, "wal@test.com", "WAL Test User"))
            conn.commit()
            
            # Delete dummy user
            cursor.execute("DELETE FROM users WHERE uid = ?;", (user_id,))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Writer thread failed: {e}")
            write_ok = False
            
    t1 = threading.Thread(target=reader_thread)
    t2 = threading.Thread(target=writer_thread)
    
    t1.start()
    t2.start()
    
    t1.join()
    t2.join()
    
    assert read_ok and write_ok, "WAL mode concurrency test failed. Lock detected or thread crashed."
    print("  [OK] WAL Mode concurrency test passed. Write did not block parallel reads.")

if __name__ == "__main__":
    try:
        # Reconfigure sys.stdout to prevent unicode output encoding errors in Windows terminal
        try:
            if hasattr(sys.stdout, 'reconfigure'):
                sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass
        test_db_structure()
        test_foreign_key_constraints()
        test_wal_concurrency()
        print("\nSQLite Database Resiliency tests passed perfectly!")
    except AssertionError as ae:
        print(f"\nResiliency test failed: {ae}")
        sys.exit(1)
