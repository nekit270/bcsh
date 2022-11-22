//fixes
String.prototype.trim = function(){
    var str = this.toString();
    while(str.charAt(0) == " "){
        str = str.slice(1, str.length);
    }
    while(str.charAt(str.length-1) == " "){
        str = str.slice(0, str.length-1);
    }
    return str;
}
String.prototype.replaceAll = function(o, n){
    var str = this.toString();
    while(str.indexOf(o) > -1){
        str = str.replace(o, n);
    }
    return str;
}
Object.keys = function(obj){
    var arr = [];
    for(var i in obj) arr.push(i);
    return arr;
}
var JSON = {
    parse: function(str){
        eval("var ret = "+str);
        return ret;
    },
    stringify: function(obj){
        var ret = "", type = null, arr = [];
        if(obj.length){
            type = 0;
            ret = "[";
        }else{
            type = 1;
            ret = "{";
        }
        for(var i in obj){
            var e = obj[i], str = "";
            str += (type?i+": ":"");
            if(typeof e == "object") str += JSON.stringify(e);
            else if(typeof e == "string") str += '"'+e+'"';
            else str += e;
            arr.push(str);
        }
        ret += arr.join(", ") + (type?"}":"]");
        return ret;
    }
}

var shell = WScript.CreateObject("WScript.Shell");
var fso = WScript.CreateObject("Scripting.FileSystemObject");
var currentDir = shell.CurrentDirectory;
var bcshDir = WScript.ScriptFullName.split("\\").slice(0, -1).join("\\");
var env = shell.Environment("User");
var modulesDir = ".";
if(env.Item("BCSH_MODULES_DIR")){
    modulesDir = env.Item("BCSH_MODULES_DIR");
}else if(fso.FolderExists(bcshDir+"\\modules")){
    modulesDir = bcshDir+"\\modules";
}else if(fso.FolderExists("modules")){
    modulesDir = "modules";
}

