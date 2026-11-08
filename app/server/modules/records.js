var REC = {};
var mongoose = require('mongoose');
var mongoUri = process.env.MONGOLAB_URI ||
		process.env.MONGOHQ_URL ||
	    'mongodb://localhost/login';
/* heroku */
//var db = mongoose.createConnection();
/* heroku */
// MONGODB_URI (e.g. Atlas, no db name in path) on Heroku; local mongod otherwise.
var db = mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://127.0.0.1/', { dbName: process.env.YATT_DB || 'yatt' });
var Schema = mongoose.Schema;
/* heroku */
//db.open(mongoUri,function(err){
//	if(err){
//	    console.error(err);
//	    process.exit(1);
//	}
//    });
/* heroku */

/* Access */
var accessSchema = new mongoose.Schema({ name: { type: String, required: true },
			    login:{ type: Boolean, required: true },
					 date: { type: Date, default: Date.now } });
var Access = db.model('Access', accessSchema);
/* Lecture */
var fixlecSchema = new mongoose.Schema( { week:{type:Number,required:true}, time:{ type:Number, required: true },
                                     lecCode: { type: String, required: true } } );
var lecturesSchema = new mongoose.Schema( 
			    { name: { type:String,required:true}, lecs:[fixlecSchema], events:[fixlecSchema],
				       date: { type: Date, default: Date.now } } );
var Lectures = db.model('Lectures', lecturesSchema);
/* Class */
var fixcontentSchema = new mongoose.Schema({name:{type:String,required:true}, date:{type:Date,default:Date.now}});
var fixgroupSchema = new mongoose.Schema( {name:{type: String,required: true}, classes:[fixcontentSchema]});
var classSchema = new mongoose.Schema( { lecCode: { type: String, required: true },
				    title: { type: String,required: true },
                                    lang: { type: String, required: true },
				    author: { type: String, required: true },
				    group: [fixgroupSchema], objective: { type: String, required: true },
				    textbook:{ type:String,required:true },
				    reference:{type: String,required:true },
				    advreference: { type: String, required: true },
				    date: { type: Date, default: Date.now } } );
var Classes = db.model('Classes', classSchema);
/* Contents */
var fixitemsSchema = new mongoose.Schema({name:{type:String,required:true}, video: {type: String}, picture: {type: String},
    items: [], date:{type:Date,default:Date.now}});
var fixpageSchema = new mongoose.Schema({name:{type:String,required:true}, video: {type: String}, picture: {type: String},
    groups: [fixitemsSchema], date:{type:Date,default:Date.now}});

var contentsSchema = new mongoose.Schema( { cntCode: { type:String,required: true }, lang: {type:String, required: true },
					    title: { type: String, required: true }, sign: {type:Number,required:true},
					    author: { type: String, required: true },
					    url: { type: String }, menu: [], pages: [fixpageSchema] });

var Contents = db.model('Contents',contentsSchema);
module.exports = REC;

REC.saveRecord = function(name,login_flag,callback) {
    var access = new Access();
    access.name = name;
    access.login = login_flag;
    access.save(callback);
    return Access;
  };
REC.getAccess = function() {
    return Access;
  };
REC.saveRecord2 = function(mongoose,name,login_flag,save_flag,callback) {
    var access = new Access();
    access.name = name;
    access.login = login_flag;
    if(save_flag) access.save(callback);
    return Access;
  };
REC.findRecord = function(mongoose,Access,name) {
    Access.find({name:name}, function(err,docs) {
	for(var i=0, size=docs.length; i<size; ++i) {
	    console.log(docs[i].name+'['+docs[i].login+']'+docs[i].date);
	}
    });
  };
REC.saveLectures = function(name,callback) {
    var lecs = [ {week: 0, time: 1, lecCode: "HOSE0001"}, {week: 1, time: 0, lecCode: "CHIT0002"},
		 {week: 1, time: 1, lecCode: "CHIT0002"}, {week: 1, time: 2, lecCode: "CHIT0002"},
		 {week: 1, time: 1, lecCode: "CHIT0002"}, {week: 2, time: 1, lecCode: "HOIE0003"} ];
    var lectures = new Lectures();
    lectures.name = name;
    lectures.lecs = lecs;
    lectures.events = [];
    lectures.save(callback);
    return Lectures;
  };
