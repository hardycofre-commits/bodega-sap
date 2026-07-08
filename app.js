
const OWNER = 'hardycofre-commits';
const REPO = 'bodega-sap';
const DATOS_PATH = 'datos';
const SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxlntU4x4bOg4CQWIL80T0-gmrIKulE65hvqs9D0npSfGPmGCfVYcAMUyv8hKNsfOPMTg/exec';
const STORAGE_KEY = 'bodegaSapInventario_v5';

let materiales = [];
let sheetStore = {};
let current = null;
let filtroActual = 'pendiente';
let ultimoArchivo = '';

const $ = id => document.getElementById(id);
const norm = v => String(v ?? '').trim();

function num(v){
  if(v === undefined || v === null || v === '') return 0;
  const s = String(v).trim();
  if(s.includes(',') && s.includes('.')) return Number(s.replace(/\./g,'').replace(',','.')) || 0;
  if(s.includes(',')) return Number(s.replace(',','.')) || 0;
  return Number(s) || 0;
}
function pick(row,names){
  const keys = Object.keys(row);
  for(const n of names){ const k = keys.find(x => x.toLowerCase().trim() === n.toLowerCase()); if(k) return row[k]; }
  for(const n of names){ const k = keys.find(x => x.toLowerCase().includes(n.toLowerCase())); if(k) return row[k]; }
  return '';
}
function rec(code){ sheetStore[code] = sheetStore[code] || {}; return sheetStore[code]; }
function saveLocal(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(sheetStore)); }
function loadLocal(){ try{ sheetStore = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }catch{ sheetStore = {}; } }

function setInfo(id, text, type='loading'){
  const el = $(id);
  const cls = type === 'ok' ? 'ok' : type === 'warn' ? 'warn' : type === 'error' ? 'error' : '';
  const dot = type === 'ok' ? 'ok' : type === 'warn' ? 'warn' : type === 'error' ? 'error' : 'loading';
  el.className = 'pill ' + cls;
  el.innerHTML = `<span class="dot ${dot}"></span>${text}`;
}

function fechaArchivoGithub(f){
  const n = f.name || '';
  const m = n.match(/(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)[T _-]?([0-2]\d)?([0-5]\d)?([0-5]\d)?/);
  if(m){
    const yyyy=m[1], mm=m[2], dd=m[3], hh=m[4]||'00', mi=m[5]||'00', ss=m[6]||'00';
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`).getTime();
  }
  return 0;
}

async function cargarUltimoExcelGithub(){
  try{
    setInfo('sapInfo','Buscando último Excel en GitHub...');
    const api = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATOS_PATH}?t=${Date.now()}`;
    const r = await fetch(api, {cache:'no-store'});
    if(!r.ok) throw new Error('No se pudo leer carpeta datos');
    const files = await r.json();
    const excels = files.filter(f => f.type === 'file' && /\.(xlsx|xls|csv)$/i.test(f.name)).sort((a,b) => {
      const fa = fechaArchivoGithub(a), fb = fechaArchivoGithub(b);
      if(fa !== fb) return fb - fa;
      return b.name.localeCompare(a.name);
    });
    if(!excels.length) throw new Error('Sin Excel en datos');
    const file = excels[0];
    ultimoArchivo = file.name;
    await cargarExcelUrl(file.download_url + '?t=' + Date.now());
    setInfo('sapInfo','Último SAP cargado: ' + file.name, 'ok');
  }catch(e){
    setInfo('sapInfo','Sin Excel automático. Usa carga manual o sube un Excel a datos.', 'warn');
  }
}
async function cargarExcelUrl(url){
  const ab = await (await fetch(url, {cache:'no-store'})).arrayBuffer();
  procesarWorkbook(XLSX.read(ab, {type:'array'}));
}
function procesarWorkbook(wb){
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
  materiales = rows.map(r => {
    const codigo = norm(pick(r,['Material','Código','Codigo','Cod.Material','N° material','codigo_sap']));
    const desc = norm(pick(r,['Texto breve de material','Texto breve','Descripción','Descripcion','Denominación','descripcion']));
    const sap = num(pick(r,['Libre utilización','Libre utilizacion','Stock libre utilización','Stock','Cantidad','stock_sap']));
    const um = norm(pick(r,['Unidad medida base','UMB','Unidad','UM']));
    const almacen = norm(pick(r,['Almacén','Almacen','Centro']));
    return {codigo, desc, sap, um, almacen, search:(codigo + ' ' + desc).toLowerCase()};
  }).filter(x => x.codigo && x.desc);
  renderAll();
}

