# Simulateur 3D de véhicule de dépollution

Application 3D temps réel permettant d'aménager un véhicule de dépollution aéronautique. Le projet est autonome, ne dépend d'aucune ressource binaire externe et peut être emballé en exécutable Windows portable (`Simulateur_Depollution.exe`).

## Fonctionnalités principales

- Visualisation 3D en temps réel basée sur Three.js.
- Châssis paramétrables avec gabarits latéraux translucides.
- Modules procéduraux (cuves, pompes, enrouleurs, armoires) déplaçables et rotatifs.
- Modes de manipulation :
  - **T** : translation (glisser pour déplacer, pas de 10 mm).
  - **R** : rotation (glisser latéralement pour pivoter par pas de 5°).
  - **Suppr** : suppression du module sélectionné.
- Undo/Redo : `Ctrl+Z` / `Ctrl+Y`.
- Calculs en temps réel : masse totale, centre de gravité, charges essieux, marge PTAC.
- Détection d'encombrement du couloir de circulation.
- Export/Import JSON de la configuration.
- Export de la vue 3D en PNG encodé Base64.
- Comparaison rapide entre deux configurations successives (A/B).

## Prérequis

- Node.js 18 ou supérieur.
- npm ou yarn.

## Installation

```bash
npm install
```

Le projet embarque Three.js localement (dossier `libs/`), aucune connexion Internet n'est requise après installation.

## Utilisation en mode développement

```bash
npm start
```

Une fenêtre Electron s'ouvre automatiquement et charge l'application 3D.

## Génération de l'exécutable Windows

```bash
npm run build
```

Electron Builder produit un exécutable portable dans `dist/Simulateur_Depollution.exe`. L'exécutable embarque les fichiers HTML/JS/CSS du projet et peut être lancé directement par double-clic sans ligne de commande.

## Structure du projet

```
aménagement3D/
├─ index.html
├─ style.css
├─ script.js
├─ libs/
│  └─ three.module.js
├─ main.js
├─ preload.js
├─ package.json
├─ builder-config.json
└─ README.md
```

## Import / Export

- **Nouveau** : réinitialise complètement la scène après confirmation.
- **Ouvrir JSON** : importe un fichier `.json` exporté préalablement.
- **Sauvegarder JSON** : télécharge un instantané de l'état courant.
- **Exporter PNG** : affiche la capture de la vue courante en data URL (`data:image/png;base64,...`).
- **Comparer (A vs B)** : première activation enregistre la configuration A, la seconde compare avec l'état actuel (configuration B) et affiche les écarts.

## Calculs physiques

Les calculs suivent les formules fournies :

- `massFluid = (L * W * H / 1e9) * (fill_% / 100) * density` (converti via le volume en litres pour chaque module).
- `massTotal = chassisMass + Σ(moduleMassEmpty + massFluid)`
- `CoG = Σ(mᵢ·posᵢ) / Σ(mᵢ)`
- `R_front = massTotal * (distRear / wheelbase)`
- `R_rear  = massTotal * (distFront / wheelbase)`
- `margePTAC = PTAC - massTotal`

Les alertes sont reflétées dans la barre d'état :

- PTAC dépassé → indicateur rouge.
- Couloir encombré → indicateur orange.
- Conforme → indicateurs verts.

## Licence

MIT
