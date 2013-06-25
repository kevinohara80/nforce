
/*
 * GET chatter data.
 */

exports.index = function(req, res){
    res.render('chatter', { title: 'Express - Chatter Sample Application' });
};