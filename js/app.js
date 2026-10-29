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
  var VERSION_WEB = '1.1.0';

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
    hoja: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>'
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
  function din(n, m, dec) { return '<span class="m">' + C.dinero(n, m, dec) + '</span>'; }
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
  var TABS = [['inicio', 'Inicio', 'inicio'], ['movimientos', 'Movimientos', 'lista'], ['tarjetas', 'Tarjetas', 'tarjeta'], ['sobres', 'Sobres', 'sobre'], ['prestamo', 'Préstamo', 'casa']];
  function ir(p, chip) {
    pantalla = p;
    if (chip) filtro.chip = chip;
    window.scrollTo(0, 0);
    pintar();
  }
  function cambiarMes(delta) { mes = new Date(mes.getFullYear(), mes.getMonth() + delta, 1); pintar(); }
  function cabMes(titulo, extra) {
    return '<div class="cab"><div><div class="sobretitulo">' + nombreMes(mes) + '</div><h1 class="titulo">' + titulo + '</h1></div>' +
      '<div class="mesnav">' + (extra || '') +
      '<button class="btn-icono" aria-label="Mes anterior" onclick="App.cambiarMes(-1)">' + ico('atras') + '</button>' +
      '<button class="btn-icono" aria-label="Mes siguiente" onclick="App.cambiarMes(1)">' + ico('adelante') + '</button></div></div>';
  }

  function pintar() {
    if (!D) return;
    var res = C.resumenMes(D, mes);
    var sob = C.sobres(D, mes, res);
    $('tabs').innerHTML = TABS.map(function (t) {
      return '<button class="' + (t[0] === pantalla ? 'on' : '') + '" onclick="App.ir(\'' + t[0] + '\')"' + (t[0] === pantalla ? ' aria-current="page"' : '') + '>' + ico(t[2]) + t[1] + '</button>';
    }).join('');
    document.querySelectorAll('.pantalla').forEach(function (s) { s.classList.toggle('activa', s.id === 'p-' + pantalla); });
    document.body.classList.toggle('privado', guardado('mf-privado', 'no') === 'si');
    $('fab').style.display = pantalla === 'inicio' || pantalla === 'movimientos' ? 'flex' : 'none';
    ({ inicio: pInicio, movimientos: pMovimientos, tarjetas: pTarjetas, sobres: pSobres, prestamo: pPrestamo, ajustes: pAjustes })[pantalla](res, sob);
  }

  // ------------------------------------------------------------ INICIO
  function pInicio(res, sob) {
    var h = cabMes('Resumen', '<button class="btn-icono" aria-label="Configuración" onclick="App.ir(\'ajustes\')">' + ico('ajustes') + '</button>');
    h += '<div class="hero"><div class="et" style="font-size:13px;font-weight:600">Gastado este mes</div>' +
      '<div style="display:flex;gap:20px;align-items:flex-end;flex-wrap:wrap"><div><div class="grande">' + din(res.total.CRC, 'CRC') + '</div><div class="et">en colones</div></div>' +
      '<div><div class="medio">' + din(res.total.USD, 'USD') + '</div><div class="et">en dólares</div></div></div>' +
      (res.cuotasTC.CRC || res.cuotasTC.USD ? '<div class="et">Incluye cuotas tasa cero: ' + din(res.cuotasTC.CRC, 'CRC') + (res.cuotasTC.USD ? ' + ' + din(res.cuotasTC.USD, 'USD') : '') + '</div>' : '') +
      '<hr><div class="fila" style="font-size:13px"><span>Ingresos ' + din(res.ingresos.CRC, 'CRC') + '</span><span class="fuerte">Te quedan ' + din(res.queda.CRC, 'CRC') + '</span></div></div>';

    if (res.porRevisar) {
      h += '<button class="aviso" onclick="App.ir(\'movimientos\',\'revisar\')"><span style="width:22px;height:22px;display:flex">' + ico('alerta') + '</span>' +
        '<span style="flex:1"><b style="font-size:14px">' + res.porRevisar + ' movimiento' + (res.porRevisar > 1 ? 's' : '') + ' por revisar</b><br><span class="chico">Gastos sin categoría</span></span>' + ico('adelante', ' style="width:18px;height:18px"') + '</button>';
    }

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
    var h = '<div class="cab"><div><div class="sobretitulo">Gastos de ' + nombreMes(mes).toLowerCase() + '</div><h1 class="titulo">Tarjetas</h1></div></div>';
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
    var h = '<div class="cab"><div><div class="sobretitulo">BCR · Operación ' + esc(p.operacion) + '</div><h1 class="titulo">Préstamo de casa</h1></div></div>';
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
    var cab = '<div class="cab"><div style="display:flex;gap:10px;align-items:center"><button class="btn-icono" aria-label="Volver" onclick="App.ir(\'inicio\')">' + ico('atras') + '</button><h1 class="titulo">Configuración</h1></div></div>';
    if (!AJ) {
      $('p-ajustes').innerHTML = cab + '<div class="caja vacio"><div class="spinner" style="margin:0 auto 10px"></div>Cargando…</div>';
      srv('obtenerAjustes', [], function (a) { AJ = a; pinActivo = a.pinActivo; if (pantalla === 'ajustes') pintar(); });
      return;
    }
    var tema = guardado('mf-tema', 'auto');
    var privado = guardado('mf-privado', 'no') === 'si';
    var h = cab;

    h += '<div class="seccion">Apariencia</div><div class="caja sinpad">' +
      opcion('luna', 'Tema', 'Automático sigue la configuración de tu teléfono', '') +
      '<div class="chips" style="padding:0 16px 14px">' + [['auto', 'Automático'], ['claro', 'Claro'], ['oscuro', 'Oscuro']].map(function (t) {
        return '<button class="chip' + (tema === t[0] ? ' on' : '') + '" onclick="App.tema(\'' + t[0] + '\')">' + t[1] + '</button>';
      }).join('') + '</div>' +
      opcion('ojo', 'Ocultar montos', 'Difumina las cantidades (útil en lugares públicos)', interruptor('aj-priv', privado, 'App.privado(this.checked)', 'Ocultar montos')) + '</div>';

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
  function setPrivado(on) { guardar('mf-privado', on ? 'si' : 'no'); document.body.classList.toggle('privado', on); }
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
    $('fab').innerHTML = ico('mas');
    document.body.classList.toggle('privado', guardado('mf-privado', 'no') === 'si');
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
    conectar: conectar, cambiarConexion: cambiarConexion
  };
})();
App.iniciar();
