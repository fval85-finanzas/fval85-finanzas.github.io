/* Calculos — funciones puras (sin pantalla). Se prueban con: node pruebas/pruebas.test.js */
var Calc = (function () {
  var NO_GASTO = { 'Pago de tarjeta': 1, 'Compra tasa cero': 1, 'Cuota tasa cero': 1, 'Transferencia': 1 };

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
    var abonos = (t.abonos || []).filter(function (a) { return a.fecha && a.monto > 0 && tipoAbono(a) === 'abono'; })
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
    (t.abonos || []).forEach(function (a) { if (tipoAbono(a) === 'abono' && a.gasto !== false && enMes(a.fecha, mes)) s += a.monto; });
    return s;
  }

  /** v2.15 (#62): 'abono' baja la cuota · 'adelanto' el banco mantiene la cuota (queda a favor) · 'pago' parte de un pago a la cuota. */
  function tipoAbono(a) { return a && (a.tipo === 'adelanto' || a.tipo === 'pago') ? a.tipo : 'abono'; }

  /**
   * v2.15 (#62): la cuenta de lo que VOS le pusiste a una compra tasa cero (pagos repartidos + adelantos + abonos).
   * null si la compra no tiene pagos ni adelantos anotados.
   * Las cuotas cobradas antes de empezar a llevar la cuenta se toman como pagadas completas.
   * Las cuotas cobradas después del último pago anotado quedan "por pagar" (todavía no les toca el adelanto).
   */
  function cuentaTasaCero(t, hoy) {
    var lim = soloFecha(hoy);
    var pagos = [], adel = [];
    (t.abonos || []).forEach(function (a) {
      if (!a.fecha || !(a.monto > 0) || soloFecha(new Date(a.fecha)) > lim) return;
      var k = tipoAbono(a); if (k === 'pago') pagos.push(a); else if (k === 'adelanto') adel.push(a);
    });
    if (!pagos.length && !adel.length) return null;
    var porFecha = function (a, b) { return new Date(a.fecha) - new Date(b.fecha); };
    pagos.sort(porFecha); adel.sort(porFecha);
    var e = estadoTasaCero(t, hoy);
    var filas = e.plan.filas.filter(function (f) { return f.fecha; });
    // la cuota que paga un pago: la del plan con fecha más cercana (±40 días)
    var cubre = function (fecha) {
      var d0 = soloFecha(new Date(fecha)), mejor = null, dm = 41;
      filas.forEach(function (f) { var d = Math.abs(diasEntre(f.fecha, d0)); if (d < dm) { dm = d; mejor = soloFecha(f.fecha); } });
      return mejor || d0;
    };
    var inicio = null;
    if (adel.length) inicio = soloFecha(new Date(adel[0].fecha));
    if (pagos.length) { var ip = cubre(pagos[0].fecha); if (!inicio || ip < inicio) inicio = ip; }
    var limite = null;
    pagos.forEach(function (a) { var c = cubre(a.fecha); if (!limite || c > limite) limite = c; });
    if (!limite) limite = lim;
    var antes = 0, cobrado = 0, porPagar = 0, nPorPagar = 0, cobradoTotal = 0, nCobradas = 0;
    filas.forEach(function (f) {
      var d = soloFecha(f.fecha);
      if (f.cobrada) { cobradoTotal += f.cuota; nCobradas++; }
      if (d < inicio) { if (f.cobrada) antes += f.cuota; }
      else if (d <= limite) cobrado += f.cuota;
      else if (f.cobrada) { porPagar += f.cuota; nPorPagar++; }
    });
    var faltanCuotas = filas.filter(function (f) { return soloFecha(f.fecha) > limite; }).length;
    var sumP = pagos.reduce(function (s, a) { return s + a.monto; }, 0);
    var sumA = adel.reduce(function (s, a) { return s + a.monto; }, 0);
    var usado = Math.min(sumA, Math.max(0, cobrado - sumP));
    var queda = sumA + Math.max(0, sumP - cobrado) - usado;
    var sinCubrir = Math.max(0, cobrado - sumP - sumA);
    var puesto = antes + sumP + sumA + e.abonado;
    var ultimo = pagos.length ? pagos[pagos.length - 1].monto : 0;
    var r = {
      pagos: pagos, adelantos: adel, cobradoTotal: cobradoTotal, nCobradas: nCobradas, antes: antes, pagado: sumP, adelanto: sumA,
      usado: usado, queda: queda < 0.005 ? 0 : queda, sinCubrir: sinCubrir < 0.005 ? 0 : sinCubrir, porPagar: porPagar, nPorPagar: nPorPagar,
      abonos: e.abonado, puesto: puesto, falta: Math.max(0, t.monto - puesto), ultimoPago: ultimo, cuota: e.cuota, restantes: faltanCuotas, estado: e
    };
    if (r.falta < 0.005) r.falta = 0;
    // ¿para cuánto alcanza el adelanto si seguís pagando lo mismo?
    var dif = e.cuota - ultimo;
    if (r.queda > 0 && ultimo > 0 && dif > 0.005 && faltanCuotas > 0) {
      r.meses = Math.floor(r.queda / dif + 1e-9);
      r.alcanza = r.meses >= faltanCuotas;
      r.sobra = r.alcanza ? r.queda - dif * faltanCuotas : 0;
    }
    return r;
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
      if (m.tipo === 'Ingreso') { if (!esCobro(m) && !esFamilia(m)) r.ingresos[mon] += m.monto; return; }   // v2.18: una devolución en la tarjeta de la familia no es ingreso tuyo
      if (m.tipo !== 'Gasto' || m.para || esFamilia(m) || efectivoPropioViaje(m)) return;     // v2.10.6: tarjetas de la familia solo cuentan en viajes · v2.2: lo comprado para otra persona no es gasto mío
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
          if (m.sobre === s.nombre && m.moneda === s.moneda && m.tipo === 'Gasto' && !esFamilia(m) && enMes(m.fecha, mes)) gastado += m.monto;
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


  // ---------------- Sobres con saldo (v1.6) ----------------
  /*
   * Cada sobre tiene plata real: saldo inicial + lo que entra − lo que sale, desde la fecha de inicio (D.sobresDesde).
   *  - Las compras con TARJETA DE CRÉDITO no tocan los sobres: se descuentan al asignar el PAGO de la tarjeta.
   *  - Un movimiento puede asignarse con filas en "Movimientos de sobres" (D.sobresMov, ligadas por `movimiento`)
   *    o, si no tiene esas filas, con su columna Sobre (reglas del correo).
   *  - Los pagos del préstamo salen solos del sobre de la cuota de la casa.
   */
  function esTarjeta(d, nombre) {
    return (d.cuentas || []).some(function (c) { return normNom(c.nombre) === normNom(nombre) && c.tipo === 'Tarjeta de crédito'; });
  }
  /** ¿Este movimiento se reparte en sobres? 'entra' | 'sale' | null */
  /** ¿Este movimiento se reparte en sobres? 'entra' | 'sale' | null */
  function esCobro(m) { return /^Pago de /.test(m.cobro || ''); }
  function sentidoSobre(d, m) {
    if (esSacarMeter(m) || esCompraTarjeta(d, m)) return null;   // v2.8.0
    if (m.para && m.tipo !== 'Ingreso') return null;   // v2.2: comprado para otra persona: no toca sobres
    if (esFamilia(m)) return null;   // v2.10.6
    if (efectivoPropioViaje(m)) return null;   // v2.10.7
    if (m.tipo === 'Ingreso' || m.tipo === 'Retiro de fondo') return 'entra';
    if (m.tipo === 'Inversión' || m.tipo === 'Pago de tarjeta' || m.tipo === 'Gasto') return 'sale';
    if (m.tipo === 'Transferencia') return entraTransferencia(m) ? 'entra' : 'sale';
    return null;
  }
  /**
   * v1.8: las compras con TARJETA también se asignan a un sobre (el sobre baja en el momento) y ese monto queda
   * "reservado" para la tarjeta. Cuando llega el pago de la tarjeta, lo reservado lo cubre solo (no se descuenta dos veces);
   * solo se pregunta por lo que falte (intereses, cuotas tasa cero, compras sin sobre).
   */
  /**
   * v2.8.0 · ESPEJO DEL BANCO: los sobres son los sobres del BCR.
   *  - Las compras con tarjeta NO tocan sobres (solo deuda). Lo que se haya asignado antes a compras con tarjeta se ignora.
   *  - Se pregunta por sobre solo lo que entra o sale de la cuenta principal (salario, SINPE, transferencias, pagos desde el BCR).
   *  - "Sobre → disponible" (sacar) y "Disponible → sobre" (meter) son filas de Movimientos que mueven el sobre sin tocar el total de la cuenta.
   */
  var TIPO_SACAR = 'Sobre → disponible', TIPO_METER = 'Disponible → sobre';
  function esSacarMeter(m) { return m && (m.tipo === TIPO_SACAR || m.tipo === TIPO_METER); }
  function esCompraTarjeta(d, m) { return !!m && (m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero') && esTarjeta(d, m.cuenta); }
  function origenesDe(d) { return origenes(d, ((d.ajustes || {}).prefs || {}).origenes); }
  function analizarSobres(d, o) {
    var desde = d.sobresDesde ? soloFecha(new Date(d.sobresDesde)) : null;
    var efectos = [], porMov = {}, pendientes = [], porFila = {};
    (d.movimientos || []).forEach(function (m) { porFila[m.fila] = m; });
    (d.sobresMov || []).forEach(function (x) {
      var mm = x.movimiento ? porFila[x.movimiento] : null;
      if (mm && esCompraTarjeta(d, mm)) return;   // asignaciones viejas de compras con tarjeta: ya no cuentan
      if (x.movimiento) (porMov[x.movimiento] = porMov[x.movimiento] || []).push(x);
      if (x.sobre) efectos.push({ sobre: x.sobre, monto: x.monto, fecha: x.fecha, tipo: x.tipo, grupo: x.grupo, movimiento: x.movimiento || null, nota: x.nota });
    });
    (d.movimientos || []).forEach(function (m) {   // sacar / meter
      if (!esSacarMeter(m) || !m.sobre || !m.fecha) return;
      efectos.push({ sobre: m.sobre, monto: m.tipo === TIPO_SACAR ? -m.monto : m.monto, fecha: m.fecha, tipo: m.tipo === TIPO_SACAR ? 'Sacar' : 'Meter', movimiento: m.fila, nota: m.comercio });
    });
    if (!desde) return { efectos: efectos, pendientes: [], porMov: porMov, desde: null, reservado: {}, cubierto: {} };
    o = o || origenesDe(d);
    var neto = {};   // lo que cada movimiento hizo en la cuenta principal
    if (o.principal) efectosCuentas(d, o).forEach(function (e) { if (e.cuenta === o.principal && e.mov && e.mov.fila) neto[e.mov.fila] = (neto[e.mov.fila] || 0) + e.signo * e.monto; });
    else (d.movimientos || []).forEach(function (m) {   // sin cuenta de ahorro en la hoja: como antes, por el tipo
      var s = sentidoSobre(d, m); if (s) neto[m.fila] = (s === 'entra' ? 1 : -1) * (m.monto || 0);
    });
    var movs = (d.movimientos || []).filter(function (m) { return m.fecha && soloFecha(new Date(m.fecha)) >= desde && !esSacarMeter(m) && !esCompraTarjeta(d, m) && !(m.para && m.tipo !== 'Ingreso') && !esFamilia(m) && Math.abs(neto[m.fila] || 0) > 0.005; })
      .slice().sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
    movs.forEach(function (m) {
      var n = neto[m.fila], sentido = n > 0 ? 'entra' : 'sale', total = Math.abs(n);
      var filas = porMov[m.fila] || [];
      var explicito = filas.reduce(function (a, x) { return a + Math.abs(x.monto); }, 0);
      if (!filas.length && m.sobre && m.tipo !== 'Pago de tarjeta') {
        var nombre = m.sobre;
        if (m.tipo === 'Inversión' && (d.sobreEspecial || {}).fondos && !(d.sobres || []).some(function (s) { return s.nombre === nombre; })) nombre = d.sobreEspecial.fondos;
        efectos.push({ sobre: nombre, monto: sentido === 'entra' ? total : -total, fecha: m.fecha, tipo: m.tipo === 'Inversión' ? 'Inversión' : 'Regla', movimiento: m.fila });
        explicito = total;
      }
      var falta = total - explicito;
      if (falta > 0.005) pendientes.push({ mov: m, sentido: sentido, falta: falta, asignado: explicito, reservadoUsado: 0, tarjeta: false });
    });
    var esp = (d.sobreEspecial || {}).prestamo;
    if (esp && d.prestamo) (d.prestamo.pagos || []).forEach(function (p) {
      if (p.fecha && soloFecha(new Date(p.fecha)) >= desde && p.total) efectos.push({ sobre: esp, monto: -p.total, fecha: p.fecha, tipo: 'Préstamo' });
    });
    pendientes.sort(function (a, b) { return new Date(b.mov.fecha) - new Date(a.mov.fecha); });
    return { efectos: efectos, pendientes: pendientes, porMov: porMov, desde: desde, reservado: {}, cubierto: {} };
  }
  /** Lo que había en los sobres (en colones) al final del día `fecha` */
  function sobresAl(d, fecha, o) {
    var corte = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1), an = analizarSobres(d, o), tot = 0, cr = {};
    (d.sobres || []).forEach(function (s) { if ((s.moneda || 'CRC') === 'CRC') { cr[s.nombre] = 1; tot += s.saldoInicial || 0; } });
    an.efectos.forEach(function (e) { if (cr[e.sobre] && e.fecha && new Date(e.fecha) < corte) tot += e.monto; });
    return tot;
  }
  /** Saldo de cada sobre al final del mes `mes` (o hoy) y lo que entró / salió en ese mes. */
  function saldosSobres(d, mes, hoy, o) {
    var an = analizarSobres(d, o);
    var ini = new Date(mes.getFullYear(), mes.getMonth(), 1), fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);
    var lista = (d.sobres || []).map(function (s) {
      var o = { fila: s.fila, nombre: s.nombre, moneda: s.moneda, tipo: s.tipo, asignado: s.asignado || 0, asignadoAuto: s.asignadoAuto,
        meta: s.meta || null, ajuste: !!s.ajuste, notas: s.notas, saldoInicial: s.saldoInicial || 0,
        saldo: s.saldoInicial || 0, inicioMes: s.saldoInicial || 0, entradas: 0, salidas: 0, movs: [] };
      an.efectos.forEach(function (e) {
        if (e.sobre !== s.nombre) return;
        var f = new Date(e.fecha);
        if (f >= fin) return;
        o.saldo += e.monto;
        if (f < ini) o.inicioMes += e.monto;
        else { if (e.monto >= 0) o.entradas += e.monto; else o.salidas -= e.monto; o.movs.push(e); }
      });
      o.disponibleMes = o.inicioMes + o.entradas;
      o.pct = o.disponibleMes > 0 ? Math.min(1, o.salidas / o.disponibleMes) : (o.salidas > 0 ? 1 : 0);
      return o;
    });
    var total = { CRC: 0, USD: 0 };
    lista.forEach(function (s) { total[s.moneda === 'USD' ? 'USD' : 'CRC'] += s.saldo; });
    var porAsignar = { CRC: 0, USD: 0 };
    an.pendientes.forEach(function (p) { if (p.sentido === 'entra') porAsignar[p.mov.moneda === 'USD' ? 'USD' : 'CRC'] += p.falta; });
    var reservadoTotal = 0, reservadoUSD = 0, reservadoPor = {};
    Object.keys(an.reservado).forEach(function (k) {
      var v = Math.max(0, an.reservado[k]), partes = k.split('|');
      reservadoPor[partes[0]] = reservadoPor[partes[0]] || { CRC: 0, USD: 0 };
      reservadoPor[partes[0]][partes[1]] += v;
      if (partes[1] === 'USD') reservadoUSD += v; else reservadoTotal += v;
    });
    return { lista: lista, total: total, pendientes: an.pendientes, porAsignar: porAsignar, porMov: an.porMov, desde: an.desde,
      reservado: reservadoPor, reservadoTotal: reservadoTotal, reservadoUSD: reservadoUSD, cubierto: an.cubierto };
  }
  /** Reparto: montos de siempre; la diferencia con lo que entró va (o se resta) al sobre de ajuste. */
  function reparto(d, monto, moneda, ajusteNombre) {
    var sob = (d.sobres || []).filter(function (s) { return (s.moneda || 'CRC') === moneda; });
    var ajuste = ajusteNombre || (sob.filter(function (s) { return s.ajuste; })[0] || {}).nombre || null;
    var filas = sob.map(function (s) { return { nombre: s.nombre, monto: s.asignado || 0, ajuste: s.nombre === ajuste }; });
    var siempre = filas.reduce(function (a, f) { return a + f.monto; }, 0);
    var dif = monto - siempre;
    filas.forEach(function (f) { if (f.ajuste) f.monto = Math.round((f.monto + dif) * 100) / 100; });
    return { filas: filas, siempre: siempre, diferencia: dif, ajuste: ajuste };
  }


  // ---------------- Fondos de inversión (v1.7) ----------------
  /** Saldo de cada subcuenta = saldo anotado (a una fecha) + aportes − retiros después de esa fecha. */
  function fondos(d, hoy) {
    var movs = (d.movimientos || []).filter(function (m) { return m.tipo === 'Inversión' || m.tipo === 'Retiro de fondo'; });
    var claveMesHoy = claveMes(hoy);
    var lista = (d.fondos || []).map(function (f) {
      var desde = f.fechaSaldo ? new Date(f.fechaSaldo) : null;
      var o = { fila: f.fila, nombre: f.nombre, fondo: f.fondo, moneda: f.moneda || 'CRC', meta: f.meta || null, saldoBase: f.saldo || 0,
        fechaSaldo: f.fechaSaldo, intereses: f.intereses || 0, saldo: f.saldo || 0, aportesMes: 0, retirosMes: 0, movs: [] };
      movs.forEach(function (m) {
        if (m.subcuenta !== f.nombre) return;
        var fm = new Date(m.fecha), signo = m.tipo === 'Inversión' ? 1 : -1;
        if (!desde || fm > desde) o.saldo += signo * m.monto;
        if (claveMes(fm) === claveMesHoy) { if (signo > 0) o.aportesMes += m.monto; else o.retirosMes += m.monto; }
        o.movs.push(m);
      });
      o.movs.sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
      return o;
    });
    var total = { CRC: 0, USD: 0 };
    lista.forEach(function (f) { total[f.moneda === 'USD' ? 'USD' : 'CRC'] += f.saldo; });
    var pendientes = movs.filter(function (m) { return !m.subcuenta; }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    return { lista: lista, total: total, pendientes: pendientes };
  }
  /** Subcuenta que se usó la última vez con el mismo monto (para sugerirla). */
  function sugerirSubcuenta(d, m) {
    var c = (d.movimientos || []).filter(function (x) { return x.tipo === m.tipo && x.subcuenta && Math.abs(x.monto - m.monto) < 0.01 && x.fila !== m.fila; })
      .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); })[0];
    return c ? c.subcuenta : null;
  }

  // ---------------- Presupuesto de viaje (v1.7) ----------------
  var CATS_VIAJE = ['Vuelos', 'Transporte', 'Comida', 'Hospedaje', 'Tours', 'Compras', 'Otros'];   // v2.10.0: + Vuelos
  var PALABRAS_VIAJE = [
    ['Vuelos', /AVIANCA|COPA|AIRLINE|AIRWAYS|AEROL|VOLARIS|UNITED|DELTA|AMERICAN AIR|JETBLUE|SPIRIT|IBERIA|LATAM|WINGO|ARAJET|SANSA|FRONTIER|SOUTHWEST|ALASKA AIR|AIR CANADA|AEROMEXICO|LUFTHANSA|KLM|AIR FRANCE|TACA/i],
    ['Transporte', /UBER|TAXI|CABIFY|DIDI|BOLT|RENT ?A ?CAR|HERTZ|AVIS|ALAMO|BUDGET|GASOL|FUEL|SHELL|TEXACO|METRO|BUS|PARKING|PARQUEO|PEAJE/i],
    ['Hospedaje', /HOTEL|HOSTEL|AIRBNB|BOOKING|EXPEDIA|MARRIOTT|HILTON|HYATT|SHERATON|RESORT|INN\b|LODGE|SUITES/i],
    ['Comida', /REST|CAFE|COFFEE|STARBUCKS|BAR\b|GRILL|PIZZA|BURGER|MCDONALD|KFC|SUBWAY|FOOD|SUSHI|TACO|DINER|BAKERY|PANADER|SODA|POLLO|COMIDA/i],
    ['Tours', /TOUR|TICKET|ENTRADA|MUSEO|MUSEUM|PARK|PARQUE|EXCURS|CANOPY|ZOO|DISNEY|UNIVERSAL|GETYOURGUIDE|VIATOR/i],
    ['Compras', /MALL|STORE|SHOP|TIENDA|OUTLET|DUTY|WALMART|TARGET|ZARA|NIKE|ADIDAS|ALBROOK|MULTIPLAZA|AMAZON|FARMAC|PHARM|SUPER/i]
  ];
  var CAT_A_VIAJE = { Restaurantes: 'Comida', Transporte: 'Transporte', Compras: 'Compras', Ropa: 'Compras', Entretenimiento: 'Tours', Viajes: 'Otros', Supermercado: 'Comida' };
  /** v2.10.0: m.viaje = "Cat" · "+Cat" (sumada en las fechas) · "+Cat@ID" (de ese viaje, aunque sea de antes) · "Efectivo@ID" (retiro de cajero) · "Fuera" */
  function marcaViaje(m) {
    var t = String(m.viaje || ''), x = t.match(/^(\+?)([^@]*)@(.+)$/);
    return x ? { mas: !!x[1] || x[2] === 'Efectivo', cat: x[2], id: x[3], efectivo: x[2] === 'Efectivo' } : { mas: t.charAt(0) === '+', cat: t.replace(/^\+/, ''), id: '', efectivo: false };
  }
  function categoriaViaje(m) {
    var v = marcaViaje(m).cat;
    if (CATS_VIAJE.indexOf(v) >= 0) return v;
    for (var i = 0; i < PALABRAS_VIAJE.length; i++) if (PALABRAS_VIAJE[i][1].test(m.comercio || '')) return PALABRAS_VIAJE[i][0];
    return CAT_A_VIAJE[m.categoria] || 'Otros';
  }
  /** v2.10.6 · compras con tarjetas de la familia (esposa, hijos…): el correo llega reenviado y se anotan como "Familia ••1234".
   *  No tocan cuentas, sobres ni el resumen del mes: solo cuentan en los viajes. */
  var SIN_FAMILIA = '-Familia';
  function esFamilia(m) { return !!m && /^familia\b/i.test(String(m.cuenta || '').trim()); }
  function familia4(m) { var x = esFamilia(m) && String(m.cuenta).match(/(\d{4})\s*$/); return x ? x[1] : ''; }
  function familiaPrefs(d) { return (d && (d.familia || (d.ajustes && d.ajustes.prefs && d.ajustes.prefs.familia))) || {}; }
  /** Persona dueña de una tarjeta de la familia ('' si no se sabe) */
  function personaFamilia(d, u4) { var x = familiaPrefs(d)[u4]; return (x && String(x.persona || '').trim()) || 'Familia'; }
  /** v2.10.7: efectivo que ya tenías y llevás al viaje (no salió de ninguna cuenta): no es gasto ni toca sobres */
  function efectivoPropioViaje(m) { return !!m && marcaViaje(m).efectivo && normNom(m.cuenta || '') === 'efectivo'; }
  function esEfectivo(c) { return !c || normNom(c) === 'efectivo'; }
  function enViaje(v, m) {
    if (!m.fecha || m.viaje === 'Fuera' || (m.tipo !== 'Gasto' && m.tipo !== 'Compra tasa cero')) return false;
    var mk = marcaViaje(m);
    if (mk.id) return !mk.efectivo && mk.id === (v.id || '');   // ligada a un viaje: solo cuenta en ese (aunque sea de antes de las fechas)
    var f = new Date(m.fecha), ini = soloFecha(new Date(v.desde)), fin = new Date(soloFecha(new Date(v.hasta)).getTime() + 86400000);
    if (f < ini || f >= fin) return false;
    if (mk.mas) return true;
    var t = v.tarjetas || [];
    if (esFamilia(m)) return t.indexOf(SIN_FAMILIA) < 0;   // v2.10.6: las tarjetas de la familia entran solas (salvo que el viaje diga que no)
    return t.indexOf(m.cuenta) >= 0 || (t.indexOf('Efectivo') >= 0 && esEfectivo(m.cuenta));
  }
  /** Montos en la moneda del viaje (los ₡ se pasan a $ con el tipo de cambio, y al revés). */
  function aMoneda(monto, de, a, tc) {
    if (de === a || !tc) return monto;
    return a === 'USD' ? monto / tc : monto * tc;
  }
  function viaje(d, v, hoy) {
    var tc = d.tipoCambio || 0, mon = v.moneda || 'USD';
    var ini = soloFecha(new Date(v.desde)), fin = soloFecha(new Date(v.hasta)), h = soloFecha(hoy);
    var compras = (d.movimientos || []).filter(function (m) { return enViaje(v, m); }).map(function (m) {
      var f = new Date(m.fecha);
      return { mov: m, categoria: categoriaViaje(m), monto: aMoneda(m.monto, m.moneda, mon, tc), antes: f < ini, cuenta: esEfectivo(m.cuenta) ? 'Efectivo' : m.cuenta, familia: familia4(m), persona: familia4(m) ? personaFamilia(d, familia4(m)) : '' };
    }).sort(function (a, b) { return new Date(b.mov.fecha) - new Date(a.mov.fecha); });
    var gastado = compras.reduce(function (s, c) { return s + c.monto; }, 0);
    var antes = compras.filter(function (c) { return c.antes; }).reduce(function (s, c) { return s + c.monto; }, 0);
    var porCategoria = {}, porTarjeta = {}, porPersona = {}, ayer = 0, porCatAyer = {};
    CATS_VIAJE.forEach(function (c) { porCategoria[c] = 0; });
    var dAyer = new Date(h.getFullYear(), h.getMonth(), h.getDate() - 1);
    compras.forEach(function (c) {
      porCategoria[c.categoria] += c.monto;
      var k = c.cuenta; porTarjeta[k] = porTarjeta[k] || { monto: 0, n: 0 }; porTarjeta[k].monto += c.monto; porTarjeta[k].n++;
      var pp = c.persona; porPersona[pp] = porPersona[pp] || { persona: pp, monto: 0, n: 0, tarjetas: {} }; porPersona[pp].monto += c.monto; porPersona[pp].n++;
      var tt = porPersona[pp].tarjetas; tt[k] = tt[k] || { monto: 0, n: 0, familia: c.familia }; tt[k].monto += c.monto; tt[k].n++;
      if (soloFecha(new Date(c.mov.fecha)).getTime() === dAyer.getTime()) { ayer += c.monto; porCatAyer[c.categoria] = (porCatAyer[c.categoria] || 0) + c.monto; }
    });
    // efectivo del viaje: retiros de cajero ligados (no son gasto) − lo gastado en efectivo
    var retiros = (d.movimientos || []).filter(function (m) { var mk = marcaViaje(m); return mk.efectivo && mk.id === (v.id || '') && m.fecha; })
      .map(function (m) { return { mov: m, monto: aMoneda(m.monto, m.moneda, mon, tc) }; }).sort(function (a, b) { return new Date(b.mov.fecha) - new Date(a.mov.fecha); });
    var totRet = retiros.reduce(function (s, x) { return s + x.monto; }, 0), gastEf = porTarjeta.Efectivo ? porTarjeta.Efectivo.monto : 0;
    var pres = v.presupuesto || {}, presupuesto = {}, hayPres = false;
    CATS_VIAJE.forEach(function (c) { var l = Number(pres[c]) || 0; if (l > 0) { hayPres = true; presupuesto[c] = { limite: l, gastado: porCategoria[c], pct: porCategoria[c] / l }; } });
    var total = Math.max(1, diasEntre(ini, fin) + 1);
    var restantes = h < ini ? total : h > fin ? 0 : diasEntre(h, fin) + 1;
    var transcurridos = Math.max(1, Math.min(total, diasEntre(ini, h) + 1));
    var limite = v.limite || 0, disponible = limite - gastado;
    return {
      compras: compras, gastado: gastado, limite: limite, disponible: disponible, pct: limite ? gastado / limite : 0,
      antes: antes, durante: gastado - antes, porTarjeta: porTarjeta, porPersona: porPersona, hayFamilia: compras.some(function (c) { return !!c.familia; }), ayer: ayer, porCatAyer: porCatAyer,
      efectivo: { retiros: retiros, retirado: totRet, gastado: gastEf, queda: totRet - gastEf },
      presupuesto: hayPres ? presupuesto : null,
      diasTotal: total, diasRestantes: restantes, diaActual: h < ini ? 0 : Math.min(total, diasEntre(ini, h) + 1), porDia: restantes ? Math.max(0, disponible) / restantes : 0,
      promedio: h < ini ? 0 : (gastado - antes) / transcurridos, porDiaTotal: gastado / total, porCategoria: porCategoria, moneda: mon,
      estado: h < ini ? 'Próximo' : h > fin ? 'Terminado' : 'En curso'
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

  // ---------------- v2.2: deuda real de una tarjeta y "Me deben" ----------------
  /** Saldo puesto a una fecha + compras con la tarjeta desde ese día − pagos a la tarjeta desde ese día. */
  function deudaTarjeta(d, c) {
    var r = { CRC: c.saldoCRC || 0, USD: c.saldoUSD || 0, base: { CRC: c.saldoCRC || 0, USD: c.saldoUSD || 0 }, fecha: c.fechaSaldo || null,
      compras: 0, sube: { CRC: 0, USD: 0 }, baja: { CRC: 0, USD: 0 }, cuotas: { CRC: 0, USD: 0 }, nCuotas: 0, vivo: !!c.fechaSaldo };
    var desde = c.fechaSaldo ? new Date(c.fechaSaldo) : null;
    if (!desde || isNaN(desde)) { r.vivo = false; return r; }
    // la fecha del saldo es un día: cuenta lo de después de ese día
    var corte = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1);
    (d.movimientos || []).forEach(function (m) {
      if (normNom(m.cuenta) !== normNom(c.nombre) || !m.fecha || new Date(m.fecha) < corte) return;
      var mon = m.moneda === 'USD' ? 'USD' : 'CRC';
      if (m.tipo === 'Compra tasa cero' && c.diaCorte) return;   // v2.11.0 (#51): con día de corte, la compra tasa cero entra en cuotas (filas "Cuota tasa cero" al corte)
      if (m.tipo === 'Cuota tasa cero') { r.sube[mon] += m.monto; r.cuotas[mon] += m.monto; r.nCuotas++; }
      else if (m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero') { r.sube[mon] += m.monto; r.compras++; }
      else if (m.tipo === 'Pago de tarjeta' || m.tipo === 'Ingreso') r.baja[mon] += m.monto;   // pagos y devoluciones
    });
    r.CRC = r.base.CRC + r.sube.CRC - r.baja.CRC;
    r.USD = r.base.USD + r.sube.USD - r.baja.USD;
    return r;
  }
  /** Compras hechas para otras personas que todavía no te pagaron, y posibles pagos (ingresos por el mismo monto). */
  function meDeben(d) {
    var pend = (d.movimientos || []).filter(function (m) { return m.para && m.tipo !== 'Ingreso' && !m.cobro && !esFamilia(m); })
      .sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
    var total = { CRC: 0, USD: 0 }, personas = {};
    pend.forEach(function (m) {
      var mon = m.moneda === 'USD' ? 'USD' : 'CRC';
      total[mon] += m.monto;
      var k = m.para.trim().toLowerCase();
      personas[k] = personas[k] || { nombre: m.para.trim(), CRC: 0, USD: 0, movs: [] };
      personas[k][mon] += m.monto; personas[k].movs.push(m);
    });
    var sugerencias = [];
    (d.movimientos || []).forEach(function (ing) {
      if (ing.tipo !== 'Ingreso' || ing.cobro || ing.fila < 0 || esFamilia(ing)) return;
      var f = new Date(ing.fecha), txt = ((ing.comercio || '') + ' ' + (ing.nota || '')).toLowerCase();
      Object.keys(personas).forEach(function (k) {
        var p = personas[k], previas = p.movs.filter(function (m) { return m.moneda === ing.moneda && new Date(m.fecha) <= f && (f - new Date(m.fecha)) < 150 * 86400000; });
        if (!previas.length) return;
        var una = previas.filter(function (m) { return Math.abs(m.monto - ing.monto) < 0.5; })[0];
        var suma = previas.reduce(function (s, m) { return s + m.monto; }, 0);
        var deudas = una ? [una] : Math.abs(suma - ing.monto) < 0.5 ? previas : null;
        var porNombre = k.length >= 3 && txt.indexOf(k) >= 0;
        if (deudas) sugerencias.push({ ingreso: ing, persona: p.nombre, deudas: deudas, porNombre: porNombre });
      });
    });
    sugerencias.sort(function (a, b) { return (b.porNombre ? 1 : 0) - (a.porNombre ? 1 : 0) || new Date(b.ingreso.fecha) - new Date(a.ingreso.fecha); });
    return { lista: pend, total: total, personas: Object.keys(personas).map(function (k) { return personas[k]; }), sugerencias: sugerencias };
  }

  /** v2.4: filas de la hoja Sobres que no son sobres (totales, notas al pie) */
  function esSobreReal(s) {
    var n = String((s && s.nombre) || '').trim();
    if (!n || n.length > 60) return false;
    return !/^total(es)?\b/i.test(n) && !/^los movimientos/i.test(n) && !/no se descuentan/i.test(n) && !/^nota\b/i.test(n);
  }

  /**
   * v2.5: fechas de pago del salario. cfg = { frecuencia: 'bisemanal'|'semanal'|'quincenal'|'mensual', fecha (un pago conocido, ISO),
   * dias: [d1, d2] (quincenal), dia (mensual), finde: 'antes'|'despues'|'igual' }. Devuelve fechas (00:00) entre desde y hasta.
   */
  function fechasSalario(cfg, desde, hasta) {
    var loc = function (x) { var s = String(x); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) : soloFecha(new Date(x)); };
    var out = [], d0 = loc(desde), d1 = loc(hasta);
    if (!cfg || !cfg.frecuencia) return out;
    var ajustar = function (f) {
      var g = new Date(f.getFullYear(), f.getMonth(), f.getDate()), dw = g.getDay();
      if (cfg.finde === 'antes') { if (dw === 6) g.setDate(g.getDate() - 1); else if (dw === 0) g.setDate(g.getDate() - 2); }
      else if (cfg.finde === 'despues') { if (dw === 6) g.setDate(g.getDate() + 2); else if (dw === 0) g.setDate(g.getDate() + 1); }
      return g;
    };
    var meter = function (f) { var g = ajustar(f); if (g >= d0 && g <= d1 && !out.some(function (x) { return +x === +g; })) out.push(g); };
    if (cfg.frecuencia === 'bisemanal' || cfg.frecuencia === 'semanal') {
      if (!cfg.fecha) return out;
      var paso = cfg.frecuencia === 'semanal' ? 7 : 14, a = loc(cfg.fecha);
      var k = Math.floor((d0 - a) / 86400000 / paso) - 1, f = new Date(a.getFullYear(), a.getMonth(), a.getDate() + k * paso);
      for (var i = 0; i < 400 && f <= new Date(d1.getTime() + 3 * 86400000); i++) { meter(f); f = new Date(f.getFullYear(), f.getMonth(), f.getDate() + paso); }
    } else {
      var dias = cfg.frecuencia === 'quincenal' ? (cfg.dias || []) : [cfg.dia];
      dias = dias.map(Number).filter(function (x) { return x >= 1 && x <= 31; });
      for (var y = d0.getFullYear(), m = d0.getMonth() - 1; new Date(y, m, 1) <= new Date(d1.getFullYear(), d1.getMonth() + 1, 1); m++) {
        dias.forEach(function (dd) { var ult = new Date(y, m + 1, 0).getDate(); meter(new Date(y, m, Math.min(dd, ult))); });
      }
    }
    return out.sort(function (a, b) { return a - b; });
  }
  function esSalario(m) { return m && m.tipo === 'Ingreso' && /salario|planilla|aguinaldo/i.test((m.comercio || '') + ' ' + (m.categoria || '')); }


  // ---------------- v2.5.5: cuentas de ahorro con saldo vivo, historial de un sobre, búsqueda ----------------
  /** Filas de notas/ayuda de la hoja Cuentas ("Saldo actual: en tarjetas, lo que debés hoy…") no son cuentas. */
  function esCuentaReal(c) {
    var n = String((c && c.nombre) || '').trim();
    return !!n && n.length <= 60 && !/^(saldo actual|nota|notas|ayuda|importante)\s*[:\-]/i.test(n) && !/^(saldo actual|ayuda)$/i.test(n);
  }
  var NO_AHORRO = ['Tarjeta de crédito', 'Préstamo', 'Inversión'];
  function esAhorro(c) { return !!c && NO_AHORRO.indexOf(c.tipo) < 0; }
  /** Cuenta principal y de dónde sale cada pago. o = { principal, tarjetas, prestamo, fondos } (nombres). */
  /** v2.5.7: nombres de cuenta iguales sin importar mayúsculas, tildes ni espacios */
  function normNom(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  /** Cuenta principal y de dónde sale cada pago. o = { principal, tarjetas, prestamo, fondos, porTarjeta: { tarjeta: cuenta } } (nombres). */
  function origenes(d, pref) {
    var ah = (d.cuentas || []).filter(function (c) { return c.activa !== false && esAhorro(c) && esCuentaReal(c); });
    var canon = function (n) { var c = n && ah.filter(function (x) { return normNom(x.nombre) === normNom(n); })[0]; return c ? c.nombre : ''; };
    pref = pref || {};
    var def = (ah.filter(function (c) { return (c.moneda || 'CRC') === 'CRC' && /ahorro/i.test(c.tipo + ' ' + c.nombre); })[0] || ah.filter(function (c) { return (c.moneda || 'CRC') === 'CRC'; })[0] || ah[0] || {}).nombre || '';
    var principal = canon(pref.principal) || def, tarjetas = canon(pref.tarjetas) || principal;
    var porTarjeta = {}, elegidas = pref.porTarjeta || {};
    (d.cuentas || []).filter(function (c) { return c.tipo === 'Tarjeta de crédito' && esCuentaReal(c); }).forEach(function (c) {
      var k = Object.keys(elegidas).filter(function (x) { return normNom(x) === normNom(c.nombre); })[0];
      var mismoBanco = c.banco ? ah.filter(function (a) { return normNom(a.banco) === normNom(c.banco) && (a.moneda || 'CRC') === 'CRC'; })[0] : null;
      porTarjeta[c.nombre] = (k && canon(elegidas[k])) || (mismoBanco ? mismoBanco.nombre : tarjetas);
    });
    return { principal: principal, tarjetas: tarjetas, prestamo: canon(pref.prestamo) || principal, fondos: canon(pref.fondos) || principal, porTarjeta: porTarjeta, dispAnotado: pref.dispAnotado || {} };
  }
  /** v2.5.7: "Cuenta: Ahorros BCR | Sobre: Ventas" / "Fuera de la app" (lo que la persona contestó a "¿de dónde vino esta plata?") */
  function leerDesde(m) {
    var s = String((m && m.desde) || '').trim();
    if (!s) return null;
    if (/^fuera/i.test(s)) return { tipo: 'fuera' };
    var mm = s.match(/^cuenta:\s*(.+?)\s*(?:\|\s*sobre:\s*(.+))?$/i);
    return mm ? { tipo: 'cuenta', cuenta: mm[1].trim(), sobre: (mm[2] || '').trim() } : null;
  }
  /** v2.9.0: compra de una tarjeta que no está en Cuentas (el lector deja "Tarjeta ••1234 no está en Cuentas") → '1234'; si no, '' */
  function tarjetaDesconocida(d, m) {
    if (!m || m.cuenta) return '';
    var x = String(m.nota || '').match(/Tarjeta\s*(?:••|\*+)?\s*(\d{4}) no est[aá] en Cuentas/i);
    if (!x) return '';
    return (d.cuentas || []).some(function (c) { return String(c.ultimos4 || '') === x[1]; }) ? '' : x[1];
  }
  /** ¿A qué cuenta de ahorro toca este movimiento? → { cuenta, signo, grupo } o null */
  function efectoCuenta(d, m, o) {
    if (esFamilia(m)) return null;   // v2.10.6: tarjeta de la familia (solo viajes)
    if (tarjetaDesconocida(d, m)) return null;   // v2.9.0: hasta saber de quién es la tarjeta, no toca ninguna cuenta
    if (m.cuenta && normNom(m.cuenta) === 'efectivo') return null;   // v2.10.0: gasto en efectivo (ya salió del banco al retirar)
    var cta = m.cuenta ? (d.cuentas || []).filter(function (c) { return normNom(c.nombre) === normNom(m.cuenta); })[0] : null;
    if (cta && !esCuentaReal(cta)) cta = null;
    if (m.tipo === 'Pago de tarjeta') return o.tarjetas ? { cuenta: o.tarjetas, signo: -1, grupo: 'pagos' } : null;
    if (m.tipo === 'Inversión') return o.fondos ? { cuenta: o.fondos, signo: -1, grupo: 'pagos' } : null;
    if (m.tipo === 'Retiro de fondo') return o.fondos ? { cuenta: o.fondos, signo: 1, grupo: 'entra' } : null;
    if (m.tipo !== 'Ingreso' && m.tipo !== 'Gasto') return null;   // tasa cero y transferencias propias no mueven la plata de ahorros
    if (cta && !esAhorro(cta)) return null;                        // compra o devolución en la tarjeta
    var n = cta ? cta.nombre : o.principal;
    return n ? { cuenta: n, signo: m.tipo === 'Ingreso' ? 1 : -1, grupo: m.tipo === 'Ingreso' ? 'entra' : 'sale' } : null;
  }
  /** v2.5.6: ¿la transferencia entra o sale de la cuenta anotada? (por la descripción que pone el lector o la persona) */
  function entraTransferencia(m) { return /^\s*(entr[oó]|cr[eé]dito|sinpe de|dep[oó]sito|recib)/i.test(m.comercio || ''); }
  /**
   * Efectos de todos los movimientos en las cuentas de ahorro.
   *  - Transferencias entre tus cuentas: salen de una y entran a otra (se emparejan por monto, ±2 días).
   *  - Si a una cuenta le entra plata tuya y no se ve de dónde salió, se toma de la cuenta principal.
   *  - Un pago de tarjeta sale de la cuenta donde se ve la salida (o donde entró esa plata justo antes); si no, de la elegida en Ajustes.
   */
  function efectosCuentas(d, o) {
    var out = [], ctas = d.cuentas || [];
    var ahorro = function (n) { var c = n && ctas.filter(function (x) { return normNom(x.nombre) === normNom(n); })[0]; return c && esAhorro(c) && esCuentaReal(c) ? c.nombre : null; };
    var mon = function (m) { return m.moneda === 'USD' ? 'USD' : 'CRC'; };
    var ahorroTarjeta = function (n) { var c = n && ctas.filter(function (x) { return normNom(x.nombre) === normNom(n); })[0]; return c ? c.nombre : n; };
    var cerca = function (a, b) { return Math.abs(new Date(a.fecha) - new Date(b.fecha)) <= 2 * 86400000 && Math.abs((a.monto || 0) - (b.monto || 0)) < 0.01 && mon(a) === mon(b); };
    var movs = (d.movimientos || []).filter(function (m) { return m.fecha; });
    var trans = movs.filter(function (m) { return m.tipo === 'Transferencia'; }).map(function (m) {
      return { m: m, cuenta: ahorro(m.cuenta) || (m.cuenta && ctas.some(function (x) { return normNom(x.nombre) === normNom(m.cuenta); }) ? null : o.principal), entra: entraTransferencia(m), par: null, pago: null, desde: leerDesde(m) };
    }).filter(function (x) { return x.cuenta; });
    // v2.5.9: se empareja por cercanía (lo más cercano en tiempo primero), así dos operaciones iguales en días seguidos no se cruzan
    var dt = function (a, b) { return Math.abs(new Date(a.fecha) - new Date(b.fecha)); };
    var emparejar = function (izq, der, ok, unir) {
      var pares = [];
      izq.forEach(function (a) { der.forEach(function (b) { if (ok(a, b)) pares.push([dt(a.m || a, b.m || b), a, b]); }); });
      pares.sort(function (x, y) { return x[0] - y[0]; });
      pares.forEach(function (x) { unir(x[1], x[2]); });
    };
    emparejar(trans.filter(function (y) { return y.entra; }), trans.filter(function (y) { return !y.entra; }),
      function (a, b) { return a.cuenta !== b.cuenta && cerca(a.m, b.m); },
      function (a, b) { if (!a.par && !b.par) { a.par = b; b.par = a; } });   // salida ↔ entrada entre cuentas distintas
    var pagos = movs.filter(function (m) { return m.tipo === 'Pago de tarjeta'; }).map(function (m) { return { m: m, de: null }; });
    emparejar(pagos, trans.filter(function (y) { return !y.entra && !y.par; }), function (p, y) { return cerca(p.m, y.m); },
      function (p, y) { if (!p.de && !y.pago) { y.pago = p.m; p.de = { cuenta: y.cuenta, fecha: y.m.fecha }; } });   // el débito de la cuenta es el pago
    emparejar(pagos, trans.filter(function (y) { return y.entra; }), function (p, y) { return cerca(p.m, y.m); },
      function (p, y) { if (!p.de && !y.pago) { y.pago = p.m; p.de = { cuenta: y.cuenta, fecha: p.m.fecha }; } });   // la plata entró a esa cuenta para pagar
    pagos.forEach(function (x) {
      var p = x.m, de = x.de ? x.de.cuenta : (ahorro((o.porTarjeta || {})[ahorroTarjeta(p.cuenta)]) || o.tarjetas);
      if (de) out.push({ cuenta: de, signo: -1, grupo: 'pagos', mov: p, fecha: x.de ? x.de.fecha : p.fecha, monto: p.monto, moneda: mon(p) });
    });
    trans.forEach(function (x) {
      if (x.pago && !x.entra) return;   // la salida ya quedó como el pago de la tarjeta
      out.push({ cuenta: x.cuenta, signo: x.entra ? 1 : -1, grupo: 'transf', mov: x.m, fecha: x.m.fecha, monto: x.m.monto, moneda: mon(x.m) });
      if (!x.entra || x.par) return;
      // entró plata tuya sin ver de dónde: lo que contestaste a "¿de dónde vino?"; si no contestaste, de la principal
      if (x.desde && x.desde.tipo === 'fuera') return;
      var de = x.desde && x.desde.tipo === 'cuenta' ? ahorro(x.desde.cuenta) : o.principal;
      if (de && de !== x.cuenta) out.push({ cuenta: de, signo: -1, grupo: 'transf', mov: x.m, fecha: x.m.fecha, monto: x.m.monto, moneda: mon(x.m), texto: 'Pasó a ' + x.cuenta });
    });
    out.sinOrigen = trans.filter(function (x) { return x.entra && !x.par && !x.desde; }).map(function (x) { return { mov: x.m, cuenta: x.cuenta }; });
    movs.forEach(function (m) {
      if (m.tipo === 'Pago de tarjeta' || m.tipo === 'Transferencia') return;
      var e = efectoCuenta(d, m, o);
      if (e) out.push({ cuenta: e.cuenta, signo: e.signo, grupo: e.grupo, mov: m, fecha: m.fecha, monto: m.monto || 0, moneda: mon(m) });
    });
    if (o.prestamo && d.prestamo) (d.prestamo.pagos || []).forEach(function (p) {
      if (p.fecha && p.total) out.push({ cuenta: o.prestamo, signo: -1, grupo: 'pagos', pago: p, fecha: p.fecha, monto: p.total, moneda: 'CRC' });
    });
    return out;
  }
  /** Movimientos de una cuenta de ahorro (todas las fechas): [{ fecha, monto (con signo), moneda, grupo, mov | pago, texto? }] */
  function movsCuenta(d, c, o) {
    return efectosCuentas(d, o).filter(function (e) { return e.cuenta === c.nombre; }).map(function (e) {
      return { fecha: e.fecha, monto: e.signo * e.monto, moneda: e.moneda, grupo: e.grupo, mov: e.mov, pago: e.pago, texto: e.texto };
    }).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); });
  }
  /** Saldo vivo de una cuenta de ahorro: saldo anotado + lo que entra − lo que sale desde el día siguiente a la fecha del saldo. */
  function saldoCuenta(d, c, o) {
    var r = { CRC: c.saldoCRC || 0, USD: c.saldoUSD || 0, base: { CRC: c.saldoCRC || 0, USD: c.saldoUSD || 0 }, fecha: c.fechaSaldo || null, vivo: false,
      entra: { CRC: 0, USD: 0 }, sale: { CRC: 0, USD: 0 }, pagos: { CRC: 0, USD: 0 }, transf: { CRC: 0, USD: 0 }, nEntra: 0, nSale: 0, nPagos: 0, nTransf: 0 };
    var desde = c.fechaSaldo ? new Date(c.fechaSaldo) : null;
    if (!desde || isNaN(desde)) return r;
    r.vivo = true;
    var corte = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1);
    // v2.8.0: si lo que se anotó fue el DISPONIBLE (como en la app del banco), el total = disponible + lo que había en sobres ese día
    var dia = desde.getFullYear() + '-' + ('0' + (desde.getMonth() + 1)).slice(-2) + '-' + ('0' + desde.getDate()).slice(-2);
    if (o && o.principal === c.nombre && (o.dispAnotado || {})[c.nombre] === dia && (c.moneda || 'CRC') === 'CRC') {
      r.dispBase = r.base.CRC; r.base.CRC = r.base.CRC + sobresAl(d, desde, o);
    }
    movsCuenta(d, c, o).forEach(function (x) {
      if (new Date(x.fecha) < corte) return;
      if (x.grupo === 'transf') { r.transf[x.moneda] += x.monto; r.nTransf++; return; }
      var k = x.grupo === 'entra' ? 'entra' : x.grupo === 'pagos' ? 'pagos' : 'sale';
      r[k][x.moneda] += Math.abs(x.monto);
      r[k === 'entra' ? 'nEntra' : k === 'pagos' ? 'nPagos' : 'nSale']++;
    });
    ['CRC', 'USD'].forEach(function (mon) { r[mon] = r.base[mon] + r.entra[mon] - r.sale[mon] - r.pagos[mon] + r.transf[mon]; });
    return r;
  }
  /** Todo lo que pasó en un sobre, del más viejo al más nuevo, con el saldo corrido. */
  function historialSobre(d, nombre) {
    var s = (d.sobres || []).filter(function (x) { return x.nombre === nombre; })[0];
    var an = analizarSobres(d), saldo = s ? (s.saldoInicial || 0) : 0, inicial = saldo;
    var lista = an.efectos.filter(function (e) { return e.sobre === nombre && e.fecha; }).map(function (e, i) { return Object.assign({ _i: i }, e); })
      .sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha) || a._i - b._i; });
    lista.forEach(function (e) { e.antes = saldo; saldo += e.monto; e.despues = saldo; });
    return { sobre: s, inicial: inicial, saldo: saldo, lista: lista, desde: an.desde };
  }
  /** Saldo de un sobre al final de cada uno de los últimos n meses (para el mini gráfico). */
  function saldosMensualesSobre(h, hoy, n) {
    var out = [];
    for (var k = n - 1; k >= 0; k--) {
      var fin = new Date(hoy.getFullYear(), hoy.getMonth() - k + 1, 1), v = h.inicial;
      if (h.desde && fin <= h.desde) { out.push({ mes: new Date(hoy.getFullYear(), hoy.getMonth() - k, 1), saldo: null }); continue; }   // antes de empezar los sobres: sin barra
      h.lista.forEach(function (e) { if (new Date(e.fecha) < fin) v = e.despues; });
      out.push({ mes: new Date(hoy.getFullYear(), hoy.getMonth() - k, 1), saldo: v });
    }
    return out;
  }
  var MESES_B = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  /**
   * Buscador que entiende: palabras (comercio, categoría…), meses ("octubre", "octubre 2025"), fechas ("15/10", "15/10/2025"),
   * montos (">20000", "<5000", "5000-10000", "=3500"). Devuelve { palabras, desde, hasta, min, max }.
   */
  function leerBusqueda(q, hoy) {
    var r = { palabras: [], desde: null, hasta: null, min: null, max: null };
    var num = function (s) { return leerNumero(s); };
    var partes = String(q || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/).filter(String);
    var anio = null;
    partes.forEach(function (w) { if (/^20\d\d$/.test(w)) anio = Number(w); });
    partes.forEach(function (w) {
      var mm;
      if (/^20\d\d$/.test(w)) return;
      var mi = MESES_B.indexOf(w === 'septiembre' ? 'setiembre' : w);
      if (mi >= 0) {
        var y = anio || (mi > hoy.getMonth() ? hoy.getFullYear() - 1 : hoy.getFullYear());
        r.desde = new Date(y, mi, 1); r.hasta = new Date(y, mi + 1, 1); return;
      }
      if ((mm = w.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/))) {
        var dd = Number(mm[1]), me = Number(mm[2]) - 1, yy = mm[3] ? Number(mm[3].length === 2 ? '20' + mm[3] : mm[3]) : (anio || hoy.getFullYear());
        if (!mm[3] && !anio && new Date(yy, me, dd) > hoy) yy--;
        r.desde = new Date(yy, me, dd); r.hasta = new Date(yy, me, dd + 1); return;
      }
      if ((mm = w.match(/^(>=?|<=?|=)([\d.,]+)$/))) {
        var v = num(mm[2]); if (v === null) return;
        if (mm[1][0] === '>') r.min = v; else if (mm[1][0] === '<') r.max = v; else { r.min = v - 0.5; r.max = v + 0.5; }
        return;
      }
      if ((mm = w.match(/^([\d.,]+)-([\d.,]+)$/))) { var a = num(mm[1]), b = num(mm[2]); if (a !== null && b !== null) { r.min = Math.min(a, b); r.max = Math.max(a, b); return; } }
      r.palabras.push(w);
    });
    return r;
  }
  function textoBusqueda(m) { return [m.comercio, m.lugar, m.categoria, m.cuenta, m.sobre, m.nota, m.tipo, m.para].join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function coincide(m, b) {
    var f = new Date(m.fecha);
    if (b.desde && f < b.desde) return false;
    if (b.hasta && f >= b.hasta) return false;
    if (b.min !== null && m.monto < b.min) return false;
    if (b.max !== null && m.monto > b.max) return false;
    if (b.palabras.length) { var t = textoBusqueda(m); for (var i = 0; i < b.palabras.length; i++) if (t.indexOf(b.palabras[i]) < 0) return false; }
    return true;
  }
  /** Rango de fechas de un período con nombre: hoy, ayer, semana, mes, pasado, 3m → [desde, hasta) */
  function rangoPeriodo(per, hoy) {
    var h = soloFecha(hoy), y = h.getFullYear(), mo = h.getMonth(), d = h.getDate();
    if (per === 'hoy') return [h, new Date(y, mo, d + 1)];
    if (per === 'ayer') return [new Date(y, mo, d - 1), h];
    if (per === 'semana') { var dw = (h.getDay() + 6) % 7; return [new Date(y, mo, d - dw), new Date(y, mo, d + 1)]; }
    if (per === 'mes') return [new Date(y, mo, 1), new Date(y, mo + 1, 1)];
    if (per === 'pasado') return [new Date(y, mo - 1, 1), new Date(y, mo, 1)];
    if (per === '3m') return [new Date(y, mo - 2, 1), new Date(y, mo + 1, 1)];
    return [null, null];
  }
  /** Último día de corte de la tarjeta (hoy o antes) */
  function ultimoCorte(c, hoy) {
    if (!c || !c.diaCorte) return null;
    var h = soloFecha(hoy), dia = Math.min(c.diaCorte, new Date(h.getFullYear(), h.getMonth() + 1, 0).getDate());
    var f = new Date(h.getFullYear(), h.getMonth(), dia);
    if (f > h) { var mp = new Date(h.getFullYear(), h.getMonth(), 0); f = new Date(mp.getFullYear(), mp.getMonth(), Math.min(c.diaCorte, mp.getDate())); }
    return f;
  }

  /**
   * v2.9.0 · Pagos de tarjeta de los próximos `ventana` días (para avisos y el correo).
   * CRC/USD = lo que toca pagar: la deuda de hoy sin las compras hechas después del último corte (esas van al siguiente estado de cuenta).
   * avisar = hoy es uno de los días elegidos (p. ej. [3,1,0]) y todavía queda algo por pagar (si ya pagaste, no avisa).
   */
  /** v2.10.0 · Lo que toca pagar de una tarjeta hoy: la deuda sin las compras hechas después del último corte. */
  function porPagarTarjeta(d, c, hoy) {
    var r2 = function (n) { return Math.round(n * 100) / 100; };
    var dt = deudaTarjeta(d, c), corte = ultimoCorte(c, hoy), finCorte = corte ? new Date(corte.getFullYear(), corte.getMonth(), corte.getDate() + 1) : null;
    var fs = c.fechaSaldo ? new Date(c.fechaSaldo) : null, finSaldo = fs && !isNaN(fs) ? new Date(fs.getFullYear(), fs.getMonth(), fs.getDate() + 1) : null;
    var nuevas = { CRC: 0, USD: 0 }, pagado = false;
    (d.movimientos || []).forEach(function (m) {
      if (normNom(m.cuenta) !== normNom(c.nombre) || !m.fecha) return;
      var fm = new Date(m.fecha);
      if (m.tipo === 'Pago de tarjeta' && finCorte && fm >= finCorte) pagado = true;
      if ((m.tipo === 'Gasto' || (m.tipo === 'Compra tasa cero' && !c.diaCorte)) && finCorte && fm >= finCorte && (!finSaldo || fm >= finSaldo)) nuevas[m.moneda === 'USD' ? 'USD' : 'CRC'] += m.monto;
    });
    var crc = dt.CRC > 0.004 ? Math.max(0, dt.CRC - nuevas.CRC) : dt.CRC, usd = dt.USD > 0.004 ? Math.max(0, dt.USD - nuevas.USD) : dt.USD;
    return { CRC: r2(crc), USD: r2(usd), deuda: { CRC: r2(dt.CRC), USD: r2(dt.USD) }, nuevas: { CRC: r2(nuevas.CRC), USD: r2(nuevas.USD) }, pagado: pagado, corte: corte };
  }
  /**
   * v2.11.0 (#51) · Cuotas tasa cero que se cargan a la tarjeta el día del corte.
   * Cada cuota del plan (fecha = día de pago) se carga en el corte anterior a ese pago. Solo tarjetas con día de corte.
   * Devuelve [{ t, n, meses, corte (Date), cuota, moneda, tarjeta, aut }] de los cortes entre `desde` (excluido) y `hasta` (incluido).
   */
  function cuotasAlCorte(d, c, desde, hasta) {
    var out = [];
    if (!c || !c.diaCorte) return out;
    (d.tasaCero || []).forEach(function (t) {
      if (normNom(t.tarjeta) !== normNom(c.nombre)) return;
      planTasaCero(t, hasta).filas.forEach(function (f) {
        if (!f.fecha) return;
        var corte = ultimoCorte(c, f.fecha);
        if (!corte || (desde && corte <= soloFecha(desde)) || corte > soloFecha(hasta)) return;
        out.push({ t: t, n: f.n, meses: t.meses, corte: corte, cuota: Math.round(f.cuota * 100) / 100, moneda: t.moneda || 'CRC', tarjeta: c.nombre, aut: 'TC-' + (t.fila || normNom(t.descripcion).slice(0, 12)) + '-' + f.n });
      });
    });
    return out.sort(function (a, b) { return a.corte - b.corte; });
  }
  /** Lo que falta de las compras tasa cero de una tarjeta (no entra al pago de contado) y las cuotas del próximo corte */
  function saldoTasaCeroTarjeta(d, c, hoy) {
    var r = { CRC: 0, USD: 0, proximo: { CRC: 0, USD: 0 }, proxCorte: null, n: 0 };
    var cortadas = {};
    cuotasAlCorte(d, c, null, hoy).forEach(function (x) { cortadas[x.aut] = 1; });
    var sig = c && c.diaCorte ? (function () { var u = ultimoCorte(c, hoy); return u ? new Date(u.getFullYear(), u.getMonth() + 1, Math.min(c.diaCorte, new Date(u.getFullYear(), u.getMonth() + 2, 0).getDate())) : null; })() : null;
    (d.tasaCero || []).forEach(function (t) {
      if (!c || normNom(t.tarjeta) !== normNom(c.nombre)) return;
      var mon = t.moneda === 'USD' ? 'USD' : 'CRC', algo = false;
      planTasaCero(t, hoy).filas.forEach(function (f) {
        var k = 'TC-' + (t.fila || normNom(t.descripcion).slice(0, 12)) + '-' + f.n;
        if (c.diaCorte ? cortadas[k] : f.cobrada) return;
        r[mon] += f.cuota; algo = true;
        if (sig && f.fecha && ultimoCorte(c, f.fecha) && soloFecha(ultimoCorte(c, f.fecha)).getTime() === soloFecha(sig).getTime()) r.proximo[mon] += f.cuota;
      });
      if (algo) r.n++;
    });
    r.proxCorte = sig;
    return r;
  }
  // ---------------- v2.12.0 · Presupuesto (#53) ----------------
  function presuPrefs(d) { return (d && d.presupuesto) || (d && d.ajustes && d.ajustes.prefs && d.ajustes.prefs.presupuesto) || {}; }
  /** Período del presupuesto: mes calendario o período de salario (del último pago al día antes del siguiente) */
  function periodoPresupuesto(d, hoy, modo, cfgSalario, atras) {
    var h = soloFecha(hoy), ini, fin, nombre;
    atras = atras || 0;
    if (modo === 'salario' && cfgSalario && cfgSalario.frecuencia) {
      var fs = fechasSalario(cfgSalario, new Date(h.getTime() - 200 * 86400000), new Date(h.getTime() + 70 * 86400000));
      var i = -1; fs.forEach(function (f, k) { if (f <= h) i = k; });
      i -= atras;
      if (i >= 0 && fs[i + 1]) { ini = fs[i]; fin = new Date(fs[i + 1].getFullYear(), fs[i + 1].getMonth(), fs[i + 1].getDate() - 1); nombre = 'salario'; }
    }
    if (!ini) { ini = new Date(h.getFullYear(), h.getMonth() - atras, 1); fin = new Date(h.getFullYear(), h.getMonth() - atras + 1, 0); nombre = 'mes'; }
    var dias = Math.round((fin - ini) / 86400000) + 1, dia = Math.max(0, Math.min(dias, Math.round((h - ini) / 86400000) + 1));
    return { modo: nombre, ini: ini, fin: fin, dias: dias, dia: dia, pct: dias ? dia / dias : 1, faltan: Math.max(0, dias - dia), factor: nombre === 'mes' ? 1 : dias / 30.4375 };
  }
  // ---------------- v2.17 (#66): presupuesto por corte (ej. la tarjeta del súper de la casa, del 25 al 24) ----------------
  function cortesPrefs(d) { var p = (d && d.cortes) || (d && d.ajustes && d.ajustes.prefs && d.ajustes.prefs.cortes); return Array.isArray(p) ? p.filter(function (c) { return c && c.cuenta && c.on !== false; }) : []; }
  /** ¿Este movimiento es de la tarjeta de ese presupuesto por corte? */
  function esDeCorte(cfg, m) {
    if (!cfg || !m) return false;
    var k = String(cfg.cuenta || '');
    var u4 = (k.match(/^familia\s*••?\s*(\d{4})$/i) || [])[1];
    if (u4) return esFamilia(m) && familia4(m) === u4;
    return normNom(m.cuenta) === normNom(k);
  }
  /** El presupuesto por corte que manda sobre este movimiento (o null) */
  function corteDe(d, m) { var l = cortesPrefs(d); for (var i = 0; i < l.length; i++) if (esDeCorte(l[i], m)) return l[i]; return null; }
  function diaDelMes(y, mo, dia) { return new Date(y, mo, Math.min(dia, new Date(y, mo + 1, 0).getDate())); }
  /** Fechas del corte que contiene `hoy` (atras = cuántos cortes antes). Corta el día `dia`: va del día siguiente al corte anterior hasta el día del corte. */
  function periodoCorte(dia, hoy, atras) {
    var h = soloFecha(hoy), y = h.getFullYear(), mo = h.getMonth();
    var corteEste = diaDelMes(y, mo, dia);
    if (h > corteEste) mo += 1;            // ya cortó este mes → el corte que corre termina el mes que viene
    mo -= (atras || 0);
    var fin = diaDelMes(y, mo, dia), antes = diaDelMes(y, mo - 1, dia);
    var ini = new Date(antes.getFullYear(), antes.getMonth(), antes.getDate() + 1);
    var dias = Math.round((fin - ini) / 86400000) + 1;
    var diaN = atras ? dias : Math.max(1, Math.min(dias, Math.round((h - ini) / 86400000) + 1));
    return { ini: ini, fin: fin, dias: dias, dia: diaN, faltan: atras ? 0 : dias - diaN };
  }
  /** Gastado en un corte: compras (Gasto) de esa tarjeta entre ini y fin. Todo en colones (los $ al tipo de cambio). */
  function presupuestoCorte(d, cfg, hoy, atras) {
    var per = periodoCorte(Number(cfg.dia) || 1, hoy, atras), t0 = per.ini.getTime(), t1 = per.fin.getTime() + 86400000;
    var compras = [], gastado = 0, porDia = [], brutas = 0, devol = 0, estimado = 0;
    for (var i = 0; i < per.dias; i++) porDia.push(0);
    (d.movimientos || []).forEach(function (m) {
      if (!m.fecha || (m.tipo !== 'Gasto' && m.tipo !== 'Ingreso') || !esDeCorte(cfg, m)) return;   // v2.18: Ingreso = devolución / crédito (resta)
      var t = new Date(m.fecha).getTime(); if (t < t0 || t >= t1) return;
      var v = enCRC(d, m.monto, m.moneda) * (m.tipo === 'Ingreso' ? -1 : 1);
      if (v < 0) devol -= v; else brutas += v;
      if (/monto estimado|IVA estimado/i.test(m.nota || '')) estimado += v;
      gastado += v; compras.push({ mov: m, monto: v, devolucion: v < 0 });
      var k = Math.floor((soloFecha(new Date(m.fecha)) - per.ini) / 86400000); if (k >= 0 && k < per.dias) porDia[k] += v;
    });
    compras.sort(function (a, b) { return new Date(b.mov.fecha) - new Date(a.mov.fecha); });
    var monto = Number(cfg.monto) || 0, quedan = monto - gastado, acum = 0;
    var serie = porDia.slice(0, per.dia).map(function (v) { acum += v; return acum; });
    var ideal = monto * per.dia / per.dias;
    return {
      cfg: cfg, periodo: per, gastado: gastado, monto: monto, brutas: brutas, devoluciones: devol, estimado: estimado, quedan: quedan, pct: monto ? gastado / monto : 0, compras: compras, n: compras.length,
      promedio: per.dia ? Math.round(gastado / per.dia) : 0, porDia: Math.floor(per.faltan > 0 ? Math.max(0, quedan) / per.faltan : Math.max(0, quedan)),
      serie: serie, ideal: ideal, ritmo: Math.round(ideal - gastado),   // > 0: van por debajo del ritmo ideal
      estado: !monto ? 'bien' : gastado > monto + 0.001 ? 'pasado' : gastado / monto >= 0.8 ? 'alerta' : (gastado / monto > per.dia / per.dias + 0.10 && gastado / monto >= 0.5) ? 'rapido' : 'bien'
    };
  }
  /** Cortes anteriores (1..n) */
  function historialCorte(d, cfg, hoy, n) {
    var out = [];
    for (var a = 1; a <= (n || 6); a++) {
      var r = presupuestoCorte(d, cfg, hoy, a);
      out.push({ atras: a, periodo: r.periodo, gastado: r.gastado, monto: r.monto, n: r.n, pct: r.pct });
    }
    return out;
  }

  /** ¿Cuenta este movimiento en el presupuesto? Devuelve la categoría ('' = no cuenta) */
  function categoriaPresupuesto(d, m) {
    if (!m || m.tipo !== 'Gasto' || m.para || efectivoPropioViaje(m)) return '';
    var co = corteDe(d, m);   // v2.17 (#66): la tarjeta con presupuesto por corte va aparte (salvo que diga "contar en mi presupuesto del mes")
    if (co && !co.enMes) return '';
    var mk = marcaViaje(m);
    if (mk.efectivo) return '';
    if ((d.viajes || []).some(function (v) { return enViaje(v, m); })) return '';   // lo del viaje cuenta solo en el viaje
    if (esFamilia(m)) {
      var x = familiaPrefs(d)[familia4(m)], pr = x && x.presu;
      if (!pr) return co ? (m.categoria || 'Sin categoría') : '';
      return pr === '*' ? (m.categoria || 'Sin categoría') : pr;
    }
    return m.categoria || 'Sin categoría';
  }
  function enCRC(d, monto, moneda) { return moneda === 'USD' ? monto * (d.tipoCambio || 1) : monto; }
  /**
   * Presupuesto del período. o = { modo, salario (cfg), atras (0 = actual, 1 = el anterior) }
   * Todo en colones (los dólares se pasan al tipo de cambio).
   */
  function presupuesto(d, hoy, o) {
    o = o || {};
    var pp = presuPrefs(d), per = periodoPresupuesto(d, hoy, o.modo || pp.modo || 'mes', o.salario, o.atras), lim = pp.limites || {};
    var cats = {}, t0 = per.ini.getTime(), t1 = per.fin.getTime() + 86400000;
    (d.movimientos || []).forEach(function (m) {
      if (!m.fecha) return;
      var t = new Date(m.fecha).getTime(); if (t < t0 || t >= t1) return;
      var cat = categoriaPresupuesto(d, m); if (!cat) return;
      var c = cats[cat] = cats[cat] || { cat: cat, gastado: 0, n: 0, compras: [], porPersona: {} };
      var v = enCRC(d, m.monto, m.moneda), per1 = esFamilia(m) ? personaFamilia(d, familia4(m)) : '', k = esEfectivo(m.cuenta) ? 'Efectivo' : m.cuenta;
      c.gastado += v; c.n++; c.compras.push({ mov: m, monto: v, persona: per1 });
      var pe = c.porPersona[per1] = c.porPersona[per1] || { persona: per1, monto: 0, tarjetas: {} };
      pe.monto += v; pe.tarjetas[k] = (pe.tarjetas[k] || 0) + v;
    });
    var lista = [], sin = { monto: 0, cats: [] }, total = { limite: 0, gastado: 0 };
    Object.keys(lim).forEach(function (k) { if (lim[k] > 0 && !cats[k]) cats[k] = { cat: k, gastado: 0, n: 0, compras: [], porPersona: {} }; });
    Object.keys(cats).forEach(function (k) {
      var c = cats[k], l = lim[k] > 0 ? lim[k] * per.factor : 0;
      c.compras.sort(function (a, b) { return new Date(b.mov.fecha) - new Date(a.mov.fecha); });
      if (!l) { sin.monto += c.gastado; sin.cats.push(c); return; }
      c.limite = l; c.pct = c.gastado / l; c.quedan = l - c.gastado;
      c.estado = c.pct > 1.0001 ? 'pasado' : (c.pct > per.pct + 0.10 && c.pct >= 0.5) ? 'rapido' : 'bien';
      total.limite += l; total.gastado += c.gastado; lista.push(c);
    });
    lista.sort(function (a, b) { return b.pct - a.pct; });
    sin.cats.sort(function (a, b) { return b.gastado - a.gastado; });
    total.pct = total.limite ? total.gastado / total.limite : 0; total.quedan = total.limite - total.gastado;
    total.estado = total.pct > 1.0001 ? 'pasado' : (total.pct > per.pct + 0.10 && total.pct >= 0.5) ? 'rapido' : 'bien';
    total.porDia = per.faltan > 0 ? Math.max(0, total.quedan) / per.faltan : Math.max(0, total.quedan);
    // inversión: aportes − retiros del período, por fondo
    var metas = pp.inv || {}, inv = [], invT = { meta: 0, aportado: 0 };
    (d.fondos || []).forEach(function (f) {
      var meta = (metas[f.nombre] || 0) * per.factor, ap = 0;
      (d.movimientos || []).forEach(function (m) {
        if ((m.tipo !== 'Inversión' && m.tipo !== 'Retiro de fondo') || m.subcuenta !== f.nombre || !m.fecha) return;
        var t = new Date(m.fecha).getTime(); if (t < t0 || t >= t1) return;
        ap += (m.tipo === 'Inversión' ? 1 : -1) * m.monto;
      });
      if (!meta && !ap) return;
      var mon = f.moneda || 'CRC';
      inv.push({ nombre: f.nombre, moneda: mon, meta: meta, aportado: ap, pct: meta ? ap / meta : 0, cumplida: meta > 0 && ap >= meta - 0.004, faltan: Math.max(0, meta - ap) });
      invT.meta += enCRC(d, meta, mon); invT.aportado += enCRC(d, ap, mon);
    });
    invT.pct = invT.meta ? invT.aportado / invT.meta : 0;
    return { periodo: per, cats: lista, sin: sin, total: total, inversion: inv, invTotal: invT, hayLimites: lista.length > 0, hayMetas: inv.some(function (x) { return x.meta > 0; }) };
  }
  /** Promedio mensual por categoría de los últimos n meses completos (para sugerir límites) */
  function promediosPresupuesto(d, hoy, n) {
    n = n || 3;
    var h = soloFecha(hoy), ini = new Date(h.getFullYear(), h.getMonth() - n, 1).getTime(), fin = new Date(h.getFullYear(), h.getMonth(), 1).getTime(), r = { cats: {}, inv: {}, salario: 0, meses: n };
    (d.movimientos || []).forEach(function (m) {
      if (!m.fecha) return;
      var t = new Date(m.fecha).getTime(); if (t < ini || t >= fin) return;
      var cat = categoriaPresupuesto(d, m);
      if (cat) r.cats[cat] = (r.cats[cat] || 0) + enCRC(d, m.monto, m.moneda) / n;
      if ((m.tipo === 'Inversión' || m.tipo === 'Retiro de fondo') && m.subcuenta) r.inv[m.subcuenta] = (r.inv[m.subcuenta] || 0) + (m.tipo === 'Inversión' ? 1 : -1) * m.monto / n;
      if (esSalario(m)) r.salario += enCRC(d, m.monto, m.moneda) / n;
    });
    return r;
  }
  /** Lo que queda libre al mes: salario − sobres − cuotas tasa cero − préstamo − meta de inversión (sin restar doble lo que ya va por un sobre) */
  function librePresupuesto(d, hoy) {
    var pp = presuPrefs(d), pr = promediosPresupuesto(d, hoy, 3), esp = d.sobreEspecial || {}, res = resumenMes(d, hoy);
    // v2.13.0 (#55): con salario semanal/bisemanal, un mes "normal" = pago × 52 ÷ 12 o × 26 ÷ 12 (los meses de 3 pagos no inflan el promedio)
    var cfg = d.salario || (d.ajustes && d.ajustes.prefs && d.ajustes.prefs.salario) || null;
    var porMes = cfg && cfg.frecuencia ? ({ semanal: 52 / 12, bisemanal: 26 / 12, quincenal: 2, mensual: 1 })[cfg.frecuencia] : 0;
    var salario = 0, comoSalario = 'promedio';
    if (porMes) {
      var pago = Number(cfg.monto) || 0;
      if (!pago) {   // sin monto configurado: promedio de cada pago de los últimos 3 meses
        var tot = 0, n = 0, ini = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1).getTime();
        (d.movimientos || []).forEach(function (m) { if (esSalario(m) && m.fecha && new Date(m.fecha).getTime() >= ini) { tot += enCRC(d, m.monto, m.moneda); n++; } });
        pago = n ? tot / n : 0;
      }
      if (pago) { salario = pago * porMes; comoSalario = cfg.frecuencia; }
    }
    if (!salario) salario = pr.salario;
    if (!salario) (d.movimientos || []).forEach(function (m) { if (esSalario(m) && enMes(m.fecha, hoy)) salario += enCRC(d, m.monto, m.moneda); });
    var sob = 0, haySobreTC = false, haySobrePr = false, haySobreInv = false;
    (d.sobres || []).forEach(function (s) {
      var a = s.asignado || 0;
      if (s.nombre === esp.tasaCero) { haySobreTC = true; if (s.asignadoAuto) a = res.cuotasTC[s.moneda] || 0; }
      if (s.nombre === esp.prestamo) haySobrePr = true;
      if (/inversi|fondo/i.test(s.nombre) && a > 0) haySobreInv = true;
      sob += enCRC(d, a, s.moneda);
    });
    var tc = haySobreTC ? 0 : enCRC(d, res.cuotasTC.CRC, 'CRC') + enCRC(d, res.cuotasTC.USD, 'USD');
    var prest = haySobrePr || !d.prestamo || !d.prestamo.estimado ? 0 : (d.prestamo.estimado.total || 0);
    var inv = 0; (d.fondos || []).forEach(function (f) { inv += enCRC(d, (pp.inv || {})[f.nombre] || 0, f.moneda || 'CRC'); });
    var invResta = haySobreInv ? 0 : inv;
    var limites = 0; Object.keys(pp.limites || {}).forEach(function (k) { limites += pp.limites[k] || 0; });
    var libre = salario - sob - tc - prest - invResta;
    return { salario: salario, comoSalario: comoSalario, sobres: sob, tasaCero: tc, prestamo: prest, inversion: inv, inversionEnSobre: haySobreInv, libre: libre, limites: limites, caben: !salario || limites <= libre + 0.5 };
  }
  function pagosProximos(d, hoy, diasAviso, ventana) {
    diasAviso = diasAviso && diasAviso.length ? diasAviso : [3, 1, 0]; ventana = ventana === undefined ? 7 : ventana;
    var out = [];
    (d.cuentas || []).forEach(function (c) {
      if (!c.activa || c.tipo !== 'Tarjeta de crédito' || !c.diaPago) return;
      var f = proximaFecha(c.diaPago, hoy), dias = diasEntre(hoy, f);
      if (dias < 0 || dias > ventana) return;
      var pp = porPagarTarjeta(d, c, hoy), debe = pp.CRC > 0.004 || pp.USD > 0.004;
      out.push({ nombre: c.nombre, ultimos4: c.ultimos4 || '', dias: dias, fecha: f.toISOString(), CRC: pp.CRC, USD: pp.USD, deuda: pp.deuda,
        pagado: pp.pagado && !debe, debe: debe, avisar: debe && diasAviso.indexOf(dias) >= 0 });
    });
    return out.sort(function (a, b) { return a.dias - b.dias; });
  }

  function pct(n, dec) { return n === null || n === undefined ? '—' : (n * 100).toFixed(dec === undefined ? 2 : dec).replace('.', ',') + '%'; }

  return {
    claveMes: claveMes, enMes: enMes, sumarMeses: sumarMeses, mesesCompletos: mesesCompletos, diasEntre: diasEntre,
    proximaFecha: proximaFecha, estadoTasaCero: estadoTasaCero, cuotaEnMes: cuotaEnMes, resumenMes: resumenMes,
    sobres: sobres, dinero: dinero, leerNumero: leerNumero, pct: pct, NO_GASTO: NO_GASTO,
    amortizar: amortizar, cuotaNivelada: cuotaNivelada, planTasaCero: planTasaCero, abonosEnMes: abonosEnMes, tipoAbono: tipoAbono, cuentaTasaCero: cuentaTasaCero,
    esTarjeta: esTarjeta, sentidoSobre: sentidoSobre, analizarSobres: analizarSobres, saldosSobres: saldosSobres, reparto: reparto,
    fondos: fondos, sugerirSubcuenta: sugerirSubcuenta, deudaTarjeta: deudaTarjeta, meDeben: meDeben, esCobro: esCobro, esSobreReal: esSobreReal, esCuentaReal: esCuentaReal, TIPO_SACAR: TIPO_SACAR, TIPO_METER: TIPO_METER, esSacarMeter: esSacarMeter, esCompraTarjeta: esCompraTarjeta, sobresAl: sobresAl, esAhorro: esAhorro, origenes: origenes, efectoCuenta: efectoCuenta, movsCuenta: movsCuenta, efectosCuentas: efectosCuentas, normNom: normNom, leerDesde: leerDesde, entraTransferencia: entraTransferencia, saldoCuenta: saldoCuenta, historialSobre: historialSobre, saldosMensualesSobre: saldosMensualesSobre, leerBusqueda: leerBusqueda, coincide: coincide, rangoPeriodo: rangoPeriodo, ultimoCorte: ultimoCorte, presupuesto: presupuesto, periodoPresupuesto: periodoPresupuesto, cortesPrefs: cortesPrefs, esDeCorte: esDeCorte, corteDe: corteDe, periodoCorte: periodoCorte, presupuestoCorte: presupuestoCorte, historialCorte: historialCorte, categoriaPresupuesto: categoriaPresupuesto, promediosPresupuesto: promediosPresupuesto, librePresupuesto: librePresupuesto, cuotasAlCorte: cuotasAlCorte, saldoTasaCeroTarjeta: saldoTasaCeroTarjeta, pagosProximos: pagosProximos, porPagarTarjeta: porPagarTarjeta, tarjetaDesconocida: tarjetaDesconocida, fechasSalario: fechasSalario, esSalario: esSalario, viaje: viaje, enViaje: enViaje, categoriaViaje: categoriaViaje, marcaViaje: marcaViaje, esEfectivo: esEfectivo, esFamilia: esFamilia, efectivoPropioViaje: efectivoPropioViaje, familia4: familia4, personaFamilia: personaFamilia, familiaPrefs: familiaPrefs, SIN_FAMILIA: SIN_FAMILIA, CATS_VIAJE: CATS_VIAJE, aMoneda: aMoneda
  };
})();
if (typeof module !== 'undefined') module.exports = Calc;
