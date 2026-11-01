// Lista compartida (v2.5): la abre otra persona con el link. Solo ve y toca ESA lista (token propio), nada más de la app.
var L = (function () {
  'use strict';
  var h = new URLSearchParams(location.hash.slice(1));
  var dep = h.get('s') || '', token = h.get('k') || '';
  var URL_SRV = 'https://script.google.com/macros/s/' + encodeURIComponent(dep) + '/exec';
  var CLAVE_LOCAL = 'lc-' + token.slice(0, 10);
  var lista = leer(CLAVE_LOCAL) || null, cola = leer(CLAVE_LOCAL + '-cola') || [], fotos = {}, enviando = false, timer = null;
  var PASILLOS = ['Frutas y verduras', 'Carnes', 'Lácteos y huevos', 'Granos y abarrotes', 'Panadería', 'Congelados', 'Bebidas', 'Limpieza', 'Cuidado personal', 'Bebé', 'Mascotas', 'Farmacia', 'Otros'];
  var IC = { 'Frutas y verduras': '🥑', 'Carnes': '🥩', 'Lácteos y huevos': '🥛', 'Granos y abarrotes': '🍚', 'Panadería': '🍞', 'Congelados': '🧊', 'Bebidas': '🧃', 'Limpieza': '🧻', 'Cuidado personal': '🧴', 'Bebé': '🍼', 'Mascotas': '🐾', 'Farmacia': '💊', 'Otros': '🛒' };

  function leer(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* lleno */ } }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function nombre() { return leer('lc-nombre') || ''; }
  function toast(t) { var e = $('toast'); e.textContent = t; e.classList.add('ver'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('ver'); }, 2600); }
  function llamar(accion, args) {
    return fetch(URL_SRV, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ lista: token, accion: accion, args: args || [] }) })
      .then(function (r) { return r.text(); }, function () { var e = new Error('Sin conexión'); e.red = true; throw e; })
      .then(function (t) { var j; try { j = JSON.parse(t); } catch (e) { throw new Error('Respuesta inesperada'); } if (!j.ok) throw new Error(j.error || 'Error'); return j.resultado; });
  }
  function abrir(html) { $('panel').innerHTML = html; $('velo').classList.add('ver'); pintarFotos(); }
  function cerrar() { $('velo').classList.remove('ver'); $('panel').innerHTML = ''; }
  function hace(iso) { var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); return s < 60 ? 'hace ' + Math.round(s) + ' s' : s < 3600 ? 'hace ' + Math.round(s / 60) + ' min' : 'hace ' + Math.round(s / 3600) + ' h'; }
  function qty(it) { return it.q !== '' && it.q !== null && it.q !== undefined ? String(it.q).replace('.', ',') + ' ' + (it.u || 'u') : ''; }
  function item(id) { return ((lista && lista.items) || []).filter(function (x) { return x.id === id; })[0]; }

  function pedirNombre() {
    $('app').innerHTML = '<h1>🛒 Lista compartida</h1><p class="suave" style="margin-top:6px">Escribí tu nombre para que sepan quién marcó cada cosa.</p>' +
      '<input class="txt" id="nm" placeholder="Tu nombre" autocomplete="given-name"><button class="btn" onclick="L.guardarNombre()">Entrar</button>';
  }
  function guardarNombre() { var n = $('nm').value.trim(); if (!n) return; guardar('lc-nombre', n.slice(0, 30)); arrancar(); }

  function pintar() {
    if (!lista) return;
    var it = lista.items || [], marc = it.filter(function (x) { return x.on; }).length, yo = nombre();
    var html = '<h1>' + esc(lista.icono || '🛒') + ' ' + esc(lista.nombre) + '</h1><div class="suave chico">' + esc(yo) + ' · se actualiza solo' + (cola.length ? ' · ' + cola.length + ' por enviar' : '') + '</div>' +
      '<div class="vivo">' + (lista.cambio ? '● ' + esc(lista.cambio.txt) + ' · ' + hace(lista.cambio.cuando) : '') + '</div>' +
      '<div class="caja" style="padding:12px 14px;margin-top:10px"><b>' + marc + ' de ' + it.length + ' en el carrito</b><div class="barra"><i style="width:' + (it.length ? Math.round(marc / it.length * 100) : 0) + '%"></i></div></div>';
    it.filter(function (x) { return x.consulta && !x.consulta.resp; }).forEach(function (x) {
      var mia = x.consulta.por === yo;
      html += '<div class="consulta"><b>📷 ' + (mia ? 'Preguntaste' : esc(x.consulta.por) + ' pregunta') + ': ¿este sirve?</b><div class="suave chico">' + esc(x.n) + ' · ' + esc(qty(x)) + '</div>' +
        '<div class="dos" style="margin-top:8px"><div><div class="suave chico">EL QUE SE PIDIÓ</div>' + (x.foto ? '<img class="grande" data-foto="' + esc(x.foto) + '" alt="">' : '<div class="grande">sin foto</div>') + '</div><div><div class="suave chico">EL QUE HAY</div>' + (x.consulta.foto ? '<img class="grande" data-foto="' + esc(x.consulta.foto) + '" alt="">' : '<div class="grande">sin foto</div>') + '</div></div>' +
        (x.consulta.msg ? '<div class="suave" style="margin-top:8px">“' + esc(x.consulta.msg) + '”</div>' : '') +
        (mia ? '<div class="suave chico" style="margin-top:8px">⏳ Esperando respuesta…</div>' : '<div class="dos"><button class="btn" onclick="L.responder(\'' + x.id + '\',true)">✓ Sí, llevalo</button><button class="btn sec" onclick="L.responder(\'' + x.id + '\',false)">✗ No, dejalo</button></div>') + '</div>';
    });
    it.filter(function (x) { return x.consulta && x.consulta.resp && x.consulta.por === yo; }).forEach(function (x) {
      html += '<div class="consulta" style="border-color:var(--borde)"><b>' + (x.consulta.resp.si ? '✓ Sí, llevalo' : '✗ No, dejalo') + '</b> <span class="suave chico">· ' + esc(x.consulta.resp.por) + ' sobre ' + esc(x.n) + '</span></div>';
    });
    var g = {}; it.filter(function (x) { return !x.on; }).forEach(function (x) { var p = x.p || 'Otros'; (g[p] = g[p] || []).push(x); });
    PASILLOS.forEach(function (p) { if (g[p]) html += '<div class="sec">' + IC[p] + ' ' + esc(p) + '</div><div class="caja">' + g[p].map(fila).join('') + '</div>'; });
    var en = it.filter(function (x) { return x.on; });
    if (en.length) html += '<div class="sec">✓ En el carrito (' + en.length + ')</div><div class="caja">' + en.map(fila).join('') + '</div>';
    if (lista.editable !== false) html += '<div class="agregar"><input class="txt" id="nuevo" placeholder="＋ Agregar algo…" onkeydown="if(event.key===\'Enter\')L.agregar()"><button class="btn" onclick="L.agregar()">Agregar</button></div>';
    var foco = document.activeElement && document.activeElement.id === 'nuevo', valor = foco ? $('nuevo').value : '';
    $('app').innerHTML = html;
    if (foco) { var n = $('nuevo'); n.value = valor; n.focus(); }
    pintarFotos();
  }
  function fila(x) {
    return '<div class="it' + (x.on ? ' on' : '') + '"><input type="checkbox"' + (x.on ? ' checked' : '') + ' onchange="L.marcar(\'' + x.id + '\',this.checked)" aria-label="' + esc(x.n) + '">' +
      (x.foto ? '<button class="foto" onclick="L.ver(\'' + x.id + '\')"><img data-foto="' + esc(x.foto) + '" alt=""></button>' : '') +
      '<button class="nom" onclick="L.ver(\'' + x.id + '\')"><b>' + esc(x.n) + '</b><span class="suave chico">' + [x.nota ? esc(x.nota) : '', x.estado === 'nohay' ? '<span style="color:var(--rojo)">✗ no hay</span>' : '', x.on && x.por ? esc(x.por) + ' lo marcó' : ''].filter(String).join(' · ') + '</span></button>' +
      '<span class="q">' + esc(qty(x)) + '</span></div>';
  }
  function pintarFotos() {
    Array.prototype.forEach.call(document.querySelectorAll('img[data-foto]'), function (i) {
      var f = i.getAttribute('data-foto');
      if (fotos[f]) { i.src = fotos[f]; return; }
      if (fotos[f] === false) return;
      fotos[f] = false;
      llamar('foto', [f]).then(function (d) { fotos[f] = d; pintarFotos(); }, function () { delete fotos[f]; });
    });
  }
  function ver(id) {
    var x = item(id); if (!x) return;
    abrir('<div style="display:flex;justify-content:space-between;gap:10px"><h1>' + esc(x.n) + '</h1><b>' + esc(qty(x)) + '</b></div>' + (x.nota ? '<div class="suave">“' + esc(x.nota) + '”</div>' : '') +
      (x.foto ? '<img class="grande" data-foto="' + esc(x.foto) + '" alt="">' : '') +
      '<button class="btn" onclick="L.cerrar();L.marcar(\'' + id + '\',true)">✓ Este es, va al carrito</button>' +
      '<button class="btn ac" onclick="L.preguntar(\'' + id + '\')">📷 No está igual · ¿este sirve?</button>' +
      '<button class="btn sec" onclick="L.cerrar();L.op({t:\'nohay\',item:\'' + id + '\'})">✗ No hay</button><button class="btn sec" onclick="L.cerrar()">Cerrar</button>');
  }
  function aplicar(op) {
    var x = op.item ? item(op.item) : null, yo = nombre();
    if (op.t === 'marcar' && x) { x.on = !!op.on; x.por = op.on ? yo : ''; if (op.on) x.estado = ''; }
    else if (op.t === 'nohay' && x) { x.estado = 'nohay'; x.on = false; }
    else if (op.t === 'agregar' && op.datos) lista.items.push(Object.assign({ id: 'tmp' + Date.now(), on: false }, op.datos));
    else if (op.t === 'consulta' && x) x.consulta = { foto: op.foto, msg: op.msg, por: yo, cuando: new Date().toISOString(), resp: null };
    else if (op.t === 'responder' && x && x.consulta) { x.consulta.resp = { si: op.si, por: yo }; if (op.si) x.on = true; }
  }
  function op(o) { aplicar(o); cola.push(o); guardar(CLAVE_LOCAL + '-cola', cola); guardar(CLAVE_LOCAL, lista); pintar(); enviar(); }
  function enviar() {
    if (enviando || !cola.length) return;
    enviando = true;
    llamar('cambiar', [cola[0], nombre()]).then(function (r) {
      cola.shift(); guardar(CLAVE_LOCAL + '-cola', cola); enviando = false;
      lista = r; cola.forEach(aplicar); guardar(CLAVE_LOCAL, lista); pintar();
      if (cola.length) enviar();
    }, function (e) {
      enviando = false;
      if (!e.red) { cola.shift(); guardar(CLAVE_LOCAL + '-cola', cola); toast('⚠️ ' + e.message); refrescar(true); }
      else pintar();
    });
  }
  function refrescar(forzar) {
    llamar('ver', [forzar || !lista ? 0 : lista.v]).then(function (r) {
      if (r.sinCambios) return;
      var antes = lista && lista.cambio;
      lista = r; cola.forEach(aplicar); guardar(CLAVE_LOCAL, lista);
      if (r.cambio && antes && r.cambio.cuando !== antes.cuando && r.cambio.txt.indexOf(nombre() + ' ') !== 0) toast('● ' + r.cambio.txt);
      if (!$('velo').classList.contains('ver')) pintar();
    }, function (e) {
      if (!e.red) $('app').innerHTML = '<h1>🛒 Lista compartida</h1><p class="suave" style="margin-top:10px">' + esc(e.message) + '</p>';
    });
    enviar();
  }
  function ciclo() { clearTimeout(timer); timer = setTimeout(function () { if (!document.hidden) refrescar(false); ciclo(); }, 4000); }
  function marcar(id, on) { if (navigator.vibrate && on) { try { navigator.vibrate(15); } catch (e) { /* nada */ } } op({ t: 'marcar', item: id, on: !!on }); }
  function agregar() { var n = $('nuevo').value.trim(); if (!n) return; op({ t: 'agregar', datos: { n: n.charAt(0).toUpperCase() + n.slice(1), q: '', u: '', p: 'Otros' } }); $('nuevo').value = ''; }
  function responder(id, si) { op({ t: 'responder', item: id, si: !!si }); }
  function achicar(f) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(f), img = new Image();
      img.onload = function () {
        var lado = 520, q = 0.72, d, n = 0;
        do { var e = Math.min(1, lado / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * e); c.height = Math.round(img.height * e); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); d = c.toDataURL('image/jpeg', q); lado = Math.round(lado * 0.85); q = Math.max(0.45, q - 0.07); n++; } while (d.length > 45000 && n < 8);
        URL.revokeObjectURL(url); d.length > 47000 ? mal(new Error('Foto muy grande')) : ok(d);
      };
      img.onerror = function () { mal(new Error('No se pudo leer la foto')); };
      img.src = url;
    });
  }
  var fotoTmp = null;
  function preguntar(id) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.setAttribute('capture', 'environment');
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      achicar(f).then(function (d) {
        fotoTmp = d;
        abrir('<h1>📷 ¿Este sirve?</h1><img class="grande" src="' + d + '" alt=""><input class="txt" id="msg" placeholder="Mensaje corto (opcional)"><button class="btn" id="env" onclick="L.enviarPregunta(\'' + id + '\')">Preguntar</button><button class="btn sec" onclick="L.cerrar()">Cancelar</button>');
      }, function (e) { toast('⚠️ ' + e.message); });
    };
    inp.click();
  }
  function enviarPregunta(id) {
    var b = $('env'); b.disabled = true; b.textContent = 'Enviando…';
    llamar('subirFoto', [fotoTmp]).then(function (fid) { fotos[fid] = fotoTmp; var m = $('msg').value; cerrar(); op({ t: 'consulta', item: id, foto: fid, msg: m }); toast('📷 Pregunta enviada'); },
      function (e) { b.disabled = false; b.textContent = 'Preguntar'; toast('⚠️ ' + e.message); });
  }
  function arrancar() {
    if (!dep || !token) { $('app').innerHTML = '<h1>Link incompleto</h1><p class="suave">Pedí que te lo envíen de nuevo.</p>'; return; }
    if (!nombre()) return pedirNombre();
    if (lista) pintar();
    refrescar(true); ciclo();
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden && nombre()) refrescar(false); });
  window.addEventListener('online', function () { enviar(); });
  arrancar();
  return { guardarNombre: guardarNombre, marcar: marcar, ver: ver, cerrar: cerrar, op: op, agregar: agregar, responder: responder, preguntar: preguntar, enviarPregunta: enviarPregunta };
})();
