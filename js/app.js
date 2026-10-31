var App = (function () {
  'use strict';
  var D = null;                       // datos de la hoja
  var hoy = new Date();
  var mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  var pantalla = 'inicio';
  var filtro = { q: '', chip: 'todos', cuenta: '', moneda: '', tipo: '', buscando: false };
  var verTodoHistorial = false;
  var C = Calc;
  var token = guardado('mf-ses', null, sessionStorage);
  var pinActivo = false;
  var pinLargo = Number(guardado('mf-pinlen', '0')) || null;   // cuántos números tiene el PIN
  var AJ = null;                      // ajustes del servidor
  var ocultoDesde = null;
  var MINUTOS_BLOQUEO = 5;
  var VERSION_WEB = '2.2.1';

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
  function etiquetaCuenta(n) { var c = cuentaPorNombre(n); return c && c.ultimos4 ? n + ' ••' + c.ultimos4 : n; }
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
  function llamar(accion, args, conex) {
    trabajando(accion, true);
    return llamarDirecto(accion, args, conex).then(function (x) { trabajando(accion, false); return x; }, function (e) { trabajando(accion, false); throw e; });
  }
  function llamarDirecto(accion, args, conex) {
    var c = conex || conexion();
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 60000);
    return fetch(c.url, {
      method: 'POST', redirect: 'follow', signal: ctl ? ctl.signal : undefined,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave: c.clave, sesion: token, accion: accion, args: args || [] })
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
    if (!b || b.classList.contains('ocupado')) return;
    b.disabled = true; b.classList.add('ocupado');
    b.dataset.html = b.innerHTML;
    var grande = b.classList.contains('btn') && !b.classList.contains('chico');
    b.innerHTML = '<span class="giro"></span>' + (grande ? 'Guardando…' : '');
  }
  function liberar(b, bien) {
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
      if (m.fila) { var o = movF(m.fila); if (o) Object.assign(o, datos); }
      else if (!movF(it.temp)) D.movimientos.push(Object.assign({ fila: it.temp, subcuenta: '', viaje: '' }, datos));
    },
    marcarMovimiento: function (args) { var o = movF(args[0]); if (o) o[{ 'Subcuenta': 'subcuenta', 'Viaje': 'viaje', 'Para otra persona': 'para', 'Cobro': 'cobro', 'Nota': 'nota' }[args[1]] || 'x'] = args[2]; },
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
  function enviarCola() {
    if (enviando || !cola.length || !conexion().url) return;
    if (navigator.onLine === false) { ultimoErrorCola = 'Sin internet.'; actualizarBadges(); return; }
    enviando = true;
    var it = cola[0];
    llamar(it.accion, it.args).then(function () {
      cola.shift(); guardarCola(); enviando = false; envios++;
      ultimoErrorCola = ''; guardar('mf-cola-error', null);
      if (cola.length) enviarCola(); else cargar();
    }, function (e) {
      enviando = false;
      var msg = e && e.message ? e.message : String(e);
      if (e && e.red) { ultimoErrorCola = msg; guardar('mf-cola-error', msg); actualizarBadges(); return; }
      if (msg.indexOf('PIN_REQUERIDO') >= 0) { token = null; guardar('mf-ses', null, sessionStorage); bloquear(); return; }
      if (msg.indexOf('CLAVE_INVALIDA') >= 0) { mostrarConexion('La clave ya no es válida. Escribí la clave actual.'); return; }
      // Google lo rechazó: se quita de la cola y la recarga lo deshace en la pantalla
      cola.shift(); guardarCola(); envios++;
      toast('⚠️ No se guardó «' + it.desc + '»: ' + msg.replace(/ Recarg.*$/, '') + ' Se deshizo.', 8000);
      if (cola.length) enviarCola(); else cargar();
    });
  }
  window.addEventListener('online', function () { enviarCola(); });
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
        return '<div class="item" style="cursor:default"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(it.desc || it.accion) + '</span><span class="det" style="display:block">' + hace(it.creado) + '</span></span></div>';
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
  function leerCache() { try { var t = localStorage.getItem('mf-cache'); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  function guardarCache(json) { try { localStorage.setItem('mf-cache', json); } catch (e) { /* sin espacio: no pasa nada */ } }
  var pintarPendiente = false;
  function sincronizando() { /* v1.9: la descarga es silenciosa */ }
  function escribiendo() { var e = document.activeElement; return e && /INPUT|SELECT|TEXTAREA/.test(e.tagName) && !$('panel').contains(e); }
  function cargar(cb) {
    sincronizando(true);
    var n0 = envios;
    srv('obtenerDatos', [], function (json) {
      if (n0 !== envios && D) { if (cb) cb(); return; }   // llegó algo a Google mientras tanto: viene otra recarga más fresca
      D = JSON.parse(json);
      hoy = new Date(D.hoy);
      reaplicarCola();   // lo que todavía no llegó a Google se sigue viendo
      guardarCache(JSON.stringify(D));
      if (D.ajustes) { AJ = D.ajustes; pinActivo = AJ.pinActivo; guardar('mf-aj', JSON.stringify(AJ)); }
      sincronizando(false);
      $('cargando').style.display = 'none';
      if (escribiendo()) pintarPendiente = true; else pintar();   // no borrar lo que la persona está escribiendo
      if (cb) cb();
      if (cola.length) enviarCola();
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
      mas: pMas, calculadora: pCalc, tasacero: pTasaCero, tcdetalle: pTCDetalle, porasignar: pPorAsignar, reparto: pReparto, limpiar: pLimpiar, fondos: pFondos, medeben: pMeDeben, viajes: pViajes, viaje: pViaje, reportes: pReportes, patrimonio: pPatrimonio
    })[pantalla](res, sob);
    formatearMontos();
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
  function widgetsInicio() {
    var guardados = leerJSONSeguro('mf-inicio');
    var base = WIDGETS.map(function (w) { return { k: w[0], on: w[3] }; });
    if (!Array.isArray(guardados)) return base;
    var lista = guardados.filter(function (x) { return x && WIDGETS.some(function (w) { return w[0] === x.k; }); });
    base.forEach(function (b) { if (!lista.some(function (x) { return x.k === b.k; })) lista.push(b); });   // widgets nuevos de versiones futuras
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
  function widget(k, res) {
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
      return wChico("App.ir('sobres')", '✉ Sobre más bajo', esc(s.nombre), din(s.saldo, 'CRC'), s.saldo < 10000 ? 'rojo' : '');
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
      var sbI = SB(), lst = sbI.lista.filter(function (s) { return s.moneda === 'CRC'; }).sort(function (a, b) { return (b.pct || 0) - (a.pct || 0); }).slice(0, 4);
      if (!lst.length) return '';
      return '<div class="caja ancho"><div class="fila"><h3>Sobres · ' + din(sbI.total.CRC, 'CRC') + '</h3><a href="#" onclick="App.ir(\'sobres\');return false" class="enlace">Ver todos</a></div>' + lst.map(function (s) {
        return '<div style="display:flex;flex-direction:column;gap:4px"><div class="fila" style="font-size:14px"><span>' + esc(s.nombre) + '</span><span class="fuerte' + (s.saldo < 0 ? ' rojo' : '') + '">' + din(s.saldo, s.moneda) + '</span></div>' + barra(s.pct, s.pct >= 0.85) + '</div>';
      }).join('') + '</div>';
    }
    if (k === 'accesos') {
      return '<div class="ancho"><div class="accesos fila-accesos">' + accesos().slice(0, 4).concat(['mas']).map(function (x) { return tile(x, false); }).join('') + '</div></div>';
    }
    if (k === 'ultimos') {
      if (!res.movimientos.length) return '<div class="caja vacio ancho">No hay movimientos en ' + nombreMes(mes).toLowerCase() + '.<br>Tocá el + amarillo para agregar uno.</div>';
      return '<div class="caja sinpad ancho"><div class="fila" style="padding:14px 16px 4px"><h3>Últimos movimientos</h3><a href="#" onclick="App.ir(\'movimientos\');return false" class="enlace">Ver todos</a></div>' +
        res.movimientos.slice(0, 4).map(itemMov).join('') + '</div>';
    }
    return '';
  }
  function avisosInicio(res) {
    var h = '';
    var linea = function (icono, texto, accion, alerta) {
      return '<button class="linea-aviso' + (alerta ? ' alerta' : '') + '" onclick="' + accion + '"><span class="li-ic">' + icono + '</span><span class="li-t">' + texto + '</span><span class="enlace">Ver ›</span></button>';
    };
    if (res.porRevisar) h += linea('⚠️', '<b>' + res.porRevisar + '</b> por revisar <span class="suave">· sin categoría</span>', "App.ir('movimientos','revisar')", true);
    if (!sinServidorSobres()) { var n = SB().pendientes.length; if (n) h += linea('✉', '<b>' + n + '</b> por asignar a sobres', "App.ir('porasignar')"); }
    if (D.fondos) { var f = FD().pendientes.length; if (f) h += linea('📈', '<b>' + f + '</b> ' + (f > 1 ? 'inversiones' : 'inversión') + ' sin subcuenta', "App.ir('fondos')"); }
    return h ? '<div class="ancho avisos">' + h + '</div>' : '';
  }
  function pInicio(res) {
    var h = cabMes('Resumen');
    var ws = widgetsInicio().filter(function (w) { return w.on; });
    var cuerpo = '', avisosPuestos = false;
    ws.forEach(function (w) {
      if (!avisosPuestos && (w.k === 'accesos' || w.k === 'ultimos' || w.k === 'sobres')) { cuerpo += avisosInicio(res); avisosPuestos = true; }
      cuerpo += widget(w.k, res);
    });
    if (!avisosPuestos) cuerpo += avisosInicio(res);
    h += '<div class="widgets">' + cuerpo + '</div>';
    $('p-inicio').innerHTML = h;
  }
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
    ['PLANIFICAR', ['sobres', 'viajes', 'calculadora', 'tasacero', 'recurrentes']],
    ['ANÁLISIS', ['reportes', 'patrimonio', 'categorias', 'exportar']],
    ['AJUSTES', ['configuracion', 'hoja', 'bancos', 'agregar']]
  ];
  var ACCESOS_INICIALES = ['sobres', 'prestamo', 'calculadora', 'tasacero', 'recurrentes', 'reportes', 'patrimonio'];
  var MAX_ACCESOS = 7;

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
    if (k === 'mas') return;
    var a = accesos(), i = a.indexOf(k);
    if (i >= 0) { a.splice(i, 1); toast(ITEMS[k][0] + ' ya no está en Inicio'); }
    else if (a.length >= MAX_ACCESOS) { toast('En Inicio caben ' + MAX_ACCESOS + ' accesos. Quitá uno primero.'); return; }
    else { a.push(k); toast('📌 ' + ITEMS[k][0] + ' fijado en Inicio'); }
    guardar('mf-accesos', JSON.stringify(a));
    if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) { /* nada */ } }
    pintar();
  }
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
    var h = cabSimple('Más', 'Mantené presionado un ícono para fijarlo en Inicio');
    SECCIONES.forEach(function (s) {
      h += '<div class="seccion-t">' + s[0] + '</div><div class="accesos">' + s[1].map(function (k) { return tile(k, true); }).join('') + '</div>';
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
  function nombreBonito(s) {
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
    var sb = SB();
    if (!sb.desde || new Date(m.fecha) < sb.desde) return '';
    var p = sb.pendientes.filter(function (x) { return x.mov.fila === m.fila; })[0];
    if (p) return '<span class="et-sobre falta">✉ ' + (p.asignado > 0.005 ? 'Falta ' + txt(p.falta, m.moneda) : p.sentido === 'entra' ? 'Por repartir' : 'Sin sobre') + '</span>';
    var filas = (sb.porMov[m.fila] || []).filter(function (x) { return x.sobre; });
    var nombres = [];
    filas.forEach(function (x) { if (nombres.indexOf(x.sobre) < 0) nombres.push(x.sobre); });
    if (!nombres.length && m.sobre) nombres = [m.sobre];
    if (!nombres.length) return (sb.cubierto[m.fila] ? '<span class="et-sobre ok">✉ Cubierto</span>' : '');
    return '<span class="et-sobre ok">✉ ' + esc(nombres[0]) + (nombres.length > 1 ? ' +' + (nombres.length - 1) : '') + '</span>';
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
    return '<button class="item mov" onclick="App.formMovimiento(' + m.fila + ')"><span class="ico-cat" style="background:color-mix(in srgb, ' + ic[1] + ' 18%, transparent);color:' + ic[1] + '">' + ic[0] + '</span>' +
      '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(nombreBonito(m.comercio) || m.tipo) + '</span>' +
      '<span class="det" style="display:block">' + desc + (et ? ' ' + et : extra.length ? ' · ' + extra.join(' · ') : '') + '</span></span>' +
      '<span class="monto"><span class="' + (entra ? 'verde-pos' : '') + '" style="display:block">' + signo + din(m.monto, m.moneda).replace('−', '') + '</span>' +
      (et && extra.length ? '<span class="origen">' + extra.join(' · ') + '</span>' : '') + '</span></button>';
  }

  function pMovimientos(res) {
    var h = cabMes('Movimientos');
    if (filtro.buscando || filtro.q) h += '<label class="buscador">' + ico('buscar', ' style="width:18px;height:18px;color:var(--suave)"') +
      '<input type="search" id="q" aria-label="Buscar movimientos" placeholder="Comercio, categoría, nota…" value="' + esc(filtro.q) + '" oninput="App.buscar(this.value)"></label>';
    // resumen del mes
    h += '<div class="resumen-mov"><div><span>Gastos</span><b>' + din(res.total.CRC, 'CRC') + '</b>' + (res.total.USD ? '<small>+ ' + din(res.total.USD, 'USD') + '</small>' : '') + '</div>' +
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
    $('p-movimientos').innerHTML = h;
    pintarLista(res);
  }
  function alternarBuscar() { filtro.buscando = !filtro.buscando; if (!filtro.buscando) filtro.q = ''; pintar(); if (filtro.buscando) setTimeout(function () { var e = $('q'); if (e) e.focus(); }, 50); }

  function pintarLista(res) {
    res = res || C.resumenMes(D, mes);
    var q = filtro.q.trim().toLowerCase();
    var sinSobre = {};
    if (filtro.chip === 'sinsobre' && !sinServidorSobres()) SB().pendientes.forEach(function (p) { sinSobre[p.mov.fila] = 1; });
    var lista = res.movimientos.filter(function (m) {
      if (filtro.chip === 'revisar' && !(m.tipo === 'Gasto' && !m.categoria)) return false;
      if (filtro.chip === 'sinsobre' && !sinSobre[m.fila]) return false;
      if (filtro.chip.indexOf('c:') === 0 && !(m.tipo === 'Gasto' && m.categoria === filtro.chip.slice(2))) return false;
      if (filtro.chip.indexOf('b:') === 0) { var c0 = cuentaPorNombre(m.cuenta); if (!c0 || c0.banco !== filtro.chip.slice(2)) return false; }
      if (filtro.moneda && m.moneda !== filtro.moneda) return false;
      if (filtro.cuenta && m.cuenta !== filtro.cuenta) return false;
      if (filtro.tipo && m.tipo !== filtro.tipo) return false;
      if (q && [m.comercio, m.lugar, m.categoria, m.cuenta, m.sobre, m.nota].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (!lista.length) { $('listaMov').innerHTML = '<div class="caja vacio">No hay movimientos con ese filtro.</div>'; return; }
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
      return '<div class="dia"><span>' + et + DIAS[x.d.getDay()] + ' ' + x.d.getDate() + '</span><span class="m">' + (oculto() ? '' : t) + '</span></div><div class="caja sinpad">' + x.movs.map(itemMov).join('') + '</div>';
    }).join('');
    $('listaMov').innerHTML = '<div style="display:flex;flex-direction:column;gap:10px">' + h + '</div>';
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
      h += '<div class="caja" style="gap:8px"><div class="fila" style="align-items:flex-start"><div><div class="suave chico">Deuda total hoy</div><div class="fuerte" style="font-size:21px">' + din(deuC, 'CRC') + (deuU ? ' <span class="suave chico">+ ' + din(deuU, 'USD') + '</span>' : '') + '</div></div>' +
        (D.sobresDesde ? '<div style="text-align:right"><div class="suave chico">Cubierto por sobres</div><div class="fuerte verde-pos" style="font-size:21px">' + Math.round(pctCub * 100) + '%</div></div>' : '') + '</div>' +
        (D.sobresDesde ? '<div class="barra"><i style="width:' + Math.min(100, pctCub * 100).toFixed(1) + '%;background:var(--positivo)"></i></div>' : '') + '</div>';
    }
    h += '<div class="caja sinpad">' + datos.map(function (x) {
      var c = x.c, ab = tarjetaAbierta === c.fila, g = res.porCuenta[c.nombre] || { CRC: 0, USD: 0, cuotasTC: { CRC: 0, USD: 0 } };
      var urg = x.dias <= 3, lleno = x.uso !== null && x.uso >= 0.75;
      var dt = x.dt, cambio = '';
      if (dt.vivo) {
        var difC = dt.sube.CRC - dt.baja.CRC, difU = dt.sube.USD - dt.baja.USD, desde = ' desde ' + fechaCorta(dt.fecha).replace(/ \d{4}$/, '');
        cambio = Math.abs(difC) < 0.005 && Math.abs(difU) < 0.005 ? '<span class="suave chico">sin cambios' + desde + '</span>'
          : '<span class="chico ' + (difC + difU > 0 ? 'naranja' : 'verde-pos') + '">' + [Math.abs(difC) >= 0.005 ? (difC > 0 ? '+' : '−') + din(Math.abs(difC), 'CRC') : '', Math.abs(difU) >= 0.005 ? (difU > 0 ? '+' : '−') + din(Math.abs(difU), 'USD') : ''].filter(String).join(' ') + desde + '</span>';
      }
      var saldo2 = (dt.USD ? '<span class="suave chico">+ ' + din(dt.USD, 'USD') + '</span>' : '') + (cambio || (!dt.vivo ? '<span class="suave chico">saldo sin fecha</span>' : ''));
      var fila = '<button class="tj" onclick="App.alternarTarjeta(' + c.fila + ')" aria-expanded="' + ab + '"><span class="mini-plastico" style="background:linear-gradient(135deg,' + colorBanco(c.banco) + ',color-mix(in srgb,' + colorBanco(c.banco) + ' 70%, white))">' + esc(c.ultimos4 || '') + '</span>' +
        '<span class="cuerpo"><span class="nombre">' + esc(c.nombre) + '</span>' + (x.dias < 999 ? '<span class="pill' + (urg ? ' alerta' : '') + '">pagar ' + enDias(x.dias) + '</span>' : '') + '</span>' +
        '<span class="monto"><b>' + din(dt.CRC, 'CRC') + '</b>' + saldo2 + '</span></button>' +
        (x.uso !== null ? '<div class="tj-barra"><div class="barra' + (lleno ? ' alerta' : '') + '" style="height:5px"><i style="width:' + Math.max(1.5, Math.min(100, x.uso * 100)).toFixed(1) + '%' + (lleno ? ';background:var(--rojo)' : '') + '"></i></div></div>' : '');
      if (ab) {
        var faltaC = Math.max(0, dt.CRC - x.rC), faltaU = Math.max(0, dt.USD - x.rU);
        var dosMon = function (o) { return [o.CRC || !o.USD ? din(o.CRC, 'CRC') : '', o.USD ? din(o.USD, 'USD') : ''].filter(String).join(' + '); };
        var tcs = D.tasaCero.filter(function (t) { return t.tarjeta === c.nombre; }).map(function (t) { return { t: t, e: C.estadoTasaCero(t, hoy) }; }).filter(function (y) { return y.e.restantes > 0; });
        var linea = function (a, b, cls) { return '<div class="fila chico"><span class="suave">' + a + '</span><span class="fuerte ' + (cls || '') + '">' + b + '</span></div>'; };
        fila += '<div class="tj-det">' +
          (dt.vivo ? linea('Saldo al ' + fechaCorta(dt.fecha) + ' (estado de cuenta)', dosMon(dt.base)) +
            linea('+ ' + dt.compras + ' compra' + (dt.compras === 1 ? '' : 's') + ' desde entonces', '+' + dosMon(dt.sube), 'naranja') +
            linea('− Pagos desde entonces', '−' + dosMon(dt.baja), 'verde-pos') +
            '<div style="border-top:1px solid var(--linea);margin:2px 0"></div>' + linea('Deuda hoy', dosMon(dt))
            : '<div class="aviso-tasa" style="margin:0 0 4px">Este saldo no se mueve solo. Tocá <b>↻ Actualizar saldo</b> y poné lo que debés hoy: desde ahí la app suma las compras y resta los pagos.</div>') +
          (c.limiteCRC ? linea('Disponible', din(c.limiteCRC - Math.max(0, dt.CRC), 'CRC'), 'verde-pos') : '') +
          linea('Compras del mes', din(g.CRC, 'CRC') + (g.USD ? ' + ' + din(g.USD, 'USD') : '')) +
          (g.cuotasTC.CRC || g.cuotasTC.USD ? linea('Cuotas tasa cero del mes', din(g.cuotasTC.CRC, 'CRC') + (g.cuotasTC.USD ? ' + ' + din(g.cuotasTC.USD, 'USD') : '')) : '') +
          (D.sobresDesde ? linea('Reservado en sobres', [x.rC > 0.005 || !x.rU ? din(x.rC, 'CRC') : '', x.rU > 0.005 ? din(x.rU, 'USD') : ''].filter(String).join(' + '), 'verde-pos') +
            linea('Falta cubrir', [faltaC > 0.005 || !faltaU ? din(faltaC, 'CRC') : '', faltaU > 0.005 ? din(faltaU, 'USD') : ''].filter(String).join(' + '), faltaC + faltaU > 0.005 ? 'acento' : 'verde-pos') : '') +
          (x.uso !== null ? linea('Límite', din(c.limiteCRC, 'CRC') + ' · usado ' + Math.round(x.uso * 100) + '%') : '') +
          linea('Corte y pago', (c.diaCorte ? 'día ' + c.diaCorte : '—') + ' · ' + (c.diaPago ? 'día ' + c.diaPago : '—')) +
          (tcs.length ? '<div class="suave chico fuerte" style="margin-top:6px">CUOTAS TASA CERO</div>' + tcs.map(function (y) {
            return linea(esc(y.t.descripcion) + ' · ' + (y.t.meses - y.e.restantes) + ' de ' + y.t.meses, din(y.e.cuota, y.t.moneda) + '/mes');
          }).join('') : '') +
          '<div class="chips" style="margin-top:8px;flex-wrap:wrap"><button class="chip" onclick="App.verComprasDe(\'' + esc(c.nombre).replace(/'/g, "\\'") + '\')">Ver compras</button>' +
          '<button class="chip" onclick="App.formMovimiento(0,{tipo:\'Pago de tarjeta\',cuenta:\'' + esc(c.nombre).replace(/'/g, "\\'") + '\'})">Registrar pago</button>' +
          '<button class="chip on" onclick="App.formSaldoTarjeta(' + c.fila + ')">↻ Actualizar saldo</button>' +
          '<button class="chip" onclick="App.formCuenta(' + c.fila + ')">Editar</button></div></div>';
      }
      return '<div class="tj-fila' + (ab ? ' abierta' : '') + '">' + fila + '</div>';
    }).join('') + '</div>';
    var otras = D.cuentas.filter(function (c) { return c.tipo !== 'Tarjeta de crédito' && c.activa; });
    if (otras.length) {
      h += '<div class="seccion">Otras cuentas</div><div class="caja sinpad">' + otras.map(function (c) {
        var icono = c.tipo === 'Préstamo' ? '🏠' : c.tipo === 'Inversión' ? '📈' : c.moneda === 'USD' ? '💵' : '🏦';
        var saldo = [c.saldoCRC ? din(c.saldoCRC, 'CRC') : '', c.saldoUSD ? din(c.saldoUSD, 'USD') : ''].filter(String).join(' + ') || din(0, c.moneda);
        return '<button class="item" onclick="App.formCuenta(' + c.fila + ')"><span class="ico-cat" style="background:var(--linea)">' + icono + '</span><span class="cuerpo"><span class="nombre" style="display:block">' + esc(c.nombre) + '</span><span class="det" style="display:block">' + esc(c.tipo + (c.banco ? ' · ' + c.banco : '')) + '</span></span><span class="monto">' + saldo + '</span></button>';
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
    var nPend = sb.pendientes.length;
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">Dinero en sobres</span>' + botonOjo() + '</div>' +
      '<div style="display:flex;gap:18px;align-items:baseline;flex-wrap:wrap"><span class="grande">' + din(sb.total.CRC, 'CRC') + '</span>' + (sb.total.USD ? '<span class="medio">' + din(sb.total.USD, 'USD') + '</span>' : '') + '</div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Por asignar' + (nPend ? ' (' + nPend + ')' : '') + '</span><b style="color:var(--acento)">' + din(sb.porAsignar.CRC, 'CRC') + (sb.porAsignar.USD ? ' + ' + din(sb.porAsignar.USD, 'USD') : '') + '</b></div>' +
      (sb.reservadoTotal > 0.005 || sb.reservadoUSD > 0.005 ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Reservado para pagar tarjetas</span><b>' +
        [sb.reservadoTotal > 0.005 ? din(sb.reservadoTotal, 'CRC') : '', sb.reservadoUSD > 0.005 ? din(sb.reservadoUSD, 'USD') : ''].filter(String).join(' + ') + '</b></div>' : '') +
      '<div class="rapidos"><button class="principal" onclick="App.ir(\'porasignar\')">' + ico('flechas') + (nPend ? 'Asignar (' + nPend + ')' : 'Por asignar') + '</button>' +
      '<button onclick="App.formMover()">' + ico('flechas') + 'Mover</button><button onclick="App.ir(\'limpiar\')">' + ico('recargar') + 'Limpiar</button></div></div>';
    h += '<div class="caja sinpad">' + sb.lista.map(function (s, i) {
      var neg = s.saldo < -0.005;
      var det = (Math.abs(s.inicioMes) > 0.005 ? 'Venía ' + din(s.inicioMes, s.moneda) + ' · ' : '') + (s.entradas ? '+' + din(s.entradas, s.moneda) + ' · ' : '') + 'salió ' + din(s.salidas, s.moneda);
      if (s.meta) det += ' · meta ' + din(s.meta, s.moneda);
      var avance = s.meta ? Math.max(0, Math.min(1, s.saldo / s.meta)) : s.pct;
      return '<button class="item" style="flex-direction:column;align-items:stretch;gap:6px" onclick="App.formSobre(' + i + ')">' +
        '<span class="fila"><span style="font-weight:700">' + esc(s.nombre) + (s.ajuste ? ' <span class="pill" style="font-size:10px;padding:2px 6px">AJUSTE</span>' : '') + '</span>' +
        '<span class="fuerte' + (neg ? ' rojo' : '') + '">' + din(s.saldo, s.moneda) + '</span></span>' +
        barra(avance, !s.meta && s.pct >= 0.85) + '<span class="chico suave">' + det + '</span></button>';
    }).join('') + '</div>';
    h += '<div class="suave chico" style="text-align:center">Saldos desde el ' + fechaCorta(D.sobresDesde) + '. Las compras con tarjeta bajan el sobre al asignarlas; lo reservado paga la tarjeta.</div>';
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
    var sb = SB();
    if (!sb.pendientes.length) h += '<div class="caja vacio">Todo está asignado. 🎉</div>';
    else {
      var entra = sb.pendientes.filter(function (p) { return p.sentido === 'entra'; }), sale = sb.pendientes.filter(function (p) { return p.sentido === 'sale'; });
      if (entra.length) h += '<div class="seccion-t">ENTRÓ DINERO</div><div class="caja sinpad">' + entra.map(itemPend).join('') + '</div>';
      if (sale.length) h += '<div class="seccion-t">SALIÓ DINERO</div><div class="caja sinpad">' + sale.map(itemPend).join('') + '</div>';
    }
    if (D.fondos && FD().pendientes.length) h += '<div class="seccion-t">FONDOS: ¿A QUÉ SUBCUENTA?</div><div class="caja sinpad">' + FD().pendientes.map(itemFondoPend).join('') + '</div>';
    h += '<div class="suave chico" style="text-align:center">Las compras con tarjeta bajan el sobre en el momento y quedan reservadas para pagar la tarjeta. Con «Recordar», las próximas del mismo comercio se asignan solas.</div>';
    $('p-porasignar').innerHTML = h;
  }

  // ---- asignar un movimiento
  var asig = null;   // { fila, modo, filas:[{sobre,monto}] }
  function opcionesSobre(moneda, sel, conSaldo) {
    var sb = SB();
    return sb.lista.filter(function (s) { return s.moneda === moneda; }).map(function (s) {
      return '<option value="' + esc(s.nombre) + '"' + (s.nombre === sel ? ' selected' : '') + '>' + esc(s.nombre) + (conSaldo ? ' · ' + txt(s.saldo, s.moneda) : '') + '</option>';
    }).join('');
  }
  function formAsignar(fila) {
    if (fila < 0) return toast('Se está guardando en Google; en unos segundos lo podés asignar.');
    var m = movPorFila(fila); if (!m) return;
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0];
    if (!p) return toast('Este movimiento ya está asignado.');
    var primero = sobreTarjetas() || ((SB().lista.filter(function (s) { return s.moneda === m.moneda; })[0] || {}).nombre) || '';
    asig = { fila: fila, falta: p.falta, sentido: p.sentido, moneda: m.moneda, modo: 'sobre', tarjeta: !!p.tarjeta, reservado: p.reservadoUsado || 0, filas: [{ sobre: primero, monto: p.falta }] };
    var h = '<div class="suave chico">' + esc(m.tipo) + ' · ' + fechaCorta(m.fecha) + (m.cuenta ? ' · ' + esc(etiquetaCuenta(m.cuenta)) : '') + '</div>' +
      '<h2>' + esc(m.comercio || m.tipo) + '</h2><div class="grande ' + (p.sentido === 'entra' ? 'verde' : 'rojo') + '" style="font-size:28px;font-weight:800">' + (p.sentido === 'entra' ? '+' : '−') + din(p.falta, m.moneda) + '</div>' +
      (m.nota ? '<div class="suave chico">' + esc(m.nota) + '</div>' : '') + bannerCobro(m) + '<div id="as-cuerpo"></div>';
    abrir(h);
    pintarAsignar();
  }
  function pintarAsignar() {
    var m = movPorFila(asig.fila), h = '';
    var radio = function (val, txtOp, extra) {
      return '<label class="op' + (asig.modo === val ? ' on' : '') + '"><input type="radio" name="as-modo" value="' + val + '"' + (asig.modo === val ? ' checked' : '') + ' onchange="App.asigModo(\'' + val + '\')">' + txtOp + (extra || '') + '</label>';
    };
    if (m.tipo === 'Pago de tarjeta') {
      var suma = asig.filas.reduce(function (a, f) { return a + (C.leerNumero(f.monto) || 0); }, 0);
      h += '<div class="suave chico fuerte" style="margin-top:10px">¿DE QUÉ SOBRES SALIÓ?</div>' +
        (sobreTarjetas() ? '<div class="chips" style="margin:6px 0"><button class="chip" onclick="App.asigTodo()">Todo de ' + esc(sobreTarjetas()) + '</button></div>' : '') +
        asig.filas.map(function (f, i) {
          return '<div class="fila-sobre"><select onchange="App.asigFila(' + i + ',\'sobre\',this.value)">' + opcionesSobre(m.moneda, f.sobre, true) + '</select>' +
            '<input data-dinero inputmode="decimal" value="' + esc(String(f.monto).replace('.', ',')) + '" oninput="App.asigFila(' + i + ',\'monto\',this.value)">' +
            (asig.filas.length > 1 ? '<button class="x" aria-label="Quitar" onclick="App.asigQuitar(' + i + ')">×</button>' : '') + '</div>';
        }).join('') +
        '<button class="btn sec chico" style="justify-content:center;margin-top:6px" onclick="App.asigAgregar()">+ Otro sobre</button>' +
        (asig.reservado ? '<div class="fila chico" style="margin-top:8px"><span class="suave">Ya cubierto con compras reservadas</span><b class="verde">' + txt(asig.reservado, m.moneda) + ' ✓</b></div>' : '') +
        '<div class="fila" style="margin-top:8px"><span class="suave">Falta asignar</span><b id="as-falta" style="color:' + (Math.abs(asig.falta - suma) < 0.01 ? 'var(--positivo)' : 'var(--acento)') + '">' + txt(asig.falta - suma, m.moneda) + (Math.abs(asig.falta - suma) < 0.01 ? ' ✓' : '') + '</b></div>';
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
        radio('ninguno', '<span><b>💳 Mía, sin sobre</b><br><span class="suave chico">Cuenta como gasto tuyo, pero no toca ningún sobre' + (asig.tarjeta ? '; se decide al pagar la tarjeta' : '') + '</span></span>') +
        radio('otro', '<span><b>🤝 Para otra persona</b><br><span class="suave chico">No es gasto tuyo ni toca sobres. Queda en «Me deben»</span></span>',
          asig.modo === 'otro' ? '<div class="campos-op" onclick="event.stopPropagation()"><label class="campo compacto"><span>¿Quién te la debe?</span><input id="as-para" list="as-personas" placeholder="Ej. Mamá" autocomplete="off"></label>' +
            '<datalist id="as-personas">' + personas.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
            '<label class="campo compacto"><span>Nota (opcional)</span><input id="as-nota" placeholder="Ej. Regalo de cumpleaños"></label></div>' : '');
    }
    if (m.tipo !== 'Pago de tarjeta' && asig.modo !== 'repartir' && asig.modo !== 'otro') {
      h += '<label class="campo compacto"><span>Monto</span><input id="as-monto" data-dinero inputmode="decimal" value="' + esc(String(Math.round(asig.falta * 100) / 100).replace('.', ',')) + '"></label>';
      if ((asig.modo === 'sobre' || asig.sentido === 'sale') && m.comercio) h += '<label class="check"><input type="checkbox" id="as-recordar"> Recordar para «' + esc(m.comercio) + '»</label>';
    }
    h += '<div class="acciones"><button class="btn" id="as-ok" onclick="App.guardarAsignar()">' + (asig.modo === 'repartir' ? 'Ir a repartir' : 'Asignar') + '</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>';
    $('as-cuerpo').innerHTML = h;
    formatearMontos();
  }
  function asigModo(v) { asig.modo = v; pintarAsignar(); }
  function asigTodo() { asig.filas = [{ sobre: sobreTarjetas(), monto: asig.falta }]; pintarAsignar(); }
  function asigFila(i, k, v) { asig.filas[i][k] = v; if (k === 'sobre') return; var m = movPorFila(asig.fila); var suma = asig.filas.reduce(function (a, f) { return a + (C.leerNumero(f.monto) || 0); }, 0); var e = $('as-falta'); if (e) { var ok = Math.abs(asig.falta - suma) < 0.01; e.textContent = txt(asig.falta - suma, m.moneda) + (ok ? ' ✓' : ''); e.style.color = ok ? 'var(--positivo)' : 'var(--acento)'; } }
  function asigAgregar() {
    var suma = asig.filas.reduce(function (a, f) { return a + (C.leerNumero(f.monto) || 0); }, 0);
    var m = movPorFila(asig.fila), otro = SB().lista.filter(function (s) { return s.moneda === m.moneda && !asig.filas.some(function (f) { return f.sobre === s.nombre; }); })[0];
    asig.filas.push({ sobre: otro ? otro.nombre : asig.filas[0].sobre, monto: Math.max(0, Math.round((asig.falta - suma) * 100) / 100) });
    pintarAsignar();
  }
  function asigQuitar(i) { asig.filas.splice(i, 1); pintarAsignar(); }
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
    if (m.tipo === 'Pago de tarjeta') {
      var suma = 0;
      asig.filas.forEach(function (f) { var v = C.leerNumero(f.monto) || 0; if (v > 0) { suma += v; filas.push({ sobre: f.sobre, monto: -v }); } });
      if (!filas.length) return toast('Escribí cuánto salió de cada sobre.');
      if (suma > asig.falta + 0.01) return toast('Asignaste más que el pago (' + txt(asig.falta, m.moneda) + ').');
      var dup = {}; if (asig.filas.some(function (f) { if (dup[f.sobre]) return true; dup[f.sobre] = 1; return false; })) return toast('Hay un sobre repetido.');
    } else {
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
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Tu reparto de siempre</span><b>' + din(rep.siempre, mon) + '</b></div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Diferencia' + (rep.ajuste ? ' → ' + esc(rep.ajuste) : '') + '</span><b style="color:var(--acento)">' + (dif >= 0 ? '+' : '−') + din(Math.abs(dif), mon) + '</b></div></div>';
    h += '<label class="campo compacto" style="margin-top:0"><span>Sobre de ajuste (recibe o cubre la diferencia)</span><select onchange="App.repAjuste(this.value)"><option value="">— Ninguno —</option>' +
      rep.filas.map(function (f) { return '<option' + (f.nombre === rep.ajuste ? ' selected' : '') + '>' + esc(f.nombre) + '</option>'; }).join('') + '</select></label>';
    h += '<div class="caja" style="gap:0">' + rep.filas.map(function (f, i) {
      var aj = f.nombre === rep.ajuste;
      return '<div class="fila-rep' + (aj ? ' aj' : '') + '"><span>' + esc(f.nombre) + (aj ? ' <span class="pill" style="font-size:10px;padding:2px 6px">AJUSTE</span>' : '') + '</span>' +
        '<input data-dinero inputmode="decimal" value="' + esc(String(f.monto).replace('.', ',')) + '"' + (aj ? ' readonly' : ' oninput="App.repCambio(' + i + ',this.value)"') + '></div>';
    }).join('') + '</div>';
    var falta = rep.monto - repSuma();
    h += '<div class="fila"><span class="suave">Por repartir</span><b id="rep-falta" style="color:' + (Math.abs(falta) < 0.01 ? 'var(--positivo)' : 'var(--acento)') + '">' + txt(falta, mon) + (Math.abs(falta) < 0.01 ? ' ✓' : '') + '</b></div>' +
      '<label class="check"><input type="checkbox" id="rep-guardar"' + (rep.guardar ? ' checked' : '') + ' onchange="App.repGuardarCheck(this.checked)"> Guardar estos montos como mi reparto de siempre</label>' +
      '<button class="btn" id="rep-ok" onclick="App.guardarRepartoMov()">Repartir</button>';
    $('p-reparto').innerHTML = h;
  }
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
      return '<label class="fila-rep"><span><input type="checkbox"' + (on ? ' checked' : '') + ' onchange="App.limpiarSel(\'' + esc(s.nombre).replace(/'/g, '\\\'') + '\',this.checked)" style="width:20px;height:20px;accent-color:var(--relleno);vertical-align:middle;margin-right:8px">' + esc(s.nombre) +
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
  function formSobre(i) {
    if (i === undefined) {
      return abrir('<h2>Nuevo sobre</h2><label class="campo"><span>Nombre</span><input id="s-nombre" placeholder="Ej. Mascotas"></label>' +
        '<div class="dos"><label class="campo"><span>Moneda</span><select id="s-moneda"><option value="CRC">Colones ₡</option><option value="USD">Dólares $</option></select></label>' +
        '<label class="campo"><span>Tipo</span><select id="s-tipo"><option>Variable</option><option>Fijo</option><option>Ahorro</option></select></label></div>' +
        '<label class="campo"><span>Reparto de siempre (por mes)</span><input id="s-monto" data-dinero inputmode="decimal" placeholder="0"></label>' +
        '<label class="campo"><span>Saldo inicial (lo que tiene hoy)</span><input id="s-saldo" data-dinero inputmode="decimal" placeholder="0"></label>' +
        '<div class="acciones"><button class="btn" id="s-ok" onclick="App.guardarSob()">Crear sobre</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    }
    var s = SB().lista[i];
    var movs = s.movs.slice().sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    var r = function (n) { return n === null || n === undefined ? '' : String(n).replace('.', ','); };
    abrir('<h2>' + esc(s.nombre) + '</h2><div class="fila"><span class="suave">Saldo</span><b style="font-size:22px">' + din(s.saldo, s.moneda) + '</b></div>' +
      (movs.length ? '<div class="caja sinpad" style="margin-top:8px">' + movs.slice(0, 8).map(function (e) {
        return '<div class="item" style="cursor:default;padding:10px 14px"><span class="cuerpo"><span class="nombre" style="display:block;font-size:14px">' + esc(e.tipo || '') + (e.nota ? ' · ' + esc(e.nota) : '') + '</span><span class="det" style="display:block">' + fechaCorta(e.fecha) + '</span></span>' +
          '<span class="monto"><b class="' + (e.monto >= 0 ? 'verde' : '') + '">' + (e.monto >= 0 ? '+' : '−') + din(Math.abs(e.monto), s.moneda) + '</b></span></div>';
      }).join('') + '</div>' : '<div class="suave chico">Sin movimientos en ' + nombreMes(mes).toLowerCase() + '.</div>') +
      (s.asignadoAuto ? '' : '<label class="campo"><span>Reparto de siempre (por mes)</span><input id="s-monto" data-dinero inputmode="decimal" value="' + r(s.asignado) + '"></label>') +
      '<div class="dos-campos"><label class="campo compacto"><span>Saldo inicial</span><input id="s-saldo" data-dinero inputmode="decimal" value="' + r(s.saldoInicial) + '"></label>' +
      '<label class="campo compacto"><span>Meta (opcional)</span><input id="s-meta" data-dinero inputmode="decimal" value="' + r(s.meta) + '"></label></div>' +
      '<label class="campo compacto"><span>Tipo</span><select id="s-tipo">' + ['Variable', 'Fijo', 'Ahorro'].map(function (t) { return '<option' + (s.tipo === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
      '<div class="acciones"><button class="btn" id="s-ok" onclick="App.guardarSob(' + s.fila + ',' + (s.asignadoAuto ? s.asignado : 'null') + ')">Guardar</button>' +
      '<button class="btn sec" onclick="App.formMover(\'' + esc(s.nombre).replace(/'/g, '\\\'') + '\')">Mover desde este sobre</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
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
    if (filas.length) h += filas.map(function (x) { return '<div class="fila chico"><span>' + esc(x.sobre || 'Sin sobre') + '</span><span>' + (x.monto >= 0 ? '+' : '−') + esc(txt(Math.abs(x.monto), m.moneda)) + '</span></div>'; }).join('');
    else if (m.sobre && !pend) h += '<div class="fila chico"><span>' + esc(m.sobre) + ' (por regla)</span><span>' + esc(txt(m.monto, m.moneda)) + '</span></div>';
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
      (interesesTot ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Intereses (últimos ajustes)</span><b class="verde">+' + din(interesesTot, 'CRC') + '</b></div>' : '') +
      (sobreF ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Sobre Fondos (sin invertir)</span><b style="color:var(--acento)">' + din(sobreF.saldo, 'CRC') + '</b></div>' : '') + '</div>';
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
  var ICON_CAT = { Transporte: '✈️', Comida: '🍽️', Hospedaje: '🏨', Tours: '🎟️', Compras: '🛍️', Otros: '•' };
  var COLOR_CAT = { Transporte: '#3D8BFD', Comida: '#3DD68C', Hospedaje: '#FF8A3D', Tours: '#B57BFF', Compras: '#F5B82E', Otros: '#9AA1AB' };
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
  function pViaje() {
    var v = viajePorFila(viajeSel);
    if (!v) { pantalla = 'viajes'; return pintar(); }
    var r = C.viaje(D, v, hoy), mon = r.moneda;
    var h = '<div class="cab"><div class="atras-cab">' + botonAtras('App.ir(\'viajes\')') + '<div><div class="sobretitulo">' + fechaCorta(v.desde) + ' al ' + fechaCorta(v.hasta) + ' · ' + r.estado + '</div><h1 class="titulo">' + esc(v.nombre) + '</h1></div></div>' +
      '<button class="btn-icono" aria-label="Editar viaje" onclick="App.formViaje(' + v.fila + ')">' + ico('lapiz') + '</button></div>';
    h += '<div class="chips">' + v.tarjetas.map(function (t) { return '<span class="chip" style="cursor:default">' + (t === 'Efectivo' ? '💵 Efectivo' : '💳 ' + esc(etiquetaCuenta(t))) + '</span>'; }).join('') + '</div>';
    h += '<div class="hero"><div class="fila" style="align-items:flex-end"><div><div class="et" style="font-size:13px;font-weight:600">Disponible</div><div class="grande" style="color:' + (r.disponible < 0 ? 'var(--rojo)' : 'var(--positivo)') + '">' + din(r.disponible, mon) + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:26px;font-weight:800">' + Math.round(r.pct * 100) + '%</div><a href="#" onclick="App.formLimiteViaje(' + v.fila + ');return false" class="et" style="font-size:12px;text-decoration:none;color:inherit">de ' + din(r.limite, mon) + ' <b style="color:var(--acento)">✎ cambiar</b></a></div></div>' +
      barra(r.pct, r.pct >= 0.8) +
      (r.estado === 'En curso' ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Quedan ' + r.diasRestantes + ' día' + (r.diasRestantes === 1 ? '' : 's') + '</span><b>Podés gastar ' + din(r.porDia, mon) + '/día</b></div>' : '') +
      (r.promedio ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Promedio por día</span><span>' + din(r.promedio, mon) + '</span></div>' : '');
    if (v.subcuenta && D.fondos) {
      var fo = FD().lista.filter(function (x) { return x.nombre === v.subcuenta; })[0];
      if (fo) h += '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Fondo ligado: ' + esc(fo.nombre) + '</span><span>' + din(fo.saldo, fo.moneda) + '</span></div>';
    }
    h += '</div>';
    if (r.pct >= 0.8) h += '<div class="aviso" style="padding:12px 14px;border-radius:14px;font-size:14px">' + (r.pct >= 1 ? '⚠️ Llegaste al límite del presupuesto.' : '🔔 Ya usaste más del 80 % del presupuesto.') + '</div>';
    var cats = C.CATS_VIAJE.filter(function (c) { return r.porCategoria[c] > 0; });
    if (cats.length) h += '<div class="caja" style="gap:6px"><h3>Por categoría</h3>' + cats.map(function (c) {
      return '<div class="fila chico"><span>' + ICON_CAT[c] + ' ' + c + '</span><b>' + din(r.porCategoria[c], mon) + '</b></div>' +
        '<div class="barra"><i style="width:' + (r.gastado ? r.porCategoria[c] / r.gastado * 100 : 0).toFixed(1) + '%;background:' + COLOR_CAT[c] + '"></i></div>';
    }).join('') + '</div>';
    h += '<div class="caja sinpad"><div class="fila" style="padding:14px 16px 4px"><h3>Compras (' + r.compras.length + ')</h3></div>' +
      (r.compras.length ? r.compras.map(function (c) {
        var m = c.mov;
        return '<button class="item" onclick="App.formCompraViaje(' + m.fila + ')"><span class="ico" style="background:transparent;font-size:18px">' + ICON_CAT[c.categoria] + '</span>' +
          '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(m.comercio || 'Compra') + '</span><span class="det" style="display:block">' + esc(fechaCorta(m.fecha) + ' · ' + c.categoria + (m.moneda !== mon ? ' · ' + txt(m.monto, m.moneda) : '')) + '</span></span>' +
          '<span class="monto"><b style="display:block">' + din(c.monto, mon) + '</b></span></button>';
      }).join('') : '<div class="suave" style="padding:4px 16px 14px">Todavía no hay compras en estas fechas.</div>') + '</div>';
    h += '<button class="btn sec" onclick="App.formAgregarViaje(' + v.fila + ')">＋ Agregar una compra de otra cuenta</button>';
    h += '<div class="suave chico" style="text-align:center">Las compras de las tarjetas elegidas en estas fechas entran solas. Te avisamos al 80 % y al 100 % en la app y por correo.</div>';
    $('p-viaje').innerHTML = h;
  }
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
      '<div class="suave chico fuerte" style="margin-top:12px">TARJETAS O CUENTAS DEL VIAJE</div>' +
      tarjetas.map(function (t) { return '<label class="check" style="margin-top:8px"><input type="checkbox" class="vj-t" value="' + esc(t) + '"' + (sel.indexOf(t) >= 0 ? ' checked' : '') + '> ' + esc(t === 'Efectivo' ? 'Efectivo (gastos sin cuenta)' : etiquetaCuenta(t)) + '</label>'; }).join('') +
      (D.fondos && D.fondos.length ? '<label class="campo compacto"><span>Ligado a un fondo (opcional)</span><select id="vj-sub"><option value="">— Ninguno —</option>' + opcionesSubcuenta(v ? v.subcuenta : '') + '</select></label>' : '') +
      (v ? '<label class="check"><input type="checkbox" id="vj-activo"' + (v.activo ? ' checked' : '') + '> Activo (avisos y tarjeta en Inicio)</label>' : '') +
      '<div class="acciones"><button class="btn" id="vj-ok" onclick="App.guardarViaje(' + (fila || 0) + ')">Guardar</button>' +
      (v ? '<button class="btn peligro" id="vj-borrar" onclick="App.borrarViaje(' + fila + ')">Eliminar presupuesto</button>' : '') +
      '<button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarViaje(fila) {
    var v0 = fila ? viajePorFila(fila) : null;
    var v = { fila: fila || null, nombre: val('vj-nombre').trim(), desde: desdeInput(val('vj-desde')), hasta: desdeInput(val('vj-hasta')), limite: C.leerNumero(val('vj-limite')),
      moneda: val('vj-moneda'), tarjetas: Array.prototype.slice.call(document.querySelectorAll('.vj-t:checked')).map(function (e) { return e.value; }),
      subcuenta: $('vj-sub') ? val('vj-sub') : '', activo: $('vj-activo') ? $('vj-activo').checked : true };
    if (!v.nombre) return toast('Falta el nombre.');
    if (!v.limite || v.limite <= 0) return toast('Escribí el límite.');
    if (!v.desde || !v.hasta) return toast('Elegí las fechas.');
    if (!v.tarjetas.length) return toast('Elegí al menos una tarjeta o cuenta.');
    if (v0 && v.limite > v0.limite) v.reiniciarAvisos = true;
    srv('guardarViaje', [v], function (f) { if (!fila) viajeSel = f; listo('✅ Presupuesto guardado'); if (!fila) setTimeout(function () { ir('viaje'); }, 0); }, $('vj-ok'));
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
      C.CATS_VIAJE.map(function (c) { return '<button class="chip' + (c === cat ? ' on' : '') + '" onclick="App.marcarViaje(' + fila + ',\'' + (String(m.viaje || '').charAt(0) === '+' ? '+' : '') + c + '\',this)">' + ICON_CAT[c] + ' ' + c + '</button>'; }).join('') + '</div>' +
      '<div class="acciones"><button class="btn peligro" onclick="App.marcarViaje(' + fila + ',\'Fuera\',this)">Sacar del viaje</button><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }
  function marcarViaje(fila, valor, boton) {
    var m = movPorFila(fila);
    encolar('marcarMovimiento', [fila, 'Viaje', valor, { monto: m.monto }], 'Viaje: ' + (m.comercio || 'compra') + ' · ' + (valor === 'Fuera' ? 'fuera' : valor.replace('+', '')));
    hecho(valor === 'Fuera' ? 'Compra sacada del viaje' : '✅ ' + valor.replace('+', '') + (valor.charAt(0) === '+' ? ' · agregada al viaje' : ''));
  }
  function formAgregarViaje(fila) {
    var v = viajePorFila(fila);
    var ini = new Date(v.desde), fin = new Date(new Date(v.hasta).getTime() + 86400000);
    var cand = D.movimientos.filter(function (m) {
      var f = new Date(m.fecha);
      return (m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero') && f >= ini && f < fin && !C.enViaje(v, m);
    }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    abrir('<h2>Agregar al viaje</h2><div class="suave">Compras de esas fechas que no están en el viaje. Tocá una para sumarla.</div>' +
      (cand.length ? '<div class="caja sinpad" style="margin-top:10px">' + cand.slice(0, 40).map(function (m) {
        return '<button class="item" onclick="App.marcarViaje(' + m.fila + ',\'+' + C.categoriaViaje(m) + '\',this)"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(m.comercio || 'Compra') + '</span>' +
          '<span class="det" style="display:block">' + esc(fechaCorta(m.fecha) + ' · ' + (etiquetaCuenta(m.cuenta) || 'sin cuenta')) + '</span></span><span class="monto"><b>' + din(m.monto, m.moneda) + '</b></span></button>';
      }).join('') + '</div>' : '<div class="caja vacio" style="margin-top:10px">No hay otras compras en esas fechas.</div>') +
      '<div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
  }

  function formSobresEspeciales() {
    var esp = D.sobreEspecial || {};
    var sel = function (id, actual) {
      return '<select id="' + id + '"><option value="">— Ninguno —</option>' + D.sobres.map(function (s) { return '<option' + (s.nombre === actual ? ' selected' : '') + '>' + esc(s.nombre) + '</option>'; }).join('') + '</select>';
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
        return '<span>' + d.getDate() + ' ' + MESES_C[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) + (x.anticipo > 0 ? '<br><span class="suave chico">' + x.anticipo + ' días antes</span>' : '') + '</span>' +
          '<span class="d">' + din(Math.round(x.intereses), 'CRC') + '</span><span class="d">' + din(Math.round(x.principal), 'CRC') + '</span>' +
          '<span class="d fuerte"><span class="m">₡' + ((x.saldo || 0) / 1e6).toFixed(2).replace('.', ',') + ' M</span></span>';
      }).join('') + '</div>' +
      (hist.length > 6 ? '<button class="btn sec chico" style="justify-content:center" onclick="App.historial()">' + (verTodoHistorial ? 'Ver menos' : 'Ver todo el historial') + '</button>' : ''));
    h += '<div class="suave chico" style="text-align:center">Intereses pagados en total: ' + din(p.interesesTotal, 'CRC') + '</div>';
    $('p-prestamo').innerHTML = h;
  }

  // ------------------------------------------------------------ PANELES (formularios)
  function abrir(html) { $('panel').innerHTML = '<div class="asa"></div>' + html; $('velo').classList.add('abierto'); formatearMontos(); }
  function cerrar() { $('velo').classList.remove('abierto'); }
  function val(id) { var e = $(id); return e ? e.value : ''; }
  function listo(msg) {
    cerrar(); toast(msg);
    if (D) { guardarCache(JSON.stringify(D)); pintar(); }   // 1.8.1: la copia del teléfono queda al día en el mismo instante
    cargar();
  }   // se ve al instante; la recarga confirma por detrás
  function local(lista) { D.sobresMov = (D.sobresMov || []).concat(lista.map(function (x) { return Object.assign({ fila: 0 }, x); })); guardarCache(JSON.stringify(D)); }

  function formMovimiento(fila, pre) {
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
      (fila ? bloqueSobresDeMov(m) : '') +
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

  function formCuenta(fila) {
    var c = fila ? D.cuentas.filter(function (x) { return x.fila === fila; })[0] : { tipo: 'Tarjeta de crédito', moneda: 'CRC', activa: true };
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
      '<div class="acciones"><button class="btn" id="c-ok" onclick="App.guardarCta(' + (fila || 0) + ')">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarCta(fila) {
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
    srv('guardarCuenta', [c], function () { listo('✅ Cuenta guardada'); }, $('c-ok'));
  }

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
  function grupo(id, icono, color, nombre, resumen, cuerpo) {
    return '<details class="grupo-aj" data-g="' + id + '"' + (grupoAj[id] ? ' open' : '') + ' ontoggle="App.grupoAj(\'' + id + '\',this.open)"><summary><span class="ico-cat" style="width:36px;height:36px;font-size:16px;background:color-mix(in srgb, ' + color + ' 18%, transparent)">' + icono + '</span>' +
      '<span class="cuerpo"><span class="nombre">' + nombre + '</span><span class="det">' + resumen + '</span></span><span class="flecha">›</span></summary><div class="grupo-c">' + cuerpo + '</div></details>';
  }
  function estadoApp() {
    var ult = AJ.ultimaRevision ? new Date(Number(AJ.ultimaRevision) + 10 * 60000) : null;
    var horas = ult ? (Date.now() - ult.getTime()) / 3600000 : null;
    var problemas = [];
    if (cola.length && ultimoErrorCola) problemas.push(['amarillo', cola.length + ' cambio' + (cola.length === 1 ? '' : 's') + ' sin enviar: ' + ultimoErrorCola]);
    if (horas === null || horas > 48) problemas.push(['amarillo', 'Los correos no se revisan solos hace rato. Revisá que el servidor tenga el activador cada 10 minutos.']);
    if (String(AJ.version || '0') < '2.2') problemas.push(['amarillo', 'El servidor tiene una versión vieja (' + esc(AJ.version) + '). Pegá el Codigo.gs nuevo.']);
    var pill = problemas.length ? '<span class="pill alerta">● Revisar</span>' : '<span class="pill ok">● Todo bien</span>';
    var fila = function (a, b, accion) { return '<' + (accion ? 'button onclick="' + accion + '"' : 'div') + ' class="est-fila"><span class="suave">' + a + '</span><b>' + b + '</b></' + (accion ? 'button' : 'div') + '>'; };
    return '<div class="caja estado"><div class="fila"><h3>Estado de la app</h3>' + pill + '</div>' +
      fila('Cambios por enviar', cola.length ? cola.length + ' ›' : '0 ✓', 'App.formCola()') +
      fila('Correos revisados', (ult ? (horas < 1 ? 'hace ' + Math.max(1, Math.round(horas * 60)) + ' min' : horas < 48 ? 'hace ' + Math.round(horas) + ' h' : fechaCorta(ult.toISOString())) : 'todavía no') + ' ↻', 'App.revisarCorreos()') +
      fila('Servidor', esc(AJ.version) + (String(AJ.version || '0') < '2.2' ? ' ⚠' : ' ✓')) +
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
    h += grupo('ap', '🎨', '#F5B82E', 'Apariencia', esc(tema === 'auto' ? 'Automático (' + nomTema(resuelto) + ')' : nomTema(tema)) + ' · letra ' + { normal: 'normal', grande: 'grande', xg: 'más grande' }[letra],
      opcion('luna', 'Tema', 'Cambia los colores de toda la app', '') + temasHtml +
      opcion('lapiz', 'Tamaño de letra', 'Para leer sin forzar la vista', '') +
      '<div class="chips" style="padding:0 16px 14px">' + [['normal', 'Normal'], ['grande', 'Grande'], ['xg', 'Más grande']].map(function (l) {
        return '<button class="chip' + (letra === l[0] ? ' on' : '') + '" onclick="App.letra(\'' + l[0] + '\')">' + l[1] + '</button>';
      }).join('') + '</div>' +
      opcion('inicio', 'Tu inicio', 'Qué widgets ver en Inicio y en qué orden', '<span class="flecha">›</span>', 'App.formInicio()') +
      opcion('cuadros', 'Accesos rápidos', 'Los íconos de la fila de Inicio', '<span class="flecha">›</span>', 'App.formAccesos()') +
      opcion('ojo', 'Ocultar montos', 'Muestra ****** en vez de las cantidades', interruptor('aj-priv', privado, 'App.privado(this.checked)', 'Ocultar montos')));

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
    var ult = AJ.ultimaRevision ? new Date(Number(AJ.ultimaRevision) + 10 * 60000) : null;
    h += grupo('co', '📧', '#5B8DEF', 'Correos de los bancos', esc(AJ.bancos.join(', ') || 'Ninguno') + ' + SINPE',
      opcion('recargar', 'Revisar correos ahora', ult ? 'Última revisión: ' + fechaCorta(ult.toISOString()) + ' ' + hora(ult.toISOString()) : 'Todavía no se ha revisado', '', 'App.revisarCorreos(this)') +
      opcion('sobre', 'Bancos que se leen', esc(AJ.bancos.join(', ') || 'Ninguno') + ' + SINPE Móvil BCR + recibos del préstamo', '') +
      '<div class="suave chico" style="padding:0 16px 14px">Para agregar un banco, escribí su correo en la pestaña <b>Config</b> de la hoja.</div>');
    h += grupo('re', '🔔', '#FF8A3D', 'Recordatorios', AJ.recordatorios ? 'Activados' : 'Desactivados',
      opcion('campana', 'Recordatorios por correo', 'Pagos de tarjeta (3 días antes), cuota del préstamo, TBP del día 7 y gastos sin categoría', interruptor('aj-rec', AJ.recordatorios, 'App.recordatorios(this.checked)', 'Recordatorios por correo')) +
      opcion('correo', 'Enviar uno de prueba', 'Llega a ' + esc(AJ.correo), '', 'App.pruebaRecordatorio(this)'));
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
    llamar('verificarPIN', [pinEscrito]).then(function (tok) {
      verificando = false;
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
      '<label class="campo"><span>URL del servidor (termina en /exec)</span><input id="cx-url" type="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec" value="' + esc(c.url) + '"></label>' +
      '<label class="campo"><span>Clave de la app</span><input id="cx-clave" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="La que muestra verClaveApp" value="' + esc(c.clave) + '"></label>' +
      '<div class="suave chico" id="cx-msg" style="margin-top:10px;min-height:18px">' + esc(msg || '') + '</div>' +
      '<div class="acciones"><button class="btn" id="cx-ok" onclick="App.conectar()">Conectar</button></div></div>';
    $('conexion').classList.add('ver');
  }
  function conectar() {
    var c = { url: val('cx-url').trim(), clave: val('cx-clave').trim() };
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
  function cambiarConexion() { mostrarConexion(''); }

  // ------------------------------------------------------------ arranque
  function arrancar() {
    // 1) al instante: lo guardado en el teléfono (si hay PIN, primero se pide)
    var cache = leerCache(), pinCache = guardado('mf-pinactivo', 'no') === 'si';
    var mostrado = false;
    if (pinCache && !token) { pinActivo = true; bloquear(); }
    else if (cache) { D = cache; hoy = new Date(); $('cargando').style.display = 'none'; pintar(); mostrado = true; sincronizando(true); }
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

  return {
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
    vistaTC: setVistaTC, formSaldoTarjeta: formSaldoTarjeta, guardarSaldoTarjeta: guardarSaldoTarjeta, cobrar: cobrar, noCobro: noCobro, formDeuda: formDeuda, deudaPagada: deudaPagada, deudaEraMia: deudaEraMia, limpiarCalc: function () { limpiarCalc(); calcVista = 'datos'; window.scrollTo(0, 0); pintar(); toast('Calculadora limpia'); }, claseCalc: claseCalc, alEscribirTasa: alEscribirTasa, buscarAjuste: buscarAjuste, pleg: function (id, abierto) { plegAbierto[id] = abierto; }, grupoAj: function (id, abierto) { grupoAj[id] = abierto; },
    alternarBuscar: alternarBuscar, formFiltros: formFiltros, aplicarFiltros: aplicarFiltros, limpiarFiltros: limpiarFiltros, verComprasDe: verComprasDe, alternarTarjeta: alternarTarjeta, recordatorios: setRecordatorios, pruebaRecordatorio: pruebaRecordatorio,
    formPIN: formPIN, guardarPIN: guardarPIN, tecla: tecla,
    usarHuella: usarHuella, alternarHuella: alternarHuella, activarHuella: activarHuella,
    recargar: function () { cargar(function () { toast('Datos actualizados'); }); },
    conectar: conectar, cambiarConexion: cambiarConexion,
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
    guardarLimpiar: guardarLimpiar, deshacerSobres: deshacerSobres, formSobresDesde: formSobresDesde, guardarSobresDesde: guardarSobresDesde, formSobresEspeciales: formSobresEspeciales, guardarSobresEspeciales: guardarSobresEspeciales,
    formCola: formCola, reintentarCola: function () { ultimoErrorCola = ''; toast('Enviando…'); enviarCola(); setTimeout(actualizarBadges, 300); },
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
