/* PDF de la calculadora de préstamos (usa pdf-lib, carpeta js/vendor).
 * construirPDFPrestamo(PDFLib, datos, opciones) → Promise<Uint8Array>
 * datos   = { para, concepto, moneda, monto, plazo, tasaTexto, polizaTexto, tipoTexto, comision, res }
 * opciones= { preparadoPor, fecha (Date), logoPng (Uint8Array|null) }
 * Se usa la letra Helvetica del PDF; como no trae el símbolo ₡, los colones se escriben con ¢
 * (como se acostumbra en Costa Rica). */
var PDFPrestamo = (function () {
  'use strict';
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
  var MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

  function miles(e) { return e.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function num(n) { var p = (Math.round((Number(n) || 0) * 100) / 100).toFixed(2).split('.'); return miles(p[0]) + ',' + p[1]; }
  function dinero(n, moneda) { return (moneda === 'USD' ? '$' : '¢') + num(n); }
  function fechaCorta(d) { return d ? MESES[d.getMonth()] + ' ' + d.getFullYear() : ''; }
  function fechaLarga(d) { return d.getDate() + ' de ' + MESES_L[d.getMonth()] + ' de ' + d.getFullYear(); }
  /** Quita caracteres que Helvetica no puede escribir. */
  function limpio(t) {
    return String(t || '').replace(/₡/g, '¢').replace(/[≈]/g, '~').replace(/[^\x20-\x7E -ÿ–—‘’“”•…€]/g, '');
  }

  function construir(PDFLib, d, op) {
    var rgb = PDFLib.rgb;
    var NEGRO = rgb(0.071, 0.078, 0.09), AMARILLO = rgb(0.961, 0.722, 0.18), BLANCO = rgb(1, 1, 1);
    var GRIS = rgb(0.357, 0.388, 0.431), LINEA = rgb(0.902, 0.914, 0.929), SUAVE = rgb(0.949, 0.957, 0.965);
    var CREMA = rgb(1, 0.965, 0.871), GRIS_CLARO = rgb(0.72, 0.745, 0.776);
    var W = 612, H = 792, M = 36;
    var res = d.res, filas = res.filas;

    return PDFLib.PDFDocument.create().then(function (doc) {
      doc.setTitle(limpio('Simulación de préstamo - ' + (d.concepto || '')));
      doc.setCreator('Finanzas');
      return Promise.all([
        doc.embedFont(PDFLib.StandardFonts.Helvetica),
        doc.embedFont(PDFLib.StandardFonts.HelveticaBold),
        op.logoPng ? doc.embedPng(op.logoPng).catch(function () { return null; }) : Promise.resolve(null)
      ]).then(function (f) {
        var R = f[0], B = f[1], logo = f[2];

        function texto(pg, t, x, y, tam, fuente, color, alinear) {
          t = limpio(t);
          var ancho = fuente.widthOfTextAtSize(t, tam);
          var xx = alinear === 'der' ? x - ancho : alinear === 'centro' ? x - ancho / 2 : x;
          pg.drawText(t, { x: xx, y: y, size: tam, font: fuente, color: color || NEGRO });
        }
        function ajustar(t, fuente, tam, max) {
          t = limpio(t);
          while (t.length > 3 && fuente.widthOfTextAtSize(t, tam) > max) t = t.slice(0, -2) + '…';
          return t;
        }

        // columnas de la tabla
        var cols = [
          { t: '#', x: M + 8, a: 'izq' }, { t: 'Fecha', x: M + 34, a: 'izq' },
          { t: 'Cuota', x: M + 190, a: 'der' }, { t: 'Capital', x: M + 262, a: 'der' },
          { t: 'Interés', x: M + 330, a: 'der' }, { t: 'Pólizas', x: M + 394, a: 'der' },
          { t: 'Abono', x: M + 452, a: 'der' }, { t: 'Saldo', x: W - M - 8, a: 'der' }
        ];
        var hayAbono = res.totalAbonos > 0;
        if (!hayAbono) { cols.splice(6, 1); cols[5].x = M + 420; cols[4].x = M + 345; cols[3].x = M + 270; }

        var notas = ['Tipo de cuota: ' + d.tipoTexto + (res.meses !== d.plazo ? ' · Se termina de pagar en ' + res.meses + ' meses' : '')];
        if (res.totalAbonos > 0) notas.push('Incluye abonos extra por ' + dinero(res.totalAbonos, d.moneda));
        if (d.comision) notas.push('Comisión de formalización: ' + dinero(d.comision, d.moneda) + ' (incluida en el total)');
        var HDR = d.para ? 128 : 104;                  // alto del encabezado negro
        var DY = HDR - 92;                              // cuánto baja todo lo demás
        var GRAF = 150;                                 // alto del bloque de gráficos
        var FILA = 15, PRIMERA_Y = H - 252 - DY - GRAF - notas.length * 13 - 22, OTRAS_Y = 700, PIE = 70;
        var porPrimera = Math.floor((PRIMERA_Y - PIE) / FILA);
        var porOtra = Math.floor((OTRAS_Y - PIE) / FILA);
        var paginas = 1 + Math.max(0, Math.ceil((filas.length - porPrimera) / porOtra));

        // ancho real de los montos de cada columna, para centrar el título encima de ellos
        var anchoCol = cols.map(function (c, j) {
          var m = 0;
          filas.forEach(function (r) { var v = valores(r)[j]; m = Math.max(m, (j === cols.length - 1 ? B : R).widthOfTextAtSize(limpio(v), 8.5)); });
          return Math.max(m, B.widthOfTextAtSize(limpio(c.t), 8));
        });
        function encabezadoTabla(pg, y) {
          pg.drawRectangle({ x: M, y: y - 5, width: W - 2 * M, height: 18, color: NEGRO });
          cols.forEach(function (c, j) {
            var centro = c.a === 'der' ? c.x - anchoCol[j] / 2 : c.x + anchoCol[j] / 2;
            texto(pg, c.t, centro, y, 8, B, BLANCO, 'centro');
          });
          return y - FILA - 2;
        }
        function pie(pg, n) {
          pg.drawLine({ start: { x: M, y: 46 }, end: { x: W - M, y: 46 }, thickness: 0.7, color: LINEA });
          texto(pg, 'Cálculo estimado (' + d.tipoTexto.toLowerCase() + '). No es una oferta de ninguna entidad financiera.', M, 32, 8, R, GRIS);
          texto(pg, 'Página ' + n + ' de ' + paginas, W - M, 32, 8, R, GRIS, 'der');
        }
        function valores(r) {
          var v = [String(r.n), fechaCorta(r.fecha), num(r.cuota + r.poliza), num(r.capital), num(r.interes), num(r.poliza)];
          if (hayAbono) v.push(r.abono ? num(r.abono) : '-');
          v.push(num(r.saldo));
          return v;
        }
        function fila(pg, r, y, par) {
          if (par) pg.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: FILA, color: SUAVE });
          var v = valores(r);
          cols.forEach(function (c, j) { texto(pg, v[j], c.x, y, 8.5, j === cols.length - 1 ? B : R, NEGRO, c.a === 'der' ? 'der' : null); });
        }

        // ---------- Página 1 ----------
        var pg = doc.addPage([W, H]);
        pg.drawRectangle({ x: 0, y: H - HDR, width: W, height: HDR, color: NEGRO });
        pg.drawRectangle({ x: 0, y: H - HDR - 4, width: W, height: 4, color: AMARILLO });
        var xt = M;
        if (logo) { pg.drawImage(logo, { x: M, y: H - 72, width: 44, height: 44 }); xt = M + 58; }
        var anchoT = W - xt - M - 130;                  // deja libre la fecha de la derecha
        texto(pg, 'SIMULACIÓN DE PRÉSTAMO', xt, H - 38, 9, B, AMARILLO);
        if (d.concepto) texto(pg, ajustar(d.concepto.toUpperCase(), B, 9, anchoT), xt, H - 52, 9, B, AMARILLO);
        var titulo = d.para ? 'Preparado para ' + d.para : (d.concepto || 'Simulación de préstamo');
        if (d.para) {
          texto(pg, 'Preparado para', xt, H - 80, 15, R, BLANCO);
          var tam = 19; while (tam > 12 && B.widthOfTextAtSize(limpio(d.para), tam) > W - xt - M) tam -= 1;
          texto(pg, ajustar(d.para, B, tam, W - xt - M), xt, H - 104, tam, B, BLANCO);
        } else texto(pg, ajustar(titulo, B, 19, anchoT), xt, H - 80, 19, B, BLANCO);
        if (op.preparadoPor) texto(pg, 'Preparado por ' + op.preparadoPor, W - M, H - 42, 9, R, GRIS_CLARO, 'der');
        texto(pg, fechaLarga(op.fecha || new Date()), W - M, op.preparadoPor ? H - 56 : H - 42, 9, R, GRIS_CLARO, 'der');

        // datos
        var datos = [['MONTO', dinero(d.monto, d.moneda)], ['PLAZO', d.plazo + ' meses'], ['TASA', d.tasaTexto], ['PÓLIZAS', d.polizaTexto]];
        var anchoD = (W - 2 * M) / 4;
        datos.forEach(function (x, j) {
          texto(pg, x[0], M + j * anchoD, H - 128 - DY, 8, B, GRIS);
          texto(pg, ajustar(x[1], B, 12, anchoD - 8), M + j * anchoD, H - 145 - DY, 12, B, NEGRO);
        });

        // resumen
        var cajas = [
          ['CUOTA MENSUAL' + (res.totalPolizas ? ' (CON PÓLIZAS)' : ''), dinero(res.cuotaConPoliza, d.moneda), CREMA],
          ['TOTAL INTERESES', dinero(res.totalIntereses, d.moneda), SUAVE],
          ['TOTAL A PAGAR', dinero(res.totalPagado, d.moneda), SUAVE]
        ];
        var anchoC = (W - 2 * M - 20) / 3;
        cajas.forEach(function (c, j) {
          var x = M + j * (anchoC + 10);
          pg.drawRectangle({ x: x, y: H - 228 - DY, width: anchoC, height: 56, color: c[2] });
          texto(pg, c[0], x + 10, H - 190 - DY, 7.5, B, GRIS);
          texto(pg, c[1], x + 10, H - 214 - DY, 15, B, NEGRO);
        });

        // gráficos: saldo con el tiempo (con y sin abonos) y capital/intereses por año
        var gTop = H - 244 - DY, gAlto = 104, gAncho = (W - 2 * M - 24) / 2;
        var NARANJA = rgb(0.878, 0.635, 0.11), AZUL = rgb(0.357, 0.553, 0.937);
        var corto = function (v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '').replace('.', ',') + 'M' : v >= 1000 ? Math.round(v / 1000) + 'k' : String(Math.round(v)); };
        // izquierda
        texto(pg, d.base ? 'Saldo con y sin abonos' : 'Saldo con el tiempo', M, gTop, 9.5, B, NEGRO);
        var gx0 = M + 30, gx1 = M + gAncho, gy0 = gTop - 14, gy1 = gTop - 14 - gAlto;
        var nMax = Math.max(filas.length, d.base ? d.base.filas.length : 0), sMax = d.monto || 1;
        [0, 0.5, 1].forEach(function (k) {
          var yy = gy1 + (gy0 - gy1) * k;
          pg.drawLine({ start: { x: gx0, y: yy }, end: { x: gx1, y: yy }, thickness: 0.5, color: LINEA });
          texto(pg, (d.moneda === 'USD' ? '$' : '') + corto(sMax * k), gx0 - 4, yy - 3, 7, R, GRIS, 'der');
        });
        function lineaSaldo(lista, color, grosor) {
          var px = function (k) { return gx0 + (gx1 - gx0) * k / nMax; }, py = function (v) { return gy1 + (gy0 - gy1) * Math.max(0, v) / sMax; };
          var prev = { x: px(0), y: py(sMax) };
          lista.forEach(function (r) { var cur = { x: px(r.n), y: py(r.saldo) }; pg.drawLine({ start: prev, end: cur, thickness: grosor, color: color }); prev = cur; });
        }
        if (d.base) lineaSaldo(d.base.filas, GRIS_CLARO, 2);
        lineaSaldo(filas, NARANJA, 2.2);
        var anios = nMax / 12;
        [0, 0.5, 1].forEach(function (k) { texto(pg, k ? (Math.round(anios * k * 10) / 10 + ' años').replace('.', ',') : 'hoy', gx0 + (gx1 - gx0) * k, gy1 - 11, 7, R, GRIS, k === 1 ? 'der' : k ? 'centro' : null); });
        if (d.base) {
          pg.drawRectangle({ x: gx0, y: gy1 - 25, width: 7, height: 7, color: GRIS_CLARO }); texto(pg, ('sin abonos (' + Math.round(d.base.meses / 12 * 10) / 10 + ' años)').replace('.', ','), gx0 + 10, gy1 - 24, 7.5, R, GRIS);
          pg.drawRectangle({ x: gx0 + 120, y: gy1 - 25, width: 7, height: 7, color: NARANJA }); texto(pg, ('con abonos (' + Math.round(res.meses / 12 * 10) / 10 + ' años)').replace('.', ','), gx0 + 130, gy1 - 24, 7.5, R, GRIS);
        }
        // derecha: barras por año
        var bx0 = M + gAncho + 24, bx1 = W - M;
        texto(pg, 'Capital e intereses por año', bx0, gTop, 9.5, B, NEGRO);
        var porAnio = [];
        filas.forEach(function (r) { var k = Math.floor((r.n - 1) / 12); porAnio[k] = porAnio[k] || { c: 0, i: 0 }; porAnio[k].c += r.capital + (r.abono || 0); porAnio[k].i += r.interes; });
        var bMax = Math.max.apply(null, porAnio.map(function (x) { return x.c + x.i; })) || 1;
        var bw = (bx1 - bx0) / Math.max(1, porAnio.length);
        porAnio.forEach(function (x, k) {
          var hC = gAlto * x.c / bMax, hI = gAlto * x.i / bMax, xx = bx0 + k * bw + bw * 0.12;
          pg.drawRectangle({ x: xx, y: gy1, width: bw * 0.76, height: hC, color: AZUL });
          pg.drawRectangle({ x: xx, y: gy1 + hC, width: bw * 0.76, height: hI, color: NARANJA });
        });
        texto(pg, 'año 1', bx0, gy1 - 11, 7, R, GRIS);
        texto(pg, 'año ' + porAnio.length, bx1, gy1 - 11, 7, R, GRIS, 'der');
        pg.drawRectangle({ x: bx0, y: gy1 - 25, width: 7, height: 7, color: AZUL }); texto(pg, 'capital', bx0 + 10, gy1 - 24, 7.5, R, GRIS);
        pg.drawRectangle({ x: bx0 + 60, y: gy1 - 25, width: 7, height: 7, color: NARANJA }); texto(pg, 'intereses', bx0 + 70, gy1 - 24, 7.5, R, GRIS);

        // notas
        var yN = H - 252 - DY - GRAF;
        notas.forEach(function (t) { texto(pg, t, M, yN, 9, R, GRIS); yN -= 13; });

        // tabla
        var y = encabezadoTabla(pg, PRIMERA_Y + 8);
        var i = 0, n = 1;
        for (; i < filas.length && i < porPrimera; i++) { fila(pg, filas[i], y, i % 2 === 1); y -= FILA; }
        pie(pg, n);
        while (i < filas.length) {
          pg = doc.addPage([W, H]); n++;
          texto(pg, ajustar(titulo, B, 11, W - 2 * M - 160), M, H - 44, 11, B, NEGRO);
          texto(pg, 'Tabla mes a mes (continuación)', W - M, H - 44, 9, R, GRIS, 'der');
          y = encabezadoTabla(pg, OTRAS_Y + 8);
          for (var c = 0; c < porOtra && i < filas.length; c++, i++) { fila(pg, filas[i], y, i % 2 === 1); y -= FILA; }
          pie(pg, n);
        }
        return doc.save();
      });
    });
  }

  function nombreArchivo(d) {
    var t = ['Simulacion', d.concepto, d.para].filter(Boolean).join('-');
    t = t.normalize ? t.normalize('NFD').replace(/[̀-ͯ]/g, '') : t;
    return t.replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) + '.pdf';
  }

  return { construir: construir, nombreArchivo: nombreArchivo, dinero: dinero };
})();
if (typeof module !== 'undefined') module.exports = PDFPrestamo;
