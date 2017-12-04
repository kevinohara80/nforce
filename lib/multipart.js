const mime = require('mime');

module.exports = function(opts) {
    const type = opts.sobject.getType();
    const entity = type === 'contentversion' ? 'content' : type;
    const name = type === 'contentversion' ? 'VersionData' : 'Body';
    const fileName = opts.sobject.getFileName();
    const isPatch = opts.method === 'PATCH' ? true : false;
    const multipart = [];

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