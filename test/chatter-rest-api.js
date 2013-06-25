/**
 * Created with JetBrains PhpStorm.
 * User: Roberto Rojas
 * Date: 4/5/13
 * Time: 8:10 PM
 */

var nock = require('nock');
var assert = require("assert");
var _ = require('underscore');
var nforce = require('../');
var api = require('./mock/sfdc-rest-api');
var path    = require('path');
var fs      = require('fs');

var org = nforce.createConnection(api.getClient());

var oauth = api.getOAuth();

describe('chatter-rest-api', function() {

    before(function(done) {
        done();
    });

    describe('#getChatterNewsFeedItemsForProfileId', function() {

        var chatterFeedItemsPath = null;
        var feedItems = null;

        before(function(done) {
            chatterFeedItemsPath = path.resolve(__dirname, './mock/chatter-feed-items.json');
            feedItems =  JSON.parse(fs.readFileSync(chatterFeedItemsPath, 'utf8'));
            done();
        });


        it('should return Feed Items', function(done) {

            var id = "1234";
            var sfdcMockSite = nock('http://localhost:3000')
                .get('/services/data/v27.0/chatter/feeds/news/' + id + '/feed-items')
                .reply(200, feedItems);
            var nextPage = null;

             org.getChatterNewsFeedItemsForProfileId(id, nextPage, oauth, function(err, res) {

                assert.ok(err == null);
                assert.ok(_.isEqual(res, feedItems));

                done();
            });
        });


        it('should return next Page', function(done) {

            var id = "";
            var sfdcMockSite = nock('http://localhost:3000')
                .get('/services/data/v27.0/chatter/feeds/record/005E0000001T6bAIAS/feed-items')
                .reply(200, feedItems);
            var nextPage = '/services/data/v27.0/chatter/feeds/record/005E0000001T6bAIAS/feed-items';

            org.getChatterNewsFeedItemsForProfileId(id, nextPage, oauth, function(err, res) {

                assert.ok(err == null,  err);
                assert.ok(_.isEqual(res, feedItems));

                done();
            });
        });

    });


    describe('#postCommentMessageForFeedItemId', function() {
        var chatterCommentSegmentResponsePath = null;
        var chatterCommentSegmentResponse = null;
        var chatterCommentSegmentsPath = null;
        var chatterFeedCommentSegments = null;
        var id = "1234";

        before(function(done) {


            chatterCommentSegmentsPath = path.resolve(__dirname, './mock/chatter-feed-comment-segments.json');
            chatterFeedCommentSegments =  JSON.parse(fs.readFileSync(chatterCommentSegmentsPath, 'utf8'));

            chatterCommentSegmentResponsePath = path.resolve(__dirname, './mock/chatter-feed-comment-segments-response.json');
            chatterCommentSegmentResponse =  JSON.parse(fs.readFileSync(chatterCommentSegmentResponsePath, 'utf8'));

            var sfdcMockSite = nock('http://localhost:3000')
                .post('/services/data/v27.0/chatter/feed-items/' + id + '/comments')
                .reply(200, chatterCommentSegmentResponse);

            done();
        });


        it('should allow POSTing comments', function(done) {

            var nextPage = null;

            org.postCommentMessageForFeedItemId(id, chatterFeedCommentSegments, oauth, function(err, res) {

                assert.ok(err == null);
                assert.ok(_.isEqual(res, chatterCommentSegmentResponse));

                done();
            });
        });

    });



});