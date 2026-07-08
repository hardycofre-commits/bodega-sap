# Publicación en GitHub Pages

## Configuración recomendada

Repositorio:

```text
hardycofre-commits / inventario-bodega-sap
```

Estructura esperada:

```text
inventario-bodega-sap/
├── index.html
└── datos/
    └── EXPORT-2026-07-03T123917.503.xlsx
```

## GitHub Pages

En `Settings -> Pages`:

- Source: puede ser `Deploy from a branch` si se usa HTML simple.
- Branch: `main`
- Folder: `/ (root)`

Para este proyecto simple, `Deploy from a branch` suele ser más fácil que GitHub Actions.

## Error actual probable

La aplicación muestra:

```text
Sin Excel automático. Usa carga manual o sube un Excel a datos.
```

Causa probable:

El `index.html` busca el Excel en:

```js
const REPO='bodega-sap';
```

Pero el repositorio mostrado en las capturas es:

```text
inventario-bodega-sap
```

Solución:

```js
const REPO='inventario-bodega-sap';
```
