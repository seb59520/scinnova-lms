import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/AppHeader';
import { AdminCoursesContent } from './AdminCoursesContent';
import { AdminProgramsContent } from './AdminProgramsContent';
import { AdminUsersContent } from './AdminUsersContent';
import { AdminOrgsContent } from './AdminOrgsContent';
import { AdminItemsContent } from './AdminItemsContent';
import { AdminTrainerContent } from './AdminTrainerContent';
import { BookOpen, Layers, Users, Building2, FileText, GraduationCap, ChevronDown, MessageSquare, Clock, Sparkles } from 'lucide-react';
import '../../styles/admin-unified.css';

type AdminTab = 'courses' | 'programs' | 'users' | 'orgs' | 'items' | 'trainer';

interface SubMenu {
  id: string;
  label: string;
  icon: any;
  path: string;
}

interface TabWithSubMenu {
  id: AdminTab;
  label: string;
  icon: any;
  subMenus?: SubMenu[];
}

export function AdminUnified() {
  const [activeTab, setActiveTab] = useState<AdminTab>('courses');
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const subMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const tabs: TabWithSubMenu[] = [
    { id: 'courses' as AdminTab, label: 'Formations', icon: BookOpen },
    { id: 'programs' as AdminTab, label: 'Programmes', icon: Layers },
    { id: 'users' as AdminTab, label: 'Utilisateurs', icon: Users },
    { id: 'orgs' as AdminTab, label: 'Organisations', icon: Building2 },
    { id: 'items' as AdminTab, label: 'Éléments', icon: FileText },
    { 
      id: 'trainer' as AdminTab, 
      label: 'Formateur', 
      icon: GraduationCap,
      subMenus: [
        { id: 'quiz', label: 'Quiz', icon: MessageSquare, path: '/trainer/quiz-responses' },
        { id: 'analyses', label: 'Analyses IA', icon: Sparkles, path: '/trainer/use-case-analyses' },
        { id: 'time', label: 'Temps d\'écran', icon: Clock, path: '/trainer/time-tracking' },
      ]
    },
  ];

  // Fermer les sous-menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openSubMenu) {
        const ref = subMenuRefs.current[openSubMenu];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenSubMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openSubMenu]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="SCINNOVA - LMS" />
      
      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 items-center relative" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasSubMenus = tab.subMenus && tab.subMenus.length > 0;
              const isSubMenuOpen = openSubMenu === tab.id;

              return (
                <div key={tab.id} className="relative" ref={(el) => { subMenuRefs.current[tab.id] = el; }}>
                  <button
                    onClick={() => {
                      if (hasSubMenus) {
                        setOpenSubMenu(isSubMenuOpen ? null : tab.id);
                      } else {
                        setActiveTab(tab.id);
                        setOpenSubMenu(null);
                      }
                    }}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {hasSubMenus && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${isSubMenuOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {/* Sous-menu déroulant */}
                  {hasSubMenus && isSubMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                      {tab.subMenus!.map((subMenu) => {
                        const SubIcon = subMenu.icon;
                        return (
                          <button
                            key={subMenu.id}
                            onClick={() => {
                              navigate(subMenu.path);
                              setOpenSubMenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                          >
                            <SubIcon className="w-4 h-4 text-gray-500" />
                            {subMenu.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="admin-unified">
        {activeTab === 'courses' && <AdminCoursesContent />}
        {activeTab === 'programs' && <AdminProgramsContent />}
        {activeTab === 'users' && <AdminUsersContent />}
        {activeTab === 'orgs' && <AdminOrgsContent />}
        {activeTab === 'items' && <AdminItemsContent />}
        {activeTab === 'trainer' && <AdminTrainerContent />}
      </div>
    </div>
  );
}

