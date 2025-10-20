import React, { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { LoadingIndicator } from './components/LoadingIndicator';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoHistory } from './components/VideoHistory';
import { animateImage } from './services/geminiService';
import { SparklesIcon } from './components/icons';
import { fileToBase64, blobToBase64 } from './utils/fileUtils';

enum AppState {
  IDLE,
  ANIMATING,
  SUCCESS,
  ERROR,
}

export interface HistoryItem {
  id: string;
  imageBase64: string;
  videoBase64: string;
  videoMimeType: string;
  generationTime: number;
  modelUsed: string;
}

const LOADING_MESSAGES = [
    "Warming up the animation engine...",
    "Analyzing your image's pixels...",
    "Choreographing the motion...",
    "Rendering the video frames...",
    "Almost there, adding the final touches...",
    "This can take a few minutes, hang tight!",
];

const HISTORY_LIMIT = 5;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  // Check for API key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        setApiKeyReady(await window.aistudio.hasSelectedApiKey());
      } else {
        // Assume key is available in env for non-aistudio environments
        setApiKeyReady(true);
      }
    };
    checkApiKey();
  }, []);

  // Load history from localStorage on initial mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('ai-video-animator-history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      // If parsing fails, clear the corrupted data
      localStorage.removeItem('ai-video-animator-history');
    }
  }, []);

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

  const updateAndSaveHistory = useCallback((newItem: HistoryItem) => {
    setHistory(currentHistory => {
        const newHistory = [newItem, ...currentHistory].slice(0, HISTORY_LIMIT);
        
        let historyToSave = [...newHistory];
        
        while (historyToSave.length > 0) {
            try {
                localStorage.setItem('ai-video-animator-history', JSON.stringify(historyToSave));
                // Succeeded, this is the new state.
                return historyToSave;
            } catch (e: any) {
                // A more robust check for quota exceeded error across browsers and environments.
                const isQuotaError = e && (
                    e.name === 'QuotaExceededError' ||
                    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                    (typeof e.message === 'string' && e.message.toLowerCase().includes('quota'))
                );

                if (isQuotaError) {
                    console.warn('LocalStorage quota exceeded. Removing oldest history item to make space.');
                    historyToSave.pop(); // remove oldest and try again in the next loop iteration
                } else {
                    console.error("Failed to save history to localStorage", e);
                    // On other errors, just return the new history without saving, which is better than crashing.
                    return newHistory;
                }
            }
        }

        // If we end up here, it means even saving one item failed, or we trimmed it down to empty.
        localStorage.removeItem('ai-video-animator-history');
        return historyToSave;
    });
  }, []);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setAppState(AppState.IDLE); // Reset state if a new image is uploaded
    setVideoUrl(null);
    setVideoBlob(null);
    setError(null);
    setProgress(0);
  };

  const handleAnimate = useCallback(async () => {
    if (!imageFile) return;

    setAppState(AppState.ANIMATING);
    setError(null);
    setProgress(0);
    setLoadingMessage(LOADING_MESSAGES[0]);

    const startTime = Date.now();
    try {
      const { videoBlob: generatedVideoBlob, model } = await animateImage(imageFile, setProgress);
      const duration = Date.now() - startTime;
      
      setVideoBlob(generatedVideoBlob);
      const generatedVideoUrl = URL.createObjectURL(generatedVideoBlob);
      setVideoUrl(generatedVideoUrl);
      setAppState(AppState.SUCCESS);
      setGenerationTime(duration);
      setModelUsed(model);

      // Save to history
      const imageBase64 = await fileToBase64(imageFile);
      const videoBase64 = await blobToBase64(generatedVideoBlob);
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        imageBase64,
        videoBase64,
        videoMimeType: generatedVideoBlob.type,
        generationTime: duration,
        modelUsed: model,
      };
      updateAndSaveHistory(newItem);

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during animation.';
      
      if (errorMessage.toLowerCase().includes("requested entity was not found")) {
        setApiKeyReady(false);
        setError("Your API key appears to be invalid. Please select a valid project API key to continue.");
        setAppState(AppState.IDLE);
        return;
      }

      setError(errorMessage);
      setAppState(AppState.ERROR);
    } finally {
        setProgress(0);
    }
  }, [imageFile, updateAndSaveHistory]);

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
    setVideoBlob(null);
    setError(null);
    setProgress(0);
    setGenerationTime(null);
    setModelUsed(null);
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    const byteCharacters = atob(item.videoBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: item.videoMimeType});
    const url = URL.createObjectURL(blob);

    if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
    }
    
    setVideoUrl(url);
    setVideoBlob(blob);
    setAppState(AppState.SUCCESS);
    setImageFile(null);
    setImagePreviewUrl(null);
    setProgress(0);
    setGenerationTime(item.generationTime);
    setModelUsed(item.modelUsed);

    // Scroll to the top to see the player
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('ai-video-animator-history');
    } catch(e) {
      console.error("Failed to clear history from localStorage", e);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success due to race condition and to provide immediate UI feedback.
      setApiKeyReady(true);
      setError(null); // Clear previous API key errors
    }
  };
  
  const renderContent = () => {
    switch (appState) {
      case AppState.ANIMATING:
        return <LoadingIndicator message={loadingMessage} imagePreviewUrl={imagePreviewUrl} progress={progress} />;
      case AppState.SUCCESS:
        return videoUrl ? (
          <VideoPlayer 
            videoUrl={videoUrl} 
            videoBlob={videoBlob} 
            onReset={handleReset} 
            generationTime={generationTime}
            modelUsed={modelUsed}
          />
        ) : null;
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
            isAnimating={false}
            imagePreviewUrl={imagePreviewUrl}
            hasImage={!!imageFile}
          />
        );
    }
  };

  if (!apiKeyReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white">
        <div className="w-full max-w-md mx-auto text-center bg-slate-800/50 p-8 rounded-2xl shadow-2xl border border-slate-700">
          <SparklesIcon className="w-12 h-12 text-brand-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Welcome to AI Video Animator</h1>
          <p className="text-slate-400 mb-6">To get started, please select a Google AI Studio API key. This is required to use the underlying Gemini model.</p>
          {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}
          <button
            onClick={handleSelectKey}
            className="w-full px-6 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors transform hover:scale-105"
          >
            Select API Key
          </button>
          <p className="text-xs text-slate-500 mt-4">
            Ensure your project has billing enabled. For more information, see the{' '}
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-300">
              billing documentation
            </a>.
          </p>
        </div>
      </div>
    );
  }

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
        <VideoHistory 
          history={history}
          onSelect={handleSelectHistoryItem}
          onClear={handleClearHistory}
        />
        <footer className="text-center mt-8 text-slate-500 text-sm">
          <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;