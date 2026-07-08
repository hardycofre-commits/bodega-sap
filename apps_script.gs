const SHEET_NAME = 'Hoja 1';

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const data = sh.getDataRange().getValues();
  if (!data.length) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0];
  const rows = data.slice(1).map(r => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });

  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  const body = JSON.parse(e.postData.contents);

  const codigo = String(body.codigo_sap || '').trim();
  if (!codigo) {
    return ContentService.createTextOutput('sin codigo');
  }

  const data = sh.getDataRange().getValues();
  let row = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === codigo) {
      row = i + 1;
      break;
    }
  }

  const values = [
    codigo,
    body.oculto || '',
    body.stock_real || '',
    body.fecha_revision || ''
  ];

  if (row === -1) {
    sh.appendRow(values);
  } else {
    sh.getRange(row, 1, 1, values.length).setValues([values]);
  }

  return ContentService.createTextOutput('ok');
}
