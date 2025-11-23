

import { GoogleGenAI } from "@google/genai";

// Ensure API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const MODEL_GENERATION = 'gemini-2.5-flash-image';
const MODEL_ANALYSIS = 'gemini-3-pro-preview';
const MODEL_TEXT = 'gemini-2.5-flash';
const MODEL_VIDEO = 'veo-3.1-fast-generate-preview';

/**
 * Generates a creative, random historical or futuristic era prompt.
 */
export const suggestRandomEra = async (): Promise<{ name: string; description: string; promptSuffix: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: "Generate a creative, highly detailed, and visually distinct scenario for a time travel selfie. It can be a famous historical event, a specific era in history, or a futuristic sci-fi setting. Return ONLY a JSON object with keys: 'name' (short title), 'description' (short location/year), and 'promptSuffix' (detailed visual description of the scene including action, expression, lighting, and film style). Do not use markdown formatting."
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Random era generation failed:", error);
    // Fallback
    return {
      name: "The Unknown",
      description: "Time Vortex",
      promptSuffix: "floating in a swirling vortex of clocks and starlight, looking amazed at the fabric of space-time. Expression: Awe and wonder. Surreal digital art style."
    };
  }
};

/**
 * Generates a historical version of the user based on the selected era.
 */
export const generateTimeTravelImage = async (
  base64Image: string,
  eraPrompt: string
): Promise<string> => {
  try {
    // Strip header if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    const response = await ai.models.generateContent({
      model: MODEL_GENERATION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Task: Create a hyper-realistic photograph placing the person visible in this image into the following scene: ${eraPrompt}.

            CRITICAL INPUT CONTEXT:
            - The input image may be a CROP of a larger photo. Focus on the primary subject visible in the crop.
            - If there are other people partially visible in the input crop, ignore them; focus on the main face.

            CRITICAL INSTRUCTIONS FOR REALISM & BLENDING:
            1. **Dynamic Expression Adaptation**: The subject's facial expression MUST change to match the emotion of the scene (e.g., screaming, laughing, serious, scared). Do NOT retain the static expression from the original selfie if it doesn't fit the context.
            2. **Social Interaction**: The subject must be interacting with the environment or other people in the scene (looking at them, touching them, talking to them), not just pasted on top of a background.
            3. **Photographic Integration**: DO NOT simply paste the face. You must RE-RENDER the face to match the film grain, lighting direction, shadow hardness, and color grading of the specific historical era. The skin texture must look like it was photographed on the film stock of that time.
            4. **Identity Preservation**: While adapting the expression and lighting, you MUST preserve the core facial features (bone structure, eye shape, nose, mouth) so the person is undeniable recognizable as the source.
            5. **No "Cut-and-Paste" Look**: Ensure the neck and jawline blend perfectly with the period clothing. No sharp edges or mismatched lighting.
            
            Output: A single, high-quality, photorealistic image.`
          }
        ]
      }
    });

    // Extract image from response
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Time travel generation failed:", error);
    throw error;
  }
};

/**
 * Generates a video based on the generated image and prompt using Veo.
 */
export const generateTimeTravelVideo = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    // Create a NEW instance to ensure we pick up the latest API Key if user just selected it via the UI
    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    let operation = await veoAi.models.generateVideos({
      model: MODEL_VIDEO,
      prompt: `Cinematic motion: ${prompt}. The character comes to life with subtle natural movements, breathing, looking around, and interacting with the environment. High quality, smooth motion.`,
      image: {
        imageBytes: cleanBase64,
        mimeType: 'image/jpeg', 
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16' // Portrait to match typical selfie/result format
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await veoAi.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation completed but no URI returned.");

    // Fetch the video content using the key to get a playable blob
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};

/**
 * Edits the current image based on a text prompt (e.g., "Add a retro filter").
 */
export const editImageWithPrompt = async (
  base64Image: string,
  instruction: string
): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: MODEL_GENERATION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `Edit this image: ${instruction}. Maintain the historical realism and the person's identity. Ensure the changes blend naturally into the scene.`
          }
        ]
      }
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No edited image generated.");
  } catch (error) {
    console.error("Image editing failed:", error);
    throw error;
  }
};

/**
 * Analyzes the image using Gemini 3 Pro.
 */
export const analyzeImageContent = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: MODEL_ANALYSIS,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Analyze this historical recreation. Identify the era, the historical accuracy of the clothing and setting, and describe the interactions taking place. Rate the realism."
          }
        ]
      }
    });

    return response.text || "Analysis could not be generated.";
  } catch (error) {
    console.error("Image analysis failed:", error);
    throw error;
  }
};