/**
 * Module providing utilities for better-sqlite3.
 */

'use strict';

require('dotenv').config();
const Database = require('better-sqlite3');

/**
 * Connect to an SQLite3 database.
 * The database file can be specified either by the first argument or by the property
 * SQLITE3_FILE in the file ".env". If none is specified an in-memory database is assumed
 * (file name ":memory:").
 * Pragma journal_mode is set to 'WAL' by default as recommended by the better-sqlite3 module.
 * The database is automatically closed on process exit.
 * @param {string} filename Optional database file path.
 * @param {Object} options SQLite3 database options.
 * @returns SQLite3 database proxy. 
 */
function connectDb(filename, options) {
    // Handle optional arguments
    if (arguments.length === 1) {
        if (typeof arguments[0] === 'object') {
            options = filename;
            filename = undefined;
        }
    }
    filename ||= process.env.SQLITE3_FILE ||= ":memory:";
    // Create BetterSqlite3.Database
    const db = new Database(filename, options);
    db.pragma('journal_mode = WAL');
    process.on('exit', () => db.close());
    return db;
}

/**
 * Disconnect silently from an SQLite3 database.
 * Calling this function is normally not necessary, since connections obtained through
 * connectDb() are automatically closed on process exit.
 * @param {object} db SQLite3 database proxy (as returned by connectDb()).
 */
function disconnectDb(db) {
    try {
        db.close();
    } catch (err) {}
}

const selectKeyword = new RegExp('^\\s*select\\s+', "i");

/**
 * Generic statement preparation.
 * @param {object} db SQLite3 database proxy (as returned by connectDb()).
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
