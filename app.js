(async function(){
  const cfg = window.BODEGA_CONFIG;
  let sheetMap = {};

  UI.bind({
    onSave: guardarRegistro,
    onHide: guardarRegistro
  });

  async function init(){
    let materiales = [];
    try{
      const excel = await GitHubData.obtenerUltimoExcel();
      UI.setSapStatus('ok', `Último SAP cargado: ${excel.name}`);
      materiales = Inventory.parseWorkbook(excel.buffer, excel.name);
      localStorage.setItem(cfg.STORAGE_KEY + '_lastSap', JSON.stringify({ name: excel.name, ts: Date.now(), materiales }));
    }catch(err){
      UI.setSapStatus('bad', 'No se pudo leer la carpeta datos del repositorio.');
      const cache = localStorage.getItem(cfg.STORAGE_KEY + '_lastSap');
      if(cache){
        const saved = JSON.parse(cache);
        materiales = saved.materiales || [];
        UI.setSapStatus('warn', `Usando último SAP guardado: ${saved.name}`);
      }else{
        document.getElementById('sourceNote').textContent = err.message || 'Revisa que exista la carpeta datos con Excel.';
      }
    }

    try{
      sheetMap = await SheetsDB.leer();
      UI.setSheetStatus('ok', 'Sincronizado con Google Sheets');
    }catch(err){
      UI.setSheetStatus('warn', 'Sin conexión a Google Sheets. Usando respaldo local.');
      sheetMap = JSON.parse(localStorage.getItem(cfg.STORAGE_KEY + '_sheet') || '{}');
    }

    const items = Inventory.merge(materiales, sheetMap);
    UI.setItems(items);
  }

  async function guardarRegistro(reg){
    sheetMap[reg.codigo_sap] = {...(sheetMap[reg.codigo_sap]||{}), ...reg};
    localStorage.setItem(cfg.STORAGE_KEY + '_sheet', JSON.stringify(sheetMap));
    UI.setSheetStatus('warn', 'Guardando en Google Sheets...');
    try{
      await SheetsDB.guardar(reg);
      UI.setSheetStatus('ok', 'Sincronizado con Google Sheets');
    }catch(err){
      UI.setSheetStatus('warn', 'No se pudo sincronizar. Quedó respaldo local.');
    }
  }

  init();
})();
