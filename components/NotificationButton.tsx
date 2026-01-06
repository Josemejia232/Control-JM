import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, Clock, Calendar, X } from 'lucide-react';
import { Expense, Payment, formatCurrency, WEEKS } from '../types';

interface NotificationButtonProps {
  expenses: Expense[];
  payments: Payment[];
}

type AlertType = 'overdue' | 'due_now' | 'upcoming';

interface Alert {
  type: AlertType;
  expense: Expense;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({ expenses, payments }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- LOGIC ---
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // Determine current week identifier (S1, S2, S3, S4)
  let currentWeekStr = 'S1';
  if (currentDay > 7) currentWeekStr = 'S2';
  if (currentDay > 14) currentWeekStr = 'S3';
  if (currentDay > 21) currentWeekStr = 'S4';

  const weekOrder: Record<string, number> = { 'S1': 1, 'S2': 2, 'S3': 3, 'S4': 4 };
  const currentWeekVal = weekOrder[currentWeekStr];

  // Filter expenses relevant to CURRENT REAL TIME (Year & Month)
  const activeExpenses = expenses.filter(e => 
    e.year === currentYear && 
    (!e.months || e.months.includes(currentMonth))
  );

  const alerts: Alert[] = [];

  activeExpenses.forEach(expense => {
    // Check if paid in current month/year
    const isPaid = payments.some(p => {
      const pDate = new Date(p.date);
      return p.expenseId === expense.id && 
             pDate.getMonth() === currentMonth && 
             pDate.getFullYear() === currentYear;
    });

    if (!isPaid) {
      const expenseWeekVal = weekOrder[expense.week || 'S1'] || 1;
      
      if (expenseWeekVal < currentWeekVal) {
        alerts.push({ type: 'overdue', expense });
      } else if (expenseWeekVal === currentWeekVal) {
        alerts.push({ type: 'due_now', expense });
      } else if (expenseWeekVal === currentWeekVal + 1) {
        // Only show upcoming if it's the immediate next week
        alerts.push({ type: 'upcoming', expense });
      }
    }
  });

  // Sort alerts: Overdue first, then Due Now, then Upcoming
  const priorityOrder: Record<AlertType, number> = { 'overdue': 0, 'due_now': 1, 'upcoming': 2 };
  alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

  const urgentCount = alerts.filter(a => a.type === 'overdue' || a.type === 'due_now').length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
        aria-label="Notificaciones de pago"
      >
        <Bell className={`w-6 h-6 ${urgentCount > 0 ? 'text-slate-700' : 'text-slate-400'}`} />
        {urgentCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {urgentCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Notificaciones de Pago</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">¡Todo al día! No tienes pagos pendientes urgentes.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <div key={alert.expense.id} className={`p-4 flex gap-3 ${alert.type === 'overdue' ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                     <div className={`mt-1 p-1.5 rounded-full h-fit shrink-0 
                        ${alert.type === 'overdue' ? 'bg-red-100 text-red-600' : 
                          alert.type === 'due_now' ? 'bg-amber-100 text-amber-600' : 
                          'bg-blue-50 text-blue-500'}`}
                     >
                        {alert.type === 'overdue' ? <AlertCircle className="w-4 h-4" /> : 
                         alert.type === 'due_now' ? <Clock className="w-4 h-4" /> : 
                         <Calendar className="w-4 h-4" />}
                     </div>
                     
                     <div className="flex-1">
                       <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-slate-800">{alert.expense.name}</span>
                          <span className="text-xs font-bold text-slate-600">{formatCurrency(alert.expense.amount)}</span>
                       </div>
                       <p className="text-xs text-slate-500 mb-1">
                          Semana programada: <span className="font-medium">{alert.expense.week}</span>
                       </p>
                       <div className="flex items-center gap-2">
                          {alert.type === 'overdue' && (
                            <span className="text-[10px] font-bold uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded">
                              Vencido
                            </span>
                          )}
                          {alert.type === 'due_now' && (
                            <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                              Vence esta semana
                            </span>
                          )}
                          {alert.type === 'upcoming' && (
                            <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                              Próximo
                            </span>
                          )}
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
                Semana actual: <span className="font-semibold">{currentWeekStr}</span> • {today.toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function CheckCircle2(props: any) {
    return (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
}
