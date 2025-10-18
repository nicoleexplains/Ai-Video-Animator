
import React, { useState } from 'react';
import { DownloadIcon, RefreshIcon, ShareIcon } from './icons';

interface VideoPlayerProps {
  videoUrl: string;
  videoBlob: Blob | null;
  onReset: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, videoBlob, onReset }) => {
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
      <div className="w-full aspect-video rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700">
        <video src={videoUrl} controls autoPlay loop className="w-full h-full bg-black"></video>
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
    </div>
  );
};
