// Importar los módulos necesarios
const express = require("express");
const session = require("express-session");
const mysql = require("mysql2");
const { engine } = require("express-handlebars");

// Importar el manejador de webhook
const webhookHandler = require("./webhook/webhookHandler");

// Importar las rutas de login
const loginRoutes = require("./routes/login");

// Crear una instancia de la aplicación Express
const app = express();

app.set("port", process.env.PORT || 3000);

app.set("views", __dirname + "/views");
app.engine(".hbs", engine({
    extname: ".hbs"
}));
app.set("view engine", "hbs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

const connection = mysql.createConnection({
    host: "69.61.31.131",
    user: "viancote_soporte",
    password: "MXPwPzz4zlU=",
    database: "viancote_nodelogin"
});

// Función para enviar un ping a la base de datos periódicamente
function sendPing() {
    connection.ping(err => {
        if (err) {
            console.error("Error al enviar ping a la base de datos:", err);
        } else {
            console.log("Ping enviado a la base de datos");
        }
    });
}

// Configura el intervalo para enviar el ping cada 5 minutos (300,000 milisegundos)
const pingInterval = setInterval(sendPing, 300000);

// Maneja los eventos de error y cierre de la conexión
connection.on('error', err => {
    console.error("Error en la conexión a la base de datos:", err);
    clearInterval(pingInterval); // Detiene el intervalo cuando se produce un error
});

connection.on('close', () => {
    console.log("Conexión a la base de datos cerrada");
    clearInterval(pingInterval); // Detiene el intervalo cuando se cierra la conexión
});

// Conecta con la base de datos
connection.connect(err => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err);
        return;
    }
    console.log("Conectado a la base de datos");

    // Envía el primer ping después de conectar
    sendPing();
});

app.use((req, res, next) => {
    req.db = connection;
    next();
});

app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));

// Configurar la ruta para el webhook y usar el manejador de webhook
app.post("/webhook", webhookHandler.handleWebhook);

// Rutas para el login
app.use("/login", loginRoutes);

// Ruta para la programación de vehículos
app.get("/programacion-vehiculos", (req, res) => {
    if (req.session.loggedin === true) {
        // Consulta SQL para obtener las bases y placas
        connection.query("SELECT base, placa FROM vehiculos", (error, results) => {
            if (error) {
                console.error("Error al obtener las bases y placas:", error);
                res.status(500).send("Error al obtener las bases y placas");
                return;
            }
            // Renderizar la vista de programación de vehículos con los datos de las bases y placas
            res.render("programacion/programacion", { basesPlacas: results });
        });
    } else {
        res.redirect("/login/index");
    }
});

// Ruta para la página principal
app.get("/", (req, res) => {
    if (req.session.loggedin === true) {
        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        
        const isAdmin = roles.includes('gerencia');
        const isExecutive = roles.includes('ejecutivo');
        const isOperative = roles.includes('operativo'); // Verificar si el usuario tiene el rol de 'operativo'

        res.render("home", { name: req.session.name, isAdmin, isExecutive, isOperative }); // Pasar los roles a la plantilla
    } else {
        res.redirect("/login/index");
    }
});


// Ruta para logout
app.get("/logout", (req, res) => {
    if (req.session.loggedin === true) {
        req.session.destroy();
    }
    res.redirect("/login/index");
});

// Ruta para administrar roles
app.get("/admin/roles", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        // Obtener los usuarios y sus roles desde la base de datos
        connection.query("SELECT id, email, name, roles FROM user", (error, results) => {
            if (error) {
                console.error("Error al obtener usuarios y roles:", error);
                res.status(500).send("Error al obtener usuarios y roles");
                return;
            }
            // Renderizar la vista de administración de roles con los datos de los usuarios
            res.render("admin/roles", { users: results });
        });
    } else {
        res.redirect("/"); // Redirigir a la página principal si el usuario no tiene permisos de administrador
    }
});


// Ruta para la página de ajustes de roles
app.get("/admin/roles", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        // Aquí puedes agregar la lógica para mostrar la página de ajustes de roles
        res.render("admin/roles"); // Esto renderiza una vista llamada "roles.hbs", por ejemplo
    } else {
        res.redirect("/"); // Redirigir a la página principal si el usuario no tiene permisos de administrador
    }
});

