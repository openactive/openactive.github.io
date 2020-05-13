const DATA_MODEL_DOCS_DIR = "../";
const NAMESPACE_FILE = "../ns/oa.jsonld";
const INDEX_FILE = "../ns/index.md";
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
  var classesIndex = [];
  var propertiesIndex = [];

  terms.forEach(function(node) {
      console.log(typeof node['@id']);
      if (node && typeof node['@id'] === 'string') {
        var prefix = node['@id'].split(':')[0];
        var name = node['@id'].split(':')[1];
        if (prefix === "oa") {
          var isClass = node['@type'] === 'rdfs:Class';
          
          var directory = isClass ? 'rdfs_classes/' : 'rdfs_properties/';

          var pageName = name + ".md";
          var pageContent = createModelMarkdownPage(namespaces, name, node);
          
          (isClass ? classesIndex : propertiesIndex).push(`- [${name}](/${name})`);

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
  
  // Write ns.md
  classesIndex.sort();
  propertiesIndex.sort();
  fs.writeFile(INDEX_FILE, createNamespaceIndexPage(classesIndex, propertiesIndex), function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("FILE SAVED: " + INDEX_FILE);
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

function createNamespaceIndexPage(classesIndex, propertiesIndex) {
  return `---
layout: default
title: OpenActive Vocabulary
---

# OpenActive Vocabulary

The terms in the OpenActive Vocabulary, listed below, are defined within the [Modelling Opportunity Data](https://www.openactive.io/modelling-opportunity-data/) and [Open Booking API](https://www.openactive.io/open-booking-api/EditorsDraft/) specifications.

These specifications are being developed by the [OpenActive Community Group](https://www.w3.org/community/openactive).

${'This vocabulary is also available in JSON-LD format via a GET of the URL `"https://openactive.io/"` using an `Accept` header of `application/ld+json`, and additionally via a CDN at the URL [`"https://openactive.io/ns/oa.jsonld"`](https://openactive.io/ns/oa.jsonld) for production use.'}

For more information, see the [developer site](${DATA_MODEL_DOCS_URL_PREFIX}).

## Classes
${classesIndex.join('\n')}

## Properties
${propertiesIndex.join('\n')}

`;
}

function createModelMarkdownPage(namespaces, name, node) {
  
  console.log("Page: " + name);

  var subClassOf

  return `---
layout: default
title: ${name}
permalink: /${name}
---

# ` + name + `
` + node['rdfs:comment'].en

+ (node['rdfs:subClassOf'] ? `

Inherits from: ${formatReference(namespaces, node['rdfs:subClassOf'])}` : "") 

+ (node['schema:domainIncludes'] ? `

This property can be used on: ${formatReference(namespaces, node['schema:domainIncludes'])}` : "") 

+ (node['schema:rangeIncludes'] ? `

This property may include the values: ${formatReference(namespaces, node['schema:rangeIncludes'])}` : "") 

+ `

For more information, see the [developer site](${DATA_MODEL_DOCS_URL_PREFIX}).`

// TODO: This currently will render a broken link for enums, which are not included in the developer site
// Need to analyse the models more carefully
// + (node['@type'] === 'rdfs:Class' ? `[types reference](${DATA_MODEL_DOCS_URL_PREFIX + name.toLowerCase()}).` : "")

;
}
