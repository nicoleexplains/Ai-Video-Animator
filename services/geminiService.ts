
import { GoogleGenAI } from "@google/genai";
import { fileToBase64, getImageDimensions } from "../utils/fileUtils";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const POLLING_INTERVAL_MS = 10000;

export const animateImage = async (
  imageFile: File,
  onProgress: (message: string) => void
): Promise<Blob> => {
  try {
    onProgress("Analyzing image properties...");

    const [base64Image, dimensions] = await Promise.all([
      fileToBase64(imageFile),
      getImageDimensions(imageFile)
    ]);

    const aspectRatio = dimensions.width > dimensions.height ? '16:9' : '9:16';

    onProgress("Starting video generation...");

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: 'Animate this image with subtle, cinematic motion, bringing it to life.',
      image: {
        imageBytes: base64Image,
        mimeType: imageFile.type,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });

    onProgress("Processing request... this may take a few minutes.");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      onProgress("Checking animation status...");
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onProgress("Finalizing your video...");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation succeeded, but no download link was returned.");
    }
    
    onProgress("Downloading your video...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    return videoBlob;

  } catch (error) {
    console.error("Error in Gemini Service:", error);

    let userFriendlyMessage = "An unexpected error occurred during the animation process. Please try again.";

    if (error instanceof Error) {
        const msg = error.message.toLowerCase();

        // Check for file-related issues from utils
        if (msg.includes('failed to read file') || msg.includes('could not read image file')) {
            userFriendlyMessage = "The uploaded file appears to be corrupted or is in an unsupported format. Please try a different image.";
        }
        // Google API specific errors
        else if (msg.includes('api key not valid')) {
            userFriendlyMessage = "Authentication with the AI service failed. This is a configuration issue.";
        } else if (msg.includes('rate limit') || msg.includes('resource has been exhausted')) {
            userFriendlyMessage = "The animation service is currently experiencing high demand. Please wait a moment and try again.";
        } else if (msg.includes('deadline exceeded') || msg.includes('503 service unavailable')) {
            userFriendlyMessage = "The request timed out as the service is temporarily unavailable. Please try again later.";
        }
        // Custom app errors
        else if (msg.startsWith('download failed with status')) {
            userFriendlyMessage = "Failed to retrieve the final video, which may be due to a network issue. Please check your connection and try again.";
        }
        else if (msg.includes('no download link was returned')) {
            userFriendlyMessage = "The AI was unable to create an animation from this specific image. Please try a different one.";
        }
         // A more generic but still informative fallback
        else {
             userFriendlyMessage = `A technical issue occurred: ${error.message}`;
        }
    }

    throw new Error(userFriendlyMessage);
  }
};
