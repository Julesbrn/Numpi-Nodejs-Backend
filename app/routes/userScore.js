function log(str)
{
    console.log(str);
    var fs = require('fs');
    fs.appendFile("/home/jules/numpi/logs/log.txt", str, function(err)
    {
        if (err)
        {
            return console.log(err);
        }

    });
}

function json(obj)
{
    return JSON.stringify(obj, null, 2)
}

module.exports = function(app, db)
{
    app.post('/userScore', (req, res) =>
    {

        log(req.body);

        let resp = {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }
        if (req.body.username == null)
        {
            uuid = req.body.uuid;
            let resp = {
                data: null,
                status: 0,
                debug: req.body,
                msg: "Missing username"
            };
            res.send(JSON.stringify(resp, null, 4));
            return;
        }

        let numScores = 1;
        if (numScores != null) numScores = parseInt(req.body.numScores);


        let query =
        `
	  	for u in users
		filter u.username == to_string(@username)
		limit 1
		return u._key
	  	`

        db.query(
        {
            query: query,
            bindVars:
            {
                username: req.body.username
            }
        }).then(
            cursor => cursor.all()
        ).then(
            keys =>
            {
                let uuid = keys[0];

                let query =
                `
				for s in scores
				filter s.uuid == @uuid
				`
                if (req.body.level != null)
                {
                    query += `filter s.level == @level`
                }
                query += 
                `
				sort s.score desc
				limit @numScores
				return unset(s, "_key", "_id", "_rev", "uuid")
			  	`

                db.query(
                {
                    query: query,
                    bindVars:
                    {
                        uuid: uuid,
                        numScores: numScores,
                        level: req.body.level
                    }
                }).then(
                    cursor => cursor.all()
                ).then(
                    keys =>
                    {
                        resp.data = keys;
                        let ret = JSON.stringify(resp, null, 2);
                        log(ret);
                        res.send(json(resp));

                    },
                    err =>
                    {
                        resp.msg = "There was an error in processing, check the logs.";
                        console.error('Failed to execute query:', err);
                        res.send(json(resp));
                    }
                );


            },
            err =>
            {
                resp.msg = "There was an error in processing, check the logs.";
                console.error('Failed to execute query:', err);
                res.send(json(resp));
            }
        );
        log("/users");
        log(json(resp));
    })
}