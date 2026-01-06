
import React, { useState, useEffect } from 'react';
import { CheckCircle2, Calendar, DollarSign, Pencil, Trash2, X, Save, Sparkles, Percent, ArrowRight, Target, Landmark, Zap, ListFilter, LayoutGrid } from 'lucide-react';
import { Expense, Payment, Goal, BankAccount, formatCurrency, CATEGORIES } from '../types';

interface PaymentRegisterProps {
  userId: string;
  expenses: Expense[];
  payments: Payment[];
  goals: Goal[];
  bankAccounts: BankAccount[];
  onAddPayment: (payment: Payment) => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment: (id: string) => void;
  onUpdateGoal: (goal: Goal) => void;
  onUpdateBankAccount: (account: BankAccount) => void;
  selectedYear: number;
}

export const PaymentRegister: React.FC<PaymentRegisterProps> = ({ 
  userId,
  expenses, 
  payments, 
  goals,
  bankAccounts,
  onAddPayment, 
  onUpdatePayment,
  onDeletePayment,
  onUpdateGoal,
  onUpdateBankAccount,
  selectedYear 
}) => {
  const [isAdHoc, setIsAdHoc] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('');
  const [adHocName, setAdHocName] = useState('');
  const [adHocCategory, setAdHocCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<string>(''); 
  
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('0');
  const [targetGoalId, setTargetGoalId] = useState('');
  const [targetBankAccountId, setTargetBankAccountId] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const currentMonth = new Date().getMonth();
  const displayYear = selectedYear;
  
  useEffect(() => {
     const currentDate = new Date();
     const y = selectedYear;
     const m = String(currentDate.getMonth() + 1).padStart(2, '0');
     const d = String(currentDate.getDate()).padStart(2, '0');
     setPaymentDate(`${y}-${m}-${d}`);
  }, [selectedYear]);
  
  const recentPayments = payments.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === currentMonth && d.getFullYear() === displayYear;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const getExpenseName = (id: string) => {
    if (id === 'ad-hoc') return 'Pago Libre';
    const expense = expenses.find(e => e.id === id);
    return expense ? expense.name : 'Desconocido';
  };

  const calculatedDiscountValue = () => {
      const p = parseFloat(discountPercent) || 0;
      const a = parseFloat(amount) || 0;
      if (p <= 0 || a <= 0) return 0;
      return a * (p / 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !paymentDate) return;
    if (!isAdHoc && !selectedExpenseId) return;
    if (isAdHoc && !adHocName) return;

    const isoDate = new Date(paymentDate + 'T12:00:00').toISOString();
    const discountVal = hasDiscount ? calculatedDiscountValue() : 0;
    
    let finalExpenseId = selectedExpenseId;
    let finalExpenseName = getExpenseName(selectedExpenseId);
    let finalCategory = '';

    if (isAdHoc) {
      finalExpenseId = 'ad-hoc';
      finalExpenseName = adHocName;
      finalCategory = adHocCategory;
    } else {
      const exp = expenses.find(e => e.id === selectedExpenseId);
      finalCategory = exp?.category || 'Otros';
    }

    const paymentData: Payment = {
      id: editingId || generateId(),
      userId,
      expenseId: finalExpenseId,
      expenseName: finalExpenseName,
      category: finalCategory,
      amount: parseFloat(amount),
      date: isoDate,
      discountAmount: discountVal > 0 ? discountVal : undefined,
      discountGoalId: hasDiscount && targetGoalId ? targetGoalId : undefined
    };

    if (editingId) {
        onUpdatePayment(paymentData);
        setEditingId(null);
    } else {
        onAddPayment(paymentData);
        
        if (hasDiscount && discountVal > 0 && targetGoalId && targetBankAccountId) {
            const selectedGoal = goals.find(g => g.id === targetGoalId);
            if (selectedGoal) {
                const newTransaction = {
                    id: generateId(),
                    amount: discountVal,
                    date: isoDate,
                    bankAccountId: targetBankAccountId,
                    note: `Ahorro por dcto (${discountPercent}%) en ${finalExpenseName}`
                };
                onUpdateGoal({
                    ...selectedGoal,
                    currentAmount: (selectedGoal.currentAmount || 0) + discountVal,
                    transactions: [...(selectedGoal.transactions || []), newTransaction]
                });
            }

            const selectedBank = bankAccounts.find(b => b.id === targetBankAccountId);
            if (selectedBank) {
                onUpdateBankAccount({
                    ...selectedBank,
                    balance: (selectedBank.balance || 0) + discountVal
                });
            }
        }
    }

    setAmount('');
    setSelectedExpenseId('');
    setAdHocName('');
    setHasDiscount(false);
    setDiscountPercent('0');
    setTargetGoalId('');
    setTargetBankAccountId('');
  };

  const handleEdit = (payment: Payment) => {
      setEditingId(payment.id);
      if (payment.expenseId === 'ad-hoc') {
        setIsAdHoc(true);
        setAdHocName(payment.expenseName);
        setAdHocCategory(payment.category || CATEGORIES[0]);
      } else {
        setIsAdHoc(false);
        setSelectedExpenseId(payment.expenseId);
      }
      setAmount(payment.amount.toString());
      setPaymentDate(new Date(payment.date).toISOString().split('T')[0]);
      setHasDiscount(!!payment.discountAmount);
      setDiscountPercent('0');
  };

  const handleCancel = () => {
      setEditingId(null);
      setAmount('');
      setSelectedExpenseId('');
      setAdHocName('');
      setHasDiscount(false);
  };

  const isExpenseActiveThisMonth = (e: Expense) => !e.months || e.months.includes(currentMonth);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-1 space-y-6">
        <div className={`p-6 rounded-2xl shadow-sm border transition-all ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-black flex items-center gap-2 uppercase tracking-tight ${editingId ? 'text-indigo-800' : 'text-slate-800'}`}>
              {editingId ? <Pencil className="w-5 h-5 text-indigo-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {editingId ? 'Editar Pago' : 'Registrar Pago'}
            </h2>
            
            {!editingId && (
              <button 
                onClick={() => setIsAdHoc(!isAdHoc)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  isAdHoc ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isAdHoc ? <Zap className="w-3 h-3" /> : <ListFilter className="w-3 h-3" />}
                {isAdHoc ? 'Pago Libre' : 'Programado'}
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {isAdHoc ? (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Nombre del Gasto Libre</label>
                  <input
                    type="text"
                    value={adHocName}
                    onChange={(e) => setAdHocName(e.target.value)}
                    placeholder="Ej. Reparación, Regalo..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Categoría del Gasto</label>
                  <select
                    value={adHocCategory}
                    onChange={(e) => setAdHocCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white text-slate-900 font-bold outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Gasto Programado</label>
                <select
                  value={selectedExpenseId}
                  onChange={(e) => setSelectedExpenseId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 font-bold outline-none"
                  required
                >
                  <option value="">-- Seleccionar Gasto --</option>
                  {expenses.filter(isExpenseActiveThisMonth).map(expense => (
                      <option key={expense.id} value={expense.id}>{expense.name} ({formatCurrency(expense.amount)})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Monto Pagado</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 font-black outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Fecha</label>
                    <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 text-xs font-bold outline-none"
                        required
                    />
                </div>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${hasDiscount ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${hasDiscount ? 'bg-amber-500' : 'bg-slate-300'}`}>
                        <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="hidden" />
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${hasDiscount ? 'left-6' : 'left-1'}`}></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className={`w-3.5 h-3.5 ${hasDiscount ? 'text-amber-500' : 'text-slate-400'}`} />
                        ¿Hubo un descuento?
                    </span>
                </label>

                {hasDiscount && (
                    <div className="mt-4 space-y-4 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="block text-[9px] font-black text-amber-700 mb-1 uppercase tracking-tighter">Porcentaje (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={discountPercent} 
                                        onChange={(e) => setDiscountPercent(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-amber-200 rounded-lg bg-white text-sm font-black text-amber-900 outline-none"
                                    />
                                    <Percent className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-amber-400" />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-end h-[44px]">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Ahorro capturado:</p>
                                <p className="text-sm font-black text-emerald-600">{formatCurrency(calculatedDiscountValue())}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-amber-700 mb-1 uppercase tracking-tighter">Depositar Ahorro en Banco:</label>
                            <select
                                value={targetBankAccountId}
                                onChange={(e) => setTargetBankAccountId(e.target.value)}
                                className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white text-xs font-bold text-amber-900 outline-none mb-3"
                                required={hasDiscount}
                            >
                                <option value="">-- Seleccionar Banco --</option>
                                {bankAccounts.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.name} (Saldo: {formatCurrency(bank.balance)})</option>
                                ))}
                            </select>

                            <label className="block text-[9px] font-black text-amber-700 mb-1 uppercase tracking-tighter">Vincular a Meta:</label>
                            <select
                                value={targetGoalId}
                                onChange={(e) => setTargetGoalId(e.target.value)}
                                className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white text-xs font-bold text-amber-900 outline-none"
                                required={hasDiscount}
                            >
                                <option value="">-- Seleccionar Meta --</option>
                                {goals.map(goal => (
                                    <option key={goal.id} value={goal.id}>{goal.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    className="flex-1 bg-slate-900 hover:bg-black text-white py-3.5 rounded-2xl font-black transition-all shadow-lg flex justify-center items-center gap-2 active:scale-95"
                >
                    {editingId ? <Save className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    {editingId ? 'ACTUALIZAR' : (isAdHoc ? 'REGISTRAR LIBRE' : 'REGISTRAR PAGO')}
                </button>
                {editingId && (
                    <button onClick={handleCancel} className="px-4 bg-slate-200 text-slate-600 rounded-2xl hover:bg-slate-300 transition-all"><X className="w-5 h-5" /></button>
                )}
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
             <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
               <Calendar className="w-4 h-4 text-indigo-500" />
               Pagos del Mes ({selectedYear})
             </h3>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Programado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Libre</span>
                </div>
             </div>
           </div>
           
           {recentPayments.length === 0 ? (
             <div className="p-20 text-center text-slate-300">
               <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-10" />
               <p className="text-xs font-black uppercase tracking-widest italic">No hay pagos registrados este mes</p>
             </div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                   <tr>
                     <th className="px-6 py-4">Concepto / Categoría</th>
                     <th className="px-6 py-4 text-right">Monto</th>
                     <th className="px-6 py-4 text-center">Tipo de Gasto</th>
                     <th className="px-6 py-4 text-center">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {recentPayments.map((payment) => (
                     <tr key={payment.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           {payment.expenseId === 'ad-hoc' ? (
                             <Zap className="w-3.5 h-3.5 text-amber-500" />
                           ) : (
                             <ListFilter className="w-3.5 h-3.5 text-emerald-500" />
                           )}
                           <p className="font-bold text-slate-800">{payment.expenseName}</p>
                         </div>
                         <div className="flex items-center gap-2 mt-0.5 ml-5">
                           <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{payment.category || 'Sin categoría'}</span>
                           <span className="text-slate-200 text-[8px]">•</span>
                           <p className="text-[10px] text-slate-400 font-medium">{new Date(payment.date).toLocaleDateString()}</p>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-right font-black text-slate-900">
                         {formatCurrency(payment.amount)}
                       </td>
                       <td className="px-6 py-4 text-center">
                           {payment.discountAmount ? (
                               <div className="flex flex-col items-center gap-1">
                                   <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm">
                                       <Sparkles className="w-3 h-3" /> +{formatCurrency(payment.discountAmount)}
                                   </div>
                               </div>
                           ) : (
                               <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                 payment.expenseId === 'ad-hoc' 
                                   ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                   : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                               }`}>
                                 {payment.expenseId === 'ad-hoc' ? 'Imprevisto' : 'Fijo'}
                               </span>
                           )}
                       </td>
                       <td className="px-6 py-4">
                           <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handleEdit(payment)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl shadow-sm"><Pencil className="w-4 h-4" /></button>
                               <button onClick={() => onDeletePayment(payment.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 rounded-xl shadow-sm"><Trash2 className="w-4 h-4" /></button>
                           </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                        <Zap className="w-6 h-6 text-yellow-300" />
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Pagos Libres y Flexibilidad</h4>
                </div>
                <p className="text-indigo-50 text-sm max-w-md leading-relaxed font-medium">
                    Ahora puedes registrar gastos que <span className="text-white font-black">no están en tu lista fija</span>. Esto te permite tener un control total de gastos hormiga, imprevistos o compras especiales sin alterar tu presupuesto programado.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 min-w-[150px]">
                        <p className="text-[9px] font-black uppercase text-indigo-200">Gasto Libre Mes</p>
                        <p className="text-xl font-black">{formatCurrency(recentPayments.filter(p => p.expenseId === 'ad-hoc').reduce((sum, p) => sum + p.amount, 0))}</p>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 min-w-[150px]">
                        <p className="text-[9px] font-black uppercase text-indigo-200">Total Transacciones</p>
                        <p className="text-xl font-black">{recentPayments.length}</p>
                    </div>
                </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};
