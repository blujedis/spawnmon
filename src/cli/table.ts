import Table, { TableConstructorOptions, Cell, HorizontalAlignment, VerticalAlignment } from 'cli-table3';
import borders from './borders';

const TABLE_DEFAULTS: TableConstructorOptions = {
  chars: borders.single,
  style: {}
};

function initTable(options?: TableConstructorOptions) {

  const api = {
    _options: { ...TABLE_DEFAULTS, ...options },
    _rows: [] as Cell[][],
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
    rows,
    init,
    create,
    head,
    toString
  };

  // Adds border by type.
  function border(type: Extract<keyof typeof borders, string>) {
    const conf = borders[type];
    api._options.chars = {
      ...api._options.chars,
      ...conf
    };
    return api;
  }

  // removes divider for mid (bottom of each row.)
  function middleless() {
    api._options.chars = {
      ...api._options.chars,
      'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''
    };
    return api;
  }

  function head(...columns: any[]) {
    columns = columns.map(c => c + '');
    api._options.head = columns;
    return api;
  }

  function width(...widths: number[]) {
    api._options.colWidths = widths;
    return api;
  }

  function padding(left: number, right?: number) {
    if (typeof right === 'undefined')
      right = left;
    api._options.style['padding-left'] = left;
    api._options.style['padding-right'] = right;
    return api;
  }

  function align(type: 'columns' | 'rows', ...columns: (HorizontalAlignment | VerticalAlignment)[]) {
    if (type === 'columns')
      api._options.colAligns = columns as HorizontalAlignment[];
    else
      api._options.rowAligns = columns as VerticalAlignment[];
    return api;
  }

  function compact() {
    api._options.style.compact = true;
    return api;
  }

  function expand() {
    api._options.style.compact = false;
    return api;
  }

  function wrapped() {
    api._options.wordWrap = true;
    return api;
  }

  function unwrapped() {
    api._options.wordWrap = false;
    return api;
  }

  function colorize(type: 'border' | 'head', columns: string[]) {
    api._options.style[type] = columns;
    return api;
  }

  function uncolorize(type?: 'border' | 'head') {
    if (!type) {
      api._options.style.border = [];
      api._options.style.head = [];
    }
    else {
      api._options.style[type] = [];
    }
    return api;
  }

  function truncate(chars = '...') {
    api._options.truncate = '...';
    return api;
  }

  // adds row to table.
  function row(...columns: Cell[]) {
    api._rows.push(columns);
    return api;
  }

  function rows(...rows: Array<Cell[]>) {
    api._rows = [...api._rows, ...rows];
    return api;
  }

  // creates the table using defined options.
  function create(options?: TableConstructorOptions) {
    const tbl = new Table({ ...api._options, ...options });
    api._rows.forEach(r => tbl.push(r));
    return tbl;
  }

  // inits a new table api instance.
  function init(options?: TableConstructorOptions) {
    return initTable();
  }

  function toString() {
    return create().toString();
  }

  return api;

}
const table = initTable();

export default table;