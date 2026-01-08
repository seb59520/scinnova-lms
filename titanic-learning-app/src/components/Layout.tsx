import { ReactNode, useState } from 'react';
import { ModuleId } from '../types';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  currentModule: ModuleId;
  onModuleChange: (module: ModuleId) => void;
}

export function Layout({ children, currentModule, onModuleChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const modules: { id: ModuleId; label: string }[] = [
    { id: 'big-data', label: 'Big Data' },
    { id: 'data-science', label: 'Data Science' },
    { id: 'machine-learning', label: 'Machine Learning' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1>Titanic Learning App</h1>
      </header>

      <div className="layout-content">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav>
            {modules.map((module) => (
              <button
                key={module.id}
                className={`nav-item ${currentModule === module.id ? 'active' : ''}`}
                onClick={() => {
                  onModuleChange(module.id);
                  setSidebarOpen(false);
                }}
              >
                {module.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
