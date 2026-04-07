import React from 'react';
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
  return (
    <div className={styles.homeContainer}>
      <Header />
      <div className={styles.contentWrapper}>
        <SideBarMenu />
        <div className={styles.mainContent}>
          <div className={styles.topSplit}>
            <div className={styles.leftSection}>
              <div className={styles.placeholderLeft}>
                <FeatureCards />
                <PlaylistSection />
                <PersonalPlaylist />
                <ArtistUpdates />
                <DailyPick />
                <ArtistsFollowed />
                <HeroSeries />
                <RecommendationSection />
                <RecentAlbums />
                <InterestGenres />
                <MoreArtists />
                <TrendingNow />
                <RecentlySeen />
              </div>
            </div>
            <div className={styles.rightSection}>
              <PlaylistPanel />
            </div>
          </div>
          <MusicPlayer />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default HomePage;