import React from 'react';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Header from '../../components/Header/Header';
import styles from './HomePage.module.css';

const HomePage = () => {
  return (
    <div className={styles.homeContainer}>
      <Header />
      <div className={styles.contentWrapper}>
        <SideBarMenu />
        <div className={styles.mainContent}>
          {/* Additional main content will go here */}
        </div>
      </div>
    </div>
  );
};

export default HomePage;