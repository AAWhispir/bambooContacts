// Access Bamboo Enterprise Directory and Import Contacts to Whispir

var fs = require('fs');

var bambooAuth = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
var whispirAPIKey = 'XXXXXXXXXXXXXXXXXXXXXXXXX'
var whispirAuth = 'YYYYYYYYYYYYYYYYYYY'
var whispirWorkspaceId = '5479D28EC0AF645F'
var bambooEDInputFile = 'BambooOutput2.json'
var bambooSource = 'API' // 'FILE' || 'API'
var TZ = '+10'
var delay = 800 // Add API Delay for initial loads to avoid transaction/sec limits

const processArgs = () => {

  process.argv.forEach((val, index, array) => {
      if ((index === 2) && (val === 'help')) {

          helpOutput()
          process.exit(1)

      }
      else {

          if (index >= 2) {

              switch (index) {
                  case 2: {

                      bambooAuth = val
                      console.log("Bamboo Auth:" + val)
                      break

                  }
                  case 3: {

                      whispirAPIKey = val
                      console.log("Whispir API Key:" + val)
                      break

                  }
                  case 4: {

                      whispirAuth = val
                      console.log("Whispir Auth:" + val)
                      break

                  }
                  case 5: {

                      whispirWorkspaceId = val
                      console.log("Whispir Workspace ID:" + val)
                      break

                  }
                  
                  default: {

                      console.log("Bamboo ED Input File:" + val)
                      bambooEDInputFile = val
                      val === '' ? bambooSource = 'API' : bambooSource = 'FILE'

                  }

              }

          }

      }
      
  })
  console.log(`Bamboo source: ${bambooSource}`)
}

const helpOutput = () => {
  console.log("Usage arguments: <bamboo-auth> <whispir-api-key> <whispir-auth> <whispir-workspaceId> optional:<bamboo-ED-inputFile>")
}

var readFilePromise = (file) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(data))
      }
    })
  })
}

async function getData() {

  const BambooURL = 'https://api.bamboohr.com/api/gateway.php/whispir/v1/employees/directory';

  // Set up Bamboo Authorisation Headers
  const BambooOptions = {

    method: 'GET',

    headers: {

      Accept: 'application/json',
      Authorization: `Basic ${bambooAuth}`

    }

  }

  let url = `https://api.au.whispir.com/workspaces/${whispirWorkspaceId}/contacts?limit=0&fields=firstName,lastName,personalFax1,workMobilePhone1,workEmailAddress1`

  let options = {

    method: 'GET',
    headers: {

      'Content-Type': 'application/json',
      'X-Api-Key': `${whispirAPIKey}`,
      Accept: 'application/vnd.whispir.contact-v1+json',
      Authorization: `Basic ${whispirAuth}`

    }

  }

  console.log(`Bamboo Source: ${bambooSource}`)

  const [currentContactsResponse, masterDataResponse] = await Promise.all([

    fetch(url, options),
    bambooSource === 'FILE' ? readFilePromise(bambooEDInputFile) : fetch(BambooURL, BambooOptions) // for fetching from Bamboo API

  ])

  const currentContacts = await currentContactsResponse.json()
  const masterData = bambooSource === 'FILE' ?  await masterDataResponse : await masterDataResponse.json() // for fetching from Bamboo API

  return [currentContacts, masterData]

}

const getWorkCountry = (val) => { // Resolves to Country locations

  switch (val) {

    case 'Jakarta':
      return 'Indonesia'
    case 'Manila':
      return 'Philippines'
    case 'Singapore':
      return 'Singapore'
    case 'Colorado':
      return 'United States'
    case 'New Zealand':
      return 'New Zealand'
    default:
      return 'Australia'

  }

}

const cleanNumbers = (val) => {

  val && (val = val.replace(/\D/g, ''))
  return val

}

const getNumbers = (val) => {

  if (val) {

    val = cleanNumbers(val)
    val = val.substr(val.length - 4)

  }
  return val

}

const checkContactInfoForUpdate = (master, existing) => {

  console.log(`Checking numbers:${master.id} ${master.firstName} ${master.lastName} ${master.mobilePhone} ${existing.workMobilePhone1}`)
  if (master.mobilePhone === null) {

    if (existing.workMobilePhone1 === 'null') { // undefined numbers returned as 'null' string from Whispir

      console.log('\x1b[33m%s\x1b[0m', "Undefined work mobile number")
      return true
    }
    else return false

  }
  else {

    if (getNumbers(master.mobilePhone) === getNumbers(existing.workMobilePhone1)) {
      return true
    }
    else {
      return false
    }

  }

}

async function addWhispirContact2(value = { firstName: 'Fred', lastName: 'Flintstone', mobilePhone: '1234567890', workEmail: 'fred@fred.com', id: '12345', location: 'Melbourne' }) {

  let url = `https://api.au.whispir.com/workspaces/${whispirWorkspaceId}/contacts`
  let options = {
    method: 'POST',
    headers: {

      'Content-Type': 'application/vnd.whispir.contact-v1+json',
      'X-Api-Key': `${whispirAPIKey}`,
      Accept: 'application/vnd.whispir.contact-v1+json',
      Authorization: `Basic ${whispirAuth}`

    },
    body: `{\n  "firstName": "${value.firstName}",\n  "lastName": "${value.lastName}",\n  "workMobilePhone1": "${cleanNumbers(value.mobilePhone)}",\n  "workEmailAddress1": "${value.workEmail}",\n "personalFax1": "${value.id}",\n  "workCountry": "${getWorkCountry(value.location)}",\n  "timezone": "+10"}`
  }

  try {
    let res = await fetch(url, options)
    return await res.json()
  } catch (error) {
    console.log(error);
  }

}

