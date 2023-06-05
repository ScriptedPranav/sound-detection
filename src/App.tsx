import React, { useEffect, useRef, useState } from 'react';

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleNoiseDetection = async () => {
      try {
        audioContextRef.current = new AudioContext();
        await audioContextRef.current.resume();
        setIsListening(true);

        const mediaDevices = navigator.mediaDevices as any;
        const stream = await mediaDevices.getUserMedia({ audio: true });
        const source = audioContextRef.current.createMediaStreamSource(stream);

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);

        const canvas = canvasRef.current;
        const canvasCtx = canvas?.getContext('2d');

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
            canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

            x += barWidth + 1;
          }

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
    <div>
      <h1>Sound Detection App</h1>
      <button onClick={toggleListening}>
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      <canvas ref={canvasRef} width={800} height={200}></canvas>
    </div>
  );
};

export default App;