/*
REC.saveClasses = function(mongoose,name,callback) {
    var fixgroupSchema = new Schema( { name: { type: String, required: true }, classes: [fixcontentSchema] } );
    var classSchema = new Schema( { lecCode: { type: String, required: true },title: { type: String,required:true },
                                    lang: { type: String, required: true },
				    author: { type: String, required: true },
				    group: [fixgroupSchema], objective: { type: String, required: true },
				    textbook: { type: String, required: true },
				    reference: { type: String, required: true },
				    advreference: { type: String, required: true },
				    date: { type: Date, default: Date.now } } );
    var Classes = db.model('Classes', classSchema);
    var classes = new Classes();
    classes.lecCode = "CHIT0002";
    classes.group = [ { name: "Introduction", classes: [ { name: "Introduction" } ] },
		      { name: "HowToUseEMail", classes: [ { name: "HowToUseEMail"} ] },
                      { name: "AboutDocumentProcessing", classes: [ { name: "DcomentProcessing" },
			    { name: "No1DocumentProcessing" }, { name: "No2DocumentProcessing" } ] },
			    { name: "HowToUsePowerPoint", classes: [ { name: "No1PowerPoint" },
			    { name: "No2PowerPoint" } ] },
		      { name: "HowToUseExcel", classes: [ { name: "No1Excel" }, { name: "No2Excel" },
			    { name: "No3Excel" },{ name: "No4Excel" }, { name: "No5Excel" },
			    { name: "No6Excel"}, { name: "No7Excel"} ] } ];
    classes.title = "Basic Informatics";
    classes.lang = "en";
    classes.objective = "You can learn about basic operations of PC.";
    classes.reference = "Searching";
    classes.advreference = "Searching";
    classes.textbook = "Searching";
    classes.save(callback);
    return Classes;
  };
 */
REC.saveClasses = function(mongoose,name,callback) {
    var classes = new Classes();
    classes.lecCode = "HOIE0003";
    classes.group = [ { name: "はじめに", classes: [ { name: "はじめに" } ] },
		      { name: "メールの使い方", classes: [ { name: "メールの使い方"} ] },
                      { name: "文書処理について", classes: [ { name: "文書処理" },{ name: "(1)文書処理" }, 
				{ name: "(2)文書処理" } ] },
		      { name: "パワーポイントの使い方", classes: [ { name: "(1)パワーポイントの使い方" },
								   { name: "(2)パワーポイントの使い方" } ] },
		      { name: "エクセルの使い方", classes: [ { name: "(1)エクセル" }, { name: "(2)エクセル" }, 
				{ name: "(3)エクセル" }, { name: "(4)エクセル" }, { name: "(5)エクセル" },
				{ name: "(6)エクセル"}, { name: "(7)エクセル"} ] } ];
    classes.title = "情報学基礎";
    classes.lang = "ja";
    classes.author = name;
    classes.objective = "この講義では簡単な<br>PCの使い方を説明する。";
    classes.reference = "検討中";
    classes.advreference = "検討中";
    classes.textbook = "検討中";
    classes.save(callback);
    return Classes;
  };

REC.newClasses = function(lecCode,name,callback) {
    Classes.find({lecCode:lecCode}, function(e,docs) {
        if(docs[0]==undefined) {
	    var classes = new Classes();
	    classes.lecCode = lecCode;
	    classes.author = name;
	    // Use unique default item names so each session links to its own content page.
	    classes.group = [ { name: "Intro",       classes: [ { name: lecCode + "-1-1" } ] },
			      { name: "Background",  classes: [ { name: lecCode + "-2-1" } ] },
			      { name: "Background2", classes: [ { name: lecCode + "-3-1" } ] } ];
	    classes.title = "New";
	    classes.lang = "ja";
	    classes.objective = "Nothing...";
	    classes.reference =  "Searching...";
	    classes.advreference = "Searching...";
	    classes.textbook = "Searching...";
	    classes.save(callback);
	} else {
	    docs[0].save(callback);
	}
        return Classes;
	});
  };

REC.newContents = function(cntCode,name,url,callback) {
    Contents.find({cntCode:cntCode}, function(e,docs) {
        if(docs[0]==undefined) {
	    var contents = new Contents();
	    contents.cntCode = cntCode;
	    contents.author = name;
	    contents.title = 'New';
	    contents.url = url;
	    contents.menu = [];
	    contents.pages = [];
	    contents.sign = 0;
	    contents.lang = 'ja';
	    contents.save(callback);
	} else {
	    docs[0].save(callback);
	}
        return Contents;
	});
  };

REC.getLectures = function() {
    return Lectures;
};

REC.getContents = function() {
    return Contents;
};

REC.getClasses = function() {
    return Classes;
};

REC.setLecList = function(docs,leclist) {
    var i=0;
    docs.forEach(function(f) {
	    leclist[i++] = { lecCode: f.lecCode, title: f.title, author: f.author, lang: f.lang, date: f.date };
	});
};

REC.setLecCode = function(docs,lecs) {
    for(var i=0; i<30; i++) lecs[i]="";
    // Accounts with no Lectures (e.g. a fresh root) yield empty docs — guard
    // against docs[0]/lecs being undefined so login doesn't crash the process.
    if(!docs || !docs[0] || !docs[0].lecs) return;
    docs[0].lecs.forEach(function(f) {
	lecs[f.week*5+f.time] = f.lecCode;
	});
};

