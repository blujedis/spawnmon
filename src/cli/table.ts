import Table, { TableConstructorOptions, Cell, HorizontalAlignment, VerticalAlignment } from 'cli-table3';
import borders from './borders';

const TABLE_DEFAULTS: TableConstructorOptions = {
  chars: borders.single,
  style: {}
};

function initTable(options?: TableConstructorOptions) {

  const api = {
    options: { ...TABLE_DEFAULTS, ...options },
    rows: [] as Cell[][],
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
  function border(type: Extract<keyof typeof borders, string>) {
    const conf = borders[type];
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

  function head(...columns: any[]) {
    columns = columns.map(c => c + '');
    api.options.head = columns;
    return api;
  }

  function width(...widths: number[]) {
    api.options.colWidths = widths;
    return api;
  }

  function padding(left: number, right?: number) {
    if (typeof right === 'undefined')
      right = left;
    api.options.style['padding-left'] = left;
    api.options.style['padding-right'] = right;
    return api;
  }

  function align(type: 'columns' | 'rows', ...columns: (HorizontalAlignment | VerticalAlignment)[]) {
    if (type === 'columns')
      api.options.colAligns = columns as HorizontalAlignment[];
    else
      api.options.rowAligns = columns as VerticalAlignment[];
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

  function colorize(type: 'border' | 'head', columns: string[]) {
    api.options.style[type] = columns;
    return api;
  }

  function uncolorize(type?: 'border' | 'head') {
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
  function row(...columns: Cell[]) {
    api.rows.push(columns);
    return api;
  }

  // creates the table using defined options.
  function create(options?: TableConstructorOptions) {
    const tbl = new Table({ ...api.options, ...options });
    api.rows.forEach(r => tbl.push(r));
    return tbl;
  }

  // inits a new table api instance.
  function init(options?: TableConstructorOptions) {
    return initTable(options);
  }

  function toString() {
    return create().toString();
  }

  return api;

}
const table = initTable();

export default table;