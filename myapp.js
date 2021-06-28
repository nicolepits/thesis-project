var express = require('express');
var app = express();
var cors = require('cors');
var session = require('express-session');
var hash = require('pbkdf2-password')()
var path = require('path');
const {
    User
} = require('./models/user')
const {
    Measures
} = require('./models/user')
app.port = 3000;

/* static path (css images etc) */
app.use(express.static('static'))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// middleware
//
app.use(express.urlencoded({
    extended: false
}))

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

function recentType(a,type){  //a:array type:string
    if (a.length == 0) {
        return null;
    }
    var result = {type: "", metric: "", timestamp: 0};

    for(i=0;i<a.length;i++){
         if(a[i].type == type){
            tmp2 = new Date(result.timestamp);
            let tmp1 = new Date(a[i].timestamp);
            if(tmp1.getTime() > tmp2.getTime()){
                result = a[i];
            }
        }
    }
    return result;
}


/**** ENDPOINTS ****/

function err_to_html(err) {
    return '<p class="msg error">' + err + '</p>';
}

app.use(function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    var status_msg = req.session.status_msg;
    delete req.session.error;
    delete req.session.success;
    delete req.session.status_msg;
    res.locals.message = '';
    res.locals.status_msg = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    if (status_msg) res.locals.status_msg = status_msg;
    if (req.session.user) {
	req.session.status_msg = 'You are logged in as '+req.session.user.credentials.username;
    } else {
	req.session.status_msg= 'You are not logged in';
    }
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



    User.findOne({
        "credentials.username": username
    }, function (err, user) {
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

app.get('/restricted', restrict, function (req, res) {
    res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});


app.get('/logout', function (req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function () {
        res.redirect('/');
    });
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.post('/login', function (req, res) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            // Regenerate session when signing in
            // to prevent fixation
            req.session.regenerate(function () {
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.credentials.username +
                    ' click to <a href="/logout">logout</a>. ' +
                    ' You may now access <a href="/restricted">/restricted</a>.';
                //        res.redirect('back');
                res.redirect('/');
            });
        } else {
            req.session.error = 'Authentication failed, please check your ' +
                ' username and password.' +
                ' (use "tj" and "foobar")';
            res.redirect('/login');
        }
    });
});

//users
app.get('/users', user.allUsers); //retrieves all users
app.get('/user', user.userById); //retrieves user by username
app.post('/user/add', user.createUser); //creates a user (signup)
app.put('/user/update/measurement', user.updateMeasurement); //update measurements
app.put('/user/update/risk', user.updateUserRisk); //update risk only
app.put('/user/update/personal', user.updateUserPersonal); //update height,weight etc only
app.delete('/user/delete', user.deleteUser); //delete user data

// HTML views.

app.get('/risk', function (req, res) {
    res.render('risk');
});
app.post('/risk', function (req, res) {
    res.render('risk');
});
app.get('/risk-result', function (req, res) {
    res.render('risk-result');
});

