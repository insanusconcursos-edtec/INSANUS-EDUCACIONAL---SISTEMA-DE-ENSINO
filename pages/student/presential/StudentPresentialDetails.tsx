import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classService } from '../../../services/classService';
import { courseService } from '../../../services/courseService';
import { Class } from '../../../types/class';
import { OnlineCourse, CourseModule } from '../../../types/course';
import { ArrowLeft, Calendar, FileText, GraduationCap, BookOpen } from 'lucide-react';
import { StudentClassSchedule } from '../../../components/student/presential/StudentClassSchedule';
import { StudentCourseEdital } from '../../../components/student/courses/edital/StudentCourseEdital';
import { StudentModuleCard } from '../../../components/student/courses/StudentModuleCard';
import { CoursePlayer } from '../../../components/student/courses/player/CoursePlayer';
import { StudentPedagogicalPlanning } from '../../../components/student/presential/StudentPedagogicalPlanning';

export const StudentPresentialDetails: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'PLANNING' | 'EDITAL' | 'TEACHING'>('TEACHING');
  const [loading, setLoading] = useState(true);
  
  // Teaching Tab State
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [loadingModules, setLoadingModules] = useState(false);

  useEffect(() => {
    const fetchClass = async () => {
      if (classId) {
        try {
          const data = await classService.getClassById(classId);
          setCurrentClass(data);
        } catch (error) {
          console.error("Error fetching class:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClass();
  }, [classId]);

  useEffect(() => {
    const fetchModules = async () => {
      if (activeTab === 'TEACHING' && currentClass) {
        setLoadingModules(true);
        try {
          const data = await courseService.getModules(currentClass.id);
          setModules(data);
        } catch (error) {
          console.error("Error fetching modules:", error);
        } finally {
          setLoadingModules(false);
        }
      }
    };

    fetchModules();
  }, [activeTab, currentClass]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!currentClass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
        <h2 className="text-2xl font-bold mb-4">Turma não encontrada</h2>
        <button 
          onClick={() => navigate('/app/presential')}
          className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Voltar para Turmas
        </button>
      </div>
    );
  }

  // Adapter to use CoursePlayer with Class data
  const fakeCourse: OnlineCourse = {
    id: currentClass.id,
    title: currentClass.name,
    coverUrl: currentClass.coverImage,
    bannerUrlDesktop: currentClass.bannerUrlDesktop,
    bannerUrlMobile: currentClass.bannerUrlMobile,
    categoryId: currentClass.category,
    subcategoryId: currentClass.subcategory,
    organization: currentClass.organization,
    createdAt: currentClass.createdAt || new Date().toISOString(),
    updatedAt: currentClass.updatedAt || new Date().toISOString(),
    active: true
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 pb-20">
      {/* --- BANNER RESPONSIVO --- */}
      <div className="relative w-full bg-zinc-900">
        <button 
          onClick={() => navigate('/app/presential')}
          className="absolute top-4 left-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
        >
          <ArrowLeft size={24} />
        </button>
        
        <picture>
          <source 
            media="(min-width: 768px)" 
            srcSet={currentClass.bannerUrlDesktop || currentClass.coverImage} 
          />
          <img 
            src={currentClass.bannerUrlMobile || currentClass.coverImage} 
            alt={`Banner da turma ${currentClass.name}`} 
            className="w-full h-48 md:h-[400px] object-cover border-b border-red-600/30 shadow-lg"
          />
        </picture>
        
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent h-24 md:h-32 pointer-events-none"></div>
      </div>

      {/* --- NAVEGAÇÃO DE ABAS --- */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-zinc-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-1 md:space-x-8 overflow-x-auto no-scrollbar py-2">
            <button
              onClick={() => setActiveTab('SCHEDULE')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm md:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'SCHEDULE' 
                  ? 'border-red-600 text-red-600' 
                  : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Calendar size={18} />
              <span>CRONOGRAMA</span>
            </button>

            <button
              onClick={() => setActiveTab('PLANNING')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm md:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'PLANNING' 
                  ? 'border-red-600 text-red-600' 
                  : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <BookOpen size={18} />
              <span>PLANEJAMENTO PEDAGÓGICO</span>
            </button>

            <button
              onClick={() => setActiveTab('EDITAL')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm md:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'EDITAL' 
                  ? 'border-red-600 text-red-600' 
                  : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <FileText size={18} />
              <span>EDITAL VERTICALIZADO</span>
            </button>

            <button
              onClick={() => setActiveTab('TEACHING')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm md:text-base font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeTab === 'TEACHING' 
                  ? 'border-red-600 text-red-600' 
                  : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <GraduationCap size={18} />
              <span>ÁREA DE ENSINO</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- ÁREA DE CONTEÚDO --- */}
      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
        {activeTab === 'SCHEDULE' && (
          <StudentClassSchedule classId={currentClass.id} />
        )}

        {activeTab === 'PLANNING' && (
          <StudentPedagogicalPlanning classId={currentClass.id} />
        )}

        {activeTab === 'EDITAL' && (
          <StudentCourseEdital courseId={currentClass.id} />
        )}

        {activeTab === 'TEACHING' && (
          selectedModule ? (
            <CoursePlayer 
              course={fakeCourse} 
              module={selectedModule} 
              onBack={() => setSelectedModule(null)} 
            />
          ) : (
            loadingModules ? (
              <div className="flex gap-4 overflow-hidden">
                {[1,2,3].map(i => <div key={i} className="w-60 h-[300px] bg-gray-900 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-200 flex items-center">
                  <GraduationCap className="mr-2 text-red-500" />
                  Módulos de Ensino
                </h3>
                
                {modules.length === 0 ? (
                  <div className="p-8 text-center bg-gray-900/50 rounded-xl border border-gray-800 text-gray-500">
                    Nenhum módulo disponível para esta turma.
                  </div>
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
                )}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
};
