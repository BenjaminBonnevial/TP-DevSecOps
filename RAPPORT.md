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

