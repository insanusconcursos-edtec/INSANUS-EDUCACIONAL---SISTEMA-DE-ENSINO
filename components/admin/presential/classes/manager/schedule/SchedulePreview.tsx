import React, { useState, useMemo, useEffect } from 'react';
import { ClassScheduleEvent, ScheduleGap, ScheduleException, ExceptionType } from '../../../../../../types/schedule';
import { Teacher } from '../../../../../../types/teacher';
import { Subject, Topic } from '../../../../../../types/curriculum';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, AlertTriangle, ChevronDown, ChevronUp, LayoutGrid, List, Edit2, X, Check } from 'lucide-react';

import { checkTeacherAvailability } from '../../../../../../utils/scheduler/ResourceValidator';

interface SchedulePreviewProps {
  events: ClassScheduleEvent[];
  gaps: ScheduleGap[];
  teachers: Teacher[];
  subjects: Subject[];
  topics: Topic[];
  onAddException?: (exception: ScheduleException) => void;
}

export const SchedulePreview: React.FC<SchedulePreviewProps> = ({ events, gaps, teachers, subjects, topics, onAddException }) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<ClassScheduleEvent | null>(null);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState('');
  const [actionType, setActionType] = useState<ExceptionType>('ALTERATION');
  const [forceConfirmData, setForceConfirmData] = useState<{ teacherId: string, details: string } | null>(null);

  const todayString = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Sync selected substitute when editing event changes
  useEffect(() => {
    if (editingEvent) {
      setSelectedSubstituteId(editingEvent.teacherId || '');
      setActionType('ALTERATION'); // Reset to default
      setForceConfirmData(null);
    }
  }, [editingEvent]);

  // Group teachers by availability
  const { availableTeachers, unavailableTeachers } = useMemo(() => {
    if (!editingEvent) return { availableTeachers: [], unavailableTeachers: [] };

    const available: Teacher[] = [];
    const unavailable: { teacher: Teacher, details: string }[] = [];

    teachers.forEach(t => {
      const availability = checkTeacherAvailability(t, editingEvent.date);
      if (availability.isAvailable) {
        available.push(t);
      } else {
        unavailable.push({ teacher: t, details: availability.details || 'Indisponível' });
      }
    });

    return { availableTeachers: available, unavailableTeachers: unavailable };
  }, [teachers, editingEvent]);

  const handleSelectTeacher = (teacherId: string, isAvailable?: boolean, details?: string) => {
    if (!teacherId) {
      setSelectedSubstituteId('');
      setForceConfirmData(null);
      return;
    }

    // If it's the current teacher (if any), just select it
    if (teacherId === editingEvent?.teacherId) {
      setSelectedSubstituteId(teacherId);
      setForceConfirmData(null);
      return;
    }

    // Optimization: use passed values if present
    if (isAvailable !== undefined) {
      if (isAvailable) {
        setSelectedSubstituteId(teacherId);
        setForceConfirmData(null);
      } else {
        setForceConfirmData({ 
          teacherId, 
          details: details || 'Indisponível' 
        });
      }
      return;
    }

    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher || !editingEvent) return;

    const availability = checkTeacherAvailability(teacher, editingEvent.date);

    if (availability.isAvailable) {
      setSelectedSubstituteId(teacherId);
      setForceConfirmData(null);
    } else {
      setForceConfirmData({ 
        teacherId, 
        details: availability.details || 'Indisponível' 
      });
    }
  };

  const confirmForceTeacher = () => {
    if (forceConfirmData) {
      setSelectedSubstituteId(forceConfirmData.teacherId);
      setForceConfirmData(null);
    }
  };

  // Determine the initial date based on the first event or current date
  const initialDate = useMemo(() => {
    if (events.length > 0) {
      const sortedDates = [...events].sort((a, b) => a.date.localeCompare(b.date));
      const firstDate = new Date(sortedDates[0].date + 'T00:00:00');
      return new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    }
    return new Date();
  }, [events]);

  const [currentDate, setCurrentDate] = useState(initialDate);

  // Helper to get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get day of week for the 1st of the month (0-6, 0 is Sunday)
  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  // Helper to get start of the week for the current date
  const getStartOfWeek = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day; // Adjust when day is Sunday
    return new Date(date.getFullYear(), date.getMonth(), diff);
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const formatHeaderDate = (date: Date) => {
    if (viewMode === 'month') {
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else {
      const start = getStartOfWeek(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const startStr = start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      const endStr = end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
  };

  // Data Getters
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Professor não atribuído';
  };

  const getSubject = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getModuleName = (topicId: string, moduleId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return 'Tópico desconhecido';
    const module = topic.modules?.find(m => m.id === moduleId);
    return module ? module.name : 'Módulo desconhecido';
  };

  const handleSaveEdit = () => {
    if (editingEvent && onAddException) {
      const newException: ScheduleException = {
        id: Date.now().toString(),
        date: editingEvent.date,
        meetingNumber: editingEvent.meetingNumber,
        originalTeacherId: editingEvent.teacherId,
        substituteTeacherId: actionType === 'CANCELLATION' ? undefined : selectedSubstituteId,
        type: actionType
      };
      onAddException(newException);
      setEditingEvent(null);
      setSelectedSubstituteId('');
      setActionType('ALTERATION');
    } else {
        // If no change or no handler, just close
        setEditingEvent(null);
    }
  };

  // Generate Grid Cells
  const calendarCells = useMemo(() => {
    const cells = [];
    
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(currentDate);
      const firstDay = getFirstDayOfMonth(currentDate);
      
      // Empty cells for previous month
      for (let i = 0; i < firstDay; i++) {
        cells.push({ type: 'empty', key: `empty-${i}` });
      }
      
      // Days of current month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateString);
        const dayGaps = gaps.filter(g => g.date === dateString);
        
        cells.push({
          type: 'day',
          day,
          dateString,
          events: dayEvents,
          gaps: dayGaps,
          key: dateString
        });
      }
    } else {
      // Week View
      const startOfWeek = getStartOfWeek(currentDate);
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(e => e.date === dateString);
        const dayGaps = gaps.filter(g => g.date === dateString);

        cells.push({
          type: 'day',
          day,
          dateString,
          events: dayEvents,
          gaps: dayGaps,
          key: dateString
        });
      }
    }

    return cells;
  }, [currentDate, events, gaps, viewMode]);

  if (events.length === 0 && gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-900 rounded-xl border border-dashed border-zinc-800 text-zinc-500">
        <CalendarIcon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhum evento para exibir</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-brand-red" />
              {formatHeaderDate(currentDate)}
            </h2>
            <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1 border border-zinc-700">
              <button
                onClick={() => setViewMode('month')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'month' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="Visualização Mensal"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'week' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                title="Visualização Semanal"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button 
              onClick={handleNext}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-700"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-950">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={`grid grid-cols-7 bg-zinc-900 ${viewMode === 'month' ? 'auto-rows-fr' : 'h-[600px]'}`}>
          {calendarCells.map((cell: any) => {
            if (cell.type === 'empty') {
              return <div key={cell.key} className="min-h-[140px] border-b border-r border-zinc-800/50 bg-zinc-950/30"></div>;
            }

            const isToday = new Date().toISOString().split('T')[0] === cell.dateString;
            const dayGaps = cell.gaps || [];
            const dayEvents = cell.events || [];
            const holidayGap = dayGaps.find((g: ScheduleGap) => g.reason === 'HOLIDAY');

            // Timeline construction
            const timeline = holidayGap 
              ? [] 
              : [
                  ...dayEvents.map((e: ClassScheduleEvent) => ({ type: 'event' as const, data: e, startTime: e.startTime })),
                  ...dayGaps.filter((g: ScheduleGap) => g.startTime).map((g: ScheduleGap) => ({ type: 'gap' as const, data: g, startTime: g.startTime! }))
                ].sort((a, b) => a.startTime.localeCompare(b.startTime));

            const hasEvents = dayEvents.length > 0;

            return (
              <div 
                key={cell.key} 
                className={`
                  p-2 border-b border-r border-zinc-800 transition-colors relative group overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent
                  ${viewMode === 'month' ? 'min-h-[140px]' : 'h-full'}
                  ${isToday ? 'bg-brand-red/5' : 'hover:bg-zinc-800/30'}
                `}
              >
                <div className="flex justify-between items-start mb-2 sticky top-0 bg-inherit z-10 pb-1">
                  <span 
                    className={`
                      text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-brand-red text-white' : 'text-zinc-400 group-hover:text-zinc-200'}
                    `}
                  >
                    {cell.day}
                  </span>
                  {hasEvents && (
                    <span className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide
                      ${dayEvents[0].isOverflow 
                        ? 'bg-red-600 text-white border-red-500' 
                        : 'text-brand-red bg-brand-red/10 border-brand-red/20'}
                    `}>
                      {dayEvents[0].isOverflow 
                        ? `Encontro #${dayEvents[0].meetingNumber} (EXTRA)` 
                        : `Encontro #${dayEvents[0].meetingNumber}`}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Holiday Display */}
                  {holidayGap && (
                    <div className="h-full flex flex-col items-center justify-center py-4">
                      <div className="w-full p-3 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 text-zinc-500 flex flex-col items-center justify-center text-center gap-2">
                        <CalendarIcon className="w-5 h-5 opacity-50" />
                        <span className="text-xs font-medium">{holidayGap.description}</span>
                      </div>
                    </div>
                  )}

                  {/* Timeline Display (Events + Gaps) */}
                  {!holidayGap && timeline.map((item, index) => {
                    if (item.type === 'event') {
                      const event = item.data as ClassScheduleEvent;
                      const subject = getSubject(event.subjectId);
                      const isExpanded = expandedEventId === event.id;
                      const borderColor = subject?.color || '#52525b';

                      const isOverflow = event.isOverflow;

                      return (
                        <React.Fragment key={event.id}>
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedEventId(isExpanded ? null : event.id);
                            }}
                            className={`
                              rounded-lg border-l-4 transition-all cursor-pointer overflow-hidden
                              ${isExpanded ? 'bg-zinc-800 shadow-lg ring-1 ring-zinc-700 z-20 relative' : 'bg-zinc-800/50 hover:bg-zinc-800'}
                              ${isOverflow ? 'border-red-500 bg-red-900/20' : ''}
                            `}
                            style={{ borderLeftColor: borderColor }}
                          >
                            {/* Card Header */}
                            <div className="p-2">
                              <div className="flex justify-between items-center mb-1">
                                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                                  {index + 1}º Tempo
                                </div>
                                <div className="flex gap-1">
                                  {event.isSubstitute && (
                                    <span className="text-[8px] font-bold text-black bg-yellow-500 px-1 py-0.5 rounded border border-yellow-600 uppercase tracking-wider flex items-center gap-1">
                                      SUBSTITUIÇÃO
                                    </span>
                                  )}
                                  {isOverflow && (
                                    <span className="text-[8px] font-bold text-red-400 bg-red-950/50 px-1 py-0.5 rounded border border-red-900/50 uppercase tracking-wider flex items-center gap-1">
                                      <AlertTriangle className="w-2 h-2" />
                                      ⚠️ Além do limite da turma
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 mb-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>{event.startTime} - {event.endTime}</span>
                                  </div>
                                  <div className="font-bold text-xs text-zinc-200 truncate leading-tight">
                                    {subject?.name || 'Disciplina Desconhecida'}
                                  </div>
                                </div>
                                <div className="text-zinc-500">
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </div>
                              </div>
                            </div>

                            {/* Card Details */}
                            {isExpanded && (
                              <div className="px-2 pb-2 pt-0 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                <div className="h-px bg-zinc-700/50 w-full my-1" />
                                
                                <div>
                                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Módulo</span>
                                  <p className="text-[11px] text-zinc-300 leading-tight">
                                    {getModuleName(event.topicId, event.moduleId)}
                                  </p>
                                </div>

                                <div>
                                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Professor</span>
                                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                                    <User className="w-3 h-3 text-zinc-500" />
                                    <span>{getTeacherName(event.teacherId)}</span>
                                  </div>
                                </div>

                                {!event.teacherId && (
                                  <div className="flex items-center gap-1.5 text-[10px] text-yellow-500 bg-yellow-900/20 p-1.5 rounded border border-yellow-700/30 mt-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>Professor não alocado</span>
                                  </div>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEvent(event);
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-[10px] font-bold uppercase rounded transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Gerenciar Encontro
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Interval Divider */}
                          {index === 0 && timeline.length > 1 && (
                            <div className="flex items-center gap-2 my-2 opacity-50">
                              <div className="h-px bg-zinc-700 border-t border-dashed border-zinc-600 flex-1"></div>
                              <span className="text-[9px] text-zinc-500 font-medium whitespace-nowrap">Intervalo (15 min)</span>
                              <div className="h-px bg-zinc-700 border-t border-dashed border-zinc-600 flex-1"></div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    } else {
                      // Gap Rendering
                      const gap = item.data as ScheduleGap;
                      return (
                        <React.Fragment key={`gap-${index}`}>
                          <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 p-2">
                            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                              {index + 1}º Tempo
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
                                <Clock className="w-3 h-3" />
                                <span>{gap.startTime} - {gap.endTime}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="leading-tight">{gap.description}</span>
                              </div>
                            </div>
                          </div>

                          {/* Interval Divider */}
                          {index === 0 && timeline.length > 1 && (
                            <div className="flex items-center gap-2 my-2 opacity-50">
                              <div className="h-px bg-zinc-700 border-t border-dashed border-zinc-600 flex-1"></div>
                              <span className="text-[9px] text-zinc-500 font-medium whitespace-nowrap">Intervalo (15 min)</span>
                              <div className="h-px bg-zinc-700 border-t border-dashed border-zinc-600 flex-1"></div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-red" />
                Gerenciar Encontro
              </h3>
              <button 
                onClick={() => setEditingEvent(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Event Details */}
              <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3 border border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Data</span>
                  <span className="text-sm font-medium text-white">
                    {new Date(editingEvent.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Horário</span>
                  <span className="text-sm font-medium text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    {editingEvent.startTime} - {editingEvent.endTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Disciplina</span>
                  <span className="text-sm font-medium text-white text-right">
                    {getSubject(editingEvent.subjectId)?.name}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-700/50 mt-2">
                  <p className="text-[10px] text-zinc-400 italic text-center">
                    * Atenção: Esta alteração será aplicada a todas as aulas (tempos) deste encontro.
                  </p>
                </div>
              </div>

              {/* Action Type Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase block">Ação</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setActionType('ALTERATION')}
                    className={`p-3 rounded-lg border text-left transition-all ${actionType === 'ALTERATION' ? 'bg-zinc-800 border-brand-red ring-1 ring-brand-red' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                  >
                    <div className="font-medium text-sm text-white">Alterar Professor</div>
                    <div className="text-xs text-zinc-500">Correção de erro no agendamento.</div>
                  </button>
                  
                  <button
                    onClick={() => setActionType('SUBSTITUTION')}
                    disabled={editingEvent.date !== todayString}
                    className={`p-3 rounded-lg border text-left transition-all ${actionType === 'SUBSTITUTION' ? 'bg-zinc-800 border-brand-red ring-1 ring-brand-red' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'} ${editingEvent.date !== todayString ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-medium text-sm text-white">Substituir (Apenas Hoje)</div>
                    <div className="text-xs text-zinc-500">Gera custo adicional. Disponível apenas no dia da aula.</div>
                  </button>

                  <button
                    onClick={() => setActionType('CANCELLATION')}
                    className={`p-3 rounded-lg border text-left transition-all ${actionType === 'CANCELLATION' ? 'bg-zinc-800 border-brand-red ring-1 ring-brand-red' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
                  >
                    <div className="font-medium text-sm text-white">Cancelar Aula</div>
                    <div className="text-xs text-zinc-500">Remove a aula e reajusta o cronograma.</div>
                  </button>
                </div>
              </div>

              {/* Teacher Selection */}
              {actionType !== 'CANCELLATION' && (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <label className="text-sm font-medium text-zinc-300 block">
                    {actionType === 'SUBSTITUTION' ? 'Professor Substituto' : 'Novo Professor'}
                  </label>
                  
                  <div className="max-h-48 overflow-y-auto border border-zinc-700 p-2 rounded bg-zinc-950/50">
                    {/* Available Teachers */}
                    {availableTeachers.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-bold text-emerald-500 uppercase mb-1 flex items-center gap-1">
                          ✅ Professores Disponíveis
                        </div>
                        <div className="space-y-1">
                          {availableTeachers.map(teacher => (
                            <button
                              key={teacher.id}
                              onClick={() => handleSelectTeacher(teacher.id, true)}
                              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center justify-between ${
                                selectedSubstituteId === teacher.id 
                                  ? 'bg-emerald-900/30 text-emerald-200 border border-emerald-800' 
                                  : 'text-zinc-300 hover:bg-zinc-800'
                              }`}
                            >
                              <span>{teacher.name}</span>
                              {selectedSubstituteId === teacher.id && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unavailable Teachers */}
                    {unavailableTeachers.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-red-500 uppercase mb-1 flex items-center gap-1">
                          ❌ Professores Indisponíveis
                        </div>
                        <div className="space-y-1">
                          {unavailableTeachers.map(({ teacher, details }) => (
                            <button
                              key={teacher.id}
                              onClick={() => handleSelectTeacher(teacher.id, false, details)}
                              className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors flex items-center justify-between opacity-75 hover:opacity-100 ${
                                selectedSubstituteId === teacher.id 
                                  ? 'bg-red-900/30 text-red-200 border border-red-800' 
                                  : 'text-zinc-400 hover:bg-zinc-800'
                              }`}
                            >
                              <span>{teacher.name}</span>
                              {selectedSubstituteId === teacher.id && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Force Schedule Alert */}
                  {forceConfirmData && (
                    <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg animate-in slide-in-from-top-2">
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-red-200">
                          <span className="font-bold block mb-0.5">Atenção: Este professor está indisponível.</span>
                          Motivo: {forceConfirmData.details}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setForceConfirmData(null)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={confirmForceTeacher}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded shadow-sm transition-colors"
                        >
                          FORÇAR AGENDAMENTO
                        </button>
                      </div>
                    </div>
                  )}

                  {actionType === 'SUBSTITUTION' && (
                    <p className="text-xs text-zinc-500 mt-1">
                      * Ao alterar o professor manualmente, esta aula será marcada como substituição.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
              <button
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-600 font-medium shadow-lg shadow-brand-red/20 transition-all"
              >
                <Check className="w-4 h-4" />
                Salvar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