// Ruta para mostrar el formulario de edición de roles
app.get("/admin/roles/:id/edit", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        const userId = req.params.id;
        // Obtener información del usuario y sus roles desde la base de datos
        connection.query("SELECT id, email, name, roles FROM user WHERE id = ?", [userId], (error, results) => {
            if (error) {
                console.error("Error al obtener información del usuario:", error);
                res.status(500).send("Error al obtener información del usuario");
                return;
            }
            // Renderizar el formulario de edición de roles con los datos del usuario
            res.render("admin/editRole", { user: results[0] });
        });
    } else {
        res.redirect("/"); // Redirigir a la página principal si el usuario no tiene permisos de administrador
    }
});
// Ruta para procesar la edición de roles
app.post("/admin/editRole/:id/edit", (req, res) => {
    // Verificar si el usuario tiene permisos de administrador
    if (req.session.loggedin && req.session.roles.includes('gerencia')) {
        const userId = req.params.id;
        const newRole = req.body.newRole; // Obtener el nuevo rol del cuerpo de la solicitud
        
        // Actualizar el rol del usuario en la base de datos
        connection.query("UPDATE user SET roles = ? WHERE id = ?", [newRole, userId], (error, results) => {
            if (error) {
                console.error("Error al actualizar el rol del usuario:", error);
                res.status(500).send("Error al actualizar el rol del usuario");
                return;
            }
            // Redirigir a la página de administración de roles después de la actualización
            res.redirect("/admin/roles");
        });
    } else {
        res.redirect("/"); // Redirigir a la página principal si el usuario no tiene permisos de administrador
    }
});
// Ruta para obtener la lista de bases
app.get('/api/bases', (req, res) => {
    connection.query('SELECT DISTINCT base FROM vehiculos', (error, results) => {
        if (error) {
            console.error('Error al obtener las bases:', error);
            res.status(500).json({ error: 'Error al obtener las bases' });
            return;
        }
        const bases = results.map(result => result.base);
        res.json(bases);
    });
});

// Ruta para obtener la lista de placas según la base seleccionada
app.get('/api/placas', (req, res) => {
    const baseSeleccionada = req.query.base;
    connection.query('SELECT placa FROM vehiculos WHERE base = ?', [baseSeleccionada], (error, results) => {
        if (error) {
            console.error('Error al obtener las placas:', error);
            res.status(500).json({ error: 'Error al obtener las placas' });
            return;
        }
        const placas = results.map(result => result.placa);
        res.json(placas);
    });
});
// Ruta para manejar la programación de vehículos
app.post("/programacion-vehiculos", (req, res) => {
    // Aquí puedes agregar la lógica para manejar los datos enviados desde el formulario
    // Por ejemplo, puedes obtener los datos del cuerpo de la solicitud (req.body) y realizar la programación de vehículos en la base de datos
    
    // Después de manejar los datos, puedes redirigir a una página de éxito o renderizar una vista que indique que la programación fue exitosa
});


// Definir las rutas
app.get("/consulta-vehiculos", (req, res) => {
    // Consulta SQL para obtener las placas disponibles
    connection.query("SELECT placa FROM vehiculos", (error, results) => {
        if (error) {
            console.error("Error al obtener las placas:", error);
            res.status(500).send("Error al obtener las placas");
            return;
        }
        // Renderizar la vista de consulta de vehículos con los datos de las placas
        res.render("consulta", { placas: results.map(result => result.placa) });
    });
});

app.post("/consulta-vehiculos", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información del vehículo correspondiente a la placa seleccionada
    connection.query("SELECT * FROM vehiculos WHERE placa = ?", [placaSeleccionada], (error, results) => {
        if (error) {
            console.error("Error al obtener la información del vehículo:", error);
            res.status(500).send("Error al obtener la información del vehículo");
            return;
        }
        if (results.length === 0) {
            // Si no se encuentra ningún vehículo con la placa seleccionada, enviar un mensaje de error
            res.status(404).send("Vehículo no encontrado");
            return;
        }
        const vehiculo = results[0]; // Obtener el primer vehículo encontrado (debería haber solo uno)
        // Enviar la información del vehículo al cliente en formato JSON
        res.json(vehiculo);
    });
});

