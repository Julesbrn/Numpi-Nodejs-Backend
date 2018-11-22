function json(obj)
{
    return JSON.stringify(obj, null, 2)
}

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



module.exports = function(app, db)
{
    app.post('/register', (req, res) =>
    {
        var rug = require('random-username-generator');

        let resp = {
            status: 1,
            debug: req.body,
            msg: "success"
        };

        let uuid = "";
        // first check if the post is valid
        if (req.body.uuid != null)
        {
            uuid = req.body.uuid;
        }
        else
        {
            let resp = {
                data: null,
                status: 0,
                debug: req.body,
                msg: "Missing uuid"
            };
            res.send(JSON.stringify(resp, null, 4));
            return;
        }

        //second check if uuid already exists



        let query =
        `
	  	return document(concat("users/",@uuid)).username
	  	`

        db.query(
        {
            query: query,
            bindVars:
            {
                uuid: uuid
            }
        }).then(
            cursor => cursor.all()
        ).then(
            keys =>
            {
                log("test1");
                if (keys[0] === null)
                {
                    log("test2");
                    let username = rug.generate();




                    let query2 =
                    `
				  	insert {_key: to_string(@uuid), username: to_string(@username)} into users
				  	return NEW
				  	`

                    db.query(
                    {
                        query: query2,
                        bindVars:
                        {
                            uuid: uuid,
                            username: username
                        }
                    }).then(
                        cursor => cursor.all()
                    ).then(keys =>
                    {
                        resp.data = 
                        {
                            username: keys[0].username
                        };

                        log("keys-> ", keys);
                        res.send(json(resp));
                    });

                }
                else
                {
                    log("keys:", keys);
                    resp.data = 
                    {
                        username: keys[0]
                    };
                    let ret = JSON.stringify(resp, null, 2);
                    log(ret);
                    res.send(json(resp));

                }

            }, err =>
            {
                resp.msg = "There was an error in processing, check the logs.";
                console.error('Failed to execute query:', err);
                res.send(json(resp));
            }
        );
        log("/register");
    });




    app.post('/register_old', (req, res) =>
    {
        var rug = require('random-username-generator');
        let username = rug.generate();
        let resp = 
        {
            data:
            {
                username: username
            },
            status: 1,
            debug: req.body,
            msg: "success"
        };

        res.send(JSON.stringify(resp, null, 4));
        log("/register_old")
    });

    app.post('/notes', (req, res) =>
    {
        let resp = 
        {
            test: "a"
        };
        log(resp);
        resp.msg = "hello";
        resp.status = 1;
        log(resp);
        res.send(JSON.stringify(resp, null, 4));
        log("/notes");
    });
    app.get('/test', (req, res) =>
    {
        res.send("Success");
        log("/test");
    });
    app.post('/users', (req, res) =>
    {
        log(req.body);

        let resp = 
        {
            status: -1,
            data: null,
            msg: "This call is no longer used.",
            debug: req.body
        }
        let query =
        `
	  	for u in users
		return unset(u, "_rev", "_id")
	  	`

        db.query(query).then(
            cursor => cursor.all()
        ).then(
            keys =>
            {
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



    app.post('/highscore', (req, res) =>
    {
        log("/highscore");
        log(json(req.body));
        let resp = 
        {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }

        if (req.body.type == null || (req.body.type != "new" && req.body.type != 'old' && req.body.type != 'score'))
        {
            let resp = 
            {
                data: null,
                status: 0,
                debug: req.body,
                msg: "Invalid type. Options are 'old' or 'new' or 'score' and need level"
            };
            res.send(JSON.stringify(resp, null, 4));
            log(req.body);
            log(json(resp));
            return;
        }


        query =
        `
		for h in scores
        `
        if (req.body.level != null)
        {
            query += 
            `
        	filter h.level == @level
    		`;
        }

        if (req.body.uuid != null)
        {
            query +=
            `
			filter h.uuid == to_string(@myuuid)
			`;
        }

        query += 
        `
		sort h.@attr @dir
		limit @offset, @limit
		let username = document(concat("users/",h.uuid)).username

		return merge(unset(h,"_key","_rev","_id"), {username})
		`

        let dir = "desc";
        if (req.body.type == "old") dir = "asc";

        let attr;
        if (req.body.type == "old" || req.body.type == "new") attr = "time";
        else attr = "score";

        let offset = 0;
        if (req.body.offset != null) offset = req.body.offset;
        log(query);

        let tmp = {
            myuuid: req.body.uuid,
            attr: attr,
            offset: offset,
            dir: dir,
            level: req.body.level
        };
        log(json(tmp));

        let limit = 10;
        if (req.body.limit != null)
        {
            limit = parseInt(req.body.limit);
        }

        db.query(
        {
            query,
            bindVars:
            {
                myuuid: req.body.uuid,
                attr: attr,
                offset: offset,
                dir: dir,
                level: req.body.level,
                limit: limit
            }
        }).then(
            cursor => cursor.all()
        ).then(
            keys =>
            {
                resp.data = keys;
                let ret = JSON.stringify(resp, null, 2);
                log(ret);
                log(keys.length)
                res.send(json(resp));
                log("/highscore");

            }, err =>
            {
                log(json(resp));
                log(err);
                resp.msg = "There was an error in processing, check the logs.";
                console.error('Failed to execute query:', err);
                res.send(json(resp));
            }
        );
        log("/highscore");
    })

    app.post('/addHighscore', (req, res) =>
    {
        log("/addhighscore");
        if (req.body.score == null || req.body.level == null)
        {
            let resp = {
                data: null,
                status: 0,
                debug: req.body,
                msg: "score and level required"
            };
            res.send(JSON.stringify(resp, null, 4));
            log(req.body);
            log(json(resp));
            return;
        }

        log(req.body);

        let resp = {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }
        let query =
        `
	  	insert
		{
		uuid: to_string(@uuid),
		score: to_number(@score),
		time: @time,
    	level: @level
		}
		into scores
		return NEW._key
	  	`
        let time = Math.round((new Date()).getTime() / 1000);

        db.query(
        {
            query: query,
            bindVars:
            {
                uuid: req.body.uuid,
                score: req.body.score,
                time: time,
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
                log(keys.length)
                res.send(json(resp));
                log("/addhighscore");

            }, err =>
            {
                resp.msg = "There was an error in processing, check the logs.";
                console.error('Failed to execute query:', err);
                res.send(json(resp));
            }
        );
        log("/addHighscore");
    })


    app.post('/changeUsername', (req, res) =>
    {
        log(req.body);

        let resp = {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }

        if (req.body.username == null || req.body.uuid == null)
        {
            let resp = {
                data: null,
                status: 0,
                debug: req.body,
                msg: "Missing parameter. username and uuid are required."
            };
            res.send(JSON.stringify(resp, null, 4));
            log(req.body);
            log(json(resp));
            return;
        }


        let query =
        `
	  	LET doc = DOCUMENT(concat("users/", @uuid))
		UPDATE doc WITH 
		{
		  username: @username
		} IN users
		return NEW.username
	  	`

        db.query(
        {
            query: query,
            bindVars:
            {
                uuid: req.body.uuid,
                username: req.body.username
            }
        }).then(
            cursor => cursor.all()
        ).then(
            keys =>
            {
                resp.data = keys;
                let ret = JSON.stringify(resp, null, 2);
                log(ret);
                log(keys.length)
                res.send(json(resp));

            }, err =>
            {
                resp.msg = "There was an error in processing, check the logs.";
                console.error('Failed to execute query:', err);
                log(json(resp));
                log(err);
                res.send(json(resp));
            }
        );
        log("/changeUsername");
    })
};