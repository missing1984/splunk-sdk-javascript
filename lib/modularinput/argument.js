
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
    var xml2js = require("xml2js");
    var utils = require("./utils");

    /**
     * Class representing an argument to a modular input kind.
     *
     * `Argument` is meant to be used with `Scheme` to generate an XML 
     * definition of the modular input kind that Splunk understands.
     *
     * `name` is the only required parameter for the constructor.
     *
     * @example
     *
     *      //TODO: add example
     *
     * @class splunkjs.modularinput.Argument
     */
     //TODO: add params
    function Argument(argumentConfig) {
        if (!argumentConfig) {
            argumentConfig = {};
        }

        this.name = typeof argumentConfig.data !== "undefined" ? argumentConfig.name : "";
        this.description = typeof argumentConfig.description !== "undefined" ? argumentConfig.description: null;
        this.validation = typeof argumentConfig.validation !== "undefined" ? argumentConfig.validation : null;
        this.dataType = typeof argumentConfig.dataType !== "undefined" ? argumentConfig.dataType : Argument.dataTypeString;
        this.requiredOnEdit = typeof argumentConfig.requiredOnEdit !== "undefined" ? argumentConfig.requiredOnEdit : false;
        this.requiredOnCreate = typeof argumentConfig.requiredOnCreate !== "undefined" ? argumentConfig.requiredOnCreate : false;
    }

    // Constant values, do not change
    // These should be used for setting the value of an Argument object's dataType field.
    Argument.dataTypeBoolean = "BOOLEAN";
    Argument.dataTypeNumber = "NUMBER";
    Argument.dataTypeString = "STRING";

    //TODO: add docstrings
    Argument.prototype.addToDocument = function () {
        var builder = new xml2js.Builder({rootName: "arg", xmldec: {}});

        var arg = {"$": {}};
        utils.forEach(this, function(elem, index, obj) {
            switch (index) {
                case "name":
                    arg["$"][index] = elem;
                    break;
                case "validation":
                    if (elem) {
                        arg[index] = null;
                    }
                    break;
                case "description":
                    if (elem) {
                        arg[index] = null;
                    }
                    break;
                default:
                    if (elem) {
                        arg[index] = elem.toLowerCase();
                    }
                    break;
            }
        });

        var xmlArg = builder.buildObject(arg);
        xmlArg = xmlArg.toString().replace("<?xml version=\"1.0\"?>\n","");
        return xmlArg;
    }; 
    
    module.exports = Argument;
})();