import React from 'react';
import styles from './Header.module.css';
import { Search, Bell, Settings, X, LogOut } from 'lucide-react';
import logo from '../../assets/logo.png';

const Header = ({ searchQuery, onSearchChange, username = "Guest", onLogOut }) => {
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
          {searchQuery && (
            <button 
              className={styles.clearButton} 
              onClick={() => onSearchChange && onSearchChange("")}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.rightSection}>
        {/* Authenticated user badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>
          <span style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#c4b5fd'
          }}>
            🟢 {username}
          </span>
        </div>

        <button className={styles.iconButton}>
          <Bell size={22} className={styles.icon} />
        </button>
        <button className={styles.iconButton}>
          <Settings size={22} className={styles.icon} />
        </button>

        {/* Logout button */}
        {onLogOut && (
          <button 
            className={styles.iconButton} 
            onClick={onLogOut} 
            title="Sign out"
            style={{ color: '#f87171' }}
          >
            <LogOut size={20} />
          </button>
        )}

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

