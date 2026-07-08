const OWNER = 'hardycofre-commits';
const REPO = 'bodega-sap';
const DATOS_PATH = 'datos';
const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxlntU4x4bOg4CQWIL80T0-gmrIKulE65hvqs9D0npSfGPmGCfVYcAMUyv8hKNsfOPMTg/exec';
const LOCAL_BACKUP_KEY = 'bodegaSap_v52_localBackup';

let materiales = [];
let store = {};
let current = null;
let sapFileName = '';
let filtro = 'pendiente';

const $ = (id) => document.getElementById(id);
const els = {
  sapInfo: $('sapInfo'), sheetInfo: $('sheetInfo'), sapMeta: $('sapMeta'), searchInput: $('searchInput'),
  stateFilter: $('stateFilter'), results: $('results'), resultCount: $('resultCount'), continueBtn: $('continueBtn'),
  refreshBtn: $('refreshBtn'), detailPanel: $('detailPanel'), closeDetail: $('closeDetail'), dCode: $('dCode'),
  dDesc: $('dDesc'), dSap: $('dSap'), dEstado: $('dEstado'), dFecha: $('dFecha'), realInput: $('realInput'),
  equalSapBtn: $('equalSapBtn'), saveBtn: $('saveBtn'), hideBtn: $('hideBtn'),
  kTotal: $('kTotal'), kPend: $('kPend'), kOk: $('kOk'), kReb: $('kReb'), kRev: $('kRev'), kCero: $('kCero')
};

function norm(v){ return String(v ?? '').trim(); }
function num(v){
  if(v === undefined || v === null || v === '') return 0;
  const s = String(v).trim().replace(/\s/g,'');
  if(s.includes(',') && s.includes('.')) return Number(s.replace(/\./g,'').replace(',','.')) || 0;
  if(s.includes(',')) return Number(s.replace(',','.')) || 0;
  return Number(s) || 0;
}
function today(){ return new Date().toLocaleDateString('es-CL'); }
function nowStamp(){ return new Date().toLocaleString('es-CL'); }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function pick(row,names){
  const keys = Object.keys(row);
  for(const n of names){ const k = keys.find(x => x.toLowerCase().trim() === n.toLowerCase()); if(k) return row[k]; }
  for(const n of names){ const k = keys.find(x => x.toLowerCase().includes(n.toLowerCase())); if(k) return row[k]; }
  return '';
}
function setStatus(el, text, cls){ el.textContent = text; el.className = 'status-pill ' + (cls || ''); }

function fechaArchivo(f){
  const n = f.name || '';
  const m = n.match(/(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)[T _-]?([0-2]\d)?([0-5]\d)?([0-5]\d)?/);
  if(m){
    const yyyy=m[1], mm=m[2], dd=m[3], hh=m[4]||'00', mi=m[5]||'00', ss=m[6]||'00';
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`).getTime();
  }
  return 0;
}

async function cargarUltimoExcelGithub(){
  setStatus(els.sapInfo, '📄 Buscando último Excel en GitHub...', '');
  const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATOS_PATH}?t=${Date.now()}`;
  const r = await fetch(api, {cache:'no-store'});
  if(!r.ok) throw new Error('No se pudo leer la carpeta datos del repositorio.');
  const files = await r.json();
  const excels = files
    .filter(f => f.type === 'file' && /\.(xlsx|xls|csv)$/i.test(f.name))
    .sort((a,b) => {
      const fa = fechaArchivo(a), fb = fechaArchivo(b);
      if(fa !== fb) return fb - fa;
      return b.name.localeCompare(a.name);
    });
  if(!excels.length) throw new Error('No hay archivos Excel en la carpeta datos.');
  const file = excels[0];
  sapFileName = file.name;
  setStatus(els.sapInfo, '📄 Último SAP: ' + file.name, 'ok');
  els.sapMeta.innerHTML = `Repositorio: <b>${OWNER}/${REPO}</b> · Carpeta: <b>${DATOS_PATH}</b> · Archivo activo: <b>${escapeHtml(file.name)}</b>`;
  await cargarExcelUrl(file.download_url + '?t=' + Date.now());
}

async function cargarExcelUrl(url){
  const ab = await (await fetch(url, {cache:'no-store'})).arrayBuffer();
  procesarWorkbook(XLSX.read(ab, {type:'array'}));
}

function procesarWorkbook(wb){
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
  materiales = rows.map(r => {
    const codigo = norm(pick(r,['Material','Código','Codigo','Cod.Material','N° material','codigo_sap','Código SAP']));
    const desc = norm(pick(r,['Texto breve de material','Texto breve','Descripción','Descripcion','Denominación','descripcion']));
    const sap = num(pick(r,['Libre utilización','Libre utilizacion','Stock libre utilización','Stock','Cantidad','SAP','stock_sap']));
    const um = norm(pick(r,['Unidad medida base','UMB','Unidad','UM']));
    const almacen = norm(pick(r,['Almacén','Almacen','Centro']));
    return { codigo, desc, sap, um, almacen, search:(codigo+' '+desc).toLowerCase(), archivo:sapFileName };
  }).filter(x => x.codigo && x.desc);
  renderAll();
}

function normalizarSheetRow(row){
  const codigo = norm(row.codigo_sap || row.Codigo || row.Código || row.codigo || row.Material);
  if(!codigo) return null;
  return {
    real: row.stock_real !== '' && row.stock_real !== undefined ? Number(row.stock_real) : (row.real !== undefined ? Number(row.real) : undefined),
    oculto: String(row.oculto || '').toUpperCase() === 'SI' || row.oculto === true,
    fecha: norm(row.fecha_revision || row.fecha || row.Fecha),
    fechaOculto: norm(row.fecha_oculto || row.fechaOculto),
    usuario: norm(row.usuario || ''),
    archivo: norm(row.archivo_sap || row.archivo || '')
  };
}

function cargarSheetsJsonp(){
  return new Promise((resolve, reject) => {
    const cb = 'bodegaSheetsCb_' + Date.now();
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup(); reject(new Error('Timeout Google Sheets'));
    }, 12000);
    function cleanup(){ clearTimeout(timeout); delete window[cb]; script.remove(); }
    window[cb] = (data) => { cleanup(); resolve(Array.isArray(data) ? data : []); };
    script.onerror = () => { cleanup(); reject(new Error('No se pudo conectar a Google Sheets')); };
    script.src = SHEETS_WEBAPP_URL + '?callback=' + cb + '&t=' + Date.now();
    document.body.appendChild(script);
  });
}

