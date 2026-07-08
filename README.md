# Bodega SAP v5.2

Versión simplificada:

- No usa carga manual.
- Busca automáticamente el último Excel dentro de la carpeta `datos` del repositorio GitHub.
- Lee y guarda avances en Google Sheets mediante Apps Script.
- Mantiene materiales ocultos, stock real y fechas aunque se cambie el Excel SAP.

## Estructura esperada en GitHub

```text
bodega-sap/
├─ index.html
├─ styles.css
├─ app.js
├─ logo.png
├─ README.md
└─ datos/
   └─ EXPORT-2026-07-07T232521.251.xlsx
```

Puedes dejar varios Excel dentro de `datos`. La app toma el más reciente según la fecha del nombre.

## Apps Script

Copia el contenido de `apps_script.gs` en Google Sheets → Extensiones → Apps Script.
Luego implementa una nueva versión como Web App:

- Ejecutar como: Yo
- Acceso: Cualquier persona

## Configuración principal

En `app.js`:

```js
const OWNER = 'hardycofre-commits';
const REPO = 'bodega-sap';
const DATOS_PATH = 'datos';
```
