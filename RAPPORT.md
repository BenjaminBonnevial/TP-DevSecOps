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

---

## Étape 3 — Tests de montée en charge avec k6

### 3.1 Smoke test

Smoke test passé : 2457 requêtes en 10s avec 1 VU, 0% d'erreur, p(95) à 6.93ms (seuil < 200ms). Screenshot : Screenshots/k6Smoke.png

### 3.2 Test de charge

```
Requests:      2230
Failed:        0.00%
p(95) latency: 9330 ms
avg latency:   3686 ms
Iterations:    743
VUs max:       50
Durée:         4 min
```

Le seuil p(95) < 500ms est dépassé (9330ms réels). Aucune requête n'a échoué — l'app répond toujours, mais très lentement. Le goulot d'étranglement est SQLite : à 50 VUs concurrents qui font tous des INSERT (création de ticket), les écritures se sérialisent à cause du verrou exclusif de SQLite. La latence explose au palier des 50 VUs mais l'app ne tombe pas.

Le fichier k6-summary.json est disponible à la racine du projet. Screenshot : Screenshots/k6Load.png

### 3.3 Pousser plus loin - 200 VUs

```
Requests:      1766
Failed:        3.79%
p(95) latency: 55203 ms
avg latency:   24296 ms
Iterations:    546 complètes + 141 interrompues
```

Les 3 thresholds sont croisés (errors, http_req_duration, http_req_failed). Des timeouts apparaissent explicitement dans les logs à partir de t=202s (palier ~100 VUs) et s'accumulent massivement à t=226s. L'app ne crash pas mais répond en 55s au p(95) — c'est inutilisable. Le point de rupture est autour de 100 VUs : c'est là que la file d'attente SQLite dépasse les timeouts de connexion et que les requêtes commencent à être abandonnées.

Screenshot : Screenshots/k6200vus.png
