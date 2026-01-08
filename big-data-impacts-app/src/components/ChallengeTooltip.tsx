import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { getChallengeInfo, type ChallengeInfo } from '../data/challengesData';

interface ChallengeTooltipProps {
  challengeName: string;
}

export function ChallengeTooltip({ challengeName }: ChallengeTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const challengeInfo = getChallengeInfo(challengeName);

  if (!challengeInfo) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors ml-1"
        title="En savoir plus sur ce défi"
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
                <h3 className="text-xl font-bold text-gray-900">{challengeInfo.name}</h3>
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
                  <p className="text-gray-700">{challengeInfo.description}</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Comment identifier ce défi ?</h4>
                  <p className="text-blue-800 text-sm">{challengeInfo.reasoning}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Stratégies de mitigation</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {challengeInfo.mitigation.map((mit, index) => (
                      <li key={index}>{mit}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Exemples de cas d'usage</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {challengeInfo.examples.map((example, index) => (
                      <li key={index}>{example}</li>
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