async function updateWhispirContact2(value, wid) {

  let url = `https://api.au.whispir.com/workspaces/${whispirWorkspaceId}/contacts/${wid}`

  var myHeaders = new Headers();
  myHeaders.append("x-api-key", `${whispirAPIKey}`)
  myHeaders.append("Content-Type", "application/vnd.whispir.contact-v1+json")
  myHeaders.append("Accept", "application/vnd.whispir.contact-v1+json")
  myHeaders.append("Authorization", `Basic ${whispirAuth}`)

  var raw = JSON.stringify({

    "firstName": value.firstName,
    "lastName": value.lastName,
    "personalFax1": value.id,
    "timezone": TZ,
    "workEmailAddress1": value.workEmail,
    "workMobilePhone1": cleanNumbers(value.mobilePhone),
    "workCountry": getWorkCountry(value.location),

  })

  var requestOptions = {

    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'

  }

  try {
    let res = await fetch(url, requestOptions)
    return await res
  } catch (error) {
    console.log(error);
  }

}

async function removeWhispirContact2(wid) {

  let url = `https://api.au.whispir.com/workspaces/${whispirWorkspaceId}/contacts/${wid}`

  let options = {
      method: 'DELETE',
      headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': `${whispirAPIKey}`,
          Authorization: `Basic ${whispirAuth}`
      }
  }

  try {
    let res = await fetch(url, options)
    return await res
  } catch (error) {
    console.log(error);
  }
  
}

async function postProcess(val) {

  if (val === 'initial') {
    console.log("Initial load - no further processing")
  }
  else {
    cleanCurrentContacts(val)
  }

}

async function asyncAddContact(el, index) {

  response = await setTimeout(() => {
    addWhispirContact2(el)
  }, index * delay)
  return response

}

async function asyncUpdateContact(el, id) {

  const response = await updateWhispirContact2(el, id)
  return response

}

const cleanCurrentContacts = (currentContacts) => {

  console.log('\x1b[36m%s\x1b[0m', `cleanCurrentContacts...${currentContacts.contacts.length}`)
  currentContacts.contacts.forEach((el) => {

      if (el.checked !== true) {
          console.log('\x1b[31m%s\x1b[0m', `${el.firstName} ${el.lastName}, id:${el.id} will be removed...`)
          setTimeout(() => {

              console.log(`Deleting record for ${el.firstName} ${el.lastName}`)
              removeWhispirContact2(el.id)

          }, delay)
      }

  })
}

async function checkAndLoad2(currentContacts, masterData) {

  console.log('Number of master records:', masterData.employees.length + 1)
  var initialLoad = (currentContacts.status === 'No records found')
  console.log('Initial Load:', initialLoad)
  masterData.employees.forEach((el, masterIndex) => {

    // if employee id exists in currrentContacts check data - if info matches do nothing else update else add

    console.log("master id:", el.id)
    var existingContact = undefined
    !initialLoad && (existingContact = currentContacts.contacts.find((contact) => {
      return contact.personalFax1 === el.id;
    }))
    if (initialLoad || !existingContact) { // if no record exists already, create the cpntact

      console.log('\x1b[33m%s\x1b[0m', `No existing contact found for master id:${el.id} - adding...${el.mobilePhone}, ${el.workEmail}`)

      if ((el.workEmail === null) && (el.mobilePhone === null)) { // If no contact info, skip this record
        console.warn('\x1b[31m%s\x1b[0m', `Invalid Mobile and Email information - skipping ${el.id}: ${el.firstName} ${el.lastName}`)
      }
      else {  // else add the record if at least one contact channel exists

        var response = asyncAddContact(el, masterIndex)
        console.log('Adding a new record : response:', response)

      }
    }
    else {

      console.log('\x1b[36m%s\x1b[0m', "Record exists - Check fields for update ID:" + existingContact.id)
      existingContact.checked = true
      if ((existingContact.firstName === el.firstName) && (existingContact.lastName === el.lastName) && (checkContactInfoForUpdate(el, existingContact)) && (existingContact.workEmailAddress1 === el.workEmail)) { // Check if any updates required

        console.log("All fields matched - no update required")

      }
      else { // else - At least one field unmatched - Update record

        console.log("At least one field unmatched - Update record")
        var recordData = [{ Label: 'firstname', Existing: existingContact.firstName, Master: el.firstName }, { Label: 'lastname', Existing: existingContact.lastName, Master: el.lastName }, { Label: 'Mobile', Existing: getNumbers(existingContact.workMobilePhone1), Master: getNumbers(el.mobilePhone) }, { Label: 'email', Existing: existingContact.workEmailAddress1, Master: el.workEmail }]

        console.table(
          recordData.map(command => {
            return {

              "Label": command.Label,
              "Existing": command.Existing,
              "Master Data": command.Master

            }
          })
        )

        console.log(`Updating record for ${el.firstName} ${el.lastName}`)
        var response = asyncUpdateContact(el, existingContact.id)

      }
    }

  })

  if (initialLoad) {
    return 'initial'
  }
  else {
    return currentContacts
  }

}

// MAIN THREAD

processArgs()

console.log("Launching import ... ")

getData()
  .then(([currentContacts, masterData]) => {

    console.log(`currentContacts Status:${currentContacts.status}`)

    checkAndLoad2(currentContacts, masterData)
      .then((res) => postProcess(res))
      .catch((error) => { console.log("error", error) })

  })