async function cargarGoogleSheets(){
  try{
    setStatus(els.sheetInfo, '☁️ Leyendo Google Sheets...', '');
    const rows = await cargarSheetsJsonp();
    store = {};
    rows.forEach(row => {
      const codigo = norm(row.codigo_sap || row.Codigo || row.Código || row.codigo || row.Material);
      const item = normalizarSheetRow(row);
      if(codigo && item) store[codigo] = item;
    });
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(store));
    setStatus(els.sheetInfo, '🟢 Sincronizado con Google Sheets', 'ok');
  }catch(e){
    const backup = JSON.parse(localStorage.getItem(LOCAL_BACKUP_KEY) || '{}');
    store = backup;
    setStatus(els.sheetInfo, '🟠 Sin conexión a Google Sheets. Usando respaldo local.', 'warn');
  }
  renderAll();
}

async function guardarEnSheets(codigo, data){
  const body = {
    codigo_sap: codigo,
    oculto: data.oculto ? 'SI' : '',
    stock_real: data.real ?? '',
    fecha_revision: data.fecha || '',
    fecha_oculto: data.fechaOculto || '',
    archivo_sap: sapFileName || '',
    usuario: data.usuario || '',
    actualizado: nowStamp()
  };
  await fetch(SHEETS_WEBAPP_URL, {
    method:'POST', mode:'no-cors', cache:'no-store',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify(body)
  });
  localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(store));
  setStatus(els.sheetInfo, '🟢 Sincronizado con Google Sheets', 'ok');
}

function rec(code){ store[code] = store[code] || {}; return store[code]; }
function estado(m){
  const r = store[m.codigo];
  if(r?.oculto) return 'oculto';
  if(!r || r.real === undefined || r.real === null || r.real === '') return 'pendiente';
  const real = Number(r.real);
  if(m.sap === 0 && real > 0) return 'cero';
  if(real < m.sap) return 'rebajar';
  if(real > m.sap) return 'revisar';
  return 'ok';
}
function estadoInfo(e){
  const map = {
    ok:['✅ Correcto','ok'], rebajar:['🔻 Rebajar SAP','rebajar'], revisar:['⚠️ Revisar','revisar'],
    cero:['🔵 SAP 0','cero'], oculto:['🚫 Oculto','oculto'], pendiente:['⏳ Pendiente','pendiente']
  };
  return map[e] || map.pendiente;
}

function renderKpis(){
  let total=0, pend=0, ok=0, reb=0, rev=0, cero=0;
  for(const m of materiales){
    const e = estado(m);
    if(e !== 'oculto' && m.sap > 0) total++;
    if(e === 'pendiente' && m.sap > 0) pend++;
    if(e === 'ok') ok++;
    if(e === 'rebajar') reb++;
    if(e === 'revisar') rev++;
    if(e === 'cero') cero++;
  }
  els.kTotal.textContent=total; els.kPend.textContent=pend; els.kOk.textContent=ok; els.kReb.textContent=reb; els.kRev.textContent=rev; els.kCero.textContent=cero;
}

function filteredMaterials(){
  const q = els.searchInput.value.toLowerCase().trim();
  return materiales.filter(m => {
    const e = estado(m);
    if(q && !m.search.includes(q)) return false;
    if(filtro === 'todos') return e !== 'oculto';
    if(filtro === 'pendiente') return e === 'pendiente' && m.sap > 0;
    return e === filtro;
  });
}

