var bcrypt = require('bcryptjs')
var mongoose = require('mongoose');
/* heroku */
//var db = mongoose.createConnection();
/* heroku */
var db = mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://127.0.0.1/', { dbName: process.env.ACCOUNTS_DB || 'login-testing' });
var Schema = mongoose.Schema;
var mongoUri = process.env.MONGOLAB_URI ||
		process.env.MONGOHQ_URL ||
	    'mongodb://localhost/login';

// Define the schema and model once at module load to avoid OverwriteModelError.
var accountsSchema = new Schema({ name:    { type: String, required: true },
                                  email:   { type: String, required: true },
                                  user:    { type: String, required: true },
                                  pass:    { type: String, required: true },
                                  country: { type: String, required: true },
                                  date:    { type: String, required: true } });
var Accounts = db.model('Accounts', accountsSchema);
/* heroku */
//db.open(mongoUri,function(err){
//	if(err){
//	    console.error(err);
//	    process.exit(1);
//	}
//    });
/* heroku */

// use moment.js for pretty date-stamping //
var moment = require('moment');
var AM = {}; 

//process.on('SIGINT', function() { mongoose.disconnect(); });

/* for heroku */
//	AM.db = new Db(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}, {}));
/* for heroku */
//	AM.db.open(function(e, d){
//		if (e) {
//			console.log(e);
//		}	else{
//			console.log('connected to database :: ' + dbName);
//		}
//		});
/* for heroku */
//	AM.accounts = AM.db.collection('accounts');

module.exports = AM;

AM.autoLogin = function(user, pass, callback) {
    Accounts.findOne({user:user}, function(e, o) {
    		if (o){
    			o.pass == pass ? callback(o) : callback(null);
    		}	else{
    			callback(null);
    		}
        });
}

AM.manualLogin = function(user, pass, callback) {
    Accounts.findOne({user:user}, function(e, o) {
        if (o == null){
            callback('user-not-found');
	} else {
	    bcrypt.compare(pass, o.pass, function(err, res) {
		if (res){
console.log('OK!');
		    callback(null, o);
		} else {
		    callback('invalid-password');
		}
		});
        }
    	});
}

// record insertion, update & deletion methods //
AM.signup = function(newData, callback)
{
    var accounts = new Accounts();
    Accounts.findOne({user:newData.user}, function(e, o) {
	if (o) {
    	    callback('username-taken');
	} else {
    	    Accounts.findOne({email:newData.email}, function(e, o) {
    		if (o) {
    		    callback('email-taken');
    		} else {
    		    AM.saltAndHash(newData.pass, function(hash){
    			newData.pass = hash;
    			// append date stamp when record was created //
    			newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
			accounts.name = newData.name;
			accounts.email = newData.email;
			accounts.user = newData.user;
			accounts.pass = hash;
			accounts.country = newData.country;
			accounts.date = moment().format('MMMM Do YYYY, h:mm:ss a');
    			accounts.save(callback(null));
			});
    		}
		});
	}
    	});

    //	AM.accounts.findOne({user:newData.user}, function(e, o) {
    //		if (o){
    //			callback('username-taken');
    //		}	else{
    //			AM.accounts.findOne({email:newData.email}, function(e, o) {
    //				if (o){
    //					callback('email-taken');
    //				}	else{
    //					AM.saltAndHash(newData.pass, function(hash){
    //						newData.pass = hash;
    //					// append date stamp when record was created //
    //						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
    //						AM.accounts.insert(newData, callback(null));
    //					});
    //				}
    //			});
    //		}
    //	});
}

AM.update = function(newData, callback)
{
    Accounts.findOne({user:newData.user}, function(e, o){
    		o.name 		= newData.name;
    		o.email 	= newData.email;
    		o.country 	= newData.country;
    		if (newData.pass == ''){
    			o.save(null); callback(o);
    		}	else{
    			AM.saltAndHash(newData.pass, function(hash){
    				o.pass = hash;
    				o.save(null); callback(o);
    			});
    		}
    	});

    //	AM.accounts.findOne({user:newData.user}, function(e, o){
    //		o.name 		= newData.name;
    //		o.email 	= newData.email;
    //		o.country 	= newData.country;
    //		if (newData.pass == ''){
    //			AM.accounts.save(o); callback(o);
    //		}	else{
    //			AM.saltAndHash(newData.pass, function(hash){
    //				o.pass = hash;
    //				AM.accounts.save(o); callback(o);
    //			});
    //		}
    //	});
}