// Ruta para la página de edición en el servidor
app.get('/edicion/:placa', (req, res) => {
    const placa = req.params.placa;
    
    // Realizar una consulta a la base de datos para obtener los datos del vehículo
    connection.query('SELECT * FROM vehiculos WHERE placa = ?', placa, (error, results) => {
        if (error) {
            console.error("Error al obtener los datos del vehículo:", error);
            res.status(500).send("Error al obtener los datos del vehículo");
            return;
        }

        if (results.length === 0) {
            console.error("No se encontró ningún vehículo con la placa proporcionada:", placa);
            res.status(404).send("No se encontró ningún vehículo con la placa proporcionada");
            return;
        }

        // Renderizar la vista de edición con los datos del vehículo
        res.render('edicion', { vehiculo: results[0] }); // Pasar los datos del vehículo a la vista
    });
});


app.post('/guardar-edicion', (req, res) => {
    console.log('Datos recibidos en la solicitud:', req.body);
    const placa = req.body.placa;
    const base = req.body.base;
    const conductor = req.body.conductor;
    const noMovil = req.body.noMovil;
    // Variables para los campos adicionales del formulario
    const matricula = req.body.Matricula;
    const marca = req.body.Marca;
    const linea = req.body.Linea;
    const claseVehiculo = req.body.Clase;
    const modelo = req.body.Modelo;
    const capacidad = req.body.Capacidad;
    const propietarioContrato = req.body.PropietarioContrato;
    const propietarioLicencia = req.body.PropietarioLicencia;
    const afiliadoA = req.body.AfiliadoA;
    const numPuestos = req.body.NumeroPuestos;
    const puertas = req.body.Puertas;
    const pesoBruto = req.body.PesoBruto;
    const numEjes = req.body.NumeroEjes;
    const numChasis = req.body.NumeroChasis;
    const numMotor = req.body.NumeroMotor;
    const color = req.body.Color;
    const cilindraje = req.body.Cilindraje;
    const combustible = req.body.Combustible;
    const carroceria = req.body.Carroceria;
    const fechaMatricula = req.body.FechaMatricula;
    const numSoat = req.body.NumeroSoat;
    const entidad = req.body.Entidad;
    const fechaVigenciaSoat = req.body.VigenciaSoat;
    const numTecnomecanica = req.body.NumeroTecnomecanica;
    const cda = req.body.Cda;
    const fechaInicioTecnomecanica = req.body.FechaInicioTecnomecanica;
    const fechaVigencia = req.body.FechaVigencia;
    const numPolizasRccRce = req.body.NumeroPolizas;
    const companiaAseguradora = req.body.CompaniaAseguradora;
    const vigenciaPolizas = req.body.VigenciaPolizas;
    const numTarjetaOperacion = req.body.NumeroTarjetaOperacion;
    const empresaAfiliacion = req.body.EmpresaAfiliacion;
    const fechaFinalOperacion = req.body.FechaFinalOperacion;
    const numPreventiva1 = req.body.NumeroPreventiva1;
    const cdaPreventiva = req.body.CdaPreventiva;
    const fechaInicialPreventiva1 = req.body.FechaInicialPreventiva1;
    const fechaFinalPreventiva1 = req.body.FechaFinalPreventiva1;

    console.log('Datos enviados:', placa, base, conductor, noMovil);

    connection.query(
        'UPDATE vehiculos SET base = ?, conductor = ?, no_movil = ?, Matricula = ?, Marca = ?, Linea = ?, Clase_vehiculo = ?, Modelo = ?, Capacidad = ?, Propietario_contrato = ?, Propietario_licencia = ?, Afiliado_a = ?, Num_puestos = ?, Puertas = ?, Peso_bruto = ?, Num_ejes = ?, Numero_chasis = ?, Numero_motor = ?, Color = ?, Cilindraje = ?, Combustible = ?, Carroceria = ?, Fecha_matricula = ?, Num_soat = ?, Entidad = ?, Fecha_vigencia_soat = ?, Num_tecnomecanica = ?, Cda = ?, Fecha_inicio_tecnomecanica = ?, Fecha_vigencia = ?, Num_polizas_rcc_rce = ?, Compania_aseguradora = ?, Vigencia_polizas = ?, Num_tarjeta_operacion = ?, Empresa_afiliacion = ?, Fecha_final_operacion = ?, Num_preventiva_1 = ?, Cda_preventiva = ?, Fecha_inicial_preventiva_1 = ?, Fecha_final_preventiva_1 = ? WHERE placa = ?',
        [
            base,
            conductor,
            noMovil,
            matricula,
            marca,
            linea,
            claseVehiculo,
            modelo,
            capacidad,
            propietarioContrato,
            propietarioLicencia,
            afiliadoA,
            numPuestos,
            puertas,
            pesoBruto,
            numEjes,
            numChasis,
            numMotor,
            color,
            cilindraje,
            combustible,
            carroceria,
            fechaMatricula,
            numSoat,
            entidad,
            fechaVigenciaSoat,
            numTecnomecanica,
            cda,
            fechaInicioTecnomecanica,
            fechaVigencia,
            numPolizasRccRce,
            companiaAseguradora,
            vigenciaPolizas,
            numTarjetaOperacion,
            empresaAfiliacion,
            fechaFinalOperacion,
            numPreventiva1,
            cdaPreventiva,
            fechaInicialPreventiva1,
            fechaFinalPreventiva1,
            placa
        ],
        (error, results) => {
            if (error) {
                console.error("Error al guardar los cambios:", error);
                res.status(500).send("Error al guardar los cambios");
                return;
            }
            if (results.affectedRows === 0) {
                console.error("No se encontró ningún vehículo con la placa proporcionada:", placa);
                res.status(404).send("No se encontró ningún vehículo con la placa proporcionada");
                return;
            }
            console.log("Cambios guardados correctamente en la base de datos");
            // Redirigir al usuario de vuelta a la página de consulta de vehículos
            res.redirect(`/consulta-vehiculos?placa=${placa}`);
        }
    );
});
// Ruta para renderizar la página del formulario de agregación de vehículos
app.get("/agregar-vehiculo", (req, res) => {
    res.render("formulario_agregar");
});


