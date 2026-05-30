import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const PlaybackContext = createContext(null);

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
};

export const PlaybackProvider = ({ children }) => {
  const { user, recordPlay } = useAuth();
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isShuffle, setIsShuffle] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const audioRef = useRef(null);
  const previewCache = useRef({});

  // Fetch real Deezer 30s preview via FastAPI backend proxy
  const fetchDeezerPreview = async (song) => {
    if (!song) return null;
    const cacheKey = song.track_id;
    if (previewCache.current[cacheKey] !== undefined) {
      return previewCache.current[cacheKey];
    }
    try {
      setPreviewLoading(true);
      const url = `http://127.0.0.1:8000/songs/preview?track_name=${encodeURIComponent(song.track_name)}&artist=${encodeURIComponent(song.artists)}`;
      const res = await fetch(url);
      const json = await res.json();
      const preview = json?.data?.preview_url || null;
      previewCache.current[cacheKey] = preview;
      return preview;
    } catch (err) {
      console.warn('Preview fetch failed:', err);
      previewCache.current[cacheKey] = null;
      return null;
    } finally {
      setPreviewLoading(false);
    }
  };

  // Sync Audio Playback
  useEffect(() => {
    if (!audioRef.current) return;

    if (currentSong && currentSong.track_id) {
      const applyPlayback = async () => {
        const deezerUrl = await fetchDeezerPreview(currentSong);
        setPreviewUrl(deezerUrl);

        if (!deezerUrl) {
          console.warn(`No Deezer preview found for: ${currentSong.track_name}`);
          audioRef.current.pause();
          return;
        }

        if (audioRef.current.src !== deezerUrl) {
          audioRef.current.src = deezerUrl;
          audioRef.current.load();
        }

        audioRef.current.volume = volume;

        if (isPlaying) {
          audioRef.current.play().catch(err => {
            console.warn('Playback blocked:', err);
          });
        } else {
          audioRef.current.pause();
        }
      };

      applyPlayback();
    } else {
      audioRef.current.pause();
    }
  }, [currentSong, isPlaying]);

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playSong = (song, songList = []) => {
    let targetQueue = songList;
    if (!targetQueue || targetQueue.length === 0) {
      targetQueue = [song];
    }

    setQueue(targetQueue);
    const idx = targetQueue.findIndex(s => s.track_id === song.track_id);
    setCurrentIndex(idx >= 0 ? idx : 0);

    if (currentSong && currentSong.track_id === song.track_id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);

      // Record play in Firestore
      if (user) {
        recordPlay(song).catch(err => console.warn('recordPlay failed:', err));
      }
    }
  };

  const togglePlay = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const nextSong = () => {
    if (queue.length === 0) return;

    let nextIdx;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = currentIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') {
          nextIdx = 0;
        } else {
          setIsPlaying(false);
          return;
        }
      }
    }

    if (nextIdx >= 0 && nextIdx < queue.length) {
      setCurrentIndex(nextIdx);
      setCurrentSong(queue[nextIdx]);
      setIsPlaying(true);
    }
  };

  const prevSong = () => {
    if (queue.length === 0) return;

    let prevIdx;
    if (isShuffle) {
      prevIdx = Math.floor(Math.random() * queue.length);
    } else {
      prevIdx = currentIndex - 1;
      if (prevIdx < 0) {
        if (repeatMode === 'all') {
          prevIdx = queue.length - 1;
        } else {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
          }
          return;
        }
      }
    }

    if (prevIdx >= 0 && prevIdx < queue.length) {
      setCurrentIndex(prevIdx);
      setCurrentSong(queue[prevIdx]);
      setIsPlaying(true);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(-1);
    setCurrentSong(null);
    setIsPlaying(false);
  };

  const handleAudioEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error(err));
      }
    } else {
      nextSong();
    }
  };

  const value = {
    currentSong,
    setCurrentSong,
    isPlaying,
    setIsPlaying,
    queue,
    setQueue,
    currentIndex,
    setCurrentIndex,
    duration,
    currentTime,
    volume,
    setVolume,
    repeatMode,
    isShuffle,
    previewUrl,
    previewLoading,
    showQueue,
    setShowQueue,
    playSong,
    togglePlay,
    seek,
    nextSong,
    prevSong,
    toggleRepeat,
    toggleShuffle,
    clearQueue
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
      <audio 
        ref={audioRef}
        onDurationChange={(e) => setDuration(e.target.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onEnded={handleAudioEnded}
      />
    </PlaybackContext.Provider>
  );
};
