const mongoose = require("mongoose");

const exp = require("express");

const axios = require("axios");

const server = exp();

const cors = require('cors');

server.use(exp.json(), cors());

const { connexion } = require("./config");

const url = "http://localhost:3000";

const condidats = require("./migration/condidats.js");

mongoose
  .connect(connexion)
  .then((response) => {
    console.log("mongoose connected");
  })
  .catch((error) => {
    console.log("error mongoose");
  });

// condidats
server.post('/condidats/add', async (req, res) => {
    const nom = req.body.nom ? req.body.nom : '';
    const prenom = req.body.prenom ? req.body.prenom : '';
    const email = req.body.email ? req.body.email : '';
    const password = req.body.password ? req.body.password : '';
    
    let id = 0;
    id  = await condidats.count({}) 
    id += 1
    const nvCon = new condidats({ id, nom, prenom, email, password, rdv_programmer: false});

    nvCon.save()
        .then(response => {
            res.status(200).json(response);
        })
        .catch(error => {
            console.log('Error.');
            res.status(400).json(error);
        });
});


server.post("/login", (req, res) => {
  condidats.findOne({ email: req.body.email , password: req.body.password}, {}).then(
    (response) => {
      res.status(200).json(response);
    },
    (error) => {
      console.log(error);
      res.status(500).json();
    }
  );
});
server.get("/condidats", (req, res) => {
  condidats
    .find()
    .then((response) => {
      if (!response) {
        return res.status(404).json({ message: "No data found" });
      }
      res.status(200).json(response);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});

server.get("/condidats/rdv-programmer", (req, res) => {
  condidats.find({ rdv_programmer: true }, {}).then((response) => {
    res.status(200).json(response);
  });
});

server.get("/condidats/rdv-non-programmer", (req, res) => {
  condidats.find({ rdv_programmer: false }, {}).then((response) => {
    res.status(200).json(response);
  });
});


server.put("/condidats/:id", (req, res) => {
  const nom = req.body.nom;
  const prenom = req.body.prenom;
  const email = req.body.email;
  const cin = req.body.cin ? req.body.cin : null;
  const date_naissance = req.body.date_naissance
    ? req.body.date_naissance
    : null;
  const adress = req.body.adress ? req.body.adress : null;
  condidats
    .updateOne(
      { id: req.params.id },
      {
        $set: {
          nom: nom,
          prenom: prenom,
          email: email,
          cin: cin,
          date_naissance: date_naissance,
          adress: adress,
        },
      }
    )
    .then(
      (response) => {
        res.status(200).json(
          response.json({
            condidats: {
              id: req.params.id,
              nom: nom,
              prenom: prenom,
              email: email,
              cin: cin,
              date_naissance: date_naissance,
              adress: adress,
            },
          })
        );
      },
      (error) => {
        console.log(error);
        res.status(500).json({ error: error });
      }
    );
});

server.put("/condidats/:id/etat", (req, res) => {
  condidats
    .updateOne(
      { id: req.params.id },
      {
        $set: {
          rdv_programmer: req.body.etat,
        },
      }
    )
    .then(
      (response) => {
        res.status(200).json(response);
      },
      (error) => {
        console.log(error);
        res.status(500).json({ error: error });
      }
    );
});

server.put("/condidats/:id/resultat", (req, res) => {
  condidats
    .updateOne(
      { id: req.params.id },
      {
        $set: {
          resultatExamen: req.body.resultat,
        },
      }
    )
    .then(
      (response) => {
        res.status(200).json(response);
      },
      (error) => {
        console.log(error);
        res.status(500).json({ error: error });
      }
    );
});

server.delete("/condidats/:id", (req, res) => {
  const id = parseInt(req.params.id);
  Promise.allSettled([
    condidats.deleteOne({ id: id }),
    deleteConRdv(req.params.id),
  ])
  .then(
    (r) => {
      res.status(200).json(r);
    },
    (error) => {
      console.log(error);
      res.status(500).json(error);
    }
  );
});

const deleteConRdv = async (id) => {
  return axios.delete(url + "/rdv/" + id).then(
    (response) => {
      return response;
    },
    (error) => {
      return null;
    }
  );
};

// examen
const Examens = require("./migration/examens.js");

server.post("/examens/add", async (req, res) => {
  const { titulaire } = req.body;
  let id = 1;
  id = await Examens.count({});
  id = id + 1 
  const nvExam = new Examens({ id, titulaire });

  nvExam
    .save()
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      console.log("Error.");
      res.status(400).json(error);
    });
});