// Ruta para manejar los datos enviados desde el formulario y agregar un nuevo vehículo a la base de datos
app.post("/agregar-vehiculo", (req, res) => {
    // Obtener todos los campos del formulario
    const formData = req.body;

    // Construir las cláusulas SET y los valores para la consulta SQL
    let setClause = '';
    let values = [];

    // Iterar sobre los campos del formulario
    Object.keys(formData).forEach((key, index) => {
        // Si el valor del campo no está vacío
        if (formData[key]) {
            // Agregar el nombre del campo y el signo de interrogación al conjunto
            setClause += `${key} = ?, `;
            // Agregar el valor del campo al array de valores
            values.push(formData[key]);
        }
    });

    // Quitar la coma final de la cláusula SET
    setClause = setClause.slice(0, -2);

    // Insertar los datos en la base de datos
    connection.query(
        `INSERT INTO vehiculos SET ${setClause}`,
        values,
        (error, results) => {
            if (error) {
                console.error("Error al agregar el vehículo:", error);
                res.status(500).send("Error al agregar el vehículo");
                return;
            }
            console.log("Vehículo agregado correctamente a la base de datos");
            // Redirigir al usuario de vuelta a la página de consulta de vehículos
            res.redirect(`/consulta-vehiculos`);
        }
    );
});


// Vista del formulario de agregación de vehículos (formulario_agregar.ejs)
// Asegúrate de tener campos para todos los datos que deseas recopilar para un nuevo vehículo
// y un botón de envío para enviar el formulario al servidor.













// Ruta para la página de consulta de conductores
app.get("/consulta-conductores", (req, res) => {
    // Consulta SQL para obtener las placas disponibles
    connection.query("SELECT placa FROM conductores", (error, results) => {
        if (error) {
            console.error("Error al obtener las placas:", error);
            res.status(500).send("Error al obtener las placas");
            return;
        }
        // Renderizar la vista de consulta de conductores con los datos de las placas
        res.render("conductores", { placas: results.map(result => result.placa) }); // Utiliza la plantilla "conductores"
    });
});

app.post("/consulta-conductores", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información del conductor correspondiente a la placa seleccionada
    connection.query("SELECT * FROM conductores WHERE placa = ?", [placaSeleccionada], (error, results) => {
        if (error) {
            console.error("Error al obtener la información del conductor:", error);
            res.status(500).send("Error al obtener la información del conductor");
            return;
        }
        if (results.length === 0) {
            // Si no se encuentra ningún conductor con la placa seleccionada, enviar un mensaje de error
            res.status(404).send("Conductor no encontrado");
            return;
        }
        const conductor = results[0]; // Obtener el primer conductor encontrado (debería haber solo uno)
        // Enviar la información del conductor al cliente en formato JSON
        res.json(conductor);
    });
});

