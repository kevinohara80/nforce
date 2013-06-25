
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , chatter = require('./routes/chatter')
  , http = require('http')
  , path = require('path')
  , nforce = require('../../../nforce');

var app = express();


var org = nforce.createConnection({
    clientId: '3MVG9rFJvQRVOvk5nd6A4swCyck.4BFLnjFuASqNZmmxzpQSFWSTe6lWQxtF3L5soyVLfjV3yBKkjcePAsPzi',
    clientSecret: '9154137956044345875',
    redirectUri: 'http://localhost:3000/oauth/_callback'

    // If running in 'single-user' mode, you don't need to pass the request.session.oauth parameter
    // to the org methods.
    //,mode: 'single'
});


/*
 single-mode authentication:
 ==========================

org.authenticate({ username: "user", password: "password+SecurityToken"}, function(err, res) {
    if(err) return console.error('unable to authenticate to sfdc');

   if(!err) console.log('Cached Token: ' + org.oauth.access_token);


});
*/


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());

app.use(org.expressOAuth({onSuccess: '/chatter', onError: '/oauth/error'}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/oauth/authorize', function(req, res){
    res.redirect(org.getAuthUri());
});

app.get('/', routes.index);
app.get('/chatter', chatter.index);




app.get('/chatter/feeds/whatfollow/:chatterId?', function(request, response) {
    var chatterId = request.params.chatterId;
    var nextPage = null; //no need for next page.
    console.log('chatterId: ' + chatterId);
    if (!chatterId) {
        response.send({error: 'The chatterId is missing.'});
        return;
    }
    var callback = request.query["callback"];


    org.getChatterNewsFeedItemsForProfileId(chatterId, nextPage, request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });

});

app.get('/chatter/feeds/people/:chatterId?', function(request, response) {
    var chatterId = request.params.chatterId;
    var nextPage = null; //no need for next page.
    console.log('chatterId: ' + chatterId);
    if (!chatterId) {
        response.send({error: 'The chatterId is missing.'});
        return;
    }
    var callback = request.query["callback"];

    org.getChatterPeopleFeedItemsById(chatterId, nextPage, request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });

});

app.get('/chatter/feeds/groups/:chatterId?', function(request, response) {
    var chatterId = request.params.chatterId;
    var nextPage = null; //no need for next page.
    console.log('chatterId: ' + chatterId);
    if (!chatterId) {
        response.send({error: 'The chatterId is missing.'});
        return;
    }
    var callback = request.query["callback"];

    org.getChatterGroupFeedItems(chatterId, nextPage, request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });

});

app.get('/chatter/feeds/record/:chatterId?', function(request, response) {
    var chatterId = request.params.chatterId;
    var nextPage = null; //no need for next page.
    console.log('chatterId: ' + chatterId);
    if (!chatterId) {
        response.send({error: 'The chatterId is missing.'});
        return;
    }
    var callback = request.query["callback"];

    org.getChatterRecordFeedItemsById(chatterId, nextPage, request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });

});

app.get('/chatter/feeds/tome/:chatterId?', function(request, response) {
    var chatterId = request.params.chatterId;
    var nextPage = null; //no need for next page.
    console.log('chatterId: ' + chatterId);
    if (!chatterId) {
        response.send({error: 'The chatterId is missing.'});
        return;
    }
    var callback = request.query["callback"];

    org.getChatterFeedsToId(chatterId, nextPage, request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });

});


app.get('/chatter/profile/users/:chatterId?', function(request, response) {
    var chatterId = request.params.chatterId;
    var nextPage = null; //no need for next page.
    console.log('chatterId: ' + chatterId);
    if (!chatterId) {
        response.send({error: 'The chatterId is missing.'});
        return;
    }
    var callback = request.query["callback"];

    org.getChatterUserProfileById(chatterId, nextPage, request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });

});

app.get('/chatter/profile/groups/:chatterId?', function(request, response) {
    var chatterId = request.params.chatterId;
    var nextPage = null; //no need for next page.
    console.log('chatterId: ' + chatterId);
    if (!chatterId) {
        response.send({error: 'The chatterId is missing.'});
        return;
    }
    var callback = request.query["callback"];

    org.getChatterGroupProfileById(chatterId, nextPage, request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });

});


app.post('/chatter/feeditems/:feeditemid/comments', function(request, response) {

    var feeditemid = request.params.feeditemid;
    console.log('feeditemid: ' + feeditemid);
    if (!feeditemid) {
        response.send({error: 'The feeditemid is missing.'});
        return;
    }
    var callback = request.query["callback"];
    var comment = request.body.comment;
    var segments = [
            {
              type: 'Text',
              text : comment
            }
     ];

    org.postCommentMessageForFeedItemId(feeditemid, segments, request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });


});


app.post('/chatter/feeditems/:feeditemid/likes', function(request, response) {

    var feeditemid = request.params.feeditemid;
    console.log('feeditemid: ' + feeditemid);
    if (!feeditemid) {
        response.send({error: 'The feeditemid is missing.'});
        return;
    }
    var callback = request.query["callback"];

    org.likeFeedItemForId(feeditemid,request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });


});

app.post('/chatter/comment/:feeditemid/likes', function(request, response) {

    var feeditemid = request.params.feeditemid;
    console.log('feeditemid: ' + feeditemid);
    if (!feeditemid) {
        response.send({error: 'The feeditemid is missing.'});
        return;
    }
    var callback = request.query["callback"];

    org.likeCommentForFeedItemForId(feeditemid,request.session.oauth, function(err,chatterFeedItems){
        if(callback !=null)
        {
            response.send(callback+'('+JSON.stringify(chatterFeedItems)+');');
        }
        else
        {
            response.send(JSON.stringify(chatterFeedItems));
        }

    });


});




http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
