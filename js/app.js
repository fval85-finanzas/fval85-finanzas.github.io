var App = (function () {
  'use strict';
  var D = null;                       // datos de la hoja
  var hoy = new Date();
  var mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  var pantalla = 'inicio';
  var filtro = { q: '', chip: 'todos' };
  var verTodoHistorial = false;
  var C = Calc;
  var token = guardado('mf-ses', null, sessionStorage);
  var pinActivo = false;
  var pinLargo = Number(guardado('mf-pinlen', '0')) || null;   // cuántos números tiene el PIN
  var AJ = null;                      // ajustes del servidor
  var ocultoDesde = null;
  var MINUTOS_BLOQUEO = 5;
  var VERSION_WEB = '1.7.0';

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

  function llamar(accion, args, conex) {
    var c = conex || conexion();
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 60000);
    return fetch(c.url, {
      method: 'POST', redirect: 'follow', signal: ctl ? ctl.signal : undefined,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave: c.clave, sesion: token, accion: accion, args: args || [] })
    }).then(function (r) { return r.text(); }, function (e) {
      clearTimeout(t);
      throw new Error(e && e.name === 'AbortError' ? 'Google tardó demasiado en responder. Intentá de nuevo.' : 'Sin conexión con Google. Revisá tu internet y la URL /exec.');
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
  function leerCache() { try { var t = localStorage.getItem('mf-cache'); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
  function guardarCache(json) { try { localStorage.setItem('mf-cache', json); } catch (e) { /* sin espacio: no pasa nada */ } }
  var pintarPendiente = false;
  function sincronizando(on) { document.body.classList.toggle('sinc', !!on); }
  function escribiendo() { var e = document.activeElement; return e && /INPUT|SELECT|TEXTAREA/.test(e.tagName) && !$('panel').contains(e); }
  function cargar(cb) {
    sincronizando(true);
    srv('obtenerDatos', [], function (json) {
      D = JSON.parse(json);
      hoy = new Date(D.hoy);
      guardarCache(json);
      sincronizando(false);
      $('cargando').style.display = 'none';
      if (escribiendo()) pintarPendiente = true; else pintar();   // no borrar lo que la persona está escribiendo
      if (cb) cb();
    }, null, function () { sincronizando(false); });
  }

  // ------------------------------------------------------------ navegación
  var PRINCIPALES = ['inicio', 'movimientos', 'tarjetas', 'mas'];
  var NAV = [['inicio', 'Inicio', 'inicio'], ['movimientos', 'Movimientos', 'lista'], null, ['tarjetas', 'Tarjetas', 'tarjeta'], ['mas', 'Más', 'cuadros']];
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
    if (p === 'calculadora') calcVista = 'datos';
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
      '<button class="btn-icono" aria-label="Mes siguiente" onclick="App.cambiarMes(1)">' + ico('adelante') + '</button></div></div>';
  }
  function cabSimple(titulo, sub, accion) {
    return '<div class="cab"><div class="atras-cab">' + botonAtras(accion) + '<div>' + (sub ? '<div class="sobretitulo">' + sub + '</div>' : '') + '<h1 class="titulo">' + titulo + '</h1></div></div></div>';
  }

  function pintar() {
    if (!D) return;
    var res = C.resumenMes(D, mes);
    var sob = C.sobres(D, mes, res);
    var activa = PRINCIPALES.indexOf(pantalla) >= 0 ? pantalla : (pantalla === 'ajustes' ? '' : 'mas');
    $('tabs').innerHTML = NAV.map(function (t) {
      if (!t) return '<div class="centro"><button class="nav-mas" aria-label="Agregar movimiento" onclick="App.formMovimiento()">' + ico('mas') + '</button></div>';
      return '<button class="' + (t[0] === activa ? 'on' : '') + '" onclick="App.ir(\'' + t[0] + '\')"' + (t[0] === activa ? ' aria-current="page"' : '') + '>' + ico(t[2]) + t[1] + '</button>';
    }).join('');
    document.querySelectorAll('.pantalla').forEach(function (s) { s.classList.toggle('activa', s.id === 'p-' + pantalla); });
    ({
      inicio: pInicio, movimientos: pMovimientos, tarjetas: pTarjetas, sobres: pSobres, prestamo: pPrestamo, ajustes: pAjustes,
      mas: pMas, calculadora: pCalc, tasacero: pTasaCero, tcdetalle: pTCDetalle, porasignar: pPorAsignar, reparto: pReparto, limpiar: pLimpiar, fondos: pFondos, viajes: pViajes, viaje: pViaje, reportes: pReportes, patrimonio: pPatrimonio
    })[pantalla](res, sob);
    formatearMontos();
  }

  // ------------------------------------------------------------ INICIO
  function oculto() { return guardado('mf-privado', 'no') === 'si'; }
  function botonOjo() {
    var o = oculto();
    return '<button class="ojo" aria-label="' + (o ? 'Mostrar montos' : 'Ocultar montos') + '" onclick="App.privado(' + (!o) + ')">' + ico(o ? 'ojoNo' : 'ojo') + '</button>';
  }
  function pInicio(res, sob) {
    var h = cabMes('Resumen', '<button class="btn-icono" aria-label="Configuración" onclick="App.ir(\'ajustes\')">' + ico('ajustes') + '</button>');
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">Gastado este mes</span>' + botonOjo() + '</div>' +
      '<div style="display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap"><div><div class="grande">' + din(res.total.CRC, 'CRC') + '</div><div class="et">en colones</div></div>' +
      '<div><div class="medio">' + din(res.total.USD, 'USD') + '</div><div class="et">en dólares</div></div></div>' +
      (res.cuotasTC.CRC || res.cuotasTC.USD ? '<div class="et">Incluye cuotas tasa cero: ' + din(res.cuotasTC.CRC, 'CRC') + (res.cuotasTC.USD ? ' + ' + din(res.cuotasTC.USD, 'USD') : '') + '</div>' : '') +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Ingresos ' + din(res.ingresos.CRC, 'CRC') + '</span><span class="fuerte">Te quedan <span class="verde">' + din(res.queda.CRC, 'CRC') + '</span></span></div>' +
      '<div class="rapidos"><button class="principal" onclick="App.formMovimiento()">' + ico('mas') + 'Movimiento</button>' +
      '<button onclick="App.revisarCorreos(this)">' + ico('recargar') + 'Correos</button>' +
      '<button onclick="App.formPago()">' + ico('casa') + 'Pagar cuota</button></div></div>';

    if (res.porRevisar) {
      h += '<button class="aviso" onclick="App.ir(\'movimientos\',\'revisar\')"><span style="width:22px;height:22px;display:flex">' + ico('alerta') + '</span>' +
        '<span style="flex:1"><b style="font-size:14px">' + res.porRevisar + ' movimiento' + (res.porRevisar > 1 ? 's' : '') + ' por revisar</b><br><span class="chico">Gastos sin categoría</span></span>' + ico('adelante', ' style="width:18px;height:18px"') + '</button>';
    }

    h += '<div class="fila" style="margin-top:4px"><h3 style="margin:0;font-size:15px">Accesos rápidos</h3><a href="#" onclick="App.formAccesos();return false" style="font-size:13px;font-weight:700;text-decoration:none;color:var(--acento)">Editar</a></div>' +
      '<div class="accesos">' + accesos().concat(['mas']).map(function (k) { return tile(k, false); }).join('') + '</div>';

    if (D.viajes) h += tarjetaViajeInicio();
    if (D.fondos) {
      var fpI = FD().pendientes;
      if (fpI.length) h += '<div class="caja sinpad"><div class="fila" style="padding:14px 16px 4px"><h3>Fondos: ¿a qué subcuenta?</h3><a href="#" onclick="App.ir(\'fondos\');return false" style="font-size:13px;font-weight:700;text-decoration:none;color:var(--acento)">Ver ' + fpI.length + '</a></div>' + fpI.slice(0, 3).map(itemFondoPend).join('') + '</div>';
    }
    if (!sinServidorSobres()) {
      var sbI = SB();
      if (sbI.pendientes.length) {
        h += '<div class="caja sinpad"><div class="fila" style="padding:14px 16px 4px"><h3>Por asignar</h3><a href="#" onclick="App.ir(\'porasignar\');return false" style="font-size:13px;font-weight:700;text-decoration:none;color:var(--acento)">Ver ' + sbI.pendientes.length + '</a></div>' +
          sbI.pendientes.slice(0, 3).map(itemPend).join('') + '</div>';
      }
      var lst = sbI.lista.filter(function (s) { return s.moneda === 'CRC'; }).sort(function (a, b) { return (b.pct || 0) - (a.pct || 0); }).slice(0, 4);
      if (lst.length) {
        h += '<div class="caja"><div class="fila"><h3>Sobres · ' + din(sbI.total.CRC, 'CRC') + '</h3><a href="#" onclick="App.ir(\'sobres\');return false" style="font-size:13px;font-weight:700;text-decoration:none;color:var(--acento)">Ver todos</a></div>';
        lst.forEach(function (s) {
          h += '<div style="display:flex;flex-direction:column;gap:4px"><div class="fila" style="font-size:14px"><span>' + esc(s.nombre) + '</span><span class="fuerte' + (s.saldo < 0 ? ' rojo' : '') + '">' + din(s.saldo, s.moneda) + '</span></div>' + barra(s.pct, s.pct >= 0.85) + '</div>';
        });
        h += '</div>';
      }
    }

    var pagos = [];
    D.cuentas.forEach(function (c) {
      if (!c.activa || c.tipo !== 'Tarjeta de crédito' || !c.diaPago) return;
      var f = C.proximaFecha(c.diaPago, hoy);
      var saldo = [c.saldoCRC ? txt(c.saldoCRC, 'CRC') : '', c.saldoUSD ? txt(c.saldoUSD, 'USD') : ''].filter(String).join(' + ');
      pagos.push({ nombre: etiquetaCuenta(c.nombre), det: saldo ? 'Saldo ' + saldo : 'Pago de la tarjeta', dias: C.diasEntre(hoy, f) });
    });
    if (D.prestamo && D.prestamo.proximoVenc) {
      pagos.push({ nombre: 'Préstamo casa BCR', det: 'Cuota estimada ' + txt(D.prestamo.estimado.total, 'CRC'), dias: C.diasEntre(hoy, new Date(D.prestamo.proximoVenc)) });
    }
    pagos.sort(function (a, b) { return a.dias - b.dias; });
    if (pagos.length) {
      h += '<div class="caja"><h3>Próximos pagos</h3>' + pagos.slice(0, 4).map(function (p) {
        var cls = p.dias <= 3 ? 'pill alerta' : 'pill';
        var txt = p.dias < 0 ? 'vencido' : p.dias === 0 ? 'hoy' : 'en ' + p.dias + ' día' + (p.dias === 1 ? '' : 's');
        return '<div class="fila"><div><div style="font-size:14px;font-weight:600">' + esc(p.nombre) + '</div><div class="suave chico">' + esc(p.det) + '</div></div><span class="' + cls + '">' + txt + '</span></div>';
      }).join('') + '</div>';
    }

    if (res.movimientos.length) {
      h += '<div class="caja sinpad"><div class="fila" style="padding:14px 16px 4px"><h3>Últimos movimientos</h3><a href="#" onclick="App.ir(\'movimientos\');return false" style="font-size:13px;font-weight:700;text-decoration:none">Ver todos</a></div>' +
        res.movimientos.slice(0, 4).map(itemMov).join('') + '</div>';
    } else {
      h += '<div class="caja vacio">No hay movimientos en ' + nombreMes(mes).toLowerCase() + '.<br>Tocá + para agregar uno.</div>';
    }
    $('p-inicio').innerHTML = h;
  }

  // ------------------------------------------------------------ ACCESOS Y PESTAÑA "MÁS"
  // Cada ícono: trazo blanco (b) + detalle de color (a)
  var ITEMS = {
    tarjetas: ['Tarjetas', 'M2 5h20v14H2zM2 10h20', 'M5 14h4v2H5z', 'ir:tarjetas'],
    ahorros: ['Ahorros', 'M5 9a7 6 0 0 1 14 0v6H5zM9 15v4M15 15v4', 'M11 5h2v2h-2z', 'ir:patrimonio'],
    prestamo: ['Préstamo', 'M3 11l9-7 9 7M5 10v10h14V10', 'M10 20v-5h4v5z', 'ir:prestamo'],
    inversiones: ['Fondos', 'M4 20V4M4 20h16M7 15l4-4 3 3 5-6', 'M18 7.5a1.5 1.5 0 1 0 0.01 0z', 'ir:fondos'],
    viajes: ['Viajes', 'M10.5 21l1.5-1v-5l8 3v-2l-8-5V5.5a1.5 1.5 0 0 0-3 0V11l-8 5v2l8-3v5l1.5 1z', 'M17 3.5a1.5 1.5 0 1 0 0.01 0z', 'ir:viajes'],
    sobres: ['Sobres', 'M3 6h18v12H3zM3 7l9 6 9-6', 'M17 15.5a2 2 0 1 0 0.01 0z', 'ir:sobres'],
    calculadora: ['Calculadora', 'M5 2h14v20H5zM8 5h8v4H8z', 'M8 13h2v2H8zM14 13h2v2h-2zM8 17h2v2H8zM14 17h2v2h-2z', 'ir:calculadora'],
    tasacero: ['Tasa cero', 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4', 'M12 12.5a2.5 3 0 1 0 0.01 0z', 'ir:tasacero'],
    recurrentes: ['Recurrentes', 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4', 'M12 11a1.5 1.5 0 1 0 0.01 0z', 'hoja:Recurrentes'],
    reportes: ['Reportes', 'M4 20V4M4 20h16', 'M8 16v-4h2v4zM12 16V8h2v8zM16 16v-6h2v6z', 'ir:reportes'],
    patrimonio: ['Patrimonio', 'M12 3l9 5H3zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18', 'M11 6.5h2v1h-2z', 'ir:patrimonio'],
    categorias: ['Categorías', 'M12 3a9 9 0 1 0 9 9h-9z', 'M14 2.5a8 8 0 0 1 7.5 7.5H14z', 'ir:reportes'],
    exportar: ['Exportar', 'M4 14v6h16v-6M12 3v11', 'M8.5 7.5L12 3l3.5 4.5z', 'exportar'],
    configuracion: ['Configuración', 'M12 9a3 3 0 1 0 0.01 0zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1', 'M11 11h2v2h-2z', 'ir:ajustes'],
    hoja: ['Mi hoja', 'M4 3h16v18H4zM4 9h16M4 15h16M10 3v18', 'M12 11h6v2h-6z', 'hoja:'],
    bancos: ['Bancos', 'M3 9l9-5 9 5M5 10v8M19 10v8M3 20h18', 'M10 12h4v6h-4z', 'ir:ajustes'],
    mas: ['Más', 'M4 4h6v6H4zM4 14h6v6H4zM14 14h6v6h-6z', 'M17 3.5l3.5 3.5-3.5 3.5-3.5-3.5z', 'ir:mas'],
    agregar: ['Agregar', 'M12 7v10M7 12h10', '', 'agregar']
  };
  var SECCIONES = [
    ['MIS CUENTAS', ['tarjetas', 'ahorros', 'prestamo', 'inversiones']],
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
    var h = '<div class="cab"><div><h1 class="titulo">Más</h1></div><span class="suave chico" style="text-align:right;max-width:180px">Mantené presionado un ícono para fijarlo en Inicio</span></div>';
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
    var antes = items.filter(function (x) { return x.e.estado === 'Pagada'; });
    var listas = items.filter(function (x) { return x.e.saldo === 0 && x.e.estado !== 'Pagada'; });
    function tarjetaTC(x) {
      var t = x.t, e = x.e, mon = t.moneda;
      var avance = t.monto ? e.pagado / t.monto : 0;
      var bajo = e.saldo > 0 && e.cuota < e.cuotaOriginal - 0.5;
      var pill = e.estado === 'Pagada' ? '<span class="pill ok">Pagada ✓</span>' : '<span class="pill' + (e.estado === 'Terminada' ? ' ok' : '') + '">' + e.estado + '</span>';
      var h2 = '<div class="caja" role="button" tabindex="0" style="gap:8px;cursor:pointer" onclick="App.verTC(' + t.fila + ')"><div class="fila"><b>' + esc(t.descripcion) + '</b>' + pill + '</div>' +
        '<div class="suave chico">' + esc(etiquetaCuenta(t.tarjeta)) + ' · ' + din(t.monto, mon) + ' en ' + t.meses + ' meses</div>';
      if (e.estado === 'Pagada') return h2 + '<div class="suave chico">Pagada en ' + mesCorto(e.liquidada) + ' · faltaban ' + (t.meses - e.cobradas) + ' cuotas</div></div>';
      h2 += barra(avance) +
        '<div class="fila chico"><span class="suave">' + e.cobradas + ' de ' + t.meses + ' cuotas' + (e.abonado ? ' · ' + din(e.abonado, mon) + ' abonado' : '') + '</span>' +
        '<span>' + (bajo ? '<s class="suave">' + din(e.cuotaOriginal, mon) + '</s> ' : '') + '<b>' + din(e.cuota, mon) + '</b>/mes</span></div>';
      if (e.saldo > 0) {
        h2 += '<div class="fila chico"><span class="suave">Falta · termina ' + mesCorto(e.ultima) + '</span><b>' + din(e.saldo, mon) + '</b></div>' +
          '<div class="dos"><button class="btn sec chico" style="justify-content:center" onclick="event.stopPropagation();App.formAbonoTC(' + t.fila + ')">+ Abono extra</button>' +
          '<button class="btn sec chico" style="justify-content:center" onclick="event.stopPropagation();App.verTC(' + t.fila + ')">Ver detalle</button></div>';
      }
      return h2 + '</div>';
    }
    h += activas.length ? activas.map(tarjetaTC).join('') : '<div class="caja vacio">No tenés compras a tasa cero activas.</div>';
    if (antes.length) h += '<div class="seccion-t">PAGADAS ANTES DE TIEMPO</div>' + antes.map(tarjetaTC).join('');
    if (listas.length) h += '<div class="seccion-t">TERMINADAS</div>' + listas.map(tarjetaTC).join('');
    h += '<div class="suave chico" style="text-align:center">Para agregar una compra: abrila en Movimientos y tocá <b>Pasar a tasa cero</b>.</div>';
    $('p-tasacero').innerHTML = h;
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
    var h = '<div class="cab"><div class="atras-cab">' + botonAtras('App.ir(\'tasacero\')') + '<div><div class="sobretitulo">' + esc(etiquetaCuenta(t.tarjeta)) + ' · Tasa cero</div><h1 class="titulo">' + esc(t.descripcion) + '</h1></div></div></div>';
    var bajo = e.saldo > 0 && e.cuota < e.cuotaOriginal - 0.5;
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">' + (e.saldo > 0 ? 'Falta por pagar' : '¡Pagada!') + '</span>' + botonOjo() + '</div>' +
      '<div class="grande">' + din(e.saldo, mon) + '</div>' + barra(t.monto ? e.pagado / t.monto : 0) +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">✓ Pagado</span><b>' + din(e.pagado, mon) + ' · ' + Math.round(t.monto ? e.pagado / t.monto * 100 : 0) + '%</b></div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Compra</span><span>' + din(t.monto, mon) + ' · ' + t.meses + ' meses · ' + mesCorto(t.primeraCuota ? new Date(t.primeraCuota) : null) + '</span></div>' +
      (e.saldo > 0 ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Cuota actual</span><span>' + (bajo ? '<s style="opacity:.6">' + din(e.cuotaOriginal, mon) + '</s> ' : '') + '<b style="color:var(--acento)">' + din(e.cuota, mon) + '</b></span></div>' : '') + '</div>';

    if (t.primeraCuota) {
      h += '<div class="caja"><div class="fila"><h3>Camino a cero</h3><span class="suave chico">saldo por mes</span></div>' +
        '<div class="leyenda" style="grid-template-columns:none;display:flex;flex-wrap:wrap;gap:4px 14px">' +
        '<div><span class="punto" style="background:var(--suave)"></span>Plan del banco</div><div><span class="punto" style="background:var(--acento)"></span>Con tus abonos</div>' +
        (bajo && e.abonado ? '<div><span class="punto" style="background:#3DD68C"></span>Si seguís pagando ' + din(e.cuotaOriginal, mon) + '</div>' : '') + '</div>' +
        graficoTC(t, e) + '</div>';
    }

    if (e.saldo > 0 && e.proxima) {
      var cards = '<div class="caja" style="gap:4px"><div class="chico fuerte" style="color:var(--acento)">' + (bajo ? 'Pagando la cuota nueva' : 'Pagando la cuota') + '</div>' +
        '<div style="font-size:20px;font-weight:800">' + mesCorto(e.ultima) + '</div><div class="suave chico">' + din(e.cuota, mon) + ' × ' + e.restantes + ' cuota' + (e.restantes === 1 ? '' : 's') + '</div></div>';
      var n2 = Math.ceil(e.saldo / e.cuotaOriginal - 1e-9);
      if (bajo && n2 < e.restantes) {
        cards += '<div class="caja" style="gap:4px"><div class="chico fuerte" style="color:#3DD68C">Si seguís pagando ' + din(e.cuotaOriginal, mon) + '</div>' +
          '<div style="font-size:20px;font-weight:800">' + mesCorto(C.sumarMeses(e.proxima.fecha, n2 - 1)) + '</div><div class="suave chico">' + (e.restantes - n2) + ' mes' + (e.restantes - n2 === 1 ? '' : 'es') + ' antes · luego cancelás el saldo</div></div>';
      } else if (e.restantes > 1) {
        var sim = JSON.parse(JSON.stringify(t)); sim.abonos = (sim.abonos || []).concat([{ fecha: new Date().toISOString(), monto: e.cuota }]);
        var es = C.estadoTasaCero(sim, hoy);
        cards += '<div class="caja" style="gap:4px"><div class="chico fuerte" style="color:#3DD68C">Si abonás ' + din(e.cuota, mon) + ' hoy</div>' +
          '<div style="font-size:20px;font-weight:800">' + din(es.cuota, mon) + '<span class="chico suave">/mes</span></div><div class="suave chico">la cuota baja y el plazo sigue igual</div></div>';
      }
      h += '<div class="dos">' + cards + '</div>';
    }

    var cuotasPag = e.plan.filas.filter(function (f) { return f.cobrada; });
    h += '<div class="caja" style="gap:6px"><h3>Resumen</h3>' +
      '<div class="fila chico"><span class="suave">Cuotas pagadas</span><span>' + cuotasPag.length + ' · ' + din(cuotasPag.reduce(function (a, f) { return a + f.cuota; }, 0), mon) + '</span></div>' +
      '<div class="fila chico"><span class="suave">Abonos extra</span><b style="color:var(--acento)">' + (t.abonos || []).length + ' · ' + din(e.abonado, mon) + '</b></div>' +
      (e.proxima && e.saldo > 0 ? '<div class="fila chico"><span class="suave">Próxima cuota</span><span>' + fechaCorta(e.proxima.fecha.toISOString()) + ' · ' + din(e.proxima.cuota, mon) + '</span></div>' : '') + '</div>';

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
            '<span class="monto"><b style="display:block;color:var(--acento)">' + din(a.monto, mon) + '</b><span class="origen">' + (x.x.saldo > 0 ? 'cuota → ' + txt(x.x.cuotaNueva, mon) : 'saldo en cero') + '</span></span></button>';
        }
        return '<div class="item" style="cursor:default"><span class="ico">' + ico('calendario') + '</span><span class="cuerpo"><span class="nombre" style="display:block">Cuota ' + x.f.n + ' de ' + t.meses + '</span>' +
          '<span class="det" style="display:block">' + mesCorto(x.f.fecha) + ' · en el estado de cuenta</span></span><span class="monto"><b style="display:block">' + din(x.f.cuota, mon) + '</b></span></div>';
      }).join('') +
        (total > hist.length ? '<button class="item" style="justify-content:center;color:var(--acento);font-weight:700" onclick="App.tcVerTodo()">Ver ' + (total - hist.length) + ' más</button>' : '') + '</div>';
    }
    h += '<div class="suave chico" style="text-align:center">Tocá un abono para editarlo o borrarlo. Las cuotas salen solas del plan.</div>';
    if (e.saldo > 0) h += '<button class="fab-txt" onclick="App.formAbonoTC(' + t.fila + ')">' + ico('mas') + 'Abono extra</button>';
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
    srv('guardarAbonoTC', [a], function () { listo(e.saldo - monto <= 0.01 ? '🎉 ¡' + t.descripcion + ' quedó pagada!' : '✅ Abono guardado. La cuota se recalculó.'); }, $('ab-ok'));
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
    h += '<div class="caja"><div class="fila"><h3>Ahorros e inversiones</h3><b class="verde">' + din(act.CRC, 'CRC') + (act.USD ? ' + ' + din(act.USD, 'USD') : '') + '</b></div>' + (filasA.join('') || '<div class="suave">Sin saldos registrados.</div>') + '</div>';
    h += '<div class="caja"><div class="fila"><h3>Deudas</h3><b class="rojo">' + din(deu.CRC, 'CRC') + (deu.USD ? ' + ' + din(deu.USD, 'USD') : '') + '</b></div>' + (filasD.join('') || '<div class="suave">Sin deudas registradas.</div>') + '</div>';
    h += '<div class="suave chico" style="text-align:center">Los saldos se actualizan en Tarjetas (tocando cada cuenta) o en la pestaña Cuentas de la hoja.</div>';
    $('p-patrimonio').innerHTML = h;
  }

  // ------------------------------------------------------------ CALCULADORA DE PRÉSTAMOS
  // la calculadora es para simular (también para otras personas): nunca oculta montos
  function dk(n, m, dec) { return '<span class="m">' + C.dinero(n, m, dec) + '</span>'; }
  function leerJSON(k, def) { try { var v = JSON.parse(guardado(k, 'null')); return v || def; } catch (e) { return def; } }
  var CALC_VACIA = { para: '', concepto: '', monto: '', moneda: 'CRC', plazo: '', plazoU: 'meses', tasa: '', tasaU: 'anual', pol: '', polT: 'fijo', com: '', fecha: '', tipo: 'fija' };
  var calc = leerJSON('mf-calc', JSON.parse(JSON.stringify(CALC_VACIA)));
  var calcVista = 'datos';
  var calcAbono = { monto: '', frecuencia: 'mensual', mes: '12', modo: 'plazo' };

  function leerFormCalc() {
    if (!$('k-monto')) return;
    ['para', 'concepto', 'monto', 'plazo', 'tasa', 'pol', 'com', 'fecha'].forEach(function (c) { calc[c] = val('k-' + c); });
    calc.moneda = val('k-moneda') || 'CRC';
    guardar('mf-calc', JSON.stringify(calc));
  }
  function leerFormAbono() {
    if (!$('a-monto')) return;
    calcAbono.monto = val('a-monto'); calcAbono.frecuencia = val('a-frec'); calcAbono.mes = val('a-mes') || calcAbono.mes;
  }
  function calcSet(campo, valor) { leerFormCalc(); leerFormAbono(); if (campo.indexOf('abono.') === 0) calcAbono[campo.slice(6)] = valor; else calc[campo] = valor; pintar(); }

  /** Parámetros para el motor a partir de lo que escribió la persona. Devuelve null y avisa si falta algo. */
  function parametrosCalc(conAbono) {
    var monto = C.leerNumero(calc.monto), plazo = C.leerNumero(calc.plazo), tasa = C.leerNumero(calc.tasa);
    if (!monto || monto <= 0) { toast('Escribí el monto del préstamo.'); return null; }
    if (!plazo || plazo <= 0) { toast('Escribí el plazo.'); return null; }
    if (tasa === null || tasa < 0) { toast('Escribí la tasa de interés (puede ser 0).'); return null; }
    var meses = Math.round(calc.plazoU === 'anios' ? plazo * 12 : plazo);
    if (meses > 600) { toast('El plazo máximo es de 50 años.'); return null; }
    var pol = C.leerNumero(calc.pol) || 0;
    var p = {
      monto: monto, plazo: meses, tasaMensual: calc.tasaU === 'mensual' ? tasa / 100 : tasa / 100 / 12,
      tipo: calc.tipo, poliza: { monto: calc.polT === 'pct' ? pol / 100 : pol, tipo: calc.polT },
      comision: C.leerNumero(calc.com) || 0, primerPago: calc.fecha ? new Date(calc.fecha + 'T12:00') : null
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
      tasaTexto: String(t.toFixed(2)).replace('.', ',') + '% ' + (calc.tasaU === 'mensual' ? 'mensual' : 'anual'),
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
    var h = cabSimple('Calculadora', 'Préstamos');
    if (D.prestamo && D.prestamo.saldo) h += '<button class="btn borde" onclick="App.usarCasa()">' + ico('casa') + 'Usar mi préstamo de casa</button>';
    h += '<div class="caja" style="gap:0">' +
      '<div class="dos-campos"><label class="campo compacto"><span>Para (nombre)</span><input id="k-para" value="' + esc(calc.para) + '" placeholder="Opcional"></label>' +
      '<label class="campo compacto"><span>Concepto</span><input id="k-concepto" value="' + esc(calc.concepto) + '" placeholder="Ej. Carro nuevo"></label></div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Monto del préstamo</span><input id="k-monto" data-dinero class="monto" inputmode="decimal" value="' + esc(calc.monto) + '" placeholder="0"></label>' +
      '<label class="campo compacto"><span>Moneda</span><select id="k-moneda"><option value="CRC"' + (calc.moneda === 'CRC' ? ' selected' : '') + '>₡</option><option value="USD"' + (calc.moneda === 'USD' ? ' selected' : '') + '>$</option></select></label></div>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Plazo</span><input id="k-plazo" inputmode="numeric" value="' + esc(calc.plazo) + '" placeholder="60"></label>' +
      '<label class="campo compacto"><span>Tasa de interés (%)</span><input id="k-tasa" inputmode="decimal" value="' + esc(calc.tasa) + '" placeholder="9,5"></label></div>' +
      '<div class="dos-campos" style="margin-top:6px">' + seg('plazoU', [['meses', 'Meses'], ['anios', 'Años']]) + seg('tasaU', [['anual', 'Anual'], ['mensual', 'Mensual']]) + '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:8px;align-items:end"><label class="campo compacto"><span>Pólizas y seguros (opcional)</span><input id="k-pol" data-dinero inputmode="decimal" value="' + esc(calc.pol) + '" placeholder="0"></label>' +
      '<div style="margin-top:10px">' + seg('polT', [['fijo', 'Monto'], ['pct', '% saldo']]) + '</div></div>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Comisión (una vez)</span><input id="k-com" data-dinero inputmode="decimal" value="' + esc(calc.com) + '" placeholder="0"></label>' +
      '<label class="campo compacto"><span>Primer pago</span><input id="k-fecha" type="date" value="' + esc(calc.fecha) + '"></label></div>' +
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
    var h = cabSimple(esc(calc.concepto || 'Resultado'), esc(sub), 'App.verDatos()');
    h += resumenCalc(r, mon);
    h += '<div class="rapidos" style="grid-template-columns:repeat(3,minmax(0,1fr))"><button class="principal" onclick="App.compartirPDF(false, this)">' + ico('compartir') + 'Compartir PDF</button>' +
      '<button onclick="App.verYSi()">' + ico('flechas') + '¿Y si…?</button><button onclick="App.guardarSim()">' + ico('guardar') + 'Guardar</button></div>';
    h += '<div class="caja"><div class="fila"><h3>Mes a mes</h3><span class="suave chico">' + r.meses + ' cuotas</span></div>' +
      '<div class="tabla-k"><span class="h">#</span><span class="h d">Capital</span><span class="h d">Interés</span><span class="h d">Saldo</span>' +
      r.filas.map(function (f) {
        return '<span>' + f.n + (f.fecha ? '<br><span class="s">' + MESES_C[f.fecha.getMonth()] + ' ' + String(f.fecha.getFullYear()).slice(2) + '</span>' : '') + '</span>' +
          '<span class="d">' + dk(Math.round(f.capital), mon) + '</span><span class="d" style="color:var(--acento)">' + dk(Math.round(f.interes), mon) + '</span><span class="d fuerte">' + dk(Math.round(f.saldo), mon) + '</span>';
      }).join('') + '</div></div>';
    $('p-calculadora').innerHTML = h;
  }

  function pCalcYSi(p) {
    var mon = calc.moneda, base = C.amortizar(p);
    var h = cabSimple('¿Y si…?', esc(calc.concepto || 'Simulación'), 'App.calcVer(\'resultado\')');
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
      h += '<div class="dos">' +
        (calcAbono.modo === 'plazo'
          ? '<div class="bien"><div class="et">Terminás en</div><div class="v">' + ra.meses + ' cuotas</div><div class="et">' + (antes > 0 ? antes + ' cuotas antes' + (antes >= 12 ? ' (≈ ' + String((antes / 12).toFixed(1)).replace('.', ',').replace(',0', '') + ' años)' : '') : 'mismo plazo') + '</div></div>'
          : '<div class="bien"><div class="et">La cuota baja a</div><div class="v">' + (nuevaCuota ? dk(nuevaCuota, mon) : '—') + '</div><div class="et">después del abono</div></div>') +
        '<div class="bien"><div class="et">Te ahorrás</div><div class="v">' + dk(ahorro, mon) + '</div><div class="et">en intereses</div></div></div>' +
        '<div class="suave chico">Abonos en total: ' + dk(ra.totalAbonos, mon) + '</div>' +
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
      com: '', fecha: p.proximoVenc ? localInput(p.proximoVenc) : '', tipo: 'fija'
    };
    guardar('mf-calc', JSON.stringify(calc));
    if (!calcAbono.monto) calcAbono.monto = '50.000';
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
      tasaTexto: t.tasaTexto, polizaTexto: t.polizaTexto, tipoTexto: t.tipoTexto, comision: p.comision, res: r
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
  function itemMov(m) {
    var revisar = m.tipo === 'Gasto' && !m.categoria;
    var icono = m.tipo === 'Ingreso' ? 'sube' : m.tipo === 'Compra tasa cero' ? 'calendario' : m.tipo === 'Pago de tarjeta' ? 'tarjeta' : m.tipo === 'Transferencia' ? 'flechas' : revisar ? 'alerta' : 'bolsa';
    var signo = m.tipo === 'Ingreso' ? '+' : m.tipo === 'Gasto' ? '−' : '';
    var color = m.tipo === 'Ingreso' ? 'verde' : m.tipo === 'Gasto' ? 'rojo' : '';
    var det = [m.lugar, m.cuenta ? etiquetaCuenta(m.cuenta) : '', hora(m.fecha)].filter(String).join(' · ');
    if (revisar) det = 'Sin categoría' + (m.cuenta ? ' · ' + etiquetaCuenta(m.cuenta) : '');
    if (m.tipo === 'Compra tasa cero') det = 'Tasa cero · ' + det;
    return '<button class="item" onclick="App.formMovimiento(' + m.fila + ')"><span class="ico' + (revisar ? ' alerta' : '') + '">' + ico(icono) + '</span>' +
      '<span class="cuerpo"><span class="nombre" style="display:block">' + esc(m.comercio || m.tipo) + '</span><span class="det' + (revisar ? ' naranja' : '') + '" style="display:block' + (revisar ? ';font-weight:600' : '') + '">' + esc(det) + '</span></span>' +
      '<span class="monto"><span class="' + color + '" style="display:block">' + signo + din(m.monto, m.moneda).replace('−', '') + '</span><span class="origen">' + esc((m.origen || '').toLowerCase()) + '</span></span></button>';
  }

  function pMovimientos(res) {
    var bancos = [];
    D.cuentas.forEach(function (c) { if (c.banco && c.tipo === 'Tarjeta de crédito' && bancos.indexOf(c.banco) < 0) bancos.push(c.banco); });
    var chips = [['todos', 'Todos'], ['revisar', 'Por revisar']].concat(bancos.map(function (b) { return ['b:' + b, b]; })).concat([['CRC', '₡'], ['USD', '$']]);
    var h = cabMes('Movimientos', '<button class="btn-icono" aria-label="Revisar correos ahora" onclick="App.revisarCorreos(this)">' + ico('recargar') + '</button>');
    h += '<label class="buscador">' + ico('buscar', ' style="width:18px;height:18px;color:var(--suave)"') +
      '<input type="search" id="q" aria-label="Buscar movimientos" placeholder="Buscar…" value="' + esc(filtro.q) + '" oninput="App.buscar(this.value)"></label>';
    h += '<div class="chips">' + chips.map(function (c) {
      return '<button class="chip' + (filtro.chip === c[0] ? ' on' : '') + '" onclick="App.chip(\'' + esc(c[0]).replace(/'/g, '') + '\')">' + esc(c[1]) + '</button>';
    }).join('') + '</div><div id="listaMov"></div>';
    $('p-movimientos').innerHTML = h;
    pintarLista(res);
  }

  function pintarLista(res) {
    res = res || C.resumenMes(D, mes);
    var q = filtro.q.trim().toLowerCase();
    var lista = res.movimientos.filter(function (m) {
      if (filtro.chip === 'revisar' && !(m.tipo === 'Gasto' && !m.categoria)) return false;
      if (filtro.chip === 'CRC' || filtro.chip === 'USD') { if (m.moneda !== filtro.chip) return false; }
      if (filtro.chip.indexOf('b:') === 0) { var c = cuentaPorNombre(m.cuenta); if (!c || c.banco !== filtro.chip.slice(2)) return false; }
      if (q && [m.comercio, m.lugar, m.categoria, m.cuenta, m.sobre, m.nota].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (!lista.length) { $('listaMov').innerHTML = '<div class="caja vacio">No hay movimientos con ese filtro.</div>'; return; }
    var h = '', diaActual = '';
    var grupo = [];
    function cerrar() { if (grupo.length) h += '<div class="caja sinpad">' + grupo.join('') + '</div>'; grupo = []; }
    lista.forEach(function (m) {
      var d = new Date(m.fecha);
      var clave = d.toDateString();
      if (clave !== diaActual) {
        cerrar();
        diaActual = clave;
        var dd = C.diasEntre(d, hoy);
        var et = dd === 0 ? 'Hoy · ' : dd === 1 ? 'Ayer · ' : '';
        h += '<div class="dia">' + et + DIAS[d.getDay()] + ' ' + d.getDate() + '</div>';
      }
      grupo.push(itemMov(m));
    });
    cerrar();
    $('listaMov').innerHTML = '<div style="display:flex;flex-direction:column;gap:12px">' + h + '</div>';
  }

  // ------------------------------------------------------------ TARJETAS
  var COLOR_BANCO = { 'BCR': '#1B3A6B', 'Davibank': '#8A1C2B', 'BAC': '#B5121B', 'BN': '#0B5E3B', 'Promerica': '#00573F' };
  function colorBanco(b) {
    if (COLOR_BANCO[b]) return COLOR_BANCO[b];
    var pal = ['#13221B', '#3B2E6B', '#6B4A1B', '#1B5E6B', '#5E1B4A'], n = 0;
    String(b).split('').forEach(function (ch) { n += ch.charCodeAt(0); });
    return pal[n % pal.length];
  }
  function pTarjetas(res) {
    var tarjetas = D.cuentas.filter(function (c) { return c.tipo === 'Tarjeta de crédito' && c.activa; });
    var deudaCRC = 0, deudaUSD = 0;
    tarjetas.forEach(function (c) { deudaCRC += c.saldoCRC || 0; deudaUSD += c.saldoUSD || 0; });
    var h = '<div class="cab"><div><div class="sobretitulo">Gastos de ' + nombreMes(mes).toLowerCase() + '</div><h1 class="titulo">Tarjetas</h1></div>' + botonOjo() + '</div>';
    h += '<div class="suave" style="margin-top:-8px">Deuda total ' + din(deudaCRC, 'CRC') + ' + ' + din(deudaUSD, 'USD') + '</div>';
    tarjetas.forEach(function (c) {
      var g = res.porCuenta[c.nombre] || { CRC: 0, USD: 0, cuotasTC: { CRC: 0, USD: 0 } };
      var uso = c.limiteCRC ? (c.saldoCRC || 0) / c.limiteCRC : null;
      var f = C.proximaFecha(c.diaPago, hoy), dias = f ? C.diasEntre(hoy, f) : null;
      var tcs = D.tasaCero.filter(function (t) { return t.tarjeta === c.nombre; })
        .map(function (t) { return { t: t, e: C.estadoTasaCero(t, hoy) }; })
        .filter(function (x) { return x.e.restantes > 0; });
      h += '<div><button class="plastico" style="background:' + colorBanco(c.banco) + ';width:100%;border:0;text-align:left;cursor:pointer" onclick="App.formCuenta(' + c.fila + ')" aria-label="Editar ' + esc(c.nombre) + '">' +
        '<span class="fila"><b style="font-size:16px">' + esc(c.banco || c.nombre) + '</b><span style="font-size:13px;font-weight:700;opacity:.85">' + esc(c.nombre.replace(c.banco || '', '').trim().toUpperCase()) + '</span></span>' +
        '<span class="num">•••• •••• •••• ' + esc(c.ultimos4 || '····') + '</span>' +
        '<span class="fila chico" style="opacity:.85"><span>' + (c.diaCorte ? 'Corte día ' + c.diaCorte : '') + '</span><span>' + (c.diaPago ? 'Pago día ' + c.diaPago : '') + '</span></span></button>' +
        '<div class="caja"><div class="dos"><div><div class="suave chico">Saldo colones</div><div class="fuerte" style="font-size:18px">' + din(c.saldoCRC || 0, 'CRC') + '</div></div>' +
        '<div><div class="suave chico">Saldo dólares</div><div class="fuerte" style="font-size:18px">' + din(c.saldoUSD || 0, 'USD') + '</div></div></div>' +
        (uso !== null ? barra(uso, uso > 0.7) : '') +
        '<div class="fila chico suave"><span>' + (uso !== null ? 'Usado ' + Math.round(uso * 100) + '% de ' + din(c.limiteCRC, 'CRC') : '') + '</span>' +
        (dias !== null ? '<span class="' + (dias <= 3 ? 'naranja fuerte' : '') + '">Pagar ' + (dias === 0 ? 'hoy' : 'en ' + dias + ' día' + (dias === 1 ? '' : 's')) + '</span>' : '') + '</div>' +
        '<div class="fila chico"><span class="suave">Compras de este mes</span><span class="fuerte">' + din(g.CRC, 'CRC') + (g.USD ? ' + ' + din(g.USD, 'USD') : '') + '</span></div>' +
        (tcs.length ? '<div style="border-top:1px solid var(--linea);padding-top:10px;display:flex;flex-direction:column;gap:8px"><div class="suave chico fuerte">TASA CERO</div>' + tcs.map(function (x) {
          return '<div class="fila chico"><span>' + esc(x.t.descripcion) + '<br><span class="suave">' + x.e.restantes + ' de ' + x.t.meses + ' cuotas por pagar</span></span><span style="text-align:right"><b>' + din(x.e.cuota, x.t.moneda) + '</b>/mes<br><span class="suave">falta ' + din(x.e.saldo, x.t.moneda) + '</span></span></div>';
        }).join('') + '</div>' : '') +
        '</div></div>';
    });
    var otras = D.cuentas.filter(function (c) { return c.tipo !== 'Tarjeta de crédito' && c.activa; });
    if (otras.length) {
      h += '<div class="caja sinpad"><div style="padding:14px 16px 4px"><h3>Otras cuentas</h3></div>' + otras.map(function (c) {
        var icono = c.tipo === 'Préstamo' ? 'casa' : c.tipo === 'Inversión' ? 'sube' : 'sobre';
        var saldo = [c.saldoCRC ? din(c.saldoCRC, 'CRC') : '', c.saldoUSD ? din(c.saldoUSD, 'USD') : ''].filter(String).join(' + ') || din(0, c.moneda);
        return '<button class="item" onclick="App.formCuenta(' + c.fila + ')"><span class="ico">' + ico(icono) + '</span><span class="cuerpo"><span class="nombre" style="display:block">' + esc(c.nombre) + '</span><span class="det" style="display:block">' + esc(c.tipo + (c.banco ? ' · ' + c.banco : '')) + '</span></span><span class="monto">' + saldo + '</span></button>';
      }).join('') + '</div>';
    }
    h += '<button class="punteado" onclick="App.formCuenta()">' + ico('mas', ' style="width:20px;height:20px"') + 'Agregar tarjeta o cuenta</button>';
    $('p-tarjetas').innerHTML = h;
  }

  // ------------------------------------------------------------ SOBRES
  // ------------------------------------------------------------ SOBRES CON SALDO (v1.6)
  function SB() { return C.saldosSobres(D, mes, hoy); }
  function sobreTarjetas() { return (D.sobreEspecial || {}).tarjetas || 'Pago tarjetas'; }
  function grupoNuevo() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function movPorFila(f) { return D.movimientos.filter(function (m) { return m.fila === f; })[0]; }
  function sinServidorSobres() { return !D.sobresDesde; }
  function avisoServidor() { return '<div class="caja vacio">Para usar los sobres con saldo hay que actualizar el código del servidor (Apps Script) a la versión 1.6.</div>'; }
  function fechaSobre(m) { return m && m.fecha ? m.fecha : new Date().toISOString(); }

  function pSobres() {
    var h = cabMes('Sobres', '<button class="btn chico" onclick="App.formSobre()">' + ico('mas', ' style="width:16px;height:16px"') + 'Nuevo</button>');
    if (sinServidorSobres()) { $('p-sobres').innerHTML = h + avisoServidor(); return; }
    var sb = SB();
    var nPend = sb.pendientes.length;
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">Dinero en sobres</span>' + botonOjo() + '</div>' +
      '<div style="display:flex;gap:18px;align-items:baseline;flex-wrap:wrap"><span class="grande">' + din(sb.total.CRC, 'CRC') + '</span>' + (sb.total.USD ? '<span class="medio">' + din(sb.total.USD, 'USD') + '</span>' : '') + '</div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Por asignar' + (nPend ? ' (' + nPend + ')' : '') + '</span><b style="color:var(--acento)">' + din(sb.porAsignar.CRC, 'CRC') + (sb.porAsignar.USD ? ' + ' + din(sb.porAsignar.USD, 'USD') : '') + '</b></div>' +
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
    h += '<div class="suave chico" style="text-align:center">Saldos desde el ' + fechaCorta(D.sobresDesde) + '. Las compras con tarjeta se descuentan al asignar el pago de la tarjeta.</div>';
    $('p-sobres').innerHTML = h;
  }

  // ---- lista de pendientes
  function iconoPend(p) { return p.sentido === 'entra' ? '<span class="ico" style="background:rgba(61,214,140,.15);color:var(--positivo)">' + ico('sube') + '</span>' : '<span class="ico">' + ico(p.mov.tipo === 'Pago de tarjeta' ? 'tarjeta' : 'bolsa') + '</span>'; }
  function itemPend(p) {
    var m = p.mov;
    var det = fechaCorta(m.fecha) + ' · ' + (m.tipo === 'Pago de tarjeta' ? 'pago de ' + etiquetaCuenta(m.cuenta) : p.sentido === 'entra' ? '¿a qué sobre va?' : '¿de qué sobre salió?') + (p.asignado ? ' · falta ' + txt(p.falta, m.moneda) : '');
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
    h += '<div class="suave chico" style="text-align:center">Las compras con tarjeta no aparecen aquí: se asignan cuando pagás la tarjeta.</div>';
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
    var m = movPorFila(fila); if (!m) return;
    var p = SB().pendientes.filter(function (x) { return x.mov.fila === fila; })[0];
    if (!p) return toast('Este movimiento ya está asignado.');
    asig = { fila: fila, falta: p.falta, sentido: p.sentido, moneda: m.moneda, modo: p.sentido === 'entra' ? 'sobre' : 'sobre', filas: [{ sobre: sobreTarjetas(), monto: p.falta }] };
    var h = '<div class="suave chico">' + esc(m.tipo) + ' · ' + fechaCorta(m.fecha) + (m.cuenta ? ' · ' + esc(etiquetaCuenta(m.cuenta)) : '') + '</div>' +
      '<h2>' + esc(m.comercio || m.tipo) + '</h2><div class="grande ' + (p.sentido === 'entra' ? 'verde' : 'rojo') + '" style="font-size:28px;font-weight:800">' + (p.sentido === 'entra' ? '+' : '−') + din(p.falta, m.moneda) + '</div>' +
      (m.nota ? '<div class="suave chico">' + esc(m.nota) + '</div>' : '') + '<div id="as-cuerpo"></div>';
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
        '<div class="chips" style="margin:6px 0"><button class="chip" onclick="App.asigTodo()">Todo de ' + esc(sobreTarjetas()) + '</button></div>' +
        asig.filas.map(function (f, i) {
          return '<div class="fila-sobre"><select onchange="App.asigFila(' + i + ',\'sobre\',this.value)">' + opcionesSobre(m.moneda, f.sobre, true) + '</select>' +
            '<input data-dinero inputmode="decimal" value="' + esc(String(f.monto).replace('.', ',')) + '" oninput="App.asigFila(' + i + ',\'monto\',this.value)">' +
            (asig.filas.length > 1 ? '<button class="x" aria-label="Quitar" onclick="App.asigQuitar(' + i + ')">×</button>' : '') + '</div>';
        }).join('') +
        '<button class="btn sec chico" style="justify-content:center;margin-top:6px" onclick="App.asigAgregar()">+ Otro sobre</button>' +
        '<div class="fila" style="margin-top:8px"><span class="suave">Falta asignar</span><b id="as-falta" style="color:' + (Math.abs(asig.falta - suma) < 0.01 ? 'var(--positivo)' : 'var(--acento)') + '">' + txt(asig.falta - suma, m.moneda) + (Math.abs(asig.falta - suma) < 0.01 ? ' ✓' : '') + '</b></div>';
    } else if (asig.sentido === 'entra') {
      h += '<div class="suave chico fuerte" style="margin-top:10px">¿A DÓNDE VA ESTE DINERO?</div>' +
        radio('sobre', 'Meter en un sobre', asig.modo === 'sobre' ? '<select id="as-sobre" onclick="event.stopPropagation()">' + opcionesSobre(m.moneda, null, true) + '</select>' : '') +
        radio('tarjetas', 'Para pagar tarjetas', '<span class="suave chico"> (sobre ' + esc(sobreTarjetas()) + ')</span>') +
        radio('repartir', 'Repartir en varios sobres') +
        radio('ninguno', 'Dejar en la cuenta (sin sobre)');
    } else {
      h += '<div class="suave chico fuerte" style="margin-top:10px">¿DE QUÉ SOBRE SALIÓ?</div>' +
        '<label class="campo compacto" style="margin-top:4px"><span>Sobre</span><select id="as-sobre">' + opcionesSobre(m.moneda, null, true) + '</select></label>';
    }
    if (m.tipo !== 'Pago de tarjeta' && asig.modo !== 'repartir') {
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
    asig.filas.push({ sobre: otro ? otro.nombre : sobreTarjetas(), monto: Math.max(0, Math.round((asig.falta - suma) * 100) / 100) });
    pintarAsignar();
  }
  function asigQuitar(i) { asig.filas.splice(i, 1); pintarAsignar(); }
  function guardarAsignar() {
    var m = movPorFila(asig.fila), g = grupoNuevo(), filas = [];
    if (asig.modo === 'repartir') { cerrar(); return irReparto(asig.fila); }
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
      filas.push({ sobre: sobre, monto: asig.sentido === 'entra' ? monto : -monto });
    }
    var tipo = m.tipo === 'Pago de tarjeta' ? 'Pago tarjeta' : asig.modo === 'ninguno' ? 'Sin sobre' : asig.sentido === 'entra' ? 'Asignación' : 'Gasto';
    var lista = filas.map(function (f) { return { fecha: fechaSobre(m), sobre: f.sobre, monto: f.monto, tipo: tipo, movimiento: m.fila, grupo: g, nota: m.comercio || '' }; });
    var recordar = $('as-recordar') && $('as-recordar').checked && lista[0].sobre;
    var b = $('as-ok');
    srv('guardarSobresMov', [lista], function () {
      if (recordar) srv('guardarReglaSobre', [m.comercio, lista[0].sobre], function () {});
      listo('✅ Asignado');
    }, b);
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
    srv('guardarSobresMov', [lista], function () {
      var fin = function () { rep = null; pantalla = 'sobres'; listo('✅ Repartido en ' + lista.length + ' sobres'); };
      if (guardarSiempre) srv('guardarReparto', [base, ajuste], fin); else fin();
    }, $('rep-ok'));
  }

  // ---- mover entre sobres
  function formMover(desde) {
    var mon = 'CRC';
    abrir('<h2>Mover entre sobres</h2>' +
      '<label class="campo"><span>De</span><select id="mv-de">' + opcionesSobre(mon, desde, true) + '</select></label>' +
      '<label class="campo"><span>A</span><select id="mv-a">' + opcionesSobre(mon, desde === sobreTarjetas() ? null : sobreTarjetas(), true) + '</select></label>' +
      '<label class="campo"><span>Monto</span><input id="mv-monto" data-dinero inputmode="decimal" placeholder="0"></label>' +
      '<label class="campo"><span>Nota</span><input id="mv-nota" placeholder="Opcional"></label>' +
      '<div class="acciones"><button class="btn" id="mv-ok" onclick="App.guardarMover()">Mover</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarMover() {
    var de = val('mv-de'), a = val('mv-a'), monto = C.leerNumero(val('mv-monto'));
    if (de === a) return toast('Elegí dos sobres distintos.');
    if (!monto || monto <= 0) return toast('Escribí el monto.');
    var g = grupoNuevo(), f = new Date().toISOString(), nota = val('mv-nota').trim() || ('De ' + de + ' a ' + a);
    srv('guardarSobresMov', [[{ fecha: f, sobre: de, monto: -monto, tipo: 'Mover', grupo: g, nota: nota }, { fecha: f, sobre: a, monto: monto, tipo: 'Mover', grupo: g, nota: nota }]],
      function () { listo('✅ Movido ' + txt(monto, 'CRC') + ' a ' + a); }, $('mv-ok'));
  }

  // ---- limpiar sobres (fin de mes)
  var limpiar = null;
  function pLimpiar() {
    var sb = SB();
    if (!limpiar) {
      limpiar = { destino: sobreTarjetas(), sel: {} };
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
    srv('guardarSobresMov', [lista], function () { limpiar = null; pantalla = 'sobres'; listo('✅ ' + txt(total, 'CRC') + ' pasaron a ' + dest); }, $('lp-ok'));
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
    var sig = function () { if (i >= lista.length) return listo('Asignación deshecha. Quedó por asignar.'); srv('eliminarGrupoSobres', [lista[i++]], sig, b); };
    sig();
  }

  // ------------------------------------------------------------ FONDOS DE INVERSIÓN (v1.7)
  function FD() { return C.fondos(D, hoy); }
  function sobreFondos() { return 'Fondos'; }
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
    var h = cabSimple('Fondos', 'Inversiones');
    if (sinServidorV17()) { $('p-fondos').innerHTML = h + avisoV17(); return; }
    var fd = FD();
    var sobreF = D.sobresDesde ? SB().lista.filter(function (s) { return s.nombre === sobreFondos(); })[0] : null;
    var interesesTot = fd.lista.reduce(function (a, f) { return a + (f.intereses || 0); }, 0);
    h += '<div class="hero"><div style="display:flex;align-items:center;gap:6px"><span class="et" style="font-size:13px;font-weight:600">Total invertido</span>' + botonOjo() + '</div>' +
      '<div class="grande">' + din(fd.total.CRC, 'CRC') + '</div>' + (fd.total.USD ? '<div class="medio">' + din(fd.total.USD, 'USD') + '</div>' : '') +
      (interesesTot ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Intereses (últimos ajustes)</span><b class="verde">+' + din(interesesTot, 'CRC') + '</b></div>' : '') +
      (sobreF ? '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Sobre Fondos (sin invertir)</span><b style="color:var(--acento)">' + din(sobreF.saldo, 'CRC') + '</b></div>' : '') + '</div>';
    if (fd.pendientes.length) h += '<div class="seccion-t">POR ASIGNAR A UNA SUBCUENTA</div><div class="caja sinpad">' + fd.pendientes.map(itemFondoPend).join('') + '</div>';
    if (!fd.lista.length) h += '<div class="caja vacio">Todavía no hay subcuentas. Agregalas con el botón de abajo (los nombres y saldos están en tu estado de cuenta de BCR SAFI).</div>';
    else h += '<div class="caja sinpad">' + fd.lista.map(function (f, i) {
      var det = (f.aportesMes ? '+' + din(f.aportesMes, f.moneda) + ' este mes · ' : '') + (f.retirosMes ? '−' + din(f.retirosMes, f.moneda) + ' retirado · ' : '') +
        'saldo al ' + (f.fechaSaldo ? fechaCorta(f.fechaSaldo) : '—');
      return '<button class="item" style="flex-direction:column;align-items:stretch;gap:6px" onclick="App.formFondo(' + i + ')">' +
        '<span class="fila"><span style="font-weight:700">' + esc(f.nombre) + '</span><span class="fuerte">' + din(f.saldo, f.moneda) + '</span></span>' +
        (f.meta ? barra(Math.max(0, Math.min(1, f.saldo / f.meta))) + '<span class="chico suave">Meta ' + din(f.meta, f.moneda) + (f.saldo < f.meta ? ' · faltan ' + din(f.meta - f.saldo, f.moneda) : ' · ¡lograda!') + '</span>' : '') +
        '<span class="chico suave">' + det + '</span></button>';
    }).join('') + '</div>';
    h += '<button class="btn sec" onclick="App.formFondo()">' + ico('mas') + 'Agregar subcuenta</button>';
    var ult = D.movimientos.filter(function (m) { return m.tipo === 'Inversión' || m.tipo === 'Retiro de fondo'; }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); }).slice(0, 8);
    if (ult.length) h += '<div class="seccion-t">ÚLTIMOS MOVIMIENTOS</div><div class="caja sinpad">' + ult.map(function (m) {
      return '<button class="item" onclick="App.formSubcuenta(' + m.fila + ')"><span class="cuerpo"><span class="nombre" style="display:block">' + esc(m.tipo === 'Inversión' ? 'Inversión' : 'Retiro') + ' · ' + esc(m.subcuenta || 'sin subcuenta') + '</span>' +
        '<span class="det" style="display:block">' + esc(fechaCorta(m.fecha) + (m.nota ? ' · ' + m.nota : '')) + '</span></span>' +
        '<span class="monto"><b class="' + (m.tipo === 'Inversión' ? '' : 'verde') + '" style="display:block">' + (m.tipo === 'Inversión' ? '' : '+') + din(m.monto, m.moneda) + '</b></span></button>';
    }).join('') + '</div>';
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
    srv('marcarMovimiento', [fila, 'Subcuenta', val('sc-sel'), { monto: m.monto }], function () { listo('✅ Asignado a ' + val('sc-sel')); }, $('sc-ok'));
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
    var h = cabSimple('Viajes', 'Presupuestos');
    if (sinServidorV17()) { $('p-viajes').innerHTML = h + avisoV17(); return; }
    var lista = (D.viajes || []).slice().sort(function (a, b) { return new Date(b.desde) - new Date(a.desde); });
    if (!lista.length) h += '<div class="caja vacio">Creá un presupuesto para un viaje o unas compras: elegís las tarjetas, las fechas y el límite, y la app suma sola cada compra.</div>';
    else h += '<div class="caja sinpad">' + lista.map(function (v) {
      var r = C.viaje(D, v, hoy);
      return '<button class="item" style="flex-direction:column;align-items:stretch;gap:6px" onclick="App.verViaje(' + v.fila + ')">' +
        '<span class="fila"><span style="font-weight:700">' + esc(v.nombre) + '</span><span class="pill' + (r.estado === 'En curso' ? ' ok' : '') + '">' + r.estado + '</span></span>' + barra(r.pct, r.pct >= 0.8) +
        '<span class="chico suave">' + fechaCorta(v.desde) + ' al ' + fechaCorta(v.hasta) + ' · ' + din(r.gastado, r.moneda) + ' de ' + din(r.limite, r.moneda) + '</span></button>';
    }).join('') + '</div>';
    h += '<button class="btn" onclick="App.formViaje()">' + ico('mas') + 'Nuevo presupuesto</button>';
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
    h += '<button class="btn sec" onclick="App.formAgregarViaje(' + v.fila + ')">' + ico('mas') + 'Agregar una compra de otra cuenta</button>';
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
    srv('marcarMovimiento', [fila, 'Viaje', valor, { monto: m.monto }], function () {
      m.viaje = valor;   // se ve al instante; la recarga confirma
      listo(valor === 'Fuera' ? 'Compra sacada del viaje' : '✅ ' + valor.replace('+', '') + (valor.charAt(0) === '+' ? ' · agregada al viaje' : ''));
    }, boton);
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
      h += '<div class="caja"><h3>Saldo al cierre de cada año</h3><div class="graf" style="' + cols + '" role="img" aria-label="Saldo del préstamo por año">' +
        anios.map(function (a, i) { return '<i class="' + (i === anios.length - 1 ? 'ult' : '') + '" style="height:' + Math.max(6, porAnio[a] / max * 96) + 'px" title="' + a + ': ' + txt(porAnio[a], 'CRC') + '"></i>'; }).join('') +
        '</div><div class="graf-et" style="' + cols + '">' + anios.map(function (a) { return '<span>' + a + '</span>'; }).join('') + '</div></div>';
    }

    var hist = p.pagos.slice().reverse();
    var mostrar = verTodoHistorial ? hist : hist.slice(0, 6);
    h += '<div class="caja"><div class="fila"><h3>Historial de pagos</h3><span class="suave chico">' + p.cuotasPagadas + ' pagos</span></div>' +
      '<div class="tabla"><span class="h">Fecha</span><span class="h d">Interés</span><span class="h d">Capital</span><span class="h d">Saldo</span>' +
      mostrar.map(function (x) {
        var d = new Date(x.fecha);
        return '<span>' + d.getDate() + ' ' + MESES_C[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) + (x.anticipo > 0 ? '<br><span class="suave chico">' + x.anticipo + ' días antes</span>' : '') + '</span>' +
          '<span class="d">' + din(Math.round(x.intereses), 'CRC') + '</span><span class="d">' + din(Math.round(x.principal), 'CRC') + '</span>' +
          '<span class="d fuerte"><span class="m">₡' + ((x.saldo || 0) / 1e6).toFixed(2).replace('.', ',') + ' M</span></span>';
      }).join('') + '</div>' +
      (hist.length > 6 ? '<button class="btn sec chico" style="justify-content:center" onclick="App.historial()">' + (verTodoHistorial ? 'Ver menos' : 'Ver todo el historial') + '</button>' : '') + '</div>';
    h += '<div class="suave chico" style="text-align:center">Intereses pagados en total: ' + din(p.interesesTotal, 'CRC') + '</div>';
    $('p-prestamo').innerHTML = h;
  }

  // ------------------------------------------------------------ PANELES (formularios)
  function abrir(html) { $('panel').innerHTML = '<div class="asa"></div>' + html; $('velo').classList.add('abierto'); formatearMontos(); }
  function cerrar() { $('velo').classList.remove('abierto'); }
  function val(id) { var e = $(id); return e ? e.value : ''; }
  function listo(msg) { cerrar(); toast(msg); cargar(); }

  function formMovimiento(fila) {
    var m = fila ? D.movimientos.filter(function (x) { return x.fila === fila; })[0] : null;
    m = m || { tipo: 'Gasto', moneda: 'CRC', fecha: new Date().toISOString(), origen: 'Manual' };
    var cuentas = D.cuentas.filter(function (c) { return c.activa || c.nombre === m.cuenta; }).map(function (c) { return c.nombre; });
    var sobres = D.sobres.map(function (s) { return s.nombre; });
    var h = '<h2>' + (fila ? 'Movimiento' : 'Nuevo movimiento') + '</h2>';
    if (m.origen === 'Correo') h += '<div class="pill ok" style="display:inline-block">Registrado desde un correo' + (m.autorizacion && m.autorizacion.indexOf('auto-') !== 0 ? ' · aut. ' + esc(m.autorizacion) : '') + '</div>';
    h += '<label class="campo"><span>Tipo</span><select id="f-tipo">' + opciones(D.tiposMovimiento.length ? D.tiposMovimiento : ['Gasto', 'Ingreso'], m.tipo) + '</select></label>' +
      '<div style="display:flex;gap:8px;align-items:flex-end"><label class="campo" style="flex:1"><span>Monto</span><input id="f-monto" data-dinero class="monto" inputmode="decimal" placeholder="0" value="' + (fila ? esc(String(m.monto).replace('.', ',')) : '') + '"></label>' +
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
    srv('guardarMovimiento', [m], function () { listo('✅ Movimiento guardado'); }, $('f-guardar'));
  }
  function borrarMov(fila) {
    var b = $('f-borrar');
    if (!b.dataset.ok) { b.dataset.ok = '1'; b.textContent = 'Tocá otra vez para confirmar'; return; }
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
    srv('revisarCorreosAhora', [], function (msg) { toast(msg, 5000); AJ = null; cargar(); }, boton);
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
  function pAjustes() {
    var cab = '<div class="cab"><div style="display:flex;gap:10px;align-items:center"><button class="btn-icono" aria-label="Volver" onclick="App.volver()">' + ico('atras') + '</button><h1 class="titulo">Configuración</h1></div></div>';
    if (!AJ) {
      $('p-ajustes').innerHTML = cab + '<div class="caja vacio"><div class="spinner" style="margin:0 auto 10px"></div>Cargando…</div>';
      srv('obtenerAjustes', [], function (a) { AJ = a; pinActivo = a.pinActivo; if (pantalla === 'ajustes') pintar(); });
      return;
    }
    var tema = guardado('mf-tema', 'dorado');
    var privado = guardado('mf-privado', 'no') === 'si';
    var h = cab;

    h += '<div class="seccion">Apariencia</div><div class="caja sinpad">' +
      opcion('luna', 'Tema', 'Automático sigue el modo claro u oscuro de tu teléfono', '') +
      '<div class="chips" style="padding:0 16px 14px;flex-wrap:wrap;overflow:visible">' + [['dorado', 'Negro y amarillo'], ['oscuro', 'Oscuro verde'], ['claro', 'Claro'], ['auto', 'Automático']].map(function (t) {
        return '<button class="chip' + (tema === t[0] ? ' on' : '') + '" onclick="App.tema(\'' + t[0] + '\')">' + t[1] + '</button>';
      }).join('') + '</div>' +
      opcion('ojo', 'Ocultar montos', 'Muestra ****** en vez de las cantidades. También con el ojo 👁 de Inicio', interruptor('aj-priv', privado, 'App.privado(this.checked)', 'Ocultar montos')) + '</div>';

    var prep = guardado('mf-preparado', '');
    if (D.sobresDesde) h += '<div class="seccion">Sobres</div><div class="caja sinpad">' +
      opcion('sobre', 'Saldos de los sobres desde', fechaCorta(D.sobresDesde) + ' · los saldos iniciales se ponen en la pestaña Sobres', '', 'App.formSobresDesde()') + '</div>';
    h += '<div class="seccion">Calculadora</div><div class="caja sinpad">' +
      opcion('hoja', 'Preparado por (en los PDF)', prep ? esc(prep) : 'Sin nombre · tocá para escribirlo', '', 'App.formPreparado()') + '</div>';

    h += '<div class="seccion">Seguridad</div><div class="caja sinpad">' +
      opcion('candado', 'PIN de acceso', AJ.pinActivo ? 'Activado · se pide al abrir y tras ' + MINUTOS_BLOQUEO + ' min fuera de la app' : 'Desactivado',
        '<span class="pill' + (AJ.pinActivo ? ' ok' : '') + '">' + (AJ.pinActivo ? 'Activo' : 'Activar') + '</span>', 'App.formPIN(\'' + (AJ.pinActivo ? 'menu' : 'activar') + '\')') +
      (AJ.pinActivo ? opcion('huella', 'Entrar con huella', huellaLocal() ? 'Activada en este teléfono' : (huellaSoportada === false ? 'Este teléfono o navegador no lo permite' : 'Usá el lector de huellas en vez del PIN'),
        interruptor('aj-huella', !!huellaLocal(), 'App.alternarHuella(this)', 'Entrar con huella')) : '') +
      '<div class="suave chico" style="padding:0 16px 14px">La app solo abre con tu cuenta de Google (' + esc(AJ.correo) + '). El PIN agrega una segunda capa por si alguien toma tu teléfono desbloqueado.</div></div>';

    h += '<div class="seccion">Recordatorios</div><div class="caja sinpad">' +
      opcion('campana', 'Recordatorios por correo', 'Pagos de tarjeta (3 días antes), cuota del préstamo, TBP del día 7 y gastos sin categoría', interruptor('aj-rec', AJ.recordatorios, 'App.recordatorios(this.checked)', 'Recordatorios por correo')) +
      opcion('correo', 'Enviar uno de prueba', 'Llega a ' + esc(AJ.correo), '', 'App.pruebaRecordatorio(this)') + '</div>';

    var ult = AJ.ultimaRevision ? new Date(Number(AJ.ultimaRevision) + 10 * 60000) : null;
    h += '<div class="seccion">Correos de los bancos</div><div class="caja sinpad">' +
      opcion('recargar', 'Revisar correos ahora', ult ? 'Última revisión: ' + fechaCorta(ult.toISOString()) + ' ' + hora(ult.toISOString()) : 'Todavía no se ha revisado', '', 'App.revisarCorreos(this)') +
      opcion('sobre', 'Bancos que se leen', esc(AJ.bancos.join(', ') || 'Ninguno') + ' + SINPE Móvil BCR + recibos del préstamo', '') +
      '<div class="suave chico" style="padding:0 16px 14px">Para agregar un banco (por ejemplo Davibank), escribí su correo en la pestaña <b>Config</b> de la hoja.</div></div>';

    var cx = conexion();
    h += '<div class="seccion">Conexión con Google</div><div class="caja sinpad">' +
      opcion('flechas', 'Servidor (Apps Script)', esc(cx.url.replace(/^https:\/\/script\.google\.com\/macros\/s\/(.{6}).*(.{6})\/exec$/, '…$1…$2/exec')), '', '') +
      opcion('candado', 'Cambiar URL o clave', 'Si publicaste el servidor de nuevo o cambiaste la clave', '', 'App.cambiarConexion()') + '</div>';

    h += '<div class="seccion">Datos</div><div class="caja sinpad">' +
      '<a class="opcion" style="text-decoration:none;color:inherit" href="' + esc(AJ.urlHoja) + '" target="_blank" rel="noopener">' +
      '<span class="ico" style="width:36px;height:36px;border-radius:10px;background:var(--verde-claro);color:var(--verde);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + ico('hoja', ' style="width:18px;height:18px"') + '</span>' +
      '<span class="cuerpo"><span class="nombre" style="display:block">Abrir mi hoja de Google</span><span class="det" style="display:block">' + esc(AJ.nombreHoja) + '</span></span>' + ico('adelante', ' style="width:18px;height:18px"') + '</a>' +
      opcion('flechas', 'Tipo de cambio de referencia', txt(D.tipoCambio, 'CRC', true) + ' por $1 · se cambia en Config', '') +
      opcion('recargar', 'Recargar datos', 'Trae los cambios que hiciste directo en la hoja', '', 'App.recargar()') + '</div>';

    h += '<div class="suave chico" style="text-align:center;margin-top:6px">Finanzas · app ' + VERSION_WEB + ' · servidor ' + esc(AJ.version) + '</div>';
    $('p-ajustes').innerHTML = h;
  }

  function setTema(t) { guardar('mf-tema', t); document.documentElement.setAttribute('data-tema', t); pintar(); }
  function setPrivado(on) { guardar('mf-privado', on ? 'si' : 'no'); pintar(); }
  function setRecordatorios(on) {
    var c = $('aj-rec'); if (c) c.disabled = true;
    srv('guardarRecordatorios', [on], function () { if (c) c.disabled = false; AJ.recordatorios = on; toast(on ? '✅ Recordatorios activados' : 'Recordatorios desactivados'); },
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

  function iniciar() {
    $('logoCarga').innerHTML = LOGO;
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
    tema: setTema, privado: setPrivado, recordatorios: setRecordatorios, pruebaRecordatorio: pruebaRecordatorio,
    formPIN: formPIN, guardarPIN: guardarPIN, tecla: tecla,
    usarHuella: usarHuella, alternarHuella: alternarHuella, activarHuella: activarHuella,
    recargar: function () { AJ = null; cargar(function () { toast('Datos actualizados'); }); },
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
    guardarLimpiar: guardarLimpiar, deshacerSobres: deshacerSobres, formSobresDesde: formSobresDesde, guardarSobresDesde: guardarSobresDesde,
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
