import React, { useState, useEffect } from 'react';
import { OnlineCourse, CourseModule, CONTEST_STATUS_LABELS } from '../../../types/course';
import { courseService } from '../../../services/courseService';
import { StudentModuleCard } from './StudentModuleCard';
import { CoursePlayer } from './player/CoursePlayer';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertCircle, Calendar, CheckCircle2, Clock, Siren, LayoutList, ListTree } from 'lucide-react';
import { StudentCourseEdital } from './edital/StudentCourseEdital';

interface CourseDetailsProps {
  course: OnlineCourse;
  onBack: () => void;
}

export function CourseDetails({ course, onBack }: CourseDetailsProps) {
  const { currentUser } = useAuth();
  
  // ESTADO DAS ABAS (NOVO) - MÓDULOS ou EDITAL
  const [activeTab, setActiveTab] = useState<'MODULES' | 'EDITAL'>('MODULES');

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  
  // Estado do Progresso Geral
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadData = async () => {
        try {
            // 1. Carrega Módulos
            const modulesData = await courseService.getModules(course.id);
            setModules(modulesData);

            // 2. Calcula Progresso Geral
            if (currentUser) {
                const [completedIds, stats] = await Promise.all([
                    courseService.getCompletedLessons(currentUser.uid, course.id),
                    courseService.getCourseStats(course.id)
                ]);
                
                const total = stats.totalLessons;
                const completed = completedIds.length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                setProgress(percentage);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, [course.id, currentUser]);

  // --- LÓGICA DO CONTADOR REGRESSIVO ---
  const getDaysUntilExam = () => {
    if (!course.examDate) return 0;
    const today = new Date();
    // Ajuste fuso: Criar data "local" ignorando hora
    const examDateStr = course.examDate + "T00:00:00"; 
    const exam = new Date(examDateStr);
    
    // Diferença em milissegundos
    const diffTime = exam.getTime() - today.getTime();
    // Converter para dias (arredondando para cima)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysUntilExam();

  // Helper para renderizar o Card de Status
  const renderStatusCard = () => {
    if (!course.contestStatus || course.contestStatus === 'SEM_PREVISAO') return null;

    const statusConfig: any = {
        'COMISSAO_FORMADA': { color: 'blue', icon: <CheckCircle2 size={20} />, label: 'Comissão Formada' },
        'AUTORIZADO': { color: 'green', icon: <CheckCircle2 size={20} />, label: 'Concurso Autorizado!' },
        'BANCA_CONTRATADA': { color: 'yellow', icon: <AlertCircle size={20} />, label: `Banca Definida: ${course.examBoard || 'A definir'}` },
        'EDITAL_PUBLICADO': { color: 'red', icon: <Siren size={20} />, label: 'EDITAL PUBLICADO!' }
    };

    const config = statusConfig[course.contestStatus] || { color: 'gray', icon: <Clock size={20} />, label: CONTEST_STATUS_LABELS[course.contestStatus] };

    // Estilos baseados na cor
    const colors: any = {
        blue: 'bg-blue-900/20 border-blue-600/30 text-blue-400',
        green: 'bg-green-900/20 border-green-600/30 text-green-400',
        yellow: 'bg-yellow-900/20 border-yellow-600/30 text-yellow-500',
        red: 'bg-red-900/20 border-red-600/30 text-red-500',
        gray: 'bg-zinc-800 border-zinc-700 text-zinc-400'
    };

    const activeStyle = colors[config.color];

    return (
        <div className={`mt-6 p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${activeStyle} relative overflow-hidden group transition-all duration-500`}>
            
            {/* Informação do Status */}
            <div className="flex items-center gap-3 z-10 w-full md:w-auto">
                <div className={`p-3 rounded-full bg-black/30 backdrop-blur-sm shadow-inner ${config.color === 'red' ? 'animate-pulse' : ''}`}>
                    {config.icon}
                </div>
                <div>
                    <span className="text-[10px] font-black uppercase opacity-70 block mb-0.5 tracking-wider">Status do Concurso</span>
                    <h3 className="text-lg font-black uppercase tracking-tight leading-none">{config.label}</h3>
                    {course.contestStatus === 'EDITAL_PUBLICADO' && course.examDate && (
                         <span className="text-xs font-bold mt-1 block opacity-90 flex items-center gap-1 bg-black/20 w-fit px-2 py-0.5 rounded">
                            <Calendar size={12} />
                            Data da Prova: {new Date(course.examDate + "T12:00:00").toLocaleDateString('pt-BR')}
                         </span>
                    )}
                </div>
            </div>

            {/* CONTADOR REGRESSIVO (Apenas se Edital Publicado) */}
            {course.contestStatus === 'EDITAL_PUBLICADO' && daysRemaining > 0 && (
                <div className="flex items-center gap-4 bg-black/40 p-3 pr-6 rounded-xl border border-white/10 z-10 shadow-lg w-full md:w-auto justify-between md:justify-start">
                    <div className="text-right">
                        <span className="text-4xl font-black text-white leading-none block tabular-nums tracking-tighter drop-shadow-md">{daysRemaining}</span>
                        <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-widest">Dias Restantes</span>
                    </div>
                    <div className="h-10 w-px bg-zinc-700/50"></div>
                    <div className="text-center animate-bounce">
                        <span className="text-3xl">🔥</span>
                    </div>
                </div>
            )}
             
            {/* Elemento decorativo de fundo */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 bg-current opacity-10 rounded-full blur-3xl transition-all group-hover:opacity-20 pointer-events-none`}></div>
        </div>
    );
  };

  if (selectedModule) {
      return (
        <CoursePlayer 
            course={course} 
            module={selectedModule} 
            onBack={() => setSelectedModule(null)} 
        />
      );
  }

  return (
    <div className="flex flex-col w-full animate-in fade-in pb-20 min-h-full">
      
      {/* HEADER DO CURSO */}
      <div className="flex flex-col gap-6 border-b border-gray-800 pb-6 px-1 md:px-0">
        
        {/* Topo: Botão Voltar e Títulos */}
        <div className="flex items-start gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors mt-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="flex-1">
                <span className="text-red-500 font-bold text-xs uppercase tracking-wider">{course.organization || 'CURSO ONLINE'}</span>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mt-1 leading-none">{course.title}</h2>
            </div>
        </div>

        {renderStatusCard()}

        {/* --- BARRA DE PROGRESSO GERAL --- */}
        <div className="bg-[#121418] p-6 rounded-xl border border-zinc-800 flex items-center gap-6 max-w-3xl shadow-sm">
            {/* Círculo ou Ícone */}
            <div className="w-12 h-12 rounded-full bg-emerald-900/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <span className="text-emerald-500 font-black text-sm">{progress}%</span>
            </div>
            
            {/* Barra */}
            <div className="flex-1">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Progresso do Curso</span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">Concluído</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-zinc-800">
                    <div 
                        className="h-full bg-emerald-600 shadow-[0_0_15px_rgba(22,163,74,0.5)] transition-all duration-1000 ease-out relative" 
                        style={{ width: `${progress}%` }} 
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* SISTEMA DE ABAS (NOVO) */}
      <div className="flex items-center gap-6 border-b border-gray-800 px-1 md:px-0 mt-6 mb-6">
        <button 
            onClick={() => setActiveTab('MODULES')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all
                ${activeTab === 'MODULES' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}
            `}
        >
            <LayoutList size={16} />
            Módulos do Curso
        </button>
        <button 
            onClick={() => setActiveTab('EDITAL')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all
                ${activeTab === 'EDITAL' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}
            `}
        >
            <ListTree size={16} />
            Edital Verticalizado
        </button>
      </div>

      {/* CONTEÚDO CONDICIONAL */}
      <div className="px-1 md:px-0">
          {activeTab === 'MODULES' ? (
              // VISÃO DOS MÓDULOS
              loading ? (
                  <div className="flex gap-4 overflow-hidden">
                      {[1,2,3].map(i => <div key={i} className="w-60 h-[300px] bg-zinc-900 rounded-lg animate-pulse" />)}
                  </div>
              ) : modules.length === 0 ? (
                  <div className="text-zinc-500 italic px-1 text-sm border-l-2 border-zinc-800 pl-4 py-2">Nenhum módulo disponível neste curso.</div>
              ) : (
                  <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-brand-red scrollbar-track-transparent px-1">
                      {modules.map(module => (
                          <StudentModuleCard 
                              key={module.id} 
                              module={module} 
                              onClick={setSelectedModule} 
                          />
                      ))}
                  </div>
              )
          ) : (
              // VISÃO DO EDITAL VERTICALIZADO
              <StudentCourseEdital courseId={course.id} />
          )}
      </div>
    </div>
  );
}