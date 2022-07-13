# README.md
// +++++++++++++++++++  Notes  ++++++++++++++++++++++
// 1. In this PoC script Employee ID (Bamboo id) is stored in personalFax1 in Whispir. 
//    This should be changed for production to an Employee ID field exposed
//    for customer workspace.
//
// 2. Functiom getWorkCountry() for resolving country info is due to Bamboo ED not
//    providing the country field in the Whispir company report example. 
//    For production, Request the Org's Bamboo Admin to create an ED 
//    report with the country field exposed 
//
// 3. All Whispir contact TZs are set to +10 AEDT. 
//    Custom function nto calculate TZ not implemented
//
// 4. Could possibly use a better routine to determine/format valid mobile numbers for API
//
// 5. Delay = Add delay variable spaces API calls and Update delay is set for 1/5 of that
// +++++++++++++++++++  End Notes  +++++++++++++++++++
