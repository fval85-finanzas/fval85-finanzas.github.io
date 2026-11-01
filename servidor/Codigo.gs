/**
 * FINANZAS — servidor (Google Apps Script), todo en un solo archivo.
 * Pegalo completo en el archivo "Código" de Apps Script.
 * La app (pantallas) está en la carpeta web/ y se publica en GitHub Pages.
 */

// =====================================================================
// Config
// =====================================================================
/**
 * Config.js — Ajustes del programa.
 *
 * Los correos de los BANCOS (compras con tarjeta) se configuran en la
 * pestaña "Config" de la hoja, no aquí: así los cambiás sin tocar código.
 */

/** Comprobantes de pago del préstamo de casa (llegan con un .txt adjunto). */
var PRESTAMO_CORREO = {
  remitente: 'mensajero@bancobcr.com',
  // Si ese remitente manda otros avisos, poné aquí parte del asunto, ej. 'Comprobante de pago'.
  asunto: ''
};

/** Avisos de SINPE Móvil del BCR (mismo remitente que el préstamo; se distinguen por el asunto). */
var SINPE_CORREO = { remitente: 'mensajero@bancobcr.com', asunto: 'SINPEMOVIL' };

/** La primera vez, cuántos días hacia atrás revisar el correo. */
var DIAS_ATRAS = 30;

/** Etiquetas que se ponen en Gmail para que veas qué se leyó. */
var ETIQUETA_PROCESADO = 'Finanzas/Procesado';
var ETIQUETA_REVISAR = 'Finanzas/Revisar';

/** Sobres especiales que se calculan solos. */
var SOBRE_PRESTAMO = 'Cuota casa';
var SOBRE_TASA_CERO = 'Cuotas tasa cero';
var SOBRE_TARJETAS = 'Pago tarjetas';
var SOBRE_FONDOS = 'Fondos';

/** BCR SAFI (fondos de inversión): se leen las "Solicitud de inversión / de retiro"; las confirmaciones con PDF se ignoran. */
var FONDOS_CORREO = 'mensajerobcrsafi@bancobcr.com';


// =====================================================================
// Parser
// =====================================================================
/**
 * Parser.js — Extrae los datos de un correo de notificación bancaria.
 *
 * Funciones puras (sin Gmail ni internet) para poder probarlas en la computadora.
 * Si un banco usa un formato distinto, se agrega un patrón nuevo en las listas.
 */

/** Convierte "12,345.67" / "12.345,67" / "12345" / "1 234,50" en número. */
function convertirNumero(texto) {
  var t = String(texto).replace(/\s/g, '');
  var ultimaComa = t.lastIndexOf(',');
  var ultimoPunto = t.lastIndexOf('.');
  var sepDecimal = null;

  if (ultimaComa > -1 && ultimoPunto > -1) {
    sepDecimal = ultimaComa > ultimoPunto ? ',' : '.';
  } else if (ultimaComa > -1 || ultimoPunto > -1) {
    var sep = ultimaComa > -1 ? ',' : '.';
    var decimales = t.length - t.lastIndexOf(sep) - 1;
    var apariciones = t.split(sep).length - 1;
    // "12,50" o "12.5" → decimal; "12,345" o "1.234.567" → miles
    if (apariciones === 1 && decimales !== 3) sepDecimal = sep;
  }

  if (sepDecimal === ',') t = t.replace(/\./g, '').replace(',', '.');
  else if (sepDecimal === '.') t = t.replace(/,/g, '');
  else t = t.replace(/[.,]/g, '');

  var n = parseFloat(t);
  return isNaN(n) ? null : n;
}

/** Identifica la moneda a partir de un símbolo o palabra. */
function identificarMoneda(texto) {
  var t = String(texto).toUpperCase();
  if (/USD|US\$|\$|D[OÓ]LAR/.test(t)) return 'USD';
  if (/CRC|₡|¢|COL[OÓ]N|COLONES/.test(t)) return 'CRC';
  return null;
}

var NUM = '(\\d{1,3}(?:[.,\\s]\\d{3})*(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)';
var MON = '(USD|US\\$|CRC|\\$|₡|¢|COLONES|D[OÓ]LARES)';

/** Busca el monto y la moneda. Devuelve { monto, moneda } o null. */
function extraerMonto(texto) {
  var patrones = [
    // "Monto: CRC 12,345.67" / "Monto: $25.00"
    new RegExp('(?:monto|importe|valor|total)[^\\n\\d$₡¢A-Z]{0,20}' + MON + '\\s*' + NUM, 'i'),
    // "Monto: 12,345.67 CRC"
    new RegExp('(?:monto|importe|valor|total)[^\\n\\d$₡¢]{0,20}' + NUM + '\\s*' + MON, 'i'),
    // en cualquier parte: "USD 25.00" / "₡12.345,00"
    new RegExp(MON + '\\s*' + NUM, 'i'),
    // en cualquier parte: "25.00 USD"
    new RegExp(NUM + '\\s*' + MON, 'i')
  ];
  for (var i = 0; i < patrones.length; i++) {
    var m = texto.match(patrones[i]);
    if (!m) continue;
    var a = m[1], b = m[2];
    var esMonedaPrimero = identificarMoneda(a) !== null && /^[^\d]/.test(a);
    var moneda = identificarMoneda(esMonedaPrimero ? a : b);
    var monto = convertirNumero(esMonedaPrimero ? b : a);
    if (moneda && monto !== null && monto > 0) return { monto: monto, moneda: moneda };
  }
  return null;
}

/** Lee el valor que sigue a una etiqueta, ej. "Comercio: AUTOMERCADO" */
function valorDeEtiqueta(texto, etiquetas) {
  for (var i = 0; i < etiquetas.length; i++) {
    var re = new RegExp('(?:^|\\n|\\s)' + etiquetas[i] + '\\s*[:\\-]?\\s*([^\\n]+)', 'i');
    var m = texto.match(re);
    if (m) {
      var v = m[1].trim().replace(/\s{2,}/g, ' ');
      if (v) return v;
    }
  }
  return null;
}

function extraerComercio(texto) {
  var v = valorDeEtiqueta(texto, [
    'comercio', 'establecimiento', 'nombre del comercio', 'lugar de compra', 'merchant'
  ]);
  if (!v) {
    var m = texto.match(/(?:[Cc]ompra|[Tt]ransacci[oó]n|[Cc]argo)\s+(?:[Rr]ealizad[ao]\s+)?[Ee]n\s+([A-Z0-9][A-Z0-9 &*.\-\/]{2,40})/);
    if (m) v = m[1];
  }
  return v ? v.replace(/\s+(el|por|con|monto)\b.*$/i, '').trim().slice(0, 80) : null;
}

function extraerLugar(texto) {
  return valorDeEtiqueta(texto, ['ciudad y pa[ií]s', 'ciudad', 'pa[ií]s', 'ubicaci[oó]n']);
}

function extraerUltimos4(texto) {
  var m = texto.match(/(?:terminad[ao]\s+en|finalizad[ao]\s+en|[*xX•]{2,}[\s-]*|tarjeta[^\n\d]{0,30})(\d{4})\b/i);
  return m ? m[1] : null;
}

function extraerAutorizacion(texto) {
  var m = texto.match(/(?:autorizaci[oó]n|c[oó]digo de autorizaci[oó]n|referencia|n[uú]mero de referencia|comprobante)\s*(?:n[o°º.]*)?\s*[:#\-]?\s*([A-Z0-9]{4,20})/i);
  return m ? m[1] : null;
}

var MESES = {
  ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5, jul: 6,
  ago: 7, aug: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11, dec: 11
};

/** Busca la fecha de la transacción. Si no la encuentra, usa la del correo. */
function extraerFecha(texto, fechaCorreo) {
  var hora = texto.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?\s?m\.?)?/i);
  var h = 0, min = 0;
  if (hora) {
    h = parseInt(hora[1], 10); min = parseInt(hora[2], 10);
    var ampm = hora[4] ? hora[4].toLowerCase().replace(/[.\s]/g, '') : '';
    if (ampm === 'pm' && h < 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
  }

  // 27/10/2026 o 27-10-26
  var m = texto.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (m) {
    var anio = parseInt(m[3], 10); if (anio < 100) anio += 2000;
    return crearFechaCR(anio, parseInt(m[2], 10) - 1, parseInt(m[1], 10), h, min);
  }
  // 2026-10-27
  m = texto.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return crearFechaCR(+m[1], +m[2] - 1, +m[3], h, min);
  // 27 oct 2026 / 27 de octubre de 2026
  m = texto.match(/\b(\d{1,2})\s+(?:de\s+)?([a-záéíóú]{3})[a-záéíóú]*\.?\s+(?:de\s+)?(\d{4})\b/i);
  if (m && MESES[m[2].toLowerCase()] !== undefined) {
    return crearFechaCR(+m[3], MESES[m[2].toLowerCase()], +m[1], h, min);
  }
  // Oct 27, 2026
  m = texto.match(/\b([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (m && MESES[m[1].toLowerCase()] !== undefined) {
    return crearFechaCR(+m[3], MESES[m[1].toLowerCase()], +m[2], h, min);
  }
  return fechaCorreo || new Date();
}

/** Crea una fecha en hora de Costa Rica (UTC-6, sin horario de verano). */
function crearFechaCR(anio, mes, dia, h, min) {
  return new Date(Date.UTC(anio, mes, dia, h + 6, min));
}

/** Gasto o ingreso, según palabras del correo. */
function extraerTipo(texto) {
  return /(dep[oó]sito|recibi[oó]|recibiste|acreditad|abono|transferencia recibida|devoluci[oó]n|reembolso)/i.test(texto)
    ? 'ingreso' : 'gasto';
}

/**
 * Función principal: recibe el texto del correo y devuelve la transacción,
 * o null si el correo no parece una transacción.
 */
function parsearCorreo(texto, fechaCorreo, banco) {
  var limpio = String(texto).replace(/\r/g, '').replace(/ /g, ' ');
  var monto = extraerMonto(limpio);
  if (!monto) return null;
  return {
    fecha: extraerFecha(limpio, fechaCorreo).toISOString(),
    comercio: extraerComercio(limpio),
    lugar: extraerLugar(limpio),
    monto: monto.monto,
    moneda: monto.moneda,
    tipo: extraerTipo(limpio),
    ultimos4: extraerUltimos4(limpio),
    autorizacion: extraerAutorizacion(limpio),
    banco: banco || null,
    origen: 'correo'
  };
}


// =====================================================================
// FORMATOS REALES DE LOS BANCOS (v1.5)
// =====================================================================

/** Quita etiquetas HTML y traduce los &códigos; más comunes. */
function textoDeHtml_(h) {
  var ent = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
    Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', iexcl: '¡', iquest: '¿', colon: '₡' };
  return String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(+n); })
    .replace(/&([a-zA-Z]+);?/g, function (m, n) { return ent[n] !== undefined ? ent[n] : m; });
}
/** Filas de las tablas de un correo HTML: [[celda, celda, …], …] */
function filasTablaHtml_(html) {
  var filas = [], mf, re = /<tr[\s\S]*?<\/tr>/gi;
  while ((mf = re.exec(String(html || ''))) !== null) {
    var celdas = [], mc, rc = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    while ((mc = rc.exec(mf[0])) !== null) celdas.push(textoDeHtml_(mc[1]).replace(/\s+/g, ' ').trim());
    if (celdas.length) filas.push(celdas);
  }
  return filas;
}
function sinTildes_(t) { return String(t).normalize ? String(t).normalize('NFD').replace(/[̀-ͯ]/g, '') : String(t); }
function nombrePropio_(t) {
  return String(t || '').toLowerCase().replace(/(^|[\s(\-\/])([a-záéíóúñ])/g, function (m, a, b) { return a + b.toUpperCase(); });
}

// Lugares de Costa Rica que suelen venir pegados al final del nombre del comercio
var LUGARES_CR = ['SAN JOSE', 'ALAJUELA', 'HEREDIA', 'CARTAGO', 'PUNTARENAS', 'LIMON', 'LIBERIA', 'ESCAZU', 'SANTA ANA', 'CURRIDABAT',
  'MONTES DE OCA', 'SAN PEDRO', 'DESAMPARADOS', 'TIBAS', 'MORAVIA', 'GOICOECHEA', 'GUADALUPE', 'BELEN', 'SANTO DOMINGO', 'GRECIA',
  'NARANJO', 'PALMARES', 'SAN RAMON', 'ATENAS', 'POAS', 'SARCHI', 'ZARCERO', 'SAN CARLOS', 'CIUDAD QUESADA', 'NICOYA', 'SANTA CRUZ',
  'TILARAN', 'CANAS', 'TURRIALBA', 'PARAISO', 'LA UNION', 'TRES RIOS', 'OREAMUNO', 'PEREZ ZELEDON', 'SAN ISIDRO', 'QUEPOS', 'JACO',
  'GARABITO', 'OROTINA', 'SAN RAFAEL', 'FLORES', 'BARVA', 'SAN PABLO', 'ASERRI', 'ALAJUELITA', 'COLON', 'CIUDAD COLON', 'MORA',
  'PURISCAL', 'UPALA', 'GUACIMO', 'POCOCI', 'GUAPILES', 'SIQUIRRES', 'HATILLO', 'PAVAS', 'ROHRMOSER', 'LINDORA', 'URUCA', 'ZAPOTE',
  'SABANILLA', 'VALVERDE VEGA', 'POAS', 'SAN ANTONIO', 'BELEN HEREDIA', 'SAN FRANCISCO', 'SANTA BARBARA', 'SAN JUAN', 'COYOL', 'TACARES'];
var PAISES = { CRI: 'Costa Rica', CR: 'Costa Rica', USA: 'Estados Unidos', US: 'Estados Unidos', PAN: 'Panamá', MEX: 'México', ESP: 'España',
  NIC: 'Nicaragua', COL: 'Colombia', GBR: 'Reino Unido', IRL: 'Irlanda', NLD: 'Países Bajos', CAN: 'Canadá', CHN: 'China', SGP: 'Singapur', LUX: 'Luxemburgo' };

/** "TIENDA DE MASCOTAS SAN ALAJUELA CRI" → { comercio: 'TIENDA DE MASCOTAS SAN', lugar: 'Alajuela' } */
function separarComercio_(t) {
  var s = String(t || '').trim();
  var pais = null, m = s.match(/\s([A-Z]{2,3})$/);
  if (m && PAISES[m[1]]) { pais = m[1]; s = s.slice(0, -m[0].length).trim(); }
  var partes = s.split(/\s{2,}/);
  var comercio = s.replace(/\s+/g, ' '), ciudad = null;
  if (partes.length > 1) { ciudad = partes.pop(); comercio = partes.join(' ').replace(/\s+/g, ' '); }
  else {
    var plano = sinTildes_(comercio).toUpperCase();
    LUGARES_CR.slice().sort(function (a, b) { return b.length - a.length; }).some(function (l) {
      if (plano.length > l.length + 2 && plano.slice(-l.length - 1) === ' ' + l) { ciudad = comercio.slice(-l.length); comercio = comercio.slice(0, -l.length - 1).trim(); return true; }
      return false;
    });
  }
  var lugar = ciudad ? nombrePropio_(ciudad) : '';
  if (pais && pais !== 'CRI' && pais !== 'CR') lugar = (lugar ? lugar + ', ' : '') + PAISES[pais];
  return { comercio: comercio, lugar: lugar };
}

/** BCR Tarjetas: tabla "Detalle de Transacciones" (puede traer varias). Devuelve [tx] (vacío si todas rechazadas) o null. */
function parsearBCRTabla(texto, html) {
  if (!/Detalle de Transacciones/i.test(texto + ' ' + textoDeHtml_(html)) && !/Autorizaci/i.test(texto)) return null;
  var ultimos4 = ((texto + ' ' + textoDeHtml_(html)).match(/\*{4}[-\s]*\*{4}[-\s]*\*{4}[-\s]*(\d{4})/) || [])[1] || extraerUltimos4(texto);
  var crudas = [];
  var filas = filasTablaHtml_(html), enc = null;
  filas.forEach(function (f) {
    var u = sinTildes_(f.join('|')).toUpperCase();
    if (!enc && /AUTORIZACION/.test(u) && /MONTO/.test(u)) {
      enc = {}; f.forEach(function (c, i) { enc[sinTildes_(c).toUpperCase().replace(/[^A-Z]/g, '')] = i; }); return;
    }
    if (enc && f.length >= 5 && /\d{1,2}\/\d{1,2}\/\d{4}/.test(f[enc.FECHA !== undefined ? enc.FECHA : 0])) {
      var g = function (k, d) { return enc[k] !== undefined ? f[enc[k]] : d; };
      crudas.push({ fecha: g('FECHA', ''), aut: g('AUTORIZACION', ''), ref: g('NOREFERENCIA', ''), monto: g('MONTO', ''), moneda: g('MONEDA', ''), comercio: g('COMERCIO', ''), estado: g('ESTADO', 'Aprobada') });
    }
  });
  if (!crudas.length) {   // sin HTML: se lee del texto plano
    var t = String(texto).replace(/[ \t ]+/g, ' ');
    var re = /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}(?::\d{2})?)\s+(\S+)\s+(\S+)\s+([\d.,]+)\s+(COLON(?:ES)? COSTA RICA|COLONES|COLON|D[OÓ]LAR(?:ES)? (?:ESTADOUNIDENSES?|AMERICANOS?|USA|EEUU)|D[OÓ]LAR(?:ES)?|USD|CRC)\s+([\s\S]+?)\s+(Aprobad[ao]|Rechazad[ao]|Declinad[ao]|Reversad[ao]|Anulad[ao])\b/gi, m;
    while ((m = re.exec(t)) !== null) crudas.push({ fecha: m[1] + ' ' + m[2], aut: m[3], ref: m[4], monto: m[5], moneda: m[6], comercio: m[7].replace(/\s*\n\s*/g, ' '), estado: m[8] });
  }
  if (!crudas.length) return null;
  return crudas.filter(function (c) { return /aprobad/i.test(c.estado || 'Aprobada'); }).map(function (c) {
    var f = c.fecha.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    var sep = separarComercio_(c.comercio);
    return {
      fecha: crearFechaCR(+f[3], +f[2] - 1, +f[1], +(f[4] || 0), +(f[5] || 0)).toISOString(),
      comercio: sep.comercio, lugar: sep.lugar, monto: convertirNumero(c.monto), moneda: identificarMoneda(c.moneda) || 'CRC',
      tipo: 'gasto', ultimos4: ultimos4, autorizacion: String(c.aut || c.ref).trim(), banco: 'BCR', origen: 'correo'
    };
  });
}

/** Davibank: compra con tarjeta (texto corrido). */
function parsearDavibankCompra(texto) {
  var t = String(texto).replace(/&nbsp;?/g, ' ').replace(/\s+/g, ' ');
  var m = t.match(/transacci[oó]n realizada en (.+?),\s*el d[ií]a (\d{1,2})\/(\d{1,2})\/(\d{4}) a las (\d{1,2}):(\d{2})\s*([AP]\.?\s?M\.?)?.*?terminada en (\d{4}).*?autorizaci[oó]n\s+(\w+).*?por\s+(USD|CRC|US\$|\$|₡|¢|COLONES|D[OÓ]LARES)\s*([\d.,]*\d),?\s*fue\s+(aprobada|rechazada|declinada|denegada)/i);
  if (!m) return null;
  if (!/aprobada/i.test(m[12])) return [];
  var h = +m[5]; var ap = (m[7] || '').toUpperCase().replace(/[.\s]/g, '');
  if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
  var lugar = '', comercio = m[1].trim();
  var l = comercio.match(/^(.*\S)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s(?:de\s)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)$/);
  if (l) { comercio = l[1]; lugar = l[2]; }
  return [{
    fecha: crearFechaCR(+m[4], +m[3] - 1, +m[2], h, +m[6]).toISOString(), comercio: comercio, lugar: lugar,
    monto: convertirNumero(m[11]), moneda: identificarMoneda(m[10]) || 'CRC', tipo: 'gasto', ultimos4: m[8],
    autorizacion: m[9], banco: 'Davibank', origen: 'correo'
  }];
}

