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
  var AJ = null;                      // ajustes del servidor
  var ocultoDesde = null;
  var MINUTOS_BLOQUEO = 5;
  var VERSION_WEB = '1.2.0';

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
    ojoNo: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    cuadros: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    guardar: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'
  };
  function ico(n, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + I[n] + '</svg>';
  }
  var LOGO = '<svg aria-hidden="true" viewBox="0 0 512 512"><rect width="512" height="512" rx="116" fill="#7FD1B0"/><path d="M120 168h244a28 28 0 0 1 28 28v28" fill="none" stroke="#0A4F3E" stroke-width="24" stroke-linecap="round"/><rect x="104" y="196" width="304" height="196" rx="34" fill="#0F6B54"/><rect x="300" y="254" width="128" height="80" rx="26" fill="#0A4F3E"/><circle cx="342" cy="294" r="16" fill="#7FD1B0"/><path d="M196 252a42 42 0 1 0 0 84" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/><path d="M180 232l-14 124M202 232l-14 124" stroke="#fff" stroke-width="9" stroke-linecap="round"/></svg>';

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

  function srv(fn, args, ok, boton) {
    if (boton) boton.disabled = true;
    llamar(fn, args).then(function (x) { if (boton) boton.disabled = false; ok(x); }, function (e) {
      if (boton) boton.disabled = false;
      var msg = e && e.message ? e.message : String(e);
      if (msg.indexOf('PIN_REQUERIDO') >= 0) { token = null; guardar('mf-ses', null, sessionStorage); bloquear(); return; }
      if (msg.indexOf('CLAVE_INVALIDA') >= 0) { mostrarConexion('La clave ya no es válida. Escribí la clave actual.'); return; }
      $('cargando').style.display = 'none';
      toast('⚠️ ' + msg, 7000);
    });
  }
  function cargar(cb) {
    srv('obtenerDatos', [], function (json) {
      D = JSON.parse(json);
      hoy = new Date(D.hoy);
      $('cargando').style.display = 'none';
      pintar();
      if (cb) cb();
    });
  }

  // ------------------------------------------------------------ navegación
  var PRINCIPALES = ['inicio', 'movimientos', 'tarjetas', 'mas'];
  var NAV = [['inicio', 'Inicio', 'inicio'], ['movimientos', 'Movimientos', 'lista'], null, ['tarjetas', 'Tarjetas', 'tarjeta'], ['mas', 'Más', 'cuadros']];
  var origen = 'inicio';
  function ir(p, chip) {
    if (PRINCIPALES.indexOf(pantalla) >= 0 && PRINCIPALES.indexOf(p) < 0) origen = pantalla;
    if (p === 'calculadora') calcVista = 'datos';
    pantalla = p;
    if (chip) filtro.chip = chip;
    window.scrollTo(0, 0);
    pintar();
  }
  function volver() { ir(PRINCIPALES.indexOf(origen) >= 0 ? origen : 'inicio'); }
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
      mas: pMas, calculadora: pCalc, tasacero: pTasaCero, reportes: pReportes, patrimonio: pPatrimonio
    })[pantalla](res, sob);
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

    var vars = sob.lista.filter(function (s) { return s.tipo !== 'Fijo' && s.asignado > 0; })
      .sort(function (a, b) { return (b.pct || 0) - (a.pct || 0); }).slice(0, 3);
    if (vars.length) {
      h += '<div class="caja"><div class="fila"><h3>Sobres</h3><a href="#" onclick="App.ir(\'sobres\');return false" style="font-size:13px;font-weight:700;text-decoration:none">Ver todos</a></div>';
      vars.forEach(function (s) {
        var alerta = (s.pct || 0) >= 0.85;
        h += '<div style="display:flex;flex-direction:column;gap:4px"><div class="fila" style="font-size:14px"><span>' + esc(s.nombre) + '</span>' +
          (alerta ? '<span class="naranja fuerte" style="font-size:13px">' + (s.disponible > 0 ? 'Solo quedan ' + din(s.disponible, s.moneda) : 'Agotado') + '</span>'
            : '<span class="suave">' + din(s.gastado, s.moneda) + ' de ' + din(s.asignado, s.moneda) + '</span>') + '</div>' + barra(s.pct, alerta) + '</div>';
      });
      h += '</div>';
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
    inversiones: ['Inversiones', 'M4 20V4M4 20h16M7 15l4-4 3 3 5-6', 'M18 7.5a1.5 1.5 0 1 0 0.01 0z', 'ir:patrimonio'],
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
    ['PLANIFICAR', ['sobres', 'calculadora', 'tasacero', 'recurrentes']],
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

  // ------------------------------------------------------------ TASA CERO
  function pTasaCero(res) {
    var h = cabMes('Tasa cero');
    var items = D.tasaCero.map(function (t) { return { t: t, e: C.estadoTasaCero(t, hoy) }; });
    var pend = { CRC: 0, USD: 0 };
    items.forEach(function (x) { pend[x.t.moneda === 'USD' ? 'USD' : 'CRC'] += x.e.saldo; });
    h += '<div class="hero"><span class="et" style="font-size:13px;font-weight:600">Falta por pagar</span>' +
      '<div style="display:flex;gap:18px;align-items:baseline;flex-wrap:wrap"><span class="grande">' + din(pend.CRC, 'CRC') + '</span>' + (pend.USD ? '<span class="medio">' + din(pend.USD, 'USD') + '</span>' : '') + '</div>' +
      '<div class="fila" style="font-size:13px"><span class="et" style="font-size:13px">Cuotas de ' + MESES[mes.getMonth()] + '</span><b>' + din(res.cuotasTC.CRC, 'CRC') + (res.cuotasTC.USD ? ' + ' + din(res.cuotasTC.USD, 'USD') : '') + '</b></div></div>';
    var activas = items.filter(function (x) { return x.e.restantes > 0; });
    var listas = items.filter(function (x) { return x.e.restantes === 0; });
    function tarjetaTC(x) {
      var avance = x.t.meses ? x.e.cobradas / x.t.meses : 0;
      return '<div class="caja" style="gap:8px"><div class="fila"><b>' + esc(x.t.descripcion) + '</b><span class="pill' + (x.e.estado === 'Terminada' ? ' ok' : '') + '">' + x.e.estado + '</span></div>' +
        '<div class="suave chico">' + esc(etiquetaCuenta(x.t.tarjeta)) + ' · ' + din(x.t.monto, x.t.moneda) + ' en ' + x.t.meses + ' meses</div>' + barra(avance) +
        '<div class="fila chico"><span class="suave">' + x.e.cobradas + ' de ' + x.t.meses + ' cuotas · termina ' + (x.e.ultima ? MESES_C[x.e.ultima.getMonth()] + ' ' + x.e.ultima.getFullYear() : '—') + '</span>' +
        '<span><b>' + din(x.e.cuota, x.t.moneda) + '</b>/mes</span></div></div>';
    }
    h += activas.length ? activas.map(tarjetaTC).join('') : '<div class="caja vacio">No tenés compras a tasa cero activas.</div>';
    if (listas.length) h += '<div class="seccion-t">TERMINADAS</div>' + listas.map(tarjetaTC).join('');
    h += '<div class="suave chico" style="text-align:center">Para agregar una: abrí la compra en Movimientos y tocá <b>Pasar a tasa cero</b>.</div>';
    $('p-tasacero').innerHTML = h;
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
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:8px"><label class="campo compacto"><span>Monto del préstamo</span><input id="k-monto" class="monto" inputmode="decimal" value="' + esc(calc.monto) + '" placeholder="0"></label>' +
      '<label class="campo compacto"><span>Moneda</span><select id="k-moneda"><option value="CRC"' + (calc.moneda === 'CRC' ? ' selected' : '') + '>₡</option><option value="USD"' + (calc.moneda === 'USD' ? ' selected' : '') + '>$</option></select></label></div>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Plazo</span><input id="k-plazo" inputmode="numeric" value="' + esc(calc.plazo) + '" placeholder="60"></label>' +
      '<label class="campo compacto"><span>Tasa de interés (%)</span><input id="k-tasa" inputmode="decimal" value="' + esc(calc.tasa) + '" placeholder="9,5"></label></div>' +
      '<div class="dos-campos" style="margin-top:6px">' + seg('plazoU', [['meses', 'Meses'], ['anios', 'Años']]) + seg('tasaU', [['anual', 'Anual'], ['mensual', 'Mensual']]) + '</div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:8px;align-items:end"><label class="campo compacto"><span>Pólizas y seguros (opcional)</span><input id="k-pol" inputmode="decimal" value="' + esc(calc.pol) + '" placeholder="0"></label>' +
      '<div style="margin-top:10px">' + seg('polT', [['fijo', 'Monto'], ['pct', '% saldo']]) + '</div></div>' +
      '<div class="dos-campos"><label class="campo compacto"><span>Comisión (una vez)</span><input id="k-com" inputmode="decimal" value="' + esc(calc.com) + '" placeholder="0"></label>' +
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
      '<div style="display:grid;grid-template-columns:minmax(0,1fr) 140px;gap:8px"><label class="campo compacto" style="margin-top:0"><span>Monto</span><input id="a-monto" inputmode="decimal" value="' + esc(calcAbono.monto) + '" placeholder="50.000"></label>' +
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
      '<input type="search" id="q" aria-label="Buscar movimientos" placeholder="Buscar comercio, lugar, categoría…" value="' + esc(filtro.q) + '" oninput="App.buscar(this.value)"></label>';
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
  function pSobres(res, sob) {
    var h = cabMes('Sobres', '<button class="btn chico" onclick="App.formSobre()">' + ico('mas', ' style="width:16px;height:16px"') + 'Nuevo</button>');
    h += '<div class="caja"><div class="fila"><span class="suave" style="font-size:14px">Ingresos del mes</span><b>' + din(res.ingresos.CRC, 'CRC') + '</b></div>' +
      '<div class="fila"><span class="suave" style="font-size:14px">Repartido en sobres</span><b>' + din(sob.asignadoCRC, 'CRC') + '</b></div>' +
      '<div class="fila" style="background:' + (sob.porRepartirCRC < 0 ? 'var(--naranja-claro)' : 'var(--verde-claro)') + ';border-radius:12px;padding:10px 12px">' +
      '<b style="font-size:14px;color:' + (sob.porRepartirCRC < 0 ? 'var(--naranja-txt)' : 'var(--verde-osc)') + '">' + (sob.porRepartirCRC < 0 ? 'Repartiste de más' : 'Por repartir') + '</b>' +
      '<b style="font-size:18px;color:' + (sob.porRepartirCRC < 0 ? 'var(--naranja-txt)' : 'var(--verde-osc)') + '">' + din(Math.abs(sob.porRepartirCRC), 'CRC') + '</b></div>' +
      (sob.asignadoUSD ? '<div class="fila chico suave"><span>Sobres en dólares</span><span>' + din(sob.asignadoUSD, 'USD') + '</span></div>' : '') + '</div>';
    h += '<div class="caja sinpad">' + sob.lista.map(function (s, i) {
      var alerta = s.tipo !== 'Fijo' && (s.pct || 0) >= 0.85;
      var derecha = s.tipo === 'Fijo'
        ? '<span class="pill ' + (s.estado === 'Pagado' ? 'ok' : '') + '">' + s.estado + '</span>'
        : '<span class="fuerte' + (alerta ? ' naranja' : '') + '">' + din(s.disponible, s.moneda) + '</span>';
      var det = s.tipo === 'Fijo'
        ? din(s.gastado, s.moneda) + ' de ' + din(s.asignado, s.moneda) + ' · fijo'
        : 'Gastado ' + din(s.gastado, s.moneda) + ' de ' + din(s.asignado, s.moneda) + (alerta ? (s.disponible > 0 ? ' · casi vacío' : ' · agotado') : '');
      return '<button class="item" style="flex-direction:column;align-items:stretch;gap:6px" onclick="App.formSobre(' + i + ')">' +
        '<span class="fila"><span style="font-weight:700">' + esc(s.nombre) + '</span>' + derecha + '</span>' +
        barra(s.tipo === 'Fijo' ? (s.estado === 'Pagado' ? 1 : (s.pct || 0)) : s.pct, alerta) +
        '<span class="chico ' + (alerta ? 'naranja fuerte' : 'suave') + '">' + det + '</span></button>';
    }).join('') + '</div>';
    $('p-sobres').innerHTML = h;
  }

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
  function abrir(html) { $('panel').innerHTML = '<div class="asa"></div>' + html; $('velo').classList.add('abierto'); }
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
      '<div style="display:flex;gap:8px;align-items:flex-end"><label class="campo" style="flex:1"><span>Monto</span><input id="f-monto" class="monto" inputmode="decimal" placeholder="0" value="' + (fila ? esc(String(m.monto).replace('.', ',')) : '') + '"></label>' +
      '<label class="campo" style="width:96px"><span>Moneda</span><select id="f-moneda">' + '<option value="CRC"' + (m.moneda === 'CRC' ? ' selected' : '') + '>₡</option><option value="USD"' + (m.moneda === 'USD' ? ' selected' : '') + '>$</option></select></label></div>' +
      '<label class="campo"><span>Comercio o descripción</span><input id="f-comercio" value="' + esc(m.comercio) + '" placeholder="Ej. Automercado"></label>' +
      '<label class="campo"><span>Lugar</span><input id="f-lugar" value="' + esc(m.lugar) + '" placeholder="Opcional"></label>' +
      '<label class="campo"><span>Fecha y hora</span><input id="f-fecha" type="datetime-local" value="' + localInput(m.fecha, true) + '"></label>' +
      '<label class="campo"><span>Tarjeta o cuenta</span><select id="f-cuenta" onchange="App.monedaDeCuenta()">' + opciones(cuentas, m.cuenta, '— Ninguna —') + '</select></label>' +
      '<label class="campo"><span>Categoría</span><select id="f-categoria">' + opciones(D.categorias, m.categoria, '— Sin categoría —') + '</select></label>' +
      '<label class="campo"><span>Sobre</span><select id="f-sobre">' + opciones(sobres, m.sobre, '— Ninguno —') + '</select></label>' +
      '<label class="campo"><span>Nota</span><input id="f-nota" value="' + esc(m.nota) + '" placeholder="Opcional"></label>' +
      '<label class="check"><input type="checkbox" id="f-regla"> Usar siempre esta categoría y sobre para este comercio</label>' +
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
      '<div class="dos"><label class="campo"><span>Límite ₡</span><input id="c-limc" inputmode="decimal" value="' + num(c.limiteCRC) + '"></label><label class="campo"><span>Límite $</span><input id="c-limu" inputmode="decimal" value="' + num(c.limiteUSD) + '"></label></div>' +
      '<div class="dos"><label class="campo"><span>Día de corte</span><input id="c-corte" type="number" min="1" max="31" value="' + (c.diaCorte || '') + '"></label><label class="campo"><span>Día de pago</span><input id="c-pago" type="number" min="1" max="31" value="' + (c.diaPago || '') + '"></label></div>' +
      '<div class="dos"><label class="campo"><span>Saldo actual ₡</span><input id="c-salc" inputmode="decimal" value="' + num(c.saldoCRC) + '"></label><label class="campo"><span>Saldo actual $</span><input id="c-salu" inputmode="decimal" value="' + num(c.saldoUSD) + '"></label></div>' +
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

  function formSobre(i) {
    if (i === undefined) {
      return abrir('<h2>Nuevo sobre</h2><label class="campo"><span>Nombre</span><input id="s-nombre" placeholder="Ej. Mascotas"></label>' +
        '<div class="dos"><label class="campo"><span>Moneda</span><select id="s-moneda"><option value="CRC">Colones ₡</option><option value="USD">Dólares $</option></select></label>' +
        '<label class="campo"><span>Tipo</span><select id="s-tipo"><option>Variable</option><option>Fijo</option></select></label></div>' +
        '<label class="campo"><span>Monto por mes</span><input id="s-monto" class="monto" inputmode="decimal" placeholder="0"></label>' +
        '<div class="acciones"><button class="btn" id="s-ok" onclick="App.guardarSob()">Crear sobre</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
    }
    var s = C.sobres(D, mes, C.resumenMes(D, mes)).lista[i];
    if (s.asignadoAuto) {
      return abrir('<h2>' + esc(s.nombre) + '</h2><div class="suave" style="margin-top:6px">Este sobre se calcula solo con las cuotas tasa cero del mes: ' + din(s.asignado, s.moneda) + '.</div><div class="acciones"><button class="btn sec" onclick="App.cerrar()">Cerrar</button></div>');
    }
    abrir('<h2>' + esc(s.nombre) + '</h2><div class="suave">' + (s.notas ? esc(s.notas) + ' · ' : '') + 'Gastado este mes: ' + din(s.gastado, s.moneda) + '</div>' +
      '<label class="campo"><span>Monto por mes (' + (s.moneda === 'USD' ? '$' : '₡') + ')</span><input id="s-monto" class="monto" inputmode="decimal" value="' + String(s.asignado).replace('.', ',') + '"></label>' +
      '<div class="acciones"><button class="btn" id="s-ok" onclick="App.guardarSob(' + s.fila + ')">Guardar</button><button class="btn sec" onclick="App.cerrar()">Cancelar</button></div>');
  }
  function guardarSob(fila) {
    var monto = C.leerNumero(val('s-monto'));
    if (monto === null || monto < 0) return toast('Escribí un monto válido.');
    var s = fila ? { fila: fila, asignado: monto } : { nombre: val('s-nombre').trim(), moneda: val('s-moneda'), tipo: val('s-tipo'), asignado: monto };
    if (!fila && !s.nombre) return toast('Falta el nombre del sobre.');
    srv('guardarSobre', [s], function () { listo('✅ Sobre guardado'); }, $('s-ok'));
  }

  function formPago() {
    var e = D.prestamo.estimado;
    var r = function (n) { return n === null || n === undefined ? '' : (Math.round(n * 100) / 100).toFixed(2).replace('.', ','); };
    abrir('<h2>Registrar pago del préstamo</h2><div class="suave">Normalmente se registra solo con el correo del banco. Usá esto solo si no llegó.</div>' +
      '<label class="campo"><span>Fecha de pago</span><input id="p-fecha" type="date" value="' + localInput() + '"></label>' +
      '<label class="campo"><span>N° de comprobante</span><input id="p-comp" inputmode="numeric"></label>' +
      '<label class="campo"><span>Abono a principal</span><input id="p-prin" inputmode="decimal" value="' + r(e.principal) + '"></label>' +
      '<label class="campo"><span>Intereses</span><input id="p-int" inputmode="decimal" value="' + r(e.intereses) + '"></label>' +
      '<label class="campo"><span>Pólizas</span><input id="p-pol" inputmode="decimal" value="' + r(e.polizas) + '"></label>' +
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
    h += '<div class="seccion">Calculadora</div><div class="caja sinpad">' +
      opcion('hoja', 'Preparado por (en los PDF)', prep ? esc(prep) : 'Sin nombre · tocá para escribirlo', '', 'App.formPreparado()') + '</div>';

    h += '<div class="seccion">Seguridad</div><div class="caja sinpad">' +
      opcion('candado', 'PIN de acceso', AJ.pinActivo ? 'Activado · se pide al abrir y tras ' + MINUTOS_BLOQUEO + ' min fuera de la app' : 'Desactivado',
        '<span class="pill' + (AJ.pinActivo ? ' ok' : '') + '">' + (AJ.pinActivo ? 'Activo' : 'Activar') + '</span>', 'App.formPIN(\'' + (AJ.pinActivo ? 'menu' : 'activar') + '\')') +
      '<div class="suave chico" style="padding:0 16px 14px">La app solo abre con tu cuenta de Google (' + esc(AJ.correo) + '). El PIN agrega una segunda capa por si alguien toma tu teléfono desbloqueado.</div></div>';

    h += '<div class="seccion">Recordatorios</div><div class="caja sinpad">' +
      opcion('campana', 'Recordatorios por correo', 'Pagos de tarjeta (3 días antes), cuota del préstamo, TBP del día 7 y gastos sin categoría', interruptor('aj-rec', AJ.recordatorios, 'App.recordatorios(this.checked)', 'Recordatorios por correo')) +
      opcion('correo', 'Enviar uno de prueba', 'Llega a ' + esc(AJ.correo), '', 'App.pruebaRecordatorio(this)') + '</div>';

    var ult = AJ.ultimaRevision ? new Date(Number(AJ.ultimaRevision) + 10 * 60000) : null;
    h += '<div class="seccion">Correos de los bancos</div><div class="caja sinpad">' +
      opcion('recargar', 'Revisar correos ahora', ult ? 'Última revisión: ' + fechaCorta(ult.toISOString()) + ' ' + hora(ult.toISOString()) : 'Todavía no se ha revisado', '', 'App.revisarCorreos(this)') +
      opcion('sobre', 'Bancos que se leen', esc(AJ.bancos.join(', ') || 'Ninguno') + ' + comprobantes del préstamo', '') +
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

    h += '<div class="suave chico" style="text-align:center;margin-top:6px">Mis Finanzas · app ' + VERSION_WEB + ' · servidor ' + esc(AJ.version) + '</div>';
    $('p-ajustes').innerHTML = h;
  }

  function setTema(t) { guardar('mf-tema', t); document.documentElement.setAttribute('data-tema', t); pintar(); }
  function setPrivado(on) { guardar('mf-privado', on ? 'si' : 'no'); pintar(); }
  function setRecordatorios(on) {
    srv('guardarRecordatorios', [on], function () { AJ.recordatorios = on; toast(on ? '✅ Recordatorios activados' : 'Recordatorios desactivados'); });
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
      return srv('quitarPIN', [actual], function () { pinActivo = false; AJ.pinActivo = false; cerrar(); toast('PIN quitado'); pintar(); }, $('pin-ok'));
    }
    if (!/^\d{4,6}$/.test(nuevo)) return toast('El PIN debe tener de 4 a 6 números.');
    if (nuevo !== conf) return toast('Los dos PIN no coinciden.');
    srv('guardarPIN', [nuevo, actual], function (tok) {
      token = tok; guardar('mf-ses', tok, sessionStorage);
      pinActivo = true; AJ.pinActivo = true; cerrar(); toast('✅ PIN guardado'); pintar();
    }, $('pin-ok'));
  }

  // ------------------------------------------------------------ BLOQUEO CON PIN
  var pinEscrito = '';
  function bloquear() {
    pinEscrito = '';
    cerrar();
    $('cargando').style.display = 'none';
    $('bloqueo').classList.add('ver');
    $('logoPin').innerHTML = LOGO;
    var teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'entrar'];
    $('teclado').innerHTML = teclas.map(function (t) {
      if (t === 'borrar') return '<button class="sin" onclick="App.tecla(\'b\')" aria-label="Borrar">Borrar</button>';
      if (t === 'entrar') return '<button class="sin" style="color:var(--verde);font-weight:700" onclick="App.tecla(\'e\')">Entrar</button>';
      return '<button onclick="App.tecla(\'' + t + '\')">' + t + '</button>';
    }).join('');
    pintarPuntos();
  }
  function pintarPuntos() {
    var n = Math.max(4, pinEscrito.length);
    var h = '';
    for (var i = 0; i < n; i++) h += '<i class="' + (i < pinEscrito.length ? 'lleno' : '') + '"></i>';
    $('puntos').innerHTML = h;
  }
  function tecla(t) {
    $('pinMsg').textContent = '';
    if (t === 'b') pinEscrito = pinEscrito.slice(0, -1);
    else if (t === 'e') return entrarPIN();
    else if (pinEscrito.length < 6) pinEscrito += t;
    pintarPuntos();
  }
  function entrarPIN() {
    if (pinEscrito.length < 4) { $('pinMsg').textContent = 'El PIN tiene al menos 4 números'; return; }
    $('pinMsg').textContent = 'Verificando…';
    llamar('verificarPIN', [pinEscrito]).then(function (tok) {
      token = tok; guardar('mf-ses', tok, sessionStorage);
      $('bloqueo').classList.remove('ver');
      if (D) pintar(); else { $('cargando').style.display = 'flex'; cargar(); }
    }, function (e) {
      pinEscrito = ''; pintarPuntos();
      $('pinMsg').textContent = e && e.message ? e.message : 'PIN incorrecto';
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
    llamar('estadoAcceso').then(function (e) {
      pinActivo = e.pinActivo;
      if (pinActivo && !token) bloquear(); else cargar();
    }, function (e) {
      var m = e.message || String(e);
      if (m.indexOf('CLAVE_INVALIDA') >= 0) return mostrarConexion('La clave no es correcta.');
      $('cargando').style.display = 'none';
      $('conexion').innerHTML = '<div class="logo">' + LOGO + '</div><div style="text-align:center;max-width:360px"><b>No se pudo conectar</b><div class="suave" style="margin-top:8px">' + esc(m) + '</div></div>' +
        '<div class="acciones" style="width:100%;max-width:360px"><button class="btn" onclick="location.reload()">Reintentar</button><button class="btn sec" onclick="App.cambiarConexion()">Revisar la conexión</button></div>';
      $('conexion').classList.add('ver');
    });
  }

  function iniciar() {
    $('logoCarga').innerHTML = LOGO;
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
    recargar: function () { AJ = null; cargar(function () { toast('Datos actualizados'); }); },
    conectar: conectar, cambiarConexion: cambiarConexion,
    volver: volver, abrirItem: abrirItem, presionar: presionar, soltar: soltar, cancelarPresion: cancelarPresion,
    formAccesos: formAccesos, guardarAccesos: guardarAccesos, exportarCSV: exportarCSV,
    calcSet: calcSet, calcular: calcular, verDatos: verDatos, verYSi: verYSi,
    calcVer: function (v) { leerFormAbono(); calcVista = v; window.scrollTo(0, 0); pintar(); },
    usarCasa: function () { if (pantalla !== 'calculadora') ir('calculadora'); usarCasa(); },
    guardarSim: guardarSim, cargarSim: cargarSim, borrarSim: borrarSim, compartirPDF: compartirPDF,
    formPreparado: formPreparado, guardarPreparado: guardarPreparado
  };
})();
App.iniciar();
