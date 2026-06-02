import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Allow a custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default high-end localized fallback UI
      return (
        <div style={containerStyle}>
          <div style={glowStyle}></div>
          <div style={cardStyle}>
            <div style={iconContainerStyle}>
              <AlertTriangle size={36} color="#ef4444" />
            </div>
            <h2 style={titleStyle}>Đã xảy ra sự cố ngoài ý muốn</h2>
            <p style={descStyle}>
              Thành phần này không thể hiển thị do một lỗi kỹ thuật. Vui lòng nhấn nút bên dưới để thử lại hoặc tải lại trang.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={debugStyle}>
                {this.state.error.toString()}
              </pre>
            )}
            <button onClick={this.handleReset} style={btnStyle}>
              <RotateCcw size={16} /> Khôi phục thành phần
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles for reliability and isolation
const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 24px',
  minHeight: '220px',
  width: '100%',
  background: 'rgba(239, 68, 68, 0.02)',
  border: '1px dashed rgba(239, 68, 68, 0.15)',
  borderRadius: '20px',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
};

const glowStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '150px',
  height: '150px',
  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
  pointerEvents: 'none',
};

const cardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  maxWidth: '450px',
  zIndex: 1,
};

const iconContainerStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'rgba(239, 68, 68, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
};

const titleStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#fff',
  margin: '0 0 8px 0',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const descStyle = {
  fontSize: '13px',
  color: '#94a3b8',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const debugStyle = {
  width: '100%',
  background: '#090d16',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '11px',
  color: '#ef4444',
  textAlign: 'left',
  overflowX: 'auto',
  margin: '0 0 20px 0',
  fontFamily: 'monospace',
};

const btnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '30px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600',
  transition: 'all 0.2s',
};

export default ErrorBoundary;
