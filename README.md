# Bodega SAP v6.0

Versión reorganizada y profesional.

## Qué hace

- Busca automáticamente el último Excel dentro de `datos/` del repositorio `hardycofre-commits/bodega-sap`.
- Lee Google Sheets para ocultos, stock real y fechas.
- Calcula estados automáticamente: Pendiente, Correcto, Rebajar SAP, Revisar, SAP 0 y Oculto.
- Guarda cambios en Google Sheets.

## Importante

En GitHub debe existir:

```text
bodega-sap/
├─ index.html
├─ styles.css
├─ config.js
├─ github.js
├─ sheets.js
├─ inventario.js
├─ ui.js
├─ app.js
├─ assets/logo.png
└─ datos/
   └─ EXPORT-....xlsx
```

## Apps Script

Pegar el contenido de `apps_script.gs` en Google Sheets > Extensiones > Apps Script.
Luego implementar como Web App:

- Ejecutar como: Yo
- Acceso: Cualquier persona
