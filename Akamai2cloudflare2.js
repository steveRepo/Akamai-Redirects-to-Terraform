// Script to output Redirects from Akamai JSON
// See this doc for more details on matching subpaths etc: https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/how-it-works/

// Input file must be named akamai.json in the same directory.
// To run: $ node akamai2cloudflare.js
// Outputs a terraform.tf file in the outputDir for insertion into a TF config diretory. Obs rename as desired ie (list.tf)

// Packages
const { TerraformGenerator, Resource, map, fn } = require('terraform-generator');
var _ = require('lodash');

// Import Constants
var jmespath = require('jmespath');
const { devNull } = require('os');
const fs = require('fs');
const path = require('path');

// Set Inputs
let myDomain = "https://mytest.com"; // Need to add your domain here
const accId = "ENV-ACCID" // Need to add your account ID here
const listName = "my_list_name"
const listDesc = "akamai_cf_redirect_list"
const listType = "redirect"
let domAndTar = "";
let domAndSrc = "";
var inval = 0;
let queryVar = "enabled";

// Set Secondary Redirects
let mySecRedir = "";

// Set redirect object
let redirectVal = {};

// Input Files
let rawdata = fs.readFileSync('akamai.json');
let akamai = JSON.parse(rawdata);

// Get array lengths
let arChLength = Object.keys(akamai.rules.children).length;
// let arrayBehaviorLength = Object.keys(akamai.rules.behaviors).length;
// let arrayVariablesLength = Object.keys(akamai.rules.variables).length;

// var redirectFilter = jmespath.search(akamai, "rules.children[139].behaviors[0].name");
// console.log (redirectFilter);

const tfg = new TerraformGenerator({ version: '0.12' }, {
  required_version: '>= 0.12'
});

// Create the array for which we'll put the redirect output values into
const outputArray = [];

// Run array export to update List Object
appendTfFile(arChLength);
console.log(arChLength);
// runArray(arrayBehaviorLength);
// runArray(arrayVariablesLength);

// ------------  MAIN FUNCTION: Iterate through the JSON and pull out the redirects ------------------//

function appendTfFile(arrayLength){

  for (step = 0 ; step <= arrayLength ; step ++) {
  // ------------  OPEN LOOP ------------------//
    // Get the redirect value
    setValue = jmespath.search(akamai, "rules.children[" + step + "].behaviors[0].name");

    // If redirect value is "redirect"
    if (setValue  == "redirect"){

      console.log("-----------REDIRECT---------------");
      console.log(setValue);
      // var fromVar = jmespath.search(redirect, "rules.children[" + step + "].criteria.options.values");

      // Once we find a redirect value in the JSON we set vars and log to console
      var srcUrl = jmespath.search(akamai, "rules.children[" + step + "].criteria[0].options.values");
      console.log(srcUrl);
      var tarUrl = jmespath.search(akamai, "rules.children[" + step + "].behaviors[0].options.destinationPathOther");
      console.log(tarUrl);
      var stCode = jmespath.search(akamai, "rules.children[" + step + "].behaviors[0].options.responseCode");
      console.log(stCode);
      var commentVar = jmespath.search(akamai, "rules.children[" + step + "].comments");
      console.log(commentVar);

      // Check if we have an array of source URL values
      if (Array.isArray(srcUrl)){

        // reset the query string param on next loop
        queryVar = "enabled";

        // set src array length
        var srcArrLen = srcUrl.length;

        // step through each of the URL's in the array
        for (stepSrc = 0 ; stepSrc < srcArrLen ; stepSrc  ++) {
          srcUrl = jmespath.search(akamai, "rules.children[" + step + "].criteria[0].options.values[" + stepSrc + "]");
          // Overwrite the source URL previous srcURL
          // srcUrl = mySecRedir;
          checkOutput(srcUrl, tarUrl);
          if (inval = 0){
            outputMyArray(domAndSrc, domAndTar, stCode, commentVar, queryVar);
          } else {
            console.log("skipped invalid output");
            inval = 0;
          }
        }

      } else {
        checkOutput(srcUrl, tarUrl);
        if (inval = 0){
          outputMyArray(domAndSrc, domAndTar, stCode, commentVar, queryVar);
        } else {
          console.log("skipped invalid output");
          inval = 0;
        }
      // ------------ Add the redirect values to the object ----------------//
      }
       // ------------  CLOSE LOOP ------------------//
    }
    // ------------  OPEN OUTPUT ------------------//
    outputToTF();
    
}


// Check for Query vars and disable preserve_query_string
function checkOutput(srcUrl, tarUrl){
  var mySrcUrlJSON = JSON.stringify(srcUrl);
  var mytarUrlJSON = JSON.stringify(tarUrl);

  if (mySrcUrlJSON.includes("?") || mytarUrlJSON.includes("?") || mySrcUrlJSON.includes("*") || tarUrl == null || srcUrl == null){
    console.log("---------Matched invalid values--------");
    queryVar = "disabled";
    domAndTar = "invalid_value_supplied";
    domAndSrc= "invalid_value_supplied";
    inval = 1;
    // print values to file
    fs.appendFile('message.txt', 'xxxxx', function (err) {
      if (err) throw err;
      console.log('Saved!');
    });
  } else {
    // Output the source and target URL's 
    domAndTar = myDomain + tarUrl;
    domAndSrc = myDomain + srcUrl;
  }
  // Output redirects until we've cycled through all the source URL's

}


// Set the values for output to TF
// Object literals here ie ( `${srcUrl}` ) will output single values for the source URL (first URL). Use actual variable values ie ( srcUrl ) which returns an array of inoput values. 
function outputMyArray(domAndSrc, domAndTar, stCode, commentVar, queryVar){
  redirectVal = 
  {
  value: {
    redirect: {
      // source_url: myDomain + `${srcUrl}`,
      // target_url: myDomain + `${tarUrl}`,
      source_url: domAndSrc,
      target_url: domAndTar,
      status_code: stCode,
      preserve_query_string: queryVar
      }
    },
    comment: commentVar
  };

  // Value onto the back of the outputArray
  outputArray.push(redirectVal);
}

function outputToTF(){
      // Add to resources
      tfg.resource("cloudflare_list", "redirects1",  {
  
        account_id: accId,
        name: listName,
        description: listDesc,
        kind: listType,
  
        item: outputArray
      
      });
  
      // Write out to TF
      tfg.write({
  
        dir: 'outputDir',
        format: true
  
      });
    
      // Advise invalid values
      if (inval == 1){
        console.log("There were invalid values supplied. Please review the (invalid_value_supplied) entries before adding to TF.");
      }

      // advice to console
      console.log("Akamai JSON converted successfully. Check the /outputdir for terraform.tf export");
}
