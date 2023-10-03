const m = require("mongoose");

const model = m.Schema({
    'id': Number,
    "id_condidat": Number,
    "id_examen": Number,
    "heure_examen": String,
    "date_examen": Date,
    'id_accomp': Number,
    'lieu': String,
    "complete": Boolean
});

const Rdv = m.model('rdv', model);
module.exports = Rdv;