var express = require('express');
var app = express();
var cors = require('cors');
var session = require('express-session');
var hash = require('pbkdf2-password')()
var path = require('path');
const {User} = require('./models/user')
const {Measures} = require('./models/user')
app.port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middleware
//
app.use(express.urlencoded({ extended: false }))

//Routes
var user = require('./myroutes');

//Enable cors
app.use(cors());

app.use(session({
	  resave: false, // don't save session if unmodified
	  saveUninitialized: false, // don't create session until something stored
	  secret: 'yeuh'
}));

//Node Config
app.use(express.json());

//Start the server on port 3000
app.listen(app.port);


/**** ENDPOINTS ****/

app.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});


// Authenticate using our plain-object database of doom!

function authenticate(username, pass, fn) {
  if (!module.parent) console.log('authenticating %s:%s', username, pass);
//  var user = users[name];
  // query the db for the given username
 // if (!user) return fn(new Error('cannot find user'));
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user



    User.findOne({"credentials.username":username}, function(err,user){
        if (err) {
            console.log(err);
            //return res.send(404, { error: "User could not be found."});
            return fn(new Error('cannot find user'));
        } else {
            if (pass == user.credentials.password) {
                return fn(null, user);
            } else {
                fn(new Error('invalid password'));
            }
            /*
            hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
                if (err) return fn(err);
                if (hash === user.hash) return fn(null, user)
                fn(new Error('invalid password'));
            });
            */
        }
    });
}

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}

app.get('/restricted', restrict, function(req, res){
      res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});


app.get('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/');
  });
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  authenticate(req.body.username, req.body.password, function(err, user){
    if (user) {
      // Regenerate session when signing in
      // to prevent fixation
      req.session.regenerate(function(){
        // Store the user's primary key
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.credentials.username
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.redirect('back');
      });
    } else {
      req.session.error = 'Authentication failed, please check your '
        + ' username and password.'
        + ' (use "tj" and "foobar")';
      res.redirect('/login');
    }
  });
});

//users
app.get('/users', user.allUsers); //retrieves all users
app.get('/user', user.userById); //retrieves user by username
app.post('/user/add', user.createUser); //creates a user (signup)
app.put('/user/update/measurement', user.updateMeasurement); //update measurements
app.put('/user/update/risk',user.updateUserRisk); //update risk only
app.put('/user/update/personal', user.updateUserPersonal); //update height,weight etc only
app.delete('/user/delete', user.deleteUser); //delete user data

console.log('Server started on port ' + app.port)

//==================================================/

app.get('/', function(req, res){
  res.redirect('/login');

});

// dummy database

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

/*
var users = {
  tj: { name: 'tj' }
};

hash({ password: 'foobar' }, function (err, pass, salt, hash) {
  if (err) throw err;
  // store the salt & hash in the "db"
  users.tj.salt = salt;
  users.tj.hash = hash;
});
*/

/*
*/
