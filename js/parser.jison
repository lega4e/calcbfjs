/* description: Parses end executes mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                    /*skip whitespace */
"0"                    return '0'
"1"                    return '1'

"not"                  return 'NOT'
"!"                    return 'NOT'
"'"                    return 'NOTP'

"or"                   return 'OR'
"||"                   return 'OR'

"and"                  return 'AND'
"*"                    return 'AND'
"&"                    return 'AND'
"&&"                   return 'AND'
"^"                    return 'AND'

"imp"                  return 'IMP'
"->"                   return 'IMP'
"eq"                   return 'EQ'
"~"                    return 'EQ'
"add"                  return 'ADD'
"+"                    return 'ADD'

"|."                   return 'PIRS'
"|"                    return 'SHEF'

"("                    return '('
")"                    return ')'

[a-zA-z_]\w*           return 'NAME'
<<EOF>>                return 'EOF'
"\n"                   return 'EOF'
.                      return 'INVALID'

/lex

/* operator associations and precedence */

%left 'EQ' 'ADD' 'PIRS' 'SHEF'
%left 'IMP'
%left 'OR'
%left 'AND'
%left 'NOT'
%left 'NOTP'

%start expressions

%% /* language grammar */

expressions
    : e EOF {return $1;}
    ;

e
	: e 'ADD'  e { $$ = new Node(Operation.ADD,  $1, $3); }
	| e 'EQ'   e { $$ = new Node(Operation.EQ,   $1, $3); }
	| e 'PIRS' e { $$ = new Node(Operation.PIRS, $1, $3); }
	| e 'SHEF' e { $$ = new Node(Operation.SHEF, $1, $3); }

	| e 'IMP'  e { $$ = new Node(Operation.IMP,  $1, $3); }
	| e 'OR'   e { $$ = new Node(Operation.OR,   $1, $3); }
	| e 'AND'  e { $$ = new Node(Operation.AND,  $1, $3); }

	| 'NOT' e  { $$ = new Node(); $$.setOperation(Operation.NOT, $2); }
	| e 'NOTP' { $$ = new Node(); $$.setOperation(Operation.NOT, $1); }

    | '(' e ')' { $$ = $2; }

	| '0'
		{
			let val = createValue(0);
			$$ = new Node();
			$$.setValue(val);
		}
	| '1'
		{
			let val = createValue(1);
			$$ = new Node();
			$$.setValue(val);
		}
	| 'NAME'
		{
			let val = createValue(yytext);
			$$ = new Node();
			$$.setValue(val);
		}
	;

/*
 * Продукт распространяется на условиях лицензии CC-BY.
 * 
 * Продукт был разработан Новиковым Денисом Игоревичем,
 * студентом МПУ из группы 201-363, для Московского Политеха
 * по заказу Муханова Сергея Александровича.
 */
