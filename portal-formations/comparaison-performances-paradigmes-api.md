# 📊 Comparaison des performances des paradigmes d'API

> Support visuel clair et pédagogique pour comparer les performances des principaux paradigmes d'API.
> Pensé pour être directement intégrable dans un slide.

---

## 📋 Vue synthétique (tableau comparatif)

| Paradigme API | Latence | Bande passante | Scalabilité | Complexité | Cas d'usage typiques |
|---------------|---------|----------------|-------------|------------|---------------------|
| **REST** | 🟡 Moyenne | 🟡 Moyenne | 🟢 Bonne | 🟢 Faible | APIs web classiques, CRUD, back-office |
| **GraphQL** | 🟢 Faible | 🟢 Optimisée | 🟡 Moyenne | 🔴 Élevée | Frontend complexes, apps mobiles |
| **SOAP** | 🔴 Élevée | 🔴 Lourde | 🟡 Moyenne | 🔴 Élevée | Systèmes legacy, banque, assurance |
| **gRPC** | 🟢 Très faible | 🟢 Très optimisée | 🟢 Excellente | 🔴 Élevée | Microservices, inter-services |
| **WebSocket** | 🟢 Très faible | 🟢 Continue | 🟡 Moyenne | 🟡 Moyenne | Temps réel (chat, jeux, IoT) |
| **Event-Driven** (Kafka, MQ) | 🟢 Asynchrone | 🟢 Massive | 🟢 Excellente | 🔴 Élevée | Big Data, streaming, SI distribués |

---

## 📈 Lecture "performance pure"

### ⚡ Latence (du plus rapide au plus lent)

```
gRPC ≈ WebSocket
    ↓
GraphQL
    ↓
REST
    ↓
SOAP
```

### 📦 Consommation réseau

```
gRPC (binaire)
    ↓
GraphQL (données ciblées)
    ↓
REST (JSON standard)
    ↓
SOAP (XML verbeux)
```

### 📈 Scalabilité

```
Event-Driven
    ↓
gRPC
    ↓
REST
    ↓
GraphQL
    ↓
SOAP
```

---

## 🎯 Lecture pédagogique (message clé à faire passer)

### ❌ Il n'existe PAS "la meilleure API"
### ✅ Il existe la meilleure API pour un contexte donné

| Contexte | Paradigme recommandé |
|----------|---------------------|
| CRUD simple | **REST** |
| Frontend riche / mobile | **GraphQL** |
| Microservices performants | **gRPC** |
| Temps réel | **WebSocket** |
| Systèmes critiques legacy | **SOAP** |
| Architecture à grande échelle | **Event-Driven** |

---

## 🎓 Version "slide unique" (recommandée)

### 👉 Titre du slide

**Comparer les paradigmes d'API : performances & usages**

### 👉 Visuel central

- **Tableau comparatif** (voir section "Vue synthétique" ci-dessus)
- **Icônes** ⚡📦📈 pour Latence / Réseau / Scalabilité

### 👉 Phrase de conclusion

> **La performance n'est pas une valeur absolue, mais un compromis.**

---

## 📝 Notes pédagogiques

### Points clés à retenir

1. **Pas de solution universelle** : Chaque paradigme a ses forces et faiblesses
2. **Contexte avant tout** : Le choix dépend des besoins métier et techniques
3. **Compromis nécessaire** : Performance vs Complexité vs Maintenabilité
4. **Évolution possible** : Un système peut utiliser plusieurs paradigmes (ex: REST + WebSocket)

### Questions à poser pour choisir

- Quel est le volume de données à transférer ?
- Quelle est la fréquence des requêtes ?
- Faut-il du temps réel ?
- Quelle est la complexité acceptable ?
- Quels sont les contraintes réseau (mobile, IoT) ?
- Y a-t-il des systèmes legacy à intégrer ?

---

## 🔗 Ressources complémentaires

- [Exemples REST](exemple-ressource-api-rest-sites.json)
- [Exemples GraphQL](exemple-ressource-graphql-sites.json)
- [Exemples gRPC](exemple-ressource-rpc-grpc-sites.json)



