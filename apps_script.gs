const SHEET_NAME = 'Hoja 1';

function doGet(e) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = sh.getDataRange().getValues();
  const headers = data[0] || ['codigo_sap','oculto','stock_real','fecha_revision','fecha_oculto','archivo_sap','usuario','actualizado'];
  const rows = data.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  const json = JSON.stringify(rows);
  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  asegurarEncabezados_(sh);
  const body = JSON.parse(e.postData.contents || '{}');
  const codigo = String(body.codigo_sap || '').trim();
  if (!codigo) return ContentService.createTextOutput('sin codigo');

  const data = sh.getDataRange().getValues();
  let row = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === codigo) { row = i + 1; break; }
  }

  const values = [
    codigo,
    body.oculto || '',
    body.stock_real || '',
    body.fecha_revision || '',
    body.fecha_oculto || '',
    body.archivo_sap || '',
    body.usuario || '',
    body.actualizado || new Date()
  ];

  if (row === -1) sh.appendRow(values);
  else sh.getRange(row, 1, 1, values.length).setValues([values]);

  return ContentService.createTextOutput('ok');
}

function asegurarEncabezados_(sh) {
  const headers = ['codigo_sap','oculto','stock_real','fecha_revision','fecha_oculto','archivo_sap','usuario','actualizado'];
  const current = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const empty = current.every(v => String(v).trim() === '');
  if (empty) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
}
