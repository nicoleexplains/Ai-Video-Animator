
import React, { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LoadingIndicator } from './components/LoadingIndicator';
import { VideoPlayer } from './components/VideoPlayer';
import { animateImage } from './services/geminiService';
import { SparklesIcon } from './components/icons';

enum AppState {
  IDLE,
  ANIMATING,
  SUCCESS,
  ERROR,
}

const LOADING_MESSAGES = [
    "Warming up the animation engine...",
    "Analyzing your image's pixels...",
    "Choreographing the motion...",
    "Rendering the video frames...",
    "Almost there, adding the final touches...",
    "This can take a few minutes, hang tight!",
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    if (appState === AppState.ANIMATING) {
      const intervalId = setInterval(() => {
        setLoadingMessage(prevMessage => {
          const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
          const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
          return LOADING_MESSAGES[nextIndex];
        });
      }, 3000);
      return () => clearInterval(intervalId);
    }
  }, [appState]);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setAppState(AppState.IDLE); // Reset state if a new image is uploaded
    setVideoUrl(null);
    setError(null);
  };

  const handleAnimate = useCallback(async () => {
    if (!imageFile) return;

    setAppState(AppState.ANIMATING);
    setError(null);
    setLoadingMessage(LOADING_MESSAGES[0]);

    try {
      const generatedVideoUrl = await animateImage(imageFile, (message) => {
        setLoadingMessage(message);
      });
      setVideoUrl(generatedVideoUrl);
      setAppState(AppState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during animation.');
      setAppState(AppState.ERROR);
    }
  }, [imageFile]);

  const handleReset = () => {
    if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
    }
    if(videoUrl) {
        URL.revokeObjectURL(videoUrl);
    }
    setAppState(AppState.IDLE);
    setImageFile(null);
    setImagePreviewUrl(null);
    setVideoUrl(null);
    setError(null);
  };
  
  const renderContent = () => {
    switch (appState) {
      case AppState.ANIMATING:
        return <LoadingIndicator message={loadingMessage} imagePreviewUrl={imagePreviewUrl} />;
      case AppState.SUCCESS:
        return videoUrl ? <VideoPlayer videoUrl={videoUrl} onReset={handleReset} /> : null;
      case AppState.ERROR:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Animation Failed</h2>
            <p className="text-slate-400 bg-slate-800 p-4 rounded-lg">{error}</p>
            <button
              onClick={handleReset}
              className="mt-6 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case AppState.IDLE:
      default:
        return (
          <ImageUploader
            onImageUpload={handleImageUpload}
            onAnimate={handleAnimate}
            isAnimating={appState === AppState.ANIMATING}
            imagePreviewUrl={imagePreviewUrl}
            hasImage={!!imageFile}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <SparklesIcon className="w-10 h-10 text-brand-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-sky-300">
              AI Video Animator
            </h1>
          </div>
          <p className="text-slate-400">Bring your static photos to life with a single click.</p>
        </header>
        <main className="bg-slate-800/50 p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-sm">
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