REC.findHome = function(user,id,res) {
    Lectures.find({name:user}, function(err,docs) {
	docs = docs || [];
	if(docs[0]==undefined) {
	    res.render('404', {title: 'Page Not Found'});
	} else {
	    var lecs = [];
	    for(var i=0; i<30; i++) lecs[i]={ name: "", lecCode: "" };
	    Classes.find({author:user}, function(err,d) {
		d = d || [];
		if(d[0]==undefined) {
		    docs[0].lecs.forEach(function(f) {
			lecs[f.week*5+f.time] = { name: 'None', lecCode: f.lecCode };
			});
		} else {
		    docs[0].lecs.forEach(function(f) {
			var n = 'None';
			for(i=0;i<d.length;i++)
			    if(d[i].lecCode==f.lecCode) {
				n = d[i].title;
			    }
			    lecs[f.week*5+f.time] = { name:n, lecCode:f.lecCode };
			});
		}
		res.render('home', { message: 'New User:'+user,
		    name: user, id: id, lecs: lecs, 
		    title: "Welcome to YaTT by "+ user });
		});
	}
	});
};

// Build the 30-slot lecs array for a user's public time-table (read-only),
// without rendering — used by the /api/timetable/:user fragment endpoint.
REC.buildUserLecs = function(user, callback) {
    var lecs = [];
    for(var i=0; i<30; i++) lecs[i]={ name: "", lecCode: "" };
    Lectures.find({name:user}, function(err,docs) {
	docs = docs || [];
	if(docs[0]==undefined) { return callback(lecs); }
	Classes.find({author:user}, function(err,d) {
	    d = d || [];
	    if(d[0]==undefined) {
		docs[0].lecs.forEach(function(f) {
		    lecs[f.week*5+f.time] = { name: 'None', lecCode: f.lecCode };
		    });
	    } else {
		docs[0].lecs.forEach(function(f) {
		    var n = 'None';
		    for(var i=0;i<d.length;i++)
			if(d[i].lecCode==f.lecCode) { n = d[i].title; }
		    lecs[f.week*5+f.time] = { name:n, lecCode:f.lecCode };
		    });
	    }
	    callback(lecs);
	    });
	});
};

REC.findLogin = function(user,id,res,users) {
    users = users || [];
    var emptyLecs = [];
    for(var i=0; i<30; i++) emptyLecs[i]={ name: "", lecCode: "" };

    Lectures.find({name:user}, function(err,docs) {
	docs = docs || [];
	if(docs[0]==undefined) {
	    res.render('login', { message: 'New User:',
		name: '', owner: user, id: id, lecs: emptyLecs, users: users, title: "Welcome to YaTT - Please Login To Your Account" });
	} else {
	    var lecs = [];
	    for(var i=0; i<30; i++) lecs[i]={ name: "", lecCode: "" };
	    Classes.find({author:user}, function(err,d) {
		d = d || [];
		if(d[0]==undefined) {
		    docs[0].lecs.forEach(function(f) {
			lecs[f.week*5+f.time] = { name: 'None', lecCode: f.lecCode };
			});
		} else {
		    docs[0].lecs.forEach(function(f) {
			var n = 'None';
			for(i=0;i<d.length;i++)
			    if(d[i].lecCode==f.lecCode) {
				n = d[i].title;
			    }
			    lecs[f.week*5+f.time] = { name:n, lecCode:f.lecCode };
			});
		}
		res.render('login', { message: 'New User:',
		    name: user, owner: user, id: id, lecs: lecs, users: users, title: "Welcome to YaTT - Please Login To Your Account" });
		});
	}
	});
};

REC.findEdit = function(user,id, res) {
    Lectures.find({name:user},function(err,docs) {
    var lecs = [];
    REC.setLecCode(docs,lecs);
    var Classes = REC.getClasses();
    Classes.find({}, function(err,docs) {
	var leclist = [];
	REC.setLecList(docs,leclist);
	res.render('edit', { message: 'Edit mode!', name: user, id: id,
	    lecs: lecs, leclist: leclist, title: "Welcome to YaTT by "+ user });
	});
	});
};

REC.findLecture = function(Code,user,id,res) {
    var Classes = REC.getClasses();
    Classes.find({lecCode:Code}, function(err,docs) {
	docs = docs || [];
	if(docs[0]==undefined) {
	    res.render('404', {title: 'Page Not Found'});
	    return;
	}
	var Contents = REC.getContents();
	Contents.find({}, function(e,d) {
	    d = d || [];
	    var cnts = [];
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
	    res.render('lecture', { message:'Lecture mode!', name:user,
		id:id, cnts:cnts, cls:docs[0], title:"Welcome to YaTT" });
	});
    });
};


