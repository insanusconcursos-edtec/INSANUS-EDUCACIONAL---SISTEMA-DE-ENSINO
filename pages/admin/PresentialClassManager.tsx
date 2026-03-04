import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, DollarSign, BookOpen, Clock } from 'lucide-react';
import { classService } from '../../services/classService';
import { Class } from '../../types/class';
import { RemunerationTab } from '../../components/admin/presential/classes/manager/RemunerationTab';
import { SubjectsTab } from '../../components/admin/presential/classes/manager/SubjectsTab';
import { formatSafeDateLocal } from '../../utils/dateUtils';

const PresentialClassManager: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  console.log("Montou Gerenciador da Turma:", classId);
  const navigate = useNavigate();
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchClass = async () => {
    if (!classId) return;
    try {
      setLoading(true);
      const data = await classService.getClassById(classId);
      setCurrentClass(data);
    } catch (error) {
      console.error("Error fetching class:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClass();
  }, [classId]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-white">Carregando...</div>;
  }

  if (!currentClass) {
    return <div className="flex items-center justify-center h-screen text-white">Turma não encontrada.</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
             {/* Stats Cards Placeholder */}
             <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                <h3 className="text-zinc-400 text-sm font-bold uppercase mb-2">Total de Encontros</h3>
                <p className="text-3xl font-bold text-white">{currentClass.totalMeetings}</p>
             </div>
             <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                <h3 className="text-zinc-400 text-sm font-bold uppercase mb-2">Alunos Matriculados</h3>
                <p className="text-3xl font-bold text-white">0/50</p>
             </div>
             <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                <h3 className="text-zinc-400 text-sm font-bold uppercase mb-2">Status</h3>
                <p className="text-3xl font-bold text-white">{currentClass.status}</p>
             </div>
          </div>
        );
      case 'remuneration':
        return <RemunerationTab cls={currentClass} onUpdate={fetchClass} />;
      case 'subjects':
        return <SubjectsTab cls={currentClass} />;
      case 'schedule':
        return <div className="p-6 text-white">Aba de Cronograma em construção...</div>;
      case 'students':
        return <div className="p-6 text-white">Aba de Alunos em construção...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <button 
          onClick={() => navigate('/admin/presential')}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Turmas
        </button>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
          <div className="w-24 h-32 rounded-lg overflow-hidden bg-zinc-800 shrink-0 shadow-lg">
            {currentClass.coverImage ? (
              <img src={currentClass.coverImage} alt={currentClass.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold text-xs">SEM CAPA</div>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-tight">{currentClass.name}</h1>
              <span className="px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-xs font-bold border border-brand-red/20">
                {currentClass.type}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{currentClass.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{currentClass.shift === 'MORNING' ? 'Manhã' : currentClass.shift === 'AFTERNOON' ? 'Tarde' : 'Noite'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Início: {formatSafeDateLocal(currentClass.startDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-800">
        <nav className="flex gap-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão Geral', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'remuneration', label: 'Remuneração', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'subjects', label: 'Disciplinas', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'schedule', label: 'Cronograma', icon: <Calendar className="w-4 h-4" /> },
            { id: 'students', label: 'Alunos', icon: <Users className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 pb-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2
                ${activeTab === tab.id 
                  ? 'border-brand-red text-white' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PresentialClassManager;
