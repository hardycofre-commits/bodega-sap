# Bodega SAP v5.5 PRO

Versión de avance estable para continuar el proyecto.

## Qué hace
- Mantiene el diseño profesional tipo aplicación móvil.
- Usa el logo Invermar en `assets/logo.png`.
- Busca automáticamente el último archivo Excel dentro de la carpeta `datos/` del repositorio GitHub.
- Lee Google Sheets al iniciar para recuperar revisiones y ocultos.
- Guarda en Google Sheets al presionar Guardar, Ocultar o Desocultar.
- Filtros funcionales: Todos, Pendientes, Correctos, Rebajar SAP, Revisar, SAP 0 y Ocultos.

## Estructura requerida en GitHub

```
bodega-sap/
├─ index.html
├─ styles.css
├─ app.js
├─ README.md
├─ assets/
│  └─ logo.png
└─ datos/
   └─ EXPORT-....xlsx
```

## Importante
El repositorio configurado en `app.js` es:

```js
OWNER = 'hardycofre-commits'
REPO = 'bodega-sap'
DATOS_PATH = 'datos'
```

Si GitHub muestra error leyendo datos, revisar que la carpeta se llame exactamente `datos` y que tenga al menos un archivo `.xlsx`, `.xls` o `.csv`.
