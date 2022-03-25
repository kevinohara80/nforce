module.exports = {

  nonJsonResponse: function() {
    return new Error('Non-JSON response from Salesforce 2');
  },

  invalidJson: function() {
    return new Error('Invalid JSON response from Salesforce 2');
  },

  emptyResponse: function() {
    return new Error('Unexpected empty response 2');
  }

};
