"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_table3_1 = __importDefault(require("cli-table3"));
const borders_1 = __importDefault(require("./borders"));
const TABLE_DEFAULTS = {
    chars: borders_1.default.single,
    style: {}
};
function initTable(options) {
    const api = {
        options: { ...TABLE_DEFAULTS, ...options },
        rows: [],
        border,
        middleless,
        align,
        padding,
        compact,
        expand,
        wrapped,
        unwrapped,
        colorize,
        uncolorize,
        truncate,
        width,
        row,
        init,
        create,
        head,
        toString
    };
    // Adds border by type.
    function border(type) {
        const conf = borders_1.default[type];
        api.options.chars = {
            ...api.options.chars,
            ...conf
        };
        return api;
    }
    // removes divider for mid (bottom of each row.)
    function middleless() {
        api.options.chars = {
            ...api.options.chars,
            'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''
        };
        return api;
    }
    function head(...columns) {
        columns = columns.map(c => c + '');
        api.options.head = columns;
        return api;
    }
    function width(...widths) {
        api.options.colWidths = widths;
        return api;
    }
    function padding(left, right) {
        if (typeof right === 'undefined')
            right = left;
        api.options.style['padding-left'] = left;
        api.options.style['padding-right'] = right;
        return api;
    }
    function align(type, ...columns) {
        if (type === 'columns')
            api.options.colAligns = columns;
        else
            api.options.rowAligns = columns;
        return api;
    }
    function compact() {
        api.options.style.compact = true;
        return api;
    }
    function expand() {
        api.options.style.compact = false;
        return api;
    }
    function wrapped() {
        api.options.wordWrap = true;
        return api;
    }
    function unwrapped() {
        api.options.wordWrap = false;
        return api;
    }
    function colorize(type, columns) {
        api.options.style[type] = columns;
        return api;
    }
    function uncolorize(type) {
        if (!type) {
            api.options.style.border = [];
            api.options.style.head = [];
        }
        else {
            api.options.style[type] = [];
        }
        return api;
    }
    function truncate(chars = '...') {
        api.options.truncate = '...';
        return api;
    }
    // adds row to table.
    function row(...columns) {
        api.rows.push(columns);
        return api;
    }
    // creates the table using defined options.
    function create(options) {
        const tbl = new cli_table3_1.default({ ...api.options, ...options });
        api.rows.forEach(r => tbl.push(r));
        return tbl;
    }
    // inits a new table api instance.
    function init(options) {
        return initTable(options);
    }
    function toString() {
        return create().toString();
    }
    return api;
}
const table = initTable();
exports.default = table;
//# sourceMappingURL=table.js.map