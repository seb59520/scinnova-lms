const fs = require('fs');

// Lire le fichier technologies
const techContent = fs.readFileSync('src/data/technologiesData.ts', 'utf8');
const techMatches = techContent.matchAll(/name: '([^']+)',[\s\S]*?description: '([^']+)',[\s\S]*?mainFunctions: \[([\s\S]*?)\],[\s\S]*?useCases: \[([\s\S]*?)\]/g);

console.log('═══════════════════════════════════════════════════════════');
console.log('📊 BASE DE DONNÉES DES TECHNOLOGIES (18 technologies)');
console.log('═══════════════════════════════════════════════════════════\n');

let techCount = 0;
for (const match of techContent.matchAll(/name: '([^']+)'/g)) {
  techCount++;
  console.log(`${techCount}. ${match[1]}`);
}

// Lire le fichier défis
const challContent = fs.readFileSync('src/data/challengesData.ts', 'utf8');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('⚠️  BASE DE DONNÉES DES DÉFIS (17 défis)');
console.log('═══════════════════════════════════════════════════════════\n');

let challCount = 0;
for (const match of challContent.matchAll(/name: '([^']+)'/g)) {
  challCount++;
  console.log(`${challCount}. ${match[1]}`);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('💡 Pour voir les détails complets :');
console.log('   1. Ouvrez src/data/technologiesData.ts');
console.log('   2. Ouvrez src/data/challengesData.ts');
console.log('   3. Ou utilisez l\'application : npm run dev');
console.log('═══════════════════════════════════════════════════════════\n');
