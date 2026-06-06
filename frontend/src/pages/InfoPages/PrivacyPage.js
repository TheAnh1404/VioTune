import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import styles from './InfoPages.module.css';
import Header from '../../components/Header/Header';
import SideBarMenu from '../../components/SideBarMenu/SideBarMenu';
import Footer from '../../components/Footer/Footer';
import MusicPlayer from '../../components/MusicPlayer/MusicPlayer';

const PrivacyPage = () => {
  const navigate = useNavigate();
  const { user, logOut, likedSongs, likedSongIds } = useAuth();
  const { currentSong, isPlaying, togglePlay, duration, currentTime, seek, nextSong, prevSong, repeatMode, isShuffle, toggleRepeat, toggleShuffle, volume, setVolume, previewLoading, previewUrl, audioElement, playSong } = usePlayback();
  const username = user?.displayName || user?.email?.split('@')[0] || "User";
  const userId = user?.uid;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogOut = async () => {
    try {
      await logOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handlePlaySong = (song, songList = []) => {
    playSong(song, songList);
    navigate('/player');
  };

  return (
    <div className={styles.infoContainer}>
      <div className={styles.ambientGlow} />
      
      <Header 
        username={username} 
        onLogOut={handleLogOut}
        showSearch={false}
      />

      <div className={styles.layoutWrapper}>
        <SideBarMenu 
          userId={userId}
          likedSongs={likedSongs}
          likedSongIds={likedSongIds}
          refreshTrigger={likedSongs?.length || 0}
          onPlaySong={handlePlaySong}
          currentSong={currentSong}
        />

        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <header className={styles.pageHeader}>
              <h1 className="gradient-text-purple-cyan">Chính sách bảo mật</h1>
              <p>Sự riêng tư của bạn là ưu tiên hàng đầu của chúng tôi tại VioTune.</p>
            </header>

            <div className={`${styles.infoCard} glass-panel`}>
              <div className={styles.iconCircle} style={{ marginBottom: '24px' }}>
                <Shield size={32} />
              </div>
              
              <h2>1. Thông tin chúng tôi thu thập</h2>
              <p>Chúng tôi chỉ thu thập các thông tin cần thiết để cung cấp dịch vụ tốt nhất cho bạn:</p>
              <ul>
                <li>Thông tin tài khoản: Tên hiển thị, email.</li>
                <li>Dữ liệu âm nhạc: Bài hát bạn thích, lịch sử nghe nhạc, danh sách phát bạn tạo.</li>
                <li>Dữ liệu kỹ thuật: Thông tin thiết bị, địa chỉ IP (để bảo mật).</li>
              </ul>

              <h2>2. Cách chúng tôi sử dụng thông tin</h2>
              <p>Thông tin của bạn được sử dụng để:</p>
              <ul>
                <li>Cá nhân hóa các gợi ý âm nhạc thông qua hệ thống AI.</li>
                <li>Duy trì và cải thiện hiệu suất của ứng dụng.</li>
                <li>Gửi các thông báo quan trọng liên quan đến tài khoản của bạn.</li>
              </ul>

              <h2>3. Chia sẻ thông tin</h2>
              <p>
                VioTune cam kết <strong>KHÔNG</strong> bán hoặc chia sẻ thông tin cá nhân của bạn cho bên thứ ba vì mục đích quảng cáo. Chúng tôi chỉ chia sẻ dữ liệu với các đối tác tin cậy (như Google Firebase) để vận hành hạ tầng kỹ thuật của ứng dụng.
              </p>

              <h2>4. Quyền của bạn</h2>
              <p>
                Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào. Hãy liên hệ với chúng tôi nếu bạn muốn thực hiện các quyền này.
              </p>
            </div>
            
            <Footer />
          </div>
        </main>
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
        volume={volume}
        onVolumeChange={setVolume}
        previewLoading={previewLoading}
        previewUrl={previewUrl}
        onMaximize={() => navigate('/player')}
        audioElement={audioElement}
      />
    </div>
  );
};

export default PrivacyPage;
