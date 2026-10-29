/* Calculos — funciones puras (sin pantalla). Se prueban con: node pruebas/pruebas.test.js */
var Calc = (function () {
  var NO_GASTO = { 'Pago de tarjeta': 1, 'Compra tasa cero': 1, 'Transferencia': 1 };

  function claveMes(d) { return d.getFullYear() * 12 + d.getMonth(); }
  function enMes(iso, mes) { return !!iso && claveMes(new Date(iso)) === claveMes(mes); }
  function diasDelMes(y, m) { return new Date(y, m + 1, 0).getDate(); }

  /** Igual que EDATE de la hoja: mismo día n meses después (o el último día del mes). */
  function sumarMeses(d, n) {
    var y = d.getFullYear(), m = d.getMonth() + n;
    var yy = y + Math.floor(m / 12), mm = ((m % 12) + 12) % 12;
    return new Date(yy, mm, Math.min(d.getDate(), diasDelMes(yy, mm)));
  }

  /** Igual que DATEDIF(a, b, "M"): meses completos entre dos fechas. */
  function mesesCompletos(a, b) {
    var m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (b.getDate() < a.getDate()) m--;
    return m;
  }

  function soloFecha(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function diasEntre(a, b) { return Math.round((soloFecha(b) - soloFecha(a)) / 86400000); }

  /** Próxima vez que llega el día `dia` (hoy incluido). */
  function proximaFecha(dia, hoy) {
    if (!dia) return null;
    var y = hoy.getFullYear(), m = hoy.getMonth();
    if (hoy.getDate() > Math.min(dia, diasDelMes(y, m))) { m++; if (m > 11) { m = 0; y++; } }
    return new Date(y, m, Math.min(dia, diasDelMes(y, m)));
  }

  // ---------------- Tasa cero (con abonos extraordinarios) ----------------
  /**
   * Plan completo de una compra a tasa cero. Cada abono baja el saldo y la cuota se recalcula
   * desde la siguiente cuota: (lo que falta) ÷ (cuotas que faltan). El plazo no cambia.
   * Si un abono deja el saldo en cero, la compra queda pagada antes de tiempo.
   */
  function planTasaCero(t, hoy) {
    var meses = Math.max(1, t.meses || 1);
    var c0 = t.monto / meses;
    var abonos = (t.abonos || []).filter(function (a) { return a.fecha && a.monto > 0; })
      .slice().sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
    var primera = t.primeraCuota ? new Date(t.primeraCuota) : null;
    var saldo = t.monto, cuota = c0, ia = 0, filas = [], hist = [], liquidada = null;
    function aplicarHasta(limite) {   // abonos hechos antes de `limite` (o todos si es null)
      while (ia < abonos.length && (!limite || soloFecha(new Date(abonos[ia].fecha)) < soloFecha(limite))) {
        var ab = abonos[ia++], antes = cuota;
        var m = Math.min(ab.monto, Math.max(0, saldo));
        saldo = Math.max(0, saldo - ab.monto);
        var faltan = meses - filas.length;
        cuota = faltan > 0 ? saldo / faltan : 0;
        if (saldo <= 0.005 && !liquidada) { liquidada = new Date(ab.fecha); saldo = 0; }
        hist.push({ abono: ab, aplicado: m, cuotaAntes: antes, cuotaNueva: cuota, saldo: saldo });
      }
    }
    for (var k = 1; k <= meses; k++) {
      var f = primera ? sumarMeses(primera, k - 1) : null;
      aplicarHasta(f);
      if (saldo <= 0.005) break;
      var c = k === meses ? saldo : Math.min(cuota, saldo);
      saldo -= c;
      filas.push({ n: k, fecha: f, cuota: c, saldo: Math.max(0, saldo), cobrada: !!f && soloFecha(f) <= soloFecha(hoy) });
    }
    aplicarHasta(null);
    return { filas: filas, abonos: hist, cuotaOriginal: c0, liquidada: liquidada };
  }

  function estadoTasaCero(t, hoy) {
    var p = planTasaCero(t, hoy);
    var c0 = p.cuotaOriginal;
    var abonado = 0;
    p.abonos.forEach(function (h) { if (soloFecha(new Date(h.abono.fecha)) <= soloFecha(hoy)) abonado += h.aplicado; });
    if (!t.primeraCuota) {
      return { cuota: c0, cuotaOriginal: c0, cobradas: 0, restantes: t.meses, saldo: Math.max(0, t.monto - abonado), ultima: null,
        estado: 'Sin fecha', abonado: abonado, plan: p, pagado: abonado };
    }
    var cobradas = 0, pagadoCuotas = 0, proxima = null, ultima = null;
    p.filas.forEach(function (f) {
      if (f.cobrada) { cobradas++; pagadoCuotas += f.cuota; } else if (!proxima) proxima = f;
      ultima = f.fecha;
    });
    var saldo = Math.max(0, t.monto - pagadoCuotas - abonado);
    if (saldo < 0.005) saldo = 0;
    var restantes = saldo > 0 ? p.filas.length - cobradas : 0;
    var pagadaAntes = saldo === 0 && p.liquidada && soloFecha(p.liquidada) <= soloFecha(hoy) && cobradas < t.meses;
    return {
      cuota: proxima ? proxima.cuota : (p.filas.length ? p.filas[p.filas.length - 1].cuota : c0),
      cuotaOriginal: c0, cobradas: cobradas, restantes: restantes, saldo: saldo, ultima: ultima,
      estado: pagadaAntes ? 'Pagada' : restantes === 0 ? 'Terminada' : (cobradas === 0 ? 'Por iniciar' : 'Activa'),
      abonado: abonado, pagado: pagadoCuotas + abonado, proxima: proxima, plan: p, liquidada: pagadaAntes ? p.liquidada : null
    };
  }

  function cuotaEnMes(t, mes) {
    if (!t.primeraCuota) return 0;
    var k = claveMes(mes), s = 0;
    planTasaCero(t, new Date()).filas.forEach(function (f) { if (claveMes(f.fecha) === k) s += f.cuota; });
    return s;
  }
  /** Abonos extra de un mes que cuentan como gasto. */
  function abonosEnMes(t, mes) {
    var s = 0;
    (t.abonos || []).forEach(function (a) { if (a.gasto !== false && enMes(a.fecha, mes)) s += a.monto; });
    return s;
  }

  // ---------------- Resumen del mes ----------------
  function resumenMes(d, mes) {
    var r = {
      gastos: { CRC: 0, USD: 0 }, ingresos: { CRC: 0, USD: 0 }, cuotasTC: { CRC: 0, USD: 0 }, abonosTC: { CRC: 0, USD: 0 },
      porCategoria: {}, porCuenta: {}, porRevisar: 0, movimientos: []
    };
    d.movimientos.forEach(function (m) {
      if (!enMes(m.fecha, mes)) return;
      r.movimientos.push(m);
      var mon = m.moneda === 'USD' ? 'USD' : 'CRC';
      if (m.tipo === 'Ingreso') { r.ingresos[mon] += m.monto; return; }
      if (m.tipo !== 'Gasto') return;
      r.gastos[mon] += m.monto;
      if (!m.categoria) r.porRevisar++;
      var cat = m.categoria || 'Sin categoría';
      r.porCategoria[cat] = r.porCategoria[cat] || { CRC: 0, USD: 0 };
      r.porCategoria[cat][mon] += m.monto;
      if (m.cuenta) {
        r.porCuenta[m.cuenta] = r.porCuenta[m.cuenta] || { CRC: 0, USD: 0, cuotasTC: { CRC: 0, USD: 0 } };
        r.porCuenta[m.cuenta][mon] += m.monto;
      }
    });
    d.tasaCero.forEach(function (t) {
      var mon = t.moneda === 'USD' ? 'USD' : 'CRC';
      var ab = abonosEnMes(t, mes);
      r.abonosTC[mon] += ab;
      var c = cuotaEnMes(t, mes) + ab;   // los abonos extra cuentan como pago del mes
      if (!c) return;
      r.cuotasTC[mon] += c;
      r.porCuenta[t.tarjeta] = r.porCuenta[t.tarjeta] || { CRC: 0, USD: 0, cuotasTC: { CRC: 0, USD: 0 } };
      r.porCuenta[t.tarjeta].cuotasTC[mon] += c;
    });
    r.total = { CRC: r.gastos.CRC + r.cuotasTC.CRC, USD: r.gastos.USD + r.cuotasTC.USD };
    r.queda = { CRC: r.ingresos.CRC - r.total.CRC, USD: r.ingresos.USD - r.total.USD };
    r.movimientos.sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    return r;
  }

  // ---------------- Sobres ----------------
  function sobres(d, mes, res) {
    var esp = d.sobreEspecial || {};
    var lista = d.sobres.map(function (s) {
      var gastado = 0, asignado = s.asignado || 0;
      if (s.nombre === esp.prestamo) {
        (d.prestamo.pagos || []).forEach(function (p) { if (enMes(p.fecha, mes)) gastado += p.total; });
      } else if (s.nombre === esp.tasaCero) {
        gastado = res.cuotasTC[s.moneda] || 0;
        if (s.asignadoAuto) asignado = gastado;
      } else {
        d.movimientos.forEach(function (m) {
          if (m.sobre === s.nombre && m.moneda === s.moneda && m.tipo === 'Gasto' && enMes(m.fecha, mes)) gastado += m.monto;
        });
      }
      var pct = asignado ? gastado / asignado : null;
      var estado;
      if (s.nombre === esp.prestamo) estado = gastado > 0 ? 'Pagado' : 'Pendiente';
      else if (s.tipo === 'Fijo') estado = gastado >= asignado && asignado > 0 ? 'Pagado' : 'Pendiente';
      else estado = pct === null ? '' : pct >= 1 ? 'Agotado' : pct >= 0.85 ? 'Casi vacío' : 'OK';
      return {
        fila: s.fila, nombre: s.nombre, moneda: s.moneda, tipo: s.tipo, notas: s.notas, asignadoAuto: s.asignadoAuto,
        asignado: asignado, gastado: gastado, disponible: asignado - gastado, pct: pct, estado: estado
      };
    });
    var asignadoCRC = lista.reduce(function (a, s) { return a + (s.moneda === 'CRC' ? s.asignado : 0); }, 0);
    var asignadoUSD = lista.reduce(function (a, s) { return a + (s.moneda === 'USD' ? s.asignado : 0); }, 0);
    return {
      lista: lista, asignadoCRC: asignadoCRC, asignadoUSD: asignadoUSD,
      porRepartirCRC: res.ingresos.CRC - asignadoCRC, porRepartirUSD: res.ingresos.USD - asignadoUSD
    };
  }

  // ---------------- Formato ----------------
  function miles(entero) { return entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

  /** 18450 → "₡18.450" · 25.99 → "$25,99" */
  function dinero(n, moneda, siempreDecimales) {
    n = Number(n) || 0;
    var neg = n < 0; n = Math.abs(n);
    var usd = moneda === 'USD';
    var dec = usd || siempreDecimales || Math.round(n * 100) % 100 !== 0;
    var p = n.toFixed(dec ? 2 : 0).split('.');
    return (neg ? '−' : '') + (usd ? '$' : '₡') + miles(p[0]) + (dec ? ',' + p[1] : '');
  }

  /** Lo que escribe la persona: "18.450,50" · "18450.5" · "18,450.50" → número */
  function leerNumero(texto) {
    var t = String(texto || '').replace(/[^\d.,-]/g, '');
    if (!t) return null;
    var c = t.lastIndexOf(','), p = t.lastIndexOf('.');
    if (c > -1 && p > -1) t = c > p ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    else if (c > -1) t = /,\d{1,2}$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    else if (p > -1 && !/\.\d{1,2}$/.test(t)) t = t.replace(/\./g, '');
    var n = parseFloat(t);
    return isFinite(n) ? n : null;
  }

  // ---------------- Calculadora de préstamos ----------------
  function cuotaNivelada(saldo, i, n) {
    if (n <= 0) return saldo;
    return i === 0 ? saldo / n : saldo * i / (1 - Math.pow(1 + i, -n));
  }

  /**
   * Tabla de amortización mes a mes.
   * p = { monto, plazo (meses), tasaMensual (fracción), tipo: 'fija'|'decreciente',
   *       poliza: { monto, tipo: 'fijo'|'pct' (pct = fracción mensual del saldo) },
   *       comision, primerPago (Date),
   *       abono: { monto, frecuencia: 'mensual'|'anual'|'unica', mes, modo: 'plazo'|'cuota' } }
   */
  function amortizar(p) {
    var i = Number(p.tasaMensual) || 0;
    var n = Math.max(1, Math.round(Number(p.plazo) || 1));
    var saldo = Number(p.monto) || 0;
    var tipo = p.tipo === 'decreciente' ? 'decreciente' : 'fija';
    var pol = p.poliza || {};
    var ab = p.abono && Number(p.abono.monto) > 0 ? p.abono : null;
    var cuota = cuotaNivelada(saldo, i, n);
    var capFijo = saldo / n;
    var filas = [], tInt = 0, tPol = 0, tAb = 0;
    var inicio = p.primerPago ? new Date(p.primerPago) : null;
    for (var k = 1; k <= n && saldo > 0.005; k++) {
      var interes = saldo * i;
      var capital = tipo === 'fija' ? cuota - interes : capFijo;
      if (capital > saldo || k === n) capital = saldo;
      var poliza = pol.tipo === 'pct' ? saldo * (Number(pol.monto) || 0) : (Number(pol.monto) || 0);
      var extra = 0;
      if (ab) {
        var toca = ab.frecuencia === 'mensual' || (ab.frecuencia === 'anual' && k % 12 === 0) ||
                   (ab.frecuencia === 'unica' && k === Math.max(1, Math.round(Number(ab.mes) || 1)));
        if (toca) extra = Math.min(Number(ab.monto), saldo - capital);
      }
      saldo = saldo - capital - extra;
      if (saldo < 0.005) saldo = 0;
      tInt += interes; tPol += poliza; tAb += extra;
      filas.push({
        n: k, fecha: inicio ? sumarMeses(inicio, k - 1) : null,
        cuota: capital + interes, capital: capital, interes: interes, poliza: poliza, abono: extra,
        pago: capital + interes + poliza + extra, saldo: saldo
      });
      if (extra > 0 && saldo > 0 && ab.modo === 'cuota') {
        cuota = cuotaNivelada(saldo, i, n - k);
        capFijo = saldo / (n - k);
      }
    }
    var comision = Number(p.comision) || 0;
    var monto = Number(p.monto) || 0;
    return {
      filas: filas, meses: filas.length,
      cuota: filas.length ? filas[0].cuota : 0,
      cuotaConPoliza: filas.length ? filas[0].cuota + filas[0].poliza : 0,
      ultimaCuota: filas.length ? filas[filas.length - 1].cuota : 0,
      totalIntereses: tInt, totalPolizas: tPol, totalAbonos: tAb, comision: comision,
      totalPagado: monto + tInt + tPol + comision
    };
  }

  function pct(n, dec) { return n === null || n === undefined ? '—' : (n * 100).toFixed(dec === undefined ? 2 : dec).replace('.', ',') + '%'; }

  return {
    claveMes: claveMes, enMes: enMes, sumarMeses: sumarMeses, mesesCompletos: mesesCompletos, diasEntre: diasEntre,
    proximaFecha: proximaFecha, estadoTasaCero: estadoTasaCero, cuotaEnMes: cuotaEnMes, resumenMes: resumenMes,
    sobres: sobres, dinero: dinero, leerNumero: leerNumero, pct: pct, NO_GASTO: NO_GASTO,
    amortizar: amortizar, cuotaNivelada: cuotaNivelada, planTasaCero: planTasaCero, abonosEnMes: abonosEnMes
  };
})();
if (typeof module !== 'undefined') module.exports = Calc;
