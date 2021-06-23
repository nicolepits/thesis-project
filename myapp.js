var express = require('express');
var app = express();
var cors = require('cors');
var session = require('express-session');
var hash = require('pbkdf2-password')()
var path = require('path');
const {User} = require('./models/user')
const {Measures} = require('./models/user')
app.port = 3000;

/* static path (css images etc) */
app.use(express.static('static'))
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
//        res.redirect('back');
          res.redirect('/');
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

// HTML views.

app.get('/risk', function(req, res){
  res.render('risk');
});
app.post('/risk', function(req, res){
  res.render('risk');
});
app.get('/risk-result', function(req, res){
  res.render('risk-result');
});
function getAge(date){
    var dob = new Date(date);
    //calculate month difference from current date in time
    var month_diff = Date.now() - dob.getTime();
    //convert the calculated difference in date format
    var age_dt = new Date(month_diff);
    //extract year from date
    var year = age_dt.getUTCFullYear();
    //now calculate the age of the user
    var age = Math.abs(year - 1970);
    return age;
}

app.post('/risk-result', function(req, res){
    console.log(req.body);
    //collect form data
    var gender = req.body.gender;
    var birthDate = req.body.birthdate;
    var height = req.body.height;
    var weight = req.body.weight;
    var waist = req.body.waist;
    var screen = req.body.screen;
    var breakfasts = req.body.breakfasts;
    var sugary = req.body.sugary;
    var alcohol = req.body.alcohol;
    var walking = req.body.walking;
    var physical = req.body.physical;
    var legumes = req.body.legumes;

    height= height*0.01; //convert cm to m

    //calculate BMI
    var BMI = weight/(height*height)
    console.log(BMI)
    //evaluate
    var irPoints = 0;
    var htnPoints = 0;

    if(BMI<25){
        //nothing
    } else if(BMI<=30){
        irPoints+=9;
        htnPoints+=10;
    } else {
        irPoints+=19;
        htnPoints+=20;
    }

    if(gender=="female"){
        if(waist<80){
            //nothing
        } else if(waist<=88){
            irPoints+=3;
        } else{
            irPoints+=7;
        }
    } else { //gender:male
        irPoints+=2;
        htnPoints+=6;
        if(waist<94){
            //nothing
        } else if(waist<=102){
            irPoints+=3;
        } else{
            irPoints+=7;
        }
    }

    if(screen>=2){
        irPoints+=3;
    }

    if(breakfasts<5){
        irPoints+=3;
    }

    if(sugary>=1){
        irPoints+=2;
    }

    if(walking==0){
        irPoints+=2;
    }

    if(physical==0){
        irPoints+=2;
        htnPoints+=2;
    }

    if(getAge(birthDate)>=40){
        htnPoints+=2;
    }

    if(alcohol>=3){
        htnPoints+=2;
    }

    if(legumes<1){
        htnPoints+=8;
    }

    console.log(irPoints);
    console.log(htnPoints);

    //store in database

    var data = [{
        type: "height",
        metric: "cm",
        value: height,
    },
        {
            type: "weight",
            metric: "kg",
            value: weight,
        },
        {
            type: "ir_risk",
            metric: "",
            value: irPoints,
        },
        {
            type: "htn_risk",
            metric: "",
            value: htnPoints,
        },

    ];
    console.log(data);
    var measurements = data.map(el => new Measures({
        type: el.type,
        metric: el.metric,
        value: el.value,
    }));

    if (req.session.user) {
        var username = res.locals.username = req.session.user.credentials.username;
        User.updateOne({"credentials.username": username}, {$push: {measurement: measurements}}, function(err) {
            if (!err) {
                //return res.send({});
            } else {
                console.log(err);
                //return res.send(404, { error: "Person was not updated."});
                return fn(new Error('cannot find user'));
            }
        });
    } else {
        req.session.error = 'You are not logged in.';
    }

    res.render('risk-result');
});


app.get('/', function(req, res){
  res.render('welcome-page');
});

app.get('/personalized-rec', function(req, res){
  res.render('personalized-rec');
});
app.get('/result-rec', function(req, res){
  res.render('result-rec');
});
app.get('/account-info', restrict, function(req, res){
  res.locals.username = req.session.user.credentials.username;
  res.render('account-info');
});

console.log('Server started on port ' + app.port)

//==================================================/

/*
app.get('/', function(req, res){
  res.redirect('/login');

});
*/

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
