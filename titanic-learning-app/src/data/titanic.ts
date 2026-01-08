import { Passenger } from '../types';

const CSV_DATA = `Sexe,Age,Classe,Prix,Embarquement,Survivant
female,29,1,211.34,C,oui
male,35,3,7.25,S,non
female,22,3,7.92,S,oui
male,54,1,51.86,S,non
male,2,3,21.07,C,oui
female,38,1,71.28,C,oui
male,19,3,7.85,S,non
female,45,2,13.00,S,oui
male,,3,8.05,S,non
female,14,2,30.07,C,oui
male,27,1,76.73,C,non
male,31,3,7.75,Q,non
female,24,3,16.70,S,oui
male,65,1,26.55,S,non
female,50,1,83.16,C,oui
male,40,2,26.00,S,non
female,,3,7.23,C,oui
male,18,3,7.90,S,non
female,33,2,10.50,S,oui
male,47,1,52.00,S,non
female,8,3,21.07,C,oui
male,28,2,13.00,S,non
female,60,1,79.20,C,oui
male,21,3,7.05,S,non
female,36,1,120.00,S,oui`;

export function parseCSV(): Passenger[] {
  const lines = CSV_DATA.trim().split('\n');
  const passengers: Passenger[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const passenger: Passenger = {
      sexe: values[0].toLowerCase() as 'male' | 'female',
      age: values[1] === '' ? null : parseFloat(values[1]),
      classe: parseInt(values[2], 10),
      prix: parseFloat(values[3]),
      embarquement: values[4] as 'S' | 'C' | 'Q',
      survivant: values[5].toLowerCase() === 'oui' ? 'oui' : 'non',
    };
    passengers.push(passenger);
  }

  return passengers;
}

export const TITANIC_DATA = parseCSV();
