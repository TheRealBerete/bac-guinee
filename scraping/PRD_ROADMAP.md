# PRD — Plateforme de Consultation des Résultats Scolaires (Guinée)

**Produit :** WebApp de consultation des résultats du Baccalauréat, CEE et Brevet  
**Sources de données :** PDFs guineematin.com + API mon-portail.gtsco-kag.org  
**Cible :** Élèves, parents, établissements scolaires, journalistes, chercheurs  
**Date :** 29 Juin 2026  

---

## TABLE DES MATIÈRES

1. [Contexte](#1-contexte)
2. [Le système éducatif guinéen](#2-le-système-éducatif-guinéen)
3. [Les deux sources de données](#3-les-deux-sources-de-données)
4. [Analyse détaillée des sources](#4-analyse-détaillée-des-sources)
5. [Spécifications fonctionnelles](#5-spécifications-fonctionnelles)
6. [Spécifications techniques](#6-spécifications-techniques)
7. [Base de données](#7-base-de-données)
8. [API Backend](#8-api-backend)
9. [Frontend](#9-frontend)
10. [Roadmap](#10-roadmap)
11. [Annexes](#11-annexes)

---

## 1. CONTEXTE

### 1.1 Le problème

En Guinée, les résultats des examens nationaux (Baccalauréat, CEE, Brevet) sont publiés de manière peu accessible :

- **Des PDFs de 400 à 500 pages** postés sur des sites de journaux (guineematin.com). Pour savoir si un élève est admis, il faut télécharger un PDF, le scroller page par page, et chercher manuellement son nom. Aucun outil de recherche n'existe.
- **Un portail officiel** (mon-portail.gtsco-kag.org) permet la vérification, mais uniquement avec un numéro de PV (Procès-Verbal) — un numéro que l'élève ne connaît quasiment jamais.
- **Aucune centralisation** : les données sont éparpillées entre le portail officiel et les sites de journaux. Pas d'API publique, pas de recherche par nom, pas de statistiques.

### 1.2 La solution

Une plateforme web qui :

1. **Agrège** les données de toutes les sources disponibles (PDFs journaux + API officielle)
2. **Permet la recherche par nom**, la manière la plus naturelle pour un utilisateur ("Est-ce que je suis admis ?")
3. **Offre des statistiques** par école, par année, par profil
4. **Est mobile-first** : en Guinée, l'écrasante majorité du trafic web vient des téléphones
5. **Fait de la veille automatique** : dès que de nouveaux résultats sont publiés, la plateforme les intègre

### 1.3 Utilisateurs cibles

| Persona | Besoin principal | Scénario typique |
|---|---|---|
| Élève / Parent | "Mon enfant est-il admis ?" | L'utilisateur tape un nom dans la barre de recherche et voit immédiatement le résultat |
| Lycée / Établissement | "Quel est notre taux de réussite cette année ?" | L'établissement consulte sa page dédiée avec les statistiques de ses élèves |
| Journaliste | "Combien d'admis au Bac 2025 vs 2024 ?" | Exporte les données ou consulte les stats globales |
| Chercheur | "Évolution du taux de réussite par région" | Utilise l'API publique pour extraire les données |
| Administrateur | "Mettre à jour les résultats 2026" | Lance le scraper ou importe un nouveau PDF |

---

## 2. LE SYSTÈME ÉDUCATIF GUINÉEN

### 2.1 Les examens concernés

| Examen | Équivalent français | Niveau | Période |
|---|---|---|---|
| **CEE** (Certificat d'Études Élémentaires) | Entrée en 6ème | Fin du primaire | Juin-Juillet |
| **BEPC / Brevet** | Brevet des collèges | Fin du collège | Juin-Juillet |
| **Baccalauréat Unique** | Baccalauréat | Fin du lycée | Juin-Juillet |

### 2.2 Les profils du Baccalauréat

Le Bac guinéen comporte plusieurs « profils » (séries) :

| Code | Nom complet | Nombre de candidats (estimé) |
|---|---|---|
| **SS** | Sciences Sociales | ~1500 / an |
| **SM** | Sciences Mathématiques | ~800 / an |
| **SE** | Sciences Expérimentales | ~500 / an |
| **SS-FA** | Sciences Sociales (Franco-Arabe) | ~30 / an |
| **SE-FA** | Sciences Expérimentales (Franco-Arabe) | ~10 / an |

### 2.3 Le format des résultats

Chaque résultat de candidat contient :

| Champ | Description | Exemple |
|---|---|---|
| Rang | Classement national dans le profil | `1` (1er national) |
| ex | Colonne spéciale, parfois `X` (signification inconnue — possiblement « exclu » ou « repêché ») | `X` ou vide |
| Prénoms et Noms | Nom complet du candidat | `MOHAMED SYLLA` |
| Centre | Centre d'examen où le candidat a composé | `MORIFINDJAN DIABATE` |
| PV | Numéro de Procès-Verbal (identifiant unique du candidat) | `24 841` |
| Origine | Établissement d'origine du candidat (son lycée) | `GSP_EMMANUEL` |
| Mention | Appréciation obtenue | `BIEN`, `ABIEN`, `PASSABLE`, `TB` |

**À noter :** Le champ « Origine » est l'information la plus utile pour les établissements — c'est le lycée d'origine de l'élève, pas son centre d'examen.

---

## 3. LES DEUX SOURCES DE DONNÉES

### 3.1 Source 1 : PDFs guineematin.com

**Description :** Le journal en ligne guineematin.com publie chaque année les listes des admis sous forme de fichiers PDF. Ces PDFs sont des documents textuels (pas des scans), contenant des tableaux structurés.

**Avantages :**
- Données complètes (tous les profils, y compris Franco-Arabe)
- Accessible sans authentification
- Les PDFs restent en ligne indéfiniment (2020 toujours accessible en 2026)
- Parsing fiable avec `pdfplumber` (0% d'erreur sur 2207 candidats)

**Inconvénients :**
- Pas de couverture nationale pour les années récentes (2023-2026)
- Pas de CEE/Brevet au niveau national
- Format PDF variable d'une année à l'autre (noms de colonnes, structure)
- Certains PDFs sont des doublons (SS + SS-FA partagent parfois le même fichier)

**Couverture actuelle des PDFs :**

| Année | SS | SM | SE | SS-FA | SE-FA | Statut |
|---|---|---|---|---|---|---|
| **2020** | ✅ 433 | ✅ 524 | ✅ 287 | ✅ 27 | ✅ 2 | ✓ Parsé |
| **2021** | ✅ 177 | ✅ 302 | ✅ 147 | ✅ 19 | ✅ 2 | ✓ Parsé |
| **2022** | ✅ 112 | ✅ 117 | ✅ 52 | ✅ 5 | ✅ 1 | ✓ Parsé |
| **2023** | ❌ | ❌ | ❌ | ❌ | ❌ | Régional uniquement |
| **2024** | ❌ | ❌ | ❌ | ❌ | ❌ | Pas encore publié |
| **2025** | ❌ | ❌ | ❌ | ❌ | ❌ | Pas encore publié |
| **2026** | ❌ | ❌ | ❌ | ❌ | ❌ | Examen à venir |

**Total : 15 PDFs parsés, 2207 candidats extraits.**

### 3.2 Source 2 : API mon-portail.gtsco-kag.org (ukag)

**Description :** Le portail officiel du ministère expose une API REST (non documentée) de vérification des résultats.

**Endpoint :**
```
POST https://mon-portail.gtsco-kag.org/public/verificationResultatBac
Content-Type: multipart/form-data
```

**Paramètres :**

| Paramètre | Type | Description | Exemple |
|---|---|---|---|
| `pv` | string | Numéro de PV (sans espaces) | `126063` |
| `profil` | string | Profil exact : `Sciences Sociales`, `Mathématiques`, `Expérimentales` | `Sciences Sociales` |
| `session` | int | Année (2020 à 2026) | `2025` |

**⚠️ Point critique :** L'API n'accepte **PAS** le JSON. Elle exige du `multipart/form-data` (comme un formulaire HTML classique). Une requête JSON retourne `"Veuillez saisir le PV BAC"` sans autre explication.

**⚠️ Point critique 2 :** Les valeurs de `profil` sont les noms complets en français (`Sciences Sociales`, `Mathématiques`, `Expérimentales`), PAS les codes (`SS`, `SM`, `SE`). Les variantes Franco-Arabes ne sont pas supportées par l'API.

**⚠️ Point critique 3 :** Pas de CORS. L'API ne peut pas être appelée directement depuis un navigateur. Il faut un proxy côté serveur.

**Réponse succès (admis) :**
```json
{
  "error": false,
  "resultat": {
    "nom": "KEITA",
    "prenom": "ABDOURAHAMANE",
    "lyceeId": 80,
    "lycee": "HABIBATA TOUNKARA"
  },
  "msg": ""
}
```

**Réponse échec (non admis ou mauvais profil) :**
```json
{
  "msg": "Vous n'êtes pas admis au Baccalauréat Session 2025",
  "error": true,
  "resultat": {
    "nom": "",
    "prenom": "",
    "lyceeId": "",
    "lycee": ""
  }
}
```

**⚠️ Point critique 4 :** Le message "Vous n'êtes pas admis" est générique. Il peut signifier :
- Le candidat existe mais n'est pas admis (a échoué)
- Le candidat existe mais avec un autre profil (ex: PV 126063 est en SS, pas en SM)
- Les données pour cette session/profil ne sont pas disponibles

**Couverture de l'API :**

| Session | SS | SM | SE | Note |
|---|---|---|---|---|
| 2020 | ✅ | ✅ | ✅ | PV 24841 trouvé |
| 2021 | ✅ | ✅ | ✅ | |
| 2022 | ✅ | ✅ | ✅ | PV 213523 trouvé |
| 2023 | ✅ | ✅ | ✅ | |
| 2024 | ✅ | ✅ | ✅ | |
| 2025 | ✅ | ✅ | ✅ | PV 126063 trouvé |
| 2026 | ✅ | ✅ | ✅ | |

---

## 4. ANALYSE DÉTAILLÉE DES SOURCES

### 4.1 Structure exacte des PDFs guineematin par année

#### 2020

**Fichiers :**
```
SS-Résultat-bac-2020.pdf     → Sciences Sociales
SM-Résultat-bac-2020.pdf     → Sciences Mathématiques
SE-Résultat-bac-2020.pdf     → Sciences Expérimentales
SS-FA-Résultat-bac-2020.pdf  → Sciences Sociales Franco-Arabe
SE-FA-Résultat-bac-2020.pdf  → Sciences Expérimentales Franco-Arabe
```

**Structure de tableau :**
```
Rang | ex | Prénoms et Noms | Centre | PV | Origine | Mention
```

**Particularités 2020 :**
- La première page contient un en-tête administratif (ministère, note de service)
- Le tableau commence après l'en-tête, avec une ligne d'en-tête de colonnes
- Les PVs contiennent des espaces : `24 841` → à normaliser en `24841`
- La colonne `ex` contient parfois `X` (signification exacte inconnue)
- Le centre d'examen et l'école d'origine sont deux champs distincts
- Certains centres ont des noms sur deux lignes (ex: `NELSON MANDELA\nSIGUIRI`)

#### 2021

**Fichiers :**
```
Liste-des-admis-SS-BAC-2021-PDF.pdf
Liste-des-admis-SM-BAC-2021.pdf
Liste-des-admis-SE-BAC-2021-1.pdf
Liste-des-admis-SS-Franco-Arabe-BAC-2021-PDF-2021.pdf
Liste-des-admis-SE-Franco-Arabe-BAC-2021-PDF.pdf
```

**Structure identique à 2020.** Les noms de fichiers changent mais le format interne est le même.

#### 2022

**Fichiers (attention : URLs avec Unicode décomposé) :**
```
Re%CC%81sultats-SS-2022.pdf      (Résultats-SS-2022.pdf)
Re%CC%81sultats-SM-2022.pdf
Re%CC%81sultats-SE-2022.pdf
Re%CC%81sultats-en-SS-FA-2022.pdf
Re%CC%81sultats-en-SE-FA-2022.pdf
```

**⚠️ Important :** Le caractère `é` dans les URLs 2022 est en **Unicode décomposé** (`e` + `◌́` = `e%CC%81`), pas en Unicode composé (`é` = `%C3%A9`). Les deux formes sont visuellement identiques mais donnent des URLs différentes. Les navigateurs les normalisent, mais `curl` et `wget` non.

**Structure identique à 2020-2021.**

#### 2023 et ultérieur

Les résultats 2023 n'ont pas été publiés sous forme nationale sur guineematin. Seuls des résultats régionaux (par préfecture) ont été postés. Il faudra faire de la veille pour les années futures.

### 4.2 Stratégie de croisement des données

Les deux sources (PDF et API) partagent le **numéro de PV** comme clé commune. La stratégie :

1. **Parser tous les PDFs** → base de référence (2020-2022)
2. **Pour 2023-2026**, utiliser l'API ukag avec la liste de PVs connus des années précédentes
3. **Pour les nouveaux PVs**, tester l'API avec les 3 profils pour trouver le bon
4. **Pour les Franco-Arabes**, seule la source PDF est disponible (l'API ne les supporte pas)

**Algorithme de croisement :**
```
Pour chaque PV connu (issu des PDFs) :
  Pour chaque année (2023, 2024, 2025) :
    Pour chaque profil (SS, SM, SE) :
      Appeler l'API avec (PV, profil, année)
      Si succès → enregistrer le résultat
      Si "non admis" → passer au profil suivant
```

---

## 5. SPÉCIFICATIONS FONCTIONNELLES

### 5.1 Recherche (MVP)

#### Barre de recherche principale

- **Type :** Input texte avec autocomplétion
- **Comportement :** Recherche insensible à la casse et aux accents. Si l'utilisateur tape `sylla`, les résultats incluent `SYLLA`, `Sylla`, `Syllah`.
- **Délai :** Debounce 300ms avant d'envoyer la requête
- **Résultats :** Liste de cartes avec Nom, Prénom, PV, Lycée, Mention, Session, Profil
- **État vide :** Message "Aucun résultat. Vérifiez l'orthographe ou essayez un autre terme."
- **État erreur :** Message "Service momentanément indisponible. Réessayez."

#### Recherche par PV

- Même barre de recherche, l'API détecte automatiquement si l'input est un nom ou un PV
- Un PV est une chaîne de 4 à 6 chiffres
- Si l'input est numérique → recherche prioritaire par PV
- Affichage immédiat du résultat unique

#### Recherche par école

- La recherche par nom couvre aussi le champ `origine` (lycée)
- Taper `GSP_EMMANUEL` retourne tous les élèves de ce lycée
- Page dédiée par école (v1.1)

#### Filtres

| Filtre | Type | Valeurs |
|---|---|---|
| Session | Select | 2020, 2021, 2022, 2023, 2024, 2025, 2026 |
| Profil | Select | Tous, SS, SM, SE, Franco-Arabe |
| Examen | Select | Bac (CEE et Brevet en v2) |
| Mention | Select | Toutes, BIEN, ABIEN, PASSABLE, TB |

### 5.2 Page résultat individu

**Données affichées :**
- Nom complet (majuscule, tel que dans la source)
- Numéro de PV
- Mention (avec badge coloré : BIEN = vert, ABIEN = bleu, PASSABLE = gris, TB = or)
- Lycée d'origine
- Centre d'examen
- Session + Profil
- Rang national dans le profil
- Source des données (PDF guineematin ou API ukag)

**Actions :**
- Bouton "Partager" (génère un lien WhatsApp pré-rempli)
- Lien "Voir les autres résultats de ce lycée"

### 5.3 Pages statistiques

#### Stats globales (page d'accueil sous la recherche)
- Nombre total d'admis dans la base
- Répartition par année (graphique barres)
- Répartition par profil (camembert)
- Top 10 des lycées avec le plus d'admis

#### Page école (v1.1)
- URL : `/lycee/{id}` ou `/lycee/{nom}`
- Nombre total d'admis de ce lycée
- Évolution par année
- Distribution des mentions
- Liste des admis (paginated)

### 5.4 Design

- **Mobile-first :** L'interface doit être parfaitement utilisable sur un écran 360px de large
- **Temps de chargement :** < 2 secondes sur 3G (taille de page < 100KB)
- **Mode sombre :** Détection automatique de la préférence système + toggle manuel
- **Accessibilité :** Contrastes suffisants, labels sur tous les inputs, navigation au clavier
- **Progressive Web App :** Service worker pour le cache offline, manifest pour l'installation

---

## 6. SPÉCIFICATIONS TECHNIQUES

### 6.1 Stack recommandée

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | SSR pour SEO, React pour l'interactivité |
| Style | Tailwind CSS v3 | Utilitaire, rapide, dark mode natif |
| Backend API | FastAPI (Python) | Performant, typé (Pydantic), proxy CORS pour l'API externe |
| Base de données | SQLite (fichier `bac.db`) | Simple, sans serveur, < 10 MB, largement suffisant à cette échelle |
| Cache | HTTP Cache-Control | Les résultats changent rarement (~1 fois par an) |
| Frontend Hosting | Vercel | Gratuit, SSL automatique, CDN, déploiement Git |
| Backend Hosting | Coolify (self-hosted) | Docker, pas de vendor lock-in, gestion simplifiée |
| Domaine | À définir | Idéalement un `.gn` ou `.org` |

### 6.2 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    UTILISATEUR                       │
│  (Mobile 90%, Desktop 10%, Guinée + diaspora)       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│               CDN (Vercel)                            │
│  Cache statique + ISR (revalidation CDN)             │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│            Vercel — Next.js (Frontend)               │
│  ┌──────────────────────────────────────────────┐   │
│  │ Pages SSR + composants client (React)        │   │
│  │ App Router, Tailwind, SEO                    │   │
│  └──────────────────┬───────────────────────────┘   │
└────────────────────┼────────────────────────────────┘
                     │ requêtes API
                     ▼
┌─────────────────────────────────────────────────────┐
│           Coolify — FastAPI (Backend + DB)           │
│  ┌─────────────┐  ┌──────────────────────────────┐  │
│  │ Endpoints   │  │ SQLite (bac.db)               │  │
│  │ /search     │  │ Table candidats (~10K rows)   │  │
│  │ /candidat   │  │ Indexes B-tree                │  │
│  │ /stats      │  │ Fuzzy search via rapidfuzz    │  │
│  │ /lycee      │  └──────────────────────────────┘  │
│  └─────────────┘                                    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ Scraper (Python, cron job interne)            │   │
│  │  PDF Parser (pdfplumber)                      │   │
│  │  API ukag Fetcher (proxy CORS intégré)        │   │
│  │  Script de merge + dédoublonnage              │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                                ▲
                                │ (ponctuel)
┌──────────────────────────────┼──────────────────────┐
│               API externe ukag                       │
│  POST /public/verificationResultatBac                │
│  (multipart/form-data uniquement)                    │
└─────────────────────────────────────────────────────┘
```

### 6.3 Pourquoi SQLite plutôt que PostgreSQL

| Critère | PostgreSQL / Supabase | SQLite |
|---|---|---|
| Complexité d'infra | Nécessite un serveur DB séparé | Un seul fichier, pas de service DB |
| Full-text search | Natif (`tsvector`, `pg_trgm`) | À implémenter en Python (`difflib`) |
| Volume de données | Justifié au-delà de 100K rows | Amplement suffisant pour < 10K rows |
| Performances (lecture) | Excellentes mais overkill | Excellentes à cette échelle |
| Déploiement | Service Supabase à configurer | Fichier co-localisé avec FastAPI |
| Backup | Automatique (Supabase) / pg_dump | `cp bac.db` (le fichier suffit) |
| Coût | Gratuit (tier limité) ou payant | Gratuit, pas de quota |

---

## 7. BASE DE DONNÉES

### 7.1 Schéma SQLite

```sql
-- Table principale des candidats
CREATE TABLE candidats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL,           -- Ex: "SYLLA"
    prenom      TEXT,                    -- Ex: "MOHAMED"
    nom_complet TEXT,                    -- Rempli à l'INSERT : prenom || ' ' || nom
    pv          TEXT NOT NULL,           -- Numéro PV, normalisé sans espaces. Ex: "24841"
    rang        INTEGER,                -- Classement national dans le profil
    ex          INTEGER DEFAULT 0,       -- 0/1 (SQLite n'a pas de BOOLEAN natif)
    centre      TEXT,                    -- Centre d'examen. Ex: "MORIFINDJAN DIABATE"
    origine     TEXT,                    -- Lycée/école d'origine. Ex: "GSP_EMMANUEL"
    mention     TEXT,                    -- "BIEN", "ABIEN", "PASSABLE", "TB", "EXCELLENT"
    session     INTEGER NOT NULL,        -- Année: 2020, 2021, ...
    profil      TEXT NOT NULL,           -- Code: "SS", "SM", "SE", "SS-FA", "SE-FA"
    profil_nom  TEXT,                    -- Nom complet: "Sciences Sociales", etc.
    examen      TEXT DEFAULT 'Bac',      -- "Bac", "CEE", "Brevet"
    source      TEXT DEFAULT 'guineematin', -- "guineematin" ou "ukag"
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

-- Indexes B-tree (pas de GIN/GiST en SQLite)
CREATE INDEX idx_candidats_pv ON candidats (pv);
CREATE INDEX idx_candidats_nom ON candidats (nom);
CREATE INDEX idx_candidats_origine ON candidats (origine);
CREATE INDEX idx_candidats_session ON candidats (session);
CREATE INDEX idx_candidats_profil ON candidats (profil);
CREATE INDEX idx_candidats_session_profil ON candidats (session, profil);
CREATE INDEX idx_candidats_origine_session ON candidats (origine, session);
```

### 7.2 Recherche approximative avec difflib

SQLite ne dispose pas d'extension `pg_trgm`. La recherche floue est implémentée côté FastAPI avec la librairie standard Python `difflib` (SequenceMatcher) :

```python
import difflib
import unicodedata

def normalize(text: str) -> str:
    """Retire les accents et passe en minuscules."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ASCII", "ignore").decode("ASCII")
    return text.lower().strip()

def fuzzy_score(candidate_text: str, query_norm: str) -> float:
    return difflib.SequenceMatcher(None, normalize(candidate_text), query_norm).ratio() * 100

# Recherche par nom (tolère fautes de frappe, accents, casse)
def search_by_name(query: str, limit: int = 20):
    q_norm = normalize(query)
    cursor.execute("""
        SELECT * FROM candidats 
        WHERE nom LIKE ? COLLATE NOCASE OR origine LIKE ? COLLATE NOCASE
        LIMIT 500
    """, (f"%{query}%", f"%{query}%"))
    candidates = cursor.fetchall()

    scored = []
    for c in candidates:
        name_score = fuzzy_score(c["nom_complet"], q_norm)
        origin_score = fuzzy_score(c["origine"] or "", q_norm)
        score = max(name_score, origin_score)
        if score >= 50:
            scored.append((c, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [c for c, _ in scored[:limit]]
```

**Pour les accents et la casse :** normaliser les chaînes avant comparaison avec `unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore')`.

**Colonne `nom_complet` :** comme SQLite ne supporte pas les colonnes générées, elle est peuplée à chaque INSERT dans le code Python :
```python
nom_complet = f"{prenom} {nom}".strip()
```

---

## 8. API BACKEND

### 8.1 Endpoints

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/search?q={query}` | Recherche par nom, PV ou école |
| GET | `/api/search?q={query}&session={year}&profil={code}` | Recherche filtrée |
| GET | `/api/candidat/{id}` | Détail d'un candidat |
| GET | `/api/lycee/{nom}` | Stats d'un lycée |
| GET | `/api/stats` | Statistiques globales |
| GET | `/api/stats/lycees` | Top lycées |
| GET | `/api/sessions` | Liste des sessions disponibles |
| GET | `/api/profils` | Liste des profils disponibles |

### 8.2 Exemple de réponse `/api/search?q=sylla&session=2020`

```json
{
  "query": "sylla",
  "total": 3,
  "results": [
    {
      "id": "xxx",
      "nom": "SYLLA",
      "prenom": "MOHAMED",
      "pv": "24841",
      "origine": "GSP_EMMANUEL",
      "centre": "MORIFINDJAN DIABATE",
      "mention": "BIEN",
      "rang": 1,
      "session": 2020,
      "profil": "SS",
      "profil_nom": "Sciences Sociales",
      "source": "guineematin"
    }
  ]
}
```

### 8.3 Pagination

Tous les endpoints de liste supportent :
- `?page=1&limit=20` (pagination par offset)
- Maximum 100 résultats par page

### 8.4 Cache

- `Cache-Control: public, max-age=86400` (24h) pour les endpoints publics
- Les données changent au maximum une fois par an (nouveaux résultats)
- Invalidation manuelle du cache lors de l'import de nouvelles données

---

## 9. FRONTEND

### 9.1 Pages

| Route | Page | Description |
|---|---|---|
| `/` | Accueil | Barre de recherche + stats globales |
| `/recherche?q=sylla` | Résultats de recherche | Liste des résultats |
| `/candidat/{id}` | Fiche candidat | Détail d'un résultat |
| `/lycee/{nom}` | Page lycée | Stats par établissement (v1.1) |
| `/stats` | Statistiques | Dashboard de stats (v1.1) |
| `/a-propos` | À propos | Sources, méthodologie, contact |

### 9.2 Composants React

```
components/
├── SearchBar.tsx          # Barre de recherche avec autocomplete
├── SearchResults.tsx      # Liste des résultats
├── CandidateCard.tsx      # Carte d'un candidat
├── Filters.tsx            # Filtres (session, profil, examen)
├── StatsOverview.tsx      # Stats globales (page d'accueil)
├── SchoolStats.tsx        # Stats par lycée
├── ShareButton.tsx        # Bouton partage WhatsApp
├── ThemeToggle.tsx        # Toggle mode sombre/clair
├── Layout.tsx             # Layout global (header, footer)
└── SEO.tsx                # Balises meta pour le SEO
```

### 9.3 SEO

Chaque page doit être indexable par Google :

- **Page d'accueil :** title = "Résultats Bac Guinée — Consultez les résultats par nom ou PV"
- **Page candidat :** title = "{NOM} {Prénom} — Résultat Bac {Session} {Profil}"
- **Page lycée :** title = "Résultats Bac — Lycée {Nom} — {Nb} admis en {Session}"
- **Sitemap.xml** généré automatiquement
- **robots.txt** permettant l'indexation de tout sauf `/api/`
- **Balises Open Graph** pour le partage sur les réseaux sociaux
- **Données structurées** JSON-LD (Schema.org)

---

## 10. ROADMAP

### Phase 1 — Fondations (Semaine 1-2) ✅ 80%

- [x] Scraper PDFs guineematin 2020-2022 (15 PDFs, 2207 candidats)
- [x] Validation parsing (0% erreur)
- [x] Normalisation des données (PV sans espaces, noms clean)
- [ ] Intégration API ukag pour 2023-2026
- [ ] Script de croisement/dédoublonnage
- [ ] Création DB SQLite (`bac.db`) et import des 2207+ candidats
- [ ] API FastAPI `/api/search` basique (recherche exacte + fuzzy via `difflib`)
- [ ] Dockerfile pour déploiement Coolify

### Phase 2 — Frontend MVP (Semaine 2-4)

- [ ] Setup Next.js + Tailwind
- [ ] Page d'accueil avec SearchBar
- [ ] Page résultats de recherche
- [ ] Page détail candidat
- [ ] Filtres session + profil
- [ ] Stats globales sur la homepage
- [ ] Design mobile-first + dark mode
- [ ] PWA (service worker basique)

### Phase 3 — Déploiement & Lancement (Semaine 4-5)

- [ ] Déploiement Vercel (frontend) + Coolify (backend Docker)
- [ ] Configuration domaine
- [ ] SEO (meta, sitemap, structured data)
- [ ] Tests de performance (Lighthouse > 90)
- [ ] Tests de charge (1000 requêtes/min)
- [ ] Mise en ligne

### Phase 4 — Enrichissement (Semaine 6-8)

- [ ] Pages par lycée
- [ ] Export CSV
- [ ] API publique documentée
- [ ] Améliorations PWA (offline, install)
- [ ] Analytics (Plausible ou Umami)

### Phase 5 — Automatisation & Extension (Semaine 9+)

- [ ] Veille automatique PDFs guineematin (cron job)
- [ ] Intégration CEE + Brevet
- [ ] Dashboard admin (upload PDF manuel, corrections)
- [ ] Notifications email ("Les résultats 2026 sont en ligne !")
- [ ] Monétisation (API premium ? Publicités ?)

### Phase 6 — Bac 2026 (Juillet-Août 2026)

- [ ] Scraper les nouveaux PDFs dès publication
- [ ] Mise à jour de la base
- [ ] Communication (réseaux sociaux, journaux)
- [ ] Gestion du pic de trafic (CDN, cache)

---

## 11. ANNEXES

### 11.1 URLs complètes des PDFs guineematin (BAC)

```
# 2020
https://guineematin.com/wp-content/uploads/2020/09/SS-Résultat-bac-2020.pdf
https://guineematin.com/wp-content/uploads/2020/09/SM-Résultat-bac-2020.pdf
https://guineematin.com/wp-content/uploads/2020/09/SE-Résultat-bac-2020.pdf
https://guineematin.com/wp-content/uploads/2020/09/SS-FA-Résultat-bac-2020.pdf
https://guineematin.com/wp-content/uploads/2020/09/SE-FA-Résultat-bac-2020.pdf

# 2021
https://guineematin.com/wp-content/uploads/2021/09/Liste-des-admis-SS-BAC-2021-PDF.pdf
https://guineematin.com/wp-content/uploads/2021/09/Liste-des-admis-SM-BAC-2021.pdf
https://guineematin.com/wp-content/uploads/2021/09/Liste-des-admis-SE-BAC-2021-1.pdf
https://guineematin.com/wp-content/uploads/2021/09/Liste-des-admis-SS-Franco-Arabe-BAC-2021-PDF-2021.pdf
https://guineematin.com/wp-content/uploads/2021/09/Liste-des-admis-SE-Franco-Arabe-BAC-2021-PDF.pdf

# 2022 (⚠️ Unicode décomposé : %CC%81 au lieu de %C3%A9)
https://guineematin.com/wp-content/uploads/2022/07/Re%CC%81sultats-SS-2022.pdf
https://guineematin.com/wp-content/uploads/2022/07/Re%CC%81sultats-SM-2022.pdf
https://guineematin.com/wp-content/uploads/2022/07/Re%CC%81sultats-SE-2022.pdf
https://guineematin.com/wp-content/uploads/2022/07/Re%CC%81sultats-en-SS-FA-2022.pdf
https://guineematin.com/wp-content/uploads/2022/07/Re%CC%81sultats-en-SE-FA-2022.pdf
```

### 11.2 Fichiers produits pendant l'audit

| Fichier | Description |
|---|---|
| `/root/pentest/_data/bac_results/bac_results.json` | 2207 candidats au format JSON |
| `/root/pentest/_scripts/bac_scraper.py` | Scraper Python (download + parse) |
| `/root/pentest/_scripts/bac_proxy.py` | Proxy CORS pour tester l'API ukag |
| `/root/pentest/_scripts/bac_api_test.html` | Page HTML de test de l'API |

### 11.3 Exemples de données réelles

```json
{
  "rang": "1",
  "ex": "",
  "nom": "SYLLA",
  "prenom": "MOHAMED",
  "centre": "MORIFINDJAN DIABATE",
  "pv": "24841",
  "origine": "GSP_EMMANUEL",
  "mention": "BIEN",
  "session": 2020,
  "profil": "Sciences Sociales"
}
```

### 11.4 Taille estimée de la base de données

- 2207 candidats (2020-2022, PDFs uniquement)
- ~5000 candidats estimés avec l'API ukag (2023-2026)
- ~10000 candidats totaux avec CEE + Brevet
- **Taille DB estimée : < 10 MB** (SQLite gère très bien ce volume)

### 11.5 Points d'attention pour le développeur

- **Unicode PDFs 2022 :** Les URLs des PDFs 2022 utilisent la forme décomposée du `é` (`e%CC%81`). La forme composée (`%C3%A9`) retourne 404. Il faut utiliser exactement les URLs documentées ci-dessus.
- **API multipart/form-data :** L'API ukag n'accepte QUE le `multipart/form-data`. Ne pas envoyer de JSON.
- **Message "non admis" générique :** Un candidat peut être "non admis" parce qu'il a échoué OU parce que le profil testé n'est pas le sien. Toujours tester les 3 profils pour un PV donné avant de conclure.
- **Normalisation des PVs :** Les PDFs contiennent des PVs avec espaces (`24 841`). Les stocker sans espaces (`24841`).
- **Pas de CORS sur l'API ukag :** Les appels doivent passer par le backend (FastAPI ou proxy), jamais directement depuis le navigateur.
- **Noms en MAJUSCULES :** Les PDFs contiennent les noms en capitales. Les stocker tels quels dans la DB mais la recherche doit être insensible à la casse.
