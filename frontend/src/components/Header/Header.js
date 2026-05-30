import React from 'react';
import styles from './Header.module.css';
import { Search, Bell, Settings, X, LogOut } from 'lucide-react';
import logo from '../../assets/logo.png';

const Header = ({ searchQuery, onSearchChange, username = "Guest", onLogOut, showSearch = false }) => {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="VioTune Logo" className={styles.logoImage} />
          <span className={styles.logoText}>VioTune</span>
        </div>

        {showSearch && (
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
        )}
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

        {/* Logout button */}
        {onLogOut && (
          <button 
            className={styles.iconButton} 
            onClick={onLogOut} 
            title="Sign out"
            style={{ 
              color: '#f87171', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '13px', 
              fontWeight: '600', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              background: 'rgba(248,113,113,0.08)', 
              border: '1px solid rgba(248,113,113,0.15)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

