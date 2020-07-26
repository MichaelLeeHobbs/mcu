// Name: Install Require
// Description: Enables the usage of Javascript libraries in Mirth Connect
// Version: 0.1.0
// History: 20200726T1224 - Initial Preview Release 0.1.0

(function installRequire() {
    var debug = $cfg('installRequireDebug') != null ? JSON.parse($cfg('installRequireDebug')) : false
    function fetchLibrary(url, path, headers) {
        with (JavaImporter(
            org.apache.http.impl.client.HttpClientBuilder,
            org.apache.http.client.methods.HttpGet,
            org.apache.http.client.methods.HttpPut,
            org.apache.http.client.methods.HttpPost,
            org.apache.http.client.methods.HttpDelete,
            org.apache.http.client.methods.HttpOptions,
            org.apache.http.client.methods.HttpPatch,
            org.apache.http.client.methods.HttpTrace,
            org.apache.http.util.EntityUtils,
            org.apache.http.entity.StringEntity
        )) {
            if (fileExist(path)) return
            logger.info(path + ' not found. Downloading JS Lib from ' + url)
            headers = headers || []
            var client = HttpClientBuilder.create().build()
            var httpConfig = new HttpGet(url)
            headers.forEach(header => httpConfig.addHeader(header[0], header[1]))

            var response = client.execute(httpConfig)
            var statusCode = response.getStatusLine().getStatusCode()
            var entity = response.getEntity()
            var file = EntityUtils.toString(entity, "UTF-8")
            FileUtil.write(path, false, file)
        }
    }
    function fileExist(path) {
        with (JavaImporter(java.io.File)) {
            return Boolean((new File(path)).exists())
        }
    }
    var modulePaths =  $cfg('jsLibPaths') != null ? JSON.parse($cfg('jsLibPaths')) : ['/opt/mirthconnect/appdata/jslibs']

    var requiredLibraries = $cfg('jsLibs') != null ? JSON.parse($cfg('jsLibs')) : []
    var libPath = modulePaths[0]
    requiredLibraries.forEach(jsLib=>{
        var path = (libPath.endsWith('/') ? libPath : libPath + '/') + jsLib.name + '/' + jsLib.url.split('/').pop()
        fetchLibrary(jsLib.url, path)
    })

    var shouldReload = String($g('_globalRequireCachePaths')) !== JSON.stringify(modulePaths)

    if (debug) {
        logger.info('shouldReload = ' + shouldReload)
        logger.info("$g('_globalRequireCachePaths') = " + $g('_globalRequireCachePaths'))
        logger.info('modulePaths = ' + JSON.stringify(modulePaths))
        logger.info('$jsLibPaths = ' + JSON.stringify($cfg('jsLibPaths')))
    }

    if (!shouldReload) {
        if (debug) logger.info('shouldReload = ' + shouldReload)
        if (typeof require == "undefined") {
            require = $g('_globalRequire')
            if (typeof require != "undefined") return require
        }
        return require
    }
    $g('_globalRequireCachePaths', JSON.stringify(modulePaths))
    with (JavaImporter(
        org.mozilla.javascript.Context,
        org.mozilla.javascript.tools.shell.Global,
        org.mozilla.javascript.commonjs.module.Require,
        org.mozilla.javascript.commonjs.module.RequireBuilder,
        org.mozilla.javascript.commonjs.module.provider.SoftCachingModuleScriptProvider,
        org.mozilla.javascript.commonjs.module.provider.UrlModuleSourceProvider,
        java.net.URI,
        java.io.File
    )) {
        var context = Context.getCurrentContext()
        var rb = new RequireBuilder()
        var sandboxed = true
        rb.setSandboxed(sandboxed);
        var uris = []
        modulePaths.forEach(path => {
            var uri = new URI(path)
            uri = uri.isAbsolute() ? uri : new File(path).toURI().resolve("")
            // make sure URI always terminates with slash to
            // avoid loading from unintended locations
            uris.push(uri.toString().endsWith("/") ? uri : new URI(uri + "/"))
        })

        rb.setModuleScriptProvider(new SoftCachingModuleScriptProvider(new UrlModuleSourceProvider(uris, null)))
        require = rb.createRequire(context, this)
        $g('_globalRequire', require)
        //require.install(this);
        //this.require = require
        return require

        //var global = new Global(context)
        //global.installRequire(context, [libsPath], true)
        //var global = this.get("global", this)
        //var global = context.getGlobal()

    }
})()
