import React, { useState, useEffect, useRef } from 'react';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import QueuePanel from '../../components/QueuePanel/QueuePanel';
import styles from './HomePage.module.css';
import FeatureCards from '../../components/FeatureCards/FeatureCards';
import PlaylistSection from '../../components/PlaylistSection/PlaylistSection';
import PersonalPlaylist from '../../components/PersonalPlaylist/PersonalPlaylist';
import ArtistUpdates from '../../components/ArtistUpdates/ArtistUpdates';
import DailyPick from '../../components/DailyPick/DailyPick';
import ArtistsFollowed from '../../components/ArtistsFollowed/ArtistsFollowed';
import HeroSeries from '../../components/HeroSeries/HeroSeries';
import RecommendationSection from '../../components/RecommendationSection/RecommendationSection';
import RecentAlbums from '../../components/RecentAlbums/RecentAlbums';
import InterestGenres from '../../components/InterestGenres/InterestGenres';
import MoreArtists from '../../components/MoreArtists/MoreArtists';
import TrendingNow from '../../components/TrendingNow/TrendingNow';
import RecentlySeen from '../../components/RecentlySeen/RecentlySeen';
import MusicPlayer from '../../components/MusicPlayer/MusicPlayer';
import { useAuth } from '../../context/AuthContext';

