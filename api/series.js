const express = require('express');
const seriesRouter = express.Router();
const issuesRouter = require('./issues');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
    './database.sqlite');

//MIDDLEWARE validates required fields
const validateInput = (req, res, next) => {
    const series = req.body.series
    const name = series.name;
    const description = series.description;

    const newSeries = {
        $name: name,
        $description: description,
    };

    if (!name || !description) {
        res.sendStatus(400);
    } else {
        req.newSeries = newSeries;
        next();
    };
};

//MIDDLEWARE 
const getSeriesById = (id, res, resCode) => {
    db.get('SELECT * FROM Series WHERE id = $id', { $id: id },
        (error, series) => {
            error && next(error);
            series && res.status(resCode).json({ series: series })
        }
    );
}

//PARAM '/api/series/:seriesId'
seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    db.get(`SELECT * FROM Series WHERE id = $id`, { $id: seriesId },
        (error, series) => {
            error && next(error);
            if (series) {
                req.series = series;
                next();
            } else {
                res.sendStatus(404);
            };
        }
    );
});

//GET '/api/series/' Get all series.
seriesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Series`, (error, series) => {
        error && next(error);
        res.status(200).json({ series: series });
    });
});

//GET '/api/series/:seriesId' Get series by ID. return series w/ 200
seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({ series: req.series })
});

//POST '/api/series/' 
seriesRouter.post('/', validateInput, (req, res, next) => {
    db.run(`INSERT INTO Series (name, description) VALUES($name, $description)`, req.newSeries, function (error) {
        error && next(error);
        getSeriesById(this.lastID, res, 201);
    });
});

//PUT '/api/series/:seriesId'
seriesRouter.put('/:seriesId', validateInput, (req, res, next) => {
    const newSeriesAddId = req.newSeries;
    newSeriesAddId.$id = req.series.id;
    db.run(`UPDATE Series SET name = $name, description = $description 
    WHERE id = $id`, newSeriesAddId, (error) => {
        error && next(error);
        getSeriesById(req.series.id, res, 200);
    });
});

//DELETE '/api/series/:seriesId' Check no issues left, then delete from DB.
seriesRouter.delete('/:seriesId', (req, res, next) => {
    db.get(`SELECT * FROM Issue WHERE series_id = $seriesId`,
        { $seriesId: req.series.id }, (error, series) => {
            error && next(error);
            if (series) {
                res.sendStatus(400);
            } else {
                db.run(`DELETE FROM Series WHERE id = $seriesId`,
                    { $seriesId: req.series.id }, (error) => {
                        error && next(error);
                        res.sendStatus(204);
                    }
                );
            };
        }
    );
});

//ISSUES ROUTER '/api/series/:seriesId/issues/*'
seriesRouter.use('/:seriesId/issues/', issuesRouter);


module.exports = seriesRouter;