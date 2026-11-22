/**
 * Seminar announcements (お知らせ) — root writes them at /root/news,
 * the iPhone app reads them from GET /api/v1/news (see api.js).
 */
var REC = require('./modules/records.js');

var MAX_TITLE = 200, MAX_BODY = 5000, MAX_URL = 500;

function clean(body) {
    var url = String(body.url || '').trim().slice(0, MAX_URL);
    if (url && !/^https?:\/\//i.test(url)) { url = ''; }   // only web links, never javascript: etc.
    return {
        title: String(body.title || '').trim().slice(0, MAX_TITLE),
        body: String(body.body || '').replace(/\r\n/g, '\n').trim().slice(0, MAX_BODY),
        url: url,
        pinned: body.pinned === 'on' || body.pinned === 'true' || body.pinned === true
    };
}

// Newest first, pinned ones on top.
function listNews(limit, callback) {
    REC.getNews().find({}).sort({ pinned: -1, date: -1 }).limit(limit).lean().exec(callback);
}

function publicItem(n) {
    return { id: String(n._id), title: n.title, body: n.body || '', url: n.url || '',
             pinned: !!n.pinned, date: n.date, updated: n.updated || n.date };
}

module.exports = function(app) {
    function requireRoot(req, res, next) {
        if (req.session.user && req.session.user.user === 'root') { return next(); }
        res.redirect('/');
    }

    app.get('/root/news', requireRoot, function(req, res) {
        listNews(200, function(err, items) {
            var editing = null;
            if (req.query.edit) {
                editing = (items || []).filter(function(n) { return String(n._id) === req.query.edit; })[0] || null;
            }
            res.render('news', {
                title: 'News',
                items: items || [],
                editing: editing,
                notice: req.session.notice || null
            });
            req.session.notice = null;
        });
    });

    app.post('/root/news', requireRoot, function(req, res) {
        var News = REC.getNews();
        var done = function(msg) { req.session.notice = msg || null; res.redirect('/root/news'); };
        var action = req.body.action;
        if (action === 'create' || action === 'update') {
            var f = clean(req.body);
            if (!f.title) { return done('タイトルを入力してください'); }
            if (action === 'create') {
                f.author = req.session.user.user;
                return News.create(f).then(function() { done('お知らせを追加しました'); },
                                            function(e) { done('追加に失敗: ' + e.message); });
            }
            f.updated = new Date();
            return News.updateOne({ _id: req.body.id }, { $set: f }).then(function() { done('お知らせを更新しました'); },
                                                                        function(e) { done('更新に失敗: ' + e.message); });
        }
        if (action === 'delete') {
            return News.deleteOne({ _id: req.body.id }).then(function() { done('お知らせを削除しました'); },
                                                             function(e) { done('削除に失敗: ' + e.message); });
        }
        done(null);
    });
};

module.exports.listNews = listNews;
module.exports.publicItem = publicItem;
