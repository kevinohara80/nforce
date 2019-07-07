const nforce = require('nforce')
require('dotenv').config()

/**
 *  Initialise connection parameters for Salesforce Connected App
 */
const org = nforce.createConnection({
  clientId: process.env.CONSUMER_KEY,
  clientSecret: process.env.CONSUMER_SECRET,
  redirectUri: 'https://localhost:3000/oauth/_callback',
  environment: 'production',
  mode: 'multi'
})

/**
 * Authenticate to login a user in the org
 * @param {string} username - e.g. john@example.com
 * @param {string} password
 * @param {string} securityToken - Your user's security token.
 *                            This can be reset in the org if needed.
 */
const authenticate = (username, password, securityToken) =>
  new Promise((resolve, reject) => {
    // Authenticate using multi user mode
    org.authenticate(
      {
        username: username,
        password: password,
        securityToken: securityToken
      },
      (error, response) => {
        if (!error) {
          resolve(response)
        } else {
          reject(error)
        }
      }
    )
  })

/**
 * Perform a SOQL Query
 * @param {string} queryString - SOQL query
 * @param {object} oauth       - OAuth string received from successful authentication
 */
const query = (queryString, oauth) =>
  new Promise((resolve, reject) => {
    org.query(
      {
        query: queryString,
        oauth: oauth
      },
      (error, response) => {
        if (!error) {
          resolve(response.records)
        } else {
          reject(error)
        }
      }
    )
  })

/**
 * Create a record
 * @param {string} sobjectName - Name of the SObject (e.g. Account)
 * @param {object} recordData  - Key value pair of Field Names and Field Values
 * @param {object} oauth       - OAuth string received from successful authentication
 */
const createRecord = (sobjectName, recordData, oauth) => {
  const sobj = nforce.createSObject(sobjectName, recordData)
  return new Promise((resolve, reject) => {
    org.insert(
      {
        sobject: sobj,
        oauth: oauth
      },
      (error, response) => {
        if (!error) {
          resolve(response)
        } else {
          reject(error)
        }
      }
    )
  })
}

/**
 * Update a record
 * @param {string} sobjectName - Name of the SObject (e.g. Account)
 * @param {object} recordDataWithID  - Key value pair of Field Names and Field Values
 * @param {object} oauth       - OAuth string received from successful authentication
 */
const updateRecord = (sobjectName, recordDataWithID, oauth) => {
  const sobj = nforce.createSObject(sobjectName, recordDataWithID)
  return new Promise((resolve, reject) => {
    org.update(
      {
        sobject: sobj,
        oauth: oauth
      },
      (error, response) => {
        if (!error) {
          resolve(response)
        } else {
          reject(error)
        }
      }
    )
  })
}

/**
 * Upsert a record
 * @param {string} sobjectName - Name of the SObject (e.g. Account)
 * @param {object} recordDataWithID  - Key value pair of Field Names and Field Values
 * @param {object} oauth       - OAuth string received from successful authentication
 */
const upsertRecord = (sobjectName, recordDataWithID, oauth) => {
  const sobj = nforce.createSObject(sobjectName)
  const recordId = !!recordDataWithID.id ? recordDataWithID.id : ''
  sobj.setExternalId('Id', recordId)
  Object.entries(recordDataWithID).map(([key, value]) => {
    sobj.set(key, value)
  })
  return new Promise((resolve, reject) => {
    org.upsert(
      {
        sobject: sobj,
        oauth: oauth,
        requestOpts: {
          method: !recordId ? 'POST' : 'PATCH'
        }
      },
      (error, response) => {
        if (!error) {
          if(!recordId) {
            resolve(response)
          } else {
            resolve(recordDataWithID)
          }
        } else {
          reject(error)
        }
      }
    )
  })
}

/**
 * Delete a record
 * @param {string} sobjectName - Name of the SObject (e.g. Account)
 * @param {object} recordDataWithID  - Key value pair of Field Names and Field Values
 * @param {object} oauth       - OAuth string received from successful authentication
 */
const deleteRecord = (sobjectName, recordDataWithID, oauth) => {
  const sobj = nforce.createSObject(sobjectName, recordDataWithID)
  return new Promise((resolve, reject) => {
    org.delete(
      {
        sobject: sobj,
        oauth: oauth
      },
      (error, response) => {
        if (!error) {
          resolve(response)
        } else {
          reject(error)
        }
      }
    )
  })
}

/**
 * Mock Data
 */
const sampleData = {
  Name: 'Spiffy Cleaners',
  Phone: '800-555-2345',
  SLA__c: 'Gold'
}

const sampleDataUpdated = {
  Name: 'Spiffy Cleaners Updated',
  Phone: '800-555-5555',
  SLA__c: 'Gold'
}

const sampleDataUpserted = {
  Name: 'Spiffy Cleaners Upserted',
  Phone: '800-777-7777',
  SLA__c: 'Gold'
}

/**
 * Run the app
 */
const run = async () => {
  try {
    // Perform authentication
    const oauth = await authenticate(
      process.env.SALESFORCE_USERNAME,
      process.env.SALESFORCE_PASSWORD,
      process.env.SALESFORCE_SECURITY_TOKEN
    )
    console.log(oauth)

    // Perform a query
    let records = await query('SELECT Id, Name FROM Account LIMIT 10', oauth)
    console.log(records)

    // Create a record
    let account = await createRecord('Account', sampleData, oauth)
    console.log(account)

    // Perform account query
    let accountRecord = await query(
      `SELECT Id, Name, SLA__c FROM Account WHERE Id = '${account.id}'`,
      oauth
    )
    console.log('Created: ', accountRecord)

    // Update a record
    sampleDataUpdated.id = account.id // Assign the account ID to be updated
    let accountUpdated = await updateRecord('Account', sampleDataUpdated, oauth)
    console.log(accountUpdated)

    // Perform another account query
    let accountRecordUpdated = await query(
      `SELECT Id, Name, SLA__c FROM Account WHERE Id = '${account.id}'`,
      oauth
    )
    console.log('Updated: ', accountRecordUpdated)

    // Perform account delete
    let accountDeleted = await deleteRecord('Account', sampleDataUpdated, oauth)
    console.log('Deleted: ', sampleDataUpdated.id)

    // Upsert a record (Insert)
    let accountUpserted = await upsertRecord('Account', sampleDataUpserted, oauth)
    console.log('Upsert Insert:', accountUpserted)

    // Prepare upsert
    sampleDataUpserted.id = accountUpserted.id
    sampleDataUpserted.Name = 'Spiffy Cleaners Upserted Twice'

    // Upsert a record (Update)
    let accountUpserted2 = await upsertRecord('Account', sampleDataUpserted, oauth)
    console.log('Upsert Update:', accountUpserted2)

  } catch (error) {
    console.error(error)
  }
}
run()
