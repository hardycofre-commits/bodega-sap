# Bodega SAP - Documentación del proyecto

## Objetivo
Aplicación web para comparar inventario físico vs stock SAP en Piscicultura Lago Verde.

La aplicación debe:
- Cargar el último archivo SAP desde GitHub.
- Guardar avance en Google Sheets.
- Sincronizar computador y celular.
- Permitir revisar, ocultar y registrar stock real por código SAP.

## Estado actual
La sincronización con Google Sheets está conectada, pero la aplicación puede no mostrar materiales si no encuentra el Excel SAP en GitHub.

En el archivo `index.html` actual existe esta configuración:

```js
const OWNER='hardycofre-commits';
const REPO='bodega-sap';
const DATOS_PATH='datos';
```

Si el repositorio real es `inventario-bodega-sap`, entonces debe quedar:

```js
const OWNER='hardycofre-commits';
const REPO='inventario-bodega-sap';
const DATOS_PATH='datos';
```

Además, dentro del repositorio debe existir una carpeta llamada `datos` con el Excel SAP.

## URL Apps Script

```text
https://script.google.com/macros/s/AKfycbxlntU4x4bOg4CQWIL80T0-gmrIKulE65hvqs9D0npSfGPmGCfVYcAMUyv8hKNsfOPMTg/exec
```

## Flujo esperado

1. GitHub contiene el archivo SAP en `/datos`.
2. La aplicación abre el último Excel disponible.
3. Google Sheets guarda el avance: stock real, oculto y fecha.
4. Computador y celular leen la misma información.

## Próximo paso recomendado

Corregir el nombre del repositorio en `index.html`:

```js
const REPO='inventario-bodega-sap';
```

Luego subir nuevamente el archivo a GitHub y probar.
