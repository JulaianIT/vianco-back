const { engine } = require("express-handlebars");
const session = require("express-session");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const express = require("express");

const loginRoutes = require("./routes/login");

const app = express();

app.set("port", 4000);

app.set("views", __dirname + "/views");
app.engine(".hbs", engine({
    extname: ".hbs"
}));
app.set("view engine", "hbs");

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

const connection = mysql.createConnection({
    host: "69.61.31.131",
    user: "viancote_soporte",
    password: "MXPwPzz4zlU=",
    database: "viancote_nodelogin"
});

connection.connect((err) => {
    if (err) {
        console.error("Error connecting to database:", err);
        return;
    }
    console.log("Connected to database");
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

// Rutas para el login
app.use("/login", loginRoutes);


// Ruta para la página principal
app.get("/", (req, res) => {
    if (req.session.loggedin == true) {
        res.render("home", { name: req.session.name });
    } else {
        res.redirect("/login/index");
    }
});

// Ruta para logout
app.get("/logout", (req, res) => {
    if (req.session.loggedin == true) {
        req.session.destroy();
    }
    res.redirect("/login/index");
});

// Iniciar el servidor
app.listen(app.get("port"), () => {
    console.log("Listening on port ", app.get("port"));
});
