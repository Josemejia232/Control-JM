
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Expense, Payment, Goal, Income, BankAccount } from '../types';
import { supabaseService } from './supabaseService';

interface FinanceDB extends DBSchema {
  expenses: { key: string; value: Expense; };
  payments: { key: string; value: Payment; indexes: { 'by-expense': string; 'by-date': string }; };
  goals: { key: string; value: Goal; };
  incomes: { key: string; value: Income; };
  bankAccounts: { key: string; value: BankAccount; };
}

const DB_NAME = 'ControlJM_DB_V10';
const DB_VERSION = 1;

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<FinanceDB>>;

  constructor() {
    this.dbPromise = openDB<FinanceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('expenses')) db.createObjectStore('expenses', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('payments')) {
          const s = db.createObjectStore('payments', { keyPath: 'id' });
          s.createIndex('by-expense', 'expenseId');
          s.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('goals')) db.createObjectStore('goals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('incomes')) db.createObjectStore('incomes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('bankAccounts')) db.createObjectStore('bankAccounts', { keyPath: 'id' });
      },
    });
  }

  async getAll<T>(storeName: any): Promise<T[]> {
    const db = await this.dbPromise;
    return db.getAll(storeName) as Promise<T[]>;
  }

  async manualSync(userId: string): Promise<boolean> {
    if (!supabaseService.isConfigured()) {
      throw new Error("Supabase no está configurado. Por favor, verifica tu Anon Key.");
    }
    try {
      const stores = ['expenses', 'payments', 'goals', 'incomes', 'bankAccounts'] as const;
      const db = await this.dbPromise;

      for (const s of stores) {
        const localItems = await db.getAll(s);
        const userItems = localItems.filter(item => (item as any).userId === userId);
        if (userItems.length > 0) {
          await supabaseService.initialSync(s, userItems);
        }
      }

      const cloudData = await supabaseService.fetchAll(userId);
      if (!cloudData) return false;

      for (const s of stores) {
        const cloudItems = (cloudData as any)[s];
        if (cloudItems && Array.isArray(cloudItems)) {
            for (const item of cloudItems) {
                await db.put(s, item);
            }
        }
      }
      return true;
    } catch (error: any) {
      throw error;
    }
  }

  async syncFromCloud(userId: string): Promise<boolean> {
      if (!supabaseService.isConfigured()) return false;
      try {
        const cloudData = await supabaseService.fetchAll(userId);
        if (!cloudData) return false;
        const stores = ['expenses', 'payments', 'goals', 'incomes', 'bankAccounts'] as const;
        const db = await this.dbPromise;
        for (const s of stores) {
          const cloudItems = (cloudData as any)[s];
          if (cloudItems && Array.isArray(cloudItems)) {
            for (const item of cloudItems) {
              await db.put(s, item);
            }
          }
        }
        return true;
      } catch (error) { 
        return false; 
      }
  }

  async save(storeName: any, item: any): Promise<void> {
    const db = await this.dbPromise;
    await db.put(storeName, item);
    try {
      if (supabaseService.isConfigured()) {
        await supabaseService.saveItem(storeName, item);
      }
    } catch (e: any) {}
  }

  async delete(storeName: any, id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(storeName, id);
    try {
      if (supabaseService.isConfigured()) {
        await supabaseService.deleteItem(storeName, id);
      }
    } catch (e) {}
  }
}

export const db = new DatabaseService();
