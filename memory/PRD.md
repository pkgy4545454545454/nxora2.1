# JARVIS AI — Assistant vocal personnel (PRD)

## Problème / Objectif
Assistant vocal personnel type Iron Man : "Je parle → Claude comprend → l'agent choisit un outil → Python exécute → l'interface affiche → JARVIS répond vocalement." Interface HUD futuriste reproduisant l'image de référence fournie, avatar 3D central.

## Choix utilisateur (validés)
- Version fonctionnelle destinée à être exécutée localement sur son PC Windows (contrôle réel du PC).
- IA : clé Anthropic Claude personnelle (dans backend/.env). Modèle par défaut `claude-sonnet-4-5-20250929`.
- Voix : Web Speech API du navigateur (STT + TTS), voix française sélectionnable.
- Emails : Gmail (OAuth). Identifiants Google fournis.
- Sections dashboard : Stats système, Stats IA, Dernières commandes, Emails récents, WhatsApp, Cybersécurité 1-clic, Code/Pense-bête, Heure/Date.

## Architecture
- Backend FastAPI (`/app/backend`), package `jarvis/` : `agent.py` (boucle tool-use Claude native SDK), `tools/` (filesystem, applications, browser, terminal, development, cybersecurity, system_info), `store.py` (Mongo + config + logs), `permissions`, `prompts.py`, `gmail_service.py`, `api.py`.
- Frontend React + Three.js (`@react-three/fiber`) : avatar 3D (`Avatar3D.jsx`) réactif aux états, HUD (`Hud.jsx`), sections (`Dashboard.jsx`, `Settings.jsx`, `Views.jsx`), voix (`lib/speech.js`), hook `useAssistant.js`.
- MongoDB : conversations (mémoire), config, logs (journal des actions), notes, gmail_tokens.

## Implémenté (2026-08-10)
- Interface HUD futuriste fidèle à l'image + avatar 3D holographique bleu/rouge avec états (veille/écoute/réflexion/exécution/réponse/erreur).
- Agent Claude + Tools : filesystem (rechercher/ouvrir/lire/renommer/déplacer/copier/supprimer avec confirmation), applications (détecter/lancer/fermer), navigateur (sites/URL/recherche), terminal contrôlé (garde-fous), development (créer projets/écrire fichiers/serveur dev), cybersécurité (nmap/dirb/... sur cibles autorisées + rapports), system_info (stats réelles psutil + USB).
- Système de permissions par catégorie (read/normal/sensitive/terminal/cybersecurity) + journal des actions.
- Conversation vocale (STT continu + TTS FR) avec mot d'activation configurable.
- Dashboard : stats système temps réel, stats IA, réseau, dernières commandes (1-clic), emails Gmail, WhatsApp (démo), cybersécurité 1-clic, notes/code, horloge.
- Gmail OAuth configuré (lecture des emails récents après connexion).
- Paramètres : clé API, modèle, mot d'activation, voix (test), permissions.
- Tests E2E : backend 15/15, frontend 100% des flux couverts.

## Itération 2 (2026-08-10)
- Synchro labiale : la bouche de l'avatar 3D s'anime avec l'amplitude de la voix (`speech.js` expose `mouth.level`, lu par `Avatar3D.jsx`).
- Emails intelligents : outils agent `gmail_recent`, `gmail_search`, `gmail_read`, `gmail_draft`, `gmail_send` (envoi avec confirmation obligatoire). Scopes gmail.compose + gmail.send ajoutés.
- Générateur de sites : `create_project` + `open_in_editor` (VS Code) + `start_dev_server` + `open_url`; le prompt enchaîne automatiquement création → éditeur → serveur → navigateur; modifications ciblées via `write_file`.
- Agent : support des outils asynchrones.
- 31 outils enregistrés. Testés au niveau fonction (create_project, open_in_editor fallback, gmail confirmation) + compilation OK. Vérification E2E des flux agent en attente des crédits Anthropic.

## Itération 3 (2026-08-10)
- Aperçu Intégré : endpoints backend `GET /api/projects` + `GET /api/preview/{project}/{path}` (sert les fichiers du workspace, garde-fou anti-traversal). Panneau `SitePreviewPanel` (iframe) dans le dashboard, auto-détection du projet le plus récent, rafraîchissement auto (clé mtime), lien plein écran. Vérifié E2E : « crée un site restaurant » → site Bella Napoli affiché dans l'iframe.
- Micro mains-libres : mode continu déclenché par le mot « JARVIS », avec fenêtre de suivi de 15 s (follow-up sans redire le mot), indicateur d'état (EN ATTENTE / MAINS-LIBRES ACTIF). Le prompt n'ouvre plus d'onglet localhost (aperçu intégré).

