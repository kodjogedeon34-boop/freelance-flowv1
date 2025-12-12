
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardContent } from './components/DashboardContent';
import { AuthService } from './services/authService';
import { User } from './types';
import { Menu, BrainCircuit } from 'lucide-react';

type View = 'landing' | 'dashboard' | 'login' | 'register';

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

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
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
        onLogin={() => setCurrentView('login')}
        onRegister={() => setCurrentView('register')}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage 
        onLoginSuccess={handleAuthSuccess}
        onNavigateToRegister={() => setCurrentView('register')}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <RegisterPage 
        onRegisterSuccess={handleAuthSuccess}
        onNavigateToLogin={() => setCurrentView('login')}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text font-sans overflow-hidden">
      
      {/* Mobile Header - Fixed at top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-light-card dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-4 shadow-sm transition-colors duration-300">
         <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-full flex items-center justify-center shadow-glow-primary">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 font-bold text-lg tracking-tight">FreelanceFlow</span>
         </div>
         <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-dark-text-secondary transition-colors"
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
          CRITICAL FIX: 
          md:ml-72 matches the Sidebar width (w-72). 
          Previously it was ml-64, causing a 2rem overlap/shift.
      */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 md:ml-72 ml-0 pt-16 md:pt-0 h-full w-full relative">
        <div className="max-w-7xl mx-auto min-h-full">
            <DashboardContent page={activePage} user={currentUser} onLogout={handleLogout} />
        </div>
      </main>
    </div>
  );
};

export default App;
