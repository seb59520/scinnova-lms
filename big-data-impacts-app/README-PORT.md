# 🔌 Configuration du port

## Port par défaut : 5173

L'application est configurée pour utiliser le port **5173**.

### Si le port est occupé

Si le port 5173 est déjà utilisé, Vite affichera une erreur. Vous avez deux options :

#### Option 1 : Libérer le port 5173

```bash
# Trouver le processus qui utilise le port
lsof -ti:5173

# Tuer le processus
lsof -ti:5173 | xargs kill -9
```

#### Option 2 : Utiliser un autre port

Si vous devez utiliser un autre port, modifiez :

1. **vite.config.ts** :
```typescript
server: {
  port: 5174, // ou un autre port
  strictPort: true,
}
```

2. **tp-big-data-data-science-impacts.json** :
```json
{
  "external_url": "http://localhost:5174"
}
```

### Vérifier le port utilisé

Quand vous lancez `npm run dev`, Vite affiche le port utilisé :

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Assurez-vous que l'URL dans le TP correspond au port affiché.


