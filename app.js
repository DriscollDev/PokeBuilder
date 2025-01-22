const express = require('express');
const mysql = require("mysql2")
const path = require("path")
const dotenv = require('dotenv')
const bcrypt = require("bcryptjs")
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

import Pokedex from 'pokedex-promise-v2';
const options = {
  protocol: 'https',
  hostName: 'localhost:443',
  versionPath: '/api/v2/',
  cacheLimit: 100 * 1000, // 100s
  timeout: 5 * 1000 // 5s
}
const P = new Pokedex();

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






app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.get('/login', (req, res) => {
 res.sendFile(path.join(__dirname + '/public/login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/signup.html'));
});
app.get('/pokedex', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/pokedex.html'));
});
app.get('/test' , (req, res) => {
    


});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});