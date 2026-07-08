window.UI = (() => {
  const $ = id => document.getElementById(id);
  let state = { items:[], filter:'todos', query:'', current:null, onSave:null, onHide:null };

  function pill(el, type, text){
    el.className = `status-pill ${type}`;
    el.innerHTML = `<span class="dot ${type}"></span><span>${text}</span>`;
  }
  function setSapStatus(type,text){ pill($('sapStatus'), type, text); }
  function setSheetStatus(type,text){ pill($('sheetStatus'), type, text); }
  function bind(callbacks){
    state.onSave = callbacks.onSave;
    state.onHide = callbacks.onHide;
    $('searchInput').addEventListener('input', e => { state.query = e.target.value.toLowerCase().trim(); renderList(); });
    $('continueBtn').addEventListener('click', continuar);
    $('filterRow').addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]'); if(!btn) return;
      setFilter(btn.dataset.filter);
    });
    $('kpis').addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]'); if(!btn) return;
      setFilter(btn.dataset.filter);
    });
    $('closeDrawer').addEventListener('click', closeDetail);
    $('drawerBackdrop').addEventListener('click', closeDetail);
    $('equalBtn').addEventListener('click', () => { if(state.current){ $('realInput').value = state.current.sap; updateDetailState(); }});
    $('realInput').addEventListener('input', updateDetailState);
    $('saveBtn').addEventListener('click', saveCurrent);
    $('hideBtn').addEventListener('click', hideCurrent);
  }
  function setItems(items){ state.items = items; renderAll(); }
  function setFilter(f){
    state.filter = f;
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
    renderList();
  }
  function updateCounts(){
    const c = Inventory.counts(state.items);
    $('kTotal').textContent = c.todos; $('kPend').textContent = c.pendiente; $('kOk').textContent = c.ok; $('kReb').textContent = c.rebajar; $('kRev').textContent = c.revisar; $('kCero').textContent = c.cero;
    $('fTodos').textContent = c.todos; $('fPend').textContent = c.pendiente; $('fOk').textContent = c.ok; $('fReb').textContent = c.rebajar; $('fRev').textContent = c.revisar; $('fCero').textContent = c.cero; $('fOculto').textContent = c.oculto;
  }
  function filtered(){
    let list = state.items.slice();
    if(state.filter !== 'todos') list = list.filter(x => Inventory.estado(x) === state.filter);
    else list = list.filter(x => Inventory.estado(x) !== 'oculto');
    if(state.query) list = list.filter(x => x.search.includes(state.query));
    list.sort((a,b) => Inventory.comparePriority(Inventory.estado(a)) - Inventory.comparePriority(Inventory.estado(b)) || a.codigo.localeCompare(b.codigo));
    return list;
  }
  function renderList(){
    const list = filtered();
    $('listSummary').textContent = `${list.length} materiales encontrados${list.length>300?' · mostrando primeros 300':''}`;
    const html = list.slice(0,300).map(itemCard).join('') || '<div class="empty">Sin materiales para mostrar.</div>';
    $('materialList').innerHTML = html;
    document.querySelectorAll('.material-card').forEach(card => card.addEventListener('click', () => openDetail(card.dataset.code)));
  }
  function itemCard(it){
    const e = Inventory.estado(it), r=it.rev||{};
    const real = r.stock_real ?? '—';
    const fecha = r.fecha_revision || r.fecha_oculto || 'sin registro';
    return `<article class="material-card" data-code="${it.codigo}">
      <div class="card-main"><div class="code">${it.codigo}</div><div class="desc">${it.desc}</div><div class="meta">📄 ${it.archivo} · 🗓 ${fecha}</div></div>
      <div class="card-side"><span class="badge ${e}">${Inventory.estadoLabel(e)}</span><small>SAP ${it.sap} ${it.um||''}</small><small>Real ${real}</small></div>
    </article>`;
  }
  function openDetail(code){
    const it = state.items.find(x => x.codigo === code); if(!it) return;
    state.current = it;
    $('dCode').textContent = `📦 ${it.codigo}`;
    $('dDesc').textContent = it.desc;
    $('dSap').textContent = `${it.sap} ${it.um||''}`;
    $('realInput').value = it.rev?.stock_real ?? '';
    $('dFecha').textContent = `Última revisión: ${it.rev?.fecha_revision || it.rev?.fecha_oculto || 'sin registro'} · Archivo: ${it.archivo}`;
    updateDetailState();
    $('drawerBackdrop').classList.remove('hidden'); $('detailDrawer').classList.remove('hidden');
    setTimeout(() => $('realInput').focus(), 150);
  }
  function closeDetail(){ $('drawerBackdrop').classList.add('hidden'); $('detailDrawer').classList.add('hidden'); state.current=null; }
  function updateDetailState(){
    if(!state.current) return;
    const temp = {...state.current, rev:{...(state.current.rev||{})}};
    if($('realInput').value !== '') temp.rev.stock_real = Number($('realInput').value);
    else delete temp.rev.stock_real;
    const e = Inventory.estado(temp);
    $('dEstado').className = `state-card ${e}`;
    $('dEstado').textContent = Inventory.estadoLabel(e);
  }
  async function saveCurrent(){
    if(!state.current) return;
    if($('realInput').value === '') { alert('Ingresa stock real o usa Igual que SAP.'); return; }
    const reg = { codigo_sap: state.current.codigo, stock_real: Number($('realInput').value), oculto:false, fecha_revision: new Date().toLocaleString('es-CL'), archivo_sap: state.current.archivo };
    await state.onSave(reg);
    Object.assign(state.current.rev, reg);
    closeDetail(); renderAll(); $('searchInput').focus();
  }
  async function hideCurrent(){
    if(!state.current) return;
    const reg = { codigo_sap: state.current.codigo, stock_real: state.current.rev?.stock_real ?? '', oculto:true, fecha_oculto: new Date().toLocaleString('es-CL'), archivo_sap: state.current.archivo };
    await state.onHide(reg);
    Object.assign(state.current.rev, reg);
    closeDetail(); renderAll();
  }
  function continuar(){
    const next = state.items.find(x => Inventory.estado(x) === 'pendiente');
    if(next) openDetail(next.codigo); else alert('No hay materiales pendientes.');
  }
  function renderAll(){ updateCounts(); renderList(); }
  return { bind, setItems, setSapStatus, setSheetStatus, renderAll };
})();
