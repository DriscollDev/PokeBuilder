import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { dirname } from "dirname-filename-esm"
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
const mySqlStore = MySQLStore(session);
import passport from 'passport';

import pool from './controllers/db.js';

import homeRouter from './routers/homepage.js';
import authRouter from './routers/auth.js';
import dashRouter from './routers/dashboard.js';
import pokeRouter from './routers/pokeRouter.js';
import teamRouter from './routers/teambuilder.js'
import adminRouter from './routers/admin.js'


// app
const app = express();

// view engine setup
app.set('views', path.join(dirname(import.meta), 'views'));
app.set('view engine', 'ejs');

// plugins
app.use(logger(process.env.NODE_ENV === "production" ? "common" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(dirname(import.meta), "../", 'public')));

let checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { 
    // VULN TMI: previously logged the entire session object, which could expose sensitive data in logs.
    console.log(`Authenticated user ID: ${req.session?.passport?.user?.userID}`);
    return next(); 
  }
  res.redirect("/auth/login");
};

const sessionStore = new mySqlStore({},pool);

app.use(session({
  secret: 'typeshit',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));
app.use(passport.authenticate('session'));

// routers
app.use('/', homeRouter);
app.use("/auth", authRouter);
app.use('/dash',checkAuthenticated, dashRouter);
app.use('/poke', pokeRouter);
app.use('/team',checkAuthenticated, teamRouter)
app.use('/admin', adminRouter);


export default app;