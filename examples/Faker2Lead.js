/* Kyle Bowerman 12/10/2013
   Purpose:
   To create random Leads of synthetic data and insert them into Salesforce via Nforce
   It uses Faker.js [https://github.com/marak/Faker.js/] to generate synthetic 
   Leads with good spread but can easily by modified to create any object.
   
   Instructions:
   1. Set 4 environmental vars:  SFUSER, SFPASS, CLIENTID, CLIENTSECRET in an .env file, export global var, or hard-code values in this file
   2. Modify the value for newLeadCount in the generateData function to determine how many random leads to create.
   3. This script will generate a output json file called leadOut.json prior to inserting the leads.   If you like you can comment out the insertLead
      call in order to just generate the json output to insert via data loader.   To do this you should get jq to convert this json file to csv.
      The command would be something like this:
      cat leadOut.json | jq -r '.[] | [.firstName,.phone, .company.name] | @csv'  
 
   Modifications to ../lib/Faker.js
   1. Faker.Helpers.sfLead was created, you should edit this or create a new helper for each object you which to insert.
   2. I created Faker.Internet.kyleEmail since the original would use a new firstname and lastname to create an email instead 
   of the firstname and lastname inserted into the lead.
   3. Same thing for Faker.Internet.kyleUserName
   4. Faker.definition.tv_channel  and Faker.definitions.ticker which contain Comcast TV Chanel listings and NYSE ticker respectively to demonstrate 
      how to create custom data types.  Of course these are not inserted into the lead because it would be a custom field.   But I think you get the picture.
 */
var sys = require('sys');
var fs = require('fs');
var nforce = require('../');
var Faker = require('../lib/Faker');

var sfuser = process.env.SFUSER;
var sfpass = process.env.SFPASS;
var clientId = process.env.CLIENTID;
var clientSecret = process.env.CLIENTSECRET;


var oauth = '';

var org = nforce.createConnection({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: 'http://localhost:3000/oauth/_callback',
    apiVersion: 'v27.0', // optional, defaults to current salesforce API version
    environment: 'production', // optional, salesforce 'sandbox' or 'production', production default
    mode: 'multi' // optional, 'single' or 'multi' user mode, multi default
});


function insertLead(data) {
    console.log('Attempting to insert lead ' + data.firstName + ' ' + data.lastName);
    var ld = nforce.createSObject('Lead', {
        FirstName: data.firstName,
        LastName: data.lastName,
        Company: data.company.name,
        State: data.address.state,
        City: data.address.city,
        Street: data.address.street,
        PostalCode: data.address.zipcode,
        Phone: data.phone,
        MobilePhone: data.mobilePhone,
        Email: data.email,
        Website: data.website,
        Latitude: data.address.geo.lat,
        Longitude: data.address.geo.lng,
        //batch__c: '003' // kyle uses this 
    });
    org.insert(ld, oauth, function (err, resp) {
        if (err) {
            console.error('--> unable to insert lead');
            console.error('--> ' + JSON.stringify(err));
        } else {
            console.log(data.firstName + ' ' + data.lastName + '--> lead inserted');
        }
    });
}

// generate Synthetic data using ../lib/Faker.js  Faker.Helpers.sfLead method.  You can reuse this or create your own.
function generateData() {
    var bigSet = [];
    var newLeadCount = 20;

    for (var i = 0; i < newLeadCount; i++) {
        bigSet.push(Faker.Helpers.sfLead());
        console.log('created', bigSet[i].lastName);
        insertLead(bigSet[i]);
    }

    fs.writeFile('leadOut.json', JSON.stringify(bigSet), function () {
        sys.puts("json data generated successfully to leadOut.json !");
    });
}




console.log('Authenticating with Salesforce');

org.authenticate({
    username: sfuser,
    password: sfpass
}, function (err, resp) {
    if (err) {
        console.error('--> unable to authenticate to sfdc');
        console.error('--> ' + JSON.stringify(err));
    } else {
        console.log('--> authenticated!');
        oauth = resp;
        generateData();
    }
});