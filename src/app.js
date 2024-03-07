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



// Iniciar el servidor
app.listen(app.get("port"), () => {
    console.log("Listening on port ", app.get("port"));
});
