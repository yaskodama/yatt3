/**
 * Passport.js configuration for YaTT.
 *
 * Wraps the existing `Accounts` model (account-manager.js, DB: login-testing)
 * and bcryptjs password hashes in a Local strategy, and wires up the
 * serialize/deserialize hooks so login state lives in the (connect-mongo)
 * session store rather than in memory.
 *
 * The login form posts `user` / `pass`, so the strategy maps those field names.
 * On success the full account document is returned (done(null, o)); the router
 * keeps mirroring it onto req.session.user for backward compatibility with the
 * rest of the app, which reads req.session.user.* everywhere.
 */
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var AM = require('./account-manager');

var Accounts = AM.getAccounts();

passport.use(new LocalStrategy(
    { usernameField: 'user', passwordField: 'pass' },
    function(user, pass, done) {
        Accounts.findOne({ user: user }, function(err, o) {
            if (err) { return done(err); }
            if (!o) { return done(null, false, { message: 'user-not-found' }); }
            bcrypt.compare(pass, o.pass, function(err, ok) {
                if (err) { return done(err); }
                if (!ok) { return done(null, false, { message: 'invalid-password' }); }
                return done(null, o);
            });
        });
    }
));

// Persist only the account id in the session; rehydrate the full doc per request.
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    Accounts.findById(id, function(err, o) {
        done(err, o);
    });
});

module.exports = passport;
