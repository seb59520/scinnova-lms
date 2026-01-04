# TP : Analyser une requête HTTP

## 📋 Objectif pédagogique

À l'issue de ce TP, vous serez capable de :
- Utiliser les outils de développement du navigateur pour inspecter les requêtes HTTP
- Identifier et comprendre les composants d'une requête HTTP (méthode, URL, headers, body)
- Analyser les réponses HTTP (code de statut, headers, body)
- Comprendre le cycle de vie d'une requête HTTP
- Détecter les problèmes courants (erreurs 404, 500, timeouts)

## 🎯 Prérequis

- Navigateur web moderne (Chrome, Firefox, Edge, Safari)
- Connaissances de base sur le web (URL, navigateur)
- Aucune installation logicielle requise

---

## 📚 Partie 1 : Préparation de l'environnement

### Étape 1.1 : Ouvrir les outils de développement

**Action à réaliser :**

1. Ouvrez votre navigateur (Chrome recommandé pour ce TP)
2. Appuyez sur la touche **F12** (ou **Cmd+Option+I** sur Mac, **Ctrl+Shift+I** sur Windows/Linux)
3. Vous devriez voir un panneau s'ouvrir en bas ou sur le côté de votre navigateur

**Vérification :**
- ✅ Le panneau des outils de développement est visible
- ✅ Vous voyez plusieurs onglets : Elements, Console, Sources, Network, etc.

**Astuce :** Si le panneau ne s'ouvre pas, allez dans le menu :
- Chrome : Menu (⋮) → Plus d'outils → Outils de développement
- Firefox : Menu (☰) → Outils Web → Outils de développement
- Edge : Menu (⋯) → Plus d'outils → Outils de développement

---

### Étape 1.2 : Accéder à l'onglet Network (Réseau)

**Action à réaliser :**

1. Dans le panneau des outils de développement, cliquez sur l'onglet **"Network"** (ou **"Réseau"** en français)
2. Si vous ne voyez pas cet onglet, il peut être caché sous le menu **⋮** (trois points) → sélectionnez-le

**Vérification :**
- ✅ L'onglet Network est actif
- ✅ Vous voyez une liste (actuellement vide ou avec quelques requêtes)
- ✅ Vous voyez des colonnes : Name, Status, Type, Size, Time

**Ce que vous voyez :**
- **Name** : Nom de la ressource (fichier, API, etc.)
- **Status** : Code de statut HTTP (200, 404, etc.)
- **Type** : Type de ressource (document, xhr, fetch, etc.)
- **Size** : Taille de la réponse
- **Time** : Temps de chargement

---

### Étape 1.3 : Configurer l'affichage Network

**Action à réaliser :**

1. Vérifiez que le filtre **"All"** est sélectionné (en haut de l'onglet Network)
2. Cochez l'option **"Preserve log"** (Conserver le journal) si disponible
   - Cela permet de garder l'historique même lors de navigations
3. Décochez **"Disable cache"** pour l'instant (nous l'utiliserons plus tard)

**Vérification :**
- ✅ Le filtre "All" est actif
- ✅ Les options sont configurées comme indiqué

---

## 📚 Partie 2 : Capturer une requête simple

### Étape 2.1 : Nettoyer l'historique et recharger

**Action à réaliser :**

1. Cliquez sur le bouton **🚫** (Clear) pour effacer l'historique actuel
2. Naviguez vers une page web simple, par exemple : `https://jsonplaceholder.typicode.com/posts/1`
3. Observez la liste des requêtes qui apparaissent dans l'onglet Network

**Vérification :**
- ✅ L'historique a été effacé
- ✅ Après le rechargement, vous voyez au moins une requête dans la liste
- ✅ La requête principale (document HTML) apparaît en haut

**Ce qui se passe :**
- Le navigateur fait une requête GET vers l'URL
- Le serveur répond avec du contenu
- Cette transaction apparaît dans l'onglet Network

---

### Étape 2.2 : Sélectionner et examiner la requête principale

**Action à réaliser :**

