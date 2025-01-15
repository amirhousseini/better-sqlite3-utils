/**
 * Module providing utility classes and functions for SQLite3 based on the better-sqlite3 module.
 */

'use strict';

require('dotenv').config();
const Database = require('better-sqlite3');

/**
 * Connect to an SQLite3 database.
 * It requires the SQLite database file to be specified through the environment
 * variable SQLITE3_FILE in the file ".env". This can be a path or the string
 * ":memory:" to specify an in-memory database.
 * Pragma journal_mode is set to 'WAL' by default as recommended by the better-sqlite3 module.
 * @param {Object} options SQLite3 database options. Option fileMustExist is set by default.
 * @returns Connection object. 
 */
function connectDb(options) {
    const file = process.env.SQLITE3_FILE;
    options = Object.assign({}, { fileMustExist: true }, options);
    const db = new Database(file, options);
    db.pragma('journal_mode = WAL');
    process.on('exit', () => db.close());
    return db;
}

/**
 * Disconnect silently from an SQLite3 database.
 * Calling this function is normally not necessary, since existing connections
 * are automatically closed upon process exit.
 * @param {Object} Connection object to SQLite3 as returned by connectDb().
 */
function disconnectDb(db) {
    try {
        db.close();
    } catch (err) {}
}

const selectKeyword = new RegExp('^\\s*select\\s+', "i");

/**
 * Generic statement preparation.
 * @param {Object} db Connection object to SQLite3 as returned by connectDb().
 * @param {String} sql SQL statement.
 * @param {any} singleton If true specifies a select statement returning a single row.
 * @return A wrapped statement, including an execution method specification.
 */
function prepStmt(db, sql, singleton) {
    const stmt = db.prepare(sql);
    const method = sql.search(selectKeyword) < 0 ? "run" : singleton ? "get" : "all";
    return { stmt, method };
}

/**
 * Generic statement executor.
 * @param {Object} wstmt Wrapped statement as returned by prepStmt().
 * @param {*} params Statement execution parameters.
 *  Only values of object properties are used.
 *  Arrays are fully flatten before use.
 * @return Result of the statement execution.
 */
function execStmt(wstmt, ...params) {
    const { stmt, method } = wstmt;
    params = params
        .map((param) => {return typeof param === "object" ? Object.values(param) : param})
        .flat(Infinity);
    switch (method) {
        case "run": return stmt.run(params);
        case "get": return stmt.get(params);
        case "all": return stmt.all(params);
        default: throw new Error(`Invalid method: ${method}`);
    }
}

module.exports = {
    connectDb, disconnectDb,
    prepStmt, execStmt,
}
