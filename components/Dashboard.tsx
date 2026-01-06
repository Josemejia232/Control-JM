
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Wallet, Target, CreditCard, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar
} from 'lucide-react';
import { Expense, Payment, Goal, Income, formatCurrency, MONTH_NAMES_SHORT } from '../types';

interface DashboardProps {
  expenses: Expense[];
  payments: Payment[];
  goals: Goal[];
  incomes: Income[];
  selectedYear: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  expenses, payments, goals, incomes, selectedYear 
}) => {
  
  const timelineData = MONTH_NAMES_SHORT.map((month, index) => {
    const monthlyIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const monthlyPlanned = expenses.filter(e => !e.months || e.months.includes(index)).reduce((sum, e) => sum + e.amount, 0);
    const monthlyPaid = payments.filter(p => { 
      const d = new Date(p.date); 
      return d.getMonth() === index && d.getFullYear() === selectedYear; 
    }).reduce((sum, p) => sum + p.amount, 0);
    
    return { 
      name: month, 
      Ingresos: monthlyIncome, 
      Gastos: monthlyPlanned, 
      Pagos: monthlyPaid 
    };
  });

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalFixedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSavings = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const activeDebts = expenses.filter(e => e.category === 'Deudas' || e.isInstallment).length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Dashboard</h2>
        <p className="text-slate-400 font-bold text-[10px] flex items-center gap-2 uppercase tracking-[0.2em]">
          <Activity className="w-3.5 h-3.5 text-indigo-500" /> Rendimiento {selectedYear}
        </p>
      </div>

      {/* Métricas: 1 columna en móvil, 2 en tablet, 4 en desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard title="Ingresos" value={formatCurrency(totalIncome)} icon={<Wallet className="w-6 h-6 text-emerald-600" />} color="bg-emerald-50" trend="+2.5%" trendUp={true} />
        <MetricCard title="Gastos Fijos" value={formatCurrency(totalFixedExpenses)} icon={<TrendingDown className="w-6 h-6 text-rose-600" />} color="bg-rose-50" trend="-1.2%" trendUp={false} />
        <MetricCard title="Ahorro Total" value={formatCurrency(totalSavings)} icon={<Target className="w-6 h-6 text-blue-600" />} color="bg-blue-50" trend="Estable" trendUp={true} />
        <MetricCard title="Deudas Activas" value={`${activeDebts}`} icon={<CreditCard className="w-6 h-6 text-indigo-600" />} color="bg-indigo-50" trend="Control" trendUp={true} />
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Comparativa de Flujo Mensual</h3>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingresos vs Gastos vs Pagos Reales</p>
        </div>
        
        <div className="h-[300px] w-full -ml-4 sm:ml-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                  fontWeight: 800, 
                  fontSize: '11px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)'
                }} 
                formatter={(value: number) => [formatCurrency(value), ""]}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ 
                  fontWeight: 800, 
                  fontSize: '9px', 
                  textTransform: 'uppercase', 
                  marginBottom: '20px' 
                }} 
              />
              <Line type="monotone" name="Ingresos" dataKey="Ingresos" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Gastos Programados" dataKey="Gastos" stroke="#6366f1" strokeWidth={4} dot={false} />
              <Line type="monotone" name="Pagos Reales" dataKey="Pagos" stroke="#f59e0b" strokeWidth={4} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Estado Anual</h3>
          <div className="space-y-6">
            <ProgressBar label="Capacidad de Ingreso" percent={100} amount={totalIncome} color="bg-emerald-500" />
            <ProgressBar label="Nivel de Gasto Planificado" percent={Math.min((totalFixedExpenses / totalIncome) * 100, 100)} amount={totalFixedExpenses} color="bg-indigo-500" />
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden flex items-center">
          <div className="relative z-10 w-full">
            <h3 className="text-xl font-black uppercase tracking-tight mb-4">Eficiencia Financiera</h3>
            <div className="flex items-center gap-6">
              <div className="bg-white/10 p-5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 text-center">Ratio Deuda</p>
                <p className="text-3xl font-black text-center">{totalIncome > 0 ? ((totalFixedExpenses / totalIncome) * 100).toFixed(1) : 0}%</p>
              </div>
              <p className="text-xs font-medium leading-relaxed opacity-70">
                Tu salud financiera es <span className="text-emerald-400 font-black">óptima</span> si este valor se mantiene bajo el 35%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, trend, trendUp }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 hover:scale-[1.02] transition-all cursor-default">
    <div className="flex items-center justify-between mb-4">
      <div className={`${color} p-3 rounded-2xl`}>{icon}</div>
      <div className={`flex items-center gap-1 text-[9px] font-black uppercase ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend}
      </div>
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-800 tracking-tighter">{value}</p>
  </div>
);

const ProgressBar = ({ label, percent, amount, color }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-black text-slate-800">{formatCurrency(amount)}</span>
    </div>
    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
      <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);
