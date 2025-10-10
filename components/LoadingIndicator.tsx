
import React from 'react';

interface LoadingIndicatorProps {
  message: string;
  imagePreviewUrl: string | null;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message, imagePreviewUrl }) => {
  return (
    <div className="flex flex-col items-center text-center">
      {imagePreviewUrl && (
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-6">
          <img
            src={imagePreviewUrl}
            alt="Animating this image"
            className="w-full h-full object-cover rounded-lg shadow-lg opacity-30"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <svg
              className="animate-spin h-12 w-12 text-brand-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      )}
     
      <h2 className="text-xl font-semibold text-white mb-2">Creating your animation...</h2>
      <p className="text-slate-400">{message}</p>
    </div>
  );
};
