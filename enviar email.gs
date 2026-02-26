/**
 * Esta parte de encarga del envío de notificaciones por email usando
 * los ajustes de la hoja CONFIGURACIÓN.
 * @param   {Array}   camposForm    vector de pares [campo, valor] recogidos por el formulario
 * @param   {Array}   talleresForm  vector de pares [grupo, código taller] recogidos por el formulario
 * @return  {boolean}               TRUE si se ha enviado sin errores
 */
function enviarEmail(camposForm, talleresForm) {
 
  try {

    const hdc = SpreadsheetApp.getActive();

    const campoEmail = hdc.getRange(PARAM.campoEmail).getValue().toLowerCase().replaceAll(/\s/g, '');

    // Prepara el contenido del email

    const marcadores = new Map();
    marcadores.set('$IMAGEN$', `<img class="cabecera" src="${hdc.getRange(PARAM.urlImagen).getValue()}"></img>`);
    camposForm.forEach(campo => marcadores.set(`\$${campo[0].toUpperCase()}$`, campo[1]));

    const [encabezados, ...talleres] = hdc.getSheetByName(TALLERES.hoja).getDataRange().getValues();
    talleresForm.forEach(campo => marcadores.set(`\$${campo[0].toUpperCase()}$`, obtenerDescTaller(campo[1], talleres)));

    let htmlPayload = hdc.getRange(PARAM.textoEmail).getValue();
    marcadores.forEach((texto, marcador) => htmlPayload = htmlPayload.replaceAll(marcador, texto));

    // console.info(htmlPayload);

    const html = HtmlService.createTemplateFromFile('email');
    html.colorTema = hdc.getRange(PARAM.colorTema).getValue();
    html.htmlPayload = htmlPayload;

    // Envia el email

    MailApp.sendEmail(
      camposForm.find(campo => campo[0] == campoEmail)[1],
      hdc.getRange(PARAM.asunto).getValue(),
      'Debes usar un cliente de correo compatible con HTML para visualizar este mensaje.',
      { htmlBody: html.evaluate().getContent(), name: hdc.getRange(PARAM.remitente).getValue() }
    );

    return true;

  } catch(e) {
    console.error(e);
    return false;
  }
}