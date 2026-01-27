#!/usr/bin/env node
/**
 * Injecte les quiz des modules 8 à 13 dans les cours Exchange correspondants.
 * Chaque quiz est ajouté à la fin du premier module du cours.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const quizPath = path.join(root, 'quiz-exchange-modules-8-a-13.json');
const quizzes = JSON.parse(fs.readFileSync(quizPath, 'utf8')).quizzes;

const courses = [
  { file: 'course-exchange-partie8-complet.json', moduleIndex: 0 },
  { file: 'course-exchange-partie9-complet.json', moduleIndex: 0 },
  { file: 'course-exchange-partie10-complet.json', moduleIndex: 0 },
  { file: 'course-exchange-partie11-complet.json', moduleIndex: 0 },
  { file: 'course-exchange-partie12-complet.json', moduleIndex: 0 },
  { file: 'course-exchange-partie13-complet.json', moduleIndex: 0 },
];

for (let i = 0; i < 6; i++) {
  const courseFile = path.join(root, courses[i].file);
  const quiz = quizzes[i].quizItem;
  if (!fs.existsSync(courseFile)) {
    console.warn('Skip (file not found):', courses[i].file);
    continue;
  }
  const course = JSON.parse(fs.readFileSync(courseFile, 'utf8'));
  const moduleIdx = courses[i].moduleIndex;
  const mod = course.modules[moduleIdx];
  if (!mod || !mod.items) {
    console.warn('Skip (no module/items):', courses[i].file);
    continue;
  }
  const nextPos = mod.items.length + 1;
  const quizItem = JSON.parse(JSON.stringify({ ...quiz, position: nextPos }));
  mod.items.push(quizItem);
  fs.writeFileSync(courseFile, JSON.stringify(course, null, 2), 'utf8');
  console.log('OK:', courses[i].file, '— quiz module', (8 + i), 'ajouté (position', nextPos + ')');
}

console.log('Terminé.');
