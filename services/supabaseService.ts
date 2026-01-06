
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

/**
 * =========================================================================
 * 🔑 CREDENCIALES SUPABASE (CONFIGURACIÓN VERCEL)
 * =========================================================================
 */
const CONFIG_KEY = 'CONTROL_JM_SUPABASE_CONFIG';
const MASTER_URL = 'https://yqeofawfjcspmutwfyz.supabase.co';

// PEGA AQUÍ TU CLAVE LARGA (Anon Key)
const MASTER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZW9mYXdmamNzcG11dHV3Znl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjE0MDgsImV4cCI6MjA4MzAzNzQwOH0.PSTnD-wV9t5zmghOEt17qYcM23n6UHbw9UDmHM-xsLw'; 

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const TABLE_NAME_MAP: Record<string, string> = {
  'expenses': 'expenses',
  'incomes': 'incomes',
  'goals': 'goals',
  'bankAccounts': 'bank_accounts',
  'payments': 'payments',
  'users': 'users'
};

const mapFromDB = (obj: any, tableName?: string) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const mapped: any = {};
  for (const key in obj) {
    let value = obj[key];
    const k = key.toLowerCase();
    
    if ((k === 'months' || k === 'transactions') && typeof value === 'string') {
      try { value = JSON.parse(value); } catch(e) { value = []; }
    }
    
    if (k === 'id') mapped['id'] = value;
    else if (k === 'userid') mapped['userId'] = value;
    else if (k === 'expenseid') mapped['expenseId'] = value;
    else if (k === 'gastonombre') {
        mapped['name'] = value;
        mapped['expenseName'] = value;
    } 
    else if (k === 'targetamount') mapped['targetAmount'] = value;
    else if (k === 'currentamount') mapped['currentAmount'] = value;
    else if (k === 'isinstallment') mapped['isInstallment'] = value;
    else if (k === 'totalinstallments') mapped['totalInstallments'] = value;
    else if (k === 'currentinstallment') mapped['currentInstallment'] = value;
    else if (k === 'startdate') mapped['startDate'] = value;
    else if (k === 'initialbalance') mapped['initialBalance'] = value;
    else if (k === 'interestrate') mapped['interestRate'] = value;
    else if (k === 'discountamount') mapped['discountAmount'] = value;
    else if (k === 'discountgoalid') mapped['discountGoalId'] = value;
    else {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      mapped[camelKey] = value;
    }
  }
  return mapped;
};

const mapToDB = (obj: any, tableName: string) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const mapped: any = {};
  for (const key in obj) {
    const value = obj[key];
    const k = key.toLowerCase();
    
    if (k === 'id') mapped['id'] = value;
    else if (k === 'userid' || key === 'userId') mapped['userid'] = value;
    else if (k === 'expenseid' || key === 'expenseId') mapped['expenseid'] = value;
    else if (tableName === 'expenses' && (k === 'name' || key === 'expenseName' || key === 'gastonombre')) {
      mapped['gastonombre'] = value;
    } 
    else if (k === 'targetamount' || key === 'targetAmount') mapped['targetamount'] = value;
    else if (k === 'currentamount' || key === 'currentAmount') mapped['currentamount'] = value;
    else if (k === 'isinstallment' || key === 'isInstallment') mapped['isinstallment'] = value;
    else if (k === 'totalinstallments' || key === 'totalInstallments') mapped['totalinstallments'] = value;
    else if (k === 'currentinstallment' || key === 'currentInstallment') mapped['currentinstallment'] = value;
    else if (k === 'startdate' || key === 'startDate') mapped['startdate'] = value;
    else if (k === 'initialbalance' || key === 'initialBalance') mapped['initialbalance'] = value;
    else if (k === 'interestrate' || key === 'interestRate') mapped['interestrate'] = value;
    else if (k === 'discountamount' || key === 'discountAmount') mapped['discountamount'] = value;
    else if (k === 'discountgoalid' || key === 'discountGoalId') mapped['discountgoalid'] = value;
    else if (k === 'months' || k === 'transactions') {
      mapped[k] = Array.isArray(value) ? JSON.stringify(value) : value;
    } else {
      mapped[k] = value;
    }
  }
  return mapped;
};

let supabaseInstance: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

export const supabaseService = {
  getConfig(): SupabaseConfig {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.anonKey && parsed.anonKey.length > 50) return parsed;
      } catch (e) {}
    }
    return { 
      url: MASTER_URL.trim().replace(/\/+$/, ''), 
      anonKey: MASTER_KEY.trim() 
    };
  },

  saveConfig(config: SupabaseConfig) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      url: config.url.trim().replace(/\/+$/, ''),
      anonKey: config.anonKey.trim()
    }));
    supabaseInstance = null;
  },

  getClient(): SupabaseClient | null {
    if (!this.isConfigured()) return null;
    if (supabaseInstance) return supabaseInstance;
    const config = this.getConfig();
    supabaseInstance = createClient(config.url, config.anonKey);
    return supabaseInstance;
  },

  isConfigured() { 
    const config = this.getConfig();
    return config.anonKey && config.anonKey.length > 50 && config.anonKey !== 'TU_ANON_KEY_AQUI'; 
  },

  async fetchAll(userId?: string) {
    const client = this.getClient();
    if (!client) return null;
    try {
      const fetchTable = async (appTable: string) => {
        const dbTable = TABLE_NAME_MAP[appTable] || appTable;
        let query = client.from(dbTable).select('*');
        if (userId) query = query.eq('userid', userId);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []).map(item => mapFromDB(item, appTable));
      };
      
      const [expenses, incomes, goals, bankAccounts, payments] = await Promise.all([
        fetchTable('expenses'), fetchTable('incomes'), fetchTable('goals'), fetchTable('bankAccounts'), fetchTable('payments')
      ]);
      
      return { expenses, incomes, goals, bankAccounts, payments };
    } catch (e: any) { 
        console.warn("Error de Red Supabase (Sincronización deshabilitada):", e.message);
        return null; 
    }
  },

  async saveItem(table: string, item: any) {
    const client = this.getClient();
    if (!client) return;
    try {
      const tableName = TABLE_NAME_MAP[table] || table;
      await client.from(tableName).upsert(mapToDB(item, tableName));
    } catch (e) {}
  },

  async deleteItem(table: string, id: string) {
    const client = this.getClient();
    if (!client) return;
    try {
      const tableName = TABLE_NAME_MAP[table] || table;
      await client.from(tableName).delete().eq('id', id);
    } catch (e) {}
  },

  async initialSync(table: string, items: any[]) {
    const client = this.getClient();
    if (!client || items.length === 0) return;
    try {
      const tableName = TABLE_NAME_MAP[table] || table;
      const dbItems = items.map(item => mapToDB(item, tableName));
      await client.from(tableName).upsert(dbItems);
    } catch (e) {}
  },

  subscribeToChanges(userId: string, onUpdate: () => void) {
    if (!this.isConfigured()) return () => {};
    const client = this.getClient();
    if (!client) return () => {};
    try {
      if (realtimeChannel) client.removeChannel(realtimeChannel);
      realtimeChannel = client.channel(`db-changes-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public' }, () => onUpdate())
        .subscribe();
      return () => { if (realtimeChannel) client.removeChannel(realtimeChannel); };
    } catch (e) {
      return () => {};
    }
  }
};
