
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Briefcase, TrendingUp, Pencil, Check, X, Save, Settings2, Tag, List, Layout, Loader2, Calendar } from 'lucide-react';
import { Income, Expense, Payment, Goal, BankAccount, formatCurrency } from '../types';

interface IncomeManagerProps {
  userId: string;
  incomes: Income[];
  expenses: Expense[];
  payments: Payment[];
  goals: Goal[];
  bankAccounts: BankAccount[];
  onAddIncome: (income: Income) => void;
  onUpdateIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
}

const DEFAULT_CATEGORIES = ['Salario', 'Consultoría', 'Inversión', 'Extra', 'Otros'];

export const IncomeManager: React.FC<IncomeManagerProps> = ({ 
    userId,
    incomes, 
    expenses,
    payments,
    goals,
    bankAccounts,
    onAddIncome, 
    onUpdateIncome, 
    onDeleteIncome 
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salario');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('control_jm_income_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editCatValue, setEditCatValue] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Income>>({});

  useEffect(() => {
    localStorage.setItem('control_jm_income_categories', JSON.stringify(categories));
  }, [categories]);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !date) return;

    const newIncome: Income = {
      id: generateId(),
      userId,
      name,
      amount: parseFloat(amount),
      category,
      date: new Date(date + 'T12:00:00').toISOString()
    };

    onAddIncome(newIncome);
    setName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const startEditingIncome = (income: Income) => {
    setEditingId(income.id);
    setEditForm(income);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditingIncome = () => {
    if (editingId && editForm.name && editForm.amount && editForm.category) {
      onUpdateIncome(editForm as Income);
      setEditingId(null);
      setEditForm({});
    }
  };

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);

  const addCategory = () => {
    if (newCatName && !categories.includes(newCatName)) {
      setCategories([...categories, newCatName]);
      setNewCatName('');
    }
  };

  const deleteCategory = (idx: number) => {
    const catToDelete = categories[idx];
    if (category === catToDelete) setCategory(categories[0] || '');
    setCategories(categories.filter((_, i) => i !== idx));
  };

  const startEditCategory = (idx: number) => {
    setEditingCatIdx(idx);
    setEditCatValue(categories[idx]);
  };

  const saveEditCategory = () => {
    if (editingCatIdx !== null && editCatValue) {
      const newCats = [...categories];
      newCats[editingCatIdx] = editCatValue;
      setCategories(newCats);
      setEditingCatIdx(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight mb-8">
          <div className="bg-emerald-50 p-2 rounded-xl">
            <Plus className="w-5 h-5 text-emerald-600" />
          </div>
          Agregar Ingreso Mensual
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="col-span-1 md:col-span-3">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Fuente de Ingreso</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Salario, Consultoría"
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 shadow-sm outline-none placeholder:text-slate-300 font-bold text-slate-800 transition-all"
              required
            />
          </div>
          
          <div className="col-span-1 md:col-span-3">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Monto Mensual (COP)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 shadow-sm outline-none font-black text-slate-800 transition-all"
                required
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Fecha Recibo</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 shadow-sm outline-none font-bold text-slate-800 text-xs transition-all"
                required
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</label>
              <button 
                type="button" 
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-[10px] font-black text-indigo-500 uppercase hover:text-indigo-700 transition-colors flex items-center gap-1"
              >
                <Settings2 className="w-3 h-3" />
              </button>
            </div>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-5 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 appearance-none text-xs shadow-sm outline-none cursor-pointer font-black text-slate-700 transition-all"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Tag className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 text-[11px] uppercase tracking-widest"
            >
              AÑADIR
            </button>
          </div>
        </form>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-white" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Gestionar Categorías</h3>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nueva categoría..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addCategory} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-all"><Plus className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    {editingCatIdx === idx ? (
                      <div className="flex-1 flex gap-2">
                        <input autoFocus type="text" value={editCatValue} onChange={(e) => setEditCatValue(e.target.value)} className="flex-1 px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-black outline-none" />
                        <button onClick={saveEditCategory} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-md transition-colors"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setEditingCatIdx(null)} className="text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{cat}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditCategory(idx)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil className="w-3.5 h-3.5"/></button>
                          <button onClick={() => deleteCategory(idx)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setIsCategoryModalOpen(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Listo</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-xl">
              <List className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Detalle de Ingresos Registrados</h3>
          </div>
          <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
            {incomes.length} Fuentes registradas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Fuente / Concepto</th>
                <th className="px-8 py-5 text-right">Monto Mensual</th>
                <th className="px-8 py-5 text-center">Fecha</th>
                <th className="px-8 py-5 text-center">Categoría</th>
                <th className="px-8 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {incomes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-300 italic font-medium">
                    <div className="flex flex-col items-center gap-3">
                       <Layout className="w-10 h-10 opacity-10" />
                       <p className="text-sm font-black uppercase tracking-widest">No hay ingresos registrados aún</p>
                    </div>
                  </td>
                </tr>
              ) : (
                incomes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((income) => {
                  const isEditing = editingId === income.id;
                  return (
                    <tr key={income.id} className={`hover:bg-slate-50/50 transition-colors group ${isEditing ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-8 py-6">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editForm.name} 
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full px-4 py-2 border border-indigo-200 rounded-xl bg-white font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-indigo-100 transition-colors">
                               <Briefcase className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                            </div>
                            <span className="font-black text-slate-800 uppercase tracking-tight text-sm">{income.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {isEditing ? (
                          <input 
                            type="number" 
                            value={editForm.amount} 
                            onChange={(e) => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})}
                            className="w-32 px-4 py-2 border border-indigo-200 rounded-xl bg-white font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-right"
                          />
                        ) : (
                          <span className="text-base font-black text-emerald-600 tracking-tight">{formatCurrency(income.amount)}</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-center">
                        {isEditing ? (
                          <input 
                            type="date" 
                            value={editForm.date?.split('T')[0]} 
                            onChange={(e) => setEditForm({...editForm, date: new Date(e.target.value + 'T12:00:00').toISOString()})}
                            className="px-3 py-1.5 border border-indigo-200 rounded-xl bg-white text-xs font-bold outline-none"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                             <Calendar className="w-3 h-3 text-indigo-400" />
                             {new Date(income.date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-center">
                        {isEditing ? (
                          <select 
                            value={editForm.category} 
                            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                            className="w-full px-4 py-2 border border-indigo-200 rounded-xl bg-white font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        ) : (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200/50">
                            {income.category}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center items-center gap-2">
                          {isEditing ? (
                            <div className="flex gap-2 animate-fade-in">
                               <button onClick={saveEditingIncome} className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition-all active:scale-90"><Check className="w-4 h-4" /></button>
                               <button onClick={cancelEditing} className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all active:scale-90"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => startEditingIncome(income)} className="p-2.5 text-slate-300 hover:text-indigo-600 bg-white border border-slate-100 hover:border-indigo-100 rounded-xl shadow-sm transition-all active:scale-90"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => onDeleteIncome(income.id)} className="p-2.5 text-slate-300 hover:text-rose-600 bg-white border border-slate-100 hover:border-rose-100 rounded-xl shadow-sm transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {incomes.length > 0 && (
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-100">
                <tr>
                  <td className="px-8 py-6 font-black text-slate-500 uppercase text-[10px] tracking-[0.2em]">Cálculo Total Mensual</td>
                  <td className="px-8 py-6 text-right font-black text-2xl text-slate-900 tracking-tighter">{formatCurrency(totalIncome)}</td>
                  <td colSpan={3} className="px-8 py-6">
                     <div className="flex items-center gap-2 text-indigo-500">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Base de Presupuesto</span>
                     </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
