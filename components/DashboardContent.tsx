
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Chatbot } from './Chatbot';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PayPalButton } from './ui/PayPalButton';
import { Loader } from './ui/Loader';
import { CheckCircle, Award, PlusCircle, X, ArrowDownCircle, ArrowUpCircle, Trash2, PieChart, Banknote, BrainCircuit, AlertTriangle, Lightbulb, Pencil, Target, Wallet, ListTodo, UserCircle, Upload, Star, TrendingUp, TrendingDown, Badge, Info, Download, Calendar, Clock, AlertCircle, LogOut, Filter, Mail, BellRing, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { Transaction, TransactionType, Pot, IAAnalysis, Task, TaskStatus, TaskPriority, Profile, Plan, FinancialPlan, User } from '../types';
import { getAIAnalysis } from '../services/geminiService';
import { AuthService } from '../services/authService';
import { jsPDF } from "jspdf";
import { motion } from 'framer-motion';
import { SmartBudgetPage } from './SmartBudgetPage';

const pageVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

// --- NOTIFICATION BANNER ---
interface Notification { type: 'success' | 'error'; message: string; }
const NotificationBanner: React.FC<{ notification: Notification, onDismiss: () => void }> = ({ notification, onDismiss }) => {
    useEffect(() => { const timer = setTimeout(onDismiss, 3000); return () => clearTimeout(timer); }, [onDismiss]);
    const colors = { success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500', error: 'bg-error/10 text-error border-error' };
    return <div className={`fixed top-4 right-4 md:right-8 p-4 border-l-4 rounded-xl shadow-2xl backdrop-blur-xl z-50 ${colors[notification.type]} animate-fade-in-right font-medium`}>{notification.message}</div>
};

// --- SUB-COMPONENTS FOR EACH PAGE ---

const DashboardPage: React.FC<{ transactions: Transaction[], xp: number, financialPlan: FinancialPlan | null, plan: Plan, tasks: Task[] }> = ({ transactions, xp, financialPlan, plan, tasks }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const today = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const monthTxs = transactions.filter(t => new Date(t.date) >= startOfMonth);
        const income = monthTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expenses = monthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        const dailyIncome = monthTxs.filter(t => new Date(t.date).getDate() === today && t.type === TransactionType.INCOME).reduce((s,t) => s + t.amount, 0);
        const dailyExpenses = monthTxs.filter(t => new Date(t.date).getDate() === today && t.type === TransactionType.EXPENSE).reduce((s,t) => s + t.amount, 0);

        const projection = today > 0 ? (income / today) * daysInMonth : 0;
        const tasksDoneToday = tasks.filter(t => (t.status === TaskStatus.DONE || t.status === TaskStatus.PAYMENT_RECEIVED) && new Date(t.dueDate).getDate() === today).length;

        return { income, expenses, net: income - expenses, dailyIncome, dailyExpenses, projection, tasksDoneToday };
    }, [transactions, tasks, plan]);
    
    const calculateLevel = (currentXp: number) => {
        const levels = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert', 'Maître'];
        const xpPerLevel = 200;
        const levelIndex = Math.min(Math.floor(currentXp / xpPerLevel), levels.length - 1);
        return { name: levels[levelIndex], level: levelIndex + 1, progress: (currentXp % xpPerLevel) / xpPerLevel * 100, xpToNext: xpPerLevel - (currentXp % xpPerLevel) };
    };
    const levelInfo = calculateLevel(xp);
    
    const chartData = useMemo(() => {
        const data = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString('fr-FR', { month: 'short' });
            
            const monthlyIncome = transactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return t.type === TransactionType.INCOME && tDate.getFullYear() === d.getFullYear() && tDate.getMonth() === d.getMonth();
                })
                .reduce((sum, t) => sum + t.amount, 0);
                
            data.push({ name: monthName.charAt(0).toUpperCase() + monthName.slice(1), Revenus: monthlyIncome });
        }
        return data;
    }, [transactions]);

    const expenseDonutData = useMemo(() => {
        if (!financialPlan) return [];
        const spent = transactions.filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum, t) => sum + t.amount, 0);
        const remaining = Math.max(0, financialPlan.budgetLimit - spent);
        return [{ name: 'Dépensé', value: spent }, { name: 'Restant', value: remaining }];
    }, [financialPlan, transactions]);
    const DONUT_COLORS = ['#EF4444', '#27272A']; // Red for spent, Dark Zinc for remaining
    
    const formatRelativeDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Aujourd'hui";
        if (diffDays === 1) return "Hier";
        return `Il y a ${diffDays} jours`;
    };

    return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-4 md:p-8 space-y-8">
            <h1 className="text-4xl font-extrabold text-light-text dark:text-dark-text tracking-tight">Tableau de bord</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-light-card to-gray-50 dark:from-dark-card dark:to-dark-bg-secondary"><h4 className="text-sm font-medium text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-2">Revenus (Mois)</h4><p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">{stats.income.toFixed(2)}€</p></Card>
                <Card className="bg-gradient-to-br from-light-card to-gray-50 dark:from-dark-card dark:to-dark-bg-secondary"><h4 className="text-sm font-medium text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-2">Dépenses (Mois)</h4><p className="text-3xl font-bold text-error">{stats.expenses.toFixed(2)}€</p></Card>
                <Card className="bg-gradient-to-br from-light-card to-gray-50 dark:from-dark-card dark:to-dark-bg-secondary"><h4 className="text-sm font-medium text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-2">Solde Net (Mois)</h4><p className={`text-3xl font-bold ${stats.net >= 0 ? 'text-emerald-500' : 'text-error'}`}>{stats.net.toFixed(2)}€</p></Card>
                <Card className="relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative z-10">
                        <h4 className="text-sm font-medium text-accent dark:text-accent-glow uppercase tracking-wider mb-2">Projection</h4>
                        <p className="text-3xl font-bold text-accent dark:text-white">{stats.projection.toFixed(2)}€</p>
                    </div>
                </Card>
            </div>

            {financialPlan && (
                <Card>
                    <h3 className="text-xl font-bold mb-6 text-light-text dark:text-dark-text">Suivi des Objectifs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                         <div className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2 text-sm font-medium text-light-text dark:text-dark-text-secondary"><span>Objectif Revenus</span><span className="text-accent">{stats.income.toFixed(2)}€ / {financialPlan.incomeGoal.toFixed(2)}€</span></div>
                                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-3"><motion.div className="bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end h-3 rounded-full shadow-glow-primary" initial={{width:0}} animate={{width: `${Math.min((stats.income / financialPlan.incomeGoal) * 100, 100)}%`}}/></div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-2 text-sm font-medium text-error"><span>Limite Dépenses</span><span>{stats.expenses.toFixed(2)}€ / {financialPlan.budgetLimit.toFixed(2)}€</span></div>
                                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-3"><motion.div className="bg-error h-3 rounded-full" initial={{width:0}} animate={{width: `${Math.min((stats.expenses / financialPlan.budgetLimit) * 100, 100)}%`}}/></div>
                            </div>
                        </div>
                        <div className="relative h-48 w-48 mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={expenseDonutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} stroke="none">
                                        {expenseDonutData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} /> ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-error">{financialPlan.budgetLimit > 0 ? `${Math.round((stats.expenses / financialPlan.budgetLimit) * 100)}%` : '0%'}</span>
                                <span className="text-xs text-dark-text-tertiary uppercase tracking-widest mt-1">Dépensé</span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
            
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-light-text dark:text-dark-text">Tendances des Revenus</h3>
                    <div className="px-3 py-1 bg-accent/10 rounded-full text-xs font-semibold text-accent">6 derniers mois</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(39, 39, 42, 0.5)" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#121212', border: '1px solid #27272A', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                            labelStyle={{ color: '#F9FAFB', fontWeight: 'bold' }}
                            itemStyle={{ color: '#A78BFA' }}
                            cursor={{ stroke: '#8B5CF6', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="Revenus" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h3 className="text-xl font-bold mb-6 text-light-text dark:text-dark-text">Activité du Jour</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                       <div className="p-5 rounded-2xl bg-gray-50 dark:bg-dark-bg-secondary border border-gray-100 dark:border-dark-border"><TrendingUp className="mx-auto w-8 h-8 text-emerald-500 mb-3"/><p className="text-xs uppercase tracking-wider text-dark-text-tertiary mb-1">Revenus</p><p className="text-2xl font-bold text-light-text dark:text-dark-text">{stats.dailyIncome.toFixed(2)}€</p></div>
                       <div className="p-5 rounded-2xl bg-gray-50 dark:bg-dark-bg-secondary border border-gray-100 dark:border-dark-border"><TrendingDown className="mx-auto w-8 h-8 text-error mb-3"/><p className="text-xs uppercase tracking-wider text-dark-text-tertiary mb-1">Dépenses</p><p className="text-2xl font-bold text-light-text dark:text-dark-text">{stats.dailyExpenses.toFixed(2)}€</p></div>
                       <div className="p-5 rounded-2xl bg-gray-50 dark:bg-dark-bg-secondary border border-gray-100 dark:border-dark-border"><ListTodo className="mx-auto w-8 h-8 text-accent mb-3"/><p className="text-xs uppercase tracking-wider text-dark-text-tertiary mb-1">Tâches</p><p className="text-2xl font-bold text-light-text dark:text-dark-text">{stats.tasksDoneToday}</p></div>
                    </div>
                </Card>
                 <Card className="bg-gradient-to-br from-light-card to-gray-50 dark:from-dark-card dark:to-dark-bg-secondary border-t-4 border-t-accent">
                    <h3 className="text-xl font-bold mb-4 text-light-text dark:text-dark-text">Niveau Freelance</h3>
                    <div className="flex flex-col items-center justify-center py-4">
                         <div className="w-20 h-20 rounded-full bg-dark-bg border-4 border-accent flex items-center justify-center mb-4 shadow-glow-primary">
                             <span className="text-2xl font-bold text-accent">{levelInfo.level}</span>
                         </div>
                         <h4 className="text-lg font-bold text-light-text dark:text-dark-text">{levelInfo.name}</h4>
                         <p className="text-sm text-dark-text-tertiary mb-4">{levelInfo.xpToNext} XP pour le niveau suivant</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2.5 overflow-hidden">
                        <motion.div className="bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${levelInfo.progress}%` }} transition={{ duration: 1 }}/>
                    </div>
                 </Card>
            </div>
            
            <Card>
                <h3 className="text-xl font-bold mb-6 text-light-text dark:text-dark-text">Transactions Récentes</h3>
                {transactions.length > 0 ? (
                    <ul className="space-y-4">
                        {transactions.slice(0, 5).map(t => (
                            <li key={t.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-dark-bg-secondary/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors group border border-transparent dark:border-dark-border/50 hover:border-accent/20">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-500' : 'bg-error/10 text-error'}`}>
                                        {t.type === TransactionType.INCOME ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-light-text dark:text-dark-text">{t.source}</p>
                                        <p className="text-xs text-dark-text-tertiary">{formatRelativeDate(t.date)}</p>
                                    </div>
                                </div>
                                <p className={`font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-error'}`}>
                                    {t.type === TransactionType.INCOME ? '+' : '-'} {t.amount.toFixed(2)}€
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-dark-text-tertiary text-center py-8 bg-gray-50 dark:bg-dark-bg-secondary/30 rounded-2xl">Aucune transaction pour le moment.</p>
                )}
            </Card>

        </motion.div>
    );
};

const TransactionsPage: React.FC<{ 
    transactions: Transaction[], 
    onAddTransaction: (t: Omit<Transaction, 'id'>) => void,
    onUpdateTransaction: (t: Transaction) => void,
    onDeleteTransaction: (id: string) => void
}> = ({ transactions, onAddTransaction, onUpdateTransaction, onDeleteTransaction }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<TransactionType>(TransactionType.INCOME);
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('');
    const [tags, setTags] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const openModal = (type: TransactionType, transaction?: Transaction) => {
        setModalType(type);
        if (transaction) {
            setEditingId(transaction.id);
            setAmount(transaction.amount.toString());
            setSource(transaction.source);
            setTags(transaction.tags ? transaction.tags.join(', ') : '');
            setNotes(transaction.notes || '');
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
        } else {
            setEditingId(null);
            setAmount('');
            setSource('');
            setTags('');
            setNotes('');
            setDate(new Date().toISOString().split('T')[0]);
        }
        setIsModalOpen(true);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(parseFloat(amount) > 0 && source) {
            const txData = {
                type: modalType,
                amount: parseFloat(amount),
                source,
                date: new Date(date || new Date()).toISOString(),
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                notes
            };

            if (editingId) {
                onUpdateTransaction({ ...txData, id: editingId });
            } else {
                onAddTransaction(txData);
            }
            setIsModalOpen(false);
        }
    }

    const confirmDelete = () => {
        if (deletingId) {
            onDeleteTransaction(deletingId);
            setDeletingId(null);
        }
    };

    // Stats calculation for the current month
    const stats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const currentMonthTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth);
        
        const income = currentMonthTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = currentMonthTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);
            
        return {
            income,
            expenses,
            net: income - expenses
        };
    }, [transactions]);

    const exportTransactionsPDF = () => {
        const doc = new jsPDF();
        let y = 20;
        const lineHeight = 10;

        // Title
        doc.setFontSize(20);
        doc.setTextColor(124, 58, 237); 
        doc.text("FreelanceFlow - Historique des Transactions", 105, y, { align: "center" });
        y += 15;

        // Column Headers
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Date", 14, y);
        doc.text("Type", 50, y);
        doc.text("Source", 80, y);
        doc.text("Montant", 150, y);
        doc.text("Tags", 180, y);
        y += 2;
        doc.line(10, y, 200, y); // underline
        y += 8;

        // Rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        transactions.forEach((t) => {
            if (y > 280) { // New page check
                doc.addPage();
                y = 20;
            }
            
            const dateStr = new Date(t.date).toLocaleDateString();
            const typeStr = t.type === TransactionType.INCOME ? "Revenu" : "Dépense";
            const amountStr = `${t.type === TransactionType.INCOME ? '+' : '-'} ${t.amount.toFixed(2)}€`;
            const tagsStr = t.tags ? t.tags.join(', ') : '';

            doc.text(dateStr, 14, y);
            doc.text(typeStr, 50, y);
            doc.text(t.source.substring(0, 25), 80, y); // Truncate source
            doc.text(amountStr, 150, y);
            doc.text(tagsStr.substring(0, 15), 180, y);
            
            y += 8;
        });

        doc.save("FreelanceFlow_Transactions.pdf");
    };

    return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Transactions</h1>
                <div className="flex gap-2 flex-wrap justify-center">
                    <Button variant="ghost" onClick={exportTransactionsPDF} className="mr-2">
                        <Download className="mr-2 w-4 h-4" /> PDF
                    </Button>
                    <Button onClick={() => openModal(TransactionType.INCOME)}>
                        <PlusCircle className="mr-2 w-4 h-4"/> Revenu
                    </Button>
                    <Button onClick={() => openModal(TransactionType.EXPENSE)} variant="secondary">
                        <PlusCircle className="mr-2 w-4 h-4"/> Dépense
                    </Button>
                </div>
            </div>

            {/* Visual Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="flex flex-row items-center justify-between p-6 bg-gradient-to-br from-light-card to-emerald-50 dark:from-dark-card dark:to-emerald-900/10">
                    <div>
                        <p className="text-xs font-bold text-dark-text-tertiary uppercase tracking-wider">Revenus (Mois)</p>
                        <p className="text-2xl font-bold text-emerald-500">+{stats.income.toFixed(2)}€</p>
                    </div>
                    <div className="p-3 bg-emerald-500/20 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                </Card>
                
                <Card className="flex flex-row items-center justify-between p-6 bg-gradient-to-br from-light-card to-red-50 dark:from-dark-card dark:to-red-900/10">
                    <div>
                        <p className="text-xs font-bold text-dark-text-tertiary uppercase tracking-wider">Dépenses (Mois)</p>
                        <p className="text-2xl font-bold text-error">-{stats.expenses.toFixed(2)}€</p>
                    </div>
                    <div className="p-3 bg-error/20 rounded-2xl">
                        <TrendingDown className="w-6 h-6 text-error" />
                    </div>
                </Card>

                <Card className="flex flex-row items-center justify-between p-6 bg-gradient-to-br from-light-card to-violet-50 dark:from-dark-card dark:to-violet-900/10">
                    <div>
                        <p className="text-xs font-bold text-dark-text-tertiary uppercase tracking-wider">Solde Net (Mois)</p>
                        <p className={`text-2xl font-bold ${stats.net >= 0 ? 'text-accent' : 'text-error'}`}>
                            {stats.net >= 0 ? '+' : ''}{stats.net.toFixed(2)}€
                        </p>
                    </div>
                    <div className="p-3 bg-accent/20 rounded-2xl">
                        <Wallet className="w-6 h-6 text-accent" />
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                 <ul className="divide-y divide-gray-100 dark:divide-dark-border">
                    {transactions.map(t => (
                        <li key={t.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={`p-2 rounded-xl ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10' : 'bg-error/10'}`}>
                                     {t.type === TransactionType.INCOME ? <ArrowUpCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" /> : <ArrowDownCircle className="text-error w-5 h-5 flex-shrink-0" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-light-text dark:text-dark-text">{t.source}</p>
                                    <p className="text-xs text-dark-text-tertiary">{new Date(t.date).toLocaleDateString()}</p>
                                    {t.tags && t.tags.length > 0 && <div className="flex gap-1 mt-1">{t.tags.map(tag => <span key={tag} className="text-[10px] bg-gray-100 dark:bg-dark-border px-2 py-0.5 rounded-full text-dark-text-secondary">{tag}</span>)}</div>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between w-full md:w-auto mt-2 md:mt-0 gap-6">
                                <p className={`font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-error'}`}>{t.type === TransactionType.INCOME ? '+' : '-'} {t.amount.toFixed(2)}€</p>
                                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(t.type, t)} className="p-2 text-dark-text-tertiary hover:text-accent rounded-full hover:bg-gray-100 dark:hover:bg-dark-border" title="Modifier">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setDeletingId(t.id)} className="p-2 text-dark-text-tertiary hover:text-error rounded-full hover:bg-gray-100 dark:hover:bg-dark-border" title="Supprimer">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                 </ul>
            </Card>

            {/* Modal de création / édition */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Modifier la transaction' : (modalType === TransactionType.INCOME ? 'Ajouter un revenu' : 'Ajouter une dépense')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="number" placeholder="Montant" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 mt-1 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all" required/>
                    <input type="text" placeholder={modalType === TransactionType.INCOME ? 'Source' : 'Catégorie'} value={source} onChange={e => setSource(e.target.value)} className="w-full p-3 mt-1 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all" required/>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 mt-1 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all" required />
                    <input type="text" placeholder="Tags (séparés par une virgule)" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-3 mt-1 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"/>
                    <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 mt-1 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl h-24 focus:outline-none focus:ring-2 focus:ring-accent transition-all"/>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button type="submit">{editingId ? 'Modifier' : 'Ajouter'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal de suppression */}
             <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Confirmer la suppression">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-dark-text-secondary">Êtes-vous sûr de vouloir supprimer cette transaction ?</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setDeletingId(null)}>Annuler</Button>
                        <Button onClick={confirmDelete} className="bg-error hover:bg-red-600 text-white border-none shadow-lg shadow-error/30">Supprimer</Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

const PotsPage: React.FC<{ pots: Pot[], onAddPot: (pot: Omit<Pot, 'id' | 'balance'>) => void, onDeletePot: (id: string) => void, plan: Plan, setNotification: (n: Notification | null) => void }> = ({ pots, onAddPot, onDeletePot, plan, setNotification }) => {
    const [name, setName] = useState(''); 
    const [percentage, setPercentage] = useState('');
    const [potToDelete, setPotToDelete] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (plan === 'free' && pots.length >= 2) { 
            setNotification({ type: 'error', message: "Passez à Pro pour créer plus de 2 pots." }); 
            return; 
        }
        
        const pct = parseFloat(percentage);
        if (isNaN(pct)) return;

        // Validation: Percentage must be between 1 and 100
        if (pct < 1 || pct > 100) {
            setNotification({ type: 'error', message: "Le pourcentage doit être compris entre 1 et 100." });
            return;
        }

        if (name && pct > 0) { 
            onAddPot({ name, percentage: pct }); 
            setName(''); 
            setPercentage(''); 
            setNotification({ type: 'success', message: "Pot créé avec succès !" });
        }
    };

    const confirmDelete = () => {
        if (potToDelete) {
            onDeletePot(potToDelete);
            setPotToDelete(null);
            setNotification({ type: 'success', message: "Pot supprimé." });
        }
    };

    return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Pots d'épargne</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 h-fit">
                    <h3 className="text-xl font-bold mb-4 text-light-text dark:text-dark-text">Créer un nouveau pot</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ex: Impôts" className="w-full p-3 mt-1 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all" required />
                        <input type="number" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="ex: 20 %" className="w-full p-3 mt-1 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all" required />
                        <Button type="submit" className="w-full mt-2">Créer le pot</Button>
                    </form>
                </Card>
                <Card className="md:col-span-2">
                    <h3 className="text-xl font-bold mb-6 text-light-text dark:text-dark-text">Mes pots actifs</h3>
                    <div className="space-y-4">
                        {pots.length > 0 ? pots.map(pot => (
                            <div key={pot.id} className="p-5 border border-gray-100 dark:border-dark-border rounded-2xl bg-gray-50 dark:bg-dark-bg-secondary/30 flex justify-between items-center hover:border-accent/30 transition-all">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-lg text-light-text dark:text-dark-text">{pot.name}</h4>
                                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-bold">{pot.percentage}%</span>
                                    </div>
                                    <p className="text-xs text-dark-text-tertiary">Accumulé automatiquement sur chaque revenu</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-2xl font-bold text-light-text dark:text-dark-text">{pot.balance.toFixed(2)}€</span>
                                    <button onClick={() => setPotToDelete(pot.id)} className="p-2 text-dark-text-tertiary hover:text-error hover:bg-error/10 rounded-full transition-all">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                             <div className="text-center py-12 text-dark-text-tertiary">
                                <PiggyBank className="w-12 h-12 mx-auto mb-4 opacity-20"/>
                                <p>Aucun pot configuré pour le moment.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!potToDelete} onClose={() => setPotToDelete(null)} title="Confirmer la suppression">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-dark-text-secondary">Êtes-vous sûr de vouloir supprimer ce pot ? Cette action est irréversible.</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setPotToDelete(null)}>Annuler</Button>
                        <Button onClick={confirmDelete} className="bg-error hover:bg-red-600 text-white border-none">Supprimer</Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

const TasksPage: React.FC<{ 
    tasks: Task[], 
    onAddTask: (task: Omit<Task, 'id' | 'status'>) => void, 
    onStatusChange: (id: string, newStatus: TaskStatus) => void,
    onDeleteTask: (id: string) => void
}> = ({ tasks, onAddTask, onStatusChange, onDeleteTask }) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
    const [dueDate, setDueDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
    
    // Filters State
    const [filterStatus, setFilterStatus] = useState<'ALL' | TaskStatus>('ALL');
    const [filterPriority, setFilterPriority] = useState<'ALL' | TaskPriority>('ALL');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && dueDate) {
            onAddTask({ title, priority, dueDate });
            setTitle('');
            setPriority(TaskPriority.MEDIUM);
            setDueDate('');
            setIsModalOpen(false);
        }
    };

    const confirmDelete = () => {
        if (taskToDeleteId) {
            onDeleteTask(taskToDeleteId);
            setTaskToDeleteId(null);
        }
    };

    const getPriorityColor = (p: TaskPriority) => {
        switch(p) {
            case TaskPriority.HIGH: return 'text-error bg-error/10 border-error/20';
            case TaskPriority.MEDIUM: return 'text-warning bg-warning/10 border-warning/20';
            case TaskPriority.LOW: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-gray-500 bg-gray-100';
        }
    };
    
    const getStatusColor = (s: TaskStatus) => {
        switch(s) {
            case TaskStatus.DONE: return 'text-gray-500 bg-gray-100 dark:bg-dark-bg-secondary';
            case TaskStatus.PAYMENT_RECEIVED: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case TaskStatus.INVOICE_SENT: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        }
    }

    const filteredTasks = tasks.filter(task => {
        const matchesStatus = filterStatus === 'ALL' || task.status === filterStatus;
        const matchesPriority = filterPriority === 'ALL' || task.priority === filterPriority;
        return matchesStatus && matchesPriority;
    });

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (a.status === b.status) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.status === TaskStatus.PENDING ? -1 : 1;
    });

    return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-4 md:p-8 space-y-8">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Mes Tâches</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusCircle className="mr-2 w-4 h-4"/> Nouvelle Tâche
                </Button>
            </div>
            
            {/* Filter Toolbar */}
            <Card className="mb-6 p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 text-dark-text-secondary">
                        <Filter size={18} />
                        <span className="font-medium text-sm">Filtrer par :</span>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                         <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value as 'ALL' | TaskStatus)}
                            className="p-2 bg-gray-100 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent flex-1 md:flex-none transition-all"
                        >
                            <option value="ALL">Tous les statuts</option>
                            <option value={TaskStatus.PENDING}>En cours</option>
                            <option value={TaskStatus.INVOICE_SENT}>Facture envoyée</option>
                            <option value={TaskStatus.PAYMENT_RECEIVED}>Paiement reçu</option>
                            <option value={TaskStatus.DONE}>Terminées</option>
                        </select>

                        <select 
                            value={filterPriority} 
                            onChange={(e) => setFilterPriority(e.target.value as 'ALL' | TaskPriority)}
                            className="p-2 bg-gray-100 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent flex-1 md:flex-none transition-all"
                        >
                            <option value="ALL">Toutes priorités</option>
                            <option value={TaskPriority.HIGH}>Haute</option>
                            <option value={TaskPriority.MEDIUM}>Moyenne</option>
                            <option value={TaskPriority.LOW}>Faible</option>
                        </select>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <h3 className="text-xl font-bold mb-6 text-light-text dark:text-dark-text">Liste des tâches</h3>
                    {sortedTasks.length > 0 ? (
                        <div className="space-y-4">
                            {sortedTasks.map(task => (
                                <div key={task.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border transition-all ${task.status === TaskStatus.DONE ? 'bg-gray-50 dark:bg-dark-bg-secondary/30 border-transparent opacity-60' : 'bg-light-card dark:bg-dark-card border-gray-100 dark:border-dark-border hover:border-accent/40 shadow-sm'}`}>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4 md:mb-0 w-full md:w-2/3">
                                        <div className="flex-shrink-0">
                                            {task.status === TaskStatus.INVOICE_SENT ? (
                                                 <Mail className="w-6 h-6 text-blue-500" />
                                            ) : task.status === TaskStatus.PAYMENT_RECEIVED ? (
                                                 <CheckCircle className="w-6 h-6 text-emerald-500" />
                                            ) : task.status === TaskStatus.DONE ? (
                                                <CheckCircle className="w-6 h-6 text-gray-400" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-dark-text-tertiary"></div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                 <p className={`font-semibold text-lg text-light-text dark:text-dark-text ${task.status === TaskStatus.DONE ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                                                 {task.reminderSet && (
                                                     <div className="flex items-center text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                                         <BellRing size={10} className="mr-1" /> Rappel
                                                     </div>
                                                 )}
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded-md border font-medium ${getPriorityColor(task.priority)}`}>
                                                    {task.priority === TaskPriority.HIGH ? 'Haute' : task.priority === TaskPriority.MEDIUM ? 'Moyenne' : 'Faible'}
                                                </span>
                                                <span className="flex items-center text-xs text-dark-text-tertiary">
                                                    <Calendar size={12} className="mr-1" /> {new Date(task.dueDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-end w-full md:w-1/3 gap-3">
                                        <select 
                                            value={task.status}
                                            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                                            className={`text-sm rounded-xl border-none focus:ring-2 focus:ring-accent p-2.5 cursor-pointer font-medium ${getStatusColor(task.status)}`}
                                        >
                                            <option value={TaskStatus.PENDING}>En cours</option>
                                            <option value={TaskStatus.INVOICE_SENT}>Facture envoyée</option>
                                            <option value={TaskStatus.PAYMENT_RECEIVED}>Paiement reçu</option>
                                            <option value={TaskStatus.DONE}>Terminé</option>
                                        </select>

                                        <button onClick={() => setTaskToDeleteId(task.id)} className="text-dark-text-tertiary hover:text-error hover:bg-error/10 p-2.5 rounded-full transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-dark-text-tertiary">
                            <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                            <p>Aucune tâche ne correspond à vos filtres.</p>
                        </div>
                    )}
                </Card>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter une tâche">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-dark-text-secondary">Titre</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full p-3 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all" 
                            placeholder="Ex: Facturer Client X"
                            required 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark-text-secondary">Priorité</label>
                            <select 
                                value={priority} 
                                onChange={e => setPriority(e.target.value as TaskPriority)} 
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                            >
                                <option value={TaskPriority.LOW}>Faible</option>
                                <option value={TaskPriority.MEDIUM}>Moyenne</option>
                                <option value={TaskPriority.HIGH}>Haute</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-dark-text-secondary">Date d'échéance</label>
                            <input 
                                type="date" 
                                value={dueDate} 
                                onChange={e => setDueDate(e.target.value)} 
                                className="w-full p-3 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all" 
                                required 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button type="submit">Ajouter</Button>
                    </div>
                </form>
            </Modal>
            
            {/* Delete Task Confirmation Modal */}
            <Modal isOpen={!!taskToDeleteId} onClose={() => setTaskToDeleteId(null)} title="Confirmer la suppression">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-dark-text-secondary">Êtes-vous sûr de vouloir supprimer cette tâche ?</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setTaskToDeleteId(null)}>Annuler</Button>
                        <Button onClick={confirmDelete} className="bg-error hover:bg-red-600 text-white border-none">Supprimer</Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

const IncomeSmootherPage: React.FC<{ analysis: IAAnalysis | null, onAnalyze: () => void, isAnalyzing: boolean }> = ({ analysis, onAnalyze, isAnalyzing }) => {
    return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-light-text dark:text-dark-text">Lisseur de Revenus</h1>
            
            <Card className="bg-gradient-to-br from-light-card to-violet-50 dark:from-dark-card dark:to-violet-900/10 border-accent/20">
                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="p-6 bg-accent/10 rounded-full shadow-glow-primary">
                        <BrainCircuit className="w-16 h-16 text-accent" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">Laissez notre IA analyser vos finances</h2>
                        <p className="text-gray-600 dark:text-dark-text-secondary max-w-xl">
                            Obtenez des informations personnalisées pour stabiliser vos revenus. Nous analyserons vos transactions pour vous donner des recommandations concrètes.
                        </p>
                        <Button onClick={onAnalyze} disabled={isAnalyzing} className="mt-6 px-8 py-4 text-lg shadow-glow-primary">
                            {isAnalyzing ? "Analyse en cours..." : "Lancer l'analyse IA"}
                        </Button>
                    </div>
                </div>
            </Card>

            {isAnalyzing && (
                <div className="flex justify-center p-12">
                    <Loader text="L'IA analyse vos données..." />
                </div>
            )}

            {analysis && (
                <div className="space-y-8 animate-fade-in">
                    {/* Prominent Warning Banner for Deficit */}
                    {analysis.predicted_deficit && (
                        <div className="p-6 bg-red-50 dark:bg-error/10 border border-error/20 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="p-3 bg-error/20 rounded-full flex-shrink-0">
                                <AlertTriangle className="w-8 h-8 text-error" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-error">Attention : Risque de déficit détecté</h3>
                                <p className="text-gray-700 dark:text-dark-text-secondary">
                                    L'analyse prédictive suggère que vos dépenses pourraient dépasser vos revenus ce mois-ci si la tendance se poursuit. 
                                    Consultez les actions recommandées ci-dessous pour rectifier le tir.
                                </p>
                            </div>
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">Résultats de l'analyse</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="flex flex-col justify-center">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-light-text dark:text-dark-text">
                                <Target className="text-emerald-500" />Objectif de revenus
                            </h3>
                            <p className="text-5xl font-extrabold text-light-text dark:text-dark-text">
                                {analysis.baseline.toFixed(2)}€
                                <span className="text-lg font-medium text-dark-text-tertiary ml-2">/mois</span>
                            </p>
                            <p className="text-sm text-dark-text-tertiary mt-4">
                                Montant recommandé pour couvrir vos charges fixes et variables tout en épargnant.
                            </p>
                        </Card>
                        
                        <Card className="flex flex-col justify-center">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-light-text dark:text-dark-text">
                                <Wallet className="text-accent" />Fonds de roulement
                            </h3>
                            <p className="text-5xl font-extrabold text-light-text dark:text-dark-text">{analysis.buffer.toFixed(2)}€</p>
                             <p className="text-sm text-dark-text-tertiary mt-4">
                                Trésorerie à conserver sur votre compte principal pour absorber les délais de paiement.
                            </p>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Allocation Rules */}
                        <Card className="lg:col-span-1 h-fit">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-light-text dark:text-dark-text">
                                <PieChart className="text-accent" />Allocation Suggérée
                            </h3>
                            <ul className="space-y-6">
                                {analysis.allocation_rules.map((rule, idx) => (
                                    <li key={idx} className="flex flex-col">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-light-text dark:text-dark-text-secondary">{rule.name}</span>
                                            <span className="font-bold text-accent">{rule.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-dark-border rounded-full h-2">
                                            <div 
                                                className="bg-accent h-2 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                                                style={{ width: `${Math.min(rule.percentage, 100)}%` }}
                                            ></div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>

                        {/* Detailed Recommended Actions */}
                        <Card className="lg:col-span-2">
                            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-light-text dark:text-dark-text">
                                <Lightbulb className="text-amber-500" />Plan d'action personnalisé
                            </h3>
                            <div className="space-y-6">
                                {analysis.recommended_actions.map((action, index) => (
                                    <div key={index} className="flex gap-5 p-5 rounded-2xl bg-gray-50 dark:bg-dark-bg-secondary/30 border border-gray-100 dark:border-dark-border hover:border-accent/30 transition-all">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-gradient-start to-primary-gradient-end flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="space-y-3 flex-1">
                                            <h4 className="font-bold text-xl text-light-text dark:text-dark-text">
                                                {action.title}
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-dark-border/50">
                                                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Pourquoi</p>
                                                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary leading-relaxed">{action.why}</p>
                                                </div>
                                                <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-dark-border/50">
                                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Comment</p>
                                                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary leading-relaxed">{action.how}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const ProfilePage: React.FC<{ profile: Profile; onUpdateProfile: (p: Profile) => void; xp: number, user: User, onLogoutRequest: () => void }> = ({ profile, onUpdateProfile, xp, user, onLogoutRequest }) => {
     return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8 text-light-text dark:text-dark-text">Mon Profil</h1>
            <Card className="mb-8">
                <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <label htmlFor="photo-upload" className="cursor-pointer">
                            {profile.photo || user.avatar ? <img src={profile.photo || user.avatar || ''} alt="Profile" className="w-40 h-40 rounded-full object-cover border-4 border-light-bg dark:border-dark-bg shadow-2xl" /> : <UserCircle className="w-40 h-40 text-gray-300 dark:text-dark-text-tertiary" />}
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload size={24} className="text-white" />
                            </div>
                        </label>
                        <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) { const reader = new FileReader(); reader.onload = (event) => onUpdateProfile({ ...profile, photo: event.target?.result as string }); reader.readAsDataURL(e.target.files[0]); }}}/>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text mb-1">{profile.name}</h2>
                        <p className="text-dark-text-tertiary text-lg mb-4">{user.email}</p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                             <span className="px-3 py-1 rounded-full bg-accent/10 text-accent font-semibold text-sm">Freelance</span>
                             {profile.age && <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-dark-border text-dark-text-secondary font-semibold text-sm">{profile.age} ans</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-8 text-sm border-t border-gray-100 dark:border-dark-border pt-6 max-w-md mx-auto md:mx-0">
                            <div>
                                <p className="text-dark-text-tertiary uppercase tracking-wider text-xs mb-1">Objectif Mensuel</p>
                                <p className="font-bold text-xl">{profile.monthlyGoal?.toFixed(2) ?? 'N/A'}€</p>
                            </div>
                            <div>
                                <p className="text-dark-text-tertiary uppercase tracking-wider text-xs mb-1">XP Total</p>
                                <p className="font-bold text-xl text-accent">{xp} XP</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
            <Card className="mb-8">
                <h3 className="text-xl font-bold mb-6 text-light-text dark:text-dark-text">Mes Badges</h3>
                <div className="flex flex-wrap gap-4">
                    {profile.badges.length > 0 ? profile.badges.map(badge => (
                        <div key={badge} className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-dark-bg-secondary rounded-2xl border border-gray-100 dark:border-dark-border w-32">
                            <div className="p-3 bg-amber-500/10 rounded-full mb-3">
                                <Badge className="w-8 h-8 text-amber-500"/>
                            </div>
                            <span className="text-xs font-bold text-light-text dark:text-dark-text">{badge}</span>
                        </div>
                    )) : <p className="text-dark-text-tertiary italic">Gagnez des badges en atteignant vos objectifs !</p>}
                </div>
            </Card>
            
            <Card className="border border-error/20 bg-error/5">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-error">Déconnexion</h3>
                        <p className="text-sm text-dark-text-tertiary">Vous serez déconnecté de votre session actuelle sur cet appareil.</p>
                    </div>
                    <Button variant="secondary" onClick={onLogoutRequest} className="border-error/20 text-error hover:bg-error hover:text-white w-full md:w-auto">
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
};

const PricingPage: React.FC<{ plan: Plan, onUpgrade: (newPlan: Plan) => void }> = ({ plan, onUpgrade }) => {
    return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-4 md:p-8"><h2 className="text-4xl font-extrabold text-center mb-12 text-light-text dark:text-dark-text tracking-tight">Des plans conçus pour votre succès</h2><div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            <Card className="flex flex-col border border-gray-200 dark:border-dark-border"><h4 className="text-2xl font-bold mb-2">Starter</h4><p className="text-5xl font-extrabold mb-6">0€</p><ul className="space-y-4 text-dark-text-secondary mb-8 flex-grow"><li className="flex items-center"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3"/>Dashboard simple</li><li className="flex items-center"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3"/>Suivi revenus/dépenses</li><li className="flex items-center"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3"/>Budget Intelligent (1/mois)</li></ul><Button variant="secondary" disabled={plan === 'free'} className="w-full mt-auto py-4 rounded-xl">Votre plan actuel</Button></Card>
            <Card className="flex flex-col border-2 border-accent relative scale-105 shadow-2xl z-10 bg-light-card dark:bg-dark-card"><div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-6 py-2 text-sm text-white bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end rounded-full font-bold shadow-glow-primary">Recommandé</div><h4 className="text-2xl font-bold mb-2 text-accent">Pro</h4><p className="text-5xl font-extrabold mb-6">9.99€<span className="text-lg font-medium text-dark-text-tertiary ml-2">/mois</span></p><ul className="space-y-4 text-dark-text-secondary mb-8 flex-grow"><li className="flex items-center"><CheckCircle className="w-5 h-5 text-accent mr-3"/><strong>Tout du plan Starter, plus :</strong></li><li className="flex items-center"><CheckCircle className="w-5 h-5 text-accent mr-3"/>Budget Intelligent illimité</li><li className="flex items-center"><CheckCircle className="w-5 h-5 text-accent mr-3"/>Analytics productivité</li><li className="flex items-center"><CheckCircle className="w-5 h-5 text-accent mr-3"/>Gamification complète</li></ul><Button onClick={() => onUpgrade('pro')} disabled={plan !== 'free'} className="w-full mt-auto py-4 rounded-xl text-lg shadow-glow-primary">{plan === 'pro' ? 'Votre plan actuel' : 'Passer Pro'}</Button></Card>
            <Card className="flex flex-col border border-gray-200 dark:border-dark-border"><h4 className="text-2xl font-bold mb-2">Ultimate</h4><p className="text-5xl font-extrabold mb-6">19.99€<span className="text-lg font-medium text-dark-text-tertiary ml-2">/mois</span></p><ul className="space-y-4 text-dark-text-secondary mb-8 flex-grow"><li className="flex items-center"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3"/><strong>Tout du plan Pro, plus :</strong></li><li className="flex items-center"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3"/>Projections financières IA</li><li className="flex items-center"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3"/>Export de données</li><li className="flex items-center"><CheckCircle className="w-5 h-5 text-emerald-500 mr-3"/>Support prioritaire</li></ul><Button variant="secondary" onClick={() => onUpgrade('ultimate')} disabled={plan === 'ultimate'} className="w-full mt-auto py-4 rounded-xl">{plan === 'ultimate' ? 'Votre plan actuel' : 'Passer Ultimate'}</Button></Card>
        </div></motion.div>
    );
};

// --- MAIN CONTENT COMPONENT ---
interface DashboardContentProps { page: string; user: User; onLogout: () => void; }

export const DashboardContent: React.FC<DashboardContentProps> = ({ page, user, onLogout }) => {
  // Initialize state from persistent storage based on user ID
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pots, setPots] = useState<Pot[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: user.name, age: null, monthlyGoal: 0, photo: user.avatar || null, badges: [] });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [xp, setXp] = useState(0);
  const [plan, setPlan] = useState<Plan>('free');
  const [financialPlan, setFinancialPlan] = useState<FinancialPlan | null>(null);
  
  const [notification, setNotification] = useState<Notification | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean, targetPlan: Plan | null, price: string }>({ isOpen: false, targetPlan: null, price: '0' });
  const [aiAnalysis, setAiAnalysis] = useState<IAAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  // Load Data Effect
  useEffect(() => {
    if (user) {
        AuthService.initializeDataIfNeeded();
        const data = AuthService.loadUserData(user.id);
        setTransactions(data.transactions);
        setPots(data.pots);
        setProfile(data.profile);
        setPlan(data.plan);
        setXp(data.xp);
        setTasks(data.tasks);
        setFinancialPlan(data.financialPlan);
    }
  }, [user.id]);

  // Save Data Effect - Triggered whenever meaningful data changes
  useEffect(() => {
      if (user) {
          AuthService.saveUserData(user.id, {
              transactions,
              pots,
              profile,
              plan,
              xp,
              tasks,
              financialPlan
          });
      }
  }, [transactions, pots, profile, plan, xp, tasks, financialPlan, user.id]);

  const balance = useMemo(() => {
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const totalInPots = pots.reduce((sum, p) => sum + p.balance, 0);
    return income - expenses - totalInPots;
  }, [transactions, pots]);

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const transactionWithId = { ...newTransaction, id: crypto.randomUUID() };
    setTransactions(prev => [transactionWithId, ...prev]);
    if (newTransaction.type === TransactionType.INCOME) {
        setXp(prevXp => prevXp + Math.round(newTransaction.amount / 20)); // Gamification
        setPots(currentPots => currentPots.map(pot => ({ ...pot, balance: pot.balance + newTransaction.amount * (pot.percentage / 100) })));
        setNotification({ type: 'success', message: 'Revenu ajouté !' });
    } else { setNotification({ type: 'success', message: 'Dépense ajoutée !' }); }
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    setNotification({ type: 'success', message: 'Transaction modifiée.' });
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setNotification({ type: 'success', message: 'Transaction supprimée.' });
  };

  const handleAddPot = (newPot: Omit<Pot, 'id' | 'balance'>) => { setPots(prev => [...prev, { ...newPot, id: crypto.randomUUID(), balance: 0 }]); };
  const handleDeletePot = (id: string) => { setPots(currentPots => currentPots.filter(p => p.id !== id)); };
  
  // Task Handlers
  const handleAddTask = (newTask: Omit<Task, 'id' | 'status'>) => {
      setTasks(prev => [...prev, { ...newTask, id: crypto.randomUUID(), status: TaskStatus.PENDING }]);
      setNotification({ type: 'success', message: 'Tâche ajoutée !' });
  };

  const handleTaskStatusChange = (id: string, newStatus: TaskStatus) => {
      setTasks(prev => prev.map(t => {
          if (t.id === id) {
             let updatedTask = { ...t, status: newStatus };
             
             // Handle "Invoice Sent" -> Set Reminder logic
             if (newStatus === TaskStatus.INVOICE_SENT) {
                 const dueDate = new Date(t.dueDate);
                 const reminderDate = new Date(dueDate);
                 reminderDate.setDate(dueDate.getDate() - 7);
                 
                 // In a real app, this would schedule a notification via backend or local notification API.
                 // Here we just mark it visually and notify user.
                 updatedTask = { ...updatedTask, reminderSet: true };
                 
                 const today = new Date();
                 const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                 
                 setNotification({ 
                     type: 'success', 
                     message: `Facture envoyée. Rappel de paiement configuré pour le ${reminderDate.toLocaleDateString()}.` 
                 });
             } 
             // Handle "Payment Received"
             else if (newStatus === TaskStatus.PAYMENT_RECEIVED) {
                 if (t.status !== TaskStatus.PAYMENT_RECEIVED) {
                     setNotification({ type: 'success', message: 'Paiement reçu ! Félicitations !' });
                     // Could optionally prompt to add income here, but kept simple for now
                 }
                 updatedTask = { ...updatedTask, reminderSet: false }; // Clear reminder if paid
             }
             // Handle "Done"
             else if (newStatus === TaskStatus.DONE && t.status !== TaskStatus.DONE) {
                  setXp(x => x + 10);
                  setNotification({ type: 'success', message: 'Tâche terminée (+10 XP) !' });
             }

             return updatedTask;
          }
          return t;
      }));
  };

  const handleDeleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
      setNotification({ type: 'success', message: 'Tâche supprimée.' });
  };

  const handleUpgrade = (targetPlan: Plan) => {
    const prices = { pro: '9.99', ultimate: '19.99' };
    setUpgradeModal({ isOpen: true, targetPlan, price: prices[targetPlan as keyof typeof prices] || '0' });
  }

  const handleUpgradeSuccess = useCallback(() => {
    if (upgradeModal.targetPlan) {
        setPlan(upgradeModal.targetPlan);
        setUpgradeModal({ isOpen: false, targetPlan: null, price: '0' });
        setNotification({ type: 'success', message: `Félicitations ! Vous êtes maintenant un membre ${upgradeModal.targetPlan.charAt(0).toUpperCase() + upgradeModal.targetPlan.slice(1)}.` });
    }
  }, [upgradeModal.targetPlan, setPlan]);

  const handleUpgradeError = useCallback(() => {
    setNotification({ type: 'error', message: 'Le paiement a échoué.' });
  }, []);

  const runAIAnalysis = async () => {
    setIsAnalyzing(true); setAiAnalysis(null);
    try { setAiAnalysis(await getAIAnalysis(transactions, pots, balance)); } 
    catch (error) { setNotification({ type: 'error', message: 'L\'analyse IA a échoué.' }); } 
    finally { setIsAnalyzing(false); }
  }

  const confirmLogout = () => {
      setLogoutModal(false);
      onLogout();
  }

  const renderContent = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage transactions={transactions} xp={xp} financialPlan={financialPlan} plan={plan} tasks={tasks} />;
      case 'transactions': return <TransactionsPage transactions={transactions} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />;
      case 'pots': return <PotsPage pots={pots} onAddPot={handleAddPot} onDeletePot={handleDeletePot} plan={plan} setNotification={setNotification} />;
      case 'smartBudget': return <SmartBudgetPage plan={plan} transactions={transactions} financialPlan={financialPlan} setFinancialPlan={setFinancialPlan} setNotification={setNotification} />;
      case 'tasks': return <TasksPage tasks={tasks} onAddTask={handleAddTask} onStatusChange={handleTaskStatusChange} onDeleteTask={handleDeleteTask} />;
      case 'incomeSmoother': return <IncomeSmootherPage analysis={aiAnalysis} onAnalyze={runAIAnalysis} isAnalyzing={isAnalyzing} />;
      case 'chatbot': return <Chatbot />;
      case 'pricing': return <PricingPage plan={plan} onUpgrade={handleUpgrade} />;
      case 'profile': return <ProfilePage profile={profile} onUpdateProfile={setProfile} xp={xp} user={user} onLogoutRequest={() => setLogoutModal(true)} />;
      default: return <DashboardPage transactions={transactions} xp={xp} financialPlan={financialPlan} plan={plan} tasks={tasks} />;
    }
  };

  return (
    <div className="relative h-full">
        <div className="absolute top-4 right-4 z-40">
             <button onClick={() => setLogoutModal(true)} className="p-2 text-dark-text-tertiary hover:text-error transition-colors" title="Déconnexion">
                <LogOut className="w-5 h-5" />
             </button>
        </div>

        {notification && <NotificationBanner notification={notification} onDismiss={() => setNotification(null)} />}
        {renderContent()}
        <Modal isOpen={upgradeModal.isOpen} onClose={() => setUpgradeModal({isOpen: false, targetPlan: null, price: '0'})} title={`Passer au plan ${upgradeModal.targetPlan}`}>
            <p className="mb-4 text-gray-600 dark:text-dark-text-secondary">Pour finaliser votre abonnement de {upgradeModal.price}€/mois, veuillez procéder au paiement sécurisé via PayPal.</p>
            {upgradeModal.targetPlan && upgradeModal.price !== '0' && (
                <PayPalButton 
                    onSuccess={handleUpgradeSuccess} 
                    onError={handleUpgradeError}
                    amount={upgradeModal.price}
                    description={`Abonnement FreelanceFlow ${upgradeModal.targetPlan}`}
                />
            )}
        </Modal>
        <Modal isOpen={logoutModal} onClose={() => setLogoutModal(false)} title="Confirmation">
            <div className="space-y-4">
                <p className="text-gray-600 dark:text-dark-text-secondary">Êtes-vous sûr de vouloir vous déconnecter ?</p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setLogoutModal(false)}>Annuler</Button>
                    <Button onClick={confirmLogout} className="bg-error hover:bg-red-600 text-white border-none">Déconnexion</Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};
