/* Lector de comprobantes (fotos) y estados de cuenta de fondos (PDF). v2.3
 * Todo se lee dentro del teléfono: las fotos con Tesseract (js/vendor/ocr) y los PDF con pdf.js (js/vendor/pdfjs).
 * Las funciones "leer…" de abajo son puras (texto → datos) para poder probarlas sin navegador. */
var Lector = (function () {
  'use strict';
  var MESES = { ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3, may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6,
    ago: 7, agosto: 7, set: 8, sep: 8, sept: 8, setiembre: 8, septiembre: 8, oct: 9, octubre: 9, nov: 10, noviembre: 10, dic: 11, diciembre: 11 };

  function sinTildes(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  /** "12.000,00", "12,000.00", "d+12.000,00" (el ₡ a veces se lee como "d" o "e") → 12000 */
  function numero(t) {
    var m = String(t || '').match(/\d[\d.,\s]*\d|\d/g);
    if (!m) return null;
    var s = m[m.length - 1].replace(/\s/g, '');
    var c = s.lastIndexOf(','), p = s.lastIndexOf('.');
    if (c > -1 && p > -1) s = c > p ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (c > -1) s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else if (p > -1 && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '');
    var n = parseFloat(s);
    return isFinite(n) ? n : null;
  }
  function moneda(t) { return /US\s?\$|USD|d[oó]lar/i.test(t) || /(^|\s)\$\s?\d/.test(t) ? 'USD' : 'CRC'; }
  function fecha(texto) {
    var t = sinTildes(texto), d = null, m;
    if ((m = t.match(/(\d{1,2})\s+de\s+([a-z]+)\.?,?\s+(?:de\s+)?(\d{4})/)) && MESES[m[2]] !== undefined) d = new Date(Number(m[3]), MESES[m[2]], Number(m[1]), 12);
    else if ((m = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/))) d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
    if (d && (m = t.match(/(?:^|[^\d])(\d{1,2}):(\d{2})(?:\s*([ap])\.?\s*m)?/))) {
      var h = Number(m[1]); if (m[3] === 'p' && h < 12) h += 12; if (m[3] === 'a' && h === 12) h = 0;
      d.setHours(h, Number(m[2]), 0, 0);
    }
    return d;
  }
  function lineaCon(lineas, re) { for (var i = 0; i < lineas.length; i++) if (re.test(sinTildes(lineas[i]))) return lineas[i]; return ''; }

  /** Comprobante en foto (BCR y otros bancos) → datos para un movimiento. cuentas = D.cuentas */
  function leerComprobante(texto, cuentas) {
    var lineas = String(texto || '').split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
    var todo = sinTildes(lineas.join(' '));
    var r = { tipo: 'Gasto', monto: null, moneda: 'CRC', fecha: fecha(lineas.join(' ')), documento: '', cuenta: '', origen: '', comercio: '', nota: '', ultimos4: '' };
    if (/pago de tarjeta|pago tarjeta|pago a tarjeta/.test(todo)) r.tipo = 'Pago de tarjeta';
    else if (/sinpe/.test(todo)) r.tipo = /recib|acredit/.test(todo) ? 'Ingreso' : 'Gasto';
    else if (/transferencia/.test(todo)) r.tipo = 'Transferencia';
    // el símbolo ₡ en negrita a veces se lee como "d1" o "e7": se comparan todas las líneas de monto y gana la que más se repite
    var lms = lineas.filter(function (l) { return /monto|total|importe/.test(sinTildes(l)); });
    var cands = lms.map(function (l) {
      var t = l.replace(/^.*?(monto|total|importe)[^\d]*/i, '');
      return { n: numero(t), s: (t.match(/\d[\d.,]*\d/) || [''])[0], pagado: /pagado/i.test(l), l: l };
    }).filter(function (c) { return c.n !== null; });
    if (cands.length) {
      var elegido = cands.filter(function (c) { return c.pagado; })[0] || cands[0];
      var otros = cands.filter(function (c) { return c !== elegido; });
      var igual = otros.filter(function (c) { return Math.abs(c.n - elegido.n) < 0.005; }).length;
      if (!igual && otros.length) {
        var corto = otros.filter(function (c) { return elegido.s.length === c.s.length + 1 && elegido.s.slice(1) === c.s; })[0];
        if (corto) elegido = corto; else r.montoDudoso = true;
      }
      r.monto = elegido.n; r.moneda = moneda(elegido.l);
      r.montosLeidos = cands.map(function (c) { return c.n; });
    }
    var m = todo.match(/(documento|comprobante|referencia|n[uo]mero de (?:referencia|comprobante)|no\.)\D{0,12}(\d{5,})/);
    if (m) r.documento = m[2];
    // tarjeta (últimos 4)
    var lt = lineaCon(lineas, /tarjeta/);
    var cand = (lt.match(/\d{4}(?!.*\d{4})/) || [])[0] || (todo.match(/\*{2,}\s*(\d{4})/) || [])[1] || '';
    if (cand) {
      r.ultimos4 = cand;
      var c = (cuentas || []).filter(function (x) { return x.activa !== false && x.ultimos4 === cand; })[0];
      if (c) r.cuenta = c.nombre;
    }
    // cuenta de origen
    var lo = lineaCon(lineas, /cuenta (origen|debitada|de origen)/);
    if (lo) {
      var iban = (lo.match(/CR\s?\d[\d\s]{8,}/i) || [''])[0].replace(/\s/g, '');
      var tipoC = /\bAH\b/i.test(lo) ? 'ahorro' : /\bCC\b/i.test(lo) ? 'corriente' : '';
      r.origen = (tipoC === 'ahorro' ? 'AH ' : tipoC === 'corriente' ? 'CC ' : '') + (iban ? '•••' + iban.slice(-4) : '');
      var ah = (cuentas || []).filter(function (x) { return x.activa !== false && /ahorro|corriente|d[eé]bito/i.test(x.tipo || '') && (x.moneda || 'CRC') === r.moneda && (!iban || !x.ultimos4 || iban.slice(-4) === x.ultimos4); })[0];
      if (ah && r.tipo !== 'Pago de tarjeta') r.cuenta = r.cuenta || ah.nombre;
      if (ah) r.origenCuenta = ah.nombre;
    }
    if (r.tipo === 'Pago de tarjeta') r.comercio = 'Pago de tarjeta' + (r.ultimos4 ? ' ••' + r.ultimos4 : '');
    else {
      var ld = lineaCon(lineas, /destinatario|beneficiario|para:|comercio|a nombre de/);
      r.comercio = ld ? ld.replace(/^.*?(destinatario|beneficiario|para:|comercio|a nombre de)\s*:?\s*/i, '').trim() : (r.tipo === 'Gasto' ? 'Pago' : r.tipo);
    }
    r.nota = [r.origen ? 'Desde ' + r.origen : '', r.documento ? 'Doc. ' + r.documento : '', 'Leído de foto'].filter(String).join(' · ');
    r.lineas = lineas;
    return r;
  }

  /** Estado de cuenta de fondos (texto del PDF por líneas) → saldo propuesto por subcuenta. fondos = [{fila, nombre, fondo, saldo, moneda}] */
  function leerEstadoFondos(lineas, fondos) {
    var inf = leerInformeSAFI(lineas);
    if (inf) {
      var em = emparejarSAFI(inf, fondos);
      return { corte: inf.periodo, subcuentas: em.res, sobran: em.sobran, safi: true, montos: [], lineas: (lineas || []).filter(function (l) { return /SubCuenta|Saldo Final|^\d{2}\/\d{2}\/\d{4}/.test(l); }) };
    }
    var L = (lineas || []).map(function (l) { return String(l || '').replace(/\s+/g, ' ').trim(); }).filter(Boolean);
    var N = L.map(sinTildes);
    var montosDe = function (t) { return (t.match(/\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2}(?!\d)/g) || []).map(numero).filter(function (n) { return n !== null; }); };
    var corte = null, i, m;
    for (i = 0; i < L.length && !corte; i++) if (/(al|corte|fecha de corte|periodo|hasta)/.test(N[i])) corte = fecha(L[i]);
    var res = (fondos || []).map(function (f) {
      var nom = sinTildes(f.nombre).trim(), idx = -1;
      for (i = 0; i < N.length; i++) if (nom && N[i].indexOf(nom) >= 0) { idx = i; break; }
      if (idx < 0) {   // a veces viene partido o con mayúsculas distintas: probar con la primera palabra larga + número
        var pal = nom.split(/\s+/).filter(function (w) { return w.length > 3; });
        for (i = 0; i < N.length && pal.length; i++) if (pal.every(function (w) { return N[i].indexOf(w) >= 0; })) { idx = i; break; }
      }
      var montos = [];
      if (idx >= 0) for (var k = idx; k < Math.min(N.length, idx + 4) && !montos.length; k++) montos = montosDe(L[k]);
      var propuesto = montos.length ? Math.max.apply(null, montos) : null;
      return { fondo: f, linea: idx >= 0 ? L[idx] : '', montos: montos, propuesto: propuesto };
    });
    var todos = [];
    L.forEach(function (l) { montosDe(l).forEach(function (n) { if (todos.indexOf(n) < 0) todos.push(n); }); });
    return { corte: corte, subcuentas: res, montos: todos.sort(function (a, b) { return b - a; }).slice(0, 40), lineas: L };
  }

  /** Junta los pedacitos de texto del PDF en renglones (mismo alto con una tolerancia de 2,5 puntos). */
  function agruparLineas(items) {
    var xs = items.filter(function (it) { return it.str && it.str.trim(); }).map(function (it) { return { x: it.transform[4], y: it.transform[5], t: it.str }; })
      .sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var filas = [];
    xs.forEach(function (z) {
      var f = filas[filas.length - 1];
      if (f && Math.abs(f.y - z.y) <= 2.5) f.items.push(z); else filas.push({ y: z.y, items: [z] });
    });
    return filas.map(function (f) { return f.items.sort(function (a, b) { return a.x - b.x; }).map(function (z) { return z.t; }).join(' ').replace(/\s+/g, ' ').trim(); });
  }
  /** Informe mensual de BCR SAFI: un bloque por subcuenta con "SubCuenta NOMBRE", "Código 12345 - n" y la fila de "Saldo Final". */
  function leerInformeSAFI(lineas) {
    var L = (lineas || []).map(function (l) { return String(l || '').replace(/\s+/g, ' ').trim(); });
    var subs = [], act = null, periodo = null, i, m;
    for (i = 0; i < L.length; i++) {
      var l = L[i];
      if ((m = l.match(/C[oó]digo\s+(\d+)\s*-\s*(\d+)/i))) { act = { codigo: m[1] + '-' + m[2], sub: Number(m[2]), nombre: '', fondo: '', saldo: null, rendimientos: null, principal: null, fecha: null }; subs.push(act); }
      if (act && (m = l.match(/^SubCuenta\s+(.+?)(?:\s+Custodio\b.*)?$/i))) act.nombre = m[1].trim();
      if (act && !act.fondo && /(colones|d[oó]lares)\s*-\s*/i.test(l)) act.fondo = l.replace(/\s*-\s*(no\s+)?diversificado.*$/i, '').trim();
      if (!periodo && (m = l.match(/del\s+(\d{2}\/\d{2}\/\d{4})\s+al\s+(\d{2}\/\d{2}\/\d{4})/i))) periodo = m[2];
      if (act && /^Saldo Final$/i.test(l)) {
        // la fila con los números puede venir partida en 2 o 3 renglones
        var junto = '';
        for (var k = i + 1; k < Math.min(L.length, i + 8); k++) {
          if (/^\d{2}\/\d{2}\/\d{4}/.test(L[k]) || junto) junto += ' ' + L[k];
          var nums = junto.match(/\d{1,3}(?:,\d{3})*\.\d{2}(?!\d)/g) || [];
          if (nums.length >= 4) {
            act.fecha = (junto.match(/\d{2}\/\d{2}\/\d{4}/) || [null])[0];
            act.saldo = numero(nums[nums.length - 1]); act.rendimientos = numero(nums[nums.length - 2]); act.principal = numero(nums[nums.length - 3]);
            break;
          }
        }
      }
    }
    subs = subs.filter(function (s) { return s.saldo !== null; });
    return subs.length ? { periodo: periodo ? fecha(periodo) : null, subcuentas: subs } : null;
  }
  /** Une lo leído del informe con las subcuentas de la app (por nombre; la subcuenta 0 es la principal). */
  function emparejarSAFI(inf, fondos) {
    var usadas = {};
    var res = (fondos || []).map(function (f) {
      var n = sinTildes(f.nombre).trim();
      var s = inf.subcuentas.filter(function (x) { return !usadas[x.codigo] && sinTildes(x.nombre).trim() === n; })[0] ||
        inf.subcuentas.filter(function (x) { return !usadas[x.codigo] && n && (sinTildes(x.nombre).indexOf(n) >= 0 || n.indexOf(sinTildes(x.nombre)) >= 0); })[0] ||
        (/principal/.test(n) ? inf.subcuentas.filter(function (x) { return !usadas[x.codigo] && x.sub === 0; })[0] : null);
      if (s) usadas[s.codigo] = 1;
      return { fondo: f, safi: s || null, propuesto: s ? s.saldo : null, linea: s ? s.nombre : '' };
    });
    var sobran = inf.subcuentas.filter(function (x) { return !usadas[x.codigo]; });
    return { res: res, sobran: sobran };
  }

  // ---------------- navegador ----------------
  var BASE = 'js/vendor/';
  var trabajador = null;
  function achicar(archivo, max) {
    return createImageBitmap(archivo).then(function (bmp) {
      var esc = Math.min(1, max / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas'); c.width = Math.round(bmp.width * esc); c.height = Math.round(bmp.height * esc);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (ok) { c.toBlob(ok, 'image/png'); });
    }).then(function (b) { return b.arrayBuffer(); });
  }
  /** Foto → texto (dentro del teléfono). La primera vez descarga el lector (~8 MB) y queda guardado. */
  function leerImagen(archivo) {
    return achicar(archivo, 2200).then(function (buf) {
      if (!trabajador) trabajador = new Worker('js/ocr-worker.js');
      return new Promise(function (ok, mal) {
        trabajador.onmessage = function (e) { if (e.data.ok) ok(e.data.texto); else mal(new Error(e.data.error)); };
        trabajador.onerror = function (e) { trabajador = null; mal(new Error(e.message || 'Falló el lector')); };
        trabajador.postMessage({ base: new URL(BASE + 'ocr/', location.href).href, imagen: buf }, [buf]);
      });
    });
  }
  var pdfjsListo = null;
  function cargarPdfjs() {
    if (pdfjsListo) return pdfjsListo;
    pdfjsListo = new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = BASE + 'pdfjs/pdf.js';
      s.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + 'pdfjs/pdf.worker.js'; ok(window.pdfjsLib); };
      s.onerror = function () { pdfjsListo = null; mal(new Error('No se pudo cargar el lector de PDF')); };
      document.head.appendChild(s);
    });
    return pdfjsListo;
  }
  /** PDF → líneas de texto (agrupa por renglón). Si tiene contraseña, la pide con pedirClave(). */
  function leerPdf(archivo, pedirClave) {
    return Promise.all([cargarPdfjs(), archivo.arrayBuffer()]).then(function (v) {
      var lib = v[0];
      var tarea = lib.getDocument({ data: new Uint8Array(v[1]) });
      if (pedirClave) tarea.onPassword = function (fn) { var c = pedirClave(); if (c) fn(c); };
      return tarea.promise;
    }).then(function (doc) {
      var paginas = [];
      for (var p = 1; p <= doc.numPages; p++) paginas.push(doc.getPage(p).then(function (pg) { return pg.getTextContent(); }));
      return Promise.all(paginas);
    }).then(function (contenidos) {
      var lineas = [];
      contenidos.forEach(function (tc) { agruparLineas(tc.items).forEach(function (l) { lineas.push(l); }); });
      return lineas;
    });
  }

  return { leerComprobante: leerComprobante, leerEstadoFondos: leerEstadoFondos, leerInformeSAFI: leerInformeSAFI, agruparLineas: agruparLineas, numero: numero, fecha: fecha, leerImagen: leerImagen, leerPdf: leerPdf };
})();
if (typeof module !== 'undefined') module.exports = Lector;
