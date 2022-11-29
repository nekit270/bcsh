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
var xhrObject = "WinHttp.WinHttpRequest.5.1";
if(env.Item("BCSH_MODULES_DIR")){
    modulesDir = env.Item("BCSH_MODULES_DIR");
}else if(fso.FolderExists(bcshDir+"\\modules")){
    modulesDir = bcshDir+"\\modules";
}else if(fso.FolderExists("modules")){
    modulesDir = "modules";
}
var cmdData = [];
var currentLine = 1;
var errorData = [];
var errorAction = "default";
var fatalErrorAction = "stop";

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
                        function loadm(){
                            var file = fso.OpenTextFile(path, 1);
                            code = file.ReadAll();
                            file.Close();
                            var obj = JSON.parse(code);
                            for(var i in obj){
                                bcsh.commands[i] = obj[i];
                            }
                        }
                        if(fso.FileExists(path)){
                            loadm();
                        }else if(args[1]){
                            var xhr = WScript.CreateObject(xhrObject);
                            xhr.Open("GET", "https://nekit270.github.io/bcsh/windows/modules/"+args[0]+".bcshm?rand"+new Date().getTime(), false);
                            xhr.Send(null);
                            var file = fso.OpenTextFile(path, 2, true);
                            file.Write(xhr.responseText);
                            file.Close();
                            loadm();
                        }
                    },
                    "ver": function(args){ return bcsh.version },
                    "echo": function(args){ return args[0] },
                    "clear": function(args){ WScript.StdOut.WriteBlankLines(9999) },
                    "exit": function(args){ WScript.Quit(args[0]) },
                    "set": function(args){ bcsh.variables[args[0]] = args[1] },
                    "sete": function(args){ bcsh.variables[args[0]] = bcsh.exec(args[1]) },
                    "setg": function(args){ eval(args[0]+' = '+(typeof args[1] == 'string'?'"':'')+args[1].replaceAll("\'", "\\'").replaceAll("\"", '\\"')+(typeof args[1] == 'string'?'"':'')) },
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
                    "error": function(args){
                        bcsh.error({text: args[0], fatal: args[1]});
                    },
                    "requestAdmin": function(args){
                        var hasAdmin = false;
                        try{
                            shell.RegWrite("HKLM\\SOFTWARE\\AdminTest", "");
                            hasAdmin = true;
                        }catch(e){}
                        if(hasAdmin){
                            shell.RegDelete("HKLM\\SOFTWARE\\AdminTest");
                        }else{
                            var shellApp = WScript.CreateObject("Shell.Application");
                            var argsStr = "//nologo "+WScript.ScriptFullName+" ";
                            for(var i = 0; i < WScript.Arguments.Unnamed.length; i++) argsStr += '"'+WScript.Arguments.Unnamed(i)+'" ';
                            shellApp.ShellExecute("cscript.exe", argsStr, "", "runas", 1);
                            WScript.Quit();
                        }
                    },
                    "httpRequest": function(args){
                        var xhr = WScript.CreateObject(xhrObject);
                        xhr.Open(args[0].toUpperCase(), args[1], false);
                        xhr.setRequestHeader("Cache-Control", "max-age=0, no-cache, no-store, must-revalidate");
                        xhr.setRequestHeader("Pragma", "no-cache");
                        xhr.setRequestHeader("Expires", "Fri, 20 Mar 2014 00:00:00 GMT");
                        xhr.Send(args[2]);
                        if(xhr.status == 200) return xhr.responseText;
                        else return "Error: "+xhr.status+" "+xhr.statusText;
                    },
                    "writeln": function(args){ WScript.StdOut.WriteLine(args[0]) },
                    "write": function(args){ WScript.StdOut.Write(args[0]) },
                    "readln": function(args){
                        WScript.StdOut.Write(args[0]);
                        return ""+WScript.StdIn.ReadLine();
                    },
                    "date": function(args){
                        var str = args[0], asArray = args[1], out = [];
                        var date = new Date();
                        var delim = /[^a-zA-Z]/.exec(str)[0];
                        var arr = str.split(delim);
                        for(var i in arr){
                            var e = arr[i];
                            var l = e.length;
                            switch(e.charAt(0)){
                                case 'D': {
                                    out.push(date.getDate().toString().slice(0, l));
                                    break;
                                }
                                case 'M': {
                                    out.push((date.getMonth()+1).toString().slice(0, l));
                                    break;
                                }
                                case 'Y': {
                                    out.push(date.getFullYear().toString().slice(0, l));
                                    break;
                                }
                            }
                        }
                        return (asArray?out:out.join(delim));
                    },
                    "time": function(args){
                        var str = args[0], asArray = args[1], out = [];
                        var date = new Date();
                        var delim = /[^a-zA-Z]/.exec(str)[0];
                        var arr = str.split(delim);
                        for(var i in arr){
                            var e = arr[i];
                            var l = e.length;
                            switch(e.charAt(0)){
                                case 'h': {
                                    out.push(date.getHours().toString().slice(0, l));
                                    break;
                                }
                                case 'm': {
                                    out.push((date.getMinutes()+1).toString().slice(0, l));
                                    break;
                                }
                                case 's': {
                                    out.push(date.getSeconds().toString().slice(0, l));
                                    break;
                                }
                            }
                        }
                        return (asArray?out:out.join(delim));
                    },
                    "reg.write": function(args){
                        var r = 0;
                        try{
                            shell.RegWrite(args[0], args[1], args[2]);
                            r = 1;
                        }catch(e){}
                    },
                    "reg.delete": function(args){
                        var r = 0;
                        try{
                            shell.RegDelete(args[0]);
                            r = 1;
                        }catch(e){}
                    },
                    "reg.read": function(args){
                        var r = "";
                        try{
                            r = shell.RegRead(args[0]);
                        }catch(e){}
                        return r;
                    },
                    "com.create": function(args){
                        bcsh.comObjects.push(WScript.CreateObject(args[0]));
                        return bcsh.comObjects.length-1;
                    },
                    "com.get": function(args){
                        var obj = bcsh.comObjects[args[0]];
                        return obj[args[1]];
                    },
                    "com.set": function(args){
                        var obj = bcsh.comObjects[args[0]];
                        obj[args[1]] = args[2];
                    },
                    "com.call": function(args){
                        var arr = [];
                        for(var i in args.slice(2)){
                            var e = args.slice(2)[i];
                            arr.push((typeof e=="string"?'"':"")+e+(typeof e=="string"?'"':""));
                        }
                        return eval("bcsh.comObjects["+args[0]+"]."+args[1]+"("+arr.join(", ")+")");
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
                    "obj.load": function(args){ return JSON.stringify(eval(args[0])) },
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
                    "js.call": function(args){
                        var arr = [];
                        for(var i in args.slice(2)){
                            var e = args.slice(2)[i];
                            arr.push((typeof e=="string"?'"':"")+e+(typeof e=="string"?'"':""));
                        }
                        return eval(args[0]+"['"+args[1]+"']("+arr.join(",")+")")
                    },
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
                    "file.copy": function(args){ return fso.CopyFile(args[0], args[1], args[2]) },
                    "file.move": function(args){ return fso.MoveFile(args[0],args[1], args[2]) },
                    "file.delete": function(args){ return fso.DeleteFile(args[0], true) },
                    "file.exists": function(args){ return fso.FileExists(args[0]) },
                    "folder.create": function(args){ return fso.CreateFolder(args[0]) },
                    "folder.copy": function(args){ return fso.CopyFolder(args[0], args[1], args[2]) },
                    "folder.move": function(args){ return fso.MoveFolder(args[0], args[1], args[2]) },
                    "folder.delete": function(args){ return fso.DeleteFolder(args[0], true) },
                    "folder.exists": function(args){ return fso.FolderExists(args[0]) },
                    "folder.list": function(args){
                        var listFiles = args[1], listFolders = args[2];
                        var folder = fso.GetFolder(args[0]);
                        var out = [];
                        if(listFolders){
                            for(var item = new Enumerator(folder.SubFolders); !item.atEnd(); item.moveNext()){
                                out.push(item.item().Name);
                            }
                        }
                        if(listFiles){
                            for(var item = new Enumerator(folder.Files); !item.atEnd(); item.moveNext()){
                                out.push(item.item().Name);
                            }
                        }
                        return (args[3]?out.join(", "):out);
                    }
            },
            help: {
                main: "������� BCSH\r\ncmdlist              ������ ������ \r\nhelp <�������>       �������� ������� \r\nhelp about_syntax    ��������� \r\nhelp about_variables ���������� \r\nhelp about_scripts   �������",

                about_syntax: "��������� �������� BCSH\r\n����� ���������\r\n������� � BCSH ������� ��, ����������, ������� � ���������� (����������), ������������� ����� �������: \r\n������� ��������1, ��������2, ... \r\n���� � ������ ��������� ���������� ������� �/��� �������, �� ��� ����� ��������� � ��������� ��� ������� �������: \r\n������� '�������� 1', \"��������, 2\", ... \r\n���������\r\n� BCSH ���� ��������� ���������: ;, &, @{}, $ � \`. \r\n \r\n�������� ; ������������ ��� ���������� ����� ���������� ������:  \r\n�������1 <���������> ;  �������2 <���������> ;  �������3 <���������> ; ... \r\n \r\n�������� & ������������, ����� �������� ������� ��������� ���������� ������ �������: \r\n�������1 '&�������2 <��������� ������ �������>', ... \r\n \r\n�������� @{} ������������ ��� ������� �������������� ��������� � �������� ���������� � ����� ���������:  \r\n������� '@{someVar}', ... \r\n������� '@{2+3}', ... \r\n������� '@{var1 + 5 * (var2 - 9)}', ... \r\n����� ������ ��������� � ����������, ������� help about_variables. \r\n \r\n�������� $ ������������ ��� ������� ����.������� � ������. ���������� �������:  \r\n$Q1 = ' \r\n$Q2 = \" \r\n$Q3 = \` \r\n$SP = ������ \r\n$CM = , \r\n$AT = @ \r\n$AM = & \r\n \r\n�������� \` ������������ ��� ������ ����. ����� ���� ����� � ��������, ����������� ������ ������� (if, loop � ��.). \r\n�������1 \`�������2 ; �������3\`, ... \r\n \r\n����� BCSH ���������� ��� ������ ������� �� � ����� �������:  \r\n     ������� <���������>   \r\n",

                about_variables: "����������\r\n���������� �������� � ������� ������� set:  \r\nset <��� ����������>, <�������� ����������> \r\n�������� �������� ���������� � �������� ������� ����� � ������� ��������� @{}:  \r\n������� '@{<��� ����������>}', ... \r\n",

                about_scripts: "�������\r\n������� BCSH - ��� ��������� �����, ���������� ����� ������:  \r\n   �������1 <���������> \r\n   �������2 <���������> \r\n   �������3 <���������> \r\n   ... \r\n \r\n����� � �������� ����� ��������� ������������� ����� ����, ��������� ������ � ����� � ������� ����� ������ ������: \r\n   ... \r\n   ������� \` ; \r\n      �������1 <���������> ; \r\n      �������2 <���������> ; \r\n   \` \r\n   ... \r\n",
                
                cmdlist: "cmdlist\r\n���������� ������ ���� ��������� ������."
            },
            functions: {},
            variables: {},
            comObjects: [],
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

                    if(!(cmd in this.commands)){
                        bcsh.error({text: '������� "'+cmd+'" �� �������.', fatal: true});
                    }

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
                                        if(bcsh.variables[c] !== undefined) c = "bcsh.variables."+c;
                                        else{
                                            var o = c.split(" ");
                                            for(var i in o){
                                                var e = o[i];
                                                if(bcsh.variables[e] !== undefined) o[i] = "bcsh.variables."+e;
                                            }
                                            c = o.join(" ");
                                        }
                                        return eval(c);
                                    });
                                }catch(e){
                                    bcsh.error({text: e.message});
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
                                bcsh.error({text: e.message});
                                ret = e.message;
                            }
                            break;
                        }
                    }
                    if(ret && typeof ret == "object") ret = JSON.stringify(ret);
                    return ((ret || ret === 0)?ret:"");
            },
            error: function(obj){
                obj.fatal = !!obj.fatal;
                errorData = obj;
                var msg = "["+cmdData[1]+":"+currentLine+"] >> "+obj.text;

                switch(obj.fatal?fatalErrorAction:errorAction){
                    case 'default': {
                        WScript.StdErr.WriteLine(msg);
                        break;
                    }
                    case 'ignore': {
                        break;
                    }
                    case 'stop': {
                        WScript.StdErr.WriteLine(msg);
                        WScript.Quit(1);
                    }
                }
            },
            execScript: function(code){
                code = code.replaceAll("\r", "");
                code = code.replaceAll(";\n", "\\; ");
                code = code.split("\n");
                for(var i in code){
                    if(code[i].charAt(0) == "#" || code[i] == "") continue;
                    bcsh.exec(code[i]);
                    currentLine++;
                }
            }
}

