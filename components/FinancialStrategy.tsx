
import React, { useState } from 'react';
import { Target, Activity, TrendingDown, ShieldCheck, AlertCircle, Wallet, Info, Snowflake, Mountain, List, CheckCircle2, ChevronRight, ArrowRight, CreditCard, Sparkles, Pencil, Trash2, Check, X, Save, Layers } from 'lucide-react';
import { Expense, Income, Payment, formatCurrency } from '../types';

interface FinancialStrategyProps {
  expenses: Expense[];
  incomes: Income[];
  payments: Payment[];
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

type Phase = 'diagnostico' | 'ataque' | 'estabilizacion';
type DebtStrategy = 'nieve' | 'avalancha';

export const FinancialStrategy: React.FC<FinancialStrategyProps> = ({ expenses, incomes, payments, onUpdateExpense, onDeleteExpense }) => {
  const [activePhase, setActivePhase] = useState<Phase>('ataque'); 
  const [debtStrategy, setDebtStrategy] = useState<DebtStrategy>('nieve');

  // Estados para edición y eliminación inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Cálculos base
  const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0);
  const debtExpenses = expenses.filter(e => e.category === 'Deudas');
  const installmentExpenses = expenses.filter(e => e.isInstallment);
  const lifeExpenses = expenses.filter(e => e.category !== 'Deudas' && !e.isInstallment);
  
  const totalDebtAmount = debtExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalInstallmentAmount = installmentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLifeAmount = lifeExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const availableCash = totalIncomes - (totalDebtAmount + totalInstallmentAmount + totalLifeAmount);
  const debtRatio = totalIncomes > 0 ? ((totalDebtAmount + totalInstallmentAmount) / totalIncomes) * 100 : 0;

  // Cálculos para Estabilización
  const essentialMonthlyExpenses = totalLifeAmount + totalDebtAmount + totalInstallmentAmount;
  const initialMeta = essentialMonthlyExpenses * 3;
  const idealMeta = essentialMonthlyExpenses * 6;

  // Ordenar deudas según estrategia
  const sortedDebts = [...debtExpenses, ...installmentExpenses].sort((a, b) => {
    const getRest = (exp: Expense) => {
        const paid = payments.filter(p => p.expenseId === exp.id).reduce((s, p) => s + p.amount, 0);
        const base = exp.isInstallment ? (exp.amount * (exp.totalInstallments || 1)) : (exp.initialBalance || 0);
        return base - paid;
    };
    return debtStrategy === 'nieve' ? getRest(a) - getRest(b) : (b.interestRate || 0) - (a.interestRate || 0);
  });

  const startEditing = (debt: Expense) => {
    setEditingId(debt.id);
    setEditForm(debt);
    setConfirmDeleteId(null);
  };

