var mime = require('mime');

module.exports = function (opts) {
  var type      = opts.sobject.getType();
  var entity    = (type === 'contentversion') ? 'content' : type;
  var name      = (type === 'contentversion') ? 'VersionData' : 'Body';
  var fileName  = opts.sobject.getFileName();
  var isPatch   = (opts.method === 'PATCH') ? true : false;
  var multipart = [];

  multipart.push({
    'content-type': 'application/json',
    'content-disposition': 'form-data; name="entity_' + entity + '"',
    body: JSON.stringify(opts.sobject._getPayload(isPatch))
  });

  multipart.push({
    'content-type': mime.lookup(fileName),
    'content-disposition': 'form-data; name="' + name + '"; filename="' + fileName + '"',
    body: opts.sobject.getBody()
  });

  return multipart;
};
