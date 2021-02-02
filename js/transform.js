/*
 * autor:    lis
 * created:  Dec 16 20:46:50 2020
 * modified: Dec 16 20:47:15 2020
 *
 * Depends:
 * Node from node.js
 * variable_map from node.js
 * calculate_truth_table from algorithms.js
 */





/*
 * Рекурсивно вызывает переданную функцию в первом аргументе
 * с переданным узлом и со всеми его потомками
 */
function recursion(fun, node)
{
	if(!node)
		return;
	fun(node);
	recursion(fun, node.left);
	recursion(fun, node.right);
	return;
}



/*
 * Производит неравносильное преобразование узла выражения — 
 * отрицание; если данное выражение уже содержит отрицание,
 * то оно будет удалено
 */
function negation(node)
{
	if(node.isleaf())
	{
		node.op = Operation.NOT;
		node.left = new Node();
		node.left.setValue(node.value);
		node.value = null;
		return;
	}

	if(node.op == Operation.NOT)
	{
		if(node.left.isleaf())
		{
			node.op = null;
			node.value = node.left.value;
			node.left = null;
			return;
		}

		node.op = node.left.op;
		node.right = node.left.right;
		node.left = node.left.left;
		return;
	}

	let left = new Node();
	left.setOperation(node.op, node.left, node.right);
	node.op = Operation.NOT;
	node.left = left;
	node.right = null;
	return;
}





/*
 * Выполняет ряд равносильных преобразований, в результате которых
 * в выражении остаются только операции отрицания, конъюнкции и
 * дизъюнкции
 */
function all_to_not_or_and(node)
{
	recursion(shef_to_not_and, node);
	recursion(pirs_to_not_or,  node);
	recursion(add_to_or_and,   node);
	recursion(eq_to_or_and,    node);
	recursion(imp_to_or,       node);
	return;
}



/*
 * Строит полином Жегалкина методом треугольника 
 */
function all_to_jegalkin(node)
{
	function concat_members(mems, op)
	{
		let node = mems[ mems.length-1 ];
		for(let i = mems.length-2; i > -1; --i)
		{
			let leftnode = mems[i];
			let newnode = new Node(op, leftnode, node);
			node = newnode;
		}
		return node;
	}

	function create_member(n, vars)
	{
		if(n == 0)
			return new Node(null, null, null, createValue(1));

		let nodes = [];
		for(let i = 0; i < vars.length; ++i)
		{
			if(n & (1 << i))
			{
				nodes.push( new Node(null, null, null, createValue(vars[vars.length-1-i])) );
			}
		}

		nodes.sort(
			(lhs, rhs) => {
				if(lhs.value.name != rhs.value.name)
					return lhs.value.name < rhs.value.name ? -1 : 1;
				return 0;
			}
		);

		return concat_members(nodes, Operation.AND);
	}

	table = calculate_truth_table(node);
	vec = table.map( (l) => l[l.length-1] );

	seq = [ vec[0] ];
	while(vec.length > 1)
	{
		for(let i = 0; i < vec.length-1; ++i)
			vec[i] = vec[i] != vec[i+1];
		vec.pop();
		seq.push(vec[0]);
	}

	vars = [];
	for(let variable in variable_map)
		vars.push(variable);
	// vars.sort();

	let mems = [];
	for(let i = 0; i < seq.length; ++i)
	{
		if(seq[i])
			mems.push(create_member(i, vars));
	}

	let result;
	if(mems.length != 0)
	{
		mems.sort( 
			(lhs, rhs) => {
				lhsdepth = lhs.depth();
				rhsdepth = rhs.depth();
				if(lhsdepth != rhsdepth)
					return lhsdepth < rhsdepth ? -1 : 1;

				while(lhs && rhs)
				{
					lhsleaf = lhs.isleaf() ? lhs : lhs.left;
					rhsleaf = rhs.isleaf() ? rhs : rhs.left;

					if(!lhsleaf.value.name || !rhsleaf.value.name)
					{
						if(lhsleaf.value.name || rhsleaf.value.name)
							return !lhsleaf.value.name ? -1 : 1;
						if(lhsleaf.value.value != rhsleaf.value.value)
							return lhsleaf.value.value < rhsleaf.value.value ? -1 : 1;
						continue;
					}

					if(lhsleaf.value.name != rhsleaf.value.name)
						return lhsleaf.value.name < rhsleaf.value.name ? -1 : 1;

					lhs = lhs.right;
					rhs = rhs.right;
				}

				return 0;
			}
		);
		result = concat_members(mems, Operation.ADD);
	}
	else
		result = new Node(null, null, null, createValue(0));

	node.op    = result.op;
	node.left  = result.left;
	node.right = result.right;
	node.value = result.value;
	return;
}



/*
 * Минимизация выражения методом Куайна
 */
