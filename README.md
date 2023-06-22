# Akamai-Redirects-to-Terraform
Converts Akamai Property Manager JSON export to Terraform Redirects for Cloudflare

Script to output Redirects from Akamai JSON
See this doc for more details on matching subpaths etc: https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/how-it-works/

Input file must be named akamai.json in the same directory.

To run: $ node akamai2cloudflare.js

Outputs a terraform.tf file in the outputDir for insertion into a TF config diretory. Obs rename as desired ie (list.tf)

Requires Node: Terraform Generator and Lodash