function getAge(date) {
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

function bmi(height, weight) {
    //calculate BMI
    height = height / 100;
    var BMI = weight / (height * height);
    return BMI;
}

function calculateRisks(data) {
    var sex = data.sex;
    var birthDate = data.birthdate;
    var height = data.height;
    var weight = data.weight;
    var waist = data.waist;
    var screen = data.screen;
    var breakfasts = data.breakfasts;
    var sugary = data.sugary;
    var alcohol = data.alcohol;
    var walking = data.walking;
    var physical = data.physical;
    var legumes = data.legumes;

    height = height * 0.01; //convert cm to m
    //evaluate
    var irPoints = 0;
    var htnPoints = 0;
    var BMI = bmi(height, weight);

    if (BMI < 25) {
        //nothing
    } else if (BMI <= 30) {
        irPoints += 9;
        htnPoints += 10;
    } else {
        irPoints += 19;
        htnPoints += 20;
    }

    if (sex == "female") {
        if (waist < 80) {
            //nothing
        } else if (waist <= 88) {
            irPoints += 3;
        } else {
            irPoints += 7;
        }
    } else { //sex:male
        irPoints += 2;
        htnPoints += 6;
        if (waist < 94) {
            //nothing
        } else if (waist <= 102) {
            irPoints += 3;
        } else {
            irPoints += 7;
        }
    }

    if (screen >= 2) {
        irPoints += 3;
    }

    if (breakfasts < 5) {
        irPoints += 3;
    }

    if (sugary >= 1) {
        irPoints += 2;
    }

    if (walking == 0) {
        irPoints += 2;
    }

    if (physical == 0) {
        irPoints += 2;
        htnPoints += 2;
    }

    if (getAge(birthDate) >= 40) {
        htnPoints += 2;
    }

    if (alcohol >= 3) {
        htnPoints += 2;
    }

    if (legumes < 1) {
        htnPoints += 8;
    }

    return [htnPoints, irPoints];
}

function testCalculateRisks() {
    function make_data(
        birthDate,
        sex,
        height,
        weight,
        waist,
        screen,
        breakfasts,
        sugary,
        alcohol,
        walking,
        physical,
        legumes) {
        return {
            birthDate: birthDate,
            height: height,
            weight: weight,
            sex: sex,
            waist: waist,
            screen: screen,
            breakfasts: breakfasts,
            sugary: sugary,
            alcohol: alcohol,
            walking: walking,
            physical: physical,
        }
    }
    var data = [
        make_data("1990-01-01", "female", 150, 150, 150, 5, 2, 2, 50, 1, 0, 0),
        make_data("1990-01-01", "male", 150, 150, 150, 5, 2, 2, 50, 1, 0, 0),
    ];
    var expected_results = [0, 0];

    data.forEach(body => {
        var [htnPoints, irPoints] = calculateRisks(body);
    });
}

app.post('/risk-result', async function (req, res) {
    //collect form data
    var sex = req.body.sex;
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

    height = height * 0.01; //convert cm to m
    testCalculateRisks();
    var [htnPoints, irPoints] = calculateRisks(req.body);

    /* HTN: >=26 risk
     * IR:  30>=high risk>=23 , >=31 very high risk
     */
    //    console.log(irPoints);
    //    console.log(htnPoints);

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
    //    console.log(data);
    var measurements = data.map(el => new Measures({
        type: el.type,
        metric: el.metric,
        value: el.value,
    }));

    var prev_values = null;
    if (req.session.user) {
        var username = res.locals.username = req.session.user.credentials.username;
        User.updateOne({
            "credentials.username": username
        }, {
            $push: {
                measurement: measurements
            }
        }, function (err) {
            if (!err) {
                //return res.send({});
            } else {
                console.log(err);
                //return res.send(404, { error: "Person was not updated."});
                return fn(new Error('cannot find user'));
            }
        });
        await User.findOne({"credentials.username": username}, function (err, user) {
                if(!err) {
                prev_values = user.measurement;
                } else {
                console.log(err);
                //return res.send(404, { error: "Person was not updated."});
                return fn(new Error('cannot find user'));
                }
                });
    } else {
        req.session.error = 'You are not logged in.';
    }
    res.locals.history="";
    if (prev_values) {
        var output = "<table class=\"table table-bordered\"><thead><tr><th>date</th><th>type</th><th>value</th></tr></thead><tbody>";
    
        var previous_ir_risk = recentType(prev_values, "ir_risk");
        var previous_htn_risk = recentType(prev_values, "htn_risk");
        if(previous_ir_risk) {
            var val = previous_ir_risk;
            output += "<tr><td>"+val.timestamp.toLocaleString()+"</td><td>"+val.type+"</td><td>"+val.value+"</td></tr>";
        }
        if(previous_htn_risk) {
            var val = previous_htn_risk;
            output += "<tr><td>"+val.timestamp.toLocaleString()+"</td><td>"+val.type+"</td><td>"+val.value+"</td></tr>";
        }
        /*
        prev_values.forEach(val => {
            if (val.type != "ir_risk" && val.type != "htn_risk") {
                return;
            }
            output += "<tr><td>"+val.timestamp+"</td><td>"+val.type+"</td><td>"+val.value+"</td></tr>";
            return;
        });
        */

        output += "</tbody></table>";
        res.locals.history=output;
    }

    const IR_RISK = "is above normal";
    const IR_VRISK = "indicates very high risk";
    const IR_NORM = "is considered normal";
    const HTN_RISK = "indicates risk";
    const HTN_NORM = "is considered normal";

    res.locals.htn = {
        "class": "success",
        "message": HTN_NORM,
        "score": htnPoints.toString(),
    }
    if (htnPoints >= 26) {
        res.locals.htn.class = "warn";
        res.locals.htn.message = HTN_RISK;
    }
    res.locals.ir = {
        "class": "success",
        "message": IR_NORM,
        "score": irPoints.toString(),
    }
    if (irPoints >= 23 && irPoints <= 30) {
        res.locals.htn.class = "warn"
        res.locals.htn.message = IR_RISK;
    } else if (irPoints >= 31) {
        res.locals.htn.message = IR_VRISK;
    }


    res.render('risk-result');
});


app.get('/', function (req, res) {
    res.render('welcome-page');
});


function resetPersonalisedState(session) {
    var state = {
        step: 0,
        values: {},
    };

    session.personalisedState = state;
}

app.get('/personalized-rec', async function (req, res) {
    var initial_values =null;
    resetPersonalisedState(req.session);
    if (req.session.user) {
        var username = res.locals.username = req.session.user.credentials.username;
        _ =  await User.findOne({"credentials.username": username}, function (err, user) {
            console.log("inner function");
            if(!err) {
                initial_values = {
                    "sex": user.sex,
                    "ethnicity": user.ethnicity,
                    "birth": user.birth,
                    "height": recentType(user.measurement, "height"),
                    "weight": recentType(user.measurement, "weight"),
                };
            } else {
                console.log(err);
                //return res.send(404, { error: "Person was not updated."});
                return fn(new Error('cannot find user'));
            }
        });
    }
    console.log("res local err msg ", req.session.personalized_error);
    res.locals.error_msg = req.session.personalized_error;
    req.session.personalized_error=null;
    console.log("res local err m2sg ", res.locals.error_msg);
    res.locals.height = null;
    res.locals.height_date = null;
    res.locals.weight = null;
    res.locals.weight_date = null;
    res.locals.sex =  null;
    res.locals.birth =  null;
    res.locals.ethnicity =  null;

    if (initial_values) {
        res.locals.height = initial_values.height.value;
        res.locals.height_date = initial_values.height.timestamp.toLocaleDateString();
        res.locals.weight = initial_values.weight.value;
        res.locals.weight_date = initial_values.weight.timestamp.toLocaleDateString();
        res.locals.sex = initial_values.sex;
        // input type="date" needs an ISO string YYYY-MM-DD but toISOString() returns time as well, so get only the first 10 characters
        res.locals.birth = initial_values.birth.toISOString().slice(0,10);
        res.locals.ethnicity = initial_values.ethnicity;
    }

    console.log("sex",res.locals.sex);
    console.log("birth",res.locals.birth);
    console.log("ethn",res.locals.ethnicity);

    res.render('personalized-rec');
});
app.post('/energy-expenditure', function (req, res) {
    res.locals.error_msg = req.session.personalized_error;
    req.session.personalized_error=null;
    var data = req.body;
    console.log(req.session.personalisedState);
    if (!req.session.personalisedState || req.session.personalisedState.step != 0) {
        res.redirect('/personalized-rec');
        return;
    }
    // Validate form data.
    console.log(data);
    if (data.sex != "male" && data.sex != "female") {
        req.session.personalized_error = err_to_html('Please choose your sex and resubmit.');
        res.redirect('/personalized-rec');
        return;
    }

    if (data.ethnicities == "") {
        req.session.personalized_error = err_to_html('Please choose your ethnicity and resubmit.');
        res.redirect('/personalized-rec');
        return;

    }
    if (isNaN(parseInt(data['user-height'], 10))) {
req.session.personalized_error = err_to_html('Please enter a valid height number value and resubmit.');
        res.redirect('/personalized-rec');
        return;
    }
    if (isNaN(parseInt(data['user-weight'], 10))) {
        req.session.personalized_error = err_to_html('Please enter a valid weight number value and resubmit.');
        res.redirect('/personalized-rec');
        return;
    }


    // Go to next step
    req.session.personalisedState.step += 1;

    req.session.personalisedState.values.sex = data.sex;
    req.session.personalisedState.values.ethnicity = data.ethnicities;
    req.session.personalisedState.values.height = data['user-height'];
    req.session.personalisedState.values.weight = data['user-weight'];

    res.render('energy-expenditure');
});
app.post('/weight-loss-goal', function (req, res) {
    var data = req.body;
    res.locals.error_msg = req.session.personalized_error;
    req.session.personalized_error=null;
    console.log(data);
    if (!req.session.personalisedState || req.session.personalisedState.step != 1) {
        res.redirect('/personalized-rec');
        return;
    }

    req.session.personalisedState.step += 1;

    var state = req.session.personalisedState;

    state.values.totalSleepOnWeekdays = data["weekday"];
    state.values.totalSleepOnWeekend = data["weekend"];
    state.values.occupations= data.occupations;
    state.values.totalHoursOfWork = data["totalHoursOfWork"];
    state.values.trans= data.trans == 'Yes';
    if (state.trans) {
        state.values['walking-effort'] = data['walking-effort']
        state.values['cycling-effort'] = data['cycling-effort']
        state.values['leisure-activity'] = data['leisure-activity']
        state.values['first-act-mins'] = data['first-act-mins']
        state.values['second-act-mins'] = data['second-act-mins']
        state.values['house-hold-work'] = data['house-hold-work']
        state.values['first-house-mins'] = data['first-house-mins']
        state.values['sec-house-mins'] = data['sec-house-mins']
    }
    var BMI = bmi(state.values.height, state.values.weight);
    res.locals.bmi = BMI.toFixed(1);
    /*
     * ethnicities:
     *
        americanIndian
        alaskaNative
        asian
        black
        africanAmerican
        caucasian
        hispanic
        latino
        nativeHawaiian
        otherPacificIslander */
    var classification = null;

    var lower_body_weight_cut_off = 0;
    var height_meters = state.values.height / 100;
    var higher_body_weight_cut_off = 0;
    if (["americanIndian", "alaskaNative", "black", "africanAmerican", "caucasian", "hispanic", "latino", "nativeHawaiian"].includes(state.values.ethnicity)) {

        if (bmi < 18.5) {
            classification = "Underweight";
        } else if (bmi <= 24.9) {
            classification = "Normal weight";
        } else if (bmi <= 29.9) {
            classification = "Overweight";
        } else if (bmi <= 34.9) {
            classification = "Obese (Class I)";
        } else if (bmi <= 39.9) {
            classification = "Obese (Class II)";
        } else {
            classification = "Obese (Class III)";
        }
        lower_body_weight_cut_off = (height_meters*height_meters)*20;
        higher_body_weight_cut_off = (height_meters*height_meters)*24.9;
    } else {
        if (bmi < 18.5) {
            classification = "Underweight";
        } else if (bmi <= 22.9) {
            classification = "Normal weight";
        } else if (bmi <= 24.9) {
            classification = "Overweight";
        } else if (bmi <= 29.9) {
            classification = "Obese (Class I)";
        } else {
            classification = "Obese (Class II)";
        }
        lower_body_weight_cut_off = (height_meters*height_meters)*18.5;
        higher_body_weight_cut_off = (height_meters*height_meters)*22.9;
    }
    res.locals.lower = lower_body_weight_cut_off.toFixed(0);
    res.locals.higher = higher_body_weight_cut_off.toFixed(0);

    
    if (BMI <35) {
        res.locals.message = "The recommended weight loss rate is between 2-4 kg per month or 0.5-1 kg per week. Nevertheless, keep in mind that by reducing your initial body weight by 5-10% you will achieve substantial benefits in terms of health, quality of life and disease prevention";
        res.locals.rate_min=2;
        res.locals.rate_max=4;

    } else {
        res.locals.message = "The recommended weight loss rate is between 4-6 kg per month or 1.0-1.5 kg per week. Nevertheless, keep in mind that by reducing your initial body weight by 5-10% you will achieve substantial benefits in terms of health, quality of life and disease prevention.";

        res.locals.rate_min=4;
        res.locals.rate_max=6;
    }
    res.locals.weight = state.values.weight;

    

    res.render('weight-loss-goal');
});
app.post('/weight-loss-rate', function (req, res) {
    var data = req.body;
    console.log(data);
    res.locals.error_msg = req.session.personalized_error;
    req.session.personalized_error=null;
    if (!req.session.personalisedState || req.session.personalisedState.step != 2) {
        res.redirect('/personalized-rec');
        return;
    }
    req.session.personalisedState.step += 1;

    req.session.personalisedState.values['weight-goal'] = data['weight-goal'];
    req.session.personalisedState.values['weight-rate'] = data['weight-rate'];

    res.render('weight-loss-rate');
});
app.post('/result-rec', function (req, res) {
    res.locals.error_msg = req.session.personalized_error;
    req.session.personalized_error=null;
    var data = req.body;
    console.log(data);
    if (!req.session.personalisedState || req.session.personalisedState.step != 3) {
        res.redirect('/personalized-rec');
        return;
    }
    req.session.personalisedState.step += 1;
    res.render('result-rec');
});
app.post('/output-result-rec', function (req, res) {
    res.locals.error_msg = req.session.personalized_error;
    req.session.personalized_error=null;
    var data = req.body;
    console.log(data);
    if (!req.session.personalisedState || req.session.personalisedState.step != 4) {
        res.redirect('/personalized-rec');
        return;
    }
    req.session.personalisedState.step += 1;

    req.session.personalisedState.values['allergies'] = data['answer'];
    req.session.personalisedState.values['leisure-activity'] = data['leisure-activity'];

    /* Reset state after it's not needed anymore. */
    resetPersonalisedState(req.session);
    res.render('output-result-rec');
});
app.get('/account-info', restrict, async function (req, res) {
    var username = res.locals.username = req.session.user.credentials.username;
    var prev_values = null;
    _ = await User.findOne({"credentials.username": username}, function (err, user) {
        if(!err) {
            prev_values = user.measurement;
        } else {
            console.log(err);
            //return res.send(404, { error: "Person was not updated."});
            return fn(new Error('cannot find user'));
        }
    });
    res.locals.history="";
    if (prev_values) {
        var output = "<table class=\"table table-bordered\"><thead><tr><th>date</th><th>type</th><th>value</th></tr></thead><tbody>";
    
        prev_values.forEach(val => {
            output += "<tr><td>"+val.timestamp+"</td><td>"+val.type+"</td><td>"+val.value+"</td></tr>";
            return;
        });

        output += "</tbody></table>";
        res.locals.history=output;
    }

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


function calcRMR(weight, height, age, sex) {
    if (sex == 'male') {
        return (9.99 * weight) + (6.25 * height)-(4.92*age)+5;
    } else if (sex == 'female') {
        return (9.99 * weight) + (6.25 * height)-(4.92*age)-161;
    } else {
        throw "invalid sex " + sex;
    }
}


function calcEESleep(rmr, totalHoursOfSleep) {
    return rmr * totalHoursOfSleep;
}



function calcEEWork(rmr, pal, totalHoursOfWork) {
    return rmr * pal * totalHoursOfWork;
}

function calcEECommuting(met, weight, totalMinutes) {
    return met * body *(totalMinutes/60.0);
}

function calcEEActivity(met, weight, totalMinutes) {
    return calcEECommuting(met, weight, totalMinutes);
}
function calcEEHousehold(met, weight, totalMinutes) {
    return calcEECommuting(met, weight, totalMinutes);
}


function calcWeeklyTEE(totalSleepOnWeekdays, totalSleepOnWeekend, totalHoursWork, totalMinutesCommute, totalMinutesActivity, totalMinutesHousehold, weight, height, age, sex, pal, met) {

    var total =
        (totalSleepOnWeekdays * 5 + totalSleepOnWeekend*2)+
        totalHoursWork+
        (totalMinutesCommute+
        totalMinutesActivity+
        totalMinutesHousehold)/60;
    var rmr = calcRMR(weight, height, age, sex);
     
        var base= calcEESleep(rmr, totalSleepOnWeekdays) * 5
        + calcEESleep(rmr, totalSleepOnWeekend) * 2
        + calcEEWork(rmr, pal, totalHoursOfWork)
        + calcEECommuting(met, weight, totalMinutesCommute)
        + calcEEActivity(met, weight, totalMinutesActivity)
        + calcEEHousehold(met, weight, totalMinutesHousehold);
    
    if (total == 168) {
        return base;
    } else if (total < 168) {
        return base +((1.0*weight) * (168-total));
    } else {
        throw "total hours more than 168" + total;
    }
}
