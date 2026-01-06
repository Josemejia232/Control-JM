
import { Target, TrendingUp, PlusCircle, Coins, Table2, CheckCircle, ChevronDown, ChevronRight, Wallet, CalendarRange, Clock, Landmark, Trash2, Save, History, Pencil, X, ArrowUpCircle, Check, Zap, ListFilter, ArrowRight, TrendingDown, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { Expense, Payment, Goal, Income, CATEGORIES, WEEKS, formatCurrency, GoalTransaction, BankAccount } from '../types';

interface ProgressGoalsProps {
  userId: string;
  expenses: Expense[];
  payments: Payment[];
  goals: Goal[];
  incomes: Income[];
  bankAccounts: BankAccount[];
  selectedYear: number;
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onAddBankAccount: (account: BankAccount) => void;
  onUpdateBankAccount: (account: BankAccount) => void;
  onDeleteBankAccount: (id: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const ProgressGoals: React.FC<ProgressGoalsProps> = ({ 
  userId,
  expenses, 
  payments, 
  goals, 
  incomes, 
  bankAccounts,
  selectedYear,
  onAddGoal, 
  onUpdateGoal, 
  onDeleteGoal,
  onAddBankAccount,
  onUpdateBankAccount,
  onDeleteBankAccount
}) => {
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [expandedMonth, setExpandedMonth] = useState<number | null>(new Date().getMonth());
  
  const [newBankName, setNewBankName] = useState('');
  const [newBankType, setNewBankType] = useState('Ahorros');
  const [newBankBalance, setNewBankBalance] = useState('');

  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [confirmDeleteBankId, setConfirmDeleteBankId] = useState<string | null>(null);
  const [editBankForm, setEditBankForm] = useState<Partial<BankAccount>>({});

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [addFundAmount, setAddFundAmount] = useState<string>('');
  const [addFundBankId, setAddFundBankId] = useState<string>('');
  const [historyGoalId, setHistoryGoalId] = useState<string | null>(null);

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalForm, setEditGoalForm] = useState<Partial<Goal>>({});
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState<string | null>(null);

  const currentMonthIndex = new Date().getMonth();
  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  // Función lógica para obtener el rango de días de una semana específica
  const getWeekDateRange = (week: string, month: number, year: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    switch(week) {
      case 'S1': return `01/${Math.min(7, lastDay).toString().padStart(2, '0')}`;
      case 'S2': return `08/14`;
      case 'S3': return `15/21`;
      case 'S4': return `22/${lastDay.toString().padStart(2, '0')}`;
      default: return '';
    }
  };

  const totalAnnualExpenses = expenses.reduce((sum, item) => {
      const activeMonthsCount = item.months ? item.months.length : 12;
      return sum + (item.amount * activeMonthsCount);
  }, 0);

  const getPaymentsForMonth = (monthIndex: number, year: number) => {
    return payments.filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === monthIndex && d.getFullYear() === year;
    });
  };

  const activeExpensesThisMonth = expenses.filter(e => !e.months || e.months.includes(currentMonthIndex));
  const totalMonthlyFixedCost = activeExpensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
  
  const totalPaidYearly = payments.filter(p => new Date(p.date).getFullYear() === selectedYear).reduce((sum, p) => sum + p.amount, 0);
  const annualProgressPercent = totalAnnualExpenses > 0 ? (totalPaidYearly / totalAnnualExpenses) * 100 : 0;
  
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const balance = totalIncome - totalMonthlyFixedCost;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget) return;
    onAddGoal({
      id: generateId(),
      userId,
      name: newGoalName,
      targetAmount: parseFloat(newGoalTarget),
      currentAmount: 0,
      transactions: []
    });
    setNewGoalName('');
    setNewGoalTarget('');
  };

  const startEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditGoalForm(goal);
    setConfirmDeleteGoalId(null);
    setActiveGoalId(null);
    setHistoryGoalId(null);
  };

  const cancelEditGoal = () => {
    setEditingGoalId(null);
    setEditGoalForm({});
  };

  const saveEditGoal = () => {
    if (editingGoalId && editGoalForm.name && editGoalForm.targetAmount) {
      onUpdateGoal(editGoalForm as Goal);
      setEditingGoalId(null);
      setEditGoalForm({});
    }
  };

  const handleDeleteGoal = (id: string) => {
    onDeleteGoal(id);
    setConfirmDeleteGoalId(null);
  };

  const handleAddBank = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBankName) return;
      onAddBankAccount({
          id: generateId(),
          userId,
          name: newBankName,
          type: newBankType,
          balance: parseFloat(newBankBalance) || 0
      });
      setNewBankName('');
      setNewBankBalance('');
  };

  const startEditBank = (bank: BankAccount) => {
      setEditingBankId(bank.id);
      setEditBankForm(bank);
      setConfirmDeleteBankId(null);
  };

  const cancelEditBank = () => {
      setEditingBankId(null);
      setEditBankForm({});
  };

  const saveEditBank = () => {
      if (editingBankId && editBankForm.name) {
          onUpdateBankAccount(editBankForm as BankAccount);
          setEditingBankId(null);
          setEditBankForm({});
      }
  };

  const submitAddFunds = (goal: Goal) => {
    const amount = parseFloat(addFundAmount);
    if (!isNaN(amount) && amount > 0 && addFundBankId) {
      const newTransaction: GoalTransaction = {
        id: generateId(),
        amount: amount,
        date: new Date().toISOString(),
        bankAccountId: addFundBankId,
        note: 'Depósito Manual'
      };
      
      onUpdateGoal({ 
        ...goal, 
        currentAmount: (goal.currentAmount || 0) + amount,
        transactions: [...(goal.transactions || []), newTransaction]
      });

      const bank = bankAccounts.find(b => b.id === addFundBankId);
      if (bank) {
          onUpdateBankAccount({
              ...bank,
              balance: (bank.balance || 0) + amount
          });
      }
      
      setActiveGoalId(null);
      setAddFundAmount('');
      setAddFundBankId('');
    } else if (!addFundBankId) {
        alert("Selecciona una cuenta de banco para depositar el ahorro.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-50 p-2.5 rounded-xl"><Wallet className="w-5 h-5 text-emerald-600" /></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ingresos</p>
             </div>
             <p className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totalIncome)}</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-indigo-50 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-indigo-600" /></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gastos Fijos</p>
             </div>
             <p className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totalMonthlyFixedCost)}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 rounded-xl ${balance >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <Coins className={`w-5 h-5 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Disponible</p>
             </div>
             <p className={`text-2xl font-black tracking-tight ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(balance)}</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                      <Landmark className="w-4 h-4 text-blue-600" />
                      Bancos y Cuentas
                  </h3>
                  <form onSubmit={handleAddBank} className="mb-6 space-y-3">
                      <input
                          type="text"
                          placeholder="Nombre del banco"
                          value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm placeholder:text-slate-400 font-medium"
                          required
                      />
                      <input
                          type="number"
                          placeholder="Saldo Inicial ($)"
                          value={newBankBalance}
                          onChange={(e) => setNewBankBalance(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-bold"
                          required
                      />
                      <select
                          value={newBankType}
                          onChange={(e) => setNewBankType(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer font-bold"
                      >
                          <option value="Ahorros">Ahorros</option>
                          <option value="Corriente">Corriente</option>
                          <option value="Billetera Digital">Digital</option>
                          <option value="Efectivo">Efectivo</option>
                      </select>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95">
                          + Agregar Cuenta
                      </button>
                  </form>

                  <div className="space-y-3">
                      {bankAccounts.map(bank => {
                          const isConfirmingDelete = confirmDeleteBankId === bank.id;
                          const isEditing = editingBankId === bank.id;

                          return (
                            <div key={bank.id} className={`p-4 border rounded-2xl transition-all ${isEditing ? 'bg-blue-50 border-blue-200' : isConfirmingDelete ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-sm'}`}>
                                {isEditing ? (
                                    <div className="space-y-3 animate-fade-in">
                                        <input 
                                          type="text" 
                                          value={editBankForm.name} 
                                          onChange={(e) => setEditBankForm({...editBankForm, name: e.target.value})}
                                          className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                        />
                                        <input 
                                          type="number" 
                                          value={editBankForm.balance} 
                                          onChange={(e) => setEditBankForm({...editBankForm, balance: parseFloat(e.target.value) || 0})}
                                          className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white text-slate-900 outline-none font-black"
                                        />
                                        <select 
                                          value={editBankForm.type} 
                                          onChange={(e) => setEditBankForm({...editBankForm, type: e.target.value})}
                                          className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white text-slate-900 outline-none"
                                        >
                                            <option value="Ahorros">Ahorros</option>
                                            <option value="Corriente">Corriente</option>
                                            <option value="Billetera Digital">Digital</option>
                                            <option value="Efectivo">Efectivo</option>
                                        </select>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={saveEditBank} className="flex-1 bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors flex justify-center"><Save className="w-4 h-4"/></button>
                                            <button onClick={cancelEditBank} className="flex-1 bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300 transition-colors flex justify-center"><X className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                      <div className="flex justify-between items-start mb-2">
                                          <div>
                                              <span className={`text-sm font-black block ${isConfirmingDelete ? 'text-rose-700' : 'text-slate-800'}`}>{bank.name}</span>
                                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{bank.type}</span>
                                          </div>
                                          
                                          {isConfirmingDelete ? (
                                              <div className="flex items-center gap-1.5 animate-fade-in">
                                                  <button onClick={() => {onDeleteBankAccount(bank.id); setConfirmDeleteBankId(null);}} className="bg-rose-600 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-rose-700 shadow-sm">SÍ</button>
                                                  <button onClick={() => setConfirmDeleteBankId(null)} className="bg-slate-200 text-slate-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-slate-300">NO</button>
                                              </div>
                                          ) : (
                                              <div className="flex items-center gap-1">
                                                  <button onClick={() => startEditBank(bank)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white" title="Editar">
                                                      <Pencil className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button onClick={() => setConfirmDeleteBankId(bank.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white" title="Eliminar">
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                                          <span className="text-[10px] font-black text-slate-300 uppercase">Saldo Acumulado</span>
                                          <span className={`text-base font-black ${isConfirmingDelete ? 'text-rose-600 opacity-50' : 'text-blue-600'}`}>{formatCurrency(bank.balance || 0)}</span>
                                      </div>
                                    </>
                                )}
                            </div>
                          );
                      })}
                  </div>
              </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <Target className="w-5 h-5 text-rose-500" />
                        Objetivos de Ahorro
                      </h3>
                  </div>
                  
                  <form onSubmit={handleAddGoal} className="mb-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="sm:col-span-6">
                          <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Nombre del Objetivo</label>
                          <input type="text" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} placeholder="Ej. Viaje Vacaciones" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none shadow-sm placeholder:text-slate-400" required />
                      </div>
                      <div className="sm:col-span-4">
                          <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Meta Financiera ($)</label>
                          <input type="number" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none shadow-sm placeholder:text-slate-400" required />
                      </div>
                      <div className="sm:col-span-2">
                          <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white h-[44px] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md active:scale-95">
                              <PlusCircle className="w-4 h-4" /> CREAR
                          </button>
                      </div>
                  </form>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                              <tr>
                                  <th className="px-6 py-4">Objetivo</th>
                                  <th className="px-6 py-4 text-right">Meta</th>
                                  <th className="px-6 py-4 text-right">Ahorrado</th>
                                  <th className="px-6 py-4">Progreso</th>
                                  <th className="px-6 py-4 text-center">Acciones</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {goals.length === 0 ? (
                                  <tr>
                                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No tienes objetivos registrados aún.</td>
                                  </tr>
                              ) : (
                                  goals.map(goal => {
                                      const progress = Math.min(((goal.currentAmount || 0) / goal.targetAmount) * 100, 100);
                                      const isAddingFunds = activeGoalId === goal.id;
                                      const isViewingHistory = historyGoalId === goal.id;
                                      const isEditing = editingGoalId === goal.id;
                                      const isConfirmingDelete = confirmDeleteGoalId === goal.id;

                                      return (
                                          <React.Fragment key={goal.id}>
                                              <tr className={`hover:bg-slate-50/50 transition-colors ${isAddingFunds || isViewingHistory || isEditing ? 'bg-indigo-50/30' : ''} ${isConfirmingDelete ? 'bg-rose-50' : ''}`}>
                                                  <td className="px-6 py-5">
                                                      {isEditing ? (
                                                        <input 
                                                          type="text" 
                                                          value={editGoalForm.name} 
                                                          onChange={(e) => setEditGoalForm({...editGoalForm, name: e.target.value})}
                                                          className="w-full px-3 py-1.5 text-sm border border-indigo-200 rounded-lg bg-white text-slate-900 font-black outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                                        />
                                                      ) : (
                                                        <span className="font-black text-slate-800">{goal.name}</span>
                                                      )}
                                                  </td>
                                                  <td className="px-6 py-5 text-right">
                                                      {isEditing ? (
                                                        <input 
                                                          type="number" 
                                                          value={editGoalForm.targetAmount} 
                                                          onChange={(e) => setEditGoalForm({...editGoalForm, targetAmount: parseFloat(e.target.value) || 0})}
                                                          className="w-full px-3 py-1.5 text-sm border border-indigo-200 rounded-lg bg-white text-slate-900 font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-right"
                                                        />
                                                      ) : (
                                                        <span className="text-slate-600 font-medium">{formatCurrency(goal.targetAmount)}</span>
                                                      )}
                                                  </td>
                                                  <td className="px-6 py-5 text-right text-emerald-600 font-black">{formatCurrency(goal.currentAmount || 0)}</td>
                                                  <td className="px-6 py-5 min-w-[140px]">
                                                      <div className="flex flex-col gap-1.5">
                                                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                              <div className="bg-rose-500 h-2 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${progress}%` }}></div>
                                                          </div>
                                                          <span className="text-[10px] font-black text-rose-500 tracking-tighter">{progress.toFixed(0)}% COMPLETADO</span>
                                                      </div>
                                                  </td>
                                                  <td className="px-6 py-5">
                                                      <div className="flex items-center justify-center gap-2">
                                                          {isEditing ? (
                                                            <div className="flex items-center gap-1.5 animate-fade-in">
                                                              <button onClick={saveEditGoal} className="p-2 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition-all"><Check className="w-4 h-4" /></button>
                                                              <button onClick={cancelEditGoal} className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all"><X className="w-4 h-4" /></button>
                                                            </div>
                                                          ) : isConfirmingDelete ? (
                                                            <div className="flex items-center gap-3 animate-fade-in px-3 py-1.5 rounded-xl">
                                                              <span className="text-[11px] font-black text-rose-600 uppercase tracking-tighter">¿Eliminar?</span>
                                                              <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                                                              <button onClick={() => setConfirmDeleteGoalId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                                                            </div>
                                                          ) : (
                                                            <div className="flex items-center gap-2">
                                                              <button onClick={() => setHistoryGoalId(isViewingHistory ? null : goal.id)} title="Historial" className={`p-1.5 rounded-lg transition-all ${isViewingHistory ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
                                                                <History className="w-4 h-4" />
                                                              </button>
                                                              <button onClick={() => startEditGoal(goal)} title="Editar" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all hover:bg-slate-100 rounded-lg">
                                                                <Pencil className="w-4 h-4" />
                                                              </button>
                                                              <button onClick={() => {setConfirmDeleteGoalId(goal.id); setActiveGoalId(null); setHistoryGoalId(null);}} title="Eliminar" className="p-1.5 text-slate-400 hover:text-rose-600 transition-all hover:bg-slate-100 rounded-lg">
                                                                <Trash2 className="w-4 h-4" />
                                                              </button>
                                                              <button onClick={() => {
                                                                  setActiveGoalId(isAddingFunds ? null : goal.id);
                                                                  setHistoryGoalId(null);
                                                                  setEditingGoalId(null);
                                                                  setConfirmDeleteGoalId(null);
                                                              }} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${isAddingFunds ? 'bg-slate-800 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                                                  <Coins className="w-3.5 h-3.5" /> {isAddingFunds ? 'X' : 'DEPOSITAR'}
                                                              </button>
                                                            </div>
                                                          )}
                                                      </div>
                                                  </td>
                                              </tr>
                                              
                                              {isAddingFunds && (
                                                  <tr className="bg-emerald-50/50">
                                                      <td colSpan={5} className="px-6 py-6 border-l-4 border-emerald-500">
                                                          <div className="flex flex-col sm:flex-row items-end gap-4 animate-fade-in">
                                                              <div className="flex-1 w-full">
                                                                  <label className="block text-[9px] font-black text-emerald-700 mb-1.5 uppercase tracking-widest">Monto a depositar (COP)</label>
                                                                  <input type="number" autoFocus placeholder="Ej. 100000" value={addFundAmount} onChange={(e) => setAddFundAmount(e.target.value)} className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium" />
                                                              </div>
                                                              <div className="flex-1 w-full">
                                                                  <label className="block text-[9px] font-black text-emerald-700 mb-1.5 uppercase tracking-widest">Hacia la cuenta de banco:</label>
                                                                  <select value={addFundBankId} onChange={(e) => setAddFundBankId(e.target.value)} className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl text-sm bg-white text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium">
                                                                      <option value="">-- Seleccionar Banco --</option>
                                                                      {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name} (Actual: {formatCurrency(b.balance)})</option>)}
                                                                  </select>
                                                              </div>
                                                              <button onClick={() => submitAddFunds(goal)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center gap-2 transition-all active:scale-95">
                                                                  <ArrowUpCircle className="w-4 h-4" /> GUARDAR DEPÓSITO
                                                              </button>
                                                          </div>
                                                      </td>
                                                  </tr>
                                              )}

                                              {isViewingHistory && (
                                                  <tr className="bg-indigo-50/50">
                                                      <td colSpan={5} className="px-6 py-6 border-l-4 border-indigo-500">
                                                          <div className="animate-fade-in">
                                                              <h5 className="text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Últimos Movimientos</h5>
                                                              {(goal.transactions || []).length === 0 ? (
                                                                  <p className="text-xs text-slate-400 italic bg-white/50 p-4 rounded-xl border border-dashed border-slate-200">No hay transacciones registradas para este objetivo.</p>
                                                              ) : (
                                                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                                      {[...(goal.transactions || [])].reverse().map(t => {
                                                                          const bank = bankAccounts.find(b => b.id === t.bankAccountId);
                                                                          return (
                                                                              <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-indigo-100 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                                                                                  <div className="flex flex-col">
                                                                                      <span className="text-xs font-black text-slate-800">{bank?.name || 'Otro'}</span>
                                                                                      <span className="text-[10px] text-slate-400 font-medium">{new Date(t.date).toLocaleDateString()}</span>
                                                                                  </div>
                                                                                  <span className="text-sm font-black text-emerald-600">+{formatCurrency(t.amount)}</span>
                                                                              </div>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              )}
                                                          </div>
                                                      </td>
                                                  </tr>
                                              )}
                                          </React.Fragment>
                                      );
                                  })
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Table2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cierre Mensual de Pagos</h3>
            </div>
            
            <div className="flex items-center gap-6 bg-white/60 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
               <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PROGRESO ANUAL {selectedYear}</span>
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-black text-indigo-600">{annualProgressPercent.toFixed(1)}%</span>
                     <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${Math.min(annualProgressPercent, 100)}%` }}></div>
                     </div>
                  </div>
               </div>
               <div className="text-right border-l border-slate-200 pl-6">
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">TOTAL PAGADO</span>
                  <span className="text-sm font-black text-slate-800">{formatCurrency(totalPaidYearly)} <span className="text-slate-300 font-medium">/ {formatCurrency(totalAnnualExpenses)}</span></span>
               </div>
            </div>
         </div>
         
         <div className="divide-y divide-slate-100">
            {MONTH_NAMES.map((monthName, monthIndex) => {
                const monthPayments = getPaymentsForMonth(monthIndex, selectedYear);
                const activeExpensesThisMonth = expenses.filter(e => !e.months || e.months.includes(monthIndex));
                
                const monthlyCost = activeExpensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
                const totalPaidMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);
                const totalPercent = monthlyCost > 0 ? (totalPaidMonth / monthlyCost) * 100 : 0;
                
                // Cálculo de Diferencia Total Mensual
                const totalDiffValue = totalPaidMonth - monthlyCost;
                const isOverBudgetTotal = totalDiffValue > 0;
                const isComplete = totalPaidMonth >= monthlyCost && monthlyCost > 0;
                const isExpanded = expandedMonth === monthIndex;

                return (
                    <div key={monthName}>
                        <div onClick={() => setExpandedMonth(isExpanded ? null : monthIndex)} className={`flex items-center justify-between p-5 cursor-pointer transition-all ${isExpanded ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}>
                            <div className="flex items-center gap-4 flex-1">
                                <div className="flex items-center gap-4 min-w-[140px]">
                                  {isExpanded ? <ChevronDown className="w-5 h-5 text-indigo-600" /> : <ChevronRight className="w-5 h-5 text-slate-300" />}
                                  <span className={`text-sm font-black ${isExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>{monthName}</span>
                                </div>
                                
                                <div className="hidden lg:flex items-center gap-3 flex-1 max-w-[200px] ml-4">
                                   <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden shadow-inner relative">
                                      <div 
                                          className={`h-full transition-all duration-700 ${isComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                          style={{ width: `${Math.min(totalPercent, 100)}%` }}
                                      />
                                   </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 sm:gap-8 justify-end flex-wrap sm:flex-nowrap">
                                <div className="text-right border-r border-slate-100 pr-4 sm:pr-8">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Prog vs Eje</p>
                                    <div className="text-[10px] font-bold">
                                        <span className="text-slate-500">{formatCurrency(monthlyCost)}</span>
                                        <span className="text-slate-300 mx-1">/</span>
                                        <span className={totalPaidMonth > monthlyCost ? 'text-emerald-600' : totalPaidMonth < monthlyCost ? 'text-rose-600' : 'text-slate-900'}>{formatCurrency(totalPaidMonth)}</span>
                                    </div>
                                </div>

                                <div className="text-right min-w-[100px]">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Diferencia</p>
                                    <div className="flex flex-col items-end">
                                      <span className={`text-[11px] font-black ${totalDiffValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {totalDiffValue > 0 ? '+' : ''}{formatCurrency(totalDiffValue)}
                                      </span>
                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md mt-0.5 ${totalPercent === 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                          {totalPercent.toFixed(1)}%
                                      </span>
                                    </div>
                                </div>

                                <div className="flex items-center ml-2">
                                  {isComplete ? (
                                      <div className="bg-emerald-500 p-1.5 rounded-full shadow-sm animate-fade-in">
                                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                                      </div>
                                  ) : (
                                      <div className="bg-slate-100 p-1.5 rounded-full">
                                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                                      </div>
                                  )}
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="px-6 sm:px-14 pb-8 bg-slate-50/50 animate-fade-in border-b border-slate-100">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs mt-4 border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-200">
                                                <th className="py-4 text-left px-2">Gasto / Concepto</th>
                                                <th className="py-4 text-right px-2">Programado</th>
                                                <th className="py-4 text-right px-2">Ejecutado</th>
                                                <th className="py-4 text-right px-2">Diferencia ($)</th>
                                                <th className="py-4 text-center px-2">Cumplimiento (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Gastos Fijos Programados */}
                                            {activeExpensesThisMonth.map(expense => {
                                                const itemPaid = monthPayments.filter(p => p.expenseId === expense.id).reduce((s, p) => s + p.amount, 0);
                                                const itemDiff = itemPaid - expense.amount;
                                                const itemPercent = expense.amount > 0 ? (itemPaid / expense.amount) * 100 : 0;
                                                const ok = itemPaid >= expense.amount;
                                                const weekRange = getWeekDateRange(expense.week || 'S1', monthIndex, selectedYear);
                                                const isDebt = expense.category === 'Deudas';
                                                
                                                return (
                                                    <tr key={expense.id} className="transition-colors group text-slate-600 hover:bg-white">
                                                        <td className="py-4 px-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-sm text-slate-800">
                                                                    {isDebt && <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5 text-rose-500" />}
                                                                    {expense.name} <span className="text-indigo-500">{expense.week}</span> <span className="text-[10px] text-slate-400 font-bold">({weekRange})</span>
                                                                </span>
                                                                <span className="text-[8px] uppercase font-black flex items-center gap-1 text-slate-400">
                                                                    <ListFilter className="w-2 h-2 text-indigo-400" /> Gasto Fijo Programado
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-2 text-right font-bold text-slate-400">{formatCurrency(expense.amount)}</td>
                                                        <td className="py-4 px-2 text-right font-black text-slate-800">{formatCurrency(itemPaid)}</td>
                                                        <td className={`py-4 px-2 text-right font-black ${itemDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {itemDiff > 0 ? '+' : ''}{formatCurrency(itemDiff)}
                                                        </td>
                                                        <td className="py-4 px-2 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${itemPercent > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                                                                    {itemPercent.toFixed(0)}%
                                                                </span>
                                                                <div className="w-12 bg-slate-200 h-1 rounded-full overflow-hidden">
                                                                    <div className={`h-full ${itemPercent > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(itemPercent, 100)}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Gastos No Programados (Libres / Imprevistos) */}
                                            {monthPayments.filter(p => p.expenseId === 'ad-hoc').map(payment => (
                                                <tr key={payment.id} className="text-slate-600 hover:bg-amber-50/30 transition-colors bg-amber-50/10">
                                                    <td className="py-4 px-2">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-amber-800 italic text-sm">{payment.expenseName}</span>
                                                            <span className="text-[8px] uppercase font-black text-amber-600 flex items-center gap-1">
                                                                <Zap className="w-2 h-2" /> Gasto Libre (Imprevisto)
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-2 text-right font-bold text-slate-300">$0</td>
                                                    <td className="py-4 px-2 text-right font-black text-amber-900">{formatCurrency(payment.amount)}</td>
                                                    <td className="py-4 px-2 text-right font-black text-emerald-600">+{formatCurrency(payment.amount)}</td>
                                                    <td className="py-4 px-2 text-center">
                                                        <span className="px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[10px] font-black shadow-sm">
                                                            100% LIBRE
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-100/50">
                                                <td className="py-4 px-2 text-[10px] font-black text-slate-800 uppercase tracking-widest">TOTAL MENSUAL</td>
                                                <td className="py-4 px-2 text-right font-black text-slate-400">{formatCurrency(monthlyCost)}</td>
                                                <td className="py-4 px-2 text-right font-black text-slate-900">{formatCurrency(totalPaidMonth)}</td>
                                                <td className={`py-4 px-2 text-right font-black ${totalDiffValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {totalDiffValue > 0 ? '+' : ''}{formatCurrency(totalDiffValue)}
                                                </td>
                                                <td className="py-4 px-2 text-center">
                                                    <span className={`px-3 py-1 rounded-xl text-[11px] font-black ${totalPercent > 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white shadow-lg shadow-rose-200'}`}>
                                                        {totalPercent.toFixed(1)}% TOTAL
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
         </div>
      </div>
    </div>
  );
};
