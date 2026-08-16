
var fs = require('fs'),
    path = require('path');
function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

var plugin_folders;
var plugin_directory;
var exec_dir;
const DANGEROUS_PLUGIN_FOLDERS = new Set();

function isPluginEnabled(folder) {
    return !DANGEROUS_PLUGIN_FOLDERS.has(folder) ||
        process.env.DISCORD_BOT_ENABLE_DANGEROUS_PLUGINS === "true";
}
try { //try loading plugins from a non standalone install first
    plugin_directory = "./plugins/";
    plugin_folders = getDirectories(plugin_directory);
} catch(e){//load paths for an Electrify install
    exec_dir = path.dirname(process.execPath) + "/resources/default_app/"; //need this to change node prefix for npm installs
    plugin_directory = path.dirname(process.execPath) + "/resources/default_app/plugins/";
    plugin_folders = getDirectories(plugin_directory);
}

exports.init = function(hooks){
    preload_plugins(hooks);
};

function preload_plugins(hooks){
    // Dependencies must be installed during build/deploy, never at runtime.
    load_plugins(hooks);
}

function load_plugins(hooks){
    var dbot = require("./discord_bot.js");
    hooks.bot = dbot.bot;
    var commandCount = 0;
    for (var i = 0; i < plugin_folders.length; i++) {
        if (!isPluginEnabled(plugin_folders[i])) {
            continue;
        }
        var plugin;
        try{
            plugin = require(plugin_directory + plugin_folders[i])
        } catch (err){
            console.log("Improper setup of the '" + plugin_folders[i] +"' plugin. : " + err);
        }
        if (plugin){
            if(plugin.init){
                plugin.init(hooks)
            }
            if("commands" in plugin){
                for (var j = 0; j < plugin.commands.length; j++) {
                    if (plugin.commands[j] in plugin){
                        dbot.addCommand(plugin.commands[j], plugin[plugin.commands[j]])
                        commandCount++;
                    }
                }
            }
        }
    }
    console.log("Loaded " + dbot.commandCount() + " chat commands")
}
