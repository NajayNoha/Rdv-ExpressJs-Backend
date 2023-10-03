const m = require("mongoose");

const model = m.Schema({
    "id": Number,
    "titulaire": String,
});

const Examens = m.model('examens', model);
module.exports = Examens;