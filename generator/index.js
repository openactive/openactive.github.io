const DATA_MODEL_DOCS_DIR = "../";
const NAMESPACE_FILE = "../oa.jsonld";
const DATA_MODEL_DOCS_URL_PREFIX = "https://developer.openactive.io/data-model/types/";

const { getContext, getGraph, getMetaData } = require('@openactive/data-models');
var fs = require('fs');

generateDocumentation();

function generateDocumentation() {
  // Returns the latest version of the models map
  const context = getContext();
  const graph = getGraph();
  const namespaces = getMetaData().namespaces;

  var contents = [];

  var terms = [].concat(graph.rdfs_classes, graph.rdfs_properties);

  terms.forEach(function(node) {
      console.log(typeof node['@id']);
      if (node && typeof node['@id'] === 'string') {
        var prefix = node['@id'].split(':')[0];
        var name = node['@id'].split(':')[1];
        if (prefix === "oa") {
          
          var directory = node['@type'] === 'rdfs:Class' ? 'rdfs_classes/' : 'rdfs_properties/';

          var pageName = name + ".md";
          var pageContent = createModelMarkdownPage(namespaces, name, node);

          console.log("NAME: " + pageName);
          console.log(pageContent);

          contents.push(`  * [${name}](output/${directory}${pageName})`);
          
          fs.writeFile(DATA_MODEL_DOCS_DIR + directory + pageName, pageContent, function(err) {
              if(err) {
                  return console.log(err);
              }
              
              console.log(`FILE SAVED: output/${directory}${pageName}`);
          }); 
        }
      }
  });

  // Write oa.jsonld
  var jsonld = {
    '@context': context,
    '@graph': graph
  }
  fs.writeFile(NAMESPACE_FILE, JSON.stringify(jsonld, null, 2), function(err) {
    if(err) {
        return console.log(err);
    }
    
    console.log("FILE SAVED: " + NAMESPACE_FILE);
  }); 
}

function formatReference(namespaces, x, separator = ", ", isArray = false) {
  var arrayOfX = Array.isArray(x) ? x : [x];
  return arrayOfX.map((x) => {
    var segments = x.split(":");
    var arrayPrefix = isArray ? "Array of " : "";
    if (segments.length > 1) {
      var url = x.indexOf("http") > -1 ? x : 
                  (namespaces[segments[0]] + segments[1]);
      return arrayPrefix + "[`" + x + "`](" + url + ")";
    } else {
      return arrayPrefix + "`" + x + "`";
    }
  }).join(separator);
}

function createModelMarkdownPage(namespaces, name, node) {
  
  console.log("Page: " + name);

  var subClassOf

  return `---
permalink: /${name}
---

# ` + name + `
` + node['rdfs:comment'].en

+ (node['@type'] === 'rdfs:Class' ? `

For more information, see the [developer site](${DATA_MODEL_DOCS_URL_PREFIX + name.toLowerCase()}).` : "")

+ (node['rdfs:subClassOf'] ? `

Inherits from: ${formatReference(namespaces, node['rdfs:subClassOf'])}]` : "") 

+ (node['schema:domainIncludes'] ? `

This property can be used on: ${formatReference(namespaces, node['schema:domainIncludes'])}]` : "") 

+ (node['schema:rangeIncludes'] ? `

This property include the values: ${formatReference(namespaces, node['schema:rangeIncludes'])}]` : "") + `
`;
}