/** Davibank: pago de servicios (se paga con la tarjeta Davibank). */
function parsearDavibankServicio(texto, fechaCorreo) {
  var t = String(texto).replace(/&nbsp;?/g, ' ').replace(/\r/g, '');
  if (!/pago de servicios/i.test(t)) return null;
  var m = t.match(/caracter[ií]sticas:\s*\n?\s*([^\n]+?)\s*\n[\s\S]*?(\d{4,})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(₡|¢|\$|USD|CRC)\s*([\d.,]+)/i);
  if (!m) return null;
  var servicio = m[1].replace(/\s+/g, ' ').trim();
  var monto = convertirNumero(m[5]), moneda = identificarMoneda(m[4]) || 'CRC';
  return [{
    fecha: (fechaCorreo || new Date()).toISOString(), comercio: servicio, lugar: '', monto: monto, moneda: moneda, tipo: 'gasto',
    ultimos4: null, autorizacion: 'serv-' + m[2] + '-' + m[3].replace(/\//g, '') + '-' + Math.round(monto * 100),
    banco: 'Davibank', origen: 'correo', esServicio: true, categoria: 'Servicios', nota: 'Pago de servicio · identificador ' + m[2]
  }];
}

/** ¿Las palabras de dos nombres son las mismas (sin importar el orden)? */
function mismoNombre_(a, b) {
  var p = function (x) { return sinTildes_(x).toUpperCase().replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 1; }); };
  var A = p(a), B = p(b);
  if (A.length < 2 || B.length < 2) return false;
  var comunes = A.filter(function (w) { return B.indexOf(w) >= 0; }).length;
  return comunes >= 2 && comunes === Math.min(A.length, B.length);   // un pariente con los mismos apellidos no cuenta
}

/** BCR SINPE Móvil: enviado (gasto o transferencia a tu nombre) o recibido (ingreso). */
function parsearSINPE(texto) {
  var t = String(texto).replace(/\r/g, '').replace(/ /g, ' ');
  var debito = /se le ha debitado/i.test(t), credito = /se le ha acreditado/i.test(t);
  if (!debito && !credito) return null;
  var g = function (re) { var m = t.match(re); return m ? m[1].trim() : ''; };
  var monto = convertirNumero(g(/Monto:\s*([\d.,]+)/i));
  if (!monto) return null;
  var nombre = g(/Nombre cliente (?:destino|origen):\s*([^\n]+)/i).replace(/_+/g, ' ').replace(/[\s*]+$/, '').replace(/\s+/g, ' ').trim();
  var titular = g(/Estimado \(a\):\s*([^\n]+)/i);
  var tel = g(/Tel[eé]fono (?:destino|origen):\s*(\d+)/i);
  var entidad = g(/Entidad (?:destino|origen):\s*([^\n]+)/i);
  var motivo = g(/Motivo:\s*([^\n]+)/i).replace(/[_*]+/g, ' ').replace(/\s+/g, ' ').trim();
  var f = t.match(/realizada el (\d{1,2})\/(\d{1,2})\/(\d{4}) a las (\d{1,2}):(\d{2})\s*([AP]\.?\s?M\.?)?/i);
  var fecha = null;
  if (f) {
    var h = +f[4], ap = (f[6] || '').toUpperCase().replace(/[.\s]/g, '');
    if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
    fecha = crearFechaCR(+f[3], +f[2] - 1, +f[1], h, +f[5]);
  }
  var propia = debito && mismoNombre_(nombre, titular);
  var nota = [motivo ? 'Motivo: ' + motivo : '', tel && tel !== '0' ? 'Tel ' + tel : '', entidad].filter(String).join(' · ');
  return {
    fecha: fecha ? fecha.toISOString() : null, monto: monto, moneda: 'CRC',
    comercio: (debito ? 'SINPE a ' : 'SINPE de ') + (nombre || 'desconocido'),
    tipoMov: credito ? 'Ingreso' : propia ? 'Transferencia' : 'Gasto', tipo: credito ? 'ingreso' : 'gasto',
    autorizacion: g(/N[uú]mero de referencia:\s*(\d+)/i), nota: nota, banco: 'BCR', origen: 'correo', esSINPE: true
  };
}

/** BCR SAFI: "Solicitud de inversión" o "Solicitud de retiro" (llegan en el momento). */
function parsearSAFI(texto, fechaCorreo) {
  var t = String(texto).replace(/\r/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ');
  var m = t.match(/realiz[oó] una inversi[oó]n en el fondo (.+?)\s*,?\s*con el n[uú]mero de orden (\d+) por un monto de\s*(¢|₡|US\$|\$)\s*([\d.,]*\d).*?en firme el d[ií]a (\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  var tipo = 'Inversión';
  if (!m) { m = t.match(/realiz[oó] un retiro del fondo (.+?)\s*,?\s*con el n[uú]mero de retiro (\d+) por un monto de\s*(¢|₡|US\$|\$)\s*([\d.,]*\d).*?acreditada en la cuenta seleccionada el d[ií]a (\d{1,2})\/(\d{1,2})\/(\d{4})/i); tipo = 'Retiro de fondo'; }
  if (!m) return null;
  var fondo = m[1].replace(/\s+/g, ' ').trim();
  var fFirme = new Date(Date.UTC(+m[7], +m[6] - 1, +m[5], 18, 0));
  return {
    tipoMov: tipo, fondo: fondo, numero: m[2], monto: convertirNumero(m[4]), moneda: identificarMoneda(m[3]) || 'CRC',
    fecha: (tipo === 'Inversión' ? (fechaCorreo || fFirme) : fFirme).toISOString(),
    comercio: (tipo === 'Inversión' ? 'Inversión · ' : 'Retiro · ') + fondo,
    autorizacion: 'SAFI-' + (tipo === 'Inversión' ? 'I-' : 'R-') + m[2],
    nota: (tipo === 'Inversión' ? 'Orden ' + m[2] + ' · en firme ' : 'Retiro ' + m[2] + ' · se acredita ') + m[5] + '/' + m[6] + '/' + m[7],
    banco: 'BCR SAFI', origen: 'correo'
  };
}

/**
 * Despacha el correo de un banco al lector que corresponde.
 * Devuelve una lista de transacciones (vacía = correo entendido pero sin nada que anotar) o null si no se pudo leer.
 */
function parsearCorreoBanco(texto, html, fechaCorreo, banco) {
  var todo = String(texto || '') + '\n' + textoDeHtml_(html);
  if (/Detalle de Transacciones/i.test(todo)) { var r = parsearBCRTabla(texto, html); if (r) return r; }
  if (/pago de servicios/i.test(todo)) { var s = parsearDavibankServicio(texto, fechaCorreo) || parsearDavibankServicio(textoDeHtml_(html), fechaCorreo); if (s) return s; }
  if (/transacci[oó]n realizada en/i.test(todo)) { var d = parsearDavibankCompra(texto) || parsearDavibankCompra(textoDeHtml_(html)); if (d) return d; }
  if (/SINPE/i.test(todo)) { var x = parsearSINPE(texto) || parsearSINPE(textoDeHtml_(html)); if (x) return [x]; }
  var tx = parsearCorreo(texto, fechaCorreo, banco);
  return tx ? [tx] : null;
}

// Permite usar este archivo en las pruebas (Node). Apps Script lo ignora.
if (typeof module !== 'undefined') {
  module.exports = { parsearCorreo: parsearCorreo, convertirNumero: convertirNumero, extraerMonto: extraerMonto };
}


// =====================================================================
// ParserPrestamo
// =====================================================================
/**
 * ParserPrestamo.js — Lee el comprobante de pago del préstamo (adjunto .txt del BCR).
 *
 * Formato real del BCR: "RECIBO POR PAGO DE PRESTAMOS" (RECIBOPAGOPRESTAMO.TXT).
 * Si llega otro formato, se intenta con el lector general de más abajo.
 *
 * Usa convertirNumero() de Parser.js.
 */

var ETIQUETAS_PRESTAMO = {
  comprobante: /(n[uú]mero\s+de\s+)?(comprobante|transacci[oó]n|referencia|documento|recibo)\b/i,
  principal: /(amortizaci[oó]n|principal|capital|abono\s+a\s+principal)/i,
  intereses: /inter[eé]s(es)?/i,
  polizas: /(p[oó]liza|seguro|desgravamen|incendio)/i,
  total: /(total|monto\s+pagado|monto\s+del\s+pago|monto\s+total)/i,
  fecha: /fecha/i
};

/** Montos que aparecen en una línea (ignora porcentajes y números largos tipo cuenta). */
function montosEnLinea_(linea) {
  var sinPct = linea.replace(/\d+(?:[.,]\d+)?\s*%/g, ' ');
  var re = /(?:₡|¢|CRC|\$|USD)?\s*(\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{1,2})?|\d+[.,]\d{1,2})(?!\d)/g;
  var out = [], m;
  while ((m = re.exec(sinPct)) !== null) {
    var n = convertirNumero(m[1]);
    if (n !== null) out.push(n);
  }
  return out;
}

function fechaEnTexto_(texto) {
  var m = texto.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (m) {
    var a = +m[3]; if (a < 100) a += 2000;
    return new Date(Date.UTC(a, +m[2] - 1, +m[1], 12, 0));
  }
  m = texto.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12, 0));
  return null;
}


/** Recibo real del BCR (RECIBOPAGOPRESTAMO.TXT). Devuelve null si no es ese formato. */
function parsearReciboBCR(texto) {
  var t = String(texto).replace(/\r/g, '');
  if (!/RECIBO POR PAGO DE PRESTAMOS/i.test(t)) return null;
  var n = function (re) { var m = t.match(re); return m ? convertirNumero(m[1]) || 0 : 0; };
  var s = function (re) { var m = t.match(re); return m ? m[1].trim() : ''; };
  var f = t.match(/Fecha\/Hora:\s*(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/i);
  if (!f) return null;
  var polizasOtros = 0, re = /^\s*POL[^\n]*?\s([\d,]+\.\d{2})\s*$/gim, m;
  while ((m = re.exec(t)) !== null) polizasOtros += convertirNumero(m[1]) || 0;
  var capital = n(/Capital Cuota\s+([\d,]+\.\d{2})/i), extra = n(/Abono Extraord\.?\s+([\d,]+\.\d{2})/i);
  var intereses = n(/^\s*Intereses\s+([\d,]+\.\d{2})/im) + n(/Ints Moratorio\s+([\d,]+\.\d{2})/i) +
    n(/Comis\.Atraso\s+([\d,]+\.\d{2})/i) + n(/Comis\.Pag\.Ant\.?\s+([\d,]+\.\d{2})/i);
  var polizas = n(/^\s*Polizas\s+([\d,]+\.\d{2})/im) + polizasOtros;
  var r = {
    fecha: new Date(Date.UTC(+f[3], +f[2] - 1, +f[1], +(f[4] || 12) + 6, +(f[5] || 0))),
    comprobante: s(/Numero de Recibo:\s*(\d+)/i), cuota: Number(s(/Numero de Cuota:\s*(\d+)/i)) || null,
    principal: capital + extra, abonoExtra: extra, intereses: intereses, polizas: polizas,
    total: n(/Total al Cobro\s*:\s*([\d,]+\.\d{2})/i), saldoAnterior: n(/SALDO ANTERIOR\s*:\s*([\d,]+\.\d{2})/i),
    saldoNuevo: n(/NUEVO SALDO\s*:\s*([\d,]+\.\d{2})/i), tasa: (parseFloat(s(/Tasa de interes\s*:\s*([\d.]+)/i)) || 0) / 100,
    cuotasPendientes: Number(s(/Cuotas Pend\.Pago:\s*(\d+)/i)) || null, proximoVenc: null
  };
  var px = t.match(/F-Vence Prox Cuota[;:]\s*(\d{1,2})-(\d{1,2})-(\d{4})/i);
  if (px) r.proximoVenc = new Date(Date.UTC(+px[3], +px[2] - 1, +px[1], 12, 0));
  ['principal', 'abonoExtra', 'intereses', 'polizas', 'total'].forEach(function (k) { r[k] = Math.round(r[k] * 100) / 100; });
  if (!r.total) r.total = Math.round((r.principal + r.intereses + r.polizas) * 100) / 100;
  return r.principal || r.intereses ? r : null;
}

/** ¿Es el estado de cuenta mensual (OP_….TXT)? Ese no se anota. */
function esEstadoCuentaPrestamo(texto) { return /ESTADO DE CUENTA DETALLADO DEL CREDITO/i.test(String(texto)); }

/**
 * Devuelve { fecha, comprobante, principal, intereses, polizas, total } o null.
 * `fechaCorreo` se usa si el texto no trae fecha.
 */
function parsearComprobantePrestamo(texto, fechaCorreo) {
  var recibo = parsearReciboBCR(texto);
  if (recibo) return recibo;
  var lineas = String(texto).replace(/\r/g, '').replace(/ /g, ' ').split('\n');
  var r = { fecha: null, comprobante: null, principal: 0, intereses: 0, polizas: 0, total: null };
  var vistos = { principal: false, intereses: false, polizas: false };

  lineas.forEach(function (l) {
    var linea = l.trim();
    if (!linea) return;
    var low = linea.toLowerCase();

    if (!r.fecha && ETIQUETAS_PRESTAMO.fecha.test(linea)) r.fecha = fechaEnTexto_(linea);

    if (!r.comprobante && ETIQUETAS_PRESTAMO.comprobante.test(linea)) {
      var c = linea.match(/[:#\-]?\s*([A-Z0-9]{5,20})\s*$/i);
      if (c && /\d/.test(c[1])) r.comprobante = c[1];
    }

    var montos = montosEnLinea_(linea);
    if (montos.length === 0) return;
    var valor = montos[montos.length - 1];          // el monto suele ir al final de la línea

    if (/tasa/.test(low)) return;                    // "Tasa de interés 6,56%"
    if (/saldo/.test(low)) return;                   // "Saldo anterior / nuevo saldo"
    if (ETIQUETAS_PRESTAMO.total.test(linea) && !ETIQUETAS_PRESTAMO.intereses.test(linea)) {
      r.total = valor; return;
    }
    if (ETIQUETAS_PRESTAMO.intereses.test(linea)) { r.intereses += valor; vistos.intereses = true; return; }
    if (ETIQUETAS_PRESTAMO.polizas.test(linea)) { r.polizas += valor; vistos.polizas = true; return; }
    if (ETIQUETAS_PRESTAMO.principal.test(linea)) { r.principal += valor; vistos.principal = true; return; }
  });

  if (!vistos.principal && r.total !== null) {
    r.principal = Math.round((r.total - r.intereses - r.polizas) * 100) / 100;
    vistos.principal = r.principal > 0;
  }
  if (!vistos.principal || !vistos.intereses) return null;
  if (r.principal + r.intereses <= 0) return null;   // sin capital ni intereses no es un pago (ej. estado de cuenta)
  r.fecha = r.fecha || fechaCorreo || new Date();
  if (r.total === null) r.total = r.principal + r.intereses + r.polizas;
  ['principal', 'intereses', 'polizas', 'total'].forEach(function (k) { r[k] = Math.round(r[k] * 100) / 100; });
  return r;
}

if (typeof module !== 'undefined') {
  module.exports = { parsearComprobantePrestamo: parsearComprobantePrestamo, parsearReciboBCR: parsearReciboBCR, esEstadoCuentaPrestamo: esEstadoCuentaPrestamo };
}


// =====================================================================
// Hoja
// =====================================================================
/**
 * Hoja.js — Lectura y escritura en la Google Sheet.
 *
 * Las columnas se buscan por el NOMBRE del encabezado, así que podés
 * reordenarlas o agregar columnas nuevas. Lo que no se puede es cambiar
 * el texto de los encabezados ni el nombre de las pestañas.
 */

var FILA_ENCABEZADO = {
  'Movimientos': 4,
  'Cuentas': 4,
  'Tasa Cero': 6,
  'Sobres': 4,
  'Préstamo casa': 15,
  'Tasas BCCR': 4,
  'Reglas': 4,
  'Recurrentes': 4,
  'Config': 4,
  'Abonos tasa cero': 4,
  'Movimientos de sobres': 4,
  'Fondos': 4,
  'Viajes': 4
};

function libro_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive();
}

function hoja_(nombre) {
  var h = libro_().getSheetByName(nombre);
  if (!h) throw new Error('No encuentro la pestaña "' + nombre + '". No le cambiés el nombre.');
  return h;
}

/** { 'Encabezado': númeroDeColumna } */
function columnas_(h, filaEnc) {
  var enc = h.getRange(filaEnc, 1, 1, h.getLastColumn()).getDisplayValues()[0];
  var m = {};
  enc.forEach(function (t, i) { t = String(t).trim(); if (t && !m[t]) m[t] = i + 1; });
  return m;
}

function exigir_(cols, nombres, pestaña) {
  nombres.forEach(function (n) {
    if (!cols[n]) throw new Error('Falta la columna "' + n + '" en la pestaña ' + pestaña + '.');
  });
}

/**
 * Lee una tabla y devuelve las filas donde la columna `clave` tiene algo.
 * Cada fila es un objeto { _fila: número, 'Encabezado': valor, ... }.
 */
function leerTabla_(nombre, clave) {
  var h = hoja_(nombre);
  var f0 = FILA_ENCABEZADO[nombre];
  var cols = columnas_(h, f0);
  exigir_(cols, [clave], nombre);
  var n = h.getLastRow() - f0;
  var filas = [];
  if (n > 0) {
    var datos = h.getRange(f0 + 1, 1, n, h.getLastColumn()).getValues();
    var ci = cols[clave] - 1;
    datos.forEach(function (r, i) {
      if (r[ci] === '' || r[ci] === null) return;
      var o = { _fila: f0 + 1 + i };
      for (var k in cols) o[k] = r[cols[k] - 1];
      filas.push(o);
    });
  }
  return { hoja: h, cols: cols, filas: filas, filaEnc: f0 };
}

/** Agrega al final del encabezado las columnas que falten (para versiones nuevas sin tocar la hoja a mano). */
function asegurarColumnas_(nombre, columnas) {
  var h = hoja_(nombre), f0 = FILA_ENCABEZADO[nombre];
  var cols = columnas_(h, f0), ultima = h.getLastColumn();
  columnas.forEach(function (c) {
    if (cols[c]) return;
    ultima++;
    h.getRange(f0, ultima).setValue(c);
    cols[c] = ultima;
  });
  columnas.forEach(function (c) { formatoEncabezado_(h, f0, cols[c]); });
  return cols;
}

/** Copia el formato del título de la izquierda (color, letra, alto) y deja la columna con buen ancho. */
function formatoEncabezado_(h, f0, col) {
  if (col <= 1) return;
  var tipo = SpreadsheetApp.CopyPasteType ? SpreadsheetApp.CopyPasteType.PASTE_FORMAT : null;
  if (tipo) h.getRange(f0, col - 1).copyTo(h.getRange(f0, col), tipo, false);
  h.getRange(f0, col).setWrap(true);
  h.setColumnWidth(col, 130);
}

/** Primera fila vacía en la columna `col` (debajo del encabezado). Agrega filas si hace falta. */
function primeraFilaVacia_(h, filaEnc, col) {
  var max = h.getMaxRows();
  var n = Math.max(max - filaEnc, 1);
  var v = h.getRange(filaEnc + 1, col, n, 1).getValues();
  for (var i = 0; i < v.length; i++) {
    if (v[i][0] === '' || v[i][0] === null) return filaEnc + 1 + i;
  }
  h.insertRowsAfter(max, 200);
  return max + 1;
}

/**
 * Escribe los valores de `obj` ({ 'Encabezado': valor }) en la fila indicada.
 * Nunca sobrescribe una celda que tenga fórmula.
 */
function escribirFila_(h, fila, cols, obj) {
  var ultimaCol = h.getLastColumn();
  var rango = h.getRange(fila, 1, 1, ultimaCol);
  var formulas = rango.getFormulas()[0];
  var valores = rango.getValues()[0];
  var cambio = false;
  for (var k in obj) {
    var c = cols[k];
    if (!c || formulas[c - 1]) continue;
    valores[c - 1] = obj[k] === undefined ? '' : obj[k];
    cambio = true;
  }
  if (!cambio) return;
  // Se escriben solo las celdas sin fórmula, en bloques contiguos
  var inicio = null;
  for (var i = 0; i <= ultimaCol; i++) {
    var libre = i < ultimaCol && !formulas[i];
    if (libre && inicio === null) inicio = i;
    if (!libre && inicio !== null) {
      h.getRange(fila, inicio + 1, 1, i - inicio).setValues([valores.slice(inicio, i)]);
      inicio = null;
    }
  }
}

/** Fecha → texto ISO (google.script.run no acepta objetos Date). */
function iso_(v) {
  if (v instanceof Date) return v.toISOString();
  if (v === '' || v === null || v === undefined) return null;
  var m = String(v).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);   // fecha escrita como texto: 31/10/2026
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12).toISOString();
  return v;
}

