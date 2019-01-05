var axios = require('axios');
var nock = require('nock');
var config = require('../../../config').default;

console.log(config);

var mock = nock(config.apiHost).persist();
// Mock any GET request to /users
// arguments for reply are (status, data, headers)
mock.post('/login').reply(200, {
  users: [
    { id: 1, name: 'John Smith' }
  ]
}, {
  'Access-Control-Allow-Origin': '*'
});
