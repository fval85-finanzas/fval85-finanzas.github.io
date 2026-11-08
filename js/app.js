var App = (function () {
  'use strict';
  var D = null;                       // datos de la hoja
  var hoy = new Date();
  var mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  var pantalla = 'inicio';
  var filtro = { q: '', chip: 'todos', cuenta: '', moneda: '', tipo: '', buscando: false, per: '', desde: null, hasta: null };
  var verTodoHistorial = false;
  var C = Calc;
  var token = guardado('mf-ses', null, sessionStorage);
  var pinActivo = false;
  var pinLargo = Number(guardado('mf-pinlen', '0')) || null;   // cuántos números tiene el PIN
  var AJ = null;                      // ajustes del servidor
  var ocultoDesde = null;
  var MINUTOS_BLOQUEO = 5;
  var VERSION_WEB = '2.10.10';

  function guardado(clave, def, donde) { try { var v = (donde || localStorage).getItem(clave); return v === null ? def : v; } catch (e) { return def; } }
  function guardar(clave, v, donde) { try { if (v === null) (donde || localStorage).removeItem(clave); else (donde || localStorage).setItem(clave, v); } catch (e) {} }

  // ------------------------------------------------------------ íconos
  var I = {
    inicio: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    tarjeta: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    sobre: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 7l10 6 10-6"/>',
    casa: '<path d="M3 21h18M5 21V10l7-5 7 5v11M10 21v-5h4v5"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    atras: '<path d="M15 6l-6 6 6 6"/>',
    adelante: '<path d="M9 6l6 6-6 6"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    alerta: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    bolsa: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    sube: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    correo: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 6l10 7 10-7"/>',
    recargar: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    flechas: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    candado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    campana: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    hoja: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
    huella: '<path d="M7.5 4.2A9 9 0 0 1 20 10M4 8.5A9 9 0 0 0 3.5 13M12 6a6 6 0 0 1 6 6c0 2-.3 4-1 6M6 12a6 6 0 0 1 2-4.5M9 12a3 3 0 0 1 6 0c0 3-.6 5.6-1.7 8M12 12c0 3.5-.8 6.3-2.4 8.6M6.2 15.5c-.3 1.6-.8 3-1.6 4.2"/>',
    avion: '<path d="M10.5 21l1.5-1v-5l8 3v-2l-8-5V5.5a1.5 1.5 0 0 0-3 0V11l-8 5v2l8-3v5l1.5 1z"/>',
    lapiz: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
    ojoNo: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    cuadros: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    guardar: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'
  };
  function ico(n, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + I[n] + '</svg>';
  }
  var LOGO = '<svg aria-hidden="true" viewBox="0 0 512 512"><rect width="512" height="512" rx="116" fill="#121417"/><path d="M120 168h244a28 28 0 0 1 28 28v28" fill="none" stroke="#B9871A" stroke-width="24" stroke-linecap="round"/><rect x="104" y="196" width="304" height="196" rx="34" fill="#F5B82E"/><rect x="300" y="254" width="128" height="80" rx="26" fill="#121417"/><circle cx="342" cy="294" r="16" fill="#F5B82E"/><path d="M196 252a42 42 0 1 0 0 84" fill="none" stroke="#121417" stroke-width="16" stroke-linecap="round"/><path d="M180 232l-14 124M202 232l-14 124" stroke="#121417" stroke-width="9" stroke-linecap="round"/></svg>';

  // ------------------------------------------------------------ utilidades
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  var MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function nombreMes(d) { var t = MESES[d.getMonth()] + ' ' + d.getFullYear(); return t.charAt(0).toUpperCase() + t.slice(1); }
  function fechaCorta(iso) { if (!iso) return '—'; var d = new Date(iso); return d.getDate() + ' ' + MESES_C[d.getMonth()] + ' ' + d.getFullYear(); }
  function hora(iso) { var d = new Date(iso); return d.getHours() || d.getMinutes() ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : ''; }
  function din(n, m, dec) { return '<span class="m">' + (guardado('mf-privado', 'no') === 'si' ? (m === 'USD' ? '$' : '₡') + '******' : C.dinero(n, m, dec)) + '</span>'; }
  var txt = C.dinero;   // versión sin HTML (para textos y atributos)
  function barra(p, alerta) { var w = Math.max(0, Math.min(100, (p || 0) * 100)); return '<div class="barra' + (alerta ? ' alerta' : '') + '"><i style="width:' + w.toFixed(1) + '%"></i></div>'; }
  function toast(t, ms) { var e = $('toast'); e.textContent = t; e.classList.add('ver'); clearTimeout(toast._t); toast._t = setTimeout(function () { e.classList.remove('ver'); }, ms || 3200); }
  function localInput(iso, conHora) {
    var d = iso ? new Date(iso) : new Date();
    var s = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return conHora ? s + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : s;
  }
  function desdeInput(v, conHora) { if (!v) return null; var d = conHora ? new Date(v) : new Date(v + 'T12:00'); return isNaN(d) ? null : d.toISOString(); }
  function cuentaPorNombre(n) { return D.cuentas.filter(function (c) { return c.nombre === n; })[0]; }
  function etiquetaCuenta(n) { if (C.esFamilia({ cuenta: n })) { var fx = infoFamilia(n); return fx.persona + ' · ' + fx.nombre + ' ••' + fx.u4; } var c = cuentaPorNombre(n); return c && c.ultimos4 ? n + ' ••' + c.ultimos4 : n; }
  function opciones(lista, sel, vacio) {
    return (vacio !== undefined ? '<option value="">' + esc(vacio) + '</option>' : '') + lista.map(function (v) {
      return '<option' + (v === sel ? ' selected' : '') + ' value="' + esc(v) + '">' + esc(v) + '</option>';
    }).join('');
  }

  // ------------------------------------------------------------ servidor
  // La app habla con Apps Script (doPost) igual que Registro de Cajuelas:
  // POST como texto plano para evitar la consulta previa (CORS) que Apps Script no responde.
  function conexion() { return { url: guardado('mf-url', ''), clave: guardado('mf-clave', '') }; }

  // ---- aviso visible mientras se habla con Google (en cualquier acción)
  var enCurso = 0, avisoTimer = null;
  var TEXTO_ACCION = { obtenerDatos: 'Actualizando…', revisarCorreosAhora: 'Revisando correos…', verificarPIN: 'Verificando…', entrarConHuella: 'Entrando…', obtenerAjustes: 'Actualizando…' };
  function trabajando(accion, on) {
    if (accion === 'ping' || accion === 'estadoAcceso') return;
    enCurso = Math.max(0, enCurso + (on ? 1 : -1));
    var e = null;   // v1.9: sin avisos ni barras; el botón muestra su circulito cuando hace falta
    if (on) {
      if (e) e.textContent = TEXTO_ACCION[accion] || 'Guardando…';
      clearTimeout(avisoTimer);
      avisoTimer = setTimeout(function () { if (enCurso && e) e.classList.add('ver'); }, 250);
    } else if (!enCurso) {
      clearTimeout(avisoTimer);
      if (e) e.classList.remove('ver');
    }
  }
  function llamar(accion, args, conex, id) {
    trabajando(accion, true);
    return llamarDirecto(accion, args, conex, id).then(function (x) { trabajando(accion, false); return x; }, function (e) { trabajando(accion, false); throw e; });
  }
  function llamarDirecto(accion, args, conex, id) {
    var c = conex || conexion();
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 60000);
    return fetch(c.url, {
      method: 'POST', redirect: 'follow', signal: ctl ? ctl.signal : undefined,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave: c.clave, sesion: token, accion: accion, args: args || [], id: id || undefined })
    }).then(function (r) { return r.text(); }, function (e) {
      clearTimeout(t);
      var err = new Error(e && e.name === 'AbortError' ? 'Google tardó demasiado en responder. Intentá de nuevo.' : 'Sin conexión con Google. Revisá tu internet y la URL /exec.');
      err.red = true;
      throw err;
    }).then(function (texto) {
      clearTimeout(t);
      var j;
      try { j = JSON.parse(texto); } catch (e) { throw new Error('Respuesta inesperada de Google. Revisá la URL /exec y que la implementación sea para «Cualquier persona».'); }
      if (!j.ok) throw new Error(j.error || 'Error desconocido');
      return j.resultado;
    });
  }

  /** Botón "ocupado": círculo girando y texto mientras habla con Google (no se puede tocar dos veces). */
  function ocupar(b) {
    if (b && b.classList.contains('opcion') && b.closest('#p-ajustes')) { if (b.classList.contains('trab')) return; b.classList.remove('listo-ok', 'listo-mal'); b.classList.add('trab', 'ocupado'); b.disabled = true; return; }   // v2.5: aro alrededor del ícono
    if (!b || b.classList.contains('ocupado')) return;
    b.disabled = true; b.classList.add('ocupado');
    b.dataset.html = b.innerHTML;
    var grande = b.classList.contains('btn') && !b.classList.contains('chico');
    b.innerHTML = '<span class="giro"></span>' + (grande ? 'Guardando…' : '');
  }
  function liberar(b, bien) {
    if (b && b.classList.contains('opcion') && b.closest('#p-ajustes')) { b.classList.remove('trab', 'ocupado'); b.disabled = false; b.classList.add(bien ? 'listo-ok' : 'listo-mal'); setTimeout(function () { b.classList.remove('listo-ok', 'listo-mal'); }, 1800); return; }
    if (!b || !b.classList.contains('ocupado')) return;
    b.classList.remove('ocupado'); b.disabled = false;
    if (b.dataset.html !== undefined) b.innerHTML = b.dataset.html;
    if (bien) { b.classList.add('hecho'); setTimeout(function () { b.classList.remove('hecho'); }, 900); }
  }
  // ------------------------------------------------------------ LOCAL PRIMERO (v1.9)
  // Lo de todos los días se aplica al instante en el teléfono y se manda a Google por detrás, en orden y con reintentos.
  var cola = leerJSONSeguro('mf-cola') || [];
  var envios = 0, enviando = false, ultimoErrorCola = guardado('mf-cola-error', '');
  function movF(f) { return D.movimientos.filter(function (x) { return x.fila === f; })[0]; }
  var APLICAR = {
    guardarSobresMov: function (args) { D.sobresMov = (D.sobresMov || []).concat(args[0].map(function (x) { return Object.assign({ fila: 0 }, x); })); },
    eliminarGrupoSobres: function (args) { D.sobresMov = (D.sobresMov || []).filter(function (x) { return x.grupo !== args[0]; }); },
    guardarReglaSobre: function () { /* solo afecta correos futuros */ },
    guardarPreferencias: function (args) { if (D && D.ajustes) D.ajustes.prefs = Object.assign({}, D.ajustes.prefs || {}, args[0]); if (AJ && AJ !== D.ajustes) AJ.prefs = Object.assign({}, AJ.prefs || {}, args[0]); },
    guardarReparto: function (args) {
      D.sobres.forEach(function (s) {
        var x = (args[0] || []).filter(function (y) { return y.nombre === s.nombre; })[0];
        if (x && !s.asignadoAuto) s.asignado = x.monto;
        s.ajuste = s.nombre === args[1];
      });
    },
    guardarMovimiento: function (args, it) {
      var m = args[0];
      var datos = { fecha: m.fecha, comercio: m.comercio, lugar: m.lugar, monto: m.monto, moneda: m.moneda, tipo: m.tipo, cuenta: m.cuenta,
        categoria: m.categoria, sobre: m.sobre, origen: m.origen, autorizacion: m.autorizacion, nota: m.nota };
      if (m.viaje !== undefined && m.viaje !== null) datos.viaje = m.viaje;
      if (m.fila) { var o = movF(m.fila); if (o) Object.assign(o, datos); (D.sobresMov || []).forEach(function (x) { if (x.movimiento === m.fila && m.fecha) x.fecha = m.fecha; }); }
      else if (!movF(it.temp)) D.movimientos.push(Object.assign({ fila: it.temp, subcuenta: '', viaje: '' }, datos));
    },
    marcarMovimiento: function (args) { var o = movF(args[0]); if (o) o[{ 'Subcuenta': 'subcuenta', 'Viaje': 'viaje', 'Para otra persona': 'para', 'Cobro': 'cobro', 'Nota': 'nota', 'Desde': 'desde' }[args[1]] || 'x'] = args[2]; },
    actualizarSaldoCuenta: function (args) { var c = D.cuentas.filter(function (x) { return x.fila === args[0]; })[0]; if (c) { c.saldoCRC = args[1]; c.saldoUSD = args[2]; c.fechaSaldo = args[3]; } },
    guardarAbonoTC: function (args, it) {
      var x = args[0];
      var t = D.tasaCero.filter(function (z) { return z.descripcion === x.compra && (!x.tarjeta || z.tarjeta === x.tarjeta); })[0];
      if (!t) return;
      t.abonos = t.abonos || [];
      var datos = { fecha: x.fecha, compra: x.compra, tarjeta: x.tarjeta, monto: x.monto, moneda: x.moneda, origen: x.origen, gasto: x.gasto !== false, movimiento: x.movimiento || null, nota: x.nota };
      if (x.fila) { var ab = t.abonos.filter(function (z) { return z.fila === x.fila; })[0]; if (ab) Object.assign(ab, datos); }
      else if (!t.abonos.some(function (z) { return z.fila === it.temp; })) t.abonos.push(Object.assign({ fila: it.temp }, datos));
    }
  };
  function guardarCola() { guardar('mf-cola', JSON.stringify(cola)); actualizarBadges(); }
  /** Aplica en el teléfono y deja en la cola para Google. desc = lo que se ve en "Por enviar". */
  function encolar(accion, args, desc) {
    var it = { id: grupoNuevo(), accion: accion, args: args, desc: desc || '', creado: Date.now(), temp: -(Date.now() % 1e9) - Math.floor(Math.random() * 1000) };
    cola.push(it); guardarCola(); sbMemo = null;
    if (APLICAR[accion] && D) { try { APLICAR[accion](args, it); } catch (e) { /* nada */ } guardarCache(JSON.stringify(D)); }
    setTimeout(enviarCola, 0);
    return it;
  }
  function reaplicarCola() { cola.forEach(function (it) { if (APLICAR[it.accion]) { try { APLICAR[it.accion](it.args, it); } catch (e) { /* nada */ } } }); }
  var fallosRed = 0, siguienteIntento = 0;
  function enviarCola(forzar) {
    if (enviando || !cola.length || !conexion().url) return;
    if (forzar !== true && Date.now() < siguienteIntento) return;   // v2.3.1: si falla la red, espera cada vez más (hasta 10 min)
    if (navigator.onLine === false) { ultimoErrorCola = 'Sin internet.'; actualizarBadges(); return; }
    enviando = true;
    var it = cola[0];
    llamar(it.accion, it.args, null, it.id).then(function () {
      cola.shift(); guardarCola(); enviando = false; envios++; fallosRed = 0; siguienteIntento = 0;
      ultimoErrorCola = ''; guardar('mf-cola-error', null);
      if (cola.length) enviarCola(); else cargar();
    }, function (e) {
      enviando = false;
      var msg = e && e.message ? e.message : String(e);
      if (e && e.red) { fallosRed++; siguienteIntento = Date.now() + Math.min(600000, 30000 * Math.pow(2, fallosRed - 1)); ultimoErrorCola = msg; guardar('mf-cola-error', msg); actualizarBadges(); return; }
      if (msg.indexOf('PIN_REQUERIDO') >= 0) { token = null; guardar('mf-ses', null, sessionStorage); bloquear(); return; }
      if (msg.indexOf('CLAVE_INVALIDA') >= 0) { mostrarConexion('La clave ya no es válida. Escribí la clave actual.'); return; }
      // Google lo rechazó: se quita de la cola y la recarga lo deshace en la pantalla
      cola.shift(); guardarCola(); envios++;
      toast('⚠️ No se guardó «' + it.desc + '»: ' + msg.replace(/ Recarg.*$/, '') + ' Se deshizo.', 8000);
      if (cola.length) enviarCola(); else cargar();
    });
  }
  window.addEventListener('online', function () { enviarCola(true); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') enviarCola(); });
  setInterval(enviarCola, 30000);
  function badgeCola() { return '<span class="badge-cola"' + (cola.length ? '' : ' hidden') + ' onclick="event.stopPropagation();App.formCola()">' + cola.length + '</span>'; }
  function actualizarBadges() {
    document.querySelectorAll('.badge-cola').forEach(function (b) { b.textContent = cola.length; b.hidden = !cola.length; });
    var lista = $('cola-lista'); if (lista && $('velo').classList.contains('abierto')) formCola();
  }
  function hace(t) { var s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'hace un momento' : s < 3600 ? 'hace ' + Math.round(s / 60) + ' min' : 'hace ' + Math.round(s / 3600) + ' h'; }
  function formCola() {
    abrir('<h2>' + (cola.length ? 'Por enviar a Google (' + cola.length + ')' : 'Todo está en Google ✓') + '</h2>' +
      '<div class="suave chico" id="cola-lista">' + (cola.length ? 'Ya están aplicados en el teléfono. Se envían solos cuando haya internet.' : 'No queda nada pendiente.') + '</div>' +
      (cola.length ? '<div class="caja sinpad" style="margin-top:10px;background:var(--fondo)">' + cola.map(function (it) {
        return '<div class="item" style="cursor:default"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(it.desc || it.accion) + '</span><span class="det" style="display:block">' + hace(it.creado) + '</span></span>' +
          '<button class="chip" onclick="App.quitarDeCola(\'' + it.id + '\', this)">Quitar</button></div>';
      }).join('') + '</div>' + (ultimoErrorCola ? '<div class="suave chico" style="margin-top:8px">⚠️ Último intento: ' + esc(ultimoErrorCola) + '</div>' : '') : '') +
      '<div class="acciones">' + (cola.length ? '<button class="btn" onclick="App.reintentarCola()">Reintentar ahora</button>' : '') + '<button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }
  /** Cierra el formulario y muestra el resultado al instante (lo de la cola ya está aplicado). */
  function hecho(msg) { cerrar(); toast(msg); if (D) pintar(); }

  function srv(fn, args, ok, boton, mal) {
    ocupar(boton);
    llamar(fn, args).then(function (x) { liberar(boton, true); ok(x); }, function (e) {
      liberar(boton, false);
      if (mal) mal(e);
      var msg = e && e.message ? e.message : String(e);
      if (msg.indexOf('PIN_REQUERIDO') >= 0) { token = null; guardar('mf-ses', null, sessionStorage); bloquear(); return; }
      if (msg.indexOf('CLAVE_INVALIDA') >= 0) { mostrarConexion('La clave ya no es válida. Escribí la clave actual.'); return; }
      $('cargando').style.display = 'none';
      toast('⚠️ ' + msg, 7000);
    });
  }
  // ---- datos guardados en el teléfono: la app abre al instante y se actualiza por detrás
  function leerJSONSeguro(k) { try { var t = localStorage.getItem(k); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  function leerCache() { try { var t = localStorage.getItem('mf-cache'); return t ? limpiarD(JSON.parse(t)) : null; } catch (e) { return null; } }
  function limpiarD(d) {
    if (d && d.sobres) d.sobres = d.sobres.filter(C.esSobreReal);
    if (d && d.cuentas) {
      d.cuentas = d.cuentas.filter(C.esCuentaReal);
      // v2.5.7: "Ahorros BCR colones" y "Ahorros BCR Colones" son la misma cuenta (mayúsculas, tildes, espacios)
      var canon = {}; d.cuentas.forEach(function (c) { canon[C.normNom(c.nombre)] = c.nombre; });
      (d.movimientos || []).forEach(function (m) { var k = m.cuenta && canon[C.normNom(m.cuenta)]; if (k) m.cuenta = k; });
      (d.tasaCero || []).forEach(function (x) { var k = x.tarjeta && canon[C.normNom(x.tarjeta)]; if (k) x.tarjeta = k; });
    }
    return d;
  }   // v2.4: sin filas de totales/notas
  function guardarCache(json) { try { localStorage.setItem('mf-cache', json); } catch (e) { /* sin espacio: no pasa nada */ } }
  var pintarPendiente = false;
  function sincronizando() { /* v1.9: la descarga es silenciosa */ }
  function escribiendo() { var e = document.activeElement; return e && /INPUT|SELECT|TEXTAREA/.test(e.tagName) && !$('panel').contains(e); }
  function cargar(cb) {
    sincronizando(true);
    var n0 = envios;
    srv('obtenerDatos', [], function (json) {
      if (n0 !== envios && D) { if (cb) cb(); return; }   // llegó algo a Google mientras tanto: viene otra recarga más fresca
      D = limpiarD(JSON.parse(json));
      hoy = new Date(D.hoy);
      reaplicarCola();   // lo que todavía no llegó a Google se sigue viendo
      guardarCache(JSON.stringify(D));
      if (D.ajustes) { AJ = D.ajustes; pinActivo = AJ.pinActivo; guardar('mf-aj', JSON.stringify(AJ)); }
      sincronizando(false);
      $('cargando').style.display = 'none';
      if (escribiendo()) pintarPendiente = true; else pintar();   // no borrar lo que la persona está escribiendo
      if (cb) cb();
      if (cola.length) enviarCola();
      if (/compartido=1/.test(location.search)) setTimeout(revisarCompartido, 300);
      intentarRepartoSalario(); finPlanPendiente(); migrarEspejo(); autoIVA(); autoPlanEsp(); autoSacado();
      var irA = (location.search.match(/[?&]ir=([a-z]+)/) || [])[1];   // v2.5: al tocar un aviso
      if (irA && !cargar.irHecho) { cargar.irHecho = true; history.replaceState(null, '', location.pathname); ir(irA); }
      if (!cargar.verRevisada) { cargar.verRevisada = true; revisarVersion(); cfgSW(); }
    }, null, function () { sincronizando(false); });
  }

  // ------------------------------------------------------------ navegación
  var PRINCIPALES = ['inicio', 'movimientos', 'tarjetas', 'ajustes'];
  var NAV = [['inicio', 'Inicio', 'inicio'], ['movimientos', 'Movimientos', 'lista'], ['tarjetas', 'Tarjetas', 'tarjeta'], ['ajustes', 'Ajustes', 'ajustes']];
  /** v2.0: el + amarillo va arriba a la derecha en las pantallas principales */
  function botonMas() { return '<button class="btn-mas" aria-label="Registrar" onclick="App.formRapido()">' + ico('mas') + '</button>'; }
  var origen = 'inicio';
  // ---- botón "atrás" del teléfono: cierra el formulario, vuelve a la pantalla anterior o (en Inicio) avisa antes de salir
  var pila = [], armado = false;
  function armar() { if (armado) return; try { history.pushState({ mf: 1 }, ''); armado = true; } catch (e) { /* nada */ } }
  window.addEventListener('popstate', function () {
    armado = false;
    if ($('bloqueo').classList.contains('ver') || $('conexion').classList.contains('ver')) return armar();
    if ($('velo').classList.contains('abierto')) { cerrar(); return armar(); }
    if (pila.length) { irDirecto(pila.pop()); return armar(); }
    if (pantalla !== 'inicio') { irDirecto('inicio'); return armar(); }
    toast('Tocá atrás otra vez para salir', 2400);
    setTimeout(armar, 2500);
  });
  function ir(p, chip) {
    if (p !== pantalla) {
      if (PRINCIPALES.indexOf(p) >= 0) pila = p === 'inicio' ? [] : ['inicio'];
      else if (pila[pila.length - 1] === p) pila.pop();
      else { pila.push(pantalla); if (pila.length > 30) pila.shift(); }
    }
    armar();
    irDirecto(p, chip);
  }
  function irDirecto(p, chip) {
    if (p !== 'lista') pantallaEncendida(false);
    if (p !== 'movimientos') selMov = null;
    if (editIni && p !== 'inicio') { guardar('mf-inicio', JSON.stringify(editIni)); editIni = null; }   // v2.5: salir de editar Inicio guarda
    if (PRINCIPALES.indexOf(pantalla) >= 0 && PRINCIPALES.indexOf(p) < 0) origen = pantalla;
    if (p === 'calculadora') { calcVista = 'datos'; if (pantalla !== 'calculadora' && !calcConservar) limpiarCalc(); calcConservar = false; }
    if (p !== pantalla) { plegAbierto = {}; if (p === 'tarjetas') tarjetaAbierta = null; }
    pantalla = p;
    if (chip) filtro.chip = chip;
    pintarPendiente = false;
    window.scrollTo(0, 0);
    pintar();
  }
  function volver() { if (pila.length) irDirecto(pila.pop()); else irDirecto(PRINCIPALES.indexOf(origen) >= 0 ? origen : 'inicio'); }
  function cambiarMes(delta) { mes = new Date(mes.getFullYear(), mes.getMonth() + delta, 1); pintar(); }
  function botonAtras(accion) {
    return '<button class="btn-icono" aria-label="Volver" onclick="' + (accion || 'App.volver()') + '">' + ico('atras') + '</button>';
  }
  function cabMes(titulo, extra) {
    var sub = PRINCIPALES.indexOf(pantalla) < 0;
    return '<div class="cab"><div class="atras-cab">' + (sub ? botonAtras() : '') + '<div><div class="sobretitulo">' + nombreMes(mes) + '</div><h1 class="titulo">' + titulo + '</h1></div></div>' +
      '<div class="mesnav">' + (extra || '') +
      '<button class="btn-icono" aria-label="Mes anterior" onclick="App.cambiarMes(-1)">' + ico('atras') + '</button>' +
      '<button class="btn-icono" aria-label="Mes siguiente" onclick="App.cambiarMes(1)">' + ico('adelante') + '</button>' + (sub ? '' : botonMas()) + '</div></div>';
  }
  function cabSimple(titulo, sub, accion, derecha) {
    return '<div class="cab"><div class="atras-cab">' + botonAtras(accion) + '<div>' + (sub ? '<div class="sobretitulo">' + sub + '</div>' : '') + '<h1 class="titulo">' + titulo + '</h1></div></div>' + (derecha || '') + '</div>';
  }
  /** v2.1: botón de agregar con nombre, arriba a la derecha */
  function botonNuevo(texto, accion) { return '<button class="btn-nuevo" onclick="' + accion + '">＋ ' + texto + '</button>'; }
  /** v2.1: sección que se abre y se cierra (siempre cerrada al entrar a la pantalla) */
  var plegAbierto = {};
  function plegable(id, titulo, derecha, cuerpo, clase) {
    return '<details class="pleg' + (clase ? ' ' + clase : '') + '"' + (plegAbierto[id] ? ' open' : '') + ' ontoggle="App.pleg(\'' + id + '\',this.open)"><summary><span class="pl-t">' + titulo + '</span>' +
      '<span class="pl-d">' + (derecha || '') + '</span><span class="flecha">›</span></summary><div class="pl-c">' + cuerpo + '</div></details>';
  }

  function pintar() {
    if (!D) return;
    sbMemo = null;
    var res = C.resumenMes(D, mes);
    var sob = C.sobres(D, mes, res);
    var activa = PRINCIPALES.indexOf(pantalla) >= 0 ? pantalla : origen;
    $('tabs').innerHTML = NAV.map(function (t) {
      return '<button class="' + (t[0] === activa ? 'on' : '') + '" onclick="App.ir(\'' + t[0] + '\')"' + (t[0] === activa ? ' aria-current="page"' : '') + '><span class="tab-ic">' + ico(t[2]) +
        (t[0] === 'ajustes' ? badgeCola() : '') + '</span>' + t[1] + '</button>';
    }).join('');
    document.querySelectorAll('.pantalla').forEach(function (s) { s.classList.toggle('activa', s.id === 'p-' + pantalla); });
    ({
      inicio: pInicio, movimientos: pMovimientos, tarjetas: pTarjetas, sobres: pSobres, prestamo: pPrestamo, ajustes: pAjustes,
      mas: pMas, calculadora: pCalc, tasacero: pTasaCero, tcdetalle: pTCDetalle, porasignar: pPorAsignar, reparto: pReparto, limpiar: pLimpiar, fondos: pFondos, medeben: pMeDeben, super: pSuper, lista: pLista, plan: pPlan, sobre: pSobre, ctamov: pCtaMov, revisar: pRevisar, aldia: pAlDia, viajes: pViajes, viaje: pViaje, reportes: pReportes, patrimonio: pPatrimonio
    })[pantalla](res, sob);
    formatearMontos();
    montarCalc(); if (CALC.abierta) pintarCalc();
  }

  // ------------------------------------------------------------ INICIO
  function oculto() { return guardado('mf-privado', 'no') === 'si'; }
  function botonOjo() {
    var o = oculto();
    return '<button class="ojo" aria-label="' + (o ? 'Mostrar montos' : 'Ocultar montos') + '" onclick="App.privado(' + (!o) + ')">' + ico(o ? 'ojoNo' : 'ojo') + '</button>';
  }
  // ---- v2.0: Inicio con widgets que se eligen y ordenan en Ajustes → Apariencia → Tu inicio
  var WIDGETS = [
    ['queda', 'Te quedan / Gastado', 'Grande, arriba', true],
    ['sobreBajo', 'Sobre más bajo', 'Pequeño', true],
    ['proxPago', 'Próximo pago', 'Pequeño', true],
    ['viaje', 'Viaje activo', 'Ancho · solo cuando hay un viaje', true],
    ['tasaCero', 'Tasa cero del mes', 'Pequeño', false],
    ['fondos', 'Fondos de inversión', 'Pequeño', false],
    ['prestamo', 'Cuota de la casa', 'Pequeño', false],
    ['sobres', 'Sobres (los más usados)', 'Ancho', false],
    ['medeben', 'Me deben', 'Pequeño · solo si alguien te debe', true],
    ['accesos', 'Accesos rápidos', 'Fila de íconos (incluye Más)', true],
    ['ultimos', 'Últimos movimientos', 'Ancho', true]
  ];
  // v2.5: tamaños por widget (Chico = media fila, Mediano = fila entera, Grande = fila entera y más grande)
  var TAMANOS = { queda: 'SML', sobreBajo: 'SML', proxPago: 'SML', tasaCero: 'SML', fondos: 'SML', prestamo: 'SML', medeben: 'SML', viaje: 'M', sobres: 'ML', accesos: 'M', ultimos: 'ML' };
  var TAM_INICIAL = { queda: 'L', sobreBajo: 'S', proxPago: 'S', tasaCero: 'S', fondos: 'S', prestamo: 'S', medeben: 'S' };
  var NOM_TAM = { S: 'Chico', M: 'Mediano', L: 'Grande' };
  var VACIO = { viaje: ['✈', 'Ningún viaje en curso · Crear uno ›', 'viajes'], medeben: ['🤝', 'Nadie te debe ✓', 'medeben'], tasaCero: ['◷', 'Sin cuotas tasa cero', 'tasacero'],
    fondos: ['📈', 'Sin fondos todavía · Agregar ›', 'fondos'], prestamo: ['🏠', 'Sin préstamo anotado', 'prestamo'], sobres: ['✉', 'Configurá tus sobres ›', 'sobres'],
    sobreBajo: ['✉', 'Configurá tus sobres ›', 'sobres'], proxPago: ['📅', 'Sin pagos próximos', 'tarjetas'] };
  function tamanosDe(k) { return /^acc:/.test(k) ? 'SM' : (TAMANOS[k] || 'M'); }
  function nomTam(k, t) { return /^acc:/.test(k) ? (t === 'S' ? 'Mediano' : 'Ancho') : NOM_TAM[t]; }
  function defWidget(k) { if (/^acc:/.test(k)) { var it = ITEMS[k.slice(4)] || ['Acceso']; return [k, it[0], 'Acceso', true]; } return WIDGETS.filter(function (x) { return x[0] === k; })[0]; }
  /** v2.5: un acceso puesto como widget (Mediano = media fila, Ancho = fila entera) con un dato útil */
  function datoAcceso(c, res) {
    try {
      if (c === 'planpago') { var ts = tarjetasActivas(), tt = 0; ts.forEach(function (x) { tt += totalSinPagar(x.nombre); }); return [din(tt, 'CRC'), 'sin pagar en ' + ts.length + ' tarjeta' + (ts.length === 1 ? '' : 's')]; }
      if (c === 'super') { var l = (LISTAS || [])[0]; return l ? [l.nombre, l.marcados + ' de ' + l.total + ' en el carrito'] : ['Tus listas', 'Crear una lista']; }
      if (c === 'inversiones') { var fl = D.fondos ? FD().lista : [], tf = 0; fl.forEach(function (f) { if (f.moneda === 'CRC') tf += f.saldo; }); return [din(tf, 'CRC'), fl.length + ' subcuenta' + (fl.length === 1 ? '' : 's')]; }
      if (c === 'sobres') { return sinServidorSobres() ? ['Sobres', ''] : [din(SB().total.CRC, 'CRC'), SB().pendientes.length ? SB().pendientes.length + ' por asignar' : 'todo asignado']; }
      if (c === 'prestamo') { return D.prestamo && D.prestamo.estimado ? [din(D.prestamo.estimado.total, 'CRC'), D.prestamo.proximoVenc ? 'cuota ' + enDias(C.diasEntre(hoy, new Date(D.prestamo.proximoVenc))) : ''] : ['Préstamo', '']; }
      if (c === 'tasacero') { return [din(res.cuotasTC.CRC, 'CRC'), 'cuotas de este mes']; }
      if (c === 'medeben') { var md = C.meDeben(D); return [md.total.CRC ? din(md.total.CRC, 'CRC') : 'Nadie', md.personas.length ? md.personas.length + ' persona' + (md.personas.length === 1 ? '' : 's') : 'te debe nada']; }
      if (c === 'viajes') { var v = (D.viajes || [])[0]; return v ? [esc(v.nombre || 'Viaje'), (D.viajes || []).length + ' viaje' + ((D.viajes || []).length === 1 ? '' : 's')] : ['Viajes', 'Crear un presupuesto']; }
      if (c === 'tarjetas') { var dt = 0; D.cuentas.forEach(function (x) { if (x.activa && x.tipo === 'Tarjeta de crédito') dt += C.deudaTarjeta(D, x).CRC; }); return [din(dt, 'CRC'), 'deuda de tarjetas hoy']; }
      if (c === 'reportes' || c === 'categorias') { return [din(res.total.CRC, 'CRC'), 'gastado este mes']; }
    } catch (e) { /* sin datos */ }
    var it = ITEMS[c] || ['', ''];
    return [esc(it[0]), 'Abrir'];
  }
  function svgItem(c) { var it = ITEMS[c]; return '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="b" d="' + it[1] + '"/>' + (it[2] ? '<path class="a" d="' + it[2] + '"/>' : '') + '</svg>'; }
  function widgetAcceso(c, res, tam) {
    var it = ITEMS[c]; if (!it) return '';
    var d = datoAcceso(c, res);
    if (tam === 'M') return '<button class="widget acc-ancho" onclick="App.abrirItem(\'' + c + '\')"><span class="acc-ic tile"><span class="ic">' + svgItem(c) + '</span></span><span class="acc-c"><span class="w-n">' + esc(it[0]) + '</span><span class="w-t">' + d[1] + '</span></span><span class="w-v acento">' + d[0] + '</span></button>';
    return '<button class="widget acc-med" onclick="App.abrirItem(\'' + c + '\')"><span class="acc-ic tile"><span class="ic">' + svgItem(c) + '</span></span><span class="w-t">' + esc(it[0]) + '</span><span class="w-n">' + d[0] + '</span><span class="w-v chico-v suave">' + d[1] + '</span></button>';
  }
  function widgetsInicio() {
    var guardados = leerJSONSeguro('mf-inicio');
    var base = WIDGETS.map(function (w) { return { k: w[0], on: w[3] }; });
    var lista = !Array.isArray(guardados) ? base : guardados.filter(function (x) { return x && (WIDGETS.some(function (w) { return w[0] === x.k; }) || (/^acc:/.test(x.k) && ITEMS[x.k.slice(4)])); });
    if (Array.isArray(guardados)) base.forEach(function (b) { if (!lista.some(function (x) { return x.k === b.k; })) lista.push(b); });   // widgets nuevos de versiones futuras
    lista.forEach(function (w) { var ok = tamanosDe(w.k); if (!w.t || ok.indexOf(w.t) < 0) w.t = TAM_INICIAL[w.k] && ok.indexOf(TAM_INICIAL[w.k]) >= 0 ? TAM_INICIAL[w.k] : ok.charAt(0) === 'S' && ok.length === 1 ? 'S' : (ok.indexOf('M') >= 0 ? 'M' : ok.charAt(0)); });
    return lista;
  }
  function proximosPagos() {
    var pagos = [];
    D.cuentas.forEach(function (c) {
      if (!c.activa || c.tipo !== 'Tarjeta de crédito' || !c.diaPago) return;
      var f = C.proximaFecha(c.diaPago, hoy);
      pagos.push({ nombre: c.nombre, cuenta: c, dias: C.diasEntre(hoy, f), fecha: f });
    });
    if (D.prestamo && D.prestamo.proximoVenc) pagos.push({ nombre: 'Cuota de la casa', prestamo: true, dias: C.diasEntre(hoy, new Date(D.prestamo.proximoVenc)) });
    return pagos.sort(function (a, b) { return a.dias - b.dias; });
  }
  function enDias(d) { return d < 0 ? 'vencido' : d === 0 ? 'hoy' : d === 1 ? 'mañana' : 'en ' + d + ' días'; }
  function wChico(onclick, titulo, nombre, valor, cls) {
    return '<button class="widget" onclick="' + onclick + '"><span class="w-t">' + titulo + '</span><span class="w-n">' + nombre + '</span><span class="w-v ' + (cls || '') + '">' + valor + '</span></button>';
  }
  function widget(k, res, tam) {
    if (/^acc:/.test(k)) return widgetAcceso(k.slice(4), res, tam);
    if (k === 'queda') {
      var ing = res.ingresos.CRC, q = res.queda.CRC, pct = ing ? res.total.CRC / ing : 0;
      return '<div class="widget ancho grande-w"><div class="fila"><span class="w-t">' + (ing ? 'Te quedan este mes' : 'Gastado este mes') + '</span>' + botonOjo() + '</div>' +
        '<div class="w-grande ' + (ing ? (q < 0 ? 'rojo' : 'verde-pos') : '') + '">' + din(ing ? q : res.total.CRC, 'CRC') + '</div>' +
        (ing ? barra(pct, pct >= 0.9) : '') +
        '<div class="w-sub">' + (ing ? 'Gastado ' + din(res.total.CRC, 'CRC') : 'Ingresos ' + din(0, 'CRC')) + (res.total.USD ? ' · ' + din(res.total.USD, 'USD') : '') +
        (res.cuotasTC.CRC || res.cuotasTC.USD ? '<br>Incluye cuotas tasa cero ' + din(res.cuotasTC.CRC, 'CRC') + (res.cuotasTC.USD ? ' + ' + din(res.cuotasTC.USD, 'USD') : '') : '') + '</div></div>';
    }
    if (k === 'sobreBajo') {
      if (sinServidorSobres()) return '';
      var cand = SB().lista.filter(function (s) { return s.moneda === 'CRC' && s.tipo !== 'Ahorro' && s.tipo !== 'Fijo'; }).sort(function (a, b) { return a.saldo - b.saldo; });
      if (!cand.length) return '';
      var s = cand[0];
      return wChico("App.ir('sobres')", '✉ Sobre más bajo', esc(nomSobre(s.nombre)), din(s.saldo, 'CRC'), s.saldo < 10000 ? 'rojo' : '');
    }
    if (k === 'proxPago') {
      var p = proximosPagos()[0];
      if (!p) return '';
      return wChico(p.prestamo ? "App.ir('prestamo')" : "App.ir('tarjetas')", '📅 Próximo pago', esc(p.nombre), enDias(p.dias), p.dias <= 3 ? 'rojo' : 'acento');
    }
    if (k === 'viaje') { var tv = D.viajes ? tarjetaViajeInicio() : ''; return tv ? tv.replace('class="caja"', 'class="caja ancho"') : ''; }
    if (k === 'tasaCero') {
      if (!D.tasaCero.length) return '';
      return wChico("App.ir('tasacero')", '◷ Tasa cero', 'Cuotas del mes', din(res.cuotasTC.CRC, 'CRC') + (res.cuotasTC.USD ? '<small> + ' + din(res.cuotasTC.USD, 'USD') + '</small>' : ''));
    }
    if (k === 'fondos') {
      if (!D.fondos || !D.fondos.length) return '';
      var fl = FD().lista, tot = 0, it = 0;
      fl.forEach(function (f) { if (f.moneda === 'CRC') { tot += f.saldo; it += f.intereses || 0; } });
      return wChico("App.ir('fondos')", '📈 Fondos', din(tot, 'CRC'), it ? '+' + din(it, 'CRC') + ' intereses' : fl.length + ' subcuentas', 'verde-pos chico-v');
    }
    if (k === 'prestamo') {
      if (!D.prestamo || !D.prestamo.proximoVenc) return '';
      var dd = C.diasEntre(hoy, new Date(D.prestamo.proximoVenc));
      return wChico("App.ir('prestamo')", '🏠 Cuota de la casa', din(D.prestamo.estimado.total, 'CRC'), enDias(dd), dd <= 3 ? 'rojo' : 'acento');
    }
    if (k === 'medeben') {
      var md = C.meDeben(D);
      if (!md.lista.length) return '';
      return wChico("App.ir('medeben')", '🤝 Me deben', md.personas.length + ' persona' + (md.personas.length === 1 ? '' : 's'), md.total.CRC ? din(md.total.CRC, 'CRC') : din(md.total.USD, 'USD'), 'acento');
    }
    if (k === 'sobres') {
      if (sinServidorSobres()) return '';
      var sbI = SB(), lst = sbI.lista.filter(function (s) { return s.moneda === 'CRC'; }).sort(function (a, b) { return (b.pct || 0) - (a.pct || 0); }).slice(0, tam === 'L' ? 8 : 4);
      if (!lst.length) return '';
      return '<div class="caja ancho"><div class="fila"><h3>Sobres · ' + din(sbI.total.CRC, 'CRC') + '</h3><a href="#" onclick="App.ir(\'sobres\');return false" class="enlace">Ver todos</a></div>' + lst.map(function (s) {
        return '<div style="display:flex;flex-direction:column;gap:4px"><div class="fila" style="font-size:14px"><span>' + esc(nomSobre(s.nombre)) + '</span><span class="fuerte' + (s.saldo < 0 ? ' rojo' : '') + '">' + din(s.saldo, s.moneda) + '</span></div>' + barra(s.pct, s.pct >= 0.85) + '</div>';
      }).join('') + '</div>';
    }
    if (k === 'accesos') {
      return '<div class="ancho"><div class="accesos fila-accesos">' + accesos().slice(0, MAX_ACCESOS).concat(['mas']).map(function (x) {
        return editIni && x !== 'mas' ? '<span class="tile-ed">' + tile(x, false) + '<button class="wi-x" aria-label="Quitar ' + esc(ITEMS[x][0]) + '" onclick="App.iniQuitarAcceso(\'' + x + '\')">×</button></span>' : tile(x, false);
      }).join('') + '</div></div>';
    }
    if (k === 'ultimos') {
      if (!res.movimientos.length) return '<div class="caja vacio ancho">No hay movimientos en ' + nombreMes(mes).toLowerCase() + '.<br>Tocá el + amarillo para agregar uno.</div>';
      return '<div class="caja sinpad ancho"><div class="fila" style="padding:14px 16px 4px"><h3>Últimos movimientos</h3><a href="#" onclick="App.ir(\'movimientos\');return false" class="enlace">Ver todos</a></div>' +
        res.movimientos.slice(0, tam === 'L' ? 8 : 4).map(itemMov).join('') + '</div>';
    }
    return '';
  }
  function avisosInicio(res) {
    var h = tarjetasVersion() + tarjetaSalario() + tarjetaPlanes();
    var linea = function (icono, texto, accion, alerta) {
      return '<button class="linea-aviso' + (alerta ? ' alerta' : '') + '" onclick="' + accion + '"><span class="li-ic">' + icono + '</span><span class="li-t">' + texto + '</span><span class="enlace">Ver ›</span></button>';
    };
    // v2.6.0: "sin categoría" y "por asignar" ahora están en la tarjeta «Para revisar» de arriba
    if (D.fondos) { var f = FD().pendientes.length; if (f) h += linea('📈', '<b>' + f + '</b> ' + (f > 1 ? 'inversiones' : 'inversión') + ' sin subcuenta', "App.ir('fondos')"); }
    return h ? '<div class="ancho avisos">' + h + '</div>' : '';
  }
  function pInicio(res) {
    var h = cabMes('Resumen'), ed = !!editIni;
    var ws = (editIni || widgetsInicio()).filter(function (w) { return w.on; });
    var cuerpo = '', avisosPuestos = false;
    var avisos = function () { var a = avisosInicio(res); return a ? '<div class="wi wi-M wi-fijo">' + a + '</div>' : ''; };
    ws.forEach(function (w) {
      if (!avisosPuestos && (w.k === 'accesos' || w.k === 'ultimos' || w.k === 'sobres')) { cuerpo += avisos(); avisosPuestos = true; }
      var html = widget(w.k, res, w.t), def = defWidget(w.k);
      if (!html) {   // v2.5.2: un widget sin datos se ve igual, con un mensaje (antes desaparecía y parecía que no se había agregado)
        var vac = VACIO[w.k] || ['', 'Sin datos por ahora', ''];
        html = '<button class="widget wi-vacio"' + (vac[2] ? ' onclick="App.ir(\'' + vac[2] + '\')"' : '') + '><span class="w-t">' + (vac[0] ? vac[0] + ' ' : '') + esc(def[1]) + '</span><span class="w-v chico-v suave">' + vac[1] + '</span></button>';
      }
      var tams = tamanosDe(w.k);
      cuerpo += '<div class="wi wi-' + w.t + '" data-k="' + w.k + '">' + html +
        (ed ? '<div class="wi-capa"></div><button class="wi-x" aria-label="Quitar ' + esc(def[1]) + '" onclick="App.iniQuitar(\'' + w.k + '\')">×</button>' +
          '<button class="wi-mover" aria-label="Mover" data-k="' + w.k + '">⠿</button>' +
          '<span class="wi-flechas"><button aria-label="Subir" onclick="App.iniMover(\'' + w.k + '\',-1)">↑</button><button aria-label="Bajar" onclick="App.iniMover(\'' + w.k + '\',1)">↓</button></span>' +
          (tams.length > 1 ? '<button class="wi-tam" onclick="App.iniTam(\'' + w.k + '\')">' + nomTam(w.k, w.t) + ' ⤢</button>' : '') : '') + '</div>';
    });
    if (!avisosPuestos) cuerpo += avisos();
    if (!ed) h += tarjetaRevisar(res);   // v2.6.0
    h += (ed ? '<div class="ayuda-edit">Mantené presionado y arrastrá (o usá ↑ ↓) · × quita · Tamaño cambia</div>' : '') + '<div class="widgets' + (ed ? ' editando' : '') + '">' + cuerpo + '</div>';
    h += ed ? '<div class="barra-edit"><button onclick="App.iniAgregarW()">＋ Widget</button><button onclick="App.iniAgregarA()">＋ Acceso</button><button class="ok" onclick="App.iniListo()">Listo</button></div><div style="height:90px"></div>'
      : '<button class="enlace-editar" onclick="App.editarInicio()">✏ Editar Inicio</button>';
    $('p-inicio').innerHTML = h;
    if (ed) activarArrastre();
  }
  // ---- v2.5: editar Inicio ahí mismo (mantener presionado)
  var editIni = null, presIni = null, suprimirClick = false;
  function editarInicio() { if (pantalla !== 'inicio') ir('inicio'); editIni = widgetsInicio(); pintar(); vibrar(); }
  function vibrar() { if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) { /* nada */ } } }
  function iniQuitar(k) { if (/^acc:/.test(k)) editIni = editIni.filter(function (w) { return w.k !== k; }); else editIni.forEach(function (w) { if (w.k === k) w.on = false; }); pintar(); }
  function iniTam(k) { editIni.forEach(function (w) { if (w.k === k) { var o = tamanosDe(k); w.t = o.charAt((o.indexOf(w.t) + 1) % o.length); } }); pintar(); }
  function iniMover(k, d) {
    var vis = editIni.filter(function (w) { return w.on; }), i = vis.map(function (w) { return w.k; }).indexOf(k), j = i + d;
    if (i < 0 || j < 0 || j >= vis.length) return;
    var a = editIni.indexOf(vis[i]), b = editIni.indexOf(vis[j]), tmp = editIni[a]; editIni[a] = editIni[b]; editIni[b] = tmp;
    pintar(); vibrar();
  }
  function iniListo() { guardar('mf-inicio', JSON.stringify(editIni)); editIni = null; pintar(); toast('✅ Inicio guardado'); }
  function iniAgregarW() {
    var fuera = editIni.filter(function (w) { return !w.on && !/^acc:/.test(w.k); });
    abrir('<h2>Agregar widget</h2>' + (fuera.length ? '<div class="caja sinpad">' + fuera.map(function (w) {
      var d = WIDGETS.filter(function (x) { return x[0] === w.k; })[0];
      return '<button class="opcion" onclick="App.iniActivar(\'' + w.k + '\')"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(d[1]) + '</span><span class="det" style="display:block">' + esc(d[2]) + '</span></span><b class="acento" style="font-size:22px">＋</b></button>';
    }).join('') + '</div>' : '<div class="caja vacio">Ya están todos en Inicio.</div>') +
      '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button><button class="btn sec" onclick="App.iniFabrica()">Volver a lo de fábrica</button></div>');
  }
  function iniActivar(k) {
    var i = -1; editIni.forEach(function (w, j) { if (w.k === k) i = j; });
    var w = editIni.splice(i, 1)[0]; w.on = true;
    var u = -1; editIni.forEach(function (x, j) { if (x.k === 'ultimos' && x.on) u = j; });
    editIni.splice(u >= 0 ? u : editIni.length, 0, w);
    cerrar(); pintar(); toast('Agregado: ' + WIDGETS.filter(function (x) { return x[0] === k; })[0][1]);
  }
  function iniFabrica() { guardar('mf-inicio', null); editIni = widgetsInicio(); cerrar(); pintar(); toast('Inicio como venía de fábrica'); }
  var accSel = null, accTam = 'S';
  function accesoUsado(c) { return accesos().indexOf(c) >= 0 || (editIni || widgetsInicio()).some(function (w) { return w.k === 'acc:' + c && w.on; }); }
  function iniAgregarA(c, tam) {
    if (c) accSel = c; if (tam) accTam = tam;
    var lista = []; SECCIONES.forEach(function (s) { s[1].forEach(function (k) { if (k !== 'agregar' && !accesoUsado(k)) lista.push(k); }); });
    if (!accSel || accesoUsado(accSel)) accSel = lista[0] || null;
    var res = C.resumenMes(D, mes);
    var opT = function (v, n, s, barraW) { return '<button class="tam-op' + (accTam === v ? ' on' : '') + '" onclick="App.iniAgregarA(null,\'' + v + '\')"><span class="tam-dib" style="width:' + barraW + 'px"></span><b>' + n + '</b><span class="suave chico">' + s + '</span></button>'; };
    var prev = !accSel ? '' : accTam === 'I' ? '<div class="accesos fila-accesos" style="justify-content:flex-start">' + tile(accSel, false) + '</div>' : '<div class="widgets"><div class="wi wi-' + accTam + '">' + widgetAcceso(accSel, res, accTam) + '</div></div>';
    abrir('<h2>Agregar acceso</h2><div class="suave">Tocá uno y elegí cómo se ve en Inicio.</div>' +
      (lista.length ? '<div class="accesos" style="margin-top:10px">' + lista.map(function (k) { return '<button class="tile' + (k === accSel ? ' elegido' : '') + '" onclick="App.iniAgregarA(\'' + k + '\')"><span class="ic">' + svgItem(k) + '</span><span class="n">' + esc(ITEMS[k][0]) + '</span></button>'; }).join('') + '</div>' +
        '<div class="suave chico fuerte" style="margin-top:14px">¿CÓMO LO QUERÉS? · ' + esc(ITEMS[accSel][0]).toUpperCase() + '</div><div class="tam-ops">' + opT('I', 'Ícono', 'en la fila', 22) + opT('S', 'Mediano', 'media fila', 42) + opT('M', 'Ancho', 'fila entera', 84) + '</div>' +
        '<div class="suave chico" style="margin:12px 0 6px">Vista previa</div><div class="prev-acc">' + prev + '</div>' +
        '<div class="acciones"><button class="btn" onclick="App.agregarAcceso()">Agregar a Inicio</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>'
        : '<div class="caja vacio">Ya están todos en Inicio.</div><div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>'));
  }
  function agregarAcceso() {
    var c = accSel; if (!c) return;
    if (accTam === 'I') {
      var a = accesos();
      if (a.length >= MAX_ACCESOS) { cerrar(); return alternarAcceso(c); }   // pregunta cuál reemplazar
      a.push(c); guardar('mf-accesos', JSON.stringify(a));
    } else {
      var w = { k: 'acc:' + c, on: true, t: accTam }, u = -1;
      editIni.forEach(function (x, j) { if (x.k === 'ultimos' && x.on) u = j; });
      editIni.splice(u >= 0 ? u : editIni.length, 0, w);
    }
    cerrar(); pintar(); vibrar(); toast('✅ ' + ITEMS[c][0] + ' agregado a Inicio');
  }
  var arrastre = null;
  function activarArrastre() {
    Array.prototype.forEach.call(document.querySelectorAll('#p-inicio .widgets.editando > .wi[data-k]'), function (nodo) {
      nodo.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.wi-x, .wi-tam, .wi-flechas, .tile-ed .wi-x')) return;
        var manija = !!e.target.closest('.wi-mover'), x0 = e.clientX, y0 = e.clientY, id = e.pointerId;
        var empezar = function () { arrastre = { nodo: nodo, cont: nodo.parentNode, y: y0, id: id }; nodo.classList.add('arrastrando'); vibrar(); };
        if (manija) { e.preventDefault(); return empezar(); }
        var tm = setTimeout(empezar, 280);   // mantener presionado el widget entero
        var cancelar = function (ev) { if (arrastre) return; if (ev.type !== 'pointermove' || Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 10) { clearTimeout(tm); quitar(); } };
        var quitar = function () { ['pointermove', 'pointerup', 'pointercancel'].forEach(function (t2) { document.removeEventListener(t2, cancelar); }); };
        ['pointermove', 'pointerup', 'pointercancel'].forEach(function (t2) { document.addEventListener(t2, cancelar); });
      });
    });
  }
  var autoScroll = null;
  document.addEventListener('pointermove', function (ev) {
    if (!arrastre) return;
    var a = arrastre, bajo;
    a.ultY = ev.clientY;
    a.nodo.style.visibility = 'hidden'; bajo = document.elementFromPoint(ev.clientX, ev.clientY); a.nodo.style.visibility = '';
    var otro = bajo && bajo.closest && bajo.closest('#p-inicio .widgets.editando > .wi[data-k]');
    if (otro && otro !== a.nodo) {
      var r = otro.getBoundingClientRect(), antes = ev.clientY < r.top + r.height / 2 || (ev.clientY < r.bottom && ev.clientX < r.left + r.width / 2 && otro.classList.contains('wi-S'));
      a.cont.insertBefore(a.nodo, antes ? otro : otro.nextSibling);
    }
    // cerca del borde, la pantalla baja o sube sola
    var vel = ev.clientY < 90 ? -14 : ev.clientY > window.innerHeight - 170 ? 14 : 0;
    clearInterval(autoScroll); if (vel) autoScroll = setInterval(function () { window.scrollBy(0, vel); }, 16);
  });
  function soltarArrastre() {
    if (!arrastre) return;
    clearInterval(autoScroll);
    var a = arrastre; arrastre = null;
    a.nodo.classList.remove('arrastrando');
    var orden = Array.prototype.map.call(a.cont.querySelectorAll('.wi[data-k]'), function (n) { return n.dataset.k; });
    editIni.sort(function (x, y) { var ia = orden.indexOf(x.k), ib = orden.indexOf(y.k); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); });
    suprimirClick = true; setTimeout(function () { suprimirClick = false; }, 80);
  }
  document.addEventListener('pointerup', soltarArrastre);
  document.addEventListener('pointercancel', soltarArrastre);
  document.addEventListener('touchmove', function (ev) { if (arrastre) ev.preventDefault(); }, { passive: false });   // mientras se arrastra, la página no se desliza
  // mantener presionado en Inicio (widget o acceso) → editar
  document.addEventListener('pointerdown', function (e) {
    if (pantalla !== 'inicio' || editIni || !e.target.closest) return;
    var w = e.target.closest('#p-inicio .wi[data-k], #p-inicio .tile');
    if (!w) return;
    var x0 = e.clientX, y0 = e.clientY;
    clearTimeout(presIni);
    presIni = setTimeout(function () {
      presIni = null; suprimirClick = true; editarInicio();
      var fin = function () { document.removeEventListener('pointerup', fin); setTimeout(function () { suprimirClick = false; }, 80); };
      document.addEventListener('pointerup', fin);
    }, 550);
    var cancelar = function (ev) { if (ev.type !== 'pointermove' || Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 12) { clearTimeout(presIni); quitar(); } };
    var quitar = function () { ['pointermove', 'pointerup', 'pointercancel'].forEach(function (t2) { document.removeEventListener(t2, cancelar); }); };
    ['pointermove', 'pointerup', 'pointercancel'].forEach(function (t2) { document.addEventListener(t2, cancelar); });
  });
  document.addEventListener('click', function (e) { if (suprimirClick) { suprimirClick = false; e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('contextmenu', function (e) { if (pantalla === 'inicio' && e.target.closest && e.target.closest('#p-inicio .wi, #p-inicio .tile')) e.preventDefault(); });
  function formInicio() {
    var ws = widgetsInicio();
    var nombre = function (k) { return WIDGETS.filter(function (w) { return w[0] === k; })[0]; };
    abrir('<h2>Tu inicio</h2><div class="suave">Elegí qué ver en Inicio y ordenalo con las flechas.</div><div class="caja sinpad" style="margin-top:12px">' + ws.map(function (w, i) {
      var d = nombre(w.k);
      return '<div class="opcion"><span class="orden"><button aria-label="Subir" onclick="App.moverWidget(' + i + ',-1)"' + (i ? '' : ' disabled') + '>▲</button><button aria-label="Bajar" onclick="App.moverWidget(' + i + ',1)"' + (i < ws.length - 1 ? '' : ' disabled') + '>▼</button></span>' +
        '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(d[1]) + '</span><span class="det" style="display:block">' + esc(d[2]) + '</span></span>' +
        interruptor('wi-' + w.k, w.on, 'App.alternarWidget(\'' + w.k + '\',this.checked)', d[1]) + '</div>';
    }).join('') + '</div><div class="acciones"><button class="btn" onclick="App.cerrar()">Listo</button><button class="btn sec" onclick="App.restaurarInicio()">Volver a lo de fábrica</button></div>');
  }
  function guardarWidgets(ws) { guardar('mf-inicio', JSON.stringify(ws)); if (D) pintar(); }
  function moverWidget(i, d) { var ws = widgetsInicio(), j = i + d; if (j < 0 || j >= ws.length) return; var t = ws[i]; ws[i] = ws[j]; ws[j] = t; guardarWidgets(ws); formInicio(); }
  function alternarWidget(k, on) { var ws = widgetsInicio(); ws.forEach(function (w) { if (w.k === k) w.on = on; }); guardarWidgets(ws); }
  function restaurarInicio() { guardar('mf-inicio', null); if (D) pintar(); formInicio(); toast('Inicio como venía de fábrica'); }

  // ------------------------------------------------------------ ACCESOS Y PESTAÑA "MÁS"
  // Cada ícono: trazo blanco (b) + detalle de color (a)
  var ITEMS = {
    tarjetas: ['Tarjetas', 'M2 5h20v14H2zM2 10h20', 'M5 14h4v2H5z', 'ir:tarjetas'],
    ahorros: ['Ahorros', 'M5 9a7 6 0 0 1 14 0v6H5zM9 15v4M15 15v4', 'M11 5h2v2h-2z', 'ir:patrimonio'],
    prestamo: ['Préstamo', 'M3 11l9-7 9 7M5 10v10h14V10', 'M10 20v-5h4v5z', 'ir:prestamo'],
    inversiones: ['Fondos', 'M4 20V4M4 20h16M7 15l4-4 3 3 5-6', 'M18 7.5a1.5 1.5 0 1 0 0.01 0z', 'ir:fondos'],
    medeben: ['Me deben', 'M7 11a3 3 0 1 0 0.01 0zM2 20c0-3 2.5-5 5-5s5 2 5 5', 'M16 8l4 4-4 4M20 12h-7', 'ir:medeben'],
    viajes: ['Viajes', 'M10.5 21l1.5-1v-5l8 3v-2l-8-5V5.5a1.5 1.5 0 0 0-3 0V11l-8 5v2l8-3v5l1.5 1z', 'M17 3.5a1.5 1.5 0 1 0 0.01 0z', 'ir:viajes'],
    sobres: ['Sobres', 'M3 6h18v12H3zM3 7l9 6 9-6', 'M17 15.5a2 2 0 1 0 0.01 0z', 'ir:sobres'],
    planpago: ['Planear pago', 'M5 4h14v17H5zM9 2h6v4H9zM8 10h8M8 14h5', 'M15 15.5l1.5 1.5 3-3', 'plan'],
    super: ['Super y Otros', 'M3 4h2l2.4 11h11l2-8H7M9 20a1 1 0 1 0 0.01 0zM18 20a1 1 0 1 0 0.01 0z', 'M11 9h6v3h-6z', 'ir:super'],
    calculadora: ['Calculadora', 'M5 2h14v20H5zM8 5h8v4H8z', 'M8 13h2v2H8zM14 13h2v2h-2zM8 17h2v2H8zM14 17h2v2h-2z', 'ir:calculadora'],
    tasacero: ['Tasa cero', 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4', 'M12 12.5a2.5 3 0 1 0 0.01 0z', 'ir:tasacero'],
    recurrentes: ['Recurrentes', 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4', 'M12 11a1.5 1.5 0 1 0 0.01 0z', 'hoja:Recurrentes'],
    reportes: ['Reportes', 'M4 20V4M4 20h16', 'M8 16v-4h2v4zM12 16V8h2v8zM16 16v-6h2v6z', 'ir:reportes'],
    patrimonio: ['Patrimonio', 'M12 3l9 5H3zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18', 'M11 6.5h2v1h-2z', 'ir:patrimonio'],
    categorias: ['Categorías', 'M12 3a9 9 0 1 0 9 9h-9z', 'M14 2.5a8 8 0 0 1 7.5 7.5H14z', 'ir:reportes'],
    exportar: ['Exportar', 'M4 14v6h16v-6M12 3v11', 'M8.5 7.5L12 3l3.5 4.5z', 'exportar'],
    configuracion: ['Ajustes', 'M12 9a3 3 0 1 0 0.01 0zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1', 'M11 11h2v2h-2z', 'ir:ajustes'],
    hoja: ['Mi hoja', 'M4 3h16v18H4zM4 9h16M4 15h16M10 3v18', 'M12 11h6v2h-6z', 'hoja:'],
    bancos: ['Bancos', 'M3 9l9-5 9 5M5 10v8M19 10v8M3 20h18', 'M10 12h4v6h-4z', 'ir:ajustes'],
    mas: ['Más', 'M4 4h6v6H4zM4 14h6v6H4zM14 14h6v6h-6z', 'M17 3.5l3.5 3.5-3.5 3.5-3.5-3.5z', 'ir:mas'],
    agregar: ['Agregar', 'M12 7v10M7 12h10', '', 'agregar']
  };
  var SECCIONES = [
    ['MIS CUENTAS', ['tarjetas', 'ahorros', 'prestamo', 'inversiones', 'medeben']],
    ['PLANIFICAR', ['planpago', 'super', 'sobres', 'viajes', 'calculadora', 'tasacero', 'recurrentes']],
    ['ANÁLISIS', ['reportes', 'patrimonio', 'categorias', 'exportar']],
    ['AJUSTES', ['configuracion', 'hoja', 'bancos', 'agregar']]
  ];
  var ACCESOS_INICIALES = ['sobres', 'prestamo', 'calculadora', 'tasacero', 'recurrentes', 'reportes', 'patrimonio'];
  var MAX_ACCESOS = 4;   // v2.5: la fila de Inicio muestra 4 + Más

  function accesos() {
    try {
      var a = JSON.parse(guardado('mf-accesos', 'null'));
      if (Array.isArray(a)) return a.filter(function (k) { return ITEMS[k] && k !== 'mas' && k !== 'agregar'; }).slice(0, MAX_ACCESOS);
    } catch (e) { /* valor dañado */ }
    return ACCESOS_INICIALES.slice();
  }
  function tile(k, conPin) {
    var it = ITEMS[k];
    var fijado = conPin && accesos().indexOf(k) >= 0;
    var eventos = conPin && k !== 'agregar'
      ? ' onpointerdown="App.presionar(\'' + k + '\')" onpointerup="App.soltar(\'' + k + '\')" onpointerleave="App.cancelarPresion()" oncontextmenu="return false"'
      : ' onclick="App.abrirItem(\'' + k + '\')"';
    return '<button class="tile' + (k === 'agregar' ? ' prox' : '') + '"' + eventos + ' aria-label="' + esc(it[0]) + (fijado ? ' (en Inicio)' : '') + '">' +
      '<span class="ic"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="b" d="' + it[1] + '"/>' +
      (it[2] ? '<path class="a" d="' + it[2] + '"/>' : '') + '</svg>' + (fijado ? '<span class="pin"></span>' : '') + '</span>' +
      '<span class="n">' + esc(it[0]) + '</span></button>';
  }
  function abrirItem(k) {
    var accion = ITEMS[k][3];
    if (accion.indexOf('ir:') === 0) return ir(accion.slice(3));
    if (accion.indexOf('hoja:') === 0) return abrirHoja(accion.slice(5));
    if (accion === 'exportar') return exportarCSV();
    if (accion === 'plan') return abrirPlan();
    if (accion === 'agregar') return toast('¿Qué te gustaría agregar aquí? Contámelo y lo sumamos en la próxima versión.', 5000);
  }
  var presionTimer = null, presionLarga = false;
  function presionar(k) {
    presionLarga = false;
    clearTimeout(presionTimer);
    presionTimer = setTimeout(function () { presionLarga = true; alternarAcceso(k); }, 550);
  }
  function soltar(k) {
    clearTimeout(presionTimer);
    if (!presionLarga) abrirItem(k);
    presionLarga = false;
  }
  function cancelarPresion() { clearTimeout(presionTimer); }
  function alternarAcceso(k) {
    if (k === 'mas' || k === 'agregar') return;
    var a = accesos(), i = a.indexOf(k);
    if (i >= 0) { a.splice(i, 1); toast(ITEMS[k][0] + ' ya no está en Inicio'); }
    else if (a.length >= MAX_ACCESOS) {   // v2.5: Inicio lleno → elegir cuál reemplazar
      vibrar();
      return abrir('<h2>Inicio está lleno</h2><div class="suave">¿Cuál cambiás por <b>' + esc(ITEMS[k][0]) + '</b>?</div><div class="accesos" style="margin-top:12px">' +
        a.map(function (x) { return '<button class="tile" onclick="App.reemplazarAcceso(\'' + x + '\',\'' + k + '\')"><span class="ic"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="b" d="' + ITEMS[x][1] + '"/>' + (ITEMS[x][2] ? '<path class="a" d="' + ITEMS[x][2] + '"/>' : '') + '</svg></span><span class="n">' + esc(ITEMS[x][0]) + '</span></button>'; }).join('') +
        '</div><div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    }
    else { a.push(k); toast('✅ ' + ITEMS[k][0] + ' agregado a Inicio'); }
    guardar('mf-accesos', JSON.stringify(a));
    if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) { /* nada */ } }
    pintar();
  }
  function reemplazarAcceso(viejo, nuevo) {
    var a = accesos(), i = a.indexOf(viejo); if (i < 0) return;
    a[i] = nuevo; guardar('mf-accesos', JSON.stringify(a)); cerrar(); vibrar(); pintar();
    toast('✅ ' + ITEMS[nuevo][0] + ' en Inicio · ' + ITEMS[viejo][0] + ' volvió a Más');
  }
  function iniQuitarAcceso(k) { var a = accesos(), i = a.indexOf(k); if (i >= 0) { a.splice(i, 1); guardar('mf-accesos', JSON.stringify(a)); } pintar(); }
  function formAccesos() {
    var a = accesos();
    var lista = [];
    SECCIONES.forEach(function (s) { s[1].forEach(function (k) { if (k !== 'agregar') lista.push(k); }); });
    abrir('<h2>Accesos de Inicio</h2><div class="suave">Elegí hasta ' + MAX_ACCESOS + '. También podés mantener presionado un ícono en <b>Más</b>.</div>' +
      lista.map(function (k) {
        return '<label class="check"><input type="checkbox" class="acc" value="' + k + '"' + (a.indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(ITEMS[k][0]) + '</label>';
      }).join('') +
      '<div class="acciones"><button class="btn" onclick="App.guardarAccesos()">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarAccesos() {
    var sel = Array.prototype.slice.call(document.querySelectorAll('.acc:checked')).map(function (e) { return e.value; });
    if (sel.length > MAX_ACCESOS) return toast('Elegí como máximo ' + MAX_ACCESOS + '.');
    guardar('mf-accesos', JSON.stringify(sel));
    cerrar(); pintar(); toast('✅ Accesos actualizados');
  }
  function pMas() {
    var h = cabSimple('Más', 'Mantené presionado un ícono para agregarlo a Inicio'), fij = accesos().concat(widgetsInicio().filter(function (w) { return w.on && /^acc:/.test(w.k); }).map(function (w) { return w.k.slice(4); }));
    SECCIONES.forEach(function (s) {
      var ks = s[1].filter(function (k) { return fij.indexOf(k) < 0; });   // v2.5: lo que ya está en Inicio no se repite aquí
      if (ks.length) h += '<div class="seccion-t">' + s[0] + '</div><div class="accesos">' + ks.map(function (k) { return tile(k, true); }).join('') + '</div>';
    });
    $('p-mas').innerHTML = h;
  }
  function abrirHoja(pestaña) {
    function ir2() {
      if (pestaña) toast('Abriendo tu hoja: los ' + pestaña.toLowerCase() + ' están en la pestaña "' + pestaña + '".', 5000);
      window.open(AJ.urlHoja, '_blank', 'noopener');
    }
    if (AJ) return ir2();
    toast('Abriendo tu hoja…');
    srv('obtenerAjustes', [], function (a) { AJ = a; ir2(); });
  }

  // Compartir un archivo (WhatsApp, correo…) o descargarlo si el teléfono no permite compartir
  function compartirArchivo(bytes, nombre, tipo, titulo) {
    var archivo;
    try { archivo = new File([bytes], nombre, { type: tipo }); } catch (e) { archivo = null; }
    if (archivo && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      return navigator.share({ files: [archivo], title: titulo }).catch(function (e) {
        if (e && e.name !== 'AbortError') descargar(bytes, nombre, tipo);
      });
    }
    descargar(bytes, nombre, tipo);
    return Promise.resolve();
  }
  function descargar(bytes, nombre, tipo) {
    var url = URL.createObjectURL(new Blob([bytes], { type: tipo }));
    var a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
    toast('Descargado: ' + nombre);
  }
  function exportarCSV() {
    var res = C.resumenMes(D, mes);
    var cols = ['Fecha', 'Comercio', 'Lugar', 'Monto', 'Moneda', 'Tipo', 'Cuenta', 'Categoría', 'Sobre', 'Origen', 'Nota'];
    var q = function (v) { v = String(v === null || v === undefined ? '' : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lineas = [cols.join(';')].concat(res.movimientos.slice().reverse().map(function (m) {
      var d = new Date(m.fecha);
      return [localInput(m.fecha, true).replace('T', ' '), m.comercio, m.lugar, String(m.monto).replace('.', ','), m.moneda, m.tipo, m.cuenta, m.categoria, m.sobre, m.origen, m.nota].map(q).join(';');
    }));
    var nombre = 'Movimientos-' + MESES[mes.getMonth()] + '-' + mes.getFullYear() + '.csv';
    compartirArchivo('﻿' + lineas.join('\n'), nombre, 'text/csv', 'Movimientos de ' + nombreMes(mes));
  }

  // ------------------------------------------------------------ TASA CERO (lista, detalle y abonos extra)
  var tcSel = null, tcFiltro = 'todos', tcVerTodo = false;
  function tcPorFila(f) { return D.tasaCero.filter(function (t) { return t.fila === f; })[0]; }
  function mesCorto(d) { return d ? MESES_C[d.getMonth()] + ' ' + d.getFullYear() : '—'; }

  function pTasaCero(res) {
    var h = cabMes('Tasa cero');
    var items = D.tasaCero.map(function (t) { return { t: t, e: C.estadoTasaCero(t, hoy) }; });
    var pend = { CRC: 0, USD: 0 };
    items.forEach(function (x) { pend[x.t.moneda === 'USD' ? 'USD' : 'CRC'] += x.e.saldo; });
    var cuotasMes = { CRC: res.cuotasTC.CRC - res.abonosTC.CRC, USD: res.cuotasTC.USD - res.abonosTC.USD };
    h += '<div class="hero"><span class="et" style="font-size:13px;font-weight:600">Falta por pagar</span>' +
      '<div style="display:flex;gap:18px;align-items:baseline;flex-wrap:wrap"><span class="grande">' + din(pend.CRC, 'CRC') + '</span>' + (pend.USD ? '<span class="medio">' + din(pend.USD, 'USD') + '</span>' : '') + '</div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Cuotas de ' + MESES[mes.getMonth()] + '</span><b>' + din(cuotasMes.CRC, 'CRC') + (cuotasMes.USD ? ' + ' + din(cuotasMes.USD, 'USD') : '') + '</b></div>' +
      (res.abonosTC.CRC || res.abonosTC.USD ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Abonos extra este mes</span><b style="color:var(--acento)">' +
        [res.abonosTC.CRC ? din(res.abonosTC.CRC, 'CRC') : '', res.abonosTC.USD ? din(res.abonosTC.USD, 'USD') : ''].filter(String).join(' + ') + '</b></div>' : '') + '</div>';
    var activas = items.filter(function (x) { return x.e.saldo > 0; });
    var cerradas = items.filter(function (x) { return x.e.saldo <= 0; });
    function filaTC(x) {
      var t = x.t, e = x.e, mon = t.moneda, fija = vistaTC(t) === 'fija' && e.abonado > 0;
      var cuota = fija ? e.cuotaOriginal : e.cuota, fin = fija ? planFijo(t, e).termina : e.ultima;
      var det = e.estado === 'Pagada' ? 'Pagada en ' + mesCorto(e.liquidada) : e.saldo <= 0 ? 'Terminada' :
        (e.cobradas ? e.cobradas + ' de ' + t.meses : 'por iniciar') + ' · termina ' + mesCorto(fin);
      return '<button class="tc-fila" onclick="App.verTC(' + t.fila + ')"><span class="fila"><span class="cuerpo"><b>' + esc(t.descripcion) + '</b><span class="suave chico">' + det + '</span></span>' +
        '<span class="monto">' + (e.saldo > 0 ? '<b>' + din(cuota, mon) + '<small>/mes</small></b><span class="suave chico">falta ' + din(e.saldo, mon) + '</span>' : '<span class="pill ok">✓</span>') + '</span></span>' +
        '<span class="fila" style="gap:8px">' + barra(t.monto ? e.pagado / t.monto : 0) + '<span class="flecha">›</span></span></button>';
    }
    h += activas.length ? '<div class="seccion">Activas · ' + activas.length + '</div><div class="caja sinpad">' + activas.map(filaTC).join('') + '</div>' : '<div class="caja vacio">No tenés compras a tasa cero activas.</div>';
    if (cerradas.length) h += plegable('tc-term', 'Terminadas', String(cerradas.length), cerradas.map(filaTC).join(''));
    h += '<div class="suave chico" style="text-align:center">Tocá una compra para ver el detalle o hacer un abono extra. Para agregar una: abrila en Movimientos y tocá <b>Pasar a tasa cero</b>.</div>';
    $('p-tasacero').innerHTML = h;
  }
  // ---- v2.1: ver el plan con la cuota que baja (como lo calcula el banco con abonos) o con la cuota fija original
  function vistaTC(t) { var v = leerJSONSeguro('mf-tc-vista') || {}; return v[t.fila] === 'fija' ? 'fija' : 'baja'; }
  function setVistaTC(f, v) { var m = leerJSONSeguro('mf-tc-vista') || {}; m[f] = v; guardar('mf-tc-vista', JSON.stringify(m)); pintar(); }
  /** Con cuota fija: las cuotas cobradas valen la cuota original y los abonos acortan el plazo. */
  function planFijo(t, e) {
    var c = e.cuotaOriginal;
    var saldo = Math.max(0, (t.monto || 0) - e.cobradas * c - (e.abonado || 0));
    var n = c > 0 ? Math.ceil(saldo / c - 1e-9) : 0;
    var ultima = n ? saldo - (n - 1) * c : 0;
    var base = e.proxima ? e.proxima.fecha : new Date();
    return { saldo: saldo, restantes: n, ultima: ultima, termina: n ? C.sumarMeses(base, n - 1) : base, pagadoCuotas: e.cobradas * c };
  }
  function verTC(fila) { tcSel = fila; tcFiltro = 'todos'; tcVerTodo = false; ir('tcdetalle'); }

  /** Gráfico "Camino a cero": plan del banco, con tus abonos y si seguís pagando la cuota original. */
  function graficoTC(t, e) {
    var W = 340, H = 190, X0 = 40, X1 = W - 10, Y0 = 14, Y1 = 160, n = t.meses, M = t.monto || 1;
    var x = function (k) { return X0 + (X1 - X0) * k / n; };
    var y = function (v) { return Y1 - (Y1 - Y0) * Math.max(0, v) / M; };
    var linea = function (pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1); }).join(' '); };
    var plan = [[0, M]];
    for (var k = 1; k <= n; k++) plan.push([k, M - e.cuotaOriginal * k]);
    // con abonos: caída a mitad del mes en que se abonó
    var real = [[0, M]], prev = M;
    e.plan.filas.forEach(function (f) {
      var pre = f.saldo + f.cuota;
      if (pre < prev - 0.5) real.push([f.n - 0.5, pre]);
      real.push([f.n, f.saldo]); prev = f.saldo;
    });
    var ultimo = real[real.length - 1];
    if (ultimo[1] > 0.5) real.push([ultimo[0] + 0.5, 0]);   // abono que dejó el saldo en cero
    var corte = e.cobradas + (e.abonado && e.saldo >= 0 ? 0.5 : 0);
    var hechos = real.filter(function (p) { return p[0] <= corte + 0.001; });
    var falta = [hechos[hechos.length - 1]].concat(real.filter(function (p) { return p[0] > corte + 0.001; }));
    var hoyP = hechos[hechos.length - 1];
    var alt = null;
    if (e.abonado > 0 && e.saldo > 0 && e.cuota < e.cuotaOriginal - 0.5) {
      alt = [[hoyP[0], e.saldo]]; var s = e.saldo, kk = e.cobradas;
      while (s > 0.5 && kk < n) { kk++; s -= e.cuotaOriginal; alt.push([kk, Math.max(0, s)]); }
    }
    var corto = function (v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '').replace('.', ',') + 'M' : v >= 1000 ? Math.round(v / 1000) + 'k' : String(Math.round(v)); };
    var g = '<svg viewBox="0 0 ' + W + ' ' + (H + 6) + '" style="width:100%;display:block" role="img" aria-label="Saldo por mes hasta llegar a cero">';
    [0, M / 2, M].forEach(function (v) {
      g += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="var(--borde)"/>' +
        '<text x="' + (X0 - 6) + '" y="' + (y(v) + 3).toFixed(1) + '" fill="var(--suave)" font-size="10" text-anchor="end">' + (t.moneda === 'USD' ? '$' : '') + corto(v) + '</text>';
    });
    var paso = Math.max(1, Math.ceil(n / 6));
    if (t.primeraCuota) {
      var p0 = new Date(t.primeraCuota);
      for (var j = 1; j <= n; j += paso) {
        var f = C.sumarMeses(p0, j - 1);
        g += '<text x="' + x(j).toFixed(1) + '" y="' + (H - 4) + '" fill="var(--suave)" font-size="10" text-anchor="middle">' + MESES_C[f.getMonth()] + (f.getMonth() === 0 || j === 1 ? ' ' + String(f.getFullYear()).slice(2) : '') + '</text>';
      }
    }
    g += '<path d="' + linea(plan) + '" fill="none" stroke="var(--suave)" stroke-width="2" stroke-dasharray="5 5"/>';
    if (alt) g += '<path d="' + linea(alt) + '" fill="none" stroke="#3DD68C" stroke-width="2.2" stroke-dasharray="2 4" stroke-linecap="round"/>';
    if (falta.length > 1) g += '<path d="' + linea(falta) + '" fill="none" stroke="var(--acento)" stroke-width="3" stroke-dasharray="7 5" opacity=".65"/>';
    g += '<path d="' + linea(hechos) + '" fill="none" stroke="var(--acento)" stroke-width="3" stroke-linejoin="round"/>';
    g += '<circle cx="' + x(hoyP[0]).toFixed(1) + '" cy="' + y(hoyP[1]).toFixed(1) + '" r="5" fill="var(--acento)" stroke="var(--tarjeta)" stroke-width="2"/>';
    return g + '</svg>';
  }

  function pTCDetalle() {
    var t = tcPorFila(tcSel);
    if (!t) { pantalla = 'tasacero'; return pintar(); }
    var e = C.estadoTasaCero(t, hoy), mon = t.moneda;
    var h = '<div class="cab"><div class="atras-cab">' + botonAtras('App.ir(\'tasacero\')') + '<div><div class="sobretitulo">' + esc(etiquetaCuenta(t.tarjeta)) + ' · Tasa cero</div><h1 class="titulo">' + esc(t.descripcion) + '</h1></div></div>' +
      (e.saldo > 0 ? botonNuevo('Abono extra', 'App.formAbonoTC(' + t.fila + ')') : '') + '</div>';
    var hayAb = e.abonado > 0 && e.saldo > 0;
    var fija = hayAb && vistaTC(t) === 'fija', pf = planFijo(t, e);
    if (hayAb) h += '<div class="seg">' + [['baja', 'Cuota baja con abonos'], ['fija', 'Cuota fija']].map(function (o) {
      return '<button class="' + ((fija ? 'fija' : 'baja') === o[0] ? 'on' : '') + '" onclick="App.vistaTC(' + t.fila + ',\'' + o[0] + '\')">' + o[1] + '</button>';
    }).join('') + '</div>';
    var bajo = !fija && e.saldo > 0 && e.cuota < e.cuotaOriginal - 0.5;
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">' + (e.saldo > 0 ? 'Falta por pagar' : '¡Pagada!') + '</span>' + botonOjo() + '</div>' +
      '<div class="grande">' + din(e.saldo, mon) + '</div>' + barra(t.monto ? e.pagado / t.monto : 0) +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">✓ Pagado</span><b>' + din(e.pagado, mon) + ' · ' + Math.round(t.monto ? e.pagado / t.monto * 100 : 0) + '%</b></div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Compra</span><span>' + din(t.monto, mon) + ' · ' + t.meses + ' meses · ' + mesCorto(t.primeraCuota ? new Date(t.primeraCuota) : null) + '</span></div>' +
      (e.saldo > 0 ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Cuota actual</span><span>' + (bajo ? '<s style="opacity:.6">' + din(e.cuotaOriginal, mon) + '</s> ' : '') + '<b style="color:var(--acento)">' + din(fija ? e.cuotaOriginal : e.cuota, mon) + '</b></span></div>' : '') + '</div>';

    if (t.primeraCuota) {
      h += '<div class="caja"><div class="fila"><h3>Camino a cero</h3><span class="suave chico">saldo por mes</span></div>' +
        '<div class="leyenda" style="grid-template-columns:none;display:flex;flex-wrap:wrap;gap:4px 14px">' +
        '<div><span class="punto" style="background:var(--suave)"></span>Plan del banco</div><div><span class="punto" style="background:var(--acento)"></span>Con tus abonos</div>' +
        (bajo && e.abonado ? '<div><span class="punto" style="background:#3DD68C"></span>Si seguís pagando ' + din(e.cuotaOriginal, mon) + '</div>' : '') + '</div>' +
        graficoTC(t, e) + '</div>';
    }

    if (e.saldo > 0 && e.proxima) {
      var termina = fija ? pf.termina : e.ultima, faltan = fija ? pf.restantes : e.restantes;
      var antes = e.restantes - pf.restantes;
      h += '<div class="dos"><div class="caja" style="gap:4px"><div class="suave chico">Terminás de pagar</div><div style="font-size:20px;font-weight:800">' + mesCorto(termina) + '</div>' +
        '<div class="suave chico">' + faltan + ' pago' + (faltan === 1 ? '' : 's') + (fija && antes > 0 ? ' · ' + antes + ' mes' + (antes === 1 ? '' : 'es') + ' antes' : ' más') + '</div></div>' +
        '<div class="caja" style="gap:4px"><div class="suave chico">Cuota del mes</div><div style="font-size:20px;font-weight:800;color:var(--acento)">' + din(fija ? e.cuotaOriginal : e.cuota, mon) + '</div>' +
        '<div class="suave chico">' + (fija ? 'siempre igual' : hayAb ? 'bajó con cada abono' : 'cuota del plan') + '</div></div></div>';
      if (hayAb) {
        var celda = function (v, on) { return '<span class="d' + (on ? ' fuerte' : '') + '">' + v + '</span>'; };
        h += '<div class="caja comp-tc"><h3>¿Qué pasa con tus abonos?</h3><div class="suave chico">Te quedan ' + din(e.saldo, mon) + ' por pagar</div>' +
          '<div class="tabla-k" style="grid-template-columns:1.1fr 1fr 1fr"><span class="h"></span>' +
          '<button class="h d' + (!fija ? ' on' : '') + '" onclick="App.vistaTC(' + t.fila + ',\'baja\')">Baja la cuota</button><button class="h d' + (fija ? ' on' : '') + '" onclick="App.vistaTC(' + t.fila + ',\'fija\')">Cuota fija</button>' +
          '<span class="suave">Cuota</span>' + celda(din(e.cuota, mon), !fija) + celda(din(e.cuotaOriginal, mon), fija) +
          '<span class="suave">Pagos que faltan</span>' + celda(e.restantes, !fija) + celda(pf.restantes, fija) +
          '<span class="suave">Termina</span>' + celda(mesCorto(e.ultima), !fija) + celda(mesCorto(pf.termina), fija) +
          '<span class="suave">Última cuota</span>' + celda(din(e.cuota, mon), !fija) + celda(din(pf.ultima, mon), fija) + '</div>' +
          '<div class="suave chico">Tocá una columna para ver todo el plan así. Es solo para ver: el gasto del mes no cambia.</div></div>';
      }
    }

    var cuotasPag = e.plan.filas.filter(function (f) { return f.cobrada; });
    h += '<div class="caja" style="gap:6px"><h3>Resumen</h3>' +
      '<div class="fila chico"><span class="suave">Cuotas pagadas</span><span>' + cuotasPag.length + ' · ' + din(fija ? cuotasPag.length * e.cuotaOriginal : cuotasPag.reduce(function (a, f) { return a + f.cuota; }, 0), mon) + '</span></div>' +
      '<div class="fila chico"><span class="suave">Abonos extra</span><b style="color:var(--acento)">' + (t.abonos || []).length + ' · ' + din(e.abonado, mon) + '</b></div>' +
      (e.proxima && e.saldo > 0 ? '<div class="fila chico"><span class="suave">Próxima cuota</span><span>' + fechaCorta(e.proxima.fecha.toISOString()) + ' · ' + din(fija ? Math.min(e.cuotaOriginal, pf.saldo) : e.proxima.cuota, mon) + '</span></div>' : '') +
      (fija && pf.restantes ? '<div class="fila chico"><span class="suave">Última cuota</span><b class="verde-pos">' + mesCorto(pf.termina) + ' · ' + din(pf.ultima, mon) + '</b></div>' : '') + '</div>';

    // historial
    var hist = [];
    e.plan.abonos.forEach(function (x) { hist.push({ tipo: 'abono', fecha: new Date(x.abono.fecha), x: x }); });
    cuotasPag.forEach(function (f) { hist.push({ tipo: 'cuota', fecha: f.fecha, f: f }); });
    hist.sort(function (a, b) { return b.fecha - a.fecha; });
    if (tcFiltro === 'abonos') hist = hist.filter(function (x) { return x.tipo === 'abono'; });
    var total = hist.length;
    if (!tcVerTodo) hist = hist.slice(0, 6);
    h += '<div class="fila"><h3 style="margin:0">Historial de pagos</h3><div class="chips" style="gap:6px;margin:0">' +
      [['todos', 'Todos'], ['abonos', 'Abonos']].map(function (c) { return '<button class="chip' + (tcFiltro === c[0] ? ' on' : '') + '" onclick="App.tcFiltro(\'' + c[0] + '\')">' + c[1] + '</button>'; }).join('') + '</div></div>';
    if (!total) h += '<div class="caja vacio">' + (tcFiltro === 'abonos' ? 'Todavía no hay abonos extra.' : 'Todavía no se ha cobrado ninguna cuota.') + '</div>';
    else {
      h += '<div class="caja sinpad">' + hist.map(function (x) {
        if (x.tipo === 'abono') {
          var a = x.x.abono;
          return '<button class="item" onclick="App.formAbonoTC(' + t.fila + ',' + a.fila + ')"><span class="ico" style="background:var(--acento);color:#121417">' + ico('mas') + '</span>' +
            '<span class="cuerpo"><span class="nombre" style="display:block">Abono extraordinario</span><span class="det" style="display:block">' + fechaCorta(a.fecha) + (a.origen ? ' · ' + esc(a.origen) : '') + (a.gasto === false ? ' · no cuenta como gasto' : '') + '</span></span>' +
            '<span class="monto"><b style="display:block;color:var(--acento)">' + din(a.monto, mon) + '</b><span class="origen">' + (x.x.saldo <= 0 ? 'saldo en cero' : fija ? (a.monto >= e.cuotaOriginal ? 'quita ' + Math.floor(a.monto / e.cuotaOriginal + 1e-9) + ' cuota' + (Math.floor(a.monto / e.cuotaOriginal + 1e-9) === 1 ? '' : 's') + ' del final' : 'adelanta el final') : 'cuota → ' + txt(x.x.cuotaNueva, mon)) + '</span></span></button>';
        }
        return '<div class="item" style="cursor:default"><span class="ico">' + ico('calendario') + '</span><span class="cuerpo"><span class="nombre" style="display:block">Cuota ' + x.f.n + ' de ' + t.meses + '</span>' +
          '<span class="det" style="display:block">' + mesCorto(x.f.fecha) + ' · en el estado de cuenta</span></span><span class="monto"><b style="display:block">' + din(fija ? e.cuotaOriginal : x.f.cuota, mon) + '</b></span></div>';
      }).join('') +
        (total > hist.length ? '<button class="item" style="justify-content:center;color:var(--acento);font-weight:700" onclick="App.tcVerTodo()">Ver ' + (total - hist.length) + ' más</button>' : '') + '</div>';
    }
    h += '<div class="suave chico" style="text-align:center">Tocá un abono para editarlo o borrarlo. Las cuotas salen solas del plan.</div>';
    $('p-tcdetalle').innerHTML = h;
  }

  // ---- formulario de abono: tcFila (compra), abFila (abono existente), movFila (pago de tarjeta del que sale)
  var abCtx = null;
  function formAbonoTC(tcFila, abFila, movFila) {
    var mov = movFila ? D.movimientos.filter(function (m) { return m.fila === movFila; })[0] : null;
    var opcionesTC = D.tasaCero.filter(function (t) { return C.estadoTasaCero(t, hoy).saldo > 0 || t.fila === tcFila; });
    if (mov && !tcFila) {
      var misma = opcionesTC.filter(function (t) { return t.tarjeta === mov.cuenta; });
      if (misma.length) opcionesTC = misma.concat(opcionesTC.filter(function (t) { return t.tarjeta !== mov.cuenta; }));
    }
    var t = tcFila ? tcPorFila(tcFila) : opcionesTC[0];
    if (!t) return toast('No hay compras a tasa cero con saldo pendiente.');
    var ab = abFila ? (t.abonos || []).filter(function (a) { return a.fila === abFila; })[0] : null;
    abCtx = { tcFila: t.fila, abFila: abFila || 0, movFila: ab ? ab.movimiento : (movFila || null), mov: mov };
    var sobrantes = D.sobres.filter(function (s) { return s.tipo !== 'Fijo' && s.nombre !== (D.sobreEspecial || {}).tasaCero; }).map(function (s) { return 'Sobrante del sobre ' + s.nombre; });
    var origenes = sobrantes.concat(['Venta de algo', 'Aguinaldo o extra', 'Otro']);
    if (ab && ab.origen && origenes.indexOf(ab.origen) < 0) origenes.unshift(ab.origen);
    var h = '<h2>' + (ab ? 'Abono a ' : 'Abono extra a ') + '<span id="ab-nombre">' + esc(t.descripcion) + '</span></h2>';
    if (!tcFila) {
      h += '<label class="campo"><span>Compra</span><select id="ab-compra" onchange="App.abonoCompra(this.value)">' + opcionesTC.map(function (x) {
        return '<option value="' + x.fila + '"' + (x.fila === t.fila ? ' selected' : '') + '>' + esc(x.descripcion) + ' · falta ' + esc(txt(C.estadoTasaCero(x, hoy).saldo, x.moneda)) + '</option>';
      }).join('') + '</select></label>';
    }
    h += '<div class="suave chico" id="ab-info"></div>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Monto del abono</span><input id="ab-monto" data-dinero class="monto" inputmode="decimal" placeholder="0" oninput="App.abonoVista()" value="' + (ab ? esc(String(ab.monto).replace('.', ',')) : '') + '"></label>' +
      '<label class="campo compacto"><span>Fecha</span><input id="ab-fecha" type="date" onchange="App.abonoVista()" value="' + localInput(ab ? ab.fecha : (mov ? mov.fecha : new Date().toISOString())) + '"></label></div>' +
      '<div class="chips" id="ab-chips" style="margin-top:10px"></div>' +
      '<label class="campo compacto"><span>¿De dónde salió? (opcional)</span><select id="ab-origen">' + opciones(origenes, ab ? ab.origen : '', '—') + '</select></label>' +
      '<label class="campo compacto"><span>Nota</span><input id="ab-nota" value="' + esc(ab ? ab.nota : '') + '" placeholder="Opcional"></label>' +
      '<div class="caja" id="ab-vista" style="margin-top:12px;background:var(--fondo);gap:6px"></div>' +
      '<label class="check"><input type="checkbox" id="ab-gasto"' + (!ab || ab.gasto !== false ? ' checked' : '') + '> Contarlo como gasto del mes</label>' +
      (abCtx.movFila ? '<div class="suave chico" style="margin-top:8px">Sale del pago de tarjeta' + (mov ? ' de ' + esc(txt(mov.monto, mov.moneda)) + ' del ' + fechaCorta(mov.fecha) : '') + '. El resto queda como pago normal.</div>' : '') +
      '<div class="acciones"><button class="btn" id="ab-ok" onclick="App.guardarAbonoTC()">Guardar abono</button>' +
      (ab ? '<button class="btn peligro" id="ab-borrar" onclick="App.borrarAbonoTC()">Eliminar abono</button>' : '') +
      '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    abrir(h);
    abonoVista();
  }
  function abonoCompra(f) { abCtx.tcFila = Number(f); $('ab-nombre').textContent = tcPorFila(abCtx.tcFila).descripcion; abonoVista(); }
  /** La compra sin el abono que se está editando (para calcular la vista previa). */
  function tcSinEsteAbono() {
    var t = JSON.parse(JSON.stringify(tcPorFila(abCtx.tcFila)));
    t.abonos = (t.abonos || []).filter(function (a) { return a.fila !== abCtx.abFila; });
    return t;
  }
  function abonoVista() {
    formatearMontos();
    var t = tcSinEsteAbono(), mon = t.moneda, e = C.estadoTasaCero(t, hoy);
    var monto = C.leerNumero(val('ab-monto')) || 0;
    $('ab-info').textContent = 'Falta ' + txt(e.saldo, mon) + ' · ' + (e.restantes ? 'quedan ' + e.restantes + ' cuota' + (e.restantes === 1 ? '' : 's') + ' de ' + txt(e.cuota, mon) : 'sin cuotas pendientes');
    var r = function (n) { return String(Math.round(n * 100) / 100).replace('.', ','); };
    $('ab-chips').innerHTML = [[e.cuota, txt(e.cuota, mon)], [e.cuota * 2, txt(e.cuota * 2, mon)], [e.saldo, 'Pagar todo']].filter(function (c, i) { return i === 2 || c[0] < e.saldo; }).map(function (c) {
      return '<button class="chip' + (Math.abs(monto - c[0]) < 0.01 ? ' on' : '') + '" onclick="document.getElementById(\'ab-monto\').value=\'' + r(c[0]) + '\';App.abonoVista()">' + esc(c[1]) + '</button>';
    }).join('');
    if (!monto) { $('ab-vista').innerHTML = '<div class="suave chico">Escribí el monto para ver cómo queda la cuota.</div>'; return; }
    var fecha = val('ab-fecha') ? new Date(val('ab-fecha') + 'T12:00') : new Date();
    var sim = JSON.parse(JSON.stringify(t)); sim.abonos = (sim.abonos || []).concat([{ fecha: fecha.toISOString(), monto: monto }]);
    var ref = fecha > hoy ? fecha : hoy;
    var e0 = C.estadoTasaCero(t, ref), e1 = C.estadoTasaCero(sim, ref);
    if (monto > e0.saldo + 0.01) {
      $('ab-vista').innerHTML = '<div class="naranja fuerte chico">El abono es mayor que lo que falta (' + esc(txt(e0.saldo, mon)) + ').</div>'; return;
    }
    $('ab-vista').innerHTML = e1.saldo <= 0
      ? '<div class="fila"><span>Con este abono</span><b style="color:var(--positivo)">¡Queda pagada! 🎉</b></div><div class="suave chico">No se cobran más cuotas. Si la tarjeta queda con saldo a favor, pedí al banco la cancelación anticipada.</div>'
      : '<div class="fila chico"><span class="suave">Cuota ahora</span><s class="suave">' + din(e0.cuota, mon) + '</s></div>' +
        '<div class="fila"><span>Cuota nueva (desde la próxima)</span><b style="color:var(--acento);font-size:18px">' + din(e1.cuota, mon) + '</b></div>' +
        '<div class="fila chico"><span class="suave">Cuotas que faltan</span><span>' + e1.restantes + ' (el plazo no cambia)</span></div>' +
        '<div class="fila chico"><span class="suave">Falta después del abono</span><span>' + din(e1.saldo, mon) + '</span></div>';
  }
  function guardarAbonoTC() {
    var t = tcPorFila(abCtx.tcFila), e = C.estadoTasaCero(tcSinEsteAbono(), hoy);
    var monto = C.leerNumero(val('ab-monto'));
    if (!monto || monto <= 0) return toast('Escribí el monto del abono.');
    if (monto > e.saldo + 0.01) return toast('El abono es mayor que lo que falta (' + txt(e.saldo, t.moneda) + ').');
    if (!val('ab-fecha')) return toast('Falta la fecha.');
    if (abCtx.mov) {
      var usado = 0;
      D.tasaCero.forEach(function (x) { (x.abonos || []).forEach(function (a) { if (a.movimiento === abCtx.movFila && a.fila !== abCtx.abFila) usado += a.monto; }); });
      if (monto + usado > abCtx.mov.monto + 0.01) return toast('El abono no puede ser mayor que el pago (' + txt(abCtx.mov.monto - usado, abCtx.mov.moneda) + ' disponibles).');
    }
    var orig = abCtx.abFila ? (t.abonos || []).filter(function (a) { return a.fila === abCtx.abFila; })[0] : null;
    var a = {
      fila: abCtx.abFila || null, control: orig ? { monto: orig.monto } : null,
      fecha: desdeInput(val('ab-fecha')), compra: t.descripcion, tarjeta: t.tarjeta, monto: monto, moneda: t.moneda,
      origen: val('ab-origen'), gasto: $('ab-gasto').checked, movimiento: abCtx.movFila || '', nota: val('ab-nota').trim()
    };
    encolar('guardarAbonoTC', [a], 'Abono a ' + t.descripcion + ' · ' + txt(monto, t.moneda));
    hecho(e.saldo - monto <= 0.01 ? '🎉 ¡' + t.descripcion + ' quedó pagada!' : '✅ Abono guardado. La cuota se recalculó.');
  }
  function borrarAbonoTC() {
    var b = $('ab-borrar');
    if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Tocá otra vez'; return; }
    var t = tcPorFila(abCtx.tcFila);
    var orig = (t.abonos || []).filter(function (a) { return a.fila === abCtx.abFila; })[0];
    srv('eliminarAbonoTC', [abCtx.abFila, { monto: orig.monto }], function () { listo('Abono eliminado'); }, b);
  }
  /** Bloque que se muestra dentro de un "Pago de tarjeta". */
  function bloqueAbonosDePago(m) {
    var ligados = [];
    D.tasaCero.forEach(function (t) { (t.abonos || []).forEach(function (a) { if (a.movimiento === m.fila) ligados.push({ t: t, a: a }); }); });
    var hayActivas = D.tasaCero.some(function (t) { return C.estadoTasaCero(t, hoy).saldo > 0; });
    if (!ligados.length && !hayActivas) return '';
    var h = '<div class="caja" style="margin-top:14px;background:var(--fondo);gap:8px"><b style="font-size:14px">¿Parte de este pago fue abono a una tasa cero?</b>';
    ligados.forEach(function (x) {
      h += '<div class="fila chico"><span>' + esc(x.t.descripcion) + '</span><a href="#" style="color:var(--acento);font-weight:700;text-decoration:none" onclick="App.formAbonoTC(' + x.t.fila + ',' + x.a.fila + ');return false">' + esc(txt(x.a.monto, x.t.moneda)) + ' ✎</a></div>';
    });
    if (hayActivas) h += '<button class="btn sec chico" style="justify-content:center" onclick="App.formAbonoTC(0,0,' + m.fila + ')">' + (ligados.length ? 'Agregar otro abono' : 'Aplicar abono') + '</button>';
    return h + '</div>';
  }

  // ------------------------------------------------------------ REPORTES
  var COLORES_CAT = ['#F5B82E', '#3D8BFD', '#3DD68C', '#FF8A3D', '#B57BFF', '#FF6B9A', '#4FD1E0', '#9AA1AB'];
  function pReportes(res) {
    var h = cabMes('Reportes');
    ['CRC', 'USD'].forEach(function (mon) {
      var total = res.gastos[mon];
      if (!total && mon === 'USD') return;
      var cats = Object.keys(res.porCategoria).map(function (k) { return [k, res.porCategoria[k][mon]]; })
        .filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
      h += '<div class="caja"><div class="fila"><h3>Gastos por categoría ' + (mon === 'USD' ? '($)' : '(₡)') + '</h3><b>' + din(total, mon) + '</b></div>';
      if (!cats.length) h += '<div class="suave">Sin gastos este mes.</div>';
      else {
        h += '<div class="apilada" role="img" aria-label="Reparto de gastos por categoría">' + cats.map(function (x, i) {
          return '<i style="width:' + (x[1] / total * 100).toFixed(1) + '%;background:' + COLORES_CAT[i % COLORES_CAT.length] + '"></i>';
        }).join('') + '</div>';
        h += cats.map(function (x, i) {
          return '<div class="fila" style="font-size:14px"><span><span class="punto" style="background:' + COLORES_CAT[i % COLORES_CAT.length] + '"></span>' + esc(x[0]) + '</span>' +
            '<span>' + din(x[1], mon) + ' <span class="suave chico">' + Math.round(x[1] / total * 100) + '%</span></span></div>';
        }).join('');
      }
      h += '</div>';
    });
    var porTarjeta = Object.keys(res.porCuenta).map(function (k) { return [k, res.porCuenta[k]]; }).filter(function (x) { return x[1].CRC || x[1].USD; });
    if (porTarjeta.length) {
      h += '<div class="caja"><h3>Por tarjeta o cuenta</h3>' + porTarjeta.map(function (x) {
        return '<div class="fila" style="font-size:14px"><span>' + esc(etiquetaCuenta(x[0])) + '</span><b>' + [x[1].CRC ? din(x[1].CRC, 'CRC') : '', x[1].USD ? din(x[1].USD, 'USD') : ''].filter(String).join(' + ') + '</b></div>';
      }).join('') + '</div>';
    }
    h += '<button class="btn sec" onclick="App.exportarCSV()">Exportar movimientos del mes (Excel)</button>';
    $('p-reportes').innerHTML = h;
  }

  // ------------------------------------------------------------ PATRIMONIO
  function pPatrimonio() {
    var h = cabSimple('Patrimonio', 'Según el saldo de cada cuenta');
    var act = { CRC: 0, USD: 0 }, deu = { CRC: 0, USD: 0 };
    var filasA = [], filasD = [];
    D.cuentas.forEach(function (c) {
      if (!c.activa) return;
      var crc = c.saldoCRC || 0, usd = c.saldoUSD || 0;
      if (c.tipo === 'Préstamo' && D.prestamo && D.prestamo.saldo && !crc) crc = D.prestamo.saldo;
      if (c.tipo === 'Tarjeta de crédito') { var dtp = C.deudaTarjeta(D, c); crc = Math.max(0, dtp.CRC); usd = Math.max(0, dtp.USD); }
      if (!crc && !usd) return;
      var txtS = [crc ? din(crc, 'CRC') : '', usd ? din(usd, 'USD') : ''].filter(String).join(' + ');
      var linea = '<div class="fila" style="font-size:14px"><span>' + esc(c.nombre) + '<br><span class="suave chico">' + esc(c.tipo) + '</span></span><b>' + txtS + '</b></div>';
      if (c.tipo === 'Cuenta de ahorro' || c.tipo === 'Inversión') { act.CRC += crc; act.USD += usd; filasA.push(linea); }
      else { deu.CRC += crc; deu.USD += usd; filasD.push(linea); }
    });
    if (D.fondos) FD().lista.forEach(function (f) {
      if (!f.saldo) return;
      act[f.moneda === 'USD' ? 'USD' : 'CRC'] += f.saldo;
      filasA.push('<div class="fila" style="font-size:14px"><span>' + esc(f.nombre) + '<br><span class="suave chico">Fondo · ' + esc(f.fondo || 'BCR SAFI') + '</span></span><b>' + din(f.saldo, f.moneda) + '</b></div>');
    });
    var tc = D.tipoCambio || 0;
    var neto = (act.CRC - deu.CRC) + (act.USD - deu.USD) * tc;
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">Patrimonio neto (todo en colones)</span>' + botonOjo() + '</div>' +
      '<div class="grande' + (neto < 0 ? ' rojo' : '') + '">' + din(neto, 'CRC') + '</div>' +
      '<div class="et">Dólares convertidos a ' + txt(tc, 'CRC') + ' (tipo de cambio en Config). No incluye el valor de tu casa ni de otros bienes.</div></div>';
    h += plegable('pa-act', 'Ahorros e inversiones', '<b class="verde-pos">' + din(act.CRC, 'CRC') + (act.USD ? ' + ' + din(act.USD, 'USD') : '') + '</b>', '<div class="lista-pl">' + (filasA.join('') || '<div class="suave">Sin saldos registrados.</div>') + '</div>');
    h += plegable('pa-deu', 'Deudas', '<b class="rojo">' + din(deu.CRC, 'CRC') + (deu.USD ? ' + ' + din(deu.USD, 'USD') : '') + '</b>', '<div class="lista-pl">' + (filasD.join('') || '<div class="suave">Sin deudas registradas.</div>') + '</div>');
    h += '<div class="suave chico" style="text-align:center">Los saldos se actualizan en Tarjetas (tocando cada cuenta) o en la pestaña Cuentas de la hoja.</div>';
    $('p-patrimonio').innerHTML = h;
  }

  // ------------------------------------------------------------ CALCULADORA DE PRÉSTAMOS
  // la calculadora es para simular (también para otras personas): nunca oculta montos
  function dk(n, m, dec) { return '<span class="m">' + C.dinero(n, m, dec) + '</span>'; }
  function leerJSON(k, def) { try { var v = JSON.parse(guardado(k, 'null')); return v || def; } catch (e) { return def; } }
  var CALC_VACIA = { para: '', concepto: '', monto: '', moneda: 'CRC', plazo: '', plazoU: 'meses', tasa: '', tasaU: 'anual', pol: '', polT: 'fijo', com: '', comT: 'fijo', fecha: '', tipo: 'fija',
    clase: '', tasaModo: 'fija', tbp: '', margen: '', tasaOk: false };
  var calc = Object.assign(JSON.parse(JSON.stringify(CALC_VACIA)), leerJSON('mf-calc', {}));
  var calcVista = 'datos', calcConservar = false;
  var calcAbono = { monto: '', frecuencia: 'mensual', mes: '12', modo: 'plazo' };
  /** v2.1: la calculadora se abre limpia cada vez que se entra (las simulaciones guardadas se mantienen) */
  function limpiarCalc() {
    calc = JSON.parse(JSON.stringify(CALC_VACIA));
    calcAbono = { monto: '', frecuencia: 'mensual', mes: '12', modo: 'plazo' };
    guardar('mf-calc', JSON.stringify(calc));
  }
  function botonLimpiar() { return '<button class="btn-limpiar" onclick="App.limpiarCalc()">🧹 Limpiar</button>'; }
  var CLASES = [['casa', '🏠 Casa', 'Préstamo de casa', '30', 'anios'], ['personal', '👤 Personal', 'Préstamo personal', '5', 'anios'], ['carro', '🚗 Carro', 'Préstamo de carro', '8', 'anios'], ['otro', '✏ Otro', '', '', 'meses']];
  function claseCalc(k) {
    leerFormCalc();
    var c = CLASES.filter(function (x) { return x[0] === k; })[0]; if (!c) return;
    var antes = CLASES.filter(function (x) { return x[0] === calc.clase; })[0];
    calc.clase = k;
    if (!calc.concepto || (antes && calc.concepto === antes[2])) calc.concepto = c[2];
    if (c[3] && (!calc.plazo || (antes && calc.plazo === antes[3]))) { calc.plazo = c[3]; calc.plazoU = c[4]; }
    calc.tasaModo = k === 'casa' ? (calc.tasaModo || 'fija') : 'fija';
    guardar('mf-calc', JSON.stringify(calc)); pintar();
  }
  function tasaAnualCalc() {
    if (calc.tasaModo === 'tbp') return (C.leerNumero(calc.tbp) || 0) + (C.leerNumero(calc.margen) || 0);
    var t = C.leerNumero(calc.tasa);
    if (t === null) return null;
    return calc.tasaU === 'mensual' ? t * 12 : t;
  }
  function pctTxt(n, dec) { return String((Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec)).toFixed(dec)).replace('.', ',').replace(/,0+$/, '').replace(/(,\d*?)0+$/, '$1'); }
  /** Texto de ayuda bajo la tasa y aviso si la tasa "al mes" parece un error */
  function ayudaTasa() {
    var t = calc.tasaModo === 'tbp' ? null : C.leerNumero(calc.tasa);
    if (calc.tasaModo === 'tbp') { var s = tasaAnualCalc(); return '<div class="ayuda-tasa">= <b>' + pctTxt(s, 2) + '% al año</b> · ' + pctTxt(s / 12, 3) + '% por mes</div>'; }
    if (t === null || !(t > 0)) return '<div class="ayuda-tasa">Los bancos dan la tasa <b>al año</b> y la dividen entre 12 para cada mes.</div>';
    if (calc.tasaU === 'mensual') {
      var h = '<div class="ayuda-tasa">= <b>' + pctTxt(t * 12, 2) + '% al año</b></div>';
      if (t > 3 && !calc.tasaOk) h += '<div class="aviso-tasa">⚠️ <b>' + pctTxt(t, 2) + '% al mes = ' + pctTxt(t * 12, 2) + '% al año.</b> Los bancos casi siempre dan la tasa <b>anual</b>.' +
        '<div class="chips" style="margin-top:8px"><button class="chip on" onclick="App.calcSet(\'tasaU\',\'anual\')">Usar ' + pctTxt(t, 2) + '% al año</button><button class="chip" onclick="App.calcSet(\'tasaOk\',true)">Sí, es al mes</button></div></div>';
      return h;
    }
    return '<div class="ayuda-tasa">= <b>' + pctTxt(t / 12, 3) + '% por mes</b> · así lo calculan los bancos (anual ÷ 12)</div>';
  }
  function alEscribirTasa() { leerFormCalc(); calc.tasaOk = false; var e = $('k-tasa-ayuda'); if (e) e.innerHTML = ayudaTasa(); }
  /** v2.1: gráfico "Cuánto debés con el tiempo" (una o dos líneas de saldo) */
  function graficoSaldo(series, mon) {
    var W = 340, H = 170, X0 = 40, X1 = W - 8, Y0 = 10, Y1 = 140;
    var n = Math.max.apply(null, series.map(function (s) { return s.filas.length; })), M = series[0].monto || 1;
    var x = function (k) { return X0 + (X1 - X0) * k / n; }, y = function (v) { return Y1 - (Y1 - Y0) * Math.max(0, v) / M; };
    var corto = function (v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '').replace('.', ',') + 'M' : v >= 1000 ? Math.round(v / 1000) + 'k' : String(Math.round(v)); };
    var g = '<svg viewBox="0 0 ' + W + ' ' + (H + 4) + '" style="width:100%;display:block" role="img" aria-label="Saldo del préstamo con el tiempo">';
    [0, M / 2, M].forEach(function (v) {
      g += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '" stroke="var(--borde)"/><text x="' + (X0 - 6) + '" y="' + (y(v) + 3).toFixed(1) + '" fill="var(--suave)" font-size="10" text-anchor="end">' + (mon === 'USD' ? '$' : '') + corto(v) + '</text>';
    });
    var anios = n / 12, paso = anios > 20 ? 10 : anios > 8 ? 5 : anios > 3 ? 1 : 0;
    if (paso) for (var a2 = 0; a2 <= anios + 0.001; a2 += paso) g += '<text x="' + x(a2 * 12).toFixed(1) + '" y="' + (H - 4) + '" fill="var(--suave)" font-size="10" text-anchor="middle">' + (a2 ? a2 + ' a' : 'hoy') + '</text>';
    else for (var m2 = 0; m2 <= n; m2 += Math.max(1, Math.ceil(n / 6))) g += '<text x="' + x(m2).toFixed(1) + '" y="' + (H - 4) + '" fill="var(--suave)" font-size="10" text-anchor="middle">' + (m2 ? m2 + ' m' : 'hoy') + '</text>';
    series.forEach(function (s) {
      var d = 'M' + x(0).toFixed(1) + ' ' + y(s.monto).toFixed(1) + s.filas.map(function (f) { return ' L' + x(f.n).toFixed(1) + ' ' + y(f.saldo).toFixed(1); }).join('');
      g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="3" stroke-linejoin="round"/>';
    });
    return g + '</svg>' + (series.length > 1 ? '<div class="leyenda" style="grid-template-columns:none;display:flex;flex-wrap:wrap;gap:4px 14px">' + series.map(function (s) {
      return '<div><span class="punto" style="background:' + s.color + '"></span>' + s.nombre + '</div>';
    }).join('') + '</div>' : '');
  }

  function leerFormCalc() {
    if (!$('k-monto')) return;
    ['para', 'concepto', 'monto', 'plazo', 'tasa', 'pol', 'com', 'fecha', 'tbp', 'margen'].forEach(function (c) { if ($('k-' + c)) calc[c] = val('k-' + c); });
    calc.moneda = val('k-moneda') || 'CRC';
    guardar('mf-calc', JSON.stringify(calc));
  }
  function leerFormAbono() {
    if (!$('a-monto')) return;
    calcAbono.monto = val('a-monto'); calcAbono.frecuencia = val('a-frec'); calcAbono.mes = val('a-mes') || calcAbono.mes;
  }
  function calcSet(campo, valor) {
    leerFormCalc(); leerFormAbono();
    if (campo.indexOf('abono.') === 0) calcAbono[campo.slice(6)] = valor; else calc[campo] = valor;
    if (campo === 'tasaU') calc.tasaOk = false;
    guardar('mf-calc', JSON.stringify(calc)); pintar();
  }

  /** Parámetros para el motor a partir de lo que escribió la persona. Devuelve null y avisa si falta algo. */
  function parametrosCalc(conAbono) {
    var monto = C.leerNumero(calc.monto), plazo = C.leerNumero(calc.plazo), tasa = calc.tasaModo === 'tbp' ? tasaAnualCalc() : C.leerNumero(calc.tasa);
    if (!monto || monto <= 0) { toast('Escribí el monto del préstamo.'); return null; }
    if (!plazo || plazo <= 0) { toast('Escribí el plazo.'); return null; }
    if (tasa === null || tasa < 0) { toast('Escribí la tasa de interés (puede ser 0).'); return null; }
    var meses = Math.round(calc.plazoU === 'anios' ? plazo * 12 : plazo);
    if (meses > 600) { toast('El plazo máximo es de 50 años.'); return null; }
    var pol = C.leerNumero(calc.pol) || 0;
    var p = {
      monto: monto, plazo: meses, tasaMensual: calc.tasaModo !== 'tbp' && calc.tasaU === 'mensual' ? tasa / 100 : tasa / 100 / 12,
      tipo: calc.tipo, poliza: { monto: calc.polT === 'pct' ? pol / 100 : pol, tipo: calc.polT },
      comision: calc.comT === 'pct' ? Math.round(monto * (C.leerNumero(calc.com) || 0)) / 100 : (C.leerNumero(calc.com) || 0), primerPago: calc.fecha ? new Date(calc.fecha + 'T12:00') : C.sumarMeses(new Date(new Date().setHours(12, 0, 0, 0)), 1)
    };
    if (conAbono) {
      var am = C.leerNumero(calcAbono.monto);
      if (am > 0) p.abono = { monto: am, frecuencia: calcAbono.frecuencia, mes: C.leerNumero(calcAbono.mes) || 1, modo: calcAbono.modo };
    }
    return p;
  }
  function textosCalc(p) {
    var t = C.leerNumero(calc.tasa) || 0;
    return {
      tasaTexto: calc.tasaModo === 'tbp' ? 'TBP ' + pctTxt(C.leerNumero(calc.tbp) || 0, 2) + '% + ' + pctTxt(C.leerNumero(calc.margen) || 0, 2) + '% = ' + String(tasaAnualCalc().toFixed(2)).replace('.', ',') + '% anual'
        : String(t.toFixed(2)).replace('.', ',') + '% ' + (calc.tasaU === 'mensual' ? 'mensual' : 'anual'),
      polizaTexto: !p.poliza.monto ? 'Sin pólizas' : calc.polT === 'pct' ? String(calc.pol).replace('.', ',') + '% del saldo' : C.dinero(p.poliza.monto, calc.moneda) + '/mes',
      tipoTexto: calc.tipo === 'decreciente' ? 'Cuota decreciente' : 'Cuota fija'
    };
  }

  function pCalc() {
    if (calcVista === 'resultado' || calcVista === 'ysi') {
      var p = parametrosCalc(false);
      if (!p) { calcVista = 'datos'; } else return calcVista === 'ysi' ? pCalcYSi(p) : pCalcResultado(p);
    }
    var seg = function (campo, opciones) {
      return '<div class="seg">' + opciones.map(function (o) {
        return '<button class="' + (calc[campo] === o[0] ? 'on' : '') + '" onclick="App.calcSet(\'' + campo + '\',\'' + o[0] + '\')">' + o[1] + '</button>';
      }).join('') + '</div>';
    };
    var h = cabSimple('Calculadora', 'Préstamos', null, botonLimpiar());
    h += '<div class="suave chico" style="margin-bottom:-6px">¿Qué tipo de préstamo?</div><div class="chips">' + CLASES.map(function (c) {
      return '<button class="chip' + (calc.clase === c[0] ? ' on' : '') + '" onclick="App.claseCalc(\'' + c[0] + '\')">' + c[1] + '</button>';
    }).join('') + '</div>';
    if (D.prestamo && D.prestamo.saldo) h += '<button class="btn borde" onclick="App.usarCasa()">' + ico('casa') + 'Usar mi préstamo de casa</button>';
    h += '<div class="caja" style="gap:0">' +
      '<div class="dos-campos"><label class="campo compacto"><span>Para (nombre)</span><input id="k-para" value="' + esc(calc.para) + '" placeholder="Opcional"></label>' +
      '<label class="campo compacto"><span>Concepto</span><input id="k-concepto" value="' + esc(calc.concepto) + '" placeholder="Ej. Carro nuevo"></label></div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Monto del préstamo</span><input id="k-monto" data-dinero class="monto" inputmode="decimal" value="' + esc(calc.monto) + '" placeholder="0"></label>' +
      '<label class="campo compacto"><span>Moneda</span><select id="k-moneda"><option value="CRC"' + (calc.moneda === 'CRC' ? ' selected' : '') + '>₡</option><option value="USD"' + (calc.moneda === 'USD' ? ' selected' : '') + '>$</option></select></label></div>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Plazo</span><input id="k-plazo" inputmode="numeric" value="' + esc(calc.plazo) + '" placeholder="60"></label>' +
      '<div class="campo compacto"><span>&nbsp;</span>' + seg('plazoU', [['meses', 'Meses'], ['anios', 'Años']]) + '</div></div>' +
      (calc.clase === 'casa' || calc.clase === 'otro' || calc.tasaModo === 'tbp' ? '<div class="campo compacto"><span>Tasa</span>' + seg('tasaModo', [['fija', 'Tasa fija'], ['tbp', 'TBP + margen']]) + '</div>' : '') +
      (calc.tasaModo === 'tbp'
        ? '<div class="dos-campos"><label class="campo compacto"><span>TBP (% al año)</span><input id="k-tbp" inputmode="decimal" value="' + esc(calc.tbp) + '" placeholder="3,56" oninput="App.alEscribirTasa()"></label>' +
          '<label class="campo compacto"><span>Margen del banco (%)</span><input id="k-margen" inputmode="decimal" value="' + esc(calc.margen) + '" placeholder="3" oninput="App.alEscribirTasa()"></label></div>'
        : '<div class="dos-campos"><label class="campo compacto"><span>Tasa de interés (%)</span><input id="k-tasa" inputmode="decimal" value="' + esc(calc.tasa) + '" placeholder="9,5" oninput="App.alEscribirTasa()"></label>' +
          '<div class="campo compacto"><span>&nbsp;</span>' + seg('tasaU', [['anual', '% al año'], ['mensual', '% al mes']]) + '</div></div>') +
      '<div id="k-tasa-ayuda">' + ayudaTasa() + '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:8px;align-items:end"><label class="campo compacto"><span>Pólizas y seguros (opcional)</span><input id="k-pol" data-dinero inputmode="decimal" value="' + esc(calc.pol) + '" placeholder="0"></label>' +
      '<div style="margin-top:10px">' + seg('polT', [['fijo', 'Monto'], ['pct', '% saldo']]) + '</div></div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:8px;align-items:end"><label class="campo compacto"><span>Comisión de formalización (una vez)</span><input id="k-com" ' + (calc.comT === 'pct' ? '' : 'data-dinero ') + 'inputmode="decimal" value="' + esc(calc.com) + '" placeholder="' + (calc.comT === 'pct' ? '1,5' : '0') + '"></label>' +
      '<div style="margin-top:10px">' + seg('comT', [['fijo', 'Monto'], ['pct', '%']]) + '</div></div>' +
      '<label class="campo compacto"><span>Primer pago</span><input id="k-fecha" type="date" value="' + esc(calc.fecha) + '"></label>' +
      '<div class="campo compacto"><span>Tipo de cuota</span>' + seg('tipo', [['fija', 'Fija (nivelada)'], ['decreciente', 'Decreciente']]) + '</div>' +
      '<button class="btn" style="margin-top:16px" onclick="App.calcular()">Calcular</button></div>';

    var sims = leerJSON('mf-sims', []);
    if (sims.length) {
      h += '<div class="seccion-t">SIMULACIONES GUARDADAS</div><div class="sim-lista">' + sims.map(function (s, i) {
        return '<div class="sim" role="button" tabindex="0" onclick="App.cargarSim(' + i + ')"><b>' + esc(s.calc.concepto || 'Sin nombre') + '</b><span>' +
          (s.calc.para ? esc(s.calc.para) + ' · ' : '') + txt(s.cuota, s.calc.moneda) + '/mes · ' + s.meses + ' m</span>' +
          '<button class="x" aria-label="Borrar simulación" onclick="event.stopPropagation();App.borrarSim(' + i + ')">×</button></div>';
      }).join('') + '</div>';
    }
    h += '<div class="suave chico" style="text-align:center">Los cálculos son estimados. El banco puede calcular por días o cambiar la tasa.</div>';
    $('p-calculadora').innerHTML = h;
  }

  function calcular() { leerFormCalc(); if (parametrosCalc(false)) { calcVista = 'resultado'; window.scrollTo(0, 0); pintar(); } }
  function verDatos() { calcVista = 'datos'; window.scrollTo(0, 0); pintar(); }
  function verYSi() { calcVista = 'ysi'; window.scrollTo(0, 0); pintar(); }

  function resumenCalc(r, mon) {
    var tot = r.totalPagado - r.comision || 1;
    var pc = (Number(C.leerNumero(calc.monto)) / tot * 100), pi = r.totalIntereses / tot * 100, pp = r.totalPolizas / tot * 100;
    return '<div class="caja"><div class="fila" style="align-items:flex-end"><div><div class="suave chico" style="font-weight:600">Cuota mensual' + (r.totalPolizas ? ' con pólizas' : '') + '</div>' +
      '<div class="cifra-g">' + dk(r.cuotaConPoliza, mon, true) + '</div></div>' +
      (r.totalPolizas ? '<div class="suave chico" style="text-align:right">' + dk(r.cuota, mon, true) + ' cuota<br>+ ' + dk(r.filas[0].poliza, mon) + ' pólizas</div>' : '') + '</div>' +
      (calc.tipo === 'decreciente' ? '<div class="suave chico">Baja cada mes hasta ' + dk(r.ultimaCuota + (r.filas[r.filas.length - 1].poliza || 0), mon) + '</div>' : '') +
      '<div class="apilada" role="img" aria-label="Del total: capital ' + Math.round(pc) + '%, intereses ' + Math.round(pi) + '%, pólizas ' + Math.round(pp) + '%">' +
      '<i style="width:' + pc.toFixed(1) + '%;background:#3D8BFD"></i><i style="width:' + pi.toFixed(1) + '%;background:var(--acento)"></i><i style="width:' + pp.toFixed(1) + '%;background:var(--suave)"></i></div>' +
      '<div class="leyenda"><div><span class="punto" style="background:#3D8BFD"></span>Capital<b>' + dk(C.leerNumero(calc.monto), mon) + '</b></div>' +
      '<div><span class="punto" style="background:var(--acento)"></span>Intereses<b>' + dk(r.totalIntereses, mon) + '</b></div>' +
      '<div><span class="punto" style="background:var(--suave)"></span>Pólizas<b>' + dk(r.totalPolizas, mon) + '</b></div></div>' +
      (r.comision ? '<div class="fila chico"><span class="suave">Comisión de formalización</span><span>' + dk(r.comision, mon) + '</span></div>' : '') +
      '<div class="fila" style="border-top:1px solid var(--linea);padding-top:10px"><span class="suave">Total a pagar</span><b>' + dk(r.totalPagado, mon) + '</b></div></div>';
  }

  function pCalcResultado(p) {
    var r = C.amortizar(p), mon = calc.moneda;
    var t = textosCalc(p);
    var sub = [calc.para ? 'Para ' + calc.para : '', C.dinero(p.monto, mon), p.plazo + ' meses', t.tasaTexto].filter(String).join(' · ');
    var h = cabSimple(esc(calc.concepto || 'Resultado'), esc(sub), 'App.verDatos()', botonLimpiar());
    h += resumenCalc(r, mon);
    h += '<div class="rapidos" style="grid-template-columns:repeat(3,minmax(0,1fr))"><button class="principal" onclick="App.compartirPDF(false, this)">' + ico('compartir') + 'Compartir PDF</button>' +
      '<button onclick="App.verYSi()">' + ico('flechas') + '¿Y si…?</button><button onclick="App.guardarSim()">' + ico('guardar') + 'Guardar</button></div>';
    h += '<div class="caja"><div class="fila"><h3>Cuánto debés con el tiempo</h3><span class="suave chico">' + (r.meses >= 24 ? String((r.meses / 12).toFixed(1)).replace('.0', '').replace('.', ',') + ' años' : r.meses + ' meses') + '</span></div>' +
      graficoSaldo([{ filas: r.filas, monto: p.monto, color: 'var(--acento)', nombre: 'Saldo' }], mon) + '</div>';
    h += '<div class="caja"><div class="fila"><h3>Mes a mes</h3><span class="suave chico">' + r.meses + ' cuotas</span></div>' +
      '<div class="tabla-k mes-a-mes"><span class="h">#</span><span class="h d">Capital</span><span class="h d">Interés</span><span class="h d">Saldo</span>' +
      r.filas.map(function (f) {
        return '<span class="nf"><b>' + f.n + '</b>' + (f.fecha ? ' <span class="s">· ' + MESES_C[f.fecha.getMonth()] + ' ' + String(f.fecha.getFullYear()).slice(2) + '</span>' : '') + '</span>' +
          '<span class="d">' + dk(Math.round(f.capital), mon) + '</span><span class="d" style="color:var(--acento)">' + dk(Math.round(f.interes), mon) + '</span><span class="d fuerte">' + dk(Math.round(f.saldo), mon) + '</span>';
      }).join('') + '</div></div>';
    $('p-calculadora').innerHTML = h;
  }

  function pCalcYSi(p) {
    var mon = calc.moneda, base = C.amortizar(p);
    var h = cabSimple('¿Y si…?', esc(calc.concepto || 'Simulación'), 'App.calcVer(\'resultado\')', botonLimpiar());
    h += '<div class="caja" style="gap:6px"><div class="fila chico"><span class="suave">Hoy</span><span>' + dk(base.cuotaConPoliza, mon) + '/mes · ' + base.meses + ' cuotas</span></div>' +
      '<div class="fila chico"><span class="suave">Intereses por pagar</span><b style="color:var(--acento)">' + dk(base.totalIntereses, mon) + '</b></div></div>';

    // abono extra
    var conAb = parametrosCalc(true);
    h += '<div class="caja"><h3>Abono extra a capital</h3>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 140px;gap:8px"><label class="campo compacto" style="margin-top:0"><span>Monto</span><input id="a-monto" data-dinero inputmode="decimal" value="' + esc(calcAbono.monto) + '" placeholder="50.000"></label>' +
      '<label class="campo compacto" style="margin-top:0"><span>¿Cada cuánto?</span><select id="a-frec" onchange="App.calcSet(\'abono.frecuencia\', this.value)">' +
      [['mensual', 'Cada mes'], ['anual', 'Cada año'], ['unica', 'Una sola vez']].map(function (o) { return '<option value="' + o[0] + '"' + (calcAbono.frecuencia === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>' +
      (calcAbono.frecuencia === 'unica' ? '<label class="campo compacto"><span>¿En cuál cuota? (1 = la primera)</span><input id="a-mes" inputmode="numeric" value="' + esc(calcAbono.mes) + '"></label>' : '') +
      '<div class="seg" style="margin-top:4px"><button class="' + (calcAbono.modo === 'plazo' ? 'on' : '') + '" onclick="App.calcSet(\'abono.modo\',\'plazo\')">Bajar el plazo</button>' +
      '<button class="' + (calcAbono.modo === 'cuota' ? 'on' : '') + '" onclick="App.calcSet(\'abono.modo\',\'cuota\')">Bajar la cuota</button></div>' +
      '<button class="btn sec chico" style="justify-content:center" onclick="App.calcSet(\'abono.monto\', document.getElementById(\'a-monto\').value)">Calcular el ahorro</button>';
    if (conAb && conAb.abono) {
      var ra = C.amortizar(conAb);
      var ahorro = base.totalIntereses - ra.totalIntereses;
      var antes = base.meses - ra.meses;
      var despues = ra.filas.filter(function (f) { return f.abono > 0; })[0];
      var nuevaCuota = despues && ra.filas[despues.n] ? ra.filas[despues.n].cuota + ra.filas[despues.n].poliza : null;
      h += '<div class="bien-col">' +
        (calcAbono.modo === 'plazo'
          ? '<div class="bien"><div class="et">Terminás en</div><div class="v">' + ra.meses + ' cuotas</div><div class="et">' + (antes > 0 ? antes + ' cuotas antes' + (antes >= 12 ? ' (≈ ' + String((antes / 12).toFixed(1)).replace('.', ',').replace(',0', '') + ' años)' : '') : 'mismo plazo') + '</div></div>'
          : '<div class="bien"><div class="et">La cuota baja a</div><div class="v">' + (nuevaCuota ? dk(nuevaCuota, mon) : '—') + '</div><div class="et">después del abono</div></div>') +
        '<div class="bien"><div class="et">Te ahorrás</div><div class="v">' + dk(ahorro, mon) + '</div><div class="et">en intereses</div></div></div>' +
        '<div class="suave chico">Abonos en total: ' + dk(ra.totalAbonos, mon) + '</div>' +
        graficoSaldo([{ filas: base.filas, monto: p.monto, color: 'var(--suave)', nombre: 'Sin abonos' }, { filas: ra.filas, monto: p.monto, color: 'var(--acento)', nombre: 'Con abonos' }], mon) +
        '<button class="btn" onclick="App.compartirPDF(true, this)">Compartir PDF con este abono</button>';
    }
    h += '</div>';

    // fija vs decreciente
    var fija = C.amortizar(Object.assign({}, p, { tipo: 'fija' })), dec = C.amortizar(Object.assign({}, p, { tipo: 'decreciente' }));
    var pol0 = fija.filas[0].poliza, polU = fija.filas[fija.filas.length - 1].poliza;
    h += '<div class="caja"><h3>Cuota fija o decreciente</h3>' +
      '<div class="tabla-k" style="grid-template-columns:1.2fr 1fr 1fr"><span class="h"></span><span class="h d">Fija</span><span class="h d">Decreciente</span>' +
      '<span class="suave">Primera cuota</span><span class="d">' + dk(fija.cuota + pol0, mon) + '</span><span class="d">' + dk(dec.cuota + pol0, mon) + '</span>' +
      '<span class="suave">Última cuota</span><span class="d">' + dk(fija.ultimaCuota + polU, mon) + '</span><span class="d">' + dk(dec.ultimaCuota + polU, mon) + '</span>' +
      '<span class="suave">Intereses</span><span class="d">' + dk(fija.totalIntereses, mon) + '</span><span class="d verde fuerte">' + dk(dec.totalIntereses, mon) + '</span></div>' +
      '<div class="suave chico">La decreciente paga ' + dk(fija.totalIntereses - dec.totalIntereses, mon) + ' menos de intereses, pero empieza más alta.</div></div>';

    // si sube la tasa
    var anual = p.tasaMensual * 12 * 100;
    h += '<div class="caja"><h3>Si la tasa sube (tasa variable)</h3>' + [0, 1, 2].map(function (sube) {
      var r = C.amortizar(Object.assign({}, p, { tasaMensual: p.tasaMensual + sube / 100 / 12 }));
      var dif = r.cuotaConPoliza - base.cuotaConPoliza;
      return '<div class="fila" style="font-size:14px"><span class="suave">' + (sube ? '+' + sube + ' punto' + (sube > 1 ? 's' : '') + ' · ' : 'Hoy · ') + String((anual + sube).toFixed(2)).replace('.', ',') + '%</span>' +
        '<span class="' + (sube ? 'naranja fuerte' : '') + '">' + dk(r.cuotaConPoliza, mon) + (sube ? ' <span class="chico">(+' + dk(dif, mon) + ')</span>' : '') + '</span></div>';
    }).join('') + '</div>';
    $('p-calculadora').innerHTML = h;
  }

  function usarCasa() {
    var p = D.prestamo;
    calc = {
      para: '', concepto: 'Préstamo de casa', moneda: 'CRC',
      monto: String((Math.round(p.saldo * 100) / 100).toFixed(2)).replace('.', ','),
      plazo: String(p.restantes), plazoU: 'meses',
      tasa: String(((p.tasa || 0) * 100).toFixed(2)).replace('.', ','), tasaU: 'anual',
      pol: p.estimado && p.estimado.polizas ? String(Math.round(p.estimado.polizas * 100) / 100).replace('.', ',') : '', polT: 'fijo',
      com: '', fecha: p.proximoVenc ? localInput(p.proximoVenc) : '', tipo: 'fija', clase: 'casa', comT: 'fijo', tasaModo: 'fija', tbp: '', margen: '', tasaOk: false
    };
    guardar('mf-calc', JSON.stringify(calc));
    if (!calcAbono.monto) calcAbono.monto = '50.000';
    if (pantalla !== 'calculadora') { calcConservar = true; ir('calculadora'); }
    calcVista = 'ysi'; window.scrollTo(0, 0); pintar();
    toast('Cargado: saldo, cuotas y tasa de tu préstamo de casa');
  }

  function guardarSim() {
    var p = parametrosCalc(false); if (!p) return;
    var r = C.amortizar(p);
    var sims = leerJSON('mf-sims', []);
    sims.unshift({ calc: JSON.parse(JSON.stringify(calc)), cuota: r.cuotaConPoliza, meses: r.meses, fecha: new Date().toISOString() });
    guardar('mf-sims', JSON.stringify(sims.slice(0, 30)));
    toast('✅ Simulación guardada en este teléfono');
  }
  function cargarSim(i) {
    var s = leerJSON('mf-sims', [])[i]; if (!s) return;
    calc = Object.assign(JSON.parse(JSON.stringify(CALC_VACIA)), s.calc);
    guardar('mf-calc', JSON.stringify(calc));
    calcVista = 'resultado'; window.scrollTo(0, 0); pintar();
  }
  function borrarSim(i) {
    var sims = leerJSON('mf-sims', []); sims.splice(i, 1);
    guardar('mf-sims', JSON.stringify(sims)); pintar();
  }

  // PDF: se arma en el teléfono con pdf-lib (js/vendor) y se comparte por WhatsApp, correo, etc.
  var scriptsCargados = {};
  function cargarScript(src) {
    if (scriptsCargados[src]) return scriptsCargados[src];
    scriptsCargados[src] = new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function () { delete scriptsCargados[src]; mal(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
    return scriptsCargados[src];
  }
  function compartirPDF(conAbono, boton) {
    var p = parametrosCalc(conAbono); if (!p) return;
    if (boton) boton.disabled = true;
    toast('Preparando el PDF…', 8000);
    var r = C.amortizar(p), t = textosCalc(p);
    var datos = {
      para: calc.para.trim(), concepto: calc.concepto.trim(), moneda: calc.moneda, monto: p.monto, plazo: p.plazo,
      tasaTexto: t.tasaTexto, polizaTexto: t.polizaTexto, tipoTexto: t.tipoTexto, comision: p.comision, res: r,
      base: p.abono ? C.amortizar(Object.assign({}, p, { abono: null })) : null
    };
    Promise.all([
      cargarScript('js/vendor/pdf-lib.min.js'),
      fetch('icons/icono-192.png').then(function (x) { return x.arrayBuffer(); }).then(function (b) { return new Uint8Array(b); }).catch(function () { return null; })
    ]).then(function (v) {
      return PDFPrestamo.construir(window.PDFLib, datos, { preparadoPor: guardado('mf-preparado', ''), fecha: new Date(), logoPng: v[1] });
    }).then(function (bytes) {
      if (boton) boton.disabled = false;
      var nombre = PDFPrestamo.nombreArchivo(datos);
      return compartirArchivo(bytes, nombre, 'application/pdf', 'Simulación de préstamo' + (datos.para ? ' para ' + datos.para : ''));
    }).catch(function (e) {
      if (boton) boton.disabled = false;
      toast('⚠️ No se pudo crear el PDF: ' + (e && e.message ? e.message : e), 6000);
    });
  }
  function formPreparado() {
    abrir('<h2>Tu nombre en los PDF</h2><div class="suave">Aparece arriba a la derecha como "Preparado por…". Dejalo vacío si no querés que salga.</div>' +
      '<label class="campo"><span>Preparado por</span><input id="pp-nombre" value="' + esc(guardado('mf-preparado', '')) + '" placeholder="Tu nombre"></label>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarPreparado()">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarPreparado() { guardar('mf-preparado', val('pp-nombre').trim()); cerrar(); toast('✅ Guardado'); pintar(); }

  // ------------------------------------------------------------ MOVIMIENTOS
  // ---- v2.0: lista más fácil de leer
  var SIGLAS = /^(BCR|BAC|BN|SINPE|CR|SA|S\.A\.|MC|USA|KFC|AM|PM|II|III|IVA|ATM|POS|CCSS|ICE|INS|AYA|CNFL|ESPH|JASEC|SAFI|TC|USD|CRC|-I-)$/;
  // v2.6.0: nombres largos de servicios → cortos ("INSTITUTO COSTARRICENSE DE ELECTRICIDAD - COBRO DE SERVICIOS ELECTRICOS" → "ICE · Electricidad")
  var CORTOS = [[/instituto costarricense de electricidad/i, 'ICE'], [/compa[nñ][ií]a nacional de fuerza y luz/i, 'CNFL'], [/acueductos y alcantarillados/i, 'AyA'],
    [/caja costarricense de seguro social/i, 'CCSS'], [/instituto nacional de seguros/i, 'INS'], [/servicios p[uú]blicos de heredia/i, 'ESPH'], [/radiograf[ií]a costarricense/i, 'RACSA'],
    [/junta administrativa del servicio el[eé]ctrico/i, 'JASEC'], [/cooperativa de electrificaci[oó]n rural/i, 'Coope electrificación']];
  function nombreCorto(s) {
    var p = String(s || '').split(/\s+-\s+/);
    var izq = p[0].trim(), der = (p[1] || '').trim(), k = CORTOS.filter(function (x) { return x[0].test(izq); })[0];
    if (!k && !(der && s.length > 26)) return '';
    izq = k ? k[1] : nombreBonitoBase(izq.replace(/\s+(s\.?\s?a\.?|sociedad an[oó]nima)$/i, ''));
    if (!der) return izq;
    var d = der.replace(/^cobro de\s+/i, '').replace(/^servicios?\s+/i, '');
    d = /el[eé]ctric/i.test(d) ? 'Electricidad' : /agua|acueduct/i.test(d) ? 'Agua' : /tel[eé]f|celular|m[oó]vil/i.test(d) ? 'Teléfono' : nombreBonitoBase(d).replace(/\bE\b/, 'e');
    return izq + ' · ' + d;
  }
  function nombreBonito(s) {
    s = String(s || '');
    var c = s.length > 26 || /\s-\s/.test(s) ? nombreCorto(s) : '';
    return c || nombreBonitoBase(s);
  }
  function nombreBonitoBase(s) {
    s = String(s || '');
    if (!s || /[a-záéíóúñ]/.test(s)) return s;    // ya viene con minúsculas: se deja igual
    return s.toLowerCase().replace(/[^\s]+/g, function (w) {
      var W = w.toUpperCase();
      if (SIGLAS.test(W) || /^[^aeiouáéíóú]{2,4}$/i.test(w) && !/\d/.test(w) && w.length <= 3) return W;
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
  }
  var EMOJI_CAT = [[/super|mercado|abarrot|pulper/i, '🛒'], [/rest|comida|soda|almuer|cena|caf[eé]|pizza|food/i, '🍽'], [/gasol|combust|servicentro/i, '⛽'],
    [/transp|uber|taxi|bus|parqueo|peaje|carro|auto|veh[ií]c/i, '🚗'], [/luz|agua|internet|tel[eé]f|celular|cable|servicio|electric/i, '💡'],
    [/salud|farm|m[eé]dic|doctor|dent|hospital|seguro/i, '💊'], [/suscrip|netflix|spotify|stream|apple|google/i, '📺'], [/entreten|ocio|cine|diversi/i, '🎬'],
    [/ropa|compra|tienda|amazon/i, '🛍'], [/casa|hogar|alquiler|mueble|ferreter/i, '🏠'], [/educ|colegio|escuela|curso|libro/i, '📚'],
    [/mascota|veterin|perro|gato/i, '🐾'], [/viaje|hotel|vuelo|avi[oó]n/i, '✈'], [/regalo/i, '🎁'], [/deporte|gym|gimnas/i, '🏋'], [/belleza|pelu|barber/i, '💇']];
  var PALETA_CAT = ['#F5B82E', '#5B8DEF', '#3DD68C', '#FF8A3D', '#B794F6', '#FF6B9A', '#2EC5CE', '#E5A33B'];
  function colorDe(txt) { var n = 0; String(txt || '').split('').forEach(function (c) { n = (n * 31 + c.charCodeAt(0)) % 9973; }); return PALETA_CAT[n % PALETA_CAT.length]; }
  function iconoMov(m) {
    if (m.tipo === 'Gasto' && !m.categoria) return ['?', 'var(--rojo)'];
    if (m.tipo === 'Ingreso' || m.tipo === 'Retiro de fondo') return ['↓', 'var(--positivo)'];
    if (m.tipo === 'Transferencia') return ['⇄', '#5B8DEF'];
    if (m.tipo === C.TIPO_SACAR) return ['📤', '#F5B82E'];
    if (m.tipo === C.TIPO_METER) return ['📥', '#3DD68C'];
    if (m.tipo === 'Pago de tarjeta') return ['💳', '#B794F6'];
    if (m.tipo === 'Inversión') return ['📈', '#B794F6'];
    if (m.tipo === 'Compra tasa cero') return ['◷', '#FF8A3D'];
    var cat = m.categoria || '';
    for (var i = 0; i < EMOJI_CAT.length; i++) if (EMOJI_CAT[i][0].test(cat)) return [EMOJI_CAT[i][1], colorDe(cat)];
    return [(cat.charAt(0) || '•').toUpperCase(), colorDe(cat)];
  }
  /** Etiqueta del sobre: verde si ya está asignado, amarilla si falta */
  function etiquetaSobre(m) {
    if (sinServidorSobres()) return '';
    if (C.esCompraTarjeta(D, m)) return '';
    if (C.esSacarMeter(m)) return '<span class="et-sobre ok">✉ ' + esc(nomSobre(m.sobre)) + '</span>';
    var sb = SB();
    if (!sb.desde || new Date(m.fecha) < sb.desde) return '';
    var p = sb.pendientes.filter(function (x) { return x.mov.fila === m.fila; })[0];
    if (p) return '<span class="et-sobre falta">✉ ' + (p.asignado > 0.005 ? 'Falta ' + txt(p.falta, m.moneda) : p.sentido === 'entra' ? 'Por repartir' : 'Sin sobre') + '</span>';
    var filas = (sb.porMov[m.fila] || []).filter(function (x) { return x.sobre; });
    var nombres = [];
    filas.forEach(function (x) { if (nombres.indexOf(x.sobre) < 0) nombres.push(x.sobre); });
    if (!nombres.length && m.sobre) nombres = [m.sobre];
    if (!nombres.length) return sb.cubierto[m.fila] ? '<span class="et-sobre ok">✉ Cubierto</span>' :
      (sb.porMov[m.fila] || []).length ? '<span class="et-sobre otro">💳 Sin sobre</span>' : '';
    return '<span class="et-sobre ok">✉ ' + esc(nomSobre(nombres[0])) + (nombres.length > 1 ? ' +' + (nombres.length - 1) : '') + '</span>';
  }
  function itemMov(m) {
    var revisar = m.tipo === 'Gasto' && !m.categoria;
    var ic = iconoMov(m);
    var entra = m.tipo === 'Ingreso' || m.tipo === 'Retiro de fondo';
    var signo = entra ? '+' : m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero' ? '−' : '';
    var desc = revisar ? '<span class="naranja fuerte">Sin categoría</span>' : esc(m.tipo === 'Gasto' ? (m.categoria || '') : m.tipo === 'Compra tasa cero' ? 'Tasa cero' : m.tipo);
    var cta = m.cuenta ? cuentaPorNombre(m.cuenta) : null;
    var extra = [cta && cta.ultimos4 ? '••' + esc(cta.ultimos4) : '', hora(m.fecha)].filter(String);
    if (!et && m.cuenta && !(cta && cta.ultimos4)) extra.unshift(esc(m.cuenta));
    var et = m.para && m.tipo !== 'Ingreso' ? '<span class="et-sobre otro">🤝 ' + esc(m.para) + (m.cobro ? ' · pagado' : '') + '</span>' : C.esCobro(m) ? '<span class="et-sobre otro">🤝 ' + esc(m.cobro) + '</span>' : etiquetaSobre(m);
    if (porConfirmar(m)) et = (et ? et + ' ' : '') + '<span class="et-sobre falta">≈ estimado</span>';
    var enSel = selMov && pantalla === 'movimientos';
    return '<button class="item mov' + (enSel ? ' modo-sel' + (selMov[m.fila] ? ' sel' : '') : '') + '" onclick="App.formMovimiento(' + m.fila + ')">' + (enSel ? '<span class="sel-ck">' + (selMov[m.fila] ? '✓' : '') + '</span>' : '') + '<span class="ico-cat" style="background:color-mix(in srgb, ' + ic[1] + ' 18%, transparent);color:' + ic[1] + '">' + ic[0] + '</span>' +
      '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(nombreBonito(m.comercio) || m.tipo) + '</span>' +
      '<span class="det" style="display:block">' + desc + (et ? ' ' + et : extra.length ? ' · ' + extra.join(' · ') : '') + '</span></span>' +
      '<span class="monto"><span class="' + (entra ? 'verde-pos' : '') + '" style="display:block">' + signo + din(m.monto, m.moneda).replace('−', '') + '</span>' +
      (et && extra.length ? '<span class="origen">' + extra.join(' · ') + '</span>' : '') + '</span></button>';
  }

  function pMovimientos(res) {
    var h = cabMes('Movimientos');
    if (filtro.buscando || filtro.q) h += '<label class="buscador">' + ico('buscar', ' style="width:18px;height:18px;color:var(--suave)"') +
      '<input type="search" id="q" aria-label="Buscar movimientos" placeholder="Comercio, mes, 15/10, >20000…" value="' + esc(filtro.q) + '" oninput="App.buscar(this.value)"></label>' +
      '<div class="suave chico ayuda-q">Entiende: <b>comercio</b>, <b>mes</b> («octubre»), <b>fecha</b> («15/10») y <b>montos</b> («>20000», «5000-10000»).</div>';
    // v2.5.5: período
    var esteMes = mes.getMonth() === hoy.getMonth() && mes.getFullYear() === hoy.getFullYear();
    var pers = [['hoy', 'Hoy'], ['ayer', 'Ayer'], ['semana', 'Esta semana'], ['', esteMes ? 'Este mes' : MESES[mes.getMonth()].charAt(0).toUpperCase() + MESES[mes.getMonth()].slice(1)], ['pasado', 'Mes pasado'], ['3m', '3 meses'], ['todo', 'Todo'],
      ['rango', filtro.per === 'rango' && filtro.desde ? '📅 ' + textoRango(filtro.desde, filtro.hasta) : '📅 Rango…']];
    h += '<div class="chips desliza per">' + pers.map(function (x) { return '<button class="chip' + (filtro.per === x[0] ? ' on' : '') + '" onclick="App.movPer(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>';
    // resumen del mes
    h += '<div class="resumen-mov" id="resMov"><div><span>Gastos</span><b>' + din(res.total.CRC, 'CRC') + '</b>' + (res.total.USD ? '<small>+ ' + din(res.total.USD, 'USD') + '</small>' : '') + '</div>' +
      '<div><span>Ingresos</span><b class="verde-pos">' + din(res.ingresos.CRC, 'CRC') + '</b>' + (res.ingresos.USD ? '<small>+ ' + din(res.ingresos.USD, 'USD') + '</small>' : '') + '</div>' +
      '<div><span>Neto</span><b class="' + (res.queda.CRC < 0 ? 'rojo' : '') + '">' + din(res.queda.CRC, 'CRC') + '</b></div></div>';
    // chips: todas, por revisar, sin sobre, categorías con su total, filtros
    var chips = [['todos', 'Todas']];
    if (res.porRevisar) chips.push(['revisar', '⚠ Revisar ' + res.porRevisar]);
    if (!sinServidorSobres()) { var ns = SB().pendientes.filter(function (p) { var f = new Date(p.mov.fecha); return f.getMonth() === mes.getMonth() && f.getFullYear() === mes.getFullYear(); }).length; if (ns) chips.push(['sinsobre', '✉ Sin sobre ' + ns]); }
    Object.keys(res.porCategoria).filter(function (c) { return c !== 'Sin categoría'; }).sort(function (x, y) { return res.porCategoria[y].CRC - res.porCategoria[x].CRC; }).slice(0, 6).forEach(function (c) {
      var t = res.porCategoria[c];
      chips.push(['c:' + c, iconoMov({ tipo: 'Gasto', categoria: c })[0] + ' ' + (t.CRC ? txt(t.CRC, 'CRC') : txt(t.USD, 'USD')), c]);
    });
    var nf = (filtro.cuenta ? 1 : 0) + (filtro.moneda ? 1 : 0) + (filtro.tipo ? 1 : 0);
    h += '<div class="chips desliza"><button class="chip' + (filtro.buscando || filtro.q ? ' on' : '') + '" aria-label="Buscar" onclick="App.alternarBuscar()">' + ico('buscar', ' style="width:16px;height:16px;vertical-align:-3px"') + '</button>' +
      '<button class="chip' + (nf ? ' on' : '') + '" aria-label="Filtros" onclick="App.formFiltros()">☰' + (nf ? ' ' + nf : '') + '</button>' + chips.map(function (c) {
      return '<button class="chip' + (filtro.chip === c[0] ? ' on' : '') + '"' + (c[2] ? ' aria-label="' + esc(c[2]) + '"' : '') + ' onclick="App.chip(\'' + esc(c[0]).replace(/'/g, '') + '\')">' + esc(c[1]) + '</button>';
    }).join('') + '</div>';
    if (filtro.chip.indexOf('c:') === 0) {
      var cc = res.porCategoria[filtro.chip.slice(2)];
      if (cc) h += '<div class="suave chico" style="margin:-4px 2px 0">' + esc(filtro.chip.slice(2)) + ': ' + din(cc.CRC, 'CRC') + (cc.USD ? ' + ' + din(cc.USD, 'USD') : '') + ' este mes</div>';
    }
    h += '<div id="listaMov"></div>';
    $('p-movimientos').innerHTML = h + barraSel();
    pintarLista(res);
  }
  function alternarBuscar() { filtro.buscando = !filtro.buscando; if (!filtro.buscando) filtro.q = ''; pintar(); if (filtro.buscando) setTimeout(function () { var e = $('q'); if (e) e.focus(); }, 50); }

  function pintarLista(res) {
    res = res || C.resumenMes(D, mes);
    var bq = C.leerBusqueda(filtro.q, hoy);
    var r = bq.desde ? [bq.desde, bq.hasta] : filtro.per === 'rango' ? [filtro.desde, filtro.hasta] : filtro.per && filtro.per !== 'todo' ? C.rangoPeriodo(filtro.per, hoy) : [null, null];
    var todo = !!(bq.desde || filtro.per);
    if ($('resMov')) $('resMov').style.display = todo ? 'none' : '';
    var base = todo ? D.movimientos.filter(function (m) { var f = m.fecha && new Date(m.fecha); return f && (!r[0] || f >= r[0]) && (!r[1] || f < r[1]); }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); }) : res.movimientos;
    var sinSobre = {};
    if (filtro.chip === 'sinsobre' && !sinServidorSobres()) SB().pendientes.forEach(function (p) { sinSobre[p.mov.fila] = 1; });
    var lista = base.filter(function (m) {
      if (filtro.chip === 'revisar' && !(m.tipo === 'Gasto' && !m.categoria)) return false;
      if (filtro.chip === 'sinsobre' && !sinSobre[m.fila]) return false;
      if (filtro.chip.indexOf('c:') === 0 && !(m.tipo === 'Gasto' && m.categoria === filtro.chip.slice(2))) return false;
      if (filtro.chip.indexOf('b:') === 0) { var c0 = cuentaPorNombre(m.cuenta); if (!c0 || c0.banco !== filtro.chip.slice(2)) return false; }
      if (filtro.moneda && m.moneda !== filtro.moneda) return false;
      if (filtro.cuenta && m.cuenta !== filtro.cuenta) return false;
      if (filtro.tipo && m.tipo !== filtro.tipo) return false;
      if (!C.coincide(m, { palabras: bq.palabras, min: bq.min, max: bq.max })) return false;
      return true;
    });
    if (!lista.length) { $('listaMov').innerHTML = '<div class="caja vacio">No hay movimientos con ese filtro.' + (filtro.per !== 'todo' && (bq.palabras.length || bq.min !== null || bq.max !== null) && !bq.desde ? '<br><button class="btn sec chico" style="margin-top:10px" onclick="App.movPer(\'todo\')">Buscar en todos los meses</button>' : '') + '</div>'; return; }
    var tg = { CRC: 0, USD: 0 }, ti = { CRC: 0, USD: 0 };
    lista.forEach(function (m) { var mon = m.moneda === 'USD' ? 'USD' : 'CRC'; if (m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero') tg[mon] += m.monto; else if (m.tipo === 'Ingreso' || m.tipo === 'Retiro de fondo') ti[mon] += m.monto; });
    var pie = '<div class="pie-mov"><span>' + lista.length + ' movimiento' + (lista.length === 1 ? '' : 's') + '</span>' +
      (tg.CRC || tg.USD ? '<span>Gastos <b>' + dosMon(tg) + '</b></span>' : '') + (ti.CRC || ti.USD ? '<span>Ingresos <b class="verde-pos">' + dosMon(ti) + '</b></span>' : '') + '</div>';
    if (lista.length > 400) lista = lista.slice(0, 400);
    var dias = [], porDia = {};
    lista.forEach(function (m) {
      var d = new Date(m.fecha), clave = d.toDateString();
      if (!porDia[clave]) { porDia[clave] = { d: d, movs: [], CRC: 0, USD: 0 }; dias.push(clave); }
      var x = porDia[clave];
      x.movs.push(m);
      var mon = m.moneda === 'USD' ? 'USD' : 'CRC';
      if (m.tipo === 'Ingreso' || m.tipo === 'Retiro de fondo') x[mon] += m.monto;
      else if (m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero') x[mon] -= m.monto;
    });
    var tot = function (n, mon) { return (n > 0 ? '+' : '−') + txt(Math.abs(n), mon); };
    var h = dias.map(function (k) {
      var x = porDia[k], dd = C.diasEntre(x.d, hoy);
      var et = dd === 0 ? 'Hoy · ' : dd === 1 ? 'Ayer · ' : '';
      var t = [Math.abs(x.CRC) > 0.004 ? tot(x.CRC, 'CRC') : '', Math.abs(x.USD) > 0.004 ? tot(x.USD, 'USD') : ''].filter(String).join(' · ');
      return '<div class="dia"><span>' + et + DIAS[x.d.getDay()] + ' ' + x.d.getDate() + (todo ? ' ' + MESES_C[x.d.getMonth()] + (x.d.getFullYear() !== hoy.getFullYear() ? ' ' + x.d.getFullYear() : '') : '') + '</span><span class="m">' + (oculto() ? '' : t) + '</span></div><div class="caja sinpad">' + x.movs.map(itemMov).join('') + '</div>';
    }).join('');
    $('listaMov').innerHTML = '<div style="display:flex;flex-direction:column;gap:10px">' + h + pie + '</div>';
    formatearMontos();
  }
  function formFiltros() {
    var cuentas = D.cuentas.filter(function (c) { return c.activa; }).map(function (c) { return c.nombre; });
    var tipos = D.tiposMovimiento && D.tiposMovimiento.length ? D.tiposMovimiento : ['Gasto', 'Ingreso'];
    abrir('<h2>Filtros</h2>' +
      '<label class="campo"><span>Tarjeta o cuenta</span><select id="fl-cuenta">' + opciones(cuentas, filtro.cuenta, 'Todas') + '</select></label>' +
      '<label class="campo"><span>Moneda</span><select id="fl-moneda"><option value="">Las dos</option><option value="CRC"' + (filtro.moneda === 'CRC' ? ' selected' : '') + '>Colones ₡</option><option value="USD"' + (filtro.moneda === 'USD' ? ' selected' : '') + '>Dólares $</option></select></label>' +
      '<label class="campo"><span>Tipo</span><select id="fl-tipo">' + opciones(tipos, filtro.tipo, 'Todos') + '</select></label>' +
      '<div class="acciones"><button class="btn" onclick="App.aplicarFiltros()">Aplicar</button><button class="btn sec" onclick="App.limpiarFiltros()">Quitar filtros</button></div>');
  }
  function aplicarFiltros() { filtro.cuenta = val('fl-cuenta'); filtro.moneda = val('fl-moneda'); filtro.tipo = val('fl-tipo'); cerrar(); pintar(); }
  function limpiarFiltros() { filtro.cuenta = filtro.moneda = filtro.tipo = ''; filtro.chip = 'todos'; cerrar(); pintar(); }
  function verComprasDe(cuenta) { filtro.cuenta = cuenta; filtro.moneda = filtro.tipo = ''; filtro.chip = 'todos'; ir('movimientos'); }

  // ------------------------------------------------------------ TARJETAS (v2.0: lista + por pagar)
  var COLOR_BANCO = { 'BCR': '#1B3A6B', 'Davibank': '#8A1C2B', 'BAC': '#B5121B', 'BN': '#0B5E3B', 'Promerica': '#00573F' };
  function colorBanco(b) {
    if (COLOR_BANCO[b]) return COLOR_BANCO[b];
    var pal = ['#13221B', '#3B2E6B', '#6B4A1B', '#1B5E6B', '#5E1B4A'], n = 0;
    String(b).split('').forEach(function (ch) { n += ch.charCodeAt(0); });
    return pal[n % pal.length];
  }
  var tarjetaAbierta = null;
  function alternarTarjeta(f) { tarjetaAbierta = tarjetaAbierta === f ? -1 : f; pintar(); }
  // ------------------------------------------------------------ ME DEBEN (v2.2)
  function sugerenciasCobro() {
    var no = leerJSONSeguro('mf-md-no') || [];
    return C.meDeben(D).sugerencias.filter(function (s) { return no.indexOf(s.ingreso.fila + '|' + s.persona) < 0; });
  }
  function textoDeudas(s) { return s.deudas.length === 1 ? '«' + esc(nombreBonito(s.deudas[0].comercio) || 'compra') + '»' : s.deudas.length + ' compras'; }
  function bannerCobro(m) {
    if (m.tipo !== 'Ingreso') return '';
    var s = sugerenciasCobro().filter(function (x) { return x.ingreso.fila === m.fila; })[0];
    if (!s) return '';
    return '<div class="cobro-sug"><b>🤝 ¿Es el pago de ' + esc(s.persona) + '?</b><span>' + textoDeudas(s) + ' · ' + din(s.ingreso.monto, s.ingreso.moneda) + '</span>' +
      '<div class="chips"><button class="chip on" onclick="App.cobrar(' + m.fila + ',\'' + esc(s.persona).replace(/'/g, "\\'") + '\',true)">Sí, ya me pagó</button><button class="chip" onclick="App.noCobro(' + m.fila + ',\'' + esc(s.persona).replace(/'/g, "\\'") + '\')">No</button></div></div>';
  }
  function cobrar(ingFila, persona, desdeAsignar) {
    var s = C.meDeben(D).sugerencias.filter(function (x) { return x.ingreso.fila === ingFila && x.persona === persona; })[0];
    if (!s) return toast('Ya no encuentro esa deuda.');
    var hoyTxt = fechaCorta(new Date().toISOString());
    s.deudas.forEach(function (d0) { encolar('marcarMovimiento', [d0.fila, 'Cobro', 'Pagado ' + hoyTxt + ' · ingreso fila ' + ingFila, { monto: d0.monto }], 'Cobrado a ' + persona + ': ' + (d0.comercio || 'compra')); });
    encolar('marcarMovimiento', [ingFila, 'Cobro', 'Pago de ' + persona, { monto: s.ingreso.monto }], 'Ingreso es pago de ' + persona);
    hecho('✅ ' + persona + ' ya te pagó. Ese ingreso no cuenta como tuyo.');
    if (desdeAsignar) setTimeout(function () { formAsignar(ingFila); toast('Ahora asigná esa plata a un sobre (por ejemplo, el de pagar tarjetas).', 4500); }, 400);
  }
  function noCobro(ingFila, persona) { var no = leerJSONSeguro('mf-md-no') || []; no.push(ingFila + '|' + persona); guardar('mf-md-no', JSON.stringify(no)); if ($('velo').classList.contains('abierto')) formAsignar(ingFila); pintar(); }
  function pMeDeben() {
    var md = C.meDeben(D);
    var h = cabSimple('Me deben', 'Compras para otras personas');
    if (!md.lista.length) {
      h += '<div class="vacio-lindo"><div class="dibujo">🤝</div><b>Nadie te debe nada</b><span>Cuando asignes una compra como <b>Para otra persona</b>, aparece aquí hasta que te paguen.</span></div>';
      $('p-medeben').innerHTML = h; return;
    }
    h += '<div class="caja" style="gap:4px"><div class="suave chico">Te deben en total</div><div class="fuerte" style="font-size:26px">' + [md.total.CRC ? din(md.total.CRC, 'CRC') : '', md.total.USD ? din(md.total.USD, 'USD') : ''].filter(String).join(' + ') + '</div>' +
      '<div class="suave chico">' + md.personas.length + ' persona' + (md.personas.length === 1 ? '' : 's') + ' · ' + md.lista.length + ' compra' + (md.lista.length === 1 ? '' : 's') + '</div></div>';
    sugerenciasCobro().slice(0, 3).forEach(function (s) {
      h += '<div class="cobro-sug"><b>Llegó ' + din(s.ingreso.monto, s.ingreso.moneda) + ' · ' + esc(nombreBonito(s.ingreso.comercio) || 'Ingreso') + '</b><span>¿Es el pago de ' + esc(s.persona) + ' (' + textoDeudas(s) + ')?</span>' +
        '<div class="chips"><button class="chip on" onclick="App.cobrar(' + s.ingreso.fila + ',\'' + esc(s.persona).replace(/'/g, "\\'") + '\')">Sí, ya me pagó</button><button class="chip" onclick="App.noCobro(' + s.ingreso.fila + ',\'' + esc(s.persona).replace(/'/g, "\\'") + '\')">No</button></div></div>';
    });
    md.personas.forEach(function (p) {
      h += '<div class="seccion">' + esc(p.nombre) + ' · ' + [p.CRC ? txt(p.CRC, 'CRC') : '', p.USD ? txt(p.USD, 'USD') : ''].filter(String).join(' + ') + '</div><div class="caja sinpad">' + p.movs.map(function (m) {
        return '<button class="item" onclick="App.formDeuda(' + m.fila + ')"><span class="ico-cat" style="background:color-mix(in srgb, #5B8DEF 18%, transparent)">🤝</span><span class="cuerpo"><span class="nombre" style="display:block">' + esc(nombreBonito(m.comercio) || 'Compra') + '</span>' +
          '<span class="det" style="display:block">' + fechaCorta(m.fecha) + (m.nota ? ' · ' + esc(m.nota) : '') + (m.cuenta ? ' · ' + esc(etiquetaCuenta(m.cuenta)) : '') + '</span></span><span class="monto"><b>' + din(m.monto, m.moneda) + '</b><span class="origen">pendiente</span></span></button>';
      }).join('') + '</div>';
    });
    h += '<div class="suave chico" style="text-align:center">Estas compras suman a la deuda de la tarjeta, pero no son gasto tuyo. Cuando te paguen, el ingreso tampoco cuenta como tuyo.</div>';
    $('p-medeben').innerHTML = h;
  }
  function formDeuda(fila) {
    var m = movPorFila(fila); if (!m) return;
    abrir('<div class="suave chico">' + fechaCorta(m.fecha) + (m.cuenta ? ' · ' + esc(etiquetaCuenta(m.cuenta)) : '') + '</div><h2>' + esc(nombreBonito(m.comercio) || 'Compra') + '</h2>' +
      '<div style="font-size:26px;font-weight:800">' + din(m.monto, m.moneda) + '</div><div class="suave">Te la debe <b>' + esc(m.para) + '</b>' + (m.nota ? ' · ' + esc(m.nota) : '') + '</div>' +
      '<div class="acciones"><button class="btn" onclick="App.deudaPagada(' + fila + ')">✅ Ya me pagó</button>' +
      '<button class="btn sec" onclick="App.deudaEraMia(' + fila + ')">Era mía (quitar de Me deben)</button><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>' +
      '<div class="suave chico" style="margin-top:10px">Si te pagó por SINPE y ya llegó el correo, mejor esperá la pregunta "¿Es el pago de…?" para que ese ingreso tampoco cuente como tuyo.</div>');
  }
  function deudaPagada(fila) { var m = movPorFila(fila); encolar('marcarMovimiento', [fila, 'Cobro', 'Pagado ' + fechaCorta(new Date().toISOString()) + ' · a mano', { monto: m.monto }], 'Cobrado a ' + m.para + ': ' + (m.comercio || 'compra')); hecho('✅ Marcada como pagada'); }
  function deudaEraMia(fila) { var m = movPorFila(fila); encolar('marcarMovimiento', [fila, 'Para otra persona', '', { monto: m.monto }], 'Era mía: ' + (m.comercio || 'compra')); hecho('Listo: ahora es gasto tuyo y queda por asignar a un sobre.'); }

  function formSaldoTarjeta(fila) {
    var c = D.cuentas.filter(function (x) { return x.fila === fila; })[0]; if (!c) return;
    var dt = C.deudaTarjeta(D, c), r = function (n) { return n ? String(Math.round(n * 100) / 100).replace('.', ',') : ''; };
    abrir('<h2>Actualizar saldo · ' + esc(c.nombre) + '</h2><div class="suave">Poné lo que debés según el estado de cuenta o la app del banco. Desde esa fecha la app suma las compras y resta los pagos sola.</div>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Deuda en colones</span><input id="st-crc" data-dinero inputmode="decimal" value="' + r(dt.CRC) + '" placeholder="0"></label>' +
      '<label class="campo compacto"><span>Deuda en dólares</span><input id="st-usd" data-dinero inputmode="decimal" value="' + r(dt.USD) + '" placeholder="0"></label></div>' +
      '<label class="campo compacto"><span>¿A qué fecha?</span><input id="st-fecha" type="date" value="' + localInput() + '"></label>' +
      '<div class="suave chico" style="margin-top:6px">Las compras y pagos del mismo día de la fecha ya deberían estar en ese saldo; se cuentan los de los días siguientes.</div>' +
      '<div class="acciones"><button class="btn" id="st-ok" onclick="App.guardarSaldoTarjeta(' + fila + ')">Guardar saldo</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarSaldoTarjeta(fila) {
    var crc = C.leerNumero(val('st-crc')) || 0, usd = C.leerNumero(val('st-usd')) || 0, f = desdeInput(val('st-fecha'));
    if (!f) return toast('Elegí la fecha.');
    var c = D.cuentas.filter(function (x) { return x.fila === fila; })[0];
    encolar('actualizarSaldoCuenta', [fila, crc, usd, f], 'Saldo de ' + (c ? c.nombre : 'tarjeta') + ' · ' + txt(crc, 'CRC') + (usd ? ' + ' + txt(usd, 'USD') : ''));
    hecho('✅ Saldo guardado. Desde ahora se mueve solo.');
  }
  function pTarjetas(res) {
    var tarjetas = D.cuentas.filter(function (c) { return c.tipo === 'Tarjeta de crédito' && c.activa; });
    var tc = D.tipoCambio || 0;
    var reservas = D.sobresDesde ? SB().reservado : {};
    var resDe = function (c, mon) { return Math.max(0, (reservas[c.nombre + '|' + mon] || 0)); };
    var datos = tarjetas.map(function (c) {
      var f = c.diaPago ? C.proximaFecha(c.diaPago, hoy) : null, dt = C.deudaTarjeta(D, c);
      return { c: c, dt: dt, dias: f ? C.diasEntre(hoy, f) : 999, uso: c.limiteCRC ? Math.max(0, dt.CRC) / c.limiteCRC : null, rC: resDe(c, 'CRC'), rU: resDe(c, 'USD') };
    }).sort(function (x, y) { return x.dias - y.dias; });
    var deuC = 0, deuU = 0, cubC = 0, cubU = 0;
    datos.forEach(function (x) { deuC += Math.max(0, x.dt.CRC); deuU += Math.max(0, x.dt.USD); cubC += Math.min(x.rC, Math.max(0, x.dt.CRC)); cubU += Math.min(x.rU, Math.max(0, x.dt.USD)); });
    var deudaEq = deuC + deuU * tc, cubEq = cubC + cubU * tc, pctCub = deudaEq > 0 ? cubEq / deudaEq : 0;
    var h = '<div class="cab"><div><div class="sobretitulo">' + nombreMes(mes) + '</div><h1 class="titulo">Tarjetas</h1></div><div class="mesnav">' + botonOjo().replace('class="ojo"', 'class="btn-icono"') + botonMas() + '</div></div>';
    if (datos.length) {
      h += '<div class="caja" style="gap:8px"><div class="fila" style="align-items:flex-start"><div><div class="suave chico">Deuda total hoy</div><div class="fuerte" style="font-size:21px">' + din(deuC, 'CRC') + (deuU ? ' <span style="white-space:nowrap;display:inline-block;font-size:17px">+ ' + din(deuU, 'USD') + '</span>' : '') + '</div></div>' +
        '</div></div>';
    }
    h += '<div class="caja sinpad">' + datos.map(function (x) {
      var c = x.c, ab = tarjetaAbierta === c.fila, g = res.porCuenta[c.nombre] || { CRC: 0, USD: 0, cuotasTC: { CRC: 0, USD: 0 } };
      var urg = x.dias <= 3, lleno = x.uso !== null && x.uso >= 0.75;
      var dt = x.dt;
      // v2.9.0: solo lo que debés (o "a favor") + la barra; la fecha de pago llega como aviso y está adentro de la tarjeta
      var montoTj = function (v, mon, extra) {
        if (v < -0.004) return '<b class="verde-pos' + (extra ? ' tj-usd' : '') + '">' + (extra ? '+ ' : '') + din(-v, mon) + '</b><span class="chico verde-pos">a favor</span>';
        return '<b' + (extra ? ' class="tj-usd"' : '') + '>' + (extra ? '+ ' : '') + din(v, mon) + '</b>';
      };
      var saldo2 = (Math.abs(dt.USD) > 0.004 ? montoTj(dt.USD, 'USD', true) : '') + (!dt.vivo ? '<span class="suave chico">saldo sin fecha</span>' : '');
      var fila = '<button class="tj limpia" onclick="App.alternarTarjeta(' + c.fila + ')" aria-expanded="' + ab + '"><span class="mini-plastico" style="background:linear-gradient(135deg,' + colorBanco(c.banco) + ',color-mix(in srgb,' + colorBanco(c.banco) + ' 70%, white))">' + esc(c.ultimos4 || '') + '</span>' +
        '<span class="tj-nom">' + esc(c.nombre) + '</span>' +
        '<span class="monto">' + montoTj(dt.CRC, 'CRC') + saldo2 + '</span></button>' +
        (x.uso !== null ? '<div class="tj-barra"><div class="barra' + (lleno ? ' alerta' : '') + '" style="height:5px"><i style="width:' + Math.max(1.5, Math.min(100, x.uso * 100)).toFixed(1) + '%' + (lleno ? ';background:var(--rojo)' : '') + '"></i></div></div>' : '');
      if (ab) {
        var faltaC = Math.max(0, dt.CRC - x.rC), faltaU = Math.max(0, dt.USD - x.rU);
        var dosMon = function (o) { return [o.CRC || !o.USD ? din(o.CRC, 'CRC') : '', o.USD ? din(o.USD, 'USD') : ''].filter(String).join(' + '); };
        var tcs = D.tasaCero.filter(function (t) { return t.tarjeta === c.nombre; }).map(function (t) { return { t: t, e: C.estadoTasaCero(t, hoy) }; }).filter(function (y) { return y.e.restantes > 0; });
        var linea = function (a, b, cls) { return '<div class="fila chico"><span class="suave">' + a + '</span><span class="fuerte ' + (cls || '') + '">' + b + '</span></div>'; };
        var nq = esc(c.nombre).replace(/'/g, "\\'");
        fila += '<div class="tj-det">' +
          (dt.vivo ? linea('Saldo al ' + fechaCorta(dt.fecha) + ' (estado de cuenta)', dosMon(dt.base)) +
            linea('+ ' + dt.compras + ' compra' + (dt.compras === 1 ? '' : 's') + ' desde entonces', '+' + dosMon(dt.sube), 'naranja') +
            linea('− Pagos desde entonces', '−' + dosMon(dt.baja), 'verde-pos') +
            '<div style="border-top:1px solid var(--linea);margin:2px 0"></div>' + linea('Deuda hoy', dosMon(dt))
            : '<div class="aviso-tasa" style="margin:0 0 4px">Este saldo no se mueve solo. Tocá <b>↻ Actualizar saldo</b> y poné lo que debés hoy: desde ahí la app suma las compras y resta los pagos.</div>') +
          (c.limiteCRC ? linea('Disponible', din(c.limiteCRC - Math.max(0, dt.CRC), 'CRC'), 'verde-pos') : '') +
          linea('Compras del mes', din(g.CRC, 'CRC') + (g.USD ? ' + ' + din(g.USD, 'USD') : '')) +
          (g.cuotasTC.CRC || g.cuotasTC.USD ? linea('Cuotas tasa cero del mes', din(g.cuotasTC.CRC, 'CRC') + (g.cuotasTC.USD ? ' + ' + din(g.cuotasTC.USD, 'USD') : '')) : '') +

          (x.uso !== null ? linea('Límite', din(c.limiteCRC, 'CRC') + ' · usado ' + Math.round(x.uso * 100) + '%') : '') +
          linea('Corte y pago', (c.diaCorte ? 'día ' + c.diaCorte : '—') + ' · ' + (c.diaPago ? 'día ' + c.diaPago : '—')) +
          (x.dias < 999 ? linea('Próximo pago', enDias(x.dias).replace(/^en /, 'en ').replace(/^./, function (l) { return l.toUpperCase(); }), urg ? 'naranja' : '') : '') +
          (tcs.length ? '<div class="suave chico fuerte" style="margin-top:6px">CUOTAS TASA CERO</div>' + tcs.map(function (y) {
            return linea(esc(y.t.descripcion) + ' · ' + (y.t.meses - y.e.restantes) + ' de ' + y.t.meses, din(y.e.cuota, y.t.moneda) + '/mes');
          }).join('') : '') +
          (tcs.length ? '' : '<div class="suave chico" style="margin-top:4px">Esta tarjeta no tiene compras tasa cero.</div>') +
          iconos([['📋', 'Planear pago', 'App.abrirPlan(\'' + nq + '\')', true], ['🧾', 'Movimientos', 'App.verCuentaMov(\'' + nq + '\')'],
            ['💳', 'Registrar pago', 'App.formMovimiento(0,{tipo:\'Pago de tarjeta\',cuenta:\'' + nq + '\'})'], ['↻', 'Actualizar saldo', 'App.formSaldoTarjeta(' + c.fila + ')'],
            ['📷', 'Pago con foto', 'App.elegirArchivo(\'foto\')'], ['✏️', 'Editar', 'App.formCuenta(' + c.fila + ')']]) + '</div>';
      }
      return '<div class="tj-fila' + (ab ? ' abierta' : '') + '">' + fila + '</div>';
    }).join('') + '</div>';
    var otras = D.cuentas.filter(function (c) { return c.tipo !== 'Tarjeta de crédito' && c.activa; });
    if (otras.length) {
      h += '<div class="seccion">Otras cuentas</div><div class="caja sinpad">' + otras.map(function (c) {
        if (C.esAhorro(c)) return filaAhorro(c);
        var icono = c.tipo === 'Préstamo' ? '🏠' : c.tipo === 'Inversión' ? '📈' : c.moneda === 'USD' ? '💵' : '🏦';
        var saldo = [c.saldoCRC ? din(c.saldoCRC, 'CRC') : '', c.saldoUSD ? din(c.saldoUSD, 'USD') : ''].filter(String).join(' + ') || din(0, c.moneda);
        return '<div class="tj-fila"><button class="tj" onclick="App.formCuenta(' + c.fila + ')"><span class="ico-cat tj-ic" style="background:var(--linea)">' + icono + '</span><span class="tj-nom">' + esc(c.nombre) + '</span><span class="tj-sub suave chico">' + esc(c.tipo + (c.banco ? ' · ' + c.banco : '')) + '</span><span class="monto"><b>' + saldo + '</b></span></button></div>';
      }).join('') + '</div>';
    }
    h += '<button class="punteado" onclick="App.formCuenta()">' + ico('mas', ' style="width:20px;height:20px"') + 'Agregar tarjeta o cuenta</button>';
    $('p-tarjetas').innerHTML = h;
  }

  // ------------------------------------------------------------ SOBRES
  // ------------------------------------------------------------ SOBRES CON SALDO (v1.6)
  var sbMemo = null;
  function SB() { if (!sbMemo) sbMemo = C.saldosSobres(D, mes, hoy); return sbMemo; }
  function sobreTarjetas() { return (D.sobreEspecial || {}).tarjetas || ''; }
  function grupoNuevo() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function movPorFila(f) { return D.movimientos.filter(function (m) { return m.fila === f; })[0]; }
  function sinServidorSobres() { return !D.sobresDesde; }
  function avisoServidor() { return '<div class="caja vacio">Para usar los sobres con saldo hay que actualizar el código del servidor (Apps Script) a la versión 1.6.</div>'; }
  function fechaSobre(m) { return m && m.fecha ? m.fecha : new Date().toISOString(); }

  function pSobres() {
    var h = cabMes('Sobres', botonNuevo('Nuevo sobre', 'App.formSobre()'));
    if (sinServidorSobres()) { $('p-sobres').innerHTML = h + avisoServidor(); return; }
    var sb = SB();
    var nPend = sb.pendientes.length + sinOrigen().length;
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">Dinero en sobres</span>' + botonOjo() + '</div>' +
      '<div style="display:flex;gap:18px;align-items:baseline;flex-wrap:wrap"><span class="grande">' + din(sb.total.CRC, 'CRC') + '</span>' + (sb.total.USD ? '<span class="medio">' + din(sb.total.USD, 'USD') + '</span>' : '') + '</div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Por asignar' + (nPend ? ' (' + nPend + ')' : '') + '</span><b style="color:var(--acento)">' + din(sb.porAsignar.CRC, 'CRC') + (sb.porAsignar.USD ? ' + ' + din(sb.porAsignar.USD, 'USD') : '') + '</b></div>' +
      (sb.reservadoTotal > 0.005 || sb.reservadoUSD > 0.005 ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Reservado para pagar tarjetas</span><b>' +
        [sb.reservadoTotal > 0.005 ? din(sb.reservadoTotal, 'CRC') : '', sb.reservadoUSD > 0.005 ? din(sb.reservadoUSD, 'USD') : ''].filter(String).join(' + ') + '</b></div>' : '') +
      '<div class="rapidos"><button class="principal" onclick="App.ir(\'porasignar\')">' + ico('flechas') + (nPend ? 'Asignar (' + nPend + ')' : 'Por asignar') + '</button>' +
      '<button onclick="App.formMover()">' + ico('flechas') + 'Mover</button><button onclick="App.formIgualarTodos()">⚖ Igualar</button><button onclick="App.ir(\'limpiar\')">' + ico('recargar') + 'Limpiar</button></div></div>';
    h += '<div class="caja sinpad">' + sb.lista.map(function (s, i) {
      var neg = s.saldo < -0.005;
      var det = (Math.abs(s.inicioMes) > 0.005 ? 'Venía ' + din(s.inicioMes, s.moneda) + ' · ' : '') + (s.entradas ? '+' + din(s.entradas, s.moneda) + ' · ' : '') + 'salió ' + din(s.salidas, s.moneda);
      if (s.meta) det += ' · meta ' + din(s.meta, s.moneda);
      var avance = s.meta ? Math.max(0, Math.min(1, s.saldo / s.meta)) : s.pct;
      return '<button class="item" style="flex-direction:column;align-items:stretch;gap:6px" onclick="App.verSobre(' + i + ')">' +
        '<span class="fila"><span style="font-weight:700">' + iconoSobre(s.nombre) + ' ' + esc(nomSobre(s.nombre)) + (s.ajuste ? ' <span class="pill" style="font-size:10px;padding:2px 6px">AJUSTE</span>' : '') + '</span>' +
        '<span class="fuerte' + (neg ? ' rojo' : '') + '">' + din(s.saldo, s.moneda) + '</span></span>' +
        barra(avance, !s.meta && s.pct >= 0.85) + '<span class="chico suave">' + det + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="suave chico" style="text-align:center">Saldos desde el ' + fechaCorta(D.sobresDesde) + '. Los sobres son como los del BCR: las compras con tarjeta no los tocan; la plata sale cuando la sacás para pagar.</div>';
    $('p-sobres').innerHTML = h;
  }

  // ---- lista de pendientes
  function iconoPend(p) { return p.sentido === 'entra' ? '<span class="ico" style="background:rgba(61,214,140,.15);color:var(--positivo)">' + ico('sube') + '</span>' : '<span class="ico">' + ico(p.mov.tipo === 'Pago de tarjeta' || p.tarjeta ? 'tarjeta' : 'bolsa') + '</span>'; }
  function itemPend(p) {
    var m = p.mov;
    var det = fechaCorta(m.fecha) + ' · ' + (m.tipo === 'Pago de tarjeta' ? 'pago de ' + etiquetaCuenta(m.cuenta) + (p.reservadoUsado ? ' · ' + txt(p.reservadoUsado, m.moneda) + ' ya reservado' : '') :
      p.tarjeta ? etiquetaCuenta(m.cuenta) + ' · ¿de qué sobre?' : p.sentido === 'entra' ? '¿a qué sobre va?' : '¿de qué sobre salió?') + (p.asignado && !p.reservadoUsado ? ' · falta ' + txt(p.falta, m.moneda) : '');
    return '<button class="item" onclick="App.formAsignar(' + m.fila + ')">' + iconoPend(p) +
      '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(m.comercio || m.tipo) + '</span><span class="det" style="display:block">' + esc(det) + '</span></span>' +
      '<span class="monto"><b class="' + (p.sentido === 'entra' ? 'verde' : 'rojo') + '" style="display:block">' + (p.sentido === 'entra' ? '+' : '−') + din(p.falta, m.moneda) + '</b></span></button>';
  }
  function pPorAsignar() {
    var h = cabSimple('Por asignar', 'Sobres', 'App.ir(\'sobres\')');
    if (sinServidorSobres()) { $('p-porasignar').innerHTML = h + avisoServidor(); return; }
    var sb = SB(), so = sinOrigen();
    if (so.length) h += '<div class="seccion-t">ENTRÓ PLATA A TUS CUENTAS · ¿DE DÓNDE VINO?</div><div class="caja sinpad borde-acento">' + so.map(function (x) {
      var m = x.mov;
      return '<button class="item" onclick="App.formOrigenPlata(' + m.fila + ')"><span class="ico" style="background:rgba(91,141,239,.15)">🏦</span><span class="cuerpo"><span class="nombre" style="display:block">Entró a ' + esc(x.cuenta) + '</span>' +
        '<span class="det" style="display:block">' + esc(fechaCorta(m.fecha).replace(/ \d{4}$/, '') + (hora(m.fecha) ? ' ' + hora(m.fecha) : '') + ' · ¿de dónde vino?') + '</span></span><span class="monto"><b class="verde" style="display:block">+' + din(m.monto, m.moneda) + '</b></span></button>';
    }).join('') + '</div>';
    if (!sb.pendientes.length && !so.length) h += '<div class="caja vacio">Todo está asignado. 🎉</div>';
    else {
      var entra = sb.pendientes.filter(function (p) { return p.sentido === 'entra'; }), sale = sb.pendientes.filter(function (p) { return p.sentido === 'sale'; });
      if (entra.length) h += '<div class="seccion-t">ENTRÓ DINERO</div><div class="caja sinpad">' + entra.map(itemPend).join('') + '</div>';
      if (sale.length) h += '<div class="seccion-t">SALIÓ DINERO</div><div class="caja sinpad">' + sale.map(itemPend).join('') + '</div>';
    }
    if (D.fondos && FD().pendientes.length) h += '<div class="seccion-t">FONDOS: ¿A QUÉ SUBCUENTA?</div><div class="caja sinpad">' + FD().pendientes.map(itemFondoPend).join('') + '</div>';
    h += '<div class="suave chico" style="text-align:center">Aquí solo aparece lo que entra o sale de tu cuenta principal. Las compras con tarjeta no tocan los sobres.</div>';
    $('p-porasignar').innerHTML = h;
  }

  // ---- asignar un movimiento
  var asig = null;   // { fila, modo, filas:[{sobre,monto}] }
  // ------------------------------------------------------------ v2.4: nombres e íconos de sobres + selector propio
  var SIGLAS = /^(BCR|BN|BNCR|BAC|BCT|CCSS|INS|ICE|AYA|IPTV|SAFI|CNFL|ATM|SINPE|USD|CRC|TV|IVA|RTV|ESPH|JASEC|MUCAP|COOPENAE|LAFISE|CMB|CRS|PC)$/;
  /** "SOBRE SAMMY COLEGIO" → "Sammy Colegio" (solo cómo se ve; la hoja no cambia) */
  function nomSobre(n) {
    var orig = String(n || '').trim(), s = orig.replace(/^sobres?\s+(de\s+)?/i, '').trim();
    if (!s) return orig;
    if (s !== s.toUpperCase()) return s;   // ya viene con mayúsculas y minúsculas: se respeta
    return s.split(/(\s+)/).map(function (w, i) {
      if (/^\s+$/.test(w) || !w) return w;
      var up = w.toUpperCase(), lo = w.toLowerCase();
      if (/\d/.test(w) || SIGLAS.test(up.replace(/[^A-ZÑ]/g, '')) || !/[AEIOUÁÉÍÓÚÜ]/.test(up)) return up;
      if (i > 0 && /^(de|del|la|las|el|los|y|e|o|para|en|con|a|al)$/.test(lo)) return lo;
      return lo.charAt(0).toUpperCase() + lo.slice(1);
    }).join('');
  }
  var ICONOS_SOBRE = [
    [/venta|negocio|emprend/, '💼'], [/camara|foto/, '📷'], [/reloj/, '⌚'], [/celular|telefono|iphone|samsung/, '📱'],
    [/super|mercado|abarrot|comida|pulperia|despensa/, '🛒'], [/fruta|verdura|feria|aguacate/, '🥑'],
    [/ingles|idioma|clase|curso|libro|estudio|tutor/, '📚'], [/colegio|escuela|kinder|guarderia|universidad|matricula|uniforme/, '🎒'],
    [/tarjeta|credix|visa|master|amex/, '💳'], [/casa|hipoteca|prestamo|alquiler|renta|vivienda|condominio/, '🏠'],
    [/gasolina|combustible|carro|auto\b|vehiculo|marchamo|riteve|taller|moto|peaje|parqueo|transporte|uber|bus\b|taxi/, '🚗'],
    [/ejercicio|gym|gimnasio|karate|deporte|natacion|futbol|crossfit|yoga|zumba/, '🏋️'],
    [/luz|electric|cnfl/, '💡'], [/agua\b|aya/, '💧'], [/internet|cable|iptv|netflix|streaming|spotify|disney|kolbi|claro|liberty|tigo/, '📺'],
    [/ahorro|fondo|inversion|emergencia|imprevisto/, '🐷'], [/salud|medic|farmacia|doctor|dentista|seguro|ccss|optica/, '💊'],
    [/mascota|perro|gato|veterinari/, '🐾'], [/viaje|vacacion|paseo|hotel/, '✈️'], [/ropa|zapato|calzado/, '👕'],
    [/regalo|navidad|cumple/, '🎁'], [/restaurante|salida|cafe|comer/, '🍽️'], [/belleza|pelo|unas|barberia|salon/, '💇'],
    [/impuesto|hacienda|municipal/, '🧾'], [/diezmo|iglesia|donacion|ofrenda/, '🙏'], [/operacion|banco|deuda|bcr|bn\b|bac/, '🏦'],
    [/personal|gastos|varios|otros/, '🙂']
  ];
  function sinTildes(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function iconoSobre(n) { var s = sinTildes(n); for (var i = 0; i < ICONOS_SOBRE.length; i++) if (ICONOS_SOBRE[i][0].test(s)) return ICONOS_SOBRE[i][1]; return '✉'; }
  function sobreInfo(nombre, moneda) {
    if (!D || sinServidorSobres()) return null;
    var l = SB().lista.filter(function (s) { return s.nombre === nombre; });
    return l.filter(function (s) { return !moneda || s.moneda === moneda; })[0] || l[0] || null;
  }
  function claseSaldo(s) { return !s ? '' : s.saldo < 0 ? 'rojo' : (s.asignado && s.saldo < s.asignado * 0.2) ? 'amarillo' : 'verde'; }

  // Todas las listas (<select>) se muestran con una hoja propia en vez de la lista de Android.
  // El <select> queda escondido y sigue guardando el valor: el resto de la app no cambia.
  var selVal = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  var selIdx = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
  Object.defineProperty(HTMLSelectElement.prototype, 'value', { configurable: true, get: selVal.get, set: function (v) { selVal.set.call(this, v); if (this._btn) etiquetaSel(this); } });
  Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', { configurable: true, get: selIdx.get, set: function (v) { selIdx.set.call(this, v); if (this._btn) etiquetaSel(this); } });
  function esSelSobre(sel) {
    if (sel._esSobre !== undefined) return sel._esSobre;
    var nombres = {}; ((D && D.sobres) || []).forEach(function (s) { nombres[s.nombre] = 1; });
    var con = 0, si = 0;
    Array.prototype.forEach.call(sel.options, function (o) { if (o.value) { con++; if (nombres[o.value]) si++; } });
    return (sel._esSobre = si > 0 && si * 2 >= con);
  }
  function monedaSel(sel) { return sel.getAttribute('data-moneda') || ''; }
  function mejorarSelects() {
    var l = document.querySelectorAll('select:not([data-mej])');
    for (var i = 0; i < l.length; i++) mejorarSel(l[i]);
  }
  function mejorarSel(sel) {
    sel.setAttribute('data-mej', '1');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'sel-btn ' + sel.className;
    if (sel.style.cssText) b.style.cssText = sel.style.cssText;
    if (sel.getAttribute('aria-label')) b.setAttribute('aria-label', sel.getAttribute('aria-label'));
    b.setAttribute('aria-haspopup', 'listbox');
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); abrirElegir(sel); });
    sel.classList.add('sel-oculto');
    sel.parentNode.insertBefore(b, sel.nextSibling);
    sel._btn = b;
    sel.addEventListener('change', function () { etiquetaSel(sel); });
    etiquetaSel(sel);
  }
  function etiquetaSel(sel) {
    var b = sel._btn; if (!b) return;
    var o = sel.options[selIdx.get.call(sel)], h;
    b.disabled = sel.disabled;
    if (!o) h = '<span class="sel-txt suave">Elegí…</span>';
    else if (esSelSobre(sel) && o.value && o.value.indexOf('__') !== 0) {
      var s = sobreInfo(o.value, monedaSel(sel));
      h = '<span class="sel-ic">' + iconoSobre(o.value) + '</span><span class="sel-txt">' + esc(nomSobre(o.value)) + '</span>' +
        (s && !b.classList.contains('sel-mini') ? '<span class="sel-saldo ' + claseSaldo(s) + '">' + esc(txt(s.saldo, s.moneda)) + '</span>' : '');
    } else h = '<span class="sel-txt' + (o.value ? '' : ' suave') + '">' + esc(o.text) + '</span>';
    b.innerHTML = h + '<span class="sel-flecha" aria-hidden="true">▾</span>';
  }
  var elegirSel = null;
  function tituloSel(sel) {
    if (sel.getAttribute('data-titulo')) return sel.getAttribute('data-titulo');
    if (esSelSobre(sel)) return 'Elegí el sobre';
    var lab = sel.closest('label'), sp = lab && lab.querySelector('span');
    var t = (sp && sp.textContent) || sel.getAttribute('aria-label') || '';
    return t.replace(/\s*\(.*\)\s*$/, '').trim() || 'Elegí una opción';
  }
  function abrirElegir(sel) {
    if (sel.disabled) return;
    elegirSel = sel;
    var sobre = esSelSobre(sel), mon = monedaSel(sel), actual = sel.value;
    var ops = Array.prototype.map.call(sel.options, function (o, i) { return { i: i, v: o.value, t: o.text, dis: o.disabled }; });
    var fila = function (op) {
      var real = op.v && op.v.indexOf('__') !== 0;
      var s = sobre && real ? sobreInfo(op.v, mon) : null, nombre = sobre && real ? nomSobre(op.v) : op.t;
      var ic = sobre ? (real ? iconoSobre(op.v) : /sin sobre/i.test(op.t) ? '💳' : '—') : '';
      return '<button type="button" class="el-fila' + (op.v === actual ? ' on' : '') + '"' + (op.dis ? ' disabled' : '') + ' data-q="' + esc(sinTildes(nombre + ' ' + op.v)) + '" onclick="App.elegir(' + op.i + ')">' +
        (ic ? '<span class="el-ic">' + ic + '</span>' : '') + '<span class="el-nom">' + esc(sobre && !real ? op.t.replace(/^💳\s*/, '') : nombre) + '</span>' +
        (s ? '<b class="el-saldo ' + claseSaldo(s) + '">' + esc(txt(s.saldo, s.moneda)) + '</b>' : '') + (op.v === actual ? '<span class="el-ok">✓</span>' : '') + '</button>';
    };
    var muchos = ops.length > 7, h = '';
    if (sobre) {
      var reales = ops.filter(function (o) { return o.v && o.v.indexOf('__') !== 0; }), vacios = ops.filter(function (o) { return !o.v || o.v.indexOf('__') === 0; });
      if (muchos) {
        var uso = {}; (D.sobresMov || []).forEach(function (x) { if (x.sobre) uso[x.sobre] = (uso[x.sobre] || 0) + 1; });
        var top = reales.filter(function (o) { return uso[o.v]; }).sort(function (a, b) { return uso[b.v] - uso[a.v]; }).slice(0, 3);
        if (top.length) h += '<div class="el-sec">MÁS USADOS</div>' + top.map(fila).join('');
        h += '<div class="el-sec">TODOS (A–Z)</div>';
      }
      h += reales.slice().sort(function (a, b) { return nomSobre(a.v).localeCompare(nomSobre(b.v), 'es'); }).map(fila).join('');
      if (vacios.length) h += '<div class="el-sep"></div>' + vacios.map(fila).join('');
    } else h = ops.map(fila).join('');
    var cont = $('elegir');
    if (!cont) { cont = document.createElement('div'); cont.id = 'elegir'; cont.className = 'elegir-velo'; cont.addEventListener('click', function (e) { if (e.target === cont) cerrarElegir(); }); document.body.appendChild(cont); }
    cont.innerHTML = '<div class="elegir" role="listbox"><div class="asa"></div><div class="el-cab"><b>' + esc(tituloSel(sel)) + '</b><button type="button" class="el-x" aria-label="Cerrar" onclick="App.cerrarElegir()">×</button></div>' +
      (muchos ? '<label class="el-buscar"><span aria-hidden="true">🔍</span><input id="el-q" type="search" autocomplete="off" placeholder="' + (sobre ? 'Buscar sobre…' : 'Buscar…') + '" oninput="App.buscarElegir(this.value)"></label>' : '') +
      '<div class="el-lista" id="el-lista">' + h + '<div class="el-nada suave" id="el-nada" hidden>No hay resultados</div></div></div>';
    cont.classList.add('abierto');
    var on = cont.querySelector('.el-fila.on'); if (on && on.scrollIntoView && !muchos) on.scrollIntoView({ block: 'nearest' });
  }
  function buscarElegir(q) {
    q = sinTildes(q).trim();
    var n = 0, filas = document.querySelectorAll('#el-lista .el-fila');
    Array.prototype.forEach.call(filas, function (f) { var ok = !q || f.getAttribute('data-q').indexOf(q) >= 0; f.hidden = !ok; if (ok) n++; });
    Array.prototype.forEach.call(document.querySelectorAll('#el-lista .el-sec, #el-lista .el-sep'), function (e) { e.hidden = !!q; });
    if (q) {   // al buscar, no repetir los "más usados"
      var vistos = {}; Array.prototype.forEach.call(filas, function (f) { if (f.hidden) return; var k = f.getAttribute('onclick'); if (vistos[k]) { f.hidden = true; n--; } vistos[k] = 1; });
    }
    $('el-nada').hidden = n > 0;
  }
  function elegir(i) {
    var sel = elegirSel; cerrarElegir(); if (!sel) return;
    if (selIdx.get.call(sel) !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  function cerrarElegir() { var c = $('elegir'); if (c) { c.classList.remove('abierto'); c.innerHTML = ''; } elegirSel = null; }
  var mejorarPend = false;
  if (typeof MutationObserver !== 'undefined') new MutationObserver(function () {
    if (mejorarPend) return; mejorarPend = true;
    (window.requestAnimationFrame || setTimeout)(function () { mejorarPend = false; mejorarSelects(); });
  }).observe(document.documentElement, { childList: true, subtree: true });

  function opcionesSobre(moneda, sel, conSaldo) {
    var sb = SB();
    return sb.lista.filter(function (s) { return s.moneda === moneda; }).map(function (s) {
      return '<option value="' + esc(s.nombre) + '"' + (s.nombre === sel ? ' selected' : '') + '>' + esc(nomSobre(s.nombre)) + (conSaldo ? ' · ' + txt(s.saldo, s.moneda) : '') + '</option>';
    }).join('');
  }
  function formAsignar(fila) {
    if (fila < 0) return toast('Se está guardando en Google; en unos segundos lo podés asignar.');
    var m = movPorFila(fila); if (!m) return;
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0];
    if (!p) return toast('Este movimiento ya está asignado.');
    var primero = sobreTarjetas() || ((SB().lista.filter(function (s) { return s.moneda === m.moneda; })[0] || {}).nombre) || '';
    asig = { fila: fila, falta: p.falta, sentido: p.sentido, moneda: m.moneda, modo: 'sobre', tarjeta: !!p.tarjeta, reservado: p.reservadoUsado || 0, filas: [{ sobre: primero, monto: p.falta }], items: [], manual: true };
    if (m.tipo === 'Pago de tarjeta') {   // v2.4 (P2): las compras de la tarjeta sin sobre, marcadas solas hasta donde alcance el pago
      var acum = 0;
      asig.items = comprasDelPago(m).map(function (it) {
        it.sobre = sugerirSobre(it.mov); it.on = acum + it.monto <= p.falta + 0.01; if (it.on) acum += it.monto; return it;
      });
      asig.manual = !asig.items.length;
      asig.filas = [{ sobre: asig.items.length ? '' : primero, monto: Math.max(0, Math.round((p.falta - acum) * 100) / 100) }];
    }
    var h = '<div class="suave chico">' + esc(m.tipo) + ' · ' + fechaCorta(m.fecha) + (m.cuenta ? ' · ' + esc(etiquetaCuenta(m.cuenta)) : '') + '</div>' +
      '<h2>' + esc(m.comercio || m.tipo) + '</h2><div class="grande ' + (p.sentido === 'entra' ? 'verde' : 'rojo') + '" style="font-size:28px;font-weight:800">' + (p.sentido === 'entra' ? '+' : '−') + din(m.tipo === 'Pago de tarjeta' ? m.monto : p.falta, m.moneda) + '</div>' +
      (m.nota ? '<div class="suave chico">' + esc(m.nota) + '</div>' : '') + bannerCobro(m) +
      planesPorUsar().filter(function (x) { return x.mov.fila === fila; }).map(function (x) { return '<button class="btn" style="margin-top:10px" onclick="App.usarPlan(\'' + x.plan.id + '\',' + fila + ')">📋 Usar el plan que guardaste (' + txt(x.plan.total, 'CRC') + ')</button>'; }).join('') + '<div id="as-cuerpo"></div>';
    abrir(h);
    pintarAsignar();
  }
  function pintarAsignar() {
    var m = movPorFila(asig.fila), h = '';
    var radio = function (val, txtOp, extra) {
      return '<label class="op' + (asig.modo === val ? ' on' : '') + '"><input type="radio" name="as-modo" value="' + val + '"' + (asig.modo === val ? ' checked' : '') + ' onchange="App.asigModo(\'' + val + '\')">' + txtOp + (extra || '') + '</label>';
    };
    if (m.tipo === 'Pago de tarjeta') {
      var mon = m.moneda, marc = p2Marcado(), resto = p2Resto();
      if (asig.reservado) h += '<div class="aviso-ok"><b>✓ ' + esc(txt(asig.reservado, mon)) + ' ya cubiertos</b> <span class="suave">· compras que ya asignaste a sus sobres</span></div>';
      if (asig.items.length) {
        h += '<div class="suave chico fuerte" style="margin-top:12px">COMPRAS DE ESTA TARJETA SIN SOBRE</div>' +
          '<div class="suave chico">Marcá las que paga este pago; cada una sale de su sobre.</div><div class="p2-lista">' +
          asig.items.map(function (it, i) {
            return '<div class="p2-fila' + (it.on ? ' on' : '') + '"><label class="p2-check"><input type="checkbox"' + (it.on ? ' checked' : '') + ' onchange="App.p2Marcar(' + i + ',this.checked)" aria-label="Pagar ' + esc(it.comercio) + '"></label>' +
              '<div class="p2-info"><b class="p2-nom">' + esc(it.comercio) + '</b><span class="suave chico">' + fechaCorta(it.mov.fecha) + (it.tipo === 'sinsobre' ? ' · estaba sin sobre' : '') + '</span>' +
              '<select class="sel-mini' + (it.sobre ? '' : ' falta') + '" data-titulo="Sobre para ' + esc(it.comercio) + '" onchange="App.p2Sobre(' + i + ',this.value)"><option value="">Elegí sobre</option>' + opcionesSobre(mon, it.sobre, true) + '</select></div>' +
              '<b class="p2-monto">' + esc(txt(it.monto, mon)) + '</b></div>';
          }).join('') + '</div>';
        if (marc > asig.falta + 0.01) h += '<div class="suave chico" style="margin-top:6px">Marcaste ' + esc(txt(marc - asig.falta, mon)) + ' más que el pago: eso queda reservado para el próximo pago.</div>';
      }
      if (asig.manual) {
        h += '<div class="suave chico fuerte" style="margin-top:12px">' + (asig.items.length ? 'LO QUE FALTA (INTERESES, COMISIONES…), ¿DE QUÉ SOBRES?' : '¿DE QUÉ SOBRES SALIÓ?') + '</div>' +
          '<div class="chips" style="margin:6px 0">' + (sobreTarjetas() ? '<button class="chip" onclick="App.asigTodo()">Todo de ' + esc(nomSobre(sobreTarjetas())) + '</button>' : '') +
          '<button class="chip" onclick="App.asigTodo(\'\')">💳 Todo sin sobre</button></div>' +
          filasSobresHtml(mon);
      }
      h += '<div id="p2-barra">' + p2Barra() + '</div>';
      var sinSobre = asig.items.some(function (it) { return it.on && !it.sobre; });
      if (sinSobre || (!asig.manual && resto > 0.005)) h += '<div class="chips" style="margin-top:8px;flex-wrap:wrap">' +
        (sinSobre ? '<button class="chip" onclick="App.p2Sugerir()">✨ Sugerir sobres</button>' : '') +
        (!asig.manual && resto > 0.005 ? '<button class="chip" onclick="App.p2Manual()">Repartir ' + esc(txt(resto, mon)) + ' a mano</button>' : '') + '</div>';
    } else if (asig.sentido === 'entra') {
      h += '<div class="suave chico fuerte" style="margin-top:10px">¿A DÓNDE VA ESTE DINERO?</div>' +
        radio('sobre', 'Meter en un sobre', asig.modo === 'sobre' ? '<select id="as-sobre" onclick="event.stopPropagation()">' + opcionesSobre(m.moneda, null, true) + '</select>' : '') +
        (sobreTarjetas() ? radio('tarjetas', 'Para pagar tarjetas', '<span class="suave chico"> (sobre ' + esc(sobreTarjetas()) + ')</span>') : '') +
        radio('repartir', 'Repartir en varios sobres') +
        radio('ninguno', 'Dejar en la cuenta (sin sobre)');
    } else {
      var personas = C.meDeben(D).personas.map(function (x) { return x.nombre; });
      D.movimientos.forEach(function (x) { if (x.para && personas.indexOf(x.para) < 0) personas.push(x.para); });
      h += '<div class="suave chico fuerte" style="margin-top:10px">¿CÓMO QUERÉS CONTARLA?</div>' +
        radio('sobre', '<span><b>✉ De un sobre</b><br><span class="suave chico">' + (asig.tarjeta ? 'El sobre baja ahora y queda reservado para pagar la tarjeta' : 'La plata sale del sobre que elijás') + '</span></span>',
          asig.modo === 'sobre' ? '<select id="as-sobre" onclick="event.stopPropagation()">' + opcionesSobre(m.moneda, asig.filas[0].sobre, true) + '</select>' : '') +
        radio('varios', '<span><b>✉ De varios sobres</b><br><span class="suave chico">Parte de un sobre y parte de otro</span></span>',
          asig.modo === 'varios' ? '<div class="campos-op" onclick="event.stopPropagation()">' + filasSobresHtml(m.moneda) + '<div id="p2-barra">' + p2Barra() + '</div></div>' : '') +
        radio('ninguno', '<span><b>💳 Mía, sin sobre</b><br><span class="suave chico">Cuenta como gasto tuyo, pero no toca ningún sobre' + (asig.tarjeta ? '; se decide al pagar la tarjeta' : '') + '</span></span>') +
        radio('otro', '<span><b>🤝 Para otra persona</b><br><span class="suave chico">No es gasto tuyo ni toca sobres. Queda en «Me deben»</span></span>',
          asig.modo === 'otro' ? '<div class="campos-op" onclick="event.stopPropagation()"><label class="campo compacto"><span>¿Quién te la debe?</span><input id="as-para" list="as-personas" placeholder="Ej. Mamá" autocomplete="off"></label>' +
            '<datalist id="as-personas">' + personas.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
            '<label class="campo compacto"><span>Nota (opcional)</span><input id="as-nota" placeholder="Ej. Regalo de cumpleaños"></label></div>' : '');
    }
    if (m.tipo !== 'Pago de tarjeta' && asig.modo !== 'repartir' && asig.modo !== 'otro' && asig.modo !== 'varios') {
      h += '<label class="campo compacto"><span>Monto</span><input id="as-monto" data-dinero inputmode="decimal" value="' + esc(String(Math.round(asig.falta * 100) / 100).replace('.', ',')) + '"></label>';
      if ((asig.modo === 'sobre' || asig.sentido === 'sale') && m.comercio) h += '<label class="check"><input type="checkbox" id="as-recordar"> Recordar para «' + esc(m.comercio) + '»</label>';
    }
    h += '<div class="acciones"><button class="btn" id="as-ok" onclick="App.guardarAsignar()">' + (asig.modo === 'repartir' ? 'Ir a repartir' : 'Asignar') + '</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    $('as-cuerpo').innerHTML = h;
    formatearMontos();
  }
  function asigModo(v) {
    if (v === 'varios' && asig.modo !== 'varios') {   // v2.4.1: dos filas; la segunda se llena sola
      var m = movPorFila(asig.fila), uno = ($('as-sobre') && $('as-sobre').value) || asig.filas[0].sobre;
      var otro = SB().lista.filter(function (s) { return s.moneda === m.moneda && s.nombre !== uno; })[0];
      asig.filas = [{ sobre: uno, monto: Math.round(asig.falta * 100) / 100 }, { sobre: otro ? otro.nombre : '', monto: 0 }];
    }
    asig.modo = v; pintarAsignar();
  }
  function asigTodo(s) { asig.filas = [{ sobre: s === '' ? '' : sobreTarjetas(), monto: Math.round(p2Resto() * 100) / 100 }]; pintarAsignar(); }
  function filasSobresHtml(mon) {
    return asig.filas.map(function (f, i) {
            return '<div class="fila-sobre"><select onchange="App.asigFila(' + i + ',\'sobre\',this.value)">' + opcionesSobre(mon, f.sobre, true) +
              '<option value=""' + (f.sobre === '' ? ' selected' : '') + '>💳 Sin sobre</option></select>' +
              '<input data-dinero inputmode="decimal" value="' + esc(String(f.monto).replace('.', ',')) + '" oninput="App.asigFila(' + i + ',\'monto\',this.value)">' +
              (asig.filas.length > 1 ? '<button class="x" aria-label="Quitar" onclick="App.asigQuitar(' + i + ')">×</button>' : '') + '</div>';
          }).join('') +
          (asig.filas.length > 1 ? '<div class="suave chico" style="margin-top:4px">La última fila se llena sola con lo que falta.</div>' : '') +
          '<button class="btn sec chico" style="justify-content:center;margin-top:6px" onclick="App.asigAgregar()">+ Otro sobre</button>';
  }
  function sumaFilas(hasta) { return asig.filas.reduce(function (a, f, j) { return a + (hasta === undefined || j < hasta ? (C.leerNumero(f.monto) || 0) : 0); }, 0); }
  function asigFila(i, k, v) {
    asig.filas[i][k] = v; if (k === 'sobre') return;
    var ult = asig.filas.length - 1;
    if (i < ult) {   // v2.4: la última fila se llena sola con lo que falta
      var r = Math.max(0, Math.round((p2Resto() - sumaFilas(ult)) * 100) / 100);
      asig.filas[ult].monto = r;
      var ins = document.querySelectorAll('#as-cuerpo .fila-sobre input'); if (ins[ult]) { ins[ult].value = String(r).replace('.', ','); formatearMontos(); }
    }
    var b = $('p2-barra'); if (b) b.innerHTML = p2Barra();
  }
  function asigAgregar() {
    var m = movPorFila(asig.fila), otro = SB().lista.filter(function (s) { return s.moneda === m.moneda && !asig.filas.some(function (f) { return f.sobre === s.nombre; }); })[0];
    asig.filas.push({ sobre: otro ? otro.nombre : asig.filas[0].sobre, monto: Math.max(0, Math.round((p2Resto() - sumaFilas()) * 100) / 100) });
    pintarAsignar();
  }
  // ---- v2.4 (P2): un pago de tarjeta repartido por compras
  /** Compras de la tarjeta que todavía no salieron de un sobre, hasta la fecha del pago */
  function comprasDelPago(m) {
    var sb = SB(), fPago = new Date(m.fecha), mon = m.moneda === 'USD' ? 'USD' : 'CRC', pend = {}, previo = null;
    sb.pendientes.forEach(function (p) { pend[p.mov.fila] = p; });
    D.movimientos.forEach(function (x) { if (x.tipo === 'Pago de tarjeta' && x.cuenta === m.cuenta && x.fila !== m.fila && x.fecha && new Date(x.fecha) < fPago && (!previo || new Date(x.fecha) > previo)) previo = new Date(x.fecha); });
    return D.movimientos.filter(function (x) {
      return x.tipo === 'Gasto' && x.cuenta === m.cuenta && (x.moneda === 'USD' ? 'USD' : 'CRC') === mon && !x.para && x.fecha && new Date(x.fecha) <= fPago && (!sb.desde || new Date(x.fecha) >= sb.desde);
    }).map(function (x) {
      var p = pend[x.fila];
      if (p) return { fila: x.fila, mov: x, comercio: x.comercio || 'Compra', monto: Math.round(p.falta * 100) / 100, tipo: 'pend', grupos: [] };
      var filas = sb.porMov[x.fila] || [];
      if (!filas.length || x.sobre || filas.some(function (f) { return f.sobre; })) return null;   // ya tiene sobre
      if (previo && new Date(x.fecha) <= previo) return null;   // "sin sobre" de antes del pago anterior
      var g = {}; filas.forEach(function (f) { if (f.grupo) g[f.grupo] = 1; });
      return { fila: x.fila, mov: x, comercio: x.comercio || 'Compra', monto: x.monto, tipo: 'sinsobre', grupos: Object.keys(g) };
    }).filter(Boolean).sort(function (a, b) { return new Date(a.mov.fecha) - new Date(b.mov.fecha); });
  }
  /** Sobre sugerido: el último que usaste para ese comercio; si no, el más usado para esa categoría */
  function sugerirSobre(x) {
    var mon = x.moneda === 'USD' ? 'USD' : 'CRC', sb = SB(), existe = {};
    sb.lista.forEach(function (s) { if (s.moneda === mon) existe[s.nombre] = 1; });
    var com = sinTildes(x.comercio).trim(), mejor = null, fMejor = 0, porCat = {};
    D.movimientos.forEach(function (y) {
      if (y.fila === x.fila) return;
      var nombres = (sb.porMov[y.fila] || []).filter(function (f) { return f.sobre && existe[f.sobre]; }).map(function (f) { return f.sobre; });
      if (!nombres.length && y.sobre && existe[y.sobre]) nombres = [y.sobre];
      if (!nombres.length) return;
      var f = new Date(y.fecha).getTime() || 0;
      if (com && sinTildes(y.comercio).trim() === com && f >= fMejor) { mejor = nombres[0]; fMejor = f; }
      if (x.categoria && y.categoria === x.categoria) porCat[nombres[0]] = (porCat[nombres[0]] || 0) + 1;
    });
    if (mejor) return mejor;
    var cats = Object.keys(porCat).sort(function (a, b) { return porCat[b] - porCat[a]; });
    return cats[0] || '';
  }
  function p2Marcado() { return asig.items.reduce(function (a, it) { return a + (it.on ? it.monto : 0); }, 0); }
  function p2Resto() { return Math.max(0, asig.falta - p2Marcado()); }
  function p2Barra() {
    var m = movPorFila(asig.fila), total = m.monto;
    var antes = Math.max(0, total - asig.falta - asig.reservado);   // lo que ya estaba asignado
    var hecho2 = Math.min(total, antes + asig.reservado + Math.min(p2Marcado(), asig.falta) + (asig.manual ? sumaFilas() : 0));
    var falta = Math.max(0, Math.round((total - hecho2) * 100) / 100), ok = falta < 0.01;
    return '<div class="barra" style="height:10px;margin-top:14px"><i style="width:' + Math.round(hecho2 / total * 100) + '%;background:var(--positivo)"></i></div>' +
      '<div class="fila chico" style="margin-top:6px"><span class="suave">Repartido ' + esc(txt(hecho2, m.moneda)) + ' de ' + esc(txt(total, m.moneda)) + '</span>' +
      '<b id="as-falta" style="color:' + (ok ? 'var(--positivo)' : 'var(--acento)') + '">' + (ok ? 'Listo ✓' : 'Falta ' + esc(txt(falta, m.moneda))) + '</b></div>';
  }
  function p2Marcar(i, on) { asig.items[i].on = !!on; if (!asig.manual) asig.filas[0].monto = Math.round(p2Resto() * 100) / 100; else { var ult = asig.filas.length - 1; asig.filas[ult].monto = Math.max(0, Math.round((p2Resto() - sumaFilas(ult)) * 100) / 100); } pintarAsignar(); }
  function p2Sobre(i, v) { asig.items[i].sobre = v; if (v && !asig.items[i].on) asig.items[i].on = true; pintarAsignar(); }
  function p2Sugerir() {
    var sin = [];
    asig.items.forEach(function (it) { if (it.on && !it.sobre) { it.sobre = sugerirSobre(it.mov); if (!it.sobre) sin.push(it.comercio); } });
    pintarAsignar();
    if (sin.length) toast('No encontré sobre para ' + sin.join(', ') + '. Elegilo vos.');
  }
  function p2Manual() { asig.manual = true; asig.filas = [{ sobre: sobreTarjetas() || '', monto: Math.round(p2Resto() * 100) / 100 }]; pintarAsignar(); }
  function asigQuitar(i) { asig.filas.splice(i, 1); pintarAsignar(); }
  function guardarPagoTarjeta(m, g) {
    var marcadas = asig.items.filter(function (it) { return it.on; }), lista = [], suma = 0;
    var sinSobre = marcadas.filter(function (it) { return !it.sobre; })[0];
    if (sinSobre) return toast('Elegí el sobre de ' + sinSobre.comercio + '.');
    marcadas.forEach(function (it) { lista.push({ fecha: fechaSobre(it.mov), sobre: it.sobre, monto: -it.monto, tipo: 'Compra con tarjeta', movimiento: it.fila, grupo: g, nota: it.comercio }); });
    if (asig.manual) {
      var dup = {}, rep2 = false;
      asig.filas.forEach(function (f) {
        var v = C.leerNumero(f.monto) || 0; if (v <= 0) return;
        if (dup[f.sobre]) rep2 = true; dup[f.sobre] = 1; suma += v;
        lista.push({ fecha: fechaSobre(m), sobre: f.sobre, monto: -v, tipo: 'Pago tarjeta', movimiento: m.fila, grupo: g, nota: m.comercio || '' });
      });
      if (rep2) return toast('Hay un sobre repetido.');
      if (suma > p2Resto() + 0.01) return toast('Asignaste más de lo que falta (' + txt(p2Resto(), m.moneda) + ').');
    }
    if (!lista.length) return toast(asig.items.length ? 'Marcá al menos una compra.' : 'Escribí cuánto salió de cada sobre.');
    marcadas.forEach(function (it) { it.grupos.forEach(function (gr) { encolar('eliminarGrupoSobres', [gr], 'Quitar «sin sobre» de ' + it.comercio); }); });
    var total = lista.reduce(function (s, x) { return s + Math.abs(x.monto); }, 0);
    encolar('guardarSobresMov', [lista], 'Pago ' + (m.comercio || 'de tarjeta') + ': ' + (marcadas.length ? marcadas.length + ' compras' : '') + (marcadas.length && suma ? ' + ' : '') + (suma ? lista.length - marcadas.length + ' sobres' : '') + ' · ' + txt(total, m.moneda));
    hecho('✅ Pago repartido');
  }
  function guardarAsignar() {
    var m = movPorFila(asig.fila), g = grupoNuevo(), filas = [];
    if (asig.modo === 'repartir') { cerrar(); return irReparto(asig.fila); }
    if (asig.modo === 'otro') {
      var para = val('as-para').trim(), nota = val('as-nota').trim();
      if (!para) return toast('Escribí quién te la debe.');
      encolar('marcarMovimiento', [m.fila, 'Para otra persona', para, { monto: m.monto }], 'Para ' + para + ': ' + (m.comercio || 'compra') + ' · ' + txt(m.monto, m.moneda));
      if (nota) encolar('marcarMovimiento', [m.fila, 'Nota', nota, { monto: m.monto }], 'Nota: ' + nota);
      return hecho('🤝 Anotado en «Me deben»: ' + para);
    }
    if (m.tipo === 'Pago de tarjeta') return guardarPagoTarjeta(m, g);
    if (asig.modo === 'varios') {
      var lv = [], sv = 0, dupv = {}, repv = false;
      asig.filas.forEach(function (f) {
        var v = C.leerNumero(f.monto) || 0; if (v <= 0) return;
        if (dupv[f.sobre]) repv = true; dupv[f.sobre] = 1; sv += v;
        lv.push({ fecha: fechaSobre(m), sobre: f.sobre, monto: -v, tipo: !f.sobre ? 'Sin sobre' : asig.tarjeta ? 'Compra con tarjeta' : 'Gasto', movimiento: m.fila, grupo: g, nota: m.comercio || '' });
      });
      if (!lv.length) return toast('Escribí cuánto salió de cada sobre.');
      if (repv) return toast('Hay un sobre repetido.');
      if (sv > asig.falta + 0.01) return toast('Asignaste más que el movimiento (' + txt(asig.falta, m.moneda) + ').');
      encolar('guardarSobresMov', [lv], 'Asignar ' + (m.comercio || m.tipo) + ' → ' + lv.map(function (x) { return x.sobre || 'sin sobre'; }).join(', ') + ' · ' + txt(sv, m.moneda));
      return hecho('✅ Repartido en ' + lv.length + ' sobres');
    }
    {
      var monto = C.leerNumero(val('as-monto'));
      if (!monto || monto <= 0) return toast('Escribí el monto.');
      if (monto > asig.falta + 0.01) return toast('El monto es mayor que lo que falta asignar (' + txt(asig.falta, m.moneda) + ').');
      var sobre = asig.modo === 'tarjetas' ? sobreTarjetas() : asig.modo === 'ninguno' ? '' : val('as-sobre');
      if (!sobre && asig.sentido === 'sale') asig.modo = 'ninguno';
      filas.push({ sobre: sobre, monto: asig.sentido === 'entra' ? monto : -monto });
    }
    var tipo = m.tipo === 'Pago de tarjeta' ? 'Pago tarjeta' : asig.modo === 'ninguno' ? 'Sin sobre' : asig.sentido === 'entra' ? 'Asignación' : asig.tarjeta ? 'Compra con tarjeta' : 'Gasto';
    var lista = filas.map(function (f) { return { fecha: fechaSobre(m), sobre: f.sobre, monto: f.monto, tipo: tipo, movimiento: m.fila, grupo: g, nota: m.comercio || '' }; });
    var recordar = $('as-recordar') && $('as-recordar').checked && lista[0].sobre;
    var b = $('as-ok');
    var destino = lista.map(function (x) { return x.sobre || 'sin sobre'; }).join(', ');
    encolar('guardarSobresMov', [lista], 'Asignar ' + (m.comercio || m.tipo) + ' → ' + destino + ' · ' + txt(Math.abs(lista.reduce(function (s, x) { return s + x.monto; }, 0)), m.moneda));
    if (recordar) encolar('guardarReglaSobre', [m.comercio, lista[0].sobre], 'Recordar ' + m.comercio + ' → ' + lista[0].sobre);
    hecho('✅ Asignado' + (lista.length === 1 && lista[0].sobre ? ' a ' + lista[0].sobre : ''));
  }

  // ---- repartir un ingreso
  var rep = null;
  function irReparto(fila) {
    var m = movPorFila(fila), p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0];
    if (!m || !p) return toast('Este ingreso ya está asignado.');
    var r = C.reparto(D, p.falta, m.moneda);
    rep = { fila: fila, monto: p.falta, moneda: m.moneda, ajuste: r.ajuste, filas: r.filas.map(function (f) { return { nombre: f.nombre, monto: f.monto }; }), siempre: r.siempre, guardar: false };
    var ant = C.esSalario(m) ? repartoAnteriorSalario(m) : null;   // v2.5: el salario empieza con lo que repartiste la vez anterior
    if (ant) {
      rep.ajuste = null; rep.salario = ant.fecha;
      rep.filas.forEach(function (f) { f.monto = Math.round((ant.por[f.nombre] || 0) * 100) / 100; });
      rep.siempre = rep.filas.reduce(function (a, f) { return a + f.monto; }, 0);
    }
    ir('reparto');
  }
  function repSuma() { return rep.filas.reduce(function (a, f) { return a + (Number(f.monto) || 0); }, 0); }
  function repRecalcular() {
    if (!rep.ajuste) return;
    var otros = rep.filas.reduce(function (a, f) { return a + (f.nombre === rep.ajuste ? 0 : (Number(f.monto) || 0)); }, 0);
    rep.filas.forEach(function (f) { if (f.nombre === rep.ajuste) f.monto = Math.round((rep.monto - otros) * 100) / 100; });
  }
  function pReparto() {
    if (!rep) { pantalla = 'sobres'; return pintar(); }
    var m = movPorFila(rep.fila), mon = rep.moneda;
    var h = cabSimple('Repartir', esc((m && m.comercio) || 'Ingreso') + ' · ' + fechaCorta(m && m.fecha), 'App.ir(\'porasignar\')');
    var dif = rep.monto - rep.siempre;
    h += '<div class="hero"><span class="et" style="font-size:13px;font-weight:600">Entró</span><div class="grande">' + din(rep.monto, mon) + '</div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">' + (rep.salario ? 'Tu reparto del salario anterior (' + fechaCorta(rep.salario) + ')' : 'Tu reparto de siempre') + '</span><b>' + din(rep.siempre, mon) + '</b></div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Diferencia' + (rep.ajuste ? ' → ' + esc(rep.ajuste) : '') + '</span><b style="color:var(--acento)">' + (dif >= 0 ? '+' : '−') + din(Math.abs(dif), mon) + '</b></div></div>';
    h += '<label class="campo compacto" style="margin-top:0"><span>Sobre de ajuste (recibe o cubre la diferencia)</span><select onchange="App.repAjuste(this.value)"><option value="">— Ninguno —</option>' +
      rep.filas.map(function (f) { return '<option' + (f.nombre === rep.ajuste ? ' selected' : '') + '>' + esc(f.nombre) + '</option>'; }).join('') + '</select></label>';
    h += '<div class="caja" style="gap:0">' + rep.filas.map(function (f, i) {
      var aj = f.nombre === rep.ajuste;
      return '<div class="fila-rep' + (aj ? ' aj' : '') + '"><span>' + iconoSobre(f.nombre) + ' ' + esc(nomSobre(f.nombre)) + (aj ? ' <span class="pill" style="font-size:10px;padding:2px 6px">AJUSTE</span>' : '') + '</span>' +
        '<input data-dinero inputmode="decimal" value="' + esc(String(f.monto).replace('.', ',')) + '"' + (aj ? ' readonly' : ' oninput="App.repCambio(' + i + ',this.value)"') + '></div>';
    }).join('') + '</div>';
    var falta = rep.monto - repSuma();
    h += '<div class="fila"><span class="suave">Por repartir</span><b id="rep-falta" style="color:' + (Math.abs(falta) < 0.01 ? 'var(--positivo)' : 'var(--acento)') + '">' + txt(falta, mon) + (Math.abs(falta) < 0.01 ? ' ✓' : '') + '</b></div>' +
      (rep.salario ? '<button class="btn sec chico" style="margin-top:8px" onclick="App.repCero()">Empezar de cero</button>' : '') +
      '<label class="check"><input type="checkbox" id="rep-guardar"' + (rep.guardar ? ' checked' : '') + ' onchange="App.repGuardarCheck(this.checked)"> Guardar estos montos como mi reparto de siempre</label>' +
      '<button class="btn" id="rep-ok" onclick="App.guardarRepartoMov()">Repartir</button>';
    $('p-reparto').innerHTML = h;
  }
  function repCero() { rep.filas.forEach(function (f) { f.monto = 0; }); rep.ajuste = null; pintar(); }
  function repCambio(i, v) {
    rep.filas[i].monto = C.leerNumero(v) || 0;
    repRecalcular();
    var aj = rep.filas.map(function (f) { return f.nombre; }).indexOf(rep.ajuste);
    if (aj >= 0) { var inp = document.querySelectorAll('#p-reparto .fila-rep input')[aj]; if (inp) inp.value = formatoMonto(String(rep.filas[aj].monto).replace('.', ',')); }
    var falta = rep.monto - repSuma(), e = $('rep-falta'), ok = Math.abs(falta) < 0.01;
    if (e) { e.textContent = txt(falta, rep.moneda) + (ok ? ' ✓' : ''); e.style.color = ok ? 'var(--positivo)' : 'var(--acento)'; }
  }
  function repAjuste(n) {
    var r = C.reparto(D, rep.monto, rep.moneda, n || '__ninguno__');
    rep.ajuste = n || null;
    rep.filas.forEach(function (f) { var x = r.filas.filter(function (y) { return y.nombre === f.nombre; })[0]; if (x && f.nombre === rep.ajuste) f.monto = x.monto; });
    repRecalcular(); pintar();
  }
  function guardarRepartoMov() {
    var m = movPorFila(rep.fila), falta = rep.monto - repSuma();
    if (Math.abs(falta) >= 0.01) return toast(falta > 0 ? 'Todavía quedan ' + txt(falta, rep.moneda) + ' por repartir.' : 'Repartiste ' + txt(-falta, rep.moneda) + ' de más.');
    if (rep.filas.some(function (f) { return f.monto < 0; })) return toast('Un sobre quedó en negativo. Bajá otro monto.');
    var g = grupoNuevo();
    var lista = rep.filas.filter(function (f) { return f.monto > 0; }).map(function (f) {
      return { fecha: fechaSobre(m), sobre: f.nombre, monto: f.monto, tipo: 'Reparto', movimiento: rep.fila, grupo: g, nota: m.comercio || '' };
    });
    var guardarSiempre = rep.guardar;
    var base = rep.filas.map(function (f) {
      var s = D.sobres.filter(function (x) { return x.nombre === f.nombre; })[0];
      return { nombre: f.nombre, monto: f.nombre === rep.ajuste ? (s ? s.asignado : 0) : f.monto };
    });
    var ajuste = rep.ajuste;
    encolar('guardarSobresMov', [lista], 'Repartir ' + (m.comercio || 'ingreso') + ' en ' + lista.length + ' sobres · ' + txt(rep.monto, rep.moneda));
    if (guardarSiempre) encolar('guardarReparto', [base, ajuste], 'Guardar reparto de siempre');
    var n = lista.length; rep = null; pantalla = 'sobres';
    hecho('✅ Repartido en ' + n + ' sobres');
  }

  // ---- mover entre sobres
  function formMover(desde) {
    var mon = 'CRC';
    abrir('<h2>Mover entre sobres</h2>' +
      '<label class="campo"><span>De</span><select id="mv-de">' + opcionesSobre(mon, desde, true) + '</select></label>' +
      '<label class="campo"><span>A</span><select id="mv-a">' + opcionesSobre(mon, sobreTarjetas() && desde !== sobreTarjetas() ? sobreTarjetas() : null, true) + '</select></label>' +
      '<label class="campo"><span>Monto</span><input id="mv-monto" data-dinero inputmode="decimal" placeholder="0"></label>' +
      '<label class="campo"><span>Nota</span><input id="mv-nota" placeholder="Opcional"></label>' +
      '<div class="acciones"><button class="btn" id="mv-ok" onclick="App.guardarMover()">Mover</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarMover() {
    var de = val('mv-de'), a = val('mv-a'), monto = C.leerNumero(val('mv-monto'));
    if (de === a) return toast('Elegí dos sobres distintos.');
    if (!monto || monto <= 0) return toast('Escribí el monto.');
    var g = grupoNuevo(), f = new Date().toISOString(), nota = val('mv-nota').trim() || ('De ' + de + ' a ' + a);
    var mv = [{ fecha: f, sobre: de, monto: -monto, tipo: 'Mover', grupo: g, nota: nota }, { fecha: f, sobre: a, monto: monto, tipo: 'Mover', grupo: g, nota: nota }];
    encolar('guardarSobresMov', [mv], 'Mover ' + de + ' → ' + a + ' · ' + txt(monto, 'CRC'));
    hecho('✅ Movido ' + txt(monto, 'CRC') + ' a ' + a);
  }

  // ---- limpiar sobres (fin de mes)
  var limpiar = null;
  function pLimpiar() {
    var sb = SB();
    if (!limpiar) {
      limpiar = { destino: sobreTarjetas() || ((sb.lista.filter(function (s) { return s.tipo === 'Ahorro'; })[0] || sb.lista[0] || {}).nombre || ''), sel: {} };
      sb.lista.forEach(function (s) { if (s.tipo === 'Variable' && s.saldo > 0.005) limpiar.sel[s.nombre] = true; });
    }
    var h = cabSimple('Limpiar sobres', nombreMes(mes), 'App.ir(\'sobres\')');
    h += '<div class="suave">Elegí qué sobres vaciar y a dónde va lo que les sobró.</div>';
    var cand = sb.lista.filter(function (s) { return s.moneda === 'CRC' && s.saldo > 0.005 && s.nombre !== limpiar.destino; });
    var total = 0;
    h += '<div class="caja" style="gap:0">' + (cand.length ? cand.map(function (s) {
      var on = !!limpiar.sel[s.nombre]; if (on) total += s.saldo;
      return '<label class="fila-rep"><span><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="App.limpiarSel(\'' + esc(s.nombre).replace(/'/g, '\\\'') + '\',this.checked)" style="width:20px;height:20px;accent-color:var(--relleno);vertical-align:middle;margin-right:8px">' + esc(nomSobre(s.nombre)) +
        (s.tipo !== 'Variable' ? ' <span class="suave chico">(' + esc(s.tipo.toLowerCase()) + ')</span>' : '') + '</span><b>' + din(s.saldo, 'CRC') + '</b></label>';
    }).join('') : '<div class="suave">No hay sobres con saldo para limpiar.</div>') + '</div>';
    h += '<div class="fila"><span>Total a mover</span><b style="font-size:20px;color:var(--acento)">' + din(total, 'CRC') + '</b></div>' +
      '<label class="campo compacto" style="margin-top:0"><span>Mover a</span><select onchange="App.limpiarDestino(this.value)">' + opcionesSobre('CRC', limpiar.destino, false) + '</select></label>' +
      '<button class="btn" id="lp-ok" onclick="App.guardarLimpiar()"' + (total > 0 ? '' : ' disabled') + '>Mover ' + txt(total, 'CRC') + ' a ' + esc(limpiar.destino) + '</button>';
    $('p-limpiar').innerHTML = h;
  }
  function guardarLimpiar() {
    var sb = SB(), g = grupoNuevo(), f = new Date().toISOString(), lista = [], total = 0;
    sb.lista.forEach(function (s) {
      if (limpiar.sel[s.nombre] && s.moneda === 'CRC' && s.saldo > 0.005 && s.nombre !== limpiar.destino) {
        total += s.saldo; lista.push({ fecha: f, sobre: s.nombre, monto: -Math.round(s.saldo * 100) / 100, tipo: 'Limpiar', grupo: g, nota: 'Limpiar sobres → ' + limpiar.destino });
      }
    });
    if (!lista.length) return toast('Elegí al menos un sobre.');
    lista.push({ fecha: f, sobre: limpiar.destino, monto: Math.round(total * 100) / 100, tipo: 'Limpiar', grupo: g, nota: 'Limpiar sobres (' + (lista.length) + ' sobres)' });
    var dest = limpiar.destino;
    encolar('guardarSobresMov', [lista], 'Limpiar sobres → ' + dest + ' · ' + txt(total, 'CRC'));
    limpiar = null; pantalla = 'sobres';
    hecho('✅ ' + txt(total, 'CRC') + ' pasaron a ' + dest);
  }

  // ---- un sobre (editar y ver su mes)
  function formSobre(i, soloEditar) {
    if (i === undefined) {
      return abrir('<h2>Nuevo sobre</h2><label class="campo"><span>Nombre</span><input id="s-nombre" placeholder="Ej. Mascotas"></label>' +
        '<div class="dos"><label class="campo"><span>Moneda</span><select id="s-moneda"><option value="CRC">Colones ₡</option><option value="USD">Dólares $</option></select></label>' +
        '<label class="campo"><span>Tipo</span><select id="s-tipo"><option>Variable</option><option>Fijo</option><option>Ahorro</option></select></label></div>' +
        '<label class="campo"><span>Reparto de siempre (por mes)</span><input id="s-monto" data-dinero inputmode="decimal" placeholder="0"></label>' +
        '<label class="campo"><span>Saldo inicial (lo que tiene hoy)</span><input id="s-saldo" data-dinero inputmode="decimal" placeholder="0"></label>' +
        '<div class="acciones"><button class="btn" id="s-ok" onclick="App.guardarSob()">Crear sobre</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    }
    var s = SB().lista[i];
    var movs = soloEditar ? [] : s.movs.slice().sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    var r = function (n) { return n === null || n === undefined ? '' : String(n).replace('.', ','); };
    abrir('<h2>' + iconoSobre(s.nombre) + ' ' + esc(nomSobre(s.nombre)) + '</h2><div class="fila"><span class="suave">Saldo</span><b style="font-size:22px">' + din(s.saldo, s.moneda) + '</b></div>' +
      (movs.length ? '<div class="caja sinpad" style="margin-top:8px">' + movs.slice(0, 8).map(function (e) {
        return '<div class="item" style="cursor:default;padding:10px 14px"><span class="cuerpo"><span class="nombre" style="display:block;font-size:14px">' + esc(e.tipo || '') + (e.nota ? ' · ' + esc(e.nota) : '') + '</span><span class="det" style="display:block">' + fechaCorta(e.fecha) + '</span></span>' +
          '<span class="monto"><b class="' + (e.monto >= 0 ? 'verde' : '') + '">' + (e.monto >= 0 ? '+' : '−') + din(Math.abs(e.monto), s.moneda) + '</b></span></div>';
      }).join('') + '</div>' : soloEditar ? '' : '<div class="suave chico">Sin movimientos en ' + nombreMes(mes).toLowerCase() + '.</div>') +
      (s.asignadoAuto ? '' : '<label class="campo"><span>Reparto de siempre (por mes)</span><input id="s-monto" data-dinero inputmode="decimal" value="' + r(s.asignado) + '"></label>') +
      '<div class="dos-campos"><label class="campo compacto"><span>Saldo inicial</span><input id="s-saldo" data-dinero inputmode="decimal" value="' + r(s.saldoInicial) + '"></label>' +
      '<label class="campo compacto"><span>Meta (opcional)</span><input id="s-meta" data-dinero inputmode="decimal" value="' + r(s.meta) + '"></label></div>' +
      '<label class="campo compacto"><span>Tipo</span><select id="s-tipo">' + ['Variable', 'Fijo', 'Ahorro'].map(function (t) { return '<option' + (s.tipo === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
      '<div class="acciones"><button class="btn" id="s-ok" onclick="App.guardarSob(' + s.fila + ',' + (s.asignadoAuto ? s.asignado : 'null') + ')">Guardar</button>' +
      (soloEditar ? '' : '<button class="btn sec" onclick="App.formMover(\'' + esc(s.nombre).replace(/'/g, '\\\'') + '\')">Mover desde este sobre</button>') + '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarSob(fila, asignadoFijo) {
    var monto = asignadoFijo !== null && asignadoFijo !== undefined ? asignadoFijo : C.leerNumero(val('s-monto'));
    if (monto === null || monto < 0) return toast('Escribí un monto válido.');
    var saldo = C.leerNumero(val('s-saldo')) || 0, meta = $('s-meta') ? C.leerNumero(val('s-meta')) : null;
    var s = fila ? { fila: fila, asignado: monto, saldoInicial: saldo, meta: meta || '', tipo: val('s-tipo') }
      : { nombre: val('s-nombre').trim(), moneda: val('s-moneda'), tipo: val('s-tipo'), asignado: monto, saldoInicial: saldo };
    if (!fila && !s.nombre) return toast('Falta el nombre del sobre.');
    srv('guardarSobre', [s], function () { listo('✅ Sobre guardado'); }, $('s-ok'));
  }

  /** Dentro de un movimiento: a qué sobres quedó asignado (y cambiarlo). */
  function bloqueSobresDeMov(m) {
    if (sinServidorSobres() || !C.sentidoSobre(D, m)) return '';
    if (m.fecha && new Date(m.fecha) < new Date(D.sobresDesde)) return '';
    var sb = SB(), filas = sb.porMov[m.fila] || [], pend = sb.pendientes.filter(function (p) { return p.mov.fila === m.fila; })[0];
    var h = '<div class="caja" style="margin-top:14px;background:var(--fondo);gap:6px"><b style="font-size:14px">Sobres</b>';
    if (sb.cubierto[m.fila]) h += '<div class="fila chico"><span>✓ Cubierto con lo reservado de tus compras</span><b class="verde">' + esc(txt(sb.cubierto[m.fila], m.moneda)) + '</b></div>';
    if (filas.length) h += filas.map(function (x) { return '<div class="fila chico"><span>' + (x.sobre ? iconoSobre(x.sobre) + ' ' + esc(nomSobre(x.sobre)) : '💳 Sin sobre') + '</span><span>' + (x.monto >= 0 ? '+' : '−') + esc(txt(Math.abs(x.monto), m.moneda)) + '</span></div>'; }).join('');
    else if (m.sobre && !pend) h += '<div class="fila chico"><span>' + esc(nomSobre(m.sobre)) + ' (por regla)</span><span>' + esc(txt(m.monto, m.moneda)) + '</span></div>';
    if (pend) h += '<button class="btn sec chico" style="justify-content:center" onclick="App.formAsignar(' + m.fila + ')">' + (filas.length ? 'Asignar lo que falta (' + esc(txt(pend.falta, m.moneda)) + ')' : 'Asignar a sobres') + '</button>';
    if (filas.length) h += '<button class="btn sec chico peligro" style="justify-content:center" id="sb-deshacer" onclick="App.deshacerSobres(' + m.fila + ')">Deshacer la asignación</button>';
    return h + '</div>';
  }
  function deshacerSobres(fila) {
    var b = $('sb-deshacer');
    if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Tocá otra vez'; return; }
    var grupos = {}; (SB().porMov[fila] || []).forEach(function (x) { if (x.grupo) grupos[x.grupo] = 1; });
    var lista = Object.keys(grupos), i = 0;
    var mm = movPorFila(fila);
    lista.forEach(function (g) { encolar('eliminarGrupoSobres', [g], 'Deshacer asignación de ' + ((mm && mm.comercio) || 'movimiento')); });
    hecho('Asignación deshecha. Quedó por asignar.');
  }

  // ------------------------------------------------------------ FONDOS DE INVERSIÓN (v1.7)
  function FD() { return C.fondos(D, hoy); }
  function sobreFondos() { return (D.sobreEspecial || {}).fondos || ''; }
  function sinServidorV17() { return !D.fondos; }
  function avisoV17() { return '<div class="caja vacio">Para esto hay que actualizar el código del servidor (Apps Script) a la versión 1.7.</div>'; }

  function itemFondoPend(m) {
    var sug = C.sugerirSubcuenta(D, m);
    return '<button class="item" onclick="App.formSubcuenta(' + m.fila + ')"><span class="ico" style="background:rgba(61,139,253,.15);color:#3D8BFD">' + ico('sube') + '</span>' +
      '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(m.tipo === 'Inversión' ? 'Inversión' : 'Retiro') + ' · ' + esc(fechaCorta(m.fecha)) + '</span>' +
      '<span class="det" style="display:block">¿A qué subcuenta?' + (sug ? ' Sugerida: ' + esc(sug) : '') + '</span></span>' +
      '<span class="monto"><b style="display:block">' + din(m.monto, m.moneda) + '</b></span></button>';
  }
  function pFondos() {
    var h = cabSimple('Fondos', 'Inversiones', null, sinServidorV17() ? '' : botonNuevo('Subcuenta', 'App.formFondo()'));
    if (sinServidorV17()) { $('p-fondos').innerHTML = h + avisoV17(); return; }
    var fd = FD();
    var sobreF = D.sobresDesde ? SB().lista.filter(function (s) { return s.nombre === sobreFondos(); })[0] : null;
    var interesesTot = fd.lista.reduce(function (a, f) { return a + (f.intereses || 0); }, 0);
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">Total invertido</span>' + botonOjo() + '</div>' +
      '<div class="grande">' + din(fd.total.CRC, 'CRC') + '</div>' + (fd.total.USD ? '<div class="medio">' + din(fd.total.USD, 'USD') + '</div>' : '') +
      (interesesTot ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Intereses (últimos ajustes)</span><b class="' + (interesesTot < 0 ? 'rojo' : 'verde') + '">' + (interesesTot < 0 ? '−' : '+') + din(Math.abs(interesesTot), 'CRC') + '</b></div>' : '') +
      (sobreF ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Sobre Fondos (sin invertir)</span><b style="color:var(--acento)">' + din(sobreF.saldo, 'CRC') + '</b></div>' : '') + '</div>';
    if (fd.lista.length) h += '<button class="btn borde" onclick="App.elegirArchivo(\'pdf\')">📄 Cargar estado de cuenta (PDF)</button>';
    if (fd.pendientes.length) h += plegable('fo-pend', '📈 <b>' + fd.pendientes.length + '</b> movimiento' + (fd.pendientes.length === 1 ? '' : 's') + ' sin subcuenta', 'Asignar', fd.pendientes.map(itemFondoPend).join(''), 'alerta');
    if (!fd.lista.length) h += '<div class="vacio-lindo"><div class="dibujo">📈</div><b>Agregá tus subcuentas</b><span>Los nombres y saldos están en tu estado de cuenta de BCR SAFI.</span><button class="btn" onclick="App.formFondo()">＋ Agregar subcuenta</button></div>';
    else h += '<div class="seccion">Subcuentas · ' + fd.lista.length + '</div><div class="caja sinpad">' + fd.lista.map(function (f, i) {
      var det = (f.aportesMes ? '+' + din(f.aportesMes, f.moneda) + ' este mes · ' : '') + (f.retirosMes ? '−' + din(f.retirosMes, f.moneda) + ' retirado · ' : '') +
        'saldo al ' + (f.fechaSaldo ? fechaCorta(f.fechaSaldo) : '—');
      return '<button class="item" style="flex-direction:column;align-items:stretch;gap:6px" onclick="App.formFondo(' + i + ')">' +
        '<span class="fila"><span style="font-weight:700">' + esc(f.nombre) + '</span><span class="fuerte">' + din(f.saldo, f.moneda) + '</span></span>' +
        (f.meta ? barra(Math.max(0, Math.min(1, f.saldo / f.meta))) + '<span class="chico suave">Meta ' + din(f.meta, f.moneda) + (f.saldo < f.meta ? ' · faltan ' + din(f.meta - f.saldo, f.moneda) : ' · ¡lograda!') + '</span>' : '') +
        '<span class="chico suave">' + det + '</span></button>';
    }).join('') + '</div>';
    var ult = D.movimientos.filter(function (m) { return m.tipo === 'Inversión' || m.tipo === 'Retiro de fondo'; }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); }).slice(0, 8);
    if (ult.length) h += plegable('fo-ult', 'Últimos movimientos', String(ult.length), ult.map(function (m) {
      return '<button class="item" onclick="App.formSubcuenta(' + m.fila + ')"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(m.tipo === 'Inversión' ? 'Inversión' : 'Retiro') + ' · ' + esc(m.subcuenta || 'sin subcuenta') + '</span>' +
        '<span class="det" style="display:block">' + esc(fechaCorta(m.fecha) + (m.nota ? ' · ' + m.nota : '')) + '</span></span>' +
        '<span class="monto"><b class="' + (m.tipo === 'Inversión' ? '' : 'verde') + '" style="display:block">' + (m.tipo === 'Inversión' ? '' : '+') + din(m.monto, m.moneda) + '</b></span></button>';
    }).join(''));
    h += '<div class="suave chico" style="text-align:center">Las inversiones salen solas del sobre Fondos. Cuando llegue el estado de cuenta, tocá una subcuenta → Actualizar saldo.</div>';
    $('p-fondos').innerHTML = h;
  }
  function opcionesSubcuenta(sel) {
    return FD().lista.map(function (f) { return '<option' + (f.nombre === sel ? ' selected' : '') + '>' + esc(f.nombre) + '</option>'; }).join('');
  }
  function formSubcuenta(fila) {
    var m = movPorFila(fila); if (!m) return;
    if (!FD().lista.length) return toast('Primero agregá tus subcuentas en Fondos.', 4500);
    var sug = m.subcuenta || C.sugerirSubcuenta(D, m);
    abrir('<div class="suave chico">' + esc(m.tipo) + ' · ' + fechaCorta(m.fecha) + '</div><h2>' + esc(m.comercio || m.tipo) + '</h2>' +
      '<div class="grande" style="font-size:26px;font-weight:800">' + din(m.monto, m.moneda) + '</div>' + (m.nota ? '<div class="suave chico">' + esc(m.nota) + '</div>' : '') +
      '<label class="campo"><span>Subcuenta' + (sug && !m.subcuenta ? ' (sugerida por el monto)' : '') + '</span><select id="sc-sel">' + opcionesSubcuenta(sug) + '</select></label>' +
      '<div class="acciones"><button class="btn" id="sc-ok" onclick="App.guardarSubcuenta(' + fila + ')">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarSubcuenta(fila) {
    var m = movPorFila(fila);
    var sc = val('sc-sel');
    encolar('marcarMovimiento', [fila, 'Subcuenta', sc, { monto: m.monto }], 'Subcuenta ' + sc + ' · ' + txt(m.monto, m.moneda));
    hecho('✅ Asignado a ' + sc);
  }
  function formFondo(i) {
    var f = i === undefined ? null : FD().lista[i];
    var r = function (n) { return n === null || n === undefined ? '' : String(n).replace('.', ','); };
    var h = '<h2>' + (f ? esc(f.nombre) : 'Nueva subcuenta') + '</h2>';
    if (f) h += '<div class="fila"><span class="suave">Saldo calculado</span><b style="font-size:20px">' + din(f.saldo, f.moneda) + '</b></div>' +
      '<button class="btn" onclick="App.formActualizarFondo(' + i + ')">Actualizar saldo (estado de cuenta)</button>';
    h += '<label class="campo"><span>Nombre (como en BCR SAFI)</span><input id="fo-nombre" value="' + esc(f ? f.nombre : '') + '" placeholder="Ej. Marchamo 2026"></label>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Fondo</span><input id="fo-fondo" value="' + esc(f ? f.fondo : 'BCR Mixto Colones') + '"></label>' +
      '<label class="campo compacto"><span>Moneda</span><select id="fo-moneda"><option value="CRC"' + (!f || f.moneda === 'CRC' ? ' selected' : '') + '>₡</option><option value="USD"' + (f && f.moneda === 'USD' ? ' selected' : '') + '>$</option></select></label></div>' +
      (f ? '' : '<label class="campo compacto"><span>Saldo actual</span><input id="fo-saldo" data-dinero inputmode="decimal" placeholder="0"></label>') +
      '<label class="campo compacto"><span>Meta (opcional)</span><input id="fo-meta" data-dinero inputmode="decimal" value="' + r(f ? f.meta : '') + '"></label>' +
      '<div class="acciones"><button class="btn' + (f ? ' sec' : '') + '" id="fo-ok" onclick="App.guardarFondo(' + (f ? f.fila : 0) + ')">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    abrir(h);
  }
  function guardarFondo(fila) {
    var f = { fila: fila || null, nombre: val('fo-nombre').trim(), fondo: val('fo-fondo').trim(), moneda: val('fo-moneda'), meta: C.leerNumero(val('fo-meta')) || '' };
    if (!fila) f.saldo = C.leerNumero(val('fo-saldo')) || 0;
    if (!f.nombre) return toast('Falta el nombre.');
    srv('guardarFondo', [f], function () { listo('✅ Subcuenta guardada'); }, $('fo-ok'));
  }
  function formActualizarFondo(i) {
    var f = FD().lista[i];
    abrir('<h2>Actualizar ' + esc(f.nombre) + '</h2><div class="suave">Escribí el saldo que dice tu estado de cuenta. La diferencia con lo calculado se anota como intereses.</div>' +
      '<div class="fila" style="margin-top:10px"><span class="suave">Calculado por la app</span><b>' + din(f.saldo, f.moneda) + '</b></div>' +
      '<label class="campo"><span>Saldo según BCR SAFI</span><input id="af-saldo" data-dinero inputmode="decimal" oninput="App.vistaFondo(' + i + ')" placeholder="0"></label>' +
      '<div class="fila"><span class="suave">Intereses</span><b id="af-int">—</b></div>' +
      '<div class="acciones"><button class="btn" id="af-ok" onclick="App.guardarActualizarFondo(' + i + ')">Guardar saldo</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function vistaFondo(i) {
    var f = FD().lista[i], n = C.leerNumero(val('af-saldo'));
    $('af-int').innerHTML = n === null ? '—' : '<span class="' + (n - f.saldo >= 0 ? 'verde' : 'rojo') + '">' + (n - f.saldo >= 0 ? '+' : '−') + din(Math.abs(n - f.saldo), f.moneda) + '</span>';
  }
  function guardarActualizarFondo(i) {
    var f = FD().lista[i], n = C.leerNumero(val('af-saldo'));
    if (n === null || n < 0) return toast('Escribí el saldo.');
    srv('actualizarSaldoFondo', [f.fila, n, n - f.saldo], function () { listo('✅ Saldo actualizado'); }, $('af-ok'));
  }

  // ------------------------------------------------------------ PRESUPUESTO DE VIAJE (v1.7)
  var viajeSel = null;
  var ICON_CAT = { Vuelos: '✈️', Transporte: '🚕', Comida: '🍽️', Hospedaje: '🏨', Tours: '🎟️', Compras: '🛍️', Otros: '•' };
  var COLOR_CAT = { Vuelos: '#5B8DEF', Transporte: '#3D8BFD', Comida: '#3DD68C', Hospedaje: '#FF8A3D', Tours: '#B57BFF', Compras: '#F5B82E', Otros: '#9AA1AB' };
  function viajePorFila(f) { return (D.viajes || []).filter(function (v) { return v.fila === f; })[0]; }
  function viajeActual() {
    return (D.viajes || []).filter(function (v) { return v.activo && v.desde && v.hasta && C.viaje(D, v, hoy).estado === 'En curso'; })[0] || null;
  }
  function tarjetaViajeInicio() {
    var v = viajeActual(); if (!v) return '';
    var r = C.viaje(D, v, hoy), alerta = r.pct >= 0.8;
    return '<button class="caja" style="text-align:left;cursor:pointer;gap:8px;' + (alerta ? 'border-color:var(--naranja-txt)' : '') + '" onclick="App.verViaje(' + v.fila + ')">' +
      '<div class="fila"><b>' + ico('avion', ' style="width:16px;height:16px;vertical-align:-2px"') + ' ' + esc(v.nombre) + '</b><span class="pill' + (r.pct >= 1 ? ' alerta' : '') + '">' + Math.round(r.pct * 100) + '%</span></div>' +
      barra(r.pct, alerta) + '<div class="fila chico"><span class="suave">Disponible ' + din(r.disponible, r.moneda) + '</span><span>' + (r.diasRestantes ? din(r.porDia, r.moneda) + '/día' : '') + '</span></div></button>';
  }
  function pViajes() {
    var h = cabSimple('Viajes', 'Presupuestos', null, sinServidorV17() ? '' : botonNuevo('Nuevo viaje', 'App.formViaje()'));
    if (sinServidorV17()) { $('p-viajes').innerHTML = h + avisoV17(); return; }
    var lista = (D.viajes || []).map(function (v) { return { v: v, r: C.viaje(D, v, hoy) }; });
    if (!lista.length) {
      $('p-viajes').innerHTML = cabSimple('Viajes', 'Presupuestos') + '<div class="vacio-lindo"><div class="dibujo">🧳</div><b>Planeá tu próximo viaje</b>' +
        '<span>Elegís fechas, tarjetas y un límite. La app suma sola cada compra y te avisa al 80% y al 100%.</span>' +
        '<button class="btn" onclick="App.formViaje()">✈ Crear presupuesto de viaje</button></div>';
      return;
    }
    var curso = lista.filter(function (x) { return x.r.estado === 'En curso'; });
    var prox = lista.filter(function (x) { return x.r.estado === 'Próximo'; }).sort(function (a2, b2) { return new Date(a2.v.desde) - new Date(b2.v.desde); });
    var term = lista.filter(function (x) { return x.r.estado === 'Terminado'; }).sort(function (a2, b2) { return new Date(b2.v.desde) - new Date(a2.v.desde); });
    curso.forEach(function (x) {
      h += '<button class="viaje-curso" onclick="App.verViaje(' + x.v.fila + ')"><span class="vc-ic">✈</span><span class="cuerpo"><span class="suave chico">Viaje en curso · ' + Math.round(x.r.pct * 100) + '% usado</span>' +
        '<b>' + esc(x.v.nombre) + '</b><span class="chico">Disponible <b class="' + (x.r.disponible < 0 ? 'rojo' : 'verde-pos') + '">' + din(x.r.disponible, x.r.moneda) + '</b>' + (x.r.diasRestantes ? ' · ' + din(x.r.porDia, x.r.moneda) + ' por día' : '') + '</span>' +
        barra(x.r.pct, x.r.pct >= 0.8) + '</span><span class="flecha">›</span></button>';
    });
    var fila = function (x) {
      var dias = C.diasEntre(hoy, new Date(x.v.desde));
      var pill = x.r.estado === 'Próximo' ? (dias <= 0 ? 'Empieza hoy' : 'En ' + dias + ' día' + (dias === 1 ? '' : 's')) : x.r.estado;
      return '<button class="item" style="flex-direction:column;align-items:stretch;gap:6px" onclick="App.verViaje(' + x.v.fila + ')">' +
        '<span class="fila"><span style="font-weight:700">✈ ' + esc(x.v.nombre) + '</span><span class="pill">' + pill + '</span></span>' + barra(x.r.pct, x.r.pct >= 0.8) +
        '<span class="fila chico suave"><span>' + fechaCorta(x.v.desde) + ' al ' + fechaCorta(x.v.hasta) + '</span><span>' + din(x.r.gastado, x.r.moneda) + ' de ' + din(x.r.limite, x.r.moneda) + ' ›</span></span></button>';
    };
    if (prox.length) h += '<div class="seccion">Próximos</div><div class="caja sinpad">' + prox.map(fila).join('') + '</div>';
    if (term.length) h += plegable('vj-term', 'Viajes terminados', String(term.length), '<div class="caja sinpad" style="border:0">' + term.map(fila).join('') + '</div>');
    if (!curso.length && !prox.length && !term.length) h += '<div class="caja vacio">No hay viajes.</div>';
    $('p-viajes').innerHTML = h;
  }
  function verViaje(f) { viajeSel = f; ir('viaje'); }
  var VJ = { filtro: '' };
  function etiquetaFuente(k) { return k === 'Efectivo' ? '💵 Efectivo' : '💳 ' + etiquetaCuenta(k); }
  function cortoFuente(k) { if (k === 'Efectivo') return 'Efectivo'; if (C.esFamilia({ cuenta: k })) return infoFamilia(k).persona; var c = cuentaPorNombre(k); return c && c.banco ? c.banco : nombreCorto ? nombreCorto(k) : k; }
  function plasticoMini(k) {
    if (k === 'Efectivo') return '<span class="vj-pl" style="background:#2f6b45">💵</span>';
    if (C.esFamilia({ cuenta: k })) { var fx = infoFamilia(k); return '<span class="vj-pl" style="background:' + colorBanco(fx.banco) + '">' + esc(fx.u4) + '</span>'; }
    var c = cuentaPorNombre(k);
    return '<span class="vj-pl" style="background:' + colorBanco(c ? c.banco : '') + '">' + esc(c && c.ultimos4 ? c.ultimos4 : '') + '</span>';
  }
  function pViaje() {
    var v = viajePorFila(viajeSel);
    if (!v) { pantalla = 'viajes'; return pintar(); }
    if (VJ.fila !== v.fila) VJ = { fila: v.fila, filtro: '' };
    var r = C.viaje(D, v, hoy), mon = r.moneda;
    var h = '<div class="cab"><div class="atras-cab">' + botonAtras('App.ir(\'viajes\')') + '<div><div class="sobretitulo">' + fechaCorta(v.desde) + ' al ' + fechaCorta(v.hasta) + ' · ' + r.estado + (r.estado === 'En curso' ? ' · día ' + r.diaActual + ' de ' + r.diasTotal : '') + '</div><h1 class="titulo">' + esc(v.nombre) + '</h1></div></div>' +
      '<button class="btn-icono" aria-label="Editar viaje" onclick="App.formViaje(' + v.fila + ')">' + ico('lapiz') + '</button></div>';
    h += sugerenciaAntes(v, r);
    h += repetidasViaje(v, r);
    h += '<div class="hero"><div class="fila" style="align-items:flex-end"><div><div class="et" style="font-size:13px;font-weight:600">' + (r.antes > 0.004 ? 'Costo del viaje' : 'Gastado') + '</div><div class="grande">' + din(r.gastado, mon) + '</div></div>' +
      '<div style="text-align:right"><a href="#" onclick="App.formLimiteViaje(' + v.fila + ');return false" class="et" style="font-size:12px;text-decoration:none;color:inherit">de ' + din(r.limite, mon) + ' <b style="color:var(--acento)">✎</b></a><div style="font-weight:800;color:' + (r.disponible < 0 ? 'var(--rojo)' : 'var(--positivo)') + '">' + (r.disponible < 0 ? 'Te pasaste ' + din(-r.disponible, mon) : din(r.disponible, mon) + ' libres') + '</div></div></div>' +
      barra(r.pct, r.pct >= 0.8) +
      (r.antes > 0.004 ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">✈ Antes del viaje</span><span>' + din(r.antes, mon) + '</span></div><div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">🧳 Durante el viaje</span><span>' + din(r.durante, mon) + '</span></div>' : '') +
      (r.estado === 'En curso' ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Quedan ' + r.diasRestantes + ' día' + (r.diasRestantes === 1 ? '' : 's') + '</span><b>Podés gastar ' + din(r.porDia, mon) + '/día</b></div>' : '') +
      (r.promedio ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Promedio por día</span><span>' + din(r.promedio, mon) + '</span></div>' : '');
    if (v.subcuenta && D.fondos) {
      var fo = FD().lista.filter(function (x) { return x.nombre === v.subcuenta; })[0];
      if (fo) h += '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Fondo ligado: ' + esc(fo.nombre) + '</span><span>' + din(fo.saldo, fo.moneda) + '</span></div>';
    }
    h += '</div>';
    if (r.pct >= 0.8) h += '<div class="aviso" style="padding:12px 14px;border-radius:14px;font-size:14px">' + (r.pct >= 1 ? '⚠️ Llegaste al límite del presupuesto.' : '🔔 Ya usaste más del 80 % del presupuesto.') + '</div>';
    // por tarjeta
    var fuentes = Object.keys(r.porTarjeta);
    (v.tarjetas || []).forEach(function (t) { if (fuentes.indexOf(t) < 0 && t !== C.SIN_FAMILIA) fuentes.push(t); });
    if (r.hayFamilia) h += porPersonaViaje(r, fuentes, mon);
    else if (fuentes.length > 1) h += '<div class="caja borde-acento" style="gap:4px"><div class="suave chico fuerte">POR TARJETA</div>' + fuentes.map(function (k) {
      var x = r.porTarjeta[k] || { monto: 0, n: 0 }, pc = r.gastado ? x.monto / r.gastado : 0;
      return '<div class="fila"><span style="display:flex;align-items:center;gap:6px;min-width:0">' + plasticoMini(k) + '<b style="overflow:hidden;text-overflow:ellipsis">' + esc(k === 'Efectivo' ? 'Efectivo' : etiquetaCuenta(k)) + '</b></span><b>' + din(x.monto, mon) + '</b></div>' +
        (x.n ? barra(pc) + '<div class="suave" style="font-size:11.5px;margin-bottom:4px">' + Math.round(pc * 100) + '% · ' + x.n + ' compra' + (x.n === 1 ? '' : 's') + '</div>' : '');
    }).join('') + '</div>';
    // categorías (con presupuesto si lo hay)
    var cats = C.CATS_VIAJE.filter(function (c) { return r.porCategoria[c] > 0 || (r.presupuesto && r.presupuesto[c]); });
    if (cats.length) h += '<div class="caja" style="gap:6px"><h3>' + (r.presupuesto ? 'Presupuesto por categoría' : 'Por categoría') + '</h3>' + cats.map(function (c) {
      var pr = r.presupuesto && r.presupuesto[c];
      if (pr) {
        var pasa = pr.gastado > pr.limite + 0.004, col = pasa ? 'var(--rojo)' : pr.pct >= 0.8 ? 'var(--acento)' : COLOR_CAT[c];
        return '<div class="fila chico"><span>' + ICON_CAT[c] + ' ' + c + '</span><span><b class="' + (pasa ? 'rojo' : '') + '">' + din(pr.gastado, mon) + '</b> <span class="suave">/ ' + din(pr.limite, mon) + '</span></span></div>' +
          '<div class="barra"><i style="width:' + Math.min(100, pr.pct * 100).toFixed(1) + '%;background:' + col + '"></i></div><div class="' + (pasa ? 'rojo' : 'suave') + '" style="font-size:11.5px;margin-bottom:2px">' + (pasa ? 'te pasaste ' + din(pr.gastado - pr.limite, mon) : 'quedan ' + din(pr.limite - pr.gastado, mon)) + '</div>';
      }
      return '<div class="fila chico"><span>' + ICON_CAT[c] + ' ' + c + '</span><b>' + din(r.porCategoria[c], mon) + '</b></div>' +
        '<div class="barra"><i style="width:' + (r.gastado ? r.porCategoria[c] / r.gastado * 100 : 0).toFixed(1) + '%;background:' + COLOR_CAT[c] + '"></i></div>';
    }).join('') + '</div>';
    // efectivo del viaje
    if ((v.tarjetas || []).indexOf('Efectivo') >= 0 || r.efectivo.retiros.length) {
      var ef = r.efectivo;
      h += '<div class="caja" style="gap:4px"><div class="fila"><div><div class="suave chico">💵 Te queda en efectivo</div><b style="font-size:22px" class="' + (ef.queda < -0.004 ? 'rojo' : '') + '">' + din(ef.queda, mon) + '</b></div></div>' +
        '<div class="fila chico"><span class="suave">🏧 Efectivo llevado y retiros</span><span>' + din(ef.retirado, mon) + '</span></div>' +
        ef.retiros.map(function (x) { return '<button class="fila chico vj-ret" onclick="App.formRetiroQuitar(' + v.fila + ',' + x.mov.fila + ')"><span class="suave">· ' + esc(fechaCorta(x.mov.fecha).replace(/ \d{4}$/, '') + ' · ' + (nombreBonito(x.mov.comercio) || 'Retiro')) + ' <span style="color:var(--acento)">›</span></span><span class="suave">' + din(x.monto, mon) + '</span></button>'; }).join('') +
        '<div class="fila chico"><span class="suave">− Gastado en efectivo</span><span>' + din(ef.gastado, mon) + '</span></div>' +
        '<div class="dos" style="margin-top:8px"><button class="btn chico" onclick="App.formCompraManual(' + v.fila + ',\'Efectivo\')">＋ Gasto en efectivo</button><button class="btn sec chico" onclick="App.formRetiroViaje(' + v.fila + ')">＋ Efectivo / retiro</button></div></div>';
    }
    // compras con filtro por tarjeta
    var conCompras = fuentes.filter(function (k) { return r.porTarjeta[k]; });
    var lista = r.compras.filter(function (c) { return !VJ.filtro || c.cuenta === VJ.filtro || VJ.filtro === 'p:' + c.persona; });
    h += '<div class="caja sinpad"><div class="fila" style="padding:14px 16px 4px"><h3>Compras (' + r.compras.length + ')</h3></div>';
    if (conCompras.length > 1) {
      var chPer = r.hayFamilia ? ordenPersonas(r).map(function (p) { var k = 'p:' + p.persona; return chipRev(esc(nombrePersona(p.persona)) + ' · ' + p.n, 'App.vjFiltro(\'' + q(k) + '\')', VJ.filtro === k); }).join('') : '';
      h += '<div class="chips desliza" style="padding:0 16px">' + chipRev('Todas · ' + r.compras.length, 'App.vjFiltro(\'\')', !VJ.filtro) + chPer + conCompras.map(function (k) { return chipRev(esc(cortoFuente(k)) + ' · ' + r.porTarjeta[k].n, 'App.vjFiltro(\'' + q(k) + '\')', VJ.filtro === k); }).join('') + '</div>';
      if (VJ.filtro && r.porTarjeta[VJ.filtro]) {
        var porC = {}; r.compras.forEach(function (c) { if (c.cuenta === VJ.filtro) porC[c.categoria] = (porC[c.categoria] || 0) + c.monto; });
        h += '<div class="vj-filtro"><div class="fila"><span style="display:flex;align-items:center;gap:6px">' + plasticoMini(VJ.filtro) + '<b>' + esc(VJ.filtro === 'Efectivo' ? 'Efectivo' : etiquetaCuenta(VJ.filtro)) + '</b></span><b style="font-size:19px">' + din(r.porTarjeta[VJ.filtro].monto, mon) + '</b></div>' +
          '<div class="suave chico">' + Object.keys(porC).sort(function (a, b) { return porC[b] - porC[a]; }).map(function (c) { return c + ' ' + din(porC[c], mon); }).join(' · ') + '</div></div>';
      }
    }
    h += (lista.length ? lista.map(function (c) {
      var m = c.mov;
      return '<button class="item" onclick="App.formCompraViaje(' + m.fila + ')"><span class="ico" style="background:transparent;font-size:18px">' + ICON_CAT[c.categoria] + '</span>' +
        '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(nombreBonito(m.comercio) || 'Compra') + '</span><span class="det" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">' + esc(fechaCorta(m.fecha).replace(/ \d{4}$/, '') + ' · ' + c.categoria + (c.antes ? ' · antes del viaje' : '') + (m.moneda !== mon ? ' · ' + txt(m.monto, m.moneda) : '')) + ' · ' + plasticoMini(c.cuenta) + esc(c.familia ? infoFamilia(c.cuenta).persona : r.hayFamilia ? miNombre() : cortoFuente(c.cuenta)) + '</span></span>' +
        '<span class="monto"><b style="display:block">' + din(c.monto, mon) + '</b></span></button>';
    }).join('') : '<div class="suave" style="padding:4px 16px 14px">Todavía no hay compras' + (VJ.filtro ? ' con esta tarjeta' : ' en estas fechas') + '.</div>') + '</div>';
    h += '<div class="dos"><button class="btn" onclick="App.formCompraManual(' + v.fila + ')">＋ Anotar compra a mano</button><button class="btn sec" onclick="App.formAgregarViaje(' + v.fila + ')">＋ Sumar una de la app</button></div>';
    h += '<button class="btn ' + (r.estado === 'Terminado' ? '' : 'sec') + '" style="width:100%;margin-top:8px" onclick="App.resumenViaje(' + v.fila + ')">📄 Resumen del viaje</button>';
    h += '<div class="suave chico" style="text-align:center">Las compras de las tarjetas elegidas en estas fechas entran solas' + (Object.keys(familia()).length ? ' (y las de la familia, si el viaje las incluye)' : '') + '. Lo pagado antes (vuelos, hotel) se suma con “Es del viaje”. Te avisamos al 80 % y al 100 %.</div>';
    $('p-viaje').innerHTML = h;
  }
  function vjFiltro(k) { VJ.filtro = k; pintar(); }
  // ---- v2.10.6 · tarjetas de la familia en el viaje: por persona y tarjeta
  function nombrePersona(p) { return p ? p : miNombre(); }
  function iconoPersona(p) { return p ? '👩' : '🙋'; }
  /** Personas del viaje: vos primero, después la familia (de más a menos gastado) */
  function ordenPersonas(r) { return Object.keys(r.porPersona).map(function (k) { return r.porPersona[k]; }).sort(function (a, b) { return (a.persona ? 1 : 0) - (b.persona ? 1 : 0) || b.monto - a.monto; }); }
  function porPersonaViaje(r, fuentes, mon) {
    var per = ordenPersonas(r), mias = per.filter(function (p) { return !p.persona; })[0];
    if (!mias) per.unshift(mias = { persona: '', monto: 0, n: 0, tarjetas: {} });
    fuentes.forEach(function (k) { if (!C.esFamilia({ cuenta: k }) && !mias.tarjetas[k]) mias.tarjetas[k] = { monto: 0, n: 0 }; });
    return '<div class="caja borde-acento" style="gap:4px"><div class="suave chico fuerte">POR PERSONA Y TARJETA</div>' + per.map(function (p, i) {
      var ks = Object.keys(p.tarjetas).sort(function (a, b) { return p.tarjetas[b].monto - p.tarjetas[a].monto; });
      return '<div class="fila vj-per"' + (i ? ' style="margin-top:10px"' : '') + '><b>' + iconoPersona(p.persona) + ' ' + esc(nombrePersona(p.persona)) + '</b><b>' + din(p.monto, mon) + '</b></div>' +
        (r.gastado ? barra(p.monto / r.gastado) : '') +
        ks.map(function (k) { var x = p.tarjetas[k]; return '<div class="fila chico vj-tj"><span style="display:flex;align-items:center;gap:6px;min-width:0">' + plasticoMini(k) + '<span style="overflow:hidden;text-overflow:ellipsis">' + esc(k === 'Efectivo' ? 'Efectivo' : C.esFamilia({ cuenta: k }) ? infoFamilia(k).nombre : etiquetaCuenta(k)) + '</span></span><span>' + din(x.monto, mon) + '</span></div>'; }).join('');
    }).join('') + '</div>';
  }
  /** Compras de antes del viaje que parecen del viaje (aerolínea, hotel, Booking…) */
  function candidatosAntes(v) {
    var ini = new Date(v.desde), lim = new Date(ini.getTime() - 120 * 86400000);
    return D.movimientos.filter(function (m) {
      var f = new Date(m.fecha);
      return m.fecha && (m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero') && f < ini && f >= lim && !m.viaje && /^(Vuelos|Hospedaje|Tours)$/.test(C.categoriaViaje(m)) && m.fila > 0;
    }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
  }
  function sugerenciaAntes(v, r) {
    if (r.estado === 'Terminado' || guardado('mf-vj-sug-' + v.id, '') === 'no') return '';
    var c = candidatosAntes(v); if (!c.length) return '';
    return '<div class="caja borde-acento" style="gap:6px"><div style="font-size:14px">🔎 Encontré ' + c.length + ' compra' + (c.length === 1 ? '' : 's') + ' de antes que parece' + (c.length === 1 ? '' : 'n') + ' del viaje: ' +
      c.slice(0, 3).map(function (m) { return '<b>' + esc(nombreBonito(m.comercio)) + ' ' + txt(m.monto, m.moneda) + '</b>'; }).join(', ') + (c.length > 3 ? '…' : '') + '. ¿La' + (c.length === 1 ? '' : 's') + ' sumo?</div>' +
      '<div class="chips">' + chipRev('✓ Sumar ' + (c.length === 1 ? 'la' : 'las ' + c.length), 'App.vjSumarAntes(' + v.fila + ')', true) + chipRev('Elegir…', 'App.formAgregarViaje(' + v.fila + ',1)') + chipRev('No', 'App.vjNoSugerir(' + v.fila + ')') + '</div></div>';
  }
  function vjSumarAntes(fila) {
    var v = viajePorFila(fila), c = candidatosAntes(v);
    c.forEach(function (m) { encolar('marcarMovimiento', [m.fila, 'Viaje', '+' + C.categoriaViaje(m) + '@' + v.id, { monto: m.monto }], 'Del viaje: ' + (m.comercio || 'compra')); });
    pintar(); toast('✈ ' + c.length + ' compra' + (c.length === 1 ? '' : 's') + ' sumada' + (c.length === 1 ? '' : 's') + ' al viaje', 2500);
  }
  function vjNoSugerir(fila) { var v = viajePorFila(fila); guardar('mf-vj-sug-' + v.id, 'no'); pintar(); }
  /** Compra anotada a mano y después llegó la misma por correo → avisar para no duplicar */
  function repetidasViaje(v, r) {
    var manuales = r.compras.filter(function (c) { return c.mov.origen === 'Manual' && c.cuenta !== 'Efectivo' && /@/.test(c.mov.viaje || ''); }), out = '';
    manuales.forEach(function (c) {
      var m = c.mov, k = 'mf-vj-dup-' + m.fila; if (guardado(k, '') === 'no') return;
      var otra = D.movimientos.filter(function (x) { return x !== m && x.fila > 0 && x.origen !== 'Manual' && x.cuenta === m.cuenta && x.moneda === m.moneda && Math.abs(x.monto - m.monto) < 0.01 && Math.abs(new Date(x.fecha) - new Date(m.fecha)) < 36 * 3600000; })[0];
      if (!otra) return;
      out += '<div class="caja borde-acento" style="gap:6px"><div style="font-size:14px">¿Es la misma compra? Anotaste a mano <b>' + esc(nombreBonito(m.comercio)) + ' ' + txt(m.monto, m.moneda) + '</b> y llegó por correo <b>' + esc(nombreBonito(otra.comercio)) + '</b> (' + fechaCorta(otra.fecha).replace(/ \d{4}$/, '') + ').</div>' +
        '<div class="chips">' + chipRev('✓ Sí: borrar la de a mano', 'App.vjDupBorrar(' + m.fila + ',' + otra.fila + ')', true) + chipRev('Son distintas', 'App.vjDupNo(' + m.fila + ')') + '</div></div>';
    });
    return out;
  }
  function vjDupBorrar(manual, correo) {
    var m = movPorFila(manual), o = movPorFila(correo); if (!m) return;
    var mk = C.marcaViaje(m);
    borrarMovSilencioso(m, 'Listo: quedó solo la del correo', function () { if (o && mk.id) encolar('marcarMovimiento', [o.fila, 'Viaje', '+' + (mk.cat || C.categoriaViaje(o)) + '@' + mk.id, { monto: o.monto }], 'Del viaje: ' + (o.comercio || 'compra')); });
  }
  function vjDupNo(f) { guardar('mf-vj-dup-' + f, 'no'); pintar(); }
  /** ＋ Anotar compra a mano (o gasto en efectivo) dentro del viaje */
  var CM2 = null;
  function formCompraManual(fila, fuente) {
    var v = viajePorFila(fila), fuentes = (v.tarjetas || []).slice();
    if (fuentes.indexOf('Efectivo') < 0) fuentes.push('Efectivo');
    CM2 = { fila: fila, cat: 'Comida', fuente: fuente || fuentes[0] };
    var hoyIso = new Date().toISOString(), dentro = new Date() >= new Date(v.desde) && new Date() <= new Date(new Date(v.hasta).getTime() + 86400000);
    abrir('<div class="suave chico">✈ ' + esc(v.nombre) + '</div><h2>' + (fuente === 'Efectivo' ? '＋ Gasto en efectivo' : '＋ Anotar compra a mano') + '</h2>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Monto</span><input id="cm-monto" class="monto" data-dinero inputmode="decimal"></label>' +
      '<label class="campo compacto"><span>Moneda</span><select id="cm-moneda"><option value="USD"' + (v.moneda === 'USD' ? ' selected' : '') + '>$</option><option value="CRC"' + (v.moneda === 'CRC' ? ' selected' : '') + '>₡</option></select></label></div>' +
      '<label class="campo compacto"><span>Descripción</span><input id="cm-desc" placeholder="Ej. Taxi al hotel"></label>' +
      '<label class="campo compacto"><span>Fecha</span><input id="cm-fecha" type="date" value="' + localInput(dentro ? hoyIso : v.desde) + '"></label>' +
      '<div class="suave chico fuerte" style="margin-top:8px">CATEGORÍA</div><div class="chips" id="cm-cats">' + C.CATS_VIAJE.map(function (c) { return chipRev(ICON_CAT[c] + ' ' + c, 'App.cmCat(\'' + c + '\')', c === CM2.cat); }).join('') + '</div>' +
      '<label class="campo compacto"><span>Pagado con</span><select id="cm-fuente">' + fuentes.map(function (k) { return '<option value="' + esc(k) + '"' + (k === CM2.fuente ? ' selected' : '') + '>' + esc(etiquetaFuente(k)) + '</option>'; }).join('') +
      D.cuentas.filter(function (c) { return c.activa && fuentes.indexOf(c.nombre) < 0 && c.tipo !== 'Préstamo' && c.tipo !== 'Inversión'; }).map(function (c) { return '<option value="' + esc(c.nombre) + '">Otra: ' + esc(etiquetaCuenta(c.nombre)) + '</option>'; }).join('') + '</select></label>' +
      '<div class="suave chico">Las compras con tarjeta normalmente llegan solas por correo. Usá esto para lo que no llega (efectivo, una tarjeta sin aviso, algo que pagó otra persona). Si después llega igual, la app te pregunta para no duplicarla.</div>' +
      '<div class="acciones"><button class="btn" id="cm-ok" onclick="App.guardarCompraManual()">Anotar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function cmCat(c) { CM2.cat = c; document.querySelectorAll('#cm-cats .chip').forEach(function (b) { b.classList.toggle('on', b.textContent.indexOf(c) >= 0); }); }
  function guardarCompraManual() {
    var v = viajePorFila(CM2.fila), monto = C.leerNumero(val('cm-monto'));
    if (!(monto > 0)) return toast('Escribí el monto.');
    var fuente = val('cm-fuente'), f = desdeInput(val('cm-fecha')) || new Date().toISOString();
    var fecha = new Date(f); var ahora = new Date(); fecha.setHours(ahora.getHours(), ahora.getMinutes(), 0, 0);
    var cat = CM2.cat, desc = val('cm-desc').trim() || (cat + (fuente === 'Efectivo' ? ' (efectivo)' : ''));
    encolar('guardarMovimiento', [{ fila: null, control: null, fecha: fecha.toISOString(), monto: monto, moneda: val('cm-moneda'), tipo: 'Gasto', comercio: desc, lugar: '', cuenta: fuente,
      categoria: (D.categorias || []).indexOf('Viajes') >= 0 ? 'Viajes' : '', sobre: '', nota: 'Viaje ' + v.nombre, origen: 'Manual', autorizacion: 'VJ-' + grupoNuevo(), viaje: '+' + cat + '@' + v.id, recordarRegla: false }], 'Viaje ' + v.nombre + ': ' + desc + ' · ' + txt(monto, val('cm-moneda')));
    hecho('✈ Anotado en ' + v.nombre + ': ' + desc);
  }
  /** 🏧 Retiro de cajero → efectivo del viaje (no es gasto) */
  function formRetiroViaje(fila) {
    var v = viajePorFila(fila), ini = new Date(new Date(v.desde).getTime() - 3 * 86400000), fin = new Date(new Date(v.hasta).getTime() + 86400000);
    var cand = D.movimientos.filter(function (m) { var f = new Date(m.fecha); return m.fecha && m.fila > 0 && f >= ini && f < fin && !m.viaje && (m.tipo === 'Gasto' || m.tipo === 'Transferencia') && /RETIRO|CAJERO|ATM|CASH|EFECTIVO/i.test((m.comercio || '') + ' ' + (m.nota || '')); });
    var ctas = cuentasAhorro();
    abrir('<div class="suave chico">✈ ' + esc(v.nombre) + '</div><h2>💵 Efectivo para el viaje</h2><div class="suave">Un retiro de cajero o plata que ya tenés en efectivo. No es un gasto del viaje: lo que gastes en efectivo sí cuenta.</div>' +
      (cand.length ? '<div class="suave chico fuerte" style="margin-top:10px">¿ES UNO DE ESTOS?</div><div class="caja sinpad">' + cand.map(function (m) {
        return '<button class="item" onclick="App.vjUsarRetiro(' + fila + ',' + m.fila + ')"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(nombreBonito(m.comercio) || 'Retiro') + '</span><span class="det" style="display:block">' + esc(fechaCorta(m.fecha) + ' · ' + (etiquetaCuenta(m.cuenta) || '')) + '</span></span><span class="monto"><b>' + din(m.monto, m.moneda) + '</b></span></button>';
      }).join('') + '</div>' : '') +
      '<div class="suave chico fuerte" style="margin-top:10px">' + (cand.length ? 'O ANOTALO A MANO' : 'ANOTALO') + '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Monto</span><input id="rt-monto" class="monto" data-dinero inputmode="decimal"></label>' +
      '<label class="campo compacto"><span>Moneda</span><select id="rt-moneda"><option value="USD"' + (v.moneda === 'USD' ? ' selected' : '') + '>$</option><option value="CRC"' + (v.moneda === 'CRC' ? ' selected' : '') + '>₡</option></select></label></div>' +
      '<label class="campo compacto"><span>¿De dónde sale?</span><select id="rt-cuenta">' + ctas.map(function (c) { return '<option' + (c.nombre === cuentaPrincipal() ? ' selected' : '') + '>' + esc(c.nombre) + '</option>'; }).join('') + '<option value="Efectivo">💵 De ninguna cuenta (ya lo tengo en efectivo)</option></select></label>' +
      '<div class="suave chico">Si ya lo tenías en efectivo, no toca tus cuentas ni sobres: solo suma a lo que llevás al viaje.</div>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarRetiroViaje(' + fila + ')">Anotar retiro</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function vjUsarRetiro(fila, mf) {
    var v = viajePorFila(fila), m = movPorFila(mf); if (!m) return;
    encolar('marcarMovimiento', [mf, 'Viaje', 'Efectivo@' + v.id, { monto: m.monto }], 'Retiro para el viaje ' + v.nombre);
    hecho('🏧 Retiro pasado a efectivo del viaje');
  }
  /** v2.10.7: tocar un retiro del viaje → quitarlo del viaje (sigue en tu cuenta) o borrarlo si lo anotaste a mano */
  function formRetiroQuitar(vf, mf) {
    var v = viajePorFila(vf), m = movPorFila(mf); if (!m || !v) return;
    var aMano = /^VJR-/.test(m.autorizacion || '') || C.normNom(m.cuenta || '') === 'efectivo';
    abrir('<div class="suave chico">✈ ' + esc(v.nombre) + ' · efectivo</div><h2>🏧 ' + esc(nombreBonito(m.comercio) || 'Retiro') + '</h2>' +
      '<div class="caja" style="gap:4px"><div class="fila"><span class="suave">Monto</span><b>' + din(m.monto, m.moneda) + '</b></div><div class="fila chico"><span class="suave">Fecha</span><span>' + esc(fechaCorta(m.fecha)) + '</span></div><div class="fila chico"><span class="suave">Cuenta</span><span>' + esc(etiquetaCuenta(m.cuenta) || '—') + '</span></div></div>' +
      '<div class="suave chico" style="margin-top:8px">' + (aMano ? 'Lo anotaste a mano en el viaje. Si no pasó, borralo.' : 'Es un movimiento real de tu cuenta: al quitarlo del viaje sigue igual en tu cuenta y sobres; solo deja de contar como efectivo del viaje.') + '</div>' +
      '<div class="acciones">' + (aMano ? '<button class="btn peligro" onclick="App.retiroBorrar(' + mf + ')">🗑 Borrar</button>' : '') + (C.normNom(m.cuenta || '') === 'efectivo' ? '' : '<button class="btn' + (aMano ? ' sec' : '') + '" onclick="App.retiroQuitar(' + mf + ')">Quitar del viaje</button>') + '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function retiroQuitar(mf) { var m = movPorFila(mf); if (!m) return; encolar('marcarMovimiento', [mf, 'Viaje', 'Fuera', { monto: m.monto }], 'Retiro fuera del viaje'); hecho('🏧 Retiro quitado del viaje (sigue en tu cuenta)'); }
  function retiroBorrar(mf) { var m = movPorFila(mf); if (!m) return; cerrar(); borrarMovSilencioso(m, '🗑 Retiro borrado'); }
  function guardarRetiroViaje(fila) {
    var v = viajePorFila(fila), monto = C.leerNumero(val('rt-monto'));
    if (!(monto > 0)) return toast('Escribí el monto.');
    var propio = val('rt-cuenta') === 'Efectivo';
    encolar('guardarMovimiento', [{ fila: null, control: null, fecha: new Date().toISOString(), monto: monto, moneda: val('rt-moneda'), tipo: 'Gasto', comercio: propio ? 'Efectivo que ya tenía' : 'Retiro de cajero (efectivo del viaje)', lugar: '', cuenta: val('rt-cuenta'),
      categoria: '', sobre: '', nota: 'Viaje ' + v.nombre, origen: 'Manual', autorizacion: 'VJR-' + grupoNuevo(), viaje: 'Efectivo@' + v.id, recordarRegla: false }], (propio ? 'Efectivo para el viaje · ' : 'Retiro de cajero · ') + txt(monto, val('rt-moneda')));
    hecho(propio ? '💵 Efectivo anotado para el viaje' : '🏧 Retiro anotado como efectivo del viaje');
  }
  /** 📄 Resumen del viaje (con PDF y compartir) */
  function datosResumenViaje(v) {
    var r = C.viaje(D, v, hoy), mon = r.moneda;
    var prev = (D.viajes || []).filter(function (x) { return x !== v && x.desde && new Date(x.hasta) < new Date(v.desde); }).sort(function (a, b) { return new Date(b.hasta) - new Date(a.hasta); })[0];
    var rp = prev ? C.viaje(D, prev, hoy) : null;
    var cats = C.CATS_VIAJE.filter(function (c) { return r.porCategoria[c] > 0; }).sort(function (a, b) { return r.porCategoria[b] - r.porCategoria[a]; }).map(function (c) { return [c, r.porCategoria[c]]; });
    var tarj = Object.keys(r.porTarjeta).sort(function (a, b) { return r.porTarjeta[b].monto - r.porTarjeta[a].monto; }).map(function (k) { return [k === 'Efectivo' ? 'Efectivo' : etiquetaCuenta(k), r.porTarjeta[k].monto]; });
    var personas = r.hayFamilia ? ordenPersonas(r).map(function (p) {
      return { persona: p.persona, nombre: nombrePersona(p.persona), monto: p.monto, n: p.n, tarjetas: Object.keys(p.tarjetas).sort(function (a, b) { return p.tarjetas[b].monto - p.tarjetas[a].monto; }).map(function (k) {
        return { cuenta: k, nombre: k === 'Efectivo' ? 'Efectivo' : C.esFamilia({ cuenta: k }) ? infoFamilia(k).nombre + ' ••' + infoFamilia(k).u4 : etiquetaCuenta(k), monto: p.tarjetas[k].monto,
          compras: r.compras.filter(function (c) { return c.cuenta === k; }).slice().reverse().map(function (c) { return [fechaCorta(c.mov.fecha), nombreBonito(c.mov.comercio) || 'Compra', c.categoria, c.monto]; }) };
      }) };
    }) : null;
    return { v: v, r: r, mon: mon, cats: cats, tarj: tarj, prev: prev, rp: rp, personas: personas };
  }
  function resumenViaje(fila) {
    var v = viajePorFila(fila), x = datosResumenViaje(v), r = x.r, mon = x.mon;
    var lin = function (a, b, cls) { return '<div class="fila chico"><span>' + a + '</span><b class="' + (cls || '') + '">' + b + '</b></div>'; };
    abrir('<div class="suave chico">' + (r.estado === 'Terminado' ? 'Viaje terminado' : 'Viaje ' + r.estado.toLowerCase()) + ' · ' + fechaCorta(v.desde) + ' al ' + fechaCorta(v.hasta) + '</div><h2>✈ ' + esc(v.nombre) + ' · resumen</h2>' +
      '<div class="caja" style="gap:4px"><div class="fila"><div><div class="suave chico">Costo total · ' + r.diasTotal + ' día' + (r.diasTotal === 1 ? '' : 's') + '</div><b style="font-size:24px">' + din(r.gastado, mon) + '</b></div><div style="text-align:right"><div class="suave chico">límite ' + din(r.limite, mon) + '</div><b class="' + (r.disponible < 0 ? 'rojo' : 'verde-pos') + '">' + (r.disponible < 0 ? din(-r.disponible, mon) + ' arriba' : din(r.disponible, mon) + ' debajo ✓') + '</b></div></div>' +
      lin('Por día', din(r.porDiaTotal, mon)) + (r.antes > 0.004 ? lin('Antes / durante', din(r.antes, mon) + ' / ' + din(r.durante, mon)) : '') + '</div>' +
      (x.cats.length ? '<div class="caja" style="gap:4px"><div class="suave chico fuerte">POR CATEGORÍA</div>' + x.cats.map(function (c) { return lin(ICON_CAT[c[0]] + ' ' + c[0], din(c[1], mon)); }).join('') + '</div>' : '') +
      (x.personas ? '<div class="caja" style="gap:4px"><div class="suave chico fuerte">POR PERSONA Y TARJETA</div>' + x.personas.map(function (p) { return lin('<b>' + iconoPersona(p.persona) + ' ' + esc(p.nombre) + '</b>', din(p.monto, mon)) + p.tarjetas.map(function (t) { return '<div class="fila chico suave" style="padding-left:22px"><span>' + esc(t.nombre) + '</span><span>' + din(t.monto, mon) + '</span></div>'; }).join(''); }).join('') + '</div>' :
      x.tarj.length ? '<div class="caja" style="gap:4px"><div class="suave chico fuerte">POR TARJETA</div>' + x.tarj.map(function (t) { return lin((t[0] === 'Efectivo' ? '💵 ' : '💳 ') + esc(t[0]), din(t[1], mon)); }).join('') + '</div>' : '') +
      (x.prev ? '<div class="caja" style="gap:4px"><div class="suave chico fuerte">COMPARADO CON</div>' + lin(esc(x.prev.nombre) + ' · ' + fechaCorta(x.prev.desde) + ' (' + x.rp.diasTotal + ' días)', din(x.rp.porDiaTotal, x.rp.moneda) + ' por día') + '</div>' : '') +
      '<div class="dos"><button class="btn" id="vr-pdf" onclick="App.pdfViaje(' + fila + ',this)">📄 PDF' + (x.personas ? ' completo' : '') + '</button><button class="btn sec" onclick="App.compartirViaje(' + fila + ')">↗ Compartir</button></div>' +
      (x.personas ? '<div class="chips" style="margin-top:8px;flex-wrap:wrap">' + x.personas.map(function (p, i) { return chipRev('📄 Solo ' + esc(p.nombre), 'App.pdfViaje(' + fila + ',this,' + i + ')'); }).join('') + '</div><div class="suave chico" style="margin-top:4px">El PDF trae el resumen y después una página por tarjeta, para comparar con cada estado de cuenta.</div>' : '') +
      '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }
  function textoViaje(fila) {
    var v = viajePorFila(fila), x = datosResumenViaje(v), r = x.r, mon = x.mon;
    return '✈ ' + v.nombre + ' (' + fechaCorta(v.desde) + ' al ' + fechaCorta(v.hasta) + ')\nCosto total: ' + txt(r.gastado, mon) + ' de ' + txt(r.limite, mon) + ' · ' + txt(r.porDiaTotal, mon) + ' por día' +
      (r.antes > 0.004 ? '\nAntes del viaje ' + txt(r.antes, mon) + ' · durante ' + txt(r.durante, mon) : '') +
      (x.cats.length ? '\n\nPor categoría:\n' + x.cats.map(function (c) { return '• ' + c[0] + ': ' + txt(c[1], mon); }).join('\n') : '') +
      (x.personas ? '\n\nPor persona y tarjeta:\n' + x.personas.map(function (p) { return '• ' + p.nombre + ': ' + txt(p.monto, mon) + '\n' + p.tarjetas.map(function (t) { return '   – ' + t.nombre + ': ' + txt(t.monto, mon); }).join('\n'); }).join('\n') :
      x.tarj.length ? '\n\nPor tarjeta:\n' + x.tarj.map(function (t) { return '• ' + t[0] + ': ' + txt(t[1], mon); }).join('\n') : '');
  }
  function compartirViaje(fila) {
    var t = textoViaje(fila);
    if (navigator.share) navigator.share({ title: 'Resumen del viaje', text: t }).catch(function () { /* cancelado */ });
    else navigator.clipboard.writeText(t).then(function () { toast('📋 Resumen copiado'); }, function () { toast('No se pudo copiar'); });
  }
  function pdfViaje(fila, boton, soloI) {
    var v = viajePorFila(fila), x = datosResumenViaje(v), solo = (soloI !== undefined && x.personas) ? x.personas[soloI] : null;
    if (solo) {   // v2.10.6: PDF de una sola persona (sus tarjetas y sus compras)
      var rs = Object.assign({}, x.r, { gastado: solo.monto, porDiaTotal: solo.monto / x.r.diasTotal, compras: x.r.compras.filter(function (c) { return c.persona === solo.persona; }), presupuesto: null });
      var pc = {}; rs.compras.forEach(function (c) { pc[c.categoria] = (pc[c.categoria] || 0) + c.monto; });
      x = Object.assign({}, x, { r: rs, prev: null, personas: [solo], cats: Object.keys(pc).sort(function (a, b) { return pc[b] - pc[a]; }).map(function (c) { return [c, pc[c]]; }), totalViaje: x.r.gastado });
    }
    if (boton) boton.disabled = true;
    toast('Preparando el PDF…', 6000);
    cargarScript('js/vendor/pdf-lib.min.js').then(function () {
      return PDFViaje.construir(window.PDFLib, {
        nombre: v.nombre, desde: v.desde, hasta: v.hasta, moneda: x.mon, r: x.r, cats: x.cats, tarj: x.tarj, personas: x.personas, solo: solo ? solo.nombre : '', totalViaje: x.totalViaje,
        prev: x.prev ? { nombre: x.prev.nombre, desde: x.prev.desde, dias: x.rp.diasTotal, porDia: x.rp.porDiaTotal, moneda: x.rp.moneda } : null,
        compras: x.r.compras.slice().reverse().map(function (c) { return [fechaCorta(c.mov.fecha), nombreBonito(c.mov.comercio) || 'Compra', c.categoria, c.cuenta === 'Efectivo' ? 'Efectivo' : (x.personas ? (c.familia ? infoFamilia(c.cuenta).persona + ' ••' + c.familia : miNombre() + ' ' + (((cuentaPorNombre(c.cuenta) || {}).ultimos4) ? '••' + cuentaPorNombre(c.cuenta).ultimos4 : c.cuenta)) : plasticoTexto(c.cuenta)), c.monto]; })
      });
    }).then(function (bytes) {
      if (boton) boton.disabled = false;
      return compartirArchivo(bytes, 'Viaje ' + v.nombre.replace(/[\\/:*?"<>|]/g, '') + (solo ? ' - ' + solo.nombre : '') + '.pdf', 'application/pdf', 'Resumen del viaje ' + v.nombre);
    }).catch(function (e) { if (boton) boton.disabled = false; toast('⚠️ No se pudo crear el PDF: ' + (e && e.message ? e.message : e), 6000); });
  }
  /** Dentro de un movimiento: ✈ Es del viaje */
  function bloqueViajeDeMov(m) {
    if (!m || !(D.viajes || []).length) return '';
    var mk = C.marcaViaje(m), ve = mk.efectivo && C.normNom(m.cuenta || '') !== 'efectivo' && (D.viajes || []).filter(function (v) { return v.id === mk.id; })[0];
    if (ve) return '<div class="caja" style="margin-top:14px;background:var(--fondo);gap:6px"><b style="font-size:14px">🏧 Efectivo del viaje ' + esc(ve.nombre) + '</b><span class="suave chico">No cuenta como gasto: es plata que llevaste en efectivo.</span><div class="chips">' + chipRev('Ver viaje', 'App.cerrar();App.verViaje(' + ve.fila + ')') + chipRev('Quitar del viaje', 'App.retiroQuitar(' + m.fila + ')') + '</div></div>';
    if (m.tipo !== 'Gasto' && m.tipo !== 'Compra tasa cero') return '';
    var en = (D.viajes || []).filter(function (v) { return C.enViaje(v, m); })[0];
    if (en) return '<div class="caja" style="margin-top:14px;background:var(--fondo);gap:6px"><b style="font-size:14px">✈ Es del viaje ' + esc(en.nombre) + '</b><div class="chips">' + chipRev('Ver viaje', 'App.cerrar();App.verViaje(' + en.fila + ')') + chipRev('Sacar del viaje', 'App.vjSacar(' + m.fila + ')') + '</div></div>';
    var vs = (D.viajes || []).filter(function (v) { return v.desde && new Date(v.hasta) > new Date(hoy.getTime() - 60 * 86400000); }).sort(function (a, b) { return new Date(a.desde) - new Date(b.desde); });
    if (!vs.length) return '';
    return '<div class="caja" style="margin-top:14px;background:var(--fondo);gap:6px"><b style="font-size:14px">✈ ¿Es de un viaje?</b><span class="suave chico">Sumala aunque sea de antes de las fechas (vuelos, hotel…).</span><div class="chips">' +
      vs.map(function (v) { return chipRev(esc(v.nombre) + ' · ' + fechaCorta(v.desde).replace(/ \d{4}$/, ''), 'App.vjSumar(' + m.fila + ',' + v.fila + ')'); }).join('') + '</div></div>';
  }
  function vjSumar(mf, vf) { var m = movPorFila(mf), v = viajePorFila(vf); if (!m || !v) return; encolar('marcarMovimiento', [mf, 'Viaje', '+' + C.categoriaViaje(m) + '@' + v.id, { monto: m.monto }], 'Del viaje ' + v.nombre + ': ' + (m.comercio || 'compra')); hecho('✈ Sumada al viaje ' + v.nombre); }
  function vjSacar(mf) { var m = movPorFila(mf); if (!m) return; encolar('marcarMovimiento', [mf, 'Viaje', 'Fuera', { monto: m.monto }], 'Fuera del viaje: ' + (m.comercio || 'compra')); hecho('Compra sacada del viaje'); }
  function formViaje(fila) {
    var v = fila ? viajePorFila(fila) : null;
    var hoyIso = new Date().toISOString();
    var tarjetas = D.cuentas.filter(function (c) { return c.activa && c.tipo !== 'Préstamo' && c.tipo !== 'Inversión'; }).map(function (c) { return c.nombre; }).concat(['Efectivo']);
    var sel = v ? v.tarjetas : D.cuentas.filter(function (c) { return c.activa && c.tipo === 'Tarjeta de crédito'; }).slice(0, 1).map(function (c) { return c.nombre; });
    abrir('<h2>' + (v ? 'Editar viaje' : 'Nuevo presupuesto') + '</h2>' +
      '<label class="campo"><span>Nombre</span><input id="vj-nombre" value="' + esc(v ? v.nombre : '') + '" placeholder="Ej. Viaje a Panamá"></label>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Desde</span><input id="vj-desde" type="date" value="' + localInput(v ? v.desde : hoyIso) + '"></label>' +
      '<label class="campo compacto"><span>Hasta</span><input id="vj-hasta" type="date" value="' + localInput(v ? v.hasta : hoyIso) + '"></label></div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Límite</span><input id="vj-limite" data-dinero inputmode="decimal" value="' + (v ? String(v.limite).replace('.', ',') : '') + '" placeholder="2.000"></label>' +
      '<label class="campo compacto"><span>Moneda</span><select id="vj-moneda"><option value="USD"' + (!v || v.moneda === 'USD' ? ' selected' : '') + '>$</option><option value="CRC"' + (v && v.moneda === 'CRC' ? ' selected' : '') + '>₡</option></select></label></div>' +
      '<details class="vj-pres"' + (v && v.presupuesto && Object.keys(v.presupuesto).length ? ' open' : '') + '><summary class="suave chico fuerte">PRESUPUESTO POR CATEGORÍA (OPCIONAL) ›</summary>' +
        C.CATS_VIAJE.map(function (c) { var x = v && v.presupuesto ? v.presupuesto[c] : ''; return '<div class="fila vj-pc"><span>' + ICON_CAT[c] + ' ' + c + '</span><input class="monto pl-in vj-cat" data-cat="' + c + '" data-dinero inputmode="decimal" value="' + (x ? String(x).replace('.', ',') : '') + '" oninput="App.vjSumaPres()"></div>'; }).join('') +
        '<div class="fila" style="padding-top:6px"><b>Suma</b><b id="vj-suma">—</b></div><button type="button" class="btn sec chico" style="margin-top:6px" onclick="App.vjRepartir()">↔ Repartir el límite solo</button>' +
        '<div class="suave chico" style="margin-top:4px">Si no ponés montos, se ve solo el total (como siempre).</div></details>' +
      '<div class="suave chico fuerte" style="margin-top:12px">TARJETAS O CUENTAS DEL VIAJE</div>' +
      tarjetas.map(function (t) { return '<label class="check" style="margin-top:8px"><input type="checkbox" class="vj-t" value="' + esc(t) + '"' + (sel.indexOf(t) >= 0 ? ' checked' : '') + '> ' + esc(t === 'Efectivo' ? 'Efectivo (gastos sin cuenta)' : etiquetaCuenta(t)) + '</label>'; }).join('') +
      (Object.keys(familia()).length ? '<label class="check" style="margin-top:8px"><input type="checkbox" id="vj-fam"' + (sel.indexOf(C.SIN_FAMILIA) < 0 ? ' checked' : '') + '> 👪 Tarjetas de la familia (' + esc(personasFamilia().join(', ')) + ')</label>' : '') +
      (D.fondos && D.fondos.length ? '<label class="campo compacto"><span>Ligado a un fondo (opcional)</span><select id="vj-sub"><option value="">— Ninguno —</option>' + opcionesSubcuenta(v ? v.subcuenta : '') + '</select></label>' : '') +
      (v ? '<label class="check"><input type="checkbox" id="vj-activo"' + (v.activo ? ' checked' : '') + '> Activo (avisos y tarjeta en Inicio)</label>' : '') +
      '<div class="acciones"><button class="btn" id="vj-ok" onclick="App.guardarViaje(' + (fila || 0) + ')">Guardar</button>' +
      (v ? '<button class="btn peligro" id="vj-borrar" onclick="App.borrarViaje(' + fila + ')">Eliminar presupuesto</button>' : '') +
      '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    setTimeout(vjSumaPres, 30);
  }
  function guardarViaje(fila) {
    var v0 = fila ? viajePorFila(fila) : null;
    var v = { fila: fila || null, nombre: val('vj-nombre').trim(), desde: desdeInput(val('vj-desde')), hasta: desdeInput(val('vj-hasta')), limite: C.leerNumero(val('vj-limite')),
      moneda: val('vj-moneda'), tarjetas: Array.prototype.slice.call(document.querySelectorAll('.vj-t:checked')).map(function (e) { return e.value; }),
      subcuenta: $('vj-sub') ? val('vj-sub') : '', activo: $('vj-activo') ? $('vj-activo').checked : true, id: v0 ? v0.id : undefined, presupuesto: leerPresViaje() };
    if (!v.nombre) return toast('Falta el nombre.');
    if (!v.limite || v.limite <= 0) return toast('Escribí el límite.');
    if (!v.desde || !v.hasta) return toast('Elegí las fechas.');
    if (!v.tarjetas.length && !($('vj-fam') && $('vj-fam').checked)) return toast('Elegí al menos una tarjeta o cuenta.');
    if ($('vj-fam') && !$('vj-fam').checked) v.tarjetas.push(C.SIN_FAMILIA);
    else if (!$('vj-fam') && v0 && (v0.tarjetas || []).indexOf(C.SIN_FAMILIA) >= 0) v.tarjetas.push(C.SIN_FAMILIA);
    if (v0 && v.limite > v0.limite) v.reiniciarAvisos = true;
    srv('guardarViaje', [v], function (f) { if (!fila) viajeSel = f; listo('✅ Presupuesto guardado'); if (!fila) setTimeout(function () { ir('viaje'); }, 0); }, $('vj-ok'));
  }
  function leerPresViaje() {
    var o = {}; document.querySelectorAll('.vj-cat').forEach(function (e) { var n = C.leerNumero(e.value); if (n > 0) o[e.getAttribute('data-cat')] = n; });
    return o;
  }
  function vjSumaPres() {
    var o = leerPresViaje(), t = 0; Object.keys(o).forEach(function (k) { t += o[k]; });
    var lim = C.leerNumero(val('vj-limite')) || 0, mon = val('vj-moneda') || 'USD', e = $('vj-suma'); if (!e) return;
    if (!t) { e.textContent = '—'; e.className = ''; return; }
    e.textContent = txt(t, mon) + (lim ? (Math.abs(t - lim) < 0.5 ? ' ✓ igual al límite' : t > lim ? ' (más que el límite)' : ' (faltan ' + txt(lim - t, mon) + ')') : '');
    e.className = lim && Math.abs(t - lim) < 0.5 ? 'verde-pos' : 'acento';
  }
  /** Reparte el límite según cómo gastaste en viajes anteriores (o una base: vuelos y hotel 30 %, comida 20 %…) */
  function vjRepartir() {
    var lim = C.leerNumero(val('vj-limite')); if (!(lim > 0)) return toast('Primero poné el límite.');
    var tot = {}, suma = 0;
    (D.viajes || []).forEach(function (v) { var r = C.viaje(D, v, hoy); if (r.estado !== 'Terminado') return; C.CATS_VIAJE.forEach(function (c) { tot[c] = (tot[c] || 0) + r.porCategoria[c]; suma += r.porCategoria[c]; }); });
    var base = suma > 0 ? tot : { Vuelos: 30, Hospedaje: 30, Comida: 20, Transporte: 10, Tours: 5, Compras: 5, Otros: 0 };
    var sb = 0; C.CATS_VIAJE.forEach(function (c) { sb += base[c] || 0; });
    document.querySelectorAll('.vj-cat').forEach(function (e) { var c = e.getAttribute('data-cat'), n = Math.round(lim * (base[c] || 0) / sb); e.value = n ? formatoMonto(String(n)) : ''; });
    vjSumaPres(); toast(suma > 0 ? 'Repartido según tus viajes anteriores' : 'Repartido con una base; ajustalo a tu gusto', 2500);
  }
  function borrarViaje(fila) {
    var b = $('vj-borrar');
    if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Tocá otra vez'; return; }
    srv('eliminarViaje', [fila], function () { pantalla = 'viajes'; listo('Presupuesto eliminado'); }, b);
  }
  function formLimiteViaje(fila) {
    var v = viajePorFila(fila);
    abrir('<h2>Cambiar límite</h2><label class="campo"><span>Límite (' + (v.moneda === 'USD' ? '$' : '₡') + ')</span><input id="vl-limite" data-dinero inputmode="decimal" value="' + String(v.limite).replace('.', ',') + '"></label>' +
      '<div class="acciones"><button class="btn" id="vl-ok" onclick="App.guardarLimiteViaje(' + fila + ')">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarLimiteViaje(fila) {
    var v = JSON.parse(JSON.stringify(viajePorFila(fila))), n = C.leerNumero(val('vl-limite'));
    if (!n || n <= 0) return toast('Escribí el límite.');
    v.reiniciarAvisos = n > v.limite; v.limite = n;
    srv('guardarViaje', [v], function () { listo('✅ Límite actualizado'); }, $('vl-ok'));
  }
  function formCompraViaje(fila) {
    var m = movPorFila(fila), cat = C.categoriaViaje(m);
    abrir('<div class="suave chico">' + fechaCorta(m.fecha) + ' · ' + esc(etiquetaCuenta(m.cuenta) || 'sin cuenta') + '</div><h2>' + esc(m.comercio || 'Compra') + '</h2>' +
      '<div class="grande" style="font-size:24px;font-weight:800">' + din(m.monto, m.moneda) + '</div>' +
      '<div class="suave chico fuerte" style="margin-top:12px">CATEGORÍA DEL VIAJE</div><div class="chips" style="margin-top:6px">' +
      C.CATS_VIAJE.map(function (c) { var mk = C.marcaViaje(m); return '<button class="chip' + (c === cat ? ' on' : '') + '" onclick="App.marcarViaje(' + fila + ',\'' + (mk.mas ? '+' : '') + c + (mk.id ? '@' + mk.id : '') + '\',this)">' + ICON_CAT[c] + ' ' + c + '</button>'; }).join('') + '</div>' +
      '<div class="acciones"><button class="btn peligro" onclick="App.marcarViaje(' + fila + ',\'Fuera\',this)">Sacar del viaje</button><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }
  function marcarViaje(fila, valor, boton) {
    var m = movPorFila(fila);
    encolar('marcarMovimiento', [fila, 'Viaje', valor, { monto: m.monto }], 'Viaje: ' + (m.comercio || 'compra') + ' · ' + (valor === 'Fuera' ? 'fuera' : valor.replace('+', '')));
    hecho(valor === 'Fuera' ? 'Compra sacada del viaje' : '✅ ' + valor.replace('+', '').replace(/@.*$/, '') + (valor.charAt(0) === '+' ? ' · agregada al viaje' : ''));
  }
  function formAgregarViaje(fila, soloAntes) {
    var v = viajePorFila(fila);
    var ini = new Date(v.desde), fin = new Date(new Date(v.hasta).getTime() + 86400000), lim = new Date(ini.getTime() - 120 * 86400000);
    var cand = D.movimientos.filter(function (m) {
      var f = new Date(m.fecha);
      return m.fila > 0 && (m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero') && f >= (soloAntes ? lim : lim) && f < (soloAntes ? ini : fin) && !C.enViaje(v, m) && !C.marcaViaje(m).id && !C.marcaViaje(m).efectivo;
    }).sort(function (a, b) { var ca = /^(Vuelos|Hospedaje)$/.test(C.categoriaViaje(a)) ? 0 : 1, cb = /^(Vuelos|Hospedaje)$/.test(C.categoriaViaje(b)) ? 0 : 1; return ca - cb || new Date(b.fecha) - new Date(a.fecha); });
    abrir('<h2>Sumar al viaje</h2><div class="suave">Compras que ya están en la app (también las de antes del viaje: vuelos, hotel…). Tocá una para sumarla.</div>' +
      (cand.length ? '<div class="caja sinpad" style="margin-top:10px">' + cand.slice(0, 50).map(function (m) {
        return '<button class="item" onclick="App.marcarViaje(' + m.fila + ',\'+' + C.categoriaViaje(m) + (new Date(m.fecha) < ini ? '@' + v.id : '') + '\',this)"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(m.comercio || 'Compra') + (new Date(m.fecha) < ini ? ' <span class="pill" style="font-size:10px;padding:1px 6px">antes</span>' : '') + '</span>' +
          '<span class="det" style="display:block">' + esc(fechaCorta(m.fecha) + ' · ' + (etiquetaCuenta(m.cuenta) || 'sin cuenta')) + '</span></span><span class="monto"><b>' + din(m.monto, m.moneda) + '</b></span></button>';
      }).join('') + '</div>' : '<div class="caja vacio" style="margin-top:10px">No hay otras compras en esas fechas.</div>') +
      '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }

  function formSobresEspeciales() {
    var esp = D.sobreEspecial || {};
    var sel = function (id, actual) {
      return '<select id="' + id + '"><option value="">— Ninguno —</option>' + D.sobres.map(function (s) { return '<option value="' + esc(s.nombre) + '"' + (s.nombre === actual ? ' selected' : '') + '>' + esc(nomSobre(s.nombre)) + '</option>'; }).join('') + '</select>';
    };
    abrir('<h2>Sobres especiales</h2><div class="suave">Elegí cuál de tus sobres cumple cada función. Les podés poner el nombre que quieras.</div>' +
      '<label class="campo"><span>Préstamo de casa (los pagos del préstamo salen solos de aquí)</span>' + sel('se-prestamo', esp.prestamo) + '</label>' +
      '<label class="campo"><span>Fondos de inversión (las inversiones de BCR SAFI salen solas de aquí)</span>' + sel('se-fondos', esp.fondos) + '</label>' +
      '<label class="campo"><span>Pago de tarjetas (botón "Todo de…" al asignar un pago)</span>' + sel('se-tarjetas', esp.tarjetas) + '</label>' +
      '<div class="acciones"><button class="btn" id="se-ok" onclick="App.guardarSobresEspeciales()">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarSobresEspeciales() {
    srv('guardarSobresEspeciales', [{ prestamo: val('se-prestamo'), fondos: val('se-fondos'), tarjetas: val('se-tarjetas') }], function () { listo('✅ Sobres especiales guardados'); }, $('se-ok'));
  }
  function formSobresDesde() {
    abrir('<h2>Saldos desde</h2><div class="suave">La fecha de los saldos iniciales de la pestaña Sobres. Los movimientos de antes no cuentan para los sobres.</div>' +
      '<label class="campo"><span>Fecha</span><input id="sd-fecha" type="date" value="' + localInput(D.sobresDesde) + '"></label>' +
      '<div class="acciones"><button class="btn" id="sd-ok" onclick="App.guardarSobresDesde()">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarSobresDesde() { var f = desdeInput(val('sd-fecha')); if (!f) return toast('Elegí una fecha.'); srv('guardarSobresDesde', [f], function () { listo('✅ Fecha guardada'); }, $('sd-ok')); }

  // ------------------------------------------------------------ PRÉSTAMO
  function pPrestamo() {
    var p = D.prestamo;
    var h = '<div class="cab"><div class="atras-cab">' + botonAtras() + '<div><div class="sobretitulo">BCR · Operación ' + esc(p.operacion) + '</div><h1 class="titulo">Préstamo de casa</h1></div></div>' +
      '<button class="btn-icono" aria-label="Simular abonos en la calculadora" onclick="App.usarCasa()">' + ico('flechas') + '</button></div>';
    h += '<div class="hero oscuro"><div class="et" style="font-size:13px;font-weight:600">Saldo pendiente</div><div class="grande">' + din(p.saldo, 'CRC', true) + '</div>' +
      barra(p.pagadoPct) + '<div class="fila chico" style="opacity:.9"><span>Pagado ' + Math.round((p.pagadoPct || 0) * 100) + '% de ' + din(p.saldoInicial, 'CRC') + '</span><span>Faltan ' + p.restantes + ' cuotas</span></div></div>';
    h += '<div class="tres"><div class="mini"><div class="et">Próxima cuota</div><div class="v">' + din(p.estimado.total, 'CRC') + '</div></div>' +
      '<div class="mini"><div class="et">Tasa</div><div class="v">' + C.pct(p.tasa) + '</div></div>' +
      '<div class="mini"><div class="et">Vence</div><div class="v">' + fechaCorta(p.proximoVenc).replace(/ \d{4}$/, '') + '</div></div></div>';
    h += '<div class="caja"><div class="fila"><h3>Próxima cuota (estimado)</h3><span class="pill">TBP ' + C.pct(p.tbp) + ' + 3</span></div>' +
      '<div class="fila chico"><span class="suave">Abono a principal</span><span>' + din(p.estimado.principal, 'CRC', true) + '</span></div>' +
      '<div class="fila chico"><span class="suave">Intereses</span><span>' + din(p.estimado.intereses, 'CRC', true) + '</span></div>' +
      '<div class="fila chico"><span class="suave">Pólizas</span><span>' + din(p.estimado.polizas, 'CRC', true) + '</span></div>' +
      '<div class="fila"><b>Total estimado</b><b>' + din(p.estimado.total, 'CRC', true) + '</b></div>' +
      '<div class="dos"><button class="btn sec chico" style="justify-content:center" onclick="App.formPago()">Registrar pago</button><button class="btn sec chico" style="justify-content:center" onclick="App.formTBP()">Anotar TBP</button></div></div>';

    // saldo por año
    var porAnio = {};
    p.pagos.forEach(function (x) { if (x.fecha && x.saldo !== null) porAnio[new Date(x.fecha).getFullYear()] = x.saldo; });
    var anios = Object.keys(porAnio).sort().slice(-8);
    if (anios.length) {
      var max = Math.max.apply(null, anios.map(function (a) { return porAnio[a]; }));
      var cols = 'grid-template-columns:repeat(' + anios.length + ',minmax(0,1fr))';
      h += plegable('pr-anio', 'Saldo al cierre de cada año', '', '<div class="graf" style="' + cols + '" role="img" aria-label="Saldo del préstamo por año">' +
        anios.map(function (a, i) { return '<i class="' + (i === anios.length - 1 ? 'ult' : '') + '" style="height:' + Math.max(6, porAnio[a] / max * 96) + 'px" title="' + a + ': ' + txt(porAnio[a], 'CRC') + '"></i>'; }).join('') +
        '</div><div class="graf-et" style="' + cols + '">' + anios.map(function (a) { return '<span>' + a + '</span>'; }).join('') + '</div>');
    }

    var hist = p.pagos.slice().reverse();
    var mostrar = verTodoHistorial ? hist : hist.slice(0, 6);
    h += plegable('pr-hist', 'Historial de pagos', p.cuotasPagadas + ' pagos', '<div class="tabla"><span class="h">Fecha</span><span class="h d">Interés</span><span class="h d">Capital</span><span class="h d">Saldo</span>' +
      mostrar.map(function (x) {
        var d = new Date(x.fecha);
        return '<span>' + d.getDate() + ' ' + MESES_C[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) + (Math.round(x.anticipo) > 0 ? '<br><span class="suave chico">' + Math.round(x.anticipo) + (Math.round(x.anticipo) === 1 ? ' día' : ' días') + ' antes</span>' : '') + '</span>' +
          '<span class="d">' + din(Math.round(x.intereses), 'CRC') + '</span><span class="d">' + din(Math.round(x.principal), 'CRC') + '</span>' +
          '<span class="d fuerte"><span class="m">₡' + ((x.saldo || 0) / 1e6).toFixed(2).replace('.', ',') + ' M</span></span>';
      }).join('') + '</div>' +
      (hist.length > 6 ? '<button class="btn sec chico" style="justify-content:center" onclick="App.historial()">' + (verTodoHistorial ? 'Ver menos' : 'Ver todo el historial') + '</button>' : ''));
    h += '<div class="suave chico" style="text-align:center">Intereses pagados en total: ' + din(p.interesesTotal, 'CRC') + '</div>';
    $('p-prestamo').innerHTML = h;
  }

  // ------------------------------------------------------------ PANELES (formularios)
  function abrir(html) { $('panel').innerHTML = '<div class="asa"></div>' + html; $('velo').classList.add('abierto'); formatearMontos(); if (CALC.abierta) setTimeout(pintarCalc, 50); }
  function cerrar() { $('velo').classList.remove('abierto'); }
  function val(id) { var e = $(id); return e ? e.value : ''; }
  function listo(msg) {
    cerrar(); toast(msg);
    if (D) { guardarCache(JSON.stringify(D)); pintar(); }   // 1.8.1: la copia del teléfono queda al día en el mismo instante
    cargar();
  }   // se ve al instante; la recarga confirma por detrás
  function local(lista) { D.sobresMov = (D.sobresMov || []).concat(lista.map(function (x) { return Object.assign({ fila: 0 }, x); })); guardarCache(JSON.stringify(D)); }

  function formMovimiento(fila, pre) {
    if (selMov && fila && pantalla === 'movimientos') return alternarSel(fila);   // v2.5.3: modo seleccionar
    if (fila && fila < 0) return toast('Se está guardando en Google; en unos segundos lo podés abrir.');
    var m = fila ? D.movimientos.filter(function (x) { return x.fila === fila; })[0] : null;
    m = m || Object.assign({ tipo: 'Gasto', moneda: 'CRC', fecha: new Date().toISOString(), origen: 'Manual' }, pre || {});
    if (!fila && pre && pre.cuenta && !pre.moneda) { var cpre = cuentaPorNombre(pre.cuenta); if (cpre) m.moneda = cpre.moneda || 'CRC'; }
    var cuentas = D.cuentas.filter(function (c) { return c.activa || c.nombre === m.cuenta; }).map(function (c) { return c.nombre; });
    var sobres = D.sobres.map(function (s) { return s.nombre; });
    var h = '<h2>' + (fila ? 'Movimiento' : 'Nuevo movimiento') + '</h2>';
    if (m.origen === 'Correo') h += '<div class="pill ok" style="display:inline-block">Registrado desde un correo' + (m.autorizacion && m.autorizacion.indexOf('auto-') !== 0 ? ' · aut. ' + esc(m.autorizacion) : '') + '</div>';
    h += '<label class="campo"><span>Tipo</span><select id="f-tipo">' + opciones(D.tiposMovimiento.length ? D.tiposMovimiento : ['Gasto', 'Ingreso'], m.tipo) + '</select></label>' +
      '<div style="display:flex;gap:8px;align-items:flex-end"><label class="campo" style="flex:1"><span>Monto</span><input id="f-monto" data-dinero class="monto" inputmode="decimal" placeholder="0" value="' + (m.monto ? esc(String(m.monto).replace('.', ',')) : '') + '"></label>' +
      '<label class="campo" style="width:96px"><span>Moneda</span><select id="f-moneda">' + '<option value="CRC"' + (m.moneda === 'CRC' ? ' selected' : '') + '>₡</option><option value="USD"' + (m.moneda === 'USD' ? ' selected' : '') + '>$</option></select></label></div>' +
      '<label class="campo"><span>Comercio o descripción</span><input id="f-comercio" value="' + esc(m.comercio) + '" placeholder="Ej. Automercado"></label>' +
      '<label class="campo"><span>Lugar</span><input id="f-lugar" value="' + esc(m.lugar) + '" placeholder="Opcional"></label>' +
      '<label class="campo"><span>Fecha y hora</span><input id="f-fecha" type="datetime-local" value="' + localInput(m.fecha, true) + '"></label>' +
      '<label class="campo"><span>Tarjeta o cuenta</span><select id="f-cuenta" onchange="App.monedaDeCuenta()">' + opciones(cuentas, m.cuenta, '— Ninguna —') + '</select></label>' +
      '<label class="campo"><span>Categoría</span><select id="f-categoria">' + opciones(D.categorias, m.categoria, '— Sin categoría —') + '</select></label>' +
      '<label class="campo"><span>Sobre</span><select id="f-sobre">' + opciones(sobres, m.sobre, '— Ninguno —') + '</select></label>' +
      '<label class="campo"><span>Nota</span><input id="f-nota" value="' + esc(m.nota) + '" placeholder="Opcional"></label>' +
      '<label class="check"><input type="checkbox" id="f-regla"> Usar siempre esta categoría y sobre para este comercio</label>' +
      (fila && m.tipo === 'Pago de tarjeta' ? bloqueAbonosDePago(m) : '') +
      (fila ? bloqueSobresDeMov(m) + bloqueViajeDeMov(m) : '') +
      '<div class="acciones"><button class="btn" id="f-guardar" onclick="App.guardarMov(' + (fila || 0) + ')">Guardar</button>' +
      (fila && m.tipo === 'Gasto' ? '<button class="btn sec" onclick="App.formTasaCero(' + fila + ')">Pasar a tasa cero</button>' : '') +
      (fila ? '<button class="btn peligro" id="f-borrar" onclick="App.borrarMov(' + fila + ')">Eliminar movimiento</button>' : '') +
      '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    abrir(h);
  }
  function monedaDeCuenta() { var c = cuentaPorNombre(val('f-cuenta')); if (c && !$('f-monto').value) $('f-moneda').value = c.moneda; }

  function guardarMov(fila) {
    var monto = C.leerNumero(val('f-monto'));
    if (!monto || monto <= 0) return toast('Escribí un monto mayor a cero.');
    var fecha = desdeInput(val('f-fecha'), true);
    if (!fecha) return toast('Revisá la fecha.');
    var orig = fila ? D.movimientos.filter(function (x) { return x.fila === fila; })[0] : null;
    var m = {
      fila: fila || null, control: orig ? { monto: orig.monto } : null,
      fecha: fecha, monto: monto, moneda: val('f-moneda'), tipo: val('f-tipo'),
      comercio: val('f-comercio').trim(), lugar: val('f-lugar').trim(), cuenta: val('f-cuenta'),
      categoria: val('f-categoria'), sobre: val('f-sobre'), nota: val('f-nota').trim(),
      origen: orig ? orig.origen : 'Manual', autorizacion: orig ? orig.autorizacion : '',
      recordarRegla: $('f-regla').checked
    };
    encolar('guardarMovimiento', [m], (fila ? 'Editar ' : 'Nuevo: ') + (m.comercio || m.tipo) + ' · ' + txt(monto, m.moneda));
    hecho('✅ Movimiento guardado');
  }
  function borrarMov(fila) {
    var b = $('f-borrar');
    if (!b.dataset.ok) { b.dataset.ok = '1'; b.textContent = 'Tocá otra vez para confirmar'; return; }
    if (cola.length) { enviarCola(); return toast('Primero se terminan de enviar ' + cola.length + ' cambio' + (cola.length === 1 ? '' : 's') + ' a Google. Probá en unos segundos.'); }
    if (fila < 0) return toast('Se está guardando en Google; en unos segundos lo podés borrar.');
    var orig = D.movimientos.filter(function (x) { return x.fila === fila; })[0];
    srv('eliminarMovimiento', [fila, { monto: orig.monto }], function () { listo('Movimiento eliminado'); }, b);
  }

  function formTasaCero(fila) {
    var m = D.movimientos.filter(function (x) { return x.fila === fila; })[0];
    var c = cuentaPorNombre(m.cuenta);
    var base = new Date(m.fecha);
    var primera = c && c.diaPago ? C.proximaFecha(c.diaPago, new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1)) : C.sumarMeses(base, 1);
    abrir('<h2>Pasar a tasa cero</h2><div class="suave">' + esc(m.comercio) + ' · ' + din(m.monto, m.moneda) + '</div>' +
      '<label class="campo"><span>¿En cuántos meses?</span><input id="t-meses" type="number" min="1" max="72" inputmode="numeric" value="6" oninput="App.cuotaTC(' + m.monto + ',\'' + m.moneda + '\')"></label>' +
      '<div class="suave" id="t-cuota" style="margin-top:6px">Cuota: ' + txt(m.monto / 6, m.moneda) + ' por mes</div>' +
      '<label class="campo"><span>Primera cuota (fecha de pago de la tarjeta)</span><input id="t-primera" type="date" value="' + localInput(primera.toISOString()) + '"></label>' +
      '<div class="acciones"><button class="btn" id="t-ok" onclick="App.guardarTC(' + fila + ')">Pasar a tasa cero</button><button class="btn sec" onclick="App.formMovimiento(' + fila + ')">Volver</button></div>');
  }
  function cuotaTC(monto, moneda) { var n = parseInt(val('t-meses'), 10); $('t-cuota').textContent = n > 0 ? 'Cuota: ' + txt(monto / n, moneda) + ' por mes' : ''; }
  function guardarTC(fila) {
    var n = parseInt(val('t-meses'), 10);
    var f = desdeInput(val('t-primera'));
    if (!(n > 0) || !f) return toast('Revisá los meses y la fecha.');
    var orig = D.movimientos.filter(function (x) { return x.fila === fila; })[0];
    srv('pasarATasaCero', [fila, { monto: orig.monto }, n, f], function () { listo('✅ Ahora se cuenta en cuotas de ' + n + ' meses'); }, $('t-ok'));
  }

  function formCuenta(fila, pre, movFila) {
    var c = fila ? D.cuentas.filter(function (x) { return x.fila === fila; })[0] : Object.assign({ tipo: 'Tarjeta de crédito', moneda: 'CRC', activa: true }, pre || {});
    var num = function (v) { return v === null || v === undefined ? '' : String(v).replace('.', ','); };
    abrir('<h2>' + (fila ? 'Editar cuenta' : 'Nueva tarjeta o cuenta') + '</h2>' +
      '<label class="campo"><span>Nombre (único)</span><input id="c-nombre" value="' + esc(c.nombre) + '" placeholder="Ej. Visa BCR Oro"></label>' +
      '<label class="campo"><span>Tipo</span><select id="c-tipo">' + opciones(D.tiposCuenta, c.tipo) + '</select></label>' +
      '<div class="dos"><label class="campo"><span>Banco</span><input id="c-banco" value="' + esc(c.banco) + '" placeholder="BCR, Davibank…"></label>' +
      '<label class="campo"><span>Últimos 4 dígitos</span><input id="c-u4" inputmode="numeric" maxlength="4" value="' + esc(c.ultimos4) + '" placeholder="1234"></label></div>' +
      '<label class="campo"><span>Moneda principal</span><select id="c-moneda"><option value="CRC"' + (c.moneda === 'CRC' ? ' selected' : '') + '>Colones ₡</option><option value="USD"' + (c.moneda === 'USD' ? ' selected' : '') + '>Dólares $</option></select></label>' +
      '<div class="dos"><label class="campo"><span>Límite ₡</span><input id="c-limc" data-dinero inputmode="decimal" value="' + num(c.limiteCRC) + '"></label><label class="campo"><span>Límite $</span><input id="c-limu" data-dinero inputmode="decimal" value="' + num(c.limiteUSD) + '"></label></div>' +
      '<div class="dos"><label class="campo"><span>Día de corte</span><input id="c-corte" type="number" min="1" max="31" value="' + (c.diaCorte || '') + '"></label><label class="campo"><span>Día de pago</span><input id="c-pago" type="number" min="1" max="31" value="' + (c.diaPago || '') + '"></label></div>' +
      '<div class="dos"><label class="campo"><span>Saldo actual ₡</span><input id="c-salc" data-dinero inputmode="decimal" value="' + num(c.saldoCRC) + '"></label><label class="campo"><span>Saldo actual $</span><input id="c-salu" data-dinero inputmode="decimal" value="' + num(c.saldoUSD) + '"></label></div>' +
      '<label class="campo"><span>Notas</span><input id="c-notas" value="' + esc(c.notas) + '"></label>' +
      (fila ? '<label class="check"><input type="checkbox" id="c-activa"' + (c.activa ? ' checked' : '') + '> Cuenta activa</label>' : '') +
      '<div class="suave chico" style="margin-top:10px">Con los últimos 4 dígitos, las compras que lleguen por correo se asignan solas a esta tarjeta. Si es un banco nuevo, agregá su correo en la pestaña Config de la hoja.</div>' +
      '<div class="acciones"><button class="btn" id="c-ok" onclick="App.guardarCta(' + (fila || 0) + (movFila ? ',' + movFila : '') + ')">' + (movFila ? 'Agregar y anotar la compra' : 'Guardar') + '</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarCta(fila, movFila) {
    var u4 = val('c-u4').trim();
    if (u4 && !/^\d{4}$/.test(u4)) return toast('Los últimos 4 dígitos deben ser 4 números.');
    var c = {
      fila: fila || null, nombre: val('c-nombre').trim(), tipo: val('c-tipo'), banco: val('c-banco').trim(), ultimos4: u4,
      moneda: val('c-moneda'), limiteCRC: C.leerNumero(val('c-limc')), limiteUSD: C.leerNumero(val('c-limu')),
      diaCorte: parseInt(val('c-corte'), 10) || null, diaPago: parseInt(val('c-pago'), 10) || null,
      saldoCRC: C.leerNumero(val('c-salc')), saldoUSD: C.leerNumero(val('c-salu')), notas: val('c-notas').trim(),
      saldoCambio: !fila || (function (o) { return !o || (o.saldoCRC || 0) !== (C.leerNumero(val('c-salc')) || 0) || (o.saldoUSD || 0) !== (C.leerNumero(val('c-salu')) || 0); })(D.cuentas.filter(function (x) { return x.fila === fila; })[0]),
      activa: $('c-activa') ? $('c-activa').checked : true
    };
    if (!c.nombre) return toast('Falta el nombre.');
    srv('guardarCuenta', [c], function () {
      var m = movFila ? movPorFila(movFila) : null;
      if (m) {   // v2.9.0: la compra de la tarjeta nueva queda en ella
        encolar('guardarMovimiento', [{ fila: m.fila, control: { monto: m.monto }, fecha: m.fecha, monto: m.monto, moneda: m.moneda, tipo: m.tipo, comercio: m.comercio, lugar: m.lugar, cuenta: c.nombre,
          categoria: m.categoria, sobre: m.sobre, nota: String(m.nota || '').replace(/\s*·?\s*Tarjeta\s*(?:••|\*+)?\s*\d{4} no est[aá] en Cuentas\s*·?\s*/i, ' ').trim(), origen: m.origen, autorizacion: m.autorizacion, recordarRegla: false }], 'Compra en ' + c.nombre);
      }
      listo(m ? '✅ Tarjeta agregada y compra anotada en ' + c.nombre : '✅ Cuenta guardada');
    }, $('c-ok'));
  }
  // ---- v2.9.0 · tarjetas que no son mías
  function ajenas() { return PREFS().ajenas || {}; }
  function rvAjena(fila, que) {
    var m = movPorFila(fila); if (!m) return;
    var u4 = C.tarjetaDesconocida(D, m);
    if (que === 'si') {
      var tipos = D.tiposCuenta || [], deb = tipos.filter(function (t) { return /d[eé]bito/i.test(t); })[0] || tipos.filter(function (t) { return /ahorro/i.test(t); })[0] || tipos[0] || 'Cuenta';
      return formCuenta(0, { nombre: 'Tarjeta ••' + u4, tipo: deb, ultimos4: u4, moneda: m.moneda === 'USD' ? 'USD' : 'CRC' }, fila);
    }
    borrarMovSilencioso(m, que === 'no' ? '🚫 Listo: la tarjeta ••' + u4 + ' queda ignorada y se borró la compra' : 'Compra borrada', function () {
      if (que !== 'no' || !u4) return;
      var o = Object.assign({}, ajenas()); o[u4] = { nombre: (o[u4] && o[u4].nombre) || '', desde: new Date().toISOString().slice(0, 10) };
      guardarPrefs({ ajenas: o }, 'Tarjeta ••' + u4 + ' no es mía');
    });
  }
  /** Borra un movimiento sin el formulario (espera a que la cola termine); `despues` corre cuando Google lo borró */
  function borrarMovSilencioso(m, msg, despues) {
    if (m.fila < 0 || cola.length) { if (cola.length) enviarCola(); return toast('Se está guardando en Google; probá en unos segundos.'); }
    D.movimientos = D.movimientos.filter(function (x) { return x !== m; });
    pintar();
    srv('eliminarMovimiento', [m.fila, { monto: m.monto }], function () { if (despues) despues(); listo(msg); });
  }
  function formAjenas() {
    var o = ajenas(), ks = Object.keys(o), cont = (AJ && AJ.ajenasSaltadas) || {};
    abrir('<h2>🚫 Tarjetas que no son mías</h2><div class="suave">Los correos de estas tarjetas te llegan a vos (por ejemplo, la tarjeta de un hijo), pero la app no los anota.</div>' +
      (ks.length ? '<div class="caja sinpad" style="margin-top:10px">' + ks.map(function (k) {
        var x = o[k] || {}, n = cont[k] || 0;
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--linea)"><span class="mini-plastico" style="background:var(--linea);color:var(--texto);flex-shrink:0">' + esc(k) + '</span><span style="flex:1;min-width:0;display:block"><input class="aj-nom" data-u4="' + esc(k) + '" value="' + esc(x.nombre || '') + '" placeholder="Nombre (opcional)" onchange="App.ajenaNombre(this)" style="width:100%;background:none;border:0;border-bottom:1px solid var(--linea);color:var(--texto);font:inherit;font-weight:700;padding:2px 0">' +
          '<span class="suave chico" style="display:block">' + (x.desde ? 'Ignorada desde ' + fechaCorta(x.desde + 'T12:00:00').replace(/ \d{4}$/, '') : 'Ignorada') + ' · ' + n + ' correo' + (n === 1 ? '' : 's') + ' saltado' + (n === 1 ? '' : 's') + '</span></span>' +
          '<button onclick="App.ajenaQuitar(\'' + q(k) + '\')" style="background:none;border:0;color:var(--rojo);font:inherit;font-weight:700;padding:6px;flex-shrink:0">Quitar</button></div>';
      }).join('') + '</div>' : '<div class="caja vacio" style="margin-top:10px">Ninguna todavía. Cuando llegue una compra de una tarjeta que no conocés, Para revisar te pregunta.</div>') +
      '<div class="dos" style="margin-top:10px;align-items:end"><label class="campo compacto"><span>Últimos 4</span><input id="aj-u4" inputmode="numeric" maxlength="4" placeholder="1234"></label><label class="campo compacto"><span>Nombre (opcional)</span><input id="aj-nom" placeholder="Tarjeta de…"></label></div>' +
      '<div class="acciones"><button class="btn" onclick="App.ajenaAgregar()">＋ Agregar tarjeta</button><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }
  function ajenaAgregar() {
    var u4 = val('aj-u4').trim(); if (!/^\d{4}$/.test(u4)) return toast('Poné los últimos 4 números de la tarjeta.');
    if (D.cuentas.some(function (c) { return String(c.ultimos4 || '') === u4; })) return toast('••' + u4 + ' ya está en tus Cuentas.');
    var o = Object.assign({}, ajenas()); o[u4] = { nombre: val('aj-nom').trim(), desde: new Date().toISOString().slice(0, 10) };
    guardarPrefs({ ajenas: o }, 'Tarjeta ••' + u4 + ' no es mía'); formAjenas(); pintar();
  }
  function ajenaNombre(el) { var o = Object.assign({}, ajenas()), k = el.getAttribute('data-u4'); o[k] = Object.assign({}, o[k] || {}, { nombre: el.value.trim() }); guardarPrefs({ ajenas: o }, 'Nombre de la tarjeta ••' + k); }
  // ---- v2.10.6 · tarjetas de la familia (solo cuentan en viajes)
  function familia() { return PREFS().familia || {}; }
  function personasFamilia() { var o = familia(), v = []; Object.keys(o).forEach(function (k) { var p = (o[k].persona || 'Familia').trim(); if (v.indexOf(p) < 0) v.push(p); }); return v; }
  function bancoDeNombre(n) { var t = String(n || '').toLowerCase(); return /bac|credomatic/.test(t) ? 'BAC' : /davi/.test(t) ? 'Davibank' : /bcr/.test(t) ? 'BCR' : /promerica/.test(t) ? 'Promerica' : /\bbn\b|nacional/.test(t) ? 'BN' : n || ''; }
  function infoFamilia(k) { var u4 = C.familia4({ cuenta: k }), x = familia()[u4] || {}; return { u4: u4, persona: (x.persona || 'Familia').trim(), nombre: x.nombre || 'Tarjeta', banco: bancoDeNombre(x.nombre) }; }
  function plasticoTexto(k) { if (C.esFamilia({ cuenta: k })) { var fx = infoFamilia(k); return fx.nombre + ' ••' + fx.u4; } return etiquetaCuenta(k); }
  function movsFamilia(u4) { return D.movimientos.filter(function (m) { return C.familia4(m) === u4; }).length; }
  /** "¿De quién es la ••1234?" (desde Para revisar o desde Ajustes) */
  function formFamiliaTarjeta(u4, fila) {
    var m = fila ? movPorFila(fila) : null, x = familia()[u4] || {};
    var banco = m && /^BAC-/.test(m.autorizacion || '') ? 'BAC Credomatic' : m && /davibank/i.test(m.nota || '') ? 'Davibank' : '';
    var pers = personasFamilia();
    abrir('<h2>👪 ¿De quién es la ••' + esc(u4) + '?</h2><div class="suave">Sus compras van a contar <b>solo en los viajes</b>, separadas por persona y tarjeta. No tocan tus cuentas, deudas, sobres ni reportes.</div>' +
      '<label class="campo"><span>Nombre de la persona</span><input id="fm-per" list="fm-pers" value="' + esc(x.persona || pers[0] || '') + '" placeholder="Ej. Ana"><datalist id="fm-pers">' + pers.map(function (p) { return '<option value="' + esc(p) + '">'; }).join('') + '</datalist></label>' +
      '<label class="campo"><span>Nombre de la tarjeta</span><input id="fm-nom" value="' + esc(x.nombre || banco) + '" placeholder="Ej. Visa BAC, Mastercard Davibank"></label>' +
      '<div class="acciones"><button class="btn" id="fm-ok" onclick="App.guardarFamiliaTarjeta(\'' + q(u4) + '\',' + (fila || 0) + ')">Guardar</button><button class="btn sec" onclick="App.' + (fila ? 'cerrar' : 'formFamilia') + '()">Cancelar</button></div>');
  }
  function guardarFamiliaTarjeta(u4, fila) {
    var per = val('fm-per').trim(), nom = val('fm-nom').trim();
    if (!per) return toast('Escribí de quién es la tarjeta.');
    if (!/^\d{4}$/.test(u4)) return toast('Poné los últimos 4 números.');
    if (D.cuentas.some(function (c) { return String(c.ultimos4 || '') === u4; })) return toast('••' + u4 + ' ya está en tus Cuentas.');
    var o = Object.assign({}, familia()), nuevo = !o[u4]; o[u4] = { persona: per, nombre: nom || 'Tarjeta', desde: (o[u4] && o[u4].desde) || new Date().toISOString().slice(0, 10) };
    var parcial = { familia: o }; if (ajenas()[u4]) { var aj = Object.assign({}, ajenas()); delete aj[u4]; parcial.ajenas = aj; }
    guardarPrefs(parcial, 'Tarjeta ••' + u4 + ' de ' + per);
    // las compras que ya llegaron de esa tarjeta pasan a "Familia ••1234"
    var pasadas = D.movimientos.filter(function (m) { return m.fila > 0 && C.tarjetaDesconocida(D, m) === u4; });
    pasadas.forEach(function (m) {
      var nota = String(m.nota || '').replace(/\.?\s*Tarjeta\s*(?:••|\*+)?\s*\d{4} no est[aá] en Cuentas/i, '').replace(/^\.\s*/, '');
      nota = (nota ? nota + '. ' : '') + 'Tarjeta de la familia (solo viajes)';
      encolar('guardarMovimiento', [{ fila: m.fila, control: { monto: m.monto }, fecha: m.fecha, monto: m.monto, moneda: m.moneda, tipo: m.tipo, comercio: m.comercio, lugar: m.lugar, cuenta: 'Familia ••' + u4,
        categoria: m.categoria, sobre: '', nota: nota, origen: m.origen, autorizacion: m.autorizacion, recordarRegla: false }], 'Compra de ' + per + ': ' + (m.comercio || ''));
    });
    if (pasadas.length) marcarVistos(pasadas);
    if (fila) hecho('👪 Listo: ••' + u4 + ' es de ' + per + (pasadas.length ? ' · ' + pasadas.length + ' compra' + (pasadas.length === 1 ? '' : 's') + ' pasada' + (pasadas.length === 1 ? '' : 's') : '') + '. Solo cuenta en viajes.');
    else { formFamilia(); pintar(); toast(nuevo ? '👪 Tarjeta agregada' : 'Guardado'); }
  }
  function formFamilia() {
    var o = familia(), pers = personasFamilia();
    abrir('<h2>👪 Tarjetas de la familia</h2><div class="suave">Solo cuentan en los viajes. No suman a tus cuentas, deudas, sobres ni reportes.</div>' +
      (pers.length ? pers.map(function (p) {
        var ks = Object.keys(o).filter(function (k) { return (o[k].persona || 'Familia').trim() === p; });
        return '<div class="caja sinpad" style="margin-top:10px"><div class="suave chico fuerte" style="padding:10px 14px 0">👩 ' + esc(p.toUpperCase()) + '</div>' + ks.map(function (k) {
          var x = o[k], n = movsFamilia(k);
          return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--linea)"><span class="vj-pl" style="background:' + colorBanco(bancoDeNombre(x.nombre)) + ';flex-shrink:0">' + esc(k) + '</span>' +
            '<button onclick="App.formFamiliaTarjeta(\'' + q(k) + '\')" style="flex:1;min-width:0;text-align:left;background:none;border:0;color:var(--texto);font:inherit;padding:0"><b style="display:block">' + esc(x.nombre || 'Tarjeta') + ' ••' + esc(k) + '</b><span class="suave chico">' + n + ' compra' + (n === 1 ? '' : 's') + ' leída' + (n === 1 ? '' : 's') + ' · tocá para editar</span></button>' +
            '<button onclick="App.familiaQuitar(\'' + q(k) + '\')" style="background:none;border:0;color:var(--rojo);font:inherit;font-weight:700;padding:6px;flex-shrink:0">Quitar</button></div>';
        }).join('') + '</div>';
      }).join('') : '<div class="caja vacio" style="margin-top:10px">Ninguna todavía. Cuando llegue una compra de una tarjeta que no conocés, Para revisar te pregunta; o agregala acá.</div>') +
      '<div class="dos" style="margin-top:10px;align-items:end"><label class="campo compacto"><span>Últimos 4</span><input id="fm-u4" inputmode="numeric" maxlength="4" placeholder="1234"></label><button class="btn" onclick="App.familiaAgregar()">＋ Agregar tarjeta</button></div>' +
      '<div class="caja" style="margin-top:10px;background:var(--fondo);gap:4px"><b style="font-size:14px">📧 Cómo llegan sus compras</b><span class="suave chico">Ella reenvía a tu Gmail los avisos de compra de sus bancos (con un filtro de Gmail). La app los lee igual que los tuyos. Si un viaje no debe incluirlas, desmarcalo en Editar viaje.</span></div>' +
      '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }
  function familiaAgregar() { var u4 = val('fm-u4').trim(); if (!/^\d{4}$/.test(u4)) return toast('Poné los últimos 4 números de la tarjeta.'); formFamiliaTarjeta(u4, 0); }
  function familiaQuitar(k) {
    var o = Object.assign({}, familia()); delete o[k];
    guardarPrefs({ familia: o }, 'Tarjeta ••' + k + ' ya no es de la familia'); formFamilia(); pintar();
    toast('Quitada. Las compras que ya estaban siguen contando solo en viajes.', 4000);
  }
  function ajenaQuitar(k) { var o = Object.assign({}, ajenas()); delete o[k]; guardarPrefs({ ajenas: o }, 'Tarjeta ••' + k + ' vuelve a anotarse'); formAjenas(); pintar(); }

  function formPago() {
    var e = D.prestamo.estimado;
    var r = function (n) { return n === null || n === undefined ? '' : (Math.round(n * 100) / 100).toFixed(2).replace('.', ','); };
    abrir('<h2>Registrar pago del préstamo</h2><div class="suave">Normalmente se registra solo con el correo del banco. Usá esto solo si no llegó.</div>' +
      '<label class="campo"><span>Fecha de pago</span><input id="p-fecha" type="date" value="' + localInput() + '"></label>' +
      '<label class="campo"><span>N° de comprobante</span><input id="p-comp" inputmode="numeric"></label>' +
      '<label class="campo"><span>Abono a principal</span><input id="p-prin" data-dinero inputmode="decimal" value="' + r(e.principal) + '"></label>' +
      '<label class="campo"><span>Intereses</span><input id="p-int" data-dinero inputmode="decimal" value="' + r(e.intereses) + '"></label>' +
      '<label class="campo"><span>Pólizas</span><input id="p-pol" data-dinero inputmode="decimal" value="' + r(e.polizas) + '"></label>' +
      '<div class="suave chico" style="margin-top:8px">Los montos vienen del estimado: cambialos por los reales del comprobante.</div>' +
      '<div class="acciones"><button class="btn" id="p-ok" onclick="App.guardarPago()">Registrar pago</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarPago() {
    var p = { fecha: desdeInput(val('p-fecha')), comprobante: val('p-comp').trim(), principal: C.leerNumero(val('p-prin')), intereses: C.leerNumero(val('p-int')), polizas: C.leerNumero(val('p-pol')) || 0 };
    if (!p.fecha || !p.principal || !p.intereses) return toast('Revisá la fecha, el principal y los intereses.');
    srv('registrarPagoPrestamo', [p], function (r) { listo(r === 'duplicado' ? 'Ese comprobante ya estaba registrado' : '✅ Pago registrado'); }, $('p-ok'));
  }

  function formTBP() {
    var f = new Date(hoy.getFullYear(), hoy.getMonth(), 7);
    abrir('<h2>Anotar la TBP</h2><div class="suave">La TBP del día 7 se usa en la cuota que vence el 7 del mes siguiente.</div>' +
      '<label class="campo"><span>Fecha (día 7)</span><input id="b-fecha" type="date" value="' + localInput(f.toISOString()) + '"></label>' +
      '<label class="campo"><span>TBP (%)</span><input id="b-tbp" inputmode="decimal" placeholder="3,56"></label>' +
      '<div class="acciones"><button class="btn" id="b-ok" onclick="App.guardarTBP()">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarTBP() {
    var t = C.leerNumero(val('b-tbp')), f = desdeInput(val('b-fecha'));
    if (!t || !f) return toast('Revisá la fecha y la TBP.');
    if (t > 1) t = t / 100;     // "3,56" → 0.0356
    srv('registrarTBP', [f, t], function () { listo('✅ TBP guardada: tasa ' + C.pct(t + 0.03)); }, $('b-ok'));
  }

  function revisarCorreos(boton) {
    toast('Revisando el correo…', 10000);
    srv('revisarCorreosAhora', [], function (msg) { toast(msg, 5000); cargar(); }, boton);
  }

  // ------------------------------------------------------------ EL + (v2.0): teclado rápido, frecuentes, pegar del banco y más acciones
  var rap = null;
  function frecuentes(tipo) {
    var limite = new Date(hoy.getTime() - 180 * 86400000), grupos = {}, orden = [];
    var porMov = sinServidorSobres() ? {} : SB().porMov;
    D.movimientos.slice().sort(function (x, y) { return new Date(y.fecha) - new Date(x.fecha); }).forEach(function (m) {
      if (m.tipo !== tipo || !m.comercio || m.fila < 0 || new Date(m.fecha) < limite) return;
      var k = nombreBonito(m.comercio).toLowerCase().trim();
      if (!grupos[k]) {
        var sob = m.sobre || ((porMov[m.fila] || []).filter(function (x) { return x.sobre; })[0] || {}).sobre || '';
        grupos[k] = { nombre: nombreBonito(m.comercio), comercio: m.comercio, categoria: m.categoria || '', sobre: sob, cuenta: m.cuenta || '', moneda: m.moneda || 'CRC', monto: m.monto, n: 0 };
        orden.push(k);
      }
      grupos[k].n++;
    });
    var sal = tipo === 'Ingreso' ? salCfg() : null;
    if (sal && sal.monto) { var ks = orden.filter(function (k) { return /^salario/.test(k); })[0]; if (ks) grupos[ks].n += 999; else { grupos.__sal = { nombre: '💰 Salario', comercio: 'Salario', categoria: '', sobre: '', cuenta: sal.cuenta || '', moneda: sal.moneda || 'CRC', monto: sal.monto, n: 999 }; orden.unshift('__sal'); } }
    return orden.map(function (k) { return grupos[k]; }).sort(function (x, y) { return y.n - x.n; }).slice(0, 8);
  }
  function formRapido(tipo) {
    var ultCuenta = guardado('mf-rap-cuenta', '');
    if (ultCuenta && !cuentaPorNombre(ultCuenta)) ultCuenta = '';
    rap = { tipo: tipo || 'Gasto', monto: '', moneda: ultCuenta ? (cuentaPorNombre(ultCuenta).moneda || 'CRC') : 'CRC', cuenta: ultCuenta, comercio: '', categoria: '', sobre: '', frec: -1 };
    pintarRapido();
  }
  function montoRapido() { return C.leerNumero(rap.monto.replace(',', '.').replace(/^\./, '0.')) || 0; }
  function textoMontoRapido() {
    var s = rap.monto || '0', p = s.split(','), ent = Number(p[0] || 0).toLocaleString('es-CR').replace(/\s| /g, '.').replace(/,/g, '.');
    return (rap.moneda === 'USD' ? '$' : '₡') + ent + (p.length > 1 ? ',' + p[1] : '');
  }
  function pintarRapido() {
    var fr = frecuentes(rap.tipo);
    var cuentas = D.cuentas.filter(function (c) { return c.activa; }).map(function (c) { return c.nombre; });
    var ic = iconoMov({ tipo: rap.tipo, categoria: rap.categoria || (rap.tipo === 'Gasto' ? '' : 'x') });
    var resumen = rap.tipo === 'Gasto' && !rap.categoria ? '<span class="naranja">Sin categoría</span>' : esc(rap.categoria || rap.tipo);
    resumen = (rap.comercio ? '<b>' + esc(nombreBonito(rap.comercio)) + '</b> · ' : '') + resumen + (rap.sobre ? ' · ✉ ' + esc(rap.sobre) : '') + ' · hoy';
    abrir('<div class="rap">' +
      '<div class="chips rap-tipos">' + [['Gasto', 'Gasto'], ['Ingreso', 'Ingreso']].map(function (t) {
        return '<button class="chip' + (rap.tipo === t[0] ? ' on' : '') + '" onclick="App.rapTipo(\'' + t[0] + '\')">' + t[1] + '</button>';
      }).join('') + (sinServidorSobres() ? '' : '<button class="chip" onclick="App.formMover()">Mover</button>') + '<button class="chip" onclick="App.formAcciones()">Otros ⋯</button></div>' +
      '<button class="rap-pegar" onclick="App.rapPegar()">📋 <span>Pegar mensaje del banco</span></button>' +
      '<div class="rap-fila"><button class="chip" onclick="App.rapMoneda()" aria-label="Cambiar moneda">₡ ⇄ $</button>' +
      '<select id="rp-cuenta" class="rap-cuenta" onchange="App.rapCuenta(this.value)" aria-label="Tarjeta o cuenta">' + opciones(cuentas, rap.cuenta, 'Sin cuenta (efectivo)') + '</select></div>' +
      '<div class="rap-monto" id="rp-monto">' + textoMontoRapido() + '<i></i></div>' +
      (fr.length ? '<div class="chips rap-frec">' + fr.map(function (f, i) {
        return '<button class="chip' + (rap.frec === i ? ' on' : '') + '" onclick="App.rapFrecuente(' + i + ')">' + (f.categoria ? iconoMov({ tipo: rap.tipo, categoria: f.categoria })[0] : '•') + ' ' + esc(f.nombre) + '</button>';
      }).join('') + '</div>' : '<div class="suave chico">Cuando registres algunos, aquí te salen los frecuentes para llenarlos de un toque.</div>') +
      '<button class="rap-resumen" onclick="App.rapDetalles()"><span class="ico-cat" style="width:30px;height:30px;font-size:14px;background:color-mix(in srgb, ' + ic[1] + ' 18%, transparent);color:' + ic[1] + '">' + ic[0] + '</span><span class="li-t">' + resumen + '</span><span class="enlace">Cambiar ›</span></button>' +
      '<div class="teclado">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map(function (k) {
        return '<button onclick="App.rapTecla(\'' + k + '\')"' + (k === '⌫' ? ' aria-label="Borrar"' : '') + '>' + k + '</button>';
      }).join('') + '</div>' +
      '<button class="btn" id="rp-ok" style="width:100%;margin-top:10px" onclick="App.rapGuardar()">Guardar</button></div>');
  }
  function rapTecla(k) {
    var s = rap.monto;
    if (k === '⌫') s = s.slice(0, -1);
    else if (k === ',') { if (s.indexOf(',') < 0) s = (s || '0') + ','; }
    else {
      if (s.indexOf(',') >= 0 && s.split(',')[1].length >= 2) return;
      if (s.replace(',', '').length >= 11) return;
      s = s === '0' ? k : s + k;
    }
    rap.monto = s;
    var e = $('rp-monto'); if (e) e.innerHTML = textoMontoRapido() + '<i></i>';
  }
  function rapTipo(t) { rap.tipo = t; rap.frec = -1; rap.comercio = rap.categoria = rap.sobre = ''; pintarRapido(); }
  function rapMoneda() { rap.moneda = rap.moneda === 'USD' ? 'CRC' : 'USD'; pintarRapido(); }
  function rapCuenta(v) { rap.cuenta = v; var c = cuentaPorNombre(v); if (c && !rap.monto) rap.moneda = c.moneda || rap.moneda; pintarRapido(); }
  function rapFrecuente(i) {
    var f = frecuentes(rap.tipo)[i]; if (!f) return;
    if (rap.frec === i) { rap.frec = -1; rap.comercio = rap.categoria = rap.sobre = ''; return pintarRapido(); }
    rap.frec = i; rap.comercio = f.comercio; rap.categoria = f.categoria; rap.sobre = f.sobre;
    if (f.cuenta && cuentaPorNombre(f.cuenta)) rap.cuenta = f.cuenta;
    rap.moneda = f.moneda;
    if (!rap.monto) rap.monto = String(Math.round(f.monto * 100) / 100).replace('.', ',');
    pintarRapido();
  }
  function rapDetalles() {
    formMovimiento(0, { tipo: rap.tipo, monto: montoRapido() || null, moneda: rap.moneda, cuenta: rap.cuenta, comercio: rap.comercio, categoria: rap.categoria, sobre: rap.sobre });
  }
  function rapGuardar() {
    var monto = montoRapido();
    if (!(monto > 0)) return toast('Escribí el monto.');
    var m = { fila: null, control: null, fecha: new Date().toISOString(), monto: monto, moneda: rap.moneda, tipo: rap.tipo, comercio: rap.comercio || '', lugar: '',
      cuenta: rap.cuenta, categoria: rap.categoria, sobre: rap.sobre, nota: '', origen: 'Manual', autorizacion: '', recordarRegla: false };
    guardar('mf-rap-cuenta', rap.cuenta || '');
    encolar('guardarMovimiento', [m], 'Nuevo: ' + (nombreBonito(m.comercio) || m.categoria || m.tipo) + ' · ' + txt(monto, m.moneda));
    hecho('✅ ' + (m.tipo === 'Ingreso' ? 'Ingreso' : 'Gasto') + ' de ' + txt(monto, m.moneda) + ' guardado');
  }
  /** Lee el SMS o correo del banco que la persona copió y llena el monto, comercio y tarjeta */
  function leerMensajeBanco(t) {
    t = String(t || '').replace(/\s+/g, ' ');
    var r = {}, m;
    if ((m = t.match(/(?:US\$|USD|\$|d[oó]lares)\s*([\d][\d.,]*\d|\d)/i))) { r.moneda = 'USD'; r.monto = C.leerNumero(m[1]); }
    if ((m = t.match(/(?:₡|¢|CRC|colones)\s*([\d][\d.,]*\d|\d)/i)) || (m = t.match(/([\d][\d.,]*\d)\s*(?:CRC|colones)/i))) { r.moneda = 'CRC'; r.monto = C.leerNumero(m[1]); }
    if (!r.monto && (m = t.match(/([\d][\d.,]*\d)\s*(?:USD|d[oó]lares)/i))) { r.moneda = 'USD'; r.monto = C.leerNumero(m[1]); }
    if ((m = t.match(/(?:comercio|establecimiento|lugar)\s*:?\s*([A-Za-z0-9][\w .&*'\/-]{2,40}?)(?=\s+(?:el|con|por|fecha|a las|tarjeta|monto)\b|[.,;\n]|$)/i)) ||
      (m = t.match(/\ben\s+([A-Z0-9][A-Z0-9 .&*'\/-]{2,40}?)(?=\s+(?:el|con|por|fecha|a las|tarjeta|monto)\b|[.,;\n]|$)/))) r.comercio = m[1].trim();
    (t.match(/\b\d{4}\b/g) || []).forEach(function (u) { var c = D.cuentas.filter(function (x) { return x.activa && x.ultimos4 === u; })[0]; if (c) r.cuenta = c.nombre; });
    if (/dep[oó]sito|recibi|recibid|transferencia recibida|acredit/i.test(t)) r.tipo = 'Ingreso';
    return r;
  }
  function rapPegar() {
    if (!navigator.clipboard || !navigator.clipboard.readText) return toast('Este navegador no deja leer lo copiado. Escribí el monto con el teclado.', 4500);
    navigator.clipboard.readText().then(function (t) {
      var r = leerMensajeBanco(t);
      if (!r.monto) return toast('No encontré un monto en lo que copiaste.', 4000);
      if (r.tipo && r.tipo !== rap.tipo) { rap.tipo = r.tipo; rap.frec = -1; rap.categoria = rap.sobre = ''; }
      rap.monto = String(r.monto).replace('.', ','); rap.moneda = r.moneda || rap.moneda;
      if (r.cuenta) rap.cuenta = r.cuenta;
      if (r.comercio) {
        rap.comercio = r.comercio;
        var fr = frecuentes(rap.tipo), k = nombreBonito(r.comercio).toLowerCase();
        fr.forEach(function (f, i) { if (f.nombre.toLowerCase() === k) { rap.frec = i; rap.categoria = f.categoria; rap.sobre = f.sobre; } });
      }
      pintarRapido();
      toast('Leí ' + txt(r.monto, rap.moneda) + (r.comercio ? ' en ' + nombreBonito(r.comercio) : '') + '. Revisá y guardá.', 4000);
    }, function () { toast('Para pegar, permití que la app lea lo copiado.', 4500); });
  }
  // ------------------------------------------------------------ v2.3: leer fotos de comprobantes y PDF de fondos (dentro del teléfono)
  function elegirArchivo(tipo) {
    var i = document.createElement('input');
    i.type = 'file'; i.accept = tipo === 'pdf' ? 'application/pdf,.pdf' : 'image/*';
    i.onchange = function () { if (i.files && i.files[0]) procesarArchivo(i.files[0]); };
    i.click();
  }
  function procesarArchivo(f) {
    if (!D) return toast('Esperá a que carguen tus datos.');
    if (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name || '')) return leerEstadoFondosPdf(f);
    if (/^image\//i.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name || '')) return leerFotoComprobante(f);
    toast('Ese archivo no es una foto ni un PDF.');
  }
  function revisarCompartido() {
    if (!/compartido=1/.test(location.search) || !('caches' in window)) return;
    try { history.replaceState(history.state, '', location.pathname); } catch (e) { /* nada */ }
    caches.open('mf-compartido').then(function (c) {
      return c.match('./__compartido').then(function (r) {
        if (!r) return toast('No llegó ningún archivo.');
        return r.blob().then(function (b) {
          c.delete('./__compartido');
          var nombre = decodeURIComponent(r.headers.get('X-Nombre') || 'archivo');
          procesarArchivo(new File([b], nombre, { type: b.type || r.headers.get('Content-Type') || '' }));
        });
      });
    });
  }
  function cargando(titulo, sub) {
    abrir('<div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:24px 8px;text-align:center"><div class="spinner"></div><b>' + titulo + '</b><span class="suave chico">' + sub + '</span></div>');
  }
  var compLeido = null;
  function leerFotoComprobante(f) {
    var primera = !guardado('mf-ocr-listo', '');
    cargando('Leyendo el comprobante…', primera ? 'La primera vez descarga el lector (unos 8 MB) y queda guardado. La foto no sale del teléfono.' : 'La foto no sale del teléfono.');
    Lector.leerImagen(f).then(function (texto) {
      guardar('mf-ocr-listo', '1');
      compLeido = Lector.leerComprobante(texto, D.cuentas);
      compLeido.miniatura = URL.createObjectURL(f);
      formComprobante();
    }, function (e) { cerrar(); toast('⚠️ No pude leer la foto: ' + e.message, 6000); });
  }
  function formComprobante() {
    var r = compLeido; if (!r) return;
    var tipos = D.tiposMovimiento && D.tiposMovimiento.length ? D.tiposMovimiento : ['Gasto', 'Ingreso', 'Pago de tarjeta', 'Transferencia'];
    if (tipos.indexOf(r.tipo) < 0) tipos = tipos.concat([r.tipo]);
    var cuentas = D.cuentas.filter(function (c) { return c.activa; }).map(function (c) { return c.nombre; });
    var aut = r.documento ? 'DOC-' + r.documento : '';
    var dup = aut && D.movimientos.some(function (m) { return m.autorizacion === aut; });
    var ok = function (v) { return v ? ' <span class="verde-pos">✓</span>' : ' <span class="naranja">revisá</span>'; };
    abrir('<div style="display:flex;gap:12px;align-items:center"><img src="' + r.miniatura + '" alt="" style="width:58px;height:74px;object-fit:cover;border-radius:8px;border:1px solid var(--borde)">' +
      '<div><div class="verde-pos fuerte chico">📷 Leí el comprobante</div><h2 style="margin:2px 0">' + esc(r.tipo) + '</h2><div class="suave chico">Revisá y guardá. Podés cambiar cualquier dato.</div></div></div>' +
      (dup ? '<div class="aviso-tasa">⚠️ Ese documento (' + esc(r.documento) + ') ya está registrado. Si lo guardás, queda dos veces.</div>' : '') +
      '<label class="campo compacto"><span>Tipo' + ok(r.tipo) + '</span><select id="cp-tipo">' + opciones(tipos, r.tipo) + '</select></label>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Monto' + ok(r.monto && !r.montoDudoso) + '</span><input id="cp-monto" data-dinero inputmode="decimal" value="' + (r.monto ? String(r.monto).replace('.', ',') : '') + '"></label>' +
      '<label class="campo compacto"><span>Moneda</span><select id="cp-moneda"><option value="CRC"' + (r.moneda === 'CRC' ? ' selected' : '') + '>₡</option><option value="USD"' + (r.moneda === 'USD' ? ' selected' : '') + '>$</option></select></label></div>' +
      '<label class="campo compacto"><span>' + (r.tipo === 'Pago de tarjeta' ? 'Tarjeta pagada' : 'Cuenta') + ok(r.cuenta) + '</span><select id="cp-cuenta">' + opciones(cuentas, r.cuenta, '— Elegí —') + '</select></label>' +
      '<label class="campo compacto"><span>Fecha y hora' + ok(r.fecha) + '</span><input id="cp-fecha" type="datetime-local" value="' + localInput((r.fecha || new Date()).toISOString(), true) + '"></label>' +
      '<label class="campo compacto"><span>Descripción</span><input id="cp-comercio" value="' + esc(r.comercio) + '"></label>' +
      '<label class="campo compacto"><span>Nota</span><input id="cp-nota" value="' + esc(r.nota) + '"></label>' +
      '<details class="pleg" style="margin-top:10px"><summary><span class="pl-t">Texto que leí de la foto</span><span class="flecha">›</span></summary><div class="pl-c"><pre class="texto-leido">' + esc((r.lineas || []).join('\n')) + '</pre></div></details>' +
      '<div class="acciones"><button class="btn" id="cp-ok" onclick="App.guardarComprobante()">' + (r.tipo === 'Pago de tarjeta' ? 'Registrar pago' : 'Registrar') + '</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarComprobante() {
    var monto = C.leerNumero(val('cp-monto'));
    if (!(monto > 0)) return toast('Revisá el monto.');
    var fecha = desdeInput(val('cp-fecha'), true); if (!fecha) return toast('Revisá la fecha.');
    var m = { fila: null, control: null, fecha: fecha, monto: monto, moneda: val('cp-moneda'), tipo: val('cp-tipo'), comercio: val('cp-comercio').trim(), lugar: '', cuenta: val('cp-cuenta'),
      categoria: '', sobre: '', nota: val('cp-nota').trim(), origen: 'Manual', autorizacion: compLeido && compLeido.documento ? 'DOC-' + compLeido.documento : '', recordarRegla: false };
    if (m.tipo === 'Pago de tarjeta' && !m.cuenta) return toast('Elegí la tarjeta que pagaste.');
    encolar('guardarMovimiento', [m], 'Desde foto: ' + (m.comercio || m.tipo) + ' · ' + txt(monto, m.moneda));
    compLeido = null;
    hecho(m.tipo === 'Pago de tarjeta' ? '✅ Pago registrado. La deuda de la tarjeta baja sola.' : '✅ Registrado desde la foto');
  }
  var estadoLeido = null;
  function leerEstadoFondosPdf(f) {
    if (sinServidorV17() || !D.fondos || !D.fondos.length) return toast('Primero agregá tus subcuentas en Fondos (＋ Subcuenta).', 5000);
    cargando('Leyendo el estado de cuenta…', 'El PDF no sale del teléfono.');
    Lector.leerPdf(f, function () { return prompt('Este PDF tiene contraseña. Escribila:') || ''; }).then(function (lineas) {
      if (!lineas.length) { cerrar(); return toast('Ese PDF no trae texto (parece una imagen). Mandame uno para revisarlo.', 6000); }
      estadoLeido = Lector.leerEstadoFondos(lineas, FD().lista);
      formEstadoFondos();
    }, function (e) { cerrar(); toast('⚠️ No pude leer el PDF: ' + e.message, 6000); });
  }
  function formEstadoFondos() {
    var e = estadoLeido; if (!e) return;
    var encontrados = e.subcuentas.filter(function (s) { return s.propuesto !== null; }).length;
    abrir('<div class="verde-pos fuerte chico">📄 Leí el estado de cuenta' + (e.corte ? ' al ' + fechaCorta(e.corte.toISOString()) : '') + '</div><h2 style="margin:2px 0 4px">Actualizar fondos</h2>' +
      '<div class="suave chico">Encontré ' + encontrados + ' de ' + e.subcuentas.length + ' subcuentas. Revisá cada saldo; lo que cambie respecto a hoy se anota como intereses.</div>' +
      e.subcuentas.map(function (s, i) {
        var f = s.fondo;
        return '<div class="ef-fila"><div class="fila"><b>' + esc(f.nombre) + '</b><span class="suave chico">hoy ' + din(f.saldo, f.moneda) + '</span></div>' +
          '<input id="ef-' + i + '" data-dinero inputmode="decimal" placeholder="' + (s.propuesto === null ? 'No lo encontré · escribilo' : '') + '" value="' + (s.propuesto !== null ? String(s.propuesto).replace('.', ',') : '') + '" oninput="App.difFondo(' + i + ')">' +
          '<div class="suave chico" id="ef-d-' + i + '">' + difTexto(s.propuesto, f) + '</div>' +
          (s.safi ? '<div class="suave chico">En el informe: «' + esc(s.safi.nombre) + '» · rendimientos acumulados ' + txt(s.safi.rendimientos, f.moneda) + '</div>' : '') + '</div>';
      }).join('') +
      ((e.sobran || []).length ? '<div class="seccion" style="margin-top:12px">En el informe pero no en la app</div>' + e.sobran.map(function (x, j) {
        return '<div class="ef-fila"><div class="fila"><b>' + esc(x.nombre) + '</b><b>' + txt(x.saldo, /d[oó]lar/i.test(x.fondo) ? 'USD' : 'CRC') + '</b></div><div class="suave chico">' + esc(x.fondo) + '</div>' +
          '<button class="btn sec chico" onclick="App.agregarSubSAFI(' + j + ')">＋ Agregar como subcuenta</button></div>';
      }).join('') : '') +
      (e.montos.length ? '<details class="pleg" style="margin-top:10px"><summary><span class="pl-t">Montos que aparecen en el PDF</span><span class="flecha">›</span></summary><div class="pl-c"><div class="chips" style="padding:8px 12px;flex-wrap:wrap">' +
      e.montos.map(function (n) { return '<span class="chip" style="cursor:default">' + txt(n, 'CRC') + '</span>'; }).join('') + '</div></div></details>' : '') +
      '<details class="pleg" style="margin-top:8px"><summary><span class="pl-t">Texto del PDF</span><span class="flecha">›</span></summary><div class="pl-c"><pre class="texto-leido">' + esc(e.lineas.join('\n')) + '</pre></div></details>' +
      '<div class="acciones"><button class="btn" id="ef-ok" onclick="App.guardarEstadoFondos()">Guardar saldos</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function agregarSubSAFI(j) {
    var x = estadoLeido.sobran[j]; if (!x) return;
    var nombre = prompt('Nombre para esta subcuenta en la app:', x.nombre.charAt(0) + x.nombre.slice(1).toLowerCase());
    if (!nombre) return;
    srv('guardarFondo', [{ fila: null, nombre: nombre.trim(), fondo: x.fondo, moneda: /d[oó]lar/i.test(x.fondo) ? 'USD' : 'CRC', saldo: x.saldo, meta: '' }], function () {
      estadoLeido.sobran.splice(j, 1); toast('✅ Subcuenta agregada'); cargar(); formEstadoFondos();
    });
  }
  function difTexto(n, f) {
    if (n === null || n === undefined || isNaN(n)) return '';
    var d = n - f.saldo;
    return Math.abs(d) < 0.005 ? 'sin cambios' : (d > 0 ? '+' : '−') + txt(Math.abs(d), f.moneda) + ' respecto a la app' + (d > 0 ? ' (se anota como intereses)' : '');
  }
  function difFondo(i) { var s = estadoLeido.subcuentas[i], e = $('ef-d-' + i); if (e) e.textContent = difTexto(C.leerNumero(val('ef-' + i)), s.fondo); }
  function guardarEstadoFondos() {
    var cambios = [];
    estadoLeido.subcuentas.forEach(function (s, i) {
      var n = C.leerNumero(val('ef-' + i));
      if (n !== null && Math.abs(n - s.fondo.saldo) >= 0.005) cambios.push({ f: s.fondo, n: n });
    });
    if (!cambios.length) { cerrar(); return toast('No hubo cambios de saldo.'); }
    var b = $('ef-ok'), k = 0;
    var sig = function () {
      if (k >= cambios.length) { estadoLeido = null; return listo('✅ ' + cambios.length + ' subcuenta' + (cambios.length === 1 ? '' : 's') + ' actualizada' + (cambios.length === 1 ? '' : 's')); }
      var c = cambios[k++];
      srv('actualizarSaldoFondo', [c.f.fila, c.n, c.n - c.f.saldo], sig, b);
    };
    sig();
  }

  function formAcciones() {
    var v = D.viajes ? viajeActual() : null;
    var acc = [
      ['📝', 'Gasto con detalles', 'App.formMovimiento()'],
      ['↓', 'Ingreso', "App.formMovimiento(0,{tipo:'Ingreso'})"],
      ['⇄', 'SINPE o transferencia', "App.formMovimiento(0,{tipo:'Transferencia'})"],
      ['💳', 'Pago de tarjeta', "App.formMovimiento(0,{tipo:'Pago de tarjeta'})"]
    ];
    if (!sinServidorSobres()) acc.push(['✉', 'Mover entre sobres', 'App.formMover()']);
    if (D.tasaCero.length) acc.push(['◷', 'Abono tasa cero', "App.cerrar();App.ir('tasacero')"]);
    if (D.prestamo && D.prestamo.estimado) acc.push(['🏠', 'Cuota de la casa', 'App.formPago()']);
    if (v) acc.push(['✈', 'Ver el viaje', 'App.cerrar();App.verViaje(' + v.fila + ')']);
    acc.push(['📷', 'Leer comprobante (foto)', "App.cerrar();App.elegirArchivo('foto')"]);
    if (D.fondos && D.fondos.length) acc.push(['📄', 'Estado de cuenta de fondos (PDF)', "App.cerrar();App.elegirArchivo('pdf')"]);
    acc.push(['↻', 'Revisar correos', 'App.cerrar();App.revisarCorreos()']);
    acc.push(['⌨', 'Volver al teclado', 'App.formRapido()']);
    abrir('<h2>¿Qué querés registrar?</h2><div class="acciones-grid">' + acc.map(function (x) {
      return '<button onclick="' + x[2] + '"><span class="ac-ic">' + x[0] + '</span><span>' + x[1] + '</span></button>';
    }).join('') + '</div><div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }

  // ------------------------------------------------------------ CONFIGURACIÓN
  function interruptor(id, on, accion, etiqueta) {
    return '<span class="interruptor"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + ' aria-label="' + esc(etiqueta) + '" onchange="' + accion + '"><i></i></span>';
  }
  function opcion(icono, nombre, det, derecha, accion) {
    var tag = accion ? 'button' : 'div';
    return '<' + tag + ' class="opcion"' + (accion ? ' onclick="' + accion + '"' : '') + '><span class="ico" style="width:36px;height:36px;border-radius:10px;background:var(--verde-claro);color:var(--verde);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
      ico(icono, ' style="width:18px;height:18px"') + '</span><span class="cuerpo"><span class="nombre" style="display:block">' + nombre + '</span>' +
      (det ? '<span class="det" style="display:block">' + det + '</span>' : '') + '</span>' + (derecha || '') + '</' + tag + '>';
  }
  var grupoAj = {};
  // v2.5: cada ícono de Ajustes se anima a su manera al tocarlo
  var ANIM_GRUPO = { ap: 'menear', se: 'saltar', so: 'brincar', co: 'brincar', re: 'sonar', av: 'sonar', go: 'girar', ca: 'crecer', ac: 'subir', cu: 'voltear', in: 'crecer' };
  function animarAjuste(el) { if (!el) return; el.classList.remove('anim'); void el.offsetWidth; el.classList.add('anim'); setTimeout(function () { el.classList.remove('anim'); }, 900); }
  document.addEventListener('click', function (e) {
    var s = e.target.closest && e.target.closest('#p-ajustes summary, #p-ajustes .opcion, #p-ajustes .rapido');
    if (s) animarAjuste(s.tagName === 'SUMMARY' ? s.parentNode : s);
  }, true);
  function grupo(id, icono, color, nombre, resumen, cuerpo) {
    return '<details class="grupo-aj" data-g="' + id + '" data-anim="' + (ANIM_GRUPO[id] || 'crecer') + '"' + (grupoAj[id] ? ' open' : '') + ' ontoggle="App.grupoAj(\'' + id + '\',this.open)"><summary><span class="ico-cat" style="width:36px;height:36px;font-size:16px;background:color-mix(in srgb, ' + color + ' 18%, transparent)">' + icono + '</span>' +
      '<span class="cuerpo"><span class="nombre">' + nombre + '</span><span class="det">' + resumen + '</span></span><span class="flecha">›</span></summary><div class="grupo-c">' + cuerpo + '</div></details>';
  }
  function estadoApp() {
    var ult = AJ.ultimaRevision ? new Date(Number(AJ.ultimaRevision) + 10 * 60000) : null;
    var horas = ult ? (Date.now() - ult.getTime()) / 3600000 : null;
    var problemas = [];
    if (cola.length && ultimoErrorCola) problemas.push(['amarillo', cola.length + ' cambio' + (cola.length === 1 ? '' : 's') + ' sin enviar: ' + ultimoErrorCola]);
    if (horas === null || horas > 48) problemas.push(['amarillo', 'Los correos no se revisan solos hace rato. Revisá que el servidor tenga el activador cada 10 minutos.']);
    if (cmpVer(AJ.version || '0', '2.2') < 0) problemas.push(['amarillo', 'El servidor tiene una versión vieja (' + esc(AJ.version) + '). Pegá el Codigo.gs nuevo.']);
    var pill = problemas.length ? '<span class="pill alerta">● Revisar</span>' : '<span class="pill ok">● Todo bien</span>';
    var fila = function (a, b, accion) { return '<' + (accion ? 'button onclick="' + accion + '"' : 'div') + ' class="est-fila"><span class="suave">' + a + '</span><b>' + b + '</b></' + (accion ? 'button' : 'div') + '>'; };
    return '<div class="caja estado"><div class="fila"><h3>Estado de la app</h3>' + pill + '</div>' +
      fila('Cambios por enviar', cola.length ? cola.length + ' ›' : '0 ✓', 'App.formCola()') +
      fila('Correos revisados', (ult ? (horas < 1 ? 'hace ' + Math.max(1, Math.round(horas * 60)) + ' min' : horas < 48 ? 'hace ' + Math.round(horas) + ' h' : fechaCorta(ult.toISOString())) : 'todavía no') + ' ↻', 'App.revisarCorreos()') +
      fila('Servidor', esc(AJ.version) + (cmpVer(AJ.version || '0', '2.2') < 0 ? ' ⚠' : ' ✓')) +
      fila('Tipo de cambio', txt(D.tipoCambio, 'CRC', true)) +
      problemas.map(function (p) { return '<div class="est-aviso">⚠️ ' + p[1] + '</div>'; }).join('') + '</div>';
  }
  function pAjustes() {
    var cab = '<div class="cab"><div><div class="sobretitulo">Finanzas ' + VERSION_WEB.replace(/\.0$/, '') + '</div><h1 class="titulo">Ajustes</h1></div></div>';
    if (!AJ && D.ajustes) AJ = D.ajustes;
    if (!AJ) AJ = leerJSONSeguro('mf-aj');
    if (!AJ) {
      $('p-ajustes').innerHTML = cab + '<div class="caja vacio"><div class="spinner" style="margin:0 auto 10px"></div>Cargando…</div>';
      srv('obtenerAjustes', [], function (x) { AJ = x; pinActivo = x.pinActivo; if (pantalla === 'ajustes') pintar(); });
      return;
    }
    var tema = guardado('mf-tema', 'dorado'), resuelto = temaResuelto(), letra = guardado('mf-letra', 'normal');
    var privado = oculto(), huella = !!huellaLocal();
    var nomTema = function (t) { return (TEMAS.filter(function (x) { return x[0] === t; })[0] || [0, t])[1]; };
    var h = cab + estadoApp();

    var rap = function (icono, nombre, on, accion) { return '<button class="rapido' + (on ? ' on' : '') + '" onclick="' + accion + '"><span>' + icono + '</span>' + nombre + '</button>'; };
    h += '<div class="rapidos-aj">' + rap(privado ? '🙈' : '👁', privado ? 'Oculto' : 'Ocultar', privado, 'App.privado(' + !privado + ')') +
      (AJ.pinActivo ? rap('☝', 'Huella', huella, 'App.alternarHuella({checked:' + !huella + '})') : rap('🔒', 'PIN', false, "App.formPIN('activar')")) +
      rap('🔔', 'Avisos', AJ.recordatorios, 'App.recordatorios(' + !AJ.recordatorios + ')') +
      rap((TEMAS.filter(function (x) { return x[0] === resuelto; })[0] || [0, 0, 'o'])[2] === 'o' ? '🌙' : '☀️', 'Tema', false, 'App.alternarTema()') + '</div>';
    h += '<label class="buscador">' + ico('buscar', ' style="width:18px;height:18px;color:var(--suave)"') + '<input type="search" id="aj-q" placeholder="Buscar ajuste… (ej. huella)" oninput="App.buscarAjuste(this.value)"></label>';

    var temasHtml = '<div class="temas">' + TEMAS.concat([['auto', 'Automático', '']]).map(function (t) {
      var mu = MUESTRA[t[0]] || ['linear-gradient(135deg,#F6F1E9 50%,#121417 50%)', '#F5B82E'];
      return '<button class="tema-op' + (tema === t[0] ? ' on' : '') + '" onclick="App.tema(\'' + t[0] + '\')"><span class="sw" style="background:' + mu[0] + '"><i style="background:' + mu[1] + '"></i></span>' + t[1] + '</button>';
    }).join('') + '</div>';
    if (tema === 'auto') {
      var sel = function (cual, tipo, actual) {
        return '<select onchange="App.temaAuto(\'' + cual + '\',this.value)">' + TEMAS.filter(function (t) { return t[2] === tipo; }).map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === actual ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>';
      };
      temasHtml += '<div class="dos" style="padding:0 16px 12px"><label class="campo"><span>De día</span>' + sel('claro', 'c', guardado('mf-tema-claro', 'crema')) + '</label><label class="campo"><span>De noche</span>' + sel('oscuro', 'o', guardado('mf-tema-oscuro', 'dorado')) + '</label></div>';
    }
    h += grupo('ap', '🎨', '#F5B82E', 'Apariencia', esc(tema === 'auto' ? 'Automático (' + nomTema(resuelto) + ')' : nomTema(tema)) + ' · letra ' + { peq: 'pequeña', normal: 'normal', grande: 'grande', xg: 'más grande' }[letra],
      opcion('luna', 'Tema', 'Cambia los colores de toda la app', '') + temasHtml +
      opcion('lapiz', 'Tamaño de letra', 'Para leer sin forzar la vista', '') +
      '<div class="chips" style="padding:0 16px 14px">' + [['peq', 'Pequeña'], ['normal', 'Normal'], ['grande', 'Grande'], ['xg', 'Más grande']].map(function (l) {
        return '<button class="chip' + (letra === l[0] ? ' on' : '') + '" onclick="App.letra(\'' + l[0] + '\')">' + l[1] + '</button>';
      }).join('') + '</div>' +
      opcion('inicio', 'Editar Inicio', 'También manteniendo presionado cualquier widget en Inicio', '<span class="flecha">›</span>', 'App.editarInicio()') +
      opcion('ojo', 'Ocultar montos', 'Muestra ****** en vez de las cantidades', interruptor('aj-priv', privado, 'App.privado(this.checked)', 'Ocultar montos')) +
      opcion('calculadora', 'Calculadora rápida 🧮', 'Botón flotante para sumar y restar sin salir de la app', interruptor('aj-calc', calcVisible(), 'App.calcMostrar(this.checked)', 'Calculadora rápida')));

    h += grupo('se', '🔒', '#E5484D', 'Seguridad', AJ.pinActivo ? 'PIN activo' + (huella ? ' · huella activa' : '') : 'Sin PIN',
      opcion('candado', 'PIN de acceso', AJ.pinActivo ? 'Activado · se pide al abrir y tras ' + MINUTOS_BLOQUEO + ' min fuera de la app' : 'Desactivado',
        '<span class="pill' + (AJ.pinActivo ? ' ok' : '') + '">' + (AJ.pinActivo ? 'Activo' : 'Activar') + '</span>', 'App.formPIN(\'' + (AJ.pinActivo ? 'menu' : 'activar') + '\')') +
      (AJ.pinActivo ? opcion('huella', 'Entrar con huella', huella ? 'Activada en este teléfono' : (huellaSoportada === false ? 'Este teléfono o navegador no lo permite' : 'Usá el lector de huellas en vez del PIN'),
        interruptor('aj-huella', huella, 'App.alternarHuella(this)', 'Entrar con huella')) : '') +
      '<div class="suave chico" style="padding:0 16px 14px">La app solo abre con tu cuenta de Google (' + esc(AJ.correo) + '). El PIN agrega una segunda capa por si alguien toma tu teléfono desbloqueado.</div>');

    if (D.sobresDesde) {
      var esp = D.sobreEspecial || {}, nom = function (x) { return x ? esc(x) : 'ninguno'; };
      h += grupo('so', '✉', '#3DD68C', 'Sobres', 'Desde ' + fechaCorta(D.sobresDesde) + ' · especiales',
        opcion('sobre', 'Saldos de los sobres desde', fechaCorta(D.sobresDesde) + ' · los saldos iniciales se ponen en la pestaña Sobres', '', 'App.formSobresDesde()') +
        opcion('ajustes', 'Sobres especiales', 'Préstamo: ' + nom(esp.prestamo) + ' · Fondos: ' + nom(esp.fondos) + ' · Pago de tarjetas: ' + nom(esp.tarjetas), '', 'App.formSobresEspeciales()'));
    }
    if (cuentasAhorro().length) {
      var og = ORIG();
      h += grupo('cu', '🏦', '#5B8DEF', 'Cuentas', 'Principal: ' + esc(og.principal),
        opcion('tarjeta', 'Cuentas de dónde salen los pagos', 'Tarjetas: ' + esc(og.tarjetas) + ' · Préstamo: ' + esc(og.prestamo) + ' · Fondos: ' + esc(og.fondos), '<span class="flecha">›</span>', 'App.formOrigenes()') +
        opcion('hoja', 'Cobros con IVA aparte', Object.keys(ivaPrefs()).filter(function (k) { return ivaPrefs()[k]; }).join(', ') || 'Ninguno todavía', '<span class="flecha">›</span>', 'App.formIVA()') +
        opcion('tarjeta', 'Tarjetas de la familia', Object.keys(familia()).length ? personasFamilia().map(function (p) { return p + ' (' + Object.keys(familia()).filter(function (k) { return (familia()[k].persona || 'Familia') === p; }).length + ')'; }).join(', ') + ' · solo cuentan en viajes' : 'Ninguna · esposa, hijos… (solo para viajes)', '<span class="flecha">›</span>', 'App.formFamilia()') +
        opcion('tarjeta', 'Tarjetas que no son mías', Object.keys(ajenas()).map(function (k) { return (ajenas()[k].nombre ? ajenas()[k].nombre + ' ' : '') + '••' + k; }).join(', ') || 'Ninguna · la app no anota sus correos', '<span class="flecha">›</span>', 'App.formAjenas()'));
    }
    var ult = AJ.ultimaRevision ? new Date(Number(AJ.ultimaRevision) + 10 * 60000) : null;
    h += grupo('co', '📧', '#5B8DEF', 'Correos de los bancos', esc(AJ.bancos.join(', ') || 'Ninguno') + ' + SINPE',
      opcion('recargar', 'Revisar correos ahora', ult ? 'Última revisión: ' + fechaCorta(ult.toISOString()) + ' ' + hora(ult.toISOString()) : 'Todavía no se ha revisado', '', 'App.revisarCorreos(this)') +
      opcion('sobre', 'Bancos que se leen', esc(AJ.bancos.join(', ') || 'Ninguno') + ' + SINPE Móvil BCR + recibos del préstamo', '') +
      opcion('correo', 'Sacar de la bandeja lo que la app ya leyó', 'Quedan leídos en Gmail → Finanzas › Procesado. Los que no entiende siguen en la bandeja.', interruptor('aj-bandeja', PREFS().bandejaLimpia !== false, 'App.bandejaLimpia(this.checked)', 'Sacar de la bandeja lo leído')) +
      '<div class="suave chico" style="padding:0 16px 14px">Para agregar un banco, escribí su correo en la pestaña <b>Config</b> de la hoja.</div>');
    h += grupo('sa', '💰', '#3DD68C', 'Salario', resumenSalario(), opcion('sobre', 'Tu salario', 'Monto, cuenta y fechas de pago (bisemanal, quincenal…)', '<span class="flecha">›</span>', 'App.formSalario()'));
    h += grupoAvisos();
    var cx = conexion();
    h += grupo('go', '☁', '#B794F6', 'Google y datos', 'Servidor ' + esc(AJ.version) + ' · ' + (cola.length ? cola.length + ' por enviar' : 'todo enviado'),
      opcion('recargar', cola.length ? cola.length + ' cambio' + (cola.length === 1 ? '' : 's') + ' por enviar a Google' : 'Todo está en Google ✓',
        cola.length ? 'Ya se ven en el teléfono; se envían solos' + (ultimoErrorCola ? ' · último intento: ' + esc(ultimoErrorCola) : '') : 'Lo que guardás se ve al instante y se envía por detrás', '', 'App.formCola()') +
      '<a class="opcion" style="text-decoration:none;color:inherit" href="' + esc(AJ.urlHoja) + '" target="_blank" rel="noopener">' +
      '<span class="ico" style="width:36px;height:36px;border-radius:10px;background:var(--verde-claro);color:var(--verde);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + ico('hoja', ' style="width:18px;height:18px"') + '</span>' +
      '<span class="cuerpo"><span class="nombre" style="display:block">Abrir mi hoja de Google</span><span class="det" style="display:block">' + esc(AJ.nombreHoja) + '</span></span>' + ico('adelante', ' style="width:18px;height:18px"') + '</a>' +
      opcion('flechas', 'Tipo de cambio de referencia', txt(D.tipoCambio, 'CRC', true) + ' por $1 · se cambia en Config', '') +
      opcion('recargar', 'Recargar datos', 'Trae los cambios que hiciste directo en la hoja', '', 'App.recargar()') +
      opcion('flechas', 'Servidor (Apps Script)', esc(cx.url.replace(/^https:\/\/script\.google\.com\/macros\/s\/(.{6}).*(.{6})\/exec$/, '…$1…$2/exec')), '', '') +
      opcion('candado', 'Cambiar URL o clave', 'Si publicaste el servidor de nuevo o cambiaste la clave', '', 'App.cambiarConexion()'));
    h += grupoActualizaciones();
    var prep = guardado('mf-preparado', '');
    h += grupo('ca', '🧮', '#F5B82E', 'Calculadora', prep ? 'Preparado por ' + esc(prep) : 'Nombre en los PDF',
      opcion('hoja', 'Preparado por (en los PDF)', prep ? esc(prep) : 'Sin nombre · tocá para escribirlo', '', 'App.formPreparado()'));
    h += '<div class="suave chico" style="text-align:center;margin-top:6px">Finanzas · app ' + VERSION_WEB + ' · servidor ' + esc(AJ.version) + '</div>';
    $('p-ajustes').innerHTML = h;
  }
  function buscarAjuste(q) {
    q = String(q || '').trim().toLowerCase();
    document.querySelectorAll('#p-ajustes details.grupo-aj').forEach(function (g) {
      var hay = false;
      g.querySelectorAll('.grupo-c > .opcion, .grupo-c > a.opcion').forEach(function (o) {
        var si = !q || o.textContent.toLowerCase().indexOf(q) >= 0 || g.querySelector('summary').textContent.toLowerCase().indexOf(q) >= 0;
        o.style.display = si ? '' : 'none'; if (si && q) hay = true;
      });
      if (!q) { g.style.display = ''; g.open = !!grupoAj[g.dataset.g]; }
      else { g.style.display = hay ? '' : 'none'; g.open = hay; }
    });
  }

  // ---- v2.0: temas, letra y automático día/noche
  var TEMAS = [['dorado', 'Negro y amarillo', 'o'], ['azul', 'Azul noche', 'o'], ['oscuro', 'Verde bosque', 'o'], ['morado', 'Morado suave', 'o'],
    ['crema', 'Claro crema', 'c'], ['celeste', 'Claro azul', 'c'], ['claro', 'Claro verde', 'c']];
  var MUESTRA = { dorado: ['#121417', '#F5B82E'], azul: ['#0F1626', '#5B8DEF'], oscuro: ['#0E1512', '#3DD68C'], morado: ['#15121F', '#B794F6'], crema: ['#F6F1E9', '#C8862B'], celeste: ['#EEF3FA', '#2F6FEB'], claro: ['#F3F5F4', '#0F6B54'] };
  function temaResuelto() {
    var t = guardado('mf-tema', 'dorado');
    if (t !== 'auto') return t;
    var noche = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return noche ? guardado('mf-tema-oscuro', 'dorado') : guardado('mf-tema-claro', 'crema');
  }
  function aplicarTema() {
    var t = temaResuelto();
    document.documentElement.setAttribute('data-tema', t);
    document.documentElement.setAttribute('data-letra', guardado('mf-letra', 'normal'));
    var m = document.querySelector('meta[name="theme-color"]'); if (m && MUESTRA[t]) m.setAttribute('content', MUESTRA[t][0]);
  }
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (guardado('mf-tema', '') === 'auto') { aplicarTema(); if (D) pintar(); } }); } catch (e) { /* navegador viejo */ }
  function setTema(t) { guardar('mf-tema', t); aplicarTema(); pintar(); }
  function setTemaAuto(cual, t) { guardar(cual === 'claro' ? 'mf-tema-claro' : 'mf-tema-oscuro', t); aplicarTema(); pintar(); }
  function setLetra(l) { guardar('mf-letra', l); aplicarTema(); pintar(); }
  /** Botón rápido "Tema": cambia entre el tema oscuro y el claro que elegiste */
  function alternarTema() {
    var t = temaResuelto(), esOsc = (TEMAS.filter(function (x) { return x[0] === t; })[0] || [0, 0, 'o'])[2] === 'o';
    if (esOsc) guardar('mf-tema-oscuro', t); else guardar('mf-tema-claro', t);
    setTema(esOsc ? guardado('mf-tema-claro', 'crema') : guardado('mf-tema-oscuro', 'dorado'));
  }
  function setPrivado(on) { guardar('mf-privado', on ? 'si' : 'no'); pintar(); }
  function setRecordatorios(on) {
    var c = $('aj-rec'); if (c) c.disabled = true;
    srv('guardarRecordatorios', [on], function () { if (c) c.disabled = false; AJ.recordatorios = on; guardar('mf-aj', JSON.stringify(AJ)); toast(on ? '✅ Recordatorios activados' : 'Recordatorios desactivados'); if (pantalla === 'ajustes') pintar(); },
      null, function () { if (c) { c.disabled = false; c.checked = !on; } });
  }
  function pruebaRecordatorio(b) { srv('probarRecordatorio', [], function (m) { toast(m); }, b); }

  function campoPIN(id, etiqueta) {
    return '<label class="campo"><span>' + etiqueta + '</span><input id="' + id + '" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"></label>';
  }
  function formPIN(modo) {
    if (modo === 'menu') {
      return abrir('<h2>PIN de acceso</h2><div class="acciones"><button class="btn" onclick="App.formPIN(\'cambiar\')">Cambiar PIN</button><button class="btn peligro" onclick="App.formPIN(\'quitar\')">Quitar PIN</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>' +
        '<div class="suave chico" style="margin-top:12px">¿Lo olvidaste? En Apps Script ejecutá la función <b>borrarPINOlvidado</b>.</div>');
    }
    var h = '<h2>' + { activar: 'Crear PIN', cambiar: 'Cambiar PIN', quitar: 'Quitar PIN' }[modo] + '</h2>';
    if (modo !== 'activar') h += campoPIN('pin-actual', 'PIN actual');
    if (modo !== 'quitar') h += campoPIN('pin-nuevo', 'PIN nuevo (4 a 6 números)') + campoPIN('pin-conf', 'Repetí el PIN nuevo');
    h += '<div class="acciones"><button class="btn" id="pin-ok" onclick="App.guardarPIN(\'' + modo + '\')">' + (modo === 'quitar' ? 'Quitar PIN' : 'Guardar') + '</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    abrir(h);
  }
  function guardarPIN(modo) {
    var actual = val('pin-actual'), nuevo = val('pin-nuevo'), conf = val('pin-conf');
    if (modo === 'quitar') {
      return srv('quitarPIN', [actual], function () { pinActivo = false; AJ.pinActivo = false; olvidarHuella(); cerrar(); toast('PIN quitado'); pintar(); }, $('pin-ok'));
    }
    if (!/^\d{4,6}$/.test(nuevo)) return toast('El PIN debe tener de 4 a 6 números.');
    if (nuevo !== conf) return toast('Los dos PIN no coinciden.');
    srv('guardarPIN', [nuevo, actual], function (tok) {
      token = tok; guardar('mf-ses', tok, sessionStorage);
      pinActivo = true; AJ.pinActivo = true; recordarLargo(nuevo.length);
      var habiaHuella = !!huellaLocal(); olvidarHuella();
      cerrar(); toast(habiaHuella ? '✅ PIN guardado. Activá la huella de nuevo en Seguridad.' : '✅ PIN guardado', 5000); pintar();
    }, $('pin-ok'));
  }

  // ------------------------------------------------------------ BLOQUEO CON PIN Y HUELLA
  var pinEscrito = '';
  function recordarLargo(n) { pinLargo = Number(n) || null; guardar('mf-pinlen', pinLargo ? String(pinLargo) : null); }
  function bloquear() {
    pinEscrito = '';
    cerrar();
    $('cargando').style.display = 'none';
    $('bloqueo').classList.add('ver');
    $('logoPin').innerHTML = LOGO;
    $('pinMsg').textContent = '';
    var hay = !!huellaLocal();
    $('pinTitulo').textContent = hay ? 'Usá tu huella o escribí tu PIN' : 'Escribí tu PIN';
    var teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'izq', '0', 'borrar'];
    $('teclado').innerHTML = teclas.map(function (t) {
      if (t === 'borrar') return '<button class="sin" onclick="App.tecla(\'b\')" aria-label="Borrar">Borrar</button>';
      if (t === 'izq') {
        if (hay) return '<button class="huella" onclick="App.usarHuella()" aria-label="Entrar con huella">' + ico('huella') + '</button>';
        if (!pinLargo) return '<button class="sin" style="color:var(--acento);font-weight:700" onclick="App.tecla(\'e\')">Entrar</button>';
        return '<span></span>';
      }
      return '<button onclick="App.tecla(\'' + t + '\')">' + t + '</button>';
    }).join('');
    $('pinExtra').innerHTML = hay && !pinLargo ? '<button class="btn sec chico" onclick="App.tecla(\'e\')">Entrar con PIN</button>' : '';
    pintarPuntos();
    if (hay) setTimeout(usarHuella, 350);   // la ventanita de la huella sale sola
  }
  function pintarPuntos() {
    var n = pinLargo || Math.max(4, pinEscrito.length);
    var h = '';
    for (var i = 0; i < n; i++) h += '<i class="' + (i < pinEscrito.length ? 'lleno' : '') + '"></i>';
    $('puntos').innerHTML = h;
  }
  var verificando = false;
  function tecla(t) {
    if (verificando) return;
    $('pinMsg').textContent = '';
    if (t === 'b') pinEscrito = pinEscrito.slice(0, -1);
    else if (t === 'e') return entrarPIN();
    else if (pinEscrito.length < (pinLargo || 6)) pinEscrito += t;
    pintarPuntos();
    if (pinLargo && pinEscrito.length === pinLargo) setTimeout(entrarPIN, 120);   // entra sola al completar
  }
  function desbloqueado(tok) {
    token = tok; guardar('mf-ses', tok, sessionStorage);
    $('bloqueo').classList.remove('ver');
    if (!D) D = leerCache();
    if (D) { $('cargando').style.display = 'none'; pintar(); cargar(); } else { $('cargando').style.display = 'flex'; cargar(); }
  }
  function entrarPIN() {
    if (pinEscrito.length < 4) { $('pinMsg').textContent = 'El PIN tiene al menos 4 números'; return; }
    $('pinMsg').textContent = 'Verificando…';
    verificando = true;
    var largo = pinEscrito.length;
    var pinPrueba = pinEscrito;
    llamar('verificarPIN', [pinEscrito]).then(function (tok) {
      verificando = false;
      recordarPinLocal(pinPrueba);
      recordarLargo(largo);
      desbloqueado(tok);
    }, function (e) {
      verificando = false;
      pinEscrito = ''; pintarPuntos();
      $('pinMsg').textContent = e && e.message ? e.message : 'PIN incorrecto';
      if (navigator.vibrate) { try { navigator.vibrate([60, 40, 60]); } catch (x) { /* nada */ } }
    });
  }

  // Huella: la verifica el teléfono (WebAuthn). El servidor solo recibe la llave de este teléfono.
  var huellaSoportada = null;
  function revisarSoporteHuella() {
    if (!window.PublicKeyCredential || !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) { huellaSoportada = false; return; }
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function (s) { huellaSoportada = !!s; }, function () { huellaSoportada = false; });
  }
  function huellaLocal() { try { var h = JSON.parse(guardado('mf-huella', 'null')); return h && h.id && h.llave && h.cred ? h : null; } catch (e) { return null; } }
  function olvidarHuella() { guardar('mf-huella', null); }
  function aleatorio(n) { var b = new Uint8Array(n); crypto.getRandomValues(b); return b; }
  function aB64(buf) { var s = ''; new Uint8Array(buf).forEach(function (x) { s += String.fromCharCode(x); }); return btoa(s); }
  function deB64(t) { var s = atob(t), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }

  function alternarHuella(caja) {
    if (!caja.checked) {
      var h = huellaLocal();
      olvidarHuella(); pintar(); toast('Huella desactivada en este teléfono');
      if (h) srv('quitarHuella', [h.id], function () {});
      return;
    }
    caja.checked = false;
    if (huellaSoportada === false) return toast('Este teléfono o navegador no permite usar la huella aquí.', 5000);
    abrir('<h2>Entrar con huella</h2><div class="suave">Escribí tu PIN una vez. Después el teléfono te pedirá la huella para confirmarla.</div>' +
      campoPIN('hu-pin', 'Tu PIN') +
      '<div class="acciones"><button class="btn" id="hu-ok" onclick="App.activarHuella()">Activar huella</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>' +
      '<div class="suave chico" style="margin-top:12px">Tu huella nunca sale del teléfono. Si cambiás el PIN, hay que activarla otra vez.</div>');
    setTimeout(function () { var e = $('hu-pin'); if (e) e.focus(); }, 200);
  }
  function activarHuella() {
    var pin = val('hu-pin');
    if (!/^\d{4,6}$/.test(pin)) return toast('Escribí tu PIN (4 a 6 números).');
    var b = $('hu-ok'); b.disabled = true;
    navigator.credentials.create({ publicKey: {
      challenge: aleatorio(32),
      rp: { name: 'Finanzas', id: location.hostname },
      user: { id: aleatorio(16), name: 'Finanzas', displayName: 'Finanzas' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      timeout: 60000, attestation: 'none'
    } }).then(function (cred) {
      return llamar('activarHuella', [pin, 'Teléfono ' + new Date().toLocaleDateString('es-CR')]).then(function (r) {
        guardar('mf-huella', JSON.stringify({ id: r.id, llave: r.llave, cred: aB64(cred.rawId) }));
        token = r.sesion; guardar('mf-ses', r.sesion, sessionStorage);
        recordarLargo(pin.length);
        cerrar(); toast('✅ Huella activada. La próxima vez entrás con el dedo.', 5000); pintar();
      });
    }).catch(function (e) {
      b.disabled = false;
      var m = e && e.message ? e.message : String(e);
      if (e && e.name === 'NotAllowedError') m = 'Se canceló o no se confirmó la huella.';
      if (m.indexOf('desconocida') >= 0) m = 'Falta actualizar el código del servidor (Apps Script) a la versión 1.3.';
      toast('⚠️ ' + m, 6000);
    });
  }
  var pidiendoHuella = false;
  function usarHuella() {
    var h = huellaLocal();
    if (!h || pidiendoHuella || !$('bloqueo').classList.contains('ver')) return;
    pidiendoHuella = true;
    navigator.credentials.get({ publicKey: {
      challenge: aleatorio(32), rpId: location.hostname, timeout: 60000, userVerification: 'required',
      allowCredentials: [{ type: 'public-key', id: deB64(h.cred), transports: ['internal', 'hybrid'] }]
    } }).then(function () {
      $('pinMsg').textContent = 'Entrando…';
      return llamar('entrarConHuella', [h.id, h.llave]).then(function (tok) { pidiendoHuella = false; desbloqueado(tok); });
    }).catch(function (e) {
      pidiendoHuella = false;
      var m = e && e.message ? e.message : String(e);
      if (m.indexOf('HUELLA_INVALIDA') >= 0) {
        olvidarHuella(); bloquear();
        $('pinMsg').textContent = 'La huella se desactivó (¿cambiaste el PIN?). Entrá con el PIN y activala de nuevo.';
      } else if (e && e.name === 'NotAllowedError') {
        $('pinMsg').textContent = '';
      } else $('pinMsg').textContent = m;
    });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { ocultoDesde = Date.now(); return; }
    if (pinActivo && ocultoDesde && Date.now() - ocultoDesde > MINUTOS_BLOQUEO * 60000) {
      token = null; guardar('mf-ses', null, sessionStorage); bloquear();
    }
    ocultoDesde = null;
  });

  // ------------------------------------------------------------ arranque

  // ------------------------------------------------------------ MONTOS CON SEPARADOR DE MILES (mientras se escribe)
  /** "1250000,5" → "1.250.000,5". La coma es el decimal (máximo 2). */
  function formatoMonto(v) {
    v = String(v || '');
    var i = v.indexOf(',');
    var ent = (i < 0 ? v : v.slice(0, i)).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    var dec = i < 0 ? null : v.slice(i + 1).replace(/\D/g, '').slice(0, 2);
    if (!ent && dec !== null) ent = '0';
    return ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (dec !== null ? ',' + dec : '');
  }
  function alEscribirMonto(e) {
    var c = e.target;
    if (!c.hasAttribute || !c.hasAttribute('data-dinero')) return;
    if (esOperacion(c.value)) return pistaCalc(c);   // v2.10.0: "10.000+5.000-329" se calcula al salir del campo
    var v = c.value, pos = c.selectionStart === null ? v.length : c.selectionStart;
    // el punto del teclado se toma como coma decimal (si todavía no hay una)
    if (e.data === '.' && v.charAt(pos - 1) === '.') {
      var yaHayComa = v.indexOf(',') >= 0;
      v = v.slice(0, pos - 1) + (yaHayComa ? '' : ',') + v.slice(pos);
      if (yaHayComa) pos--;
    }
    var antes = v.slice(0, pos).replace(/[^\d,]/g, '').length;   // cifras antes del cursor
    var nuevo = formatoMonto(v);
    if (nuevo === c.value) return;
    c.value = nuevo;
    var k = 0, n = 0;
    while (k < nuevo.length && n < antes) { if (/[\d,]/.test(nuevo.charAt(k))) n++; k++; }
    try { c.setSelectionRange(k, k); } catch (x) { /* nada */ }
  }
  function formatearMontos() {
    document.querySelectorAll('input[data-dinero]').forEach(function (c) { if (c.value) c.value = formatoMonto(String(c.value).replace(/\.(?=\d{1,2}$)/, ',')); });
  }
  document.addEventListener('input', alEscribirMonto, true);

  // ------------------------------------------------------------ CONEXIÓN (URL /exec + clave)
  function mostrarConexion(msg) {
    var c = conexion();
    $('cargando').style.display = 'none';
    $('bloqueo').classList.remove('ver');
    $('conexion').innerHTML =
      '<div class="logo">' + LOGO + '</div>' +
      '<div style="text-align:center"><div style="font-size:22px;font-weight:800">Conectar con tu hoja</div>' +
      '<div class="suave" style="margin-top:6px">Se hace una sola vez en cada teléfono.</div></div>' +
      '<div style="width:100%;max-width:420px">' +
      '<label class="campo"><span>URL del servidor (termina en /exec)</span><input id="cx-url" type="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="' + (c.url ? esc(urlCorta(c.url)) + ' (guardada · dejala vacía para no cambiarla)' : 'https://script.google.com/macros/s/…/exec') + '" value=""></label>' +
      '<label class="campo"><span>Clave de la app</span><input id="cx-clave" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="' + (c.clave ? '•••••• (guardada · dejala vacía para no cambiarla)' : 'La que muestra verClaveApp') + '" value=""></label>' +
      (c.url ? '<button class="btn sec chico" style="margin-top:8px" onclick="App.mostrarDatosCx()">👁 Mostrar lo guardado (pide PIN)</button>' : '') +
      '<div class="suave chico" id="cx-msg" style="margin-top:10px;min-height:18px">' + esc(msg || '') + '</div>' +
      '<div class="acciones"><button class="btn" id="cx-ok" onclick="App.conectar()">Conectar</button></div></div>';
    $('conexion').classList.add('ver');
  }
  function conectar() {
    var g = conexion(), c = { url: val('cx-url').trim() || g.url, clave: val('cx-clave').trim() || g.clave };
    if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(c.url)) { $('cx-msg').textContent = 'La URL debe empezar con https://script.google.com/ y terminar en /exec.'; return; }
    if (!c.clave) { $('cx-msg').textContent = 'Falta la clave.'; return; }
    var b = $('cx-ok'); b.disabled = true; $('cx-msg').textContent = 'Probando la conexión…';
    llamar('ping', [], c).then(function (r) {
      guardar('mf-url', c.url); guardar('mf-clave', c.clave);
      $('conexion').classList.remove('ver');
      toast('✅ ' + r);
      $('cargando').style.display = 'flex';
      arrancar();
    }, function (e) {
      b.disabled = false;
      var m = e.message || String(e);
      $('cx-msg').textContent = m.indexOf('CLAVE_INVALIDA') >= 0 ? 'La clave no es correcta.' : m;
    });
  }
  function cambiarConexion() { protegerConexion(function () { mostrarConexion(''); }); }
  function urlCorta(u) { return String(u || '').replace(/^https:\/\/script\.google\.com\/macros\/s\/(.{6}).*(.{6})\/exec$/, '…$1…$2/exec'); }
  function mostrarDatosCx() {
    pedirPinSeguro('Mostrar la URL y la clave', function () {
      var c = conexion(); $('cx-url').value = c.url; $('cx-clave').value = c.clave; $('cx-clave').type = 'text';
    });
  }
  // ---- v2.5: la conexión (URL /exec y clave) solo se cambia con PIN o huella; funciona aunque el servidor no responda
  function protegerConexion(seguir) {
    var c = conexion();
    if (!c.url) return seguir();   // primera vez en este teléfono: no hay nada que proteger
    var hayPin = (AJ && AJ.pinActivo) || guardado('mf-pinactivo', 'no') === 'si';
    if (!hayPin) {
      return capaSegura('<h2>🔒 Protegé la conexión</h2><div class="suave">Para cambiar la URL o la clave hace falta un PIN. Creá uno primero y después volvé aquí.</div>' +
        '<div class="acciones"><button class="btn" onclick="App.cerrarCapaSegura();App.formPIN(\'activar\')">Crear PIN</button><button class="btn sec" onclick="App.cerrarCapaSegura()">Cancelar</button></div>');
    }
    pedirPinSeguro('Cambiar URL o clave', seguir);
  }
  function capaSegura(html) {
    var c = $('capa-segura');
    if (!c) { c = document.createElement('div'); c.id = 'capa-segura'; c.className = 'capa-segura'; document.body.appendChild(c); }
    c.innerHTML = '<div class="panel">' + html + '</div>'; c.classList.add('ver');
  }
  function cerrarCapaSegura() { var c = $('capa-segura'); if (c) { c.classList.remove('ver'); c.innerHTML = ''; } }
  var pinSeguroOk = null;
  function bloqueoPin() { var b = leerJSONSeguro('mf-pinint') || {}; return b.hasta && b.hasta > Date.now() ? b.hasta : 0; }
  function pedirPinSeguro(motivo, ok) {
    pinSeguroOk = ok;
    var hasta = bloqueoPin();
    capaSegura('<h2>🔒 ' + esc(motivo) + '</h2><div class="suave">Escribí tu PIN' + (huellaLocal() ? ' o usá tu huella' : '') + '.</div>' +
      '<label class="campo"><span>PIN</span><input id="ps-pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off"' + (hasta ? ' disabled' : '') + ' onkeydown="if(event.key===\'Enter\')App.verificarPinSeguro()"></label>' +
      '<div class="suave chico" id="ps-msg" style="min-height:18px;margin-top:8px">' + (hasta ? 'Demasiados intentos. Esperá hasta las ' + hora(new Date(hasta).toISOString()) + '.' : '') + '</div>' +
      '<div class="acciones"><button class="btn" id="ps-ok" onclick="App.verificarPinSeguro()"' + (hasta ? ' disabled' : '') + '>Continuar</button>' +
      (huellaLocal() ? '<button class="btn sec" onclick="App.huellaSegura()">☝ Usar huella</button>' : '') +
      '<button class="btn sec" onclick="App.cerrarCapaSegura()">Cancelar</button></div>');
    setTimeout(function () { var i = $('ps-pin'); if (i && !hasta) i.focus(); }, 80);
  }
  function pinSeguroBien() { guardar('mf-pinint', null); var f = pinSeguroOk; pinSeguroOk = null; cerrarCapaSegura(); if (f) f(); }
  function pinSeguroMal(msg) {
    var b = leerJSONSeguro('mf-pinint') || { n: 0 }; b.n = (b.n || 0) + 1;
    if (b.n >= 5) { b.hasta = Date.now() + 5 * 60000; b.n = 0; }
    guardar('mf-pinint', JSON.stringify(b));
    var hasta = bloqueoPin();
    $('ps-msg').textContent = hasta ? 'Demasiados intentos. Esperá 5 minutos.' : (msg || 'PIN incorrecto');
    if (hasta) { $('ps-pin').disabled = true; $('ps-ok').disabled = true; }
    $('ps-pin').value = '';
  }
  function verificarPinSeguro() {
    if (bloqueoPin()) return;
    var pin = val('ps-pin');
    if (!/^\d{4,6}$/.test(pin)) { $('ps-msg').textContent = 'El PIN tiene de 4 a 6 números.'; return; }
    var b = $('ps-ok'); b.disabled = true; $('ps-msg').textContent = 'Verificando…';
    llamar('verificarPIN', [pin]).then(function (tok) {
      token = tok; guardar('mf-ses', tok, sessionStorage); recordarPinLocal(pin); b.disabled = false; pinSeguroBien();
    }, function (e) {
      b.disabled = false;
      if (e && e.red || /conexi|Google tard|Respuesta inesperada|CLAVE_INVALIDA/.test(e && e.message || '')) {   // sin servidor: se revisa con la copia cifrada del teléfono
        return verificarPinLocal(pin).then(function (si) { if (si) pinSeguroBien(); else pinSeguroMal(guardado('mf-pinloc', '') ? 'PIN incorrecto' : 'Sin conexión y este teléfono todavía no tiene el PIN guardado. Usá la huella o probá con internet.'); });
      }
      pinSeguroMal(e && e.message);
    });
  }
  function huellaSegura() {
    var h = huellaLocal(); if (!h) return;
    navigator.credentials.get({ publicKey: {
      challenge: aleatorio(32), rpId: location.hostname, timeout: 60000, userVerification: 'required',
      allowCredentials: [{ type: 'public-key', id: deB64(h.cred), transports: ['internal', 'hybrid'] }]
    } }).then(function () { pinSeguroBien(); }, function (e) { if (e && e.name !== 'NotAllowedError') $('ps-msg').textContent = e.message || String(e); });
  }
  // El PIN nunca se guarda: solo una huella digital (PBKDF2 con sal) para poder revisarlo sin internet
  function derivarPin(pin, sal) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error('sin crypto'));
    return crypto.subtle.importKey('raw', new TextEncoder().encode(String(pin)), 'PBKDF2', false, ['deriveBits']).then(function (k) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: sal, iterations: 150000, hash: 'SHA-256' }, k, 256);
    }).then(function (bits) { return aB64(bits); });
  }
  function recordarPinLocal(pin) {
    var sal = aleatorio(16);
    derivarPin(pin, sal).then(function (h) { guardar('mf-pinloc', JSON.stringify({ s: aB64(sal), h: h })); }, function () { /* sin crypto: no se guarda */ });
  }
  function verificarPinLocal(pin) {
    var x = leerJSONSeguro('mf-pinloc');
    if (!x || !x.s || !x.h) return Promise.resolve(false);
    return derivarPin(pin, deB64(x.s)).then(function (h) { return h === x.h; }, function () { return false; });
  }

  // ------------------------------------------------------------ arranque
  function arrancar() {
    // 1) al instante: lo guardado en el teléfono (si hay PIN, primero se pide)
    var cache = leerCache(), pinCache = guardado('mf-pinactivo', 'no') === 'si';
    var mostrado = false;
    if (pinCache && !token) { pinActivo = true; bloquear(); }
    else if (cache) { D = cache; hoy = new Date(); $('cargando').style.display = 'none'; pintar(); mostrado = true; sincronizando(true); setTimeout(revisarCompartido, 300); }
    // 2) por detrás: confirmar acceso y traer los datos nuevos
    llamar('estadoAcceso').then(function (e) {
      pinActivo = e.pinActivo;
      guardar('mf-pinactivo', pinActivo ? 'si' : 'no');
      if (e.pinLargo) recordarLargo(e.pinLargo);
      if (pinActivo && !token) { sincronizando(false); if (!$('bloqueo').classList.contains('ver')) bloquear(); return; }
      cargar();
    }, function (e) {
      var m = e.message || String(e);
      sincronizando(false);
      if (m.indexOf('CLAVE_INVALIDA') >= 0) return mostrarConexion('La clave no es correcta.');
      if (mostrado) return toast('⚠️ Sin conexión: estás viendo los datos guardados en el teléfono.', 6000);
      $('cargando').style.display = 'none';
      $('conexion').innerHTML = '<div class="logo">' + LOGO + '</div><div style="text-align:center;max-width:360px"><b>No se pudo conectar</b><div class="suave" style="margin-top:8px">' + esc(m) + '</div></div>' +
        '<div class="acciones" style="width:100%;max-width:360px"><button class="btn" onclick="location.reload()">Reintentar</button><button class="btn sec" onclick="App.cambiarConexion()">Revisar la conexión</button></div>';
      $('conexion').classList.add('ver');
    });
  }

  // ---- al tocar: destello en el dedo y el botón se ilumina (se nota en cualquier teléfono)
  document.addEventListener('pointerdown', function (ev) {
    var el = ev.target.closest && ev.target.closest('button, a, .item, .tile, label.op, label.check, .chip, select, [role=button]');
    if (!el || el.disabled) return;
    el.classList.add('tocado');
    setTimeout(function () { el.classList.remove('tocado'); }, 220);
    var r = document.createElement('span');
    r.className = 'onda';
    r.style.left = ev.clientX + 'px'; r.style.top = ev.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(function () { r.remove(); }, 500);
  }, { passive: true });

  function iniciar() {
    $('logoCarga').innerHTML = LOGO;
    aplicarTema();
    try { history.replaceState({ mf: 0 }, ''); } catch (e) { /* nada */ }
    armar();
    revisarSoporteHuella();
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js');
      navigator.serviceWorker.addEventListener('message', function (ev) {
        if (ev.data && ev.data.tipo === 'actualizada') { toast('App actualizada a la versión ' + ev.data.version); setTimeout(function () { location.reload(); }, 1500); }
      });
    }
    var c = conexion();
    if (!c.url || !c.clave) return mostrarConexion('');
    arrancar();
  }

  // ==================================================================== v2.5
  var SERVIDOR_MIN = '2.10.10';
  function cmpVer(a, b) { var x = String(a || '0').split('.').map(Number), y = String(b || '0').split('.').map(Number); for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; }
  function PREFS() { return (AJ && AJ.prefs) || (D && D.ajustes && D.ajustes.prefs) || leerJSONSeguro('mf-prefs') || {}; }
  function guardarPrefs(parcial, desc) {
    var p = Object.assign({}, PREFS(), parcial);
    if (AJ) AJ.prefs = p;
    if (D && D.ajustes) D.ajustes.prefs = p;
    guardar('mf-prefs', JSON.stringify(p));
    encolar('guardarPreferencias', [parcial], desc || 'Guardar ajustes');
    cfgSW();
  }
  function miNombre() { var n = guardado('mf-mi-nombre', ''); if (n) return n; var c = (AJ && AJ.correo) || ''; c = c.split('@')[0].replace(/[._\d]+/g, ' ').trim().split(' ')[0] || 'Yo'; return c.charAt(0).toUpperCase() + c.slice(1); }

  // ---------------------------------------------------------------- SALARIO
  var FREC = [['bisemanal', 'Cada 2 semanas'], ['semanal', 'Cada semana'], ['quincenal', 'Quincenal (2 días del mes)'], ['mensual', 'Mensual']];
  function salCfg() { return PREFS().salario || null; }
  function proximosSalarios(n) {
    var c = salCfg(); if (!c || !c.activo) return [];
    var h0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return C.fechasSalario(c, h0, new Date(h0.getTime() + 120 * 86400000)).slice(0, n || 4);
  }
  function salarioPendiente() {
    var c = salCfg(); if (!c || !c.activo || !D) return null;
    var h0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    var f = C.fechasSalario(c, new Date(h0.getTime() - 3 * 86400000), h0).pop();
    if (!f) return null;
    var desde = new Date(f.getTime() - 3 * 86400000);
    if (D.movimientos.some(function (m) { return C.esSalario(m) && new Date(m.fecha) >= desde; })) return null;
    var pos = leerJSONSeguro('mf-sal-pos');
    if (pos && pos.f === f.toDateString() && pos.hasta > Date.now()) return null;
    return { fecha: f, monto: Number(c.monto) || 0, cuenta: c.cuenta || '', moneda: c.moneda || 'CRC' };
  }
  function tarjetaSalario() {
    var s = salarioPendiente(); if (!s) return '';
    return '<div class="aviso-sal"><div style="display:flex;gap:12px;align-items:center;text-align:left"><span style="font-size:28px">💰</span><div style="flex:1;min-width:0"><b>Hoy es día de salario</b><div class="suave chico">Normalmente entran ' + din(s.monto, s.moneda) + (s.cuenta ? ' a ' + esc(etiquetaCuenta(s.cuenta)) : '') + '</div></div></div>' +
      '<div class="dos" style="margin-top:10px"><button class="btn" onclick="App.salarioLlego()">✓ Sí, llegó</button><button class="btn sec" onclick="App.formSalarioOtro()">Otro monto</button></div>' +
      '<button class="enlace-editar" style="margin:6px auto 0" onclick="App.salarioManana()">Todavía no · recordarme mañana</button></div>';
  }
  function salarioManana() { var s = salarioPendiente(); if (!s) return; guardar('mf-sal-pos', JSON.stringify({ f: s.fecha.toDateString(), hasta: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).getTime() })); pintar(); toast('Te lo recuerdo mañana'); }
  function formSalarioOtro() {
    var s = salarioPendiente() || { monto: (salCfg() || {}).monto || 0, moneda: 'CRC' };
    abrir('<h2>💰 ¿Cuánto entró?</h2><label class="campo"><span>Monto</span><input id="sl-monto" class="monto" data-dinero inputmode="decimal" value="' + esc(String(s.monto || '').replace('.', ',')) + '"></label>' +
      '<div class="acciones"><button class="btn" onclick="App.salarioLlego(true)">Guardar y repartir</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function salarioLlego(otro) {
    var c = salCfg() || {}, monto = otro ? C.leerNumero(val('sl-monto')) : Number(c.monto);
    if (!monto || monto <= 0) return toast('Escribí el monto.');
    var cat = (D.categorias || []).filter(function (x) { return /salario/i.test(x); })[0] || '';
    var m = { fecha: new Date().toISOString(), comercio: 'Salario', lugar: '', monto: monto, moneda: c.moneda || 'CRC', tipo: 'Ingreso', cuenta: c.cuenta || '', categoria: cat, sobre: '', origen: 'Manual', autorizacion: 'SAL-' + Date.now(), nota: '' };
    encolar('guardarMovimiento', [m], 'Salario · ' + txt(monto, m.moneda));
    guardar('mf-sal-reparto', m.autorizacion);
    if (otro) cerrar();
    pintar(); toast('💰 Salario anotado. En unos segundos se abre el reparto.', 4000);
  }
  function intentarRepartoSalario() {
    var aut = guardado('mf-sal-reparto', ''); if (!aut || !D) return;
    var m = D.movimientos.filter(function (x) { return x.autorizacion === aut && x.fila > 0; })[0];
    if (!m) return;
    guardar('mf-sal-reparto', null);
    if (SB().pendientes.some(function (p) { return p.mov.fila === m.fila; })) irReparto(m.fila);
  }
  function resumenSalario() {
    var c = salCfg(); if (!c || !c.activo) return 'Sin configurar';
    var p = proximosSalarios(1)[0];
    return (FREC.filter(function (x) { return x[0] === c.frecuencia; })[0] || [0, ''])[1] + (p ? ' · próximo ' + fechaCorta(p.toISOString()) : '');
  }
  function formSalario() {
    var c = salCfg() || { activo: true, frecuencia: 'bisemanal', finde: 'antes', moneda: 'CRC' };
    var cuentas = D.cuentas.filter(function (x) { return x.activa && x.tipo !== 'Tarjeta de crédito' && x.tipo !== 'Préstamo'; }).map(function (x) { return x.nombre; });
    abrir('<h2>💰 Tu salario</h2><div class="suave">Para avisarte el día de pago y repartirlo completo en tus sobres.</div>' +
      '<label class="campo"><span>Monto normal</span><input id="sa-monto" data-dinero inputmode="decimal" value="' + esc(String(c.monto || '').replace('.', ',')) + '"></label>' +
      '<label class="campo"><span>Cuenta donde entra</span><select id="sa-cuenta">' + opciones(cuentas, c.cuenta, '— Elegí —') + '</select></label>' +
      '<label class="campo"><span>¿Cada cuánto te pagan?</span><select id="sa-frec" onchange="App.salPrev()">' + FREC.map(function (f) { return '<option value="' + f[0] + '"' + (c.frecuencia === f[0] ? ' selected' : '') + '>' + f[1] + '</option>'; }).join('') + '</select></label>' +
      '<div id="sa-b"><label class="campo"><span>Fecha de un pago que ya recibiste</span><input id="sa-fecha" type="date" value="' + esc(c.fecha || '') + '" onchange="App.salPrev()"></label></div>' +
      '<div id="sa-q" class="dos"><label class="campo"><span>Primer día</span><input id="sa-d1" type="number" min="1" max="31" inputmode="numeric" value="' + esc(String((c.dias || [15])[0] || '')) + '" oninput="App.salPrev()"></label><label class="campo"><span>Segundo día</span><input id="sa-d2" type="number" min="1" max="31" inputmode="numeric" value="' + esc(String((c.dias || [15, 30])[1] || '')) + '" oninput="App.salPrev()"></label></div>' +
      '<div id="sa-m"><label class="campo"><span>Día del mes</span><input id="sa-dia" type="number" min="1" max="31" inputmode="numeric" value="' + esc(String(c.dia || '')) + '" oninput="App.salPrev()"></label></div>' +
      '<label class="campo"><span>Si cae sábado o domingo</span><select id="sa-finde" onchange="App.salPrev()"><option value="antes"' + (c.finde === 'antes' ? ' selected' : '') + '>Se paga el viernes antes</option><option value="despues"' + (c.finde === 'despues' ? ' selected' : '') + '>Se paga el lunes después</option><option value="igual"' + (c.finde === 'igual' ? ' selected' : '') + '>Ese mismo día</option></select></label>' +
      '<div class="caja" style="margin-top:12px;gap:4px"><b style="font-size:14px">Próximos pagos</b><div id="sa-prev" class="suave chico"></div></div>' +
      '<label class="check"><input type="checkbox" id="sa-activo"' + (c.activo !== false ? ' checked' : '') + '> Avisarme el día de pago en Inicio</label>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarSalario()">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    salPrev();
  }
  function leerSalForm() {
    var f = val('sa-frec');
    return { activo: $('sa-activo') ? $('sa-activo').checked : true, monto: C.leerNumero(val('sa-monto')) || 0, cuenta: val('sa-cuenta'), moneda: 'CRC', frecuencia: f,
      fecha: val('sa-fecha'), dias: [Number(val('sa-d1')) || 0, Number(val('sa-d2')) || 0], dia: Number(val('sa-dia')) || 0, finde: val('sa-finde') };
  }
  function salPrev() {
    var c = leerSalForm();
    $('sa-b').style.display = c.frecuencia === 'bisemanal' || c.frecuencia === 'semanal' ? '' : 'none';
    $('sa-q').style.display = c.frecuencia === 'quincenal' ? '' : 'none';
    $('sa-m').style.display = c.frecuencia === 'mensual' ? '' : 'none';
    var h0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    var l = C.fechasSalario(c, h0, new Date(h0.getTime() + 100 * 86400000)).slice(0, 5);
    var dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    $('sa-prev').innerHTML = l.length ? l.map(function (d) { return dias[d.getDay()] + ' ' + fechaCorta(d.toISOString()); }).join(' · ') : 'Completá los datos para ver las fechas.';
  }
  function guardarSalario() {
    var c = leerSalForm();
    if (!c.monto) return toast('Escribí el monto.');
    if ((c.frecuencia === 'bisemanal' || c.frecuencia === 'semanal') && !c.fecha) return toast('Poné la fecha de un pago que ya recibiste.');
    if (c.frecuencia === 'quincenal' && (!c.dias[0] || !c.dias[1])) return toast('Poné los dos días del mes.');
    if (c.frecuencia === 'mensual' && !c.dia) return toast('Poné el día del mes.');
    guardarPrefs({ salario: c }, 'Salario: ' + (FREC.filter(function (x) { return x[0] === c.frecuencia; })[0] || [0, ''])[1]);
    cerrar(); pintar(); toast('✅ Salario guardado');
  }
  /** Reparto del salario: empieza con lo que repartiste la vez anterior */
  function repartoAnteriorSalario(m) {
    var sb = SB(), prev = D.movimientos.filter(function (x) { return C.esSalario(x) && x.fila > 0 && x.fila !== m.fila && (sb.porMov[x.fila] || []).some(function (f) { return f.sobre && f.monto > 0; }); })
      .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); })[0];
    if (!prev) return null;
    var por = {}; (sb.porMov[prev.fila] || []).forEach(function (f) { if (f.sobre && f.monto > 0) por[f.sobre] = (por[f.sobre] || 0) + f.monto; });
    return { fecha: prev.fecha, por: por };
  }

  // ---------------------------------------------------------------- AVISOS (A + C)
  var TIPOS_AVISO = [['asignar', '✉', 'Por asignar a sobres', ''], ['revisar', '⚠', 'Por revisar', 'sin categoría'], ['salario', '💰', 'Día de salario', 'según tus fechas de pago'],
    ['tarjeta', '💳', 'Pago de tarjeta', ''], ['negativo', '🔴', 'Sobre en negativo', ''], ['viaje', '✈', 'Viajes', 'resumen de cada día mientras dura el viaje'], ['super', '🛒', 'Super y Otros', '“¿este sirve?” y cambios en tus listas'], ['version', '⬆', 'Versión nueva de la app', '']];
  function avCfg() { var a = PREFS().avisos || {}; a.tipos = a.tipos || {}; a.silencio = a.silencio || { d: 22, h: 7 }; a.correo = a.correo || { activo: false, hora: 20, siempre: false }; return a; }
  function avisosTel() { return guardado('mf-avisos-tel', 'no') === 'si' && typeof Notification !== 'undefined' && Notification.permission === 'granted'; }
  function grupoAvisos() {
    var a = avCfg(), tel = avisosTel();
    var horas = function (id, v, fn) { var h = '<select id="' + id + '" onchange="' + fn + '">'; for (var i = 0; i < 24; i++) h += '<option value="' + i + '"' + (Number(v) === i ? ' selected' : '') + '>' + (i === 0 ? '12 a.m.' : i < 12 ? i + ' a.m.' : i === 12 ? '12 p.m.' : (i - 12) + ' p.m.') + '</option>'; return h + '</select>'; };
    return grupo('av', '🔔', '#FF8A3D', 'Avisos', (tel ? 'En el teléfono' : 'Teléfono apagado') + ' · ' + (a.correo.activo ? 'correo ' + (a.correo.hora > 12 ? a.correo.hora - 12 + ' p.m.' : a.correo.hora + ' a.m.') : 'sin correo'),
      opcion('campana', 'Avisos en el teléfono', 'Chrome revisa sola 1 o 2 veces al día y te avisa en la barra', interruptor('av-tel', tel, 'App.avisosTelefono(this.checked)', 'Avisos en el teléfono')) +
      TIPOS_AVISO.map(function (t) {
        if (t[0] === 'tarjeta') t = t.slice(0, 3).concat([textoDiasPago(a.diasPago) + ', con el monto · el correo trae la semana']);
        var extra = t[0] === 'tarjeta' && a.tipos.tarjeta !== false ? '<div style="padding:0 16px 10px 64px"><label class="campo compacto"><span>Avisar</span><select id="av-dp" onchange="App.avisoDiasPago()">' +
          DIAS_PAGO_OP.map(function (o) { return '<option value="' + o.join(',') + '"' + (o.join(',') === (a.diasPago || [3, 1, 0]).join(',') ? ' selected' : '') + '>' + textoDiasPago(o) + '</option>'; }).join('') + '</select></label></div>' : '';
        return (function (fila) { return fila + extra; })('<div class="opcion"><span class="ico" style="width:36px;height:36px;border-radius:10px;background:var(--fondo);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:17px">' + t[1] + '</span><span class="cuerpo"><span class="nombre" style="display:block">' + t[2] + '</span>' + (t[3] ? '<span class="det" style="display:block">' + t[3] + '</span>' : '') + '</span>' +
          interruptor('av-' + t[0], a.tipos[t[0]] !== false, 'App.avisoTipo(\'' + t[0] + '\',this.checked)', t[2]) + '</div>');
      }).join('') +
      '<div class="dos" style="padding:4px 16px 12px"><label class="campo compacto"><span>Silencio desde</span>' + horas('av-sd', a.silencio.d, 'App.avisoSilencio()') + '</label><label class="campo compacto"><span>hasta</span>' + horas('av-sh', a.silencio.h, 'App.avisoSilencio()') + '</label></div>' +
      opcion('correo', 'Resumen por correo', 'A ' + esc(AJ.correo) + ', a la hora que elijás', interruptor('av-correo', a.correo.activo, 'App.avisoCorreo(this.checked)', 'Resumen por correo')) +
      (a.correo.activo ? '<div class="dos" style="padding:0 16px 12px"><label class="campo compacto"><span>Hora</span>' + horas('av-hora', a.correo.hora, 'App.avisoCorreoHora()') + '</label>' +
        '<label class="campo compacto"><span>Cuándo</span><select id="av-siempre" onchange="App.avisoCorreoHora()"><option value="algo"' + (!a.correo.siempre ? ' selected' : '') + '>Solo si hay algo</option><option value="siempre"' + (a.correo.siempre ? ' selected' : '') + '>Todos los días</option></select></label></div>' : '') +
      opcion('campana', 'Probar un aviso ahora', 'En la barra del teléfono' + (a.correo.activo ? ' y por correo' : ''), '', 'App.probarAviso(this)'));
  }
  function avisoTipo(k, on) { var a = avCfg(); a.tipos[k] = !!on; guardarPrefs({ avisos: a }, 'Avisos: ' + k + (on ? ' encendido' : ' apagado')); if (k === 'tarjeta') pintar(); }
  // v2.9.0: cuántos días antes avisar el pago de tarjeta
  var DIAS_PAGO_OP = [[3, 1, 0], [5, 3, 1, 0], [2, 0], [1, 0], [0]];
  function textoDiasPago(o) {
    o = o && o.length ? o : [3, 1, 0];
    var l = o.map(function (n) { return n === 0 ? 'el mismo día' : n === 1 ? '1 día antes' : n + ' días antes'; });
    var t = l.length > 1 ? l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1] : l[0];
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function bandejaLimpia(on) { guardarPrefs({ bandejaLimpia: !!on }, on ? 'Bandeja limpia: encendida' : 'Bandeja limpia: apagada'); toast(on ? '📥 Lo que la app lea sale de la bandeja de entrada' : 'Los correos leídos se quedan en la bandeja', 2500); }
  function avisoDiasPago() { var a = avCfg(); a.diasPago = val('av-dp').split(',').map(Number); guardarPrefs({ avisos: a }, 'Aviso de pago: ' + textoDiasPago(a.diasPago)); pintar(); }
  function avisoSilencio() { var a = avCfg(); a.silencio = { d: Number(val('av-sd')), h: Number(val('av-sh')) }; guardarPrefs({ avisos: a }, 'Avisos: horas de silencio'); }
  function avisoCorreo(on) { var a = avCfg(); a.correo.activo = !!on; a.urlApp = location.href.split(/[?#]/)[0]; guardarPrefs({ avisos: a }, 'Resumen por correo ' + (on ? 'encendido' : 'apagado')); pintar(); }
  function avisoCorreoHora() { var a = avCfg(); a.correo.hora = Number(val('av-hora')); a.correo.siempre = val('av-siempre') === 'siempre'; guardarPrefs({ avisos: a }, 'Resumen por correo a las ' + a.correo.hora + ' h'); }
  function avisosTelefono(on) {
    if (!on) { guardar('mf-avisos-tel', 'no'); cfgSW(); toast('Avisos del teléfono apagados'); return pintar(); }
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) { toast('Este navegador no permite avisos. Usá el resumen por correo.', 5000); return pintar(); }
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { toast('Sin permiso para avisar. Activalo en Ajustes del teléfono → Apps → Chrome → Notificaciones.', 6000); return pintar(); }
      llamar('activarAvisosTelefono').then(function (llave) {
        guardar('mf-avisos-llave', llave); guardar('mf-avisos-tel', 'si'); cfgSW();
        return navigator.serviceWorker.ready.then(function (reg) {
          if (!reg.periodicSync) return 'no';
          return navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (st) {
            if (st.state !== 'granted') return 'no';
            return reg.periodicSync.register('mf-avisos', { minInterval: 6 * 3600 * 1000 }).then(function () { return 'si'; });
          });
        }).catch(function () { return 'no'; });
      }).then(function (auto) {
        toast(auto === 'si' ? '🔔 Listo: te aviso en la barra' : '🔔 Avisos activados. Para la revisión automática, instalá la app (Agregar a pantalla de inicio).', 6000);
        pintar();
      }, function (e) { toast('⚠️ ' + (e.message || e)); pintar(); });
    });
  }
  /** El service worker no puede leer localStorage: le dejamos lo necesario en una caché propia. */
  function cfgSW() {
    if (!('caches' in window)) return;
    var a = avCfg();
    var cfg = { url: conexion().url, llave: guardado('mf-avisos-llave', ''), tel: guardado('mf-avisos-tel', 'no') === 'si', tipos: a.tipos, silencio: a.silencio, version: VERSION_WEB };
    caches.open('mf-cfg').then(function (c) { return c.put('./__cfg', new Response(JSON.stringify(cfg), { headers: { 'Content-Type': 'application/json' } })); }).catch(function () { /* nada */ });
  }
  function probarAviso(b) {
    var a = avCfg();
    if (a.correo.activo) srv('probarResumenCorreo', [], function (m) { toast(m); }, b);
    if (avisosTel()) navigator.serviceWorker.ready.then(function (reg) {
      // v2.9.0: la prueba muestra el próximo pago de tarjeta real (o un ejemplo)
      var px = C.pagosProximos(D, hoy, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31], 31).filter(function (p) { return p.debe; })[0];
      var tit = px ? '💳 ' + px.nombre + ' · ' + (px.dias === 0 ? 'vence HOY' : px.dias === 1 ? 'vence mañana' : 'pagar en ' + px.dias + ' días') : '✉ Así se ven los avisos';
      var cuerpo = px ? [px.CRC > 0.004 ? txt(px.CRC, 'CRC') : '', px.USD > 0.004 ? txt(px.USD, 'USD') : ''].filter(String).join(' + ') + ' · vence el ' + fechaCorta(px.fecha).replace(/ \d{4}$/, '') + ' (prueba)' : 'Por ejemplo: 3 movimientos por asignar a sobres';
      reg.showNotification(tit, { body: cuerpo, icon: 'icons/icono-192.png', badge: 'icons/icono-192.png', tag: 'prueba', data: { url: px ? './?ir=tarjetas' : './?ir=porasignar' }, actions: [{ action: 'abrir', title: 'Abrir' }] });
    });
    else if (!a.correo.activo) toast('Encendé “Avisos en el teléfono” o el resumen por correo.');
  }

  // ---------------------------------------------------------------- VERSIÓN NUEVA y ACTUALIZACIONES
  var verNueva = null;
  function revisarVersion() {
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (v) {
      if (!v) return;
      var antes = verNueva; verNueva = v;
      if ((cmpVer(v.web, VERSION_WEB) > 0) !== (antes && cmpVer(antes.web, VERSION_WEB) > 0) && pantalla === 'inicio') pintar();
    }).catch(function () { /* sin internet */ });
  }
  function tarjetasVersion() {
    var h = '';
    if (verNueva && cmpVer(verNueva.web, VERSION_WEB) > 0) h += '<div class="aviso-ver"><span style="font-size:24px">⬆</span><div style="flex:1;min-width:0"><b>Versión ' + esc(verNueva.web) + ' lista</b><div class="suave chico">' + esc(verNueva.novedades || '') + '</div></div><button class="btn chico" onclick="App.formActualizar()">Actualizar</button></div>';
    if (AJ && AJ.version && cmpVer(AJ.version, SERVIDOR_MIN) < 0) h += '<div class="aviso-srv"><span style="font-size:22px">⚙</span><div style="flex:1;min-width:0"><b>Falta actualizar el servidor</b><div class="suave chico">Esta versión necesita el Codigo.gs ' + SERVIDOR_MIN + ' (tenés ' + esc(AJ.version) + '). Ajustes → Actualizaciones.</div></div></div>';
    return h;
  }
  function actualizarApp() {
    if (!('serviceWorker' in navigator)) return location.reload();
    toast('Actualizando la app…');
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) return location.reload();
      return reg.update().then(function () { setTimeout(function () { location.reload(); }, 2500); });
    }).catch(function () { location.reload(); });
  }
  function grupoActualizaciones() {
    var srvNuevo = verNueva && AJ && cmpVer(verNueva.servidor, AJ.version) > 0, webNuevo = verNueva && cmpVer(verNueva.web, VERSION_WEB) > 0;
    return grupo('ac', '⬆', '#F5B82E', 'Actualizaciones', (webNuevo || srvNuevo ? 'Hay versión nueva' : 'App ' + VERSION_WEB + ' · servidor ' + esc(AJ.version)),
      '<div class="vers-ac"><div><small>App</small><b class="' + (webNuevo ? 'acento' : '') + '">' + VERSION_WEB + (webNuevo ? ' → ' + esc(verNueva.web) : '') + '</b></div><div><small>Servidor</small><b class="' + (srvNuevo ? 'acento' : '') + '">' + esc(AJ.version) + (srvNuevo ? ' → ' + esc(verNueva.servidor) : '') + '</b></div></div>' +
      (verNueva && verNueva.novedades && (webNuevo || srvNuevo) ? '<div class="suave chico" style="padding:0 16px 8px">Novedades: ' + esc(verNueva.novedades) + '</div>' : '') +
      opcion('recargar', 'Buscar actualizaciones', 'Actualiza la app y el servidor con un toque', '', 'App.formActualizar()') +
      (AJ.actualizacion && AJ.actualizacion.anterior ? opcion('flechas', 'Volver a la versión anterior del servidor', 'Por si algo falló después de actualizar', '', 'App.volverAnterior(this)') : ''));
  }
  var PASOS_AC = ['Buscar versión nueva', 'Guardar cuál versión del servidor estaba', 'Instalar el servidor nuevo', 'Descargar la app nueva', 'Recargar la app'];
  function formActualizar() {
    abrir('<h2>⬆ Actualizaciones</h2><div class="pasos-ac" id="ac-pasos">' + PASOS_AC.map(function (p, i) { return '<div class="p" id="ac-p' + i + '"><span class="b"></span>' + p + '</div>'; }).join('') + '</div>' +
      '<div class="barra" style="margin-top:10px"><i id="ac-barra" style="width:0%"></i></div><div class="suave chico" id="ac-msg" style="margin-top:10px;min-height:18px"></div><div id="ac-extra"></div>' +
      '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
    correrActualizacion();
  }
  function pasoAc(i, estado) {
    var e = $('ac-p' + i); if (!e) return;
    e.className = 'p ' + estado;
    var b = $('ac-barra'); if (b) b.style.width = Math.round(((estado === 'hecho' ? i + 1 : i) / PASOS_AC.length) * 100) + '%';
  }
  function msgAc(t) { var e = $('ac-msg'); if (e) e.innerHTML = t; }
  function correrActualizacion() {
    pasoAc(0, 'act');
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('No encuentro version.json en tu página.'); return r.json(); }).then(function (v) {
      verNueva = v; pasoAc(0, 'hecho');
      var srvNuevo = cmpVer(v.servidor, AJ.version) > 0, webNuevo = cmpVer(v.web, VERSION_WEB) > 0;
      if (!srvNuevo && !webNuevo) { [1, 2, 3, 4].forEach(function (i) { pasoAc(i, 'hecho'); }); msgAc('<b class="verde">Todo al día ✓</b> · app ' + VERSION_WEB + ' · servidor ' + esc(AJ.version)); return; }
      var srvPaso = srvNuevo ? servidorAuto() : Promise.resolve('nada');
      return srvPaso.then(function (res) {
        if (res === 'guiado') return;   // se queda en los pasos guiados
        if (webNuevo) { pasoAc(3, 'act'); msgAc('Descargando la app ' + esc(v.web) + '…'); setTimeout(function () { pasoAc(3, 'hecho'); pasoAc(4, 'act'); actualizarApp(); }, 900); }
        else { pasoAc(3, 'hecho'); pasoAc(4, 'hecho'); msgAc('<b class="verde">Servidor actualizado ✓</b>'); llamar('obtenerAjustes').then(function (x) { AJ = x; pintar(); }); }
      });
    }).catch(function (e) { msgAc('⚠️ ' + esc(e.message || e)); });
  }
  function servidorAuto() {
    if (guardado('mf-srv-manual', '') === '1') { pasoAc(1, 'hecho'); pasoAc(2, 'mal'); servidorGuiado('MANUAL'); return Promise.resolve('guiado'); }   // v2.5.8: este servidor se actualiza a mano
    pasoAc(1, 'act');
    var base = location.href.split(/[?#]/)[0].replace(/[^/]*$/, '');
    var fijar = AJ.actualizacion && AJ.actualizacion.base ? Promise.resolve() : llamar('fijarUrlActualizacion', [base]);
    return fijar.then(function () { pasoAc(1, 'hecho'); pasoAc(2, 'act'); msgAc('Instalando el servidor ' + esc(verNueva.servidor) + '… (puede tardar un minuto)'); return llamar('actualizarServidor'); })
      .then(function (r) { pasoAc(2, 'hecho'); AJ.version = r.version; if (AJ.actualizacion) AJ.actualizacion.anterior = r.anterior; return 'ok'; })
      .catch(function (e) { var m = e.message || String(e); if (/API_DESACTIVADA/.test(m)) { guardar('mf-srv-manual', '1'); m = 'MANUAL'; } pasoAc(2, 'mal'); servidorGuiado(m); return 'guiado'; });
  }
  function servidorGuiado(motivo) {
    if (motivo === 'MANUAL') {
      msgAc('Hay servidor nuevo (<b>' + esc(verNueva.servidor) + '</b>). Tu servidor se actualiza a mano, desde la PC:');
      $('ac-extra').innerHTML = '<ol class="suave chico" style="margin:8px 0 0 18px;line-height:1.6"><li>Tocá “Copiar código nuevo” (o usá el Codigo.gs que te mandaron).</li><li>En Apps Script: <b>Código</b> → borrar todo → pegar → Guardar.</li><li>Implementar → Gestionar implementaciones → ✏ → Versión: <b>Nueva</b> → Implementar.</li></ol>' +
        '<div class="dos" style="margin-top:10px"><button class="btn" onclick="App.copiarCodigo(this)">📋 Copiar código nuevo</button><a class="btn sec" href="https://script.google.com/home" target="_blank" rel="noopener">Abrir Apps Script ↗</a></div>' +
        (cmpVer(verNueva.web, VERSION_WEB) > 0 ? '<button class="btn sec" style="margin-top:8px;width:100%" onclick="App.actualizarApp()">Actualizar la app ahora (' + esc(verNueva.web) + ')</button>' : '');
      return;
    }
    var porque = /API_DESACTIVADA/.test(motivo) ? 'Falta activar la <b>API de Google Apps Script</b> (una sola vez).' : /PERMISO_FALTA|UrlFetchApp|external_request|autorizaci/i.test(motivo) ? 'Falta darle a Google el permiso para conectarse a internet (una sola vez): en Apps Script elegí la función <b>autorizarActualizaciones</b>, tocá ▶ Ejecutar y en la ventana de Google marcá <b>Seleccionar todo</b> → Continuar.' : 'No se pudo instalar solo: ' + esc(motivo);
    msgAc(porque + ' Mientras tanto, actualizalo a mano:');
    $('ac-extra').innerHTML = '<ol class="suave chico" style="margin:8px 0 0 18px;line-height:1.6">' +
      (/API_DESACTIVADA/.test(motivo) ? '<li>Abrí <a href="https://script.google.com/home/usersettings" target="_blank" rel="noopener" class="enlace">script.google.com/home/usersettings</a> y encendé “API de Google Apps Script”. Después tocá Buscar actualizaciones otra vez.</li>' : '') +
      '<li>Tocá “Copiar código nuevo”.</li><li>Abrí Apps Script, borrá todo en <b>Código</b> y pegá.</li><li>Guardar → Implementar → Gestionar implementaciones → ✏ → Versión: <b>Nueva</b> → Implementar.</li>' + (/PERMISO_FALTA|UrlFetchApp|external_request|autorizaci/i.test(motivo) ? '<li>Arriba, junto a ▶ Ejecutar, elegí <b>autorizarActualizaciones</b> → ▶ Ejecutar → en la ventana de Google marcá <b>Seleccionar todo</b> → Continuar. Así la próxima vez se instala solo.</li>' : '') + '<li>Volvé aquí: la app lo detecta sola.</li></ol>' +
      '<div class="dos" style="margin-top:10px"><button class="btn" onclick="App.copiarCodigo(this)">📋 Copiar código nuevo</button><a class="btn sec" href="https://script.google.com/home" target="_blank" rel="noopener">Abrir Apps Script ↗</a></div>';
  }
  function copiarCodigo(b) {
    ocupar(b);
    fetch('servidor/Codigo.gs?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
      return navigator.clipboard.writeText(t).then(function () { liberar(b, true); toast('📋 Código copiado (' + Math.round(t.length / 1024) + ' KB). Pegalo en Apps Script.', 5000); });
    }).catch(function (e) { liberar(b, false); toast('⚠️ No se pudo copiar: ' + (e.message || e)); });
  }
  function volverAnterior(b) {
    if (!confirmarDoble(b)) return;
    srv('volverVersionAnterior', [], function () { toast('✅ El servidor volvió a la versión anterior'); llamar('obtenerAjustes').then(function (x) { AJ = x; pintar(); }); }, b);
  }
  function confirmarDoble(b) { if (b.dataset.seguro === '1') return true; b.dataset.seguro = '1'; var n = b.querySelector('.nombre'); if (n) n.textContent = '¿Seguro? Tocá otra vez'; setTimeout(function () { b.dataset.seguro = ''; }, 4000); return false; }

  // ---------------------------------------------------------------- SUPER Y OTROS
  var PASILLOS = ['Frutas y verduras', 'Carnes', 'Lácteos y huevos', 'Granos y abarrotes', 'Panadería', 'Congelados', 'Bebidas', 'Limpieza', 'Cuidado personal', 'Bebé', 'Mascotas', 'Farmacia', 'Otros'];
  var IC_PASILLO = { 'Frutas y verduras': '🥑', 'Carnes': '🥩', 'Lácteos y huevos': '🥛', 'Granos y abarrotes': '🍚', 'Panadería': '🍞', 'Congelados': '🧊', 'Bebidas': '🧃', 'Limpieza': '🧻', 'Cuidado personal': '🧴', 'Bebé': '🍼', 'Mascotas': '🐾', 'Farmacia': '💊', 'Otros': '🛒' };
  var LISTA_BASE = [
    ['Frutas y verduras', ['Bananos', 'Tomates', 'Cebolla', 'Papas', 'Zanahoria', 'Chile dulce', 'Culantro', 'Limones', 'Aguacate', 'Manzanas', 'Papaya']],
    ['Carnes', ['Pollo', 'Carne molida', 'Bistec de res', 'Chuleta de cerdo', 'Pescado']],
    ['Lácteos y huevos', ['Leche', 'Huevos', 'Queso tierno', 'Natilla', 'Mantequilla', 'Yogurt']],
    ['Granos y abarrotes', ['Arroz', 'Frijoles', 'Azúcar', 'Sal', 'Aceite', 'Café', 'Salsa Lizano', 'Pasta', 'Atún', 'Avena', 'Harina', 'Salsa de tomate']],
    ['Panadería', ['Pan cuadrado', 'Tortillas']],
    ['Bebidas', ['Agua', 'Jugo', 'Refresco']],
    ['Limpieza', ['Papel higiénico', 'Jabón de platos', 'Detergente', 'Cloro', 'Bolsas de basura', 'Toallas de papel']],
    ['Cuidado personal', ['Pasta de dientes', 'Champú', 'Jabón de baño', 'Desodorante']],
    ['Mascotas', ['Alimento para mascota']]
  ];
  var REGLAS_PASILLO = [[/banano|tomate|cebolla|papa\b|papas|zanahoria|chile|culantro|lim[oó]n|aguacate|manzana|papaya|fruta|verdura|lechuga|pepino|ayote|pi[ñn]a|naranja|fresa|mango|uva|apio|ajo|br[oó]coli|elote/, 'Frutas y verduras'],
    [/pollo|carne|res\b|bistec|cerdo|chuleta|pescado|salchicha|jam[oó]n|tocineta|chorizo|camar[oó]n/, 'Carnes'], [/leche|huevo|queso|natilla|mantequilla|yogurt|yogur|crema/, 'Lácteos y huevos'],
    [/arroz|frijol|az[uú]car|sal\b|aceite|caf[eé]|lizano|pasta\b|espagueti|at[uú]n|avena|harina|salsa|cereal|galleta|sardina|maicena|gelatina|consom/, 'Granos y abarrotes'], [/pan\b|pan |tortilla|queque|bollo/, 'Panadería'],
    [/helado|congelad|hielo/, 'Congelados'], [/agua|jugo|refresco|gaseosa|cerveza|vino|soda/, 'Bebidas'], [/papel|jab[oó]n de platos|detergente|cloro|bolsa|toalla|desinfect|suavizante|escoba|esponja|limpia/, 'Limpieza'],
    [/pasta de dientes|cepillo|champ[uú]|jab[oó]n|desodorante|crema dental|toallas? sanitaria|rasuradora|acondicionador/, 'Cuidado personal'], [/pa[ñn]al|beb[eé]|toallitas/, 'Bebé'],
    [/mascota|perro|gato|arena/, 'Mascotas'], [/acetaminof|pastilla|medicina|vitamina|curita|alcohol/, 'Farmacia']];
  function pasilloDe(n) { var s = sinTildes(n); for (var i = 0; i < REGLAS_PASILLO.length; i++) if (REGLAS_PASILLO[i][0].test(s)) return REGLAS_PASILLO[i][1]; return 'Otros'; }
  var UNIDADES = ['u', 'kg', 'g', 'lb', 'L', 'ml', 'paq', 'docena'];
  function leerTextoItem(t) {
    t = String(t || '').trim(); if (!t) return null;
    var U = '(kg|kilos?|g|gr|gramos?|lb|libras?|l|lt|litros?|ml|u|und|unidades?|paq|paquetes?|docenas?)';
    var norm = function (u) { u = (u || '').toLowerCase(); return /^k/.test(u) ? 'kg' : /^(g|gr|gram)/.test(u) ? 'g' : /^(lb|lib)/.test(u) ? 'lb' : /^ml/.test(u) ? 'ml' : /^(l|lt|lit)/.test(u) ? 'L' : /^paq/.test(u) ? 'paq' : /^doc/.test(u) ? 'docena' : u ? 'u' : ''; };
    var m = t.match(new RegExp('^(\\d+(?:[.,]\\d+)?)\\s*' + U + '?\\.?\\s+(?:de\\s+)?(.+)$', 'i')) || null, q = '', u = '', n = t;
    if (m) { q = Number(m[1].replace(',', '.')); u = norm(m[2]) || 'u'; n = m[3]; }
    else { m = t.match(new RegExp('^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*' + U + '?\\.?$', 'i')); if (m) { n = m[1]; q = Number(m[2].replace(',', '.')); u = norm(m[3]) || 'u'; } }
    n = n.trim(); n = n.charAt(0).toUpperCase() + n.slice(1);
    return { n: n, q: q, u: u, p: pasilloDe(n) };
  }
  var LISTAS = leerJSONSeguro('mf-listas') || null, LISTA = null, listaModo = 'super', listaTimer = null, fotosMem = {}, listaCola = leerJSONSeguro('mf-lista-cola') || [];
  function cargarListas(cb) {
    llamar('listas').then(function (l) { LISTAS = l; guardar('mf-listas', JSON.stringify(l)); if (pantalla === 'super') pintar(); if (cb) cb(); }, function (e) { if (pantalla === 'super' && !LISTAS) { LISTAS = []; pintar(); } toast('⚠️ ' + (e.message || e)); });
  }
  function pSuper() {
    var h = cabSimple('Super y Otros', 'Listas de compras que podés compartir', null, botonNuevo('Nueva lista', 'App.formNuevaLista()'));
    if (!LISTAS) { h += '<div class="caja vacio"><div class="spinner" style="margin:0 auto 10px"></div>Cargando tus listas…</div>'; $('p-super').innerHTML = h; return cargarListas(); }
    if (!LISTAS.length) h += '<div class="vacio-lindo"><div style="font-size:46px">🛒</div><b>Todavía no tenés listas</b><div class="suave">Hacé tu lista del super con cantidades, marcala mientras comprás y compartila con quien quieras.</div><button class="btn" style="margin-top:12px" onclick="App.formNuevaLista()">Crear mi primera lista</button></div>';
    else h += LISTAS.map(function (l) {
      return '<button class="item lista-card" onclick="App.abrirLista(\'' + l.id + '\')"><span class="av-lista">' + esc(l.icono) + '</span><span class="cuerpo" style="flex:1;min-width:0"><b>' + esc(l.nombre) + '</b><span class="suave chico" style="display:block">' + l.total + ' cosa' + (l.total === 1 ? '' : 's') + (l.marcados ? ' · ' + l.marcados + ' en el carrito' : '') + '</span>' +
        (l.compartida ? '<span class="verde chico fuerte" style="display:block">👥 Compartida</span>' : '') + (l.consultas ? '<span class="acento chico fuerte" style="display:block">📷 ' + l.consultas + ' “¿este sirve?”</span>' : '') + '</span><span class="flecha">›</span></button>';
    }).join('');
    $('p-super').innerHTML = h;
    if (!pSuper.refrescado) { pSuper.refrescado = true; cargarListas(); }
  }
  var NL = { tipo: 'super' };
  function formNuevaLista(tipo) {
    var primera = !LISTAS || !LISTAS.length; NL.tipo = tipo || NL.tipo || 'super';
    var tienda = NL.tipo === 'tiendas', ics = tienda ? ['🛍', '👟', '👕', '🎒', '🎁', '🧳', '💄'] : ['🛒', '🥑', '💊', '🏠', '🎁', '🐾', '🧴'];
    var nom = $('nl-nombre') ? val('nl-nombre') : (primera ? 'Super semanal' : '');
    if (tienda && /^super semanal$/i.test(nom)) nom = '';
    var tarjeta = function (t, ic, n, d) { return '<button type="button" class="nl-tipo' + (NL.tipo === t ? ' on' : '') + '" onclick="App.formNuevaLista(\'' + t + '\')"><span style="font-size:26px">' + ic + '</span><b>' + n + '</b><span class="suave chico">' + d + '</span></button>'; };
    abrir('<h2>Nueva lista</h2><label class="campo"><span>Nombre</span><input id="nl-nombre" placeholder="' + (tienda ? 'Ej. Compras del viaje' : 'Ej. Super semanal') + '" value="' + esc(nom) + '"></label>' +
      '<div class="suave chico" style="margin-top:10px">Tipo de lista</div><div class="nl-tipos">' + tarjeta('super', '🛒', 'Super', 'por pasillos, cantidades') + tarjeta('tiendas', '🛍', 'Tiendas y mall', 'ropa, zapatos, tallas, para quién') + '</div>' +
      '<div class="suave chico" style="margin-top:12px">Ícono</div><div class="chips" id="nl-ic" style="margin-top:6px">' + ics.map(function (x, i) { return '<button class="chip' + (i ? '' : ' on') + '" onclick="App.nlIcono(this)">' + x + '</button>'; }).join('') + '</div>' +
      (tienda ? '<label class="campo"><span>¿Para quiénes? (separados por coma)</span><input id="nl-personas" placeholder="Ej. Fernando, Ana, Sofía" value="' + esc(miNombre()) + '"></label>' : '') +
      '<label class="check"><input type="checkbox" id="nl-base"' + (primera || tienda ? ' checked' : '') + '> ' + (tienda ? 'Empezar con una lista base de tiendas (ropa, calzado, medias, ropa interior, abrigos, perfumería…; antes de crearla quitás lo que no ocupás)' : 'Empezar con una lista base de super (unas 50 cosas típicas; antes de crearla quitás las que no usás)') + '</label>' +
      '<div class="acciones"><button class="btn" onclick="App.crearListaNueva(this)">Crear</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function nlIcono(b) { Array.prototype.forEach.call(document.querySelectorAll('#nl-ic .chip'), function (c) { c.classList.toggle('on', c === b); }); }
  function crearListaNueva(b) {
    var tienda = NL.tipo === 'tiendas', nombre = val('nl-nombre').trim() || (tienda ? 'Compras' : 'Lista'), ic = (document.querySelector('#nl-ic .chip.on') || {}).textContent || (tienda ? '🛍' : '🛒');
    var opc = { tipo: NL.tipo, personas: tienda ? val('nl-personas').split(',').map(function (x) { return x.trim(); }).filter(String) : [] };
    if ($('nl-base').checked) return elegirBase(nombre, ic, opc);
    srv('crearLista', [nombre, ic, [], opc], function (l) { cerrar(); LISTA = l; listaModo = 'editar'; cargarListas(); ir('lista'); }, b);
  }
  var baseTmp = null;
  function elegirBase(nombre, ic, opc) {
    baseTmp = { nombre: nombre, ic: ic, opc: opc || { tipo: 'super' } };
    var tienda = baseTmp.opc.tipo === 'tiendas', base = tienda ? TIENDAS.BASE : LISTA_BASE, icg = tienda ? TIENDAS.IC : IC_PASILLO;
    abrir('<h2>Lista base</h2><div class="suave">' + (tienda ? 'Marcá lo que quieren comprar (empieza todo desmarcado). Después le ponés talla, color y para quién.' : 'Desmarcá lo que no comprás. Después la editás como querás.') + '</div>' + base.map(function (g) {
      return '<div class="seccion-t fila" style="margin-top:14px"><span>' + icg[g[0]] + ' ' + g[0] + '</span><button type="button" class="enlace-mini" onclick="App.baseSeccion(this)">todas</button></div>' + g[1].map(function (n) { return '<label class="check" style="margin-top:8px"><input type="checkbox" class="lb-it" data-p="' + esc(g[0]) + '" value="' + esc(n) + '"' + (tienda ? '' : ' checked') + '> ' + esc(n) + '</label>'; }).join('');
    }).join('') + '<div class="acciones"><button class="btn" onclick="App.crearConBase(this)">Crear lista</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function baseSeccion(b) {
    var cajas = [], e = b.parentNode.nextElementSibling;
    while (e && !e.classList.contains('seccion-t')) { var c = e.querySelector && e.querySelector('input.lb-it'); if (c) cajas.push(c); e = e.nextElementSibling; }
    var todas = cajas.every(function (c) { return c.checked; }); cajas.forEach(function (c) { c.checked = !todas; }); b.textContent = todas ? 'todas' : 'ninguna';
  }
  function crearConBase(b) {
    var items = Array.prototype.filter.call(document.querySelectorAll('.lb-it'), function (x) { return x.checked; }).map(function (x) { return { n: x.value, q: '', u: '', p: x.dataset.p }; });
    srv('crearLista', [baseTmp.nombre, baseTmp.ic, items, baseTmp.opc], function (l) { cerrar(); LISTA = l; listaModo = 'editar'; cargarListas(); ir('lista'); toast('✅ Lista creada con ' + items.length + ' cosas'); }, b);
  }
  function abrirLista(id) {
    var cache = leerJSONSeguro('mf-lista-' + id);
    LISTA = cache || { id: id, nombre: '…', icono: '🛒', items: [], v: 0, cargando: true };
    listaModo = guardado('mf-lista-modo', 'super');
    ir('lista');
    refrescarLista(true);
  }
  function reaplicarListaCola(l) { listaCola.filter(function (x) { return x.id === l.id; }).forEach(function (x) { aplicarOpLocal(l, x.op); }); return l; }
  function refrescarLista(forzar) {
    if (!LISTA) return;
    var id = LISTA.id;
    llamar('obtenerLista', [id, forzar ? 0 : LISTA.v]).then(function (r) {
      if (!LISTA || LISTA.id !== id || r.sinCambios) return;
      var antes = LISTA.cambio;
      LISTA = reaplicarListaCola(r); guardar('mf-lista-' + id, JSON.stringify(r));
      if (r.cambio && antes && r.cambio.cuando !== antes.cuando && r.cambio.txt.indexOf(miNombre() + ' ') !== 0 && avCfg().tipos.super !== false) toast('🛒 ' + r.cambio.txt, 4000);
      if (pantalla === 'lista' && !escribiendoLista()) pintar();
    }, function () { /* sin señal: se ve lo guardado */ });
    enviarListaCola();
  }
  function escribiendoLista() { var e = document.activeElement; return e && /INPUT|TEXTAREA/.test(e.tagName); }
  function cicloLista() {
    clearTimeout(listaTimer);
    listaTimer = setTimeout(function () { if (pantalla === 'lista' && !document.hidden) refrescarLista(false); if (pantalla === 'lista') cicloLista(); }, 4000);
  }
  function aplicarOpLocal(l, op) {
    var it = op.item ? (l.items || []).filter(function (x) { return x.id === op.item; })[0] : null, yo = miNombre();
    if (op.t === 'marcar' && it) { it.on = !!op.on; it.por = op.on ? yo : ''; if (op.on) it.estado = ''; if (!op.on) it.pagado = ''; }
    else if (op.t === 'pagado' && it) { it.pagado = Number(op.monto) > 0 ? Number(op.monto) : ''; if (op.medio !== undefined) it.medio = op.medio; if (it.pagado) { it.on = true; it.por = yo; } }
    else if (op.t === 'encargante' && op.datos) {
      l.encargantes = l.encargantes || []; var e0 = l.encargantes.filter(function (e) { return e.n === (op.antes || op.datos.n); })[0];
      if (e0) { if (op.antes && op.antes !== op.datos.n) l.items.forEach(function (x) { if (x.enc === op.antes) x.enc = op.datos.n; }); Object.assign(e0, op.datos); } else l.encargantes.push(Object.assign({ adelanto: 0, moneda: 'USD', estado: '' }, op.datos));
    }
    else if (op.t === 'quitarEncargante') { l.encargantes = (l.encargantes || []).filter(function (e) { return e.n !== op.n; }); l.items = l.items.filter(function (x) { return x.enc !== op.n; }); }
    else if (op.t === 'personas') l.personas = op.personas || [];
    else if (op.t === 'nohay' && it) { it.estado = 'nohay'; it.on = false; it.por = yo; }
    else if (op.t === 'agregar' && op.datos) { if (!l.items.some(function (x) { return x.id === op.datos.id; })) l.items.push(Object.assign({ on: false, estado: '', foto: '', nota: '' }, op.datos)); }
    else if (op.t === 'editar' && it) Object.assign(it, op.datos);
    else if (op.t === 'quitar' && it) l.items.splice(l.items.indexOf(it), 1);
    else if (op.t === 'consulta' && it) it.consulta = { foto: op.foto, msg: op.msg, por: yo, cuando: new Date().toISOString(), resp: null };
    else if (op.t === 'responder' && it && it.consulta) { it.consulta.resp = { si: !!op.si, msg: op.msg || '', por: yo }; if (op.si) it.on = true; }
    else if (op.t === 'editable') l.editable = !!op.on;
    else if (op.t === 'renombrar' && op.nombre) l.nombre = op.nombre;
    else if (op.t === 'terminar') {
      if (op.pendientes === 'borrar' || op.pendientes === 'mover') l.items = l.items.filter(function (x) { return x.on || x.enc; });
      l.items.forEach(function (x) { if (x.enc) return; x.on = false; x.por = ''; x.estado = ''; x.consulta = null; x.pagado = ''; });
    }
  }
  function listaOp(op, desc) {
    if (!LISTA) return;
    if (op.t === 'agregar' && op.datos && !op.datos.id) op.datos.id = 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    aplicarOpLocal(LISTA, op);
    listaCola.push({ id: LISTA.id, op: op, desc: desc || '' }); guardar('mf-lista-cola', JSON.stringify(listaCola));
    guardar('mf-lista-' + LISTA.id, JSON.stringify(LISTA));
    pintar(); enviarListaCola();
  }
  var enviandoLista = false;
  function enviarListaCola() {
    if (enviandoLista || !listaCola.length) return;
    enviandoLista = true;
    var x = listaCola[0];
    llamar('cambiarLista', [x.id, x.op, miNombre()]).then(function (r) {
      listaCola.shift(); guardar('mf-lista-cola', JSON.stringify(listaCola)); enviandoLista = false;
      if (LISTA && LISTA.id === r.id) { LISTA = reaplicarListaCola(r); guardar('mf-lista-' + r.id, JSON.stringify(r)); if (pantalla === 'lista' && !escribiendoLista()) pintar(); }
      if (listaCola.length) enviarListaCola();
    }, function (e) {
      enviandoLista = false;
      if (!e.red) { listaCola.shift(); guardar('mf-lista-cola', JSON.stringify(listaCola)); toast('⚠️ ' + (e.message || e)); refrescarLista(true); }
    });
  }
  function fotoSrc(fid, img) {
    if (!fid) return;
    if (fotosMem[fid]) { if (img) img.src = fotosMem[fid]; return; }
    try { var s = sessionStorage.getItem('mf-foto-' + fid); if (s) { fotosMem[fid] = s; if (img) img.src = s; return; } } catch (e) { /* nada */ }
    llamar('fotoLista', [fid]).then(function (d) { if (!d) return; fotosMem[fid] = d; try { sessionStorage.setItem('mf-foto-' + fid, d); } catch (e) { /* lleno */ } pintarFotos(); });
  }
  function pintarFotos() { Array.prototype.forEach.call(document.querySelectorAll('img[data-foto]'), function (i) { var f = i.getAttribute('data-foto'); if (fotosMem[f]) i.src = fotosMem[f]; else fotoSrc(f); }); }
  function miniFoto(it, accion) {
    return it.foto ? '<button class="mini-foto" onclick="' + accion + '"><img data-foto="' + esc(it.foto) + '" alt=""></button>'
      : '<button class="mini-foto vacia" onclick="' + accion + '" aria-label="Agregar foto">📷</button>';
  }
  function qtyTxt(it) { return it.q !== '' && it.q !== null && it.q !== undefined ? String(it.q).replace('.', ',') + ' ' + (it.u || 'u') : ''; }
  function grupos(items) {
    var g = {}; items.forEach(function (it) { var p = it.p || pasilloDe(it.n); (g[p] = g[p] || []).push(it); });
    return PASILLOS.filter(function (p) { return g[p]; }).map(function (p) { return [p, g[p]]; });
  }
  function pLista() {
    if (!LISTA) return ir('super');
    if (LISTA.tipo === 'tiendas') return pListaTienda();
    var L = LISTA, it = L.items || [], marc = it.filter(function (x) { return x.on; }).length;
    var h = cabSimple(esc(L.icono) + ' ' + esc(L.nombre), it.length + ' cosa' + (it.length === 1 ? '' : 's') + (L.token ? ' · 👥 compartida' : ''), 'App.ir(\'super\')');
    h += '<div class="chips desliza" style="margin:-6px 0 12px"><button class="chip' + (listaModo === 'super' ? ' on' : '') + '" onclick="App.modoLista(\'super\')">🛒 En el super</button><button class="chip' + (listaModo === 'editar' ? ' on' : '') + '" onclick="App.modoLista(\'editar\')">✏ Editar</button><button class="chip" onclick="App.compartirLista()">👥 Compartir</button><button class="chip" onclick="App.menuLista()">⋯</button></div>';
    if (L.cargando && !it.length) h += '<div class="caja vacio"><div class="spinner" style="margin:0 auto 10px"></div>Cargando…</div>';
    if (L.cambio && L.cambio.txt) h += '<div class="suave chico" style="margin:-4px 0 10px">● ' + esc(L.cambio.txt) + ' · ' + hace(L.cambio.cuando) + '</div>';
    // preguntas "¿este sirve?" que me toca responder (o que esperan respuesta)
    it.filter(function (x) { return x.consulta && !x.consulta.resp; }).forEach(function (x) {
      var mia = x.consulta.por === miNombre();
      h += '<div class="consulta-card"><div class="fila"><b>📷 ' + (mia ? 'Preguntaste' : esc(x.consulta.por) + ' pregunta') + ': ¿este sirve?</b><span class="suave chico">' + hace(x.consulta.cuando) + '</span></div><div class="suave chico">' + esc(x.n) + (qtyTxt(x) ? ' · ' + esc(qtyTxt(x)) : '') + '</div>' +
        '<div class="dos" style="margin-top:8px"><div><div class="suave chico">EL QUE PEDISTE</div>' + (x.foto ? '<img class="foto-c" data-foto="' + esc(x.foto) + '" alt="">' : '<div class="foto-c vacia">sin foto</div>') + '</div><div><div class="suave chico">EL QUE HAY</div>' + (x.consulta.foto ? '<img class="foto-c" data-foto="' + esc(x.consulta.foto) + '" alt="">' : '<div class="foto-c vacia">sin foto</div>') + '</div></div>' +
        (x.consulta.msg ? '<div class="msg-c">' + esc(x.consulta.por) + ': “' + esc(x.consulta.msg) + '”</div>' : '') +
        (mia ? '<div class="suave chico" style="margin-top:8px">⏳ Esperando respuesta…</div>' : '<div class="dos" style="margin-top:10px"><button class="btn" onclick="App.responderConsulta(\'' + x.id + '\',true)">✓ Sí, llevalo</button><button class="btn sec" onclick="App.responderConsulta(\'' + x.id + '\',false)">✗ No, dejalo</button></div>') + '</div>';
    });
    if (listaModo === 'editar') {
      h += '<div class="agregar-it"><input id="li-nuevo" placeholder="＋ Agregar… (ej. “2 kg arroz”)" autocomplete="off" onkeydown="if(event.key===\'Enter\')App.agregarItem()"><button class="btn chico" onclick="App.agregarItem()">Agregar</button></div>';
      if (!it.length && !L.cargando) h += '<div class="caja vacio">Escribí arriba lo que necesitás comprar.<br><button class="btn sec chico" style="margin-top:10px" onclick="App.agregarBasicos()">⭐ Agregar básicos</button></div>';
      grupos(it).forEach(function (g) {
        h += '<div class="seccion-t">' + IC_PASILLO[g[0]] + ' ' + esc(g[0]) + '</div><div class="caja sinpad">' + g[1].map(function (x) {
          return '<div class="it-ed">' + miniFoto(x, 'App.formItem(\'' + x.id + '\')') + '<button class="it-nom" onclick="App.formItem(\'' + x.id + '\')"><b>' + esc(x.n) + '</b>' + (x.nota ? '<span class="suave chico">' + esc(x.nota) + '</span>' : '') + '</button>' +
            '<span class="stepper"><button onclick="App.cantItem(\'' + x.id + '\',-1)" aria-label="Menos">−</button><b>' + (esc(qtyTxt(x)) || '—') + '</b><button class="mas" onclick="App.cantItem(\'' + x.id + '\',1)" aria-label="Más">+</button></span></div>';
        }).join('') + '</div>';
      });
      if (it.length) h += '<div class="chips" style="margin-top:12px;flex-wrap:wrap"><button class="chip" onclick="App.agregarBasicos()">⭐ Agregar básicos</button><button class="chip" onclick="App.loDeSiempre()">🔁 Lo de siempre</button></div>';
    } else {
      var pend = it.filter(function (x) { return !x.on; }), en = it.filter(function (x) { return x.on; });
      h += '<div class="caja" style="padding:12px 14px"><div class="fila" style="font-size:14px"><b>' + marc + ' de ' + it.length + ' en el carrito</b><span class="suave">' + (it.length - marc ? 'faltan ' + (it.length - marc) : 'listo ✓') + '</span></div>' + barra(it.length ? marc / it.length : 0, false) + '</div>';
      grupos(pend).forEach(function (g) {
        h += '<div class="seccion-t">' + IC_PASILLO[g[0]] + ' ' + esc(g[0]) + '</div><div class="caja sinpad">' + g[1].map(filaSuper).join('') + '</div>';
      });
      if (en.length) h += plegable('carrito', '✓ En el carrito (' + en.length + ')', '', '<div class="caja sinpad">' + en.map(filaSuper).join('') + '</div>');
      if (it.length) h += '<button class="btn" style="margin-top:14px;width:100%;justify-content:center" onclick="App.formTerminar()">Terminar compra</button>';
    }
    $('p-lista').innerHTML = h;
    pintarFotos(); cicloLista();
    if (listaModo === 'super') pantallaEncendida(true);
  }
  function filaSuper(x) {
    return '<div class="it-su' + (x.on ? ' on' : '') + '"><label class="it-check"><input type="checkbox"' + (x.on ? ' checked' : '') + ' onchange="App.marcarItem(\'' + x.id + '\',this.checked)" aria-label="' + esc(x.n) + '"></label>' +
      miniFoto(x, 'App.verItem(\'' + x.id + '\')') + '<button class="it-nom" onclick="App.verItem(\'' + x.id + '\')"><b>' + esc(x.n) + '</b>' +
      '<span class="suave chico">' + [x.nota ? esc(x.nota) : '', x.estado === 'nohay' ? '<span class="rojo">✗ ' + esc(x.por || '') + ': no hay</span>' : '', x.on && x.por && x.por !== miNombre() ? esc(x.por) + ' lo marcó' : ''].filter(String).join(' · ') + '</span></button>' +
      '<b class="it-q">' + esc(qtyTxt(x)) + '</b></div>';
  }
  function hace(iso) { var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); return s < 60 ? 'hace ' + Math.round(s) + ' s' : s < 3600 ? 'hace ' + Math.round(s / 60) + ' min' : s < 86400 ? 'hace ' + Math.round(s / 3600) + ' h' : fechaCorta(iso); }
  var wakeLock = null;
  function pantallaEncendida(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; w.addEventListener('release', function () { wakeLock = null; }); }).catch(function () { /* nada */ });
      if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
    } catch (e) { /* nada */ }
  }
  function modoLista(m) { listaModo = m; guardar('mf-lista-modo', m); if (m !== 'super') pantallaEncendida(false); pintar(); }
  function itemPor(id) { return (LISTA.items || []).filter(function (x) { return x.id === id; })[0]; }
  function marcarItem(id, on) { if (navigator.vibrate && on) { try { navigator.vibrate(15); } catch (e) { /* nada */ } } listaOp({ t: 'marcar', item: id, on: !!on }); }
  function agregarItem() {
    var d = LISTA.tipo === 'tiendas' ? TIENDAS.leer(val('li-nuevo'), LISTA.personas) : leerTextoItem(val('li-nuevo')); if (!d) return;
    var ya = (LISTA.items || []).filter(function (x) { return sinTildes(x.n) === sinTildes(d.n) && (x.para || '') === (d.para || ''); })[0];
    if (ya) { toast(d.n + ' ya está en la lista'); return; }
    listaOp({ t: 'agregar', datos: d }, 'Agregar ' + d.n);
    setTimeout(function () { var i = $('li-nuevo'); if (i) { i.value = ''; i.focus(); } }, 50);
  }
  function cantItem(id, d) {
    var x = itemPor(id); if (!x) return;
    var paso = x.u === 'kg' || x.u === 'L' ? 0.5 : x.u === 'g' || x.u === 'ml' ? 100 : 1;
    var q = Math.max(0, Math.round(((Number(x.q) || 0) + d * paso) * 100) / 100);
    listaOp({ t: 'editar', item: id, datos: { q: q || '', u: x.u || (q ? 'u' : '') } });
  }
  function formItem(id) {
    if (LISTA.tipo === 'tiendas') return formItemTienda(id);
    var x = id ? itemPor(id) : { n: '', q: '', u: 'u', p: 'Otros', nota: '', foto: '' };
    if (!x) return;
    abrir('<h2>' + (id ? esc(x.n) : 'Nueva cosa') + '</h2>' +
      '<div class="caja" style="flex-direction:row;gap:14px;align-items:center"><div class="foto-g' + (x.foto ? '' : ' vacia') + '" id="fi-prev">' + (x.foto ? '<img data-foto="' + esc(x.foto) + '" alt="">' : '📷') + '</div>' +
      '<div style="flex:1"><b>Foto (opcional)</b><div class="suave chico">Para no confundir marcas o tamaños</div><div class="chips" style="margin-top:8px;flex-wrap:wrap"><button class="chip" onclick="App.fotoItem(\'' + (id || '') + '\',true)">📷 Cámara</button><button class="chip" onclick="App.fotoItem(\'' + (id || '') + '\',false)">🖼 Galería</button>' + (x.foto ? '<button class="chip" onclick="App.quitarFotoItem(\'' + id + '\')">Quitar</button>' : '') + '</div></div></div>' +
      '<label class="campo"><span>Nombre</span><input id="fi-n" value="' + esc(x.n) + '"></label>' +
      '<div class="dos"><label class="campo"><span>Cantidad</span><input id="fi-q" inputmode="decimal" value="' + esc(String(x.q === '' || x.q === undefined ? '' : x.q).replace('.', ',')) + '"></label><label class="campo"><span>Unidad</span><select id="fi-u">' + UNIDADES.map(function (u) { return '<option' + ((x.u || 'u') === u ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="campo"><span>Pasillo</span><select id="fi-p">' + PASILLOS.map(function (p) { return '<option' + ((x.p || pasilloDe(x.n)) === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Nota</span><input id="fi-nota" placeholder="Ej. El de fresa, botella de 1 L" value="' + esc(x.nota || '') + '"></label>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarItem(\'' + (id || '') + '\')">Guardar</button>' + (id ? '<button class="btn sec peligro" id="fi-borrar" onclick="App.quitarItem(\'' + id + '\')">Quitar de la lista</button>' : '') + '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    pintarFotos();
  }
  function guardarItem(id) {
    var n = val('fi-n').trim(); if (!n) return toast('Escribí el nombre.');
    var d = LISTA.tipo === 'tiendas' ? datosItemTienda() : { n: n, q: C.leerNumero(val('fi-q')) || '', u: val('fi-u'), p: val('fi-p'), nota: val('fi-nota').trim() };
    if (id) listaOp({ t: 'editar', item: id, datos: d }, 'Cambiar ' + n); else listaOp({ t: 'agregar', datos: d }, 'Agregar ' + n);
    cerrar();
  }
  function quitarItem(id) { var b = $('fi-borrar'); if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Tocá otra vez'; return; } var x = itemPor(id); listaOp({ t: 'quitar', item: id }, 'Quitar ' + (x ? x.n : '')); cerrar(); }
  /** Foto: se achica en el teléfono (≈ 25–45 KB) y se guarda en tu hoja */
  function elegirFoto(camara) {
    return new Promise(function (ok, mal) {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (camara) inp.setAttribute('capture', 'environment');
      inp.onchange = function () { var f = inp.files && inp.files[0]; if (!f) return mal(new Error('sin foto')); achicarFoto(f).then(ok, mal); };
      inp.click();
    });
  }
  function achicarFoto(f) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(f), img = new Image();
      img.onload = function () {
        var lado = 520, q = 0.72, intento = 0, d;
        do {
          var e = Math.min(1, lado / Math.max(img.width, img.height)), c = document.createElement('canvas');
          c.width = Math.round(img.width * e); c.height = Math.round(img.height * e);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          d = c.toDataURL('image/jpeg', q); lado = Math.round(lado * 0.85); q = Math.max(0.45, q - 0.07); intento++;
        } while (d.length > 45000 && intento < 8);
        URL.revokeObjectURL(url);
        d.length > 47000 ? mal(new Error('La foto quedó muy grande.')) : ok(d);
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error('No se pudo leer la foto.')); };
      img.src = url;
    });
  }
  function fotoItem(id, camara) {
    elegirFoto(camara).then(function (d) {
      var p = $('fi-prev'); if (p) { p.className = 'foto-g'; p.innerHTML = '<img src="' + d + '" alt="">'; }
      toast('Subiendo la foto…');
      return llamar('subirFotoLista', [LISTA.id, d]).then(function (fid) {
        fotosMem[fid] = d;
        if (id) listaOp({ t: 'editar', item: id, datos: { foto: fid } }, 'Foto de ' + (itemPor(id) || {}).n);
        else { var dn = LISTA.tipo === 'tiendas' ? datosItemTienda() : { n: val('fi-n').trim() || 'Producto', q: C.leerNumero(val('fi-q')) || '', u: val('fi-u'), p: val('fi-p'), nota: val('fi-nota').trim() }; dn.n = dn.n || 'Producto'; dn.foto = fid; listaOp({ t: 'agregar', datos: dn }, 'Agregar ' + dn.n); cerrar(); }
        toast('✅ Foto guardada');
      });
    }).catch(function (e) { if (e && e.message !== 'sin foto') toast('⚠️ ' + e.message); });
  }
  function quitarFotoItem(id) { listaOp({ t: 'editar', item: id, datos: { foto: '' } }, 'Quitar foto'); cerrar(); }
  function verItem(id) {
    var x = itemPor(id); if (!x) return;
    var tienda = LISTA.tipo === 'tiendas';
    abrir('<div class="fila"><h2 style="margin:0">' + esc(x.n) + '</h2><b>' + (tienda ? (x.max ? '≤ ' + numTexto(Number(x.max)) : '') : esc(qtyTxt(x))) + '</b></div>' + (tienda && TIENDAS.etiquetas(x).length ? '<div class="tgs" style="margin:6px 0">' + TIENDAS.etiquetas(x).map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; }).join('') + '</div>' : '') + (x.nota ? '<div class="suave">“' + esc(x.nota) + '”</div>' : '') +
      (x.foto ? '<img class="foto-grande" data-foto="' + esc(x.foto) + '" alt="">' : '<div class="foto-grande vacia" onclick="App.cerrar();App.formItem(\'' + id + '\')">📷<span class="suave chico">Sin foto · tocá para agregar una</span></div>') +
      '<div class="acciones"><button class="btn" style="background:var(--positivo);border-color:var(--positivo);color:#111" onclick="App.cerrar();App.' + (x.enc ? 'marcarEnc' : 'marcarItem') + '(\'' + id + '\',true)">' + (tienda ? '✓ Lo compré' : '✓ Este es, va al carrito') + '</button>' +
      '<button class="btn sec" onclick="App.preguntarItem(\'' + id + '\')">📷 No está igual · ¿este sirve?</button><button class="btn sec" onclick="App.cerrar();App.noHayItem(\'' + id + '\')">✗ No hay</button></div>');
    pintarFotos();
  }
  function noHayItem(id) { listaOp({ t: 'nohay', item: id }, 'No hay'); }
  function preguntarItem(id) {
    elegirFoto(true).then(function (d) {
      abrir('<h2>📷 ¿Este sirve?</h2><img class="foto-grande" src="' + d + '" alt=""><label class="campo"><span>Mensaje corto (opcional)</span><input id="pq-msg" placeholder="Ej. No hay de fresa, ¿llevo de mora?"></label>' +
        '<div class="acciones"><button class="btn" id="pq-ok" onclick="App.enviarPregunta(\'' + id + '\')">Preguntar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
      preguntarItem.foto = d;
    }).catch(function (e) { if (e && e.message !== 'sin foto') toast('⚠️ ' + e.message); });
  }
  function enviarPregunta(id) {
    var d = preguntarItem.foto, b = $('pq-ok'); ocupar(b);
    llamar('subirFotoLista', [LISTA.id, d]).then(function (fid) { fotosMem[fid] = d; liberar(b, true); cerrar(); listaOp({ t: 'consulta', item: id, foto: fid, msg: val('pq-msg') }, '¿Este sirve?'); toast('📷 Pregunta enviada'); },
      function (e) { liberar(b, false); toast('⚠️ ' + (e.message || e)); });
  }
  function responderConsulta(id, si) { listaOp({ t: 'responder', item: id, si: !!si }, si ? 'Sí, llevalo' : 'No, dejalo'); }
  function agregarBasicos() {
    var ya = {}; (LISTA.items || []).forEach(function (x) { ya[sinTildes(x.n)] = 1; });
    var tienda = LISTA.tipo === 'tiendas', base = tienda ? TIENDAS.BASE : LISTA_BASE, icg = tienda ? TIENDAS.IC : IC_PASILLO;
    abrir('<h2>⭐ ' + (tienda ? 'Lo más común en tiendas' : 'Agregar básicos') + '</h2><div class="suave">Marcá lo que querés sumar a esta lista.</div>' + base.map(function (g) {
      var f = g[1].filter(function (n) { return !ya[sinTildes(n)]; });
      return f.length ? '<div class="seccion-t" style="margin-top:12px">' + icg[g[0]] + ' ' + g[0] + '</div>' + f.map(function (n) { return '<label class="check" style="margin-top:8px"><input type="checkbox" class="ab-it" data-p="' + esc(g[0]) + '" value="' + esc(n) + '"> ' + esc(n) + '</label>'; }).join('') : '';
    }).join('') + '<div class="acciones"><button class="btn" onclick="App.guardarBasicos()">Agregar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarBasicos() {
    var l = Array.prototype.filter.call(document.querySelectorAll('.ab-it'), function (x) { return x.checked; });
    l.forEach(function (x) { listaOp({ t: 'agregar', datos: { n: x.value, q: '', u: '', p: x.dataset.p } }, 'Agregar ' + x.value); });
    cerrar(); if (l.length) toast('✅ ' + l.length + ' agregadas');
  }
  function loDeSiempre() { toast('Lo de siempre: al terminar cada compra, la lista se conserva con sus cantidades. Solo se limpian las marcas.', 6000); }
  function compartirLista() {
    var L = LISTA;
    var pintarC = function (tok, impl) {
      var link = location.href.split(/[?#]/)[0].replace(/[^/]*$/, '') + 'lista.html#s=' + encodeURIComponent(impl) + '&k=' + encodeURIComponent(tok);
      compartirLista.link = link;
      abrir('<h2>👥 Compartir “' + esc(L.nombre) + '”</h2><div class="suave">Quien tenga el link ve y marca <b>solo esta lista</b>. No ve tus cuentas, sobres ni montos. No necesita instalar nada.</div>' +
        '<div class="caja" style="margin-top:12px;font-size:13px;word-break:break-all" class="suave">' + esc(link.replace(/k=(.{6}).*/, 'k=$1…')) + '</div>' +
        '<div class="dos"><button class="btn" onclick="App.enviarLink()">📤 Enviar</button><button class="btn sec" onclick="App.copiarLink()">Copiar</button></div>' +
        '<label class="check"><input type="checkbox"' + (L.editable !== false ? ' checked' : '') + ' onchange="App.listaEditable(this.checked)"> Pueden agregar, cambiar y quitar cosas</label>' +
        '<div class="acciones"><button class="btn sec" onclick="App.nuevoLink(this)">⟲ Cambiar link (el viejo deja de servir)</button><button class="btn sec peligro" onclick="App.dejarCompartir(this)">Dejar de compartir</button><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
    };
    abrir('<h2>👥 Compartir</h2><div class="caja vacio"><div class="spinner" style="margin:0 auto 10px"></div>Preparando el link…</div>');
    llamar('linkLista', [L.id, false]).then(function (r) { L.token = r.token; pintarC(r.token, r.implementacion); }, function (e) { cerrar(); toast('⚠️ ' + (e.message || e)); });
  }
  function enviarLink() {
    var url = compartirLista.link;
    if (navigator.share) navigator.share({ title: LISTA.nombre, text: '🛒 ' + LISTA.nombre + ': abrí la lista y marcá lo que vas metiendo al carrito', url: url }).catch(function () { /* cancelado */ });
    else copiarLink();
  }
  function copiarLink() { navigator.clipboard.writeText(compartirLista.link).then(function () { toast('📋 Link copiado'); }, function () { toast('No se pudo copiar'); }); }
  function listaEditable(on) { listaOp({ t: 'editable', on: !!on }, on ? 'Pueden editar' : 'Solo marcar'); }
  function nuevoLink(b) { ocupar(b); llamar('linkLista', [LISTA.id, true]).then(function (r) { liberar(b, true); LISTA.token = r.token; compartirLista(); toast('⟲ Link nuevo: el anterior ya no sirve'); }, function (e) { liberar(b, false); toast('⚠️ ' + (e.message || e)); }); }
  function dejarCompartir(b) { if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Tocá otra vez'; return; } srv('quitarLinkLista', [LISTA.id], function () { LISTA.token = ''; cerrar(); pintar(); toast('La lista ya no está compartida'); }, b); }
  function menuLista() {
    abrir('<h2>' + esc(LISTA.icono) + ' ' + esc(LISTA.nombre) + '</h2><label class="campo"><span>Nombre</span><input id="ml-n" value="' + esc(LISTA.nombre) + '"></label>' +
      '<label class="campo"><span>Tu nombre en las listas</span><input id="ml-yo" value="' + esc(miNombre()) + '"></label>' +
      (LISTA.tipo === 'tiendas' ? '<label class="campo"><span>Personas de la lista (separadas por coma)</span><input id="ml-personas" value="' + esc((LISTA.personas || []).join(', ')) + '"></label>' : '') +
      '<div class="acciones"><button class="btn" onclick="App.guardarMenuLista()">Guardar</button><button class="btn sec peligro" id="ml-borrar" onclick="App.borrarLista(this)">Borrar esta lista</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarMenuLista() {
    var n = val('ml-n').trim(), yo = val('ml-yo').trim();
    if (yo) guardar('mf-mi-nombre', yo.slice(0, 30));
    if (n && n !== LISTA.nombre) { LISTA.nombre = n; listaOp({ t: 'renombrar', nombre: n }, 'Renombrar lista'); }
    if ($('ml-personas')) { var ps = val('ml-personas').split(',').map(function (x) { return x.trim(); }).filter(String); if (ps.join('|') !== (LISTA.personas || []).join('|')) listaOp({ t: 'personas', personas: ps }, 'Personas de la lista'); }
    cerrar(); pintar();
  }
  function borrarLista(b) { if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Se borra para todos'; return; } srv('eliminarLista', [LISTA.id], function () { cerrar(); LISTA = null; LISTAS = null; ir('super'); toast('Lista borrada'); }, b); }
  // ---- v2.10.4 · listas de Tiendas y mall
  var vistaTienda = guardado('mf-lista-vista', 'persona');
  function gruposTienda(items, por) {
    var g = {}, orden = [];
    items.forEach(function (x) { var k = por === 'persona' ? (x.para || 'Sin asignar') : por === 'tienda' ? (x.tienda || 'Sin tienda') : (x.p || TIENDAS.seccionDe(x.n)); if (!g[k]) { g[k] = []; orden.push(k); } g[k].push(x); });
    if (por === 'seccion') orden = TIENDAS.SECCIONES.filter(function (k) { return g[k]; }).concat(orden.filter(function (k) { return TIENDAS.SECCIONES.indexOf(k) < 0; }));
    else if (por === 'persona') { var ps = (LISTA.personas || []).concat(['Todos']); orden.sort(function (a, b) { var ia = ps.indexOf(a), ib = ps.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); }); }
    else orden.sort(function (a, b) { return (a === 'Sin tienda') - (b === 'Sin tienda') || a.localeCompare(b, 'es'); });
    return orden.map(function (k) { return [k, g[k]]; });
  }
  function icGrupo(k, por) { return por === 'persona' ? (k === 'Todos' ? '👪' : k === 'Sin asignar' ? '•' : '👤') : por === 'tienda' ? '🏬' : (TIENDAS.IC[k] || '🛍'); }
  function pListaTienda() {
    var L = LISTA, todos = L.items || [], editar = listaModo === 'editar';
    var nEnc = todos.filter(function (x) { return x.enc; }).length, it = todos.filter(function (x) { return !x.enc; }), marc = it.filter(function (x) { return x.on; }).length;
    autoEncargos();
    var h = cabSimple(esc(L.icono) + ' ' + esc(L.nombre), '🛍 Tiendas y mall · ' + todos.length + ' cosa' + (todos.length === 1 ? '' : 's') + (L.token ? ' · 👥 compartida' : ''), 'App.ir(\'super\')');
    h += '<div class="tabs-lista"><button class="' + (tabTienda !== 'enc' ? 'on' : '') + '" onclick="App.tabLista(\'nuestras\')">🛍 Nuestras · ' + it.length + '</button><button class="' + (tabTienda === 'enc' ? 'on' : '') + '" onclick="App.tabLista(\'enc\')">📦 Encargos · ' + nEnc + '</button></div>';
    if (tabTienda === 'enc') { $('p-lista').innerHTML = h + htmlEncargos(editar); pintarFotos(); cicloLista(); return; }
    h += '<div class="chips desliza" style="margin:-6px 0 8px"><button class="chip' + (!editar ? ' on' : '') + '" onclick="App.modoLista(\'super\')">🛍 Comprando</button><button class="chip' + (editar ? ' on' : '') + '" onclick="App.modoLista(\'editar\')">✏ Editar</button><button class="chip" onclick="App.compartirLista()">👥 Compartir</button><button class="chip" onclick="App.menuLista()">⋯</button></div>';
    h += '<div class="chips" style="margin:0 0 10px">' + [['persona', 'Por persona'], ['seccion', 'Por sección'], ['tienda', 'Por tienda']].map(function (v) { return '<button class="chip' + (vistaTienda === v[0] ? ' on' : '') + '" onclick="App.vistaLista(\'' + v[0] + '\')">' + v[1] + '</button>'; }).join('') + '</div>';
    if (L.cargando && !it.length) h += '<div class="caja vacio"><div class="spinner" style="margin:0 auto 10px"></div>Cargando…</div>';
    if (L.cambio && L.cambio.txt) h += '<div class="suave chico" style="margin:-4px 0 10px">● ' + esc(L.cambio.txt) + ' · ' + hace(L.cambio.cuando) + '</div>';
    it.filter(function (x) { return x.consulta && !x.consulta.resp; }).forEach(function (x) {
      var mia = x.consulta.por === miNombre();
      h += '<div class="consulta-card"><div class="fila"><b>📷 ' + (mia ? 'Preguntaste' : esc(x.consulta.por) + ' pregunta') + ': ¿este sirve?</b><span class="suave chico">' + hace(x.consulta.cuando) + '</span></div><div class="suave chico">' + esc(x.n) + (TIENDAS.etiquetas(x).length ? ' · ' + esc(TIENDAS.etiquetas(x).join(' · ')) : '') + '</div>' +
        '<div class="dos" style="margin-top:8px"><div><div class="suave chico">EL QUE SE PIDIÓ</div>' + (x.foto ? '<img class="foto-c" data-foto="' + esc(x.foto) + '" alt="">' : '<div class="foto-c vacia">sin foto</div>') + '</div><div><div class="suave chico">EL QUE HAY</div>' + (x.consulta.foto ? '<img class="foto-c" data-foto="' + esc(x.consulta.foto) + '" alt="">' : '<div class="foto-c vacia">sin foto</div>') + '</div></div>' +
        (x.consulta.msg ? '<div class="msg-c">' + esc(x.consulta.por) + ': “' + esc(x.consulta.msg) + '”</div>' : '') +
        (mia ? '<div class="suave chico" style="margin-top:8px">⏳ Esperando respuesta…</div>' : '<div class="dos" style="margin-top:10px"><button class="btn" onclick="App.responderConsulta(\'' + x.id + '\',true)">✓ Sí, llevalo</button><button class="btn sec" onclick="App.responderConsulta(\'' + x.id + '\',false)">✗ No, dejalo</button></div>') + '</div>';
    });
    if (editar) {
      h += '<div class="agregar-it"><input id="li-nuevo" placeholder="＋ Agregar… (ej. “tenis talla 9 negros para ' + esc((L.personas || [])[0] || 'Ana') + '”)" autocomplete="off" onkeydown="if(event.key===\'Enter\')App.agregarItem()"><button class="btn chico" onclick="App.agregarItem()">Agregar</button></div>';
      if (!it.length && !L.cargando) h += '<div class="caja vacio">Escribí arriba lo que quieren comprar.<br><button class="btn sec chico" style="margin-top:10px" onclick="App.agregarBasicos()">⭐ Lo más común en tiendas</button></div>';
    } else {
      var gastado = it.reduce(function (a, x) { return a + (x.on && x.pagado ? Number(x.pagado) : 0); }, 0);
      h += '<div class="caja" style="padding:12px 14px"><div class="fila" style="font-size:14px"><b>✓ ' + marc + ' de ' + it.length + ' comprado' + (marc === 1 ? '' : 's') + '</b><span class="suave">' + (it.length - marc ? 'faltan ' + (it.length - marc) : 'listo ✓') + '</span></div>' + barra(it.length ? marc / it.length : 0, false) +
        (gastado ? '<div class="fila" style="font-size:14px;margin-top:6px"><span>Gastado hasta ahora</span><b>' + numTexto(gastado) + '</b></div>' : '') + '</div>';
    }
    var pend = editar ? it : it.filter(function (x) { return !x.on; }), en = editar ? [] : it.filter(function (x) { return x.on; });
    gruposTienda(pend, vistaTienda).forEach(function (g) {
      h += '<div class="seccion-t">' + icGrupo(g[0], vistaTienda) + ' ' + esc(g[0]).toUpperCase() + ' · ' + g[1].length + '</div><div class="caja sinpad">' + g[1].map(function (x) { return filaTienda(x, editar); }).join('') + '</div>';
    });
    if (en.length) h += plegable('carrito', '✓ Comprado (' + en.length + ')', '', '<div class="caja sinpad">' + en.map(function (x) { return filaTienda(x, false); }).join('') + '</div>');
    if (editar && it.length) h += '<div class="chips" style="margin-top:12px;flex-wrap:wrap"><button class="chip" onclick="App.agregarBasicos()">⭐ Lo más común en tiendas</button><button class="chip" onclick="App.formItem()">＋ Con detalles</button></div>';
    if (!editar && it.length) h += '<button class="btn" style="margin-top:14px;width:100%;justify-content:center" onclick="App.formTerminar()">Terminar compras</button>';
    $('p-lista').innerHTML = h;
    pintarFotos(); cicloLista();
    if (!editar) pantallaEncendida(true);
  }
  function filaTienda(x, editar) {
    var tags = TIENDAS.etiquetas(x, vistaTienda === 'persona').map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; });
    if (vistaTienda !== 'seccion') tags.unshift('<span class="tg">' + (TIENDAS.IC[x.p] || '🛍') + ' ' + esc(x.p || TIENDAS.seccionDe(x.n)) + '</span>');
    var der = x.on && x.pagado ? '<b class="it-q verde-pos">' + numTexto(Number(x.pagado)) + '</b>' : x.on && !editar ? '<button class="mini-btn" onclick="App.formPagado(\'' + x.id + '\')">＋ $</button>' : x.max ? '<b class="it-q">≤ ' + numTexto(Number(x.max)) + '</b>' : '';
    var det = [x.nota ? esc(x.nota) : '', x.estado === 'nohay' ? '<span class="rojo">✗ ' + esc(x.por || '') + ': no hay</span>' : '', x.on && x.por && x.por !== miNombre() ? esc(x.por) + ' lo compró' : ''].filter(String).join(' · ');
    return '<div class="it-su' + (x.on ? ' on' : '') + '">' + (editar ? '' : '<label class="it-check"><input type="checkbox"' + (x.on ? ' checked' : '') + ' onchange="App.marcarItem(\'' + x.id + '\',this.checked)" aria-label="' + esc(x.n) + '"></label>') +
      miniFoto(x, editar ? 'App.formItem(\'' + x.id + '\')' : 'App.verItem(\'' + x.id + '\')') + '<button class="it-nom" onclick="App.' + (editar ? 'formItem' : 'verItem') + '(\'' + x.id + '\')"><b>' + esc(x.n) + '</b><span class="tgs">' + tags.join('') + '</span>' + (det ? '<span class="suave chico">' + det + '</span>' : '') + '</button>' + der + '</div>';
  }
  function vistaLista(v) { vistaTienda = v; guardar('mf-lista-vista', v); pintar(); }
  // ---- v2.10.5 · 📦 Encargos
  var tabTienda = guardado('mf-lista-tab', 'nuestras'), vistaEnc = guardado('mf-enc-vista', 'persona');
  function tabLista(t) { tabTienda = t; guardar('mf-lista-tab', t); pintar(); }
  function vistaEncargos(v) { vistaEnc = v; guardar('mf-enc-vista', v); pintar(); }
  function encargante(n) { return (LISTA.encargantes || []).filter(function (e) { return e.n === n; })[0] || { n: n, adelanto: 0, moneda: 'USD', estado: '' }; }
  function cuentaEnc(n) {
    var e = encargante(n), its = (LISTA.items || []).filter(function (x) { return x.enc === n; });
    var gastado = its.reduce(function (a, x) { return a + (x.on && x.pagado ? Number(x.pagado) : 0); }, 0), saldo = (e.adelanto || 0) - gastado;
    return { e: e, its: its, gastado: Math.round(gastado * 100) / 100, saldo: Math.round(saldo * 100) / 100, mon: e.moneda || 'USD' };
  }
  function plataL(n, mon) { return txt(n, mon || 'USD'); }
  var EST_ENC = { '': '', entregado: 'Entregado', cobrado: 'Cobrado ✓', medeben: 'En Me deben' };
  function chipEstado(t) { var c = { Pendiente: 'pend', Comprado: 'comp', 'No había': 'nohay', Entregado: 'entr', 'Cobrado ✓': 'cobr', 'En Me deben': 'entr' }[t] || 'pend'; return '<span class="est-enc ' + c + '">' + t + '</span>'; }
  function estadoItem(x) { return x.on ? 'Comprado' : x.estado === 'nohay' ? 'No había' : 'Pendiente'; }
  function htmlEncargos(editar) {
    var L = LISTA, its = (L.items || []).filter(function (x) { return x.enc; }), h = '';
    h += '<div class="chips desliza" style="margin:0 0 8px"><button class="chip' + (!editar ? ' on' : '') + '" onclick="App.modoLista(\'super\')">🛍 Comprando</button><button class="chip' + (editar ? ' on' : '') + '" onclick="App.modoLista(\'editar\')">✏ Editar</button><button class="chip" onclick="App.cuentasEncargos()">🧾 Cuentas</button><button class="chip" onclick="App.compartirLista()">👥 Compartir</button></div>';
    h += '<div class="chips" style="margin:0 0 10px">' + [['persona', 'Por persona'], ['tienda', 'Por tienda'], ['estado', 'Por estado']].map(function (v) { return '<button class="chip' + (vistaEnc === v[0] ? ' on' : '') + '" onclick="App.vistaEncargos(\'' + v[0] + '\')">' + v[1] + '</button>'; }).join('') + '</div>';
    if (!its.length && !(L.encargantes || []).length) h += '<div class="vacio-lindo"><div style="font-size:42px">📦</div><b>Encargos de otras personas</b><span>Anotá lo que te piden traer, con su adelanto. Al volver, la app te arma la cuenta de cada quien.</span></div>';
    if (vistaEnc === 'persona') {
      var nombres = (L.encargantes || []).map(function (e) { return e.n; }); its.forEach(function (x) { if (nombres.indexOf(x.enc) < 0) nombres.push(x.enc); });
      nombres.forEach(function (n) {
        var c = cuentaEnc(n), e = c.e;
        var der = e.adelanto ? (c.saldo >= 0 ? '<div style="text-align:right"><div class="suave" style="font-size:11px">quedan del adelanto</div><b class="verde-pos">' + plataL(c.saldo, c.mon) + '</b></div>' : '<div style="text-align:right"><div class="suave" style="font-size:11px">te debe</div><b class="acento">' + plataL(-c.saldo, c.mon) + '</b></div>')
          : c.gastado ? '<div style="text-align:right"><div class="suave" style="font-size:11px">te debe</div><b class="acento">' + plataL(c.gastado, c.mon) + '</b></div>' : '';
        h += '<div class="caja enc-card"><div class="fila" style="align-items:center"><button class="enc-nom" onclick="App.formEncargante(\'' + q(n) + '\')"><b>📦 ' + esc(n) + '</b><span class="suave chico">' + c.its.length + ' cosa' + (c.its.length === 1 ? '' : 's') + ' · ' + (e.adelanto ? 'adelantó ' + plataL(e.adelanto, c.mon) : 'sin adelanto') + (EST_ENC[e.estado] ? ' · ' + EST_ENC[e.estado] : '') + '</span></button>' + der + '</div>' +
          c.its.map(function (x) { return filaEnc(x, editar, true); }).join('') +
          '<button class="enlace-mini" style="margin-top:6px" onclick="App.formEncargo(\'\',\'' + q(n) + '\')">＋ Otro encargo de ' + esc(n) + '</button></div>';
      });
    } else {
      var g = {}, orden = [];
      its.forEach(function (x) { var k = vistaEnc === 'tienda' ? (x.tienda || 'Sin tienda') : estadoItem(x); if (!g[k]) { g[k] = []; orden.push(k); } g[k].push(x); });
      if (vistaEnc === 'estado') orden = ['Pendiente', 'Comprado', 'No había'].filter(function (k) { return g[k]; });
      orden.forEach(function (k) { h += '<div class="seccion-t">' + (vistaEnc === 'tienda' ? '🏬 ' : '') + esc(k).toUpperCase() + ' · ' + g[k].length + '</div><div class="caja sinpad">' + g[k].map(function (x) { return filaEnc(x, editar, false); }).join('') + '</div>'; });
    }
    h += '<button class="btn-dash" onclick="App.formEncargo()">＋ Nuevo encargo</button>';
    return h;
  }
  function filaEnc(x, editar, enCard) {
    var tags = [(TIENDAS.IC[x.p] || '🛍') + ' ' + (x.p || TIENDAS.seccionDe(x.n))].concat(enCard ? [] : ['📦 ' + x.enc]).concat(TIENDAS.etiquetas(x, true)).map(function (t) { return '<span class="tg">' + esc(t) + '</span>'; });
    tags.push(chipEstado(estadoItem(x)));
    if (x.mov) tags.push('<span class="tg">👛 ligado</span>');
    var mon = encargante(x.enc).moneda;
    var der = x.on && x.pagado ? '<b class="it-q verde-pos">' + plataL(Number(x.pagado), mon) + '</b>' : x.on ? '<button class="mini-btn" onclick="App.formPagadoEnc(\'' + x.id + '\')">＋ $</button>' : x.max ? '<b class="it-q">≤ ' + plataL(Number(x.max), mon) + '</b>' : '';
    return '<div class="it-su' + (x.on ? ' on' : '') + (enCard ? ' en-card' : '') + '">' + (editar ? '' : '<label class="it-check"><input type="checkbox"' + (x.on ? ' checked' : '') + ' onchange="App.marcarEnc(\'' + x.id + '\',this.checked)" aria-label="' + esc(x.n) + '"></label>') +
      miniFoto(x, editar ? 'App.formEncargo(\'' + x.id + '\')' : 'App.verItem(\'' + x.id + '\')') + '<button class="it-nom" onclick="App.' + (editar ? 'formEncargo' : 'verItem') + '(\'' + x.id + '\')"><b>' + esc(x.n) + '</b><span class="tgs">' + tags.join('') + '</span>' + (x.nota ? '<span class="suave chico">' + esc(x.nota) + '</span>' : '') + '</button>' + der + '</div>';
  }
  /** Marcar un encargo: pide el costo y con qué se pagó */
  function marcarEnc(id, on) { if (!on) return listaOp({ t: 'marcar', item: id, on: false }); formPagadoEnc(id); }
  function mediosPago() { return D ? D.cuentas.filter(function (c) { return c.activa && (c.tipo === 'Tarjeta de crédito' || C.esAhorro(c)); }).map(function (c) { return c.nombre; }) : []; }
  function formPagadoEnc(id) {
    var x = itemPor(id); if (!x) return;
    var e = encargante(x.enc), medios = mediosPago(), sel = x.medio || guardado('mf-enc-medio', '') || 'Efectivo';
    abrir('<div class="suave chico">📦 ' + esc(x.enc) + '</div><h2>✓ ' + esc(x.n) + '</h2><div class="suave">¿Cuánto costó?</div>' +
      '<label class="campo"><span>Pagado (' + (e.moneda === 'CRC' ? '₡' : '$') + ')</span><input id="pe-m" class="monto" data-dinero inputmode="decimal" value="' + (x.pagado ? String(x.pagado).replace('.', ',') : '') + '"></label>' +
      '<div class="suave chico">¿Con qué pagaste?</div><div class="chips" id="pe-medios" style="margin-top:6px">' + medios.concat(['Efectivo']).map(function (m) { return '<button type="button" class="chip' + (m === sel ? ' on' : '') + '" data-v="' + esc(m) + '" onclick="App.peMedio(this)">' + (m === 'Efectivo' ? '💵 Efectivo' : '💳 ' + esc(etiquetaCuenta(m))) + '</button>'; }).join('') + '</div>' +
      '<div class="suave chico" style="margin-top:6px">Si es con tarjeta, cuando llegue el correo del banco la compra se marca sola “para ' + esc(x.enc) + '” en Me deben.</div>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarPagadoEnc(\'' + id + '\')">Guardar</button><button class="btn sec" onclick="App.cerrar();App.noHayItem(\'' + id + '\')">✗ No lo encontré</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    PE.medio = sel;
    setTimeout(function () { var i = $('pe-m'); if (i) i.focus(); }, 120);
  }
  var PE = { medio: '' };
  function peMedio(b) { PE.medio = b.dataset.v; Array.prototype.forEach.call(b.parentNode.children, function (c) { c.classList.toggle('on', c === b); }); }
  function guardarPagadoEnc(id) {
    var m = C.leerNumero(val('pe-m')) || 0;
    guardar('mf-enc-medio', PE.medio);
    listaOp({ t: 'pagado', item: id, monto: m, medio: PE.medio }, 'Encargo pagado');
    if (!m) listaOp({ t: 'marcar', item: id, on: true });
    cerrar();
  }
  var FE = null;
  function formEncargo(id, de) {
    var x = id ? itemPor(id) : { n: '', p: '', enc: de || (LISTA.encargantes || []).slice(-1).map(function (e) { return e.n; })[0] || '', talla: '', color: '', q: '', max: '', tienda: '', nota: '', foto: '' };
    if (!x) return;
    FE = { p: x.p || 'Otros', enc: x.enc, nueva: !(LISTA.encargantes || []).length, manual: !!id };
    var ens = (LISTA.encargantes || []).map(function (e) { return e.n; });
    abrir('<h2>' + (id ? esc(x.n) : 'Nuevo encargo') + '</h2>' +
      '<div class="suave chico">¿De parte de quién?</div><div class="chips" id="fe-de" style="margin:6px 0">' + ens.map(function (n) { return '<button type="button" class="chip' + (n === FE.enc && !FE.nueva ? ' on' : '') + '" data-v="' + esc(n) + '" onclick="App.feDe(this)">📦 ' + esc(n) + '</button>'; }).join('') + '<button type="button" class="chip' + (FE.nueva ? ' on' : '') + '" data-v="" onclick="App.feDe(this)">＋ Otra persona</button></div>' +
      '<div id="fe-nueva" style="' + (FE.nueva ? '' : 'display:none') + '"><div class="caja" style="gap:6px"><b>Persona nueva</b><label class="campo compacto"><span>Nombre</span><input id="fe-nom" placeholder="Ej. Tía Marta"></label>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Adelanto que te dio (opcional)</span><input id="fe-ad" class="monto" data-dinero inputmode="decimal"></label><label class="campo compacto"><span>Moneda</span><select id="fe-mon"><option value="USD">$</option><option value="CRC">₡</option></select></label></div></div></div>' +
      '<div class="caja" style="flex-direction:row;gap:14px;align-items:center"><div class="foto-g' + (x.foto ? '' : ' vacia') + '" id="fi-prev">' + (x.foto ? '<img data-foto="' + esc(x.foto) + '" alt="">' : '📷') + '</div>' +
      '<div style="flex:1"><b>Foto o captura</b><div class="suave chico">La que te mandó la persona</div><div class="chips" style="margin-top:8px;flex-wrap:wrap"><button class="chip" onclick="App.fotoEncargo(\'' + (id || '') + '\',true)">📷 Cámara</button><button class="chip" onclick="App.fotoEncargo(\'' + (id || '') + '\',false)">🖼 Galería</button></div></div></div>' +
      '<label class="campo"><span>Qué</span><input id="fi-n" value="' + esc(x.n) + '" placeholder="Ej. Audífonos inalámbricos" oninput="App.feAuto(this.value)"></label>' +
      '<div class="suave chico">Sección</div><div class="chips" id="fe-secs" style="margin:6px 0 4px">' + TIENDAS.SECCIONES.map(function (sx) { return '<button type="button" class="chip' + (FE.p === sx ? ' on' : '') + '" data-v="' + esc(sx) + '" onclick="App.feSec(this)">' + TIENDAS.IC[sx] + ' ' + sx + '</button>'; }).join('') + '</div>' +
      '<div class="dos"><label class="campo compacto"><span>Talla / modelo</span><input id="fi-talla" value="' + esc(x.talla || '') + '"></label><label class="campo compacto"><span>Color</span><input id="fi-color" value="' + esc(x.color || '') + '"></label></div>' +
      '<div class="dos"><label class="campo compacto"><span>Cantidad</span><input id="fi-q" inputmode="numeric" value="' + esc(x.q === '' || x.q === undefined ? '' : String(x.q)) + '" placeholder="1"></label><label class="campo compacto"><span>Precio máximo</span><input id="fi-max" class="monto" data-dinero inputmode="decimal" value="' + (x.max ? String(x.max).replace('.', ',') : '') + '"></label></div>' +
      '<label class="campo compacto"><span>Tienda (opcional)</span><input id="fi-tienda" value="' + esc(x.tienda || '') + '"></label>' +
      '<label class="campo compacto"><span>Nota</span><input id="fi-nota" value="' + esc(x.nota || '') + '" placeholder="Ej. Si no hay negro, blanco está bien"></label>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarEncargo(\'' + (id || '') + '\')">' + (id ? 'Guardar' : 'Agregar encargo') + '</button>' + (id ? '<button class="btn sec peligro" id="fi-borrar" onclick="App.quitarItem(\'' + id + '\')">Quitar encargo</button>' : '') + '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    pintarFotos();
  }
  function feDe(b) { FE.enc = b.dataset.v; FE.nueva = !b.dataset.v; Array.prototype.forEach.call(b.parentNode.children, function (c) { c.classList.toggle('on', c === b); }); $('fe-nueva').style.display = FE.nueva ? '' : 'none'; }
  function feSec(b) { FE.p = b.dataset.v; FE.manual = true; Array.prototype.forEach.call(b.parentNode.children, function (c) { c.classList.toggle('on', c === b); }); }
  function feAuto(v) { if (FE.manual) return; FE.p = TIENDAS.seccionDe(v); var c = $('fe-secs'); if (c) Array.prototype.forEach.call(c.children, function (x) { x.classList.toggle('on', x.dataset.v === FE.p); }); }
  function datosEncargo() {
    return { n: val('fi-n').trim(), q: Number(val('fi-q')) || '', u: Number(val('fi-q')) ? 'u' : '', p: FE.p || 'Otros', enc: FE.enc, talla: val('fi-talla').trim(), color: val('fi-color').trim(), max: C.leerNumero(val('fi-max')) || '', tienda: val('fi-tienda').trim(), nota: val('fi-nota').trim() };
  }
  /** Si es persona nueva, la crea; devuelve false si falta el nombre */
  function asegurarEncargante() {
    if (!FE.nueva) return !!FE.enc || (toast('Elegí de parte de quién.'), false);
    var n = val('fe-nom').trim(); if (!n) { toast('Escribí el nombre de la persona.'); return false; }
    if (!(LISTA.encargantes || []).some(function (e) { return e.n === n; })) listaOp({ t: 'encargante', datos: { n: n, adelanto: C.leerNumero(val('fe-ad')) || 0, moneda: val('fe-mon') } }, 'Encargos de ' + n);
    FE.enc = n; FE.nueva = false; return true;
  }
  function guardarEncargo(id) {
    if (!val('fi-n').trim()) return toast('Escribí qué hay que traer.');
    if (!asegurarEncargante()) return;
    var d = datosEncargo();
    if (id) listaOp({ t: 'editar', item: id, datos: d }, 'Cambiar ' + d.n); else listaOp({ t: 'agregar', datos: d }, 'Encargo de ' + d.enc + ': ' + d.n);
    cerrar(); if (tabTienda !== 'enc') tabLista('enc');
  }
  function fotoEncargo(id, camara) {
    if (!id && !val('fi-n').trim()) return toast('Primero escribí qué hay que traer.');
    if (!id && !asegurarEncargante()) return;
    elegirFoto(camara).then(function (d) {
      var p = $('fi-prev'); if (p) { p.className = 'foto-g'; p.innerHTML = '<img src="' + d + '" alt="">'; }
      toast('Subiendo la foto…');
      return llamar('subirFotoLista', [LISTA.id, d]).then(function (fid) {
        fotosMem[fid] = d;
        if (id) listaOp({ t: 'editar', item: id, datos: { foto: fid } }, 'Foto del encargo');
        else { var dn = datosEncargo(); dn.foto = fid; listaOp({ t: 'agregar', datos: dn }, 'Encargo de ' + dn.enc + ': ' + dn.n); cerrar(); }
        toast('✅ Foto guardada');
      });
    }).catch(function (e) { if (e && e.message !== 'sin foto') toast('⚠️ ' + e.message); });
  }
  function formEncargante(n) {
    var e = encargante(n);
    abrir('<h2>📦 ' + esc(n) + '</h2><label class="campo"><span>Nombre</span><input id="fen-n" value="' + esc(n) + '"></label>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Adelanto que te dio</span><input id="fen-ad" class="monto" data-dinero inputmode="decimal" value="' + (e.adelanto ? String(e.adelanto).replace('.', ',') : '') + '"></label><label class="campo compacto"><span>Moneda</span><select id="fen-mon"><option value="USD"' + (e.moneda !== 'CRC' ? ' selected' : '') + '>$</option><option value="CRC"' + (e.moneda === 'CRC' ? ' selected' : '') + '>₡</option></select></label></div>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarEncargante(\'' + q(n) + '\')">Guardar</button><button class="btn sec peligro" id="fen-borrar" onclick="App.quitarEncargante(\'' + q(n) + '\')">Quitar a ' + esc(n) + ' y sus encargos</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarEncargante(antes) {
    var e = encargante(antes), n = val('fen-n').trim() || antes;
    listaOp({ t: 'encargante', antes: antes, datos: { n: n, adelanto: C.leerNumero(val('fen-ad')) || 0, moneda: val('fen-mon'), estado: e.estado || '' } }, 'Encargos de ' + n); cerrar();
  }
  function quitarEncargante(n) { var b = $('fen-borrar'); if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Se borran sus encargos'; return; } listaOp({ t: 'quitarEncargante', n: n }, 'Quitar encargos de ' + n); cerrar(); }
  /** 🧾 Cuentas por persona */
  function cuentasEncargos() {
    var nombres = (LISTA.encargantes || []).map(function (e) { return e.n; });
    (LISTA.items || []).forEach(function (x) { if (x.enc && nombres.indexOf(x.enc) < 0) nombres.push(x.enc); });
    if (!nombres.length) return toast('Todavía no hay encargos.');
    var tc = D && D.tipoCambio;
    abrir('<h2>🧾 Cuentas por persona</h2>' + nombres.map(function (n) {
      var c = cuentaEnc(n), e = c.e, total = c.gastado;
      var lin = function (a, b, cls) { return '<div class="fila chico"><span>' + a + '</span><span class="' + (cls || '') + '">' + b + '</span></div>'; };
      var debe = e.adelanto ? -c.saldo : total, enColones = c.mon === 'USD' && tc ? ' · ' + txt(Math.abs(debe) * tc, 'CRC') : '';
      return '<div class="caja" style="gap:3px;margin-top:10px"><div class="fila"><b>📦 ' + esc(n) + '</b>' + (EST_ENC[e.estado] ? chipEstado(EST_ENC[e.estado]) : '') + '</div>' +
        c.its.map(function (x) { return x.on ? lin(esc(x.n) + (x.q > 1 ? ' (' + x.q + ')' : ''), x.pagado ? plataL(Number(x.pagado), c.mon) : '<span class="acento">falta el precio</span>') : lin('<span class="suave">' + esc(x.n) + ' · ' + (x.estado === 'nohay' ? 'no lo encontré' : 'pendiente') + '</span>', '<span class="suave">—</span>'); }).join('') +
        '<div style="border-top:1px solid var(--linea);margin-top:4px;padding-top:4px">' + lin('Total', '<b>' + plataL(total, c.mon) + '</b>') + lin('Adelanto', e.adelanto ? '−' + plataL(e.adelanto, c.mon) : plataL(0, c.mon)) +
        (debe > 0.004 ? lin('<b>Te debe</b>', '<b class="acento">' + plataL(debe, c.mon) + enColones + '</b>') : debe < -0.004 ? lin('<b>Le sobran</b>', '<b class="verde-pos">' + plataL(-debe, c.mon) + enColones + '</b>') : lin('<b>Quedan a mano</b>', '<b class="verde-pos">✓</b>')) + '</div>' +
        '<div class="chips" style="margin-top:6px">' + chipRev('↗ Mandar cuenta', 'App.mandarCuentaEnc(\'' + q(n) + '\')') + chipRev(e.estado === 'entregado' ? '✓ Entregado' : '📦 Entregado', 'App.estadoEnc(\'' + q(n) + '\',\'entregado\')', e.estado === 'entregado') +
        (debe > 0.004 ? chipRev('👛 Pasar a Me deben', 'App.pasarMeDeben(\'' + q(n) + '\')', e.estado === 'medeben') : '') + chipRev('✓ Cerrar cuenta', 'App.estadoEnc(\'' + q(n) + '\',\'cobrado\')', e.estado === 'cobrado') + '</div></div>';
    }).join('') + '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }
  function textoCuentaEnc(n) {
    var c = cuentaEnc(n), e = c.e, tc = D && D.tipoCambio, debe = e.adelanto ? -c.saldo : c.gastado;
    var comprados = c.its.filter(function (x) { return x.on; }), faltaron = c.its.filter(function (x) { return !x.on; });
    return 'Hola ' + n.split(' ')[0] + ' 👋 Te traje: ' + comprados.map(function (x) { return x.n + (x.pagado ? ' ' + plataL(Number(x.pagado), c.mon) : ''); }).join(' · ') + '.' +
      (faltaron.length ? ' No encontré: ' + faltaron.map(function (x) { return x.n; }).join(', ') + '.' : '') +
      ' Total ' + plataL(c.gastado, c.mon) + (e.adelanto ? ', me diste ' + plataL(e.adelanto, c.mon) : '') + '. ' +
      (debe > 0.004 ? 'Quedan ' + plataL(debe, c.mon) + (c.mon === 'USD' && tc ? ' (' + txt(debe * tc, 'CRC') + ' al tipo de cambio de hoy)' : '') + '.' : debe < -0.004 ? 'Te sobran ' + plataL(-debe, c.mon) + '.' : 'Quedamos a mano 👍');
  }
  function mandarCuentaEnc(n) {
    var t = textoCuentaEnc(n);
    if (navigator.share) navigator.share({ title: 'Encargos de ' + n, text: t }).catch(function () { /* cancelado */ });
    else navigator.clipboard.writeText(t).then(function () { toast('📋 Cuenta copiada'); }, function () { toast('No se pudo copiar'); });
  }
  function estadoEnc(n, est) { var e = encargante(n); listaOp({ t: 'encargante', antes: n, datos: { n: n, adelanto: e.adelanto || 0, moneda: e.moneda || 'USD', estado: e.estado === est ? '' : est } }, 'Encargos de ' + n); cuentasEncargos(); }
  /** Busca en tus movimientos la compra con tarjeta de un encargo (mismo monto, últimos 45 días) */
  function movDeEncargo(x, usados) {
    if (!D || !x.on || !x.pagado || !x.medio || x.medio === 'Efectivo') return null;
    var mon = encargante(x.enc).moneda, lim = new Date(hoy.getTime() - 45 * 86400000), p = Number(x.pagado);
    var cand = D.movimientos.filter(function (m) {
      if (m.fila <= 0 || m.tipo !== 'Gasto' || m.para || usados[m.fila] || C.normNom(m.cuenta) !== C.normNom(x.medio) || !m.fecha || new Date(m.fecha) < lim) return false;
      var orig = (m.nota || '').match(/cobro original \$([\d.,]+)/i), mo = orig ? C.leerNumero(orig[1]) : null;
      if (mon === 'USD' && mo !== null) return Math.abs(mo - p) <= Math.max(0.5, p * 0.02);
      return m.moneda === mon && Math.abs(m.monto - p) <= Math.max(0.5, p * 0.02);
    }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    return cand[0] || null;
  }
  /** Llegó el correo de una compra de encargo → queda "para otra persona" (Me deben) y ligada */
  function autoEncargos() {
    if (!LISTA || LISTA.tipo !== 'tiendas' || !D) return 0;
    var usados = {}, n = 0;
    (LISTA.items || []).forEach(function (x) { if (x.mov) usados[x.mov] = 1; });
    (LISTA.items || []).forEach(function (x) {
      if (!x.enc || x.mov) return;
      var m = movDeEncargo(x, usados); if (!m) return;
      usados[m.fila] = 1; n++;
      encolar('marcarMovimiento', [m.fila, 'Para otra persona', x.enc, { monto: m.monto }], 'Para ' + x.enc + ': ' + (m.comercio || 'compra'));
      setTimeout(function () { listaOp({ t: 'editar', item: x.id, datos: { mov: m.fila } }, 'Encargo ligado'); }, 0);
    });
    if (n) toast('👛 ' + n + ' compra' + (n === 1 ? '' : 's') + ' de encargos marcada' + (n === 1 ? '' : 's') + ' en Me deben', 3500);
    return n;
  }
  function pasarMeDeben(n) {
    var hechos = autoEncargos(), c = cuentaEnc(n), sin = c.its.filter(function (x) { return x.on && !x.mov && !(x.mov === '' && false); }).filter(function (x) { return !x.mov; });
    var e = encargante(n);
    listaOp({ t: 'encargante', antes: n, datos: { n: n, adelanto: e.adelanto || 0, moneda: e.moneda || 'USD', estado: 'medeben' } }, 'Me deben: ' + n);
    var conTarjeta = c.its.filter(function (x) { return x.on && x.mov; }).length;
    cerrar();
    toast(conTarjeta ? '👛 ' + n + ': ' + conTarjeta + ' compra' + (conTarjeta === 1 ? '' : 's') + ' en Me deben' + (sin.length ? '. ' + sin.length + ' sin correo del banco (efectivo o todavía no llegó)' : '') : 'Todavía no llegó el correo de esas compras (o fueron en efectivo). Cuando llegue, quedan solas en Me deben.', 6000);
  }

  function formPagado(id) {
    var x = itemPor(id); if (!x) return;
    abrir('<h2>¿Cuánto pagaste?</h2><div class="suave">' + esc(x.n) + ' · opcional, para ver lo gastado en estas compras</div><label class="campo"><span>Monto</span><input id="pg-m" class="monto" data-dinero inputmode="decimal" value="' + (x.pagado ? String(x.pagado).replace('.', ',') : '') + '"></label>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarPagado(\'' + id + '\')">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    setTimeout(function () { var e = $('pg-m'); if (e) e.focus(); }, 120);
  }
  function guardarPagado(id) { var m = C.leerNumero(val('pg-m')) || 0; listaOp({ t: 'pagado', item: id, monto: m }, 'Pagado'); cerrar(); }
  var FI = null;
  function formItemTienda(id) {
    var x = id ? itemPor(id) : { n: '', q: '', p: '', para: vistaTienda === 'persona' && (LISTA.personas || []).length === 1 ? LISTA.personas[0] : '', talla: '', color: '', tienda: '', max: '', nota: '', foto: '' };
    if (!x) return;
    FI = { p: x.p || (x.n ? TIENDAS.seccionDe(x.n) : 'Otros'), para: x.para || '' };
    var personas = (LISTA.personas || []).concat(['Todos']);
    abrir('<h2>' + (id ? esc(x.n) : 'Agregar cosa') + '</h2>' +
      '<div class="caja" style="flex-direction:row;gap:14px;align-items:center"><div class="foto-g' + (x.foto ? '' : ' vacia') + '" id="fi-prev">' + (x.foto ? '<img data-foto="' + esc(x.foto) + '" alt="">' : '📷') + '</div>' +
      '<div style="flex:1"><b>Foto (opcional)</b><div class="suave chico">El modelo, la marca o una captura</div><div class="chips" style="margin-top:8px;flex-wrap:wrap"><button class="chip" onclick="App.fotoItem(\'' + (id || '') + '\',true)">📷 Cámara</button><button class="chip" onclick="App.fotoItem(\'' + (id || '') + '\',false)">🖼 Galería</button>' + (x.foto ? '<button class="chip" onclick="App.quitarFotoItem(\'' + id + '\')">Quitar</button>' : '') + '</div></div></div>' +
      '<label class="campo"><span>Qué</span><input id="fi-n" value="' + esc(x.n) + '" placeholder="Ej. Tenis para correr" oninput="App.fiAuto(this.value)"></label>' +
      '<div class="suave chico">Sección</div><div class="chips" id="fi-secs" style="margin:6px 0 4px">' + TIENDAS.SECCIONES.map(function (sx) { return '<button type="button" class="chip' + (FI.p === sx ? ' on' : '') + '" data-v="' + esc(sx) + '" onclick="App.fiSel(\'p\',this)">' + TIENDAS.IC[sx] + ' ' + sx + '</button>'; }).join('') + '</div>' +
      '<div class="suave chico">Para quién</div><div class="chips" id="fi-paras" style="margin:6px 0 4px">' + personas.map(function (px) { return '<button type="button" class="chip' + (FI.para === px ? ' on' : '') + '" data-v="' + esc(px) + '" onclick="App.fiSel(\'para\',this)">' + (px === 'Todos' ? '👪 ' : '👤 ') + esc(px) + '</button>'; }).join('') + '</div>' +
      '<div class="dos"><label class="campo compacto"><span>Talla</span><input id="fi-talla" value="' + esc(x.talla || '') + '" placeholder="Ej. M, 9, 32"></label><label class="campo compacto"><span>Color</span><input id="fi-color" value="' + esc(x.color || '') + '" placeholder="Ej. Negro"></label></div>' +
      '<div class="dos"><label class="campo compacto"><span>Cantidad</span><input id="fi-q" inputmode="numeric" value="' + esc(x.q === '' || x.q === undefined ? '' : String(x.q)) + '" placeholder="1"></label><label class="campo compacto"><span>Precio máximo</span><input id="fi-max" class="monto" data-dinero inputmode="decimal" value="' + (x.max ? String(x.max).replace('.', ',') : '') + '"></label></div>' +
      '<label class="campo compacto"><span>Tienda (opcional)</span><input id="fi-tienda" value="' + esc(x.tienda || '') + '" placeholder="Ej. Albrook, Nike, Multiplaza"></label>' +
      '<label class="campo compacto"><span>Nota</span><input id="fi-nota" placeholder="Marca, modelo, link…" value="' + esc(x.nota || '') + '"></label>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarItem(\'' + (id || '') + '\')">' + (id ? 'Guardar' : 'Agregar') + '</button>' + (id ? '<button class="btn sec peligro" id="fi-borrar" onclick="App.quitarItem(\'' + id + '\')">Quitar de la lista</button>' : '') + '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    pintarFotos();
  }
  function fiSel(campo, b) { FI[campo] = FI[campo] === b.dataset.v && campo === 'para' ? '' : b.dataset.v; Array.prototype.forEach.call(b.parentNode.children, function (c) { c.classList.toggle('on', c.dataset.v === FI[campo]); }); FI.manual = FI.manual || campo === 'p'; }
  function fiAuto(v) { if (FI.manual) return; FI.p = TIENDAS.seccionDe(v); var c = $('fi-secs'); if (c) Array.prototype.forEach.call(c.children, function (x) { x.classList.toggle('on', x.dataset.v === FI.p); }); }
  function datosItemTienda() {
    return { n: val('fi-n').trim(), q: Number(val('fi-q')) || '', u: Number(val('fi-q')) ? 'u' : '', p: FI.p || 'Otros', para: FI.para || '', talla: val('fi-talla').trim(), color: val('fi-color').trim(),
      max: C.leerNumero(val('fi-max')) || '', tienda: val('fi-tienda').trim(), nota: val('fi-nota').trim() };
  }
  function formTerminar() {
    var propios = (LISTA.items || []).filter(function (x) { return !x.enc; }), pend = propios.filter(function (x) { return !x.on; }), otras = (LISTAS || []).filter(function (l) { return l.id !== LISTA.id; });
    abrir('<h2>Terminar compra' + (LISTA.tipo === 'tiendas' ? 's' : '') + '</h2>' + ((LISTA.items || []).some(function (x) { return x.enc; }) ? '<div class="suave chico">Los encargos se quedan hasta que cierres la cuenta de cada persona (📦 Encargos → 🧾 Cuentas).</div>' : '') + '<div class="caja" style="gap:4px"><b>' + (propios.length - pend.length) + ' de ' + propios.length + (LISTA.tipo === 'tiendas' ? ' comprados ✓' : ' en el carrito ✓') + '</b>' +
      (pend.length ? '<div class="suave chico">Quedaron pendientes: ' + pend.map(function (x) { return esc(x.n); }).join(', ') + '</div>' : '<div class="verde chico fuerte">¡No quedó nada pendiente!</div>') + '</div>' +
      (pend.length ? '<div class="suave chico fuerte" style="margin-top:10px">¿QUÉ HACEMOS CON LOS PENDIENTES?</div>' +
        '<label class="op on"><input type="radio" name="tp" value="dejar" checked> Dejarlos para la próxima</label>' +
        (otras.length ? '<label class="op"><input type="radio" name="tp" value="mover"> Pasarlos a <select id="tp-dest" onclick="event.stopPropagation()">' + otras.map(function (l) { return '<option value="' + l.id + '">' + esc(l.icono + ' ' + l.nombre) + '</option>'; }).join('') + '</select></label>' : '') +
        '<label class="op"><input type="radio" name="tp" value="borrar"> Borrarlos de la lista</label>' : '') +
      '<div class="caja" style="margin-top:12px;gap:6px"><b>¿El gasto?</b><div class="suave chico">' + (LISTA.tipo === 'tiendas' ? 'Lo que pagaste con tarjeta lo anota solo el correo del banco (y si estás de viaje, entra al viaje). En efectivo, anotalo a mano.' : 'Si pagaste con tarjeta o SINPE, el correo del banco lo anota solo: asignalo a tu sobre de super desde Por asignar. Si pagaste en efectivo, anotalo a mano.') + '</div>' +
      '<div class="dos"><button class="btn sec chico" onclick="App.terminarCompra(\'asignar\')">Ir a Por asignar</button><button class="btn sec chico" onclick="App.terminarCompra(\'mano\')">Anotar a mano</button></div></div>' +
      '<div class="acciones"><button class="btn" onclick="App.terminarCompra(\'\')">Terminar y limpiar marcas</button><button class="btn sec" onclick="App.cerrar()">Seguir comprando</button></div>');
  }
  function terminarCompra(luego) {
    var r = document.querySelector('input[name=tp]:checked'), modo = r ? r.value : 'dejar';
    listaOp({ t: 'terminar', pendientes: modo, destino: modo === 'mover' ? val('tp-dest') : '' }, 'Terminar compra');
    cerrar(); pantallaEncendida(false); toast('✅ Compra terminada');
    if (luego === 'asignar') ir('porasignar');
    else if (luego === 'mano') formRapido('Gasto');
    else pintar();
  }

  // ==================================================================== v2.5.3: PLANEADOR DE PAGOS DE TARJETA
  var PL = null;
  function tarjetasActivas() { return D.cuentas.filter(function (c) { return c.activa && c.tipo === 'Tarjeta de crédito'; }); }
  function abrirPlan(nombre) {
    var ts = tarjetasActivas();
    if (!nombre && ts.length === 1) nombre = ts[0].nombre;
    if (!nombre) {
      if (!ts.length) return toast('No tenés tarjetas de crédito activas.');
      return abrir('<h2>📋 Planear pago</h2><div class="suave">¿De cuál tarjeta?</div><div class="caja sinpad" style="margin-top:10px">' + ts.map(function (c) {
        var t = totalSinPagar(c.nombre);
        return '<button class="opcion" onclick="App.cerrar();App.abrirPlan(\'' + esc(c.nombre).replace(/'/g, "\\'") + '\')"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(etiquetaCuenta(c.nombre)) + '</span><span class="det" style="display:block">' + txt(t, 'CRC') + ' sin pagar</span></span><span class="flecha">›</span></button>';
      }).join('') + '</div>');
    }
    // v2.10.0: planeador "espejo del banco": cuánto pagar → de qué sobres sale → solo se anotan las sacadas
    var c0 = cuentaPorNombre(nombre), pp = C.porPagarTarjeta(D, c0, hoy);
    var mon0 = pp.CRC > 0.004 || !(pp.USD > 0.004) ? 'CRC' : 'USD';
    PL = { esp: true, cuenta: nombre, paso: 1, modo: 'estado', moneda: mon0, monto: Math.max(0, pp[mon0]), pp: pp, sobres: {}, sinCorreo: false,
      origen: (ORIG().porTarjeta || {})[nombre] || ORIG().tarjetas || cuentaPrincipal() };
    ir('plan');
  }
  /** Compras (y devoluciones) de la tarjeta que todavía no se marcaron como pagadas */
  function movsSinPagar(nombre) {
    var sb = sinServidorSobres() ? null : SB(), lim = new Date(hoy.getTime() - 120 * 86400000);
    if (D.sobresDesde && new Date(D.sobresDesde) > lim) lim = new Date(D.sobresDesde);
    // lo de antes del último pago ya se pagó: se cuenta desde el corte que cubrió ese pago (o desde el pago, si no hay día de corte)
    var ultPago = D.movimientos.filter(function (m) { return m.cuenta === nombre && m.tipo === 'Pago de tarjeta' && m.fecha; }).map(function (m) { return new Date(m.fecha); }).sort(function (a, b) { return b - a; })[0];
    if (ultPago) {
      var cta = cuentaPorNombre(nombre), desde = ultPago;
      if (cta && cta.diaCorte) { var y = ultPago.getFullYear(), mo = ultPago.getMonth(), u = function (yy, mm) { return new Date(yy, mm + 1, 0).getDate(); }, fc = new Date(y, mo, Math.min(cta.diaCorte, u(y, mo)), 23, 59, 59); if (fc > ultPago) { mo--; if (mo < 0) { mo = 11; y--; } fc = new Date(y, mo, Math.min(cta.diaCorte, u(y, mo)), 23, 59, 59); } desde = fc; }
      if (desde > lim) lim = new Date(desde.getTime() + 1000);
    }
    var pend = {}; if (sb) sb.pendientes.forEach(function (p) { pend[p.mov.fila] = p; });
    return D.movimientos.filter(function (m) {
      return m.cuenta === nombre && m.fila > 0 && !m.cobro && !m.para && (m.tipo === 'Gasto' || m.tipo === 'Ingreso') && m.fecha && new Date(m.fecha) >= lim;
    }).sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); }).map(function (m) {
      var filas = sb ? (sb.porMov[m.fila] || []) : [], conSobre = filas.filter(function (f) { return f.sobre; })[0];
      var ya = conSobre ? conSobre.sobre : (m.sobre || '');
      var g = {}; if (!ya) filas.forEach(function (f) { if (f.grupo) g[f.grupo] = 1; });
      return { m: m, cred: m.tipo === 'Ingreso', ya: ya, sobre: !ya && m.tipo === 'Gasto' ? sugerirSobre(m) : '', grupos: Object.keys(g), pend: !!pend[m.fila], sel: false };
    });
  }
  function totalSinPagar(nombre) { return movsSinPagar(nombre).reduce(function (a, x) { return a + (x.cred ? -x.m.monto : x.m.monto); }, 0); }
  function ultimoCorte(c) {
    if (!c || !c.diaCorte) return null;
    var y = hoy.getFullYear(), mo = hoy.getMonth(), ult = function (yy, mm) { return new Date(yy, mm + 1, 0).getDate(); };
    var f = new Date(y, mo, Math.min(c.diaCorte, ult(y, mo)), 23, 59, 59);
    if (f > hoy) { mo--; if (mo < 0) { mo = 11; y--; } f = new Date(y, mo, Math.min(c.diaCorte, ult(y, mo)), 23, 59, 59); }
    return f;
  }
  function planPreset(p, silencio) {
    var c = cuentaPorNombre(PL.cuenta), corte = ultimoCorte(c);
    PL.preset = p;
    PL.items.forEach(function (x) {
      x.sel = p === 'todo' ? true : p === 'ninguna' ? false : p === 'sinsobre' ? (!x.ya && !x.cred) : p === 'corte' ? (!corte || new Date(x.m.fecha) <= corte) : x.sel;
    });
    if (!silencio) pintar();
  }
  function planTotales() {
    var t = 0, n = 0, nc = 0, cred = 0, por = {}, sin = 0, faltan = [];
    PL.items.forEach(function (x) {
      if (!x.sel) return;
      if (x.cred) { cred += x.m.monto; nc++; return; }
      n++; t += x.m.monto;
      var s = x.ya || x.sobre;
      if (s === '__sin') sin += x.m.monto;
      else if (s) por[s] = (por[s] || 0) + x.m.monto;
      else { faltan.push(x); sin += 0; }
    });
    return { total: Math.round((t - cred) * 100) / 100, compras: n, devs: nc, cred: cred, por: por, sin: sin, faltan: faltan };
  }
  function pPlan() {
    if (!PL) return ir('tarjetas');
    if (PL.esp) return pPlanEsp();
    var c = cuentaPorNombre(PL.cuenta), corte = ultimoCorte(c), T = planTotales();
    var h = cabSimple('📋 Planear pago', esc(etiquetaCuenta(PL.cuenta)), 'App.ir(\'tarjetas\')');
    var chip = function (k, n) { return '<button class="chip' + (PL.preset === k ? ' on' : '') + '" onclick="App.planPreset(\'' + k + '\')">' + n + '</button>'; };
    h += '<div class="chips desliza" style="margin:-6px 0 10px">' + (corte ? chip('corte', 'Hasta el corte (' + fechaCorta(corte.toISOString()) + ')') : '') + chip('todo', 'Todo sin pagar') + chip('sinsobre', 'Solo sin sobre') + chip('ninguna', 'Ninguna') + '</div>';
    if (!PL.items.length) h += '<div class="caja vacio">No hay compras sin pagar en esta tarjeta.<br><span class="suave chico">Las compras se marcan como pagadas cuando las pagás desde aquí.</span></div>';
    else {
      h += '<div class="caja sinpad">' + PL.items.map(function (x, i) {
        var m = x.m, sob = x.cred ? '<span class="verde chico">↩ devolución</span>' : x.ya ? '<span class="acento chico fuerte">✉ ' + esc(nomSobre(x.ya)) + '</span>' :
          '<select class="sel-mini' + (x.sobre ? '' : ' falta') + '" data-titulo="Sobre para ' + esc(nombreBonito(m.comercio) || 'la compra') + '" onchange="App.planSobre(' + i + ',this.value)"><option value="">Elegí sobre</option>' + opcionesSobre(m.moneda, x.sobre, true) + '<option value="__sin"' + (x.sobre === '__sin' ? ' selected' : '') + '>💳 Sin sobre</option></select>';
        return '<div class="it-su' + (x.sel ? '' : ' apagado') + '"><label class="it-check"><input type="checkbox"' + (x.sel ? ' checked' : '') + ' onchange="App.planMarcar(' + i + ',this.checked)"></label>' +
          '<div class="it-nom" style="cursor:default"><b>' + esc(nombreBonito(m.comercio) || m.tipo) + '</b><span class="suave chico">' + fechaCorta(m.fecha) + '</span>' + sob + '</div>' +
          '<b class="it-q' + (x.cred ? ' verde' : '') + '">' + (x.cred ? '+' : '') + din(m.monto, m.moneda) + '</b></div>';
      }).join('') + '</div>';
      var sinElegir = PL.items.filter(function (x) { return x.sel && !x.cred && !x.ya && !x.sobre; }).length;
      if (PL.items.some(function (x) { return x.sel && !x.cred && !x.ya; })) h += '<div class="chips" style="margin-top:10px;flex-wrap:wrap">' + (sinElegir ? '<button class="chip" onclick="App.planSugerir()">✨ Sugerir sobres</button>' : '') +
        '<select class="sel-mini" data-titulo="Todo de un sobre" onchange="App.planTodo(this.value)"><option value="">Todo de un sobre…</option>' + opcionesSobre(c ? (c.moneda || 'CRC') : 'CRC', null, true) + '<option value="__sin">💳 Sin sobre</option></select></div>';
      var lineas = Object.keys(T.por).sort(function (a, b) { return T.por[b] - T.por[a]; }).map(function (s) { return '<div class="fila chico"><span>' + iconoSobre(s) + ' ' + esc(nomSobre(s)) + '</span><b>' + din(T.por[s], 'CRC') + '</b></div>'; });
      if (T.sin) lineas.push('<div class="fila chico"><span>💳 Sin sobre</span><b>' + din(T.sin, 'CRC') + '</b></div>');
      if (T.faltan.length) lineas.push('<div class="fila chico"><span class="acento">⚠ Falta elegir sobre (' + T.faltan.length + ')</span><b class="acento">' + din(T.faltan.reduce(function (a, x) { return a + x.m.monto; }, 0), 'CRC') + '</b></div>');
      if (T.cred) lineas.push('<div class="fila chico"><span class="verde">↩ Devoluciones</span><b class="verde">−' + din(T.cred, 'CRC') + '</b></div>');
      if (lineas.length) h += '<div class="caja" style="margin-top:12px;gap:4px"><div class="suave chico fuerte">SACÁ DE TUS SOBRES</div>' + lineas.join('') + '<div class="suave chico" style="margin-top:4px">Lo de compras que ya tenían sobre ya está apartado: no tenés que moverlo otra vez.</div></div>';
      h += '<div style="height:96px"></div><div class="barra-plan"><div><div class="suave chico">' + T.compras + ' compra' + (T.compras === 1 ? '' : 's') + (T.devs ? ' − ' + T.devs + ' devolución' + (T.devs === 1 ? '' : 'es') : '') + '</div><b class="grande-plan">' + din(T.total, 'CRC') + '</b></div>' +
        '<button class="btn" onclick="App.formPagarPlan()"' + (T.total > 0 ? '' : ' disabled') + '>Pagar ›</button></div>';
    }
    $('p-plan').innerHTML = h;
  }
  // ---- v2.10.0 · Planeador espejo
  function plMontoModo() {
    var pp = PL.pp, mon = PL.moneda;
    if (PL.modo === 'estado') return Math.max(0, pp[mon]);
    if (PL.modo === 'hoy') return Math.max(0, pp.deuda[mon]);
    return PL.monto;
  }
  function plSobresTotal() { var t = 0; Object.keys(PL.sobres).forEach(function (k) { t += PL.sobres[k] || 0; }); return Math.round(t * 100) / 100; }
  function pPlanEsp() {
    var c = cuentaPorNombre(PL.cuenta), pp = PL.pp, mon = PL.moneda, h;
    var f = c && c.diaPago ? C.proximaFecha(c.diaPago, hoy) : null;
    var dosMon = pp.deuda.USD > 0.004 || pp.USD > 0.004 || (c && c.limiteUSD);
    if (PL.paso === 1) {
      h = cabSimple('Planear pago', esc(etiquetaCuenta(PL.cuenta)), 'App.ir(\'tarjetas\')');
      h += '<div class="caja" style="gap:4px"><div class="suave chico">Por pagar' + (f ? ' · vence ' + DIAS_L[f.getDay()] + ' ' + f.getDate() : '') + '</div><div class="fuerte" style="font-size:26px">' + [pp.CRC > 0.004 || !(pp.USD > 0.004) ? din(Math.max(0, pp.CRC), 'CRC') : '', pp.USD > 0.004 ? din(pp.USD, 'USD') : ''].filter(String).join(' + ') + '</div>' +
        '<div class="fila chico"><span class="suave">Deuda hoy</span><span>' + [din(pp.deuda.CRC, 'CRC'), pp.deuda.USD ? din(pp.deuda.USD, 'USD') : ''].filter(String).join(' + ') + '</span></div>' +
        (pp.nuevas.CRC || pp.nuevas.USD ? '<div class="fila chico"><span class="suave">Compras después del corte (van al próximo)</span><span class="suave">−' + [pp.nuevas.CRC ? din(pp.nuevas.CRC, 'CRC') : '', pp.nuevas.USD ? din(pp.nuevas.USD, 'USD') : ''].filter(String).join(' + ') + '</span></div>' : '') + '</div>';
      h += '<div class="caja" style="gap:6px"><div class="suave chico">¿Cuánto vas a pagar?</div><div class="chips">' + chipRev('Todo lo del estado', 'App.plModo(\'estado\')', PL.modo === 'estado') + chipRev('Todo lo de hoy', 'App.plModo(\'hoy\')', PL.modo === 'hoy') + chipRev('Otro monto', 'App.plModo(\'otro\')', PL.modo === 'otro') + '</div>' +
        (PL.modo === 'otro' ? '<label class="campo compacto"><span>Monto</span><input id="pl-monto" class="monto" data-dinero inputmode="decimal" value="' + (PL.monto ? String(PL.monto).replace('.', ',') : '') + '" oninput="App.plMonto(this.value)"></label>' : '<div class="fuerte" style="font-size:18px">' + din(plMontoModo(), mon) + '</div>') +
        (dosMon ? '<div class="suave chico" style="margin-top:6px">Moneda del pago</div><div class="chips">' + chipRev('₡ Colones', 'App.plMoneda(\'CRC\')', mon === 'CRC') + chipRev('$ Dólares', 'App.plMoneda(\'USD\')', mon === 'USD') + '</div>' : '') + '</div>';
      h += '<div class="suave chico" style="margin:0 2px 10px">Solo lo que toca pagar (sin las compras nuevas). ' + (dosMon ? 'El pago en $ baja los dólares; el pago en ₡, los colones.' : '') + '</div>';
      h += '<button class="btn" style="width:100%" onclick="App.plPaso(2)"' + (plMontoModo() > 0.004 ? '' : ' disabled') + '>Siguiente ›</button>';
    } else if (PL.paso === 2) {
      var total = plMontoModo(), enS = plSobresTotal(), disp = Math.round((total - enS) * 100) / 100;
      var sbs = sinServidorSobres() ? [] : SB().lista.filter(function (s) { return (s.moneda === 'USD' ? 'USD' : 'CRC') === mon; });
      var cpri = cuentaPorNombre(cuentaPrincipal()), dp = cpri ? disponibleDe(cpri) : null;
      h = cabSimple('¿De dónde sale?', 'Planear pago · ' + txt(total, mon), 'App.plPaso(1)');
      h += '<div class="caja sinpad"><div class="suave chico" style="padding:12px 16px 2px">Sobres del BCR</div>' + (sbs.length ? sbs.map(function (s) {
        var on = PL.sobres[s.nombre] !== undefined;
        return '<div class="pl-sob' + (on ? ' on' : '') + '"><label class="it-check"><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="App.plSobre(\'' + q(s.nombre) + '\',this.checked)"></label><div class="it-nom"><b>' + esc(nomSobre(s.nombre)) + '</b><span class="suave chico">tiene ' + txt(s.saldo, mon) + '</span></div>' +
          (on ? '<input class="monto pl-in" data-dinero inputmode="decimal" value="' + (PL.sobres[s.nombre] ? String(PL.sobres[s.nombre]).replace('.', ',') : '') + '" onchange="App.plSobreMonto(\'' + q(s.nombre) + '\',this.value)">' : '<span class="suave">—</span>') + '</div>';
      }).join('') : '<div class="suave chico" style="padding:4px 16px 10px">No hay sobres en esta moneda.</div>') +
        '<div class="pl-sob"><span style="font-size:18px;width:22px;text-align:center">🪙</span><div class="it-nom"><b>Del disponible</b><span class="suave chico">' + (dp && mon === 'CRC' ? 'tiene ' + txt(dp.disponible, 'CRC') : 'lo que no sale de sobres') + '</span></div><b class="' + (disp < -0.004 ? 'rojo' : '') + '">' + din(Math.max(0, disp), mon) + '</b></div>' +
        '<div class="fila" style="padding:10px 16px;border-top:1px solid var(--linea)"><b>Total</b><b class="' + (disp < -0.004 ? 'rojo' : 'verde-pos') + '">' + (disp < -0.004 ? 'Te pasaste ' + txt(-disp, mon) : din(total, mon) + ' ✓') + '</b></div></div>';
      var ctas = cuentasAhorro().filter(function (x) { return (x.moneda === 'USD' ? 'USD' : 'CRC') === mon; });
      h += '<div class="caja"><label class="campo compacto"><span>Sale de</span><select id="pl-origen" onchange="App.plOrigen(this.value)">' + ctas.map(function (x) { return '<option' + (x.nombre === PL.origen ? ' selected' : '') + '>' + esc(x.nombre) + '</option>'; }).join('') + '</select></label></div>';
      h += '<div class="suave chico" style="margin:0 2px 10px">Igual que en la app del banco: marcás los sobres y cuánto de cada uno. El resto, del disponible.</div>';
      h += '<button class="btn" style="width:100%" onclick="App.plSacar()"' + (disp < -0.004 ? ' disabled' : '') + '>' + (enS > 0.004 ? '📤 Sacar de los sobres' : '✓ Listo (todo del disponible)') + '</button>';
    } else {
      var r = PL.hecho;
      h = cabSimple('Listo para pagar', esc(etiquetaCuenta(PL.cuenta)), 'App.ir(\'tarjetas\')');
      h += '<div class="caja" style="gap:4px"><b>✓ Anotado en la app</b>' + r.sacadas.map(function (x) { return '<div class="fila chico"><span>📤 ' + esc(nomSobre(x.sobre)) + ' → disponible</span><b>' + din(x.monto, r.moneda) + '</b></div>'; }).join('') +
        (r.disp > 0.004 ? '<div class="fila chico"><span>🪙 Del disponible</span><b>' + din(r.disp, r.moneda) + '</b></div>' : '') +
        (r.sacadas.length ? '<div class="suave chico">Cada sacada queda como fila en Movimientos: “Sobre → disponible · para pagar ' + esc(etiquetaCuenta(PL.cuenta)) + '”.</div>' : '') + '</div>';
      h += '<div class="caja borde-acento" style="gap:6px"><div><b>Ahora pagá en tu banco</b> ' + din(r.total, r.moneda) + ' a la tarjeta' + (c && c.ultimos4 ? ' ••' + esc(c.ultimos4) : '') + '. Cuando llegue el correo del pago, se une solo con esto (no se descuenta dos veces).</div><button class="btn sec chico" style="align-self:flex-start" onclick="App.plCopiar()">📋 Copiar monto</button></div>';
      h += '<div class="caja">' + opcion('correo', 'Este pago no llega por correo', r.anotado ? 'Pago anotado ✓' : 'Anotar el pago ya (sin esperar el correo)', interruptor('pl-sincorreo', !!r.anotado, 'App.plSinCorreo(this.checked)', 'Este pago no llega por correo')) + '</div>';
      h += '<button class="btn sec" style="width:100%" onclick="App.ir(\'tarjetas\')">Volver a Tarjetas</button>';
    }
    $('p-plan').innerHTML = h;
  }
  var DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function plModo(m) { PL.modo = m; if (m === 'otro' && !PL.monto) PL.monto = Math.max(0, PL.pp[PL.moneda]); pintar(); }
  function plMonto(v) { PL.monto = C.leerNumero(v) || 0; }
  function plMoneda(m) { PL.moneda = m; PL.sobres = {}; if (PL.modo === 'otro') PL.monto = Math.max(0, PL.pp[m]); var ctas = cuentasAhorro().filter(function (x) { return (x.moneda === 'USD' ? 'USD' : 'CRC') === m; }); if (ctas.length && !ctas.some(function (x) { return x.nombre === PL.origen; })) PL.origen = ctas[0].nombre; pintar(); }
  function plPaso(n) { if (n === 2 && PL.modo === 'otro' && $('pl-monto')) PL.monto = C.leerNumero(val('pl-monto')) || 0; PL.paso = n; pintar(); window.scrollTo(0, 0); }
  function plSobre(n, on) {
    if (!on) delete PL.sobres[n];
    else { var falta = Math.max(0, plMontoModo() - plSobresTotal()), s = sobreInfo(n); PL.sobres[n] = Math.round(Math.min(falta, s ? Math.max(0, s.saldo) : falta) * 100) / 100; }
    pintar();
  }
  function plSobreMonto(n, v) { PL.sobres[n] = C.leerNumero(v) || 0; pintar(); }
  function plOrigen(v) { PL.origen = v; }
  function plCopiar() { var t = PL.hecho.total; navigator.clipboard.writeText(String(t).replace('.', ',')).then(function () { toast('📋 Copiado: ' + txt(t, PL.hecho.moneda)); }, function () { toast('No se pudo copiar'); }); }
  function plSacar() {
    var total = plMontoModo(), mon = PL.moneda, id = Date.now().toString(36), sacadas = [], auts = [];
    if (cola.length > 20) return toast('Esperá a que se envíen los cambios pendientes.');
    Object.keys(PL.sobres).forEach(function (n, i) {
      var m = Math.round((PL.sobres[n] || 0) * 100) / 100; if (!(m > 0.004)) return;
      var s = filaSobre(C.TIPO_SACAR, n, m, 'Sacado del sobre ' + nomSobre(n) + ' · para pagar ' + etiquetaCuenta(PL.cuenta), null, 'SAC-PL' + id + '-' + i, '', mon);
      sacadas.push({ sobre: n, monto: m }); auts.push(s.autorizacion);
    });
    var disp = Math.round((total - plSobresTotal()) * 100) / 100;
    var planes = (PREFS().planesEsp || []).filter(function (x) { return new Date(x.creado) > new Date(hoy.getTime() - 20 * 86400000); });
    planes.push({ id: id, cuenta: PL.cuenta, monto: total, moneda: mon, auts: auts, disp: disp, creado: new Date().toISOString() });
    guardarPrefs({ planesEsp: planes }, 'Plan de pago ' + etiquetaCuenta(PL.cuenta) + ' · ' + txt(total, mon));
    PL.hecho = { id: id, total: total, moneda: mon, sacadas: sacadas, disp: disp, anotado: false };
    PL.paso = 3; sbMemo = null; pintar(); window.scrollTo(0, 0);
    toast(sacadas.length ? '📤 Sacado de ' + sacadas.length + ' sobre' + (sacadas.length === 1 ? '' : 's') : '✓ Listo', 2500);
  }
  function plSinCorreo(on) {
    var r = PL.hecho; if (!r || r.anotado || !on) return;
    var c = cuentaPorNombre(PL.cuenta);
    encolar('guardarMovimiento', [{ fila: null, control: null, fecha: new Date().toISOString(), comercio: 'Pago de tarjeta' + (c && c.ultimos4 ? ' ••' + c.ultimos4 : ''), lugar: '', monto: r.total, moneda: r.moneda, tipo: 'Pago de tarjeta', cuenta: PL.cuenta,
      categoria: '', sobre: '', origen: 'Manual', autorizacion: 'PLAN-' + r.id, nota: 'Planeador de pagos', recordarRegla: false }], 'Pago de ' + etiquetaCuenta(PL.cuenta) + ' · ' + txt(r.total, r.moneda));
    r.anotado = true; pintar(); toast('✅ Pago anotado', 2000);
  }
  /** Llegó un pago (o la salida de plata) que coincide con un plan del planeador → se une con sus sacadas y lo del disponible */
  function autoPlanEsp() {
    var planes = PREFS().planesEsp || []; if (!planes.length || !D || sinServidorSobres()) return;
    var usados = sacadasUsadas(), quedan = planes.slice(), n = 0;
    SB().pendientes.forEach(function (p) {
      if (p.sentido !== 'sale' || p.mov.fila <= 0) return;
      var m = p.mov, pl = quedan.filter(function (x) {
        return Math.abs(x.monto - p.falta) < 1 && (m.moneda === 'USD' ? 'USD' : 'CRC') === x.moneda && new Date(m.fecha) >= new Date(new Date(x.creado).getTime() - 86400000) &&
          (m.tipo !== 'Pago de tarjeta' || normNomL(m.cuenta) === normNomL(x.cuenta));
      })[0];
      if (!pl) return;
      var sacs = pl.auts.map(function (au) { return D.movimientos.filter(function (x) { return x.autorizacion === au && x.fila > 0; })[0]; }).filter(Boolean);
      if (sacs.length !== pl.auts.length || sacs.some(function (x) { return usados[x.autorizacion]; })) return;   // todavía no llegaron a Google
      unirSacadas(p, sacs, pl.disp > 0.004 ? 'disponible' : null); n++;
      quedan = quedan.filter(function (x) { return x !== pl; });
    });
    if (n) { guardarPrefs({ planesEsp: quedan }, 'Plan de pago usado'); sbMemo = null; pintar(); toast('✓ Pago unido con lo que planeaste', 3000); }
  }
  function normNomL(s) { return C.normNom(s); }
  function planMarcar(i, on) { PL.items[i].sel = !!on; PL.preset = ''; pintar(); }
  function planSobre(i, v) { PL.items[i].sobre = v; if (v && !PL.items[i].sel) PL.items[i].sel = true; pintar(); }
  function planSugerir() { var sin = []; PL.items.forEach(function (x) { if (x.sel && !x.cred && !x.ya && !x.sobre) { x.sobre = sugerirSobre(x.m); if (!x.sobre) sin.push(nombreBonito(x.m.comercio)); } }); pintar(); if (sin.length) toast('No encontré sobre para ' + sin.join(', ') + '. Elegilo vos.'); }
  function planTodo(v) { if (!v) return; PL.items.forEach(function (x) { if (x.sel && !x.cred && !x.ya) x.sobre = v; }); pintar(); }
  function formPagarPlan() {
    var T = planTotales();
    if (T.faltan.length) return toast('Elegí el sobre de ' + nombreBonito(T.faltan[0].m.comercio) + ' (o “Sin sobre”).');
    abrir('<h2>Pagar ' + din(T.total, 'CRC') + '</h2>' +
      '<div class="caja" style="gap:6px"><b>1 · Pagá en tu banco</b><div class="suave chico">' + din(T.total, 'CRC') + ' a la ' + esc(etiquetaCuenta(PL.cuenta)) + '</div><button class="btn sec chico" style="align-self:flex-start" onclick="App.copiarMontoPlan()">📋 Copiar monto</button></div>' +
      '<div class="caja" style="gap:8px;margin-top:10px"><b>2 · ¿Ya lo hiciste?</b>' +
      '<button class="btn" onclick="App.yaPague()">✓ Ya pagué: anotar y repartir</button>' +
      '<button class="btn sec" onclick="App.guardarPlan()">⏳ Guardar plan y pagar después</button>' +
      '<div class="suave chico">Si tu banco te manda correo del pago (o lo subís con la foto del comprobante), usá <b>Guardar plan</b>: cuando llegue, la app lo reconoce y reparte con un toque. Así no queda el pago repetido.</div></div>' +
      '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Seguir revisando</button></div>');
  }
  function copiarMontoPlan() { var t = planTotales().total; navigator.clipboard.writeText(String(t).replace('.', ',')).then(function () { toast('📋 Copiado: ' + txt(t, 'CRC')); }, function () { toast('No se pudo copiar'); }); }
  /** Reparte en los sobres las compras marcadas (y las devoluciones) y las marca como pagadas. filaPago: si ya existe el pago. */
  function repartirPlan(items, filaPago, autPago, total) {
    var g = grupoNuevo(), lista = [], sin = 0, cred = 0, hoyTxt = fechaCorta(new Date().toISOString());
    items.forEach(function (x) {
      var m = x.m;
      if (x.cred) { cred += m.monto; if (x.pend) lista.push({ fecha: fechaSobre(m), sobre: '', monto: m.monto, tipo: 'Sin sobre', movimiento: m.fila, grupo: g, nota: 'Devolución (pago de tarjeta)' }); return; }
      if (x.ya) return;
      x.grupos.forEach(function (gr) { encolar('eliminarGrupoSobres', [gr], 'Quitar «sin sobre» de ' + (m.comercio || 'compra')); });
      if (x.sobre === '__sin') { sin += m.monto; lista.push({ fecha: fechaSobre(m), sobre: '', monto: -m.monto, tipo: 'Sin sobre', movimiento: m.fila, grupo: g, nota: m.comercio || '' }); }
      else lista.push({ fecha: fechaSobre(m), sobre: x.sobre, monto: -m.monto, tipo: 'Compra con tarjeta', movimiento: m.fila, grupo: g, nota: m.comercio || '' });
    });
    if (lista.length) encolar('guardarSobresMov', [lista], 'Plan de pago: ' + lista.length + ' compra' + (lista.length === 1 ? '' : 's') + ' a sus sobres');
    // cada compra ya salió de su sobre: lo que el pago no cubra con lo apartado se cierra "sin sobre" (no se descuenta dos veces)
    if (filaPago) cerrarPagoPlan(filaPago);
    else guardar('mf-plan-fin', JSON.stringify({ aut: autPago }));
    items.forEach(function (x) { encolar('marcarMovimiento', [x.m.fila, 'Cobro', 'Pagada ' + hoyTxt + ' · plan', { monto: x.m.monto }], 'Pagada: ' + (x.m.comercio || 'compra')); });
  }
  function yaPague() {
    var T = planTotales(), sel = PL.items.filter(function (x) { return x.sel; }), c = cuentaPorNombre(PL.cuenta);
    var aut = 'PLAN-' + Date.now();
    var pago = { fecha: new Date().toISOString(), comercio: 'Pago de tarjeta' + (c && c.ultimos4 ? ' ••' + c.ultimos4 : ''), lugar: '', monto: T.total, moneda: 'CRC', tipo: 'Pago de tarjeta', cuenta: PL.cuenta, categoria: '', sobre: '', origen: 'Manual', autorizacion: aut, nota: 'Plan de pago: ' + sel.length + ' movimientos' };
    encolar('guardarMovimiento', [pago], 'Pago de ' + etiquetaCuenta(PL.cuenta) + ' · ' + txt(T.total, 'CRC'));
    repartirPlan(sel, null, aut, T.total);
    cerrar(); PL = null; ir('tarjetas'); toast('✅ Pago anotado y repartido en tus sobres', 4000);
  }
  function cerrarPagoPlan(fila) {
    sbMemo = null;
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0]; if (!p || p.falta < 0.01) return;
    encolar('guardarSobresMov', [[{ fecha: p.mov.fecha, sobre: '', monto: -Math.round(p.falta * 100) / 100, tipo: 'Pago tarjeta', movimiento: fila, grupo: grupoNuevo(), nota: 'Plan de pago: ya salió de los sobres en cada compra' }]], 'Pago: cerrar ' + txt(p.falta, 'CRC') + ' (ya apartado)');
  }
  function finPlanPendiente() {
    var p = leerJSONSeguro('mf-plan-fin'); if (!p || !D || cola.length) return;   // espera a que todo lo del plan llegue a Google
    var m = D.movimientos.filter(function (x) { return x.autorizacion === p.aut && x.fila > 0; })[0]; if (!m) return;
    guardar('mf-plan-fin', null);
    cerrarPagoPlan(m.fila);
  }
  function guardarPlan() {
    var T = planTotales(), sel = PL.items.filter(function (x) { return x.sel; });
    var planes = (PREFS().planes || []).filter(function (p) { return p.cuenta !== PL.cuenta; });
    planes.push({ id: 'p' + Date.now().toString(36), cuenta: PL.cuenta, total: T.total, creado: new Date().toISOString(), items: sel.map(function (x) { return { f: x.m.fila, s: x.cred ? '' : (x.ya ? '' : x.sobre), c: x.cred ? 1 : 0 }; }) });
    guardarPrefs({ planes: planes }, 'Plan de pago ' + etiquetaCuenta(PL.cuenta) + ' · ' + txt(T.total, 'CRC'));
    cerrar(); PL = null; ir('tarjetas'); toast('⏳ Plan guardado. Cuando llegue el pago por ' + txt(T.total, 'CRC') + ', te pregunto si es este.', 5000);
  }
  /** ¿Llegó un pago de tarjeta que coincide con un plan guardado? */
  function planesPorUsar() {
    if (!D || sinServidorSobres()) return [];
    var planes = PREFS().planes || [], out = [];
    SB().pendientes.forEach(function (p) {
      var m = p.mov; if (m.tipo !== 'Pago de tarjeta' || m.fila < 0 || guardado('mf-plan-no-' + m.fila, '')) return;
      var pl = planes.filter(function (x) { return x.cuenta === m.cuenta && Math.abs(x.total - m.monto) < 1 && new Date(m.fecha) >= new Date(new Date(x.creado).getTime() - 86400000); })[0];
      if (pl) out.push({ plan: pl, mov: m });
    });
    return out;
  }
  function tarjetaPlanes() {
    return planesPorUsar().map(function (x) {
      return '<div class="aviso-sal"><b>📋 Llegó el pago de la ' + esc(etiquetaCuenta(x.mov.cuenta)) + ' · ' + din(x.mov.monto, x.mov.moneda) + '</b><div class="suave chico">¿Es el plan que guardaste el ' + fechaCorta(x.plan.creado) + '? Se reparte solo en tus sobres.</div>' +
        '<div class="dos" style="margin-top:10px"><button class="btn" onclick="App.usarPlan(\'' + x.plan.id + '\',' + x.mov.fila + ')">Sí, repartir</button><button class="btn sec" onclick="App.noPlan(' + x.mov.fila + ')">No</button></div></div>';
    }).join('');
  }
  function usarPlan(id, fila) {
    var pl = (PREFS().planes || []).filter(function (x) { return x.id === id; })[0]; if (!pl) return;
    var todos = movsSinPagar(pl.cuenta), items = [];
    pl.items.forEach(function (it) { var x = todos.filter(function (y) { return y.m.fila === it.f; })[0]; if (x) { if (!x.ya && !x.cred) x.sobre = it.s || x.sobre || '__sin'; items.push(x); } });
    repartirPlan(items, fila, null, pl.total);
    guardarPrefs({ planes: (PREFS().planes || []).filter(function (x) { return x.id !== id; }) }, 'Plan de pago usado');
    if (pantalla !== 'inicio') cerrar();
    pintar(); toast('✅ Pago repartido según tu plan', 4000);
  }
  function noPlan(fila) { guardar('mf-plan-no-' + fila, '1'); pintar(); }

  // ==================================================================== v2.5.3: SELECCIONAR EN MOVIMIENTOS (sumar como en Excel)
  var selMov = null;
  function filaDeItem(el) { var m = (el.getAttribute('onclick') || '').match(/formMovimiento\((\d+)\)/); return m ? Number(m[1]) : 0; }
  document.addEventListener('pointerdown', function (e) {
    if (pantalla !== 'movimientos' || !e.target.closest) return;
    var it = e.target.closest('#p-movimientos .item.mov'); if (!it) return;
    var fila = filaDeItem(it); if (!fila || selMov) return;
    var x0 = e.clientX, y0 = e.clientY;
    var tm = setTimeout(function () {
      selMov = {}; selMov[fila] = 1; suprimirClick = true; vibrar(); pintar();
      var fin = function () { document.removeEventListener('pointerup', fin); document.removeEventListener('pointercancel', fin); setTimeout(function () { suprimirClick = false; }, 80); };
      document.addEventListener('pointerup', fin); document.addEventListener('pointercancel', fin);
    }, 520);
    var cancelar = function (ev) { if (ev.type !== 'pointermove' || Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) > 12) { clearTimeout(tm); quitar(); } };
    var quitar = function () { ['pointermove', 'pointerup', 'pointercancel'].forEach(function (t2) { document.removeEventListener(t2, cancelar); }); };
    ['pointermove', 'pointerup', 'pointercancel'].forEach(function (t2) { document.addEventListener(t2, cancelar); });
  });
  function alternarSel(fila) { if (selMov[fila]) delete selMov[fila]; else selMov[fila] = 1; if (!Object.keys(selMov).length) selMov = null; pintar(); }
  function salirSel() { selMov = null; pintar(); }
  function barraSel() {
    if (!selMov) return '';
    var sb = sinServidorSobres() ? null : SB(), g = 0, ing = 0, por = {}, n = 0;
    Object.keys(selMov).forEach(function (f) {
      var m = movPorFila(Number(f)); if (!m) return; n++;
      if (m.tipo === 'Ingreso' || m.tipo === 'Retiro de fondo') { ing += m.monto; return; }
      g += m.monto;
      var s = (sb && ((sb.porMov[m.fila] || []).filter(function (x) { return x.sobre; })[0] || {}).sobre) || m.sobre || '';
      por[s] = (por[s] || 0) + m.monto;
    });
    var des = Object.keys(por).map(function (s) { return (s ? iconoSobre(s) + ' ' + esc(nomSobre(s)) : '💳 sin sobre') + ' ' + txt(por[s], 'CRC'); }).join(' · ');
    return '<div style="height:150px"></div><div class="barra-plan sel"><div style="flex:1;min-width:0"><div class="fila"><b>' + n + ' seleccionado' + (n === 1 ? '' : 's') + '</b><button class="chip" onclick="App.salirSel()">✕</button></div>' +
      '<div class="fila" style="margin-top:4px"><span class="suave chico">Gastos</span><b class="grande-plan" style="font-size:22px">' + din(g, 'CRC') + '</b></div>' + (ing ? '<div class="fila"><span class="suave chico">Ingresos</span><b class="verde">+' + din(ing, 'CRC') + '</b></div>' : '') +
      (des ? '<div class="suave chico" style="margin-top:4px">' + des + '</div>' : '') +
      '<div class="chips" style="margin-top:8px;flex-wrap:wrap"><button class="chip" onclick="App.copiarSel()">📋 Copiar</button><button class="chip" onclick="App.asignarSel()">Asignar a un sobre</button></div></div></div>';
  }
  function copiarSel() {
    var g = 0; Object.keys(selMov || {}).forEach(function (f) { var m = movPorFila(Number(f)); if (m && m.tipo !== 'Ingreso' && m.tipo !== 'Retiro de fondo') g += m.monto; });
    navigator.clipboard.writeText(String(Math.round(g * 100) / 100).replace('.', ',')).then(function () { toast('📋 Copiado: ' + txt(g, 'CRC')); }, function () { toast('No se pudo copiar'); });
  }
  function asignarSel() {
    var pend = sinServidorSobres() ? [] : SB().pendientes.filter(function (p) { return selMov[p.mov.fila] && p.sentido === 'sale'; });
    if (!pend.length) return toast('Ninguno de los seleccionados está por asignar.');
    var tot = pend.reduce(function (a, p) { return a + p.falta; }, 0);
    abrir('<h2>Asignar ' + pend.length + ' a un sobre</h2><div class="suave">' + txt(tot, 'CRC') + ' en total (solo los que están por asignar).</div>' +
      '<label class="campo"><span>Sobre</span><select id="as-sel-sobre">' + opcionesSobre('CRC', null, true) + '<option value="">💳 Sin sobre</option></select></label>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarAsignarSel()">Asignar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarAsignarSel() {
    var s = val('as-sel-sobre'), g = grupoNuevo(), lista = [];
    SB().pendientes.filter(function (p) { return selMov[p.mov.fila] && p.sentido === 'sale'; }).forEach(function (p) {
      lista.push({ fecha: fechaSobre(p.mov), sobre: s, monto: -p.falta, tipo: !s ? 'Sin sobre' : p.tarjeta ? 'Compra con tarjeta' : 'Gasto', movimiento: p.mov.fila, grupo: g, nota: p.mov.comercio || '' });
    });
    if (lista.length) encolar('guardarSobresMov', [lista], 'Asignar ' + lista.length + ' movimientos → ' + (s || 'sin sobre'));
    cerrar(); selMov = null; pintar(); toast('✅ Asignados' + (s ? ' a ' + nomSobre(s) : ' sin sobre'));
  }

  // ==================================================================== v2.5.5
  // ---- cuentas de ahorro con saldo vivo
  function ORIG() { return C.origenes(D, PREFS().origenes); }
  function cuentasAhorro() { return D.cuentas.filter(function (c) { return c.activa && C.esAhorro(c); }); }
  function dosMon(o, mon) { return [o.CRC || mon !== 'USD' && !o.USD ? din(o.CRC, 'CRC') : '', o.USD ? din(o.USD, 'USD') : ''].filter(String).join(' + '); }
  function iconos(lista) {
    return '<div class="iconos' + (lista.length > 4 ? ' seis' : '') + '">' + lista.map(function (b) {
      return '<button class="ic-b' + (b[3] ? ' on' : '') + '" onclick="' + b[2] + '"><span class="ic-c">' + b[0] + '</span><span class="ic-n">' + b[1] + '</span></button>';
    }).join('') + '</div>';
  }
  function filaAhorro(c) {
    var o = ORIG(), sc = C.saldoCuenta(D, c, o), mon = c.moneda === 'USD' ? 'USD' : 'CRC', ab = tarjetaAbierta === c.fila;
    var principal = o.principal === c.nombre;
    var dp = disponibleDe(c, sc);   // v2.7.0: la principal muestra el DISPONIBLE (como la app del banco)
    var sub = sc.vivo ? (dp ? 'Disponible · total con sobres ' + txt(dp.total, 'CRC') : 'Saldo hoy · desde ' + fechaCorta(sc.fecha).replace(/ \d{4}$/, '')) : 'Sin saldo anotado';
    var h = '<button class="tj" onclick="App.alternarTarjeta(' + c.fila + ')" aria-expanded="' + ab + '"><span class="ico-cat tj-ic" style="background:var(--linea)">' + (mon === 'USD' ? '💵' : '🏦') + '</span>' +
      '<span class="tj-nom">' + esc(c.nombre) + '</span><span class="tj-sub suave chico">' + sub + (principal && !dp ? ' · principal' : '') + '</span>' +
      '<span class="monto"><b class="' + (dp && dp.disponible < -0.005 ? 'rojo' : '') + '">' + (dp ? din(dp.disponible, 'CRC') : dosMon(sc, mon)) + '</b></span></button>';
    if (!ab) return '<div class="tj-fila">' + h + '</div>';
    var linea = function (a, b, cls) { return '<div class="fila chico"><span class="suave">' + a + '</span><span class="fuerte ' + (cls || '') + '">' + b + '</span></div>'; };
    h += '<div class="tj-det">';
    if (sc.vivo) {
      h += linea('Saldo al ' + fechaCorta(sc.fecha) + ' (anotado)', dosMon(sc.base, mon)) +
        linea('+ Entradas (' + sc.nEntra + ')' + (principal ? ' · salario, SINPE recibidos' : ''), '+' + dosMon(sc.entra, mon), 'verde-pos') +
        linea('− Salidas (' + sc.nSale + ') · gastos, SINPE enviados', '−' + dosMon(sc.sale, mon), 'rojo') +
        linea('− Pagos de tarjeta, préstamo y fondos (' + sc.nPagos + ')', '−' + dosMon(sc.pagos, mon)) +
        (sc.nTransf ? linea('⇄ Entre tus cuentas (' + sc.nTransf + ')', (sc.transf.CRC + sc.transf.USD >= 0 ? '+' : '−') + dosMon({ CRC: Math.abs(sc.transf.CRC), USD: Math.abs(sc.transf.USD) }, mon), sc.transf.CRC + sc.transf.USD >= 0 ? 'verde-pos' : '') : '') +
        '<div style="border-top:1px solid var(--linea);margin:2px 0"></div>' + linea(dp ? 'Total en la cuenta (con sobres)' : 'Saldo hoy', dosMon(sc, mon));
    } else h += '<div class="aviso-tasa" style="margin:0 0 4px">Tocá <b>↻ Cuadrar con el banco</b> y poné lo que dice el banco hoy: desde ahí la app suma lo que entra y resta lo que sale.</div>';
    if (principal && D.sobresDesde && mon === 'CRC') {
      var sbH = C.saldosSobres(D, hoy, hoy), enS = sbH.total.CRC, res = sbH.reservadoTotal || 0, libre = sc.CRC - enS - res;
      h += '<div class="caja-int"><div class="sec-int">COMO EN LA APP DEL BANCO</div>' + linea('Total en la cuenta', din(sc.CRC, 'CRC')) + linea('✉ En tus sobres', din(-enS, 'CRC')) +
        (res > 0.005 ? linea('💳 En sobres para pagar tarjetas', din(-res, 'CRC')) : '') +
        '<div style="border-top:1px solid var(--linea);margin:2px 0"></div>' + linea('🪙 Disponible', din(libre, 'CRC'), libre < -0.005 ? 'rojo' : 'verde-pos') +
        '<div class="suave chico">' + (libre < -0.005 ? '⚠ Los sobres dicen tener más plata de la que hay. Cuadrá con el disponible del banco o revisá lo que falta asignar.' : 'Meter plata a un sobre la saca del disponible; pagar desde un sobre no lo cambia. Para cuadrar, usá el disponible que ves en el banco.') + '</div></div>';
    }
    if (principal) h += '<div class="suave chico">Cuenta principal: aquí entran el salario y los SINPE, y se toman los movimientos sin cuenta.</div>';
    var n = esc(c.nombre).replace(/'/g, "\\'");
    h += iconos([['↻', 'Cuadrar con el banco', 'App.formCuadrar(' + c.fila + ')', true], ['🧾', 'Movimientos', 'App.verCuentaMov(\'' + n + '\')'],
      ['🏦', 'Origen de pagos', 'App.formOrigenes()'], ['✏️', 'Editar', 'App.formCuenta(' + c.fila + ')']]) + '</div>';
    return '<div class="tj-fila abierta">' + h + '</div>';
  }
  /** v2.7.0: en la cuenta principal, lo que está en sobres (y lo reservado para tarjetas) no está en el disponible del banco */
  function enSobresDe(c) {
    if (!c || ORIG().principal !== c.nombre || sinServidorSobres() || c.moneda === 'USD') return null;
    var sbH = C.saldosSobres(D, hoy, hoy); return (sbH.total.CRC || 0) + (sbH.reservadoTotal || 0);
  }
  function formCuadrar(fila) {
    var c = D.cuentas.filter(function (x) { return x.fila === fila; })[0]; if (!c) return;
    var mon = c.moneda === 'USD' ? 'USD' : 'CRC', es = enSobresDe(c);
    abrir('<h2>↻ Cuadrar ' + esc(c.nombre) + '</h2><div class="suave">' + (es !== null ? 'Poné el <b>disponible</b> que ves en la app del banco (lo que no está en sobres).' : 'Poné lo que dice la app del banco hoy.') + '</div>' +
      '<label class="campo"><span>' + (es !== null ? 'Disponible en el banco' : 'Saldo en el banco') + ' (' + (mon === 'USD' ? '$' : '₡') + ')</span><input id="cq-banco" class="monto" data-dinero inputmode="decimal" placeholder="0" oninput="App.cuadrarVista(' + fila + ')"></label>' +
      '<div id="cq-vista"></div>');
    cuadrarVista(fila);
    setTimeout(function () { var e = $('cq-banco'); if (e) e.focus(); }, 80);
  }
  function cuadrarVista(fila) {
    var c = D.cuentas.filter(function (x) { return x.fila === fila; })[0]; if (!c) return;
    var mon = c.moneda === 'USD' ? 'USD' : 'CRC', sc = C.saldoCuenta(D, c, ORIG()), banco = C.leerNumero(val('cq-banco')), es = enSobresDe(c);
    var h = '';
    if (sc.vivo) {
      var app = sc[mon] - (es || 0);
      var dif = banco === null ? null : banco - app;
      h += '<div class="caja" style="gap:6px;margin-top:10px"><div class="fila"><span>La app calcula' + (es !== null ? ' (disponible)' : '') + '</span><b>' + din(app, mon) + '</b></div>' +
        '<div class="fila"><span>El banco dice</span><b>' + (banco === null ? '—' : din(banco, mon)) + '</b></div>' +
        '<div class="fila"><span>Diferencia</span><b class="' + (dif === null || Math.abs(dif) < 0.005 ? 'verde-pos' : 'acento') + '">' + (dif === null ? '—' : Math.abs(dif) < 0.005 ? '✓ cuadra' : (dif > 0 ? '+' : '−') + din(Math.abs(dif), mon)) + '</b></div></div>';
      h += '<div class="sec-int" style="margin-top:14px">¿QUÉ HAGO CON LA DIFERENCIA?</div>' +
        '<button class="op-g on" onclick="App.guardarCuadrar(' + fila + ')"><b>Ajustar y seguir desde hoy</b><span>El saldo queda igual al banco (comisiones, intereses, centavos…) y desde mañana se mueve solo.</span></button>' +
        '<button class="op-g" onclick="App.cerrar();App.verCuentaMov(\'' + esc(c.nombre).replace(/'/g, "\\'") + '\',\'saldo\')"><b>Buscar qué falta</b><span>Te muestro lo que la app contó desde el ' + fechaCorta(sc.fecha) + ' para compararlo con el banco.</span></button>';
    } else {
      h += '<div class="suave chico" style="margin-top:8px">Desde mañana la app suma lo que entra (salario, SINPE recibidos, retiros de fondos) y resta lo que sale (gastos, SINPE enviados, pagos de tarjeta, préstamo y fondos).</div>' +
        '<div class="acciones"><button class="btn" onclick="App.guardarCuadrar(' + fila + ')">Guardar saldo de hoy</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    }
    $('cq-vista').innerHTML = h;
    formatearMontos();
  }
  function guardarCuadrar(fila) {
    var c = D.cuentas.filter(function (x) { return x.fila === fila; })[0]; if (!c) return;
    var banco = C.leerNumero(val('cq-banco'));
    if (banco === null) return toast('Escribí el saldo que dice el banco.');
    var mon = c.moneda === 'USD' ? 'USD' : 'CRC', sc = C.saldoCuenta(D, c, ORIG()), es = enSobresDe(c);
    if (es !== null) {   // v2.8.0: la principal guarda el DISPONIBLE; el total se calcula con los sobres de ese día (aunque se anote algo después)
      var hoyD = new Date(), dia = hoyD.getFullYear() + '-' + ('0' + (hoyD.getMonth() + 1)).slice(-2) + '-' + ('0' + hoyD.getDate()).slice(-2);
      var da = {}; da[c.nombre] = dia;
      guardarPrefs({ origenes: Object.assign({}, PREFS().origenes || {}, { dispAnotado: Object.assign({}, (PREFS().origenes || {}).dispAnotado || {}, da) }) }, 'Disponible de ' + c.nombre);
      encolar('actualizarSaldoCuenta', [fila, Math.round(banco * 100) / 100, Math.round((sc.vivo ? sc.USD : c.saldoUSD || 0) * 100) / 100, desdeInput(localInput())], 'Disponible de ' + c.nombre + ' · ' + txt(banco, mon));
      return hecho('✅ Cuadrado: disponible ' + txt(banco, mon) + ' (igual que en el banco). Desde mañana se mueve solo.');
    }
    es = 0;
    var crc = mon === 'CRC' ? banco + es : (sc.vivo ? sc.CRC : c.saldoCRC || 0), usd = mon === 'USD' ? banco : (sc.vivo ? sc.USD : c.saldoUSD || 0);
    encolar('actualizarSaldoCuenta', [fila, Math.round(crc * 100) / 100, Math.round(usd * 100) / 100, desdeInput(localInput())], 'Saldo de ' + c.nombre + ' · ' + txt(banco, mon));
    hecho('✅ Cuadrado con el banco' + (es ? ' (disponible ' + txt(banco, mon) + ' + sobres ' + txt(es, 'CRC') + ')' : '') + '. Desde mañana se mueve solo.');
  }
  function formOrigenes() {
    var ah = cuentasAhorro().map(function (c) { return c.nombre; });
    if (!ah.length) return toast('Primero agregá tu cuenta de ahorros: Tarjetas → Agregar tarjeta o cuenta (tipo ahorro).', 5000);
    var o = ORIG(), sel = function (id, v) { return '<select id="' + id + '">' + opciones(ah, v) + '</select>'; };
    abrir('<h2>🏦 Cuentas de dónde salen los pagos</h2><div class="suave">Los pagos de tarjeta y del préstamo se anotan en la tarjeta o el préstamo, pero la plata sale de tu cuenta. Elegí de cuál:</div>' +
      '<label class="campo"><span>Cuenta principal (salario, SINPE y movimientos sin cuenta)</span>' + sel('or-pr', o.principal) + '</label>' +
      '<label class="campo"><span>Pagos de tarjetas salen de (por defecto)</span>' + sel('or-tj', o.tarjetas) + '</label>' +
      (Object.keys(o.porTarjeta).length ? '<div class="caja" style="background:var(--fondo);gap:2px;margin-top:10px"><b style="font-size:14px">Cada tarjeta se paga desde</b><span class="suave chico">Se usa cuando el pago no tiene al lado un débito de cuenta por el mismo monto. Por defecto, la cuenta del mismo banco.</span>' +
        Object.keys(o.porTarjeta).map(function (n, i) { return '<label class="campo compacto"><span>' + esc(etiquetaCuenta(n)) + '</span><select id="or-pt' + i + '" data-tarjeta="' + esc(n) + '">' + opciones(ah, o.porTarjeta[n]) + '</select></label>'; }).join('') + '</div>' : '') +
      '<label class="campo"><span>Cuota del préstamo sale de</span>' + sel('or-pt', o.prestamo) + '</label>' +
      '<label class="campo"><span>Aportes a fondos salen de (y los retiros entran a)</span>' + sel('or-fo', o.fondos) + '</label>' +
      '<div class="caja" style="background:var(--fondo);gap:4px;margin-top:12px;font-size:13.5px"><b>Qué suma y qué resta</b>' +
      '<span><b>Suma:</b> ingresos a esa cuenta (salario, SINPE recibidos, retiros de fondos).</span><span><b>Resta:</b> gastos y SINPE enviados desde esa cuenta, pagos de tarjeta, cuota del préstamo y aportes a fondos.</span>' +
      '<span class="suave">Igual que las tarjetas: cuenta desde el día siguiente a la fecha del saldo.</span></div>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarOrigenes()">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarOrigenes() {
    var pt = {}; Array.prototype.forEach.call(document.querySelectorAll('select[data-tarjeta]'), function (s) { pt[s.getAttribute('data-tarjeta')] = s.value; });
    guardarPrefs({ origenes: { principal: val('or-pr'), tarjetas: val('or-tj'), prestamo: val('or-pt'), fondos: val('or-fo'), porTarjeta: pt } }, 'Cuentas de dónde salen los pagos');
    hecho('✅ Guardado');
  }

  // ---- movimientos de una tarjeta o cuenta (pantalla propia)
  var CM = { cuenta: '', f: 'mes', desde: null, hasta: null };
  function verCuentaMov(n, f) {
    var c = cuentaPorNombre(n); if (!c) return;
    var tj = c.tipo === 'Tarjeta de crédito';
    CM = { cuenta: n, f: f || (tj && c.diaCorte ? 'corte' : 'mes'), desde: null, hasta: null };   // v2.9.0: las cuentas abren en "Este mes"
    ir('ctamov');
  }
  function cmFiltro(f) { if (f === 'rango') return formRango('cta'); CM.f = f; pintar(); }
  function rangoCM(c) {
    var dia = function (d) { return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) : null; };
    if (CM.f === 'corte') return [dia(C.ultimoCorte(c, hoy)), null];
    if (CM.f === 'saldo') { var fs = c.fechaSaldo ? new Date(c.fechaSaldo) : null; return [fs && !isNaN(fs) ? dia(fs) : null, null]; }
    if (CM.f === 'rango') return [CM.desde, CM.hasta];
    if (CM.f === 'todo') return [null, null];
    return C.rangoPeriodo(CM.f, hoy);
  }
  function textoRango(a, b) {
    if (!a) return '';
    var fin = b ? new Date(b.getTime() - 86400000) : null, f = function (d) { return d.getDate() + ' ' + MESES_C[d.getMonth()]; };
    return !fin || fin.toDateString() === a.toDateString() ? f(a) : f(a) + ' → ' + f(fin);
  }
  function pCtaMov() {
    var c = cuentaPorNombre(CM.cuenta);
    if (!c) { $('p-ctamov').innerHTML = cabSimple('Movimientos') + '<div class="caja vacio">No encontré esa cuenta.</div>'; return; }
    var tj = c.tipo === 'Tarjeta de crédito', o = ORIG();
    var items = tj ? D.movimientos.filter(function (m) { return m.cuenta === c.nombre && m.fecha; }).map(function (m) {
      var sale = m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero';
      return { fecha: m.fecha, mov: m, moneda: m.moneda === 'USD' ? 'USD' : 'CRC', monto: (sale ? -1 : 1) * m.monto, grupo: sale ? 'sale' : 'entra' };
    }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); }) : C.movsCuenta(D, c, o);
    if (!tj && o.principal === c.nombre) {   // v2.8.0: sacar / meter de sobres (como en la app del banco)
      items = items.concat(D.movimientos.filter(function (m) { return C.esSacarMeter(m) && m.fecha; }).map(function (m) {
        return { fecha: m.fecha, mov: m, moneda: 'CRC', monto: (m.tipo === C.TIPO_SACAR ? 1 : -1) * m.monto, grupo: 'sobre' };
      })).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    }
    var r = rangoCM(c);
    var lista = items.filter(function (x) { var f = new Date(x.fecha); return (!r[0] || f >= r[0]) && (!r[1] || f < r[1]); });
    var sum = { e: { CRC: 0, USD: 0 }, s: { CRC: 0, USD: 0 } };
    lista.forEach(function (x) { if (x.grupo !== 'sobre') sum[x.monto >= 0 ? 'e' : 's'][x.moneda] += Math.abs(x.monto); });
    var h = cabSimple('Movimientos', esc(c.nombre));
    var hoyV = tj ? C.deudaTarjeta(D, c) : C.saldoCuenta(D, c, o), mon = c.moneda === 'USD' && !tj ? 'USD' : 'CRC';
    var col = function (t, v, cls) { return '<div><span>' + t + '</span><b class="' + (cls || '') + '">' + v + '</b></div>'; };
    h += '<div class="resumen-mov">' + (tj ? col('Compras', dosMon(sum.s)) + col('Pagos', dosMon(sum.e), 'verde-pos') + col('Deuda hoy', dosMon(hoyV))
      : col('Entró', dosMon(sum.e, mon), 'verde-pos') + col('Salió', dosMon(sum.s, mon), 'rojo') + (function () { var dp = disponibleDe(c, hoyV); return dp ? col('Disponible', din(dp.disponible, 'CRC') + '<small>total ' + txt(dp.total, 'CRC') + '</small>', dp.disponible < -0.005 ? 'rojo' : '') : col(hoyV.vivo ? 'Saldo hoy' : 'Saldo', hoyV.vivo ? dosMon(hoyV, mon) : '—'); })()) + '</div>';
    // v2.9.0: sin "Desde el saldo" en el menú (solo lo usa "Cuadrar → Buscar qué falta", y ahí se muestra como aviso)
    var chips = (tj && c.diaCorte ? [['corte', 'Desde el corte']] : [])
      .concat([['mes', 'Este mes'], ['pasado', 'Mes pasado'], ['todo', 'Todo'], ['rango', CM.f === 'rango' && CM.desde ? '📅 ' + textoRango(CM.desde, CM.hasta) : '📅 Rango…']]);
    if (CM.f === 'saldo' && r[0]) h += '<div class="suave chico" style="margin:0 2px 8px">Mostrando desde la fecha del saldo (' + textoRango(r[0]) + ') · <button class="enlace" onclick="App.cmFiltro(\'mes\')">ver este mes</button></div>';
    h += '<div class="chips desliza">' + chips.map(function (x) { return '<button class="chip' + (CM.f === x[0] ? ' on' : '') + '" onclick="App.cmFiltro(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>';
    if (!lista.length) h += '<div class="caja vacio">No hay movimientos en ese período.</div>';
    else {
      var meses = [], por = {};
      lista.forEach(function (x) { var d = new Date(x.fecha), k = d.getFullYear() + '-' + d.getMonth(); if (!por[k]) { por[k] = { d: d, l: [], t: { CRC: 0, USD: 0 } }; meses.push(k); } por[k].l.push(x); por[k].t[x.moneda] += x.monto; });
      h += meses.map(function (k) {
        var g = por[k], t = [Math.abs(g.t.CRC) > 0.004 ? (g.t.CRC > 0 ? '+' : '−') + txt(Math.abs(g.t.CRC), 'CRC') : '', Math.abs(g.t.USD) > 0.004 ? (g.t.USD > 0 ? '+' : '−') + txt(Math.abs(g.t.USD), 'USD') : ''].filter(String).join(' · ');
        return '<div class="dia"><span>' + MESES[g.d.getMonth()].toUpperCase() + (g.d.getFullYear() !== hoy.getFullYear() ? ' ' + g.d.getFullYear() : '') + '</span><span class="m">' + (oculto() ? '' : t) + '</span></div>' +
          '<div class="caja sinpad">' + g.l.map(function (x) { return filaBanco(x, tj); }).join('') + '</div>';
      }).join('');
    }
    h += '<div class="suave chico" style="text-align:center">' + lista.length + ' movimiento' + (lista.length === 1 ? '' : 's') + ' · solo ' + (tj ? 'esta tarjeta' : 'esta cuenta') + ' · tocá uno para abrirlo</div>';
    $('p-ctamov').innerHTML = h;
  }
  function filaBanco(x, tj) {
    var m = x.mov, entra = x.monto >= 0, d = new Date(x.fecha);
    var nombre = x.texto || (m ? (m.tipo === 'Pago de tarjeta' && !tj ? 'Pago de ' + etiquetaCuenta(m.cuenta) : nombreBonito(m.comercio) || m.tipo) : 'Cuota del préstamo');
    var det = d.getDate() + ' ' + MESES_C[d.getMonth()] + (m && hora(m.fecha) ? ' · ' + hora(m.fecha) : '');
    if (m && !tj && (m.tipo === 'Inversión' || m.tipo === 'Retiro de fondo' || m.tipo === 'Transferencia')) det += ' · ' + esc(m.tipo === 'Transferencia' ? 'entre tus cuentas' : m.tipo);
    else if (m && m.tipo === 'Gasto' && m.categoria) det += ' · ' + esc(m.categoria);
    var et = m && (m.tipo === 'Gasto' || C.esSacarMeter(m)) ? etiquetaSobre(m) : '';
    if (x.grupo === 'sobre') det += ' · ' + (m.tipo === C.TIPO_SACAR ? 'del sobre al disponible' : 'del disponible al sobre');
    return '<button class="item fb" onclick="' + (m ? 'App.formMovimiento(' + m.fila + ')' : 'App.ir(\'prestamo\')') + '"><span class="punto ' + (entra ? 'v' : 'r') + '"></span>' +
      '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(nombre) + '</span><span class="det" style="display:block">' + det + (et ? ' ' + et : '') + '</span></span>' +
      '<span class="monto"><b class="' + (entra ? 'verde-pos' : '') + '">' + (entra ? '+' : '−') + din(Math.abs(x.monto), x.moneda) + '</b></span></button>';
  }

  // ---- calendario de rango (Movimientos y cuentas)
  var RG = null;
  function formRango(destino) {
    var a = destino === 'cta' ? CM.desde : filtro.desde, b = destino === 'cta' ? CM.hasta : filtro.hasta;
    RG = { dest: destino, a: a, b: b ? new Date(b.getTime() - 86400000) : null, ver: new Date((a || hoy).getFullYear(), (a || hoy).getMonth(), 1) };
    pintarRango();
  }
  function pintarRango() {
    var v = RG.ver, y = v.getFullYear(), mo = v.getMonth(), dias = new Date(y, mo + 1, 0).getDate(), off = (new Date(y, mo, 1).getDay() + 6) % 7;
    var cel = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (x) { return '<span class="cal-h">' + x + '</span>'; }).join('');
    for (var i = 0; i < off; i++) cel += '<span></span>';
    var hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    for (var dd = 1; dd <= dias; dd++) {
      var f = new Date(y, mo, dd), t = f.getTime();
      var cls = (RG.a && t === RG.a.getTime()) || (RG.b && t === RG.b.getTime()) ? ' on' : RG.a && RG.b && t > RG.a.getTime() && t < RG.b.getTime() ? ' entre' : '';
      cel += '<button class="cal-d' + cls + (t === hoy0.getTime() ? ' hoy' : '') + '" onclick="App.rgDia(' + y + ',' + mo + ',' + dd + ')">' + dd + '</button>';
    }
    var tx = RG.a ? textoRango(RG.a, RG.b ? new Date(RG.b.getTime() + 86400000) : null) + (RG.b ? '' : ' · tocá el último día') : 'Tocá el primer día';
    abrir('<h2>📅 Rango de fechas</h2><div class="cal-nav"><button class="btn-icono" aria-label="Mes anterior" onclick="App.rgMes(-1)">' + ico('atras') + '</button><b>' + nombreMes(v) + '</b>' +
      '<button class="btn-icono" aria-label="Mes siguiente" onclick="App.rgMes(1)">' + ico('adelante') + '</button></div><div class="cal">' + cel + '</div>' +
      '<div class="fila" style="margin-top:10px"><span class="fuerte">' + tx + '</span></div>' +
      '<div class="acciones"><button class="btn" onclick="App.rgAplicar()"' + (RG.a ? '' : ' disabled') + '>Aplicar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function rgMes(d) { RG.ver = new Date(RG.ver.getFullYear(), RG.ver.getMonth() + d, 1); pintarRango(); }
  function rgDia(y, mo, d) {
    var f = new Date(y, mo, d);
    if (!RG.a || RG.b) { RG.a = f; RG.b = null; }
    else if (f < RG.a) { RG.b = RG.a; RG.a = f; }
    else RG.b = f;
    pintarRango();
  }
  function rgAplicar() {
    if (!RG || !RG.a) return;
    var b = RG.b || RG.a, hasta = new Date(b.getFullYear(), b.getMonth(), b.getDate() + 1);
    if (RG.dest === 'cta') { CM.f = 'rango'; CM.desde = RG.a; CM.hasta = hasta; }
    else { filtro.per = 'rango'; filtro.desde = RG.a; filtro.hasta = hasta; }
    cerrar(); pintar();
  }
  function movPer(p) { if (p === 'rango') return formRango('mov'); filtro.per = p; filtro.desde = filtro.hasta = null; pintar(); }

  // ---- pantalla de cada sobre
  var SOB = { nombre: '', f: 'mes', vista: [] };
  function verSobre(i) { var s = SB().lista[i]; if (!s) return; SOB = { nombre: s.nombre, f: 'mes', vista: [] }; ir('sobre'); }
  function sobreFiltro(f) { SOB.f = f; pintar(); }
  function descSobre(e) {
    var m = e.movimiento ? movPorFila(e.movimiento) : null, mt;
    if (e.tipo === 'Mover') { mt = /^De (.+) a (.+)$/.exec(e.nota || ''); return mt ? (e.monto >= 0 ? 'Movido desde ' + nomSobre(mt[1]) : 'Movido a ' + nomSobre(mt[2])) : (e.nota || 'Movido entre sobres'); }
    if (e.tipo === 'Limpiar') return e.monto >= 0 ? 'Limpieza: llegó lo que sobró' : 'Limpieza: lo que sobró se fue';
    if (e.tipo === 'Préstamo') return 'Cuota del préstamo';
    if (e.tipo === 'Cargar' || e.tipo === 'Descargar') return e.nota || (e.monto >= 0 ? 'Desde lo libre de la cuenta' : 'A lo libre de la cuenta');
    if (e.tipo === 'Sacar' || e.tipo === 'Meter') return (e.nota || (e.tipo === 'Sacar' ? 'Sacado al disponible' : 'Metido desde el disponible')).replace(/^(Sacado del sobre|Metido al sobre) [^·]+· ?/, function (x, y) { return y === 'Sacado del sobre' ? 'Sacado · ' : 'Metido · '; });
    if (m) {
      if (m.tipo === 'Ingreso') return (e.tipo === 'Reparto' ? (C.esSalario(m) ? 'Reparto del salario' : 'Reparto · ' + (nombreBonito(m.comercio) || 'ingreso')) : (nombreBonito(m.comercio) || 'Ingreso'));
      if (m.tipo === 'Pago de tarjeta') return 'Pago de ' + etiquetaCuenta(m.cuenta);
      if (m.tipo === 'Inversión') return 'Aporte a fondos';
      if (m.tipo === 'Retiro de fondo') return 'Retiro de fondo';
      return 'Compra · ' + (nombreBonito(m.comercio) || m.categoria || 'gasto');
    }
    return e.nota || e.tipo || 'Movimiento';
  }
  function pSobre() {
    var hs = C.historialSobre(D, SOB.nombre), s = hs.sobre;
    if (!s || sinServidorSobres()) { $('p-sobre').innerHTML = cabSimple('Sobre', 'Sobres') + '<div class="caja vacio">Ese sobre ya no existe.</div>'; return; }
    var mon = s.moneda === 'USD' ? 'USD' : 'CRC', neg = hs.saldo < -0.005;
    var h = cabSimple(esc(nomSobre(s.nombre)), 'Sobres');
    var meta = s.meta || 0, pm = meta ? hs.saldo / meta : null;
    h += '<div class="sb-card"><div class="sb-top"><span class="sb-ic">' + iconoSobre(s.nombre) + '</span><div class="sb-tt"><b>' + esc(nomSobre(s.nombre)) + '</b><span>' + esc(s.tipo || 'Variable') +
      (meta ? ' · meta ' + din(meta, mon) : '') + (s.asignado ? ' · ' + din(s.asignado, mon) + '/mes' : '') + '</span></div></div>' +
      '<div class="sb-et">Saldo del sobre</div><div class="cifra-g' + (neg ? ' rojo' : '') + '">' + din(hs.saldo, mon) + '</div>' +
      (meta ? barra(pm) + '<div class="sb-et">' + Math.max(0, Math.round(pm * 100)) + '% de la meta' + (pm < 1 ? ' · faltan ' + din(meta - hs.saldo, mon) : ' · ¡lograda!') + '</div>' : '') +
      iconos([['📥', 'Meter', 'App.formSacarMeter(1)', true], ['📤', 'Sacar', 'App.formSacarMeter(-1)'], ['⚖', 'Igualar al BCR', 'App.formIgualar()'], ['✏️', 'Editar', 'App.editarSobre()']]) + '</div>';
    // período
    var r = SOB.f === 'mes' ? C.rangoPeriodo('mes', hoy) : SOB.f === 'pasado' ? C.rangoPeriodo('pasado', hoy) : [null, null];
    var en = hs.lista.filter(function (e) { var f = new Date(e.fecha); return (!r[0] || f >= r[0]) && (!r[1] || f < r[1]) && (SOB.f !== 'cargas' || e.monto >= 0) && (SOB.f !== 'descargas' || e.monto < 0); });
    var venia = hs.inicial; if (r[0]) hs.lista.forEach(function (e) { if (new Date(e.fecha) < r[0]) venia = e.despues; });
    var entro = 0, salio = 0; en.forEach(function (e) { if (e.monto >= 0) entro += e.monto; else salio -= e.monto; });
    var serie = C.saldosMensualesSobre(hs, hoy, 8), mx = Math.max.apply(null, serie.map(function (x) { return Math.abs(x.saldo || 0); }).concat([1]));
    h += '<div class="caja" style="gap:10px"><div class="tres-c"><div><span>' + (r[0] ? 'Venía (' + r[0].getDate() + ' ' + MESES_C[r[0].getMonth()] + ')' : 'Inicial') + '</span><b>' + din(venia, mon) + '</b></div>' +
      '<div><span>Entró</span><b class="verde-pos">+' + din(entro, mon) + '</b></div><div><span>Salió</span><b class="rojo">−' + din(salio, mon) + '</b></div></div>' +
      '<div class="mini-graf" aria-label="Saldo al final de cada mes">' + serie.map(function (x, i) {
        if (x.saldo === null) return '<i class="nada" title="' + esc(nombreMes(x.mes)) + ': todavía no usabas sobres"></i>';
        return '<i class="' + (i === serie.length - 1 ? 'ult' : '') + (x.saldo < 0 ? ' neg' : '') + '" style="height:' + Math.max(4, Math.abs(x.saldo) / mx * 100).toFixed(0) + '%" title="' + esc(nombreMes(x.mes)) + ': ' + esc(txt(x.saldo, mon)) + '"></i>';
      }).join('') + '</div><div class="fila suave" style="font-size:11.5px"><span>' + MESES_C[serie[0].mes.getMonth()] + '</span><span>saldo al final de cada mes</span><span>' + MESES_C[serie[serie.length - 1].mes.getMonth()] + '</span></div></div>';
    h += '<div class="chips desliza" id="sb-filtros">' + [['mes', 'Este mes'], ['pasado', 'Mes pasado'], ['todo', 'Todo'], ['cargas', 'Cargas'], ['descargas', 'Descargas']].map(function (x) {
      return '<button class="chip' + (SOB.f === x[0] ? ' on' : '') + '" onclick="App.sobreFiltro(\'' + x[0] + '\')">' + x[1] + '</button>';
    }).join('') + '</div>';
    SOB.vista = en.slice().reverse().slice(0, 200);
    if (!SOB.vista.length) h += '<div class="caja vacio">Sin movimientos en este período.</div>';
    else {
      var meses = [], por = {};
      SOB.vista.forEach(function (e, i) { var d = new Date(e.fecha), k = d.getFullYear() + '-' + d.getMonth(); if (!por[k]) { por[k] = { d: d, l: [], t: 0 }; meses.push(k); } por[k].l.push([e, i]); por[k].t += e.monto; });
      h += meses.map(function (k) {
        var g = por[k];
        return '<div class="dia"><span>' + MESES[g.d.getMonth()].toUpperCase() + (g.d.getFullYear() !== hoy.getFullYear() ? ' ' + g.d.getFullYear() : '') + '</span><span class="m">' + (oculto() ? '' : (g.t >= 0 ? '+' : '−') + txt(Math.abs(g.t), mon)) + '</span></div>' +
          '<div class="caja sinpad">' + g.l.map(function (p) {
            var e = p[0], carga = e.monto >= 0, d = new Date(e.fecha);
            return '<button class="item fb" onclick="App.verSobreMov(' + p[1] + ')"><span class="punto ' + (carga ? 'v' : 'r') + '"></span><span class="cuerpo"><span class="sbm-t ' + (carga ? 'verde-pos' : 'rojo') + '">' + (carga ? 'Carga' : 'Descarga') + '</span>' +
              '<span class="nombre" style="display:block">' + esc(descSobre(e)) + '</span><span class="det" style="display:block">Saldo final ' + din(e.despues, mon) + '</span></span>' +
              '<span class="monto"><b class="' + (carga ? 'verde-pos' : 'rojo') + '" style="display:block">' + (carga ? '+' : '−') + din(Math.abs(e.monto), mon) + '</b><span class="origen">' + d.getDate() + ' ' + MESES_C[d.getMonth()] + (hora(e.fecha) ? ' · ' + hora(e.fecha) : '') + '</span></span></button>';
          }).join('') + '</div>';
      }).join('');
    }
    $('p-sobre').innerHTML = h;
  }
  // ---- v2.10.0 · Igualar los sobres al saldo del BCR
  var IG = null;
  function saldoHoySobre(n) { return C.historialSobre(D, n).saldo; }
  function dispFijo() { var pri = cuentaPrincipal(); return !!(pri && (ORIG().dispAnotado || {})[pri]); }
  function formIgualar(nombre) {
    nombre = nombre || SOB.nombre;
    var s = sobreInfo(nombre); if (!s) return;
    var mon = s.moneda === 'USD' ? 'USD' : 'CRC';
    IG = { nombre: nombre, app: Math.round(saldoHoySobre(nombre) * 100) / 100, modo: 'si', mon: mon };
    abrir('<div class="suave chico">' + esc(nomSobre(nombre)) + '</div><h2>⚖ Igualar al BCR</h2>' +
      '<div class="caja" style="gap:6px"><div class="fila"><span class="suave">En la app</span><b>' + din(IG.app, mon) + '</b></div>' +
      '<label class="campo compacto"><span>Lo que dice el BCR</span><input id="ig-bcr" class="monto" data-dinero inputmode="decimal" oninput="App.igCalc()"></label>' +
      '<div class="fila" style="border-top:1px solid var(--linea);padding-top:8px"><b>Diferencia</b><b id="ig-dif">—</b></div></div>' +
      '<div class="caja" style="gap:8px"><div class="suave chico">¿Por qué no coincide?</div><div class="ajena-op" id="ig-ops"></div></div>' +
      '<div class="acciones"><button class="btn" id="ig-ok" onclick="App.guardarIgualar()" disabled>Igualar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    igCalc();
    setTimeout(function () { var e = $('ig-bcr'); if (e) e.focus(); }, 150);
  }
  function igCalc() {
    if (!IG) return;
    var v = C.leerNumero(val('ig-bcr')), dif = v === null ? null : Math.round((v - IG.app) * 100) / 100;
    IG.dif = dif;
    var e = $('ig-dif'); if (e) { e.textContent = dif === null ? '—' : Math.abs(dif) < 0.005 ? '✓ igual' : (dif > 0 ? '+' : '−') + txt(Math.abs(dif), IG.mon); e.className = dif === null ? '' : Math.abs(dif) < 0.005 ? 'verde-pos' : dif > 0 ? 'verde-pos' : 'rojo'; }
    var d = dif || 0, fijo = dispFijo();
    var ops = $('ig-ops');
    if (ops) ops.innerHTML = chipRev('✓ Corregir el sobre' + (fijo ? ' (el disponible no cambia)' : '') + '<br><span class="chico" style="font-weight:400;opacity:.8">Para cuando faltó anotar algo o el saldo inicial estaba mal</span>', 'App.igModo(\'si\')', IG.modo === 'si') +
      chipRev((d >= 0 ? '📥 Lo metí desde el disponible' : '📤 Lo saqué al disponible') + '<br><span class="chico" style="font-weight:400;opacity:.8">El disponible ' + (d >= 0 ? 'baja' : 'sube') + ' ' + txt(Math.abs(d), IG.mon) + '</span>', 'App.igModo(\'disp\')', IG.modo === 'disp');
    var ok = $('ig-ok'); if (ok) ok.disabled = !(dif !== null && Math.abs(dif) >= 0.005);
  }
  function igModo(m) { IG.modo = m; igCalc(); }
  /** Aplica la diferencia a un sobre: corrigiendo su saldo inicial o con una fila Meter/Sacar */
  function aplicarIgualar(nombre, dif, modo, listo2) {
    var s = sobreInfo(nombre); if (!s || Math.abs(dif) < 0.005) return listo2 && listo2();
    if (modo === 'disp') {
      filaSobre(dif > 0 ? C.TIPO_METER : C.TIPO_SACAR, nombre, Math.abs(dif), (dif > 0 ? 'Metido al sobre ' : 'Sacado del sobre ') + nomSobre(nombre) + ' · igualar al BCR', null, null, '', s.moneda === 'USD' ? 'USD' : 'CRC');
      return listo2 && listo2();
    }
    var nuevo = Math.round(((s.saldoInicial || 0) + dif) * 100) / 100;
    srv('guardarSobre', [{ fila: s.fila, asignado: s.asignado || 0, saldoInicial: nuevo, meta: s.meta || '', tipo: s.tipo || 'Variable' }], function () { if (listo2) listo2(); });
  }
  function guardarIgualar() {
    if (!IG || IG.dif === null || Math.abs(IG.dif) < 0.005) return;
    var b = $('ig-ok'); if (b) b.disabled = true;
    var n = IG.nombre, d = IG.dif;
    aplicarIgualar(n, d, IG.modo, function () { listo('⚖ ' + nomSobre(n) + ' igualado al BCR (' + (d > 0 ? '+' : '−') + txt(Math.abs(d), IG.mon) + ')'); });
  }
  function formIgualarTodos() {
    var lista = SB().lista.map(function (s) { return Object.assign({}, s, { saldo: saldoHoySobre(s.nombre) }); });
    IG = { todos: true, modo: 'si', lista: lista };
    var cpri = cuentaPorNombre(cuentaPrincipal()), dp = cpri ? disponibleDe(cpri) : null;
    abrir('<h2>⚖ Igualar todos al BCR</h2><div class="suave">Abrí la app del BCR y copiá el saldo de cada sobre. Dejá en blanco los que ya están iguales.</div>' +
      '<div class="caja sinpad" style="margin-top:10px"><div class="ig-fila suave chico" style="padding-top:10px"><span>Sobre</span><span>BCR</span><span style="text-align:right">Dif.</span></div>' +
      lista.map(function (s, i) {
        var mon = s.moneda === 'USD' ? 'USD' : 'CRC';
        return '<div class="ig-fila"><span><b>' + esc(nomSobre(s.nombre)) + '</b><span class="suave chico" style="display:block">app ' + txt(s.saldo, mon) + '</span></span>' +
          '<input class="monto pl-in" id="igt-' + i + '" data-dinero inputmode="decimal" placeholder="' + esc(numTexto(Math.round(s.saldo * 100) / 100)) + '" oninput="App.igTodosCalc()"><b class="chico" id="igd-' + i + '" style="text-align:right">—</b></div>';
      }).join('') + '</div>' +
      (dp ? '<div class="caja"><div class="ig-fila" style="padding:0;border:0"><span><b>Disponible</b><span class="suave chico" style="display:block">app ' + txt(dp.disponible, 'CRC') + '</span></span><input class="monto pl-in" id="igt-disp" data-dinero inputmode="decimal" oninput="App.igTodosCalc()"><b class="chico" id="igd-disp" style="text-align:right">—</b></div>' +
        '<div class="suave chico" id="ig-disp-nota"></div></div>' : '') +
      '<div class="caja" style="gap:6px"><div class="suave chico">Las diferencias de los sobres:</div><div class="chips">' + chipRev('✓ Corregir los sobres', 'App.igTodosModo(\'si\')', true) + chipRev('🪙 Meter/sacar del disponible', 'App.igTodosModo(\'disp\')') + '</div></div>' +
      '<div class="acciones"><button class="btn" id="igt-ok" onclick="App.guardarIgualarTodos()" disabled>Igualar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function igTodosModo(m) { IG.modo = m; document.querySelectorAll('#panel .chips .chip').forEach(function (c) { c.classList.toggle('on', /Corregir/.test(c.textContent) === (m === 'si')); }); }
  function igTodosCalc() {
    var lista = IG.lista, n = 0;
    lista.forEach(function (s, i) {
      var v = C.leerNumero(val('igt-' + i)), e = $('igd-' + i), mon = s.moneda === 'USD' ? 'USD' : 'CRC';
      if (v === null) { e.textContent = '—'; e.className = 'chico'; return; }
      var d = Math.round((v - s.saldo) * 100) / 100;
      if (Math.abs(d) < 0.005) { e.textContent = '✓'; e.className = 'chico verde-pos'; return; }
      n++; e.textContent = (d > 0 ? '+' : '−') + txt(Math.abs(d), mon); e.className = 'chico ' + (d > 0 ? 'verde-pos' : 'rojo');
    });
    var cpri = cuentaPorNombre(cuentaPrincipal()), dp = cpri ? disponibleDe(cpri) : null;
    if (dp && $('igt-disp')) {
      var v2 = C.leerNumero(val('igt-disp')), e2 = $('igd-disp'), nt = $('ig-disp-nota');
      if (v2 === null) { e2.textContent = '—'; nt.textContent = ''; }
      else { var d2 = Math.round((v2 - dp.disponible) * 100) / 100; e2.textContent = Math.abs(d2) < 0.005 ? '✓ igual' : (d2 > 0 ? '+' : '−') + txt(Math.abs(d2), 'CRC'); e2.className = 'chico ' + (Math.abs(d2) < 0.005 ? 'verde-pos' : 'rojo'); nt.textContent = Math.abs(d2) < 0.005 ? '' : 'Después de igualar los sobres, si el disponible sigue distinto usá Cuadrar en la cuenta.'; }
    }
    var ok = $('igt-ok'); if (ok) { ok.disabled = !n; ok.textContent = n ? 'Igualar ' + n + ' sobre' + (n === 1 ? '' : 's') : 'Igualar'; }
  }
  function guardarIgualarTodos() {
    var lista = IG.lista, cambios = [];
    lista.forEach(function (s, i) { var v = C.leerNumero(val('igt-' + i)); if (v !== null && Math.abs(v - s.saldo) >= 0.005) cambios.push([s.nombre, Math.round((v - s.saldo) * 100) / 100]); });
    if (!cambios.length) return;
    var b = $('igt-ok'); if (b) b.disabled = true;
    var modo = IG.modo, k = 0;
    (function sig() {
      if (k >= cambios.length) return listo('⚖ ' + cambios.length + ' sobre' + (cambios.length === 1 ? '' : 's') + ' igualado' + (cambios.length === 1 ? '' : 's') + ' al BCR');
      var c = cambios[k++]; aplicarIgualar(c[0], c[1], modo, sig);
    })();
  }
  function irListaSobre() { if (SOB.f !== 'todo') { SOB.f = 'todo'; pintar(); } var e = $('sb-filtros'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function editarSobre() { var i = -1; SB().lista.forEach(function (s, k) { if (s.nombre === SOB.nombre) i = k; }); if (i >= 0) formSobre(i, true); }
  function verSobreMov(k) {
    var e = SOB.vista[k]; if (!e) return;
    var mon = (sobreInfo(SOB.nombre) || {}).moneda === 'USD' ? 'USD' : 'CRC', carga = e.monto >= 0, m = e.movimiento ? movPorFila(e.movimiento) : null;
    var otros = e.grupo ? (D.sobresMov || []).filter(function (x) { return x.grupo === e.grupo && x.sobre && x.sobre !== SOB.nombre; }).length : 0;
    var d = new Date(e.fecha);
    var linea = function (a, b) { return '<div class="fila"><span class="suave">' + a + '</span><b style="text-align:right">' + b + '</b></div>'; };
    abrir('<div class="sbm-t ' + (carga ? 'verde-pos' : 'rojo') + '" style="font-size:12px;letter-spacing:.6px">' + (carga ? 'CARGA' : 'DESCARGA') + '</div><h2>' + esc(descSobre(e)) + '</h2>' +
      '<div class="cifra-g ' + (carga ? 'verde-pos' : 'rojo') + '">' + (carga ? '+' : '−') + din(Math.abs(e.monto), mon) + '</div>' +
      '<div class="caja" style="gap:8px;margin-top:10px;background:var(--fondo)">' + linea('Fecha', fechaCorta(e.fecha) + (hora(e.fecha) ? ' · ' + hora(e.fecha) : '')) +
      linea('Sobre', iconoSobre(SOB.nombre) + ' ' + esc(nomSobre(SOB.nombre))) + linea('Saldo antes', din(e.antes, mon)) + linea('Saldo después', din(e.despues, mon)) +
      (m ? linea('Movimiento', esc(nombreBonito(m.comercio) || m.tipo) + (m.cuenta ? ' · ' + esc(etiquetaCuenta(m.cuenta)) : '') + ' · ' + din(m.monto, m.moneda)) : '') +
      (otros ? linea('Junto con', otros + ' sobre' + (otros === 1 ? '' : 's') + ' más (mismo ' + (e.tipo === 'Mover' ? 'movimiento' : 'reparto') + ')') : '') +
      (e.nota && !m ? linea('Nota', esc(e.nota)) : '') + '</div>' +
      '<div class="acciones">' + (m ? '<button class="btn sec" onclick="App.cerrar();App.formMovimiento(' + m.fila + ')">Ver el movimiento</button>' : '') +
      (e.grupo ? '<button class="btn sec peligro" id="sbm-desh" onclick="App.deshacerSobreMov(' + k + ')">Deshacer ' + (otros && e.tipo !== 'Mover' ? 'este reparto' : 'esto') + '</button>' : '') +
      '<button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>' +
      (e.grupo ? '' : '<div class="suave chico" style="margin-top:8px">Esto sale solo (préstamo o regla del correo); para cambiarlo, abrí el movimiento.</div>'));
  }
  function deshacerSobreMov(k) {
    var e = SOB.vista[k], b = $('sbm-desh'); if (!e || !e.grupo) return;
    if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Tocá otra vez'; return; }
    encolar('eliminarGrupoSobres', [e.grupo], 'Deshacer en ' + nomSobre(SOB.nombre) + ': ' + descSobre(e));
    hecho('Deshecho.' + (e.movimiento ? ' Ese movimiento quedó por asignar.' : ''));
  }
  // Cargar (dir 1) / Descargar (dir -1)
  var CG = null;
  function formCargarSobre(dir, op) {
    var s = sobreInfo(SOB.nombre); if (!s) return;
    var montoPrev = $('cg-monto') && CG ? val('cg-monto') : '';
    CG = { dir: dir, op: op || (CG && CG.dir === dir ? CG.op : 'sobre') };
    var mon = s.moneda === 'USD' ? 'USD' : 'CRC', sb = SB();
    var pend = sb.pendientes.filter(function (p) { return (p.mov.moneda === 'USD' ? 'USD' : 'CRC') === mon && (dir > 0 ? p.sentido === 'entra' : p.sentido === 'sale' && p.mov.tipo !== 'Pago de tarjeta'); });
    var o = ORIG(), cp = cuentaPorNombre(o.principal), libre = null;
    if (cp && mon === 'CRC') { var sc = C.saldoCuenta(D, cp, o); if (sc.vivo) { var sbH = C.saldosSobres(D, hoy, hoy); libre = sc.CRC - sbH.total.CRC - (sbH.reservadoTotal || 0); } }
    var otrosS = sb.lista.filter(function (x) { return x.nombre !== s.nombre && x.moneda === s.moneda; });
    var op1 = function (k, tit, det, extra, deshab) {
      return '<div class="op-g' + (CG.op === k ? ' on' : '') + (deshab ? ' apagado' : '') + '" role="button" tabindex="0" onclick="' + (deshab ? '' : 'App.formCargarSobre(' + dir + ',\'' + k + '\')') + '"><b>' + tit + '</b><span>' + det + '</span>' + (CG.op === k && extra ? '<div class="op-x" onclick="event.stopPropagation()">' + extra + '</div>' : '') + '</div>';
    };
    var selS = '<select id="cg-sobre">' + otrosS.map(function (x) { return '<option value="' + esc(x.nombre) + '">' + esc(nomSobre(x.nombre)) + ' · ' + txt(x.saldo, x.moneda) + '</option>'; }).join('') + '</select>';
    var selM = '<select id="cg-mov" onchange="App.cgMov()">' + pend.map(function (p) { return '<option value="' + p.mov.fila + '">' + esc((nombreBonito(p.mov.comercio) || p.mov.tipo) + ' · ' + fechaCorta(p.mov.fecha).replace(/ \d{4}$/, '') + ' · falta ' + txt(p.falta, mon)) + '</option>'; }).join('') + '</select>';
    var h = '<h2>' + (dir > 0 ? '📥 Cargar' : '📤 Descargar') + ' «' + esc(nomSobre(s.nombre)) + '»</h2><div class="suave">' + (dir > 0 ? '¿De dónde viene la plata?' : '¿A dónde va la plata?') + '</div>' +
      op1('sobre', dir > 0 ? '⇄ Desde otro sobre' : '⇄ A otro sobre', dir > 0 ? 'Mover de un sobre a este' : 'Mover de este sobre a otro', selS, !otrosS.length) +
      (dir > 0 ? op1('mov', '💰 De un ingreso por asignar', pend.length ? pend.length + ' por asignar · SINPE recibido, salario…' : 'No hay ingresos por asignar', selM, !pend.length)
        : op1('mov', '🧾 A un gasto sin sobre', pend.length ? pend.length + ' gasto' + (pend.length === 1 ? '' : 's') + ' sin sobre' : 'No hay gastos sin sobre', selM, !pend.length)) +
      op1('libre', dir > 0 ? '🪙 De lo libre en la cuenta' : '🪙 A lo libre en la cuenta', dir > 0 ? 'Plata de la cuenta que no está en ningún sobre' + (libre !== null ? ' (' + txt(libre, 'CRC') + ')' : '') : 'Sale del sobre y queda libre en la cuenta', '') +
      '<label class="campo"><span>Monto</span><input id="cg-monto" class="monto" data-dinero inputmode="decimal" placeholder="0" value="' + esc(montoPrev) + '" oninput="App.cgBoton()"></label>' +
      '<div class="acciones"><button class="btn" id="cg-ok" onclick="App.guardarCargar()">' + (dir > 0 ? 'Cargar' : 'Descargar') + '</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    abrir(h);
    if (CG.op === 'mov' && !montoPrev) cgMov(); else cgBoton();
  }
  function cgPend() { var f = Number(val('cg-mov')); return SB().pendientes.filter(function (p) { return p.mov.fila === f; })[0]; }
  function cgMov() { var p = cgPend(); if (p && $('cg-monto')) { $('cg-monto').value = String(Math.round(p.falta * 100) / 100).replace('.', ','); } cgBoton(); }
  function cgBoton() { var b = $('cg-ok'), v = C.leerNumero(val('cg-monto')); if (b && CG) b.textContent = (CG.dir > 0 ? 'Cargar ' : 'Descargar ') + (v ? txt(v, (sobreInfo(SOB.nombre) || {}).moneda || 'CRC') : ''); }
  function guardarCargar() {
    var s = sobreInfo(SOB.nombre), dir = CG.dir, monto = C.leerNumero(val('cg-monto'));
    if (!monto || monto <= 0) return toast('Escribí el monto.');
    var g = grupoNuevo(), f = new Date().toISOString(), yo = s.nombre, lista, desc, mon = s.moneda;
    if (CG.op === 'sobre') {
      var otro = val('cg-sobre'); if (!otro || otro === yo) return toast('Elegí otro sobre.');
      var de = dir > 0 ? otro : yo, a = dir > 0 ? yo : otro, nota = 'De ' + de + ' a ' + a;
      lista = [{ fecha: f, sobre: de, monto: -monto, tipo: 'Mover', grupo: g, nota: nota }, { fecha: f, sobre: a, monto: monto, tipo: 'Mover', grupo: g, nota: nota }];
      desc = 'Mover ' + de + ' → ' + a + ' · ' + txt(monto, mon);
    } else if (CG.op === 'mov') {
      var p = cgPend(); if (!p) return toast('Elegí el movimiento.');
      if (monto > p.falta + 0.005) return toast('A ese movimiento solo le faltan ' + txt(p.falta, mon) + '.');
      lista = [{ fecha: fechaSobre(p.mov), sobre: yo, monto: dir * monto, tipo: dir > 0 ? 'Ingreso' : p.tarjeta ? 'Compra con tarjeta' : 'Gasto', movimiento: p.mov.fila, grupo: g, nota: p.mov.comercio || '' }];
      desc = 'Asignar ' + (p.mov.comercio || p.mov.tipo) + ' → ' + yo + ' · ' + txt(monto, mon);
    } else {
      lista = [{ fecha: f, sobre: yo, monto: dir * monto, tipo: dir > 0 ? 'Cargar' : 'Descargar', grupo: g, nota: dir > 0 ? 'Desde lo libre de la cuenta' : 'A lo libre de la cuenta' }];
      desc = (dir > 0 ? 'Cargar ' : 'Descargar ') + yo + ' · ' + txt(monto, mon);
    }
    encolar('guardarSobresMov', [lista], desc);
    hecho('✅ ' + (dir > 0 ? 'Cargado ' : 'Descargado ') + txt(monto, mon) + (dir > 0 ? ' a ' : ' de ') + nomSobre(yo));
  }

  // ---- v2.5.7: ¿de dónde vino esta plata? (entradas a una cuenta que la app no puede explicar sola)
  function sinOrigen() {
    if (!D) return [];
    var ef = C.efectosCuentas(D, ORIG()), lim = new Date(hoy.getTime() - 60 * 86400000);
    return (ef.sinOrigen || []).filter(function (x) {
      var c = cuentaPorNombre(x.cuenta), desde = c && c.fechaSaldo ? new Date(c.fechaSaldo) : null;
      var f = new Date(x.mov.fecha);
      return f >= lim && (!desde || f > desde) && x.mov.fila > 0;
    }).sort(function (a, b) { return new Date(b.mov.fecha) - new Date(a.mov.fecha); });
  }
  var OP = null;
  function formOrigenPlata(fila, op) {
    var m = movPorFila(fila); if (!m) return;
    var x = sinOrigen().filter(function (y) { return y.mov.fila === fila; })[0], dest = x ? x.cuenta : m.cuenta;
    var otras = cuentasAhorro().map(function (c) { return c.nombre; }).filter(function (n) { return n !== dest; });
    if (!OP || OP.fila !== fila) OP = { fila: fila, op: otras.length ? 'cuenta' : 'ingreso', cuenta: otras.indexOf(ORIG().principal) >= 0 ? ORIG().principal : otras[0], sobre: '' };
    if ($('op-cuenta')) OP.cuenta = val('op-cuenta');
    if ($('op-sobre')) OP.sobre = val('op-sobre');
    if (op) OP.op = op;
    var mon = m.moneda === 'USD' ? 'USD' : 'CRC';
    var bloque = function (k, tit, det, extra, apagado) {
      return '<div class="op-g' + (OP.op === k ? ' on' : '') + (apagado ? ' apagado' : '') + '" role="button" tabindex="0" onclick="' + (apagado ? '' : 'App.formOrigenPlata(' + fila + ',\'' + k + '\')') + '"><b>' + tit + '</b><span>' + det + '</span>' + (OP.op === k && extra ? '<div class="op-x" onclick="event.stopPropagation()">' + extra + '</div>' : '') + '</div>';
    };
    var selC = '<select id="op-cuenta">' + opciones(otras, OP.cuenta) + '</select>';
    var selS = true ? '' : '<label class="campo compacto" style="margin-top:8px"><span>¿Era plata de un sobre?</span><select id="op-sobre"><option value="__sin">No, era plata libre</option>' + opcionesSobre(mon, OP.sobre, true) + '</select></label>' +
      '<div class="suave chico" style="margin-top:6px">✓ Si elegís un sobre, cuando llegue el pago de la tarjeta por este monto se descuenta de ese sobre solo.</div>';
    abrir('<div class="suave chico">' + esc(etiquetaCuenta(dest)) + ' · ' + fechaCorta(m.fecha) + (hora(m.fecha) ? ' ' + hora(m.fecha) : '') + '</div><h2>¿De dónde vino esta plata?</h2>' +
      '<div class="cifra-g verde-pos">+' + din(m.monto, mon) + '</div>' +
      bloque('cuenta', '🏦 De mi cuenta' + (otras.length === 1 ? ' ' + esc(otras[0]) : ''), otras.length ? 'La resto de esa cuenta.' : 'No tenés otra cuenta de ahorro en la app.', (otras.length > 1 ? selC : '') + selS, !otras.length) +
      bloque('ingreso', '💰 Me pagaron (venta, me devolvieron…)', 'Es ingreso: la repartís en sobres como cualquier entrada.') +
      bloque('fuera', '🔁 De otra cuenta mía que no está en la app', 'Suma en ' + esc(dest) + ' sin restar de ninguna cuenta.') +
      '<div class="acciones"><button class="btn" id="op-ok" onclick="App.guardarOrigenPlata(' + fila + ')">Listo</button><button class="btn sec" onclick="App.cerrar()">Ahora no</button></div>');
    if (OP.sobre && $('op-sobre')) $('op-sobre').value = OP.sobre;
  }
  function guardarOrigenPlata(fila) {
    var m = movPorFila(fila); if (!m || !OP) return;
    if ($('op-cuenta')) OP.cuenta = val('op-cuenta');
    if ($('op-sobre')) OP.sobre = val('op-sobre');
    var sobre = OP.sobre && OP.sobre.indexOf('__') !== 0 ? OP.sobre : '';
    if (OP.op === 'cuenta') {
      if (!OP.cuenta) return toast('Elegí la cuenta.');
      encolar('marcarMovimiento', [fila, 'Desde', 'Cuenta: ' + OP.cuenta + (sobre ? ' | Sobre: ' + sobre : ''), { monto: m.monto }], 'De dónde vino: ' + OP.cuenta + (sobre ? ' · sobre ' + sobre : ''));
      OP = null; hecho('✅ Listo: la plata salió de ' + OP_cuentaTxt(m, fila) + (sobre ? '. El pago de la tarjeta se descuenta de ' + nomSobre(sobre) + ' solo.' : '.'));
      autoSobreDesde();
    } else if (OP.op === 'fuera') {
      encolar('marcarMovimiento', [fila, 'Desde', 'Fuera de la app', { monto: m.monto }], 'De dónde vino: otra cuenta fuera de la app');
      OP = null; hecho('✅ Listo: suma en la cuenta sin restar de ninguna otra.');
    } else {
      var nm = { fila: fila, control: { monto: m.monto }, fecha: m.fecha, monto: m.monto, moneda: m.moneda, tipo: 'Ingreso', comercio: /^entr[oó] a/i.test(m.comercio || '') ? 'Me pagaron (' + (m.cuenta || 'cuenta') + ')' : m.comercio,
        lugar: m.lugar, cuenta: m.cuenta, categoria: m.categoria, sobre: '', nota: m.nota, origen: m.origen, autorizacion: m.autorizacion };
      encolar('guardarMovimiento', [nm], 'Ingreso: ' + (nm.comercio || 'me pagaron') + ' · ' + txt(m.monto, m.moneda));
      OP = null; cerrar(); pintar(); toast('💰 Es ingreso. Ahora repartilo en sobres.', 3500);
      setTimeout(function () { formAsignar(fila); }, 350);
    }
  }
  function OP_cuentaTxt(m, fila) { var d = C.leerDesde(movPorFila(fila) || {}); return d && d.cuenta ? d.cuenta : 'tu cuenta'; }
  /** Pago de tarjeta pendiente de sobre que se pagó con plata pasada desde un sobre → se asigna solo a ese sobre. */
  function autoSobreDesde() {
    return;   // v2.8.0: ya no se usa (el sobre se elige al sacar la plata)
    if (!D || sinServidorSobres()) return;
    var hechos = leerJSONSeguro('mf-auto-sobre') || [], cambios = 0;
    D.movimientos.forEach(function (t) {
      var de = t.tipo === 'Transferencia' ? C.leerDesde(t) : null;
      if (!de || !de.sobre || t.fila < 0) return;
      var p = SB().pendientes.filter(function (x) {
        return x.mov.tipo === 'Pago de tarjeta' && x.mov.fila > 0 && x.falta > 0.005 && Math.abs(x.mov.monto - t.monto) < 0.01 && (x.mov.moneda || 'CRC') === (t.moneda || 'CRC') &&
          Math.abs(new Date(x.mov.fecha) - new Date(t.fecha)) <= 3 * 86400000 && hechos.indexOf(x.mov.fila + '|' + t.fila) < 0;
      })[0];
      if (!p) return;
      hechos.push(p.mov.fila + '|' + t.fila); cambios++;
      encolar('guardarSobresMov', [[{ fecha: fechaSobre(p.mov), sobre: de.sobre, monto: -Math.round(p.falta * 100) / 100, tipo: 'Pago tarjeta', movimiento: p.mov.fila, grupo: grupoNuevo(), nota: 'Plata pasada desde ' + de.cuenta }]],
        'Pago de ' + etiquetaCuenta(p.mov.cuenta) + ' → sobre ' + de.sobre + ' (solo)');
      sbMemo = null;
    });
    if (cambios) { guardar('mf-auto-sobre', JSON.stringify(hechos.slice(-200))); toast('✉ Pago de tarjeta descontado solo del sobre elegido.', 3500); if (D) pintar(); }
  }

  // ==================================================================== v2.6.0 · PARA REVISAR + TODO AL DÍA
  function claveMov(m) { return m.autorizacion ? 'a:' + m.autorizacion : 'f:' + m.fila + '|' + m.monto + '|' + String(m.fecha || '').slice(0, 10); }
  var DIAS_REV = 30;
  function vistos() {
    var v = leerJSONSeguro('mf-vistos');
    if (!v && D) {   // la primera vez: lo de más de 2 días se da por visto (no se llena de cosas viejas)
      v = {}; var lim = hoy.getTime() - 2 * 86400000;
      D.movimientos.forEach(function (m) { if (m.fecha && new Date(m.fecha).getTime() < lim) v[claveMov(m)] = 1; });
      guardar('mf-vistos', JSON.stringify(v));
    }
    return v || {};
  }
  function marcarVistos(lista) {
    var v = vistos(), lim = hoy.getTime() - (DIAS_REV + 5) * 86400000, vivos = {};
    lista.forEach(function (m) { v[claveMov(m)] = 1; });
    D.movimientos.forEach(function (m) { var k = claveMov(m); if (v[k] && m.fecha && new Date(m.fecha).getTime() >= lim) vivos[k] = 1; });
    guardar('mf-vistos', JSON.stringify(vivos));
  }
  function revisarData() {
    var vacio = { accion: [], listos: [], nuevos: [], confirmar: [] };
    if (!D) return vacio;
    var v = vistos(), lim = hoy.getTime() - DIAS_REV * 86400000;
    var sb = sinServidorSobres() ? null : SB(), pendFila = {}, accion = [], listos = [];
    if (sb) sb.pendientes.forEach(function (p) { if (p.mov.fila > 0) { pendFila[p.mov.fila] = p; accion.push({ tipo: p.sentido === 'entra' ? 'entra' : 'sobre', mov: p.mov, p: p }); } });
    var ajFila = {};   // v2.9.0: compras de tarjetas que no están en Cuentas → "¿Es tuya?"
    D.movimientos.forEach(function (m) { if (m.fila > 0 && m.fecha && new Date(m.fecha).getTime() >= lim - 30 * 86400000 && C.tarjetaDesconocida(D, m)) { ajFila[m.fila] = 1; accion.push({ tipo: 'ajena', mov: m, u4: C.tarjetaDesconocida(D, m) }); } });
    var so = sinOrigen().filter(function (x) { return !ajFila[x.mov.fila]; }), soFila = {};
    so.forEach(function (x) { soFila[x.mov.fila] = 1; accion.push({ tipo: 'origen', mov: x.mov, cuenta: x.cuenta }); });
    var nuevos = D.movimientos.filter(function (m) { return m.fila > 0 && m.fecha && new Date(m.fecha).getTime() >= lim && !v[claveMov(m)]; });
    var ivaFila = {}; preguntasIVA().forEach(function (m) { if (ajFila[m.fila]) return; ivaFila[m.fila] = 1; accion.push({ tipo: 'iva', mov: m }); });
    var confirmar = D.movimientos.filter(function (m) { return m.fila > 0 && m.fecha && new Date(m.fecha).getTime() >= lim && porConfirmar(m); });
    var confFila = {}; confirmar.forEach(function (m) { confFila[m.fila] = 1; });
    nuevos.forEach(function (m) {
      if (pendFila[m.fila] || soFila[m.fila] || ivaFila[m.fila] || ajFila[m.fila]) return;
      if (transferenciaDudosa(m)) accion.push({ tipo: 'direccion', mov: m });
      else if (m.tipo === 'Gasto' && !m.categoria && !m.para && !C.esFamilia(m) && !/@/.test(m.viaje || '')) accion.push({ tipo: 'categoria', mov: m });
      else if (!confFila[m.fila]) listos.push(m);
    });
    var porFecha = function (a, b) { return new Date((b.mov || b).fecha) - new Date((a.mov || a).fecha); };
    accion.sort(porFecha); listos.sort(porFecha);
    confirmar.sort(porFecha);
    return { accion: accion, listos: listos, nuevos: nuevos, confirmar: confirmar };
  }
  /** Lo que la app hizo sola con un movimiento (una línea) */
  function queHizo(m, ef) {
    var sb = sinServidorSobres() ? null : SB();
    var mios = ef.filter(function (e) { return e.mov === m; });
    if (m.tipo === 'Pago de tarjeta') {
      var de = mios.filter(function (e) { return e.grupo === 'pagos'; })[0];
      var sc0 = sb ? (sb.porMov[m.fila] || []).filter(function (x) { return /Con lo sacado de /.test(x.nota || ''); }) : [];
      return 'Pago de la tarjeta' + (sc0.length ? ' con lo sacado de ' + sc0.map(textoSacado).join(' + ') : '') + (de ? ' · sale de ' + de.cuenta : '');
    }
    if (m.tipo === 'Transferencia') {
      var pago = D.movimientos.filter(function (p) { return p.tipo === 'Pago de tarjeta' && Math.abs(p.monto - m.monto) < 0.01 && Math.abs(new Date(p.fecha) - new Date(m.fecha)) < 2 * 86400000; })[0];
      if (!C.entraTransferencia(m) && pago && !mios.length) return 'Es el pago de ' + etiquetaCuenta(pago.cuenta);
      var d = C.leerDesde(m);
      return 'Entre tus cuentas' + (d && d.cuenta ? ' · vino de ' + d.cuenta : d && d.tipo === 'fuera' ? ' · de fuera de la app' : '');
    }
    if (m.para) return '🤝 Para ' + m.para + ' (Me deben)';
    if (C.esFamilia(m)) return '👪 Tarjeta de ' + infoFamilia(m.cuenta).persona + ' · solo cuenta en viajes';
    if (C.esCompraTarjeta(D, m)) return 'Suma a la deuda de ' + etiquetaCuenta(m.cuenta) + (m.categoria ? ' · ' + m.categoria : '');
    if (C.esSacarMeter(m)) return (m.tipo === C.TIPO_SACAR ? '📤 Sale del sobre ' : '📥 Entra al sobre ') + nomSobre(m.sobre) + (m.tipo === C.TIPO_SACAR ? ' → disponible' : ' ← disponible');
    var fs0 = sb ? (sb.porMov[m.fila] || []) : [];
    var sac = fs0.filter(function (x) { return /Con lo sacado de /.test(x.nota || ''); });
    if (sac.length) return '✓ Con lo sacado de ' + sac.map(textoSacado).join(' + ');
    if (fs0.length && fs0.every(function (x) { return !x.sobre; })) return '🪙 ' + (fs0[0].monto > 0 ? 'Quedó en el disponible' : 'Salió del disponible');
    var filas = sb ? (sb.porMov[m.fila] || []).filter(function (x) { return x.sobre; }) : [];
    var nombres = []; filas.forEach(function (x) { if (nombres.indexOf(x.sobre) < 0) nombres.push(x.sobre); });
    if (nombres.length) return '✉ ' + nombres.map(nomSobre).join(', ');
    if (m.sobre) return '✉ ' + nomSobre(m.sobre) + ' (recordado)';
    if (sb && sb.cubierto[m.fila]) return 'Cubierto con lo reservado';
    return (m.categoria ? m.categoria + ' · ' : '') + (m.cuenta ? etiquetaCuenta(m.cuenta) : 'sin cuenta');
  }
  /** "Con lo sacado de A + B · SAC-1 SAC-2" → "A ₡10.000 + B ₡5.000" (los montos salen de las sacadas) */
  function textoSacado(x) {
    var auts = ((x.nota || '').split(' · ')[1] || '').split(' ').filter(String);
    var sacs = auts.map(function (au) { return D.movimientos.filter(function (m) { return m.autorizacion === au && m.tipo === C.TIPO_SACAR; })[0]; }).filter(Boolean);
    if (sacs.length) return sacs.map(function (m) { return nomSobre(m.sobre) + ' ' + txt(m.monto, 'CRC'); }).join(' + ');
    return (x.nota || '').replace(/^Con lo sacado de /, '').replace(/ · .*$/, '').split(' + ').map(nomSobre).join(' + ');
  }
  /** Sobres sugeridos para un movimiento: regla, el último usado con ese comercio, uno con el nombre de la categoría */
  function sugerirSobres(m, sentido) {
    var nombres = SB().lista.map(function (s) { return s.nombre; }), out = [];
    var add = function (n) { if (n && nombres.indexOf(n) >= 0 && out.indexOf(n) < 0) out.push(n); };
    if (m.tipo === 'Pago de tarjeta') add(sobreTarjetas());
    add(m.sobre);
    var com = sinTildes(m.comercio || '').slice(0, 14);
    if (com) {
      var porFila = {}; D.movimientos.forEach(function (x) { porFila[x.fila] = x; });
      (D.sobresMov || []).slice().reverse().forEach(function (x) {
        var mm = x.movimiento ? porFila[x.movimiento] : null;
        if (mm && mm !== m && x.sobre && sinTildes(mm.comercio || '').slice(0, 14) === com && (sentido === 'entra') === (x.monto > 0)) add(x.sobre);
      });
    }
    var cat = sinTildes(m.categoria || '');
    if (cat) nombres.forEach(function (n) { var s = sinTildes(nomSobre(n)); if (s.indexOf(cat.slice(0, 5)) >= 0 || (/servic/.test(cat) && /servic|luz|agua|internet/.test(s))) add(n); });
    if (out.length < 2) SB().lista.filter(function (s) { return s.moneda === (m.moneda === 'USD' ? 'USD' : 'CRC') && (sentido === 'entra' || s.saldo > 0.005); })   // v2.8.0: si no hay pista, los sobres con más plata
      .sort(function (a, b) { return b.saldo - a.saldo; }).forEach(function (s) { add(s.nombre); });
    return out.slice(0, sentido === 'entra' ? 2 : 3);
  }
  function sugerirCategorias(m) {
    var out = [], cats = D.categorias || [], cuenta = {};
    var com = sinTildes(m.comercio || '').slice(0, 10);
    D.movimientos.forEach(function (x) { if (x !== m && x.categoria && x.tipo === 'Gasto') { cuenta[x.categoria] = (cuenta[x.categoria] || 0) + 1; if (com && sinTildes(x.comercio || '').slice(0, 10) === com && out.indexOf(x.categoria) < 0) out.push(x.categoria); } });
    Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a]; }).forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); });
    if (!out.length) out = cats.slice();
    return out.slice(0, 3);
  }
  function tarjetaRevisar(res) {
    var r = revisarData(), n = r.accion.length, l = r.listos.length, cf = r.confirmar.length;
    if (!n && !l && !cf) return '';
    var nuevos = r.nuevos.length;
    return '<button class="caja rev-ini' + (n ? ' borde-acento' : '') + '" onclick="App.ir(\'revisar\')"><span class="av-rev">📥</span><span class="cuerpo"><b>' +
      (nuevos ? 'Llegaron ' + nuevos + ' movimiento' + (nuevos === 1 ? '' : 's') : 'Para revisar') + '</b><span class="chico">' +
      (l ? '<span class="verde-pos">' + l + ' listo' + (l === 1 ? '' : 's') + ' ✓</span>' : '') + (l && n ? ' · ' : '') +
      (n ? '<span class="acento">' + n + ' necesita' + (n === 1 ? '' : 'n') + ' un toque</span>' : '') + ((l || n) && cf ? ' · ' : '') + (cf ? '<span class="suave">' + cf + ' por confirmar</span>' : '') + '</span></span><span class="flecha acento">›</span></button>';
  }
  function chipRev(txt, accion, on) { return '<button class="chip' + (on ? ' on' : '') + '" onclick="' + accion + '">' + txt + '</button>'; }
  function q(s) { return esc(s).replace(/'/g, "\\'"); }
  function pRevisar() {
    var r = revisarData(), ef = C.efectosCuentas(D, ORIG());
    var h = cabSimple('Para revisar', 'Lo que llegó');
    if (!r.accion.length && !r.listos.length && !r.confirmar.length) {
      h += '<div class="caja" style="text-align:center;gap:6px;padding:22px"><div style="font-size:36px">✅</div><b style="font-size:17px">Todo al día</b><span class="suave chico">No llegó nada nuevo y no hay nada pendiente.</span>' +
        (leerJSONSeguro('mf-ultimo-lote') ? '<button class="btn sec" style="margin-top:10px" onclick="App.ir(\'aldia\')">Ver cómo quedó lo último</button>' : '') + '</div>';
      $('p-revisar').innerHTML = h; return;
    }
    var cab = function (m, x) {
      var ic = iconoMov(m), entra = m.tipo === 'Ingreso' || m.tipo === 'Retiro de fondo' || (m.tipo === 'Transferencia' && C.entraTransferencia(m));
      return '<div class="rev-cab" onclick="App.formMovimiento(' + m.fila + ')"><span class="ico-cat" style="background:color-mix(in srgb, ' + ic[1] + ' 18%, transparent);color:' + ic[1] + '">' + ic[0] + '</span>' +
        '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(x || nombreBonito(m.comercio) || m.tipo) + '</span><span class="det" style="display:block">' +
        fechaCorta(m.fecha).replace(/ \d{4}$/, '') + (hora(m.fecha) ? ' ' + hora(m.fecha) : '') + (m.cuenta ? ' · ' + esc(etiquetaCuenta(m.cuenta)) : '') + '</span></span>' +
        '<span class="monto"><b class="' + (entra ? 'verde-pos' : '') + '">' + (entra ? '+' : m.tipo === 'Gasto' ? '−' : '') + din(m.monto, m.moneda).replace('−', '') + '</b></span></div>';
    };
    if (r.accion.length) {
      h += '<div class="seccion-t">NECESITAN UN TOQUE · ' + r.accion.length + '</div>';
      h += r.accion.map(function (a) {
        var m = a.mov, f = m.fila, cuerpo = '';
        if (a.tipo === 'ajena') {
          cuerpo = '<div class="rev-q">Llegó una compra con la tarjeta <b>••' + esc(a.u4) + '</b>, que no está en tus cuentas. <b>¿Es tuya?</b></div><div class="ajena-op">' +
            chipRev('➕ Sí, agregarla a mis cuentas', 'App.rvAjena(' + f + ',\'si\')') + chipRev('👪 De mi familia · solo para viajes', 'App.formFamiliaTarjeta(\'' + q(a.u4) + '\',' + f + ')', true) + chipRev('🚫 No es mía · ignorar esta tarjeta', 'App.rvAjena(' + f + ',\'no\')') +
            chipRev('1️⃣ Solo esta vez (borrar esta compra)', 'App.rvAjena(' + f + ',\'una\')') + '</div><div class="suave chico" style="margin-top:8px">No se anota en ninguna cuenta ni sobre hasta que respondás.</div>';
        } else if (a.tipo === 'sobre' && !sacadasNo[f] && (a.sac = infoSacadas(a.p))) {
          if (m.tipo === 'Gasto' && !m.categoria) cuerpo += '<div class="rev-q">¿Qué categoría?</div><div class="chips">' + sugerirCategorias(m).map(function (c) { return chipRev(iconoMov({ tipo: 'Gasto', categoria: c })[0] + ' ' + esc(c), 'App.rvCategoria(' + f + ',\'' + q(c) + '\',1)', false); }).join('') + chipRev('Otra…', 'App.formMovimiento(' + f + ')') + '</div>';
          cuerpo += bloqueSacadas(a, a.sac);
        } else if (a.tipo === 'sobre') {
          var sug = sugerirSobres(m, 'sale');
          if (m.tipo === 'Gasto' && !m.categoria) cuerpo += '<div class="rev-q">¿Qué categoría?</div><div class="chips">' + sugerirCategorias(m).map(function (c) { return chipRev(iconoMov({ tipo: 'Gasto', categoria: c })[0] + ' ' + esc(c), 'App.rvCategoria(' + f + ',\'' + q(c) + '\',1)', false); }).join('') + chipRev('Otra…', 'App.formMovimiento(' + f + ')') + '</div>';
          cuerpo += '<div class="rev-q">Salió de ' + esc(cuentaPrincipal() || 'la cuenta') + '. ¿La sacaste de un sobre?' + (a.p.asignado > 0.005 ? ' (faltan ' + txt(a.p.falta, m.moneda) + ')' : '') + '</div><div class="chips">' +
            sug.map(function (s, i) { return chipRev('✉ ' + esc(nomSobre(s)), 'App.rvSacar(' + f + ',\'' + q(s) + '\')', i === 0); }).join('') +
            chipRev(sug.length ? 'Otro sobre…' : 'Elegir sobre…', 'App.formAsignar(' + f + ')') + chipRev('🪙 No, del disponible', 'App.rvDisponible(' + f + ')') + '</div>';
        } else if (a.tipo === 'entra') {
          var sug2 = sugerirSobres(m, 'entra');
          cuerpo = '<div class="rev-q">Entró a ' + esc(cuentaPrincipal() || 'la cuenta') + '. ¿La metiste a un sobre?' + (a.p.asignado > 0.005 ? ' (faltan ' + txt(a.p.falta, m.moneda) + ')' : '') + '</div><div class="chips">' +
            (C.esSalario(m) || m.monto >= 100000 ? chipRev('↔ Repartir como siempre', 'App.rvRepartir(' + f + ')', true) : '') +
            sug2.map(function (s, i) { return chipRev('✉ ' + esc(nomSobre(s)), 'App.rvMeter(' + f + ',\'' + q(s) + '\')', i === 0 && !(C.esSalario(m) || m.monto >= 100000)); }).join('') +
            chipRev('Otro sobre…', 'App.formAsignar(' + f + ')') + chipRev('🪙 Dejarla disponible', 'App.rvDisponible(' + f + ')') + '</div>';
        } else if (a.tipo === 'origen') {
          var monA = m.moneda === 'USD' ? 'USD' : 'CRC';
          var otras = cuentasAhorro().filter(function (c) { return (c.moneda === 'USD' ? 'USD' : 'CRC') === monA; }).map(function (c) { return c.nombre; }).filter(function (n) { return n !== a.cuenta; });
          var pri = ORIG().principal; otras.sort(function (x, y) { return (y === pri) - (x === pri); });
          cuerpo = '<div class="rev-q">¿De dónde vino esta plata?</div><div class="chips">' +
            otras.slice(0, 2).map(function (n, i) { return chipRev('🏦 ' + esc(n), 'App.rvOrigen(' + f + ',\'cuenta\',\'' + q(n) + '\')', i === 0); }).join('') +
            chipRev('💰 Me pagaron', 'App.rvOrigen(' + f + ',\'ingreso\')') + chipRev('🔁 Otra cuenta mía', 'App.rvOrigen(' + f + ',\'fuera\')') + '</div>';
          return '<div class="caja rev-it borde-acento">' + cab(m, 'Entró a ' + a.cuenta) + cuerpo + '</div>';
        } else if (a.tipo === 'iva') {
          cuerpo = '<div class="rev-q">Llegó en dólares' + (/cobro original/i.test(m.nota || '') ? ' (lo pasé a colones)' : '') + '. ¿El banco le cobra el IVA aparte?</div><div class="chips">' +
            chipRev('🧾 Sí, IVA 13% aparte', 'App.rvIVA(' + f + ',1)', false) + chipRev('No', 'App.rvIVA(' + f + ',0)', false) + '</div><div class="suave chico">Se recuerda para «' + esc(nombreBonito(m.comercio)) + '».</div>';
        } else if (a.tipo === 'direccion') {
          cuerpo = '<div class="rev-q">¿Esta plata entró o salió de ' + esc(m.cuenta || 'la cuenta') + '?</div><div class="chips">' +
            chipRev('↓ Entró', 'App.rvDireccion(' + f + ',1)', false) + chipRev('↑ Salió', 'App.rvDireccion(' + f + ',0)', false) + chipRev('Era otra cosa…', 'App.formMovimiento(' + f + ')') + '</div>';
        } else {
          cuerpo = '<div class="rev-q">¿Qué categoría?</div><div class="chips">' + sugerirCategorias(m).map(function (c, i) { return chipRev(iconoMov({ tipo: 'Gasto', categoria: c })[0] + ' ' + esc(c), 'App.rvCategoria(' + f + ',\'' + q(c) + '\')', i === 0); }).join('') +
            chipRev('Otra…', 'App.formMovimiento(' + f + ')') + '</div>';
        }
        return '<div class="caja rev-it borde-acento">' + cab(m) + cuerpo + '</div>';
      }).join('');
    }
    if (r.confirmar.length) {
      h += '<div class="seccion-t">POR CONFIRMAR · ' + r.confirmar.length + '</div>' + r.confirmar.map(function (m) {
        return '<div class="caja rev-it">' + cab(m) + '<div class="rev-q">≈ ' + (esIVA(m) ? 'IVA estimado' : 'Monto estimado') + ': confirmalo cuando el banco lo aplique.</div><div class="chips">' +
          chipRev('✓ Confirmar monto', 'App.formConfirmar(' + m.fila + ')', true) + '</div></div>';
      }).join('');
    }
    if (r.listos.length) {
      h += '<div class="seccion-t">LISTOS SOLOS · ' + r.listos.length + '</div>' + r.listos.map(function (m) {
        return '<div class="caja rev-it">' + cab(m) + '<div class="rev-ok">✓ ' + esc(queHizo(m, ef)) + '</div></div>';
      }).join('');
    }
    h += '<div class="rev-barra"><button class="btn" onclick="App.rvTodoBien()">' + (r.accion.length ? 'Listo por ahora ✓' : 'Todo bien ✓') + '</button>' +
      '<button class="btn sec" onclick="App.rvRaro()">Algo está raro</button></div>' +
      (r.accion.length ? '<div class="suave chico" style="text-align:center">Lo que necesita un toque se queda aquí hasta que lo resolvás.</div>' : '');
    $('p-revisar').innerHTML = h;
  }
  function rvSobre(fila, sobre) {
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0]; if (!p) return pintar();
    var m = p.mov, entra = p.sentido === 'entra';
    var lista = [{ fecha: fechaSobre(m), sobre: sobre, monto: (entra ? 1 : -1) * Math.round(p.falta * 100) / 100, tipo: entra ? 'Ingreso' : m.tipo === 'Pago de tarjeta' ? 'Pago tarjeta' : p.tarjeta ? 'Compra con tarjeta' : 'Gasto', movimiento: fila, grupo: grupoNuevo(), nota: m.comercio || '' }];
    encolar('guardarSobresMov', [lista], 'Asignar ' + (m.comercio || m.tipo) + ' → ' + sobre + ' · ' + txt(p.falta, m.moneda));
    var rec = $('rv-rec-' + fila);
    if (rec && rec.checked && m.comercio) encolar('guardarReglaSobre', [m.comercio, sobre], 'Recordar ' + m.comercio + ' → ' + sobre);
    marcarVistos([m]); sbMemo = null; pintar();
    toast('✉ ' + nomSobre(sobre) + (rec && rec.checked ? ' · la próxima vez se asigna solo' : ''), 2500);
  }
  function rvRepartir(fila) { marcarVistos([movPorFila(fila)].filter(Boolean)); irReparto(fila); }
  function rvOrigen(fila, op, cuenta) { OP = { fila: fila, op: op, cuenta: cuenta || '', sobre: '' }; marcarVistos([movPorFila(fila)].filter(Boolean)); guardarOrigenPlata(fila); }
  function rvCategoria(fila, cat, seguir) {
    var m = movPorFila(fila); if (!m) return;
    var nm = { fila: fila, control: { monto: m.monto }, fecha: m.fecha, monto: m.monto, moneda: m.moneda, tipo: m.tipo, comercio: m.comercio, lugar: m.lugar, cuenta: m.cuenta,
      categoria: cat, sobre: m.sobre, nota: m.nota, origen: m.origen, autorizacion: m.autorizacion, recordarRegla: !!m.comercio };
    encolar('guardarMovimiento', [nm], 'Categoría ' + cat + ' · ' + (m.comercio || m.tipo));
    if (!seguir) marcarVistos([m]); pintar(); toast('✓ ' + cat + (m.comercio ? ' · la próxima vez se pone sola' : ''), 2500);
  }
  function rvTodoBien() {
    var r = revisarData();
    var lote = r.listos.concat(r.accion.map(function (a) { return a.mov; })).concat(r.nuevos);
    var filas = []; lote.forEach(function (m) { if (filas.indexOf(m.fila) < 0) filas.push(m.fila); });
    if (filas.length) guardar('mf-ultimo-lote', JSON.stringify({ filas: filas, fecha: new Date().toISOString() }));
    marcarVistos(r.nuevos.concat(r.listos));
    ir('aldia');
  }
  function rvRaro() { toast('Tocá el movimiento que está mal: se abre aquí para corregirlo (tipo, cuenta, fecha…). No hace falta entrar a la hoja.', 6000); }
  function rvCubrir(nombre) { SOB = { nombre: nombre, f: 'mes', vista: [] }; formSacarMeter(1); }
  function pAlDia() {
    var lote = leerJSONSeguro('mf-ultimo-lote') || { filas: [] }, set = {};
    lote.filas.forEach(function (f) { set[f] = 1; });
    var movs = D.movimientos.filter(function (m) { return set[m.fila]; });
    var pend = revisarData().accion.length;
    var h = cabSimple(pend ? 'Casi al día' : 'Todo al día ✓', lote.fecha ? 'Revisado ' + fechaCorta(lote.fecha).replace(/ \d{4}$/, '') + (hora(lote.fecha) ? ' ' + hora(lote.fecha) : '') : 'Hoy');
    h += pend ? '<button class="caja borde-acento rev-ini" onclick="App.ir(\'revisar\')"><span class="av-rev">⚠</span><span class="cuerpo"><b>Quedan ' + pend + ' por resolver</b><span class="chico suave">Tocá para terminarlos</span></span><span class="flecha acento">›</span></button>'
      : '<div class="caja" style="text-align:center;gap:4px;padding:18px"><div style="font-size:34px">✅</div><b style="font-size:17px">Listo, no hay nada pendiente</b><span class="suave chico">Así quedaron tus cuentas con lo que revisaste</span></div>';
    var fila = function (a, b, cls, d, accion) {
      return '<div class="ad-fila"' + (accion ? ' onclick="' + accion + '"' : '') + '><span class="ad-n">' + a + '</span><span class="ad-v"><b class="' + (cls || '') + '">' + b + '</b>' + (d ? '<span class="suave">' + d + '</span>' : '') + '</span></div>';
    };
    var sumas = function (lista, fn) { var o = { CRC: 0, USD: 0 }; lista.forEach(function (m) { if (fn(m)) o[m.moneda === 'USD' ? 'USD' : 'CRC'] += m.monto; }); return o; };
    var tm = function (o) { return [o.CRC ? txt(o.CRC, 'CRC') : '', o.USD ? txt(o.USD, 'USD') : ''].filter(String).join(' + '); };
    // tarjetas
    var tjs = D.cuentas.filter(function (c) { return c.activa && c.tipo === 'Tarjeta de crédito'; });
    var tjH = tjs.map(function (c) {
      var mm = movs.filter(function (m) { return m.cuenta === c.nombre; });
      var dt = C.deudaTarjeta(D, c), comp = sumas(mm, function (m) { return m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero'; }), pag = sumas(mm, function (m) { return m.tipo === 'Pago de tarjeta' || m.tipo === 'Ingreso'; });
      var d = mm.length ? [comp.CRC || comp.USD ? '+' + tm(comp) + ' compras' : '', pag.CRC || pag.USD ? '−' + tm(pag) + ' pagos' : ''].filter(String).join(' · ') : 'sin cambios';
      return { cambio: mm.length > 0, h: fila(esc(c.nombre), dosMon(dt), mm.length ? 'acento' : '', d, 'App.verCuentaMov(\'' + q(c.nombre) + '\')') };
    });
    tjH.sort(function (a, b) { return b.cambio - a.cambio; });
    if (tjH.length) h += '<div class="seccion-t">TARJETAS</div><div class="caja ad-caja">' + tjH.map(function (x) { return x.h; }).join('') + '</div>';
    // cuentas
    var o = ORIG(), ef = C.efectosCuentas(D, o);
    var ctH = cuentasAhorro().map(function (c) {
      var e = ef.filter(function (x) { return x.cuenta === c.nombre && ((x.mov && set[x.mov.fila]) || (x.pago && false)); });
      var ent = 0, sal = 0, mon = c.moneda === 'USD' ? 'USD' : 'CRC';
      e.forEach(function (x) { if (x.moneda !== mon) return; if (x.signo > 0) ent += x.monto; else sal += x.monto; });
      var sc = C.saldoCuenta(D, c, o);
      var d = e.length ? [ent ? '+' + txt(ent, mon) : '', sal ? '−' + txt(sal, mon) : ''].filter(String).join(' · ') : 'sin cambios';
      var dp = disponibleDe(c, sc);
      return { cambio: e.length > 0, h: fila(esc(c.nombre), dp ? din(dp.disponible, 'CRC') : sc.vivo ? dosMon(sc, mon) : '—', dp && dp.disponible < -0.005 ? 'rojo' : '', (dp ? 'disponible · ' : '') + d + (sc.vivo ? '' : ' · sin saldo anotado'), 'App.verCuentaMov(\'' + q(c.nombre) + '\')') };
    });
    ctH.sort(function (a, b) { return b.cambio - a.cambio; });
    if (ctH.length) h += '<div class="seccion-t">CUENTAS</div><div class="caja ad-caja">' + ctH.map(function (x) { return x.h; }).join('') + '</div>';
    // sobres que cambiaron
    if (!sinServidorSobres()) {
      var sbh = C.saldosSobres(D, hoy, hoy), tocados = {};
      (D.sobresMov || []).forEach(function (x) { if (x.movimiento && set[x.movimiento] && x.sobre) tocados[x.sobre] = 1; });
      movs.forEach(function (m) { if (m.sobre) tocados[m.sobre] = 1; });
      var neg = sbh.lista.filter(function (s) { return s.saldo < -0.005 && tocados[s.nombre]; });
      var lista = sbh.lista.filter(function (s) { return tocados[s.nombre]; });
      if (lista.length) {
        h += '<div class="seccion-t">SOBRES QUE CAMBIARON</div><div class="caja ad-caja">' + lista.map(function (s) {
          var i = SB().lista.map(function (x) { return x.nombre; }).indexOf(s.nombre);
          return fila(iconoSobre(s.nombre) + ' ' + esc(nomSobre(s.nombre)), din(s.saldo, s.moneda), s.saldo < -0.005 ? 'rojo' : '', s.saldo < -0.005 ? 'falta cubrir' : '', i >= 0 ? 'App.verSobre(' + i + ')' : '');
        }).join('') + '</div>';
        neg.slice(0, 2).forEach(function (s) { h += '<button class="btn" onclick="App.rvCubrir(\'' + q(s.nombre) + '\')">Cubrir ' + esc(nomSobre(s.nombre)) + ' (' + txt(-s.saldo, s.moneda) + ')</button>'; });
      }
    }
    h += '<button class="btn sec" onclick="App.ir(\'inicio\')">Volver a Inicio</button>';
    $('p-aldia').innerHTML = h;
  }

  // ==================================================================== v2.7.0 · IVA aparte, montos por confirmar, entró/salió, disponible
  var IVA_TASA = 0.13;
  function claveIVA(m) { return C.normNom(m.comercio || '').replace(/[^a-z0-9 ]/g, '').split(' ').slice(0, 2).join(' '); }
  function esCobroDolares(m) { return m.tipo === 'Gasto' && (/cobro original \$/i.test(m.nota || '') || (m.moneda === 'USD' && C.esTarjeta(D, m.cuenta))); }
  function ivaPrefs() { return PREFS().iva || {}; }
  function esIVA(m) { return /^IVA · /.test(m.comercio || ''); }
  function porConfirmar(m) { return /monto estimado|IVA estimado/i.test(m.nota || ''); }
  /** Cobros en dólares que todavía no tienen respuesta de "¿trae IVA aparte?" */
  function preguntasIVA() {
    var p = ivaPrefs(), lim = hoy.getTime() - DIAS_REV * 86400000, vistas = {};
    return D.movimientos.filter(function (m) {
      if (m.fila <= 0 || !m.fecha || new Date(m.fecha).getTime() < lim || !esCobroDolares(m) || esIVA(m)) return false;
      var k = claveIVA(m); if (!k || p[k] !== undefined || vistas[k]) return false;
      vistas[k] = 1; return true;
    });
  }
  /** Crea la línea "IVA · X" (estimada) para los cobros de comercios marcados con IVA aparte */
  function autoIVA() {
    if (!D) return;
    var p = ivaPrefs(), lim = hoy.getTime() - DIAS_REV * 86400000, hechos = {}, n = 0, ya = leerJSONSeguro('mf-iva-hechos') || [];
    ya.forEach(function (k) { hechos[k] = 1; });   // si borrás un IVA, no se vuelve a crear
    D.movimientos.forEach(function (m) { if (/^IVA-/.test(m.autorizacion || '')) hechos[m.autorizacion] = 1; });
    D.movimientos.forEach(function (m) {
      if (m.fila <= 0 || !m.fecha || new Date(m.fecha).getTime() < lim || !esCobroDolares(m) || esIVA(m) || p[claveIVA(m)] !== true) return;
      var aut = 'IVA-' + (m.autorizacion || m.fila);
      if (hechos[aut]) return;
      hechos[aut] = 1; n++; ya.push(aut);
      var sb = sinServidorSobres() ? [] : (SB().porMov[m.fila] || []).filter(function (x) { return x.sobre; });
      var monto = Math.round(m.monto * IVA_TASA * 100) / 100;
      encolar('guardarMovimiento', [{ fila: null, control: null, fecha: new Date(new Date(m.fecha).getTime() + 60000).toISOString(), monto: monto, moneda: m.moneda, tipo: 'Gasto',
        comercio: 'IVA · ' + (nombreBonito(m.comercio) || 'cobro'), lugar: '', cuenta: m.cuenta, categoria: m.categoria || '', sobre: (sb[0] && sb[0].sobre) || m.sobre || '',
        nota: 'IVA estimado (13%) · se confirma cuando el banco lo aplique', origen: 'Manual', autorizacion: aut, recordarRegla: false }], 'IVA · ' + (m.comercio || 'cobro') + ' · ' + txt(monto, m.moneda));
    });
    if (n) guardar('mf-iva-hechos', JSON.stringify(ya.slice(-300)));
    if (n) toast('🧾 Anoté ' + n + ' IVA estimado' + (n === 1 ? '' : 's') + '. Confirmalo cuando el banco lo aplique.', 4000);
  }
  function rvIVA(fila, si) {
    var m = movPorFila(fila); if (!m) return;
    var o = {}; o[claveIVA(m)] = !!si;
    guardarPrefs({ iva: Object.assign({}, ivaPrefs(), o) }, (si ? 'Con IVA aparte: ' : 'Sin IVA aparte: ') + (m.comercio || ''));
    if (si) autoIVA();
    pintar(); toast(si ? '🧾 Listo: a ' + nombreBonito(m.comercio) + ' se le agrega el IVA solo' : 'Listo: ' + nombreBonito(m.comercio) + ' sin IVA aparte', 3000);
  }
  function formIVA() {
    var p = ivaPrefs(), ks = Object.keys(p);
    abrir('<h2>🧾 Cobros con IVA aparte</h2><div class="suave">Servicios del exterior (Netflix, Disney+…) a los que el banco les cobra el IVA en un movimiento aparte. La app anota el IVA estimado sola y vos lo confirmás.</div>' +
      (ks.length ? '<div class="caja sinpad" style="margin-top:10px">' + ks.map(function (k) {
        return '<div class="fila-rep" style="padding:10px 14px"><span>' + esc(k) + '</span><span class="chips" style="flex-wrap:nowrap">' + chipRev('Sí', 'App.ivaCambiar(\'' + q(k) + '\',1)', p[k]) + chipRev('No', 'App.ivaCambiar(\'' + q(k) + '\',0)', !p[k]) + '</span></div>';
      }).join('') + '</div>' : '<div class="caja vacio" style="margin-top:10px">Todavía no hay. La app te pregunta la primera vez que llega un cobro en dólares.</div>') +
      '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }
  function ivaCambiar(k, si) { var o = Object.assign({}, ivaPrefs()); o[k] = !!si; guardarPrefs({ iva: o }, 'IVA aparte: ' + k); formIVA(); }
  // ---- confirmar el monto real (cobro convertido o IVA estimado)
  function formConfirmar(fila) {
    var m = movPorFila(fila); if (!m) return;
    var orig = (m.nota || '').match(/cobro original \$([\d.,]+)/i);
    abrir('<div class="suave chico">' + esc(etiquetaCuenta(m.cuenta)) + ' · ' + fechaCorta(m.fecha) + '</div><h2>Confirmar monto · ' + esc(nombreBonito(m.comercio)) + '</h2>' +
      '<div class="suave">' + (esIVA(m) ? 'Poné el IVA que aparece aplicado en el banco.' : 'Poné el monto en colones que aparece aplicado en el banco' + (orig ? ' (el cobro fue de $' + esc(orig[1]) + ')' : '') + '.') + '</div>' +
      '<label class="campo"><span>Monto real (' + (m.moneda === 'USD' ? '$' : '₡') + ')</span><input id="cf-monto" class="monto" data-dinero inputmode="decimal" value="' + String(m.monto).replace('.', ',') + '"></label>' +
      '<div class="acciones"><button class="btn" onclick="App.guardarConfirmar(' + fila + ')">Confirmar</button><button class="btn sec" onclick="App.cerrar()">Todavía no</button></div>');
  }
  function guardarConfirmar(fila) {
    var m = movPorFila(fila); if (!m) return;
    var nuevo = C.leerNumero(val('cf-monto')); if (!(nuevo > 0)) return toast('Escribí el monto.');
    var nota = String(m.nota || '').replace(/monto estimado/i, 'monto confirmado').replace(/IVA estimado \(13%\) · se confirma cuando el banco lo aplique/i, 'IVA confirmado').replace(/IVA estimado/i, 'IVA confirmado');
    var viejo = m.monto;
    encolar('guardarMovimiento', [{ fila: fila, control: { monto: viejo }, fecha: m.fecha, monto: nuevo, moneda: m.moneda, tipo: m.tipo, comercio: m.comercio, lugar: m.lugar, cuenta: m.cuenta,
      categoria: m.categoria, sobre: m.sobre, nota: nota, origen: m.origen, autorizacion: m.autorizacion, recordarRegla: false }], 'Confirmar ' + (m.comercio || '') + ' · ' + txt(nuevo, m.moneda));
    // el sobre: si estaba asignado completo a un solo sobre, se reasigna con el monto real
    if (!sinServidorSobres() && Math.abs(nuevo - viejo) > 0.004) {
      var filas = (SB().porMov[fila] || []), grupos = {}, sobres = {};
      filas.forEach(function (x) { if (x.grupo) grupos[x.grupo] = 1; sobres[x.sobre || ''] = 1; });
      var gs = Object.keys(grupos), ss = Object.keys(sobres);
      if (gs.length === 1 && ss.length === 1 && filas.length === 1) {
        var x0 = filas[0];
        encolar('eliminarGrupoSobres', [gs[0]], 'Ajustar sobre de ' + (m.comercio || ''));
        encolar('guardarSobresMov', [[{ fecha: x0.fecha || fechaSobre(m), sobre: x0.sobre, monto: (x0.monto < 0 ? -1 : 1) * nuevo, tipo: x0.tipo || 'Gasto', movimiento: fila, grupo: grupoNuevo(), nota: m.comercio || '' }]], 'Sobre de ' + (m.comercio || '') + ' con el monto real');
      }
    }
    hecho('✅ Monto confirmado: ' + txt(nuevo, m.moneda));
  }
  // ---- transferencia sin saber si entró o salió
  function transferenciaDudosa(m) {
    if (m.tipo !== 'Transferencia' || C.entraTransferencia(m)) return false;
    if (/^\s*(sali[oó]|sinpe a|d[eé]bito|transferencia a|env[ií]o|pas[oó] a|a\s)/i.test(m.comercio || '')) return false;
    return !!m.cuenta || true;
  }
  function rvDireccion(fila, entra) {
    var m = movPorFila(fila); if (!m) return;
    var base = String(m.comercio || 'Transferencia').replace(/^\s*(entr[oó]|sali[oó])\s*:?\s*/i, '');
    encolar('guardarMovimiento', [{ fila: fila, control: { monto: m.monto }, fecha: m.fecha, monto: m.monto, moneda: m.moneda, tipo: m.tipo, comercio: (entra ? 'Entró: ' : 'Salió: ') + base, lugar: m.lugar, cuenta: m.cuenta,
      categoria: m.categoria, sobre: m.sobre, nota: m.nota, origen: m.origen, autorizacion: m.autorizacion, recordarRegla: false }], (entra ? 'Entró: ' : 'Salió: ') + base);
    marcarVistos([m]); pintar();
  }
  // ---- disponible de la cuenta principal (como en la app del banco: lo que no está en sobres)
  function disponibleDe(c, sc) {
    sc = sc || C.saldoCuenta(D, c, ORIG());
    if (!sc.vivo || ORIG().principal !== c.nombre || sinServidorSobres() || c.moneda === 'USD') return null;
    var sbH = C.saldosSobres(D, hoy, hoy), enS = sbH.total.CRC, res = sbH.reservadoTotal || 0;
    return { disponible: sc.CRC - enS - res, enSobres: enS, reservado: res, total: sc.CRC };
  }

  // ==================================================================== v2.8.0 · ESPEJO DEL BANCO (sobres como en el BCR)
  function cuentaPrincipal() { return ORIG().principal || ''; }
  /** Una sola vez: quitar las asignaciones viejas de compras con tarjeta (grupos que solo tienen compras con tarjeta) */
  function migrarEspejo() {
    if (!D || sinServidorSobres() || guardado('mf-mig-espejo', '') === '1') return;
    var porFila = {}; D.movimientos.forEach(function (m) { porFila[m.fila] = m; });
    var grupos = {};
    (D.sobresMov || []).forEach(function (x) {
      if (!x.grupo) return;
      var g = grupos[x.grupo] = grupos[x.grupo] || { todas: true, n: 0 };
      var mm = x.movimiento ? porFila[x.movimiento] : null;
      g.n++; if (!(mm && C.esCompraTarjeta(D, mm))) g.todas = false;
    });
    var borrar = Object.keys(grupos).filter(function (k) { return grupos[k].todas; });
    borrar.forEach(function (g) { encolar('eliminarGrupoSobres', [g], 'Quitar asignación vieja de compra con tarjeta'); });
    guardar('mf-mig-espejo', '1');
    if (borrar.length) toast('✉ Quité ' + borrar.length + ' asignación' + (borrar.length === 1 ? '' : 'es') + ' vieja' + (borrar.length === 1 ? '' : 's') + ' de compras con tarjeta. Los sobres ahora son como en el banco.', 6000);
  }
  /** Fila nueva en Movimientos: sacar de un sobre (→ disponible) o meter (← disponible) */
  function filaSobre(tipo, sobre, monto, comercio, fecha, aut, nota, moneda) {
    var m = { fila: null, control: null, fecha: fecha || new Date().toISOString(), monto: Math.round(monto * 100) / 100, moneda: moneda || 'CRC', tipo: tipo, comercio: comercio, lugar: '',
      cuenta: cuentaPrincipal(), categoria: '', sobre: sobre, nota: nota || '', origen: 'Manual', autorizacion: aut || ('SOB-' + grupoNuevo()), recordarRegla: false };
    encolar('guardarMovimiento', [m], comercio + ' · ' + txt(monto, 'CRC'));
    marcarVistos([m]);
    return m;
  }
  function descMov(m) { return m.tipo === 'Pago de tarjeta' ? 'pagar ' + etiquetaCuenta(m.cuenta) : m.tipo === 'Transferencia' ? (nombreBonito(m.comercio) || 'transferencia').replace(/^entr[oó] (a|desde) /i, 'pasar a ') : (nombreBonito(m.comercio) || m.tipo); }
  /** "¿La sacaste de un sobre?" → sacar del sobre + la salida queda pagada con eso */
  function rvSacar(fila, sobre) {
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0]; if (!p) return pintar();
    var m = p.mov, f = new Date(new Date(m.fecha).getTime() - 60000).toISOString();
    var s = filaSobre(C.TIPO_SACAR, sobre, p.falta, 'Sacado del sobre ' + nomSobre(sobre) + ' · para ' + descMov(m), f, 'SAC-' + (m.autorizacion || m.fila));
    encolar('guardarSobresMov', [[{ fecha: fechaSobre(m), sobre: '', monto: -Math.round(p.falta * 100) / 100, tipo: 'Del disponible', movimiento: fila, grupo: grupoNuevo(), nota: 'Con lo sacado de ' + sobre + ' · ' + s.autorizacion }]], 'Salió con lo sacado de ' + sobre);
    marcarVistos([m]); sbMemo = null; pintar(); toast('📤 Sacado de ' + nomSobre(sobre) + ' y anotado el pago', 2500);
  }
  function rvDisponible(fila) {
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0]; if (!p) return pintar();
    var m = p.mov, entra = p.sentido === 'entra';
    encolar('guardarSobresMov', [[{ fecha: fechaSobre(m), sobre: '', monto: (entra ? 1 : -1) * Math.round(p.falta * 100) / 100, tipo: entra ? 'Queda disponible' : 'Del disponible', movimiento: fila, grupo: grupoNuevo(), nota: m.comercio || '' }]], (entra ? 'Queda disponible: ' : 'Del disponible: ') + (m.comercio || m.tipo));
    marcarVistos([m]); sbMemo = null; pintar(); toast(entra ? '🪙 Queda en el disponible' : '🪙 Salió del disponible', 2000);
  }
  /** "¿La metiste a un sobre?" → meter al sobre (fila en Movimientos) + el ingreso queda resuelto */
  function rvMeter(fila, sobre) {
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0]; if (!p) return pintar();
    var m = p.mov, f = new Date(new Date(m.fecha).getTime() + 60000).toISOString();
    var s = filaSobre(C.TIPO_METER, sobre, p.falta, 'Metido al sobre ' + nomSobre(sobre) + ' · de ' + (nombreBonito(m.comercio) || 'ingreso'), f, 'MET-' + (m.autorizacion || m.fila));
    encolar('guardarSobresMov', [[{ fecha: fechaSobre(m), sobre: '', monto: Math.round(p.falta * 100) / 100, tipo: 'Al sobre', movimiento: fila, grupo: grupoNuevo(), nota: 'Metido a ' + sobre + ' · ' + s.autorizacion }]], 'Ingreso metido a ' + sobre);
    marcarVistos([m]); sbMemo = null; pintar(); toast('📥 Metido a ' + nomSobre(sobre), 2000);
  }
  /** Si ya sacaste de un sobre (📤 Sacar) y después sale esa plata, se une sola.
   *  v2.10.0: también con varias sacadas (de varios sobres) que sumen el pago. */
  function sacadasUsadas() {
    var usados = {};
    (D.sobresMov || []).forEach(function (x) { var re = /(SOB-[\w-]+|SAC-[\w-]+)/g, mm; while ((mm = re.exec(x.nota || ''))) usados[mm[1]] = 1; });
    return usados;
  }
  function sacadasLibres(usados) {
    usados = usados || sacadasUsadas();
    return D.movimientos.filter(function (m) { return m.tipo === C.TIPO_SACAR && m.fila > 0 && m.autorizacion && !usados[m.autorizacion] && /para (pagar|pasar)/i.test(m.comercio || ''); });
  }
  /** Sacadas que pueden ser de este pago: { lista (candidatas), exacta (subconjunto que suma justo) , usar (lo que se propone), suma, falta } */
  function infoSacadas(p, libres) {
    if (!p || p.sentido !== 'sale' || p.mov.fila <= 0) return null;
    var t = new Date(p.mov.fecha).getTime();
    // las más cercanas al pago primero (si hay varias combinaciones, gana la de lo sacado justo antes)
    var cand = (libres || sacadasLibres()).filter(function (x) { var tx = new Date(x.fecha).getTime(); return tx <= t + 3600000 && tx >= t - 4 * 86400000; })
      .sort(function (a, b) { return Math.abs(new Date(a.fecha).getTime() - t) - Math.abs(new Date(b.fecha).getTime() - t); });
    if (!cand.length) return null;
    var objetivo = Math.round(p.falta * 100), exactas = [];
    var lim = Math.min(cand.length, 8);
    (function buscar(i, elegidas, suma) {
      if (exactas.length > 1) return;
      if (suma === objetivo && elegidas.length) { exactas.push(elegidas.slice()); return; }
      if (i >= lim || suma > objetivo || elegidas.length >= 4) return;
      elegidas.push(cand[i]); buscar(i + 1, elegidas, suma + Math.round(cand[i].monto * 100)); elegidas.pop();
      buscar(i + 1, elegidas, suma);
    })(0, [], 0);
    var usar;
    if (exactas.length) usar = exactas[0];
    else {   // lo que alcance, de la más grande a la más chica, sin pasarse
      usar = []; var acum = 0;
      cand.slice().sort(function (a, b) { return b.monto - a.monto; }).forEach(function (x) { if (acum + x.monto <= p.falta + 0.004) { usar.push(x); acum += x.monto; } });
      usar.sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
    }
    var suma = usar.reduce(function (a, x) { return a + x.monto; }, 0);
    return { lista: cand, exacta: exactas.length ? exactas[0] : null, unica: exactas.length === 1, usar: usar, suma: Math.round(suma * 100) / 100, falta: Math.round((p.falta - suma) * 100) / 100 };
  }
  /** Une el pago con esas sacadas; si sobra algo por cubrir: del disponible o de otro sobre */
  function unirSacadas(p, usar, resto) {
    var m = p.mov, suma = usar.reduce(function (a, x) { return a + x.monto; }, 0);
    usar = usar.slice().sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
    if (usar.length) {
      var nombres = usar.map(function (x) { return x.sobre; }).join(' + '), auts = usar.map(function (x) { return x.autorizacion; }).join(' ');
      encolar('guardarSobresMov', [[{ fecha: fechaSobre(m), sobre: '', monto: -Math.round(suma * 100) / 100, tipo: 'Del disponible', movimiento: m.fila, grupo: grupoNuevo(), nota: 'Con lo sacado de ' + nombres + ' · ' + auts }]], 'Salió con lo sacado de ' + nombres);
    }
    var falta = Math.round((p.falta - suma) * 100) / 100;
    if (falta > 0.004 && resto) {
      if (resto === 'disponible') encolar('guardarSobresMov', [[{ fecha: fechaSobre(m), sobre: '', monto: -falta, tipo: 'Del disponible', movimiento: m.fila, grupo: grupoNuevo(), nota: m.comercio || '' }]], 'Del disponible: ' + (m.comercio || m.tipo));
      else {
        var s = filaSobre(C.TIPO_SACAR, resto, falta, 'Sacado del sobre ' + nomSobre(resto) + ' · para ' + descMov(m), new Date(new Date(m.fecha).getTime() - 60000).toISOString(), 'SAC-' + (m.autorizacion || m.fila) + '-r');
        encolar('guardarSobresMov', [[{ fecha: fechaSobre(m), sobre: '', monto: -falta, tipo: 'Del disponible', movimiento: m.fila, grupo: grupoNuevo(), nota: 'Con lo sacado de ' + resto + ' · ' + s.autorizacion }]], 'Salió con lo sacado de ' + resto);
      }
    }
    marcarVistos([m]);
  }
  function autoSacado() {
    if (!D || sinServidorSobres()) return;
    var usados = sacadasUsadas(), libres = sacadasLibres(usados);
    if (!libres.length) return;
    var n = 0, pend = SB().pendientes.filter(function (p) { return p.sentido === 'sale' && p.mov.fila > 0; });
    pend.forEach(function (p) {
      var info = infoSacadas(p, libres.filter(function (x) { return !usados[x.autorizacion]; }));
      if (!info || !info.exacta || !info.unica) return;
      // dudas: otro pago pendiente parecido (mismo monto en esos días) → se pregunta en Para revisar
      var t = new Date(p.mov.fecha).getTime();
      if (pend.some(function (q) { return q !== p && Math.abs(q.falta - p.falta) < 0.01 && Math.abs(new Date(q.mov.fecha).getTime() - t) < 4 * 86400000; })) return;
      info.exacta.forEach(function (x) { usados[x.autorizacion] = 1; });
      unirSacadas(p, info.exacta, null); n++;
    });
    if (n) { sbMemo = null; toast('✓ ' + n + ' pago' + (n === 1 ? '' : 's') + ' unido' + (n === 1 ? '' : 's') + ' con lo que sacaste de los sobres', 3500); pintar(); }
  }
  /** Para revisar: respuestas a "Antes sacaste ₡X de N sobres" */
  function rvSacadas(fila, que, resto) {
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0]; if (!p) return pintar();
    var info = infoSacadas(p);
    if (que === 'no') return rvDisponible(fila);
    if (!info) return pintar();
    if (que === 'si') {
      if (info.falta > 0.004 && !resto) return toast('Elegí de dónde salen los ' + txt(info.falta, 'CRC') + ' que faltan.');
      if (resto === 'otro') return formRestoSacadas(fila);
      unirSacadas(p, info.usar, resto || null);
      sbMemo = null; pintar(); toast('✓ Unido con lo que sacaste de ' + info.usar.map(function (x) { return nomSobre(x.sobre); }).join(' + '), 2500);
    }
  }
  function formRestoSacadas(fila) {
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0]; if (!p) return;
    var info = infoSacadas(p);
    var sbs = SB().lista.filter(function (s) { return s.moneda !== 'USD' && s.saldo > 0.005; });
    abrir('<h2>¿De qué sobre salen los ' + txt(info.falta, 'CRC') + '?</h2><div class="suave">El resto del pago (' + esc(nombreBonito(p.mov.comercio) || p.mov.tipo) + ').</div><div class="caja sinpad" style="margin-top:10px">' +
      sbs.map(function (s) { return '<button class="item" onclick="App.cerrar();App.rvSacadas(' + fila + ',\'si\',\'' + q(s.nombre) + '\')"><span class="cuerpo"><span class="nombre" style="display:block">✉ ' + esc(nomSobre(s.nombre)) + '</span><span class="det" style="display:block">tiene ' + txt(s.saldo, 'CRC') + '</span></span></button>'; }).join('') +
      '</div><div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function bloqueSacadas(a, info) {
    var m = a.mov, f = m.fila, n = info.usar.length, sb = {};
    var lista = '<div class="sac-lista">' + info.usar.map(function (x) { return '<div class="fila chico"><span>📤 ' + esc(nomSobre(x.sobre)) + ' <span class="suave">· ' + fechaCorta(x.fecha).replace(/ \d{4}$/, '') + (hora(x.fecha) ? ' ' + hora(x.fecha) : '') + '</span></span><b>' + txt(x.monto, 'CRC') + '</b></div>'; }).join('') +
      '<div class="fila chico sac-tot"><span>' + (info.falta > 0.004 ? 'Sacado' : 'Total sacado') + '</span><b>' + txt(info.suma, 'CRC') + '</b></div>' +
      (info.falta > 0.004 ? '<div class="fila chico acento"><span>Falta</span><b>' + txt(info.falta, 'CRC') + '</b></div>' : '') + '</div>';
    if (info.falta > 0.004) return '<div class="rev-q">Sacaste <b>' + txt(info.suma, 'CRC') + ' de ' + n + ' sobre' + (n === 1 ? '' : 's') + '</b>; el pago fue de ' + txt(a.p.falta, m.moneda) + '.</div>' + lista +
      '<div class="suave chico">¿Y los ' + txt(info.falta, 'CRC') + ' que faltan?</div><div class="chips">' + chipRev('🪙 Del disponible', 'App.rvSacadas(' + f + ',\'si\',\'disponible\')', true) + chipRev('📤 De otro sobre…', 'App.rvSacadas(' + f + ',\'si\',\'otro\')') + chipRev('No era para este pago', 'App.rvSacadasNo(' + f + ')') + '</div>';
    return '<div class="rev-q">Antes sacaste <b>' + txt(info.suma, 'CRC') + ' de ' + n + ' sobre' + (n === 1 ? '' : 's') + '</b>. ¿Es para este pago?</div>' + lista +
      '<div class="chips">' + chipRev('✓ Sí, es eso', 'App.rvSacadas(' + f + ',\'si\')', true) + chipRev('Otro sobre…', 'App.formAsignar(' + f + ')') + chipRev('🪙 No, del disponible', 'App.rvSacadas(' + f + ',\'no\')') + '</div>';
  }
  /** "No era para este pago": vuelve a la pregunta normal de sobres */
  var sacadasNo = {};
  function rvSacadasNo(fila) { sacadasNo[fila] = 1; pintar(); }
  // ---- Sacar / Meter desde la pantalla del sobre
  var SM = null;
  function formSacarMeter(dir, op, para) {
    var s = sobreInfo(SOB.nombre); if (!s) return;
    var montoPrev = $('sm-monto') ? val('sm-monto') : '';
    if (!SM || SM.dir !== dir) SM = { dir: dir, op: dir < 0 ? 'disponible' : 'disponible', para: '' };
    if (op) SM.op = op; if (para !== undefined) SM.para = para;
    var mon = s.moneda === 'USD' ? 'USD' : 'CRC', sb = SB();
    var otrosS = sb.lista.filter(function (x) { return x.nombre !== s.nombre && x.moneda === s.moneda; });
    var tjs = D.cuentas.filter(function (c) { return c.activa && c.tipo === 'Tarjeta de crédito'; }).map(function (c) { return c.nombre; });
    var ctas = cuentasAhorro().filter(function (c) { return (c.moneda === 'USD' ? 'USD' : 'CRC') === mon; }).map(function (c) { return c.nombre; }).filter(function (n) { return n !== cuentaPrincipal(); });
    var pend = sb.pendientes.filter(function (p) { return p.sentido === 'entra' && (p.mov.moneda === 'USD' ? 'USD' : 'CRC') === mon; });
    var bloque = function (k, tit, det, extra, apagado) {
      return '<div class="op-g' + (SM.op === k ? ' on' : '') + (apagado ? ' apagado' : '') + '" role="button" tabindex="0" onclick="' + (apagado ? '' : 'App.formSacarMeter(' + dir + ',\'' + k + '\')') + '"><b>' + tit + '</b><span>' + det + '</span>' + (SM.op === k && extra ? '<div class="op-x" onclick="event.stopPropagation()">' + extra + '</div>' : '') + '</div>';
    };
    var chipsPara = '<div class="chips" style="flex-wrap:wrap;gap:6px">' + tjs.map(function (n) { return chipRev('💳 Pagar ' + esc(n), 'App.formSacarMeter(-1,\'disponible\',\'pagar ' + q(n) + '\')', SM.para === 'pagar ' + n); }).join('') +
      ctas.map(function (n) { return chipRev('🏦 Pasar a ' + esc(n), 'App.formSacarMeter(-1,\'disponible\',\'pasar a ' + q(n) + '\')', SM.para === 'pasar a ' + n); }).join('') +
      chipRev('Solo dejarlo disponible', 'App.formSacarMeter(-1,\'disponible\',\'\')', !SM.para) + '</div>';
    var selS = '<select id="sm-sobre">' + otrosS.map(function (x) { return '<option value="' + esc(x.nombre) + '">' + esc(nomSobre(x.nombre)) + ' · ' + txt(x.saldo, x.moneda) + '</option>'; }).join('') + '</select>';
    var selM = '<select id="sm-mov" onchange="App.smMov()">' + pend.map(function (p) { return '<option value="' + p.mov.fila + '">' + esc((nombreBonito(p.mov.comercio) || p.mov.tipo) + ' · ' + fechaCorta(p.mov.fecha).replace(/ \d{4}$/, '') + ' · ' + txt(p.falta, mon)) + '</option>'; }).join('') + '</select>';
    var h = '<h2>' + (dir < 0 ? '📤 Sacar de' : '📥 Meter a') + ' «' + esc(nomSobre(s.nombre)) + '»</h2><div class="suave">' + (dir < 0 ? 'Igual que en la app del banco: sale del sobre y queda disponible en ' + esc(cuentaPrincipal() || 'la cuenta') + '.' : 'Igual que en la app del banco: sale del disponible y queda en el sobre.') + '</div>' +
      '<label class="campo"><span>Monto</span><input id="sm-monto" class="monto" data-dinero inputmode="decimal" placeholder="0" value="' + esc(montoPrev) + '" oninput="App.smBoton()"></label>' +
      (dir < 0 ? bloque('disponible', '🪙 Al disponible', '¿Para qué es? (opcional: así se une solo cuando llegue el pago o la transferencia)', chipsPara) +
          bloque('sobre', '⇄ A otro sobre', 'Mover de este sobre a otro', selS, !otrosS.length)
        : bloque('disponible', '🪙 Desde el disponible', 'Plata que ya está en la cuenta', '') +
          bloque('mov', '💰 De un ingreso por asignar', pend.length ? pend.length + ' por asignar' : 'No hay ingresos por asignar', selM, !pend.length) +
          bloque('sobre', '⇄ Desde otro sobre', 'Mover de otro sobre a este', selS, !otrosS.length)) +
      '<div class="acciones"><button class="btn" id="sm-ok" onclick="App.guardarSacarMeter()">' + (dir < 0 ? 'Sacar' : 'Meter') + '</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    abrir(h); smBoton();
  }
  function smMov() { var f = Number(val('sm-mov')), p = SB().pendientes.filter(function (x) { return x.mov.fila === f; })[0]; if (p && $('sm-monto')) $('sm-monto').value = String(Math.round(p.falta * 100) / 100).replace('.', ','); smBoton(); }
  function smBoton() { var b = $('sm-ok'), v = C.leerNumero(val('sm-monto')); if (b && SM) b.textContent = (SM.dir < 0 ? 'Sacar ' : 'Meter ') + (v ? txt(v, (sobreInfo(SOB.nombre) || {}).moneda || 'CRC') : ''); }
  function guardarSacarMeter() {
    var s = sobreInfo(SOB.nombre), monto = C.leerNumero(val('sm-monto'));
    if (!s) return; if (!monto || monto <= 0) return toast('Escribí el monto.');
    var yo = s.nombre, g = grupoNuevo(), f = new Date().toISOString();
    if (SM.op === 'sobre') {
      var otro = val('sm-sobre'); if (!otro || otro === yo) return toast('Elegí otro sobre.');
      var de = SM.dir < 0 ? yo : otro, a = SM.dir < 0 ? otro : yo, nota = 'De ' + de + ' a ' + a;
      encolar('guardarSobresMov', [[{ fecha: f, sobre: de, monto: -monto, tipo: 'Mover', grupo: g, nota: nota }, { fecha: f, sobre: a, monto: monto, tipo: 'Mover', grupo: g, nota: nota }]], 'Mover ' + de + ' → ' + a + ' · ' + txt(monto, s.moneda));
      return hecho('⇄ Movido ' + txt(monto, s.moneda) + (SM.dir < 0 ? ' a ' + nomSobre(otro) : ' desde ' + nomSobre(otro)));
    }
    if (SM.op === 'mov') {
      var fl = Number(val('sm-mov')), p = SB().pendientes.filter(function (x) { return x.mov.fila === fl; })[0];
      if (!p) return toast('Elegí el ingreso.');
      if (monto > p.falta + 0.005) return toast('A ese ingreso solo le faltan ' + txt(p.falta, s.moneda) + '.');
      encolar('guardarSobresMov', [[{ fecha: fechaSobre(p.mov), sobre: yo, monto: monto, tipo: 'Ingreso', movimiento: fl, grupo: g, nota: p.mov.comercio || '' }]], 'Ingreso → ' + yo + ' · ' + txt(monto, s.moneda));
      return hecho('📥 ' + txt(monto, s.moneda) + ' a ' + nomSobre(yo));
    }
    if (SM.dir < 0) filaSobre(C.TIPO_SACAR, yo, monto, 'Sacado del sobre ' + nomSobre(yo) + (SM.para ? ' · para ' + SM.para : ''), f);
    else filaSobre(C.TIPO_METER, yo, monto, 'Metido al sobre ' + nomSobre(yo) + ' · desde el disponible', f);
    hecho(SM.dir < 0 ? '📤 Sacaste ' + txt(monto, 'CRC') + ' de ' + nomSobre(yo) + (SM.para ? '. Cuando llegue el movimiento de ' + SM.para + ', se une solo.' : '. Queda disponible.') : '📥 Metiste ' + txt(monto, 'CRC') + ' a ' + nomSobre(yo));
  }

  // ==================================================================== v2.10.0 · CALCULADORA RÁPIDA (flotante)
  /** ¿El texto es una operación? (un signo + − × ÷ * / x después del primer número) */
  function esOperacion(t) { return /\d\s*[+\-−×x*÷\/]\s*[\d(]/i.test(String(t || '').replace(/^\s*[-−]/, '')); }
  /** Calcula "10.000+5.000−329", "13,99*505", "1500/3", "20000-10%" sin eval. Devuelve número o null. */
  function calcular(expr) {
    var t = String(expr || '').replace(/−/g, '-').replace(/[×x*]/gi, '*').replace(/[÷\/]/g, '/').replace(/\s+/g, '');
    if (!t) return null;
    var toks = [], re = /(\d[\d.,]*%?)|([+\-*/])/g, m, ult = 0;
    while ((m = re.exec(t))) { if (m.index !== ult) return null; ult = re.lastIndex; toks.push(m[1] ? { n: m[1] } : { o: m[2] }); }
    if (ult !== t.length || !toks.length) return null;
    // números (con % = porcentaje del resultado anterior en + y −, o /100 en * y /)
    var vals = [], ops = [], neg = false, acum = null;
    for (var i = 0; i < toks.length; i++) {
      var k = toks[i];
      if (k.o) { if (!vals.length && k.o === '-' && !neg) { neg = true; continue; } if (vals.length === ops.length) return null; ops.push(k.o); continue; }
      var pct = /%$/.test(k.n), v = C.leerNumero(k.n.replace('%', ''));
      if (v === null) return null;
      if (neg) { v = -v; neg = false; }
      if (pct) { var op = ops[ops.length - 1]; v = (op === '+' || op === '-') && vals.length ? evaluar(vals.slice(), ops.slice(0, -1)) * v / 100 : v / 100; }
      vals.push(v);
    }
    if (vals.length !== ops.length + 1) return null;
    var r = evaluar(vals, ops);
    return isFinite(r) ? Math.round(r * 100) / 100 : null;
  }
  function evaluar(vals, ops) {
    vals = vals.slice(); ops = ops.slice();
    for (var i = 0; i < ops.length; i++) if (ops[i] === '*' || ops[i] === '/') { vals.splice(i, 2, ops[i] === '*' ? vals[i] * vals[i + 1] : vals[i] / vals[i + 1]); ops.splice(i, 1); i--; }
    var r = vals[0]; for (var j = 0; j < ops.length; j++) r = ops[j] === '+' ? r + vals[j + 1] : r - vals[j + 1];
    return r;
  }
  function numTexto(n) { var neg = n < 0; n = Math.abs(n); var e = Math.floor(n), d = Math.round((n - e) * 100); if (d === 100) { e++; d = 0; } return (neg ? '−' : '') + String(e).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + ('0' + d).slice(-2) : ''); }
  function pistaCalc(c) {
    var r = calcular(c.value), p = c.parentNode && c.parentNode.querySelector('.calc-pista');
    if (!p && c.parentNode) { p = document.createElement('span'); p.className = 'calc-pista'; c.parentNode.appendChild(p); }
    if (p) p.textContent = r === null ? '' : '= ' + numTexto(r);
  }
  document.addEventListener('focusout', function (e) {
    var c = e.target; if (!c || !c.hasAttribute || !c.hasAttribute('data-dinero') || !esOperacion(c.value)) return;
    var r = calcular(c.value), p = c.parentNode && c.parentNode.querySelector('.calc-pista');
    if (r !== null) { c.value = formatoMonto(String(r).replace('.', ',')); c.dispatchEvent(new Event('change', { bubbles: true })); try { c.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) { /* nada */ } toast('🧮 = ' + numTexto(r), 1800); }
    if (p) p.remove();
  }, true);
  // ---- botón flotante + panel
  var CALC = { expr: '', hist: [], ultMonto: null, abierta: false };
  try { CALC.hist = JSON.parse(guardado('mf-calc-hist', '[]')) || []; CALC.expr = guardado('mf-calc-expr', '') || ''; } catch (e) { CALC.hist = []; }
  function calcVisible() { return guardado('mf-calc', 'si') !== 'no'; }
  function calcMostrar(on) { guardar('mf-calc', on ? 'si' : 'no'); montarCalc(); toast(on ? '🧮 Calculadora visible' : 'Calculadora oculta (se activa en Ajustes → Apariencia)', 2200); }
  document.addEventListener('focusin', function (e) { var c = e.target; if (c && c.hasAttribute && c.hasAttribute('data-dinero')) CALC.ultMonto = c; });
  function montarCalc() {
    var b = document.getElementById('calc-btn');
    if (!calcVisible() || !D) { if (b) b.remove(); cerrarCalc(); return; }
    if (b) return;
    b = document.createElement('button'); b.id = 'calc-btn'; b.type = 'button'; b.setAttribute('aria-label', 'Calculadora'); b.textContent = '🧮';
    var pos = leerJSONSeguro('mf-calc-pos');
    if (pos && typeof pos.x === 'number') { b.style.left = Math.max(4, Math.min(window.innerWidth - 50, pos.x)) + 'px'; b.style.top = Math.max(60, Math.min(window.innerHeight - 120, pos.y)) + 'px'; b.style.right = 'auto'; b.style.bottom = 'auto'; }
    document.body.appendChild(b);
    var arr = null, mov = false;
    b.addEventListener('pointerdown', function (e) { arr = { x: e.clientX, y: e.clientY, l: b.offsetLeft, t: b.offsetTop }; mov = false; b.classList.remove('dormido'); try { b.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } });
    b.addEventListener('pointermove', function (e) {
      if (!arr) return; var dx = e.clientX - arr.x, dy = e.clientY - arr.y;
      if (!mov && Math.abs(dx) + Math.abs(dy) < 8) return;
      mov = true; b.style.left = Math.max(4, Math.min(window.innerWidth - 50, arr.l + dx)) + 'px'; b.style.top = Math.max(60, Math.min(window.innerHeight - 120, arr.t + dy)) + 'px'; b.style.right = 'auto'; b.style.bottom = 'auto';
    });
    b.addEventListener('pointerup', function () {
      if (!arr) return; arr = null;
      if (mov) { var x = b.offsetLeft < window.innerWidth / 2 ? 6 : window.innerWidth - 52; b.style.left = x + 'px'; guardar('mf-calc-pos', JSON.stringify({ x: x, y: b.offsetTop })); }
      else alternarCalc();
      dormirCalc();
    });
    dormirCalc();
  }
  var tDormir = null;
  function dormirCalc() { clearTimeout(tDormir); tDormir = setTimeout(function () { var b = document.getElementById('calc-btn'); if (b && !CALC.abierta) b.classList.add('dormido'); }, 4000); }
  function alternarCalc() { if (CALC.abierta) cerrarCalc(); else abrirCalc(); }
  function abrirCalc() {
    CALC.abierta = true;
    var p = document.getElementById('calc-panel');
    if (!p) { p = document.createElement('div'); p.id = 'calc-panel'; document.body.appendChild(p); }
    pintarCalc();
  }
  function cerrarCalc() { CALC.abierta = false; var p = document.getElementById('calc-panel'); if (p) p.remove(); dormirCalc(); }
  function montoVisible() { var c = CALC.ultMonto; return c && document.body.contains(c) && c.offsetParent !== null ? c : null; }
  function nombreCampo(c) { var l = c.closest('label'); var sp = l && l.querySelector('span'); return sp ? sp.textContent.replace(/\s*\(.*\)$/, '').trim() : 'Monto'; }
  function pintarCalc() {
    var p = document.getElementById('calc-panel'); if (!p) return;
    var r = calcular(CALC.expr), campo = montoVisible();
    var teclas = [['C', 'c'], ['⌫', 'op'], ['%', 'op'], ['÷', 'op'], ['7'], ['8'], ['9'], ['×', 'op'], ['4'], ['5'], ['6'], ['−', 'op'], ['1'], ['2'], ['3'], ['+', 'op'], ['00'], ['0'], [','], ['=', 'eq']];
    p.innerHTML = '<div class="calc-cab"><span>🧮 Calculadora</span><span><button onclick="App.calcHist()" aria-label="Historial">↺</button><button onclick="App.cerrarCalc()" aria-label="Cerrar">✕</button></span></div>' +
      '<div class="calc-expr">' + esc(CALC.expr.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−') || ' ') + '</div><div class="calc-res">' + (r === null ? (CALC.expr ? '…' : '0') : numTexto(r)) + '</div>' +
      (CALC.verHist ? '<div class="calc-hist">' + (CALC.hist.length ? CALC.hist.map(function (h, i) { return '<button onclick="App.calcUsarHist(' + i + ')"><span>' + esc(h.e) + '</span><b>' + numTexto(h.r) + '</b></button>'; }).join('') : '<div class="suave chico">Todavía no hay cuentas.</div>') + '</div>' :
        '<div class="calc-teclas">' + teclas.map(function (t) { return '<button class="' + (t[1] || '') + '" onclick="App.calcTecla(\'' + t[0] + '\')">' + t[0] + '</button>'; }).join('') + '</div>') +
      (campo && r !== null ? '<button class="calc-usar" onclick="App.calcUsar()">Usar ' + numTexto(r) + ' en “' + esc(nombreCampo(campo)) + '”</button>' :
        '<div class="calc-pie"><button onclick="App.calcCopiar()">📋 Copiar</button><button onclick="App.calcHist()">↺ Historial</button></div>');
  }
  function calcTecla(k) {
    var e = CALC.expr;
    if (k === 'C') e = '';
    else if (k === '⌫') e = e.slice(0, -1);
    else if (k === '=') { var r = calcular(e); if (r !== null) { CALC.hist.unshift({ e: e.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−'), r: r }); CALC.hist = CALC.hist.slice(0, 10); guardar('mf-calc-hist', JSON.stringify(CALC.hist)); e = String(r).replace('.', ','); } }
    else if ('+−×÷'.indexOf(k) >= 0) { var o = { '+': '+', '−': '-', '×': '*', '÷': '/' }[k]; e = /[+\-*/]$/.test(e) ? e.slice(0, -1) + o : (e || (k === '−' ? '' : '0')) + o; }
    else if (k === '%') { if (/\d$/.test(e)) e += '%'; }
    else if (k === ',') { var ult = e.split(/[+\-*/]/).pop(); if (ult.indexOf(',') < 0) e += (/\d$/.test(e) ? '' : '0') + ','; }
    else e += k;
    CALC.expr = e; CALC.verHist = false; guardar('mf-calc-expr', e); pintarCalc();
  }
  function calcUsar() {
    var c = montoVisible(), r = calcular(CALC.expr); if (!c || r === null) return;
    c.value = formatoMonto(String(Math.abs(r)).replace('.', ','));
    c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true }));
    toast('✓ ' + numTexto(Math.abs(r)) + ' en ' + nombreCampo(c), 1800); cerrarCalc();
  }
  function calcCopiar() { var r = calcular(CALC.expr); if (r === null) return; navigator.clipboard.writeText(String(r).replace('.', ',')).then(function () { toast('📋 Copiado: ' + numTexto(r), 1500); }, function () { toast('No se pudo copiar'); }); }
  function calcHist() { CALC.verHist = !CALC.verHist; pintarCalc(); }
  function calcUsarHist(i) { var h = CALC.hist[i]; if (!h) return; CALC.expr = String(h.r).replace('.', ','); CALC.verHist = false; pintarCalc(); }

  return {
    rvSacar: rvSacar, rvDisponible: rvDisponible, rvMeter: rvMeter, formSacarMeter: formSacarMeter, smMov: smMov, smBoton: smBoton, guardarSacarMeter: guardarSacarMeter,
    rvIVA: rvIVA, formIVA: formIVA, ivaCambiar: ivaCambiar, formConfirmar: formConfirmar, guardarConfirmar: guardarConfirmar, rvDireccion: rvDireccion,
    rvSobre: rvSobre, rvRepartir: rvRepartir, rvOrigen: rvOrigen, rvCategoria: rvCategoria, rvTodoBien: rvTodoBien, rvRaro: rvRaro, rvCubrir: rvCubrir,
    formOrigenPlata: formOrigenPlata, guardarOrigenPlata: guardarOrigenPlata,
    verSobre: verSobre, sobreFiltro: sobreFiltro, irListaSobre: irListaSobre, editarSobre: editarSobre, verSobreMov: verSobreMov, deshacerSobreMov: deshacerSobreMov, formCargarSobre: formCargarSobre, cgMov: cgMov, cgBoton: cgBoton, guardarCargar: guardarCargar,
    formCuadrar: formCuadrar, cuadrarVista: cuadrarVista, guardarCuadrar: guardarCuadrar, formOrigenes: formOrigenes, guardarOrigenes: guardarOrigenes, verCuentaMov: verCuentaMov, cmFiltro: cmFiltro, rgMes: rgMes, rgDia: rgDia, rgAplicar: rgAplicar, movPer: movPer,
    iniciar: iniciar, ir: ir, cambiarMes: cambiarMes, cerrar: cerrar,
    buscar: function (v) { filtro.q = v; pintarLista(); },
    chip: function (c) { filtro.chip = c; pintar(); },
    historial: function () { verTodoHistorial = !verTodoHistorial; pintar(); },
    formMovimiento: formMovimiento, monedaDeCuenta: monedaDeCuenta, guardarMov: guardarMov, borrarMov: borrarMov,
    formTasaCero: formTasaCero, cuotaTC: cuotaTC, guardarTC: guardarTC,
    formCuenta: formCuenta, guardarCta: guardarCta, formSobre: formSobre, guardarSob: guardarSob,
    formPago: formPago, guardarPago: guardarPago, formTBP: formTBP, guardarTBP: guardarTBP,
    revisarCorreos: revisarCorreos,
    tema: setTema, temaAuto: setTemaAuto, letra: setLetra, alternarTema: alternarTema, privado: setPrivado,
    formRapido: formRapido, rapTecla: rapTecla, rapTipo: rapTipo, rapMoneda: rapMoneda, rapCuenta: rapCuenta, rapFrecuente: rapFrecuente, rapDetalles: rapDetalles, rapGuardar: rapGuardar, rapPegar: rapPegar,
    leerMensajeBanco: leerMensajeBanco, formAcciones: formAcciones, formInicio: formInicio, moverWidget: moverWidget, alternarWidget: alternarWidget, restaurarInicio: restaurarInicio,
    vistaTC: setVistaTC, agregarSubSAFI: agregarSubSAFI, elegirArchivo: elegirArchivo, guardarComprobante: guardarComprobante, difFondo: difFondo, guardarEstadoFondos: guardarEstadoFondos, formSaldoTarjeta: formSaldoTarjeta, guardarSaldoTarjeta: guardarSaldoTarjeta, cobrar: cobrar, noCobro: noCobro, formDeuda: formDeuda, deudaPagada: deudaPagada, deudaEraMia: deudaEraMia, limpiarCalc: function () { limpiarCalc(); calcVista = 'datos'; window.scrollTo(0, 0); pintar(); toast('Calculadora limpia'); }, claseCalc: claseCalc, alEscribirTasa: alEscribirTasa, buscarAjuste: buscarAjuste, pleg: function (id, abierto) { plegAbierto[id] = abierto; }, grupoAj: function (id, abierto) { grupoAj[id] = abierto; },
    alternarBuscar: alternarBuscar, formFiltros: formFiltros, aplicarFiltros: aplicarFiltros, limpiarFiltros: limpiarFiltros, verComprasDe: verComprasDe, alternarTarjeta: alternarTarjeta, recordatorios: setRecordatorios, pruebaRecordatorio: pruebaRecordatorio,
    formPIN: formPIN, guardarPIN: guardarPIN, tecla: tecla,
    usarHuella: usarHuella, alternarHuella: alternarHuella, activarHuella: activarHuella,
    recargar: function () { cargar(function () { toast('Datos actualizados'); }); },
    conectar: conectar, cambiarConexion: cambiarConexion,
    salarioLlego: salarioLlego, formSalarioOtro: formSalarioOtro, salarioManana: salarioManana, formSalario: formSalario, salPrev: salPrev, guardarSalario: guardarSalario, repCero: repCero,
    rvAjena: rvAjena, formRetiroQuitar: formRetiroQuitar, retiroQuitar: retiroQuitar, retiroBorrar: retiroBorrar, formFamilia: formFamilia, formFamiliaTarjeta: formFamiliaTarjeta, guardarFamiliaTarjeta: guardarFamiliaTarjeta, familiaAgregar: familiaAgregar, familiaQuitar: familiaQuitar, tabLista: tabLista, vistaEncargos: vistaEncargos, marcarEnc: marcarEnc, formPagadoEnc: formPagadoEnc, peMedio: peMedio, guardarPagadoEnc: guardarPagadoEnc, formEncargo: formEncargo, feDe: feDe, feSec: feSec, feAuto: feAuto, guardarEncargo: guardarEncargo, fotoEncargo: fotoEncargo, formEncargante: formEncargante, guardarEncargante: guardarEncargante, quitarEncargante: quitarEncargante, cuentasEncargos: cuentasEncargos, mandarCuentaEnc: mandarCuentaEnc, estadoEnc: estadoEnc, pasarMeDeben: pasarMeDeben, baseSeccion: baseSeccion, vistaLista: vistaLista, formPagado: formPagado, guardarPagado: guardarPagado, fiSel: fiSel, fiAuto: fiAuto, bandejaLimpia: bandejaLimpia, vjSumaPres: vjSumaPres, vjRepartir: vjRepartir, vjFiltro: vjFiltro, vjSumarAntes: vjSumarAntes, vjNoSugerir: vjNoSugerir, vjDupBorrar: vjDupBorrar, vjDupNo: vjDupNo, formCompraManual: formCompraManual, cmCat: cmCat, guardarCompraManual: guardarCompraManual, formRetiroViaje: formRetiroViaje, vjUsarRetiro: vjUsarRetiro, guardarRetiroViaje: guardarRetiroViaje, resumenViaje: resumenViaje, compartirViaje: compartirViaje, pdfViaje: pdfViaje, vjSumar: vjSumar, vjSacar: vjSacar, calcMostrar: calcMostrar, cerrarCalc: cerrarCalc, calcTecla: calcTecla, calcUsar: calcUsar, calcCopiar: calcCopiar, calcHist: calcHist, calcUsarHist: calcUsarHist, formIgualar: formIgualar, igCalc: igCalc, igModo: igModo, guardarIgualar: guardarIgualar, formIgualarTodos: formIgualarTodos, igTodosModo: igTodosModo, igTodosCalc: igTodosCalc, guardarIgualarTodos: guardarIgualarTodos, plModo: plModo, plMonto: plMonto, plMoneda: plMoneda, plPaso: plPaso, plSobre: plSobre, plSobreMonto: plSobreMonto, plOrigen: plOrigen, plCopiar: plCopiar, plSacar: plSacar, plSinCorreo: plSinCorreo, rvSacadas: rvSacadas, rvSacadasNo: rvSacadasNo, formAjenas: formAjenas, ajenaAgregar: ajenaAgregar, ajenaNombre: ajenaNombre, ajenaQuitar: ajenaQuitar, avisoTipo: avisoTipo, avisoDiasPago: avisoDiasPago, avisoSilencio: avisoSilencio, avisoCorreo: avisoCorreo, avisoCorreoHora: avisoCorreoHora, avisosTelefono: avisosTelefono, probarAviso: probarAviso,
    formActualizar: formActualizar, copiarCodigo: copiarCodigo, volverAnterior: volverAnterior, actualizarApp: actualizarApp,
    formNuevaLista: formNuevaLista, nlIcono: nlIcono, crearListaNueva: crearListaNueva, crearConBase: crearConBase, abrirLista: abrirLista, modoLista: modoLista, marcarItem: marcarItem,
    agregarItem: agregarItem, cantItem: cantItem, formItem: formItem, guardarItem: guardarItem, quitarItem: quitarItem, fotoItem: fotoItem, quitarFotoItem: quitarFotoItem, verItem: verItem,
    noHayItem: noHayItem, preguntarItem: preguntarItem, enviarPregunta: enviarPregunta, responderConsulta: responderConsulta, agregarBasicos: agregarBasicos, guardarBasicos: guardarBasicos,
    loDeSiempre: loDeSiempre, compartirLista: compartirLista, enviarLink: enviarLink, copiarLink: copiarLink, listaEditable: listaEditable, nuevoLink: nuevoLink, dejarCompartir: dejarCompartir,
    menuLista: menuLista, guardarMenuLista: guardarMenuLista, borrarLista: borrarLista, formTerminar: formTerminar, terminarCompra: terminarCompra, editarInicio: editarInicio, abrirPlan: abrirPlan, planPreset: planPreset, planMarcar: planMarcar, planSobre: planSobre, planSugerir: planSugerir, planTodo: planTodo, formPagarPlan: formPagarPlan, copiarMontoPlan: copiarMontoPlan, yaPague: yaPague, guardarPlan: guardarPlan, usarPlan: usarPlan, noPlan: noPlan, salirSel: salirSel, copiarSel: copiarSel, asignarSel: asignarSel, guardarAsignarSel: guardarAsignarSel, iniMover: iniMover, agregarAcceso: agregarAcceso, iniQuitar: iniQuitar, iniTam: iniTam, iniListo: iniListo, iniAgregarW: iniAgregarW, iniActivar: iniActivar, iniFabrica: iniFabrica, iniAgregarA: iniAgregarA, iniQuitarAcceso: iniQuitarAcceso, reemplazarAcceso: reemplazarAcceso, mostrarDatosCx: mostrarDatosCx, cerrarCapaSegura: cerrarCapaSegura, verificarPinSeguro: verificarPinSeguro, huellaSegura: huellaSegura,
    volver: volver, abrirItem: abrirItem, presionar: presionar, soltar: soltar, cancelarPresion: cancelarPresion,
    formAccesos: formAccesos, guardarAccesos: guardarAccesos, exportarCSV: exportarCSV,
    calcSet: calcSet, calcular: calcular, verDatos: verDatos, verYSi: verYSi,
    calcVer: function (v) { leerFormAbono(); calcVista = v; window.scrollTo(0, 0); pintar(); },
    usarCasa: function () { if (pantalla !== 'calculadora') ir('calculadora'); usarCasa(); },
    guardarSim: guardarSim, cargarSim: cargarSim, borrarSim: borrarSim, compartirPDF: compartirPDF,
    formPreparado: formPreparado, guardarPreparado: guardarPreparado,
    formAsignar: formAsignar, asigModo: asigModo, asigTodo: asigTodo, asigFila: asigFila, asigAgregar: asigAgregar, asigQuitar: asigQuitar,
    guardarAsignar: guardarAsignar, repCambio: repCambio, repAjuste: repAjuste, guardarRepartoMov: guardarRepartoMov,
    repGuardarCheck: function (v) { rep.guardar = v; }, formMover: formMover, guardarMover: guardarMover,
    limpiarSel: function (n, v) { limpiar.sel[n] = v; pintar(); }, limpiarDestino: function (n) { limpiar.destino = n; pintar(); },
    guardarLimpiar: guardarLimpiar, deshacerSobres: deshacerSobres, elegir: elegir, buscarElegir: buscarElegir, cerrarElegir: cerrarElegir, p2Marcar: p2Marcar, p2Sobre: p2Sobre, p2Sugerir: p2Sugerir, p2Manual: p2Manual, formSobresDesde: formSobresDesde, guardarSobresDesde: guardarSobresDesde, formSobresEspeciales: formSobresEspeciales, guardarSobresEspeciales: guardarSobresEspeciales,
    formCola: formCola, quitarDeCola: function (id, b) {
      if (!b.dataset.ok) { b.dataset.ok = '1'; b.textContent = '¿Seguro? Tocá otra vez'; return; }
      cola = cola.filter(function (x) { return x.id !== id; }); guardarCola(); toast('Quitado. Si ya estaba en la hoja, queda como está.'); cargar(); formCola();
    }, reintentarCola: function () { ultimoErrorCola = ''; toast('Enviando…'); enviarCola(true); setTimeout(actualizarBadges, 300); },
    formSubcuenta: formSubcuenta, guardarSubcuenta: guardarSubcuenta, formFondo: formFondo, guardarFondo: guardarFondo,
    formActualizarFondo: formActualizarFondo, vistaFondo: vistaFondo, guardarActualizarFondo: guardarActualizarFondo,
    verViaje: verViaje, formViaje: formViaje, guardarViaje: guardarViaje, borrarViaje: borrarViaje, formLimiteViaje: formLimiteViaje,
    guardarLimiteViaje: guardarLimiteViaje, formCompraViaje: formCompraViaje, marcarViaje: marcarViaje, formAgregarViaje: formAgregarViaje,
    verTC: verTC, formAbonoTC: formAbonoTC, abonoCompra: abonoCompra, abonoVista: abonoVista,
    guardarAbonoTC: guardarAbonoTC, borrarAbonoTC: borrarAbonoTC,
    tcFiltro: function (f) { tcFiltro = f; tcVerTodo = false; pintar(); }, tcVerTodo: function () { tcVerTodo = true; pintar(); }
  };
})();
App.iniciar();
