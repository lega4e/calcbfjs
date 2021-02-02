/*
 * main.js
 *
 * autor:    lis
 * created:  Dec 16 14:35:05 2020
 * modified: Dec 16 18:47:51 2020 
 */





/*
 * Разбивает строку на части, заменяя пробельные
 * символы на nlinesym (по умолчанию '\n') так,
 * чтобы длина каждой части не превышала count
 * (по умолчанию 70)
 */
function wraptext(text, count, nlinesym)
{
	nlinesym = nlinesym || '\n';
	count = count || 70;

	let pos = 0;
	while(pos+count < text.length)
	{
		let was = false;
		for(let i = pos+count-1; i > pos-1; --i)
		{
			if(text[i] == ' ' || text[i] == '\t' || text[i] == '\n')
			{
				text = text.substr(0, i) + '\n' + text.substr(i+1);
				pos = i+1;
				was = true;
				break;
			}
		}

		if(!was)
			pos += count;
	}
	return text;
}

window.keypress = function(s)
{
	if(window.event.keyCode == 13)
		window.enter(s);
	return;
}

all_to_shef();

window.enter = function(s)
{
	if(!s)
		return;

	variable_map = {}
	let node;
	let errtag = document.getElementById('error');
	try
	{
		node = parser.parse(s);
	}
	catch(e)
	{
		errtag.innerHTML = 'Ошибка... Вы всё правильно написали?';
		return;
	}
	errtag.innerHTML = '';

	let table = calculate_truth_table(node);
	let sdnf = calculate_sdnf(table);
	let sknf = calculate_sknf(table);
	table = arrange_truth_table(table);

	let jegalkin = node.clone();
	all_to_jegalkin(jegalkin);

	// let min = node.clone();
	// minimaize(min);

	let not = 1;
	let addition_inf =
		tag('p style="font-weight: bold;"', 'Ваша формула: ')      +
			tag('div', '\\( ' + node.latex(not)     + ' \\)', 'class=formula') +
		tag('p style="font-weight: bold;"', 'СДНФ: ')              +
			tag('div', '\\( ' + sdnf.latex(not)     + ' \\)', 'class=formula') +
		tag('p style="font-weight: bold;"', 'СКНФ: ')              +
			tag('div', '\\( ' + sknf.latex(not)     + ' \\)', 'class=formula') +
		tag('p style="font-weight: bold;"', 'Полином Жегалкина: ') +
			tag('div', '\\( ' + jegalkin.latex(not) + ' \\)', 'class=formula');

	let html =
		generate_html_table(table, { 'table' : 'id=restable' }) +
		// '<pre class=callout>\n' + node.tree() + '</pre>\n\n' + 
		addition_inf;
	// minimize(node);

	document.getElementById('result').innerHTML = html;
	MathJax.typeset();
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
