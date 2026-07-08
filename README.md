# Bodega SAP v4.0 - estructura separada

Archivos:

- `index.html`: estructura de la aplicación.
- `styles.css`: diseño visual.
- `app.js`: lógica de carga Excel, filtros, guardado y sincronización con Google Sheets.

Configuración importante en `app.js`:

```js
const OWNER='hardycofre-commits';
const REPO='inventario-bodega-sap';
const DATOS_PATH='datos';
const SHEETS_WEBAPP_URL='https://script.google.com/macros/s/AKfycbxlntU4x4bOg4CQWIL80T0-gmrIKulE65hvqs9D0npSfGPmGCfVYcAMUyv8hKNsfOPMTg/exec';
```

Para publicar en GitHub:

1. Sube estos archivos en la raíz del repositorio.
2. Mantén los Excel dentro de la carpeta `datos`.
3. Activa GitHub Pages desde la rama `main` y carpeta `/root`, o usa GitHub Actions.

Prueba inicial:

1. Abre la web.
2. Confirma que cargue el último Excel desde `datos`.
3. Oculta un material.
4. Revisa que aparezca en Google Sheets.
