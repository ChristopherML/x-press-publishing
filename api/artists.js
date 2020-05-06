const express = require('express');
const artistsRouter = express.Router();
const errorhandler = require('errorhandler');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
    './database.sqlite');

//MIDDLEWARE Validate required fields from input. (PUT, POST)
const validateInput = (req, res, next) => {
    const artist = req.body.artist;
    const name = artist.name;
    const dOB = artist.dateOfBirth;
    const bio = artist.biography;
    let currEmployed = artist.is_currently_employed;
    !currEmployed &&
        (currEmployed = 1);
    const newArtist = {
        $name: name,
        $dOB: dOB,
        $bio: bio,
        $currEmployed: currEmployed,
    };
    if (!name || !dOB || !bio) {
        res.sendStatus(400);
    } else {
        req.newArtist = newArtist;
        next();
    };
};

//MIDDLEWARE Get and send artist + response code by ID. (PUT, POST)
const getArtistById = (id, res, resCode) => {
    db.get('SELECT * FROM Artist WHERE id = $id', { $id: id },
        (error, artist) => {
            error && next(error);
            artist && res.status(resCode).json({ artist: artist })
        }
    );
}

//PARAM '/api/artists/:artistId' Get artist by artist ID.
artistsRouter.param('artistId', (req, res, next, id) => {
    db.get('SELECT * FROM Artist WHERE id = $id', { $id: id },
        (error, artist) => {
            error && next(error);
            if (artist) {
                req.artist = artist;
                next();
            } else {
                res.sendStatus(404);
            };
        });
});

//GET '/api/artists/' Get all employed artists.
artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE is_currently_employed LIKE 1',
        (error, artists) => {
            error ? next(error) : res.status(200).json({ artists: artists });
        }
    );
});

//POST '/api/artists/' Add artist to data base.
artistsRouter.post('/', validateInput, (req, res, next) => {

    db.run(`INSERT INTO Artist (
    name, date_of_birth, biography, is_currently_employed)
    VALUES($name, $dOB, $bio, $currEmployed)`, req.newArtist, function (error) {
        error && next(error);
        getArtistById(this.lastID, res, 201);
    });
});

//GET '/api/artists/:artistId' Get artist by ID.
artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({ artist: req.artist });
});

//PUT '/api/artists/:artistId' Update artist by ID.
artistsRouter.put('/:artistId', validateInput, (req, res, next) => {
    const newArtistAddId = req.newArtist;
    newArtistAddId.$id = req.artist.id;
    db.run(`UPDATE Artist SET name = $name, date_of_birth = $dOB,
    biography = $bio, is_currently_employed = $currEmployed WHERE id = $id`,
        newArtistAddId, (error) => {
            error && next(error);
            getArtistById(req.artist.id, res, 200);
        }
    );
});

//DELETE '/api/artists/:artistId' Sets artist employment status to unemployed.
artistsRouter.delete('/:artistId', (req, res, next) => {
    db.run(`UPDATE Artist SET is_currently_employed = 0`, function (error) {
        error && next(error);
        getArtistById(req.artist.id, res, 200);
    });
});

module.exports = artistsRouter;