function renderResults(){
  const list = filteredMaterials();
  const show = list.slice(0, 300);
  els.resultCount.textContent = `${list.length} materiales encontrados${list.length > 300 ? ' · mostrando primeros 300' : ''}`;
  if(!show.length){ els.results.innerHTML = '<div class="empty">Sin materiales para mostrar.</div>'; return; }
  els.results.innerHTML = show.map(m => {
    const r = rec(m.codigo), e = estado(m), [txt, cls] = estadoInfo(e);
    return `<article class="material-card" data-code="${escapeHtml(m.codigo)}">
      <div>
        <div class="material-code">${escapeHtml(m.codigo)} · SAP ${m.sap} ${escapeHtml(m.um || '')}</div>
        <div class="material-desc">${escapeHtml(m.desc)}</div>
        <div class="material-meta">Última revisión: ${escapeHtml(r.fecha || r.fechaOculto || 'sin registro')} · Archivo: ${escapeHtml(sapFileName || 'sin archivo')}</div>
      </div>
      <span class="badge ${cls}">${txt}</span>
    </article>`;
  }).join('');
}

function renderAll(){ renderKpis(); renderResults(); }

function abrir(codigo){
  current = materiales.find(m => m.codigo === codigo);
  if(!current) return;
  const r = rec(current.codigo), e = estado(current), [txt, cls] = estadoInfo(e);
  els.dCode.textContent = current.codigo;
  els.dDesc.textContent = current.desc;
  els.dSap.textContent = current.sap + ' ' + (current.um || '');
  els.realInput.value = r.real ?? '';
  els.dFecha.textContent = r.fecha || r.fechaOculto || 'sin registro';
  els.dEstado.textContent = txt;
  els.dEstado.className = 'badge ' + cls;
  els.detailPanel.classList.remove('hidden');
  setTimeout(() => els.realInput.focus(), 150);
}
function cerrarDetalle(){ els.detailPanel.classList.add('hidden'); current = null; }
function previewEstado(){
  if(!current) return;
  const old = store[current.codigo];
  store[current.codigo] = {...old, real: els.realInput.value === '' ? undefined : Number(els.realInput.value)};
  const e = estado(current), [txt, cls] = estadoInfo(e);
  els.dEstado.textContent = txt; els.dEstado.className = 'badge ' + cls;
  store[current.codigo] = old;
}
async function guardarRevision(){
  if(!current) return;
  if(els.realInput.value === ''){ alert('Ingresa stock real o usa Igual que SAP.'); return; }
  const data = {...rec(current.codigo), real:Number(els.realInput.value), fecha:today(), oculto:false};
  store[current.codigo] = data;
  setStatus(els.sheetInfo, '☁️ Guardando en Google Sheets...', '');
  renderAll();
  await guardarEnSheets(current.codigo, data);
  cerrarDetalle();
}
async function ocultarMaterial(){
  if(!current) return;
  const data = {...rec(current.codigo), oculto:true, fechaOculto:today()};
  store[current.codigo] = data;
  setStatus(els.sheetInfo, '☁️ Guardando oculto en Google Sheets...', '');
  renderAll();
  await guardarEnSheets(current.codigo, data);
  cerrarDetalle();
}
function igualSap(){ if(current){ els.realInput.value = current.sap; previewEstado(); } }
function continuarPendiente(){
  const m = materiales.find(x => !rec(x.codigo).oculto && x.sap > 0 && estado(x) === 'pendiente');
  if(m) abrir(m.codigo); else alert('No hay pendientes con stock SAP mayor a cero.');
}

async function refreshAll(){
  try{
    await Promise.all([cargarUltimoExcelGithub(), cargarGoogleSheets()]);
  }catch(e){
    setStatus(els.sapInfo, '🔴 ' + e.message, 'err');
    els.sapMeta.innerHTML = 'Revisa que el repositorio tenga la carpeta <b>datos</b> y que dentro exista al menos un archivo .xlsx, .xls o .csv.';
  }
  renderAll();
}

els.searchInput.addEventListener('input', renderResults);
els.stateFilter.addEventListener('change', () => { filtro = els.stateFilter.value; renderResults(); });
els.results.addEventListener('click', (ev) => { const card = ev.target.closest('.material-card'); if(card) abrir(card.dataset.code); });
els.continueBtn.addEventListener('click', continuarPendiente);
els.refreshBtn.addEventListener('click', refreshAll);
els.closeDetail.addEventListener('click', cerrarDetalle);
els.realInput.addEventListener('input', previewEstado);
els.equalSapBtn.addEventListener('click', igualSap);
els.saveBtn.addEventListener('click', guardarRevision);
els.hideBtn.addEventListener('click', ocultarMaterial);

refreshAll();
