
// Copyright 2014 Splunk, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License"): you may
// not use this file except in compliance with the License. You may obtain
// a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

(function() {
    var parser = require("xml2js");
    var utils = require("./utils");

    /**
     * This class represents the XML sent by Splunk for external validation of a
     * new modular input.
     *
     * @example
     *
     *      var v =  new ValidationDefinition();
     *
     * @class splunkjs.modularinput.ValidationDefinition
     */
    function ValidationDefinition() {
        this.metadata = {};
        this.parameters = {};
    }

    ValidationDefinition.prototype.equals = function(other) {
        if (!(other instanceof ValidationDefinition)) {
            return false;
        }
        return (utils.deepEquals(other.metadata, this.metadata) && 
            utils.deepEquals(other.parameters, this.parameters));
    };

    /**
     * Creates a `ValidationDefinition` from a provided stream containing XML.
     *
     * The XML typically will look like this:
     * 
     * `<items>`
     * `   <server_host>myHost</server_host>`
     * `     <server_uri>https://127.0.0.1:8089</server_uri>`
     * `     <session_key>123102983109283019283</session_key>`
     * `     <checkpoint_dir>/opt/splunk/var/lib/splunk/modinputs</checkpoint_dir>`
     * `     <item name="myScheme">`
     * `       <param name="param1">value1</param>`
     * `       <param_list name="param2">`
     * `         <value>value2</value>`
     * `         <value>value3</value>`
     * `         <value>value4</value>`
     * `       </param_list>`
     * `     </item>`
     * `</items>`
     *
     * @param {stream} stream containing XML to parse.
     * @param {callback} a callback function.
     *
     * @class splunkjs.modularinput.ValidationDefinition
     */
    ValidationDefinition.parse = function(stream, callback) {
        var definition = new ValidationDefinition();

        parser.parseString(stream, function(err, result) {
            if (err) {
                callback(err);
            }

            var root = result["items"];

            if (!root) {
                callback(new Error("Invalid validation definition scheme."));
            }

            utils.forEach(root, function(node, key, obj) {
                // Skip the schema attributes
                if (key === "$") {
                    return;
                }
                // There should only be one item node
                else if (key === "item") {
                    var item = root[key][0];
                    definition.metadata.name = item["$"].name;
                    utils.parseParameters(item, function(err, params) {
                        if (err) {
                            callback(err);
                        }
                        definition.parameters = params;
                    });
                }
                else {
                    // Store anything else in metadata
                    definition.metadata[key] = root[key][0];
                }
            });
            callback(null, definition);
        });
    };
    
    module.exports = ValidationDefinition;
})();