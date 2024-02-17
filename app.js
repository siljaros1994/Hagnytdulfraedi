require('dotenv').config();

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require("path");
const bodyParser = require('body-parser');
const users = require('./data').userDB;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
//const server = http.createServer(app);

const options = {
    key: fs.readFileSync('C:/Users/silja/privateKey.key'),
    cert: fs.readFileSync('C:/Users/silja/certificate.crt')
};

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));

// Redirects from the HTTP port 80 to the HTTPS port 443.
http.createServer((req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname,'./public/index.html'));
});

app.post('/register', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (!foundUser) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            let newUser = {
                id: Date.now(),
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
            };
            users.push(newUser);
            console.log('User list', users);
    
            res.send("<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='./login.html'>login</a></div><br><br><div align='center'><a href='./registration.html'>Register another user</a></div>");
        } else {
            res.send("<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='./registration.html'>Register again</a></div>");
        }
    } catch{
        res.send("Internal server error");
    }
});

app.post('/login', async (req, res) => {
    try{
        let foundUser = users.find((data) => req.body.email === data.email);
        if (foundUser) {
    
            let submittedPass = req.body.password; 
            let storedPass = foundUser.password; 
            
            //const passwordMatch = await submittedPass == storedPass;
            const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
            if (passwordMatch) {
                const token = jwt.sign({ userId: foundUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${usrname}</h3></div><br><br><div align='center'><a href='./login.html'>logout</a></div>`);
            } else {
                res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
            }
        }
        else {
            res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
        }
    } catch{
        res.send("Internal server error");
    }
});

// Middleware to authenticate.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);
    
    jwt.verify(token, 'yourSecretKey', (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

// Protect's the /adminGetUsers route with the authenticateToken middleware
app.get('/adminGetUsers', authenticateToken, (req, res) => {
    if(req.user && req.user.userId){
      res.send(users);
    } else {
      res.sendStatus(401);
    }
  });

//server.listen(3000, function(){
    //console.log("server is listening on port: 3000");
//});

// Start the HTTPS server on port 443
https.createServer(options, app).listen(443, function(){
    console.log("Secure server is listening on port: 443");
});