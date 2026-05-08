
module.exports = function(app, exp) {
	var bodyParser = require('body-parser');
	var cookieParser = require('cookie-parser');
	var session = require('express-session');
	var methodOverride = require('method-override');
	var stylus = require('stylus');
	var pug = require('pug');

	app.set('port', process.env.PORT || 3000);
	app.set('views', app.root + '/app/server/views');
	app.set('view engine', 'pug');

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(cookieParser());
	app.use(session({ secret: 'super-duper-secret-secret', resave: false, saveUninitialized: false }));
	app.use(methodOverride());
	app.use(stylus.middleware({ src: app.root + '/app/public' }));
	app.use(exp.static(app.root + '/app/server'));
	app.use(exp.static(app.root + '/app/public'));
}
