
import { Expense, Payment, Goal, Income, BankAccount } from '../types';

const CONFIG_KEY = 'FINANZASN8.1_BASEROW_CONFIG';

export interface BaserowConfig {
  host: string;
  token: string;
  databaseId: string;
  tableIds: {
    expenses?: number;
    payments?: number;
    goals?: number;
    incomes?: number;
    bankAccounts?: number;
  };
}

const TABLE_SCHEMAS: Record<string, string[]> = {
  expenses: ['uuid', 'name', 'amount', 'category', 'week', 'year', 'isInstallment', 'totalInstallments', 'currentInstallment', 'months'],
  incomes: ['uuid', 'name', 'amount', 'category'],
  goals: ['uuid', 'name', 'targetAmount', 'currentAmount', 'transactions'],
  bankAccounts: ['uuid', 'name', 'type'],
  payments: ['uuid', 'amount', 'date', 'expenseId', 'discountAmount', 'discountGoalId', 'note']
};

const fieldIdCache: Record<number, Record<string, number>> = {};

export const api = {
  getConfig: (): BaserowConfig | null => {
    const saved = localStorage.getItem(CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  saveConfig: (config: BaserowConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  isConfigured: () => {
    const config = api.getConfig();
    return !!(config?.token && config?.databaseId && config?.tableIds?.expenses);
  },

  async request(endpoint: string, method: string = 'GET', body?: any, overrideToken?: string) {
    const config = this.getConfig();
    // Si estamos en setupDatabase, usamos el token que nos pasan, si no, el de la config guardada
    const tokenToUse = (overrideToken || config?.token || '').trim();
    const hostToUse = (config?.host || 'https://api.baserow.io').replace(/\/+$/, '');

    if (!tokenToUse && !overrideToken) throw new Error("Token de Baserow no configurado");

    const url = `${hostToUse}/api/${endpoint.replace(/^\/+/, '')}`;
    
    // Asegurar formato exacto del token
    const formattedToken = tokenToUse.startsWith('Token ') ? tokenToUse : `Token ${tokenToUse}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': formattedToken,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          // Extraer mensaje de error legible
          const errorMessage = errData.detail || errData.error || (typeof errData === 'object' ? JSON.stringify(errData) : 'Error desconocido');
          console.error(`Baserow Error (${response.status}):`, errorMessage);
          throw new Error(errorMessage);
      }

      return response.status === 204 ? null : response.json();
    } catch (error: any) {
      console.error(`Petición fallida [${method}]:`, error.message);
      throw error;
    }
  },

  async getFieldId(tableId: number, fieldName: string): Promise<number | null> {
    if (fieldIdCache[tableId]?.[fieldName]) return fieldIdCache[tableId][fieldName];
    try {
      const fields = await this.request(`database/fields/table/${tableId}/`);
      if (!fieldIdCache[tableId]) fieldIdCache[tableId] = {};
      fields.forEach((f: any) => { fieldIdCache[tableId][f.name] = f.id; });
      return fieldIdCache[tableId][fieldName] || null;
    } catch (e) { return null; }
  },

  async setupDatabase(databaseId: string, token: string, host: string): Promise<BaserowConfig> {
    const cleanToken = token.trim();
    const cleanHost = host.trim();
    const cleanDbId = databaseId.trim();

    // Guardamos primero para que las funciones internas tengan acceso a la URL base
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ host: cleanHost, token: cleanToken, databaseId: cleanDbId, tableIds: {} }));

    const createTable = (name: string) => this.request(`database/tables/database/${cleanDbId}/`, 'POST', { name }, cleanToken);
    const createField = (tableId: number, name: string, type: string, config: any = {}) => 
        this.request(`database/fields/table/${tableId}/`, 'POST', { name, type, ...config }, cleanToken);

    try {
        const expenses = await createTable('Expenses');
        const incomes = await createTable('Incomes');
        const goals = await createTable('Goals');
        const banks = await createTable('BankAccounts');
        const payments = await createTable('Payments');

        for (const tid of [expenses.id, incomes.id, goals.id, banks.id, payments.id]) {
            await createField(tid, 'uuid', 'text');
        }

        await createField(expenses.id, 'name', 'text');
        await createField(expenses.id, 'amount', 'number', { number_decimal_places: 0 });
        await createField(expenses.id, 'category', 'text');
        await createField(expenses.id, 'week', 'text');
        await createField(expenses.id, 'year', 'number');
        await createField(expenses.id, 'isInstallment', 'boolean');
        await createField(expenses.id, 'totalInstallments', 'number');
        await createField(expenses.id, 'currentInstallment', 'number');
        await createField(expenses.id, 'months', 'long_text');

        await createField(incomes.id, 'name', 'text');
        await createField(incomes.id, 'amount', 'number', { number_decimal_places: 0 });
        await createField(incomes.id, 'category', 'text');

        await createField(banks.id, 'name', 'text');
        await createField(banks.id, 'type', 'text');

        await createField(goals.id, 'name', 'text');
        await createField(goals.id, 'targetAmount', 'number', { number_decimal_places: 0 });
        await createField(goals.id, 'currentAmount', 'number', { number_decimal_places: 0 });
        await createField(goals.id, 'transactions', 'long_text');

        await createField(payments.id, 'amount', 'number', { number_decimal_places: 0 });
        await createField(payments.id, 'date', 'date');
        await createField(payments.id, 'expenseId', 'link_row', { link_row_table_id: expenses.id });
        await createField(payments.id, 'discountAmount', 'number', { number_decimal_places: 0 });
        await createField(payments.id, 'discountGoalId', 'text');
        await createField(payments.id, 'note', 'long_text');

        const finalConfig: BaserowConfig = {
            host: cleanHost, token: cleanToken, databaseId: cleanDbId,
            tableIds: { expenses: expenses.id, incomes: incomes.id, goals: goals.id, bankAccounts: banks.id, payments: payments.id }
        };
        this.saveConfig(finalConfig);
        return finalConfig;
    } catch (e: any) {
        throw e;
    }
  },

  async fetchAll() {
    const config = this.getConfig();
    if (!config) return null;

    const fetchTable = async (tableId?: number) => {
        if (!tableId) return [];
        try {
            const data = await this.request(`database/rows/table/${tableId}/?user_field_names=true`);
            return data.results.map((row: any) => {
                const { id: baserowInternalId, uuid, ...rest } = row;
                const appId = uuid || baserowInternalId.toString();
                if (rest.expenseId && Array.isArray(rest.expenseId)) rest.expenseId = rest.expenseId[0]?.value || '';
                if (rest.months && typeof rest.months === 'string') try { rest.months = JSON.parse(rest.months); } catch(e) { rest.months = []; }
                if (rest.transactions && typeof rest.transactions === 'string') try { rest.transactions = JSON.parse(rest.transactions); } catch(e) { rest.transactions = []; }
                return { ...rest, id: appId };
            });
        } catch (e) { return []; }
    };

    return {
        expenses: await fetchTable(config.tableIds.expenses),
        incomes: await fetchTable(config.tableIds.incomes),
        goals: await fetchTable(config.tableIds.goals),
        bankAccounts: await fetchTable(config.tableIds.bankAccounts),
        payments: await fetchTable(config.tableIds.payments)
    };
  },

  async saveItem(collection: string, item: any) {
    const config = this.getConfig();
    if (!config || !item?.id) return;
    const tableId = (config.tableIds as any)[collection];
    if (!tableId) return;

    const schema = TABLE_SCHEMAS[collection] || [];
    const payload: any = { uuid: item.id };
    schema.forEach(f => { 
        if (f !== 'uuid' && item[f] !== undefined) payload[f] = item[f]; 
    });

    if (payload.months && typeof payload.months !== 'string') payload.months = JSON.stringify(payload.months);
    if (payload.transactions && typeof payload.transactions !== 'string') payload.transactions = JSON.stringify(payload.transactions);

    if (collection === 'payments' && payload.expenseId) {
        const expTid = config.tableIds.expenses;
        const uuidFid = await this.getFieldId(expTid!, 'uuid');
        if (uuidFid) {
            const search = await this.request(`database/rows/table/${expTid}/?filter__field_${uuidFid}__equal=${encodeURIComponent(payload.expenseId)}`);
            if (search.results?.length > 0) payload.expenseId = [search.results[0].id];
            else delete payload.expenseId;
        }
    }

    try {
        const uuidFid = await this.getFieldId(tableId, 'uuid');
        const search = await this.request(`database/rows/table/${tableId}/?user_field_names=true&filter__field_${uuidFid}__equal=${encodeURIComponent(item.id)}`);
        
        if (search.count > 0) {
            const internalId = search.results[0].id;
            await this.request(`database/rows/table/${tableId}/${internalId}/?user_field_names=true`, 'PATCH', payload);
        } else {
            await this.request(`database/rows/table/${tableId}/?user_field_names=true`, 'POST', payload);
        }
    } catch (e) { console.error(`Error persistiendo ${collection}:`, e); }
  },

  async deleteItem(collection: string, appId: string) {
    const config = this.getConfig();
    if (!config || !appId) return;
    const tableId = (config.tableIds as any)[collection];
    if (!tableId) return;

    try {
        const uuidFid = await this.getFieldId(tableId, 'uuid');
        const search = await this.request(`database/rows/table/${tableId}/?filter__field_${uuidFid}__equal=${encodeURIComponent(appId)}`);
        if (search.results?.length > 0) {
            await this.request(`database/rows/table/${tableId}/${search.results[0].id}/`, 'DELETE');
        }
    } catch (e) { console.error(`Error eliminando en ${collection}:`, e); }
  },

  async initialSync(collection: string, items: any[]) {
      for (const item of items) await this.saveItem(collection, item);
  }
};