// Ruta para la página de edición del conductor en el servidor
app.get('/edicionC/:placa', (req, res) => {
    const placa = req.params.placa;
    
    // Realizar una consulta a la base de datos para obtener los datos del conductor
    connection.query('SELECT * FROM conductores WHERE placa = ?', placa, (error, results) => {
        if (error) {
            console.error("Error al obtener los datos del conductor:", error);
            res.status(500).send("Error al obtener los datos del conductor");
            return;
        }

        if (results.length === 0) {
            console.error("No se encontró ningún conductor con la placa proporcionada:", placa);
            res.status(404).send("No se encontró ningún conductor con la placa proporcionada");
            return;
        }

        // Renderizar la vista de edición con los datos del conductor
        res.render('edicionC', { conductor: results[0] }); // Pasar los datos del conductor a la vista
    });
});

// Manejador de la solicitud POST para guardar la edición del conductor en el servidor
app.post('/guardar-edicionC', (req, res) => {
    const placa = req.body.placa;
    // Obtener los demás datos del conductor desde el cuerpo de la solicitud
    const { conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre, contacto_emergencia, celular_emergencia } = req.body;

    // Realizar la actualización en la base de datos con los datos recibidos
    connection.query('UPDATE conductores SET conductor = ?, tipo_documento = ?, cedula = ?, fecha_expedicion = ?, fecha_nacimiento = ?, celular = ?, email = ?, direccion = ?, arl = ?, eps = ?, seguridad_social = ?, fecha_vencimiento_examen = ?, categoria = ?, fecha_vigencia = ?, tipo_sangre = ?, contacto_emergencia = ?, celular_emergencia = ? WHERE placa = ?', [conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre, contacto_emergencia, celular_emergencia, placa], (error, results) => {
        if (error) {
            console.error("Error al guardar los cambios:", error);
            res.status(500).send("Error al guardar los cambios");
            return;
        }
        if (results.affectedRows === 0) {
            console.error("No se encontró ningún conductor con la placa proporcionada:", placa);
            res.status(404).send("No se encontró ningún conductor con la placa proporcionada");
            return;
        }
        console.log("Cambios guardados correctamente en la base de datos");
        // Redirigir al usuario de vuelta a la página de consulta del conductor
        res.redirect(`/consulta-conductores?placa=${placa}`);
    });
});

// Ruta para manejar los datos enviados desde el formulario y agregar un nuevo conductor a la base de datos
// Ruta para renderizar la página del formulario de agregar conductor
app.get("/agregar-conductor", (req, res) => {
    // Renderiza el formulario para agregar un nuevo conductor
    res.render("formulario_agregar_conductor");
});


// Ruta para manejar los datos enviados desde el formulario y agregar un nuevo conductor a la base de datos
app.post("/agregar-conductor", (req, res) => {
    // Obtener todos los campos del formulario
    const formData = req.body;

    // Insertar los datos en la base de datos
    connection.query(
        `INSERT INTO conductores (placa, conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre, contacto_emergencia, celular_emergencia) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            formData.placa,
            formData.conductor,
            formData.tipo_documento,
            formData.cedula,
            formData.fecha_expedicion,
            formData.fecha_nacimiento,
            formData.celular,
            formData.email,
            formData.direccion,
            formData.arl,
            formData.eps,
            formData.seguridad_social,
            formData.fecha_vencimiento_examen,
            formData.categoria,
            formData.fecha_vigencia,
            formData.tipo_sangre,
            formData.contacto_emergencia,
            formData.celular_emergencia
        ],
        (error, results) => {
            if (error) {
                console.error("Error al agregar el conductor:", error);
                res.status(500).send("Error al agregar el conductor");
                return;
            }
            console.log("Conductor agregado correctamente a la base de datos");
            // Redirigir al usuario de vuelta a la página de consulta de conductores
            res.redirect(`/consulta-conductores`);
        }
    );
});


// Iniciar el servidor
app.listen(app.get("port"), () => {
    console.log("Listening on port ", app.get("port"));
});
