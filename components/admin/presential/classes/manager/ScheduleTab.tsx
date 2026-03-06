import React, { useState, useEffect } from 'react';
import { Class } from '../../../../../types/class';
import { Topic, Subject, Module } from '../../../../../types/curriculum';
import { Teacher } from '../../../../../types/teacher';
import { ClassScheduleEvent, ScheduleGap, ScheduleException, ScheduleAlert } from '../../../../../types/schedule';
import { buildSchedule } from '../../../../../utils/scheduler/ScheduleBuilder';
import { SchedulePreview } from './schedule/SchedulePreview';
import { classScheduleService } from '../../../../../services/classScheduleService';
import { holidayService } from '../../../../../services/holidayService';
import { sanitizeSchedule } from '../../../../../utils/scheduler/ScheduleSynchronizer';
import { Calendar, RefreshCw, Save, Loader2, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface ScheduleTabProps {
  cls: Class;
  topics: Topic[];
  subjects: Subject[];
  teachers: Teacher[];
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ cls, topics, subjects, teachers }) => {
  const [generatedEvents, setGeneratedEvents] = useState<ClassScheduleEvent[]>([]);
  const [generatedGaps, setGeneratedGaps] = useState<ScheduleGap[]>([]);
  const [alert, setAlert] = useState<ScheduleAlert | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [instructionMessage, setInstructionMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const fetchedHolidays = await holidayService.getHolidays();
        setHolidays(fetchedHolidays);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };
    fetchHolidays();
  }, []);

  useEffect(() => {
    const loadAndSanitize = async () => {
      try {
        const originalEvents = await classScheduleService.getScheduleEventsByClass(cls.id);
        const activeModules = topics.flatMap(t => t.modules || []);
        
        const cleanEvents = sanitizeSchedule(originalEvents, topics, activeModules);
        
        if (cleanEvents.length !== originalEvents.length) {
          setInstructionMessage("Atenção: A estrutura curricular foi alterada. Algumas aulas foram removidas pois seus tópicos/módulos não existem mais. Recomenda-se gerar um novo cronograma.");
        }
        
        setGeneratedEvents(cleanEvents);
      } catch (error) {
        console.error("Error loading schedule:", error);
      }
    };
    
    loadAndSanitize();
  }, [cls.id, topics]);

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    setSaveMessage('');
    setAlert(null);
    setInstructionMessage(null);
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const { events, gaps, alert: generatedAlert } = buildSchedule(cls, topics, teachers, holidays, exceptions, subjects);
      setGeneratedEvents(events);
      setGeneratedGaps(gaps);
      setAlert(generatedAlert);
    } catch (error) {
      console.error("Error generating schedule:", error);
      window.alert("Erro ao gerar cronograma. Verifique o console para mais detalhes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddException = (newException: ScheduleException) => {
    setExceptions(prev => {
      const updatedExceptions = [...prev, newException];
      // Assim que a exceção é salva, forçamos a reconstrução do calendário passando o novo array
      const { events, gaps, alert: generatedAlert } = buildSchedule(cls, topics, teachers, holidays, updatedExceptions, subjects);
      setGeneratedEvents(events);
      setGeneratedGaps(gaps);
      setAlert(generatedAlert);
      return updatedExceptions;
    });
  };

  const handleSaveSchedule = async () => {
    if (generatedEvents.length === 0) return;
    if (alert?.type === 'RED') return;

    setIsSaving(true);
    setSaveMessage('');
    try {
      await classScheduleService.saveScheduleEvents(cls.id, generatedEvents);
      setSaveMessage('Cronograma salvo e sincronizado com sucesso!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error("Error saving schedule:", error);
      window.alert("Erro ao salvar cronograma. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {generatedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 rounded-xl border border-dashed border-zinc-800 shadow-sm animate-in fade-in">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Gerador de Cronograma Automático</h3>
          <p className="text-zinc-400 text-center max-w-md mb-8">
            O sistema irá analisar a disponibilidade dos professores, feriados e a carga horária para criar a melhor grade possível.
          </p>
          
          <button
            onClick={handleGenerateSchedule}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-brand-red text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-brand-red/20"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando Cronograma...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                GERAR CRONOGRAMA AUTOMÁTICO
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold text-white">Prévia do Cronograma</h3>
              <p className="text-sm text-zinc-400">
                {generatedEvents.length} aulas agendadas. Verifique os detalhes abaixo antes de salvar.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
              {saveMessage && (
                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-950/30 px-3 py-2 rounded-lg border border-emerald-900/50 text-sm font-medium animate-in slide-in-from-right-5 fade-in">
                  <CheckCircle className="w-4 h-4" />
                  {saveMessage}
                </div>
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleGenerateSchedule}
                  disabled={isGenerating || isSaving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refazer
                </button>
                
                <button
                  onClick={handleSaveSchedule}
                  disabled={isSaving || isGenerating || alert?.type === 'RED'}
                  title={alert?.type === 'RED' ? "Resolva os alertas críticos antes de salvar" : "Salvar cronograma"}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      SALVAR CRONOGRAMA DEFINITIVO
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {alert && (
            <div className={`p-4 rounded-lg border ${
              alert.type === 'RED' 
                ? 'bg-red-900/30 border-red-500 text-red-200' 
                : 'bg-yellow-900/30 border-yellow-500 text-yellow-200'
            } animate-in slide-in-from-top-2`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.type === 'RED' ? <AlertOctagon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">
                    {alert.type === 'RED' ? 'Bloqueio Crítico' : 'Atenção'}
                  </h4>
                  <p className="text-sm">{alert.message}</p>
                  
                  {alert.conflictData && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setAlert(null)}
                          className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors"
                        >
                          Manter Professor (Ignorar Regra)
                        </button>
                        <button
                          onClick={() => {
                            if (alert.conflictData) {
                              setInstructionMessage(`Por favor, localize o Encontro #${alert.conflictData.meetingNumber} no dia ${alert.conflictData.date} abaixo e clique para substituí-lo manualmente.`);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors"
                        >
                          Substituir Professor
                        </button>
                      </div>
                      {instructionMessage && (
                        <p className="text-sm italic opacity-90 mt-1 bg-black/20 p-2 rounded">
                          {instructionMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <SchedulePreview 
            events={generatedEvents} 
            gaps={generatedGaps}
            teachers={teachers} 
            subjects={subjects} 
            topics={topics}
            onAddException={handleAddException}
          />
        </div>
      )}
    </div>
  );
};
