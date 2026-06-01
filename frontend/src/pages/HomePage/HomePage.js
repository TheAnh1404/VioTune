import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import AIRecommendationStation from '../../components/AIRecommendationStation/AIRecommendationStation';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';

const HomePage = () => {
  const navigate = useNavigate();
  
  // ── Firebase Auth context (Hoisted Global State) ──────────────────────────────
  const { user, logOut, likeSong, unlikeSong, likedSongsList: likedSongs, likedSongIds } = useAuth();
  const userId = user?.uid || 'anonymous';
  const username = user?.displayName || user?.email?.split('@')[0] || 'Music Lover';

  // ── Playback Context (Global State) ───────────────────────────────────────────
  const {
    currentSong, setCurrentSong,
    isPlaying,
    queue, setQueue,
    currentIndex, setCurrentIndex,
    duration, currentTime,
    volume, setVolume,
    repeatMode, isShuffle,
    previewUrl, previewLoading,
    showQueue, setShowQueue,
    playSong, togglePlay, seek,
    nextSong, prevSong, toggleRepeat, toggleShuffle, clearQueue
  } = usePlayback();

  // Local Interactive States (Non-playback)
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [popularArtists, setPopularArtists] = useState([]);
  
  // Curated playlist states
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [playlistTitle, setPlaylistTitle] = useState("");

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
          // Set first song as default queue if empty
          if (json.data.length > 0 && !currentSong) {
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
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handlePlaySong = (song, songList = []) => {
    let targetQueue = songList;
    if (!targetQueue || targetQueue.length === 0) {
      if (playlistSongs.some(s => s.track_id === song.track_id)) {
        targetQueue = playlistSongs;
      } else if (trendingSongs.some(s => s.track_id === song.track_id)) {
        targetQueue = trendingSongs;
      } else {
        targetQueue = [song];
      }
    }

    playSong(song, targetQueue);
    
    // Add to local recent history state
    setRecentSongs(prev => {
      const filtered = prev.filter(s => s.track_id !== song.track_id);
      return [song, ...filtered].slice(0, 5);
    });

    // Navigate to dedicated Player page for YouTube Music experience!
    navigate('/player');
  };

  // ── Like / Unliked Song (Directly using global context) ──────────────────────
  const handleLikeSong = async (song) => {
    if (!user) return;
    const isLiked = likedSongIds.has(song.track_id);
    if (isLiked) {
      await unlikeSong(song.track_id);
    } else {
      await likeSong(song);
    }
  };

  const handleSelectPlaylist = async (playlistName, genreName) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/playlists/${genreName}/songs?limit=15`);
      const json = await res.json();
      if (json.status === "success") {
        setPlaylistSongs(json.data);
        setPlaylistTitle(playlistName);
        setQueue(json.data);
        setCurrentIndex(0);
        
        // Scroll smoothly to Playlist section
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
        username={username} 
        onLogOut={handleLogOut}
        showSearch={false} // Header does not show search box on home page!
      />
      <div className={styles.contentWrapper}>
        <SideBarMenu 
          userId={userId}
          likedSongs={likedSongs}
          likedSongIds={likedSongIds}
          refreshTrigger={likedSongs?.length || 0}
          onPlaySong={handlePlaySong}
          currentSong={currentSong}
        />
        <div className={styles.mainContent}>
          <div className={styles.topSplit}>
            <div className={styles.leftSection}>
              <div className={styles.placeholderLeft}>
                <FeatureCards />
                
                {/* AI Recommendation Station Control Dashboard */}
                <AIRecommendationStation 
                  userId={userId}
                  currentSong={currentSong}
                  onPlaySong={handlePlaySong}
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                  likedTrigger={likedSongs?.length || 0}
                />
                
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
                  onArtistClick={() => navigate('/search')}
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
                  onAlbumClick={() => navigate('/search')}
                />
                
                {/* Interactive Genre Selector */}
                <InterestGenres 
                  onSelectGenre={() => navigate('/search')}
                />
                
                {/* Dynamic Suggestions */}
                <MoreArtists 
                  artists={popularArtists}
                  onArtistClick={() => navigate('/search')}
                />

                {/* 3. Search and Trending Section */}
                <TrendingNow 
                  songs={playlistSongs.length > 0 ? playlistSongs : trendingSongs} 
                  title={playlistTitle ? playlistTitle : "Trending Now"} 
                  onPlaySong={handlePlaySong} 
                  currentSong={currentSong} 
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                  isLoading={false}
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
                onClearQueue={clearQueue}
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
        onTogglePlay={togglePlay} 
        duration={duration}
        currentTime={currentTime}
        onSeek={seek}
        onNext={nextSong}
        onPrev={prevSong}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        onToggleRepeat={toggleRepeat}
        onToggleShuffle={toggleShuffle}
        onToggleQueue={() => setShowQueue(prev => !prev)}
        showQueue={showQueue}
        volume={volume}
        onVolumeChange={setVolume}
        previewLoading={previewLoading}
        previewUrl={previewUrl}
        onMaximize={() => navigate('/player')} // Support click maximize to YTM page!
      />
    </div>
  );
};

export default HomePage;