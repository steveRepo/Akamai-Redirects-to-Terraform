// Script to output Redirects from Akamai JSON
// Input file must be named akamai.json

// Packages
const { TerraformGenerator, Resource, map, fn } = require('terraform-generator');
var _ = require('lodash');

// Import Constants
var jmespath = require('jmespath');
const { devNull } = require('os');
const fs = require('fs');
const path = require('path');

// Set Domain
const myDomain = "https://smtest3.com"

// Input Files
let rawdata = fs.readFileSync('akamai.json');
let akamai = JSON.parse(rawdata);

// Get array lengths
let arChLength = Object.keys(akamai.rules.children).length;
// let arrayBehaviorLength = Object.keys(akamai.rules.behaviors).length;
// let arrayVariablesLength = Object.keys(akamai.rules.variables).length;

// Set Counters
// let fileCounter = 0;

// var redirectFilter = jmespath.search(akamai, "rules.children[139].behaviors[0].name");
// console.log (redirectFilter);

const tfg = new TerraformGenerator({ version: '0.12' }, {
  required_version: '>= 0.12'
});

// Create the array for which we'll put the redirect values into
const outputArray = [];

// Run array export to update List Object
appendTfFile(arChLength, outputArray);
console.log(arChLength);
// runArray(arrayBehaviorLength);
// runArray(arrayVariablesLength);

// ------------  MAIN FUNCTION: Iterate through the JSON and pull out the redirects ------------------//

function appendTfFile(arrayLength, outputArray){
// var newredirectVal = ``;
  for (step = 0 ; step <= arrayLength ; step ++) {
    setValue = jmespath.search(akamai, "rules.children[" + step + "].behaviors[0].name");

    if (setValue  == "redirect"){
      console.log("-----------REDIRECT---------------");
      console.log(setValue);
      // var fromVar = jmespath.search(redirect, "rules.children[" + step + "].criteria.options.values");

      // Once we find a redirect value in the JSON we set vars and log to console
      var srcUrl = jmespath.search(akamai, "rules.children[" + step + "].criteria[0].options.values");
      console.log("--------------------------");
      console.log(srcUrl);
      var tarUrl = jmespath.search(akamai, "rules.children[" + step + "].behaviors[0].options.destinationPathOther");
      console.log(tarUrl);
      var stCode = jmespath.search(akamai, "rules.children[" + step + "].behaviors[0].options.responseCode");
      console.log(stCode);

      // ------------ Add the redirect values to the object ----------------//

      // Object literals here ie ( `${srcUrl}` ) will output single values for the source URL (first URL). Use actual variable values ie ( srcUrl ) which returns an array of inoput values. 

      var redirectVal = 
              {
              value: {
                redirect: {
                  // source_url: `${myDomain}${srcUrl}`,
                  // target_url: `${myDomain}${tarUrl}`,
                  // status_code: `${myDomain}${stCode}`,
                  source_url: srcUrl,
                  target_url: tarUrl,
                  status_code: stCode,
                  preserve_query_string: "enabled"
                  }
                }
              };

      console.log(redirectVal);
      console.log("-------------OBJECT ABOVE-------------");
      console.log(step);  

      outputArray.push(redirectVal);

      // ------------  OPEN LOOP HERE ------------------//

      console.log("-------------console.log(outputArray);-------------");
      console.log(outputArray);
     
      }
       // ------------  CLOSE LOOP ------------------//
    }
    
    // ------------  OPEN OUTPUT ------------------//

    // Add to resources
    tfg.resource("cloudflare_list", "example",  {

      account_id: "<input>",
      name: "<input>",
      description: "<input>",
      kind:"<input>",
      item: outputArray
    
    });

    // Write out to TF
    tfg.write({

      dir: 'outputDir',
      format: true

    });
}



