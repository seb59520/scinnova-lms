export const exercisesData = {
  title: "Exercices — Données massives (Décideurs)",
  description: "Opportunités, défis, et modèles économiques basés sur la donnée — avec réponses participants + corrigés (mode formateur).",
  exercises: [
    {
      id: "ex1",
      title: "Exercice 1 — Identifier les opportunités réelles de la donnée",
      objective: "Comprendre où la donnée crée de la valeur, indépendamment des outils.",
      learnerPrompt: "Vous êtes membre d'un comité de direction. Identifiez les données déjà produites par votre organisation et ce qu'elles pourraient permettre de mieux décider.",
      tasks: [
        "Lister 3 types de données existantes (clients, usage, opérationnelles, financières, etc.).",
        "Pour chaque type : ce qu'elle décrit + quelle décision elle peut améliorer.",
        "Classer ces opportunités par impact : fort / moyen / faible.",
        "Restitution : quelle donnée est la plus sous-exploitée aujourd'hui, et pourquoi ?"
      ],
      solution: {
        expected: [
          "Exemples : historique d'achat → fidélisation/ciblage ; données d'usage → adaptation offre/abonnement ; données opérationnelles (délais/incidents) → optimisation processus.",
          "Un classement attendu : fort impact si lié directement à la valeur client/CA ; moyen pour optimisation interne ; faible si descriptif non actionnable."
        ],
        table: {
          headers: ["Type de données", "Exemples", "Opportunités de décision"],
          rows: [
            ["Données clients", "Historique d'achat, churn, segments", "Fidélisation, ciblage, pricing"],
            ["Données d'usage", "Fréquence, parcours, fonctionnalités", "Personnalisation, roadmap, offre à l'usage"],
            ["Données opérationnelles", "Délais, incidents, charge", "Optimisation, qualité, capacité"]
          ]
        },
        keyMessage: "Une donnée n'a de valeur que si elle éclaire une décision concrète."
      }
    },
    {
      id: "ex2",
      title: "Exercice 2 — Avant / Après : transformer une décision avec la donnée",
      objective: "Visualiser le changement de posture décisionnelle.",
      learnerPrompt: "Choisissez une décision stratégique prise régulièrement (investir, ajuster une offre, planifier, allouer un budget, etc.) et comparez \"avant\" et \"aujourd'hui\" avec la donnée.",
      tasks: [
        "Décrire la décision choisie (1 phrase).",
        "Compléter : sur quoi reposait la décision avant ?",
        "Compléter : quels indicateurs/scénarios existent aujourd'hui ?",
        "Question : la donnée réduit-elle le risque… ou le déplace-t-elle ? Vers où ?"
      ],
      solution: {
        expected: [
          "Avant : intuition/expérience + reporting ponctuel ; décision retardée ; faible capacité d'ajustement.",
          "Aujourd'hui : indicateurs continus + scénarios ; décision plus tôt ; ajustements rapides.",
          "Risque déplacé : vers la qualité des données, les biais, et la surconfiance dans les chiffres."
        ],
        table: {
          headers: ["Critère", "Avant", "Aujourd'hui"],
          rows: [
            ["Base de décision", "Intuition, expérience, reporting mensuel", "Indicateurs mesurés, tendances, scénarios"],
            ["Temporalité", "Retardée (après-coup)", "Quasi temps réel / pilotage continu"],
            ["Risque principal", "Subjectivité", "Qualité/biais/alignement des données"],
            ["Ajustement", "Faible", "Élevé (itérations rapides)"]
          ]
        },
        keyMessage: "La donnée ne supprime pas le risque : elle le déplace."
      }
    },
    {
      id: "ex3",
      title: "Exercice 3 — Identifier les défis critiques pour la direction",
      objective: "Prendre conscience des risques non techniques.",
      learnerPrompt: "Cochez les défis data les plus critiques pour votre organisation, puis analysez-en deux : pourquoi c'est un risque réel, et ce qui se passe si on ne le traite pas.",
      tasks: [
        "Sélectionner 3 défis critiques (surcharge d'indicateurs, fiabilité, culture data, réglementation, etc.).",
        "Pour 2 défis : expliquer le risque + conséquences si non traité.",
        "Proposer 1 mesure simple de réduction de risque par défi (non technique)."
      ],
      solution: {
        expected: [
          "Défis fréquents : trop d'indicateurs → paralysie ; fiabilité → décisions biaisées ; culture data faible → mauvaise interprétation ; réglementation → risques réputationnels/juridiques.",
          "Attendu : expliquer en termes de pilotage, confiance, responsabilité et image, pas en termes d'outils.",
          "Mesures : définir un \"indicateur North Star\", instaurer une définition unique des KPI, revue de qualité, règles d'accès, owner par domaine."
        ],
        keyMessage: "Le danger n'est pas d'avoir peu de données, mais de décider avec assurance sur une mauvaise donnée."
      }
    },
    {
      id: "ex4",
      title: "Exercice 4 — Étude de cas : modèle économique basé sur la donnée",
      objective: "Raisonner en business model, pas en technologie.",
      learnerPrompt: "Cas : une entreprise vend un produit physique et dispose de données d'usage. Proposez 2 évolutions du modèle : une prudente et une disruptive.",
      tasks: [
        "Évolution prudente : valeur client + valeur entreprise + risque principal.",
        "Évolution disruptive : valeur client + valeur entreprise + risque principal.",
        "Conclusion : la donnée optimise-t-elle le modèle existant ou le transforme-t-elle ?"
      ],
      solution: {
        expected: [
          "Prudente : ajout de services (maintenance prédictive, tableau de bord, conseils) → abonnement complémentaire ; risque : adoption client / promesse mal tenue.",
          "Disruptive : facturation à l'usage, passage en \"as-a-service\", recommandations/alertes premium ; risque : transformation interne, dépendance data, acceptabilité."
        ],
        keyMessage: "La donnée peut optimiser un modèle… ou le transformer complètement."
      }
    },
    {
      id: "ex5",
      title: "Exercice 5 — Arbitrage stratégique : opportunité ou illusion ?",
      objective: "Former le jugement stratégique face aux projets \"data\".",
      learnerPrompt: "Une équipe propose un projet data séduisant mais incertain. Évaluez si c'est une opportunité réelle ou une illusion.",
      tasks: [
        "Citer 1 décision qui ne gagnerait pas à être automatisée (rare, humaine, politique).",
        "Citer 1 décision répétitive potentiellement automatisable (stable, fréquente).",
        "Choisir 1 indicateur prioritaire pour la direction (compréhensible, actionnable).",
        "Conclusion : aide à décider ou alibi pour éviter de décider ? Justifier."
      ],
      solution: {
        expected: [
          "Non automatisable : décisions rares et contextuelles (restructuration, crise sociale, arbitrage politique).",
          "Automatisable : décisions fréquentes et stables (priorisation tickets, relances, détection d'anomalies, scoring).",
          "Indicateur prioritaire : doit être aligné stratégie, partagé, actionnable (ex : churn, NPS, marge, délai, disponibilité)."
        ],
        keyMessage: "La donnée n'est pas une excuse pour ne pas décider : elle aide à assumer."
      }
    }
  ]
};
