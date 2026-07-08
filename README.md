# Bodega SAP v4.2

Sistema de inventario físico vs stock SAP para Piscicultura Lago Verde.

## Archivos

- `index.html`: estructura principal.
- `styles.css`: diseño y versión móvil.
- `app.js`: lógica de carga del último Excel, Google Sheets y guardado.
- `apps_script.gs`: código para pegar en Google Apps Script.
- `assets/logo.png`: logo Invermar.
- `datos/`: carpeta donde deben quedar los Excel SAP.

## Funcionamiento

La aplicación hace dos consultas al iniciar:

1. Busca el último archivo Excel dentro de `datos/` del repositorio `hardycofre-commits/bodega-sap`.
2. Consulta Google Sheets usando el Web App de Apps Script.

El Excel SAP entrega la lista actual de materiales. Google Sheets guarda el avance: stock real, ocultos, fechas y estado.

## Configuración GitHub

El repositorio debe tener esta estructura:

```text
bodega-sap/
├─ index.html
├─ styles.css
├─ app.js
├─ README.md
├─ assets/
│  └─ logo.png
└─ datos/
   └─ EXPORT-2026-07-03T123917.503.xlsx
```

Puedes dejar varios archivos Excel dentro de `datos/`. El sistema cargará automáticamente el más nuevo según la fecha del nombre.

## Apps Script

1. Abrir Google Sheets.
2. Extensiones → Apps Script.
3. Pegar el contenido de `apps_script.gs`.
4. Guardar.
5. Implementar → Administrar implementaciones.
6. Editar implementación.
7. Versión: Nueva versión.
8. Acceso: Cualquier persona.
9. Implementar.

## URL configurada

El archivo `app.js` viene conectado a:

```text
https://script.google.com/macros/s/AKfycbxlntU4x4bOg4CQWIL80T0-gmrIKulE65hvqs9D0npSfGPmGCfVYcAMUyv8hKNsfOPMTg/exec
```