1. Cliquez sur la première requête dans la liste (généralement celle qui correspond à l'URL de la page)
2. Un panneau de détails s'ouvre en dessous avec plusieurs onglets : Headers, Preview, Response, etc.

**Vérification :**
- ✅ La requête est sélectionnée (surbrillée)
- ✅ Le panneau de détails est visible
- ✅ Vous voyez les onglets : Headers, Preview, Response, Timing, etc.

---

## 📚 Partie 3 : Analyser les composants de la requête

### Étape 3.1 : Examiner les Headers de la requête (Request Headers)

**Action à réaliser :**

1. Dans le panneau de détails, cliquez sur l'onglet **"Headers"**
2. Faites défiler jusqu'à la section **"Request Headers"** (En-têtes de requête)
3. Identifiez et notez les en-têtes suivants :

**En-têtes à identifier :**

| En-tête | Description | Exemple de valeur |
|---------|-------------|-------------------|
| `Host` | Domaine du serveur | `jsonplaceholder.typicode.com` |
| `User-Agent` | Identifiant du navigateur | `Mozilla/5.0...` |
| `Accept` | Types de contenu acceptés | `text/html, application/json` |
| `Accept-Language` | Langues préférées | `fr-FR, fr;q=0.9` |
| `Accept-Encoding` | Encodages acceptés | `gzip, deflate, br` |
| `Connection` | Type de connexion | `keep-alive` |
| `Referer` | Page d'origine (si applicable) | URL de la page précédente |

**Action détaillée :**

Pour chaque en-tête identifié :
1. Cliquez sur l'en-tête pour voir sa valeur complète
2. Notez sa valeur dans un tableau (ou prenez une capture d'écran)
3. Comprenez son rôle dans la communication HTTP

**Exemple de ce que vous devriez voir :**

```
Request Headers:
  Host: jsonplaceholder.typicode.com
  User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...
  Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
  Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7
  Accept-Encoding: gzip, deflate, br
  Connection: keep-alive
  Upgrade-Insecure-Requests: 1
```

**Vérification :**
- ✅ Vous avez identifié au moins 5 en-têtes de requête
- ✅ Vous comprenez le rôle de chaque en-tête
- ✅ Vous avez noté leurs valeurs

**Question de réflexion :**
- Pourquoi le navigateur envoie-t-il ces informations au serveur ?
- Que se passerait-il si certains en-têtes manquaient ?

---

### Étape 3.2 : Identifier la méthode HTTP et l'URL

**Action à réaliser :**

1. Dans l'onglet **"Headers"**, regardez la section **"General"** (en haut)
2. Identifiez :
   - **Request Method** : La méthode HTTP utilisée (GET, POST, PUT, DELETE, etc.)
   - **Request URL** : L'URL complète de la requête
   - **Status Code** : Le code de statut de la réponse (200, 404, 500, etc.)

**Exemple de ce que vous devriez voir :**

```
General:
  Request URL: https://jsonplaceholder.typicode.com/posts/1
  Request Method: GET
  Status Code: 200 OK
  Remote Address: 104.21.xx.xx:443
  Referrer Policy: strict-origin-when-cross-origin
```

**Action détaillée :**

1. **Copiez l'URL complète** et analysez-la :
   - Protocole : `https://`
   - Domaine : `jsonplaceholder.typicode.com`
   - Chemin : `/posts/1`
   - Paramètres de requête (query string) : s'il y en a, ils apparaissent après `?`

2. **Notez la méthode HTTP** :
   - GET : récupération de données (lecture)
   - POST : création de données
   - PUT : mise à jour complète
   - PATCH : mise à jour partielle
   - DELETE : suppression

3. **Notez le code de statut** :
   - 200 : Succès
   - 301/302 : Redirection
   - 404 : Non trouvé
   - 500 : Erreur serveur

**Vérification :**
- ✅ Vous avez identifié la méthode HTTP (probablement GET)
- ✅ Vous avez copié l'URL complète
- ✅ Vous avez noté le code de statut

**Question de réflexion :**
- Pourquoi cette méthode HTTP a-t-elle été utilisée ?
- Que signifierait un code 404 à la place de 200 ?

---

### Étape 3.3 : Examiner le corps de la requête (Request Payload)

**Action à réaliser :**

1. Dans l'onglet **"Headers"**, faites défiler jusqu'à **"Request Payload"** ou **"Query String Parameters"**
2. Pour une requête GET simple, il n'y a généralement pas de corps (body)
3. Si vous voyez "Query String Parameters", examinez-les

**Note :** Pour voir un corps de requête, nous devrons faire une requête POST (voir Partie 4)

**Vérification :**
- ✅ Vous avez vérifié la section Request Payload
- ✅ Vous comprenez que GET n'a généralement pas de corps

---

## 📚 Partie 4 : Analyser la réponse HTTP

### Étape 4.1 : Examiner les Headers de la réponse (Response Headers)

**Action à réaliser :**

1. Dans l'onglet **"Headers"**, faites défiler jusqu'à **"Response Headers"** (En-têtes de réponse)
2. Identifiez et notez les en-têtes suivants :

**En-têtes à identifier :**

| En-tête | Description | Exemple de valeur |
|---------|-------------|-------------------|
| `Content-Type` | Type de contenu de la réponse | `application/json; charset=utf-8` |
| `Content-Length` | Taille du contenu en octets | `292` |
| `Date` | Date et heure de la réponse | `Mon, 01 Jan 2024 12:00:00 GMT` |
| `Server` | Logiciel serveur utilisé | `cloudflare` |
| `Cache-Control` | Instructions de mise en cache | `max-age=14400` |
| `ETag` | Identifiant de version (si présent) | `"abc123"` |
| `Status` | Code de statut HTTP | `200 OK` |

**Action détaillée :**

1. Cliquez sur chaque en-tête pour voir sa valeur complète
2. Notez particulièrement :
   - **Content-Type** : Indique le format des données (JSON, HTML, XML, etc.)
   - **Status** : Confirme le code de statut HTTP

**Exemple de ce que vous devriez voir :**

```
Response Headers:
  content-type: application/json; charset=utf-8
  content-length: 292
  date: Mon, 01 Jan 2024 12:00:00 GMT
  server: cloudflare
  cache-control: public, max-age=14400
  status: 200
```

**Vérification :**
- ✅ Vous avez identifié au moins 5 en-têtes de réponse
- ✅ Vous avez noté le Content-Type
- ✅ Vous avez compris le rôle de chaque en-tête

**Question de réflexion :**
- Pourquoi le serveur envoie-t-il ces informations au client ?
- Que signifierait un Content-Type différent (par exemple `text/html`) ?

---

### Étape 4.2 : Examiner le corps de la réponse (Response Body)

**Action à réaliser :**

1. Cliquez sur l'onglet **"Response"** (ou **"Preview"** pour un affichage formaté)
2. Examinez le contenu de la réponse

**Si vous êtes sur `jsonplaceholder.typicode.com/posts/1`, vous devriez voir :**

```json
{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
}
```

**Action détaillée :**

1. **Si l'onglet "Preview" est disponible** : Utilisez-le pour voir le JSON formaté
2. **Si vous êtes dans "Response"** : Le JSON brut s'affiche
3. **Analysez la structure** :
   - Type de données : JSON, HTML, XML, texte brut ?
   - Structure : Objet, tableau, texte simple ?
   - Contenu : Que représentent ces données ?

**Vérification :**
- ✅ Vous avez visualisé le corps de la réponse
- ✅ Vous avez identifié le format (JSON, HTML, etc.)
- ✅ Vous comprenez la structure des données

**Question de réflexion :**
- Comment le navigateur utilise-t-il ces données ?
- Que se passerait-il si le Content-Type ne correspondait pas au contenu réel ?

---

### Étape 4.3 : Analyser le timing de la requête

**Action à réaliser :**

1. Cliquez sur l'onglet **"Timing"** (ou regardez la section Timing dans Headers)
2. Examinez les différentes phases du chargement :

**Phases à identifier :**

| Phase | Description | Temps typique |
|-------|-------------|---------------|
| **Queued** | Temps d'attente avant l'envoi | 0-50ms |
| **Stalled** | Temps bloqué (proxy, DNS, etc.) | Variable |
| **DNS Lookup** | Résolution du nom de domaine | 0-100ms |
| **Initial Connection** | Établissement de la connexion TCP | 50-200ms |
| **SSL** | Négociation TLS/SSL (si HTTPS) | 50-200ms |
| **Request Sent** | Envoi de la requête | < 1ms |
| **Waiting (TTFB)** | Temps jusqu'au premier octet | 100-500ms |
| **Content Download** | Téléchargement du contenu | Variable |

**Exemple de ce que vous devriez voir :**

```
Timing:
  Queued: 0.12 ms
  DNS Lookup: 12.45 ms
  Initial Connection: 45.67 ms
  SSL: 78.90 ms
  Request Sent: 0.23 ms
  Waiting (TTFB): 123.45 ms
  Content Download: 5.67 ms
  Total: 266.59 ms
```

**Action détaillée :**

1. **Notez le temps total** de la requête
2. **Identifiez la phase la plus longue** (souvent "Waiting" ou "SSL")
3. **Comprenez ce que chaque phase représente** :
   - **TTFB (Time To First Byte)** : Temps jusqu'à la première réponse du serveur
   - **Content Download** : Temps de téléchargement des données

**Vérification :**
- ✅ Vous avez identifié toutes les phases du timing
- ✅ Vous avez noté le temps total
- ✅ Vous avez identifié la phase la plus lente

**Question de réflexion :**
- Quelle phase prend le plus de temps ? Pourquoi ?
- Comment pourrait-on optimiser ce temps de chargement ?

---

## 📚 Partie 5 : Analyser différents types de requêtes

### Étape 5.1 : Analyser une requête POST avec corps

**Action à réaliser :**

1. Dans l'onglet Network, assurez-vous que **"Preserve log"** est coché
2. Ouvrez la console JavaScript (onglet **Console**)
3. Exécutez cette commande pour faire une requête POST :

```javascript
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Mon nouveau post',
    body: 'Contenu de mon post',
    userId: 1
  })
})
.then(response => response.json())
.then(data => console.log('Réponse:', data));
```

4. Revenez dans l'onglet **Network**
5. Vous devriez voir une nouvelle requête apparaître (probablement nommée "posts")
6. Cliquez sur cette requête

**Action détaillée :**

1. **Dans l'onglet Headers**, vérifiez :
   - **Request Method** : Doit être `POST`
   - **Request URL** : `https://jsonplaceholder.typicode.com/posts`

2. **Dans la section Request Headers**, vérifiez :
   - `Content-Type: application/json` (important pour POST avec JSON)

3. **Cliquez sur l'onglet "Payload"** (ou regardez "Request Payload" dans Headers) :
   - Vous devriez voir le corps de la requête que vous avez envoyé

**Exemple de ce que vous devriez voir :**

```
Request Payload:
{
  "title": "Mon nouveau post",
  "body": "Contenu de mon post",
  "userId": 1
}
```

4. **Dans l'onglet Response**, vérifiez la réponse du serveur :
   - Le serveur devrait renvoyer l'objet créé avec un `id` attribué

**Vérification :**
- ✅ Vous avez créé une requête POST
- ✅ Vous avez identifié la méthode POST dans les headers
- ✅ Vous avez vu le corps de la requête (Request Payload)
- ✅ Vous avez examiné la réponse du serveur

**Question de réflexion :**
- Quelle est la différence entre GET et POST ?
- Pourquoi POST nécessite-t-il un Content-Type dans les headers ?

---

### Étape 5.2 : Analyser une requête avec paramètres de requête (Query String)

**Action à réaliser :**

1. Dans la console JavaScript, exécutez :

```javascript
fetch('https://jsonplaceholder.typicode.com/posts?userId=1&_limit=5')
  .then(response => response.json())
  .then(data => console.log('Réponse:', data));
```

2. Dans l'onglet Network, cliquez sur la nouvelle requête
3. Dans l'onglet **Headers**, regardez la section **"Query String Parameters"**

**Exemple de ce que vous devriez voir :**

```
Query String Parameters:
  userId: 1
  _limit: 5
```

**Action détaillée :**

1. **Analysez l'URL complète** :
   - Base : `https://jsonplaceholder.typicode.com/posts`
   - Paramètres : `?userId=1&_limit=5`
   - Le `?` indique le début des paramètres
   - Le `&` sépare les paramètres multiples

2. **Comprenez le rôle des paramètres** :
   - `userId=1` : Filtre les posts par utilisateur
   - `_limit=5` : Limite les résultats à 5

**Vérification :**
- ✅ Vous avez identifié les paramètres de requête
- ✅ Vous comprenez leur format dans l'URL
- ✅ Vous avez vu comment ils sont affichés dans les outils de développement

---

### Étape 5.3 : Analyser une requête avec erreur (404, 500)

**Action à réaliser :**

1. Dans la console JavaScript, exécutez :

```javascript
fetch('https://jsonplaceholder.typicode.com/posts/99999')
  .then(response => {
    console.log('Status:', response.status);
    return response.json();
  })
  .then(data => console.log('Réponse:', data))
  .catch(error => console.error('Erreur:', error));
```

2. Dans l'onglet Network, cliquez sur la requête
3. **Observez le code de statut** : Il devrait être `404` (ou `200` si l'API gère différemment)

**Pour simuler une erreur 500, essayez :**

```javascript
fetch('https://httpstat.us/500')
  .then(response => {
    console.log('Status:', response.status);
    return response.text();
  })
  .then(data => console.log('Réponse:', data));
```

**Action détaillée :**

1. **Dans l'onglet Headers**, vérifiez :
   - **Status Code** : `404 Not Found` ou `500 Internal Server Error`
   - La requête apparaît souvent en rouge dans la liste

2. **Dans l'onglet Response**, examinez le message d'erreur :
   - Les erreurs 404 affichent généralement un message "Not Found"
   - Les erreurs 500 affichent un message d'erreur serveur

3. **Dans l'onglet Timing**, observez si le temps de réponse est différent

**Vérification :**
- ✅ Vous avez généré une requête avec erreur
- ✅ Vous avez identifié le code de statut d'erreur
- ✅ Vous avez examiné le message d'erreur dans la réponse

**Question de réflexion :**
- Que signifie un code 404 ? 500 ? 403 ?
- Comment le navigateur gère-t-il ces erreurs ?

---

## 📚 Partie 6 : Filtrer et rechercher dans les requêtes

### Étape 6.1 : Utiliser les filtres de type

**Action à réaliser :**

1. En haut de l'onglet Network, vous voyez des boutons de filtre : **All**, **XHR**, **JS**, **CSS**, **Img**, etc.
2. Cliquez sur **XHR** (XMLHttpRequest) ou **Fetch**
3. Rechargez la page ou faites de nouvelles requêtes
4. Observez que seules les requêtes de type XHR/Fetch sont affichées

**Types de filtres disponibles :**

| Filtre | Description | Exemple |
|--------|-------------|---------|
| **All** | Toutes les requêtes | Toutes |
| **XHR** | Requêtes AJAX/Fetch | API REST |
| **JS** | Fichiers JavaScript | `app.js`, `vendor.js` |
| **CSS** | Feuilles de style | `style.css` |
| **Img** | Images | `.jpg`, `.png`, `.svg` |
| **Media** | Vidéos, audio | `.mp4`, `.mp3` |
| **Font** | Polices | `.woff`, `.ttf` |
| **Doc** | Documents HTML | Page principale |

**Vérification :**
- ✅ Vous avez utilisé au moins 3 filtres différents
- ✅ Vous comprenez ce que chaque filtre affiche

---

### Étape 6.2 : Rechercher une requête spécifique

**Action à réaliser :**

1. Dans la barre de recherche de l'onglet Network (en haut, avec l'icône 🔍)
2. Tapez un terme de recherche, par exemple : `posts` ou `jsonplaceholder`
3. Les requêtes correspondantes sont filtrées en temps réel

**Astuces de recherche :**

- Recherche par nom de fichier : `style.css`
- Recherche par domaine : `google.com`
- Recherche par type MIME : `application/json`
- Recherche par méthode : `POST`, `GET`

**Vérification :**
- ✅ Vous avez utilisé la fonction de recherche
- ✅ Vous avez trouvé des requêtes spécifiques

---

### Étape 6.3 : Exporter les données d'une requête

**Action à réaliser :**

1. Cliquez avec le bouton droit sur une requête dans la liste
2. Sélectionnez **"Copy"** → **"Copy as cURL"** (ou **"Copier en tant que cURL"**)
3. Collez le résultat dans un éditeur de texte

**Exemple de ce que vous obtiendrez :**

```bash
curl 'https://jsonplaceholder.typicode.com/posts/1' \
  -H 'Accept: application/json' \
  -H 'User-Agent: Mozilla/5.0...'
```

**Action détaillée :**

1. **Copiez la commande cURL**
2. **Testez-la dans un terminal** (si vous avez curl installé) :
   ```bash
   curl 'https://jsonplaceholder.typicode.com/posts/1'
   ```
3. **Comprenez l'utilité** :
   - Reproduire une requête exacte
   - Partager une requête avec un collègue
   - Tester une API depuis la ligne de commande

**Autres options de copie disponibles :**
- **Copy as cURL** : Commande cURL complète
- **Copy as fetch** : Code JavaScript fetch()
- **Copy as Node.js fetch** : Code Node.js
- **Copy request headers** : Juste les headers
- **Copy response** : Juste le corps de la réponse

**Vérification :**
- ✅ Vous avez copié une requête en cURL
- ✅ Vous comprenez l'utilité de cette fonctionnalité

---

## 📚 Partie 7 : Cas pratiques avancés

### Étape 7.1 : Analyser une requête avec authentification

**Action à réaliser :**

1. Dans la console JavaScript, simulez une requête avec un token d'authentification :

```javascript
fetch('https://jsonplaceholder.typicode.com/posts/1', {
  headers: {
    'Authorization': 'Bearer mon-token-secret-123',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Réponse:', data));
```

2. Dans l'onglet Network, cliquez sur la requête
3. Dans l'onglet **Headers**, regardez la section **Request Headers**
4. **Identifiez l'en-tête Authorization** :
   - Format : `Authorization: Bearer mon-token-secret-123`
   - C'est ainsi que les APIs sécurisées authentifient les utilisateurs

**Vérification :**
- ✅ Vous avez ajouté un header d'authentification
- ✅ Vous l'avez identifié dans les Request Headers
- ✅ Vous comprenez son rôle dans la sécurité

**Question de réflexion :**
- Pourquoi ne pas mettre le token dans l'URL ?
- Que se passerait-il si le token était expiré ?

---

### Étape 7.2 : Analyser les cookies (si présents)

**Action à réaliser :**

1. Naviguez vers un site qui utilise des cookies (par exemple, un site de e-commerce)
2. Dans l'onglet Network, sélectionnez une requête
3. Dans l'onglet **Headers**, cherchez la section **"Cookies"** (dans Request Headers ou Response Headers)

**Si vous ne voyez pas de cookies :**

1. Ouvrez l'onglet **Application** (ou **Storage** dans Firefox)
2. Allez dans **Cookies** → sélectionnez le domaine
3. Vous verrez tous les cookies stockés

**Action détaillée :**

1. **Dans Request Headers**, cherchez :
   - `Cookie: session_id=abc123; user_pref=dark_mode`
   - Les cookies sont envoyés automatiquement par le navigateur

2. **Dans Response Headers**, cherchez :
   - `Set-Cookie: session_id=abc123; Path=/; HttpOnly`
   - Le serveur définit de nouveaux cookies

**Vérification :**
- ✅ Vous avez identifié les cookies dans les headers
- ✅ Vous comprenez la différence entre Cookie (requête) et Set-Cookie (réponse)

---

### Étape 7.3 : Analyser une requête avec redirection

**Action à réaliser :**

1. Dans la console JavaScript, exécutez :

```javascript
fetch('https://httpstat.us/301', {
  redirect: 'follow'  // Suivre les redirections
})
.then(response => {
  console.log('URL finale:', response.url);
  console.log('Status:', response.status);
  return response.text();
})
.then(data => console.log('Réponse:', data));
```

2. Dans l'onglet Network, vous devriez voir **plusieurs requêtes** :
   - La première avec le code 301 (redirection)
   - La seconde vers l'URL finale

**Action détaillée :**

1. **Cliquez sur la première requête** (301) :
   - Status Code : `301 Moved Permanently`
   - Response Headers : `Location: https://httpstat.us/200` (URL de destination)

2. **Cliquez sur la seconde requête** :
   - Status Code : `200 OK`
   - C'est la requête vers l'URL finale après redirection

**Vérification :**
- ✅ Vous avez observé une redirection
- ✅ Vous avez identifié le header `Location`
- ✅ Vous avez vu la requête finale après redirection

**Question de réflexion :**
- Quelle est la différence entre 301 et 302 ?
- Pourquoi les redirections sont-elles importantes pour le SEO ?

---

## 📚 Partie 8 : Synthèse et validation

### Étape 8.1 : Créer un rapport d'analyse

**Action à réaliser :**

Créez un document (Word, Markdown, ou texte) avec l'analyse complète d'au moins **3 requêtes différentes** :

**Pour chaque requête, documentez :**

1. **Informations générales :**
   - URL complète
   - Méthode HTTP
   - Code de statut

2. **Requête :**
   - Headers principaux (au moins 5)
   - Corps de la requête (si présent)
   - Paramètres de requête (si présents)

3. **Réponse :**
   - Headers principaux (au moins 5)
   - Type de contenu (Content-Type)
   - Structure du corps de la réponse

4. **Performance :**
   - Temps total
   - Phase la plus lente
   - Taille de la réponse

5. **Analyse :**
   - Objectif de la requête
   - Problèmes éventuels
   - Points d'optimisation possibles

**Exemple de structure :**

```markdown
# Analyse de requête HTTP

## Requête 1 : Récupération d'un post

### Informations générales
- URL: https://jsonplaceholder.typicode.com/posts/1
- Méthode: GET
- Status: 200 OK

### Headers de requête
- Host: jsonplaceholder.typicode.com
- User-Agent: Mozilla/5.0...
- Accept: application/json

### Headers de réponse
- Content-Type: application/json; charset=utf-8
- Content-Length: 292
- Status: 200

### Performance
- Temps total: 266.59 ms
- Phase la plus lente: Waiting (TTFB) - 123.45 ms

### Analyse
Cette requête récupère un post spécifique. Le temps de réponse est acceptable.
```

**Vérification :**
- ✅ Vous avez créé un rapport avec au moins 3 requêtes
- ✅ Chaque requête est documentée complètement
- ✅ Vous avez inclus une analyse pour chaque requête

---

### Étape 8.2 : Checklist de validation

**Cochez chaque point une fois complété :**

**Partie 1 - Environnement :**
- [ ] J'ai ouvert les outils de développement (F12)
- [ ] J'ai accédé à l'onglet Network
- [ ] J'ai configuré les options d'affichage

**Partie 2 - Capture :**
- [ ] J'ai capturé une requête simple
- [ ] J'ai sélectionné et examiné une requête

**Partie 3 - Analyse requête :**
- [ ] J'ai identifié au moins 5 headers de requête
- [ ] J'ai identifié la méthode HTTP et l'URL
- [ ] J'ai examiné le corps de la requête (si présent)

**Partie 4 - Analyse réponse :**
- [ ] J'ai identifié au moins 5 headers de réponse
- [ ] J'ai examiné le corps de la réponse
- [ ] J'ai analysé le timing de la requête

**Partie 5 - Types de requêtes :**
- [ ] J'ai analysé une requête POST avec corps
- [ ] J'ai analysé une requête avec paramètres de requête
- [ ] J'ai analysé une requête avec erreur (404 ou 500)

**Partie 6 - Filtres :**
- [ ] J'ai utilisé les filtres de type (XHR, JS, CSS)
- [ ] J'ai utilisé la fonction de recherche
- [ ] J'ai exporté une requête en cURL

**Partie 7 - Cas avancés :**
- [ ] J'ai analysé une requête avec authentification
- [ ] J'ai analysé les cookies (si disponibles)
- [ ] J'ai analysé une requête avec redirection

**Partie 8 - Synthèse :**
- [ ] J'ai créé un rapport d'analyse avec au moins 3 requêtes
- [ ] Mon rapport est complet et structuré

---

## 🎓 Questions de compréhension

Répondez aux questions suivantes pour valider votre compréhension :

1. **Quelle est la différence entre les headers de requête et les headers de réponse ?**
   - Réponse attendue : Les headers de requête sont envoyés par le client au serveur, les headers de réponse sont envoyés par le serveur au client.

2. **Pourquoi le navigateur envoie-t-il un header `User-Agent` ?**
   - Réponse attendue : Pour informer le serveur du type de navigateur et du système d'exploitation, permettant au serveur d'adapter sa réponse.

3. **Que signifie un code de statut 200 ? 404 ? 500 ?**
   - Réponse attendue :
     - 200 : Succès, la requête a réussi
     - 404 : Ressource non trouvée
     - 500 : Erreur interne du serveur

4. **Quelle est la différence entre GET et POST ?**
   - Réponse attendue :
     - GET : Récupère des données, pas de corps, peut être mis en cache
     - POST : Crée/modifie des données, a un corps, ne doit pas être mis en cache

5. **Qu'est-ce que le TTFB (Time To First Byte) ?**
   - Réponse attendue : Le temps écoulé entre l'envoi de la requête et la réception du premier octet de la réponse. C'est un indicateur de performance du serveur.

6. **Pourquoi utiliser l'onglet Network plutôt que la console pour déboguer les requêtes ?**
   - Réponse attendue : L'onglet Network offre une vue complète de toutes les requêtes, leurs headers, leurs réponses, et leur timing, ce qui est plus détaillé que les logs de la console.

---

## 🚀 Défis supplémentaires (optionnels)

Si vous avez terminé toutes les étapes, essayez ces défis :

### Défi 1 : Analyser une requête sur votre site préféré
1. Ouvrez votre site web préféré (réseau social, e-commerce, etc.)
2. Analysez toutes les requêtes qui se produisent au chargement
3. Identifiez :
   - Les requêtes les plus lentes
   - Les types de ressources chargées
   - Les APIs utilisées

### Défi 2 : Comparer les performances
1. Analysez le même endpoint sur deux sites différents
2. Comparez :
   - Les temps de réponse
   - Les tailles des réponses
   - Les headers utilisés
3. Identifiez les différences et expliquez-les

### Défi 3 : Simuler un problème réseau
1. Dans l'onglet Network, utilisez le throttling (ralentissement réseau)
2. Sélectionnez "Slow 3G" ou "Fast 3G"
3. Rechargez une page et observez :
   - L'impact sur les temps de chargement
   - L'ordre de chargement des ressources
   - Les timeouts éventuels

### Défi 4 : Analyser une API REST complète
1. Trouvez une API REST publique (par exemple : https://api.github.com)
2. Faites plusieurs requêtes (GET, POST, PUT, DELETE)
3. Analysez chaque requête et créez un tableau comparatif :
   - Méthodes utilisées
   - Codes de statut
   - Formats de données
   - Headers d'authentification

---

## 📖 Ressources complémentaires

- **Documentation MDN sur HTTP** : https://developer.mozilla.org/fr/docs/Web/HTTP
- **Liste des codes de statut HTTP** : https://developer.mozilla.org/fr/docs/Web/HTTP/Status
- **Guide des headers HTTP** : https://developer.mozilla.org/fr/docs/Web/HTTP/Headers
- **Chrome DevTools - Network** : https://developer.chrome.com/docs/devtools/network/

---

## ✅ Conclusion

Félicitations ! Vous avez maintenant les compétences pour :
- ✅ Utiliser les outils de développement pour analyser les requêtes HTTP
- ✅ Comprendre la structure complète d'une requête et d'une réponse HTTP
- ✅ Identifier et résoudre les problèmes de communication HTTP
- ✅ Optimiser les performances en analysant les timings

Ces compétences sont essentielles pour :
- Déboguer les problèmes d'API
- Optimiser les performances web
- Comprendre le fonctionnement des applications web modernes
- Préparer des entretiens techniques

**Prochaines étapes suggérées :**
- Apprendre à utiliser Postman ou Insomnia pour tester les APIs
- Étudier les concepts avancés (CORS, WebSockets, Server-Sent Events)
- Pratiquer l'analyse de performance avec Lighthouse

---

*TP créé le : [Date]*  
*Version : 1.0*  
*Durée estimée : 2-3 heures*

