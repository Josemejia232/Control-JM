
import React, { useState, useEffect } from 'react';
import { X, Save, Database, Key, AlertTriangle, CheckCircle2, Loader2, Info, Globe, ShieldCheck, Copy, Terminal, Smartphone, Monitor, Share2, Clipboard, ExternalLink, AlertCircle } from 'lucide-react';
import { supabaseService, SupabaseConfig } from '../services/supabaseService';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const config = supabaseService.getConfig();
      if (config) {
        setUrl(config.url);
        setAnonKey(config.anonKey);
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!url || !anonKey) {
      setStatus('error');
      setMessage('Completa todos los campos para continuar.');
      return;
    }

    setStatus('working');
    try {
      // Guardamos la configuración tal cual la ingresa el usuario
      supabaseService.saveConfig({ url: url.trim(), anonKey: anonKey.trim() });
      
      const client = supabaseService.getClient();
      if (!client) throw new Error("Error al inicializar el cliente de base de datos.");
      
      // Validamos la conexión intentando una consulta mínima
      const { error } = await client.from('users').select('id').limit(1);
      
      // Si hay un error de autenticación o de red, lo reportamos pero permitimos que quede guardado
      if (error) {
        console.warn("Conexión guardada pero hubo un reporte del servidor:", error.message);
      }
      
      setStatus('success');
      setTimeout(() => { 
        onSave(); 
        onClose(); 
        setStatus('idle');
      }, 1000);
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || 'Error al intentar conectar. Verifica tus credenciales.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Configuración de Nube</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-indigo-800 leading-relaxed uppercase tracking-tight">
              Ingresa los datos de tu instancia de base de datos para habilitar la sincronización en tiempo real.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project URL</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="text" 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                  placeholder="https://tu-proyecto.supabase.co" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key / Anon Key</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="password" 
                  value={anonKey} 
                  onChange={(e) => setAnonKey(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                  placeholder="Ingresa tu clave de acceso..." 
                />
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={status === 'working'}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {status === 'working' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : status === 'success' ? (
                <><CheckCircle2 className="w-5 h-5 text-emerald-400" /> CONFIGURACIÓN GUARDADA</>
              ) : (
                <><Save className="w-5 h-5" /> GUARDAR Y SINCRONIZAR</>
              )}
            </button>

            {status === 'error' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 animate-fade-in">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ayuda rápida</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-800 uppercase mb-2">¿Dónde están mis claves?</p>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Puedes encontrarlas en el panel de control de tu proveedor de base de datos, usualmente en la sección de 'Settings' o 'API'.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-800 uppercase mb-2">Importante</p>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Asegúrate de que la URL sea la correcta del proyecto y que las tablas necesarias estén creadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
