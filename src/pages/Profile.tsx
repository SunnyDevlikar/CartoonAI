import React, { useEffect, useState } from 'react';
import { ImageIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string;
  created_at: string;
}

interface ImageModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
}

function ImageModal({ image, onClose }: ImageModalProps) {
  if (!image) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-gray-800 rounded-lg overflow-hidden w-full max-w-3xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-gray-300 z-10 bg-gray-800 rounded-full p-1"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          <div className="p-4">
            <div className="relative aspect-square w-full flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden">
              <img
                src={image.image_url}
                alt={image.prompt}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: 'calc(100vh - 16rem)' }}
              />
            </div>
          </div>
          <div className="p-4 bg-gray-800">
            <p className="text-lg text-white">{image.prompt}</p>
            <p className="text-sm text-gray-400 mt-2">
              Created on {new Date(image.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const { user } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    async function loadImages() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading images:', error);
        return;
      }

      setImages(data || []);
      setLoading(false);
    }

    loadImages();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-400 mb-4">
          Please sign in to view your gallery
        </h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-400 mb-4">Your Gallery</h1>
        <p className="text-gray-400">View all your generated cartoon masterpieces</p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="bg-gray-800 rounded-lg overflow-hidden shadow-xl cursor-pointer transform transition-transform hover:scale-[1.02]"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.image_url}
                alt={image.prompt}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-400">{image.prompt}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Created on {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400">No images yet</h3>
          <p className="text-gray-500 mt-2">Start generating some cartoon images!</p>
        </div>
      )}

      <ImageModal 
        image={selectedImage} 
        onClose={() => setSelectedImage(null)} 
      />
    </div>
  );
}

export default Profile;