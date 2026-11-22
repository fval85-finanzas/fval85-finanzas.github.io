/* v2.10.4 · Listas de "Tiendas y mall": secciones, lista base y lectura rápida ("tenis talla 9 negros para Fernando").
 * Lo usan la app (js/app.js) y la lista compartida (lista.html). */
var TIENDAS = (function () {
  'use strict';
  var SECCIONES = ['Ropa', 'Ropa deportiva', 'Ropa interior y medias', 'Abrigos', 'Calzado', 'Accesorios', 'Perfumería y belleza', 'Cuidado personal', 'Electrónica', 'Hogar', 'Niños', 'Regalos', 'Otros'];
  var IC = { 'Ropa': '👕', 'Ropa deportiva': '🏃', 'Ropa interior y medias': '🧦', 'Abrigos': '🧥', 'Calzado': '👟', 'Accesorios': '🎒', 'Perfumería y belleza': '💄', 'Cuidado personal': '🧴', 'Electrónica': '📱', 'Hogar': '🏠', 'Niños': '🧸', 'Regalos': '🎁', 'Otros': '🛍' };
  var BASE = [
    ['Ropa', ['Camisetas', 'Camisas', 'Blusas', 'Polos', 'Jeans', 'Pantalones', 'Pantalones cortos', 'Vestidos', 'Faldas', 'Enaguas', 'Pijamas', 'Vestido de baño', 'Ropa formal']],
    ['Ropa deportiva', ['Camisetas deportivas (dry fit)', 'Licras', 'Pantalonetas deportivas', 'Buzo (pants)', 'Top deportivo', 'Shorts de correr', 'Ropa de gimnasio']],
    ['Ropa interior y medias', ['Medias deportivas', 'Medias de vestir', 'Calzoncillos / bóxers', 'Calzones', 'Brasieres', 'Camisetas interiores']],
    ['Abrigos', ['Abrigo / chaqueta', 'Suéter', 'Sudadera (hoodie)', 'Rompevientos', 'Impermeable / capa', 'Bufanda', 'Guantes', 'Gorro']],
    ['Calzado', ['Tenis para correr', 'Tenis casuales', 'Zapatos de vestir', 'Sandalias', 'Chancletas', 'Botas', 'Zapatos escolares', 'Plantillas']],
    ['Accesorios', ['Gorra', 'Lentes de sol', 'Faja / cinturón', 'Bolso', 'Mochila', 'Billetera', 'Reloj', 'Sombrero', 'Paraguas', 'Maleta']],
    ['Perfumería y belleza', ['Perfume', 'Loción / colonia', 'Desodorante', 'Maquillaje', 'Cremas', 'Bloqueador solar', 'Esmalte de uñas', 'Productos para el pelo']],
    ['Cuidado personal', ['Cepillo de dientes', 'Rasuradora', 'Kit de viaje', 'Secadora de pelo']],
    ['Electrónica', ['Audífonos', 'Cargador', 'Cable USB', 'Batería portátil', 'Adaptador de enchufe', 'Funda de celular', 'Reloj inteligente']],
    ['Hogar', ['Toallas', 'Sábanas', 'Almohadas', 'Cobija', 'Utensilios de cocina', 'Decoración']],
    ['Niños', ['Juguetes', 'Uniforme', 'Útiles escolares', 'Ropa de niños', 'Zapatos de niños']],
    ['Regalos', ['Regalo de cumpleaños', 'Recuerdos del viaje', 'Chocolates']]
  ];
  var REGLAS = [
    [/tenis|zapato|sandalia|chancleta|bota|calzado|plantilla|tacones|mocas/, 'Calzado'],
    [/media|calcet|calzoncillo|boxer|bóxer|calz[oó]n|brasier|bra\b|panty|interior/, 'Ropa interior y medias'],
    [/abrigo|chaqueta|chamarra|su[eé]ter|sudadera|hoodie|rompevientos|impermeable|capa\b|bufanda|guante|gorro\b/, 'Abrigos'],
    [/licra|leggin|dry ?fit|deportiv|buzo|pants|gimnasio|gym|top deport|shorts? de correr|pantaloneta/, 'Ropa deportiva'],
    [/camis|blusa|polo\b|jean|pantal|vestido|falda|enagua|pijama|short|bermuda|ropa/, 'Ropa'],
    [/gorra|lentes|gafas|faja|cintur[oó]n|bolso|cartera|mochila|billetera|reloj\b|sombrero|paraguas|maleta|salveque|collar|arete|pulsera/, 'Accesorios'],
    [/perfume|loci[oó]n|colonia|maquillaje|crema|bloqueador|esmalte|labial|desodorante|pelo|cabello|shampoo|champ[uú]/, 'Perfumería y belleza'],
    [/cepillo|rasurador|secadora|kit/, 'Cuidado personal'],
    [/aud[ií]fono|cargador|cable|bater[ií]a|adaptador|funda|celular|tablet|laptop|reloj inteligente|smartwatch|parlante/, 'Electrónica'],
    [/toalla|s[aá]bana|almohada|cobija|cocina|decoraci|vaso|plato|olla/, 'Hogar'],
    [/juguete|uniforme|[uú]tiles|ni[nñ]o|ni[nñ]a|beb[eé]/, 'Niños'],
    [/regalo|recuerdo|chocolate|souvenir/, 'Regalos']
  ];
  var COLORES = ['negro', 'negra', 'negros', 'negras', 'blanco', 'blanca', 'blancos', 'blancas', 'azul', 'azules', 'rojo', 'roja', 'rojos', 'rojas', 'verde', 'verdes', 'gris', 'grises', 'rosado', 'rosada', 'rosados', 'rosadas', 'morado', 'morada', 'amarillo', 'amarilla', 'café', 'cafe', 'beige', 'celeste', 'naranja', 'vino', 'dorado', 'plateado'];
  function sinTildes(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function seccionDe(n) { var s = sinTildes(n); for (var i = 0; i < REGLAS.length; i++) if (REGLAS[i][0].test(s)) return REGLAS[i][1]; return 'Otros'; }
  function mayus(s) { s = String(s || '').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
  /** "2 tenis talla 9 negros para Fernando en Albrook" → { n, q, talla, color, para, tienda, p } */
  function leer(texto, personas) {
    var t = String(texto || '').trim(); if (!t) return null;
    var d = { n: '', q: '', u: '', talla: '', color: '', para: '', tienda: '', p: '' }, m;
    if ((m = t.match(/\bpara\s+(todos|[a-záéíóúñ]+)\b/i))) {
      var quien = m[1], conocido = (personas || []).filter(function (p) { return sinTildes(p) === sinTildes(quien) || sinTildes(p).indexOf(sinTildes(quien)) === 0; })[0];
      d.para = /^todos$/i.test(quien) ? 'Todos' : conocido || mayus(quien); t = t.replace(m[0], ' ');
    }
    if ((m = t.match(/\b(?:en|de la tienda)\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)*)\s*$/))) { d.tienda = m[1]; t = t.replace(m[0], ' '); }
    if ((m = t.match(/\btalla\s+([\w.,/]+)/i))) { d.talla = m[1].toUpperCase(); t = t.replace(m[0], ' '); }
    var pal = t.split(/\s+/), resto = [];
    pal.forEach(function (w) { if (!d.color && COLORES.indexOf(sinTildes(w)) >= 0) d.color = mayus(w); else resto.push(w); });
    t = resto.join(' ').trim();
    if ((m = t.match(/^(\d+)\s+(.+)$/))) { d.q = Number(m[1]); d.u = 'u'; t = m[2]; }
    d.n = mayus(t.replace(/\s+/g, ' ').trim()) || 'Algo';
    d.p = seccionDe(d.n);
    return d;
  }
  /** Etiquetas cortas de una cosa (talla, color, cantidad, tienda) */
  function etiquetas(x, sinPara) {
    return [x.para && !sinPara ? '👤 ' + x.para : '', x.talla ? 'talla ' + x.talla : '', x.color || '', x.q ? (x.q + ' u') : '', x.tienda ? '🏬 ' + x.tienda : ''].filter(String);
  }
  return { SECCIONES: SECCIONES, IC: IC, BASE: BASE, seccionDe: seccionDe, leer: leer, etiquetas: etiquetas, sinTildes: sinTildes };
})();
