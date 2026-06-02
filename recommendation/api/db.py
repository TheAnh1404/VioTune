import sqlite3
import os

# Configurable database path pointing to the centralized viotune.db file
CURRENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(CURRENT_DIR, "data/viotune.db")

def get_db_connection():
    """
    Creates and returns a connection to the SQLite database.
    Configures critical pragmas:
    1. WAL (Write-Ahead Logging) mode for enhanced write concurrency.
    2. Foreign Key checks enabled (SQLite disables them by default).
    3. Row factory set to sqlite3.Row for dictionary-like results.
    4. Busy timeout of 10 seconds to gracefully handle parallel write queues.
    """
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    
    # Configure production pragmas
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.close()
    
    return conn