function num_(v) {
  if (typeof v === 'number') return v;
  if (v === '' || v === null || v === undefined) return null;
  // v2.2.1: números escritos como texto en la hoja ("₡32 978,54", "$1 245,00", con espacios normales o duros)
  var t = String(v).replace(/[^\d,.\-]/g, '');
  if (!t || !/\d/.test(t)) return null;
  var n = convertirNumero(t);
  return n === null ? null : n;
}

function texto_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

/** Lee una lista de la pestaña Config por el título de su columna (ej. "Categorías"). */
function listaConfig_(titulo) {
  var h = hoja_('Config');
  var cols = columnas_(h, 4);
  if (!cols[titulo]) return [];
  var v = h.getRange(5, cols[titulo], 30, 1).getValues();
  return v.map(function (r) { return texto_(r[0]); }).filter(String);
}


// =====================================================================
// Codigo
// =====================================================================
/**
 * Codigo.js — La web app: muestra la página y responde a lo que pide.
 */

/**
 * Codigo — La app vive en GitHub Pages (carpeta web/). Este código es el
 * "servidor": recibe los pedidos de la app (doPost) y lee/escribe la hoja.
 */
function doGet() {
  return ContentService.createTextOutput('Finanzas: servidor funcionando. La app se abre desde GitHub Pages.');
}

/** Ejecutar UNA vez desde el editor: guarda la hoja, la zona horaria y activa lo automático. */
function configurarInicial() {
  var libro = SpreadsheetApp.getActive();
  if (!libro) throw new Error('Abrí Apps Script desde la hoja: Extensiones → Apps Script.');
  var p = PropertiesService.getScriptProperties();
  p.setProperty('SHEET_ID', libro.getId());
  libro.setSpreadsheetTimeZone('America/Costa_Rica');
  if (!p.getProperty('CLAVE_APP')) p.setProperty('CLAVE_APP', nuevaClave_());
  activarAutomatico();
  console.log('✅ Listo. Hoja: ' + libro.getName() + '. Correos cada 15 min; recurrentes y recordatorios cada día.');
  verClaveApp();
}

function nuevaClave_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 32);
}

/** Muestra la clave que se escribe en la app (Configuración → Conexión). */
function verClaveApp() {
  console.log('🔑 Clave de la app: ' + PropertiesService.getScriptProperties().getProperty('CLAVE_APP'));
}

/** Crea una clave nueva (la anterior deja de funcionar en todos los teléfonos). */
function cambiarClaveApp() {
  PropertiesService.getScriptProperties().setProperty('CLAVE_APP', nuevaClave_());
  verClaveApp();
}

// ---------------------------------------------------------------------
// LECTURA: todo lo que la app necesita, en una sola llamada
// ---------------------------------------------------------------------
function obtenerDatos_() {
  var cfgH = hoja_('Config');
  var tc = num_(cfgH.getRange('B15').getValue()) || 0;

  var cuentas = leerTabla_('Cuentas', 'Nombre (único)').filas.map(function (r) {
    return {
      fila: r._fila, nombre: texto_(r['Nombre (único)']), tipo: texto_(r['Tipo']), banco: texto_(r['Banco']),
      ultimos4: texto_(r['Últimos 4']), moneda: texto_(r['Moneda principal']) || 'CRC',
      limiteCRC: num_(r['Límite ₡']), limiteUSD: num_(r['Límite $']),
      diaCorte: num_(r['Día de corte']), diaPago: num_(r['Día de pago']),
      activa: texto_(r['Activa']) !== 'No',
      saldoCRC: num_(r['Saldo actual ₡']), saldoUSD: num_(r['Saldo actual $']), fechaSaldo: iso_(r['Fecha del saldo']), notas: texto_(r['Notas'])
    };
  });

  var mov = leerTabla_('Movimientos', 'Fecha').filas;
  var movimientos = mov.slice(-3000).map(function (r) {
    return {
      fila: r._fila, fecha: iso_(r['Fecha']), comercio: texto_(r['Comercio / descripción']), lugar: texto_(r['Lugar']),
      monto: num_(r['Monto']) || 0, moneda: texto_(r['Moneda']) || 'CRC', tipo: texto_(r['Tipo']) || 'Gasto',
      cuenta: texto_(r['Cuenta / tarjeta']), categoria: texto_(r['Categoría']), sobre: texto_(r['Sobre']),
      origen: texto_(r['Origen']), autorizacion: texto_(r['Autorización']), nota: texto_(r['Nota']),
      subcuenta: texto_(r['Subcuenta']), viaje: texto_(r['Viaje']), para: texto_(r['Para otra persona']), cobro: texto_(r['Cobro'])
    };
  });

  // las preparaciones de versiones anteriores solo corren hasta que quedan hechas (una lectura de propiedades)
  if (PropertiesService.getScriptProperties().getProperty('V17_LISTO') !== 'si') { prepararSobresV16_(); prepararV161_(); prepararV17_(); }
  if (PropertiesService.getScriptProperties().getProperty('V22_LISTO') !== 'si') prepararV22_();
  var sobres = leerTabla_('Sobres', 'Sobre');
  var formulasSob = sobres.hoja.getRange(1, sobres.cols['Asignado por mes'], sobres.hoja.getLastRow(), 1).getFormulas();
  var listaSobres = sobres.filas.map(function (r) {
    return {
      fila: r._fila, nombre: texto_(r['Sobre']), moneda: texto_(r['Moneda']) || 'CRC',
      asignado: num_(r['Asignado por mes']), tipo: texto_(r['Tipo']) || 'Variable', notas: texto_(r['Notas']),
      asignadoAuto: !!formulasSob[r._fila - 1][0],
      saldoInicial: num_(r['Saldo inicial']) || 0, ajuste: texto_(r['Ajuste del reparto']) === 'Sí', meta: num_(r['Meta'])
    };
  });

  var tasaCero = leerTabla_('Tasa Cero', 'Descripción').filas.map(function (r) {
    return {
      fila: r._fila, descripcion: texto_(r['Descripción']), tarjeta: texto_(r['Tarjeta']),
      fechaCompra: iso_(r['Fecha de compra']), monto: num_(r['Monto total']) || 0, moneda: texto_(r['Moneda']) || 'CRC',
      meses: num_(r['Meses']) || 1, primeraCuota: iso_(r['Primera cuota']), abonos: []
    };
  });
  // Abonos extra: se unen a su compra por descripción + tarjeta
  leerAbonosTC_().forEach(function (a) {
    var t = tasaCero.filter(function (x) { return x.descripcion === a.compra && (!a.tarjeta || x.tarjeta === a.tarjeta); })[0];
    if (t) t.abonos.push(a);
  });

  return JSON.stringify({
    hoy: new Date().toISOString(),
    tipoCambio: tc,
    cuentas: cuentas,
    movimientos: movimientos,
    sobres: listaSobres,
    tasaCero: tasaCero,
    prestamo: datosPrestamo_(),
    tasas: leerTabla_('Tasas BCCR', 'Fecha de la TBP (día 7)').filas.slice(-24).map(function (r) {
      return { fecha: iso_(r['Fecha de la TBP (día 7)']), tbp: num_(r['TBP']), tasa: num_(r['Tasa del préstamo']) };
    }),
    categorias: listaConfig_('Categorías'),
    tiposCuenta: listaConfig_('Tipos de cuenta'),
    tiposMovimiento: listaConfig_('Tipo de movimiento'),
    sobreEspecial: sobresEspeciales_(listaSobres.map(function (s) { return s.nombre; })),
    sobresMov: leerSobresMov_(),
    ajustes: (function () { try { return obtenerAjustes_(); } catch (e) { return null; } })(),
    fondos: leerFondos_(),
    viajes: leerViajes_(),
    sobresDesde: PropertiesService.getScriptProperties().getProperty('SOBRES_DESDE'),
    ultimaRevision: PropertiesService.getScriptProperties().getProperty('ULTIMA_REVISION')
  });
}

function datosPrestamo_() {
  var t = leerTabla_('Préstamo casa', 'Fecha de pago');
  var h = t.hoja;
  // Cuadro de indicadores (celdas fijas de la pestaña)
  var g = h.getRange('G4:G11').getValues().map(function (r) { return r[0]; });
  var c = h.getRange('C4:C11').getValues().map(function (r) { return r[0]; });
  var k = h.getRange('K5:K8').getValues().map(function (r) { return r[0]; });
  return {
    operacion: texto_(c[0]), saldoInicial: num_(c[1]), plazo: num_(c[3]),
    tbp: num_(c[6]), tasa: num_(c[7]),
    saldo: num_(g[0]), pagadoPct: num_(g[1]), cuotasPagadas: num_(g[2]), restantes: num_(g[3]),
    ultimoPago: iso_(g[4]), proximoVenc: iso_(g[5]), interesesTotal: num_(g[7]),
    estimado: { principal: num_(k[0]), intereses: num_(k[1]), polizas: num_(k[2]), total: num_(k[3]) },
    pagos: t.filas.map(function (r) {
      return {
        fecha: iso_(r['Fecha de pago']), comprobante: texto_(r['N° comprobante']),
        principal: num_(r['Abono principal']) || 0, intereses: num_(r['Intereses']) || 0,
        polizas: (num_(r['Pólizas']) || 0) + (num_(r['Pólizas BCR']) || 0),
        total: num_(r['Total pagado']) || 0, saldo: num_(r['Saldo']),
        tbp: num_(r['TBP (tasa real)']), tasa: num_(r['Tasa BCR']),
        vence: iso_(r['Vence (día 7)']), anticipo: num_(r['Días de anticipo'])
      };
    })
  };
}

// ---------------------------------------------------------------------
// ESCRITURA
// ---------------------------------------------------------------------
function conBloqueo_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function fechaDe_(isoOTexto) {
  var d = new Date(isoOTexto);
  if (isNaN(d.getTime())) throw new Error('Fecha inválida: ' + isoOTexto);
  return d;
}

/** Crea o actualiza un movimiento. `m.fila` vacío = nuevo. */
function guardarMovimiento_(m) {
  return conBloqueo_(function () {
    var t = leerTabla_('Movimientos', 'Fecha');
    // v2.3.1: un movimiento nuevo con el mismo número de autorización/documento no se agrega dos veces
    if (!m.fila && m.autorizacion) {
      var ya = t.filas.filter(function (r) { return texto_(r['Autorización']) === String(m.autorizacion); })[0];
      if (ya) return ya._fila;
    }
    // el origen tiene que ser uno de la lista de Config (si la columna tiene validación, otro valor da error)
    var origenes = listaConfig_('Origen');
    if (origenes.length && origenes.indexOf(m.origen || 'Manual') < 0) m.origen = origenes.indexOf('Manual') >= 0 ? 'Manual' : origenes[0];
    var fila = m.fila || primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Fecha']);
    if (m.fila) verificarFila_(t.hoja, m.fila, t.cols, m.control);
    escribirFila_(t.hoja, fila, t.cols, {
      'Fecha': fechaDe_(m.fecha),
      'Comercio / descripción': m.comercio || '',
      'Lugar': m.lugar || '',
      'Monto': Number(m.monto),
      'Moneda': m.moneda,
      'Tipo': m.tipo,
      'Cuenta / tarjeta': m.cuenta || '',
      'Categoría': m.categoria || '',
      'Sobre': m.sobre || '',
      'Origen': m.origen || 'Manual',
      'Autorización': m.autorizacion || '',
      'Nota': m.nota || ''
    });
    if (m.recordarRegla && m.comercio && (m.categoria || m.sobre)) guardarRegla_(m.comercio, m.categoria, m.sobre);
    return fila;
  });
}

/** Evita editar/borrar la fila equivocada si la hoja cambió mientras la app estaba abierta. */
function verificarFila_(h, fila, cols, control) {
  if (!control) return;
  var v = h.getRange(fila, 1, 1, h.getLastColumn()).getValues()[0];
  var monto = num_(v[cols['Monto'] - 1]);
  if (Math.abs((monto || 0) - Number(control.monto)) > 0.001) {
    throw new Error('La hoja cambió desde que abriste la app. Tocá Configuración → Recargar datos e intentá de nuevo.');
  }
}

function eliminarMovimiento_(fila, control) {
  return conBloqueo_(function () {
    var t = leerTabla_('Movimientos', 'Fecha');
    verificarFila_(t.hoja, fila, t.cols, control);
    t.hoja.deleteRow(fila);
    // 1.9: las pestañas que apuntan a un movimiento por su número de fila se corren una fila (y se borran las del movimiento eliminado)
    ajustarReferencias_('Movimientos de sobres', 'Fecha', fila);
    ajustarReferencias_('Abonos tasa cero', 'Fecha', fila);
    return true;
  });
}
function ajustarReferencias_(pestaña, clave, fila) {
  if (!libro_().getSheetByName(pestaña)) return;
  var t = leerTabla_(pestaña, clave), c = t.cols['Movimiento'];
  if (!c) return;
  var borrar = [];
  t.filas.forEach(function (r) {
    var m = num_(r['Movimiento']);
    if (!m) return;
    if (m === fila) { if (pestaña === 'Movimientos de sobres') borrar.push(r._fila); else t.hoja.getRange(r._fila, c).setValue(''); }
    else if (m > fila) t.hoja.getRange(r._fila, c).setValue(m - 1);
  });
  borrar.sort(function (a, b) { return b - a; }).forEach(function (f) { t.hoja.deleteRow(f); });
}

function guardarRegla_(patron, categoria, sobre) {
  var t = leerTabla_('Reglas', 'Si el comercio contiene');
  var p = String(patron).trim().toUpperCase();
  var existente = t.filas.filter(function (r) { return texto_(r['Si el comercio contiene']).toUpperCase() === p; })[0];
  var fila = existente ? existente._fila : primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Si el comercio contiene']);
  escribirFila_(t.hoja, fila, t.cols, { 'Si el comercio contiene': p, 'Categoría': categoria || '', 'Sobre': sobre || '' });
}

/** Convierte una compra en compra a tasa cero y crea su fila en la pestaña Tasa Cero. */
function pasarATasaCero_(fila, control, meses, primeraCuotaIso) {
  return conBloqueo_(function () {
    var t = leerTabla_('Movimientos', 'Fecha');
    verificarFila_(t.hoja, fila, t.cols, control);
    var v = t.hoja.getRange(fila, 1, 1, t.hoja.getLastColumn()).getValues()[0];
    var get = function (n) { return v[t.cols[n] - 1]; };
    escribirFila_(t.hoja, fila, t.cols, { 'Tipo': 'Compra tasa cero', 'Sobre': SOBRE_TASA_CERO });

    var z = leerTabla_('Tasa Cero', 'Descripción');
    var fz = primeraFilaVacia_(z.hoja, z.filaEnc, z.cols['Descripción']);
    escribirFila_(z.hoja, fz, z.cols, {
      'Descripción': texto_(get('Comercio / descripción')) || 'Compra tasa cero',
      'Tarjeta': get('Cuenta / tarjeta'),
      'Fecha de compra': get('Fecha'),
      'Monto total': get('Monto'),
      'Moneda': get('Moneda'),
      'Meses': Number(meses),
      'Primera cuota': fechaDe_(primeraCuotaIso)
    });
    return true;
  });
}

// ---------------------------------------------------------------------
// ABONOS EXTRA A COMPRAS TASA CERO (pestaña "Abonos tasa cero", se crea sola)
// ---------------------------------------------------------------------
var COLS_ABONOS = ['Fecha', 'Compra', 'Tarjeta', 'Monto', 'Moneda', 'De dónde salió', 'Contar como gasto', 'Movimiento', 'Nota'];

function hojaAbonos_() {
  var libro = libro_();
  var h = libro.getSheetByName('Abonos tasa cero');
  if (h) return h;
  h = libro.insertSheet('Abonos tasa cero');
  h.getRange('A1').setValue('Abonos extra a compras tasa cero').setFontSize(14).setFontWeight('bold');
  h.getRange('A2').setValue('La app los anota sola. "Compra" debe ser igual a la Descripción en la pestaña Tasa Cero. La cuota se recalcula: lo que falta ÷ cuotas que faltan.');
  h.getRange('A2').setFontColor('#666666');
  h.getRange(4, 1, 1, COLS_ABONOS.length).setValues([COLS_ABONOS]).setFontWeight('bold').setBackground('#121417').setFontColor('#F5B82E');
  h.setFrozenRows(4);
  h.getRange('A5:A').setNumberFormat('dd/mm/yyyy');
  h.getRange('D5:D').setNumberFormat('#,##0.00');
  h.setColumnWidth(2, 220); h.setColumnWidth(6, 200); h.setColumnWidth(9, 200);
  return h;
}

function leerAbonosTC_() {
  if (!libro_().getSheetByName('Abonos tasa cero')) return [];
  return leerTabla_('Abonos tasa cero', 'Fecha').filas.map(function (r) {
    return {
      fila: r._fila, fecha: iso_(r['Fecha']), compra: texto_(r['Compra']), tarjeta: texto_(r['Tarjeta']),
      monto: num_(r['Monto']) || 0, moneda: texto_(r['Moneda']) || 'CRC', origen: texto_(r['De dónde salió']),
      gasto: texto_(r['Contar como gasto']) !== 'No', movimiento: num_(r['Movimiento']) || null, nota: texto_(r['Nota'])
    };
  });
}

/** Crea o actualiza un abono. a = { fila?, fecha, compra, tarjeta, monto, moneda, origen, gasto, movimiento, nota, control? } */
function guardarAbonoTC_(a) {
  return conBloqueo_(function () {
    if (!a.compra) throw new Error('Falta la compra.');
    if (!(Number(a.monto) > 0)) throw new Error('El monto debe ser mayor que cero.');
    hojaAbonos_();
    var t = leerTabla_('Abonos tasa cero', 'Fecha');
    if (a.fila) verificarFila_(t.hoja, a.fila, t.cols, a.control);
    var fila = a.fila || primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Fecha']);
    escribirFila_(t.hoja, fila, t.cols, {
      'Fecha': fechaDe_(a.fecha), 'Compra': a.compra, 'Tarjeta': a.tarjeta || '', 'Monto': Number(a.monto),
      'Moneda': a.moneda || 'CRC', 'De dónde salió': a.origen || '', 'Contar como gasto': a.gasto === false ? 'No' : 'Sí',
      'Movimiento': a.movimiento || '', 'Nota': a.nota || ''
    });
    return true;
  });
}

function eliminarAbonoTC_(fila, control) {
  return conBloqueo_(function () {
    var t = leerTabla_('Abonos tasa cero', 'Fecha');
    verificarFila_(t.hoja, fila, t.cols, control);
    t.hoja.deleteRow(fila);
    return true;
  });
}

// ---------------------------------------------------------------------
// SOBRES CON SALDO (v1.6): pestaña "Movimientos de sobres" (se crea sola)
// Cada fila suma (+) o resta (−) plata a un sobre. Las de un mismo "Grupo" se hicieron juntas.
// ---------------------------------------------------------------------
var COLS_SOBRES_MOV = ['Fecha', 'Sobre', 'Monto', 'Tipo', 'Movimiento', 'Grupo', 'Nota'];

/** Una sola vez: columnas nuevas en Sobres, fecha de inicio y el sobre "Pago tarjetas". */
function prepararSobresV16_() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('V16_LISTO') === 'si') return;
  asegurarColumnas_('Sobres', ['Saldo inicial', 'Ajuste del reparto', 'Meta']);
  if (!p.getProperty('SOBRES_DESDE')) {
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    p.setProperty('SOBRES_DESDE', hoy.toISOString());
  }
  var t = leerTabla_('Sobres', 'Sobre');
  if (!t.filas.some(function (r) { return texto_(r['Sobre']) === SOBRE_TARJETAS; })) {
    var f = primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Sobre']);
    escribirFila_(t.hoja, f, t.cols, { 'Sobre': SOBRE_TARJETAS, 'Moneda': 'CRC', 'Asignado por mes': 0, 'Tipo': 'Ahorro', 'Saldo inicial': 0 });
  }
  p.setProperty('V16_LISTO', 'si');
}

