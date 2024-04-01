// Importar los módulos necesarios
const express = require("express");
const session = require("express-session");
const mysql = require("mysql2");
const { engine } = require("express-handlebars");
const multer = require('multer');
const upload = multer();
const bodyParser = require('body-parser');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const html2canvas = require('html2canvas');
const nodemailer = require('nodemailer');


function htmlToPdf(html, options, callback) {
    pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
            callback(err);
        } else {
            callback(null, buffer);
        }
    });
}



// Importar el manejador de webhook
const webhookHandler = require("./webhook/webhookHandler");

// Importar las rutas de login
const loginRoutes = require("./routes/login");

// Crear una instancia de la aplicación Express
const app = express();

app.set("port", process.env.PORT || 3000);

// Configuración de Handlebars
app.set("views", __dirname + "/views");
app.engine(".hbs", engine({
    extname: ".hbs"
}));
app.set("view engine", "hbs");
app.use(express.static(__dirname + '/public'));


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
// Ruta para la programación de vehículos
app.get("/programacion-vehiculos", (req, res) => {
    if (req.session.loggedin === true) {
        const rolesString = req.session.roles;
        const roles = Array.isArray(rolesString) ? rolesString : [];
        
        const ejecutivo1 = roles.includes('ejecutivo1');
        const ejecutivo2 = roles.includes('ejecutivo2');
        const ejecutivo3 = roles.includes('ejecutivo3');
        const ejecutivo4 = roles.includes('ejecutivo4');
        const ejecutivo5 = roles.includes('ejecutivo5');
        const ejecutivo6 = roles.includes('ejecutivo6');
        const ejecutivo7 = roles.includes('ejecutivo7');
        const ejecutivo8 = roles.includes('ejecutivo8');
        
        const isExecutive = roles.includes('ejecutivo');
        
        // Consulta SQL para obtener las bases y placas
        connection.query("SELECT base, placa FROM vehiculos", (error, results) => {
            if (error) {
                console.error("Error al obtener las bases y placas:", error);
                res.status(500).send("Error al obtener las bases y placas");
                return;
            }
            // Renderizar la vista de programación de vehículos con los datos de las bases y placas
            res.render("programacion/programacion", { 
                basesPlacas: results,
                name: req.session.name, 
                isExecutive, 
                ejecutivo1, 
                ejecutivo2, 
                ejecutivo3,
                ejecutivo4,
                ejecutivo5,
                ejecutivo6,
                ejecutivo7,
                ejecutivo8,
                // Otros roles ejecutivos...
            });
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
        
//EJECUTIVOS

const ejecutivo1 = roles.includes('ejecutivo1');
const ejecutivo2 = roles.includes('ejecutivo2');
const ejecutivo3 = roles.includes('ejecutivo3');
const ejecutivo4 = roles.includes('ejecutivo4');
const ejecutivo5 = roles.includes('ejecutivo5');
const ejecutivo6 = roles.includes('ejecutivo6');
const ejecutivo7 = roles.includes('ejecutivo7');
const ejecutivo8 = roles.includes('ejecutivo8');








        const isControl = roles.includes('seguimiento');
        const isAdmin = roles.includes('gerencia');
        const isExecutive = roles.includes('ejecutivo');
        const isOperative = roles.includes('operativo'); // Verificar si el usuario tiene el rol de 'operativo'

        res.render("home",{ name: req.session.name, isAdmin, isExecutive, isOperative,isControl,ejecutivo1,ejecutivo2,ejecutivo3,ejecutivo4,ejecutivo5,ejecutivo6,ejecutivo7,ejecutivo8 }); // Pasar los roles a la plantilla
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
      
        
           // Convertir los datos binarios de la imagen en una URL base64
         
           const fotoURL = vehiculo.foto_vehiculo ? `data:image/jpeg;base64,${vehiculo.foto_vehiculo.toString('base64')}` : null;
           res.json({ ...vehiculo, fotoURL });
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

app.post('/guardar-edicion', upload.single('foto_vehiculo'), (req, res) => {
    let fotoData = null; // Inicializar la variable para los datos de la foto

    // Verificar si se subió una nueva foto
    if (req.file) {
        fotoData = req.file.buffer; // Establecer los datos binarios de la nueva foto
    }

    // Obtener otros datos del vehículo desde el cuerpo de la solicitud
    const { placa, Base, Conductor, No_movil, Matricula, Marca, Linea, Clase_vehiculo, Modelo, Capacidad, Propietario_contrato, Propietario_licencia, Afiliado_a, Num_puestos, Puertas, Peso_bruto, Num_ejes, Numero_chasis, Numero_motor, Color, Cilindraje, Combustible, Carroceria, Fecha_matricula, Num_soat, Entidad, Fecha_vigencia_soat, Num_tecnomecanica, Cda, Fecha_inicio_tecnomecanica, Fecha_vigencia, Num_polizas_rcc_rce, Compania_aseguradora, Vigencia_polizas, Num_tarjeta_operacion, Empresa_afiliacion, Fecha_final_operacion, Num_preventiva_1, Cda_preventiva, Fecha_inicial_preventiva_1, Fecha_final_preventiva_1 } = req.body;

    // Construir la consulta SQL para la actualización
    let sqlQuery;
    let queryParams;

    if (fotoData) {
        // Si se ha cargado una nueva foto, incluir el campo de foto en la actualización
        sqlQuery = 'UPDATE vehiculos SET Base=?, Conductor=?, No_movil=?, Matricula=?, Marca=?, Linea=?, Clase_vehiculo=?, Modelo=?, Capacidad=?, Propietario_contrato=?, Propietario_licencia=?, Afiliado_a=?, Num_puestos=?, Puertas=?, Peso_bruto=?, Num_ejes=?, Numero_chasis=?, Numero_motor=?, Color=?, Cilindraje=?, Combustible=?, Carroceria=?, Fecha_matricula=?, Num_soat=?, Entidad=?, Fecha_vigencia_soat=?, Num_tecnomecanica=?, Cda=?, Fecha_inicio_tecnomecanica=?, Fecha_vigencia=?, Num_polizas_rcc_rce=?, Compania_aseguradora=?, Vigencia_polizas=?, Num_tarjeta_operacion=?, Empresa_afiliacion=?, Fecha_final_operacion=?, Num_preventiva_1=?, Cda_preventiva=?, Fecha_inicial_preventiva_1=?, Fecha_final_preventiva_1=?, foto_vehiculo=? WHERE Placa=?';
        queryParams = [Base, Conductor, No_movil, Matricula, Marca, Linea, Clase_vehiculo, Modelo, Capacidad, Propietario_contrato, Propietario_licencia, Afiliado_a, Num_puestos, Puertas, Peso_bruto, Num_ejes, Numero_chasis, Numero_motor, Color, Cilindraje, Combustible, Carroceria, Fecha_matricula, Num_soat, Entidad, Fecha_vigencia_soat, Num_tecnomecanica, Cda, Fecha_inicio_tecnomecanica, Fecha_vigencia, Num_polizas_rcc_rce, Compania_aseguradora, Vigencia_polizas, Num_tarjeta_operacion, Empresa_afiliacion, Fecha_final_operacion, Num_preventiva_1, Cda_preventiva, Fecha_inicial_preventiva_1, Fecha_final_preventiva_1, fotoData, placa];
    } else {
        // Si no se ha cargado una nueva foto, omitir el campo de foto en la actualización
        sqlQuery = 'UPDATE vehiculos SET Base=?, Conductor=?, No_movil=?, Matricula=?, Marca=?, Linea=?, Clase_vehiculo=?, Modelo=?, Capacidad=?, Propietario_contrato=?, Propietario_licencia=?, Afiliado_a=?, Num_puestos=?, Puertas=?, Peso_bruto=?, Num_ejes=?, Numero_chasis=?, Numero_motor=?, Color=?, Cilindraje=?, Combustible=?, Carroceria=?, Fecha_matricula=?, Num_soat=?, Entidad=?, Fecha_vigencia_soat=?, Num_tecnomecanica=?, Cda=?, Fecha_inicio_tecnomecanica=?, Fecha_vigencia=?, Num_polizas_rcc_rce=?, Compania_aseguradora=?, Vigencia_polizas=?, Num_tarjeta_operacion=?, Empresa_afiliacion=?, Fecha_final_operacion=?, Num_preventiva_1=?, Cda_preventiva=?, Fecha_inicial_preventiva_1=?, Fecha_final_preventiva_1=? WHERE Placa=?';
        queryParams = [Base, Conductor, No_movil, Matricula, Marca, Linea, Clase_vehiculo, Modelo, Capacidad, Propietario_contrato, Propietario_licencia, Afiliado_a, Num_puestos, Puertas, Peso_bruto, Num_ejes, Numero_chasis, Numero_motor, Color, Cilindraje, Combustible, Carroceria, Fecha_matricula, Num_soat, Entidad, Fecha_vigencia_soat, Num_tecnomecanica, Cda, Fecha_inicio_tecnomecanica, Fecha_vigencia, Num_polizas_rcc_rce, Compania_aseguradora, Vigencia_polizas, Num_tarjeta_operacion, Empresa_afiliacion, Fecha_final_operacion, Num_preventiva_1, Cda_preventiva, Fecha_inicial_preventiva_1, Fecha_final_preventiva_1, placa];
    }

    // Realizar la actualización en la base de datos con los datos recibidos
    connection.query(sqlQuery, queryParams, (error, results) => {
        if (error) {
            console.error('Error al guardar los cambios:', error);
            res.status(500).send('Error al guardar los cambios');
            return;
        }
        if (results.affectedRows === 0) {
            console.error('No se encontró ningún vehículo con la placa proporcionada:', placa);
            res.status(404).send('No se encontró ningún vehículo con la placa proporcionada');
            return;
        }
        console.log('Cambios guardados correctamente en la base de datos');
        // Redirigir al usuario de vuelta a la página de consulta de vehículos
        res.redirect(`/consulta-vehiculos?placa=${placa}`);
    });
});



// Ruta para mostrar el formulario de agregar vehículo
app.get("/agregar-vehiculo", (req, res) => {
    res.render('formulario_agregar'); // Renderizar la vista del formulario de agregar
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






app.use(express.static('public'));
// Ruta para la página de consulta de conductores
app.get('/consulta-conductores', (req, res) => {
    // Consulta SQL para obtener las placas disponibles
    connection.query('SELECT placa FROM conductores', (error, results) => {
      if (error) {
        console.error('Error al obtener las placas:', error);
        res.status(500).send('Error al obtener las placas');
        return;
      }
      // Renderizar la vista de consulta de conductores con los datos de las placas
      res.render('conductores', { placas: results.map((result) => result.placa) }); // Utiliza la plantilla "conductores"
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
      
        const fotoURL = conductor.foto ? `data:image/jpeg;base64,${conductor.foto.toString('base64')}` : null;
        res.json({ ...conductor, fotoURL });
    });
});



// Manejador de ruta para procesar el formulario y agregar un nuevo conductor a la base de datos
app.post('/agregar-conductor', upload.single('foto'), (req, res) => {
  // Verificar si se subió una foto
  if (!req.file) {
    // Si no se subió ninguna foto, manejar el error aquí
    return res.status(400).send('No se seleccionó ninguna foto.');
  }

  // Aquí puedes acceder al archivo subido a través de req.file
  const fotoPath = req.file.path;

  // Obtener todos los campos del formulario incluida la información de la foto
  const formData = { ...req.body, foto: fotoPath };

  // Insertar los datos en la base de datos
  connection.query(
    `INSERT INTO conductores (placa, conductor, tipo_documento, cedula, fecha_nacimiento, fecha_expedicion, tipo_sangre, direccion, celular, email, categoria, fecha_vigencia, arl, eps, seguridad_social, fecha_vencimiento_examen, contacto_emergencia, celular_emergencia, foto) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      formData.placa,
      formData.conductor,
      formData.tipo_documento,
      formData.cedula,
      formData.fecha_nacimiento,
      formData.fecha_expedicion,
      formData.tipo_sangre,
      formData.direccion,
      formData.celular,
      formData.email,
      formData.categoria,
      formData.fecha_vigencia,
      formData.arl,
      formData.eps,
      formData.seguridad_social,
      formData.fecha_vencimiento_examen,
      formData.contacto_emergencia,
      formData.celular_emergencia,
      formData.foto
    ],
    (error, results) => {
      if (error) {
        console.error('Error al agregar el conductor:', error);
        res.status(500).send('Error al agregar el conductor');
        return;
      }
      console.log('Conductor agregado correctamente a la base de datos');
      // Redirigir al usuario de vuelta a la página de consulta de conductores
      res.redirect(`/consulta-conductores`);
    }
  );
});



// Ruta para mostrar la página de edición de conductor
app.get('/edicionC/:placa', (req, res) => {
  const placa = req.params.placa;
  // Realizar una consulta a la base de datos para obtener los datos del conductor
  connection.query('SELECT * FROM conductores WHERE placa = ?', placa, (error, results) => {
    if (error) {
      console.error('Error al obtener los datos del conductor:', error);
      res.status(500).send('Error al obtener los datos del conductor');
      return;
    }
    if (results.length === 0) {
      console.error('No se encontró ningún conductor con la placa proporcionada:', placa);
      res.status(404).send('No se encontró ningún conductor con la placa proporcionada');
      return;
    }
    // Renderizar la vista de edición con los datos del conductor
    res.render('edicionC', { conductor: results[0] }); // Pasar los datos del conductor a la vista
  });
});



// Manejador de la solicitud POST para guardar la edición del conductor en el servidor
app.post('/guardar-edicionC', upload.single('foto'), (req, res) => {
    let fotoData = null; // Inicializar la variable para los datos de la foto

    // Verificar si se subió una nueva foto
    if (req.file) {
        fotoData = req.file.buffer; // Establecer los datos binarios de la nueva foto
    }

    // Obtener otros datos del conductor desde el cuerpo de la solicitud
    const { placa, conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre, contacto_emergencia, celular_emergencia } = req.body;

    // Construir la consulta SQL para la actualización
    let sqlQuery;
    let queryParams;

    if (fotoData) {
        // Si se ha cargado una nueva foto, actualizar también el campo de foto
        sqlQuery = 'UPDATE conductores SET conductor = ?, tipo_documento = ?, cedula = ?, fecha_expedicion = ?, fecha_nacimiento = ?, celular = ?, email = ?, direccion = ?, arl = ?, eps = ?, seguridad_social = ?, fecha_vencimiento_examen = ?, categoria = ?, fecha_vigencia = ?, tipo_sangre = ?, contacto_emergencia = ?, celular_emergencia = ?, foto = ? WHERE placa = ?';
        queryParams = [conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre, contacto_emergencia, celular_emergencia, fotoData, placa];
    } else {
        // Si no se ha cargado una nueva foto, mantener la foto existente
        sqlQuery = 'UPDATE conductores SET conductor = ?, tipo_documento = ?, cedula = ?, fecha_expedicion = ?, fecha_nacimiento = ?, celular = ?, email = ?, direccion = ?, arl = ?, eps = ?, seguridad_social = ?, fecha_vencimiento_examen = ?, categoria = ?, fecha_vigencia = ?, tipo_sangre = ?, contacto_emergencia = ?, celular_emergencia = ? WHERE placa = ?';
        queryParams = [conductor, tipo_documento, cedula, fecha_expedicion, fecha_nacimiento, celular, email, direccion, arl, eps, seguridad_social, fecha_vencimiento_examen, categoria, fecha_vigencia, tipo_sangre, contacto_emergencia, celular_emergencia, placa];
    }

    // Realizar la actualización en la base de datos con los datos recibidos
    connection.query(sqlQuery, queryParams, (error, results) => {
        if (error) {
            console.error('Error al guardar los cambios:', error);
            res.status(500).send('Error al guardar los cambios');
            return;
        }
        if (results.affectedRows === 0) {
            console.error('No se encontró ningún conductor con la placa proporcionada:', placa);
            res.status(404).send('No se encontró ningún conductor con la placa proporcionada');
            return;
        }
        console.log('Cambios guardados correctamente en la base de datos');
        // Redirigir al usuario de vuelta a la página de consulta del conductor
        res.redirect(`/consulta-conductores?placa=${placa}`);
    });
});


// Ruta para renderizar la página del formulario de agregar conductor
app.get('/agregar-conductor', (req, res) => {
  // Renderiza el formulario para agregar un nuevo conductor
  res.render('formulario_agregar_conductor');
});

//consulta contabilidad 
app.get("/consulta-contabilidad", (req, res) => {
    // Consulta SQL para obtener todas las placas disponibles
    connection.query("SELECT placa FROM contabilidad", (error, results) => {
        if (error) {
            console.error("Error al obtener las placas de contabilidad:", error);
            res.status(500).send("Error al obtener las placas de contabilidad");
            return;
        }
        const placas = results.map(result => result.placa); // Extraer solo las placas de los resultados
        res.render("consulta_contabilidad", { placas: placas }); // Renderizar la plantilla y pasar las placas como datos
    });
});











//consulta contabilidad 
app.post("/consulta-contabilidad", (req, res) => {
    const placaSeleccionada = req.body.placa; // Obtener la placa seleccionada del cuerpo de la solicitud
    // Consulta SQL para obtener la información de contabilidad correspondiente a la placa seleccionada
    connection.query("SELECT * FROM contabilidad WHERE placa = ?", [placaSeleccionada], (error, results) => {
        if (error) {
            console.error("Error al obtener la información de contabilidad:", error);
            res.status(500).send("Error al obtener la información de contabilidad");
            return;
        }
        if (results.length === 0) {
            // Si no se encuentra ninguna entrada de contabilidad con la placa seleccionada, enviar un mensaje de error
            res.status(404).send("No se encontró ninguna entrada de contabilidad con la placa seleccionada");
            return;
        }
        const entradaContabilidad = results[0]; // Obtener la primera entrada de contabilidad encontrada (debería haber solo una)
        // Renderizar la plantilla y pasar las placas y la entrada de contabilidad como datos
        res.json(entradaContabilidad);
    });
});





// Ruta para cargar la página de edición de contabilidad
app.get("/edicion-contabilidad/:placa", (req, res) => {
    const placa = req.params.placa; // Obtener la placa del parámetro de la URL
    // Consulta SQL para obtener la información de contabilidad correspondiente a la placa
    connection.query("SELECT * FROM contabilidad WHERE placa = ?", [placa], (error, results) => {
        if (error) {
            console.error("Error al obtener la información de contabilidad:", error);
            res.status(500).send("Error al obtener la información de contabilidad");
            return;
        }
        if (results.length === 0) {
            // Si no se encuentra ninguna entrada de contabilidad con la placa seleccionada, enviar un mensaje de error
            res.status(404).send("No se encontró ninguna entrada de contabilidad con la placa seleccionada");
            return;
        }
        const contabilidad = results[0]; // Obtener la primera entrada de contabilidad encontrada
        // Renderizar la plantilla de edición de contabilidad y pasar la información de contabilidad como datos
        res.render("edicion_contabilidad", { contabilidad: contabilidad });
    });
});

// Ruta para manejar el formulario de edición de contabilidad
app.post('/guardar-edicion-contabilidad', (req, res) => {
    const placa = req.body.placa;
    // Obtener los datos del cuerpo de la solicitud
    const { NOMBRES_LICENCIA, TIPO_DE_DOCUMENTO_LICENCIA, NUMERO_DE_DOCUMENTO_LICENCIA, FECHA_DE_INICIO_CONTRATO, FECHA_FINAL, MOTIVO_RETIRO, NOMBRES_CONTRATO,TIPO_DE_DOCUMENTO_CONTRATO, NUMERO_DE_DOCUMENTO_CONTRATO, DIRECCION_CONTRATO,CELULAR_CONTRATO, EMAIL_CONTRATO, ACTIVIDAD_ECONOMICA_CONTRATO, VALOR_ADMINISTRACION, Nombre, tipo_documento, Cedula, Nombre_del_banco, Tipo_de_cuenta_bancaria, Numero_de_cuenta, direccion, celular, email } = req.body;

    // Realizar la actualización en la base de datos con los datos recibidos
    connection.query(
        'UPDATE contabilidad SET NOMBRES_LICENCIA = ?, TIPO_DE_DOCUMENTO_LICENCIA = ?, NUMERO_DE_DOCUMENTO_LICENCIA = ?, FECHA_DE_INICIO_CONTRATO = ?, FECHA_FINAL = ?, MOTIVO_RETIRO = ?, NOMBRES_CONTRATO = ?, TIPO_DE_DOCUMENTO_CONTRATO = ?,NUMERO_DE_DOCUMENTO_CONTRATO = ?, DIRECCION_CONTRATO = ?,CELULAR_CONTRATO = ?, EMAIL_CONTRATO = ?, ACTIVIDAD_ECONOMICA_CONTRATO = ?, VALOR_ADMINISTRACION = ?, Nombre = ?, tipo_documento = ?, Cedula = ?, Nombre_del_banco = ?, Tipo_de_cuenta_bancaria = ?, Numero_de_cuenta = ?, Direccion = ?, Celular = ?, Email = ? WHERE placa = ?',
        [NOMBRES_LICENCIA, TIPO_DE_DOCUMENTO_LICENCIA, NUMERO_DE_DOCUMENTO_LICENCIA, FECHA_DE_INICIO_CONTRATO, FECHA_FINAL, MOTIVO_RETIRO, NOMBRES_CONTRATO, TIPO_DE_DOCUMENTO_CONTRATO,NUMERO_DE_DOCUMENTO_CONTRATO,DIRECCION_CONTRATO,CELULAR_CONTRATO, EMAIL_CONTRATO, ACTIVIDAD_ECONOMICA_CONTRATO, VALOR_ADMINISTRACION, Nombre, tipo_documento, Cedula, Nombre_del_banco, Tipo_de_cuenta_bancaria, Numero_de_cuenta, direccion, celular, email, placa],
        (error, results) => {
            if (error) {
                console.error("Error al guardar los cambios:", error);
                res.status(500).send("Error al guardar los cambios");
                return;
            }
            if (results.affectedRows === 0) {
                console.error("No se encontró ninguna entrada de contabilidad con la placa proporcionada:", placa);
                res.status(404).send("No se encontró ninguna entrada de contabilidad con la placa proporcionada");
                return;
            }
            console.log("Cambios guardados correctamente en la base de datos");
            // Redirigir al usuario de vuelta a la página de consulta de contabilidad
            res.redirect(`/consulta-contabilidad?placa=${placa}`);
        }
    );
});

























// agregar contabilidad 
// Ruta para renderizar la página del formulario de agregar contabilidad
// Ruta para renderizar la página del formulario de agregar contabilidad
app.get("/agregar-contabilidad", (req, res) => {
    // Renderiza el formulario para agregar una nueva entrada de contabilidad
    res.render("formulario_agregar_contabilidad");
});

// Ruta para manejar los datos enviados desde el formulario y agregar una nueva entrada de contabilidad a la base de datos
app.post("/agregar-contabilidad", (req, res) => {
    // Obtener todos los campos del formulario
    const formData = req.body;

    // Asegurarse de enviar una cadena vacía si no se proporciona ningún valor para 'Numero_de_cuenta'
    const numeroCuenta = formData.Numero_de_cuenta || '';

    // Insertar los datos en la base de datos
    connection.query(
        `INSERT INTO contabilidad 
        (placa, NOMBRES_LICENCIA, TIPO_DE_DOCUMENTO_LICENCIA, NUMERO_DE_DOCUMENTO_LICENCIA, FECHA_DE_INICIO_CONTRATO, FECHA_FINAL, MOTIVO_RETIRO, NOMBRES_CONTRATO, TIPO_DE_DOCUMENTO_CONTRATO, NUMERO_DE_DOCUMENTO_CONTRATO, DIRECCION_CONTRATO, CELULAR_CONTRATO, EMAIL_CONTRATO, ACTIVIDAD_ECONOMICA_CONTRATO, VALOR_ADMINISTRACION, Nombre, tipo_documento, Cedula, Nombre_del_banco, Tipo_de_cuenta_bancaria, Numero_de_cuenta, Direccion, Celular, Email) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            formData.placa,
            formData.NOMBRES_LICENCIA,
            formData.TIPO_DE_DOCUMENTO_LICENCIA,
            formData.NUMERO_DE_DOCUMENTO_LICENCIA,
            formData.FECHA_DE_INICIO_CONTRATO,
            formData.FECHA_FINAL,
            formData.MOTIVO_RETIRO,
            formData.NOMBRES_CONTRATO,
            formData.TIPO_DE_DOCUMENTO_CONTRATO,
            formData.NUMERO_DE_DOCUMENTO_CONTRATO,
            formData.DIRECCION_CONTRATO,
            formData.CELULAR_CONTRATO,
            formData.EMAIL_CONTRATO,
            formData.ACTIVIDAD_ECONOMICA_CONTRATO,
            formData.VALOR_ADMINISTRACION,
            formData.Nombre,
            formData.tipo_documento,
            formData.Cedula,
            formData.Nombre_del_banco,
            formData.Tipo_de_cuenta_bancaria,
            formData.Numero_de_cuenta,
            formData.Direccion,
            formData.Celular,
            formData.Email
        ],
        (error, results) => {
            if (error) {
                console.error("Error al agregar la contabilidad:", error);
                res.status(500).send("Error al agregar la contabilidad");
                return;
            }
            console.log("Información agregada correctamente a la base de datos");
            // Redirigir al usuario de vuelta a la página de consulta de contabilidad
            res.redirect(`/consulta-contabilidad`);
        }
    );
});














// Ruta para el formulario
// Ruta para el formulario
app.get('/formulario', async (req, res) => {
    try {
        if (req.session.loggedin === true) {
            const rolesString = req.session.roles;
            const roles = Array.isArray(rolesString) ? rolesString : [];
        
        const ejecutivo1 = roles.includes('ejecutivo1');
        const ejecutivo2 = roles.includes('ejecutivo2');
        const ejecutivo3 = roles.includes('ejecutivo3');
        const ejecutivo4 = roles.includes('ejecutivo4');
        const ejecutivo5 = roles.includes('ejecutivo5');
        const ejecutivo6 = roles.includes('ejecutivo6');
        const ejecutivo7 = roles.includes('ejecutivo7');
        const ejecutivo8 = roles.includes('ejecutivo8');
        
        const isExecutive = roles.includes('ejecutivo');
        
            // Consulta para obtener todos los clientes de la tabla "clientes"
            connection.query('SELECT * FROM clientes', (errorClientes, resultadosClientes) => {
                if (errorClientes) {
                    console.error('Error al obtener los clientes:', errorClientes);
                    res.status(500).send('Error al obtener los clientes');
                    return;
                }

                // Consulta para obtener todas las placas de la tabla "conductores"
                connection.query('SELECT DISTINCT placa FROM conductores', (errorPlacas, resultadosPlacas) => {
                    if (errorPlacas) {
                        console.error('Error al obtener las placas de los conductores:', errorPlacas);
                        res.status(500).send('Error al obtener las placas de los conductores');
                        return;
                    }

                    // Los resultados de ambas consultas se pasan al renderizar la página
                    res.render('recepciones', { 
                        clientes: resultadosClientes, 
                        placas: resultadosPlacas,
                        isExecutive, 
                        ejecutivo1, 
                        ejecutivo2, 
                        ejecutivo3,
                        ejecutivo4,
                        ejecutivo5,
                        ejecutivo6,
                        ejecutivo7,
                        ejecutivo8,
                    });
                });
            });
        } else {
            res.redirect("/login/index");
        }
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send('Error al procesar la solicitud');
    }
});

app.post('/obtener_conductor', (req, res) => {
    const placaSeleccionada = req.body.placa;

    // Realiza una consulta a la base de datos para obtener el conductor correspondiente a la placa
    connection.query('SELECT conductor, celular, foto FROM conductores WHERE placa = ?', [placaSeleccionada], (error, results) => {
        if (error) {
            console.error('Error al obtener el conductor:', error);
            res.status(500).json({ error: 'Error al obtener el conductor' });
        } else {
            if (results && results.length > 0) {
                const conductor = results[0].conductor;
                const celular = results[0].celular;
                let fotoURL = null; // Inicializa la URL de la foto como nula por defecto
                if (results[0].foto) {
                    // Si hay una foto en la base de datos, conviértela a Base64 y forma la URL
                    const fotoBase64 = results[0].foto.toString('base64');
                    fotoURL = `data:image/jpeg;base64,${fotoBase64}`;
                }
                res.json({ conductor, celular, fotoURL });
            } else {
                res.status(404).json({ error: 'Conductor no encontrado para la placa seleccionada' });
            }
        }
    });
});




app.use(bodyParser.urlencoded({ extended: false }));


/// Modifica la función post para enviar los datos al Google Sheet
// Ruta para procesar el formulario
app.post('/procesar_formulario', async (req, res) => {
    const { cliente, costo, fecha, hora, nombre_pasajero, valor, cantidad_pasajeros, tipo_vehiculo, vuelo, placa, conductor, celular_conductor } = req.body;

    try {
        // Enviar los datos al Google Sheet
        const responseSheet = await fetch('https://script.google.com/macros/s/AKfycbwJsR7Thyn0Kq1dKOF87W080FGrUmvwsquVd1NluDpxo_oU0kqGs9XalUD4VAepSx2G/exec', {
            method: 'POST',
            body: new URLSearchParams(req.body),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!responseSheet.ok) {
            console.error('Error al enviar los datos al Google Sheet:', responseSheet.statusText);
            throw new Error('Error al enviar los datos al Google Sheet');
        }

        console.log('Datos enviados correctamente al Google Sheet');

        // Redireccionar a la ruta para mostrar los detalles del formulario
        res.redirect(`/mostrar_formulario?${new URLSearchParams(req.body).toString()}`);
    } catch (error) {
        console.error('Error en el procesamiento del formulario:', error);
        res.status(500).send('Error en el procesamiento del formulario');
    }
});

// Ruta para mostrar los detalles del formulario y generar el PDF
app.get('/mostrar_formulario', (req, res) => {
    // Obtener los datos del formulario de la consulta
    const datosFormulario = req.query;

    // Generar el PDF
    doc.pipe(fs.createWriteStream('formulario.pdf'));
    doc.fontSize(12);
    doc.fillColor('black');
    doc.font('Helvetica-Bold').fillColor('black').text(`FECHA DEL SERVICIO: ${datosFormulario.fecha}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`HORA: ${datosFormulario.hora}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`HUESPED: ${datosFormulario.nombre_pasajero}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`N° DE VUELO: ${datosFormulario.vuelo}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`PLACA: ${datosFormulario.placa}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`CONDUCTOR ASIGNADO: ${datosFormulario.conductor}`).moveDown();
    doc.font('Helvetica-Bold').fillColor('black').text(`CELULAR: ${datosFormulario.celular_conductor}`).moveDown();
    doc.moveDown().strokeColor('black').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.end();

    // Renderizar el formulario.hbs y pasar los datos del formulario
    res.render('formulario', { datosFormulario });
});

// Ruta para descargar el PDF
app.get('/descargar_pdf', (req, res) => {
    // Renderizar la plantilla HTML con los datos del formulario
    const datosFormulario = req.query;
    res.render('formulario', { datosFormulario }, (err, html) => {
        if (err) {
            console.error('Error al renderizar el HTML:', err);
            res.status(500).send('Error al renderizar el HTML');
        } else {
            const options = { format: 'Letter' }; // Opciones de formato para el PDF

            // Convertir el HTML a PDF
            htmlToPdf(html, options, (pdfErr, buffer) => {
                if (pdfErr) {
                    console.error('Error al convertir HTML a PDF:', pdfErr);
                    res.status(500).send('Error al convertir HTML a PDF');
                } else {
                    // Enviar el PDF generado como respuesta HTTP para descargar
                    res.set({
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': 'attachment; filename=formulario.pdf'
                    });
                    res.send(buffer);
                }
            });
        }
    });
});







const puppeteer = require('puppeteer');
const path = require('path'); // Agregar esta línea para importar el módulo 'path'

// Directorio donde se guardarán las imágenes
const directorioImagenes = path.join(__dirname, 'imagenes');

// Función para convertir HTML a imagen utilizando Puppeteer
async function convertirHtmlAImagen(html, nombreArchivo) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);

    // Ajusta el tamaño de la ventana del navegador para que coincida con el tamaño del contenedor
    const { width, height } = await page.$eval('#container', container => ({
        width: container.offsetWidth,
        height: container.offsetHeight
    }));
    await page.setViewport({ width, height });

    // Verifica si el directorio de imágenes existe, si no existe, créalo
    if (!fs.existsSync(directorioImagenes)) {
        fs.mkdirSync(directorioImagenes, { recursive: true });
    }

    await page.screenshot({ path: path.join(directorioImagenes, nombreArchivo) });
    await browser.close();
    console.log('La imagen se ha guardado correctamente en', nombreArchivo);
}

// Endpoint para convertir HTML a imagen
app.post('/convertirHtmlAImagen', async (req, res) => {
    try {
        // Lee el contenido HTML del cuerpo de la solicitud
        const html = req.body.html;

        // Verifica que el HTML recibido no esté vacío
        if (!html) {
            throw new Error('El HTML recibido está vacío');
        }

        // Nombre del archivo de imagen de salida
        const nombreArchivo = 'miImagen.png';

        // Llama a la función para convertir HTML a imagen utilizando Puppeteer
        await convertirHtmlAImagen(html, nombreArchivo);

        // Envía la imagen como respuesta al cliente
        res.sendFile(path.join(directorioImagenes, nombreArchivo));
    } catch (error) {
        console.error('Error al convertir HTML a imagen:', error);
        res.status(500).send('Error al convertir HTML a imagen');
    }
});

app.use(express.static(path.join(__dirname, 'public')));







app.get('/clientes', (req, res) => {
    // Realiza una consulta a la base de datos para obtener los nombres y fotos de los clientes
    connection.query('SELECT nombre, foto FROM clientes', (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Envia los resultados de la consulta como respuesta en formato JSON
        res.json(results);
    });
});




app.get('/clientePorNombre', (req, res) => {
    const nombreCliente = req.query.nombre;

    // Realiza una consulta a la base de datos para obtener los datos del cliente por su nombre
    connection.query('SELECT * FROM clientes WHERE nombre = ?', [nombreCliente], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Verifica si se encontró un cliente con el nombre dado
        if (results.length > 0) {
            const cliente = results[0];
            res.json(cliente);
        } else {
            res.status(404).send('Cliente no encontrado');
        }
    });
});



app.get('/obtenerFotoConductor', (req, res) => {
    const placa = req.query.placa;
    console.log('Placa recibida:', placa); // Imprime el valor de la placa en la consola del servidor

    // Realizar una consulta a la base de datos para obtener los datos binarios de la foto del conductor basada en la placa
    connection.query('SELECT foto FROM conductores WHERE placa = ?', [placa], (error, results, fields) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).send('Error interno del servidor');
            return;
        }

        // Verificar si se encontró la foto del conductor con la placa dada
        if (results.length > 0) {
            const fotoConductor = results[0].foto;

            // Devolver los datos binarios de la foto del conductor
            res.send(fotoConductor);
        } else {
            res.status(404).send('Foto del conductor no encontrada');
        }
    });
});


app.get('/obtenerFotovehiculo', (req, res) => {
    const placa = req.query.placa;
    console.log('Placa recibida:', placa); // Imprime el valor de la placa en la consola del servidor

// Corrige el nombre de la columna en la consulta SQL y en la asignación de resultados
connection.query('SELECT foto_vehiculo FROM vehiculos WHERE placa = ?', [placa], (error, results, fields) => {
    if (error) {
        console.error('Error al ejecutar la consulta:', error);
        res.status(500).send('Error interno del servidor');
        return;
    }

    // Verificar si se encontró la foto del vehículo con la placa dada
    if (results.length > 0) {
        const fotoVehiculo = results[0].foto_vehiculo; // Corrige el nombre de la variable a fotoVehiculo

        // Devolver los datos binarios de la foto del vehículo
        res.send(fotoVehiculo);
    } else {
        res.status(404).send('Foto del vehículo no encontrada');
    }
});

});













// Configurar body-parser para permitir cuerpos de solicitud más grandes (50 MB en este caso)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


app.post('/enviar-email', upload.single('imagen'), (req, res) => {
    // Extraer los datos del cuerpo de la solicitud
    const { destinatario, asunto, cuerpoHtml } = req.body;
    const imagenFile = req.file;

    // Verificar si todos los campos requeridos están presentes
    if (!destinatario || !asunto || !cuerpoHtml || !imagenFile) {
        res.status(400).send('Faltan campos requeridos.');
        return;
    }

    // Configurar el transporte del correo electrónico
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'recepciones.vianco@gmail.com',
            pass: 'xaezkqbzfsuegqhm'
        }
    });

// Agrega tu texto adicional al cuerpo del correo electrónico
const textoAdicional = '<p>Texto adicional que quieres agregar junto con la imagen:</p>';
const cuerpoHtmlConTexto = cuerpoHtml + textoAdicional;

// Configurar los detalles del correo electrónico
const mailOptions = {
    from: 'recepciones.vianco@gmail.com',
    to: destinatario,
    subject: 'Recogida de transporte en el Aeropuerto Internacional El Dorado, Bogotá Colombia. Recibidos',
    html: `
        <p>Cordial Saludo,</p>
        <p>Gracias por visitar la increíble ciudad de Bogotá, anexo al correo encontrará una imagen la confirmación del transporte solicitado con los datos del conductor(es), vehículo(s) asignado(s), el itinerario, los términos y condiciones.</p>
        <p>Dentro del Aeropuerto frente a la puerta internacional o nacional, lo esperará un integrante del equipo Vianco Te Transporta para trasladarlo al Hotel.</p>
        <p>Gracias por preferirnos, !Vianco te transporta a un mundo lleno de experiencias¡</p>
    `,
    attachments: [
        {
            filename: imagenFile.originalname, // Nombre de la imagen original
            content: imagenFile.buffer, // Contenido de la imagen en formato buffer
            encoding: 'base64' // Codificación de la imagenT
        }
    ]
};




    // Enviar el correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo electrónico:', error);
            res.status(500).send('Error al enviar el correo electrónico');
        } else {
            console.log('Correo electrónico enviado:', info.response);
            res.status(200).send('Correo electrónico enviado correctamente');
        }
    });
});




// Ruta pa

app.get('/seleccionar_hotel', (req, res) => {
    res.render('seleccionar_hotel'); // Renderiza la vista seleccionar_hotel.hbs
});



app.get('/tarifas', (req, res) => {
    const hotelSeleccionado = req.query.hotel; // Obtén el nombre del hotel seleccionado desde la consulta

    // Construye la ruta de la imagen basada en el nombre del hotel
    const rutaImagen = path.join(__dirname, 'public', 'imagenes', `${hotelSeleccionado}.png`);

    // Envía la imagen al cliente
    res.sendFile(rutaImagen, (err) => {
        if (err) {
            console.error(err);
            res.status(404).send('Imagen no encontrada para el hotel seleccionado');
        }
    });
});
// 






//NOVEDADES CALLCENTER 
app.get("/novedades_callcenter")
































// Iniciar el servidor
app.listen(app.get("port"), () => {
    console.log("Listening on port ", app.get("port"));
});
