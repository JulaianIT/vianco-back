document.addEventListener('DOMContentLoaded', () => {
    const busquedaInput = document.getElementById('busqueda-placa');
    const placaSelect = document.getElementById('placa');
    const opcionesPlacas = Array.from(placaSelect.querySelectorAll('option'));

    busquedaInput.addEventListener('input', () => {
        const busqueda = busquedaInput.value.trim().toLowerCase();

        // Vaciar la lista desplegable
        placaSelect.innerHTML = '';

        // Filtrar las opciones y volver a llenar la lista desplegable
        opcionesPlacas.forEach(opcion => {
            const placa = opcion.textContent.trim().toLowerCase();
            if (placa.includes(busqueda)) {
                placaSelect.appendChild(opcion.cloneNode(true));
            }
        });
    });

    const consultaForm = document.getElementById('consulta-form');

    consultaForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que el formulario se envíe por defecto

        const placaSeleccionada = placaSelect.value;
        const infoVehiculoDiv = document.getElementById('info-vehiculo');

        // Enviar la solicitud POST al servidor
        fetch('/consulta-vehiculos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ placa: placaSeleccionada })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al consultar el vehículo');
            }
            return response.json();
        })
        .then(vehiculo => {
            // Mostrar la información del vehículo como se muestra en tu código actual
        })
        .catch(error => {
            console.error('Error al consultar el vehículo:', error);
            infoVehiculoDiv.textContent = 'Error al consultar el vehículo';
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const consultaForm = document.getElementById('consulta-form');

    consultaForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que el formulario se envíe por defecto

        const placaSeleccionada = document.getElementById('placa').value;
        const infoVehiculoDiv = document.getElementById('info-vehiculo');

        // Enviar la solicitud POST al servidor
        fetch('/consulta-vehiculos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ placa: placaSeleccionada })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al consultar el vehículo');
            }
            return response.json();
        })
        
        .then(vehiculo => {
            // Mostrar la información del vehículo
            const fotoURL = vehiculo.fotoURL; // Suponiendo que recibes la URL base64 del servidor
        
            infoVehiculoDiv.innerHTML = `
            <div class="png">
            <header>
            <img id="membrete"   src="/imagenes/menbrete.png"/>
           <img  id="logo"      src="/imagenes/logo vianco.png"/>
           <img  id="vigilado"  src="/imagenes/vigilado.png"/>
           <hr>
           
          
    
   
   
   
   
       </header>
       <div class="conductor-info-container">
       <div class="conductor-image">
           <img class="image" src="${fotoURL}" alt="Foto del Conductor">
       </div>
       <div  id="infoo" class="conductor-infoe">
           <p><strong>PLACA:</strong> ${vehiculo.Placa}</p>
           <p><strong>BASE:</strong> ${vehiculo.Base}</p>
           <p><strong>CONDUCTOR:</strong> ${vehiculo.Conductor}</p>
       </div>
   </div>
   
   
           
       
            <h2>INFORMACION VEHICULO</h2>

            <div class="contenedor-columnas">
            <div class="columna">
                <p><strong>N° MOVIL:</strong> ${vehiculo.No_movil}</p>
                <p><strong>MATRICULA:</strong> ${vehiculo.Matricula}</p>
                <p><strong>MARCA:</strong> ${vehiculo.Marca}</p>
                <p><strong>LINEA:</strong> ${vehiculo.Linea}</p>
                <p><strong>MODELO:</strong> ${vehiculo.Modelo}</p>
                <p><strong>N° MOTOR:</strong> ${vehiculo.Numero_motor}</p>
                <p><strong>N° CHASIS:</strong> ${vehiculo.Numero_chasis}</p>
                <p><strong>CLASE:</strong> ${vehiculo.Clase_vehiculo}</p>
            </div>
            <div class="columna">
            <p><strong>N° DE PUESTOS:</strong> ${vehiculo.Num_puestos}</p>

                <p><strong>N° DE PUERTA:</strong> ${vehiculo.Puertas}</p>
                <p><strong>N° DE EJES:</strong> ${vehiculo.Num_ejes}</p>
                <p><strong>CILINDRAJE:</strong> ${vehiculo.Cilindraje}</p>
                <p><strong>COLOR:</strong> ${vehiculo.Color}</p>
                <p><strong>COMBUSTIBLE:</strong> ${vehiculo.Combustible}</p>
                <p><strong>CARROCERIA:</strong> ${vehiculo.Carroceria}</p>
                <p><strong>FECHA MATRICULA:</strong> ${vehiculo.Fecha_matricula}</p>
            </div>
        </div>
        <h2>DOCUMENTO REGLAMENTARIOS</h2>

        <div class="contenedor-columnas">
    <div class="columna">
        <p><strong>N°SOAT:</strong> ${vehiculo.Num_soat}</p>
        <p><strong>COMPANIA ASEGURADORA:</strong> ${vehiculo.Entidad}</p>
        <p><strong>FECHA VIGENCIA:</strong> ${vehiculo.Fecha_vigencia_soat}</p>
        <p><strong>N° TECNOMECANICA:</strong> ${vehiculo.Num_tecnomecanica}</p>
        <p><strong>CDA:</strong> ${vehiculo.Cda}</p>
        <p><strong>FECHA INICIO:</strong> ${vehiculo.Fecha_inicio_tecnomecanica}</p>
        <p><strong>FECHA VIGENCIA:</strong> ${vehiculo.Fecha_vigencia}</p>
        <p><strong>N° POLIZAS:</strong> ${vehiculo.Num_polizas_rcc_rce}</p>
        <p><strong>COMPAÑIA ASEGURADORA:</strong> ${vehiculo.Compania_aseguradora}</p>
        <p><strong>FECHA VIGENCIA:</strong> ${vehiculo.Vigencia_polizas}</p>
    </div>
    <div class="columna">
       
        <p><strong>N° TARJETA OPERACION:</strong> ${vehiculo.Num_tarjeta_operacion}</p>
        <p><strong>EMPRESA AFILIACION:</strong> ${vehiculo.Empresa_afiliacion}</p>
        <p><strong>FECHA VIGENCIA:</strong> ${vehiculo.Fecha_final_operacion}</p>
        <p><strong>N° PREVENTIVA:</strong> ${vehiculo.Num_preventiva_1}</p>
        <p><strong>CDA PREVENTIVA:</strong> ${vehiculo.Cda_preventiva}</p>
        <p><strong>FECHA INICIAL:</strong> ${vehiculo.Fecha_inicial_preventiva_1}</p>
        <p><strong>FECHA VIGENCIA:</strong> ${vehiculo.Fecha_final_preventiva_1}</p>
        <p><strong>N° DE CONVENIO:</strong> ${vehiculo.n_convenio}</p>
        <p><strong>FECHA DE VIGENCIA:</strong> ${vehiculo.fecha_vigencia_convenio}</p>
    </div>
</div>

           <hr>

           <h2>Informacion General</h2>


           <p><strong>PROPIETARIO CONTRATO:</strong> ${vehiculo.Propietario_contrato}</p>
           <p><strong>PROPIETARIO LICENCIA:</strong> ${vehiculo.Propietario_licencia}</p>
           <p><strong>AFILIADO A:</strong> ${vehiculo.Afiliado_a}</p>
         
           




           </div>

           <button id="editar-btn" class="btn editar-btn">Editar Información</button>

           <a href="/" class="volver-btn">Volver al Menú</a>


           `;
       
            
                // Obtener la placa del vehículo mostrada en la página de consulta
                const placaSeleccionada = vehiculo.Placa;

                // Ahora registramos el evento click en el botón de editar
                const editarBtn = document.getElementById('editar-btn');
                editarBtn.addEventListener('click', () => {
                    // Redirigir a la página de edición con la placa del vehículo como parámetro
                    window.location.href = `./edicion/${placaSeleccionada}`;
                });
            })
            .catch(error => {
                console.error('Error al consultar el vehículo:', error);
                infoVehiculoDiv.textContent = 'Error al consultar el vehículo';
            });
        });
        
    })
