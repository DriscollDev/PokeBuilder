/*
const express = require('express');
const mysql = require("mysql2")
const path = require("path")
const dotenv = require('dotenv')
const bcrypt = require("bcryptjs")
*/

import express from 'express';
import mysql from 'mysql2';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


import Pokedex from 'pokedex-promise-v2';
const options = {
  protocol: 'https',
  //hostName: 'localhost:443',
  versionPath: '/api/v2/',
  cacheLimit: 100 * 1000, // 100s
  timeout: 5 * 1000 // 5s
}
const P = new Pokedex();

dotenv.config({ path: './.env'})


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

let publicDir = path.join(__dirname + '/public')
app.set('views', __dirname + '/views');

app.set('view engine', 'ejs');
app.use(express.static(publicDir))
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json())






app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/views/index.html'));
});
app.get('/login', (req, res) => {
 res.sendFile(path.join(__dirname + '/views/login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname + '/views/signup.html'));
});
app.get('/pokedex', (req, res) => {
  res.sendFile(path.join(__dirname + '/views/pokedex.html'));
});

app.post("/auth/login", (req, res)=> {
  const { username, password} = req.body

  db.query('SELECT * FROM user WHERE username = ?', [username], async (error, result) => {
    
    if(error){
      console.log(error)
    }

    if (result.length == 0) {
      console.log("--------> User does not exist")
      //res.sendStatus(404)
    } 
    else {
      const hashedPassword = result[0].password
      if (await bcrypt.compare(password, hashedPassword)) {
        console.log("---------> Login Successful")
        res.send(`${username} is logged in!`)
      } 
      else {
        console.log("---------> Password Incorrect")
        res.send("Password incorrect!")
      }
    }
  })
})

app.post("/auth/register", (req, res) => {    
  const { username, email, password, password_confirm } = req.body
  //console.log(req.body)
  //console.log(username, email, password, password_confirm)

  db.query('SELECT email FROM user WHERE email = ?', [email], async (error, result) => {
      if(error){
          console.log(error)
      }

      if( result.length > 0 ) {
          //return res.render('register', {message: 'This email is already in use'})
          return res.send('This email is already in use')
      } 
      else if(password !== password_confirm) {
          //return res.render('register', {message: 'Password Didn\'t Match!' })
          return res.send('Password Didn\'t Match!')
      }

      bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            let hashedPassword = hash;

            
            db.query('INSERT INTO user SET?', {username: username, email: email, password: hashedPassword}, (error, result) => {
              if(error) {
                  console.log(error)
              } else {
                  //return res.render('register', { message: 'User registered!'})
                  return res.send('User registered!')
              }
            }) 
            
        });
      });

      
     
             
  })
})



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});