
// Added missing React import to fix 'Cannot find namespace React' errors
import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Trash2, User as UserIcon, AlertCircle, Plus, Check } from 'lucide-react';
import { User } from '../types';
import { supabaseService } from '../services/supabaseService';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    const client = supabaseService.getClient();
    if (client) {
      const { data, error } = await client.from('users').select('*');
      if (!error && data) {
        setUsers(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const client = supabaseService.getClient();
    if (!client) return;

    const newUser = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUsername.toLowerCase().trim(),
      password: newPassword,
      name: newName,
      role: newRole
    };

    const { error: insertError } = await client.from('users').insert([newUser]);
    
    if (insertError) {
      setError('Error al crear usuario. Posiblemente el nombre de usuario ya existe.');
    } else {
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      loadUsers();
    }
  };

  const deleteUser = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario? Sus datos permanecerán en la base de datos pero no podrá acceder.')) {
      const client = supabaseService.getClient();
      if (!client) return;
      const { error } = await client.from('users').delete().eq('id', id);
      if (!error) loadUsers();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SECCIÓN CREAR USUARIO */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-indigo-50 p-2.5 rounded-xl">
             <UserPlus className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Crear Nuevo Usuario</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Añade colaboradores o familiares al sistema</p>
          </div>
        </div>
        
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
            <input 
              type="text" 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              className="w-full px-5 py-3 text-sm border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 bg-white font-bold text-slate-800 placeholder:text-slate-300 shadow-sm transition-all"
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario (Login)</label>
            <input 
              type="text" 
              value={newUsername} 
              onChange={e => setNewUsername(e.target.value)}
              className="w-full px-5 py-3 text-sm border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 bg-white font-bold text-slate-800 placeholder:text-slate-300 shadow-sm transition-all"
              placeholder="juan123"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-5 py-3 text-sm border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900 bg-white font-bold text-slate-800 placeholder:text-slate-300 shadow-sm transition-all"
              placeholder="••••"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
              <select 
                value={newRole} 
                onChange={e => setNewRole(e.target.value as any)}
                className="w-full px-5 py-3 text-sm border border-slate-200 rounded-2xl outline-none bg-white font-black text-slate-700 cursor-pointer shadow-sm transition-all"
              >
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button 
              type="submit"
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 h-[46px] mb-0"
            >
              <Plus className="w-4 h-4" /> CREAR
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-[10px] font-black text-rose-500 uppercase flex items-center gap-1.5 px-2 tracking-widest"><AlertCircle className="w-4 h-4" /> {error}</p>}
      </div>

      {/* LISTADO DE USUARIOS */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Usuarios del Sistema</h3>
          </div>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{users.length} Registrados</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-4">Nombre Completo</th>
                <th className="px-8 py-4">Usuario</th>
                <th className="px-8 py-4 text-center">Rol</th>
                <th className="px-8 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <UserIcon className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="font-black text-slate-700">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-slate-500 font-bold text-sm tracking-tight">{u.username}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      u.role === 'admin' 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {u.username !== 'admin' && (
                      <button 
                        onClick={() => deleteUser(u.id)} 
                        className="text-slate-300 hover:text-rose-600 p-2.5 rounded-xl hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