AM.setPassword = function(email, newPass, callback)
{
    Accounts.findOne({email:email}, function(e, o){
    		AM.saltAndHash(newPass, function(hash){
    			o.pass = hash;
    			o.save(null); callback(o);
    		});
    	});

    //	AM.accounts.findOne({email:email}, function(e, o){
    //		AM.saltAndHash(newPass, function(hash){
    //			o.pass = hash;
    //			AM.accounts.save(o); callback(o);
    //		});
    //	});
}

AM.validateLink = function(email, passHash, callback)
{
    Accounts.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
        callback(o ? 'ok' : null);
	});

    //	AM.accounts.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
    //		callback(o ? 'ok' : null);
    //	});
}

AM.saltAndHash = function(pass, callback)
{
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(pass, salt, function(err, hash) {
			callback(hash);
		});
	});
}

AM.delete = function(id, callback)
{
    Accounts.remove({_id: this.getObjectId(id)}, callback);
    //    AM.accounts.remove({_id: this.getObjectId(id)}, callback);
}

// auxiliary methods //

AM.getEmail = function(email, callback)
{
    Accounts.findOne({email:email}, function(e, o){ callback(o); });
    //	AM.accounts.findOne({email:email}, function(e, o){ callback(o); });
}

AM.getObjectId = function(id)
{
	return AM.accounts.db.bson_serializer.ObjectID.createFromHexString(id)
}

AM.getAccounts = function() {
    return Accounts;
}

AM.getAllRecords = function(callback)
{
    Accounts.find({},function(err,docs) {
	    console.log(docs);
	    if (err) callback(err)
		else callback(null, docs)
	 });

    //	AM.accounts.find().toArray(
    //		function(e, res) {
    //		if (e) callback(e)
    //		else callback(null, res)
    //	});
};

AM.delAllRecords = function(id, callback)
{
    Accounts.remove(); // reset accounts collection for testing //
    //	AM.accounts.remove(); // reset accounts collection for testing //
}

// just for testing - these are not actually being used //

AM.findById = function(id, callback)
{
    Accounts.findOne({_id: this.getObjectId(id)},
        function(e, res) {
    		if (e) callback(e)
		else callback(null, res)
    });

    //	AM.accounts.findOne({_id: this.getObjectId(id)},
    //		function(e, res) {
    //		if (e) callback(e)
    //		else callback(null, res)
    //	});
};


AM.findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
    Accounts.find( { $or : a } ).toArray(
    		function(e, results) {
    		if (e) callback(e)
    		else callback(null, results)
    });
    //	AM.accounts.find( { $or : a } ).toArray(
    //		function(e, results) {
    //		if (e) callback(e)
    //		else callback(null, results)
    //	});
}

// ---- user-management helpers (used by /users, root only) ------------------

// Create an account from an admin form. Robust variant of AM.signup that
// reports username/email collisions and waits for the save to complete.
AM.createUser = function(data, callback)
{
    Accounts.findOne({ user: data.user }, function(e, o) {
        if (e) { return callback(e); }
        if (o) { return callback('username-taken'); }
        Accounts.findOne({ email: data.email }, function(e2, o2) {
            if (e2) { return callback(e2); }
            if (o2) { return callback('email-taken'); }
            AM.saltAndHash(data.pass, function(hash) {
                Accounts.create({
                    name:    data.name,
                    email:   data.email,
                    user:    data.user,
                    pass:    hash,
                    country: data.country || 'JP',
                    date:    moment().format('MMMM Do YYYY, h:mm:ss a')
                }, function(err, doc) { callback(err, doc); });
            });
        });
    });
}

// Delete a single account by its username.
AM.deleteByUser = function(user, callback)
{
    Accounts.deleteOne({ user: user }, function(err, result) {
        callback(err, result);
    });
}

// Reset an account's password (admin action), looked up by username.
AM.setPasswordByUser = function(user, newPass, callback)
{
    Accounts.findOne({ user: user }, function(e, o) {
        if (e) { return callback(e); }
        if (!o) { return callback('user-not-found'); }
        AM.saltAndHash(newPass, function(hash) {
            o.pass = hash;
            o.save(function(err) { callback(err, o); });
        });
    });
}
