import React, { useState, useEffect } from 'react';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import PlaylistPanel from '../../components/PlaylistPanel/PlaylistPanel';
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
        return;
      }
      try {
        const res = await fetch(`http://127.0.0.1:8000/songs/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        const json = await res.json();
        if (json.status === "success") {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error("Lỗi search songs:", err);
      }
    };
    
    // Simple debounce
    const delayDebounce = setTimeout(() => {
      fetchSearch();
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handlePlaySong = (song) => {
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

  const handleUnlikeSong = (trackId) => {
    setLikedSongIds(prev => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
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
        <SideBarMenu />
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

                <PlaylistSection />
                <ArtistUpdates />
                <DailyPick />
                
                {/* Dynamic Artists Followed */}
                <ArtistsFollowed 
                  artists={popularArtists}
                  onArtistClick={(artist) => setSearchQuery(artist)}
                />
                
                <HeroSeries />

                {/* 2. Content-Based Recommendations Section */}
                <RecommendationSection 
                  currentSong={currentSong} 
                  onPlaySong={handlePlaySong} 
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                />

                <RecentAlbums />
                
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
                  songs={searchQuery ? searchResults : trendingSongs} 
                  title={searchQuery ? `Search Results for "${searchQuery}"` : "Trending Now"} 
                  onPlaySong={handlePlaySong} 
                  currentSong={currentSong} 
                  likedSongIds={likedSongIds}
                  onLikeSong={handleLikeSong}
                />

                {/* Dynamic Playback History */}
                <RecentlySeen 
                  recentSongs={recentSongs}
                  onPlaySong={handlePlaySong}
                />
              </div>
            </div>
            <div className={styles.rightSection}>
              <PlaylistPanel 
                userId={userId}
                onPlaySong={handlePlaySong}
                currentSong={currentSong}
                isPlaying={isPlaying}
                refreshTrigger={refreshLikes}
                onUnlikeSong={handleUnlikeSong}
              />
            </div>
          </div>
          <MusicPlayer 
            currentSong={currentSong} 
            isPlaying={isPlaying} 
            onTogglePlay={handleTogglePlay} 
          />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default HomePage;