function cargarSheetsJSONP(){
  return new Promise(resolve => {
    setInfo('saveInfo','Leyendo Google Sheets...');
    const cb = 'gs_cb_' + Date.now();
    const script = document.createElement('script');
    const timeout = setTimeout(() => { cleanup(); setInfo('saveInfo','Sin conexión a Google Sheets. Usando respaldo local.', 'warn'); resolve(false); }, 12000);
    function cleanup(){ clearTimeout(timeout); delete window[cb]; if(script.parentNode) script.remove(); }
    window[cb] = rows => {
      try{
        const next = {};
        (rows || []).forEach(r => {
          const code = norm(r.codigo_sap || r.codigo || r.Código || r.Codigo || r.Material);
          if(!code) return;
          const realRaw = r.stock_real ?? r.real ?? '';
          next[code] = {
            real: realRaw !== '' && realRaw !== undefined ? Number(realRaw) : undefined,
            oculto: String(r.oculto || '').toUpperCase() === 'SI' || r.oculto === true,
            fecha: r.fecha_revision || r.fecha || '',
            fechaOculto: r.fecha_oculto || '',
            archivo: r.archivo_sap || ''
          };
        });
        sheetStore = next;
        saveLocal();
        setInfo('saveInfo','Sincronizado con Google Sheets', 'ok');
        renderAll();
        cleanup(); resolve(true);
      }catch(e){ cleanup(); setInfo('saveInfo','Error leyendo Google Sheets. Usando respaldo local.', 'error'); resolve(false); }
    };
    script.src = SHEETS_WEBAPP_URL + '?callback=' + cb + '&t=' + Date.now();
    script.onerror = () => { cleanup(); setInfo('saveInfo','Sin conexión a Google Sheets. Usando respaldo local.', 'warn'); resolve(false); };
    document.body.appendChild(script);
  });
}

async function sincronizarRegistro(codigo, accion='guardar'){
  const m = materiales.find(x => x.codigo === codigo) || {codigo, desc:'', sap:''};
  const r = rec(codigo);
  const payload = {
    codigo_sap: codigo,
    descripcion: m.desc || '',
    stock_sap: m.sap ?? '',
    stock_real: r.real ?? '',
    oculto: r.oculto ? 'SI' : '',
    fecha_revision: r.fecha || '',
    fecha_oculto: r.fechaOculto || '',
    estado: estado(m),
    archivo_sap: ultimoArchivo || '',
    accion
  };
  saveLocal();
  setInfo('saveInfo','Guardando en Google Sheets...', 'warn');
  try{
    const body = new URLSearchParams();
    body.set('payload', JSON.stringify(payload));
    await fetch(SHEETS_WEBAPP_URL, {method:'POST', mode:'no-cors', body});
    setInfo('saveInfo','Sincronizado con Google Sheets', 'ok');
  }catch(e){
    setInfo('saveInfo','Sin conexión. Cambio guardado localmente.', 'warn');
  }
}

