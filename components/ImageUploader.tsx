
import React, { useRef } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onAnimate: () => void;
  isAnimating: boolean;
  imagePreviewUrl: string | null;
  hasImage: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  onAnimate,
  isAnimating,
  imagePreviewUrl,
  hasImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      {!imagePreviewUrl ? (
        <div 
          className="w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors cursor-pointer"
          onClick={handleUploadClick}
        >
          <UploadIcon className="w-12 h-12 mb-2" />
          <p className="font-semibold">Click to upload an image</p>
          <p className="text-sm">PNG, JPG, WEBP, etc.</p>
        </div>
      ) : (
        <div className="w-full mb-4">
          <img
            src={imagePreviewUrl}
            alt="Image preview"
            className="max-h-80 w-auto mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {hasImage && (
         <button
            onClick={onAnimate}
            disabled={isAnimating}
            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:bg-slate-500 disabled:cursor-not-allowed transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-500"
        >
            {isAnimating ? 'Animating...' : 'Animate Photo'}
        </button>
      )}

      {hasImage && !isAnimating && (
        <button 
          onClick={handleUploadClick} 
          className="mt-3 text-sm text-slate-400 hover:text-brand-300 transition-colors">
            Choose a different photo
        </button>
      )}
    </div>
  );
};