## Itération 5 (2026-08-21) — Lot A
- Fournisseur IA commutable **Claude ↔ Ollama** (local, gratuit) : `ai_provider` dans config + boucle tool-use Ollama (`ollama_service.py`, `/api/chat`). Test réel en local uniquement.
- Section **VISION** : caméra navigateur → `/api/vision` → modèle Ollama `qwen2.5vl:7b` (par défaut) + historique (`vision_history`). Statut Ollama en direct.
- Outil agent **take_screenshot** (mss) — capture d'écran en local.
- Section **Base de données** : navigateur MongoDB (Atlas externe, `EXTERNAL_MONGO_URL`) + MySQL (`pymysql`), tables/collections avec scroll. Endpoints `/api/db/mongo/*` et `/api/db/mysql/*`.
- **Visage central 'iaia'** (image low-poly) avec anneaux orbitaux (`FaceCore.jsx`), remplace l'avatar au centre.
- Nav étendue : BDD, VISION (+ Projets). Bascule + champs Ollama dans Réglages.

### À corriger côté utilisateur
- **MongoDB Atlas** : identifiants `prankgy` rejetés (`bad auth`). Vérifier user/mot de passe du DB User + Network Access (allowlist IP). Le code fonctionne dès que les creds sont bons.
- **MySQL Hostpoint** : hôte `...db.hostpoint.internal` interne (injoignable hors réseau Hostpoint) ; `MYSQL_DB` mis par défaut = `gapeputo_pkgy` (à confirmer).

### Backlog — Lot B (prochain)
- Navigation par **gestes de la main** (MediaPipe Hands) : curseur, pincer=clic, scroll, drag & drop des panneaux, via la caméra.
- Menu circulaire rotatif (disposition radiale complète comme l'image de référence).

## Itération 6 (2026-08-21) — Lot B (partiel)
- **Atlas corrigé** (mot de passe `Mini.1996`) : `rebecca.users` s'affiche en direct (58 docs, 20 colonnes) dans la section BDD.
- **Visage en particules** (`ParticleFace.jsx`) : échantillonne `/iaia.webp` (téléchargé dans `public/`) → nuage de points à la FORME du visage, relief par luminosité, yeux lumineux, bouche animée (mouth.level), anneaux orbitaux, réactif aux états.
- **Navigation gestuelle** (`HandControl.jsx`, MediaPipe Hands via CDN) : curseur = index, **pincer = clic**, **deux doigts = scroll** du conteneur survolé, **pincer‑maintenir sur un panneau = déplacer**. Bouton « MAINS » dans la barre du haut + aperçu caméra. À tester avec une vraie webcam dans le navigateur (impossible dans le harness cloud).

### Reste à faire
- **Menu circulaire rotatif** (sections orbitant autour du visage) — non implémenté (le sidebar reste vertical ; le noyau a déjà des anneaux).
- **MySQL** : nom de base + hôte accessible manquants.

## Limites connues
- Réponses Claude bloquées : le compte Anthropic du user a un **solde de crédits insuffisant** (clé valide). Ajouter des crédits sur console.anthropic.com.
- WhatsApp : données de démonstration (MOCKED) — pas d'API officielle de lecture des messages perso.
- Contrôle réel du PC (ouvrir dossiers, lancer VS Code/Ubuntu, nmap, USB) : pleinement effectif quand le backend tourne en LOCAL sur Windows ; dans l'aperçu cloud, s'exécute sur le conteneur Linux.

## Backlog (prochaines étapes)
- P1 : Streaming des réponses + WebSocket état temps réel ; synchronisation labiale audio→avatar (analyse d'amplitude).
- P1 : Emails — résumer / rédiger / envoyer (avec confirmation) via Claude.
- P2 : Génération de projets avancée (React/Vite) + ouverture auto dans VS Code + navigateur.
- P2 : Réseaux sociaux (YouTube API) ; périphériques avancés ; mémoire persistante à long terme.
- P2 : Packaging exécutable local Windows (guide de lancement `python main.py`).
