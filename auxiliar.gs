/**
 * Algunas funciones auxiliares utilizadas.
 */

let cacheTalleres;

/**
 * Devuelte TRUE si [id, clave] aparece en la tabla de IDENTIFICACIÓN,
 * si no se facilita el valor del campo clave no se utilizará
 * en la comprobación.
 * @param   {string}           id    valor del campo identificador
 * @param   {string|undefined}       clave valor del campo clave
 * @return  {boolean}
 */
function esAutenticado(id, clave) {
  const hdc = SpreadsheetApp.getActive();
  const [_, ...identidades] = hdc.getSheetByName(IDENTIFICACION.hoja).getDataRange().getValues();
  return identidades.findIndex(identidad => identidad[IDENTIFICACION.colId] == id
    && (clave == undefined ? true :  identidad[IDENTIFICACION.colClave] == clave)) == -1
    ? false : true;

}

/**
 * Devuelve un vector de objetos que contiene información de las
 * inscripciones no anuladas identificadas mediante el
 * valor del campo ID que se pasa como parámetro, así como la situación de
 * coincidencia del campo clave, si lo hubiera, para cada una de ellas. 
 * { fila (desde 0), código taller }
 * @param   {string}              id        valor del campo identificador
 * @param   {string|undefined}    clave     valor del campo clave
 * @param   {number}              colId     nº columna del campo ID
 * @param   {number|undefined}    colClave  nº columna del campo clave
 * @param   {number}              colTaller nº columna del código del taller
 * @param   {number}              colEstado nº columna del estado de la inscripcion
 * @return  {Object[]}                      [{ autorizado (true|false), fila, código taller }]
 */
function obtenerInsPrevias(id, clave, colId, colClave, colTaller, colEstado) {

  const hdc = SpreadsheetApp.getActive();
  const [_, ...inscripciones] = hdc.getSheetByName(INSCRIPCIONES.hoja).getDataRange().getValues();
  return inscripciones.reduce((vector, inscripcion, indice) => {
    if (inscripcion[colId] == id 
      && inscripcion[colEstado] == INSCRIPCIONES.estadoOk) {
      return [...vector, {
          autorizado: clave == undefined ? true : inscripcion[colClave] == clave,
          fila: indice,
          taller: inscripcion[colTaller]
        }];
    } else return vector;
  }, []);

}

/**
 * Devuelve una cadena formateada que contiene el nombre
 * y el grupo del taller cuyo código se pasa como parámetro.
 * @param   {string}  id  código del taller
 * @return  {string}      "nombre (grupo)"
 */
function obtenerDescTaller(id) {

  if (!cacheTalleres) {
    cacheTalleres = SpreadsheetApp.getActive()
      .getSheetByName(TALLERES.hoja).getDataRange().getValues();
  }

  const [encabezados, ...talleres] = cacheTalleres;
  const taller = talleres.find(taller => taller[TALLERES.colId] == id);
  if (taller) return taller[TALLERES.colUrl]
    ? `<a href="${taller[TALLERES.colUrl]}">${taller[TALLERES.colNombre]}</a> (${taller[TALLERES.colGrupo]})`
    : `${taller[TALLERES.colNombre]} (${taller[TALLERES.colGrupo]})`;

}

/**
 * Trata de comprobar si el texto introducido por el usuario
 * en las distintas cajas de configuración contiene HTML válido.
 */
function validarHtml() {

  const celdasHtml = [
    { rango: PARAM.textoAbierto, etiqueta: 'Texto abierto' },
    { rango: PARAM.textoCerrado, etiqueta: 'Texto cerrado' },
    { rango: PARAM.textoConfirmacion, etiqueta: 'Texto confirmación' },
    { rango: PARAM.textoCambioPlazas, etiqueta: 'Texto cambio plazas' },
    { rango: PARAM.textoMultiple, etiqueta: 'Texto inscripciones múltiples prohibidas' },
    { rango: PARAM.textoFalloAut, etiqueta: 'Texto fallo identificación' },
    { rango: PARAM.textoMultipleNoAut, etiqueta: 'Texto inscripciones múltiples permitidas' },
    { rango: PARAM.textoEmail, etiqueta: 'Texto del mensaje' },
  ];

  let celdasHtmlInvalido;
  const hdc = SpreadsheetApp.getActive();
  hdc.toast('Validando HTML...');

  celdasHtml.forEach((celda, indice) => {

    try {
      HtmlService.createHtmlOutput(hdc.getRange(celda.rango).getValue());
    } catch (e) {
      celdasHtmlInvalido = !celdasHtmlInvalido
        ? `«${celdasHtml[indice].etiqueta}»`
        : celdasHtmlInvalido + `, «${celdasHtml[indice].etiqueta}»`
    }

  });

  if (!celdasHtmlInvalido) {
    hdc.toast('👍 Comprobación finalizada, tu HTML no causará errores en la ejecución de este Apps Script.')
  } else {
    hdc.toast(`${celdasHtmlInvalido} (clic para cerrar).`,'👎 HTML inválido en...', -1);
  }

}

/**
 * Previsualiza el texto del mensaje, se señalizan los marcadores
 * que representan los campos de las respuestas del formulario,
 * pero no se instancian con campos de ejemplo.
 */
function previsualizarEmail() {

  const hdc = SpreadsheetApp.getActive();

  try {
  // Resuelve parametrización de <img>
  const htmlPayload = hdc.getRange(PARAM.textoEmail).getValue()
    .replace('$IMAGEN$', `<img class="cabecera" src="${hdc.getRange(PARAM.urlImagen).getValue()}"></img>`);
  
  // Resuelve resto de parametrizaciones e instancia plantilla
  const html = HtmlService.createTemplateFromFile('email');
  html.colorTema = hdc.getRange(PARAM.colorTema).getValue();
  html.htmlPayload = htmlPayload;
  
  // Muestra vista previa en panel flotante
    SpreadsheetApp.getUi().showModalDialog(
      html.evaluate().setWidth(800).setHeight(600),
      `${hdc.getRange(PARAM.asunto).getValue()} (vista previa 📨)`
    );

  } catch (e) {
    hdc.toast('No ha sido posible generar una vista previa, revisa el código HTML del texto del mensaje.', '👎  HTML inválido', 10);
  }

}