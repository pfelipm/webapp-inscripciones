/**
 * Funciones específicas cliente <> servidor
 */

/**
 * Devuelve al cliente el contenido HTML inicial de la webapp.
 * @param   {Object} e objeto que representa el evento
 * @return  {Object}   contenido HTML
 */
function doGet(e) {

  const hdc = SpreadsheetApp.getActive();
  const formularioWeb = HtmlService.createTemplateFromFile('formulario');

  // Parametrización encabezado webapp
  formularioWeb.imagenCabecera = hdc.getRange(PARAM.urlImagen).getValue();
  formularioWeb.tamEncabezado = hdc.getRange(PARAM.tamEncabezado).getValue();
  formularioWeb.textoEncabezado = hdc.getRange(PARAM.textoEncabezado).getValue();

  // Parametrización botón enviar
  formularioWeb.btnEtiqueta = hdc.getRange(PARAM.btnEtiqueta).getValue();
  formularioWeb.btnIcono = hdc.getRange(PARAM.btnIcono).getValue();

  const html = formularioWeb.evaluate().setTitle(hdc.getRange(PARAM.textoEncabezado).getValue());

  return HtmlService.createHtmlOutput(html)
    // Resuelve el problema de zoom excesivo al llevar foco a algún campo del formulario en algunos Android,
    // initial-scale=0.80 permite que se vean totalmente los nombres de los grupos en las pestañas.
    .addMetaTag('viewport', 'meta name="viewport" content="width="width=device-width", initial-scale=0.80, user-scalable=no"')   
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

}

/**
 * Genera y devuelve el código HTML necesario para mostrar
 * el tab de selección de talleres.
 * @return {string}
 */
function cargarTalleres() {

  try {

    const hdc = SpreadsheetApp.getActive();

    // Matriz de datos de talleres
    const [encabezados, ...talleres] = hdc.getSheetByName(TALLERES.hoja).getDataRange().getValues().slice(TALLERES.filDatos - 2);

    // console.info(talleres.length);

    if (talleres.length > 0) {

      // Vector de grupos únicos de talleres
      const grupos = Array.from(new Set(talleres.map(taller => taller[TALLERES.colGrupo])));

      // Generar HTML selector de talleres mediante DIV con pestañas

      // [1] Pestañas
      const icono = hdc.getRange(PARAM.tabIcono).getValue();
      const htmlSelectorWrapper = '<div class="col s12"><ul class="tabs" id="tabs">__SELECTORES__</ul></div>';
      const htmlSelector = `<li class="tab col s4"><a href="#__IDGRUPO__"><sub><i class="tiny material-icons">__ICONO__</i></sub>
      __GRUPO__</a></li>`;
      let htmlPayload = htmlSelectorWrapper.replace('__SELECTORES__',
        grupos.reduce((html, grupo, indice) => html + htmlSelector.replace('__IDGRUPO__', `grupo${indice + 1}`).replace('__GRUPO__', grupo), ''))
        .replaceAll('__ICONO__', icono);

      // console.info(htmlPayload);

      // [2] DIVs
      const htmlTabWrapper = '<div id="__GRUPO__" class="col s12">__LISTATALLERES__</div>';
      const htmlUrlFicha = '<sub><a target="_blank" title="Ver ficha" href="__URL__"><i class="tiny material-icons">remove_red_eye</i></a></sub>';
      const htmlTab = `<p><label for="__ID__">
      <input class="with-gap" type="radio" name="__GRUPO__" id="__ID__" value="__ID__" __DISABLED__>
      <span class="nombreTalleres" __TACHADO__>__NOMBRE__ <sub>(__PLAZAS__🪑) __HTMLURLFICHA__</sub></span></label></p>`;

      const nCarMax = hdc.getRange(PARAM.nMaxCarNombre).getValue();
      const colUrlFicha = encabezados.indexOf(hdc.getRange(PARAM.campoUrlFicha).getValue());

      htmlPayload = grupos.reduce((html, grupo, indice) => {

        return html + htmlTabWrapper.replace('__GRUPO__', `grupo${indice + 1}`).replace('__LISTATALLERES__',
          talleres.filter(taller => taller[TALLERES.colGrupo] == grupo)
            .reduce((html, taller) => {
              return html + htmlTab.replaceAll('__ID__', taller[TALLERES.colId])
                .replace('__GRUPO__', `grupo${indice + 1}`)
                .replace('__NOMBRE__', (nCarMax && taller[TALLERES.colNombre].length > nCarMax) ? `${taller[TALLERES.colNombre].substring(0, nCarMax)}...` : taller[TALLERES.colNombre])
                .replace('__PLAZAS__', taller[TALLERES.colAforo] - taller[TALLERES.colOcupadas])
                .replace('__HTMLURLFICHA__', colUrlFicha != -1 ? htmlUrlFicha.replace('__URL__', taller[colUrlFicha]) : '')
                .replace('__DISABLED__', taller[TALLERES.colAforo] - taller[TALLERES.colOcupadas] == 0 ? 'DISABLED' : '')
                .replace('__TACHADO__', taller[TALLERES.colAforo] - taller[TALLERES.colOcupadas] == 0 ? 'style="text-decoration:line-through"' : '');
            }, '')
        );
      }, htmlPayload);

      // console.info(htmlPayload);

      return htmlPayload;

    } else return '<p class="center-align red-text text-accent-3">😱 No se han cargado talleres en el formulario (no deberías estar viendo esto) 😱</p>';
  
  } catch (e) {
    // Sin tratamiento específico dado que esto se realiza justo tras abrir el formulario
    console.error(e);
  }

}

