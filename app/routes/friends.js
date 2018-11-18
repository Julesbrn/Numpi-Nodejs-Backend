/*
user1 = sender
user2 = reciever
*/
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
    app.get('/abc', (req, res) =>
    {

        let resp = {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }

        let query =
        `
  		for a in users
  		limit 1
  		return a
	  	`

        db.query(
        {
            query: query,
            bindVars:
            {}
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
    })
    app.post('/friendRequests', (req, res) =>
    {


        log(req.body);

        let resp = {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }
        if (req.body.uuid == null)
        {
            uuid = req.body.uuid;
            let resp = {
                data: null,
                status: 0,
                debug: req.body,
                msg: "Missing uuid"
            };
            res.send(JSON.stringify(resp, null, 4));
            return;
        }


        let query =
        `
	  	for a in friends
		filter a.user2 == @uuid
		filter !a.accepted
		let ret = 
		{
		username: document(concat("users/",a.user1)).username,
		id: a._key
		}
		return ret
	  	`

        db.query(
        {
            query: query,
            bindVars:
            {
                uuid: req.body.uuid
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
        log("/friendRequests");
        log(json(resp));
    })



    app.post('/friends', (req, res) =>
    {

        log(req.body);

        let resp = {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }
        if (req.body.uuid == null)
        {
            uuid = req.body.uuid;
            let resp = {
                data: null,
                status: 0,
                debug: req.body,
                msg: "Missing uuid"
            };
            res.send(JSON.stringify(resp, null, 4));
            return;
        }


        let query =
        `
	  	for a in friends
		filter a.user1 == @uuid || a.user2 == @uuid
		filter a.accepted

		let uuid = (a.user1 == @uuid) ? a.user2 : a.user1
		let ret = 
		{
		username: document(concat("users/",uuid)).username
		}
		return ret
	  	`

        db.query(
        {
            query: query,
            bindVars:
            {
                uuid: req.body.uuid
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
        log("/friends");
        log(json(resp));
    })



    app.post('/confirmFriend', (req, res) =>
    {

        log(req.body);

        let resp = {
            status: 1,
            data: null,
            msg: "Success",
            debug: req.body
        }
        if (req.body.id == null)
        {
            uuid = req.body.id;
            let resp = {
                data: null,
                status: 0,
                debug: req.body,
                msg: "Missing id"
            };
            res.send(JSON.stringify(resp, null, 4));
            return;
        }


        let query =
        `
	  	update
		{
		_key: to_string(@id),
		accepted: true
		} in friends
		return NEW.accepted
	  	`

        db.query(
        {
            query: query,
            bindVars:
            {
                id: req.body.id
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
        log("/confirmFriend");
        log(json(resp));
    })
}