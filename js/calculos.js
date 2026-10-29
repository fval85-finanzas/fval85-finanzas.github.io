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

  // ---------------- Tasa cero ----------------
  function estadoTasaCero(t, hoy) {
    var cuota = t.meses ? t.monto / t.meses : t.monto;
    if (!t.primeraCuota) return { cuota: cuota, cobradas: 0, restantes: t.meses, saldo: t.monto, ultima: null, estado: 'Sin fecha' };
    var primera = new Date(t.primeraCuota);
    var ultima = sumarMeses(primera, t.meses - 1);
    var cobradas = soloFecha(hoy) < soloFecha(primera) ? 0 : Math.min(t.meses, mesesCompletos(primera, hoy) + 1);
    var restantes = t.meses - cobradas;
    return {
      cuota: cuota, cobradas: cobradas, restantes: restantes, saldo: restantes * cuota, ultima: ultima,
      estado: restantes === 0 ? 'Terminada' : (cobradas === 0 ? 'Por iniciar' : 'Activa')
    };
  }

  function cuotaEnMes(t, mes) {
    if (!t.primeraCuota) return 0;
    var primera = new Date(t.primeraCuota);
    var ultima = sumarMeses(primera, t.meses - 1);
    var k = claveMes(mes);
    return k >= claveMes(primera) && k <= claveMes(ultima) ? t.monto / t.meses : 0;
  }

  // ---------------- Resumen del mes ----------------
  function resumenMes(d, mes) {
    var r = {
      gastos: { CRC: 0, USD: 0 }, ingresos: { CRC: 0, USD: 0 }, cuotasTC: { CRC: 0, USD: 0 },
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
      var c = cuotaEnMes(t, mes);
      if (!c) return;
      var mon = t.moneda === 'USD' ? 'USD' : 'CRC';
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

  function pct(n, dec) { return n === null || n === undefined ? '—' : (n * 100).toFixed(dec === undefined ? 2 : dec).replace('.', ',') + '%'; }

  return {
    claveMes: claveMes, enMes: enMes, sumarMeses: sumarMeses, mesesCompletos: mesesCompletos, diasEntre: diasEntre,
    proximaFecha: proximaFecha, estadoTasaCero: estadoTasaCero, cuotaEnMes: cuotaEnMes, resumenMes: resumenMes,
    sobres: sobres, dinero: dinero, leerNumero: leerNumero, pct: pct, NO_GASTO: NO_GASTO
  };
})();
if (typeof module !== 'undefined') module.exports = Calc;
