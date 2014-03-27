
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

exports.setup = function() {

    var splunkjs        = require('../../index');
    var Async           = splunkjs.Async;
    var modularinput    = splunkjs.ModularInput;
    var Event           = modularinput.Event;
    var EventWriter     = modularinput.EventWriter;
    var fs              = require("fs");
    var path            = require("path");
    var parser          = require("xml2js");
    var utils           = modularinput.utils;
    var Stream          = require("stream");

    splunkjs.Logger.setLevel("ALL");
    return {

        "Event tests": {
            setUp: function(done) {
                done();
            },

            "Event class handles times correctly - Date object": function(test) {
                var now = Date.now();
                var expected = (now / 1000).toFixed(3);
                var found = Event.formatTime(now);
                test.equals(found, expected);

                test.done();
            },

            "Event class handles times correctly - String": function(test) {
                // Test time in seconds
                var stringTime = "1372187084";
                var expected = 1372187084.000;
                var found = Event.formatTime(stringTime);
                test.equals(found, expected);

                // Test a super small time, 4 seconds since the epoch
                var tinyStringTime = "4";
                expected = 4.000;
                found = Event.formatTime(tinyStringTime);
                test.equals(found, expected);

                // Test the time in milliseconds
                var milliStringTime = "1372187084000";
                expected = 1372187084.000;
                found = Event.formatTime(milliStringTime);
                test.equals(found, expected);                

                // Test a huge integer value, just get the first 14 digits
                var hugeStringTime = "13721870840001234";
                expected = 1372187084.000;
                found = Event.formatTime(hugeStringTime);
                test.equals(found, expected);

                test.done();
            },

            "Event class handles times correctly - Number (integer)": function(test) {
                // Test time in seconds
                var intTime = 1372187084;
                var expected = 1372187084.000;
                var found = Event.formatTime(intTime);
                test.equals(found, expected);

                // Test a super small time, 4 seconds since the epoch
                var tinyIntTime = 4;
                expected = 4.000;
                found = Event.formatTime(tinyIntTime);
                test.equals(found, expected);

                // Test the time in milliseconds
                var milliIntTime = 1372187084000;
                expected = 1372187084.000;
                found = Event.formatTime(milliIntTime);
                test.equals(found, expected);                

                // Test a huge integer value, just get the first 14 digits
                var hugeIntTime = 13721870840001234;
                expected = 1372187084.000;
                found = Event.formatTime(hugeIntTime);
                test.equals(found, expected);

                test.done();
            },
            
            "Event class handles times correctly - Number (float)": function(test) {
                // Test a perfect value
                var floatTime = 1372187084.424;
                var expected = 1372187084.424;
                var found = Event.formatTime(floatTime);
                test.equals(found, expected);

                // Test a really long decimal value
                var longDecimalFloatTime = 1372187084.424242425350823423423;
                expected = 1372187084.424;
                found = Event.formatTime(longDecimalFloatTime);
                test.equals(found, expected);

                // Test a date far into the future
                var crazyFloatTime = 13721874084.424242425350823423423;
                expected = 13721874084.420;
                found = Event.formatTime(crazyFloatTime);
                test.equals(found, expected);

                // Test a really really far into the future
                var crazyFloatTime2 = 1372187084555.424242425350823423423;
                expected = 1372187084555.000;
                found = Event.formatTime(crazyFloatTime2);
                test.equals(found, expected);

                // Test a slightly crazy value
                var crazyFloatTime3 = 137218.424242425350823423423;
                expected = 137218.424;
                found = Event.formatTime(crazyFloatTime3);
                test.equals(found, expected);

                // Test a value starting with zeros
                var crazyFloatTime4 = 000000000137218.442;
                expected = 137218.442;
                found = Event.formatTime(crazyFloatTime4);

                // Test a tiny value
                var crazyFloatTime5 = 4.001234235;
                expected = 4.001;
                found = Event.formatTime(crazyFloatTime5);
                test.equals(found, expected);

                test.done();
            },
            
            "Event without enough fields throws error": function(test) {
                var e = new Event();
                // A zero size buffer is fine because it won't be written to,
                // due to the thrown error.
                e.writeTo(new Buffer(0), function(err, event) {
                    test.ok(err);
                    test.done();
                });
            },

            "Event with minimal config matches expected XML": function(test) {
                var myEvent = new Event({
                    data: "This is a test of the emergency broadcast system.",
                    stanza: "fubar",
                    time: 1372187084.000
                });

                var expected = utils.readFile(__filename, "../data/event_minimal.xml");

                var myBuffer = new Buffer(1024);
                var results = {};

                Async.chain([
                        function (callback) {
                            myEvent.writeTo(myBuffer, callback);
                        },
                        function (buffer, bufferPosition, callback) {
                            parser.parseString(buffer.toString("utf-8", 0, bufferPosition), callback);
                        },
                        function (result, callback) {
                            results.found = result;
                            parser.parseString(expected.toString(), callback);
                        },
                        function (result, callback) {
                            results.expected = result;

                            test.ok(utils.deepEquals(results.expected, results.found));
                            callback(null);
                        }
                    ],
                    function(err) {
                        test.ok(!err);
                        test.done();
                    }
                );
            },

            "Event with full config matches expected XML": function(test) {
                var myEvent = new Event({
                    data: "This is a test of the emergency broadcast system.",
                    stanza: "fubar",
                    time: 1372274622.493,
                    host: "localhost",
                    index: "main",
                    source: "hilda",
                    sourcetype: "misc",
                    done: true,
                    unbroken: true
                });

                var expected = utils.readFile(__filename, "../data/event_maximal.xml");

                var myBuffer = new Buffer(2048);
                var results = {};

                Async.chain([
                        function (callback) {
                            myEvent.writeTo(myBuffer, callback);
                        },
                        function (buffer, bufferPosition, callback) {
                            parser.parseString(buffer.toString("utf-8", 0, bufferPosition), callback);
                        },
                        function (result, callback) {
                            results.found = result;
                            parser.parseString(expected.toString(), callback);
                        },
                        function (result, callback) {
                            results.expected = result;

                            test.ok(utils.deepEquals(results.expected, results.found));
                            callback(null);
                        }
                    ],
                    function(err) {
                        test.ok(!err);
                        test.done();
                    }
                );
            },

            "EventWriter event writing works": function(test) {
                //TODO: make it work with streams
                var myEvent = new Event({
                    data: "This is a test of the emergency broadcast system.",
                    stanza: "fubar",
                    time: 1372275124.466,
                    host: "localhost",
                    index: "main",
                    source: "hilda",
                    sourcetype: "misc",
                    done: true,
                    unbroken: true
                });

                var expectedOne = utils.readFile(__filename, "../data/stream_with_one_event.xml");
                var expectedTwo = utils.readFile(__filename, "../data/stream_with_one_event.xml");

                var out = new Buffer(2048);
                var err = new Buffer(2048);
                var ew = new EventWriter(out, err);

                var results = {};
                var outBufferTempPosition = 0;
                
                Async.chain([
                        function (callback) {
                            ew.writeEvent(myEvent, outBufferTempPosition, callback);
                        },
                        function (outBuffer, outBufferPosition, callback) {
                            outBufferTempPosition = outBufferPosition;
                            parser.parseString(outBuffer.toString("utf-8", 0, outBufferPosition) + "</stream>", callback);
                        },
                        function (result, callback) {
                            results.foundOne = result;
                            parser.parseString(expectedOne.toString(), callback);
                        },
                        function (result, callback) {
                            results.expectedOne = result;
                            
                            test.ok(utils.deepEquals(results.expectedOne, results.foundOne));
                            
                            ew.writeEvent(myEvent, outBufferTempPosition, callback);
                        },
                        function (outBuffer, outBufferPosition, callback) {
                            parser.parseString(outBuffer.toString("utf-8", 0, outBufferPosition) + "</stream>", callback);
                        },
                        function (result, callback) {
                            results.foundTwo = result;
                            parser.parseString(expectedTwo.toString(), callback);
                        },
                        function (result, callback) {
                            results.expectedTwo = result;
                            test.ok(utils.deepEquals(results.expectedTwo, results.foundTwo));
                            callback(null);
                        }
                    ], 
                    function (err) {
                        test.ok(!err);
                        if (err) {
                            console.log(err);
                        }
                        test.done();
                    }
                );
            },

            "EventWriter gets an error from invalid Event": function(test) {
                // TODO: make it work for streams
                var out = new Buffer(1024);
                var err = new Buffer(1024);

                var ew = new EventWriter(out, err);

                ew.writeEvent(new Event(), function(err, outBuffer, outBufferPosition){
                    test.ok(err);
                    // TODO: port the following test from the Python SDK
                    // ... actually, this line is never run because the assert
                    // ... exists scope immediately on Error 
                    // self.assertTrue(err.getvalue().startswith(EventWriter.WARN))
                    test.done();
                });
            },

            "EventWriter logging works": function(test) {
                // TODO: make it work for streams
                var out = new Buffer(2048);
                var err = new Buffer(2048);

                var ew = new EventWriter(out, err);

                ew.log(EventWriter.ERROR, "Something happened!", function(err) {
                    test.ok(!err);
                    // Be safe with the buffer, and only check the first part
                    test.ok(utils.startsWith(ew._err.toString("utf-8", 0, EventWriter.ERROR.length), EventWriter.ERROR));
                    test.done();
                });
            },

            "EventWriter XML writing works": function(test) {
                // TODO: make it work for streams
                var out = new Buffer(1024);
                var err = new Buffer(1024);

                var ew = new EventWriter(out, err);

                var expected = utils.readFile(__filename, "../data/event_minimal.xml");

                ew.writeXMLDocument(expected.toString(), function(err) {
                    test.ok(!err);
                    test.equals(expected.toString(), ew._out.toString("utf-8", 0, expected.toString().length));
                    test.done();
                });
            }
        }
    };
};

if (module === require.main) {
    var splunkjs    = require('../../index');
    var test        = require('../../contrib/nodeunit/test_reporter');

    var suite = exports.setup();
    test.run([{"Tests": suite}]);
}