const express = require('express');
const app = express();
const fs = require('fs');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3001;
const constants = require('./constants');
const jwtAuth = require('./jwtAuth');

app.get('/', (req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('Hello');
        res.end();
})

app.post('/api/login', (req, res) => {
  if(req.body.login === constants.adminUser.login
      && req.body.password === constants.adminUser.password) {
        jwt.sign({user: constants.adminUser}, 'jemmyJackson', { expiresIn: '2d' }, (err, token) => {
          res.json({
            token
          });
        });
      } else {
        res.write('error')
      }
});

app.use(jwtAuth.verifyToken);

var channelRoutes = require('./restAPI/routes/channelRoutes'); //importing route
var contentRoutes = require('./restAPI/routes/contentRoutes'); //importing route
channelRoutes(app); //register the route
contentRoutes(app);

app.listen(port, () => console.log('Example app listening on port 3000!'))
