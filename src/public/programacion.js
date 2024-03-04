// Mapeo de bases y placas
const basesPlacas = {
    "NH TELEPORT": [
    "MYR681",
    "LZT992",
    "WEP303",
    "JTZ545",
    "WGZ810",
    "WMZ913",
    "WMZ358",
    "GUV190",
    "WMZ145",
    "WMZ359",
    "TFQ323",
    "WHQ453",
    "LCO380",
    "SPX517",
    "GET364",
    "LUM902",],
    "NH HACIENDA": [ "MYR681",
    "LZT992",
    "WEP303",
    "JTZ545",
    "WGZ810",
    "WMZ913",
    "WMZ358",
    "GUV190",
    "WMZ145",
    "WMZ359",
    "TFQ323",
    "WHQ453",
    "LCO380",
    "SPX517",
    "GET364",
    "LUM902",],
    "HYAAT": [  
        "GUZ800","JVK757", "JKV987","LSY924","GZZ534","ETT654","JTY497","TSP678","LJS684","WFH542","TLX856", "TTP460","GUU760","LWL706", "WGP651","TGV100","FRR364"

],
    "club el nogal": [
    "LLL748",
    "KYP065",
    "LZN965",
    "LZN273",
    "LUL430",],

    "HILTON 72": [
        "LUW724",
        "TAL491",
        "WMK368",
        "WLT649",
        "LUK855",
        "LQL173",
        "LSX557",
        "UFW432",
        "JTY926",
        "TAL491",
        "LZM557",
        "WMZ147",
        "LJU191",],


        "URBAN 93": ["WMZ354",],
        "WTC": [    "LUN435",
            "WMZ144",
            "KYS293",
            "WCW220",
            "WDC029",
            "LUW148",
            "JTS587",
            "SZU873",
            "TLO365",
            "LRN218",],


            "WILTON CORFERIAS": ["WNY587",
            "TTN605",
            "JTZ544",
            "WPP359",
            "LUW564",
            "WHQ792",
            "LLL737",
            "LRN456",
            "SXY097",
            "SXY097",
            "TTQ301",
            "JOX262",
            "TLM299",
            "LJS833",
            "WNU316",
            "NHR232"],

            "ANDINO": ["LZN590",
            "NHP457",
            "LJS783",
            "WNY015",
            "TTX898",
            "LFQ828",
            "LJU205",
            "LUN070",],

    // Otras bases y placas
};

function updatePlacas() {
    const baseSeleccionada = document.getElementById("base").value;
    const placasSelect = document.getElementById("placa");
    
    // Limpiar las opciones actuales del menú desplegable de placas
    placasSelect.innerHTML = '';

    // Obtener las placas de la base seleccionada y agregarlas al menú desplegable
    const placas = basesPlacas[baseSeleccionada];
    if (placas && placas.length > 0) {
        // Si hay placas asociadas a la base seleccionada, agregarlas al menú desplegable
        placas.forEach(placa => {
            const option = document.createElement("option");
            option.text = placa;
            option.value = placa;
            placasSelect.appendChild(option);
        });
    } else {
        // Si no hay placas asociadas a la base seleccionada, agregar una opción predeterminada
        const defaultOption = document.createElement("option");
        defaultOption.text = "No hay carros asociados a esta base";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        placasSelect.appendChild(defaultOption);
    }
}

const scriptURL = "https://script.google.com/macros/s/AKfycbziHx7tcGQOf59803938jQSub0mbSQECXOXALaZ9B6QlRbTle_Fg0fVFobQfZWEKN9ylw/exec";
const form = document.getElementById("registrationForm"); // Obtener el formulario por su ID

form.addEventListener("submit", e => {
    e.preventDefault(); // Prevenir la acción por defecto del formulario

    fetch(scriptURL, { 
        method: "POST", 
        body: new FormData(form) // Enviar los datos del formulario
    })
    .then(response => {
        if (response.ok) { // Verificar si la respuesta es exitosa
            alert("¡Felicidades! Tu carro ha sido programado.");
            window.location.reload(); // Recargar la página después de enviar los datos
        } else {
            throw new Error("Error al enviar el formulario."); // Lanzar un error si la respuesta no es exitosa
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo más tarde.");
    });
});
