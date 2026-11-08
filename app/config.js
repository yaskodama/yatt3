
module.exports = function(app, exp) {
	var bodyParser = require('body-parser');
	var cookieParser = require('cookie-parser');
	var session = require('express-session');
	// connect-mongo v6 ships as an ESM module; under CommonJS require() the
	// MongoStore class lives on the .default export.
	var MongoStore = require('connect-mongo').default;
	var methodOverride = require('method-override');
	var stylus = require('stylus');
	var pug = require('pug');
	var passport = require('./server/modules/auth');
	var i18n = require('i18n');

	// Server-side i18n: all UI strings live in /locales/{en,ja}.json and are
	// rendered with __('key') in the Pug views. Language is chosen by the
	// `lang` cookie (set via the topbar JA/EN toggle), falling back to ja.
	i18n.configure({
		locales: ['ja', 'en'],
		defaultLocale: 'ja',
		directory: app.root + '/locales',
		cookie: 'lang',
		queryParameter: 'lang',
		objectNotation: false,
		updateFiles: false,
		autoReload: false
	});

	// Session store lives in MongoDB (same host as the accounts DB) so that
	// login state survives server restarts instead of vanishing with the
	// default in-memory store.
	var sessionDb = process.env.MONGODB_URI || 'mongodb://127.0.0.1/';
	var sessionDbName = process.env.ACCOUNTS_DB || 'login-testing';

	app.set('port', process.env.PORT || 3000);
	app.set('views', app.root + '/app/server/views');
	app.set('view engine', 'pug');

	// Heroku terminates TLS at its router; trust X-Forwarded-* headers.
	app.set('trust proxy', 1);

	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(cookieParser());
	app.use(session({
		secret: process.env.SESSION_SECRET || 'super-duper-secret-secret',
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({ mongoUrl: sessionDb, dbName: sessionDbName, collectionName: 'sessions' }),
		cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }   // 1 week
	}));
	app.use(methodOverride());
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(i18n.init);
	// Expose the logged-in account + current language to every view (the topbar
	// uses currentUser for the root-only button and lang for the JA/EN toggle).
	app.use(function(req, res, next) {
		res.locals.currentUser = req.session.user || null;
		res.locals.lang = res.getLocale();
		res.locals.currentPath = req.path;
		next();
	});
	app.use(stylus.middleware({ src: app.root + '/app/public' }));
	app.use(exp.static(app.root + '/app/server'));
	app.use(exp.static(app.root + '/app/public'));
}
