import React, { useRef } from 'react';
import { Upload, Video, FileText, Type, X } from 'lucide-react';
import { Class } from '../../../../../types/class';

interface ClassIdentityFormProps {
  data: Partial<Class>;
  onChange: (updates: Partial<Class>) => void;
}

export const ClassIdentityForm: React.FC<ClassIdentityFormProps> = ({ data, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ coverImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ coverImage: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800">
        <FileText className="w-5 h-5 text-brand-red" />
        <h3 className="text-lg font-bold text-white uppercase">Identidade da Turma</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome da Turma */}
        <div className="col-span-2">
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Nome da Turma *</label>
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-red transition-colors placeholder-zinc-600"
            placeholder="Ex: Turma Elite PC-AC 2026"
          />
        </div>

        {/* Capa da Turma */}
        <div className="col-span-2">
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Imagem de Capa (474x1000)</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group overflow-hidden ${
              data.coverImage 
                ? 'border-brand-red/50 bg-zinc-900' 
                : 'border-zinc-700 text-zinc-500 hover:border-brand-red/50 hover:bg-zinc-800/50'
            }`}
            style={{ minHeight: '200px' }}
          >
            {data.coverImage ? (
              <>
                <img 
                  src={data.coverImage} 
                  alt="Capa da Turma" 
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity"
                />
                <div className="relative z-10 flex flex-col items-center">
                  <button 
                    onClick={handleRemoveImage}
                    className="mb-2 p-2 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Alterar Imagem</span>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2 group-hover:text-brand-red transition-colors" />
                <span className="text-xs font-medium">Clique para fazer upload ou arraste a imagem</span>
                <span className="text-[10px] mt-1 text-zinc-600">Formatos: JPG, PNG (Max 2MB)</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
          </div>
        </div>

        {/* Tipo da Turma */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Tipo da Turma *</label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
            <button
              type="button"
              onClick={() => onChange({ type: 'PRE_EDITAL' })}
              className={`py-2 px-4 rounded-md text-xs font-bold uppercase transition-all ${
                data.type === 'PRE_EDITAL'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Pré-Edital
            </button>
            <button
              type="button"
              onClick={() => onChange({ type: 'POS_EDITAL' })}
              className={`py-2 px-4 rounded-md text-xs font-bold uppercase transition-all ${
                data.type === 'POS_EDITAL'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Pós-Edital
            </button>
          </div>
        </div>

        {/* Modalidade */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Modalidade *</label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
            <button
              type="button"
              onClick={() => onChange({ modality: 'REGULAR' })}
              className={`py-2 px-4 rounded-md text-xs font-bold uppercase transition-all ${
                data.modality === 'REGULAR'
                  ? 'bg-zinc-600 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Regular
            </button>
            <button
              type="button"
              onClick={() => onChange({ modality: 'INTENSIVO' })}
              className={`py-2 px-4 rounded-md text-xs font-bold uppercase transition-all ${
                data.modality === 'INTENSIVO'
                  ? 'bg-brand-red text-white shadow-lg shadow-red-900/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              Intensivo
            </button>
          </div>
        </div>

        {/* Gravações */}
        <div className="col-span-2">
          <div 
            onClick={() => onChange({ hasRecordings: !data.hasRecordings })}
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
              data.hasRecordings 
                ? 'bg-brand-red/10 border-brand-red/30' 
                : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${data.hasRecordings ? 'bg-brand-red text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                <Video className="w-5 h-5" />
              </div>
              <div>
                <span className={`block text-sm font-bold uppercase ${data.hasRecordings ? 'text-white' : 'text-zinc-300'}`}>
                  Gravações da Sala de Aula
                </span>
                <span className="text-xs text-zinc-500">
                  Habilita pagamento de comissão extra para professores
                </span>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${data.hasRecordings ? 'bg-brand-red' : 'bg-zinc-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${data.hasRecordings ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
