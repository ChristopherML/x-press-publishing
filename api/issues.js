const express = require('express');
const issuesRouter = express.Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE ||
    './database.sqlite');


//MIDDLEWARE Validate input from user.
const validateInput = (req, res, next) => {
    const issue = req.body.issue;
    const name = issue.name;
    const issueNum = issue.issueNumber;
    const pubDate = issue.publicationDate;
    const artistId = issue.artistId;
    const seriesId = req.series.id;
    const newIssue = {
        $name: name,
        $issueNum: issueNum,
        $pubDate: pubDate,
        $artistId: artistId,
        $seriesId: seriesId,
    };
    if (!name || !issueNum || !pubDate || !artistId) {
        res.sendStatus(400);
    } else {
        req.newIssue = newIssue;
        next();
    };
};

//MIDDLEWARE Get issue by ID and send.
const getIssueById = (id, res, resCode) => {
    db.get('SELECT * FROM Issue WHERE id = $id', { $id: id },
        (error, issue) => {
            error && next(error);
            issue && res.status(resCode).json({ issue: issue })
        }
    );
}

//PARAM '/api/series/:seriesId/issues/:issueId'
issuesRouter.param('issueId', (req, res, next, issueId) => {
    db.get(`SELECT * FROM Issue WHERE id = $id`, { $id: issueId },
        (error, issue) => {
            error && next(error);
            if (issue) {
                req.issue = issue;
                next();
            } else {
                res.sendStatus(404);
            };
        }
    );
});

//GET '/api/series/:seriesId/issues' Get all issues for a specified series ID.
issuesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Issue WHERE series_id LIKE $seriesId`,
        { $seriesId: req.series.id }, (error, issues) => {
            error && next(error);
            res.status(200).json({ issues: issues });
        }
    );
});

//POST '/api/series/:seriesId/issues' Add a new issue to DB. 
issuesRouter.post('/', validateInput, (req, res, next) => {
    db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id,
    series_id) VALUES ($name, $issueNum, $pubDate, $artistId, $seriesId)`,
        req.newIssue, function (error) {
            error && next(error);
            getIssueById(this.lastID, res, 201);
        });
});

//PUT '/api/series/:seriesId/issues/:issueId' Update issue in DB.
issuesRouter.put('/:issueId', validateInput, (req, res, next) => {
    db.get(`SELECT * FROM Artist WHERE id = $artistId`,
        { $artistId: req.newIssue.$artistId }, (error, issue) => {
            if (error) {
                next(error);
            } else if (!issue) {
                res.sendStatus(400);
            } else {
                const newIssueAddId = req.newIssue;
                newIssueAddId.$id = req.issue.id;
                db.run(`UPDATE Issue SET name = $name, issue_number = $issueNum, 
                publication_date = $pubDate, artist_id = $artistId, series_id = $seriesId
                WHERE id = $id`, newIssueAddId, (error) => {
                    error && next(error);
                    getIssueById(req.issue.id, res, 200);
                });
            };
        }
    );
});

//DELETE '/api/series/:seriesId/issues/:issueId' Delete issue by ID from DB.
issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run(`DELETE FROM Issue WHERE id = $issueId`,
        { $issueId: req.issue.id }, (error) => {
            error && next(error);
            res.sendStatus(204);
        }
    );
});

module.exports = issuesRouter;
