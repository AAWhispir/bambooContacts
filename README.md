
# README.md
1. In this PoC script Employee ID (Bamboo id) is stored in personalFax1 in Whispir. This should be changed for production to an Employee ID field exposed for a customer workspace
2. Functiom getWorkCountry() for resolving country info is due to Bamboo ED not configured/populated to provide the required country field in the Whispir company report example. For production, request the Org's Bamboo Admin to create an ED report with the country field exposed 
3. All Whispir contact TZs are set to +10 AEDT. A custom function nto calculate TZ not implemented
4. Could possibly use a better routine to determine/format valid mobile numbers for API
5. Delay - The Add delay variable spaces API calls and Update delay is set for 1/5 of that
