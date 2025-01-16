const express = require('express');
const mysql = require("mysql2")
const path = require("path")
const dotenv = require('dotenv')
const bcrypt = require("bcryptjs")

dotenv.config({ path: './.env'})



const app = express();
const port = 8080;

var db = mysql.createConnection({
  host: process.env.host,
  port: process.env.port,
  user: process.env.user,
  password: process.env.password,
  database: process.env.dbname
});
db.connect((error) => {
  if(error) {
    console.log(error)
  } 
  else {
    console.log("MySQL connected!")
  }
});

publicDir = path.join(__dirname + '/public')

app.use(express.static(publicDir))
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())

app.set('view engine', 'hbs')





app.get('/', (req, res) => {
  res.render('index');
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname,`/public/login.html`));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname,`/public/signup.html`));
});
app.get('/pokedex', (req, res) => {
  res.sendFile(path.join(__dirname,`/public/pokedex.html`));
});
app.get('/test' , (req, res) => {
    


});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});