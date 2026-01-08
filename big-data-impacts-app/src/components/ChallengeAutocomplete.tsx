import { useState, useRef, useEffect } from 'react';
import { Search, Check } from 'lucide-react';
import { searchChallenges, type ChallengeInfo } from '../data/challengesData';

interface ChallengeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  existingChallenges: string[];
}

export function ChallengeAutocomplete({
  value,
  onChange,
  onAdd,
  existingChallenges
}: ChallengeAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<ChallengeInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length > 0) {
      const results = searchChallenges(value);
      setSuggestions(results.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (challenge: ChallengeInfo) => {
    onChange(challenge.name);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestions.length > 0) {
                  handleSelect(suggestions[0]);
                } else {
                  onAdd();
                }
              }
            }}
            onFocus={() => {
              if (value.trim().length > 0 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="input flex-1 pl-10"
            placeholder="Rechercher un défi (ex: Latence, Scalabilité...)"
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((challenge) => {
                const isAlreadyAdded = existingChallenges.includes(challenge.name);
                return (
                  <button
                    key={challenge.name}
                    type="button"
                    onClick={() => !isAlreadyAdded && handleSelect(challenge)}
                    disabled={isAlreadyAdded}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{challenge.name}</div>
                        <div className="text-sm text-gray-500 mt-1">{challenge.description}</div>
                      </div>
                      {isAlreadyAdded && (
                        <Check className="w-4 h-4 text-green-500 ml-2" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="btn-secondary"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
}

