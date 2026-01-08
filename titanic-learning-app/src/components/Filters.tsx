import { Passenger } from '../types';
import './Filters.css';

interface FiltersProps {
  passengers: Passenger[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  sexe: string;
  classe: string;
  embarquement: string;
  survivant: string;
  ageMin: string;
  ageMax: string;
  prixMin: string;
  prixMax: string;
}

export function Filters({ passengers, filters, onFilterChange }: FiltersProps) {
  const uniqueSexe = Array.from(new Set(passengers.map(p => p.sexe)));
  const uniqueClasse = Array.from(new Set(passengers.map(p => p.classe))).sort();
  const uniqueEmbarquement = Array.from(new Set(passengers.map(p => p.embarquement))).sort();
  const uniqueSurvivant = Array.from(new Set(passengers.map(p => p.survivant)));

  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="filters">
      <div className="filter-group">
        <label>Recherche globale</label>
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label>Sexe</label>
          <select
            value={filters.sexe}
            onChange={(e) => updateFilter('sexe', e.target.value)}
            className="filter-select"
          >
            <option value="">Tous</option>
            {uniqueSexe.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Classe</label>
          <select
            value={filters.classe}
            onChange={(e) => updateFilter('classe', e.target.value)}
            className="filter-select"
          >
            <option value="">Toutes</option>
            {uniqueClasse.map(c => (
              <option key={c} value={c.toString()}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Embarquement</label>
          <select
            value={filters.embarquement}
            onChange={(e) => updateFilter('embarquement', e.target.value)}
            className="filter-select"
          >
            <option value="">Tous</option>
            {uniqueEmbarquement.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Survivant</label>
          <select
            value={filters.survivant}
            onChange={(e) => updateFilter('survivant', e.target.value)}
            className="filter-select"
          >
            <option value="">Tous</option>
            {uniqueSurvivant.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label>Âge min</label>
          <input
            type="number"
            value={filters.ageMin}
            onChange={(e) => updateFilter('ageMin', e.target.value)}
            placeholder="0"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Âge max</label>
          <input
            type="number"
            value={filters.ageMax}
            onChange={(e) => updateFilter('ageMax', e.target.value)}
            placeholder="100"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Prix min</label>
          <input
            type="number"
            step="0.01"
            value={filters.prixMin}
            onChange={(e) => updateFilter('prixMin', e.target.value)}
            placeholder="0"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Prix max</label>
          <input
            type="number"
            step="0.01"
            value={filters.prixMax}
            onChange={(e) => updateFilter('prixMax', e.target.value)}
            placeholder="1000"
            className="filter-input"
          />
        </div>
      </div>
    </div>
  );
}
