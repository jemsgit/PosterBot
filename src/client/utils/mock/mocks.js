var axios = require('axios');
var nock = require('nock');
var config = require('../../../config').default;

console.log(config);

// Mock any GET request to /users
// arguments for reply are (status, data, headers)
nock('http://localhost:3001/api/')
.persist()
.post('login')
.reply(200, 'OK');

nock('http://localhost:3001/api/')
.persist()
.get('login')
.reply(200, 'OK');