const HomePage = () => {
  // ── Firebase Auth context ────────────────────────────────────────────────────
  const { user, logOut, likeSong, unlikeSong, getLikedSongs, recordPlay } = useAuth();
  const userId = user?.uid || 'anonymous';
  const username = user?.displayName || user?.email?.split('@')[0] || 'Music Lover';

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Interactive States
  const [likedSongs, setLikedSongs] = useState([]);
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  const [refreshLikes, setRefreshLikes] = useState(0);
  const [recentSongs, setRecentSongs] = useState([]);
  const [popularArtists, setPopularArtists] = useState([]);
  
  // Curated playlist states
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [playlistTitle, setPlaylistTitle] = useState("");

  // Playback Real States
  const audioRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isShuffle, setIsShuffle] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [previewUrl, setPreviewUrl] = useState(null);  // Real Deezer preview URL
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewCache = useRef({});  // { 'trackId': 'https://...' | null }

  // Fetch real Deezer 30s preview via our FastAPI backend proxy
  const fetchDeezerPreview = async (song) => {
    const cacheKey = song.track_id;
    if (previewCache.current[cacheKey] !== undefined) {
      return previewCache.current[cacheKey]; // return cached (including null)
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

  // ── Load liked songs from Firestore on mount ─────────────────────────────────
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const liked = await getLikedSongs();
        setLikedSongs(liked);
        setLikedSongIds(new Set(liked.map(s => s.track_id)));
      } catch (err) {
        console.error('Error fetching likes from Firestore:', err);
      }
    };
    if (user) fetchLikes();
  }, [user, refreshLikes]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Fetch popular artists on mount
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/artists?limit=5");
        const json = await res.json();
        if (json.status === "success") {
          setPopularArtists(json.data);
        }
      } catch (err) {
        console.error("Error fetching popular artists:", err);
      }
    };
    fetchArtists();
  }, []);

  // Fetch trending/random songs on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/songs/random?limit=10");
        const json = await res.json();
        if (json.status === "success") {
          setTrendingSongs(json.data);
          // Set first song as default (but not playing)
          if (json.data.length > 0) {
            setCurrentSong(json.data[0]);
            setQueue(json.data);
            setCurrentIndex(0);
          }
        }
      } catch (err) {
        console.error("Lỗi fetch trending songs:", err);
      }
    };
    fetchTrending();
  }, []);

  // Fetch search results whenever searchQuery changes
  useEffect(() => {
    const fetchSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      // Overridden by active search
      setPlaylistSongs([]);
      setPlaylistTitle("");
      try {
        const res = await fetch(`http://127.0.0.1:8000/songs/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        const json = await res.json();
        if (json.status === "success") {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error("Lỗi search songs:", err);
      } finally {
        setIsSearching(false);
      }
    };
    
    // Simple debounce
    setIsSearching(true);
    const delayDebounce = setTimeout(() => {
      fetchSearch();
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Auto-scroll to search results when they arrive
  useEffect(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      const el = document.getElementById('trending-now-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchResults, searchQuery]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Handle Playback Audio object properties using real Deezer previews
  useEffect(() => {
    if (!audioRef.current) return;

    if (currentSong && currentSong.track_id) {
      const applyPlayback = async () => {
        const deezerUrl = await fetchDeezerPreview(currentSong);
        setPreviewUrl(deezerUrl);

        if (!deezerUrl) {
          console.warn(`No Deezer preview found for: ${currentSong.track_name} — ${currentSong.artists}`);
          audioRef.current.pause();
          return;
        }

        // Load new source only if changed
        if (audioRef.current.src !== deezerUrl) {
          audioRef.current.src = deezerUrl;
          audioRef.current.load();
        }

        audioRef.current.volume = volume;

        if (isPlaying) {
          audioRef.current.play().catch(err => {
            console.warn('Playback blocked by browser policy:', err);
          });
        } else {
          audioRef.current.pause();
        }
      };

      applyPlayback();
    } else {
      audioRef.current.pause();
    }
  }, [currentSong, isPlaying]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Sync volume change to Audio object
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlaySong = (song, songList = []) => {
    let targetQueue = songList;
    
    // Fallback: If no list passed, search in active state lists
    if (!targetQueue || targetQueue.length === 0) {
      if (searchResults.some(s => s.track_id === song.track_id)) {
        targetQueue = searchResults;
      } else if (playlistSongs.some(s => s.track_id === song.track_id)) {
        targetQueue = playlistSongs;
      } else if (trendingSongs.some(s => s.track_id === song.track_id)) {
        targetQueue = trendingSongs;
      } else {
        targetQueue = [song];
      }
    }

    setQueue(targetQueue);
    const idx = targetQueue.findIndex(s => s.track_id === song.track_id);
    setCurrentIndex(idx >= 0 ? idx : 0);

    if (currentSong && currentSong.track_id === song.track_id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);

      // Record play in Firestore + update local recent list
      if (user) {
        recordPlay(song).catch(err => console.warn('recordPlay failed:', err));
      }
      setRecentSongs(prev => {
        const filtered = prev.filter(s => s.track_id !== song.track_id);
        return [song, ...filtered].slice(0, 5);
      });
    }
  };

  const handleTogglePlay = () => {
    if (currentSong) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
  };

  const handleNextSong = () => {
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

  const handlePrevSong = () => {
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

  const handleToggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const handleToggleShuffle = () => {
    setIsShuffle(prev => !prev);
  };

  const handleClearQueue = () => {
    setQueue([]);
    setCurrentIndex(-1);
    setCurrentSong(null);
    setIsPlaying(false);
  };

  const handleAudioEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error("Error playing audio on repeat one:", err));
      }
    } else {
      handleNextSong();
    }
  };

  // ── Like / Unlike using Firestore ───────────────────────────────────────────
  const handleLikeSong = async (song) => {
    if (!user) return;
    const isLiked = likedSongIds.has(song.track_id);
    try {
      // Optimistic update
      setLikedSongIds(prev => {
        const next = new Set(prev);
        if (isLiked) next.delete(song.track_id);
        else next.add(song.track_id);
        return next;
      });

      if (isLiked) {
        await unlikeSong(song.track_id);
      } else {
        await likeSong(song);
      }
      setRefreshLikes(prev => prev + 1);
    } catch (err) {
      console.error('Like/unlike failed:', err);
      // Revert optimistic update on error
      setLikedSongIds(prev => {
        const next = new Set(prev);
        if (isLiked) next.add(song.track_id);
        else next.delete(song.track_id);
        return next;
      });
    }
  };

  const handleSelectPlaylist = async (playlistName, genreName) => {
    setSearchQuery(""); // Clear search to show playlist
    try {
      const res = await fetch(`http://127.0.0.1:8000/playlists/${genreName}/songs?limit=15`);
      const json = await res.json();
      if (json.status === "success") {
        setPlaylistSongs(json.data);
        setPlaylistTitle(playlistName);
        setQueue(json.data);
        setCurrentIndex(0);
        
        // Scroll smoothly to Trending Now / Playlist track row
        const el = document.querySelector('h2:nth-of-type(3)') || document.querySelector('section:nth-of-type(4)');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error("Error loading playlist songs:", err);
    }
  };

  // ── Log out via Firebase ─────────────────────────────────────────────────────
  const handleLogOut = async () => {
    try {
      await logOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className={styles.homeContainer}>
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        username={username} 
        userId={userId}
        onLogOut={handleLogOut}
      />
      <div className={styles.contentWrapper}>
        <SideBarMenu 
          userId={userId}
          likedSongs={likedSongs}
          likedSongIds={likedSongIds}
          refreshTrigger={refreshLikes}
          onPlaySong={handlePlaySong}
          currentSong={currentSong}
        />
        <div className={styles.mainContent}>
          <div className={styles.topSplit}>
            <div className={styles.leftSection}>
              <div className={styles.placeholderLeft}>
                <FeatureCards />
                
                {/* 1. Personalized CF Recommendations Section */}
                <PersonalPlaylist 
                  userId={userId} 
                  onPlaySong={handlePlaySong} 
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                />

                {/* Curated Playlist list */}
                <PlaylistSection 
                  onSelectPlaylist={handleSelectPlaylist}
                />

                <ArtistUpdates 
                  onPlaySong={handlePlaySong}
                  currentSong={currentSong}
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                />

                {/* Curated Daily Picks */}
                <DailyPick 
                  onPlaySong={handlePlaySong}
                  currentSong={currentSong}
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                />
                
                {/* Dynamic Artists Followed */}
                <ArtistsFollowed 
                  artists={popularArtists}
                  onArtistClick={(artist) => setSearchQuery(artist)}
                />
                
                <HeroSeries 
                  onSelectSeries={handleSelectPlaylist}
                />

                {/* 2. Content-Based Recommendations Section */}
                <RecommendationSection 
                  currentSong={currentSong} 
                  onPlaySong={handlePlaySong} 
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                />

                {/* Dynamic Albums */}
                <RecentAlbums 
                  onAlbumClick={(artist) => setSearchQuery(artist)}
                />
                
                {/* Interactive Genre Selector */}
                <InterestGenres 
                  onSelectGenre={(genre) => setSearchQuery(genre)}
                />
                
                {/* Dynamic Suggestions */}
                <MoreArtists 
                  artists={popularArtists}
                  onArtistClick={(artist) => setSearchQuery(artist)}
                />

                {/* 3. Search and Trending Section */}
                <TrendingNow 
                  songs={searchQuery ? searchResults : (playlistSongs.length > 0 ? playlistSongs : trendingSongs)} 
                  title={searchQuery ? `Search Results for "${searchQuery}"` : (playlistTitle ? playlistTitle : "Trending Now")} 
                  onPlaySong={handlePlaySong} 
                  currentSong={currentSong} 
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                  isLoading={isSearching}
                />

                {/* Dynamic Playback History */}
                <RecentlySeen 
                  recentSongs={recentSongs}
                  onPlaySong={handlePlaySong}
                />
              </div>
            </div>
            {/* Slide-out Queue Drawer */}
            <div className={`${styles.queueDrawer} ${showQueue ? styles.queueDrawerOpen : ''}`}>
              <QueuePanel 
                queue={queue}
                currentIndex={currentIndex}
                currentSong={currentSong}
                onPlaySong={handlePlaySong}
                onClearQueue={handleClearQueue}
                onClose={() => setShowQueue(false)}
              />
            </div>
          </div>
          <Footer />
        </div>
      </div>
      <MusicPlayer 
        currentSong={currentSong} 
        isPlaying={isPlaying} 
        onTogglePlay={handleTogglePlay} 
        duration={duration}
        currentTime={currentTime}
        onSeek={handleSeek}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleShuffle={handleToggleShuffle}
        onToggleQueue={() => setShowQueue(prev => !prev)}
        showQueue={showQueue}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        previewLoading={previewLoading}
        previewUrl={previewUrl}
      />
      <audio 
        ref={audioRef}
        onDurationChange={(e) => setDuration(e.target.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onEnded={handleAudioEnded}
      />
    </div>
  );
};

export default HomePage;