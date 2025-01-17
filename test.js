'use strict';

require('dotenv').config();

function test(filename, options) {
    console.log(arguments);
    console.log(typeof arguments[0]);
    
    if (arguments.length === 1) {
        if (typeof arguments[0] === 'object') {
            options = filename;
            filename = undefined;
        }
    }
    filename ||= process.env.SQLITE3_FILE ||= ":memory:";
    console.log("filename =", filename);
    console.log("options =", options);
    console.log();
}

test('aaaa', { bbb: true });
test('aaaa');
test({ bbb: true });
test();
