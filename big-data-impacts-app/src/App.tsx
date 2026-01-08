import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UseCasesList } from './pages/UseCasesList';
import { UseCaseForm } from './pages/UseCaseForm';
import { UseCaseDetail } from './pages/UseCaseDetail';
import { Visualizations } from './pages/Visualizations';
import { Compare } from './pages/Compare';
import { Mailbox } from './pages/Mailbox';
import { DataScienceExercises } from './pages/DataScienceExercises';
import { DataScienceExerciseDetail } from './pages/DataScienceExerciseDetail';
import MLPlayground from './pages/MLPlayground';
import { useUseCaseStore } from './store/useCaseStore';
import { initialUseCases } from './data/initialData';
import { useEffect } from 'react';

function App() {
  const { loadFromStorage, addUseCase } = useUseCaseStore();

  useEffect(() => {
    loadFromStorage();
    
    // Initialiser avec les données de base si le localStorage est vide
    const stored = localStorage.getItem('big-data-use-cases');
    if (!stored || stored === '[]') {
      // Attendre un peu pour que le store se charge
      setTimeout(() => {
        initialUseCases.forEach((uc) => {
          addUseCase(uc);
        });
      }, 200);
    }
  }, [loadFromStorage, addUseCase]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/ml-playground" element={<MLPlayground />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/use-cases" element={<UseCasesList />} />
                <Route path="/use-cases/new" element={<UseCaseForm />} />
                <Route path="/use-cases/:id" element={<UseCaseDetail />} />
                <Route path="/use-cases/:id/edit" element={<UseCaseForm />} />
                <Route path="/visualizations" element={<Visualizations />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/mailbox" element={<Mailbox />} />
                <Route path="/data-science/exercises" element={<DataScienceExercises />} />
                <Route path="/data-science/exercises/:id" element={<DataScienceExerciseDetail />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
