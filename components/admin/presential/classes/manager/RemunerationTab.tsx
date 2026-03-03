import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Calculator, AlertCircle, TrendingUp } from 'lucide-react';
import { Class } from '../../../../../types/class';
import { Topic, Subject } from '../../../../../types/curriculum';
import { Teacher } from '../../../../../types/teacher';
import { classService } from '../../../../../services/classService';
import { curriculumService } from '../../../../../services/curriculumService';
import { teacherService } from '../../../../../services/teacherService';
import { useFinancialCalculations } from '../../../../../hooks/useFinancialCalculations';

interface RemunerationTabProps {
  cls: Class;
  onUpdate: () => void;
}

export const RemunerationTab: React.FC<RemunerationTabProps> = ({ cls, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  const [config, setConfig] = useState({
    mode: cls.remunerationConfig?.mode || 'DYNAMIC',
    fixedHourlyRate: cls.remunerationConfig?.fixedHourlyRate || 0,
    recordingCommission: cls.remunerationConfig?.recordingCommission || 0,
    substitutionCommission: cls.remunerationConfig?.substitutionCommission || 0,
    weekendCommission: cls.remunerationConfig?.weekendCommission || 0,
  });

  // Fetch Data for Calculations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [topicsData, subjectsData, teachersData] = await Promise.all([
          curriculumService.getTopicsByClass(cls.id),
          curriculumService.getSubjectsByClass(cls.id),
          teacherService.getTeachers()
        ]);
        setTopics(topicsData);
        setSubjects(subjectsData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching data for remuneration:", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [cls.id]);

  // Calculate Projected Cost using the Hook
  // We pass a temporary class object with the CURRENT config state to get real-time updates
  const liveClassData = { 
    ...cls, 
    remunerationConfig: {
      mode: config.mode as 'DYNAMIC' | 'FIXED',
      fixedHourlyRate: Number(config.fixedHourlyRate),
      recordingCommission: Number(config.recordingCommission),
      substitutionCommission: Number(config.substitutionCommission),
      weekendCommission: Number(config.weekendCommission),
    } 
  } as Class;
  
  const { calculateProjectedCost } = useFinancialCalculations(liveClassData, topics, subjects, teachers);
  const projectedCost = calculateProjectedCost();

  const totalHours = cls.totalMeetings * cls.meetingDuration;

  const handleSave = async () => {
    try {
      setLoading(true);
      await classService.updateClass(cls.id, {
        remunerationConfig: {
          mode: config.mode as 'DYNAMIC' | 'FIXED',
          fixedHourlyRate: Number(config.fixedHourlyRate),
          recordingCommission: Number(config.recordingCommission),
          substitutionCommission: Number(config.substitutionCommission),
          weekendCommission: Number(config.weekendCommission),
        }
      });
      onUpdate();
      alert('Configurações de remuneração salvas com sucesso!');
    } catch (error) {
      console.error("Error updating remuneration config:", error);
      alert("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* Configuration Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Configuração de Remuneração</h3>
              <p className="text-xs text-zinc-400">Defina como os professores serão pagos nesta turma.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Calculation Mode */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                Método de Cálculo
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setConfig({ ...config, mode: 'DYNAMIC' })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.mode === 'DYNAMIC'
                      ? 'bg-brand-red/10 border-brand-red text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <span className="block font-bold mb-1">Dinâmico por Docente</span>
                  <span className="text-xs opacity-70">Usa o valor hora/aula do perfil de cada professor.</span>
                </button>
                <button
                  onClick={() => setConfig({ ...config, mode: 'FIXED' })}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    config.mode === 'FIXED'
                      ? 'bg-brand-red/10 border-brand-red text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <span className="block font-bold mb-1">Valor Fixo por Turma</span>
                  <span className="text-xs opacity-70">Define um valor único para todos os professores.</span>
                </button>
              </div>
            </div>

            {/* Fixed Rate Input */}
            {config.mode === 'FIXED' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Valor Base da Hora/Aula (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.fixedHourlyRate}
                    onChange={(e) => setConfig({ ...config, fixedHourlyRate: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-red transition-colors font-mono text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            <div className="border-t border-zinc-800 pt-6">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-red" />
                Comissões e Adicionais (%)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recording Commission */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">
                    Gravação em Sala
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={config.recordingCommission}
                      onChange={(e) => setConfig({ ...config, recordingCommission: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red transition-colors"
                      disabled={!cls.hasRecordings}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
                  </div>
                  {!cls.hasRecordings && (
                    <p className="text-[10px] text-zinc-600 mt-1">Turma sem gravação ativa.</p>
                  )}
                </div>

                {/* Substitution Commission */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">
                    Substituição
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={config.substitutionCommission}
                      onChange={(e) => setConfig({ ...config, substitutionCommission: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
                  </div>
                </div>

                {/* Weekend Commission */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">
                    Fim de Semana/Feriado
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={config.weekendCommission}
                      onChange={(e) => setConfig({ ...config, weekendCommission: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-red transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">%</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-3 italic">
                * As comissões são cumulativas e aplicadas sobre o valor base da hora/aula.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-brand-red hover:bg-red-600 text-white rounded-lg font-bold uppercase text-sm tracking-wider transition-colors shadow-lg shadow-brand-red/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>

      {/* Cost Projection Panel */}
      <div className="lg:col-span-1">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-6">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Projeção de Custo</h3>
              <p className="text-xs text-zinc-400">Estimativa baseada na configuração atual.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Total de Encontros:</span>
              <span className="text-white font-bold">{cls.totalMeetings}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Duração por Encontro:</span>
              <span className="text-white font-bold">{cls.meetingDuration}h</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-4">
              <span className="text-zinc-400">Carga Horária Total:</span>
              <span className="text-white font-bold">{totalHours}h</span>
            </div>

            {/* Cost Projection Display */}
            <div className="mt-4 pt-4 border-t border-zinc-800 animate-in fade-in">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-zinc-500 uppercase">Custo Total Projetado</span>
                {loadingData ? (
                  <span className="text-sm text-zinc-500 animate-pulse">Calculando...</span>
                ) : (
                  <span className="text-3xl font-black text-white tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projectedCost)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mt-2 leading-tight">
                * Cálculo provisório baseado nos assuntos atualmente selecionados na grade. Comissões de Substituição e Finais de Semana serão acrescidas no decorrer da execução do Cronograma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
