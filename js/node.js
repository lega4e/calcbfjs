/*
 *
 * autor:    lis
 * create:   Dec 16 15:26:09 2020
 * modified: Dec 16 18:17:02 2020
 *
 * Создавать значения следующим образом:
 *   x = createValue(value_name);
 * либо
 *   x = createValue(0); // 1
 *
 * Создавать выражения следующим образом:
 *   root = new Node(Operation.OR, leftnode, rightnode);
 *   root = new Node(null, null, null, createValue(1));
 * либо
 *   root = new Node();
 *   root.setOperation(op, left, right);
 *   root.setValue(createValue('x'));
 *
 * При создании переменных их имена добавляются в
 * глобальную таблицу; при повторном создании переменной
 * с тем же именем возвращает уже имеющийся объект
 * (берётся из таблицы)
 *
 * Чтобы изменить значение переменной (или переименовать её):
 *   variable_map[varname].value = newvalue;
 *   variable_map[varname].name = newname;
 *
 */



/*
 * Operation
 */
let Operation = {
	'NOT'  : 0,
	'AND'  : 1,
	'OR'   : 2,
	'IMP'  : 3,
	'EQ'   : 4,
	'ADD'  : 5,
	'PIRS' : 6,
	'SHEF' : 7,

	0 : 'NOT',
	1 : 'OR',
	2 : 'AND',
	3 : 'IMP',
	4 : 'EQ',
	5 : 'ADD',
	6 : 'PIRS',
	7 : 'SHEF',
};

Operation.isunary = function(op)
{
	return op == 'NOT' || op == 0;
}

Operation.isbinary = function(op)
{
	return !Operation.isunary(op);
}


let OperationActions = {
	0 : function(x)    { return !x },       // NOT
	1 : function(x, y) { return  x &&  y }, // AND
	2 : function(x, y) { return  x ||  y }, // OR
	3 : function(x, y) { return !x ||  y }, // INP
	4 : function(x, y) { return  x ==  y }, // EQ
	5 : function(x, y) { return  x !=  y }, // ADD
	6 : function(x, y) { return !x && !y }, // PIRS
	7 : function(x, y) { return !x || !y }, // SHEF
};

let OperationPriority = {
	0 : 3,
	1 : 2,
	2 : 1,
	3 : 0,
	4 : 0,
	5 : 0,
	6 : 0,
	7 : 0
};

OperationSymbols = {
	0 : ['not ', '\''],
	1 : '&',
	2 : ' or ',
	3 : ' -> ',
	4 : ' ~ ',
	5 : ' + ',
	6 : ' |. ',
	7 : ' | '
};

OperationLatexSymbols = {
	0 : [' \\lnot ', '\''],
	1 : ' ',
	2 : ' \\vee ',
	3 : ' \\rightarrow ',
	4 : ' \\sim ',
	5 : ' + ',
	6 : ' \\downarrow ',
	7 : ' \\ |\\ '
}



/*
 * Value and variables
 */
let variable_map = {};

function createValue(name)
{
	if(name == 0 || name == 1)
	{
		let value = new _Value(null, name);
		return value;
	}

	if(variable_map[name])
		return variable_map[name];

	let value = new _Value(name, 0);
	variable_map[name] = value;
	return value;
}

class _Value
{
	/*
	 * string name;
	 * bool value;
	 */

	constructor(name, value)
	{
		this.name  = name;
		this.value = value;
	}

	clone()
	{
		if(this.isvar())
			return this;
		return new _Value(null, this.value);
	}

	str(level)
	{
		if(!this.name)
			return String(this.value);
		return this.name; //+ ' (' + this.value + ')';
	}

	isvar()
	{
		return Boolean(this.name);
	}

	value()
	{
		return variable_map[this.name].value;
	}
}





class Node
{
	/*
	 * string op aka Operation.X;
	 * Node left, right; (or null)
	 * Value value; (or null)
	 */

	constructor(op, left, right, value)
	{
		this.op    = op    || null;
		this.left  = left  || null;
		this.right = right || null;
		this.value = value || null;
		return;
	}

	clone()
	{
		let node = new Node;

		if(this.isleaf())
		{
			node.setValue(this.value.clone());
			return node;
		}

		if(this.isop())
		{
			if(this.isunaryop())
			{
				node.setOperation(this.op, this.left.clone());
				return node;
			}

			node.setOperation(this.op, this.left.clone(), this.right.clone());
			return node;
		}

		throw 'try to clone null node';
	}

	setOperation(op, left, right)
	{
		this.op    = op;
		this.left  = left;
		this.right = right;
		this.value = null;
		return;
	}

	setValue(value)
	{
		this.op    = null;
		this.left  = null;
		this.right = null;
		this.value = value;
		return;
	}

	/*
	 * view operations
	 * not = 0 - prefix not,
	 * not = 1 - postfix not
	 */
	str(prior, op, opmap, not)
	{
		if(!prior && prior != 0)
			prior = -1;
		opmap = opmap || OperationSymbols;
		if(!not && not != 0)
			not = 1;

		if(this.isleaf())
			return this.value.name || this.value.value;

		let s = null;
		let thispr = OperationPriority[this.op];
		if(this.isunaryop())
		{
			if(this.op == Operation.NOT && not == 1)
				s = this.left.str(thispr, this.op, opmap, not) + opmap[this.op][1];
			else
				s = (this.op == Operation.NOT ? opmap[this.op][0] : opmap[this.op]) +
					this.left.str(thispr, this.op, opmap, not);
		}
		else
		{
			s = this.left.str(thispr, this.op, opmap, not) +
				opmap[this.op] +
				this.right.str(thispr, this.op, opmap, not);
		}

		if(thispr <= prior && (op == undefined || this.op != op))
			s = '(' + s + ')';

		return s;
	}

	tree(level)
	{
		level = level || 0;
		if(this.isop())
			return repeat('  ', level) + Operation[this.op] + '\n' +
				(this.isunaryop() ?
					this.left.tree(level+1) :
					this.left.tree(level+1) + '\n' +
					this.right.tree(level+1)
				);
		else if(this.isleaf())
			return repeat('  ', level) + this.value.str();
		return 'NULL';
	}

	latex(not)
	{
		not = not || 0;
		return this.str(-1, undefined, OperationLatexSymbols, not);
	}



	/*
	 * calculate functions
	 */
	depth()
	{
		if(this.isleaf())
			return 0;

		if(this.isop())
		{
			if(this.isunaryop())
			{
				return this.left.depth()+1;
			}
			return max(this.left.depth(), this.right.depth()) + 1;
		}

		throw 'try calculate depth for node that is none';
	}

	calc()
	{
		if(this.isop())
			return Number(
				this.isunaryop() ?
				OperationActions[this.op](this.left.calc()) :
				OperationActions[this.op](this.left.calc(), this.right.calc())
			);
		if(this.isleaf())
			return Number(this.value.value);
		throw 'calc->isnone()';
	}



	/*
	 * is-functions
	 */
	isop()
	{
		return Boolean(this.op != null);
	}

	isunaryop()
	{
		return this.isop && Operation.isunary(this.op);
	}

	isleaf()
	{
		return Boolean(this.value);
	}

	isnone()
	{
		return !this.isop() && !this.isleaf();
	}
}





/* END */

/*
 * Продукт распространяется на условиях лицензии CC-BY.
 * 
 * Продукт был разработан Новиковым Денисом Игоревичем,
 * студентом МПУ из группы 201-363, для Московского Политеха
 * по заказу Муханова Сергея Александровича.
 */
