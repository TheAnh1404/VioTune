import React, { useRef, useEffect } from 'react';

/**
 * MusicVisualizer Component
 * Renders a real-time frequency visualizer using Canvas and Web Audio API.
 * 
 * @param {HTMLAudioElement} audioElement - The audio element to visualize
 * @param {boolean} isPlaying - Current playback status
 */
const MusicVisualizer = ({ audioElement, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyzerRef = useRef(null);
  const contextRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    // Initialize Audio Context and Analyzer
    if (!contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      contextRef.current = new AudioContext();
      analyzerRef.current = contextRef.current.createAnalyser();
      
      // Attempt to connect the source (may fail if already connected)
      try {
        sourceRef.current = contextRef.current.createMediaElementSource(audioElement);
        sourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(contextRef.current.destination);
      } catch (err) {
        console.warn("Visualizer connection issue:", err);
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyzer = analyzerRef.current;
    analyzer.fftSize = 64; // Smaller fft for mini visualizer
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);
      analyzer.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient color: Purple to Cyan
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6'); // Purple
        gradient.addColorStop(1, '#06b6d4'); // Cyan

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 2;
      }
    };

    if (isPlaying) {
      if (contextRef.current.state === 'suspended') {
        contextRef.current.resume();
      }
      renderFrame();
    } else {
      cancelAnimationFrame(animationRef.current);
      // Clear one last time to reset bars
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [audioElement, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={100} 
      height={30} 
      style={{ 
        display: 'block', 
        opacity: isPlaying ? 0.8 : 0.2,
        transition: 'opacity 0.3s ease'
      }} 
    />
  );
};

export default MusicVisualizer;
