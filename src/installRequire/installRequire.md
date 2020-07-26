# Install Require
## Non-Mirth Connect/Rhino JS Libraries without any known issues
* Lodash
* JSON Logic
* Momentjs
* Momentjs Timezone with data 1970-2030

## Non-Mirth Connect/Rhino JS Libraries with known issues
* Any library that uses console, fetch, xhr, setTimeout, setInterval, ...

## Setup
* Create a new Code Template named "installRequire_0_1_0" and make sure Context > Channel Scripts > Deploy Script is checked
* Copy src/installRequire/index.js into "Code:" field

## Configure - Set Config Variables
* installRequireDebug
    * Description: Causes installRequire to log (logger.info) debug messages
    * Type: JSON Boolean - (true/false)
    * Default: ``false``
* jsLibPaths
    * Description: JSON Array of paths that Require should load.
    * Note: The first element of the array is where jsLibs libraries will be downloaded to and stored.
    * Type: JSON Array
    * Default: ``["/opt/mirthconnect/appdata/jslibs"]``
* jsLibs
    * Description: JSON Array of JS libraries that will be downloaded if not found. Each element is a map of {name, url}. The name will be used as part of the file path to enable a specific version of a library to be loaded.
    * Default: ``[]``
    * Example: 
      ```javascript
      [
        {"name": "lodash", "url": "https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js"},
        {"name": "lodash_1.0.0", "url": "https://cdn.jsdelivr.net/npm/lodash@1.0.0/dist/lodash.min.js"}
      ]
      ```
## Example Usage
* Configuration Map
    ```text
    installRequireDebug: false
    jsLibPaths: ["/opt/mirthconnect/appdata/jslibs"]
    jsLibs: [
            {"name": "lodash", "url": "https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js"},
            {"name": "lodash_1.0.0", "url": "https://cdn.jsdelivr.net/npm/lodash@1.0.0/dist/lodash.min.js"}
          ]
    ```
* Create a new test channel 
* Summary > Set Data Types
    ```text
                            Inbound     Outbound
    Source Connector        Raw         JSON
    Destination 1           JSON        JSON
    ```
* Set Dependencies > check: installRequire_0_1_0
* Deploy Script
    ```javascript
    $gc('lodash', require('lodash/lodash.min'))
    $gc('lodash_1.0.0', require('lodash_1.0.0/lodash.min'))
    ```
* Source Transformer
    ```javascript
    msg = {}
    
    var _ = $gc('lodash')
    var oldLodash = $gc('lodash_1.0.0')
    
    try {
        var array = [1, 2, 3]
        _.fill(array, 'a')
        msg.array = array
        msg.random = oldLodash.random(0, 5)
    } catch (e) {
        msg.error = e.message
        msg.stack = e.stack
    }
    ```
* Deploy the channel and send it an empty message
