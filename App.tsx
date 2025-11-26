
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardContent } from './components/DashboardContent';
import { AuthService } from './services/authService';
import { User } from './types';
import { Menu, BrainCircuit } from 'lucide-react';

type View = 'landing' | 'dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(AuthService.getDefaultUser());
  const [currentView, setCurrentView] = useState<View>('landing');
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark'); 
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleStart = () => {
    // Check if guest session needs to be created, or if user is already logged in
    const sessionUser = AuthService.getSession();
    if (sessionUser) {
        setCurrentUser(sessionUser);
        setCurrentView('dashboard');
    } else {
        // If no session, perform guest login
        AuthService.guestLogin().then(user => {
            setCurrentUser(user);
            setCurrentView('dashboard');
        });
    }
  };

  const handleLogout = () => {
      AuthService.logout();
      setCurrentView('landing');
      // Reset to default user just in case, though landing page handles re-login
      setCurrentUser(AuthService.getDefaultUser());
      setActivePage('dashboard');
  };

  // Check session on mount
  useEffect(() => {
      const sessionUser = AuthService.getSession();
      if (sessionUser) {
          setCurrentUser(sessionUser);
          setCurrentView('dashboard');
      }
  }, []);

  if (currentView === 'landing') {
    return (
      <LandingPage 
        onStart={handleStart}
      />
    );
  }

  return (
    <div className="flex h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-light-card dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-4 shadow-sm">
         <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-full flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 font-bold text-lg">FreelanceFlow v2</span>
         </div>
         <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-dark-text-secondary"
         >
            <Menu className="w-6 h-6" />
         </button>
      </div>

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      {/* 
          md:ml-64 -> pushes content to right on desktop to accommodate fixed sidebar
          ml-0 -> full width on mobile
          pt-16 -> adds padding top on mobile for the fixed header
          md:pt-0 -> removes padding top on desktop
      */}
      <main className="flex-1 overflow-y-auto transition-all duration-300 md:ml-64 ml-0 pt-16 md:pt-0 w-full">
        <DashboardContent page={activePage} user={currentUser} onLogout={handleLogout} />
      </main>
    </div>
  );
};

export default App;
