# Bodega SAP v4.1

Estructura:

- `index.html`: estructura de la app.
- `styles.css`: diseño visual.
- `app.js`: lógica de Excel, GitHub y Google Sheets.
- `apps_script.gs`: código que debe ir en Google Apps Script.

## Importante

Para que Google Sheets sincronice bien, reemplaza el código del Apps Script por `apps_script.gs`, guarda y publica una nueva versión de la implementación.

## Excel SAP

El sistema busca el último archivo Excel en:

`hardycofre-commits / inventario-bodega-sap / datos`

Si no lo encuentra, usa la carga manual.
