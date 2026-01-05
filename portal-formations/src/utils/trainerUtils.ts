/**
 * Utilitaires pour le dashboard Formateur
 */

/**
 * Formate une date relative (ex: "il y a 2 jours") avec date et heure complètes
 */
export function formatRelativeDate(date: string | null): string {
  if (!date) return 'Jamais';
  
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Si moins de 24h, afficher date et heure
  if (diffDays === 0) {
    const timeStr = then.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffHours > 0) {
      return `Aujourd'hui à ${timeStr} (il y a ${diffHours}h)`;
    } else if (diffMinutes > 0) {
      return `Aujourd'hui à ${timeStr} (il y a ${diffMinutes}min)`;
    } else {
      return `Aujourd'hui à ${timeStr}`;
    }
  }

  // Si moins de 7 jours, afficher date et heure
  if (diffDays <= 7) {
    const dateStr = then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const timeStr = then.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} à ${timeStr} (il y a ${diffDays}j)`;
  }

  // Sinon, afficher date complète avec heure
  return then.toLocaleString('fr-FR', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Formate un pourcentage avec 1 décimale
 */
export function formatPercent(value: number | null, decimals: number = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formate un score sur 100
 */
export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return 'N/A';
  return `${Math.round(score)}/100`;
}

/**
 * Formate une durée en minutes
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return 'N/A';
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
}

/**
 * Calcule le nombre de jours depuis une date
 */
export function daysSince(date: string | null): number {
  if (!date) return Infinity;
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Vérifie si une date est dans les 7 derniers jours
 */
export function isWithin7Days(date: string | null): boolean {
  return daysSince(date) <= 7;
}

/**
 * Obtient une couleur selon un pourcentage (vert/orange/rouge)
 */
export function getPercentColor(percent: number | null): string {
  if (percent === null || percent === undefined) return 'gray';
  if (percent >= 80) return 'green';
  if (percent >= 60) return 'yellow';
  return 'red';
}

/**
 * Obtient une couleur selon un score (vert/orange/rouge)
 */
export function getScoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'gray';
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
}

/**
 * Formate un nom d'utilisateur (fallback sur email si pas de display_name)
 */
export function formatUserName(displayName: string | null, email: string | null): string {
  return displayName || email || 'Utilisateur inconnu';
}