var bcsh = {
          commands: {
                "cmdlist": function(args){
                    return Object.keys(bcsh.commands).join(args[0]?args[0]:", ");
                },
                "help": function(args){ 
                    if(!args[0]) args[0] = "main";
                    return bcsh.help[args[0]];
                },
                "load": function(args){
                    var path = modulesDir+"\\"+args[0]+".bcshm", code = "";
                    if(fso.FileExists(path)){
                        var file = fso.OpenTextFile(path, 1);
                        code = file.ReadAll();
                        file.Close();
                        var obj = JSON.parse(code);
                        for(var i in obj){
                            bcsh.commands[i] = obj[i];
                        }
                    }
                },
                "ver": function(args){ return bcsh.version },
                "echo": function(args){ return args[0] },
                "clear": function(args){ WScript.StdOut.WriteBlankLines(9999) },
                "exit": function(args){ WScript.Quit(args[0]) },
                "set": function(args){ bcsh.variables[args[0]] = args[1] },
                "sete": function(args){ bcsh.variables[args[0]] = bcsh.exec(args[1]) },
                "if": function(args){
                    var r = '';
                    if(eval(args[0])){
                        r = bcsh.exec(args[1]);
                    }else{
                        r = bcsh.exec(args[2]);
                    }
                    return r; 
                },
                "loop": function(args){ 
                    var r = '', i = args[1];
                    while(i < args[2]){
                        r += bcsh.exec(args[3].replaceAll("@{"+args[0]+"}", i)); 
                        i++;
                    }
                    return r; 
                },
                "func": function(args){ bcsh.functions[args[0]] = args[1] },
                "funclist": function(args){ return Object.keys(bcsh.functions).join(args[0]?args[0]:", ") },
                "f": function(args){
                    var code = bcsh.functions[args[0]];
                    for(var i in args) code = code.replaceAll("@{#"+i+"}", args[i]);
                    return bcsh.exec(code); 
                },
                "math": function(args){ return eval(args.join("")) },
                "wait": function(args){ WScript.Sleep(args[0]) },
                "exec": function(args){ return bcsh.exec(args[0]) },
                "execScript": function(args){ return bcsh.execScript(args[0]) },
                "msgbox": function(args){
                    var icons = {none: 0, error: 64, question: 32, warning: 48, info: 64};
                    var buttons = {ok: 0, ok_cancel: 1, abort_retry_ignore: 2, yes_no_cancel: 3, yes_no: 4, retry_cancel: 5};
                    var results = ["", "ok", "cancel", "abort", "retry", "ignore", "yes", "no"];
                    return results[shell.Popup(args[1], 0, args[0], icons[args[2]] + buttons[args[3]])];
                },
                "run": function(args){
                    var types = {hidden: 0, normal: 1, min: 2, max: 3};
                    if(!args[1]) args[1] = "normal";
                    if(args[1] == "get_stdout"){
                        var exec = shell.Exec((args[2]?'cmd /c "chcp 1251>nul & ':'')+args[0]+(args[2]?'"':''));
                        while(exec.Status != 1) WScript.Sleep(100);
                        return exec.StdOut.ReadAll();
                    }else if(args[1] == "get_stderr"){
                        var exec = shell.Exec((args[2]?'cmd /c "chcp 1251>nul & ':'')+args[0]+(args[2]?'"':''));
                        while(exec.Status != 1) WScript.Sleep(100);
                        return exec.StdErr.ReadAll();
                    }else{
                        return shell.Run((args[2]?'cmd /c "chcp 1251>nul & ':'')+args[0]+(args[2]?'"':''), types[args[1]], true);
                    }
                },
                "writeln": function(args){ WScript.StdOut.WriteLine(args[0]) },
                "write": function(args){ WScript.StdOut.Write(args[0]) },
                "readln": function(args){
                    WScript.StdOut.Write(args[0]);
                    return ""+WScript.StdIn.ReadLine();
                },
                "task.list": function(args){
                    var exec = shell.Exec('cmd /c "chcp 1251>nul & for /f "tokens=1" %i in (\'tasklist\') do @echo %i"');
                    while(exec.Status != 1) WScript.Sleep(100);
                    var arr = exec.StdOut.ReadAll().replaceAll("\r", "").split("\n");
                    arr.shift();
                    arr.shift();
                    arr.pop();
                    return arr;
                },
                "task.kill": function(args){
                    shell.Run("taskkill /f /im "+args[0], 0);
                },
                "power.shutdown": function(args){ shell.Run("shutdown /s /t "+(args[0]||""), 0) },
                "power.reboot": function(args){ shell.Run("shutdown /r /t "+(args[1]||""), 0) },
                "power.sleep": function(args){ shell.Run("rundll32 powrprof.dll,SetSuspendState 0,1,0") },
                "power.hibernate": function(args){ shell.Run("rundll32 powrprof.dll,SetSuspendState 1,1,0") },
                "str.replace": function(args){ return (args[3]?args[0].replace(args[1], args[2]):args[0].replaceAll(args[1], args[2])) },
                "str.replaceRegEx": function(args){ return args[0].replace(new RegExp(args[1]), args[2]) },
                "str.join": function(args){ return args.join("") },
                "str.split": function(args){ return args[0].toString().split(args[1]) },
                "str.match": function(args){ return args[0].match(new RegExp(args[1])) },
                "str.contains": function(args){ return args[0].includes(args[1]) },
                "str.equals": function(args){ return (args[0] == args[1]) },
                "str.escapeHtml": function(args){ return args[0].replaceAll("<", "<").replaceAll(">", ">") },
                "obj.get": function(args){ return JSON.parse(args[0])[args[1]] },
                "obj.set": function(args){ var o = JSON.parse(args[0]); o[args[1]] = args[2]; return o },
                "obj.create": function(args){ return "{}" },
                "obj.save": function(args){ eval(args[0])[args[1]] = JSON.parse(args[2]) },
                "obj.foreach": function(args){
                    var o = JSON.parse(args[0]);
                    var r = ''; 
                    for(var i in o){ 
                        r += bcsh.exec(args[1].replaceAll("@{name}", i).replaceAll("@{value}", o[i]))
                    }
                    return r;
                 },
                "arr.create": function(args){ return "[]" },
                "arr.join": function(args){ return JSON.parse(args[0]).join(args[1]) },
                "js.new": function(args){ return eval("new "+args[0]+"("+args[1]+")") },
                "js.eval": function(args){ return eval(args[0]) },
                "js.get": function(args){ return eval(args[0])[args[1]] },
                "js.set": function(args){ eval(args[0])[args[1]] = args[2] },
                "js.call": function(args){ return eval(args[0]+"['"+args[1]+"']("+args[2]+")") },
                "js.math": function(args){ return eval("Math."+args[0]+"("+args[1]+")") },
                "js.random": function(args){ return Math.floor(Math.random()*args[0]) },
                "file.write": function(args){
                    var f = fso.OpenTextFile(args[0], 2, true);
                    f.Write(args[1]);
                    f.Close();
                 },
                "file.read": function(args){
                    var f = fso.OpenTextFile(args[0], 1);
                    var r = f.ReadAll();
                    f.Close();
                    return r;
                },
                "data.fetch": function(args){},
                "data.decode": function(args){ return decodeURIComponent(atob(args[0])); },
                "data.encode": function(args){ return btoa(encodeURIComponent(args[0])); }
          },
          help: {
            main: "Справка BCSH\r\ncmdlist              Список команд \r\nhelp <команда>       Описание команды \r\nhelp about_syntax    Синтаксис \r\nhelp about_variables Переменные \r\nhelp about_scripts   Скрипты",

            about_syntax: "Синтаксис оболочки BCSH\r\nОбщий синтаксис\r\nКоманды в BCSH состоят из, собственно, команды и параметров (аргументов), перечисленных через запятую: \r\nкоманда параметр1, параметр2, ... \r\nЕсли в тексте параметра содержатся пробелы и/или запятые, то его нужно заключать в одинарные или двойные кавычки: \r\nкоманда 'параметр 1', \"параметр, 2\", ... \r\nОператоры\r\nВ BCSH есть следующие операторы: ;, &, @{}, $ и \`. \r\n \r\nОператор ; используется для выполнения сразу нескольких команд:  \r\nкоманда1 <параметры> ;  команда2 <параметры> ;  команда3 <параметры> ; ... \r\n \r\nОператор & используется, чтобы передать команде результат выполнения другой команды: \r\nкоманда1 '&команда2 <параметры второй команды>', ... \r\n \r\nОператор @{} используется для вставки математических выражений и значений переменных в текст параметра:  \r\nкоманда '@{someVar}', ... \r\nкоманда '@{2+3}', ... \r\nкоманда '@{var1 + 5 * (var2 - 9)}', ... \r\nЧтобы узнать подробнее о переменных, введите help about_variables. \r\n \r\nОператор $ используется для вставки спец.символа в строку. Допустимые символы:  \r\n$Q1 = ' \r\n$Q2 = \" \r\n$Q3 = \` \r\n$SP = пробел \r\n$CM = , \r\n$AT = @ \r\n$AM = & \r\n \r\nОператор \` используется для блоков кода. Блоки кода нужны в командах, выполняющих другие команды (if, loop и пр.). \r\nкоманда1 \`команда2 ; команда3\`, ... \r\n \r\nТакже BCSH игнорирует все лишние пробелы до и после команды:  \r\n     команда <параметры>   \r\n",

            about_variables: "Переменные\r\nПеременные задаются с помощью команды set:  \r\nset <имя переменной>, <значение переменной> \r\nВставить значение переменной в параметр команды можно с помощью оператора @{}:  \r\nкоманда '@{<имя переменной>}', ... \r\n",

            about_scripts: "Скрипты\r\nСкрипты BCSH - это текстовые файлы, содержащие набор команд:  \r\n   команда1 <параметры> \r\n   команда2 <параметры> \r\n   команда3 <параметры> \r\n   ... \r\n \r\nТакже в скриптах можно создавать многострочные блоки кода, используя пробел и точку с запятой после каждой строки: \r\n   ... \r\n   команда \` ; \r\n      команда1 <параметры> ; \r\n      команда2 <параметры> ; \r\n   \` \r\n   ... \r\n",
            
            cmdlist: "cmdlist\r\nВозвращает список всех доступных команд."
          },
          functions: {},
          variables: {},
          version: "BCSH v4.3",
          ver: 4.3,
          exec: function(cmdto){
                cmdto = cmdto.toString();
                if(!cmdto || cmdto.trim() == "") return "";

                if(cmdto.match(/[^\\]; /)){
                    cmdto = cmdto.split(/[^\\]; /);
                    var r = "";
                    for(var i in cmdto){
                        r += bcsh.exec(cmdto[i].trim());
                    }
                    return r;
                }
                cmdto = cmdto.replaceAll("\\;", ";");
                cmdto = cmdto.trim();

                var ret = null;
                var parsing = true;

                cmdto = cmdto.split("");
                var cmdt = cmdto, str = false, qt = null, estr = false;
                for(var i in cmdto){
                    var ch = cmdto[i];
                    if(ch == "`"){
                        qt = ch;
                        if(qt && qt == ch){
                            estr = !estr;
                            ch = "";
                        }
                    }else if(ch == "'" || ch == '"'){
                        if(!qt) qt = ch;
                        if(qt && qt == ch){
                            str = !str;
                            ch = "";
                        }
                    }
                    if(str){
                        if(ch == " ") ch = "$SP";
                        if(ch == ",") ch = "$CM";
                    }
                    if(estr){
                        if(ch == " ") ch = "$SP";
                        if(ch == ",") ch = "$CM";
                        if(ch == "@") ch = "$AT";
                        if(ch == "&") ch = "$AM";
                    }
                    cmdt[i] = ch;
                }
                cmdt = cmdt.join("").replaceAll(",", "");

                var pa = cmdt.split(" ");
                var cmda, cmdap, cmd;
                if(pa.length == 1){
                    cmd = pa[0];
                    pa = [];
                }else{
                    cmd = pa[0];
                    pa.shift();
                }

                if(!(cmd in this.commands)) return 'Команда "'+cmd+'" не найдена.';

                var found = false;

                    for(var i in pa){
                        var o = pa, e = o[i];
                        if(o[i] && typeof o[i] == "object") o[i] = JSON.stringify(o[i]);

                        o[i] = o[i].toString().replaceAll("$SP", " ");
                        o[i] = o[i].toString().replaceAll("$CM", ",");
                        o[i] = o[i].toString().replaceAll("$Q1", "'");
                        o[i] = o[i].toString().replaceAll("$Q2", '"');
                        o[i] = o[i].toString().replaceAll("$Q3", "`");
                        
                        if(o[i].toString().match(/@{.+}/) && o[i].toString().charAt(0) != "&"){
                            try{
                                o[i] = o[i].toString().replace(/@{([^}]+)}/g, function(p1){
                                    var c = p1.replaceAll('@{','').replaceAll('}','');
                                    if(bcsh.variables[c]) c = "bcsh.variables."+c;
                                    else{
                                        var o = c.split(" ");
                                        for(var i in o){
                                            var e = o[i];
                                            if(bcsh.variables[e]) o[i] = "bcsh.variables."+e;
                                        }
                                        c = o.join(" ");
                                    }
                                    return eval(c);
                                });
                            }catch(e){ 
                                ret = e; 
                            }
                        }

                        if(o[i].toString().match(/^&/)){
                            o[i] = bcsh.exec(o[i].toString().replace("&", ""));
                        }

                        o[i] = o[i].toString().replaceAll("$AT", "@");
                        o[i] = o[i].toString().replaceAll("$AM", "&");

                        if(!isNaN(o[i].toString()) && o[i].toString().length > 0) o[i] = +o[i];
                    }

                for(var i in this.commands){
                    if(cmd == i){
                        found = true;
                        try{
                            ret = this.commands[i](pa);
                        }catch(e){
                            ret = e.message;
                        }
                        break;
                    }
                }
                if(ret && typeof ret == "object") ret = JSON.stringify(ret);
                return ((ret || ret === 0)?ret:"");
          },
          execScript: function(code){
              code = code.replaceAll("\r", "");
              code = code.replaceAll(";\n", "\\; ");
              code = code.split("\n");
              for(var i in code){
                  if(code[i].charAt(0) == "#" || code[i] == "") continue;
                  bcsh.exec(code[i]);
              }
          }
}

