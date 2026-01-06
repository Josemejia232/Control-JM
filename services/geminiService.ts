
import { GoogleGenAI } from "@google/genai";
import { Expense, Goal, Payment, formatCurrency } from "../types";

export const getFinancialAdvice = async (
  expenses: Expense[],
  payments: Payment[],
  goals: Goal[]
): Promise<string> => {
  // Use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const goalProgress = goals.map(g => `${g.name}: ${Math.round(((g.currentAmount || 0)/g.targetAmount)*100)}%`).join(", ");
  
  const prompt = `
    Analiza las finanzas de "CONTROL JM":
    - Gastos Programados: ${expenses.length} (Total: ${formatCurrency(totalExpense)})
    - Pagos Realizados este mes: ${formatCurrency(totalPaid)}
    - Metas de Ahorro: ${goals.length} (${goalProgress || 'Sin metas'})
    
    Genera 3 consejos financieros breves, directos y con emojis. Prioriza el ahorro y responde en español de forma experta.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
        topK: 64
      }
    });

    // Access .text property directly
    return response.text || "La IA no devolvió texto. Intenta de nuevo.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "El motor de IA está ocupado. Por favor, intenta de nuevo en unos segundos.";
  }
};
