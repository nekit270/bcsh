window.bcsh = {
          commands: {
              "cmdlist": (args)=>{ return Object.keys(bcsh.commands).join(args[0]?args[0]:", ") },
              "help": (args)=>{ if(!args[0]) args[0] = "main"; return bcsh.help[args[0]] },
              "echo": (args)=>{ return args[0]; },
              "set": (args)=>{ window[args[0]] = args[1] },
              "if": (args)=>{ let r = ''; if(eval(args[0])){ r = bcsh.exec(args[1]) }else{ r = bcsh.exec(args[2]) }; return r; },
              "loop": (args)=>{ let r = '', i = args[1]; while(i < args[2]){ r += bcsh.exec(args[3].replaceAll(`@{${args[0]}}`, i)); i++ }; return r; },
              "interval": (args)=>{ let iid = setInterval(()=>{ if(!eval(args[0])) clearInterval(iid); bcsh.exec(args[1]) }, args[2]); return iid },
              "func": (args)=>{ bcsh.functions[args[0]] = args[1] },
              "funclist": (args)=>{ return Object.keys(bcsh.functions).join(args[0]?args[0]:", ") },
              "f": (args)=>{ let code = bcsh.functions[args[0]]; for(let i in args) code = code.replaceAll(`@{#${i}}`, args[i]); return bcsh.exec(code); },
              "math": (args)=>{ return eval(args.join("")) },
              "exec": (args)=>{ return bcsh.exec(args[0]) },
              "execScript": (args)=>{ return bcsh.execScript(args[0]) },
              "str.replace": (args)=>{ return (args[3]?args[0].replace(args[1], args[2]):args[0].replaceAll(args[1], args[2])) },
              "str.replaceRegEx": (args)=>{ return args[0].replace(new RegExp(args[1]), args[2]) },
              "str.join": (args)=>{ return args.join("") },
              "str.split": (args)=>{ return args[0].toString().split(args[1]) },
              "str.match": (args)=>{ return args[0].match(new RegExp(args[1])) },
              "str.contains": (args)=>{ return args[0].includes(args[1]) },
              "str.equals": (args)=>{ return (args[0] == args[1]) },
              "str.escapeHtml": (args)=>{ return args[0].replaceAll("<", "&lt;").replaceAll(">", "&gt;") },
              "obj.get": (args)=>{ return JSON.parse(args[0])[args[1]] },
              "obj.set": (args)=>{ let o = JSON.parse(args[0]); o[args[1]] = args[2]; return o },
              "obj.create": (args)=>{ return "{}" },
              "obj.save": (args)=>{ eval(args[0])[args[1]] = JSON.parse(args[2]) },
              "obj.foreach": (args)=>{ let o = JSON.parse(args[0]); let r = ''; for(let i in o){ r += bcsh.exec(args[1].replaceAll("@{name}", i).replaceAll("@{value}", o[i])) }; return r },
              "arr.create": (args)=>{ return "[]" },
              "arr.join": (args)=>{ return JSON.parse(args[0]).join(args[1]) },
              "js.new": (args)=>{ return eval(`new ${args[0]}(${args[1]})`) },
              "js.eval": (args)=>{ return eval(args[0]) },
              "js.get": (args)=>{ return eval(args[0])[args[1]] },
              "js.set": (args)=>{ eval(args[0])[args[1]] = args[2] },
              "js.call": (args)=>{ return eval(args[0]+`['${args[1]}'](${args[2]})`) },
              "js.math": (args)=>{ return eval(`Math.${args[0]}(${args[1]})`) },
              "js.random": (args)=>{ return Math.floor(Math.random()*args[0]) },
              "html.get": (args)=>{ return document.querySelector(args[0])[args[1]] },
              "html.set": (args)=>{ document.querySelector(args[0])[args[1]] = args[2] },
              "html.getstyle": (args)=>{ return document.querySelector(args[0]).style[args[1]] },
              "html.setstyle": (args)=>{ document.querySelector(args[0]).style[args[1]] = args[2] },
              "html.event": (args)=>{ document.querySelector(args[0]).addEventListener(args[1], (e)=>{ bcsh.exec(args[2].replaceAll("@{e}", JSON.stringify(e))) }) },
              "html.add": (args)=>{ document.querySelector(args[0])[args[1]] += args[2] },
              "html.delete": (args)=>{ let el = document.querySelector(args[0]); el.parentNode.removeChild(el) },
              "file.write": (args)=>{ localStorage[args[0]] = args[1] },
              "file.read": (args)=>{ return localStorage[args[0]] },
              "window.msgbox": (args)=>{ alert(args[0]); },
              "sound.beep": (args)=>{ let ac = new AudioContext(); let osc = ac.createOscillator(); osc.frequency.value = args[0]; osc.connect(ac.destination); osc.start(0); osc.stop(args[1]); },
              "sound.speak": (args)=>{ let u = new SpeechSynthesisUtterance(); u.text = args[0]; window.speechSynthesis.speak(u); },
              "data.decode": (args)=>{ return decodeURIComponent(atob(args[0])); },
              "data.encode": (args)=>{ return btoa(encodeURIComponent(args[0])); }
          },
          help: {
              main: "<h2>Справка BCSH</h2><b><i>cmdlist</i></b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Список команд<br><b><i>help &lt;команда&gt;</i></b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Описание команды<br><b><i>help about_syntax</i></b>&nbsp;&nbsp;&nbsp;&nbsp;Синтаксис<br><b><i>help about_variables</i></b>&nbsp;Переменные<br><b><i>help about_scripts</i></b>&nbsp;&nbsp;&nbsp;Скрипты",

              about_syntax: "<h2>Синтаксис оболочки BCSH</h2><h3>Общий синтаксис</h3>Команды в BCSH состоят из, собственно, команды и параметров (аргументов), перечисленных через запятую:<br><b><i>команда параметр1, параметр2, ...</i></b><br>Если в тексте параметра содержатся пробелы и/или запятые, то его нужно заключать в одинарные или двойные кавычки:<br><b><i>команда 'параметр 1', \"параметр, 2\", ...</i></b><br><h3>Операторы</h3>В BCSH есть следующие операторы: ;, &, @{}, $ и \`.<br><br>Оператор ; используется для выполнения сразу нескольких команд: <br><b><i>команда1 &lt;параметры&gt; ;  команда2 &lt;параметры&gt; ;  команда3 &lt;параметры&gt; ; ...</i></b><br><br>Оператор & используется, чтобы передать команде результат выполнения другой команды:<br><b><i>команда1 '&команда2 &lt;параметры второй команды&gt;', ...</i></b><br><br>Оператор @{} используется для вставки значений переменных в текст параметра: <br><b><i>команда '@{someVar}', ...</i></b><br>Чтобы узнать подробнее о переменных, введите <b><i>help about_variables</i></b>.<br><br>Оператор $ используется для вставки спец.символа в строку. Допустимые символы: <br><b><i>$Q1</i></b> = '<br><b><i>$Q2</i></b> = \"<br><b><i>$Q3</i></b> = \`<br><b><i>$SP</i></b> = пробел<br><b><i>$CM</i></b> = ,<br><b><i>$AT</i></b> = @<br><b><i>$AM</i></b> = &<br><br>Оператор \` используется для блоков кода. Блоки кода нужны в командах, выполняющих другие команды (if, loop и пр.).<br><b><i>команда1 \`команда2 ; команда3\`, ...</i></b><br><br>Также BCSH игнорирует все лишние пробелы до и после команды: <br><b><i>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;команда &lt;параметры&gt;&nbsp;&nbsp;</i></b><br>",

              about_variables: "<h2>Переменные</h2>Переменные задаются с помощью команды set: <br><b><i>set &lt;имя переменной&gt;, &lt;значение переменной&gt;</i></b><br>Вставить значение переменной в параметр команды можно с помощью оператора @{}: <br><b><i>команда '@{<имя переменной>}', ...</i></b><br>",

              about_scripts: "<h1>Скрипты</h2>Скрипты BCSH - это текстовые файлы, содержащие набор команд: <br><b><i>&nbsp;&nbsp;&nbsp;команда1 &lt;параметры&gt;<br>&nbsp;&nbsp;&nbsp;команда2 &lt;параметры&gt;<br>&nbsp;&nbsp;&nbsp;команда3 &lt;параметры&gt;<br>&nbsp;&nbsp;&nbsp;...</i></b><br><br>Также в скриптах можно создавать многострочные блоки кода, используя пробел и точку с запятой после каждой строки:<br><b><i>&nbsp;&nbsp;&nbsp;...<br>&nbsp;&nbsp;&nbsp;команда \` ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;команда1 &lt;параметры&gt; ;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;команда2 &lt;параметры&gt; ;<br>&nbsp;&nbsp;&nbsp;\`<br>&nbsp;&nbsp;&nbsp;...</i></b><br>"
          },
          functions: {},
          version: "BCSH v4.3",
          ver: 4.3,
          exec: function(cmdto){
                cmdto = cmdto.toString();
                if(!cmdto || cmdto.toString().trim() == "") return "";

                if(cmdto.match(/[^\\]; /)){
                    cmdto = cmdto.split(/[^\\]; /);
                    let r = "";
                    for(let i in cmdto){
                        r += bcsh.exec(cmdto[i].trim());
                    }
                    return r;
                }
                cmdto = cmdto.replaceAll("\\;", ";");
                cmdto = cmdto.trim();

                let ret = null;
                let parsing = true;

                cmdto = cmdto.split("");
                let cmdt = cmdto, str = false, qt = null, estr = false;
                for(let i in cmdto){
                    let ch = cmdto[i];
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

                let pa = cmdt.split(" ");
                let cmda, cmdap, cmd;
                if(pa.length == 1){
                    cmd = pa[0];
                    pa = [];
                }else{
                    cmd = pa[0];
                    pa.shift();
                }

                if(!(cmd in this.commands)) return `Команда "${cmd}" не найдена.`;

                let found = false;

                    pa.forEach((e,i,o)=>{
                        if(o[i] && typeof o[i] == "object") o[i] = JSON.stringify(o[i]);

                        o[i] = o[i].toString().replaceAll("$SP", " ");
                        o[i] = o[i].toString().replaceAll("$CM", ",");
                        o[i] = o[i].toString().replaceAll("$Q1", "'");
                        o[i] = o[i].toString().replaceAll("$Q2", '"');
                        o[i] = o[i].toString().replaceAll("$Q3", "`");
                        
                        if(o[i].toString().match(/@{.+}/)){
                            try{ o[i] = eval("`"+o[i].toString().replaceAll("`", "\\`").replaceAll("@{", "${")+"`"); }catch(e){ ret = e; }
                        }

                        if(o[i].toString().match(/^&/)){
                            o[i] = bcsh.exec(o[i].toString().replace("&", ""));
                        }

                        o[i] = o[i].toString().replaceAll("$AT", "@");
                        o[i] = o[i].toString().replaceAll("$AM", "&");

                        if(!isNaN(o[i].toString()) && o[i].toString().length > 0) o[i] = +o[i];
                    });

                for(let i in this.commands){
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
              code = code.replaceAll(";\n", "\\; ");
              code = code.split("\n");
              for(let i in code){
                  if(code[i].startsWith("#") || code[i] == "") continue;
                  bcsh.exec(code[i]);
              }
          }
}
