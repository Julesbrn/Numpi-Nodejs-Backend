/*
user1 = sender
user2 = receiver
*/
function log(str)
{
    str += "\n";
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
    app.post('/addFriend', (req, res) =>
    {

        //query 1 -> get username 
        //query 2 -> check if friend request was already made
        //query 3 -> make friend request


        if (req.body.uuid == null || req.body.username == null)
        {
            let resp = 
            {
                status: -1,
                msg: "missing uuid and/or username"
            }
            res.send(json(resp));
            return;
        }



        //check error here

        let username = req.body.username.split("#")[0];
        let extra = req.body.username.split("#")[1];
        console.log(username + "#" + extra);

        log("A");
        let query1 = 
        `
        for u in users
        filter u.username == @username && u.extra == to_string(@extra)
        limit 1 //assumes 1
        return u._key
        `
        let themuuid = "";

        db.query(
        {
            query: query1,
            bindVars:
            {
                username: username,
                extra: extra
            }
        }).then(
            cursor => cursor.all()
        ).then(
        keys=>
        {
            console.log(keys);
            console.trace(keys);
            
            log("B");
            log(keys)
            log("=====");
            log(keys[0]);
            themuuid = keys[0];
            let query2 = 
            `
            let a = 
            (
            for f in friends
            filter f.user1 == to_string(@thisuuid) && f.user2 == to_string(@themuuid)
            return f
            )
            return a
            `

            return new Promise(function(resolve, reject) 
            {
                if (keys == null || keys[0] == null || keys[0] == [] || keys[0].length == 0)
                {
                    log("keys was null");
                    reject("Username not found");
                }
                if (req.body.uuid == themuuid)
                {
                    //reject("You cannot add yourself as a friend.");
                }

                /*if (keys == null || keys[0] == null || keys[0] == [] || keys[0].length == 0)
                {
                    console.log("ghj");
                    reject("error in backend, length 0");
                }*/
                db.query(
                {
                    query: query2,
                    bindVars:
                    {
                        thisuuid: req.body.uuid,
                        themuuid: themuuid
                    }
                }).then(
                    cursor => cursor.all()
                ).then(keys =>
                {
                    log("resolving");
                    resolve(keys);
                })
                .catch(err=>
                {
                    reject(err);
                })
            })
        })
        .then((keys) =>
        {
            log("resolved");
            console.log(keys, themuuid);
            log("C");
            log(keys[0]);
            log("themuuid = :" + themuuid + ":");

            let query3 = 
            `
            insert
            {
            user1: to_string(@thisuuid), //sender
            user2: to_string(@themuuid), //receiver
            accepted: false
            } into friends
            return NEW
            `
            return new Promise(function(resolve, reject) 
            {

                log("keys[0] before query3 is ")
                log(keys[0]);
                console.log(keys[0]);
                //resolve("abc");
                if (keys[0].length != 0)
                {
                    log("keys[0] before query3 is ")
                    log(keys[0]);
                    resolve("Friend request already sent.");
                }
                db.query(
                {
                    query: query3,
                    bindVars:
                    {
                        thisuuid: req.body.uuid,
                        themuuid: themuuid
                    }
                }).then(
                    cursor => cursor.all()
                ).then(keys =>
                {
                    if (keys.length != 1)
                    {
                        log("there was an errorABC");
                        log(keys);
                    }
                    resolve("Friend request sent.");
                })
                .catch(err=>
                {
                    reject(err);
                })
            })
        })
        .then(
        (ret)=>
        {
            let resp = 
            {
                status: 1,
                msg: ret
            };

            res.send(json(resp));
            /*if (ret[0] != null)
            {
                res.send("Success");
            }
            else
            {
                res.send("fail");
            }*/
            //res.send(ret);
            console.log(ret);
        })
        .catch(
        err=>
        {
            console.log("" + err);
            if ((""+err) == "Username not found")
            {
                let resp = 
                {
                    status: 0,
                    msg: "Username not found"
                }
                res.send(json(resp));
            }
            else if ((""+err) == "You cannot add yourself as a friend.")
            {
                let resp = 
                {
                    status: 0,
                    msg: "You cannot add yourself as a friend."
                }
                res.send(json(resp));
            }
            else
            {
                console.log("there was an error");
                log(err);
                let str = ""+ err;
                if (str.indexOf("unique constraint violated") !== -1)
                {
                    resp = 
                    {
                        status: 1,
                        msg: "Friend request already sent"
                    };
                    res.send(json(resp));
                    log("friend request already sent");
                }
                else if (str.indexOf("no value specified for declared bind parameter") !== -1)
                {
                    resp = 
                    {
                        status: -1,
                        msg: "Invalid username"
                    };
                    res.send(json(resp));
                    log("Invalid username");
                }
                else
                {
                    resp = 
                    {
                        status: -1,
                        msg: "An error has occured"
                    }
                    res.send(json(resp));
                }
            }
        })







    })
    app.post('/getFriends', (req, res) =>
    {
        log(req.body);
        let resp = 
        {
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

        /*
        let query =
        `
        LET a = 
        (
        for item in friends
            filter item.user1 == @uuid || item.user2 == @uuid
            filter item.accepted

            let uuid = (item.user1 == @uuid) ? item.user2 : item.user1
            return document(concat("users/",uuid)).username
        )

        LET b = 
        (
        for item in friends
            filter item.user2 == @uuid
            filter !item.accepted
            return  
            {
            username: document(concat("users/",item.user1)).username,
            id: item._key
            }
        )

        return {friends: a, requests: b}
        `*/

        // new version
		let query =
        `
        LET a = 
        (
        for item in friends
            filter item.user1 == @uuid || item.user2 == @uuid
            filter item.accepted

            let uuid = (item.user1 == @uuid) ? item.user2 : item.user1
            return 
            {
            	username: document(concat("users/",uuid)).username,
            	id: item._key
            }
        )

        LET b = 
        (
        for item in friends
            filter item.user2 == @uuid
            filter !item.accepted
            return  
            {
            username: document(concat("users/",item.user1)).username,
            id: item._key
            }
        )

        return {friends: a, requests: b}
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
        log("/getFriends");
    })



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



    app.post('/acceptFriend', (req, res) =>
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
        log("/acceptFriend");
        log(json(resp));
    })


    app.post('/rejectFriend', (req, res) =>
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
        REMOVE document(concat("friends/",@id)) IN friends
        return {deleted: true}
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
                log(err);
                res.send(json(resp));
            }
        );
        log("/rejectFriend");
        log(json(resp));
    })



     app.post('/deleteFriend', (req, res) =>
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
        REMOVE document(concat("friends/",@id)) IN friends
        return {deleted: true}
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
                log(err);
                res.send(json(resp));
            }
        );
        log("/deleteFriend");
        log(json(resp));
    })
}