/**
 * Recibe el contenido del formulario de selección de talleres 
 * Ej: { grupo2: 'IDT-15', grupo1: 'IDT-02', grupo3: 'IDT-28', campo1: '111111', campo2: '11111111' }
 * y lo procesa, devolviendo un objeto que refleja el resultado
 * de la operación al código JS de cliente.
 * @param   {Object}  formulario  valor de los campos del formulario HTML
 * @return  {Object}              {estado, mensaje, previas} estado = ok | repetido | cerrado | otros // previas = true | false | undefined
 */
function guardarSeleccion(formulario) {

  // Solo para testear sin necesidad de usar la interfaz web
  // formulario = { grupo2: 'IDT-14', grupo1: 'IDT-01', grupo3: 'IDT-40', campo1: '333333', campo2: '11111111', campo3: 'aa@aa.es' };

  try {

    const hdc = SpreadsheetApp.getActive();

    // [1] Determina si el formulario sigue abierto...
    const checkActivar = hdc.getRange(PARAM.checkActivar).getValue();
    const apertura = hdc.getRange(PARAM.apertura).getValue();
    const cierre = hdc.getRange(PARAM.cierre).getValue();
    const checkPeriodo = hdc.getRange(PARAM.checkPeriodo).getValue();
    const checkMantenimiento = hdc.getRange(PARAM.checkMantenimiento).getValue();
    const minTrasCierre = hdc.getRange(PARAM.minTrasCierre).getValue();
    const ahora = new Date();
    const formularioAbierto = !checkMantenimiento
      && (checkPeriodo ? (ahora >= apertura && ahora.getTime() < cierre.getTime() + minTrasCierre * 60 * 1000 ? true : false) : checkActivar);

    // ...y falla con estado "cerrado" en caso contrario
    if (!formularioAbierto) throw { estado: 'cerrado', mensaje: hdc.getRange(PARAM.textoCerrado).getValue() };
    
    console.info('Formulario abierto');

    // Algunos valores necesarios para las siguientes comprobaciones
    const insMultiples = hdc.getRange(PARAM.insMultiples).getValue();
    const campos = hdc.getRange(PARAM.camposId.rango).getValues();
    const campoId = hdc.getRange(PARAM.campoId).getValue();
    const campoClave = hdc.getRange(PARAM.campoClave).getValue();
    const autenticar = hdc.getRange(PARAM.autenticar).getValue();

    // ColCampoId, colCampoClave serán -1 si el usuario no los ha escogido en la hoja CONFIGURACIÓN
    const colCampoId = PARAM.camposId.cols.findIndex(columna => campos[PARAM.camposId.campoCol][columna] == campoId);
    const colCampoClave = PARAM.camposId.cols.findIndex(columna => campos[PARAM.camposId.campoCol][columna] == campoClave);
    const numCampos = PARAM.camposId.cols.filter(col => campos[PARAM.camposId.etiquetaCol][col]).length;

    // Separa campos de identificación y de selección en vectores independientes. El vector de
    // valores de los campos del identificación se ordena para poder emparejar cada propiedad
    // del objeto "formulario" recibido con su campo correspondiente en la tabla de diseño de
    // campos en la tabla de CONFIGURACIÓN de la hdc. Esto es posible dado que cada campo del
    // formulario (su código HTML) se crea dinámicamente recorriendo la tabla de definición de
    // campos de izquierda a derecha al construir la webapp, por ello podemos usar el índice del
    // vector para relacionarlos. Ídem con los grupos / talleres. Sí, un poco feo 🤷‍♂️.
    // Ej:
    //   camposForm    = [ ['campo1', '111111'], ['campo2', '11111111'], ['campo3', 'pablo.felip@gedu.es'] ];
    //   talleresForm  = [ ['grupo1', 'IDT-02'], ['grupo2', 'IDT-15'], ['grupo3', 'IDT-28'] ];
    const formularioVector = Object.entries(formulario);
    const camposForm = formularioVector.filter(elemento => /campo\d+/.test(elemento[0])).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
    const talleresForm = formularioVector.filter(elemento => /grupo\d+/.test(elemento[0])).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);

    // [2] Realiza comprobación de identidad en tabla IDENTIFICACIÓN, según politica establecida
    if (autenticar
      && (colCampoId != -1
        && !esAutenticado(camposForm[colCampoId][1], colCampoClave != -1 ? camposForm[colCampoClave][1] : undefined))) {
      // Falla con estado "no autorizado"
      throw { estado: 'no autorizado', mensaje: hdc.getRange(PARAM.textoFalloAut).getValue() };
    }
    console.info(autenticar ? 'Autenticación superada' : 'No hacemos autenticación');

    // [3] ¿Existe elección previa? >> Rechaza o modifica, de acuerdo con política establecida
    let actualizarPrevias = false;
    let inscripcionesPrevias;
    if (colCampoId != -1 && insMultiples == 'Impedir') {

      // [3.1] Fallará con estado "repetido" si se encuentra selección previa y se ha escogido impedirlas
      console.info('Buscando inscripciones previas para impedirlas');
      inscripcionesPrevias = obtenerInsPrevias(
        camposForm[colCampoId][1],
        // Para impedir duplicados no se cotejará adicionalmente con un posible campo clave
        undefined,
        colCampoId + 1,
        // Para impedir duplicados no se cotejará adicionalmente con un posible campo clave
        undefined,
        numCampos + 1,
        numCampos + 2);

      if (inscripcionesPrevias.length > 0) throw { estado: 'repetido', mensaje: hdc.getRange(PARAM.textoMultiple).getValue() };

    } else if (colCampoId != -1 && insMultiples == 'Actualizar selección') {

      // [3.2] Tratamiento cuando se permite modificar una inscripción previa, la localizamos mediante el campo ID
      console.info('Buscando inscripciones previas para actualizaras posteriormente');
      inscripcionesPrevias = obtenerInsPrevias(
        camposForm[colCampoId][1],
        colCampoClave != -1 ? camposForm[colCampoClave][1] : undefined,
        colCampoId + 1,
        colCampoClave != -1 ? colCampoClave + 1 : undefined,
        numCampos + 1,
        numCampos + 2);

      // [3.2.1] Medida de seguridad adicional: Falla de nuevo con estado diferenciado si el campo clave
      // de la inscripción actual no coincide con el de alguna de las inscripciones previas detectadas
      if (inscripcionesPrevias.length > 0 && inscripcionesPrevias.some(inscripcion => !inscripcion.autorizado)) {
        throw { estado: 'fallo identidad modificar', mensaje: hdc.getRange(PARAM.textoMultipleNoAut).getValue() };
      }

      // [3.2.2] Se han hallado inscripciones previas, están permitidas y el campo clave de todas ellas, si lo hay, coincide con el actual
      if (inscripcionesPrevias.length > 0) actualizarPrevias = true;

    }

    console.info(actualizarPrevias ? 'Se actualizarán las inscripciones previas' : 'No hay inscripciones previas o no deseamos actualizarlas');

    // Comprueba disponibilidad de plazas y hace inscripción dentro de bloque en exclusión mutua
    // Fallaremos en xx ms con mensaje de error
    const semaforo = LockService.getScriptLock();
    semaforo.waitLock(hdc.getRange(PARAM.segMaxLock).getValue() * 1000);
    // Para pruebas de concurrencia:
    // semaforo.waitLock(3000);
    // Utilities.sleep(5000);

    // *************************************************************
    // Inicio del bloque de código que se ejecuta en exclusión mutua
    // *************************************************************

    const hojaInscripciones = hdc.getSheetByName(INSCRIPCIONES.hoja);
    const hojaTalleres = hdc.getSheetByName(TALLERES.hoja);
    let nuevasInscripciones = [];

    const [, ...inscripciones] = hojaInscripciones.getDataRange().getValues().slice(INSCRIPCIONES.filDatos - 2);
    const [, ...talleres] = hojaTalleres.getDataRange().getValues().slice(TALLERES.filDatos - 2);

    // VALIDACIÓN ADICIONAL: Comprueba que cada taller pertenece a su grupo para evitar petición manipuladas
    // Ej. talleresForm  = [ ['grupo1', 'IDT-02'], ['grupo2', 'IDT-15'], ['grupo3', 'IDT-28'] ];
    const grupos = Array.from(new Set(talleres.map(taller => taller[TALLERES.colGrupo])));
    if (talleresForm.some((tallerForm, indice) => {
      const filTaller = talleres.findIndex(taller => taller[TALLERES.colId] == tallerForm[1]);
      return filTaller == -1 || indice != grupos.indexOf(talleres[filTaller][TALLERES.colGrupo]);
    })) {
      // Fallamos con error si algún taller no existe o no pertenece al grupo solicitado
      console.error('El código o grupo de alguno de los elementos seleccionados no se corresponde con el de los ofertados');
      throw { estado: 'sospechoso', mensaje: 'Error interno o formulario manipulado.' };
    }
    
    // Reserva plazas de talleres solicitados y prepara matriz a anexar a tabla de INSCRIPCIONES
    const marcaTiempo = new Date();
    talleresForm.forEach(tallerSeleccionado => {

      // ¡El taller DEBE existir!
      const filTaller = talleres.findIndex(taller => taller[TALLERES.colId] == tallerSeleccionado[1]);

      // Es posible que otra petición concurrente haya reservado la última plaza de alguno de los talleres seleccionados
      const plazas = talleres[filTaller][TALLERES.colAforo] - talleres[filTaller][TALLERES.colOcupadas];
      if (plazas <= 0) {
        throw { estado: 'cambios', mensaje: hdc.getRange(PARAM.textoCambioPlazas).getValue() };
      }

      // Actualiza nº inscritos en matriz de talleres
      talleres[filTaller][TALLERES.colOcupadas]++;

      // Prepara matriz de nuevas inscripciones
      nuevasInscripciones.push([
        marcaTiempo,
        ...camposForm.map(campo => campo[1]),
        tallerSeleccionado[1],
        INSCRIPCIONES.estadoOk
      ]);

    });
    
    // Anexa matriz nuevas inscripciones en la parte inferior de la hoja de inscripciones
    hojaInscripciones
      .getRange(hojaInscripciones.getLastRow() + 1, 1, nuevasInscripciones.length, nuevasInscripciones[0].length)
      .setValues(nuevasInscripciones);

    // Actualiza inscripciones anuladas, en su caso, en la tabla de INSCRIPCIONES y recupera sus plazas ocupadas
    if (actualizarPrevias) {

      inscripcionesPrevias.forEach(inscripcion => { 
        inscripciones[inscripcion.fila][INSCRIPCIONES.colEstado] = INSCRIPCIONES.estadoKo;
        const filTaller = talleres.findIndex(taller => taller[TALLERES.colId] == inscripcion.taller);

        // Esto no debería ocurrir a menos que se modificara la tabla de talleres "en vivo", pero lo registraremos
        if (filTaller == -1) {
          console.error(`Código de taller ${inscripcion.taller} de inscripción a invalidar no encontrado.`);
          throw { estado: 'taller no existe', mensaje: 'Error interno: taller no encontrado.' };
        }
        else {
          console.info(talleres[filTaller][TALLERES.colOcupadas])
          // Esto tampoco debería ocurrir
          if (talleres[filTaller][TALLERES.colOcupadas] == 0) {
            console.error(`Ocupación en negativo en taller ${inscripcion.taller}, no se libera plaza.`);
          } else {
            talleres[filTaller][TALLERES.colOcupadas]--;
          }
        }
      });
      
      hojaInscripciones
        .getRange(INSCRIPCIONES.filDatos, INSCRIPCIONES.colEstado + 1, inscripciones.length, 1)
        .setValues(inscripciones.map(inscripcion => [inscripcion[INSCRIPCIONES.colEstado]]));

    }

    // Escribe ocupación en hoja de talleres, se hace por si hay que recuperar plazas
    hojaTalleres
      .getRange(TALLERES.filDatos, TALLERES.colOcupadas + 1, talleres.length, 1)  
      .setValues(talleres.map(taller => [taller[TALLERES.colOcupadas]]));

    // *************************************************************
    // Fin del bloque de código que se ejecuta en exclusión mutua
    // *************************************************************

    semaforo.releaseLock;

    // Enviar email, si opción activada!!!!
    if (hdc.getRange(PARAM.enviarEmail).getValue()) enviarEmail(camposForm, talleresForm);

    return { estado: 'ok', mensaje: hdc.getRange(PARAM.textoConfirmacion).getValue(), previas: actualizarPrevias };

  } catch (e) {
    console.error(e.estado ? e : e.message );
    // El exceso de concurrencia en la webapp será cazado por .withFailureHandler()
    return e.estado ? e : { estado: 'otros', mensaje: e.message };
  }

}