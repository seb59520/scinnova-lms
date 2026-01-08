import { useState } from 'react';
import { ModuleId } from './types';
import { Layout } from './components/Layout';
import { BigData } from './modules/BigData';
import { DataScience } from './modules/DataScience';
import { MachineLearning } from './modules/MachineLearning';
import { TITANIC_DATA } from './data/titanic';
import './App.css';

function App() {
  const [currentModule, setCurrentModule] = useState<ModuleId>('big-data');

  const renderModule = () => {
    switch (currentModule) {
      case 'big-data':
        return <BigData passengers={TITANIC_DATA} />;
      case 'data-science':
        return <DataScience passengers={TITANIC_DATA} />;
      case 'machine-learning':
        return <MachineLearning passengers={TITANIC_DATA} />;
      default:
        return null;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
      {renderModule()}
    </Layout>
  );
}

export default App;
