import React, { useState } from 'react';
import { HfInference } from '@huggingface/inference';
import { Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Initialize HF client with proper error handling
let hf: HfInference;
try {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('Hugging Face API key is not configured');
  }
  hf = new HfInference(apiKey);
} catch (error) {
  console.error('Failed to initialize Hugging Face client:', error);
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function Home() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const saveImage = async (imageUrl: string, prompt: string) => {
    if (!user) {
      toast.error('Please sign in to save images');
      return;
    }

    const { error } = await supabase
      .from('images')
      .insert([
        {
          user_id: user.id,
          image_url: imageUrl,
          prompt: prompt,
        },
      ]);

    if (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image');
      return;
    }

    toast.success('Image saved to your gallery!');
  };

  const generateImage = async (retryCount = 0) => {
    if (!user) {
      toast.error('Please sign in to generate images');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!hf) {
      toast.error('API client is not properly initialized');
      return;
    }

    setLoading(true);
    try {
      const enhancedPrompt = `${prompt}, high quality, detailed, cartoon style, digital art, vibrant colors, sharp focus, clean lines, professional illustration`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            negative_prompt: 'blurry, bad quality, noise, grain, distorted, deformed, disfigured, poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting, out of frame, duplicate, morbid, mutilated, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, bad anatomy, gross proportions, text, error, missing fingers, missing arms, missing legs, extra digits, fewer digits',
            num_inference_steps: 50,
            guidance_scale: 9.0,
            height: 768,
            width: 768,
            seed: Math.floor(Math.random() * 2147483647),
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || await response.text();
        
        // Check for CUDA out of memory error
        if (typeof errorData === 'object' && 
            errorData.error && 
            errorData.warnings && 
            errorData.warnings.some((w: string) => w.includes('CUDA out of memory'))) {
          
          if (retryCount < MAX_RETRIES) {
            await delay(RETRY_DELAY);
            return generateImage(retryCount + 1);
          }
        }

        // Handle rate limiting
        if (response.status === 429) {
          if (retryCount < MAX_RETRIES) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
            await delay(retryAfter * 1000);
            return generateImage(retryCount + 1);
          }
        }
        
        throw new Error(`API request failed: ${JSON.stringify(errorData)}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        setGeneratedImage(base64data);
        await saveImage(base64data, prompt);
        toast.success('Image generated successfully!');
      };
      
      reader.onerror = () => {
        throw new Error('Failed to process the generated image');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error generating image:', error);
      
      // Handle network errors and retries
      if (error instanceof Error) {
        if (
          (error.name === 'AbortError' || error.message.includes('Failed to fetch')) &&
          retryCount < MAX_RETRIES
        ) {
          await delay(RETRY_DELAY);
          return generateImage(retryCount + 1);
        }
      }

      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate image. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && user) {
      generateImage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-400 mb-4">Create Your Cartoon</h1>
        <p className="text-gray-400">Transform your ideas into unique cartoon artwork using AI</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <div className="flex gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your cartoon scene..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => generateImage()}
            disabled={loading || !user}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
          >
            <Wand2 className="w-5 h-5" />
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {!user && (
          <p className="mt-4 text-sm text-gray-400 text-center">
            Please sign in to generate and save images
          </p>
        )}
      </div>

      {generatedImage && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <img
            src={generatedImage}
            alt="Generated cartoon"
            className="w-full h-auto rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

export default Home;