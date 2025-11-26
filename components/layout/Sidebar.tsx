
import React from 'react';
import { BarChart2, DollarSign, ArrowRightLeft, PiggyBank, MessageSquare, User, Sun, Moon, BrainCircuit, Target, ListTodo, X } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{ icon: React.ElementType; label: string; isActive: boolean; onClick: () => void; }> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-primary-gradient-start/20 to-primary-gradient-end/20 text-accent dark:text-dark-text'
        : 'text-gray-500 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-card'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isDarkMode, toggleDarkMode, isOpen, onClose }) => {
  const navItems = [
    { id: 'dashboard', icon: BarChart2, label: 'Accueil' },
    { id: 'transactions', icon: ArrowRightLeft, label: 'Transactions' },
    { id: 'pots', icon: PiggyBank, label: 'Pots' },
    { id: 'smartBudget', icon: Target, label: 'Objectifs & Budget' },
    { id: 'tasks', icon: ListTodo, label: 'Tâches' },
    { id: 'incomeSmoother', icon: BrainCircuit, label: 'Lisseur de Revenus' },
    { id: 'chatbot', icon: MessageSquare, label: 'Assistant Chat' },
    { id: 'pricing', icon: DollarSign, label: 'Abonnement' },
    { id: 'profile', icon: User, label: 'Mon Profil' },
  ];

  const handleNavClick = (pageId: string) => {
    setActivePage(pageId);
    onClose(); // Close sidebar on mobile when a link is clicked
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 h-screen bg-light-card dark:bg-dark-bg-secondary flex flex-col p-4 border-r border-gray-200 dark:border-dark-border transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-full flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="ml-3 text-xl font-bold text-light-text dark:text-dark-text">FreelanceFlow</h1>
          </div>
          {/* Close Button for Mobile */}
          <button onClick={onClose} className="md:hidden text-gray-500 dark:text-dark-text-tertiary">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-grow space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activePage === item.id}
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={toggleDarkMode}
            className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-500 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-card"
          >
            {isDarkMode ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
            <span>{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
