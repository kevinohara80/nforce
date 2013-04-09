var nforce = require('../../');
var sfuser = 'dubeynikhileshs@gmail.com';
var sfpass = 'capgem123#mFcefb2PJXjKMiOm5nV8Hz5L';

var org = nforce.createConnection({
  clientId: '3MVG9Y6d_Btp4xp4XNcguxcwQ2eOBmsQg_G6AbaEH2AVrYFe3bGKRhmudj_PZculhFVyzcPTOAX9DGJqyKhhU',
  clientSecret: '5834036641293568722',
  redirectUri: 'http://localhost:3001/oauth/_callback'
});

org.authenticate({ username: sfuser, password: sfpass}, function(err, oauth) {
  if(err) {
    console.error('unable to authenticate to sfdc err '+err);
  } else {
                 //----- test postFeedItem --------------------
                 
                 var userId = '00590000000HQ1LAAW';
                 var messageSegment = {'type':'Text','text':'feed added from node.js'};
                 var messageSegments = [messageSegment];
                 org.postFeedItem(oauth,messageSegments,userId,function(err, resp) {
                                           if(err) {
                                           console.log('got error '+ err);
                                           }
                                           else
                                           {
                                           console.log('got success '+ JSON.stringify(resp));
                                           }
                                           });
       }
});