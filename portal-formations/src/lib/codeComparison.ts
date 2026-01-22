/**
 * Fonction de comparaison de code Python
 * Calcule un pourcentage de similarité entre le code soumis et la solution
 */

/**
 * Normalise le code pour la comparaison
 * - Supprime les commentaires
 * - Normalise les espaces
 * - Supprime les lignes vides
 * - Normalise les guillemets
 */
function normalizeCode(code: string): string {
  if (!code) return '';
  
  let normalized = code;
  
  // Supprimer les commentaires (lignes commençant par #)
  normalized = normalized.split('\n')
    .map(line => {
      // Trouver le premier # qui n'est pas dans une chaîne
      const hashIndex = line.indexOf('#');
      if (hashIndex >= 0) {
        // Vérifier si le # est dans une chaîne
        const beforeHash = line.substring(0, hashIndex);
        const singleQuotes = (beforeHash.match(/'/g) || []).length;
        const doubleQuotes = (beforeHash.match(/"/g) || []).length;
        
        // Si nombre pair de guillemets, le # n'est pas dans une chaîne
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
          return line.substring(0, hashIndex).trim();
        }
      }
      return line;
    })
    .join('\n');
  
  // Normaliser les espaces multiples
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Normaliser les guillemets (remplacer ' par ")
  normalized = normalized.replace(/'/g, '"');
  
  // Supprimer les lignes vides
  normalized = normalized.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  // Supprimer les espaces en début/fin
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Calcule la similarité entre deux chaînes en utilisant la distance de Levenshtein
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  const matrix: number[][] = [];
  
  // Initialiser la première ligne et colonne
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Remplir la matrice
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Suppression
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calcule le pourcentage de similarité entre deux codes
 */
export function compareCode(userCode: string, solutionCode: string): {
  similarity: number;
  normalized: {
    user: string;
    solution: string;
  };
} {
  if (!userCode || !solutionCode) {
    return {
      similarity: 0,
      normalized: {
        user: normalizeCode(userCode || ''),
        solution: normalizeCode(solutionCode || '')
      }
    };
  }
  
  const normalizedUser = normalizeCode(userCode);
  const normalizedSolution = normalizeCode(solutionCode);
  
  // Si les codes normalisés sont identiques
  if (normalizedUser === normalizedSolution) {
    return {
      similarity: 100,
      normalized: {
        user: normalizedUser,
        solution: normalizedSolution
      }
    };
  }
  
  // Calculer la distance de Levenshtein
  const distance = levenshteinDistance(normalizedUser, normalizedSolution);
  const maxLength = Math.max(normalizedUser.length, normalizedSolution.length);
  
  // Calculer le pourcentage de similarité
  const similarity = maxLength > 0 
    ? Math.round(((maxLength - distance) / maxLength) * 100)
    : 0;
  
  return {
    similarity: Math.max(0, Math.min(100, similarity)),
    normalized: {
      user: normalizedUser,
      solution: normalizedSolution
    }
  };
}

/**
 * Analyse structurelle du code (détection de fonctions, imports, etc.)
 */
export function analyzeCodeStructure(code: string): {
  hasImports: boolean;
  hasFunctions: boolean;
  functionCount: number;
  hasMainBlock: boolean;
  lineCount: number;
} {
  if (!code) {
    return {
      hasImports: false,
      hasFunctions: false,
      functionCount: 0,
      hasMainBlock: false,
      lineCount: 0
    };
  }
  
  const lines = code.split('\n');
  const normalized = normalizeCode(code);
  
  // Détecter les imports
  const hasImports = /^(import|from)\s+\w+/.test(normalized);
  
  // Détecter les fonctions (def function_name)
  const functionMatches = normalized.match(/def\s+\w+\s*\(/g);
  const functionCount = functionMatches ? functionMatches.length : 0;
  const hasFunctions = functionCount > 0;
  
  // Détecter le bloc main (if __name__ == "__main__")
  const hasMainBlock = /if\s+__name__\s*==\s*["']__main__["']/.test(normalized);
  
  return {
    hasImports,
    hasFunctions,
    functionCount,
    hasMainBlock,
    lineCount: lines.filter(line => line.trim().length > 0).length
  };
}
