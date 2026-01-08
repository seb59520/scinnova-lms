import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { getTechnologyInfo, type TechnologyInfo } from '../data/technologiesData';

interface TechnologyTooltipProps {
  technologyName: string;
}

export function TechnologyTooltip({ technologyName }: TechnologyTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const techInfo = getTechnologyInfo(technologyName);

  if (!techInfo) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors ml-1"
        title="En savoir plus sur cette technologie"
      >
        <Info className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{techInfo.name}</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{techInfo.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Fonctions principales</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {techInfo.mainFunctions.map((func, index) => (
                      <li key={index}>{func}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Cas d'usage typiques</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {techInfo.useCases.map((useCase, index) => (
                      <li key={index}>{useCase}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}


