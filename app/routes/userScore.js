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

    app.post('/getTopScore', (req, res) =>
    {
        log(req.body);

        let resp = 
        {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }
        if (req.body.username == null)
        {
        	let resp = 
        	{
        		msg: "missing username",
        		status: -1,
        		data: null
        	}
        	res.send(json(resp));
        	return;
        }

        let username = req.body.username.split("#")[0];
        let extra = req.body.username.split("#")[1];



        let query =
        `
	  	let getuuid = 
		(
		for u in users
		filter u.username == @username
		`
		if (extra != "" && extra != null)
		{
			query += 
			`
			filter u.extra == to_string(@extra)
			`
		}
		query += 
		`
		limit 1
		return u
		)
		let uuid = getuuid[0]._key


		let easy = 
		(
		for s in scores
		filter s.uuid == uuid && s.level == "Easy"
		sort s.score desc
		limit 1
		return unset(s, "_key", "_id", "_rev", "uuid", "level")
		)

		let medium = 
		(
		for s in scores
		filter s.uuid == uuid && s.level == "Medium"
		sort s.score desc
		limit 1
		return unset(s, "_key", "_id", "_rev", "uuid", "level")
		)

		let hard = 
		(
		for s in scores
		filter s.uuid == uuid && s.level == "Hard"
		sort s.score desc
		limit 1
		return unset(s, "_key", "_id", "_rev", "uuid", "level")
		)


		return {found: count(getuuid), easy: easy[0], easyCount: count(easy), medium: medium[0], mediumCount: count(medium), hard: hard[0], hardCount: count(hard)}
	  	`

        db.query(
        {
            query: query,
            bindVars:
            {
                username: username,
                extra: extra
            }
        }).then(
            cursor => cursor.all()
        ).then(
            keys =>
            {
            	if (keys[0] == null || keys[0].found == null || keys[0].found == 0)
            	{
            		resp.status = -1;
            		resp.msg = "Username not found";
            		console.log("========--");
            	}
            	else
            	{
            		resp.msg = "Username found";
            		console.log("========");
            	}
            	log(resp);
                resp.data = keys;
                let ret = JSON.stringify(resp, null, 2);
                log(ret);
                res.send(json(resp));

            }, err =>
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