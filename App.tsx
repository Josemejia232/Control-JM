
import { Wallet, Loader2, RefreshCw, CloudUpload, CloudOff, Cloud, Settings, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { FixedExpenses } from './components/FixedExpenses.tsx';
import { PaymentRegister } from './components/PaymentRegister.tsx';
import { ProgressGoals } from './components/ProgressGoals.tsx';
import { IncomeManager } from './components/IncomeManager.tsx';
import { AIAdvisor } from './components/AIAdvisor.tsx';
import { FinancialStrategy } from './components/FinancialStrategy.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ConfigModal } from './components/ConfigModal.tsx';
import { Expense, Payment, Goal, Income, Tab, BankAccount, User } from './types.ts';
import { db } from './services/db.ts';
import { supabaseService } from './services/supabaseService.ts';

const DEFAULT_USER: User = {
  id: 'master-user-id',
  username: 'admin',
  name: 'Administrador JM',
  role: 'admin'
};

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [selectedYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'offline' | 'error'>('offline');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const currentUser = DEFAULT_USER;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const refreshData = async () => {
    try {
        const [loadedExpenses, loadedPayments, loadedGoals, loadedIncomes, loadedBankAccounts] = await Promise.all([
          db.getAll<Expense>('expenses'),
          db.getAll<Payment>('payments'),
          db.getAll<Goal>('goals'),
          db.getAll<Income>('incomes'),
          db.getAll<BankAccount>('bankAccounts')
        ]);
        const uid = currentUser.id;
        setExpenses(loadedExpenses.filter(e => e.userId === uid));
        setPayments(loadedPayments.filter(p => p.userId === uid));
        setGoals(loadedGoals.filter(g => g.userId === uid));
        setIncomes(loadedIncomes.filter(i => i.userId === uid));
        setBankAccounts(loadedBankAccounts.filter(b => b.userId === uid));
    } catch (e) {
      console.error("Error al refrescar datos locales:", e);
    }
  };

  const handleManualSync = async () => {
    if (isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      const success = await db.manualSync(currentUser.id);
      if (success) {
        await refreshData();
        setCloudStatus('connected');
      } else {
        setCloudStatus('error');
      }
    } catch (e: any) {
      setCloudStatus('error');
    } finally {
      setIsManualSyncing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshData();
      if (supabaseService.isConfigured()) {
        const success = await db.syncFromCloud(currentUser.id);
        if (success) {
          await refreshData();
          setCloudStatus('connected');
        } else {
          setCloudStatus('error');
        }
      }
      setIsLoading(false);
    };
    init();

    let unsubscribe: (() => void) | undefined;
    if (supabaseService.isConfigured()) {
      unsubscribe = supabaseService.subscribeToChanges(currentUser.id, async () => {
        setIsLive(true);
        await db.syncFromCloud(currentUser.id);
        await refreshData();
        setTimeout(() => setIsLive(false), 2000);
      });
    }

    return () => unsubscribe?.();
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (store: any, item: any) => {
    const itemWithUser = { ...item, userId: currentUser.id };
    await db.save(store, itemWithUser);
    await refreshData();
  };

  const handleDelete = async (store: any, id: string) => {
    await db.delete(store, id);
    await refreshData();
  };

  const renderContent = () => {
    const yearExpenses = expenses.filter(e => e.year === selectedYear);
    
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Iniciando Control JM...</p>
      </div>
    );
    
    switch (activeTab) {
      case Tab.DASHBOARD: return <Dashboard expenses={yearExpenses} payments={payments} goals={goals} incomes={incomes} selectedYear={selectedYear} />;
      case Tab.INCOME: return <IncomeManager userId={currentUser.id} incomes={incomes} expenses={yearExpenses} payments={payments} goals={goals} bankAccounts={bankAccounts} onAddIncome={(i) => handleSave('incomes', i)} onUpdateIncome={(i) => handleSave('incomes', i)} onDeleteIncome={(id) => handleDelete('incomes', id)} />;
      case Tab.EXPENSES: return <FixedExpenses userId={currentUser.id} expenses={yearExpenses} payments={payments} selectedYear={selectedYear} onAddExpense={(e) => handleSave('expenses', e)} onUpdateExpense={(e) => handleSave('expenses', e)} onDeleteExpense={(id) => handleDelete('expenses', id)} onCopyPreviousYear={() => {}} />;
      case Tab.PAYMENTS: return <PaymentRegister userId={currentUser.id} expenses={yearExpenses} payments={payments} goals={goals} bankAccounts={bankAccounts} onAddPayment={(p) => handleSave('payments', p)} onUpdatePayment={(p) => handleSave('payments', p)} onDeletePayment={(id) => handleDelete('payments', id)} onUpdateGoal={(g) => handleSave('goals', g)} onUpdateBankAccount={(a) => handleSave('bankAccounts', a)} selectedYear={selectedYear} />;
      case Tab.PROGRESS: return (<><AIAdvisor expenses={yearExpenses} payments={payments} goals={goals} /><ProgressGoals userId={currentUser.id} expenses={yearExpenses} payments={payments} goals={goals} incomes={incomes} bankAccounts={bankAccounts} selectedYear={selectedYear} onAddGoal={(g) => handleSave('goals', g)} onUpdateGoal={(g) => handleSave('goals', g)} onDeleteGoal={(id) => handleDelete('goals', id)} onAddBankAccount={(a) => handleSave('bankAccounts', a)} onUpdateBankAccount={(a) => handleSave('bankAccounts', a)} onDeleteBankAccount={(id) => handleDelete('bankAccounts', id)} /></>);
      case Tab.STRATEGY: return <FinancialStrategy expenses={yearExpenses} incomes={incomes} payments={payments} onUpdateExpense={(e) => handleSave('expenses', e)} onDeleteExpense={(id) => handleDelete('expenses', id)} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg"><Wallet className="h-6 w-6 text-white" /></div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-none">CONTROL JM</h1>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">Sincronización {cloudStatus}</p>
            </div>
          </div>

          <nav className="flex-1 max-w-2xl mx-4 overflow-x-auto custom-scrollbar flex gap-1 no-scrollbar">
            {Object.values(Tab).map(t => (
              <button 
                key={t} 
                onClick={() => handleTabChange(t)} 
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {!supabaseService.isConfigured() ? (
               <button onClick={() => setIsConfigOpen(true)} className="flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-rose-100">
                  <AlertCircle className="w-3.5 h-3.5" /> Configurar Nube
               </button>
            ) : (
              <div className="flex items-center gap-2">
                 <div className={`p-1.5 rounded-lg flex items-center gap-2 ${cloudStatus === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {cloudStatus === 'connected' ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                 </div>
                 
                 <button 
                     onClick={handleManualSync} 
                     disabled={isManualSyncing} 
                     className={`p-2.5 rounded-xl transition-all border ${isManualSyncing ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-slate-100'}`}
                 >
                   <CloudUpload className={`w-5 h-5 ${isManualSyncing ? 'animate-bounce' : ''}`} />
                 </button>
              </div>
            )}

            <button 
                onClick={() => setIsConfigOpen(true)} 
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-fade-in">
        {renderContent()}
      </main>

      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onSave={() => {
          setCloudStatus('connected');
          refreshData();
          handleManualSync();
        }} 
      />

      {isLive && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-bounce">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Cambios detectados en la nube</span>
        </div>
      )}
    </div>
  );
}

export default App;
