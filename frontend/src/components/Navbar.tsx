import React from 'react';
import { Home, Info, HelpCircle } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-black/50 backdrop-blur-md border-b border-red-900/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <a href="/" className="flex items-center space-x-2">
              <Home className="w-6 h-6 text-red-500" />
              <span className="text-white font-semibold">Home</span>
            </a>
            <a href="#how-it-works" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <HelpCircle className="w-5 h-5" />
              <span>How It Works</span>
            </a>
            <a href="#about" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <Info className="w-5 h-5" />
              <span>About</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar