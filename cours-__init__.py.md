# Cours sur `__init__.py` en Python

## 📚 Introduction

Le fichier `__init__.py` est un fichier spécial en Python qui transforme un simple répertoire en un **package Python**. Il peut être vide ou contenir du code d'initialisation.

---

## 🎯 Rôle principal

### 1. **Marquer un répertoire comme package**

Sans `__init__.py`, Python ne reconnaît pas un répertoire comme un package, et vous ne pouvez pas importer des modules depuis ce répertoire.

**Exemple de structure :**
```
mon_projet/
├── __init__.py          # Rend mon_projet un package
├── module1.py
└── sous_package/
    ├── __init__.py      # Rend sous_package un package
    └── module2.py
```

### 2. **Contrôler les imports**

Le fichier `__init__.py` permet de définir ce qui est accessible quand on importe le package.

---

## 📝 Cas d'usage

### Cas 1 : Fichier vide (minimum requis)

Le fichier `__init__.py` peut être complètement vide. Sa simple présence suffit à marquer le répertoire comme package.

```python
# __init__.py (vide)
```

**Utilisation :**
```python
# Depuis un autre fichier
from mon_package import module1
```

---

### Cas 2 : Exposer des éléments spécifiques

Vous pouvez définir ce qui est importé avec `from package import *` via `__all__`.

```python
# __init__.py
from .module1 import fonction_importante
from .module2 import ClasseUtilitaire

__all__ = ['fonction_importante', 'ClasseUtilitaire']
```

**Utilisation :**
```python
from mon_package import *  # Importe uniquement ce qui est dans __all__
```

---

### Cas 3 : Simplifier les imports

Vous pouvez rendre les imports plus simples pour les utilisateurs du package.

```python
# __init__.py
from .module1 import MaClasse
from .module2 import ma_fonction

# Maintenant, au lieu de :
# from mon_package.module1 import MaClasse
# L'utilisateur peut faire :
# from mon_package import MaClasse
```

**Utilisation :**
```python
# Import simplifié
from mon_package import MaClasse, ma_fonction
```

---

### Cas 4 : Initialisation du package

Vous pouvez exécuter du code lors de l'import du package.

```python
# __init__.py
print("Initialisation du package...")

# Configuration par défaut
VERSION = "1.0.0"
AUTHOR = "Votre Nom"

# Initialisation de ressources
import logging
logging.basicConfig(level=logging.INFO)
```

---

### Cas 5 : Imports conditionnels

Vous pouvez gérer des imports optionnels ou conditionnels.

```python
# __init__.py
try:
    from .module_avance import fonction_avancee
    HAS_ADVANCED = True
except ImportError:
    HAS_ADVANCED = False
    print("Module avancé non disponible")
```

---

## 🔍 Exemple complet

### Structure de projet

```
mon_app/
├── __init__.py
├── utils/
│   ├── __init__.py
│   ├── helpers.py
│   └── validators.py
├── models/
│   ├── __init__.py
│   └── user.py
└── main.py
```

### Contenu des fichiers

**`mon_app/__init__.py` :**
```python
"""
Mon application - Package principal
"""
__version__ = "1.0.0"

from .utils import validate_email, format_date
from .models import User

__all__ = ['User', 'validate_email', 'format_date']
```

**`mon_app/utils/__init__.py` :**
```python
from .helpers import format_date, format_currency
from .validators import validate_email, validate_phone

__all__ = ['format_date', 'format_currency', 'validate_email', 'validate_phone']
```

**`mon_app/utils/helpers.py` :**
```python
def format_date(date):
    return date.strftime("%Y-%m-%d")

def format_currency(amount):
    return f"{amount:.2f} €"
```

**`mon_app/utils/validators.py` :**
```python
import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone):
    return len(phone) == 10 and phone.isdigit()
```

**`mon_app/models/__init__.py` :**
```python
from .user import User

__all__ = ['User']
```

**`mon_app/models/user.py` :**
```python
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
```

**`main.py` :**
```python
# Import simplifié grâce à __init__.py
from mon_app import User, validate_email, format_date
from datetime import datetime

# Utilisation
user = User("Alice", "alice@example.com")
print(validate_email(user.email))  # True
print(format_date(datetime.now()))  # 2024-01-15
```

---

## ⚠️ Python 3.3+ : Namespace Packages

Depuis Python 3.3, il existe les **namespace packages** qui permettent de créer des packages sans `__init__.py`. Cependant, il est toujours recommandé de l'utiliser pour :

- ✅ La compatibilité avec les anciennes versions
- ✅ La clarté et l'explicite
- ✅ L'initialisation du package
- ✅ Le contrôle des imports

---

## 🎓 Bonnes pratiques

### ✅ À faire

1. **Toujours inclure `__init__.py`** dans vos packages
2. **Utiliser `__all__`** pour contrôler les imports publics
3. **Documenter le package** avec une docstring
4. **Simplifier les imports** pour les utilisateurs
5. **Initialiser les ressources** si nécessaire

### ❌ À éviter

1. ❌ Mettre trop de logique dans `__init__.py` (gardez-le simple)
2. ❌ Importer tout depuis tous les sous-modules (peut ralentir les imports)
3. ❌ Oublier `__init__.py` dans les sous-packages
4. ❌ Créer des effets de bord complexes lors de l'import

---

## 📋 Résumé

| Aspect | Description |
|--------|-------------|
| **Rôle** | Transforme un répertoire en package Python |
| **Peut être vide** | Oui, sa présence suffit |
| **Peut contenir** | Code d'initialisation, imports, variables |
| **Contrôle** | Définit `__all__` pour les imports `*` |
| **Initialisation** | Code exécuté lors de l'import du package |

---

## 🔗 Ressources

- [Documentation officielle Python - Packages](https://docs.python.org/3/tutorial/modules.html#packages)
- [PEP 420 - Implicit Namespace Packages](https://peps.python.org/pep-0420/)

---

**Note :** Ce cours couvre les bases de `__init__.py`. Pour des cas d'usage avancés (packages avec C extensions, packages avec ressources, etc.), consultez la documentation Python officielle.
