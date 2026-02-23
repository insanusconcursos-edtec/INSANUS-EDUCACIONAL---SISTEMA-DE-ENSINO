
import React, { useState, useEffect } from 'react';
import { OnlineCourse, CourseModule, CONTEST_STATUS_LABELS } from '../../../types/course';
import { courseService } from '../../../services/courseService';
import { StudentModuleCard } from './StudentModuleCard';
import { CoursePlayer } from './player/CoursePlayer';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertCircle, Calendar, CheckCircle2, Clock, Siren, LayoutList, ListTree, PlayCircle } from 'lucide-react';
import { StudentCourseEdital } from './edital/StudentCourseEdital';
import { CourseReviewDashboard } from './reviews/CourseReviewDashboard';

interface CourseDetailsProps {
  course: OnlineCourse;
  onBack: () => void;
}

export function CourseDetails({ course, onBack }: CourseDetailsProps) {
  const { currentUser } = useAuth();
  
  // ESTADO DAS ABAS (NOVO) - MÓDULOS ou EDITAL
  const [activeTab, setActiveTab] = useState<'MODULES' | 'EDITAL'>('MODULES');
  const [focusTopicId, setFocusTopicId] = useState<string | null>(null);

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

  // Handler para Navegação via Review
  const handleReviewNow = (topicId: string) => {
      setActiveTab('EDITAL');
      setFocusTopicId(topicId);
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
      
      {/* ==================================================== */}
      {/* HERO BANNER IMERSIVO (ESTILO NETFLIX - CORES REAIS)    */}
      {/* ==================================================== */}
      <div className="relative w-[calc(100%+3rem)] md:w-[calc(100%+4rem)] h-[60vh] min-h-[450px] md:h-[70vh] flex flex-col justify-end bg-[#0f1114] overflow-hidden -mt-6 -mx-6 md:-mt-8 md:-mx-8 mb-8 shadow-2xl border-b border-gray-800/50">
         
         {/* Botão Voltar (Absoluto) */}
         <div className="absolute top-6 left-6 z-30">
            <button onClick={onBack} className="p-3 bg-black/40 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-all border border-white/10 group">
                <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
         </div>

         {/* Background Responsivo (Sem Opacidade) */}
         <div className="absolute inset-0">
             <picture>
                 {/* Se for tela média/grande, usa o banner desktop. Se não tiver, usa a capa normal */}
                 <source media="(min-width: 768px)" srcSet={course.bannerUrlDesktop || course.coverUrl} />
                 {/* Padrão para celular: usa o banner mobile ou a capa normal. Removido o opacity-60 */}
                 <img src={course.bannerUrlMobile || course.coverUrl} alt="Banner do Curso" className="w-full h-full object-cover transition-opacity duration-1000" />
             </picture>

             {/* Degradê Suave apenas na parte inferior (para os botões não sumirem em fundos claros) */}
             <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0f1114] via-[#0f1114]/60 to-transparent"></div>
         </div>

         {/* Conteúdo Sobreposto (Apenas a Barra Minimalista) */}
         <div className="relative z-10 w-full px-6 md:px-12 pb-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
             
             {/* BARRA DE AÇÕES MINIMALISTA */}
             <div className="flex flex-col md:flex-row md:items-center gap-4 mt-auto">
                 
                 {/* Botão de Ação Principal */}
                 <button className="flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-lg font-black text-sm uppercase transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)] shrink-0">
                     <PlayCircle size={20} fill="currentColor" />
                     {progress > 0 ? 'CONTINUAR ESTUDOS' : 'INICIAR CURSO'}
                 </button>

                 <div className="flex items-center gap-4 flex-wrap">
                    {/* Badge de Status do Concurso */}
                    {course.contestStatus && course.contestStatus !== 'SEM_PREVISAO' && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-white font-bold text-xs uppercase shrink-0">
                            <CheckCircle2 size={16} className="text-green-500" />
                            Status: <span className="text-gray-300 ml-1">{CONTEST_STATUS_LABELS[course.contestStatus]}</span>
                        </div>
                    )}

                    {/* Nova Barra de Progresso Linear */}
                    <div className="flex-1 min-w-[200px] max-w-md flex items-center gap-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-3 px-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase hidden sm:block">Progresso</span>
                        <div className="flex-1 bg-gray-900 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-red-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="text-sm font-black text-white">{progress}%</span>
                    </div>
                 </div>
             </div>
         </div>
      </div>

      {/* DASHBOARD DE REVISÕES */}
      <div className="px-1 md:px-0 mb-8">
        <CourseReviewDashboard courseId={course.id} onReviewNow={handleReviewNow} />
      </div>

      {/* SISTEMA DE ABAS (NOVO) */}
      <div className="flex items-center gap-8 border-b border-gray-800 px-1 md:px-0 mb-8">
        <button 
            onClick={() => setActiveTab('MODULES')}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-all
                ${activeTab === 'MODULES' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}
            `}
        >
            <LayoutList size={18} />
            Módulos do Curso
        </button>
        <button 
            onClick={() => setActiveTab('EDITAL')}
            className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-all
                ${activeTab === 'EDITAL' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}
            `}
        >
            <ListTree size={18} />
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
                  <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-transparent px-1">
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
              <StudentCourseEdital 
                courseId={course.id} 
                focusTopicId={focusTopicId} 
              />
          )}
      </div>
    </div>
  );
}
