# Simulateur d'aménagement de véhicule de dépollution

Ce dépôt contient l'ossature d'un projet **Unity 6 (URP)** dédié à la conception et à l'analyse technique d'un véhicule de dépollution aéroportuaire. Les scripts et données fournis servent de base à l'implémentation complète décrite dans le cahier des charges.

## Structure du projet

```
Assets/
  Scripts/
    Core/           # Contrôleurs globaux, Undo/Redo, bootstrap
    UI/             # Composants d'interface (bibliothèque, inspection, analyse...)
    Domain/         # Modèles de données (châssis, modules)
    Tools/          # Export JSON, DXF, capture PNG, outils de mesure
    Analysis/       # Calculs de masse, centre de gravité, charges essieux
  Art/
    Models/
    Modules/
    Materials/
  Resources/
    Libraries/
      modules_library.json
      chassis_presets.json
  Scenes/
    Main.unity      # À créer dans l'éditeur Unity
  Plugins/
```

## Scripts clés

- `Chassis.cs` et `Module.cs` définissent les entités métiers.
- `MassBalanceCalculator`, `AxleLoadEstimator` et `ClearanceChecker` fournissent les calculs d'analyse.
- `JsonExporter` / `JsonImporter`, `DxfExporter` et `PngCapture` regroupent les outils d'export.
- Les composants du dossier `UI/` esquissent la structure des panneaux bibliothèque, inspection, analyse et comparaison.

## Données exemples

Les fichiers JSON disponibles dans `Assets/Resources/Libraries/` contiennent un châssis type ainsi qu'une sélection de modules paramétriques (cuves, pompes, enrouleurs, rangements). Ils servent de base aux chargements dynamiques dans l'application.

## Mise en route

1. Ouvrir le dossier racine dans Unity 6 en créant un projet URP.
2. Importer la scène `Assets/Scenes/Main.unity` (à créer) et y placer les prefabs nécessaires (châssis, panneaux UI, contrôleurs, caméras).
3. Associer les scripts aux GameObjects correspondants (voir commentaires dans les scripts).
4. Compléter les fonctionnalités interactives (gizmos 3D, Undo/Redo, exports, contrôles caméra) selon les exigences listées dans le cahier des charges.

## Compilation

Pour produire un exécutable Windows :

1. Configurer les paramètres de build pour la plateforme **Windows**.
2. Lancer `File > Build Settings > Build` depuis l'éditeur Unity.

## Raccourcis (à implémenter)

- `G` : activer/désactiver la grille
- `1 / 2 / 3` : modes Move / Rotate / Scale
- `F` : focus caméra
- `Ctrl + Z / Ctrl + Y` : Undo / Redo
- `Ctrl + S` : export JSON

## Limites actuelles

- Les scripts fournis ne couvrent que la logique métier et les exports de base.
- Les prefabs, modèles 3D, matériaux et la scène principale sont à créer dans Unity.
- Les contrôles de saisie utilisateur et la validation temps réel doivent être complétés.
