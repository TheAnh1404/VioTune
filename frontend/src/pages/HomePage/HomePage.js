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

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Dynamic user data
  const userId = localStorage.getItem("user_id") || "42";
  const username = localStorage.getItem("username") || "Music Lover";

  // Interactive States
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  const [refreshLikes, setRefreshLikes] = useState(0);
  const [recentSongs, setRecentSongs] = useState(() => {
    const saved = localStorage.getItem(`recent_songs_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });
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

  // Fetch liked songs
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/songs/liked?user_id=${userId}`);
        const json = await res.json();
        if (json.status === "success") {
          setLikedSongIds(new Set(json.data.map(s => s.track_id)));
        }
      } catch (err) {
        console.error("Error fetching likes:", err);
      }
    };
    fetchLikes();
  }, [userId, refreshLikes]);

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

      // Add to recently listened list
      setRecentSongs(prev => {
        const filtered = prev.filter(s => s.track_id !== song.track_id);
        const next = [song, ...filtered].slice(0, 5); // keep top 5
        localStorage.setItem(`recent_songs_${userId}`, JSON.stringify(next));
        return next;
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

  const handleLikeSong = async (song) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/songs/${song.track_id}/like?user_id=${userId}`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.status === "success") {
        setLikedSongIds(prev => {
          const next = new Set(prev);
          if (json.liked) {
            next.add(song.track_id);
          } else {
            next.delete(song.track_id);
          }
          return next;
        });
        setRefreshLikes(prev => prev + 1); // trigger sidebar updates
      }
    } catch (err) {
      console.error("Error toggling like:", err);
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

  return (
    <div className={styles.homeContainer}>
      <Header 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        username={username} 
        userId={userId} 
      />
      <div className={styles.contentWrapper}>
        <SideBarMenu 
          userId={userId}
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
          />
          
          <audio 
            ref={audioRef}
            onDurationChange={(e) => setDuration(e.target.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onEnded={handleAudioEnded}
          />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default HomePage;