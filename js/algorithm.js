/*
 * autor:    lis
 * created:  Dec 16 18:17:52 2020
 * modified: Dec 16 20:46:57 2020
 *
 * Зависимости:
 *   - class Node
 *   - dictionary variable_map ({'x' : Value, 'y' : Value...})
 */





/*
 * Генерирует таблицу истинности из Node
 *
 * Пример.
 * node: x and y
 * result: [ [ 0, 0, 0 ], [ 0, 1, 0, ], [1, 0, 0], [1, 1, 1] ];
 */
function calculate_truth_table(node)
{
	function plus(vars)
	{
		for(let i = vars.length-1; i > -1; --i)
		{
			if(variable_map[vars[i]].value == 0)
			{
				variable_map[vars[i]].value = 1;
				for(let j = i+1; j < vars.length; ++j)
					variable_map[vars[j]].value = 0;
				return;
			}
		}
		throw "can't plus vars";
	}

	vars = [];
	for(let variable in variable_map)
	{
		vars.push(variable);
		variable_map[variable].value = 0;
	}
	vars.sort();

	table = [];
	for(let i = 0; true; ++i)
	{
		table.push( vars.map( (v) => variable_map[v].value ) );
		table[table.length-1].push(node.calc());

		if(i+1 == 2**vars.length)
			break;

		plus(vars);
	}

	return table;
}

/*
 * Добваляет строку заголовка для таблицы истинности,
 * сгенерированной с помощью функции calculate_truth_table
 */
function arrange_truth_table(table, funstr)
{
	table = dpcopy(table);
	funstr = funstr || 'F';

	vars = [];
	for(let variable in variable_map)
		vars.push(variable);
	vars.sort();
	vars.push(funstr);
	table.unshift(vars);
	return table;
}

function calculate_sdnf(table)
{
	varnames = [];
	for(let variable in variable_map)
		varnames.push(variable);

	mems = [];
	for(let row = 0; row < table.length; ++row)
	{
		if(!table[row][table[row].length-1])
			continue;
		avars = [];
		for(let col = 0; col < table[row].length-1; ++col)
		{
			if(table[row][col])
				avars.push( varnames[col] );
			else
				avars.push( varnames[col] + '\'' );
		}
		mems.push( avars.join('*') );
	}
	return parser.parse(mems.join(' or ') || '0');
}

function calculate_sknf(table)
{
	varnames = [];
	for(let variable in variable_map)
		varnames.push(variable);

	mems = [];
	for(let row = 0; row < table.length; ++row)
	{
		if(table[row][table[row].length-1])
			continue;
		avars = [];
		for(let col = 0; col < table[row].length-1; ++col)
		{
			if(table[row][col])
				avars.push( varnames[col] + '\'' );
			else
				avars.push( varnames[col] );
		}
		if(avars.length)
			mems.push( '(' + avars.join(' or ') + ')' );
	}
	return parser.parse(mems.join('*') || '1');
}





/* END */

/*
 * Продукт распространяется на условиях лицензии CC-BY.
 * 
 * Продукт был разработан Новиковым Денисом Игоревичем,
 * студентом МПУ из группы 201-363, для Московского Политеха
 * по заказу Муханова Сергея Александровича.
 */
