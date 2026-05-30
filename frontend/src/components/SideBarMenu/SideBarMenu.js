import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SideBarMenu.module.css';
import { 
  Home, Heart, ListMusic, Globe, 
  Award, MessageSquare 
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, expanded, onClick }) => {
  let itemClass = styles.menuItem;
  let iconClass = styles.iconInactive;
  
  if (active) {
    if (expanded) {
      itemClass = `${styles.menuItem} ${styles.activeExpanded}`;
      iconClass = styles.iconActiveExpanded;
    } else {
      itemClass = `${styles.menuItem} ${styles.activeCollapsed}`;
      iconClass = styles.iconActiveCollapsed;
    }
  }

  return (
    <div 
      className={itemClass} 
      onClick={onClick}
      title={expanded ? undefined : label}
    >
      <div className={styles.iconWrapper}>
        <Icon 
          size={22} 
          strokeWidth={active ? 2.5 : 1.5} 
          className={iconClass}
        />
      </div>
      <span className={`${styles.label} ${expanded ? styles.labelExpanded : styles.labelCollapsed}`}>
        {label}
      </span>
    </div>
  );
};

const SideBarMenu = ({ userId = "42", likedSongs = [], likedSongIds = new Set(), refreshTrigger = 0, onPlaySong, currentSong }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Home');
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: 'Home', label: 'Home', icon: Home, path: '/home' },
    { id: 'Favorite', label: 'Comparative Sandbox', icon: Heart, path: '/recommendation' },
    { id: 'Playlists', label: 'My Favorites', icon: ListMusic, action: 'scroll-favorites' },
    { id: 'Browser', label: 'Search Songs', icon: Globe, path: '/search' },
  ];

  const bottomItems = [
    { id: 'Premium', label: 'Premium', icon: Award },
    { id: 'Q&A', label: 'Q&A', icon: MessageSquare },
  ];

  const handleItemClick = (item) => {
    setActiveTab(item.id);
    if (item.path) {
      navigate(item.path);
    } else if (item.action === 'scroll-favorites') {
      const favoritesHeader = document.querySelector('h2');
      if (favoritesHeader) {
        favoritesHeader.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (item.action === 'focus-search') {
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <aside 
      className={`${styles.sidebar} ${isExpanded ? styles.sidebarExpanded : styles.sidebarCollapsed}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`${styles.pillContainer} ${isExpanded ? styles.pillExpanded : styles.pillCollapsed}`}>
        {/* Main Menu */}
        <nav className={styles.menuGroup}>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeTab === item.id}
              expanded={isExpanded}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </nav>

        {/* Real Liked Songs Library list (Similar to Spotify Library) */}
        {isExpanded && likedSongs.length > 0 && (
          <div className={styles.likedSongsWrapper}>
            <h4 className={styles.sectionTitle}>Library ({likedSongs.length})</h4>
            <div className={styles.likedTrackList}>
              {likedSongs.map((track) => {
                const isCurrent = currentSong && currentSong.track_id === track.track_id;
                return (
                  <div 
                    key={track.track_id} 
                    className={`${styles.likedTrackItem} ${isCurrent ? styles.activeTrack : ''}`}
                    onClick={() => onPlaySong && onPlaySong(track, likedSongs)}
                    title={track.track_name}
                  >
                    <Heart size={14} fill="#ef4444" style={{ color: '#ef4444', marginRight: '8px', flexShrink: 0 }} />
                    <div className={styles.trackText}>
                      <div className={styles.trackName}>{track.track_name}</div>
                      <div className={styles.trackArtist}>{track.artists}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsed view indicator when library has tracks */}
        {!isExpanded && likedSongs.length > 0 && (
          <div 
            className={styles.collapsedLibraryIndicator}
            onClick={() => setIsExpanded(true)}
            title={`Liked Songs Library (${likedSongs.length})`}
          >
            <Heart size={18} fill="#ef4444" style={{ color: '#ef4444' }} />
            <span className={styles.libraryBadge}>{likedSongs.length}</span>
          </div>
        )}

        {/* Bottom Menu */}
        <div className={styles.bottomGroup}>
          {bottomItems.map((item) => (
            <SidebarItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeTab === item.id}
              expanded={isExpanded}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SideBarMenu;