
import React from 'react';
import { DownloadIcon, RefreshIcon } from './icons';

interface VideoPlayerProps {
  videoUrl: string;
  onReset: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, onReset }) => {
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
