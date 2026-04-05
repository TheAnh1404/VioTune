import sys
import io

# Force UTF-8 encoding for stdout to avoid terminal crashes on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from src.content_based import recommend
    import pandas as pd
    import os

    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(current_dir, "data/dataset.csv")
    songs = pd.read_csv(dataset_path)

    # Get a specific song for testing (Index 0 is a Comedy track in typical kaggle, let's pick index 100)
    idx = 100
    track_id = songs.iloc[idx]["track_id"]

    print("Testing Content-Based Optimized Algorithm...")
    print(f"Goal: Find recommendations for '{songs.iloc[idx]['track_name']}' by {songs.iloc[idx]['artists']} (Genre: {songs.iloc[idx]['track_genre']})")
    
    result = recommend(track_id, top_n=5)
    print("\nResults:")
    print(result)

    print("\nSUCCESS!")
except Exception as e:
    import traceback
    traceback.print_exc()
