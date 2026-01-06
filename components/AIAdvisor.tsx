
import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react';
import { getFinancialAdvice } from '../services/geminiService';
import { Expense, Payment, Goal } from '../types';

interface AIAdvisorProps {
  expenses: Expense[];
  payments: Payment[];
  goals: Goal[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ expenses, payments, goals }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleGetAdvice = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await getFinancialAdvice(expenses, payments, goals);
      setAdvice(result);
      if (result.includes("ERROR") || result.includes("Error") || result.includes("⚠️")) {
        setError(true);
      }
    } catch (e) {
      setAdvice("No se pudo conectar con la IA. Por favor, intenta de nuevo.");
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-violet-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-5 sm:p-10 text-white mb-8 relative overflow-hidden group border border-white/10 mx-1 sm:mx-0">
      {/* Fondo Decorativo para móviles */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full blur-2xl sm:blur-3xl transition-all duration-700"></div>
      
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6 relative z-10 text-center md:text-left">
        <div className="bg-white/20 p-4 sm:p-5 rounded-3xl backdrop-blur-md border border-white/30 shadow-inner shrink-0 animate-bounce-slow mt-2 sm:mt-0">
          <Sparkles className={`w-8 h-8 sm:w-10 sm:h-10 ${loading ? 'animate-pulse text-yellow-200' : 'text-yellow-300'}`} />
        </div>
        
        <div className="flex-1 space-y-4 sm:space-y-5 w-full">
          <div className="px-2 sm:px-0">
            <h2 className="text-xl sm:text-3xl font-black mb-1 uppercase tracking-tighter flex items-center justify-center md:justify-start gap-2 sm:gap-3 flex-wrap">
              Asesoría Inteligente
              <span className="bg-indigo-500/50 text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-lg border border-indigo-400/30 font-black">PRO</span>
            </h2>
            <p className="text-indigo-100/70 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mx-auto md:mx-0">
              Estrategias financieras personalizadas impulsadas por Gemini 3 Flash.
            </p>
          </div>
          
          {!advice && !loading && (
            <div className="px-2 sm:px-0">
              <button
                onClick={handleGetAdvice}
                className="w-full sm:w-auto bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl hover:shadow-indigo-900/30 flex items-center justify-center gap-3 active:scale-95 border-b-4 border-indigo-100"
              >
                <Lightbulb className="w-5 h-5" /> Generar Consejos
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center md:items-start gap-3 py-2 px-2 sm:px-0">
              <div className="flex items-center gap-3 text-indigo-100 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-300" />
                <span>Analizando tus finanzas...</span>
              </div>
              <div className="w-full max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-yellow-300 h-full animate-[progress_1.5s_infinite]" style={{width: '60%'}}></div>
              </div>
            </div>
          )}

          {advice && !loading && (
            <div className={`mt-2 p-5 sm:p-8 rounded-[1.8rem] sm:rounded-[2.2rem] backdrop-blur-lg border animate-fade-in text-left ${
              error ? 'bg-rose-500/20 border-rose-400/30 text-rose-100' : 'bg-white/10 border-white/20 text-indigo-50 shadow-inner'
            }`}>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-line leading-relaxed font-bold text-sm sm:text-base">
                  {error && <AlertCircle className="w-5 h-5 inline mr-2 mb-1 text-rose-400" />}
                  {advice}
                </div>
              </div>
              
              {!error && (
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-5 sm:pt-6 gap-4">
                  <button
                      onClick={handleGetAdvice}
                      className="w-full sm:w-auto text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 hover:text-white flex items-center justify-center gap-2.5 transition-colors py-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Nuevo Análisis
                  </button>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">AI Engine: Gemini 3 Flash</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-bounce-slow {
          animation: bounce 3s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
