/**
 * Parametrización mediante constantes
 *
 * @OnlyCurrentDoc
 */

const H_CONFIG = 'Configuración';
const PARAM = {
  checkActivar: H_CONFIG + '!A7',
  apertura: H_CONFIG + '!E7',
  cierre: H_CONFIG + '!G7',
  checkPeriodo: H_CONFIG + '!H7',
  textoEncabezado: H_CONFIG + '!B10',
  tamEncabezado: H_CONFIG + '!G10',
  colorTema: H_CONFIG + '!I10',
  urlImagen: H_CONFIG + '!B12',
  anchoImagen: H_CONFIG + '!I12',
  textoAbierto: H_CONFIG + '!B16',
  textoCerrado: H_CONFIG + '!B18',
  checkMantenimiento: H_CONFIG + '!H18',
  camposId: {
    rango: H_CONFIG + '!B20:H25',
    cols: [0, 2, 4, 6],
    campoCol: 0,
    etiquetaCol: 1,
    iconoCol: 2,
    ayudaCol: 3,
    expRegCol: 4,
    txtValCol: 5
  },
  btnEtiqueta: H_CONFIG + '!B28',
  btnIcono: H_CONFIG + '!D28',
  segMaxLock: H_CONFIG + '!F28',
  tabIcono: H_CONFIG + '!B31',
  nMaxCarNombre: H_CONFIG + '!D31',
  campoUrlFicha: H_CONFIG + '!F31',
  textoConfirmacion: H_CONFIG + '!B33',
  textoCambioPlazas: H_CONFIG + '!B35', 
  minTrasCierre: H_CONFIG + '!B38',
  insMultiples: H_CONFIG + '!D38',
  campoId: H_CONFIG + '!F38',
  campoClave: H_CONFIG + '!H38',
  autenticar: H_CONFIG + '!G39',
  textoMultiple: H_CONFIG + '!B41',
  textoFalloAut: H_CONFIG + '!F41',
  textoMultipleNoAut: H_CONFIG + '!B43',
  enviarEmail: H_CONFIG + '!B45',
  remitente: H_CONFIG + '!B47',
  asunto: H_CONFIG + '!E47',
  campoEmail: H_CONFIG + '!H47',
  textoEmail: H_CONFIG + '!B50'
};
const TALLERES = {
  hoja: 'Talleres',
  filDatos: 2,
  colGrupo: 0,
  colId: 1,
  colNombre: 2,
  colUrl: 3,
  colAforo: 4,
  colOcupadas: 5
};
const IDENTIFICACION = {
  hoja: 'Identificación',
  colId: 0,
  colClave: 1
};
const INSCRIPCIONES = {
  hoja: 'Inscripciones',
  filDatos: 2,
  colEstado: 5,
  estadoOk: 'Válida',
  estadoKo: 'Anulada'
};