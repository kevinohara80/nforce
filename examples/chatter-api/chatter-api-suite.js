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
                 console.log('recvd oauth  ');
                //--- test sendPrivateMessage
                 var body = 'Are we ready for next week\'s customer meeting?';
                 var recipients = ['00590000000HQ1LAAW','00590000000z1KOAAY'];//userId
                 org.sendPrivateMessage(oauth,body,recipients,function(err, resp) {
                                                        if(err) {
                                                        console.log(' sendPrivateMessage got error '+ err);
                                                        }
                                                        else {
                                                          console.log('sendPrivateMessage recvd success \n'+ JSON.stringify(resp));
                                                        }
                                                        }
                                                        
                                                        );

                 
                 /*
                  //----- test unFollowARecord --------------------
                 var subscriptionId = '0E890000002rGMxCAM'; // Specifiy the id which you received in the response of followARecord API.
                 org.unFollowARecord(oauth,subscriptionId,function(err, resp) {
                                     if(err) {
                                        console.log('unFollowARecord got error '+ err);
                                     }
                                     else {
                                        console.log('unFollowARecord recvd success \n');
                                     }
                                     }
                  );*/
                 
                 /*
                 //----- test followARecord --------------------
                 
                 var recordId = '00590000000z1KOAAY';
                 org.followARecord(oauth,recordId,function(err, resp) {
                                  if(err) {
                                  console.log('followARecord got error '+ err);
                                  }
                                  else
                                  {
                                  console.log('followARecord recvd success \n'+ JSON.stringify(resp));
                                  }
                                  }
                                  
                                  );
                 
                 */
                 /*
                 //----- test postToAGroup --------------------
                 
                 var groupId = '0F990000000D9TpCAK';
                 var messageSegments = [{'type':'Text','text':'This is a message for the entire group from chatter-APIs node lib.'}];
                 org.postToAGroup(oauth,groupId,messageSegments,function(err, resp) {
                               if(err) {
                               console.log('postToAGroup got error '+ err);
                               }
                               else
                               {
                               console.log('postToAGroup recvd success \n'+ JSON.stringify(resp));
                               }
                               }
                               
                               );
                */
                 
                 /*
                 //----- test joinGroup --------------------
                  var userId = '00590000000HQ1LAAW';//userId
                  var groupId = '0F990000000D9TpCAK';
                 org.joinGroup(oauth,userId,groupId,function(err, resp) {
                                        if(err) {
                                        console.log('joinGroup got error '+ err);
                                        }
                                        else
                                        {
                                        console.log('joinGroup recvd success \n'+ JSON.stringify(resp));
                                        }
                                        }
                                        
                                        );
                */
                 
                 //----- test getRecommendations --------------------
                 
                /* org.getRecommendations(oauth,function(err, resp) {
                                                        if(err) {
                                                        console.log('getRecommendations got error '+ err);
                                                        }
                                                        else
                                                        {
                                                        console.log('getRecommendations recvd success \n'+ JSON.stringify(resp));
                                                        }
                                                        }
                                                        
                                                        );
                 */
                 /*
                 //----- test getListOfWhatUserIsFollowing --------------------
                 
                 var userId = '00590000000HQ1LAAW';//userId
                 getListOfWhatUserIsFollowing(oauth,userId,function(err, resp) {
                                            if(err) {
                                            console.log('getListOfWhatUserIsFollowing got error '+ err);
                                            }
                                            else
                                            {
                                            console.log('getListOfWhatUserIsFollowing recvd success \n'+ JSON.stringify(resp));
                                            }
                                            }
                                            
                                            );
                 */
                 
                /*
                //----- test getFeedItemsForARecord --------------------
                 var recordId = '00590000000HQ1LAAW';//userId
                 org.getFeedItemsForARecord(oauth,recordId,function(err, resp) {
                                            if(err) {
                                            console.log('got error '+ err);
                                            }
                                            else
                                            {
                                            console.log('getFeedItemsForARecord recvd success \n'+ JSON.stringify(resp));
                                            }
                                            }
                                            
                                            );
                 */
                 
                 /*
                 
                  //----- test searchARecordFeed --------------------
                  org.searchARecordFeed(oauth,'comment',function(err, resp) {
                  if(err) {
                  console.log('got error '+ err);
                  }
                  else
                  {
                  console.log('searchARecordFeed recvd success \n'+ JSON.stringify(resp));
                  }
                  }
                  );
                  
                  */
                 
                 /*
                  //----- test getNewsFeed --------------------
                  org.getNewsFeed(oauth,function(err, resp) {
                                 if(err) {
                                 console.log('got error '+ err);
                                 }
                                 else
                                 {
                                 console.log('getNewsFeed recvd success \n'+ JSON.stringify(resp));
                                 }
                                 }
                                 );
                  */
                 
                /*
                 //----- test shareFeedItem --------------------
                 var feedItemId = '0D59000000FdgnbCAB';
                 var userId = '00590000000HQ1LAAW';
                 org.shareFeedItem(oauth,feedItemId,userId,function(err, resp) {
                                   if(err) {
                                   console.log('got error '+ err);
                                   }
                                   else
                                   {
                                   console.log('shareFeedItem recvd success \n'+ JSON.stringify(resp));
                                   }
                                   });
                 

                 */
                 
                /*
                 //----- test likeFeedItems --------------------
                 var feedItemId = '0D59000000FdgnbCAB';
                 org.likeFeedItems(oauth,feedItemId,function(err, resp) {
                                           if(err) {
                                           console.log('got error '+ err);
                                           }
                                           else
                                           {
                                           console.log('likeFeedItems recvd success \n'+ JSON.stringify(resp));
                                           }
                                           });

                */
                 /*
                 //----- test mentionUserInComment --------------------
                 
                 var feedItemId = '0D59000000FdgnbCAB';
                 var userId = '00590000000HQ1LAAW';
                 var comments = 'comment added from code and mentioned ';
                 var messageSegments = [{'type':'Text','text':comments},{'type':'mention','id':userId}];
                 org.mentionUserInComments(oauth,messageSegments,feedItemId,function(err, resp) {
                                           if(err) {
                                           console.log('got error '+ err);
                                           }
                                           else
                                           {
                                           console.log('mentionUserInComments recvd success \n'+ JSON.stringify(resp));
                                           }
                                           });
                 
                 
                 */
                 
                 /*
                 //----- test mentionUserInFeedItem --------------------
                 
                 var userId = '00590000000HQ1LAAW';
                 var comments = 'comment added from code ';
                 var messageSegments = [{'type':'Text','text':comments},{'type':'mention','id':userId}];
                 org.mentionUserInFeedItem(oauth,messageSegments,userId,function(err, resp) {
                                           if(err) {
                                           console.log('got error '+ err);
                                           }
                                           else
                                           {
                                           console.log('mentionUserInFeedItem recvd success \n'+ JSON.stringify(resp));
                                           }
                                           });

                 
                 
                 */
                 
                 /*
                 //----- test postFeedItem --------------------
                 
                 var userId = '00590000000HQ1LAAW';
                 var messageSegment = {'type':'Text','text':'feed added from node.js'};
                 var messageSegments = [messageSegment];
                 org.postFeedItem(oauth,messageSegments,feedItemId,function(err, resp) {
                                           if(err) {
                                           console.log('got error '+ err);
                                           }
                                           else
                                           {
                                           console.log('got success '+ JSON.stringify(resp));
                                           }
                                           });
                  */
                 
                 /*
                
                 //----- test addCommentsToFeedById --------------------
                 
                 var feedItemId = '0D59000000C8JkKCAV';
                 var comments = 'comment added from code';
                 var messageSegment = {'type':'Text','text':'comment added from node.js'};
                 var messageSegments = [messageSegment];
                 org.addCommentsToFeedById(oauth,messageSegments,feedItemId,function(err, resp) {
                                           if(err) {
                                           console.log('got error '+ err);
                                           }
                                           else
                                           {
                                           console.log('got success '+ JSON.stringify(resp));
                                           }
                                           });
                 */
                 
                /*
                 //----- test getCurrentChatterUser --------------------
                 
                 org.getCurrentChatterUser(oauth,function(err, resp) {
                                            if(err) {
                                            console.log('got error '+ err);
                                            }
                                            else
                                            {
                                            
                                            }
                                            });
                 */
                 
            
                /*
                 //------- test getAllChatterFeedItems --------------------
                 
                 org.getAllChatterFeedItems(oauth,function(err, resp) {
                        if(err) {
                            console.log('got error '+ err);
                        }
                        else
                        {
                                  for(var index in resp.items) {
                                      var feedItem = resp.items[index];
                                      console.log('\nfeedItem.Id :- '+feedItem.id+'\nfeedItem.url :- '+feedItem.url+'\nfeedItem.type :- '+feedItem.type+'\nfeedItem.parent.name :- '+feedItem.parent.name+'\nfeedItem.parent.title :- '+feedItem.parent.title+'\nfeedItem.parent.companyName :- '+feedItem.parent.companyName);
                                  }
                        }
                                              });
                */
                 
                 
                 
       }
});