var args = WScript.Arguments.Unnamed;

try{
    var _ = args(0);
}catch(e){
    WScript.StdOut.Write(
        "bcsh [-v] [-h] [-s] [-f <������>] [-c <�������>]\r\n\
                -v              ������� ������ BCSH\r\n\
                -h              ������� ���������� ���������\r\n\
                -s              ������� ������������� ��������\r\n\
                -f <������>     ��������� ������\r\n\
                -� <�������>    ��������� �������");
    WScript.Quit();
}

cmdData.push(args(0));
cmdData.push(args.length>1?args(1):"");

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
            cmdData[1] = cmd;
            WScript.StdOut.WriteLine(bcsh.exec(cmd));
        }
    }
    case "-h": {
        WScript.StdOut.Write(
        "bcsh [-v] [-h] [-s] [-f <������>] [-c <�������>]\r\n\
                -v              ������� ������ BCSH\r\n\
                -h              ������� ���������� ���������\r\n\
                -s              ������� ������������� ��������\r\n\
                -f <������>     ��������� ������\r\n\
                -� <�������>    ��������� �������");
        break;
    }
    case "-v": {
        WScript.StdOut.Write(bcsh.version);
        break;
    }
    default: {
        WScript.StdOut.Write("������������ ���������. ������� \"bcsh -h\" ��� �������.");
    }
}