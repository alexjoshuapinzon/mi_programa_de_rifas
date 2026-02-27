// Configuración
const SHEET_NAME = "Ventas";

// Función que se ejecuta cuando se hace una petición GET
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === "getVentas") {
      return getVentas();
    } else {
      return respondError("Acción no válida");
    }
  } catch (error) {
    return respondError(error.toString());
  }
}

// Función que se ejecuta cuando se hace una petición POST
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === "agregarVenta") {
      return agregarVenta(data.venta);
    } else if (action === "eliminarVenta") {
      return eliminarVenta(data.numero);
    } else if (action === "editarVenta") {
      return editarVenta(data.numero, data.venta);
    } else {
      return respondError("Acción POST no válida");
    }
  } catch (error) {
    return respondError(error.toString());
  }
}

// Inicializar la hoja si no tiene encabezados
function initSheet() {
  const sheet = getSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Numero", "Nombre", "Telefono", "Nota", "Fecha"]);
    // Dar formato a los encabezados
    const range = sheet.getRange("A1:E1");
    range.setFontWeight("bold");
    range.setBackground("#f3f3f3");
  }
}

// Obtener todas las ventas
function getVentas() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return respondSuccess([]);
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const ventas = data.map(row => ({
    numero: parseInt(row[0]),
    nombre: row[1],
    telefono: row[2].toString(),
    nota: row[3],
    fecha: row[4]
  })).filter(venta => !isNaN(venta.numero)); // Filtrar filas vacías o no válidas
  
  return respondSuccess(ventas);
}

// Agregar una nueva venta
function agregarVenta(venta) {
  const sheet = getSheet();
  
  // Verificar si ya existe el número
  const existingRow = findRowByNumero(sheet, venta.numero);
  if (existingRow > 0) {
    return respondError("Este número ya está vendido");
  }
  
  sheet.appendRow([
    venta.numero,
    venta.nombre || "",
    venta.telefono || "",
    venta.nota || "",
    venta.fecha || new Date().toISOString()
  ]);
  
  return respondSuccess({ message: "Venta registrada" });
}

// Eliminar una venta
function eliminarVenta(numero) {
  const sheet = getSheet();
  const row = findRowByNumero(sheet, numero);
  
  if (row > 0) {
    sheet.deleteRow(row);
    return respondSuccess({ message: "Venta eliminada" });
  } else {
    return respondError("Número no encontrado");
  }
}

// Editar una venta
function editarVenta(numero, nuevosDatos) {
  const sheet = getSheet();
  const row = findRowByNumero(sheet, numero);
  
  if (row > 0) {
    // Leemos los datos actuales por si hay campos que no se actualizan
    const currentData = sheet.getRange(row, 1, 1, 5).getValues()[0];
    
    // Si envían un campo nuevo lo usamos, si no mantenemos el actual
    const nombre = nuevosDatos.nombre !== undefined ? nuevosDatos.nombre : currentData[1];
    const telefono = nuevosDatos.telefono !== undefined ? nuevosDatos.telefono : currentData[2];
    const nota = nuevosDatos.nota !== undefined ? nuevosDatos.nota : currentData[3];
    const fecha = currentData[4]; // Mantenemos la fecha original
    
    sheet.getRange(row, 1, 1, 5).setValues([[numero, nombre, telefono, nota, fecha]]);
    
    return respondSuccess({ message: "Venta actualizada" });
  } else {
    return respondError("Número no encontrado para editar");
  }
}

// --- Funciones auxiliares ---

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initSheet();
  }
  return sheet;
}

function findRowByNumero(sheet, numero) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  
  const datos = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < datos.length; i++) {
    if (parseInt(datos[i][0]) === parseInt(numero)) {
      return i + 2; // +2 porque el array es 0-index y saltamos la fila 1 de encabezados
    }
  }
  return -1; // No encontrado
}

function respondSuccess(data) {
  return createJsonResponse({
    success: true,
    data: data
  });
}

function respondError(message) {
  return createJsonResponse({
    success: false,
    error: message
  });
}

function createJsonResponse(responseObject) {
  return ContentService
    .createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}
