
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Tag, CalendarClock, Copy, Pencil, Check, X, Calendar, ClipboardList, Settings2, Save, TrendingDown, AlertTriangle, BarChart3, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, CreditCard, List, Layout, Layers } from 'lucide-react';
import { Expense, CATEGORIES as DEFAULT_CATEGORIES, WEEKS as DEFAULT_WEEKS, formatCurrency, MONTH_NAMES_SHORT, Payment } from '../types';

interface FixedExpensesProps {
  userId: string;
  expenses: Expense[];
  payments: Payment[];
  selectedYear: number;
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onCopyPreviousYear: () => void;
}

export const FixedExpenses: React.FC<FixedExpensesProps> = ({ 
  userId,
  expenses, 
  payments,
  selectedYear, 
  onAddExpense, 
  onUpdateExpense,
  onDeleteExpense,
  onCopyPreviousYear
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [week, setWeek] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<number[]>(Array.from({length: 12}, (_, i) => i));
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('1');

  // Estados para gestión de listas personalizadas
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('control_jm_expense_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  
  const [availableWeeks, setAvailableWeeks] = useState<string[]>(() => {
    const saved = localStorage.getItem('control_jm_expense_weeks');
    return saved ? JSON.parse(saved) : DEFAULT_WEEKS;
  });

  // Modales y estados de edición para listas
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isWeekModalOpen, setIsWeekModalOpen] = useState(false);
  
  const [newCatName, setNewCatName] = useState('');
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editCatValue, setEditCatValue] = useState('');

  const [newWeekName, setNewWeekName] = useState('');
  const [editingWeekIdx, setEditingWeekIdx] = useState<number | null>(null);
  const [editWeekValue, setEditWeekValue] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});

  // Persistencia
  useEffect(() => {
    localStorage.setItem('control_jm_expense_categories', JSON.stringify(availableCategories));
  }, [availableCategories]);

  useEffect(() => {
    localStorage.setItem('control_jm_expense_weeks', JSON.stringify(availableWeeks));
  }, [availableWeeks]);

  useEffect(() => {
    if (availableCategories.length > 0 && !category) setCategory(availableCategories[0]);
    if (availableWeeks.length > 0 && !week) setWeek(availableWeeks[0]);
  }, [availableCategories, availableWeeks]);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || selectedMonths.length === 0) return;
    const newExpense: Expense = {
      id: generateId(),
      userId,
      name,
      amount: parseFloat(amount),
      category,
      week,
      year: selectedYear,
      months: selectedMonths,
      isInstallment,
      totalInstallments: isInstallment ? parseInt(totalInstallments) : undefined,
      currentInstallment: isInstallment ? parseInt(currentInstallment) : undefined,
      startDate: isInstallment ? new Date().toISOString() : undefined
    };
    onAddExpense(newExpense);
    setName(''); setAmount(''); setIsInstallment(false); setTotalInstallments(''); selectAllMonths();
  };

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setEditForm(expense);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (editingId && editForm.name && editForm.amount) {
      onUpdateExpense(editForm as Expense);
      setEditingId(null);
      setEditForm({});
    }
  };

  const selectAllMonths = () => setSelectedMonths(Array.from({length: 12}, (_, i) => i));
  const selectNoMonths = () => setSelectedMonths([]);
  const toggleMonth = (mIdx: number) => setSelectedMonths(p => p.includes(mIdx) ? p.filter(m => m !== mIdx) : [...p, mIdx].sort((a,b) => a-b));

  const totalAnnualExpenses = expenses.reduce((sum, item) => sum + (item.amount * (item.months ? item.months.length : 12)), 0);
  const currentMonthIdx = new Date().getMonth();
  
  const categoryStats = availableCategories.map(cat => {
    const planned = expenses.filter(e => e.category === cat && (!e.months || e.months.includes(currentMonthIdx)) && e.year === selectedYear).reduce((sum, e) => sum + e.amount, 0);
    const catExpenseIds = new Set(expenses.filter(e => e.category === cat).map(e => e.id));
    const actual = payments.filter(p => { const pDate = new Date(p.date); return catExpenseIds.has(p.expenseId) && pDate.getFullYear() === selectedYear && pDate.getMonth() === currentMonthIdx; }).reduce((sum, p) => sum + p.amount, 0);
    return { name: cat, planned, actual, diff: actual - planned, percent: planned > 0 ? (actual / planned) * 100 : 0 };
  }).filter(s => s.planned > 0 || s.actual > 0);

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
             <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-500 shadow-sm"><CreditCard className="w-6 h-6" /></div>
             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CUOTAS ACTIVAS</p><p className="text-2xl font-black text-slate-900 leading-none mt-1">{expenses.filter(e => e.isInstallment).length} <span className="text-[12px] opacity-40">Items</span></p></div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center gap-4 shadow-sm">
             <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 shadow-sm"><TrendingDown className="w-6 h-6" /></div>
             <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PROYECTADO ANUAL</p><p className="text-2xl font-black text-slate-900 leading-none mt-1">{formatCurrency(totalAnnualExpenses)}</p></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-xl">
                <Plus className="w-5 h-5 text-indigo-600" />
              </div>
              Registrar Gasto
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Concepto del Gasto</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Arriendo, Internet" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 transition-all shadow-sm" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Monto Mensual</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Semana Pago</label>
                    <button type="button" onClick={() => setIsWeekModalOpen(true)} className="text-indigo-500 hover:text-indigo-700 transition-colors">
                      <Settings2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="relative">
                    <select value={week} onChange={e => setWeek(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer shadow-sm">
                      {availableWeeks.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                    <button type="button" onClick={() => setIsCatModalOpen(true)} className="text-indigo-500 hover:text-indigo-700 transition-colors">
                      <Settings2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="relative">
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer shadow-sm">
                      {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-5 rounded-2xl border transition-all ${isInstallment ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${isInstallment ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    {/* Fixed "Cannot find name 'target'" error by using e.target.checked */}
                    <input type="checkbox" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} className="hidden" />
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isInstallment ? 'left-6' : 'left-1'}`}></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">¿Es compra a cuotas?</span>
                </label>
                {isInstallment && (
                  <div className="grid grid-cols-2 gap-4 mt-4 animate-fade-in">
                    <div>
                      <label className="block text-[9px] font-black text-indigo-700 mb-1 uppercase">Total Cuotas</label>
                      <input type="number" value={totalInstallments} onChange={e => setTotalInstallments(e.target.value)} className="w-full px-4 py-2 bg-white text-slate-900 text-xs rounded-xl border border-indigo-200 font-black outline-none" required />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-indigo-700 mb-1 uppercase">Cuota Actual</label>
                      <input type="number" value={currentInstallment} onChange={e => setCurrentInstallment(e.target.value)} className="w-full px-4 py-2 bg-white text-slate-900 text-xs rounded-xl border border-indigo-200 font-black outline-none" required />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meses Activos</span>
                    <div className="flex gap-3">
                      <button type="button" onClick={selectAllMonths} className="text-[9px] font-black text-indigo-500 uppercase">Todos</button>
                      <button type="button" onClick={selectNoMonths} className="text-[9px] font-black text-slate-400 uppercase">Limpiar</button>
                    </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                    {MONTH_NAMES_SHORT.map((m, idx) => (
                      <button key={m} type="button" onClick={() => toggleMonth(idx)} className={`py-2 rounded-xl text-[10px] font-black border transition-all ${selectedMonths.includes(idx) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{m}</button>
                    ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">+ REGISTRAR GASTO</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <BarChart3 className="w-5 h-5 text-indigo-500" />
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resumen Mensual ({MONTH_NAMES_SHORT[currentMonthIdx]})</h3>
               </div>
               <div className="text-[10px] font-black text-slate-400 uppercase bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">Control Presupuestario</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Categoría</th>
                    <th className="px-8 py-5 text-right">Programado</th>
                    <th className="px-8 py-5 text-right">Ejecutado</th>
                    <th className="px-8 py-5 text-center">Progreso</th>
                    <th className="px-8 py-5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categoryStats.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-300 text-sm font-black uppercase tracking-widest italic">No hay registros este mes</td></tr>
                  ) : (
                    categoryStats.map((stat) => (
                      <tr key={stat.name} className={`hover:bg-slate-50/50 transition-colors ${stat.diff > 0 ? 'bg-rose-50/20' : ''}`}>
                        <td className="px-8 py-5 font-black text-slate-800 text-xs flex items-center gap-2 uppercase tracking-tighter">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                          {stat.name}
                        </td>
                        <td className="px-8 py-5 text-right text-xs font-bold text-slate-400">{formatCurrency(stat.planned)}</td>
                        <td className="px-8 py-5 text-right text-sm font-black text-slate-900">{formatCurrency(stat.actual)}</td>
                        <td className="px-8 py-5 text-center min-w-[140px]">
                          <div className="flex flex-col gap-1.5 w-full px-2">
                            <div className="flex justify-between items-center text-[9px] font-black text-slate-400">
                              <span>{Math.round(stat.percent)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${stat.percent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min(stat.percent, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${stat.diff > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {stat.diff > 0 ? `EXCEDIDO ${formatCurrency(stat.diff)}` : 'BAJO CONTROL'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <List className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Listado Maestro de Gastos</h3>
              </div>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl shadow-sm uppercase tracking-widest">{expenses.length} Gastos Fijos</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Nombre / Cat</th>
                    <th className="px-8 py-5 text-right">Monto</th>
                    <th className="px-8 py-5 text-center">Meses Activos</th>
                    <th className="px-8 py-5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic font-black uppercase tracking-widest">No hay gastos programados</td></tr>
                  ) : (
                    expenses.map((expense) => {
                      const isEditing = editingId === expense.id;
                      const isDebt = expense.category === 'Deudas';
                      
                      return (
                        <tr key={expense.id} className={`hover:bg-slate-50/50 transition-colors group ${isEditing ? 'bg-indigo-50/30' : ''}`}>
                          <td className="px-8 py-6">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2 border border-indigo-200 rounded-xl text-xs font-bold bg-white" />
                                <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full px-4 py-2 border border-indigo-200 rounded-xl text-[10px] font-black bg-white">{availableCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-black uppercase tracking-tight text-sm text-slate-800">
                                    {isDebt && <AlertTriangle className="w-3.5 h-3.5 inline mr-1 mb-0.5 text-rose-500" />}
                                    {expense.name}
                                  </span>
                                  {expense.isInstallment && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase">Cuotas {expense.currentInstallment}/{expense.totalInstallments}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{expense.category}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[10px] font-black uppercase text-indigo-500">Semana {expense.week}</span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                            {isEditing ? (
                              <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})} className="w-32 px-4 py-2 border border-indigo-200 rounded-xl text-sm font-black text-right bg-white" />
                            ) : (
                              <span className="text-base font-black tracking-tight text-slate-800">{formatCurrency(expense.amount)}</span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-center">
                            {isEditing ? (
                              <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                                {MONTH_NAMES_SHORT.map((m, idx) => (
                                  <button 
                                    key={m} 
                                    onClick={() => {
                                      const current = editForm.months || [];
                                      const next = current.includes(idx) ? current.filter(x => x !== idx) : [...current, idx].sort((a,b)=>a-b);
                                      setEditForm({...editForm, months: next});
                                    }}
                                    className={`w-6 h-6 rounded-md text-[8px] font-black flex items-center justify-center border transition-all ${editForm.months?.includes(idx) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-300 border-slate-100'}`}
                                  >
                                    {m.charAt(0)}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex gap-1 justify-center">
                                {MONTH_NAMES_SHORT.map((_, idx) => (
                                  <div key={idx} className={`w-1.5 h-1.5 rounded-full ${expense.months?.includes(idx) ? 'bg-indigo-500 shadow-sm shadow-indigo-200' : 'bg-slate-100'}`} title={MONTH_NAMES_SHORT[idx]}></div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-center items-center gap-2">
                              {isEditing ? (
                                <div className="flex gap-2 animate-fade-in">
                                  <button onClick={saveEditing} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition-all active:scale-90"><Check className="w-4 h-4" /></button>
                                  <button onClick={cancelEditing} className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all active:scale-90"><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => startEditing(expense)} className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm transition-all active:scale-90 text-slate-300 hover:text-indigo-600 hover:border-indigo-100"><Pencil className="w-4 h-4" /></button>
                                  <button onClick={() => onDeleteExpense(expense.id)} className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm transition-all active:scale-90 text-slate-300 hover:text-rose-600 hover:border-rose-100"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODALES DE GESTIÓN */}
      {isCatModalOpen && (
        <ListManagementModal 
          title="Categorías de Gasto"
          icon={<Tag className="w-4 h-4" />}
          items={availableCategories}
          onClose={() => setIsCatModalOpen(false)}
          onAdd={(name: string) => {
            if (name && !availableCategories.includes(name)) setAvailableCategories([...availableCategories, name]);
          }}
          onDelete={(idx: number) => {
            const toDelete = availableCategories[idx];
            if (category === toDelete) setCategory(availableCategories[0] || '');
            setAvailableCategories(availableCategories.filter((_, i) => i !== idx));
          }}
          onEdit={(idx: number, newValue: string) => {
            if (newValue) {
              const newList = [...availableCategories];
              newList[idx] = newValue;
              setAvailableCategories(newList);
            }
          }}
        />
      )}

      {isWeekModalOpen && (
        <ListManagementModal 
          title="Semanas de Pago"
          icon={<CalendarClock className="w-4 h-4" />}
          items={availableWeeks}
          onClose={() => setIsWeekModalOpen(false)}
          onAdd={(name: string) => {
            if (name && !availableWeeks.includes(name)) setAvailableWeeks([...availableWeeks, name]);
          }}
          onDelete={(idx: number) => {
            const toDelete = availableWeeks[idx];
            if (week === toDelete) setWeek(availableWeeks[0] || '');
            setAvailableWeeks(availableWeeks.filter((_, i) => i !== idx));
          }}
          onEdit={(idx: number, newValue: string) => {
            if (newValue) {
              const newList = [...availableWeeks];
              newList[idx] = newValue;
              setAvailableWeeks(newList);
            }
          }}
        />
      )}
    </div>
  );
};

// Componente Reutilizable para la gestión de listas
const ListManagementModal = ({ title, icon, items, onClose, onAdd, onDelete, onEdit }: any) => {
  const [newValue, setNewValue] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Añadir..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={() => { onAdd(newValue); setNewValue(''); }}
              className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {items.map((item: string, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                {editingIdx === idx ? (
                  <div className="flex-1 flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-black outline-none"
                    />
                    <button onClick={() => { onEdit(idx, editValue); setEditingIdx(null); }} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-md transition-colors"><Check className="w-4 h-4"/></button>
                    <button onClick={() => setEditingIdx(null)} className="text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors"><X className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{item}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingIdx(idx); setEditValue(item); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3.5 h-3.5"/></button>
                      <button onClick={() => onDelete(idx)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
