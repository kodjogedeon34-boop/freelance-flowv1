
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, PiggyBank, Briefcase, Plane, Landmark, Wallet, Info, Download } from 'lucide-react';
import { FinancialPlan, Plan, Transaction, TransactionType } from '../types';
import { jsPDF } from "jspdf";

interface SmartBudgetPageProps {
  plan: Plan;
  transactions: Transaction[];
  financialPlan: FinancialPlan | null;
  setFinancialPlan: (plan: FinancialPlan | null) => void;
  setNotification: (n: { type: 'success' | 'error'; message: string } | null) => void;
}

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export const SmartBudgetPage: React.FC<SmartBudgetPageProps> = ({ plan, transactions, financialPlan, setFinancialPlan, setNotification }) => {
  const [formData, setFormData] = useState({
    incomeGoal: '5000',
    expenseGoal: '2000',
    savingsGoal: '1000',
    investmentGoal: '500',
    leisureGoal: '300',
    budgetLimit: '2500'
  });
  
  const currentMonthIncome = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter(t => t.type === TransactionType.INCOME && new Date(t.date) >= startOfMonth)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCalculatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan === 'free' && financialPlan) {
        setNotification({ type: 'error', message: "Le plan gratuit ne permet qu'un seul objectif par mois. Passez Pro pour en créer plus."});
        return;
    }

    const { incomeGoal, expenseGoal, savingsGoal, investmentGoal, leisureGoal, budgetLimit } = formData;
    const num = (str: string) => parseFloat(str) || 0;

    const totalOutgoings = num(savingsGoal) + num(investmentGoal) + num(leisureGoal) + num(expenseGoal);
    const isRealistic = num(incomeGoal) >= totalOutgoings;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const discretionarySpending = num(incomeGoal) - (num(expenseGoal) + num(savingsGoal) + num(investmentGoal));

    const newPlan: FinancialPlan = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      incomeGoal: num(incomeGoal),
      currentIncome: currentMonthIncome,
      expenseGoal: num(expenseGoal),
      savingsGoal: num(savingsGoal),
      investmentGoal: num(investmentGoal),
      leisureGoal: num(leisureGoal),
      budgetLimit: num(budgetLimit),
      weeklySpendingLimit: num(budgetLimit) / 4.33,
      weeklySavingsTarget: num(savingsGoal) / 4.33,
      dailySavingsTarget: num(savingsGoal) / daysInMonth,
      weeklyInvestmentTarget: num(investmentGoal) / 4.33,
      minDailyIncome: num(incomeGoal) / daysInMonth,
      remainingCash: num(incomeGoal) - totalOutgoings,
      discretionarySpending,
      isRealistic,
    };
    
    setFinancialPlan(newPlan);
    setNotification({ type: 'success', message: "Votre plan financier a été calculé !"});
  };
  
  const handleExportPDF = () => {
    if (!financialPlan) return;

    const doc = new jsPDF();
    const lineHeight = 10;
    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(88, 166, 255); // Primary color
    doc.text("FreelanceFlow - Plan Financier", 105, y, { align: "center" });
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date de création: ${new Date(financialPlan.createdAt).toLocaleDateString()}`, 20, y);
    y += 15;

    // Goals Section
    doc.setFontSize(16);
    doc.text("1. Vos Objectifs", 20, y);
    y += 10;
    doc.setFontSize(12);
    
    const goals = [
        `Revenu souhaité: ${financialPlan.incomeGoal}€`,
        `Dépenses prévues: ${financialPlan.expenseGoal}€`,
        `Objectif d'épargne: ${financialPlan.savingsGoal}€`,
        `Objectif d'investissement: ${financialPlan.investmentGoal}€`,
        `Budget loisirs: ${financialPlan.leisureGoal}€`,
        `Limite de dépenses: ${financialPlan.budgetLimit}€`
    ];

    goals.forEach(goal => {
        doc.text(`- ${goal}`, 30, y);
        y += lineHeight;
    });
    y += 5;

    // Results Section
    doc.setFontSize(16);
    doc.text("2. Analyse & Cibles", 20, y);
    y += 10;
    doc.setFontSize(12);

    const results = [
        `Revenu quotidien minimum requis: ${financialPlan.minDailyIncome.toFixed(2)}€`,
        `Limite de dépenses hebdomadaire: ${financialPlan.weeklySpendingLimit.toFixed(2)}€`,
        `Objectif d'épargne quotidien: ${financialPlan.dailySavingsTarget.toFixed(2)}€`,
        `Cible d'investissement hebdo: ${financialPlan.weeklyInvestmentTarget.toFixed(2)}€`,
        `Trésorerie restante estimée: ${financialPlan.remainingCash.toFixed(2)}€`,
        `Plan réaliste: ${financialPlan.isRealistic ? "Oui" : "Non (Attention)"}`
    ];

    results.forEach(res => {
        doc.text(`- ${res}`, 30, y);
        y += lineHeight;
    });

    doc.save("FreelanceFlow_Plan_Budgetaire.pdf");
    setNotification({ type: 'success', message: "PDF téléchargé avec succès." });
  };

  const chartData = useMemo(() => {
    if (!financialPlan) return [];
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const data = [];

    let cumulativeExpenses = 0;
    let cumulativeSavings = 0; // This should be based on actual savings, for now target
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    for (let i = 1; i <= daysInMonth; i++) {
        const dailyExpenses = transactions
            .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= startOfMonth && new Date(t.date).getDate() === i)
            .reduce((sum, t) => sum + t.amount, 0);

        cumulativeExpenses += dailyExpenses;
        cumulativeSavings += financialPlan.dailySavingsTarget; 

        data.push({
            name: `Jour ${i}`,
            'Dépenses réelles': cumulativeExpenses,
            'Dépenses prévues': (financialPlan.budgetLimit / daysInMonth) * i,
            'Objectif épargne': cumulativeSavings,
        });
    }
    return data;
  }, [financialPlan, transactions]);


  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Objectifs & Budget</h1>
        {financialPlan && (
            <Button onClick={handleExportPDF} variant="secondary" className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Exporter en PDF
            </Button>
        )}
      </div>
      
      <Card>
        <h2 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Définissez vos objectifs mensuels</h2>
        <form onSubmit={handleCalculatePlan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries({
            incomeGoal: 'Revenu souhaité', expenseGoal: 'Dépenses prévues', savingsGoal: 'Objectif d\'épargne',
            investmentGoal: 'Objectif d\'investissement', leisureGoal: 'Budget loisirs', budgetLimit: 'Limite de dépenses'
          }).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-dark-text-secondary">{label}</label>
              <div className="relative mt-1"><span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-dark-text-tertiary">€</span><input type="number" id={key} name={key} value={formData[key as keyof typeof formData]} onChange={handleChange} className="w-full p-2 pl-7 bg-gray-100 dark:bg-dark-bg-secondary rounded-lg border border-gray-300 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-accent" placeholder="0" required /></div>
            </div>
          ))}
          <div className="md:col-span-2 lg:col-span-3 flex justify-end items-center">
            <Button type="submit" className="w-full md:w-auto" disabled={plan === 'free' && !!financialPlan}>
              {plan === 'free' && financialPlan ? "Passez Pro pour un nouveau plan" : "Calculer mon plan financier"}
            </Button>
          </div>
        </form>
      </Card>
      
      {financialPlan ? (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
          {!financialPlan.isRealistic && (
              <Card className="dark:bg-error/20 border-l-4 border-error">
                  <div className="flex items-center gap-4"><AlertTriangle className="w-10 h-10 text-error flex-shrink-0"/><div><h3 className="font-bold text-lg">Objectif irréaliste détecté</h3><p className="text-error/90">Vos revenus souhaités sont inférieurs à la somme de vos objectifs de dépenses et d'épargne. Veuillez ajuster vos chiffres.</p></div></div>
              </Card>
          )}

          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Votre plan financier personnalisé</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="flex flex-col items-center justify-center text-center"><TrendingUp className="w-8 h-8 text-success mb-2"/><h4 className="text-sm font-medium text-dark-text-tertiary">Revenu quotidien minimum</h4><p className="text-2xl font-bold">{financialPlan.minDailyIncome.toFixed(2)}€</p></Card>
            <Card className="flex flex-col items-center justify-center text-center"><Wallet className="w-8 h-8 text-error mb-2"/><h4 className="text-sm font-medium text-dark-text-tertiary">Dépenses max / semaine</h4><p className="text-2xl font-bold">{financialPlan.weeklySpendingLimit.toFixed(2)}€</p></Card>
            <Card className="flex flex-col items-center justify-center text-center"><PiggyBank className="w-8 h-8 text-accent mb-2"/><h4 className="text-sm font-medium text-dark-text-tertiary">Épargne / jour</h4><p className="text-2xl font-bold">{financialPlan.dailySavingsTarget.toFixed(2)}€</p></Card>
            <Card className="flex flex-col items-center justify-center text-center"><Briefcase className="w-8 h-8 text-accent mb-2"/><h4 className="text-sm font-medium text-dark-text-tertiary">Investissement / semaine</h4><p className="text-2xl font-bold">{financialPlan.weeklyInvestmentTarget.toFixed(2)}€</p></Card>
            <Card className="flex flex-col items-center justify-center text-center"><Plane className="w-8 h-8 text-accent mb-2"/><h4 className="text-sm font-medium text-dark-text-tertiary">Dépenses Discrétionnaires</h4><p className="text-2xl font-bold">{financialPlan.discretionarySpending.toFixed(2)}€</p></Card>
            <Card className="flex flex-col items-center justify-center text-center"><Landmark className="w-8 h-8 text-warning mb-2"/><h4 className="text-sm font-medium text-dark-text-tertiary">Flux de trésorerie net</h4><p className="text-2xl font-bold">{financialPlan.remainingCash.toFixed(2)}€</p></Card>
          </div>

          <Card>
            <h3 className="text-xl font-semibold mb-4 text-light-text dark:text-dark-text">Progression mensuelle</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(48, 54, 61, 0.5)" />
                    <XAxis dataKey="name" stroke={'#8B949E'} fontSize={10} interval={4} tick={{ dy: 5 }}/>
                    <YAxis stroke={'#8B949E'} fontSize={12} tickFormatter={(value) => `${value}€`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1C2128', border: '1px solid #30363D', borderRadius: '0.75rem' }} labelStyle={{ color: '#E6EDF3' }} />
                    <Legend wrapperStyle={{color: '#C9D1D9'}}/>
                    <Line type="monotone" dataKey="Dépenses réelles" stroke="#F85149" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Dépenses prévues" stroke="#F0B72F" strokeDasharray="5 5" dot={false}/>
                    <Line type="monotone" dataKey="Objectif épargne" stroke="#58A6FF" strokeWidth={2} dot={false}/>
                </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      ) : (
         <Card><p className="text-center text-dark-text-tertiary">Remplissez le formulaire ci-dessus pour générer votre plan financier et visualiser vos progrès.</p></Card>
      )}

      {plan === 'free' && (
        <Card className="mt-8 dark:bg-accent/20 dark:border-accent">
          <div className="flex items-center gap-4"><Info className="w-8 h-8 text-accent flex-shrink-0"/><div><h3 className="font-bold">Passez au niveau supérieur avec le plan Pro</h3><p className="text-sm text-accent">Débloquez des objectifs illimités, des graphiques avancés et des analyses de productivité pour vraiment optimiser vos finances.</p></div></div>
        </Card>
      )}
    </motion.div>
  );
};