  const saveEdit = () => {
    if (editingId && editForm.name) {
      onUpdateExpense(editForm as Expense);
      setEditingId(null);
      setEditForm({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getDiagnostic = () => {
    if (totalIncomes === 0) return "No hay ingresos registrados para realizar el diagnóstico.";
    if (availableCash < 0) return "Déficit mensual crítico. Estás gastando más de lo que ganas.";
    if (debtRatio > 40) return "Nivel de compromiso financiero ALTO. Las cuotas consumen casi la mitad de tus ingresos.";
    return "Situación financiera saludable. Tienes control sobre tus deudas y cuotas.";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Selector de Fases */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <Target className="w-6 h-6 text-rose-500" />
            Estrategia Financiera Integral
          </h2>
          <p className="text-sm font-medium text-slate-400 mt-1">Plan de 3 fases para el éxito financiero.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActivePhase('diagnostico')} className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${activePhase === 'diagnostico' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>1. Diagnóstico</button>
          <button onClick={() => setActivePhase('ataque')} className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${activePhase === 'ataque' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>2. Ataque Deuda</button>
          <button onClick={() => setActivePhase('estabilizacion')} className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${activePhase === 'estabilizacion' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>3. Estabilización</button>
        </div>
      </div>

      {activePhase === 'diagnostico' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight"><Activity className="w-4 h-4 text-indigo-600" /> Flujo de Caja Mensual</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-sm font-bold text-emerald-800">Ingresos Totales</span>
                <span className="text-base font-black text-emerald-600">{formatCurrency(totalIncomes)}</span>
              </div>
              <div className="pt-4 border-t border-dashed border-slate-200">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Saldo Disponible</span>
                    <p className="text-[10px] text-slate-400 font-medium">Excedente libre tras compromisos.</p>
                  </div>
                  <span className={`text-xl font-black ${availableCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(availableCash)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight"><AlertCircle className="w-4 h-4 text-amber-500" /> Salud Financiera</h3>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-slate-500">Compromiso Total</span>
                  <span className={`text-sm font-black ${debtRatio > 30 ? 'text-rose-500' : 'text-emerald-500'}`}>{debtRatio.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className={`h-full transition-all duration-1000 ${debtRatio > 40 ? 'bg-rose-500' : debtRatio > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(debtRatio, 100)}%` }}></div>
                </div>
              </div>
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                <p className="text-sm text-indigo-900 font-medium italic"><Sparkles className="w-4 h-4 inline mr-2 text-indigo-500" />{getDiagnostic()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePhase === 'ataque' && (
        <div className="space-y-6 animate-fade-in">
          {/* Banner Resumen Deuda */}
          <div className="bg-gradient-to-br from-[#e11d48] to-[#9f1239] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            <div className="relative z-10 text-center md:text-left">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">TOTAL COMPROMISOS (CUOTAS + DEUDAS)</p>
              <h3 className="text-5xl font-black tracking-tighter">
                {formatCurrency(sortedDebts.reduce((sum, d) => {
                  const paid = payments.filter(p => p.expenseId === d.id).reduce((s, p) => s + p.amount, 0);
                  const base = d.isInstallment ? (d.amount * (d.totalInstallments || 1)) : (d.initialBalance || 0);
                  return sum + Math.max(0, base - paid);
                }, 0))}
              </h3>
            </div>
            <div className="relative z-10 mt-6 md:mt-0 bg-black/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 w-full md:w-auto">
               <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-center opacity-80">ESTRATEGIA ACTIVA</p>
               <div className="flex bg-black/20 p-1 rounded-xl gap-1">
                  <button onClick={() => setDebtStrategy('nieve')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${debtStrategy === 'nieve' ? 'bg-white text-[#e11d48] shadow-lg' : 'text-rose-100 hover:bg-white/5'}`}>
                    <Snowflake className="w-3.5 h-3.5" /> Nieve
                  </button>
                  <button onClick={() => setDebtStrategy('avalancha')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${debtStrategy === 'avalancha' ? 'bg-[#9f1239] text-white shadow-lg' : 'text-rose-100 hover:bg-white/5'}`}>
                    <Mountain className="w-3.5 h-3.5" /> Avalancha
                  </button>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight font-[Inter]">Cola de Liquidación (Cuotas y Deudas)</h3>
                </div>
                <div className="flex gap-2">
                    <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded border border-rose-100 uppercase">Deuda</span>
                    <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 uppercase">Cuotas / Tarjeta</span>
                </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-[Inter]">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 border-b border-slate-100">PRIORIDAD</th>
                      <th className="px-6 py-4 border-b border-slate-100">CONCEPTO</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-right">VALOR TOTAL</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-right">SALDO RESTANTE</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-center">PROGRESO</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-center">INTERÉS %</th>
                      <th className="px-6 py-4 border-b border-slate-100 text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedDebts.map((d, index) => {
                      const paid = payments.filter(p => p.expenseId === d.id).reduce((s, p) => s + p.amount, 0);
                      const base = d.isInstallment ? (d.amount * (d.totalInstallments || 1)) : (d.initialBalance || 0);
                      const remaining = Math.max(0, base - paid);
                      const progress = Math.min((paid / base) * 100, 100);

                      const isEditing = editingId === d.id;
                      const isConfirmingDelete = confirmDeleteId === d.id;

                      return (
                        <tr key={d.id} className={`hover:bg-slate-50/30 transition-colors group ${index === 0 && !isEditing ? 'bg-emerald-50/10' : ''} ${isEditing ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-white font-black text-xs">{index + 1}</div>
                                {d.isInstallment ? <CreditCard className="w-4 h-4 text-blue-500" /> : <Layers className="w-4 h-4 text-rose-500" />}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {isEditing ? (
                              <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500" />
                            ) : (
                              <>
                                <p className="font-bold text-slate-800">{d.name}</p>
                                <span className={`text-[9px] font-black uppercase ${d.isInstallment ? 'text-blue-500' : 'text-rose-500'}`}>
                                    {d.isInstallment ? `CUOTA ${d.currentInstallment}/${d.totalInstallments}` : 'DEUDA BANCARIA'}
                                </span>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            {isEditing ? (
                               <div className="text-right">
                                  <span className="text-[10px] text-slate-400 font-black uppercase block mb-1">Base Original</span>
                                  <input type="number" value={d.isInstallment ? editForm.amount : editForm.initialBalance} onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setEditForm(d.isInstallment ? {...editForm, amount: val} : {...editForm, initialBalance: val});
                                  }} className="w-32 px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-black bg-white outline-none text-right" />
                               </div>
                            ) : (
                              <span className="font-bold text-slate-400 text-sm">{formatCurrency(base)}</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            {!isEditing && (
                              <span className="font-black text-slate-900 text-lg">{formatCurrency(remaining)}</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            {!isEditing && (
                              <div className="flex flex-col gap-1.5 w-32 mx-auto">
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                                      <div className={`h-full ${d.isInstallment ? 'bg-blue-500' : 'bg-[#e11d48]'}`} style={{ width: `${progress}%` }}></div>
                                  </div>
                                  <span className="text-[9px] font-black text-center text-slate-400 uppercase tracking-tight">{progress.toFixed(0)}% PAGADO</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                             {isEditing ? (
                               <input type="number" step="0.01" value={editForm.interestRate} onChange={(e) => setEditForm({...editForm, interestRate: parseFloat(e.target.value) || 0})} className="w-16 px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold bg-white outline-none text-center" />
                             ) : (
                               <div className="flex items-center justify-center gap-1 font-black text-slate-700">
                                  {d.interestRate || 0}<span className="text-slate-400 text-[10px]">%</span>
                               </div>
                             )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-center min-w-[140px] h-full">
                               {isEditing ? (
                                 <div className="flex items-center gap-2 animate-fade-in">
                                   <button onClick={saveEdit} className="p-2 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 transition-all active:scale-95"><Check className="w-4 h-4" /></button>
                                   <button onClick={cancelEdit} className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all active:scale-95"><X className="w-4 h-4" /></button>
                                 </div>
                               ) : isConfirmingDelete ? (
                                 <div className="flex items-center gap-2 animate-fade-in bg-rose-50/80 px-3 py-1.5 rounded-xl border border-rose-100 shadow-sm">
                                   <span className="text-[11px] font-bold text-[#e11d48] whitespace-nowrap mr-1">¿Eliminar?</span>
                                   <div className="flex gap-1">
                                      <button onClick={() => { onDeleteExpense(d.id); setConfirmDeleteId(null); }} className="p-1.5 bg-rose-200/40 text-[#e11d48] hover:bg-[#e11d48] hover:text-white rounded-lg transition-all active:scale-90 shadow-sm"><Check className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setConfirmDeleteId(null)} className="p-1.5 bg-slate-100 text-slate-400 hover:bg-slate-400 hover:text-white rounded-lg transition-all active:scale-90"><X className="w-3.5 h-3.5" /></button>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                   <button onClick={() => startEditing(d)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all" title="Editar"><Pencil className="w-4 h-4" /></button>
                                   <button onClick={() => setConfirmDeleteId(d.id)} className="p-2 text-slate-300 hover:text-[#e11d48] hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                 </div>
                               )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {activePhase === 'estabilizacion' && (
        <div className="animate-fade-in bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Estabilización y Reservas</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">GASTOS ESENCIALES</p>
              <p className="text-2xl font-black text-slate-800">{formatCurrency(essentialMonthlyExpenses)}</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-inner">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">FONDO MÍNIMO (3M)</p>
              <p className="text-2xl font-black text-emerald-700">{formatCurrency(initialMeta)}</p>
            </div>
            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">FONDO IDEAL (6M)</p>
              <p className="text-2xl font-black text-indigo-700">{formatCurrency(idealMeta)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
