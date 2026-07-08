const SHEET_NAME = 'Hoja 1';

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(r => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  const json = JSON.stringify(rows);
  if (e && e.parameter && e.parameter.callback) {
    return ContentService.createTextOutput(e.parameter.callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const body = JSON.parse(e.postData.contents);
  const codigo = String(body.codigo_sap || '').trim();
  if (!codigo) return ContentService.createTextOutput('sin codigo');

  const headers = ['codigo_sap','oculto','stock_real','fecha_revision','descripcion','stock_sap','estado','hora'];
  if (sh.getLastRow() === 0) sh.appendRow(headers);

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
    body.descripcion || '',
    body.stock_sap || '',
    body.estado || '',
    body.hora || ''
  ];

  if (row === -1) sh.appendRow(values);
  else sh.getRange(row, 1, 1, values.length).setValues([values]);

  return ContentService.createTextOutput('ok');
}
