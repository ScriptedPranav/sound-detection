import React, { useEffect, useRef, useState } from 'react';

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleNoiseDetection = async () => {
      try {
        audioContextRef.current = new AudioContext();
        await audioContextRef.current.resume();
        setIsListening(true);

        const mediaDevices = navigator.mediaDevices;
        const stream = await mediaDevices.getUserMedia({ audio: true });
        const source = audioContextRef.current.createMediaStreamSource(stream);

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const canvasCtx = canvas.getContext('2d');

        const draw = () => {
          if (!isListening || !canvasCtx) return;

          const WIDTH = canvas.width;
          const HEIGHT = canvas.height;

          analyser.getByteFrequencyData(dataArray);

          canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

          const barWidth = (WIDTH / bufferLength) * 2;
          let barHeight;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i];

            const hue = (i / bufferLength) * 360;
            const saturation = 100;
            const lightness = barHeight / 2;
            canvasCtx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
          }

          const average = [...dataArray].reduce((a, b) => a + b, 0) / bufferLength;
          setNoiseLevel(average);

          requestAnimationFrame(draw);
        };

        draw();
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    };

    if (isListening) {
      handleNoiseDetection();
    } else {
      audioContextRef.current?.close();
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, [isListening]);

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="container">
      <h1 className="heading">Noise Tracker App</h1>
      <button className={`listen-btn ${isListening ? 'active' : ''}`} onClick={toggleListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <canvas ref={canvasRef} className="visualizer" width={800} height={200}></canvas>
      <div className="progress-container">
        <svg className="progress-svg" viewBox="0 0 100 100">
          <circle
            className="progress-background"
            cx="50"
            cy="50"
            r="45"
          />
          <circle
            className="progress-bar"
            cx="50"
            cy="50"
            r="45"
            strokeDasharray={`${noiseLevel} 100`}
          />
          {noiseLevel >= 80 && (
            <>
              <circle className="progress-warning" cx="50" cy="50" r="40" />
              <text className="warning-icon-text" x="50" y="55">⚠️</text>
            </>
          )}
        </svg>
        <div className="progress-label">{Math.round(noiseLevel)}%</div>
      </div>
    </div>
  );
};

export default App;
