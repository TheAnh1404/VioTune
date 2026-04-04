import React from 'react';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import PlaylistPanel from '../../components/PlaylistPanel/PlaylistPanel';
import styles from './HomePage.module.css';

const HomePage = () => {
  return (
    <div className={styles.homeContainer}>
      <Header />
      <div className={styles.contentWrapper}>
        <SideBarMenu />
        <div className={styles.mainContent}>
          <div className={styles.topSplit}>
            <div className={styles.leftSection}>
              <div className={styles.placeholderLeft}>
                <h2 style={{ padding: '20px', color: '#a0aec0', fontWeight: 'normal' }}>
                  Main Content Area (To be designed later)
                </h2>
              </div>
            </div>
            <div className={styles.rightSection}>
              <PlaylistPanel />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default HomePage;