var args = WScript.Arguments.Unnamed;

try{
    var _ = args(0);
}catch(e){
    WScript.StdOut.Write(
        "bcsh [-v] [-h] [-s] [-f <скрипт>] [-c <команда>]\r\n\
                -v              Вывести версию BCSH\r\n\
                -h              Вывести справочное сообщение\r\n\
                -s              Открыть интерактивную оболочку\r\n\
                -f <скрипт>     Запустить скрипт\r\n\
                -с <команда>    Выполнить команду");
    WScript.Quit();
}

switch(args(0)){
    case "-f": {
        var f = fso.OpenTextFile(args(1), 1);
        WScript.StdOut.Write(bcsh.execScript(f.ReadAll()));
        f.Close();
        break;
    }
    case "-c": {
        WScript.StdOut.Write(bcsh.exec(args(1)));
        break;
    }
    case "-s": {
        var cmd = "";
        while(true){
            WScript.StdOut.Write("> ");
            cmd = ""+WScript.StdIn.ReadLine();
            if(cmd == "exit") WScript.Quit();
            WScript.StdOut.WriteLine(bcsh.exec(cmd));
        }
    }
    case "-h": {
        WScript.StdOut.Write(
"bcsh [-v] [-h] [-s] [-f <??????>] [-c <???????>]\r\n\
        -v              ??????? ?????? BCSH\r\n\
        -h              ??????? ?????????? ?????????\r\n\
        -s              ??????? ????????????? ????????\r\n\
        -f <??????>     ????????? ??????\r\n\
        -? <???????>    ????????? ???????");
        break;
    }
    case "-v": {
        WScript.StdOut.Write(bcsh.version);
        break;
    }
    default: {
        WScript.StdOut.Write("???????????? ?????????. ??????? \"bcsh -h\" ??? ???????.");
    }
}