import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Link as LinkIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Subject, Topic, Module } from '../../../../../../types/curriculum';
import { ClassScheduleEvent } from '../../../../../../types/schedule';
import { Teacher } from '../../../../../../types/teacher';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PedagogicalPlanningProps {
  subjects: Subject[];
  topics: Topic[];
  modules: Module[];
  events: ClassScheduleEvent[];
  teachers: Teacher[];
}

export function PedagogicalPlanning({ subjects, topics, modules, events, teachers }: PedagogicalPlanningProps) {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleSubject = (id: string) => {
    const newSet = new Set(expandedSubjects);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSubjects(newSet);
  };

  const toggleTopic = (id: string) => {
    const newSet = new Set(expandedTopics);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedTopics(newSet);
  };

  const toggleModule = (id: string) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedModules(newSet);
  };

  // Filter subjects that have topics
  const activeSubjects = subjects.filter(subject => 
    topics.some(topic => topic.subjectId === subject.id)
  );

  return (
    <div className="space-y-4">
      {activeSubjects.map(subject => {
        const subjectEvents = events.filter(e => e.subjectId === subject.id);
        const completedEvents = subjectEvents.filter(e => e.status === 'COMPLETED');
        const isExpanded = expandedSubjects.has(subject.id);

        // Filter topics for this subject
        const subjectTopics = topics.filter(t => t.subjectId === subject.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        return (
          <div key={subject.id} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
            {/* Subject Header */}
            <button
              onClick={() => toggleSubject(subject.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-5 h-5 text-zinc-400" /> : <ChevronRight className="w-5 h-5 text-zinc-400" />}
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: subject.color }}
                />
                <span className="font-medium text-zinc-100">{subject.name}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-zinc-400">
                  {completedEvents.length} / {subjectEvents.length} aulas concluídas
                </span>
                <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ 
                      width: `${subjectEvents.length > 0 ? (completedEvents.length / subjectEvents.length) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </button>

            {/* Subject Content (Topics) */}
            {isExpanded && (
              <div className="border-t border-zinc-800 bg-zinc-900/30">
                {subjectTopics.map(topic => {
                  const isTopicExpanded = expandedTopics.has(topic.id);
                  const topicModules = topic.modules || [];

                  return (
                    <div key={topic.id} className="border-b border-zinc-800 last:border-0">
                      {/* Topic Header */}
                      <button
                        onClick={() => toggleTopic(topic.id)}
                        className="w-full flex items-center justify-between p-3 pl-8 hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isTopicExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                          <span className="text-sm font-medium text-zinc-300">{topic.name}</span>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {topicModules.length} módulos
                        </span>
                      </button>

                      {/* Topic Content (Modules) */}
                      {isTopicExpanded && (
                        <div className="bg-zinc-950/30 pl-12 pr-4 py-2 space-y-2">
                          {topicModules.map(module => {
                            const isModuleExpanded = expandedModules.has(module.id);
                            const moduleEvents = events.filter(e => e.moduleId === module.id)
                              .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());
                            
                            const moduleContents = module.contents || [];

                            return (
                              <div key={module.id} className="border border-zinc-800 rounded-md overflow-hidden bg-zinc-900">
                                {/* Module Header */}
                                <button
                                  onClick={() => toggleModule(module.id)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {isModuleExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                                    <span className="text-sm text-zinc-300">{module.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1">
                                      <FileText className="w-3 h-3" />
                                      {moduleContents.length}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {moduleEvents.length} aulas
                                    </span>
                                  </div>
                                </button>

                                {/* Module Content (Materials & Classes) */}
                                {isModuleExpanded && (
                                  <div className="p-4 space-y-6 border-t border-zinc-800 bg-zinc-950/50">
                                    
                                    {/* Materials Section */}
                                    {moduleContents.length > 0 && (
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Materiais de Apoio</h4>
                                        <div className="grid gap-2">
                                          {moduleContents.map(content => (
                                            <a 
                                              key={content.id}
                                              href={content.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-3 p-3 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition-all group"
                                            >
                                              <div className="p-2 rounded-md bg-zinc-950 border border-zinc-800 group-hover:border-zinc-700">
                                                {content.type === 'PDF' ? (
                                                  <FileText className="w-4 h-4 text-red-400" />
                                                ) : (
                                                  <LinkIcon className="w-4 h-4 text-blue-400" />
                                                )}
                                              </div>
                                              <div className="flex-1">
                                                <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{content.title}</p>
                                                <p className="text-xs text-zinc-500">Adicionado em {new Date(content.createdAt).toLocaleDateString('pt-BR')}</p>
                                              </div>
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Classes Section */}
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                        Cronograma de Aulas ({moduleEvents.length})
                                      </h4>
                                      
                                      {moduleEvents.length === 0 ? (
                                        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
                                          <p className="text-sm text-zinc-500">Nenhuma aula agendada para este módulo.</p>
                                        </div>
                                      ) : (
                                        <div className="grid gap-2">
                                          {moduleEvents.map(event => {
                                            const teacher = teachers.find(t => t.id === event.teacherId);
                                            const isCompleted = event.status === 'COMPLETED';
                                            
                                            return (
                                              <div 
                                                key={event.id}
                                                className={twMerge(
                                                  "flex items-center justify-between p-3 rounded-md border transition-all",
                                                  isCompleted 
                                                    ? "bg-emerald-950/10 border-emerald-900/30" 
                                                    : "bg-zinc-900 border-zinc-800"
                                                )}
                                              >
                                                <div className="flex items-center gap-4">
                                                  <div className={twMerge(
                                                    "w-10 h-10 rounded-full flex items-center justify-center border",
                                                    isCompleted
                                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                                                  )}>
                                                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                  </div>
                                                  <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className={twMerge(
                                                        "text-sm font-medium",
                                                        isCompleted ? "text-emerald-400" : "text-zinc-200"
                                                      )}>
                                                        {format(new Date(event.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                                                      </span>
                                                      <span className="text-xs text-zinc-500">
                                                        {event.startTime} - {event.endTime}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                      <span>Prof. {teacher?.name || 'Não definido'}</span>
                                                      {event.isSubstitute && (
                                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                          Substituto
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                  <span className={twMerge(
                                                    "text-xs px-2 py-1 rounded-full border",
                                                    event.status === 'COMPLETED' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                    event.status === 'SCHEDULED' && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                                    event.status === 'CANCELED' && "bg-red-500/10 text-red-500 border-red-500/20",
                                                    event.status === 'RESCHEDULED' && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                  )}>
                                                    {event.status === 'COMPLETED' && 'Concluída'}
                                                    {event.status === 'SCHEDULED' && 'Agendada'}
                                                    {event.status === 'CANCELED' && 'Cancelada'}
                                                    {event.status === 'RESCHEDULED' && 'Reagendada'}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      
      {activeSubjects.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30">
          <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">Nenhuma disciplina encontrada</h3>
          <p className="text-zinc-500 text-sm mt-1">Cadastre disciplinas e tópicos para visualizar o planejamento.</p>
        </div>
      )}
    </div>
  );
}
