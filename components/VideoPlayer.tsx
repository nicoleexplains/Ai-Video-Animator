import React, { useState } from 'react';
import { DownloadIcon, RefreshIcon, ShareIcon } from './icons';

interface VideoPlayerProps {
  videoUrl: string;
  videoBlob: Blob | null;
  onReset: () => void;
  generationTime: number | null;
  modelUsed: string | null;
  originalImageUrl: string | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, videoBlob, onReset, generationTime, modelUsed, originalImageUrl }) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleShare = async () => {
    if (!videoBlob) return;

    const videoFile = new File([videoBlob], 'animated-video.mp4', { type: videoBlob.type });
    const shareData = {
        files: [videoFile],
        title: 'AI Animated Video',
        text: 'Check out this photo I animated!',
    };

    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.write) {
        // Fallback to Clipboard API
        const clipboardItem = new ClipboardItem({ [videoBlob.type]: videoBlob });
        await navigator.clipboard.write([clipboardItem]);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2500);
      } else {
        // Fallback for very old browsers
        alert("Sharing is not supported on this browser. Please download the video instead.");
      }
    } catch (error) {
      // Don't show error if user cancels the share dialog
      if ((error as DOMException).name !== 'AbortError') {
        console.error('Sharing failed:', error);
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 2500);
      }
    }
  };

  const getShareButtonText = () => {
    switch (shareStatus) {
      case 'copied': return 'Copied!';
      case 'error': return 'Failed';
      default: return 'Share';
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-cyan-300 mb-4">Animation Complete!</h2>
      
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {originalImageUrl && (
            <div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg border-2 border-slate-700 bg-slate-900 flex flex-col items-center justify-center">
                <img src={originalImageUrl} alt="Original image" className="max-w-full max-h-full object-contain" />
                <p className="text-xs text-slate-400 font-semibold absolute bottom-2 bg-black/50 px-2 py-1 rounded">Original</p>
            </div>
        )}
        <div className={`w-full aspect-video rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700 relative ${!originalImageUrl ? 'md:col-span-2' : ''}`}>
          <video src={videoUrl} controls autoPlay loop className="w-full h-full bg-black"></video>
          {originalImageUrl && <p className="text-xs text-slate-400 font-semibold absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded">Animated</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <a
          href={videoUrl}
          download="animated-video.mp4"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors transform hover:scale-105"
        >
          <DownloadIcon className="w-5 h-5" />
          Download
        </a>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-colors transform hover:scale-105 disabled:bg-slate-500"
          disabled={shareStatus !== 'idle'}
        >
          <ShareIcon className="w-5 h-5" />
          {getShareButtonText()}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors"
        >
          <RefreshIcon className="w-5 h-5" />
          Animate Another
        </button>
      </div>

      <div className="mt-8 w-full border-t border-slate-700 pt-4 text-sm text-slate-400">
        {(generationTime || modelUsed) && (
            <div className="space-y-2">
                <h3 className="font-semibold text-slate-300 mb-2">Generation Details</h3>
                {generationTime && (
                    <div className="flex justify-between items-center">
                        <span>Time Taken</span>
                        <span className="font-mono text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
                            ~{(generationTime / 1000).toFixed(1)} seconds
                        </span>
                    </div>
                )}
                {modelUsed && (
                    <div className="flex justify-between items-center">
                        <span>Model</span>
                        <span className="font-mono text-slate-300 bg-slate-700/50 px-2 py-1 rounded">
                            {modelUsed}
                        </span>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};