function minimize(node)
{
	function create_adjacent_row(first, second)
	{
		let difference = 0;
		for(let i = 0; i < first.length; ++i)
		{
			if(first[i] != second[i])
				++difference;
		}

		if(difference > 1)
			return null;

		for(let i = 0; i < first.length; ++i)
		{
			if(first[i] != second[i])
			{
				return first.substr(0, i) + '-' + first.substr(i+1);
			}
		}
		return first;
	}

	function isequal(lhs, rhs)
	{
		if(lhs.length != rhs.length)
			return false;

		for(let i = 0; i < lhs.length; ++i)
		{
			if(lhs[i] != rhs[i])
				return false;
		}
		return true;
	}


	let cur =
		calculate_truth_table(node).
		filter( (row) => row[row.length-1] ).
		map( (row) => row.splice(0, row.length-1).join('') );

	let prv;
	do
	{
		prv = cur;
		cur = [];
		was = make_array(prv.length, false);
		for(let i = 0; i < prv.length; ++i)
		{
			for(let j = i+1; j < prv.length; ++j)
			{
				let adj = create_adjacent_row(prv[i], prv[j]);
				if(adj)
				{
					cur.push(adj);
					was[i] = true;
					was[j] = true;
				}
			}

			if(!was[i])
			{
				cur.push(prv[i]);
			}
		}

		
		let set = new Set(cur);
		cur = [];
		set.forEach( (x) => cur.push(x) );
	}
	while(!isequal(cur, prv));
}



/*
 * Выполняет ряд равносильных преобразований, в результате которых
 * в выражении остаются только операции штриха Шеффера
 */
function all_to_shef(node)
{
	recursion(add_to_or_and, node);
	recursion(eq_to_or_and,  node);
	recursion(imp_to_or,     node);
	recursion(and_to_or,     node);
	recursion(or_to_shef,    node);
	recursion(not_to_shef,   node);
	return;
}


/*
 * Выполняет ряд равносильных преобразований, в результате которых
 * в выражении остаются только операции стрелки Пирса
 */
function all_to_pirs(node)
{
	recursion(add_to_or_and, node);
	recursion(eq_to_or_and,  node);
	recursion(imp_to_and,    node);
	recursion(or_to_and,     node);
	recursion(and_to_pirs,   node);
	recursion(not_to_pirs,   node);
	return;
}





/*
 * Следюущие процедуры принимают узел выражения и производят
 * равносильное преобразование из одной операции в другую;
 * если функция не предназначена для преобразования опера-
 * ции, которую содержит узел, то узел останется неизменным
 */
function or_to_and(node)
{
	if(node.op != Operation.OR)
		return;
	negation(node.left);
	negation(node.right);
	node.op = Operation.AND;
	negation(node);
	return;
}

function and_to_or(node)
{
	if(node.op != Operation.AND)
		return;
	negation(node.left);
	negation(node.right);
	node.op = Operation.OR;
	negation(node);
	return;
}

function imp_to_or(node)
{
	if(node.op != Operation.IMP)
		return;
	negation(node.left);
	node.op = Operation.OR;
	return;
}

function imp_to_and(node)
{
	if(node.op != Operation.IMP)
		return;
	negation(node.right);
	node.op = Operation.AND;
	negation(node);
	return;
}





/*
 * Функции преобразования операций эквиваленции и сложения по
 * Жегалкину в операции конъюнкции и дизъюнкции
 */
function eq_to_or_and(node)
{
	if(node.op != Operation.EQ)
		return;

	let lnode = new Node(Operation.AND, node.left, node.right);

	let rleft  = node.left.clone();
	let rright = node.right.clone();
	negation(rleft);
	negation(rright);
	let rnode = new Node(Operation.AND, rleft, rright);

	node.op = Operation.OR;
	node.left = lnode;
	node.right = rnode;
	return;
}

function add_to_or_and(node)
{
	if(node.op != Operation.ADD)
		return;

	let lnode = new Node(Operation.AND, node.left, node.right.clone());
	negation(lnode.right);

	let rnode = new Node(Operation.AND, node.left.clone(), node.right);
	negation(lnode.left);

	node.op = Operation.OR;
	node.left = lnode;
	node.right = rnode;
	return;
}





/*
 * Функции преобразования к штриху Шеффера и из него
 */
function or_to_shef(node)
{
	if(node.op != Operation.OR)
		return;

	let lnode = new Node(Operation.SHEF, node.left, node.left.clone());
	let rnode = new Node(Operation.SHEF, node.right, node.right.clone());

	node.op = Operation.SHEF;
	node.left = lnode;
	node.right = rnode;
	return;
}

function not_to_shef(node)
{
	if(node.op != Operation.NOT)
		return;

	node.op = Operation.SHEF;
	node.right = node.left.clone();
	return;
}

function shef_to_not_and(node)
{
	if(node.op != Operation.SHEF)
		return;

	let n = new Node(Operation.AND, node.left, node.right);
	node.op = Operation.NOT;
	node.left = n;
	node.right = null;
	return;
}





/*
 * Функции преобразования к стрелке Пирса и из неё
 */
function and_to_pirs(node)
{
	if(node.op != Operation.AND)
		return;

	let lnode = new Node(Operation.PIRS, node.left, node.left.clone());
	let rnode = new Node(Operation.PIRS, node.right, node.right.clone());

	node.op = Operation.PIRS;
	node.left = lnode;
	node.right = rnode;
	return;
}

function not_to_pirs(node)
{
	if(node.op != Operation.NOT)
		return;

	node.op = Operation.SHEF;
	node.right = node.left.clone();
	return;
}

function pirs_to_not_or(node)
{
	if(node.op != Operation.PIRS)
		return;

	let n = new Node(Operation.OR, node.left, node.right);
	node.op = Operation.NOT;
	node.left = n;
	node.right = null;
	return;
}





/* END */

/*
 * Продукт распространяется на условиях лицензии CC-BY.
 * 
 * Продукт был разработан Новиковым Денисом Игоревичем,
 * студентом МПУ из группы 201-363, для Московского Политеха
 * по заказу Муханова Сергея Александровича.
 */
