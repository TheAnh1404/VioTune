import React from 'react';
import styles from './Header.module.css';
import { Search, Bell, Settings } from 'lucide-react';
import logo from '../../assets/logo.png';

const Header = () => {
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
            placeholder="Search" 
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        <button className={styles.iconButton}>
          <Bell size={22} className={styles.icon} />
        </button>
        <button className={styles.iconButton}>
          <Settings size={22} className={styles.icon} />
        </button>
        <div className={styles.profileWrapper}>
          <img 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" 
            alt="Profile" 
            className={styles.profileImage}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