/** 1.6.1: títulos nuevos con formato, nota en "Asignado por mes" y la pestaña de movimientos de sobres. */
function prepararV161_() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('V161_LISTO') === 'si') return;
  var cols = asegurarColumnas_('Sobres', ['Saldo inicial', 'Ajuste del reparto', 'Meta']);
  var h = hoja_('Sobres'), f0 = FILA_ENCABEZADO['Sobres'];
  ['Saldo inicial', 'Meta'].forEach(function (c) { h.getRange(f0 + 1, cols[c], 200, 1).setNumberFormat('#,##0.00'); });
  if (cols['Asignado por mes']) h.getRange(f0, cols['Asignado por mes']).setNote('Tu reparto de siempre: la app lo usa para llenar el reparto cuando entra el salario.');
  if (cols['Saldo inicial']) h.getRange(f0, cols['Saldo inicial']).setNote('Lo que tenía cada sobre el día de inicio (Configuración → Saldos de los sobres desde).');
  if (cols['Ajuste del reparto']) h.getRange(f0, cols['Ajuste del reparto']).setNote('Escribí Sí en UN sobre: recibe (o cubre) la diferencia cuando el salario no es el de siempre.');
  hojaSobresMov_();
  p.setProperty('V161_LISTO', 'si');
}

// ---------------------------------------------------------------------
// v1.7: FONDOS DE INVERSIÓN y VIAJES (pestañas que se crean solas)
// ---------------------------------------------------------------------
var COLS_FONDOS = ['Subcuenta', 'Fondo', 'Moneda', 'Saldo', 'Fecha del saldo', 'Meta', 'Intereses (último ajuste)', 'Notas'];
var COLS_VIAJES = ['Viaje', 'Desde', 'Hasta', 'Límite', 'Moneda', 'Tarjetas', 'Subcuenta', 'Activo', 'Avisado'];

function crearPestaña_(nombre, titulo, nota, cols, anchos) {
  var libro = libro_(), h = libro.getSheetByName(nombre);
  if (h) return h;
  h = libro.insertSheet(nombre);
  h.getRange('A1').setValue(titulo).setFontSize(14).setFontWeight('bold');
  h.getRange('A2').setValue(nota).setFontColor('#666666');
  h.getRange(4, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#121417').setFontColor('#F5B82E');
  h.setFrozenRows(4);
  (anchos || []).forEach(function (w, i) { if (w) h.setColumnWidth(i + 1, w); });
  return h;
}

/** Una sola vez: columnas Subcuenta y Viaje en Movimientos, sobre Fondos, tipos nuevos, pestañas Fondos/Viajes y títulos de Sobres. */
function prepararV17_() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('V17_LISTO') === 'si') return;
  asegurarColumnas_('Movimientos', ['Subcuenta', 'Viaje']);
  var t = leerTabla_('Sobres', 'Sobre');
  // solo si no tenés ya un sobre de fondos con tu propio nombre (ej. "SOBRE FONDOS DE INVERSION")
  if (!t.filas.some(function (r) { return /fondo|inversi/i.test(texto_(r['Sobre'])); })) {
    var f = primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Sobre']);
    escribirFila_(t.hoja, f, t.cols, { 'Sobre': SOBRE_FONDOS, 'Moneda': 'CRC', 'Asignado por mes': 0, 'Tipo': 'Ahorro', 'Saldo inicial': 0 });
  }
  // tipos nuevos en la lista de Config (para el menú desplegable)
  var cfg = hoja_('Config'), cc = columnas_(cfg, 4);
  if (cc['Tipo de movimiento']) {
    var v = cfg.getRange(5, cc['Tipo de movimiento'], 30, 1).getValues().map(function (r) { return texto_(r[0]); });
    ['Inversión', 'Retiro de fondo'].forEach(function (tipo) {
      if (v.indexOf(tipo) >= 0) return;
      var i = v.indexOf(''); if (i < 0) return;
      cfg.getRange(5 + i, cc['Tipo de movimiento']).setValue(tipo); v[i] = tipo;
    });
  }
  crearPestaña_('Fondos', 'Fondos de inversión', 'Una fila por subcuenta. "Saldo" es el del estado de cuenta a la "Fecha del saldo"; la app suma las inversiones y resta los retiros de después.', COLS_FONDOS, [200, 180, 80, 120, 120, 120, 150, 220]);
  crearPestaña_('Viajes', 'Presupuestos de viaje', 'Los crea la app. "Tarjetas" separadas por coma (puede incluir Efectivo).', COLS_VIAJES, [180, 100, 100, 100, 70, 280, 160, 70, 80]);
  // Sobres: las columnas E–H pasan a mostrar lo mismo que la app (las llena el servidor cada 15 min)
  var s = hoja_('Sobres'), sc = columnas_(s, 4);
  var nuevos = { 'Gastado en el mes': 'Salió este mes', 'Disponible': 'Saldo actual' };
  Object.keys(nuevos).forEach(function (k) { if (sc[k]) s.getRange(4, sc[k]).setValue(nuevos[k]); });
  var res = libro_().getSheetByName('Resumen');
  if (res) {
    var vals = res.getRange(1, 1, Math.min(res.getLastRow(), 80), 8).getValues();
    vals.forEach(function (fila, i) {
      if (texto_(fila[0]) === 'Sobre') {
        fila.forEach(function (x, j) {
          if (texto_(x) === 'Gastado') res.getRange(i + 1, j + 1).setValue('Salió este mes');
          if (texto_(x) === 'Disponible') res.getRange(i + 1, j + 1).setValue('Saldo actual');
        });
      }
    });
  }
  p.setProperty('V17_LISTO', 'si');
}

function leerFondos_() {
  if (!libro_().getSheetByName('Fondos')) return [];
  return leerTabla_('Fondos', 'Subcuenta').filas.map(function (r) {
    return { fila: r._fila, nombre: texto_(r['Subcuenta']), fondo: texto_(r['Fondo']), moneda: texto_(r['Moneda']) || 'CRC',
      saldo: num_(r['Saldo']) || 0, fechaSaldo: iso_(r['Fecha del saldo']), meta: num_(r['Meta']), intereses: num_(r['Intereses (último ajuste)']) || 0, notas: texto_(r['Notas']) };
  });
}
function leerViajes_() {
  if (!libro_().getSheetByName('Viajes')) return [];
  return leerTabla_('Viajes', 'Viaje').filas.map(function (r) {
    return { fila: r._fila, nombre: texto_(r['Viaje']), desde: iso_(r['Desde']), hasta: iso_(r['Hasta']), limite: num_(r['Límite']) || 0,
      moneda: texto_(r['Moneda']) || 'USD', tarjetas: texto_(r['Tarjetas']).split(',').map(function (x) { return x.trim(); }).filter(String),
      subcuenta: texto_(r['Subcuenta']), activo: texto_(r['Activo']) !== 'No', avisado: num_(r['Avisado']) || 0 };
  });
}

/** Crea o actualiza una subcuenta. f = { fila?, nombre, fondo, moneda, saldo, meta } */
function guardarFondo_(f) {
  return conBloqueo_(function () {
    prepararV17_();
    var t = leerTabla_('Fondos', 'Subcuenta');
    var nombre = String(f.nombre || '').trim();
    if (!nombre) throw new Error('Falta el nombre de la subcuenta.');
    if (t.filas.some(function (r) { return texto_(r['Subcuenta']) === nombre && r._fila !== f.fila; })) throw new Error('Ya existe la subcuenta "' + nombre + '".');
    var fila = f.fila || primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Subcuenta']);
    var datos = { 'Subcuenta': nombre, 'Fondo': f.fondo || '', 'Moneda': f.moneda || 'CRC', 'Meta': f.meta ? Number(f.meta) : '' };
    if (!f.fila) { datos['Saldo'] = Number(f.saldo) || 0; datos['Fecha del saldo'] = new Date(); }
    escribirFila_(t.hoja, fila, t.cols, datos);
    return fila;
  });
}
/** Actualizar a mano el saldo de una subcuenta (con el estado de cuenta). Lo que difiere del cálculo son los intereses. */
function actualizarSaldoFondo_(fila, saldo, intereses) {
  return conBloqueo_(function () {
    var t = leerTabla_('Fondos', 'Subcuenta');
    escribirFila_(t.hoja, fila, t.cols, { 'Saldo': Number(saldo) || 0, 'Fecha del saldo': new Date(), 'Intereses (último ajuste)': Math.round((Number(intereses) || 0) * 100) / 100 });
    return true;
  });
}
/** Escribe un valor en una columna de un movimiento (Subcuenta, Viaje…), verificando que sea el mismo. */
/** v2.2: "Fecha del saldo" en Cuentas (deuda que sube y baja) y "Para otra persona" / "Cobro" en Movimientos (Me deben). */
function prepararV22_() {
  var p = PropertiesService.getScriptProperties();
  if (p.getProperty('V22_LISTO') === 'si') return;
  var c = asegurarColumnas_('Cuentas', ['Fecha del saldo']);
  var h = hoja_('Cuentas');
  if (c['Fecha del saldo']) {
    var t = leerTabla_('Cuentas', 'Nombre (único)');
    h.getRange(t.filaEnc + 1, c['Fecha del saldo'], 300, 1).setNumberFormat('dd/mm/yyyy');
    h.getRange(t.filaEnc, c['Fecha del saldo']).setNote('Fecha a la que corresponde el saldo actual. Desde ese día la app suma las compras de la tarjeta y resta los pagos. Si está vacía, el saldo no se mueve solo.');
  }
  asegurarColumnas_('Movimientos', ['Subcuenta', 'Viaje', 'Para otra persona', 'Cobro']);
  p.setProperty('V22_LISTO', 'si');
}
/** Guarda la deuda real de una tarjeta a una fecha (desde la app: Tarjetas → ↻ Actualizar saldo). */
function actualizarSaldoCuenta_(fila, saldoCRC, saldoUSD, fecha) {
  return conBloqueo_(function () {
    prepararV22_();
    var t = leerTabla_('Cuentas', 'Nombre (único)');
    if (!t.filas.some(function (r) { return r._fila === fila; })) throw new Error('No encontré esa cuenta. Recargá.');
    escribirFila_(t.hoja, fila, t.cols, { 'Saldo actual ₡': Number(saldoCRC) || 0, 'Saldo actual $': Number(saldoUSD) || 0, 'Fecha del saldo': fecha ? fechaDe_(fecha) : new Date() });
    return true;
  });
}
function marcarMovimiento_(fila, columna, valor, control) {
  return conBloqueo_(function () {
    if (['Subcuenta', 'Viaje', 'Para otra persona', 'Cobro', 'Nota'].indexOf(columna) < 0) throw new Error('Columna no permitida.');
    asegurarColumnas_('Movimientos', ['Subcuenta', 'Viaje', 'Para otra persona', 'Cobro']);
    var t = leerTabla_('Movimientos', 'Fecha');
    verificarFila_(t.hoja, fila, t.cols, control);
    t.hoja.getRange(fila, t.cols[columna]).setValue(valor || '');
    return true;
  });
}
/** Crea o actualiza un viaje. v = { fila?, nombre, desde, hasta, limite, moneda, tarjetas:[], subcuenta, activo } */
function guardarViaje_(v) {
  return conBloqueo_(function () {
    prepararV17_();
    var t = leerTabla_('Viajes', 'Viaje');
    if (!String(v.nombre || '').trim()) throw new Error('Falta el nombre del viaje.');
    if (!(Number(v.limite) > 0)) throw new Error('El límite debe ser mayor que cero.');
    var desde = fechaDe_(v.desde), hasta = fechaDe_(v.hasta);
    if (hasta < desde) throw new Error('La fecha final es antes de la inicial.');
    var fila = v.fila || primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Viaje']);
    var datos = { 'Viaje': String(v.nombre).trim(), 'Desde': desde, 'Hasta': hasta, 'Límite': Number(v.limite), 'Moneda': v.moneda || 'USD',
      'Tarjetas': (v.tarjetas || []).join(', '), 'Subcuenta': v.subcuenta || '', 'Activo': v.activo === false ? 'No' : 'Sí' };
    if (v.reiniciarAvisos) datos['Avisado'] = '';
    escribirFila_(t.hoja, fila, t.cols, datos);
    return fila;
  });
}
function eliminarViaje_(fila) {
  return conBloqueo_(function () { var t = leerTabla_('Viajes', 'Viaje'); t.hoja.deleteRow(fila); return true; });
}

/** Cada revisión: avisos de viaje (80 % y 100 %) y columnas "Salió este mes / Saldo actual" de Sobres. */
function tareasDespuesDeLeer_() {
  var D = JSON.parse(obtenerDatos_());
  try { revisarViajes_(D); } catch (e) { console.log('Viajes: ' + e); }
  try { actualizarHojaSobres_(D); } catch (e) { console.log('Sobres: ' + e); }
}
function revisarViajes_(D) {
  var hoy = new Date();
  (D.viajes || []).forEach(function (v) {
    if (!v.activo || !v.desde || !v.hasta) return;
    var fin = new Date(v.hasta); fin.setDate(fin.getDate() + 3);
    if (hoy < new Date(v.desde) || hoy > fin) return;
    var r = Calc.viaje(D, v, hoy);
    var nivel = r.pct >= 1 ? 100 : r.pct >= 0.8 ? 80 : 0;
    if (!nivel || nivel <= (v.avisado || 0)) return;
    var mon = function (n) { return Calc.dinero(n, r.moneda); };
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Finanzas: ' + v.nombre + ' llegó al ' + Math.round(r.pct * 100) + '%',
      (nivel === 100 ? '⚠️ Llegaste al límite del presupuesto.' : '🔔 Ya usaste el 80 % del presupuesto.') + '\n\n' +
      'Gastado: ' + mon(r.gastado) + ' de ' + mon(r.limite) + '\nDisponible: ' + mon(r.disponible) +
      (r.diasRestantes ? '\nQuedan ' + r.diasRestantes + ' días: podés gastar ' + mon(r.porDia) + ' por día.' : '') + '\n\n— Finanzas');
    var t = leerTabla_('Viajes', 'Viaje');
    t.hoja.getRange(v.fila, t.cols['Avisado']).setValue(nivel);
  });
}
function actualizarHojaSobres_(D) {
  if (!D.sobresDesde) return;
  var r = Calc.saldosSobres(D, new Date(), new Date());
  var t = leerTabla_('Sobres', 'Sobre');
  var cSal = t.cols['Salió este mes'], cSaldo = t.cols['Saldo actual'], cPct = t.cols['% usado'], cEst = t.cols['Estado'];
  if (!cSal || !cSaldo) return;
  t.filas.forEach(function (fila) {
    var s = r.lista.filter(function (x) { return x.fila === fila._fila; })[0];
    if (!s) return;
    var estado = s.saldo < -0.005 ? 'Negativo' : s.meta && s.saldo >= s.meta ? 'Meta lograda' : s.pct >= 1 ? 'Agotado' : s.pct >= 0.85 ? 'Casi vacío' : 'OK';
    t.hoja.getRange(fila._fila, cSal).setValue(Math.round(s.salidas * 100) / 100);
    t.hoja.getRange(fila._fila, cSaldo).setValue(Math.round(s.saldo * 100) / 100);
    if (cPct) t.hoja.getRange(fila._fila, cPct).setValue(Math.round(s.pct * 1000) / 1000);
    if (cEst) t.hoja.getRange(fila._fila, cEst).setValue(estado);
  });
}

function hojaSobresMov_() {
  var libro = libro_();
  var h = libro.getSheetByName('Movimientos de sobres');
  if (h) return h;
  h = libro.insertSheet('Movimientos de sobres');
  h.getRange('A1').setValue('Movimientos de sobres').setFontSize(14).setFontWeight('bold');
  h.getRange('A2').setValue('Lo anota la app: repartos, asignaciones, pagos de tarjeta y movimientos entre sobres. Monto + entra al sobre, − sale.').setFontColor('#666666');
  h.getRange(4, 1, 1, COLS_SOBRES_MOV.length).setValues([COLS_SOBRES_MOV]).setFontWeight('bold').setBackground('#121417').setFontColor('#F5B82E');
  h.setFrozenRows(4);
  h.getRange('A5:A').setNumberFormat('dd/mm/yyyy');
  h.getRange('C5:C').setNumberFormat('#,##0.00');
  h.setColumnWidth(2, 180); h.setColumnWidth(7, 240);
  return h;
}

function leerSobresMov_() {
  if (!libro_().getSheetByName('Movimientos de sobres')) return [];
  return leerTabla_('Movimientos de sobres', 'Fecha').filas.map(function (r) {
    return {
      fila: r._fila, fecha: iso_(r['Fecha']), sobre: texto_(r['Sobre']), monto: num_(r['Monto']) || 0, tipo: texto_(r['Tipo']),
      movimiento: num_(r['Movimiento']) || null, grupo: texto_(r['Grupo']), nota: texto_(r['Nota'])
    };
  });
}

/** Guarda varias filas juntas. lista = [{ fecha, sobre, monto, tipo, movimiento, grupo, nota }] */
function guardarSobresMov_(lista) {
  return conBloqueo_(function () {
    if (!lista || !lista.length) throw new Error('No hay nada que guardar.');
    hojaSobresMov_();
    var t = leerTabla_('Movimientos de sobres', 'Fecha');
    // 1.8.1: no se puede asignar dos veces el mismo movimiento (p. ej. si el teléfono mostraba datos viejos)
    var nuevos = {};
    lista.forEach(function (x) { if (x.movimiento) nuevos[x.movimiento] = (nuevos[x.movimiento] || 0) + Math.abs(Number(x.monto) || 0); });
    var filasMov = Object.keys(nuevos);
    if (filasMov.length) {
      var mt = leerTabla_('Movimientos', 'Fecha');
      filasMov.forEach(function (f) {
        var ya = 0;
        t.filas.forEach(function (r) { if (String(num_(r['Movimiento'])) === String(f)) ya += Math.abs(num_(r['Monto']) || 0); });
        var mov = mt.filas.filter(function (r) { return String(r._fila) === String(f); })[0];
        if (!mov) throw new Error('No encontré ese movimiento en la hoja. Recargá los datos e intentá de nuevo.');
        var monto = Math.abs(num_(mov['Monto']) || 0);
        if (ya + nuevos[f] > monto + 0.01) {
          throw new Error(ya >= monto - 0.01 ? 'Este movimiento ya estaba asignado. Recargá los datos (Configuración → Recargar datos).'
            : 'Solo faltan ' + (Math.round((monto - ya) * 100) / 100) + ' por asignar en ese movimiento. Recargá los datos.');
        }
      });
    }
    var n = primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Fecha']);
    lista.forEach(function (x, i) {
      if (isNaN(Number(x.monto))) throw new Error('Monto inválido.');
      escribirFila_(t.hoja, n + i, t.cols, {
        'Fecha': fechaDe_(x.fecha), 'Sobre': x.sobre || '', 'Monto': Math.round(Number(x.monto) * 100) / 100, 'Tipo': x.tipo || '',
        'Movimiento': x.movimiento || '', 'Grupo': x.grupo || '', 'Nota': x.nota || ''
      });
    });
    return lista.length;
  });
}

/** Deshace una operación completa (todas las filas de un grupo). */
function eliminarGrupoSobres_(grupo) {
  return conBloqueo_(function () {
    if (!grupo) throw new Error('Falta el grupo.');
    var t = leerTabla_('Movimientos de sobres', 'Fecha');
    var filas = t.filas.filter(function (r) { return texto_(r['Grupo']) === String(grupo); }).map(function (r) { return r._fila; });
    filas.sort(function (a, b) { return b - a; }).forEach(function (f) { t.hoja.deleteRow(f); });
    return filas.length;
  });
}

/** "Recordar": regla para que los próximos correos con ese texto vayan solos a ese sobre (no toca la categoría). */
function guardarReglaSobre_(patron, sobre) {
  return conBloqueo_(function () {
    var t = leerTabla_('Reglas', 'Si el comercio contiene');
    var p = String(patron || '').trim().toUpperCase();
    if (!p) throw new Error('Falta el texto de la regla.');
    var ex = t.filas.filter(function (r) { return texto_(r['Si el comercio contiene']).toUpperCase() === p; })[0];
    var fila = ex ? ex._fila : primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Si el comercio contiene']);
    escribirFila_(t.hoja, fila, t.cols, ex ? { 'Sobre': sobre || '' } : { 'Si el comercio contiene': p, 'Sobre': sobre || '' });
    return true;
  });
}

