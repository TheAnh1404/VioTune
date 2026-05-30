import React from 'react';
import styles from './Header.module.css';
import { Search, Bell, Settings } from 'lucide-react';
import logo from '../../assets/logo.png';

const Header = ({ searchQuery, onSearchChange, username = "Guest", userId = "42" }) => {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="VioTune Logo" className={styles.logoImage} />
          <span className={styles.logoText}>VioTune</span>
        </div>

        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Search songs or artists..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '15px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            🟢 User {userId} ({username})
          </span>
        </div>
        <button className={styles.iconButton}>
          <Bell size={22} className={styles.icon} />
        </button>
        <button className={styles.iconButton}>
          <Settings size={22} className={styles.icon} />
        </button>
        <div className={styles.profileWrapper}>
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" 
            alt="Profile" 
            className={styles.profileImage}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
