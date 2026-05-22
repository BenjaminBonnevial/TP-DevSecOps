# Rapport TP DevSecOps

## Étape 1 - Conteneurisation Docker

### 1.1 Lire le Dockerfile fourni

**1. Pourquoi utilise-t-on un multi-stage build plutôt qu'un seul FROM ?**

Sans multi-stage, l'image finale embarquerait tout ce qu'on a utilisé pour compiler : les devDependencies (TypeScript, ESLint…), le code source .ts, les caches npm, etc. Avec les 3 stages, seul le résultat du build (.next/standalone) arrive dans l'image runner. Ici ça donne 234 MB contre ~1 GB sans ça.

**2. Que fait la ligne output: 'standalone' dans next.config.js et comment Docker l'exploite-t-elle ?**

Ça dit à Next.js de produire un dossier .next/standalone avec un server.js autonome et uniquement les node_modules nécessaires à l'exécution. Docker n'a plus qu'à copier ce dossier dans le runner, pas besoin de refaire un npm install.

**3. Pourquoi crée-t-on un utilisateur nextjs non-root ?**

Si quelqu'un exploite une faille dans l'app et obtient un shell dans le conteneur, il se retrouve avec les droits de nextjs (uid 1001) et pas root. Il peut pas toucher les binaires système, modifier /etc/passwd, etc. C'est une bonne pratique de base pour limiter l'impact d'une compromission.

**4. À quoi sert HEALTHCHECK dans le Dockerfile ?**

Docker exécute la commande toutes les 30s et passe le conteneur en état unhealthy si ça échoue 3 fois de suite. Ça permet à Docker Compose (ou un orchestrateur) de détecter qu'un conteneur est mort et de le redémarrer automatiquement.

### 1.2 Builder et lancer le conteneur

La taille de l'image est de 234 MB.

---

## Étape 2 - Tests unitaires

### 2.1 Lancer les tests fournis

Tous les tests passent. Screenshots : Screenshots/npmTest.png et Screenshots/srcLib.png.

### 2.2 Ajouter vos propres tests

J'ai ajouté 3 fichiers dans tests/unit/ :

- permissions.test.ts : teste la fonction canEditTicket dans le nouveau fichier src/lib/permissions.ts (6 cas : admin, user propriétaire sur OPEN/IN_PROGRESS, non-propriétaire, ticket RESOLVED, ticket CLOSED)
- auth-extra.test.ts : token expiré rejeté, getAuthFromRequest sans header et avec un header non-Bearer
- validators-extra.test.ts : cas limites sur loginSchema (email invalide, mot de passe vide) et ticketUpdateSchema (status inconnu, description trop courte, assigneeId null)

**Quelle est votre couverture finale (% statements / branches / functions) ? Pourquoi est-elle < 100% sur certains fichiers ?**

```
File              | % Stmts | % Branch | % Funcs | % Lines
auth.ts           |      88 |     87.5 |     100 |      88
permissions.ts    |     100 |      100 |     100 |     100
prisma.ts         |       0 |        0 |       0 |       0
validators.ts     |     100 |      100 |     100 |     100
```
Screenshot/npmRunTestCoverage.png

auth.ts n'est pas à 100% car les lignes 41-43 (getAuthFromRequest avec un vrai token Bearer) sont testées pour les cas d'erreur mais pas le chemin normal complet — instancier un NextRequest avec un JWT valide dans un test Node pur sans le runner Next.js c'est galère. prisma.ts est à 0% volontairement, importer le client Prisma dans les tests unitaires ouvrirait une connexion SQLite, c'est pour les tests d'intégration.
