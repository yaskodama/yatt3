/**
 * Node.js Login Boilerplate
 * Author : Stephen Braitsch
 * More Info : http://bit.ly/LsODY8
 */
var http = require('http');
var exp = require('express');
var app = exp();

app.root = __dirname;
global.host = 'localhost';

require('./app/config')(app, exp);
require('./app/server/router')(app);

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
