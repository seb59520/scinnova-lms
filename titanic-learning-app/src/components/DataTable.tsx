import { useState, useMemo } from 'react';
import { Passenger } from '../types';
import { FilterState } from './Filters';
import './DataTable.css';

interface DataTableProps {
  passengers: Passenger[];
  filters: FilterState;
}

type SortColumn = keyof Passenger | null;
type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ passengers, filters }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredPassengers = useMemo(() => {
    let filtered = [...passengers];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.sexe.toLowerCase().includes(searchLower) ||
        p.classe.toString().includes(searchLower) ||
        p.embarquement.toLowerCase().includes(searchLower) ||
        p.survivant.toLowerCase().includes(searchLower) ||
        (p.age !== null && p.age.toString().includes(searchLower)) ||
        p.prix.toString().includes(searchLower)
      );
    }

    if (filters.sexe) {
      filtered = filtered.filter(p => p.sexe === filters.sexe);
    }

    if (filters.classe) {
      filtered = filtered.filter(p => p.classe === parseInt(filters.classe, 10));
    }

    if (filters.embarquement) {
      filtered = filtered.filter(p => p.embarquement === filters.embarquement);
    }

    if (filters.survivant) {
      filtered = filtered.filter(p => p.survivant === filters.survivant);
    }

    if (filters.ageMin) {
      const min = parseFloat(filters.ageMin);
      filtered = filtered.filter(p => p.age !== null && p.age >= min);
    }

    if (filters.ageMax) {
      const max = parseFloat(filters.ageMax);
      filtered = filtered.filter(p => p.age !== null && p.age <= max);
    }

    if (filters.prixMin) {
      const min = parseFloat(filters.prixMin);
      filtered = filtered.filter(p => p.prix >= min);
    }

    if (filters.prixMax) {
      const max = parseFloat(filters.prixMax);
      filtered = filtered.filter(p => p.prix <= max);
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === null) return 1;
        if (bVal === null) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [passengers, filters, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredPassengers.length / itemsPerPage);
  const paginatedPassengers = filteredPassengers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: keyof Passenger) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: keyof Passenger) => {
    if (sortColumn !== column) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="data-table-container">
      <div className="table-info">
        <p>
          <strong>{filteredPassengers.length}</strong> ligne(s) affichée(s) sur {passengers.length}
        </p>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('sexe')}>
                Sexe {getSortIcon('sexe')}
              </th>
              <th onClick={() => handleSort('age')}>
                Âge {getSortIcon('age')}
              </th>
              <th onClick={() => handleSort('classe')}>
                Classe {getSortIcon('classe')}
              </th>
              <th onClick={() => handleSort('prix')}>
                Prix {getSortIcon('prix')}
              </th>
              <th onClick={() => handleSort('embarquement')}>
                Embarquement {getSortIcon('embarquement')}
              </th>
              <th onClick={() => handleSort('survivant')}>
                Survivant {getSortIcon('survivant')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedPassengers.map((passenger, index) => (
              <tr key={index}>
                <td>{passenger.sexe}</td>
                <td>{passenger.age !== null ? passenger.age : '?'}</td>
                <td>{passenger.classe}</td>
                <td>{passenger.prix.toFixed(2)}</td>
                <td>{passenger.embarquement}</td>
                <td>{passenger.survivant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Précédent
          </button>
          <span className="page-info">
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