function estado(m){
  const r = sheetStore[m.codigo];
  if(r?.oculto) return 'oculto';
  if(!r || r.real === undefined || r.real === '') return 'pendiente';
  const real = Number(r.real);
  if(m.sap === 0 && real > 0) return 'cero';
  if(real < m.sap) return 'rebajar';
  if(real > m.sap) return 'revisar';
  return 'ok';
}
function estadoTexto(e,m){
  if(e === 'ok') return '✅ Correcto';
  if(e === 'rebajar') return `⬇️ Rebajar ${m.sap - Number(rec(m.codigo).real || 0)}`;
  if(e === 'revisar') return '⚠️ Revisar';
  if(e === 'cero') return '🔵 SAP 0';
  if(e === 'oculto') return '🚫 Oculto';
  return '⏳ Pendiente';
}
function renderKpis(){
  let t=0,p=0,ok=0,reb=0,rev=0,cero=0;
  for(const m of materiales){
    const e = estado(m);
    if(!rec(m.codigo).oculto && m.sap > 0) t++;
    if(e === 'pendiente' && m.sap > 0) p++;
    if(e === 'ok') ok++;
    if(e === 'rebajar') reb++;
    if(e === 'revisar') rev++;
    if(e === 'cero') cero++;
  }
  $('kTotal').textContent=t; $('kPend').textContent=p; $('kOk').textContent=ok; $('kReb').textContent=reb; $('kRev').textContent=rev; $('kCero').textContent=cero;
}
function listaFiltrada(){
  const q = $('searchInput').value.toLowerCase().trim();
  let list = materiales.filter(m => q ? m.search.includes(q) : true);
  if(filtroActual === 'todos') list = list.filter(m => !rec(m.codigo).oculto);
  else if(filtroActual === 'pendiente') list = list.filter(m => estado(m) === 'pendiente' && m.sap > 0);
  else list = list.filter(m => estado(m) === filtroActual);
  return list;
}
function renderResults(){
  const list = listaFiltrada();
  const total = list.length;
  const view = list.slice(0,300);
  $('listHead').textContent = `${total} materiales encontrados${total > 300 ? ' · mostrando primeros 300' : ''}`;
  $('results').innerHTML = view.map(m => {
    const e = estado(m); const r = rec(m.codigo);
    return `<article class="item" data-code="${m.codigo}">
      <div>
        <div class="item-code">${m.codigo} · SAP ${m.sap} ${m.um || ''}</div>
        <div class="item-desc">${m.desc}</div>
        <div class="item-meta">Última revisión: ${r.fecha || r.fechaOculto || 'sin registro'} · Archivo: ${ultimoArchivo || 'manual'}</div>
      </div>
      <div class="badge ${e}">${estadoTexto(e,m)}</div>
    </article>`;
  }).join('') || '<p class="muted">Sin materiales en este listado.</p>';
}
function abrir(codigo){
  current = materiales.find(m => m.codigo === codigo);
  if(!current) return;
  $('homePanel').classList.add('hidden'); $('detailPanel').classList.remove('hidden');
  $('dCode').textContent = current.codigo; $('dDesc').textContent = current.desc; $('dSap').textContent = current.sap + ' ' + (current.um || '');
  const r = rec(current.codigo); $('realInput').value = r.real ?? ''; $('dFecha').textContent = 'Última revisión: ' + (r.fecha || r.fechaOculto || 'sin registro');
  $('hideBtn').textContent = r.oculto ? '↩️ Desocultar' : '🚫 Ocultar';
  actualizaEstadoDetalle(); setTimeout(() => $('realInput').focus(), 80);
}
function actualizaEstadoDetalle(){
  if(!current) return;
  const old = sheetStore[current.codigo] || {};
  const temp = {...old};
  if($('realInput').value !== '') temp.real = Number($('realInput').value);
  sheetStore[current.codigo] = temp;
  const e = estado(current);
  sheetStore[current.codigo] = old;
  $('dEstado').className = 'state ' + e;
  $('dEstado').textContent = estadoTexto(e, current);
}
function volverBuscador(){ $('detailPanel').classList.add('hidden'); $('homePanel').classList.remove('hidden'); current = null; renderAll(); }
function igualSap(){ if(current){ $('realInput').value = current.sap; actualizaEstadoDetalle(); } }
async function guardarRevision(){
  if(!current) return;
  if($('realInput').value === ''){ alert('Ingresa stock real o usa Igual que SAP.'); return; }
  sheetStore[current.codigo] = {...rec(current.codigo), real:Number($('realInput').value), oculto:false, fecha:new Date().toLocaleDateString('es-CL')};
  await sincronizarRegistro(current.codigo, 'guardar');
  $('searchInput').value = '';
  volverBuscador();
}
async function toggleOcultar(){
  if(!current) return;
  const r = rec(current.codigo);
  const ocultar = !r.oculto;
  sheetStore[current.codigo] = {...r, oculto:ocultar, fechaOculto: ocultar ? new Date().toLocaleDateString('es-CL') : ''};
  await sincronizarRegistro(current.codigo, ocultar ? 'ocultar' : 'desocultar');
  $('searchInput').value = '';
  volverBuscador();
}
function continuarPendiente(){
  const m = materiales.find(x => estado(x) === 'pendiente' && x.sap > 0);
  if(m) abrir(m.codigo); else alert('No hay pendientes con stock SAP mayor a cero.');
}
function renderAll(){ renderKpis(); renderResults(); }
function setFiltro(v){ filtroActual = v; renderResults(); }

function bindEvents(){
  $('searchInput').addEventListener('input', () => {
    renderResults();
    const q = $('searchInput').value.trim();
    if(q.length >= 5){
      const exact = materiales.find(m => m.codigo === q);
      if(exact) abrir(exact.codigo);
    }
  });
  $('results').addEventListener('click', e => { const item = e.target.closest('.item'); if(item) abrir(item.dataset.code); });
  $('filterSelect').addEventListener('change', e => setFiltro(e.target.value));
  $('continueBtn').addEventListener('click', continuarPendiente);
  $('syncBtn').addEventListener('click', async () => { await cargarSheetsJSONP(); await cargarUltimoExcelGithub(); renderAll(); });
  $('backBtn').addEventListener('click', volverBuscador);
  $('sameSapBtn').addEventListener('click', igualSap);
  $('saveBtn').addEventListener('click', guardarRevision);
  $('hideBtn').addEventListener('click', toggleOcultar);
  $('realInput').addEventListener('input', actualizaEstadoDetalle);
  $('fileInput').addEventListener('change', async e => {
    const f = e.target.files[0]; if(!f) return;
    ultimoArchivo = f.name;
    setInfo('sapInfo','Archivo manual cargado: ' + f.name, 'ok');
    const ab = await f.arrayBuffer();
    procesarWorkbook(XLSX.read(ab, {type:'array'}));
  });
}

async function init(){
  bindEvents();
  loadLocal();
  renderAll();
  await Promise.all([cargarSheetsJSONP(), cargarUltimoExcelGithub()]);
  renderAll();
}
init();
