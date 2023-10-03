const m = require("mongoose");

const model = m.Schema({
    "id": Number,
    "nom": String,
    "prenom": String,
    "email": String,
    "password": String,
    "adress": String,
    'cin': String,
    "date_naissance": Date,
    "rdv_programmer": Boolean,
    "resultatExamen": {
        type: String,
        enum: ['Réussi', 'Échoué', 'En attente'], 
        default: 'En attente',
    },
});

const condidats = m.model('condidats', model);
module.exports = condidats;