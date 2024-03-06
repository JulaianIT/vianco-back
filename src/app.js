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
        res.sendFile(__dirname + "/views/programacion/programacion.html");
    } else {
        res.redirect("/login/index");
    }
});

// Ruta para la página principal
app.get("/", (req, res) => {
    if (req.session.loggedin === true) {
        res.render("home", { name: req.session.name });
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

// Iniciar el servidor
app.listen(app.get("port"), () => {
    console.log("Listening on port ", app.get("port"));
});
