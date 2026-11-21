// App de la casa (v2.18): la abre otra persona con su link. Solo ve (y anota) el presupuesto por corte de UNA tarjeta.
// Del servidor solo llegan las compras de esa tarjeta: nada más de la app pasa por aquí.
var K = (function () {
  'use strict';
  var C = Calc;
  function leer(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* lleno o bloqueado */ } }
  // el link trae #s=<implementación>&k=<llave>; se guarda para cuando se abra instalada (sin el #)
  var h = new URLSearchParams(location.hash.slice(1)), acc = leer('casa-acceso') || {};
  if (h.get('s') && h.get('k')) { acc = { s: h.get('s'), k: h.get('k') }; guardar('casa-acceso', acc); try { history.replaceState(null, '', location.pathname); } catch (e) { /* nada */ } }
  var URL_SRV = acc.s ? 'https://script.google.com/macros/s/' + encodeURIComponent(acc.s) + '/exec' : '';
  var CL = 'casa-datos-' + String(acc.k || '').slice(0, 8);
  var D = leer(CL), atras = 0, form = null, cargando = false;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function din(n, m) { return C.dinero(Math.round((Number(n) || 0) * 100) / 100, m || 'CRC'); }
  function din0(n) { return C.dinero(Math.round(Number(n) || 0), 'CRC'); }
  function toast(t, ms) { var e = $('toast'); e.textContent = t; e.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('ver'); }, ms || 2600); }
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fCorta(d) { d = new Date(d); return d.getDate() + ' ' + MESES[d.getMonth()]; }
  function hoyLocal() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function nombre(s) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > 3 && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|\s)\S/g, function (x) { return x.toUpperCase(); }) : s; }
  function llamar(accion, args) {
    return fetch(URL_SRV, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ casa: acc.k, accion: accion, args: args || [] }) })
      .then(function (r) { return r.text(); }, function () { var e = new Error('Sin conexión'); e.red = true; throw e; })
      .then(function (t) { var j; try { j = JSON.parse(t); } catch (e) { throw new Error('Respuesta inesperada'); } if (!j.ok) throw new Error(j.error || 'Error'); return j.resultado; });
  }
  function abrir(html) { $('panel').innerHTML = html; $('velo').classList.add('ver'); }
  function cerrar() { $('velo').classList.remove('ver'); $('panel').innerHTML = ''; form = null; }

  // ---------------- datos y cálculos (los mismos de la app principal)
  function dd() { return { movimientos: (D && D.movimientos) || [], tipoCambio: (D && D.tipoCambio) || 0, cortes: [D.cfg], flotante: (D && D.flotante) || {} }; }
  function calc(a) { return C.presupuestoCorte(dd(), D.cfg, new Date(), a || 0); }
  function porConfirmar(m) { return /monto estimado|IVA estimado/i.test(m.nota || ''); }
  function mia(m) { return /app de la casa/i.test(m.nota || ''); }
  function quien(m) {
    var x = String(m.nota || '').match(/app de la casa(?: · ([^·]+))?/i);
    if (x) return 'anotaste' + (x[1] && D.persona && x[1].trim() !== D.persona ? ' (' + x[1].trim() + ')' : '');
    if (m.autorizacion === 'IVA-' && porConfirmar(m)) return 'estimado';
    return m.origen === 'Correo' ? 'correo del banco' : 'anotada a mano';
  }
  function icono(m) { return m.tipo === 'Ingreso' ? '↩' : /^IVA/.test(m.comercio || '') ? '🧾' : /google|netflix|spotify|apple|disney|youtube/i.test(m.comercio || '') ? '📺' : /carne|carnic/i.test(m.comercio || '') ? '🥩' : /farma/i.test(m.comercio || '') ? '💊' : '🛒'; }
  function color(r) { return r.estado === 'pasado' ? 'var(--rojo)' : r.estado === 'alerta' || r.estado === 'rapido' ? 'var(--naranja)' : 'var(--verde)'; }

  function itemMov(x) {
    var m = x.mov, est = porConfirmar(m), dev = x.devolucion, puede = D.corregir && mia(m) && m.fila > 0;
    return '<button class="mov' + (est ? ' est' : '') + '"' + (puede ? ' onclick="K.formAnotar(' + m.fila + ')"' : ' onclick="K.verMov(' + m.fila + ')"') + '><span class="ico">' + icono(m) + '</span>' +
      '<span class="t"><b>' + esc(nombre(m.comercio) || 'Compra') + (dev ? ' · devolución' : '') + '</b><span>' + (x.flotante ? '<i class="flot">↪ flotante</i> ' : '') + esc(fCorta(m.fecha) + ' · ' + quien(m)) + '</span></span>' +
      '<span class="m' + (dev ? ' verde' : '') + '">' + (dev ? '−' : est ? '≈ ' : '') + din(m.monto, m.moneda) + (est ? '<span class="naranja">por confirmar</span>' : puede ? '<span class="suave">✏️</span>' : '') + '</span></button>';
  }

  function pintar() {
    if (!D) return;
    var r = calc(atras), per = r.periodo, col = color(r), cfg = D.cfg;
    var hdr = '<div class="cab"><div class="ic">🛒</div><h1>' + esc(cfg.nombre) + '</h1><div class="suave chico">Corte ' + fCorta(per.ini) + ' – ' + fCorta(per.fin) +
      (atras ? '' : ' · ' + (per.faltan ? 'faltan <b style="color:var(--texto)">' + per.faltan + ' día' + (per.faltan === 1 ? '' : 's') + '</b>' : '<b style="color:var(--texto)">hoy corta</b>')) + '</div></div>';
    var nav = '<div class="chips" style="justify-content:center"><button class="chip" onclick="K.corte(' + (atras + 1) + ')">‹ Anterior</button>' + (atras ? '<button class="chip" onclick="K.corte(' + (atras - 1) + ')">Siguiente ›</button><button class="chip on" onclick="K.corte(0)">Hoy</button>' : '') + '</div>';
    var html = hdr + (atras ? nav : '') +
      '<div class="caja"><div class="fila"><div><div class="suave chico">Gastado</div><div class="grande">' + din0(r.gastado) + '</div></div>' +
      '<div style="text-align:right"><div class="suave chico">' + (r.quedan < 0 ? 'Se pasaron' : atras ? 'Sobró' : 'Queda') + '</div><div class="grande" style="color:' + col + '">' + din0(Math.abs(r.quedan)) + '</div></div></div>' +
      '<div class="barra"><i style="width:' + Math.min(100, Math.round(r.pct * 100)) + '%;background:' + col + '"></i>' + (atras ? '' : '<b style="left:' + Math.round(per.dia / per.dias * 100) + '%"></b>') + '</div>' +
      '<div class="suave chico">de ' + din0(r.monto) + (r.devoluciones > 0.004 ? ' · devoluciones −' + din0(r.devoluciones) : '') + (r.estimado > 0.004 ? ' · ≈ ' + din0(r.estimado) + ' por confirmar' : '') + '</div>' +
      (!atras && r.quedan > 0 && per.faltan > 0 ? '<div class="tip">Pueden gastar <b>' + din0(r.porDia) + ' por día</b> hasta el ' + per.fin.getDate() + '.</div>' : '') +
      (!atras && r.quedan < 0 ? '<div class="tip" style="background:color-mix(in srgb, var(--rojo) 14%, transparent)">Se pasaron por <b>' + din0(-r.quedan) + '</b> en este corte.</div>' : '') + '</div>';
    if (!atras && D.anotar) html += '<div class="dos"><button class="btn" onclick="K.formAnotar(0,\'Gasto\')">＋ Compra</button><button class="btn sec" onclick="K.formAnotar(0,\'Ingreso\')">↩ Devolución</button></div>';
    if (!atras) {   // v2.19 (#70): compras de los últimos días que el banco cobra en el corte siguiente
      var sig = C.presupuestoCorte(dd(), cfg, new Date(), -1);
      if (sig.n) html += '<div class="caja flot-caja"><div class="fila"><b>↪ ' + sig.n + ' compra' + (sig.n === 1 ? '' : 's') + ' en flotante</b><b>' + din0(sig.gastado) + '</b></div>' +
        '<div class="suave chico">El banco las cobra en el corte siguiente (' + fCorta(sig.periodo.ini) + ' – ' + fCorta(sig.periodo.fin) + '): ya cuentan ahí, no en este.</div>' +
        sig.compras.map(itemMov).join('') + '</div>';
    }
    html += '<div class="sec-t">' + (atras ? 'COMPRAS DE ESE CORTE' : 'COMPRAS DEL CORTE') + ' · ' + r.n + '</div>' +
      '<div class="caja" style="padding:4px 12px">' + (r.compras.length ? r.compras.map(itemMov).join('') : '<div class="suave chico" style="padding:10px 0">Todavía no hay compras en este corte.</div>') + '</div>';
    if (!atras) {
      var hist = C.historialCorte(dd(), cfg, new Date(), 6);
      while (hist.length && !hist[hist.length - 1].n) hist.pop();
      if (hist.length) html += '<div class="sec-t">CORTES ANTERIORES</div><div class="caja" style="padding:4px 12px">' + hist.map(function (x) {
        var pas = x.monto && x.gastado > x.monto + 0.001, c2 = pas ? 'var(--rojo)' : 'var(--verde)';
        return '<button class="mov" onclick="K.corte(' + x.atras + ')"><span class="t"><b>' + fCorta(x.periodo.ini) + ' – ' + fCorta(x.periodo.fin) + '</b><span>' + (pas ? 'Se pasaron ' + din0(x.gastado - x.monto) : 'Sobraron ' + din0(x.monto - x.gastado)) + ' · ' + x.n + ' compra' + (x.n === 1 ? '' : 's') + '</span></span><span class="m" style="color:' + c2 + '">' + din0(x.gastado) + '</span></button>';
      }).join('') + '</div>';
    } else html += nav;
    html += '<div class="vivo" id="vivo">' + (cargando ? 'Actualizando…' : D.cuando ? 'Al día · ' + hace(D.cuando) : '') + '</div>';
    $('app').innerHTML = html;
  }
  function hace(iso) { var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); return s < 60 ? 'hace un momento' : s < 3600 ? 'hace ' + Math.round(s / 60) + ' min' : s < 86400 ? 'hace ' + Math.round(s / 3600) + ' h' : 'hace ' + Math.round(s / 86400) + ' días'; }
  function corte(a) { atras = Math.max(0, a); pintar(); window.scrollTo(0, 0); }
  function movF(f) { return ((D && D.movimientos) || []).filter(function (m) { return m.fila === f; })[0]; }
  function verMov(f) {
    var m = movF(f); if (!m) return;
    abrir('<h2>' + icono(m) + ' ' + esc(nombre(m.comercio) || 'Compra') + '</h2><div class="suave" style="margin-top:4px">' + esc(fCorta(m.fecha) + ' · ' + quien(m)) + '</div>' +
      '<div class="grande" style="margin-top:14px;' + (m.tipo === 'Ingreso' ? 'color:var(--verde)' : '') + '">' + (m.tipo === 'Ingreso' ? '−' : '') + din(m.monto, m.moneda) + '</div>' +
      (porConfirmar(m) ? '<div class="tip">≈ Monto estimado: se confirma solo cuando llegue el cobro del banco.</div>' : '') +
      '<div class="suave chico" style="margin-top:12px">' + (mia(m) ? 'La anotaste vos.' : 'Esta la anotó el correo del banco o la otra persona: no se puede cambiar desde aquí.') + '</div>' +
      '<button class="btn sec" style="margin-top:14px" onclick="K.cerrar()">Cerrar</button>');
  }

  // ---------------- anotar / corregir
  function frecuentes() {
    var c = {}, orden = [];
    ((D && D.movimientos) || []).forEach(function (m) { if (m.tipo !== 'Gasto' || /^IVA/.test(m.comercio || '')) return; var n = nombre(m.comercio); if (!n) return; var k = n.toLowerCase(); if (!c[k]) { c[k] = { n: n, x: 0 }; orden.push(k); } c[k].x++; });
    return orden.map(function (k) { return c[k]; }).sort(function (a, b) { return b.x - a.x; }).slice(0, 6).map(function (x) { return x.n; });
  }
  function formAnotar(fila, tipo) {
    var m = fila ? movF(fila) : null;
    form = { fila: fila || 0, tipo: m ? m.tipo : tipo || 'Gasto' };
    var fr = frecuentes();
    abrir('<h2>' + (m ? '✏️ Corregir' : '＋ Anotar') + '</h2>' +
      '<div class="chips" id="k-tipo">' + [['Gasto', 'Compra'], ['Ingreso', '↩ Devolución']].map(function (t) { return '<button class="chip' + (form.tipo === t[0] ? ' on' : '') + '" data-t="' + t[0] + '" onclick="K.tipo(\'' + t[0] + '\')">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<label class="campo">Monto<input id="k-monto" class="monto" inputmode="decimal" placeholder="₡0" autocomplete="off" value="' + (m ? esc(String(m.monto).replace('.', ',')) : '') + '" oninput="K.vista()"></label>' +
      '<div id="k-vista" class="suave chico" style="margin-top:6px;text-align:center"></div>' +
      '<label class="campo">¿Dónde?<input id="k-com" placeholder="Ej. Automercado" autocomplete="off" value="' + esc(m ? nombre(m.comercio) : '') + '"></label>' +
      (fr.length ? '<div class="chips">' + fr.map(function (n) { return '<button class="chip" onclick="document.getElementById(\'k-com\').value=this.textContent">' + esc(n) + '</button>'; }).join('') + '</div>' : '') +
      '<label class="campo">Fecha<input id="k-fecha" type="date" value="' + (m ? new Date(m.fecha).toISOString().slice(0, 10) : hoyLocal()) + '" max="' + hoyLocal() + '"></label>' +
      '<button class="btn" id="k-ok" style="margin-top:16px" onclick="K.guardarMov()">Guardar</button>' +
      (m ? '<button class="btn peligro" id="k-borrar" style="margin-top:8px" onclick="K.borrar()">Borrar</button>' : '') +
      '<button class="btn sec" style="margin-top:8px" onclick="K.cerrar()">Cancelar</button>' +
      '<div class="suave chico" style="margin-top:10px">Poné el monto exacto: si después llega el correo del banco con el mismo monto, se une sola y no queda repetida.</div>');
    vista();
    setTimeout(function () { var e = $('k-monto'); if (e && !m) e.focus(); }, 150);
  }
  function tipo(t) { form.tipo = t; document.querySelectorAll('#k-tipo .chip').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); }); vista(); }
  function leerMonto() { var v = String(($('k-monto') || {}).value || '').replace(/[₡\s.]/g, '').replace(',', '.'); return Number(v) || 0; }
  function vista() {
    var e = $('k-vista'); if (!e || !D) return;
    var r = calc(0), v = leerMonto(), dev = form.tipo === 'Ingreso', prev = form.fila ? movF(form.fila) : null;
    var base = r.quedan + (prev ? (prev.tipo === 'Ingreso' ? -prev.monto : prev.monto) : 0);
    var q2 = base + (dev ? v : -v);
    e.innerHTML = v ? (dev ? 'Se resta de lo gastado: ' : 'Después de esta: ') + 'quedan <b class="' + (q2 < 0 ? 'rojo' : 'verde') + '">' + din0(q2) + '</b>' : 'Quedan ' + din0(base) + ' en este corte.';
    $('k-monto').style.color = dev ? 'var(--verde)' : '';
  }
  function guardarMov() {
    var monto = leerMonto(); if (!(monto > 0)) return toast('Escribí el monto.');
    var f = ($('k-fecha') || {}).value || hoyLocal(), ahora = new Date();
    var fecha = f === hoyLocal() ? ahora.toISOString() : new Date(f + 'T12:00:00').toISOString();
    var m = { fila: form.fila || null, tipo: form.tipo, monto: monto, comercio: $('k-com').value.trim(), fecha: fecha };
    var b = $('k-ok'); b.disabled = true; b.textContent = 'Guardando…';
    llamar('guardar', [m]).then(function () { cerrar(); toast(m.tipo === 'Ingreso' ? '↩ Devolución anotada' : '✅ Compra anotada'); cargar(true); },
      function (e) { b.disabled = false; b.textContent = 'Guardar'; toast('⚠️ ' + (e.red ? 'Sin conexión: probá de nuevo en un momento.' : e.message), 4000); });
  }
  function borrar() {
    var b = $('k-borrar'); if (!b.dataset.ok) { b.dataset.ok = '1'; b.textContent = 'Tocá otra vez para borrar'; return; }
    b.disabled = true;
    llamar('borrar', [form.fila]).then(function () { cerrar(); toast('Borrada'); cargar(true); }, function (e) { b.disabled = false; toast('⚠️ ' + e.message, 4000); });
  }

  // ---------------- carga
  function cargar(forzar) {
    if (!URL_SRV || !acc.k) return;
    cargando = true; var v = $('vivo'); if (v) v.textContent = 'Actualizando…';
    llamar('ver', [forzar || !D ? '' : D.marca]).then(function (r) {
      cargando = false;
      if (r && r.sinCambios) { D.cuando = new Date().toISOString(); guardar(CL, D); if (!form) pintar(); return; }
      D = r; D.cuando = new Date().toISOString(); guardar(CL, D); if (!form) pintar();
    }, function (e) {
      cargando = false;
      if (!D) { $('app').innerHTML = '<div class="cab"><div class="ic">🛒</div><h1>Súper de la casa</h1></div><div class="caja" style="text-align:center">' + esc(e.red ? 'Sin conexión. Probá de nuevo cuando tengás internet.' : e.message) + '<button class="btn" style="margin-top:12px" onclick="K.cargar(true)">Reintentar</button></div>'; return; }
      var v2 = $('vivo'); if (v2) v2.textContent = e.red ? 'Sin conexión · datos de ' + hace(D.cuando) : '⚠️ ' + e.message;
      if (!e.red) toast('⚠️ ' + e.message, 4000);
    });
  }
  function arrancar() {
    if (!acc.k || !acc.s) { $('app').innerHTML = '<div class="cab"><div class="ic">🛒</div><h1>Súper de la casa</h1></div><div class="caja" style="text-align:center">Abrí esta app con el link que te mandaron.</div>'; return; }
    if (D) pintar();
    cargar(false);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') cargar(false); });
    setInterval(function () { if (document.visibilityState === 'visible' && !form) cargar(false); }, 90000);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('casa-sw.js', { scope: './casa' }).catch(function () { /* sin sw */ });
  }
  arrancar();
  return { cerrar: cerrar, formAnotar: formAnotar, tipo: tipo, vista: vista, guardarMov: guardarMov, borrar: borrar, corte: corte, verMov: verMov, cargar: cargar };
})();
