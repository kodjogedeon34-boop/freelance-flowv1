
import React from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { BarChart, PiggyBank, BrainCircuit, CheckCircle, Target, Star } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="font-poppins bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-full flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="ml-3 text-2xl font-bold">FreelanceFlow v2</h1>
        </div>
        <div className="flex gap-4">
             <Button onClick={onStart} variant="primary">Accéder à mon espace</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 text-center pt-24 pb-16">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-4">
          La gestion freelance, réinventée. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end">🚀</span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-dark-text-secondary max-w-3xl mx-auto mb-8">
          Budget, objectifs, et IA. Tout ce dont vous avez besoin pour maîtriser vos finances et faire décoller votre activité.
        </p>
        <Button onClick={onStart} className="text-lg px-8 py-4">Commencer gratuitement</Button>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-dark-bg-secondary">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12">Des fonctionnalités conçues pour vous</h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
             <div className="p-6">
              <Target className="w-16 h-16 mx-auto text-accent mb-4"/>
              <h4 className="text-xl font-semibold mb-2">Budget Intelligent</h4>
              <p className="text-gray-600 dark:text-dark-text-tertiary">Définissez vos objectifs financiers et laissez l'app créer un plan d'action personnalisé pour les atteindre.</p>
            </div>
            <div className="p-6">
              <BarChart className="w-16 h-16 mx-auto text-success mb-4"/>
              <h4 className="text-xl font-semibold mb-2">Analytics Simplifiés</h4>
              <p className="text-gray-600 dark:text-dark-text-tertiary">Visualisez vos revenus, vos jours les plus productifs, et recevez des projections pour anticiper.</p>
            </div>
            <div className="p-6">
              <Star className="w-16 h-16 mx-auto text-warning mb-4"/>
              <h4 className="text-xl font-semibold mb-2">Gamification</h4>
              <p className="text-gray-600 dark:text-dark-text-tertiary">Gagnez des XP, débloquez des badges et montez en niveau en gérant sainement vos finances. La productivité devient un jeu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-6">
            <h3 className="text-3xl font-bold text-center mb-12">Des plans pour chaque étape de votre parcours</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                <Card className="flex-1 w-full flex flex-col">
                    <h4 className="text-2xl font-bold mb-2">Starter</h4>
                    <p className="text-dark-text-tertiary mb-4">Pour bien démarrer</p>
                    <p className="text-4xl font-extrabold mb-4">0€<span className="text-lg font-medium text-dark-text-tertiary">/mois</span></p>
                    <ul className="space-y-3 text-gray-600 dark:text-dark-text-secondary flex-grow">
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Dashboard simple</li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Suivi revenus/dépenses</li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Budget Intelligent (1 objectif/mois)</li>
                    </ul>
                    <Button variant="secondary" onClick={onStart} className="w-full mt-6">Commencer</Button>
                </Card>
                <Card className="flex-1 w-full border-2 border-accent shadow-glow-primary relative flex flex-col">
                     <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm text-white bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-full font-semibold">Le plus populaire</div>
                    <h4 className="text-2xl font-bold mb-2">Pro</h4>
                    <p className="text-dark-text-tertiary mb-4">Pour accélérer</p>
                    <p className="text-4xl font-extrabold mb-4">9.99€<span className="text-lg font-medium text-dark-text-tertiary">/mois</span></p>
                     <ul className="space-y-3 text-gray-600 dark:text-dark-text-secondary flex-grow">
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> <strong>Tout du plan Starter, plus :</strong></li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Budget Intelligent illimité</li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Graphiques et analytics avancés</li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Gamification complète (Niveaux & Badges)</li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Notifications intelligentes</li>
                    </ul>
                    <Button onClick={onStart} className="w-full mt-6">Passer Pro</Button>
                </Card>
                <Card className="flex-1 w-full flex flex-col">
                    <h4 className="text-2xl font-bold mb-2">Ultimate</h4>
                    <p className="text-dark-text-tertiary mb-4">Pour dominer</p>
                    <p className="text-4xl font-extrabold mb-4">19.99€<span className="text-lg font-medium text-dark-text-tertiary">/mois</span></p>
                     <ul className="space-y-3 text-gray-600 dark:text-dark-text-secondary flex-grow">
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> <strong>Tout du plan Pro, plus :</strong></li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Projections financières par IA</li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Export PDF & CSV avancés</li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Widgets de dashboard personnalisés</li>
                        <li className="flex items-start"><CheckCircle className="w-5 h-5 text-success mr-2 mt-1 flex-shrink-0"/> Support prioritaire</li>
                    </ul>
                    <Button variant="secondary" onClick={onStart} className="w-full mt-6">Choisir Ultimate</Button>
                </Card>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-bg-secondary py-8">
        <div className="container mx-auto px-6 text-center text-gray-600 dark:text-dark-text-tertiary">
            <p>&copy; {new Date().getFullYear()} FreelanceFlow. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};