/** Guarda el "reparto de siempre": montos por sobre y cuál es el sobre de ajuste. */
function guardarReparto_(lista, ajuste) {
  return conBloqueo_(function () {
    asegurarColumnas_('Sobres', ['Saldo inicial', 'Ajuste del reparto', 'Meta']);
    var t = leerTabla_('Sobres', 'Sobre');
    var formulas = t.hoja.getRange(1, t.cols['Asignado por mes'], t.hoja.getLastRow(), 1).getFormulas();
    t.filas.forEach(function (r) {
      var nombre = texto_(r['Sobre']);
      var x = (lista || []).filter(function (y) { return y.nombre === nombre; })[0];
      var datos = { 'Ajuste del reparto': nombre === ajuste ? 'Sí' : '' };
      if (x && !formulas[r._fila - 1][0]) datos['Asignado por mes'] = Number(x.monto) || 0;
      escribirFila_(t.hoja, r._fila, t.cols, datos);
    });
    return true;
  });
}

/**
 * Sobres especiales (los nombres los elegís vos en Configuración):
 *  prestamo → recibe solo los pagos del préstamo · fondos → las inversiones de BCR SAFI · tarjetas → "Todo de Pago tarjetas".
 * Si no elegiste, se busca uno por el nombre.
 */
function sobresEspeciales_(nombres) {
  var p = PropertiesService.getScriptProperties();
  function elegir(clave, porDefecto, patron) {
    var v = p.getProperty('SOBRE_ESP_' + clave);
    if (v === '-') return '';                                   // "ninguno" a propósito
    if (v && nombres.indexOf(v) >= 0) return v;
    if (nombres.indexOf(porDefecto) >= 0) return porDefecto;
    for (var i = 0; i < patron.length; i++) {
      var x = nombres.filter(function (n) { return patron[i].test(n); })[0];
      if (x) return x;
    }
    return '';
  }
  return {
    prestamo: elegir('PRESTAMO', SOBRE_PRESTAMO, [/operaci|pr[eé]stamo|hipotec/i, /cuota.*casa/i]),
    fondos: elegir('FONDOS', SOBRE_FONDOS, [/fondo|inversi/i]),
    tarjetas: elegir('TARJETAS', SOBRE_TARJETAS, [/pago.*tarjeta|tarjetas/i]),
    tasaCero: elegir('TASACERO', SOBRE_TASA_CERO, [/tasa ?cero/i])
  };
}
function sobreEspecial_(clave) {
  var t = leerTabla_('Sobres', 'Sobre');
  return sobresEspeciales_(t.filas.map(function (r) { return texto_(r['Sobre']); }))[clave] || '';
}
/** e = { prestamo, fondos, tarjetas } (nombre del sobre, o '' para ninguno) */
function guardarSobresEspeciales_(e) {
  var p = PropertiesService.getScriptProperties();
  ['prestamo', 'fondos', 'tarjetas'].forEach(function (k) {
    if (e[k] === undefined) return;
    p.setProperty('SOBRE_ESP_' + k.toUpperCase(), e[k] ? String(e[k]) : '-');
  });
  return true;
}

function guardarSobresDesde_(iso) {
  PropertiesService.getScriptProperties().setProperty('SOBRES_DESDE', fechaDe_(iso).toISOString());
  return true;
}

/** Crea o actualiza una cuenta/tarjeta. */
function guardarCuenta_(c) {
  return conBloqueo_(function () {
    var t = leerTabla_('Cuentas', 'Nombre (único)');
    var nombre = String(c.nombre || '').trim();
    if (!nombre) throw new Error('Falta el nombre.');
    var repetida = t.filas.some(function (r) { return texto_(r['Nombre (único)']) === nombre && r._fila !== c.fila; });
    if (repetida) throw new Error('Ya existe una cuenta llamada "' + nombre + '".');
    var fila = c.fila || primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Nombre (único)']);
    var datos = {
      'Nombre (único)': nombre, 'Tipo': c.tipo, 'Banco': c.banco || '', 'Moneda principal': c.moneda || 'CRC',
      'Límite ₡': c.limiteCRC === null ? '' : c.limiteCRC, 'Límite $': c.limiteUSD === null ? '' : c.limiteUSD,
      'Día de corte': c.diaCorte || '', 'Día de pago': c.diaPago || '', 'Activa': c.activa === false ? 'No' : 'Sí',
      'Saldo actual ₡': c.saldoCRC === null ? '' : c.saldoCRC, 'Saldo actual $': c.saldoUSD === null ? '' : c.saldoUSD,
      'Notas': c.notas || ''
    };
    if (c.saldoCambio && t.cols['Fecha del saldo']) datos['Fecha del saldo'] = new Date();
    escribirFila_(t.hoja, fila, t.cols, datos);
    // Últimos 4 como texto (para que "0123" no pierda el cero)
    if (t.cols['Últimos 4']) t.hoja.getRange(fila, t.cols['Últimos 4']).setNumberFormat('@').setValue(c.ultimos4 || '');
    return fila;
  });
}

/** Crea un sobre o cambia su monto asignado. */
function guardarSobre_(s) {
  return conBloqueo_(function () {
    var t = leerTabla_('Sobres', 'Sobre');
    var fila = s.fila || primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Sobre']);
    var datos = { 'Asignado por mes': Number(s.asignado) || 0 };
    if (s.saldoInicial !== undefined && s.saldoInicial !== null) datos['Saldo inicial'] = Number(s.saldoInicial) || 0;
    if (s.meta !== undefined) datos['Meta'] = s.meta ? Number(s.meta) : '';
    if (s.fila && s.tipo) datos['Tipo'] = s.tipo;
    if (!s.fila) {
      datos['Sobre'] = String(s.nombre || '').trim();
      datos['Moneda'] = s.moneda || 'CRC';
      datos['Tipo'] = s.tipo || 'Variable';
      if (!datos['Sobre']) throw new Error('Falta el nombre del sobre.');
    }
    escribirFila_(t.hoja, fila, t.cols, datos);
    return fila;
  });
}

/** Registra a mano un pago del préstamo (o lo usa el lector de correos). */
function registrarPago_(p) {
  return conBloqueo_(function () { return registrarPagoPrestamo_(p); });
}

function registrarPagoPrestamo_(p) {
  if ((Number(p.principal) || 0) + (Number(p.intereses) || 0) <= 0) return 'ignorado';   // no es un pago de cuota
  var t = leerTabla_('Préstamo casa', 'Fecha de pago');
  if (p.comprobante) {
    var ya = t.filas.some(function (r) { return texto_(r['N° comprobante']) === String(p.comprobante); });
    if (ya) return 'duplicado';
  }
  var fila = primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Fecha de pago']);
  var datos = {
    'Fecha de pago': fechaDe_(p.fecha),
    'Abono principal': Number(p.principal) || 0,
    'Intereses': Number(p.intereses) || 0,
    'Pólizas': Number(p.polizas) || 0
  };
  // Con el recibo del BCR: la tasa del pago y un ajuste para que el saldo quede igual al del banco
  if (p.tasa && t.cols['Tasa BCR']) datos['Tasa BCR'] = p.tasa;
  if (p.saldoNuevo && t.cols['Ajuste'] && t.cols['Saldo']) {
    var previas = t.filas.filter(function (r) { return r._fila < fila && typeof r['Saldo'] === 'number'; });
    var prev = previas.length ? previas[previas.length - 1]['Saldo'] : null;
    if (prev !== null) {
      var ajuste = Math.round((prev - (Number(p.principal) || 0) - Number(p.saldoNuevo)) * 100) / 100;
      if (Math.abs(ajuste) >= 0.01) datos['Ajuste'] = ajuste;
    }
  }
  escribirFila_(t.hoja, fila, t.cols, datos);
  if (t.cols['N° comprobante']) {
    t.hoja.getRange(fila, t.cols['N° comprobante']).setNumberFormat('@').setValue(String(p.comprobante || ''));
  }
  return fila;
}

/** Anota la TBP del día 7. */
function registrarTBP_(fechaIso, tbp) {
  return conBloqueo_(function () {
    var t = leerTabla_('Tasas BCCR', 'Fecha de la TBP (día 7)');
    var f = fechaDe_(fechaIso);
    var existente = t.filas.filter(function (r) {
      var d = r['Fecha de la TBP (día 7)'];
      return d instanceof Date && d.getFullYear() === f.getFullYear() && d.getMonth() === f.getMonth();
    })[0];
    var fila = existente ? existente._fila : primeraFilaVacia_(t.hoja, t.filaEnc, t.cols['Fecha de la TBP (día 7)']);
    escribirFila_(t.hoja, fila, t.cols, {
      'Fecha de la TBP (día 7)': f, 'TBP': Number(tbp), 'Fuente': 'Anotada desde la app'
    });
    return fila;
  });
}

/** Botón "Revisar correos ahora" de la app. */
function revisarCorreosAhora_() {
  return procesarCorreos();
}


// =====================================================================
// Gmail
// =====================================================================
/**
 * Gmail.js — Lee los correos de los bancos y los guarda en la hoja.
 *
 *  - Compras con tarjeta: correos de los bancos de la pestaña Config.
 *  - Pagos del préstamo: correo de PRESTAMO_CORREO con el .txt adjunto.
 *  - Recurrentes: cobros fijos que no llegan por correo.
 *
 * Nada se duplica: compras por número de autorización y pagos por número
 * de comprobante. Si llegan 2 o 3 correos iguales, se guarda una vez.
 *
 * Funciones para ejecutar desde el editor:
 *   probarCorreos()      → muestra lo que leería, SIN guardar nada
 *   procesarCorreos()    → lee y guarda (lo que corre solo cada 15 min)
 *   activarAutomatico() / desactivarAutomatico()
 */

function bancosActivos_() {
  var t = leerTabla_('Config', 'Banco');
  return t.filas
    .filter(function (r) {
      var correo = texto_(r['Correo de notificaciones']);
      return texto_(r['Estado']) === 'Activo' && correo && correo.indexOf('@') > 0 && correo.indexOf('PENDIENTE') < 0;
    })
    .map(function (r) { return { nombre: texto_(r['Banco']), correo: texto_(r['Correo de notificaciones']) }; });
}

function etiqueta_(nombre) {
  return GmailApp.getUserLabelByName(nombre) || GmailApp.createLabel(nombre);
}

function desdeCuando_() {
  var g = PropertiesService.getScriptProperties().getProperty('ULTIMA_REVISION');
  return g ? new Date(Number(g)) : new Date(Date.now() - DIAS_ATRAS * 86400000);
}

/**
 * Busca correos (uno por uno, no por hilo) recibidos después de `desde`.
 * También vuelve a intentar los que quedaron con la etiqueta Finanzas/Revisar
 * (no se duplican: cada movimiento tiene su número de autorización o referencia).
 */
function buscarMensajes_(consulta, desde) {
  var out = [], vistos = {};
  function agregar(q, filtrarFecha) {
    GmailApp.search(q, 0, 100).forEach(function (hilo) {
      hilo.getMessages().forEach(function (msg) {
        if (vistos[msg.getId()] || (filtrarFecha && msg.getDate() <= desde)) return;
        vistos[msg.getId()] = true;
        out.push({ hilo: hilo, msg: msg });
      });
    });
  }
  agregar(consulta + ' after:' + Math.floor(desde.getTime() / 1000), true);
  agregar(consulta + ' label:' + ETIQUETA_REVISAR.toLowerCase().replace(/[\/ ]/g, '-'), false);
  return out;
}

/** Cuenta para los SINPE: la cuenta BCR (no tarjeta ni préstamo) en colones. */
function cuentaSINPE_(cuentas) {
  var c = cuentas.filter(function (x) {
    var tipo = texto_(x['Tipo']);
    return /bcr/i.test(texto_(x['Banco'])) && texto_(x['Activa']) !== 'No' && !/tarjeta|pr[eé]stamo|inversi/i.test(tipo) &&
      (texto_(x['Moneda principal']) || 'CRC') === 'CRC';
  });
  c.sort(function (a, b) { return (/ahorro|corriente/i.test(texto_(b['Tipo'])) ? 1 : 0) - (/ahorro|corriente/i.test(texto_(a['Tipo'])) ? 1 : 0); });
  return c.length ? texto_(c[0]['Nombre (único)']) : '';
}
/** Tarjeta de crédito activa de un banco (para pagos de servicio que no traen los últimos 4). */
function tarjetaDeBanco_(cuentas, banco) {
  var c = cuentas.filter(function (x) {
    return sinTildes_(texto_(x['Banco'])).toLowerCase() === sinTildes_(banco).toLowerCase() && /tarjeta/i.test(texto_(x['Tipo'])) && texto_(x['Activa']) !== 'No';
  })[0];
  return c ? texto_(c['Nombre (único)']) : '';
}

/** Aplica cuenta (por últimos 4), categoría y sobre (por reglas). */
function completarCompra_(tx, cuentas, reglas) {
  var cuenta = tx.cuentaNombre || '';
  if (!cuenta && tx.ultimos4) {
    var c = cuentas.filter(function (x) { return texto_(x['Últimos 4']) === tx.ultimos4; })[0];
    if (c) cuenta = texto_(c['Nombre (único)']);
  }
  var categoria = '', sobre = '';
  var comercio = String(tx.comercio || '').toUpperCase();
  var mejor = '';
  reglas.forEach(function (r) {
    var p = texto_(r['Si el comercio contiene']).toUpperCase();
    if (p && comercio.indexOf(p) >= 0 && p.length > mejor.length) {
      mejor = p; categoria = texto_(r['Categoría']); sobre = texto_(r['Sobre']);
    }
  });
  if (!categoria && tx.categoria) categoria = tx.categoria;
  var nota = [];
  if (tx.nota) nota.push(tx.nota);
  if (tx.ultimos4 && !cuenta) nota.push('Tarjeta ••' + tx.ultimos4 + ' no está en Cuentas');
  return {
    'Fecha': new Date(tx.fecha),
    'Comercio / descripción': tx.comercio || '',
    'Lugar': tx.lugar || '',
    'Monto': tx.monto,
    'Moneda': tx.moneda,
    'Tipo': tx.tipoMov || (tx.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'),
    'Cuenta / tarjeta': cuenta,
    'Categoría': categoria,
    'Sobre': tx.sobre || sobre,
    'Origen': 'Correo',
    'Autorización': tx.autorizacion,
    'Nota': nota.join('. ')
  };
}

/** Clave para evitar duplicados cuando el correo no trae autorización. */
function claveAuto_(tx, banco) {
  var base = [banco, tx.fecha, tx.monto, tx.moneda, tx.comercio].join('|');
  return 'auto-' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, base)).slice(0, 12);
}

/** Texto de los adjuntos .txt de un correo. */
function textoAdjuntos_(msg) {
  return msg.getAttachments().filter(function (a) {
    return /\.txt$/i.test(a.getName()) || a.getContentType() === 'text/plain';
  }).map(function (a) {
    var t = a.getDataAsString('UTF-8');
    if (t.indexOf('�') >= 0) t = a.getDataAsString('ISO-8859-1');   // archivos con tildes "viejas"
    return t;
  }).join('\n');
}

/**
 * Lee todo y devuelve lo que guardaría. Si `guardar` es true, lo guarda.
 */
function leerCorreos_(guardar) {
  var desde = desdeCuando_();
  var resumen = { compras: 0, pagos: 0, duplicados: 0, revisar: 0, detalle: [] };

  var mov = leerTabla_('Movimientos', 'Fecha');
  var autorizaciones = {};
  mov.filas.forEach(function (r) { var a = texto_(r['Autorización']); if (a) autorizaciones[a] = true; });
  var cuentas = leerTabla_('Cuentas', 'Nombre (único)').filas;
  var reglas = leerTabla_('Reglas', 'Si el comercio contiene').filas;
  var procesado = guardar ? etiqueta_(ETIQUETA_PROCESADO) : null;
  var revisar = guardar ? etiqueta_(ETIQUETA_REVISAR) : null;

  function anotar(tx, etiquetaBanco) {
    tx.autorizacion = tx.autorizacion || claveAuto_(tx, etiquetaBanco);
    if (autorizaciones[tx.autorizacion]) { resumen.duplicados++; return; }
    autorizaciones[tx.autorizacion] = true;
    var fila = completarCompra_(tx, cuentas, reglas);
    resumen.compras++;
    resumen.detalle.push('🧾 [' + etiquetaBanco + '] ' + fila['Tipo'] + ' · ' + fila['Comercio / descripción'] + ' · ' +
      fila['Monto'] + ' ' + fila['Moneda'] + ' · ' + (fila['Cuenta / tarjeta'] || 'sin cuenta') + ' · ' + (fila['Categoría'] || 'sin categoría'));
    if (guardar) {
      var n = primeraFilaVacia_(mov.hoja, mov.filaEnc, mov.cols['Fecha']);
      escribirFila_(mov.hoja, n, mov.cols, fila);
    }
  }
  function marcar(x, ok) {
    if (!guardar) return;
    if (ok) { procesado.addToThread(x.hilo); revisar.removeFromThread(x.hilo); }
    else revisar.addToThread(x.hilo);
  }

  // ---- Bancos de la pestaña Config (compras con tarjeta, pagos de servicio…) ----
  bancosActivos_().forEach(function (banco) {
    buscarMensajes_('from:' + banco.correo, desde).forEach(function (x) {
      var texto = x.msg.getSubject() + '\n' + x.msg.getPlainBody();
      var lista = parsearCorreoBanco(texto, x.msg.getBody(), x.msg.getDate(), banco.nombre);
      if (!lista) {
        resumen.revisar++;
        resumen.detalle.push('⚠️ [' + banco.nombre + '] No pude leer: ' + x.msg.getSubject());
        marcar(x, false);
        return;
      }
      lista.forEach(function (tx) {
        if (tx.esServicio && !tx.cuentaNombre) tx.cuentaNombre = tarjetaDeBanco_(cuentas, banco.nombre);
        if (tx.esSINPE) tx.cuentaNombre = cuentaSINPE_(cuentas);
        if (!tx.fecha) tx.fecha = x.msg.getDate().toISOString();
        anotar(tx, banco.nombre);
      });
      marcar(x, true);
    });
  });

  // ---- SINPE Móvil del BCR ----
  buscarMensajes_('from:' + SINPE_CORREO.remitente + ' subject:' + SINPE_CORREO.asunto, desde).forEach(function (x) {
    var tx = parsearSINPE(x.msg.getPlainBody()) || parsearSINPE(textoDeHtml_(x.msg.getBody()));
    if (!tx) {
      resumen.revisar++;
      resumen.detalle.push('⚠️ [SINPE] No pude leer: ' + x.msg.getSubject());
      marcar(x, false);
      return;
    }
    tx.cuentaNombre = cuentaSINPE_(cuentas);
    if (!tx.fecha) tx.fecha = x.msg.getDate().toISOString();
    anotar(tx, 'SINPE');
    marcar(x, true);
  });

  // ---- BCR SAFI: solicitudes de inversión y de retiro (las confirmaciones con PDF y el estado de cuenta se ignoran) ----
  buscarMensajes_('from:' + FONDOS_CORREO, desde).forEach(function (x) {
    var asunto = x.msg.getSubject();
    if (!/solicitud de (inversi|retiro)/i.test(asunto)) {
      resumen.detalle.push('📄 [Fondos] Confirmación o estado de cuenta (no se anota): ' + asunto);
      marcar(x, true);
      return;
    }
    var tx = parsearSAFI(x.msg.getPlainBody(), x.msg.getDate()) || parsearSAFI(textoDeHtml_(x.msg.getBody()), x.msg.getDate());
    if (!tx) {
      resumen.revisar++;
      resumen.detalle.push('⚠️ [Fondos] No pude leer: ' + asunto);
      marcar(x, false);
      return;
    }
    tx.cuentaNombre = cuentaSINPE_(cuentas);
    if (tx.tipoMov === 'Inversión') { try { tx.sobre = sobreEspecial_('fondos'); } catch (e) { tx.sobre = SOBRE_FONDOS; } }
    anotar(tx, 'Fondos');
    marcar(x, true);
  });

  // ---- Préstamo: recibos de pago (y el estado de cuenta mensual, que no se anota) ----
  var q = 'from:' + PRESTAMO_CORREO.remitente + ' has:attachment -subject:' + SINPE_CORREO.asunto +
          (PRESTAMO_CORREO.asunto ? ' subject:(' + PRESTAMO_CORREO.asunto + ')' : '');
  buscarMensajes_(q, desde).forEach(function (x) {
    var txt = textoAdjuntos_(x.msg);
    if (/estado de cuenta/i.test(x.msg.getSubject()) || esEstadoCuentaPrestamo(txt)) {
      resumen.detalle.push('📄 [Préstamo] Estado de cuenta mensual (no se anota): ' + x.msg.getSubject());
      marcar(x, true);
      return;
    }
    var p = txt ? parsearComprobantePrestamo(txt, x.msg.getDate()) : null;
    if (!p) {
      resumen.revisar++;
      resumen.detalle.push('⚠️ [Préstamo] No pude leer el comprobante: ' + x.msg.getSubject());
      marcar(x, false);
      return;
    }
    p.fecha = p.fecha.toISOString();
    if (!p.comprobante) p.comprobante = claveAuto_({ fecha: p.fecha.slice(0, 10), monto: p.total, moneda: 'CRC', comercio: 'prestamo' }, 'BCR');
    resumen.detalle.push('🏠 [Préstamo] ' + p.fecha.slice(0, 10) + ' · recibo ' + p.comprobante +
      ' · capital ' + p.principal + ' · intereses ' + p.intereses + ' · pólizas ' + p.polizas + (p.saldoNuevo ? ' · nuevo saldo ' + p.saldoNuevo : ''));
    if (guardar) {
      var res = registrarPagoPrestamo_(p);
      if (res === 'duplicado') resumen.duplicados++;
      else if (res === 'ignorado') resumen.detalle.push('📄 [Préstamo] Sin capital ni intereses: no se anota.');
      else resumen.pagos++;
    } else {
      resumen.pagos++;
    }
    marcar(x, true);
  });

  return resumen;
}

