
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
      throw new Error("Video generation completed, but no download link was found.");
    }

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    return videoBlob;

  } catch (error) {
    console.error("Error in Gemini Service:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to animate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI service.");
  }
};
