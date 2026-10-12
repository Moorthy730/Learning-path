import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation, Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Navigation className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-black text-indigo-600 dark:text-indigo-400 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Page not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Looks like this path doesn't exist. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)} id="notfound-back">Go Back</Button>
          <Button leftIcon={<Home className="w-4 h-4" />} onClick={() => navigate('/')} id="notfound-home">Go Home</Button>
        </div>
      </div>
    </div>
  );
}