/** Lo que corre solo cada 15 minutos. */
function procesarCorreos() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return 'Ocupado, intentá en un momento.';
  try {
    var inicio = Date.now();
    var r = leerCorreos_(true);
    // avisos de viaje y columnas de Sobres: solo si entró algo nuevo (así el botón "Correos" responde rápido)
    if (r.compras + r.pagos > 0) { try { tareasDespuesDeLeer_(); } catch (e) { console.log('Después de leer: ' + e); } }
    // La próxima vez revisa desde 10 min antes (por si un correo llegó tarde; no se duplica)
    PropertiesService.getScriptProperties().setProperty('ULTIMA_REVISION', String(inicio - 10 * 60 * 1000));
    var msg = 'Movimientos nuevos: ' + r.compras + ' · Pagos del préstamo: ' + r.pagos +
              ' · Repetidos ignorados: ' + r.duplicados + ' · Para revisar: ' + r.revisar;
    console.log(msg);
    return msg;
  } finally {
    lock.releaseLock();
  }
}

/** Muestra en el registro lo que leería, sin guardar ni etiquetar nada. */
function probarCorreos() {
  var bancos = bancosActivos_();
  console.log('Bancos activos: ' + (bancos.map(function (b) { return b.nombre + ' (' + b.correo + ')'; }).join(', ') || 'ninguno'));
  var r = leerCorreos_(false);
  if (r.detalle.length === 0) console.log('No encontré correos nuevos en los últimos ' + DIAS_ATRAS + ' días.');
  r.detalle.forEach(function (l) { console.log(l); });
  console.log('Repetidos (ya estaban en la hoja): ' + r.duplicados);
}

// ---------------------------------------------------------------------
// RECURRENTES: cobros fijos que no llegan por correo
// ---------------------------------------------------------------------
function procesarRecurrentes() {
  var hoy = new Date();
  var ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  var rec = leerTabla_('Recurrentes', 'Descripción').filas;
  var mov = leerTabla_('Movimientos', 'Fecha');
  var ya = {};
  mov.filas.forEach(function (r) { ya[texto_(r['Autorización'])] = true; });
  var mesClave = Utilities.formatDate(hoy, 'America/Costa_Rica', 'yyyy-MM');
  var agregados = 0;

  rec.forEach(function (r) {
    if (texto_(r['Activo']) === 'No') return;
    var dia = Math.min(num_(r['Día del mes']) || 1, ultimoDia);
    if (hoy.getDate() < dia) return;
    var clave = 'REC-' + mesClave + '-' + r._fila;
    if (ya[clave]) return;
    var n = primeraFilaVacia_(mov.hoja, mov.filaEnc, mov.cols['Fecha']);
    escribirFila_(mov.hoja, n, mov.cols, {
      'Fecha': new Date(hoy.getFullYear(), hoy.getMonth(), dia, 12, 0),
      'Comercio / descripción': texto_(r['Descripción']),
      'Monto': num_(r['Monto']) || 0,
      'Moneda': texto_(r['Moneda']) || 'CRC',
      'Tipo': 'Gasto',
      'Cuenta / tarjeta': texto_(r['Tarjeta / cuenta']),
      'Categoría': texto_(r['Categoría']),
      'Sobre': texto_(r['Sobre']),
      'Origen': 'Recurrente',
      'Autorización': clave
    });
    ya[clave] = true;
    agregados++;
  });
  console.log('Recurrentes agregados: ' + agregados);
}

// ---------------------------------------------------------------------
// AUTOMÁTICO
// ---------------------------------------------------------------------
function activarAutomatico() {
  desactivarAutomatico();
  ScriptApp.newTrigger('procesarCorreos').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('procesarDiario').timeBased().everyDays(1).atHour(6).create();
  console.log('✅ Correos cada 15 minutos; recurrentes y recordatorios todos los días a las 6 a.m.');
}

function desactivarAutomatico() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'procesarCorreos' || f === 'procesarRecurrentes' || f === 'procesarDiario') ScriptApp.deleteTrigger(t);
  });
}


// =====================================================================
// Ajustes
// =====================================================================
/**
 * Ajustes.js — Configuración, clave de acceso (PIN) y recordatorios por correo.
 *
 * Toda la app habla con el servidor por medio de api(). Si tenés un PIN
 * activado, api() no responde nada sin una sesión válida.
 */

var VERSION_APP = '2.5.0';
var MINUTOS_SESION = 12 * 60;      // una sesión con PIN dura hasta 12 horas
var INTENTOS_MAX = 5;               // después de 5 intentos fallidos, espera 5 minutos

/** Funciones que la app puede pedir. */
var API = {
  obtenerDatos: function () { return obtenerDatos_(); },
  guardarMovimiento: function (m) { return guardarMovimiento_(m); },
  eliminarMovimiento: function (f, c) { return eliminarMovimiento_(f, c); },
  pasarATasaCero: function (f, c, n, d) { return pasarATasaCero_(f, c, n, d); },
  guardarAbonoTC: function (a) { return guardarAbonoTC_(a); },
  guardarSobresMov: function (l) { return guardarSobresMov_(l); },
  eliminarGrupoSobres: function (g) { return eliminarGrupoSobres_(g); },
  guardarReglaSobre: function (p, s) { return guardarReglaSobre_(p, s); },
  guardarReparto: function (l, a) { return guardarReparto_(l, a); },
  guardarSobresDesde: function (f) { return guardarSobresDesde_(f); },
  guardarSobresEspeciales: function (e) { return guardarSobresEspeciales_(e); },
  guardarFondo: function (f) { return guardarFondo_(f); },
  actualizarSaldoFondo: function (f, s, i) { return actualizarSaldoFondo_(f, s, i); },
  marcarMovimiento: function (f, c, v, k) { return marcarMovimiento_(f, c, v, k); },
  actualizarSaldoCuenta: function (f, c, u, d) { return actualizarSaldoCuenta_(f, c, u, d); },
  guardarViaje: function (v) { return guardarViaje_(v); },
  eliminarViaje: function (f) { return eliminarViaje_(f); },
  eliminarAbonoTC: function (f, c) { return eliminarAbonoTC_(f, c); },
  guardarCuenta: function (c) { return guardarCuenta_(c); },
  guardarSobre: function (s) { return guardarSobre_(s); },
  registrarPagoPrestamo: function (p) { return registrarPago_(p); },
  registrarTBP: function (f, t) { return registrarTBP_(f, t); },
  revisarCorreosAhora: function () { return revisarCorreosAhora_(); },
  obtenerAjustes: function () { return obtenerAjustes_(); },
  guardarPIN: function (nuevo, actual) { return guardarPIN_(nuevo, actual); },
  quitarPIN: function (actual) { return quitarPIN_(actual); },
  quitarHuella: function (id) { return quitarHuella_(id); },
  guardarRecordatorios: function (activo) { return guardarRecordatorios_(activo); },
  probarRecordatorio: function () { return enviarRecordatorios_(true); },
  // v2.5
  guardarPreferencias: function (p) { return guardarPreferencias_(p); },
  activarAvisosTelefono: function () { return activarAvisosTelefono_(); },
  resumenAvisos: function () { return resumenAvisos_(); },
  probarResumenCorreo: function () { return enviarResumenCorreo_(true); },
  estadoActualizacion: function () { return estadoActualizacion_(); },
  fijarUrlActualizacion: function (u) { return fijarUrlActualizacion_(u); },
  revisarActualizacion: function () { return revisarActualizacion_(); },
  actualizarServidor: function () { return actualizarServidor_(); },
  volverVersionAnterior: function () { return volverVersionAnterior_(); },
  listas: function () { return listasResumen_(); },
  crearLista: function (n, i, it) { return crearLista_(n, i, it); },
  obtenerLista: function (id, v) { return obtenerLista_(id, v); },
  cambiarLista: function (id, op, quien) { return cambiarLista_(id, op, quien, false); },
  eliminarLista: function (id) { return eliminarLista_(id); },
  linkLista: function (id, nuevo) { return linkLista_(id, nuevo); },
  quitarLinkLista: function (id) { return quitarLinkLista_(id); },
  subirFotoLista: function (id, datos) { return guardarFoto_(id, datos); },
  fotoLista: function (id) { return leerFoto_(id); }
};

/**
 * Única puerta de entrada desde la app (GitHub Pages).
 * La app manda { clave, sesion, accion, args } como texto JSON.
 */
function doPost(e) {
  var r;
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    // v2.5: quien abre el link de una lista solo puede tocar esa lista; el aviso del teléfono solo pide el resumen
    if (d.lista) return ContentService.createTextOutput(JSON.stringify((function () { try { return { ok: true, resultado: apiListaLink_(d.lista, d.accion, d.args) }; } catch (e3) { return { ok: false, error: String(e3 && e3.message ? e3.message : e3) }; } })())).setMimeType(ContentService.MimeType.JSON);
    if (d.avisos) {
      if (!llaveAvisosValida_(d.avisos)) throw new Error('LLAVE_AVISOS');
      return ContentService.createTextOutput(JSON.stringify({ ok: true, resultado: resumenAvisos_() })).setMimeType(ContentService.MimeType.JSON);
    }
    if (!claveValida_(d.clave)) throw new Error('CLAVE_INVALIDA');
    if (d.accion === 'ping') r = { ok: true, resultado: 'Conectado a ' + libro_().getName() };
    else if (d.accion === 'estadoAcceso') r = { ok: true, resultado: estadoAcceso() };
    else if (d.accion === 'verificarPIN') r = { ok: true, resultado: verificarPIN((d.args || [])[0]) };
    else if (d.accion === 'activarHuella') r = { ok: true, resultado: activarHuella_((d.args || [])[0], (d.args || [])[1]) };
    else if (d.accion === 'entrarConHuella') r = { ok: true, resultado: entrarConHuella_((d.args || [])[0], (d.args || [])[1]) };
    else {
      // v2.3.1: lo que manda la cola del teléfono trae un id; si llega repetido (se cortó la respuesta), no se vuelve a hacer
      var cacheId = d.id ? CacheService.getScriptCache() : null, previo = cacheId ? cacheId.get('idem_' + d.id) : null;
      if (previo) r = JSON.parse(previo);
      else {
        try { r = { ok: true, resultado: api(d.sesion, d.accion, d.args) }; }
        catch (e1) { r = { ok: false, error: String(e1 && e1.message ? e1.message : e1) }; }
        if (cacheId && !/PIN_REQUERIDO|CLAVE_INVALIDA/.test(r.error || '')) { try { cacheId.put('idem_' + d.id, JSON.stringify(r), 21600); } catch (e2) { /* muy grande: no se guarda */ } }
      }
    }
  } catch (err) {
    r = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}

/** Compara la clave de la app. Tras 10 intentos fallidos, se bloquea 10 minutos. */
function claveValida_(clave) {
  var cache = CacheService.getScriptCache();
  var fallos = Number(cache.get('clave_fallos') || 0);
  if (fallos >= 10) throw new Error('Demasiados intentos con una clave incorrecta. Esperá 10 minutos.');
  var buena = props_().getProperty('CLAVE_APP');
  if (buena && clave === buena) return true;
  cache.put('clave_fallos', String(fallos + 1), 600);
  return false;
}

function api(sesion, nombre, args) {
  if (!API[nombre]) throw new Error('Acción desconocida: ' + nombre);
  if (!sesionValida_(sesion)) throw new Error('PIN_REQUERIDO');
  return API[nombre].apply(null, args || []);
}

/** ¿Hay PIN? (no devuelve datos) */
function estadoAcceso() {
  var p = props_();
  return { pinActivo: !!p.getProperty('PIN_HASH'), pinLargo: Number(p.getProperty('PIN_LARGO')) || null };
}

function props_() { return PropertiesService.getScriptProperties(); }

function hash_(pin, sal) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sal + ':' + pin, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function pinCorrecto_(pin) {
  var h = props_().getProperty('PIN_HASH');
  if (!h) return true;
  return hash_(String(pin || ''), props_().getProperty('PIN_SAL')) === h;
}

function sesionValida_(token) {
  if (!props_().getProperty('PIN_HASH')) return true;
  return !!token && CacheService.getScriptCache().get('ses_' + token) === '1';
}

/** Verifica el PIN y devuelve una sesión. Bloquea 5 minutos tras varios intentos fallidos. */
function verificarPIN(pin) {
  var cache = CacheService.getScriptCache();
  var fallos = Number(cache.get('pin_fallos') || 0);
  if (fallos >= INTENTOS_MAX) throw new Error('Demasiados intentos. Esperá 5 minutos.');
  if (!pinCorrecto_(pin)) {
    cache.put('pin_fallos', String(fallos + 1), 300);
    throw new Error('PIN incorrecto' + (fallos + 1 >= INTENTOS_MAX ? '. Esperá 5 minutos.' : ''));
  }
  cache.remove('pin_fallos');
  if (props_().getProperty('PIN_HASH') && !props_().getProperty('PIN_LARGO')) props_().setProperty('PIN_LARGO', String(String(pin).length));
  return nuevaSesion_();
}

function nuevaSesion_() {
  var token = Utilities.getUuid();
  CacheService.getScriptCache().put('ses_' + token, '1', MINUTOS_SESION * 60);
  return token;
}

// ---------------------------------------------------------------------
// HUELLA: el teléfono verifica la huella; aquí solo se guarda una llave
// por teléfono (guardada como hash). Cambiar o quitar el PIN las borra todas.
// ---------------------------------------------------------------------
function huellas_() { try { return JSON.parse(props_().getProperty('HUELLAS') || '[]'); } catch (e) { return []; } }
function guardarHuellas_(l) { if (l.length) props_().setProperty('HUELLAS', JSON.stringify(l)); else props_().deleteProperty('HUELLAS'); }

/** Con el PIN correcto, registra este teléfono. Devuelve { id, llave, sesion }. */
function activarHuella_(pin, nombre) {
  if (!props_().getProperty('PIN_HASH')) throw new Error('Primero creá un PIN.');
  var sesion = verificarPIN(pin);
  var id = Utilities.getUuid().slice(0, 8), llave = Utilities.getUuid() + Utilities.getUuid(), sal = Utilities.getUuid();
  var l = huellas_().filter(function (x) { return x.id !== id; });
  l.push({ id: id, sal: sal, h: hash_(llave, sal), n: String(nombre || 'Teléfono').slice(0, 40), c: new Date().toISOString() });
  guardarHuellas_(l.slice(-5));   // máximo 5 teléfonos
  return { id: id, llave: llave, sesion: sesion };
}

/** El teléfono ya verificó la huella: con su llave recibe una sesión. */
function entrarConHuella_(id, llave) {
  var cache = CacheService.getScriptCache();
  var fallos = Number(cache.get('pin_fallos') || 0);
  if (fallos >= INTENTOS_MAX) throw new Error('Demasiados intentos. Esperá 5 minutos.');
  var x = huellas_().filter(function (h) { return h.id === id; })[0];
  if (!x || hash_(String(llave || ''), x.sal) !== x.h) {
    cache.put('pin_fallos', String(fallos + 1), 300);
    throw new Error('HUELLA_INVALIDA');
  }
  return nuevaSesion_();
}

function quitarHuella_(id) { guardarHuellas_(huellas_().filter(function (h) { return h.id !== id; })); return true; }

function guardarPIN_(nuevo, actual) {
  nuevo = String(nuevo || '');
  if (!/^\d{4,6}$/.test(nuevo)) throw new Error('El PIN debe tener de 4 a 6 números.');
  if (!pinCorrecto_(actual)) throw new Error('El PIN actual no es correcto.');
  var sal = Utilities.getUuid();
  props_().setProperties({ PIN_SAL: sal, PIN_HASH: hash_(nuevo, sal), PIN_LARGO: String(nuevo.length) });
  props_().deleteProperty('HUELLAS');   // las huellas se activan otra vez con el PIN nuevo
  return verificarPIN(nuevo);   // devuelve una sesión nueva para seguir usando la app
}

function quitarPIN_(actual) {
  if (!pinCorrecto_(actual)) throw new Error('El PIN no es correcto.');
  ['PIN_HASH', 'PIN_SAL', 'PIN_LARGO', 'HUELLAS'].forEach(function (k) { props_().deleteProperty(k); });
  return true;
}

/**
 * ¿Olvidaste el PIN? Abrí Apps Script y ejecutá esta función: borra el PIN.
 * (Solo vos podés hacerlo, porque solo vos tenés acceso al proyecto.)
 */
function borrarPINOlvidado() {
  ['PIN_HASH', 'PIN_SAL', 'PIN_LARGO', 'HUELLAS'].forEach(function (k) { props_().deleteProperty(k); });
  console.log('✅ PIN borrado. Ya podés entrar a la app sin PIN y crear uno nuevo.');
}

function obtenerAjustes_() {
  var p = props_();
  var libro = libro_();
  return {
    pinActivo: !!p.getProperty('PIN_HASH'),
    pinLargo: Number(p.getProperty('PIN_LARGO')) || null,
    huellas: huellas_().map(function (h) { return { id: h.id, nombre: h.n, creado: h.c }; }),
    recordatorios: p.getProperty('RECORDATORIOS') === 'si',
    correo: Session.getEffectiveUser().getEmail(),
    ultimaRevision: p.getProperty('ULTIMA_REVISION'),
    urlHoja: libro.getUrl(),
    nombreHoja: libro.getName(),
    bancos: bancosActivos_().map(function (b) { return b.nombre; }),
    version: VERSION_APP,
    prefs: prefs_(),
    actualizacion: estadoActualizacion_()
  };
}

function guardarRecordatorios_(activo) {
  props_().setProperty('RECORDATORIOS', activo ? 'si' : 'no');
  return true;
}

// ---------------------------------------------------------------------
// RECORDATORIOS POR CORREO (corren una vez al día con procesarDiario)
// ---------------------------------------------------------------------

/** Lo que corre solo cada mañana. */
function procesarDiario() {
  procesarRecurrentes();
  if (props_().getProperty('RECORDATORIOS') === 'si') enviarRecordatorios_(false);
  try { tareasDespuesDeLeer_(); } catch (e) { console.log(e); }
}

function diasHasta_(fecha) {
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var f = new Date(fecha); f.setHours(0, 0, 0, 0);
  return Math.round((f - hoy) / 86400000);
}

function proximoDia_(dia) {
  var h = new Date(); h.setHours(0, 0, 0, 0);
  var y = h.getFullYear(), m = h.getMonth();
  var ultimo = function (yy, mm) { return new Date(yy, mm + 1, 0).getDate(); };
  if (h.getDate() > Math.min(dia, ultimo(y, m))) { m++; if (m > 11) { m = 0; y++; } }
  return new Date(y, m, Math.min(dia, ultimo(y, m)));
}

/**
 * Arma el correo de recordatorios. Solo lo envía si hay algo que avisar
 * (o siempre, si `prueba` es true).
 */