server.get("/examens/", (req, res) => {
  Examens.find({}, {}).then((response) => {
    res.status(200).json(response);
  });
});

// rdv
const Rdv = require("./migration/rdv.js");

server.post("/rdv/add", async (req, res) => {
  const {id, id_condidat, id_examen, heure_examen, date_examen, id_accomp, lieu } =
    req.body;
  const nvRdv = new Rdv({
    id,
    id_condidat,
    id_examen,
    heure_examen,
    date_examen,
    id_accomp,
    lieu,
    complete: false,
  });

  if (!rdvReserver(date_examen, heure_examen)) {
    // res.json(rdvReserver(date_examen, heure_examen))
    return res.status(401).json({
      etat: "RESERVER",
      status: false,
    });
  }
  await setcond(id_condidat, true);
  nvRdv
    .save()
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((error) => {
      res.status(400).json(error);
    });
});

const rdvReserver = async (date, heure) => {
  return axios.get(url + `/rdv?date=${date}&heure=${heure}`).then(
    (response) => {
      return response != {} ? false : true;
    },
    (error) => {
      return error;
    }
  );
};
server.get("/rdv/", (req, res) => {
  Rdv.find({id: parseInt(req.body.id)}, {}).then((response) => {
    res.status(200).json(response);
  });
});

server.get("/rdv/rdv-complete", (req, res) => {
  Rdv.find({ complete: true }, {}).then((response) => {
    res.status(200).json(response);
  });
});

server.get("/rdv/rdv-nom-complete", (req, res) => {
  Rdv.find({ complete: false }, {}).then((response) => {
    res.status(200).json(response);
  });
});

server.get("/rdv/:date/:heure", (req, res) => {
  Rdv.findOne(
    { date_examen: Date(req.params.date), heure_examen: req.params.heure },
    {}
    ).then(
      (response) => {
      res.status(200).json(response);
    },
    (error) => {
      // console.log(error);
      res.status(500).json();
    }
  );
});

// server.put('/rdv/:id/etat', (req, res) => {
//     condidats.updateOne({id: req.params.id}, {$set: {
//         complete: req.body.etat
//     }}).then(
//         response => {
//             res.status(200).json(response)
//         },
//         error => {
//             console.log(error);
//             res.status(500).json({'error': error})
//         }
//     )
// })

// server.post('rdv/:id')

server.put("/rdv/:id", (req, res) => {
  const id_condidat = req.body.id_condidat;
  const id_examen = req.body.id_examen;
  const heure_examen = req.body.heure_examen;
  const date_examen = req.body.date_examen;
  const id_accomp = req.body.id_accomp;
  const lieu = req.body.lieu;
  Rdv.updateOne(
    { id: req.params.id },
    {
      $set: {
        id_condidat: id_condidat,
        id_examen: id_examen,
        heure_examen: heure_examen,
        date_examen: date_examen,
        id_accomp: id_accomp,
        lieu: lieu,
      },
    }
  ).then(
    (response) => {
      res.status(200).json(
        response.json({
          rdv: {
            id: req.params.id,
            id_condidat: id_condidat,
            id_examen: id_examen,
            heure_examen: heure_examen,
            date_examen: date_examen,
            id_accomp: id_accomp,
            lieu: lieu,
          },
        })
        );
      },
      (error) => {
        console.log(error);
        res.status(500).json({ error: error });
      }
      );
    });    
// const setrdv = async (id, etat) => {
//     return axios.get(url +'/rdv/' + id + '/etat', { etat })
//     .then(
//         response => {
//             return response;
//         },
//         error => {
//             return null;
//         }
//     )
// }

const setcond = async (id, etat) => {
  return axios.get(url + "/condidats/" + id + "/etat", { etat }).then(
    (response) => {
      return response;
    },
    (error) => {
      return null;
    }
  );
};

server.delete("/rdv/:id", (req, res) => {
  const id = parseInt(req.params.id);

  Rdv.deleteMany({ id_condidats: id }).then(
    (r) => {
      res.status(200).json(r);
    },
    (error) => {
      console.log(error);
      res.status(500).json(error);
    }
  );
});

// demarage server
server.listen(3000, () => {
  console.log("Running on 3000...");
  console.log("Starting Permis microservice");
});
