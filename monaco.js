(function(){

    var LOADED_STATUS = false;

    var LOADING_CDN = {
        URL : "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/loader.min.js",
        WORKER : function(moduleId, label) { 
            return "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs/editor/editor.worker.js";
        },
        BASE_VS : "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs"
    };

    var currentScriptSrc = document.currentScript ? document.currentScript.src : location.href;
    var currentScriptDirectory = currentScriptSrc;
    currentScriptDirectoryIndex = currentScriptDirectory.lastIndexOf("/");
    if (currentScriptDirectoryIndex != -1)
        currentScriptDirectory = currentScriptDirectory.substr(0, currentScriptDirectoryIndex);

    var LOADIND_LOCAL = {
        URL : "./monaco/min/vs/loader.js",
        WORKER : function(moduleId, label) {
            return currentScriptDirectory + "/monaco/min/vs/base/worker/workerMain.js";
            // this code does not work

            const localWorkerPaths = {
                'json': '/monaco/min/vs/language/json/jsonWorker.js',
                'css': '/monaco/min/vs/language/css/cssWorker.js',
                'html': '/monaco/min/vs/language/html/htmlWorker.js',
                'typescript': '/monaco/min/vs/language/typescript/tsWorker.js',
                'javascript': '/monaco/min/vs/language/typescript/tsWorker.js',
                'base' : '/monaco/min/vs/base/worker/workerMain.js'
            };
            let localModulePath = localWorkerPaths[label] || localWorkerPaths['base'];
            let localWorkerPath = currentScriptDirectory + localModulePath;
            return localWorkerPath;
            let localWorkerCodeSrc = "self.MonacoEnvironment = {baseUrl: '/'};importScripts('" + localWorkerPath + "');";
            return "data:text/javascript;charset=utf-8," + encodeURIComponent(localWorkerCodeSrc);
        },
        BASE_VS : currentScriptDirectory + "/monaco/min/vs"
    };

    var LOADING = LOADIND_LOCAL;

    var REGISTERED_EDITORS = [];

    function MonacoEditor()
    {
        this.parent = "";
        this.theme = "";
        this.value = "";
        this.options = {};

        this.editor = null;
        this.libraries = [];
    }

    MonacoEditor.prototype.create = function(parent, theme, value, options) {
        this.parent = parent;
        this.theme = theme || "vs-light";
        this.value = value || "";
        this.options = options || {};

        if (!LOADED_STATUS) {
            REGISTERED_EDITORS.push(this);
            return;
        }

        this._create();
    };

    MonacoEditor.prototype._create = function() {
        let options = {
            value: this.value,
            language: "javascript",
            theme: this.theme ? this.theme : "vs-light",
            automaticLayout: true
        };
        for (let i in this.options)
            options[i] = this.options[i];

        this.editor = monaco.editor.create(document.getElementById(this.parent), options);
        this._loadLibraries();
    };

    MonacoEditor.prototype.setTheme = function(theme) {
        this.theme = theme;

        if (this.editor) {
            monaco.editor.setTheme(this.theme);
        }
    };

    MonacoEditor.prototype.setValue = function(value) {
        this.value = value;

        if (this.editor) {
            this.editor.setValue(this.value);
        }
    };

    MonacoEditor.prototype.getValue = function(value) {
        return this.editor ? this.editor.getValue() : "";
    };

    MonacoEditor.prototype.addLibrary = function(lib) {
        this.libraries.push(lib);
        if (!this.editor)
            return;
        
        this._loadLibraries();
    };

    MonacoEditor.prototype._loadLibraries = function() {
        let libraries = [];
        for (let i = 0, len = this.libraries.length; i < len; i++) {
            try {
                var xhrObj = new XMLHttpRequest();
                if ( xhrObj )
                {
                    xhrObj.open("GET", this.libraries[i].url, false);
                    xhrObj.send("");

                    libraries.push({
                        name : this.libraries[i].name,
                        code : xhrObj.responseText
                    })
                }
            }
            catch (e) {}
        }

        for (let i = 0, len = libraries.length; i < len; i++) {
            monaco.languages.typescript.javascriptDefaults.addExtraLib(libraries[i].code, libraries[i].name);
        }
    };
    
    MonacoEditor.prototype.dispose = function() {
        for (let i = 0; i < REGISTERED_EDITORS.length; i++) {
            if (this === REGISTERED_EDITORS[i])
                REGISTERED_EDITORS.splice(i, 1);
        }

        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }            
    };

    window.MonacoEnvironment = {
        getWorkerUrl: function (moduleId, label) {
            return LOADING.WORKER(moduleId, label);
        }
    };

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = LOADING.URL;
    script.onload = function(){
        require.config({
            paths: {
                "vs": LOADING.BASE_VS
            }
        });
        
        require(["vs/editor/editor.main"], function () {
            LOADED_STATUS = true;

            for (let i = 0; i < REGISTERED_EDITORS.length; i++) {
                REGISTERED_EDITORS[i]._create();
            }

            REGISTERED_EDITORS = [];
        });
    };
    script.onerror = function(){
        console.log("Error loading monaco editor!");
    };
    document.head.appendChild(script);

    window.MonacoEditor = MonacoEditor;

})();