function enviarRecordatorios_(prueba) {
  var avisos = avisosRecordatorio_();
  if (!avisos.length && !prueba) return 'Nada que avisar hoy.';
  var cuerpo = (avisos.length ? avisos.join('\n') : 'Todo al día. Así se ven los recordatorios cuando hay algo que avisar.') +
    '\n\n— Finanzas';
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), (prueba ? '[Prueba] ' : '') + 'Finanzas: recordatorios', cuerpo);
  return prueba ? 'Te envié un correo de prueba.' : 'Recordatorios enviados.';
}

function avisosRecordatorio_() {
  var avisos = [];

  leerTabla_('Cuentas', 'Nombre (único)').filas.forEach(function (c) {
    var dia = num_(c['Día de pago']);
    if (texto_(c['Tipo']) !== 'Tarjeta de crédito' || texto_(c['Activa']) === 'No' || !dia) return;
    var d = diasHasta_(proximoDia_(dia));
    if (d === 3 || d === 1 || d === 0) {
      avisos.push('💳 Pago de ' + texto_(c['Nombre (único)']) + (d === 0 ? ' es HOY' : ' en ' + d + ' día' + (d === 1 ? '' : 's')) + '.');
    }
  });

  var p = hoja_('Préstamo casa');
  var venc = p.getRange('G9').getValue();
  var estimado = num_(p.getRange('K8').getValue());
  if (venc instanceof Date) {
    var dv = diasHasta_(venc);
    if (dv >= 0 && dv <= 5) {
      avisos.push('🏠 La cuota del préstamo vence el ' + Utilities.formatDate(venc, 'America/Costa_Rica', 'dd/MM') +
        ' (en ' + dv + ' día' + (dv === 1 ? '' : 's') + '). Estimado: ₡' + Math.round(estimado || 0).toLocaleString('es-CR') + '.');
    }
  }

  var hoy = new Date();
  if (hoy.getDate() >= 7 && hoy.getDate() <= 9) {
    var tasas = leerTabla_('Tasas BCCR', 'Fecha de la TBP (día 7)').filas;
    var tiene = tasas.some(function (r) {
      var f = r['Fecha de la TBP (día 7)'];
      return f instanceof Date && f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear() && num_(r['TBP']) !== null;
    });
    if (!tiene) avisos.push('📈 Falta anotar la TBP del 7 de este mes (en la app: Préstamo → Anotar TBP).');
  }

  var desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  var sinCategoria = leerTabla_('Movimientos', 'Fecha').filas.filter(function (r) {
    return r['Fecha'] instanceof Date && r['Fecha'] >= desde && texto_(r['Tipo']) === 'Gasto' && !texto_(r['Categoría']);
  }).length;
  if (sinCategoria >= 3) avisos.push('🔎 Tenés ' + sinCategoria + ' gastos de este mes sin categoría.');
  return avisos;
}


// =====================================================================
// Extras
// =====================================================================
/**
 * Extras.js (v2.5) — preferencias, avisos (resumen por correo y llave del teléfono),
 * actualización automática del servidor y listas "Super y Otros" (compartibles por link).
 */

// ---------------------------------------------------------------------
// PREFERENCIAS (salario, avisos…) guardadas en Propiedades del script
// ---------------------------------------------------------------------
function prefs_() { try { return JSON.parse(props_().getProperty('PREFS') || '{}'); } catch (e) { return {}; } }

function guardarPreferencias_(parcial) {
  var p = prefs_();
  Object.keys(parcial || {}).forEach(function (k) { p[k] = parcial[k]; });
  props_().setProperty('PREFS', JSON.stringify(p));
  if (parcial && parcial.avisos) configurarAvisoCorreo_(p.avisos);
  return p;
}

// ---------------------------------------------------------------------
// AVISOS
// ---------------------------------------------------------------------
/** Lo que hay que avisar hoy (solo conteos y nombres; lo usa el teléfono y el correo). */
function resumenAvisos_() {
  var d = JSON.parse(obtenerDatos_()), hoy = new Date(), mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  var r = { porAsignar: 0, porRevisar: 0, pagos: [], negativos: [], salarioHoy: false, consultas: 0 };
  try { r.porRevisar = Calc.resumenMes(d, mes).porRevisar || 0; } catch (e) { /* sin datos */ }
  if (d.sobresDesde) {
    try {
      var sb = Calc.saldosSobres(d, mes, hoy);
      r.porAsignar = sb.pendientes.length;
      r.negativos = sb.lista.filter(function (s) { return s.saldo < -0.005; }).map(function (s) { return s.nombre; });
    } catch (e2) { /* sin sobres */ }
  }
  (d.cuentas || []).forEach(function (c) {
    if (!c.activa || c.tipo !== 'Tarjeta de crédito' || !c.diaPago) return;
    var dias = diasHasta_(proximoDia_(c.diaPago));
    if (dias >= 0 && dias <= 2) r.pagos.push({ nombre: c.nombre, dias: dias });
  });
  var sal = (prefs_().salario) || null;
  if (sal && sal.activo) {
    var hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    r.salarioHoy = Calc.fechasSalario(sal, hoy0, hoy0).length > 0;
  }
  try { listasDatos_().forEach(function (l) { (l.datos.items || []).forEach(function (it) { if (it.consulta && !it.consulta.resp) r.consultas++; }); }); } catch (e3) { /* sin listas */ }
  return r;
}

/** El teléfono guarda una llave que solo sirve para pedir resumenAvisos (funciona aunque haya PIN). */
function activarAvisosTelefono_() {
  var llave = Utilities.getUuid() + Utilities.getUuid(), sal = Utilities.getUuid();
  var l = llavesAvisos_(); l.push({ s: sal, h: hash_(llave, sal), c: new Date().toISOString() });
  props_().setProperty('AVISOS_LLAVES', JSON.stringify(l.slice(-5)));
  return llave;
}
function llavesAvisos_() { try { return JSON.parse(props_().getProperty('AVISOS_LLAVES') || '[]'); } catch (e) { return []; } }
function llaveAvisosValida_(llave) { return !!llave && llavesAvisos_().some(function (x) { return hash_(String(llave), x.s) === x.h; }); }

/** Instala (o quita) el activador cada hora que manda el resumen a la hora elegida. */
function configurarAvisoCorreo_(av) {
  var activo = !!(av && av.correo && av.correo.activo);
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'avisoCorreoHora') ScriptApp.deleteTrigger(t); });
  if (activo) { ScriptApp.newTrigger('avisoCorreoHora').timeBased().everyHours(1).create(); props_().setProperty('RECORDATORIOS', 'no'); }
}

/** Corre cada hora: si es la hora elegida y hoy no se mandó, manda el resumen. */
function avisoCorreoHora() {
  var av = prefs_().avisos || {}, c = av.correo || {};
  if (!c.activo) return;
  var tz = 'America/Costa_Rica', ahora = new Date();
  var horaCR = Number(Utilities.formatDate(ahora, tz, 'H')), hoyTxt = Utilities.formatDate(ahora, tz, 'yyyy-MM-dd');
  if (horaCR !== Number(c.hora === undefined ? 20 : c.hora) || props_().getProperty('AVISO_ENVIADO') === hoyTxt) return;
  props_().setProperty('AVISO_ENVIADO', hoyTxt);
  enviarResumenCorreo_(false);
}

function enviarResumenCorreo_(prueba) {
  var av = prefs_().avisos || {}, tipos = av.tipos || {}, c = av.correo || {};
  var r = resumenAvisos_(), lineas = [];
  var si = function (k) { return tipos[k] !== false; };
  if (si('asignar') && r.porAsignar) lineas.push('✉ ' + r.porAsignar + ' movimiento' + (r.porAsignar === 1 ? '' : 's') + ' por asignar a sobres');
  if (si('revisar') && r.porRevisar) lineas.push('⚠ ' + r.porRevisar + ' por revisar (sin categoría)');
  if (si('salario') && r.salarioHoy) lineas.push('💰 Hoy es día de salario: confirmalo en la app y repartilo');
  if (si('tarjeta')) r.pagos.forEach(function (p) { lineas.push('💳 ' + p.nombre + (p.dias === 0 ? ' vence HOY' : ' vence en ' + p.dias + ' día' + (p.dias === 1 ? '' : 's'))); });
  if (si('negativo') && r.negativos.length) lineas.push('🔴 Sobre en negativo: ' + r.negativos.join(', '));
  if (si('super') && r.consultas) lineas.push('🛒 ' + r.consultas + ' pregunta' + (r.consultas === 1 ? '' : 's') + ' “¿este sirve?” sin responder');
  try { var viejos = avisosRecordatorio_(); lineas = lineas.concat(viejos.filter(function (x) { return !/^💳/.test(x); })); } catch (e) { /* sin préstamo */ }
  if (!lineas.length && !prueba && !c.siempre) return 'Nada que avisar.';
  var cuerpo = (lineas.length ? lineas.join('\n') : 'Todo al día ✓') + '\n\nAbrí la app para verlo: ' + (av.urlApp || '') + '\n— Finanzas';
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), (prueba ? '[Prueba] ' : '') + 'Finanzas · resumen del día', cuerpo);
  return prueba ? 'Te envié un resumen de prueba.' : 'Resumen enviado.';
}

// ---------------------------------------------------------------------
// ACTUALIZACIÓN AUTOMÁTICA DEL SERVIDOR (API de Apps Script)
// La URL de donde se baja el código se guarda UNA vez (no se puede cambiar desde la app).
// ---------------------------------------------------------------------
function estadoActualizacion_() {
  var p = props_();
  return { base: p.getProperty('URL_ACTUALIZACION') || '', anterior: Number(p.getProperty('VERSION_ANTERIOR')) || null, version: VERSION_APP };
}

