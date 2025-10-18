import { GoogleGenAI } from "@google/genai";
import { fileToBase64, getImageDimensions } from "../utils/fileUtils";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const POLLING_INTERVAL_MS = 10000;
// Average expected duration for the animation process in milliseconds (e.g., 2 minutes)
const EXPECTED_ANIMATION_DURATION_MS = 120000;


export const animateImage = async (
  imageFile: File,
  onProgress: (progress: number) => void
): Promise<Blob> => {
  try {
    const startTime = Date.now();
    // Create a new GoogleGenAI instance for each API call to ensure the latest API key is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    onProgress(5); // Initial progress

    const [base64Image, dimensions] = await Promise.all([
      fileToBase64(imageFile),
      getImageDimensions(imageFile)
    ]);

    const aspectRatio = dimensions.width > dimensions.height ? '16:9' : '9:16';

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

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      
      // Simulate progress based on elapsed time
      const elapsedTime = Date.now() - startTime;
      // Progresses from 5% to 95% over the expected duration.
      const simulatedProgress = Math.min(95, 5 + (90 * (elapsedTime / EXPECTED_ANIMATION_DURATION_MS)));
      onProgress(simulatedProgress);
    }

    onProgress(100);

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation succeeded, but no download link was returned.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed with status ${response.status}: ${errorText}`);
    }

    const videoBlob = await response.blob();
    return videoBlob;

  } catch (error) {
    console.error("Error in Gemini Service:", error);

    let userFriendlyMessage = "An unexpected error occurred during the animation process. Please try again.";

    if (error instanceof Error) {
        const originalMessage = error.message;
        let effectiveMessage = originalMessage;

        // Try to parse Google API error from JSON string
        if (originalMessage.trim().startsWith('{')) {
            try {
                const parsedJson = JSON.parse(originalMessage);
                // The actual error object might be nested under an 'error' key, or it might be the root object.
                const errorData = parsedJson.error || parsedJson;
                
                if (errorData && errorData.message) {
                    // Combine status and message for better matching
                    effectiveMessage = `${errorData.message} ${errorData.status || ''}`;
                }
            } catch (e) {
                // Not a valid JSON, proceed with original message
            }
        }
        
        const lowerCaseMessage = effectiveMessage.toLowerCase();

        // Fix: Let App.tsx handle this specific API key error by re-throwing it.
        if (lowerCaseMessage.includes("requested entity was not found")) {
            throw error;
        }

        // Check for file-related issues from utils
        if (lowerCaseMessage.includes('failed to read file') || lowerCaseMessage.includes('could not read image file')) {
            userFriendlyMessage = "The uploaded file appears to be corrupted or is in an unsupported format. Please try a different image.";
        }
        // Google API specific errors
        else if (lowerCaseMessage.includes('api key not valid')) {
            userFriendlyMessage = "Authentication with the AI service failed. This is a configuration issue.";
        } else if (lowerCaseMessage.includes('rate limit') || lowerCaseMessage.includes('resource_exhausted') || lowerCaseMessage.includes('quota')) {
            userFriendlyMessage = "You have exceeded your API quota. Please check your plan and billing details, or try again later.";
        } else if (lowerCaseMessage.includes('deadline exceeded') || lowerCaseMessage.includes('503 service unavailable')) {
            userFriendlyMessage = "The request timed out as the service is temporarily unavailable. Please try again later.";
        }
        // Custom app errors
        else if (originalMessage.startsWith('Download failed with status')) {
            userFriendlyMessage = "Failed to retrieve the final video, which may be due to a network issue. Please check your connection and try again.";
        }
        else if (lowerCaseMessage.includes('no download link was returned')) {
            userFriendlyMessage = "The AI was unable to create an animation from this specific image. Please try a different one.";
        }
         // A more generic but still informative fallback
        else {
             userFriendlyMessage = `A technical issue occurred: ${originalMessage}`;
        }
    }

    throw new Error(userFriendlyMessage);
  }
};