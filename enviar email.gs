/**
 * Esta parte se encarga del envío de notificaciones por email usando
 * los ajustes de la hoja CONFIGURACIÓN.
 * @param   {Array}   camposForm    vector de pares [campo, valor] recogidos por el formulario
 * @param   {Array}   talleresForm  vector de pares [grupo, código taller] recogidos por el formulario
 * @return  {boolean}               TRUE si se ha enviado sin errores
 */
function enviarEmail(camposForm, talleresForm) {
  
  try {
    const hdc = SpreadsheetApp.getActive();

    // Obtención del campo de email destino (limpieza de espacios y minúsculas)
    const campoEmail = hdc.getRange(PARAM.campoEmail).getValue()
      .toLowerCase().replaceAll(/\s/g, '');

    // Preparación de los marcadores para la plantilla
    const marcadores = new Map();

    // 1. Imagen de cabecera
    marcadores.set('$IMAGEN$', `<img class="cabecera" src="${hdc.getRange(PARAM.urlImagen).getValue()}"></img>`);

    // 2. Campos genéricos del formulario (con escapeHtml para seguridad XSS)
    camposForm.forEach(campo => {
      marcadores.set(`$${campo[0].toUpperCase()}$`, escapeHtml(campo[1]));
    });

    // 3. Descripción de los talleres
    // Delegamos la carga de datos en obtenerDescTaller para evitar redundancias
    talleresForm.forEach(campo => {
      marcadores.set(`$${campo[0].toUpperCase()}$`, obtenerDescTaller(campo[1]));
    });

    // Procesamiento del cuerpo del mensaje (reemplazo de marcadores)
    let htmlPayload = hdc.getRange(PARAM.textoEmail).getValue();
    marcadores.forEach((texto, marcador) => {
      htmlPayload = htmlPayload.replaceAll(marcador, texto);
    });

    // Preparación de la plantilla HTML final
    const html = HtmlService.createTemplateFromFile('email');
    html.colorTema = hdc.getRange(PARAM.colorTema).getValue();
    html.htmlPayload = htmlPayload;

    // Ejecución del envío
    MailApp.sendEmail(
      camposForm.find(campo => campo[0] == campoEmail)[1],
      hdc.getRange(PARAM.asunto).getValue(),
      'Debes usar un cliente de correo compatible con HTML para visualizar este mensaje.',
      { 
        htmlBody: html.evaluate().getContent(), 
        name: hdc.getRange(PARAM.remitente).getValue() 
      }
    );

    return true;

  } catch(e) {
    console.error('Error en enviarEmail:', e);
    return false;
  }
}