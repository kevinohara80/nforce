module.exports = {

  nonJsonResponse: function() {
    return new Error('Non-JSON response from Salesforce');
  },

  invalidJson: function() {
    return new Error('Invalid JSON response from Salesforce');
  },

  emptyResponse: function() {
    return new Error('Unexpected empty response');
  }

};
