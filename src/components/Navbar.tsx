import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Palette, User, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import toast from 'react-hot-toast';

function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Generate', icon: Palette },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <>
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Palette className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold">Cartoon AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-4">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={clsx(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium',
                      location.pathname === path
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
              
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}

export default Navbar;