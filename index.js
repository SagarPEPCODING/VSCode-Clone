const $ = jQuery = require('jquery');
require('jstree');
require('jquery-ui-dist/jquery-ui')
const nodePath = require('path');
const fs = require('fs');
var os = require('os');
var pty = require('node-pty');
var Terminal = require('xterm').Terminal;
let files = [];
let dataObj = {};
let tabsinfo = new Map();

$(document).ready(async function () {


    // Initialize node-pty with an appropriate shell
    const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
    });

    // Initialize xterm.js and attach it to the DOM
    const xterm = new Terminal();
    xterm.open(document.getElementById('terminal'));

    // Setup communication between xterm.js and node-pty
    xterm.onData(data => ptyProcess.write(data));
    ptyProcess.on('data', function (data) {
        xterm.write(data);
    });

    let editor = await createEditor();
    // console.log(editor);

    let currPath = process.cwd();
    // console.log(currPath);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    //tabs work


    let tabs = $( "#tabs" ).tabs();




    tabs.on("click",".ui-state-active",function(event){
        window.eve = event;
        let filename = event.currentTarget.innerText.split("R")[0]; 
        filename=filename.slice(0,filename.length-1);
        // console.log(filename.length);
        if(tabsinfo.has(filename)){
            let p = tabsinfo.get(filename);
            updateEditor(p);
        }
        
    })


    tabs.on("click",".ui-icon-close",function(event){
        window.eve = event;
        let filename = eve.currentTarget.parentElement.innerText.split("R")[0]; 
        filename=filename.slice(0,filename.length-1);
        
        
            

            let index = files.indexOf(filename);
            files.splice(index,1);
            console.log(files);


            
            let p = tabsinfo.delete(filename);
            // console.log(p);


            delete dataObj[filename];
            // console.log(dataObj);


            var panelId =  parseInt($( this ).closest( "li" ).remove().attr( "aria-controls" ));
            // console.log();
            $( "#" + panelId ).remove();
            tabs.tabs("refresh");

        
            let  lastfilename = files[files.length-1];   
            let lastfilepath = tabsinfo.get(lastfilename);
            updateEditor(lastfilepath); 

            event.stopPropagation();
        
    })
    


    let data = [];
    let baseobj = {
        id: currPath,
        parent: '#',
        text: getNameFrompath(currPath)
    }

    let rootChildren = getCurrentDirectories(currPath);
    data = data.concat(rootChildren);

    data.push(baseobj);

    document.getElementById("saveImg").addEventListener("click", async function () {

        let fileToSave = document.getElementById("heading").innerText.split(" ")[0];
  
        if (fileToSave == "Visual")
        {
          return;
        }
  
        let data = await fs.promises.writeFile(dataObj[fileToSave], editor.getValue());
      
        // console.log(data);  
      });

    $('#jstree').jstree({
        "core": {
            // so that create works
            "check_callback": true,
            "data": data
        }
    }).on('open_node.jstree', function (e, data) {
        // console.log(data.node.children);

        data.node.children.forEach(function (child) {

            let childDirectories = getCurrentDirectories(child);
            // console.log('child directories are ');
            // console.log(childDirectories);

            for (let i = 0; i < childDirectories.length; i++) {
                let grandChild = childDirectories[i];
                $('#jstree').jstree().create_node(child, grandChild, "last");
            }

        })
    }).on("select_node.jstree", function (e, data) {
        console.log(data.node.id);
        console.log(data.node.text.length);

        tabsinfo.set(data.node.text,data.node.id);

        openFile(data.node.id);

        updateEditor(data.node.id);

    });

    function updateEditor(path){

        if (fs.lstatSync(path).isDirectory()) {
            return;
        }
      //  console.log(files);
       let fileName = getNameFrompath(path);
        
        if (!files.includes(fileName))
        {
            return; 
            //if limit of opening files is over then this will stop other files
            //to update in editor that are not open in editor due to limit
        }

        document.getElementById("heading").innerText = fileName + " - " + "Visual Studio Code";

        let fileExtension = fileName.split('.')[1]; 

        if (fileExtension === 'js')
            fileExtension = 'javascript';
        
      let data = fs.readFileSync(path).toString();
  
      editor.setValue(data);
      // console.log(editor.getValue());
        monaco.editor.setModelLanguage(editor.getModel(), fileExtension);
    }

     function openFile(path) {

        let fileName =  getNameFrompath(path); 
        
          if ( dataObj[`${fileName}`] != undefined || files.length==8)
          {
              return;
          }
          
          dataObj[`${fileName}`] = path;
          files.push(fileName);
          console.log(files);
          let label = fileName;
          let id = fileName;  //passing here name of the file bcoz if we pass path due to ( . or /  or something else) it will give error
          let tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span></li>";
          let li = $(tabTemplate.replace(/#\{href\}/g, "#" + id).replace(/#\{label\}/g, label));
          tabs.find( ".ui-tabs-nav" ).append( li );
          tabs.append("<div id='" + id + "'></div>");
          tabs.tabs("refresh");
        
      }


})





function getNameFrompath(path) {
    return nodePath.basename(path);
}

function getCurrentDirectories(path) {

    if (fs.lstatSync(path).isFile()) {
        return [];
    }

    let files = fs.readdirSync(path);
    // console.log(files);

    let rv = [];
    for (let i = 0; i < files.length; i++) {
        let file = files[i];

        rv.push({
            id: nodePath.join(path, file),
            parent: path,
            text: file
        })
    }

    return rv;
}

function createEditor() {

    return new Promise(function (resolve, reject) {
        let monacoLoader = require('./node_modules/monaco-editor/min/vs/loader.js');
        // console.log(monacoLoader);
        monacoLoader.require.config({ paths: { 'vs': './node_modules/monaco-editor/min/vs' } });

        monacoLoader.require(['vs/editor/editor.main'], function () {
            var editor = monaco.editor.create(document.getElementById('editor'), {
                value: [
                    'function x() {',
                    '\tconsole.log("Hello world!");',
                    '}'
                ].join('\n'),
                language: 'javascript'
            });

            resolve(editor);
        });
    })

}