/**
 * JSON API for the Kodama seminar iPhone app (and anything else that wants JSON).
 * Mounted under /api/v1 so it never collides with the HTML routes.
 *
 *   POST /api/v1/login   {user, pass}  → {ok, user}   (sets the session cookie)
 *   POST /api/v1/logout                → {ok}
 *   GET  /api/v1/me                    → {ok, user} | 401
 *   GET  /api/v1/users/:user/timetable → {user, days, periods, slots:[{week,time,lecCode,title}]}
 *   GET  /api/v1/users/:user/lessons/:code → {lecCode,title,objective,textbook,reference,advreference,groups}
 *
 * Timetables and lesson pages are already public in the HTML app (/:user/top,
 * /:user/lesson/:code), so the read endpoints are public too. Unlike the HTML
 * routes, nothing here creates documents on read, and account documents
 * (password hash, email) are never sent back.
 */
var exp = require('express');
var passport = require('./modules/auth');
var REC = require('./modules/records.js');

var DAYS = [
    { ja: '月', en: 'Mon' }, { ja: '火', en: 'Tue' }, { ja: '水', en: 'Wed' },
    { ja: '木', en: 'Thu' }, { ja: '金', en: 'Fri' }, { ja: '土', en: 'Sat' }
];
var PERIODS = [
    { n: 1, start: '9:30',  end: '11:00' }, { n: 2, start: '11:10', end: '12:40' },
    { n: 3, start: '13:30', end: '15:00' }, { n: 4, start: '15:10', end: '16:40' },
    { n: 5, start: '16:50', end: '18:20' }
];

function publicUser(o) { return { user: o.user, name: o.name || o.user }; }

module.exports = function(app) {
    var api = exp.Router();
    api.use(function(req, res, next) { res.set('Cache-Control', 'no-store'); next(); });

    api.post('/login', function(req, res, next) {
        var body = req.body || {};
        if (!body.user || !body.pass) { return res.status(400).json({ ok: false, error: 'missing-credentials' }); }
        passport.authenticate('local', function(err, o, info) {
            if (err) { return next(err); }
            if (!o) { return res.status(401).json({ ok: false, error: (info && info.message) || 'invalid-login' }); }
            req.login(o, function(err) {
                if (err) { return next(err); }
                req.session.user = o;          // the HTML side reads req.session.user
                res.json({ ok: true, user: publicUser(o) });
            });
        })(req, res, next);
    });

    api.post('/logout', function(req, res) {
        var done = function() { req.session.destroy(function() { res.json({ ok: true }); }); };
        if (typeof req.logout === 'function') { req.logout(function() { done(); }); } else { done(); }
    });

    api.get('/me', function(req, res) {
        if (!req.session.user) { return res.status(401).json({ ok: false, error: 'not-logged-in' }); }
        res.json({ ok: true, user: publicUser(req.session.user) });
    });

    api.get('/users/:user/timetable', function(req, res) {
        var user = req.params.user;
        REC.getLectures().findOne({ name: user }, function(err, doc) {
            if (err) { return res.status(500).json({ ok: false, error: 'db' }); }
            var lecs = (doc && doc.lecs) || [];
            var codes = lecs.map(function(l) { return l.lecCode; });
            REC.getClasses().find({ lecCode: { $in: codes } }, function(err2, classes) {
                var titles = {};
                (classes || []).forEach(function(c) {
                    // prefer the timetable owner's own page when codes are shared
                    if (!titles[c.lecCode] || c.author === user) { titles[c.lecCode] = c.title; }
                });
                var slots = lecs
                    .filter(function(l) { return l.week >= 0 && l.week < 6 && l.time >= 0 && l.time < 5; })
                    .map(function(l) {
                        return { week: l.week, time: l.time, lecCode: l.lecCode, title: titles[l.lecCode] || '' };
                    })
                    .sort(function(a, b) { return (a.week * 5 + a.time) - (b.week * 5 + b.time); });
                res.json({ ok: true, user: user, exists: !!doc, days: DAYS, periods: PERIODS, slots: slots });
            });
        });
    });

    api.get('/users/:user/lessons/:code', function(req, res) {
        var Classes = REC.getClasses();
        Classes.find({ lecCode: req.params.code }, function(err, docs) {
            if (err) { return res.status(500).json({ ok: false, error: 'db' }); }
            docs = docs || [];
            var c = docs.filter(function(d) { return d.author === req.params.user; })[0] || docs[0];
            if (!c) { return res.status(404).json({ ok: false, error: 'not-found' }); }
            res.json({
                ok: true, lecCode: c.lecCode, title: c.title, lang: c.lang, author: c.author,
                objective: c.objective, textbook: c.textbook, reference: c.reference, advreference: c.advreference,
                groups: (c.group || []).map(function(g) {
                    return { name: g.name, classes: (g.classes || []).map(function(x) { return x.name; }) };
                }),
                webURL: '/' + encodeURIComponent(req.params.user) + '/lesson/' + encodeURIComponent(c.lecCode)
            });
        });
    });

    api.use(function(req, res) { res.status(404).json({ ok: false, error: 'no-such-endpoint' }); });
    app.use('/api/v1', api);
};
