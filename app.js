
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;
app.use(express.static(__dirname + '/public/assets'));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,`/public/index.html`));
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




app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});