function fijarUrlActualizacion_(base) {
  var p = props_(), actual = p.getProperty('URL_ACTUALIZACION');
  base = String(base || '').replace(/[#?].*$/, '').replace(/[^/]*$/, '');
  if (!/^https:\/\/[a-z0-9-]+\.github\.io\//i.test(base)) throw new Error('La dirección de la app debe ser una página de GitHub (https://…github.io/…).');
  if (actual && actual !== base) throw new Error('Ya hay otra dirección guardada. Para cambiarla, en Apps Script ejecutá borrarUrlActualizacion.');
  p.setProperty('URL_ACTUALIZACION', base);
  return base;
}

/** Para cambiar de dónde se actualiza (solo desde el editor de Apps Script). */
function borrarUrlActualizacion() { props_().deleteProperty('URL_ACTUALIZACION'); console.log('Listo: la próxima actualización desde la app guarda la dirección de nuevo.'); }

function apiScript_(metodo, ruta, cuerpo) {
  var r = UrlFetchApp.fetch('https://script.googleapis.com/v1/' + ruta, {
    method: metodo, contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, payload: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  var t = r.getContentText(), j = {};
  try { j = JSON.parse(t || '{}'); } catch (e) { j = {}; }
  if (r.getResponseCode() >= 300) {
    var m = (j.error && j.error.message) || t.slice(0, 200);
    if (/has not been used|is disabled|User has not enabled the Apps Script API/i.test(m)) throw new Error('API_DESACTIVADA');
    if (r.getResponseCode() === 403 || /insufficient|scope/i.test(m)) throw new Error('PERMISO_FALTA: ' + m);
    throw new Error(m);
  }
  return j;
}

function idImplementacion_() {
  var u = ScriptApp.getService().getUrl() || '';
  var m = u.match(/\/macros\/s\/([^/]+)\//);
  return m ? m[1] : '';
}

/** Revisa si hay versión nueva publicada (no instala nada). */
function revisarActualizacion_() {
  var base = props_().getProperty('URL_ACTUALIZACION');
  if (!base) return { configurado: false, version: VERSION_APP };
  var v = JSON.parse(UrlFetchApp.fetch(base + 'version.json?t=' + Date.now(), { muteHttpExceptions: true }).getContentText() || '{}');
  return { configurado: true, version: VERSION_APP, nueva: v.servidor || null, hay: !!v.servidor && compararVersion_(v.servidor, VERSION_APP) > 0, novedades: v.novedades || '' };
}

function compararVersion_(a, b) {
  var x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); }
  return 0;
}

/** Baja el código nuevo, lo verifica, guarda cuál versión estaba y actualiza la MISMA implementación (la URL /exec no cambia). */
function actualizarServidor_() {
  return conBloqueo_(function () {
    var base = props_().getProperty('URL_ACTUALIZACION');
    if (!base) throw new Error('SIN_URL');
    var v = JSON.parse(UrlFetchApp.fetch(base + 'version.json?t=' + Date.now()).getContentText());
    if (!v.servidor || compararVersion_(v.servidor, VERSION_APP) <= 0) return { ok: true, version: VERSION_APP, nada: true };
    var codigo = UrlFetchApp.fetch(base + 'servidor/Codigo.gs?t=' + Date.now()).getContentText('UTF-8');
    var sha = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, codigo, Utilities.Charset.UTF_8)
      .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
    if (v.sha256 && sha !== v.sha256) throw new Error('El código descargado no coincide con la versión publicada. No se instaló nada.');
    if (codigo.indexOf("VERSION_APP = '" + v.servidor + "'") < 0) throw new Error('El código descargado no es la versión ' + v.servidor + '. No se instaló nada.');
    var id = ScriptApp.getScriptId(), dep = idImplementacion_();
    if (!dep) throw new Error('No encuentro la implementación (¿la app se abre con la URL /exec?).');
    var contenido = apiScript_('get', 'projects/' + id + '/content');
    var archivos = (contenido.files || []).map(function (f) { return { name: f.name, type: f.type, source: f.source }; }), puesto = false;
    archivos.forEach(function (f) { if (f.type === 'SERVER_JS' && !puesto && f.source.indexOf('VERSION_APP') >= 0) { f.source = codigo; puesto = true; } });
    if (!puesto) archivos.forEach(function (f) { if (f.type === 'SERVER_JS' && !puesto) { f.source = codigo; puesto = true; } });
    if (v.manifiesto) archivos.forEach(function (f) { if (f.name === 'appsscript' && f.type === 'JSON') f.source = JSON.stringify(v.manifiesto, null, 2); });
    var actual = apiScript_('get', 'projects/' + id + '/deployments/' + dep);
    var anterior = actual.deploymentConfig && actual.deploymentConfig.versionNumber;
    apiScript_('put', 'projects/' + id + '/content', { files: archivos });
    var nueva = apiScript_('post', 'projects/' + id + '/versions', { description: 'Finanzas ' + v.servidor + ' (desde la app)' });
    apiScript_('put', 'projects/' + id + '/deployments/' + dep, { deploymentConfig: {
      scriptId: id, versionNumber: nueva.versionNumber, manifestFileName: 'appsscript', description: 'Finanzas ' + v.servidor } });
    if (anterior) props_().setProperty('VERSION_ANTERIOR', String(anterior));
    return { ok: true, version: v.servidor, anterior: anterior || null };
  });
}

/** Vuelve la implementación a la versión que estaba antes de la última actualización. */
function volverVersionAnterior_() {
  var ant = Number(props_().getProperty('VERSION_ANTERIOR'));
  if (!ant) throw new Error('No hay una versión anterior guardada.');
  var id = ScriptApp.getScriptId(), dep = idImplementacion_();
  apiScript_('put', 'projects/' + id + '/deployments/' + dep, { deploymentConfig: { scriptId: id, versionNumber: ant, manifestFileName: 'appsscript', description: 'Finanzas (versión anterior)' } });
  props_().deleteProperty('VERSION_ANTERIOR');
  return { ok: true, versionNumber: ant };
}

// ---------------------------------------------------------------------
// SUPER Y OTROS: listas con cantidades, compartibles por link (token propio por lista)
// ---------------------------------------------------------------------
var ENC_LISTAS = ['ID', 'Nombre', 'Ícono', 'Token', 'Editable', 'Versión', 'Datos', 'Actualizado'];
var ENC_FOTOS = ['ID', 'Lista', 'Datos', 'Creada'];

function hojaSimple_(nombre, enc) {
  var l = libro_(), h = l.getSheetByName(nombre);
  if (!h) {
    h = l.insertSheet(nombre);
    h.getRange(1, 1, 1, enc.length).setValues([enc]).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}

function listasDatos_() {
  var h = hojaSimple_('Listas', ENC_LISTAS), n = h.getLastRow() - 1;
  if (n < 1) return [];
  return h.getRange(2, 1, n, ENC_LISTAS.length).getValues().map(function (r, i) {
    if (!r[0]) return null;
    var datos = {}; try { datos = JSON.parse(r[6] || '{}'); } catch (e) { datos = {}; }
    return { fila: i + 2, id: String(r[0]), nombre: String(r[1]), icono: String(r[2] || '🛒'), token: String(r[3] || ''), editable: r[4] !== 'No', v: Number(r[5]) || 0, datos: datos };
  }).filter(Boolean);
}

function listaPor_(campo, valor) {
  return listasDatos_().filter(function (l) { return valor && l[campo] === String(valor); })[0] || null;
}

function guardarListaFila_(l) {
  var h = hojaSimple_('Listas', ENC_LISTAS);
  l.v = (l.v || 0) + 1;
  var fila = [l.id, l.nombre, l.icono, l.token || '', l.editable === false ? 'No' : 'Sí', l.v, JSON.stringify(l.datos || { items: [] }), new Date()];
  if (l.fila) h.getRange(l.fila, 1, 1, fila.length).setValues([fila]);
  else { h.appendRow(fila); l.fila = h.getLastRow(); }
  CacheService.getScriptCache().put('lista_v_' + l.id, String(l.v), 21600);
  return l;
}

/** Lo que ve el teléfono (sin el token si viene por link). */
function vistaLista_(l, conToken) {
  return { id: l.id, nombre: l.nombre, icono: l.icono, editable: l.editable, v: l.v, items: (l.datos.items || []), cambio: l.datos.cambio || null,
    token: conToken ? (l.token || '') : undefined };
}

function listasResumen_() {
  return listasDatos_().map(function (l) {
    var it = l.datos.items || [];
    return { id: l.id, nombre: l.nombre, icono: l.icono, compartida: !!l.token, total: it.length, marcados: it.filter(function (x) { return x.on; }).length,
      consultas: it.filter(function (x) { return x.consulta && !x.consulta.resp; }).length, v: l.v };
  });
}

function crearLista_(nombre, icono, items) {
  return conBloqueo_(function () {
    var l = { id: Utilities.getUuid().slice(0, 8), nombre: String(nombre || 'Lista').slice(0, 60), icono: String(icono || '🛒').slice(0, 4), token: '', editable: true, v: 0,
      datos: { items: (items || []).map(limpiarItem_).filter(Boolean) } };
    return vistaLista_(guardarListaFila_(l), true);
  });
}

function limpiarItem_(it) {
  if (!it || !String(it.n || '').trim()) return null;
  return { id: String(it.id || Utilities.getUuid().slice(0, 8)), n: String(it.n).trim().slice(0, 80), q: it.q === '' || it.q === undefined || it.q === null ? '' : Number(it.q) || '',
    u: String(it.u || '').slice(0, 10), p: String(it.p || '').slice(0, 30), nota: String(it.nota || '').slice(0, 140), foto: it.foto ? String(it.foto) : '',
    on: !!it.on, por: it.por ? String(it.por).slice(0, 30) : '', estado: it.estado === 'nohay' ? 'nohay' : '', consulta: it.consulta || null };
}

function obtenerLista_(id, vConocida) {
  var vc = CacheService.getScriptCache().get('lista_v_' + id);
  if (vConocida && vc && Number(vc) === Number(vConocida)) return { sinCambios: true, v: Number(vc) };
  var l = listaPor_('id', id);
  if (!l) throw new Error('Esa lista ya no existe.');
  return vistaLista_(l, true);
}

/** Cambios en una lista. Cada cambio se aplica sobre la versión más nueva (varias personas a la vez). */
function cambiarLista_(id, op, quien, porLink) {
  return conBloqueo_(function () {
    var l = listaPor_('id', id);
    if (!l) throw new Error('Esa lista ya no existe.');
    var items = l.datos.items || [], it = op.item ? items.filter(function (x) { return x.id === op.item; })[0] : null;
    var nombre = String(quien || '').slice(0, 30) || 'Alguien';
    var soloMarcar = { marcar: 1, nohay: 1, consulta: 1, responder: 1 };
    if (porLink && !l.editable && !soloMarcar[op.t]) throw new Error('En esta lista solo podés marcar.');
    var cambio = '';
    if (op.t === 'marcar' && it) { it.on = !!op.on; it.por = op.on ? nombre : ''; if (op.on) it.estado = ''; cambio = nombre + (op.on ? ' marcó ' : ' desmarcó ') + it.n; }
    else if (op.t === 'nohay' && it) { it.estado = 'nohay'; it.on = false; it.por = nombre; cambio = nombre + ': no hay ' + it.n; }
    else if (op.t === 'agregar') { var nuevo = limpiarItem_(op.datos); if (nuevo) { items.push(nuevo); cambio = nombre + ' agregó ' + nuevo.n; } }
    else if (op.t === 'editar' && it) {
      var d = limpiarItem_(Object.assign({}, it, op.datos, { id: it.id }));
      if (it.foto && d.foto !== it.foto) borrarFoto_(it.foto);
      items[items.indexOf(it)] = d; cambio = nombre + ' cambió ' + d.n;
    }
    else if (op.t === 'quitar' && it) { if (it.foto) borrarFoto_(it.foto); if (it.consulta && it.consulta.foto) borrarFoto_(it.consulta.foto); items.splice(items.indexOf(it), 1); cambio = nombre + ' quitó ' + it.n; }
    else if (op.t === 'consulta' && it) { it.consulta = { foto: String(op.foto || ''), msg: String(op.msg || '').slice(0, 140), por: nombre, cuando: new Date().toISOString(), resp: null }; cambio = nombre + ' pregunta: ¿este sirve? (' + it.n + ')'; }
    else if (op.t === 'responder' && it && it.consulta) {
      it.consulta.resp = { si: !!op.si, msg: String(op.msg || '').slice(0, 140), por: nombre };
      if (op.si) { it.on = true; it.por = it.consulta.por; it.estado = ''; }
      cambio = nombre + (op.si ? ': sí, llevalo (' : ': no, dejalo (') + it.n + ')';
    }
    else if (op.t === 'terminar') {
      items.forEach(function (x) { if (x.consulta && x.consulta.foto) borrarFoto_(x.consulta.foto); x.consulta = null; });
      var pend = items.filter(function (x) { return !x.on; });
      if (op.pendientes === 'borrar') { pend.forEach(function (x) { if (x.foto) borrarFoto_(x.foto); }); items = items.filter(function (x) { return x.on; }); }
      else if (op.pendientes === 'mover' && op.destino) {
        var dest = listaPor_('id', op.destino);
        if (dest && dest.id !== l.id) { dest.datos.items = (dest.datos.items || []).concat(pend.map(function (x) { return limpiarItem_(Object.assign({}, x, { on: false, estado: '', por: '' })); })); guardarListaFila_(dest); items = items.filter(function (x) { return x.on; }); }
      }
      items.forEach(function (x) { x.on = false; x.por = ''; x.estado = ''; });
      cambio = nombre + ' terminó la compra';
    }
    else if (op.t === 'orden' && op.ids) { items.sort(function (a, b) { return op.ids.indexOf(a.id) - op.ids.indexOf(b.id); }); }
    else if (op.t === 'renombrar') { if (op.nombre) l.nombre = String(op.nombre).slice(0, 60); if (op.icono) l.icono = String(op.icono).slice(0, 4); }
    else if (op.t === 'editable' && !porLink) { l.editable = !!op.on; }
    l.datos.items = items;
    if (cambio) l.datos.cambio = { txt: cambio, cuando: new Date().toISOString() };
    return vistaLista_(guardarListaFila_(l), !porLink);
  });
}

function eliminarLista_(id) {
  return conBloqueo_(function () {
    var l = listaPor_('id', id); if (!l) return true;
    (l.datos.items || []).forEach(function (x) { if (x.foto) borrarFoto_(x.foto); if (x.consulta && x.consulta.foto) borrarFoto_(x.consulta.foto); });
    hojaSimple_('Listas', ENC_LISTAS).deleteRow(l.fila);
    return true;
  });
}

/** Crea o cambia el link de una lista (el viejo deja de servir). */
function linkLista_(id, nuevo) {
  return conBloqueo_(function () {
    var l = listaPor_('id', id); if (!l) throw new Error('Esa lista ya no existe.');
    if (!l.token || nuevo) l.token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().slice(0, 8);
    guardarListaFila_(l);
    return { token: l.token, implementacion: idImplementacion_() };
  });
}

function quitarLinkLista_(id) {
  return conBloqueo_(function () { var l = listaPor_('id', id); if (l) { l.token = ''; guardarListaFila_(l); } return true; });
}

// Fotos pequeñas (≈ 25 KB) guardadas como texto en la pestaña "Fotos listas"
function guardarFoto_(listaId, datos) {
  datos = String(datos || '');
  if (!/^data:image\/(jpeg|webp|png);base64,/.test(datos)) throw new Error('Foto no válida.');
  if (datos.length > 48000) throw new Error('La foto es muy grande.');
  var h = hojaSimple_('Fotos listas', ENC_FOTOS), id = 'f' + Utilities.getUuid().slice(0, 10);
  h.appendRow([id, listaId, datos, new Date()]);
  return id;
}
function leerFoto_(id) {
  var cache = CacheService.getScriptCache(), c = cache.get('foto_' + id);
  if (c) return c;
  var h = hojaSimple_('Fotos listas', ENC_FOTOS), f = h.getRange('A:A').createTextFinder(String(id)).matchEntireCell(true).findNext();
  if (!f) return '';
  var d = String(h.getRange(f.getRow(), 3).getValue() || '');
  try { cache.put('foto_' + id, d, 21600); } catch (e) { /* grande */ }
  return d;
}
function borrarFoto_(id) {
  if (!id) return;
  var h = hojaSimple_('Fotos listas', ENC_FOTOS), f = h.getRange('A:A').createTextFinder(String(id)).matchEntireCell(true).findNext();
  if (f && f.getRow() > 1) h.deleteRow(f.getRow());
  CacheService.getScriptCache().remove('foto_' + id);
}

/** Entrada para quien abre el link de una lista (sin la clave de la app). */
function apiListaLink_(token, accion, args) {
  var cache = CacheService.getScriptCache(), fallos = Number(cache.get('link_fallos') || 0);
  if (fallos >= 30) throw new Error('Demasiados intentos. Esperá unos minutos.');
  var l = listaPor_('token', token);
  if (!l || !token || String(token).length < 20) { cache.put('link_fallos', String(fallos + 1), 600); throw new Error('Este link ya no sirve. Pedí uno nuevo.'); }
  args = args || [];
  if (accion === 'ver') { var vc = cache.get('lista_v_' + l.id); if (args[0] && vc && Number(vc) === Number(args[0])) return { sinCambios: true, v: Number(vc) }; return vistaLista_(l, false); }
  if (accion === 'cambiar') return cambiarLista_(l.id, args[0] || {}, args[1], true);
  if (accion === 'foto') {
    var fid = String(args[0] || ''), usada = (l.datos.items || []).some(function (x) { return x.foto === fid || (x.consulta && x.consulta.foto === fid); });
    if (!usada) throw new Error('Foto no encontrada.');
    return leerFoto_(fid);
  }
  if (accion === 'subirFoto') return guardarFoto_(l.id, args[0]);
  throw new Error('Acción no permitida.');
}


// =====================================================================
// Calculos (copiado de web/js/calculos.js)
// =====================================================================
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
      if (m.tipo === 'Ingreso') { if (!esCobro(m)) r.ingresos[mon] += m.monto; return; }
      if (m.tipo !== 'Gasto' || m.para) return;     // v2.2: lo comprado para otra persona no es gasto mío
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


  // ---------------- Sobres con saldo (v1.6) ----------------
  /*
   * Cada sobre tiene plata real: saldo inicial + lo que entra − lo que sale, desde la fecha de inicio (D.sobresDesde).
   *  - Las compras con TARJETA DE CRÉDITO no tocan los sobres: se descuentan al asignar el PAGO de la tarjeta.
   *  - Un movimiento puede asignarse con filas en "Movimientos de sobres" (D.sobresMov, ligadas por `movimiento`)
   *    o, si no tiene esas filas, con su columna Sobre (reglas del correo).
   *  - Los pagos del préstamo salen solos del sobre de la cuota de la casa.
   */
  function esTarjeta(d, nombre) {
    return (d.cuentas || []).some(function (c) { return c.nombre === nombre && c.tipo === 'Tarjeta de crédito'; });
  }
  /** ¿Este movimiento se reparte en sobres? 'entra' | 'sale' | null */
  /** ¿Este movimiento se reparte en sobres? 'entra' | 'sale' | null */
  function esCobro(m) { return /^Pago de /.test(m.cobro || ''); }
  function sentidoSobre(d, m) {
    if (m.para && m.tipo !== 'Ingreso') return null;   // v2.2: comprado para otra persona: no toca sobres
    if (m.tipo === 'Ingreso' || m.tipo === 'Retiro de fondo') return 'entra';
    if (m.tipo === 'Inversión' || m.tipo === 'Pago de tarjeta' || m.tipo === 'Gasto') return 'sale';
    return null;
  }
  /**
   * v1.8: las compras con TARJETA también se asignan a un sobre (el sobre baja en el momento) y ese monto queda
   * "reservado" para la tarjeta. Cuando llega el pago de la tarjeta, lo reservado lo cubre solo (no se descuenta dos veces);
   * solo se pregunta por lo que falte (intereses, cuotas tasa cero, compras sin sobre).
   */
  function analizarSobres(d) {
    var desde = d.sobresDesde ? soloFecha(new Date(d.sobresDesde)) : null;
    var efectos = [], porMov = {}, pendientes = [], reservado = {}, cubierto = {};
    (d.sobresMov || []).forEach(function (x) {
      if (x.movimiento) (porMov[x.movimiento] = porMov[x.movimiento] || []).push(x);
      if (x.sobre) efectos.push({ sobre: x.sobre, monto: x.monto, fecha: x.fecha, tipo: x.tipo, grupo: x.grupo, movimiento: x.movimiento || null, nota: x.nota });
    });
    if (!desde) return { efectos: efectos, pendientes: [], porMov: porMov, desde: null, reservado: {}, cubierto: {} };
    var movs = (d.movimientos || []).filter(function (m) { return m.fecha && soloFecha(new Date(m.fecha)) >= desde && sentidoSobre(d, m); })
      .slice().sort(function (a, b) { return new Date(a.fecha) - new Date(b.fecha); });
    movs.forEach(function (m) {
      var sentido = sentidoSobre(d, m), tarjeta = m.tipo === 'Gasto' && esTarjeta(d, m.cuenta);
      var filas = porMov[m.fila] || [];
      var explicito = filas.reduce(function (a, x) { return a + Math.abs(x.monto); }, 0);
      var aSobres = filas.reduce(function (a, x) { return a + (x.sobre ? Math.abs(x.monto) : 0); }, 0);
      if (!filas.length && m.sobre && m.tipo !== 'Pago de tarjeta') {
        var nombre = m.sobre;
        // inversiones anotadas antes de elegir el sobre de fondos (quedaron con el nombre "Fondos")
        if (m.tipo === 'Inversión' && (d.sobreEspecial || {}).fondos && !(d.sobres || []).some(function (s) { return s.nombre === nombre; })) nombre = d.sobreEspecial.fondos;
        efectos.push({ sobre: nombre, monto: sentido === 'entra' ? m.monto : -m.monto, fecha: m.fecha, tipo: m.tipo === 'Inversión' ? 'Inversión' : tarjeta ? 'Compra con tarjeta' : 'Regla', movimiento: m.fila });
        explicito = aSobres = m.monto;
      }
      var clave = m.cuenta + '|' + (m.moneda === 'USD' ? 'USD' : 'CRC');   // lo reservado se lleva por tarjeta y moneda
      if (tarjeta) reservado[clave] = (reservado[clave] || 0) + aSobres;
      var auto = 0;
      if (m.tipo === 'Pago de tarjeta') {
        auto = Math.max(0, Math.min(reservado[clave] || 0, m.monto - explicito));
        if (auto) { reservado[clave] -= auto; cubierto[m.fila] = auto; }
      }
      var falta = m.monto - explicito - auto;
      if (falta > 0.005) pendientes.push({ mov: m, sentido: sentido, falta: falta, asignado: explicito + auto, reservadoUsado: auto, tarjeta: tarjeta });
    });
    var esp = (d.sobreEspecial || {}).prestamo;
    if (esp && d.prestamo) (d.prestamo.pagos || []).forEach(function (p) {
      if (p.fecha && soloFecha(new Date(p.fecha)) >= desde && p.total) efectos.push({ sobre: esp, monto: -p.total, fecha: p.fecha, tipo: 'Préstamo' });
    });
    pendientes.sort(function (a, b) { return new Date(b.mov.fecha) - new Date(a.mov.fecha); });
    return { efectos: efectos, pendientes: pendientes, porMov: porMov, desde: desde, reservado: reservado, cubierto: cubierto };
  }
  /** Saldo de cada sobre al final del mes `mes` (o hoy) y lo que entró / salió en ese mes. */
  function saldosSobres(d, mes, hoy) {
    var an = analizarSobres(d);
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
  var CATS_VIAJE = ['Transporte', 'Comida', 'Hospedaje', 'Tours', 'Compras', 'Otros'];
  var PALABRAS_VIAJE = [
    ['Transporte', /AVIANCA|COPA|AIRLINE|AIRWAYS|AEROL|VOLARIS|UNITED|DELTA|AMERICAN AIR|JETBLUE|SPIRIT|UBER|TAXI|CABIFY|DIDI|BOLT|RENT ?A ?CAR|HERTZ|AVIS|ALAMO|BUDGET|GASOL|FUEL|SHELL|TEXACO|METRO|BUS|PARKING|PARQUEO|PEAJE/i],
    ['Hospedaje', /HOTEL|HOSTEL|AIRBNB|BOOKING|EXPEDIA|MARRIOTT|HILTON|HYATT|SHERATON|RESORT|INN\b|LODGE|SUITES/i],
    ['Comida', /REST|CAFE|COFFEE|STARBUCKS|BAR\b|GRILL|PIZZA|BURGER|MCDONALD|KFC|SUBWAY|FOOD|SUSHI|TACO|DINER|BAKERY|PANADER|SODA|POLLO|COMIDA/i],
    ['Tours', /TOUR|TICKET|ENTRADA|MUSEO|MUSEUM|PARK|PARQUE|EXCURS|CANOPY|ZOO|DISNEY|UNIVERSAL|GETYOURGUIDE|VIATOR/i],
    ['Compras', /MALL|STORE|SHOP|TIENDA|OUTLET|DUTY|WALMART|TARGET|ZARA|NIKE|ADIDAS|ALBROOK|MULTIPLAZA|AMAZON|FARMAC|PHARM|SUPER/i]
  ];
  var CAT_A_VIAJE = { Restaurantes: 'Comida', Transporte: 'Transporte', Compras: 'Compras', Ropa: 'Compras', Entretenimiento: 'Tours', Viajes: 'Otros', Supermercado: 'Comida' };
  function categoriaViaje(m) {
    var v = String(m.viaje || '').replace(/^\+/, '');
    if (CATS_VIAJE.indexOf(v) >= 0) return v;
    for (var i = 0; i < PALABRAS_VIAJE.length; i++) if (PALABRAS_VIAJE[i][1].test(m.comercio || '')) return PALABRAS_VIAJE[i][0];
    return CAT_A_VIAJE[m.categoria] || 'Otros';
  }
  function enViaje(v, m) {
    if (!m.fecha || m.viaje === 'Fuera' || (m.tipo !== 'Gasto' && m.tipo !== 'Compra tasa cero')) return false;
    var f = new Date(m.fecha), ini = soloFecha(new Date(v.desde)), fin = new Date(soloFecha(new Date(v.hasta)).getTime() + 86400000);
    if (f < ini || f >= fin) return false;
    if (String(m.viaje || '').charAt(0) === '+') return true;
    var t = v.tarjetas || [];
    return t.indexOf(m.cuenta) >= 0 || (t.indexOf('Efectivo') >= 0 && !m.cuenta);
  }
  /** Montos en la moneda del viaje (los ₡ se pasan a $ con el tipo de cambio, y al revés). */
  function aMoneda(monto, de, a, tc) {
    if (de === a || !tc) return monto;
    return a === 'USD' ? monto / tc : monto * tc;
  }
  function viaje(d, v, hoy) {
    var tc = d.tipoCambio || 0, mon = v.moneda || 'USD';
    var compras = (d.movimientos || []).filter(function (m) { return enViaje(v, m); }).map(function (m) {
      return { mov: m, categoria: categoriaViaje(m), monto: aMoneda(m.monto, m.moneda, mon, tc) };
    }).sort(function (a, b) { return new Date(b.mov.fecha) - new Date(a.mov.fecha); });
    var gastado = compras.reduce(function (s, c) { return s + c.monto; }, 0);
    var porCategoria = {};
    CATS_VIAJE.forEach(function (c) { porCategoria[c] = 0; });
    compras.forEach(function (c) { porCategoria[c.categoria] += c.monto; });
    var ini = soloFecha(new Date(v.desde)), fin = soloFecha(new Date(v.hasta)), h = soloFecha(hoy);
    var total = Math.max(1, diasEntre(ini, fin) + 1);
    var restantes = h < ini ? total : h > fin ? 0 : diasEntre(h, fin) + 1;
    var transcurridos = Math.max(1, Math.min(total, diasEntre(ini, h) + 1));
    var limite = v.limite || 0, disponible = limite - gastado;
    return {
      compras: compras, gastado: gastado, limite: limite, disponible: disponible, pct: limite ? gastado / limite : 0,
      diasTotal: total, diasRestantes: restantes, porDia: restantes ? Math.max(0, disponible) / restantes : 0,
      promedio: h < ini ? 0 : gastado / transcurridos, porCategoria: porCategoria, moneda: mon,
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
      compras: 0, sube: { CRC: 0, USD: 0 }, baja: { CRC: 0, USD: 0 }, vivo: !!c.fechaSaldo };
    var desde = c.fechaSaldo ? new Date(c.fechaSaldo) : null;
    if (!desde || isNaN(desde)) { r.vivo = false; return r; }
    // la fecha del saldo es un día: cuenta lo de después de ese día
    var corte = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate() + 1);
    (d.movimientos || []).forEach(function (m) {
      if (m.cuenta !== c.nombre || !m.fecha || new Date(m.fecha) < corte) return;
      var mon = m.moneda === 'USD' ? 'USD' : 'CRC';
      if (m.tipo === 'Gasto' || m.tipo === 'Compra tasa cero') { r.sube[mon] += m.monto; r.compras++; }
      else if (m.tipo === 'Pago de tarjeta' || m.tipo === 'Ingreso') r.baja[mon] += m.monto;   // pagos y devoluciones
    });
    r.CRC = r.base.CRC + r.sube.CRC - r.baja.CRC;
    r.USD = r.base.USD + r.sube.USD - r.baja.USD;
    return r;
  }
  /** Compras hechas para otras personas que todavía no te pagaron, y posibles pagos (ingresos por el mismo monto). */
  function meDeben(d) {
    var pend = (d.movimientos || []).filter(function (m) { return m.para && m.tipo !== 'Ingreso' && !m.cobro; })
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
      if (ing.tipo !== 'Ingreso' || ing.cobro || ing.fila < 0) return;
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

  function pct(n, dec) { return n === null || n === undefined ? '—' : (n * 100).toFixed(dec === undefined ? 2 : dec).replace('.', ',') + '%'; }

  return {
    claveMes: claveMes, enMes: enMes, sumarMeses: sumarMeses, mesesCompletos: mesesCompletos, diasEntre: diasEntre,
    proximaFecha: proximaFecha, estadoTasaCero: estadoTasaCero, cuotaEnMes: cuotaEnMes, resumenMes: resumenMes,
    sobres: sobres, dinero: dinero, leerNumero: leerNumero, pct: pct, NO_GASTO: NO_GASTO,
    amortizar: amortizar, cuotaNivelada: cuotaNivelada, planTasaCero: planTasaCero, abonosEnMes: abonosEnMes,
    esTarjeta: esTarjeta, sentidoSobre: sentidoSobre, analizarSobres: analizarSobres, saldosSobres: saldosSobres, reparto: reparto,
    fondos: fondos, sugerirSubcuenta: sugerirSubcuenta, deudaTarjeta: deudaTarjeta, meDeben: meDeben, esCobro: esCobro, esSobreReal: esSobreReal, fechasSalario: fechasSalario, esSalario: esSalario, viaje: viaje, enViaje: enViaje, categoriaViaje: categoriaViaje, CATS_VIAJE: CATS_VIAJE, aMoneda: aMoneda
  };
})();
if (typeof module !== 'undefined') module.exports = Calc;
