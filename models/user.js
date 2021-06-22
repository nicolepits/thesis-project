const mongoose = require('mongoose');

var Schema = mongoose.Schema;
const measurements = new Schema(
    { 
        type: String,
        metric: String,
        value: Number,
        timestamp: {type: Date, default: Date.now},
    });
//<Type> can be: height,weight,waist circumference, htn_risk, ir_risk or weight goal

const credential = new Schema(
    {
        username: { type: String, unique: true},
        password: String,
        hash: String,
        salt: String,
        email: String,
    });
const schema = new Schema(
    {
        birth: Date,
        ethnicity: String,
        sex: String,
        measurement: [measurements],
        credentials: { type: credential, unique: true}
    },
    {
        collection: 'user'

    });

const userSchema = mongoose.model('User',schema)
const measureSchema = mongoose.model('Measures', measurements)
const credsSchema = mongoose.model('Creds', credential)
module.exports = { User: userSchema, Measures: measureSchema, Creds: credsSchema}
