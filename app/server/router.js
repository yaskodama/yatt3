var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var REC = require('./modules/records.js');
var mongoose = require('mongoose');

module.exports = function(app) {
    app.get('/', function(req, res){
        if (req.cookies.user == undefined || req.cookies.pass == undefined) {
	    var name = 'Guest';
	    var Access = REC.saveRecord(name,true,function(err){if(err){console.log(err);}});
	    REC.findLogin("tyass", req.session.id, res);
        } else {
    	    AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
	        if (o != null){
		    req.session.user = o;
		    res.redirect('/home');
		} else {
		    var name = 'Guest';
		    var Access = REC.saveRecord(name,true,function(err){if(err){console.log(err);}});
		    REC.findLogin("tyass", req.session.id, res);
		}
		});
	}
        });
    app.post('/', function(req, res){
        AM.manualLogin((req.body['user'] || req.query['user']), (req.body['pass'] || req.query['pass']), function(e, o){
	    if (!o){
		res.status(400).send(e);
	    } else {
		req.session.user = o;
		if ((req.body['remember-me'] || req.query['remember-me']) == 'true') {
		    res.cookie('user', o.user, { maxAge: 900000 });
		    res.cookie('pass', o.pass, { maxAge: 900000 });
		}
		res.status(200).send(o);
	    }
	});
        });
    app.get('/edit', function(req, res) {
        if (req.session.user == null){
	    res.redirect('/');
	} else {
            var Access = REC.saveRecord(req.session.user.user,true,function(err){if(err){console.log(err);}});
	    REC.findEdit(req.session.user.user, req.session.id, res);
	}
        });
    app.post('/edit', function(req, res) {
        if (req.session.user == null){
	    res.redirect('/');
	} else {
	    var Access = REC.saveRecord(req.session.user.user,true,function(err){if(err){console.log(err);}});
	    var Lectures = REC.getLectures();
	    var Classes = REC.getClasses();
	    if(req.body.delete === "true") {
		Lectures.update({name:req.session.user.user}, { $pull: { lecs: {week: req.body.i, time: req.body.j}}},
				{ upsert:false,multi:false}, function(err) {
		    if(err) {
			console.log(err);
			res.status(400).send(err);
		    } else {
			REC.findEdit(req.session.user.user, req.session.id, res);
		    }
		    });
	    } else if(req.body.delete === "list"&&req.body.Del === "OK") {
		Classes.remove({lecCode:req.body.Code}, {safe:true}, function(err){
		    if(err) {
			alert(err);
			console.log(err);
			res.status(400).send(err);
		    } else {
			;
		    }
		    });
		REC.findEdit(req.session.user.user, req.session.id, res);
	    } else if(req.body.delete == 'false' && req.body.lecCode != 'New') {
                REC.findLecture(req.body.lecCode,req.session.user.user,req.session.id,res);
	    } else if(req.body.delete == 'false' && req.body.lecCode == 'New') {
		var cls = { title: "New", lecCode: "New", lang: "en", objective: "New", reference: "Selecting...",
			    advreference: "Selecting...", textbook: "Selecting...", group: [], date: Date.Now };
		res.render('lecture',  { message: 'Lecture mode!', name: req.session.user.user,
			    id: req.session.id, cls: cls, i: req.body.i, j: req.body.j,
			    title: "Welcome to YaTT by "+ req.session.user.user });
	    } else {
		REC.findEdit(req.session.user.user, req.session.id, res);
	    }
	}
	});
    app.get('/lesson', function(req, res) {    /* /lesson + "GET" */
	var Classes = REC.getClasses();
	Classes.find({lecCode:req.query.p}, function(e,docs) {
	    if(docs[0]==undefined) {
		res.render('404', {title:'Page Not Found'});
	    } else {
		var Contents = REC.getContents();
		var cnts = [];
		Contents.find({}, function(e,d) {
		    if(d[0]==undefined) {
			res.render('404', {title: 'Page Not Found'});
		    } else {
			for(var i=0;i<50;i++) cnts[i]={ name:"", cntCode:"", sign:"", url:"" };
			var ii=0;
			docs[0].group.forEach(function(f) {
			    f.classes.forEach(function(c) {
				var n = 'None'; var s = 1; var u = "";
				for(i=0;i<d.length;i++) {
				    if(d[i].cntCode==c.name) {
					n = d[i].title; s = d[i].sign; u = d[i].url;
				    }
				}
				cnts[ii++]={ name: n, cntCode: c.name, sign: s, url: u };
				});
			    });
		    }
		    res.render('lesson', { message:'Lecture mode!',
		        id:req.session.id, cnts:cnts, cls:docs[0], title:"Welcome to YaTT" });
		    });
	    }
            });
	});
    app.get('/citem', function(req, res) {    /* /citem + "GET" */
	var Contents = REC.getContents();
	var cntCode = req.query.p;
	var userName = (req.session.user && req.session.user.user) || 'Guest';
	Contents.find({cntCode:cntCode}, function(e,docs) {
	    if(docs[0]==undefined) {
		// Auto-create a stub Contents doc so the user can fill it in.
		REC.newContents(cntCode, userName, '', function(err) {
		    if(err) { res.status(400).send(err); return; }
		    Contents.findOne({cntCode:cntCode}, function(e2, doc2) {
			if(!doc2) { res.render('404', {title:'Page Not Found'}); return; }
			res.render('citem', { message:'Contents mode!', name: userName,
			    id: req.session.id, contents: doc2, title: "Welcome to YaTT" });
		    });
		});
	    } else {
	        res.render('citem', { message:'Contents mode!', name: userName,
		    id: req.session.id, contents: docs[0], title: "Welcome to YaTT" });
	    }
            });
	});
    app.get('/lecture', function(req, res) {
        if (req.session.user == null) { res.redirect('/'); return; }
        var lecCode = req.query.p;
        if (!lecCode) { res.redirect('/edit'); return; }
        REC.findLecture(lecCode, req.session.user.user, req.session.id, res);
    });
    app.post('/lecture', function(req, res) {
        if (req.session.user == null){
            res.redirect('/');
        } else {
console.log(req.body.update);
console.log(req.body.lecCode);
console.log(req.body.title);
console.log(req.body.objective);
console.log(req.body.textbook);
console.log(req.body.reference);
console.log(req.body.advreference);
console.log(req.body.layout);
console.log(req.body.submit);
	    var Classes = REC.getClasses();
	    var Access = REC.saveRecord(req.session.user.user,true,function(err){if(err){console.log(err);}});
	    if(req.body.update === "true") {
		Classes.update({lecCode:req.body.lecCode},
		    { $set: { title:req.body.title,objective:req.body.objective,
			reference:req.body.reference,advreference:req.body.advreference,
		    	textbook: req.body.textbook }}, {upsert:false,multi:false}, function(err){
			if(err) {
			    console.log(err);
			    res.status(400).send(err);
			} else {
			        if(req.body.layout=='back') {
				    var Lectures = REC.getLectures();
				    Lectures.find({name:req.session.user.user}, function(err,docs) {
					var lecs = [];
					REC.setLecCode(docs,lecs);
					var Classes = REC.getClasses();
					Classes.find({}, function(err,docs) {
					    var leclist = [];
					    REC.setLecList(docs,leclist);
					    res.render('edit', { message: 'Edit mode!', name: req.session.user.user,
						id: req.session.id, lecs: lecs, leclist: leclist,
						title: "Welcome to YaTT by "+ req.session.user.user });
						});
					});
				} else {
				    Classes.find({lecCode:req.body.lecCode}, function(e,docs) {
					if(docs[0]==undefined) {
					    res.render('404',{title:'Page Not Found'});
					} else {
					    switch(req.body.layout) {
					    case 'true':
						res.render('clayout', { title : 'Welcome to YaTT by '+ req.session.user.user,
						    message: 'Edit Contents Layout:'+req.session.user.user,
							    name: req.session.user.user, cls: docs[0] } );
						break;
					    default:
						var Contents = REC.getContents();
						var cnts = [];
						Contents.find({}, function(e,d) {
						    d = d || [];
						    {
							for(var i=0;i<50;i++) cnts[i]={ name:"", cntCode:"", sign:"", url:"" };
							var ii=0;
							(docs[0].group || []).forEach(function(f) {
	       						    (f.classes || []).forEach(function(c) {
								var n = 'None'; var s = 1; var u = "";
								for(i=0;i<d.length;i++) {
								    if(d[i].cntCode==c.name) {
									n = d[i].title; s = d[i].sign; u = d[i].url;
								    }
								}
								cnts[ii++]={ name: n, cntCode: c.name, sign: s, url: u };
								});
							    });
							res.render('lecture', { message:'Lecture mode!',name:req.session.user.user,
								id:req.session.id, cnts:cnts, cls:docs[0],
								    title:"Welcome to YaTT by "+req.session.user.user});
						    }
						    });
					    }
					}
					});
				}
			}
		    });
            } else if(req.body.update === "create") {
		if(req.body.Code!='New') {
		    var Lectures = REC.getLectures();
		    Lectures.update({name:req.session.user.user},
			{ $push: { lecs: {week: req.body.i, time: req.body.j, lecCode: req.body.Code} } },
			{ upsert:false,multi:false}, function(err) {
			if(err) {
			    console.log(err);
			    res.status(400).send(err);
			} else {
			    var Classes = REC.newClasses(req.body.Code,req.session.user.user,function(e) {
				if(e){
			            console.log(e);
				    res.status(400).send(e);
			    	} else {
				    REC.findLecture(req.body.Code,req.session.user.user,req.session.id,res);
				}
				});
			}});
		}
	    }
	}
	});
    app.get('/home', function(req, res) {
        if (req.session.user == null){
	    // if user is not logged-in redirect back to login page //
	    res.redirect('/');
	} else {
	    var Access = REC.saveRecord(req.session.user.user,true,function(err){if(err){console.log(err);}});
	    var Lectures = REC.getLectures();
	    var Classes = REC.getClasses();
	    Lectures.find({name:req.session.user.user}, function(err,docs) {
		if(docs[0]==undefined) {
		    var Lectures = REC.saveLectures(req.session.user.user,function(err){
			if(err) {
			    res.status(400).send(err);
			} else {
			    REC.findHome(req.session.user.user,req.session.id,res);
			}
			});
		} else {
		    REC.findHome(req.session.user.user,req.session.id,res);
		}
		});
	}
	});
    app.post('/home', function(req, res){
        if ((req.body['user'] || req.query['user']) != undefined) {
    	    AM.update({
	        user 		: (req.body['user'] || req.query['user']),
	        name 		: (req.body['name'] || req.query['name']),
		email 		: (req.body['email'] || req.query['email']),
		country 	: (req.body['country'] || req.query['country']),
		pass		: (req.body['pass'] || req.query['pass'])
	    }, function(o){
		if (o){
		    req.session.user = o;
		    if (req.cookies.user != undefined && req.cookies.pass != undefined){
       			res.cookie('user', o.user, { maxAge: 900000 });
			res.cookie('pass', o.pass, { maxAge: 900000 });	
		    }
		    res.status(200).send('ok');
		} else {
		    res.status(400).send('error-updating-account');
		}
	    });
	} else if ((req.body['logout'] || req.query['logout']) == 'true'){
	    res.clearCookie('user');
	    res.clearCookie('pass');
	    req.session.destroy(function(e){ res.status(200).send('ok'); });
	}
	});
    app.get('/signup', function(req, res) {
	res.render('signup', { title: 'Signup', countries : CT } );
	});
    app.post('/signup', function(req, res){
	AM.signup({
	    name 	: (req.body['name'] || req.query['name']),
	    email 	: (req.body['email'] || req.query['email']),
	    user 	: (req.body['user'] || req.query['user']),
	    pass	: (req.body['pass'] || req.query['pass']),
	    country : (req.body['country'] || req.query['country'])
	}, function(e, o){
	    if (e){
		res.status(400).send(e);
	    } else {
		res.status(200).send('ok');
	    }
	});
	});
    app.post('/lost-password', function(req, res){
    // look up the user's account via their email //
	AM.getEmail((req.body['email'] || req.query['email']), function(o){
	    if (o){
		res.status(200).send('ok');
		EM.dispatchResetPasswordLink(o, function(e, m){
		// this callback takes a moment to return //
		// should add an ajax loader to give user feedback //
		    if (!e) {
		//	res.status(200).send('ok');
		    } else {
		    	res.status(400).send('email-server-error');
		    	for (k in e) console.log('error : ', k, e[k]);
		    }
	        });
	    } else {
		res.status(400).send('email-not-found');
	    }
	});
	});
    app.get('/reset-password', function(req, res) {
	var email = req.query["e"];
	var passH = req.query["p"];
	AM.validateLink(email, passH, function(e){
	    if (e != 'ok'){
		res.redirect('/');
	    } else {
	// save the user's email in a session instead of sending to the client //
		req.session.reset = { email:email, passHash:passH };
		res.render('reset', { title : 'Reset Password' });
	    }
	})
	});
    app.post('/reset-password', function(req, res) {
	var nPass = (req.body['pass'] || req.query['pass']);
	// retrieve the user's email from the session to lookup their account and reset password //
	var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
	req.session.destroy();
	AM.setPassword(email, nPass, function(o){
	    if (o){
	    	res.status(200).send('ok');
	    } else{
	    	res.status(400).send('unable to update password');
	    }
	})
        });
    app.get('/print', function(req, res) {
	AM.getAllRecords( function(e, accounts){
	    res.render('print', { title : 'Account List', accts : accounts } );
	})
        });
    function cdelete(grp,num) {
	num++;
	var n = [];
	if(grp.length == 1 && num == 1) {
	    n = [ {'name': 'New', 'classes': [ {'name': 'None' } ] } ];
	} else {
	    if(num!=grp.length) {
		for(var i=0; i<grp.length; i++) {
		    if(num>i) n[i]=grp[i];
		    else n[i-1]=grp[i];
		}
	    } else {
		for(var i=0; i<(grp.length-1); i++) {
		    n[i]=grp[i];
		}
	    }
	}
    	return n;
    }
    function duplicate(grp,num) {
        num++;
        var n = [];
        for(var i=0; i<grp.length; i++) {
	    if(num>i) n[i]=grp[i];
	    else n[i+1]=grp[i];
	}
	n[num]=grp[num-1];
	return n;
    }
    function iduplicate(grp,inum,jnum) {
	var classes = grp[inum].classes;
	var cret = duplicate(classes,jnum);
	grp[inum].classes = cret;
	return grp;
    }
    function idelete(grp,inum,jnum) {
	var classes = grp[inum].classes;
	var cret = [];
	if( classes.length == 1 && jnum == 0 ) {
	    cret = [{ 'name' : 'None' }];
	} else {
	    cret = cdelete(classes,jnum);
	}
	grp[inum].classes = cret;
	return grp;
    }
    app.get('/clayout', function(req, res) {
        if (req.session.user == null) { res.redirect('/'); return; }
        var Classes = REC.getClasses();
        Classes.find({lecCode: req.query.p}, function(e, docs) {
            if (docs[0] == undefined) {
                res.render('404', {title: 'Page Not Found'});
            } else {
                res.render('clayout', { title : 'Contents Layout',
                    message: 'Edit Contents Layout:' + req.session.user.user,
                    name: req.session.user.user, cls: docs[0] });
            }
        });
    });
    app.post('/clayout', function(req, res) {
        if (req.session.user == null){
            res.redirect('/');
        } else {
console.log('clayout - post');
console.log(req.body.delete);
console.log('--- lecCode ----');
console.log(req.body.lecCode);
console.log('--- lecCode ----');
console.log(req.body.i);
console.log(req.body.j);
for(i=0;i<req.body.glength;i++) {
    console.log(req.body['mgroup'+i]);
}
	    var Classes = REC.getClasses();
	    var Access = REC.saveRecord(req.session.user.user,true,function(err){if(err){console.log(err);}});
	    var newCls = JSON.parse(req.body.cls);
	    var flag = false;
	    for(var i=0; i<req.body.glength; i++) {
		newCls.group[i].name=req.body['mgroup'+i];
	    }
	    // Apply class-item renames captured from textareas via clayout.js.
	    for(var ii=0; ii<newCls.group.length; ii++) {
		var classes = newCls.group[ii].classes || [];
		for(var jj=0; jj<classes.length; jj++) {
		    var key = 'mclass_' + ii + '_' + jj;
		    if(req.body[key] !== undefined && req.body[key].length > 0) {
			newCls.group[ii].classes[jj].name = req.body[key];
		    }
		}
	    }
	    if(req.body.delete === "cgroup" && req.body.submit === "OK") {
		var grp = duplicate(newCls.group,req.body.i);
		flag = true;
	    } else if(req.body.delete === "dgroup" && req.body.submit === "OK") {
		var grp = cdelete(newCls.group,req.body.i);
		flag = true;
	    } else if(req.body.delete === "citem" && req.body.submit === "OK") {
		var grp = iduplicate(newCls.group,req.body.i,req.body.j);
		flag = true;
	    } else if(req.body.delete === "ditem" && req.body.submit === "OK") {
		var grp = idelete(newCls.group,req.body.i,req.body.j);
		flag = true;
	    } else if(req.body.delete === "update" || req.body.delete === "back" ) {
		var grp = newCls.group;
		flag = true;
	    } else if(req.body.delete === "ncontents" || req.body.delete === "contents" ) {
		var grp = newCls.group;
	    }
	    if(flag) {
		    Classes.update( {lecCode:req.body.lecCode},
			{ $set: {group:grp} }, {upsert:false,multi:false}, function(err) {
			if(err) {
			    console.log(err);
			    res.status(400).send(err);
			} else {
			    if(req.body.delete==='back') {
				REC.findLecture(req.body.lecCode,req.session.user.user,req.session.id,res);
			    } else {
				Classes.find({lecCode:req.body.lecCode}, function(e,docs) {
				    if(docs[0]==undefined) {
				    	res.render('404',{title:'Page Not Found'});
				    } else {
				    	res.render('clayout', { title : 'Contents Layout',
					    message: 'Edit Contents Layout:'+req.session.user.user,
					    name: req.session.user.user,
					    cls: docs[0] } );
				    }
				    });
			    }
			}
			});
	    } else {
		if(req.body.delete==='contents') {
		    var Contents = REC.getContents();
		    Contents.find({cntCode:req.body.Code}, function(e,docs) {
			if(docs[0]==undefined) {
			    res.render('404',{title:'Page Not Found'});
			} else {
			    res.render('contents', { message: 'Contents mode!', name:req.session.user.user,
			    id:req.session.id, contents:docs[0],
			    lecCode: newCls.lecCode,
			    title: 'Welcome to YaTT by '+ req.session.user.user });
			}
			});
		} else if(req.body.delete==='ncontents') {
		    Classes.find({lecCode:req.body.lecCode}, function(err,docs) {
			if(docs[0]==undefined) {
			   res.render('404', {title: 'Page Not Found'});
			} else {
			    var Contents = REC.getContents();
			    var contents = new Contents();
			    contents.title = 'New';
			    contents.cntCode = 'New';
			    contents.sign = 0;
			    contents.lang = 'ja';
			    contents.url = "http://yahoo.co.jp/";
			    res.render('contents', { message: 'Contents mode!', name: req.session.user.user,
				id: req.session.id, contents: contents, ii: req.body.i, jj: req.body.j, cls: docs[0],
				title: "Welcome to YaTT by "+ req.session.user.user });
			}
			});
		} else {
		    Classes.find( {lecCode:req.body.lecCode}, function(e,docs) {
		    	if(docs[0]==undefined) {
			    res.render('404',{title:'Page Not Found'});
		    	} else {
			    res.render('clayout', { title : 'Contents Layout',
			    	message: 'Edit Contents Layout:'+req.session.user.user,
			    	name: req.session.user.user, cls: docs[0] } );
		    	}
			});
		}
	    }
	}
	});
    app.post('/contents', function(req, res) {
        if (req.session.user == null){
            res.redirect('/');
        } else {
console.log('contents - post');
console.log(req.body.update);
console.log(req.body.title);
console.log(req.body.url);
console.log(req.body.Code);
console.log(req.body.i);
console.log(req.body.j);
console.log('--- lecCode ----');
console.log(req.body.lecCode);
console.log('--- lecCode ----');
console.log(req.body.group);
console.log(req.body.type);
	    var Contents = REC.getContents();
	    var Classes = REC.getClasses();
	    var flag = false;
	    if(req.body.update === 'create') {
	        var newGrp = JSON.parse(req.body.group);
		if(req.body.Code!='New') {
		    newGrp[req.body.i].classes[req.body.j] = { name: req.body.Code };
		    Classes.update( {lecCode:req.body.lecCode},
			{ $set: {group:newGrp} }, {upsert:false,multi:false}, function(err) {
			if(err) {
			    console.log(err);
			    res.status(400).send(err);
			} else {
			    REC.newContents(req.body.Code,req.session.user.user,req.body.url,function(e) {
				if(e) {
				    console.log(e);
				    res.status(400).send(e);
				} else {
				    Contents.find({cntCode:req.body.Code}, function(e,docs) {
					if(docs[0]==undefined) {
					    res.render('404',{title:'Page Not Found'});
					} else {
					    res.render('contents', { message: 'Contents mode!',
							name:req.session.user.user, lecCode: req.body.lecCode,
						id:req.session.id, contents:docs[0],
						title: 'Welcome to YaTT by '+ req.session.user.user });
			    		}
					});
				}
				});
			}
			});
		}
	    } else if(req.body.update === 'update') {
		Contents.update({cntCode:req.body.Code},
		    { $set: {url:req.body.url,title:req.body.title,sign:req.body.type} },
		    {upsert:false,multi:false}, function(err) {
		    if(err) {
			console.log(err);
			res.status(400).send(err);
		    } else {
			Contents.find({cntCode:req.body.Code}, function(e,docs) {
			    if(docs[0]==undefined) {
				res.render('404',{title:'Page Not Found'});
			    } else {
				res.render('contents', { message: 'Contents mode!', name:req.session.user.user,
				    id:req.session.id, contents:docs[0], lecCode: req.body.lecCode,
				    title: 'Welcome to YaTT by '+ req.session.user.user });
			    }
			    });
		    }
		    });
	    } else if(req.body.update === 'back') {
		Contents.update({cntCode:req.body.Code},
		    { $set: {url:req.body.url,title:req.body.title,sign:req.body.type} },
		    {upsert:false,multi:false}, function(err) {
		    if(err) {
			console.log(err);
			res.status(400).send(err);
		    } else {
			REC.findEdit(req.session.user.user, req.session.id, res);
		    }
		    });
	    } else if(req.body.update === 'layback') {
		Contents.update({cntCode:req.body.Code},
		    { $set: {url:req.body.url,title:req.body.title,sign:req.body.type} },
		    {upsert:false,multi:false}, function(err) {
		    if(err) {
			console.log(err);
			res.status(400).send(err);
		    } else {
			Classes.find( {lecCode:req.body.lecCode}, function(e,docs) {
		    	    if(docs[0]==undefined) {
			    	res.render('404',{title:'Page Not Found'});
			    } else {
			    	res.render('clayout', { title : 'Contents Layout',
			    	    message: 'Edit Contents Layout:'+req.session.user.user,
			    	    name: req.session.user.user, cls: docs[0] } );
			    }
			    });
		    }
		    });
            }
	}
	});
    app.get('/admin', function(req, res) {
	var Contents = REC.getContents();
	Contents.find({}, function(err,cnts) {
	    var Lectures = REC.getLectures();        
	    Lectures.find({}, function(err,lecs) {
	    	var Classes = REC.getClasses();
	    	Classes.find({}, function(err,docs) {
		    var leclist = [];
		    REC.setLecList(docs,leclist);
		    var Access = REC.getAccess();
		    Access.find({}, function(err,docs) {
	    	    	AM.getAllRecords( function(e, accounts) {
			    res.render('admin', { title : 'Administration', cnts:cnts, accts:accounts,
			    	logs: docs, lecs: lecs, leclist: leclist } );
			    });
			});
		    });
		});
	    });
	});
    app.post('/admin', function(req, res) {
	var Contents = REC.getContents();
	var Accounts = AM.getAccounts();
	var Access = REC.getAccess();
        var Lectures = REC.getLectures();
	var Classes = REC.getClasses();
        if(req.body.delete === "true" && req.body.submit === "OK") {
	    Access.remove({_id:req.body.id}, {safe:true}, function(err){if(err){console.log(err);}});
        } else if(req.body.delete === "lecs" && req.body.submit === "OK") {
            Lectures.remove({name:req.body.user}, {safe:true}, function(err){if(err){console.log(err);}});
        } else if(req.body.delete === "list" && req.body.submit === "OK") {
            Classes.remove({lecCode:req.body.Code}, {safe:true}, function(err){if(err){cosole.log(err);}});
        } else if(req.body.delete === "accts" && req.body.submit === "OK") {
            Accounts.remove({user:req.body.user}, {safe:true}, function(err){if(err){cosole.log(err);}});
	} else if(req.body.delete === "contents" && req.body.submit === "OK") {
            Contents.remove({cntCode:req.body.Code}, {safe:true}, function(err){if(err){cosole.log(err);}});
	}
	var Contents = REC.getContents();
	Contents.find({}, function(err,cnts) {
	    Lectures.find({}, function(err,lecs) {
	    	Classes.find({}, function(err,docs) {
		    var leclist = [];
		    REC.setLecList(docs,leclist);
		    Access.find({}, function(err,docs) {
		    	AM.getAllRecords( function(e, accounts) {
			    if(!e) {
			    	res.render('admin', { title : 'Administration', cnts:cnts, accts:accounts,
			            logs: docs, lecs: lecs, leclist: leclist } );
			    } else {
			    	res.status(400).send('accounts not found');
			    }
			    });
			});
		    });
		});
	    });
	});
    app.post('/delete', function(req, res){
        AM.delete(req.body.id, function(e, obj){
	    if (!e){
	    	res.clearCookie('user');
	    	res.clearCookie('pass');
	    	req.session.destroy(function(e){ res.status(200).send('ok'); });
	    } else {
		res.status(400).send('record not found');
	    }
	});
	});
    app.get('/reset', function(req, res) {
	AM.delAllRecords( );
	res.redirect('/print');
        });
    app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });
};
