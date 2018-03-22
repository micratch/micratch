
(function (ext) {

    var mcSocket = null;
    var MCPI = {}; //Object.create(null);
    var hostname = "localhost";

    function mc_init(host) {
        hostname = host;
        if(mcSocket == null) {
            mcSocket = new WebSocket("ws://"+host+":14711");
            mcSocket.onopen    = onOpen;
            mcSocket.onmessage = onMessage;
            mcSocket.onclose   = onClose;
            mcSocket.onerror   = onError;
            mcSocket.IsConnect = false;
        }
    }

    function onOpen(event) {
      //console.log("onOpen");
        mcSocket.IsConnect = true;
        getPlayerPos();
    }

    function onMessage(event) {
        if (event && event.data) {
            console.log("onMessage: " + event.data);
        }
    }

    function onError(event) {
        //if(event && event.data) {
        //    console.log("onError: " + event.data);
        //} else {
        //    console.log("onError");
        //}
        mcSocket = null;
    }

    function onClose(event) {
        mcSocket = null;
    }

    function mcSend(text) {
        if(mcSocket!=null) {
            mcSocket.send(text);
        }
    }

    function mcSendWCB(text, func) {
        if(mcSocket!=null) {
            mcSocket.onmessage = function(event) {
                if( typeof func != "undefined" && func!=null ) {
                    func(text);
                }
                mcSocket.onmessage = onMessage;
            };
            mcSocket.send(text);
        }
    }

    //
    // Minecraft Control function
    //
    function connect() {
        target = "localhost";
        if(mcSocket!=null) {
            mcSocket.close();
            mcSocket = null;
        }
        mc_init(target);
    }

    function connect_url() {
        if(mcSocket!=null && mcSocket.IsConnect) {
            return mcSocket.url;
        }
        return "no connection";
    }

    function postToChat(msg) {
        mcSend("chat.post(" + msg + ")");
    }

    function getBlock(x,y,z,callback) {
        var opt = [x,y,z].join();
        var msg = "world.getBlock(" + opt + ")";
        function getb_cb(txt) {
            //console.log("getBlock : " + txt);
            if( typeof callback != "undefined" && callback!=null) {
                callback( Number(event.data.trim()) );
            }
        }
        mcSendWCB(msg, getb_cb);
    }

    function setBlock(block,x,y,z) {
        var opt = [x,y,z,block[0],block[1]].join();
        mcSend("world.setBlock(" + opt + ")");
    }

    function setBlocks(block,x1,y1,z1,x2,y2,z2){
        var opt = [ x1, y1, z1, x2, y2, z2, block[0], block[1] ].join();
        mcSend( "world.setBlocks(" + opt + ")" );
    }

    function setPlayer(x,y,z) {
        var opt = [x,y,z].join();
        mcSend("player.setPos(" + opt + ")");
    }

    function getPlayerPos(callback) {
        // PlayerPos
        mcSocket.onmessage = function (event) {
            if(event && event.data) {
              //console.log("PlayerPos : " + event.data);
            }
            var args = event.data.trim().split(",");
            MCPI.playerX = Math.floor(parseFloat(args[0]));
            MCPI.playerY = Math.floor(parseFloat(args[1]));
            MCPI.playerZ = Math.floor(parseFloat(args[2]));
            MCPI.curX = MCPI.playerX;
            MCPI.curY = MCPI.playerY;
            MCPI.curZ = MCPI.playerZ;
            MCPI.playerShiftedHeight = MCPI.playerY;

            function getrot_cb(txt) {
              //console.log("Rotation : " + txt);
                if( typeof callback != "undefined" && callback!=null) {
                    MCPI.yaw = parseFloat(event.data.trim());
                    callback();
                }
            }
            mcSendWCB("player.getRotation()", getrot_cb);
        }
        mcSend("player.getPos()");
    }

    function getPlayerYXZ(posCoord) {
        var val = 0;
        switch (posCoord) {
          case 'x':  val = MCPI.playerX;  break;
          case 'y':  val = MCPI.playerY;  break;
          case 'z':  val = MCPI.playerZ;  break;
        }
        return Math.round(val);
    }

    function sendRawMsg(msg) {
        mcSend(msg);
    }

    function getPlayerId() {
        mcSend("world.getPlayerId()");
    }

    function worldReset() {
        getPlayerPos();
        var x = getPlayerYXZ("x");
        var z = getPlayerYXZ("z");

        postToChat('reset around.');
        setBlocks([0, 0], x-30,  0, z-30, x+30, 30, z+30);
        setBlocks([2, 0], x-30, -3, z-30, x+30, -1, z+30);
        setBlocks([7, 0], x-30, -4, z-30, x+30, -4, z+30);
    }

    var blockList = [
        [0,   0,  'Air'],
        [1,   0,  'Stone'],
        [2,   0,  'Grass'],
        [3,   0,  'Dirt'],
        [4,   0,  'Cobblestone'],
        [5,   0,  'Oak Planks'],
        [5,   1,  'Spruce Planks'],
        [5,   2,  'Birch Planks'],
        [10,  0,  'Lava'],
        [41,  0,  'Gold Block'],
        [42,  0,  'Iron Block'],
        [46,  0,  'TNT'],
        [57,  0,  'Diamond Block'],
        [72,  0,  'Wooden Pressure Plate'],
        [88,  0,  'Soul Sand'],
        [89,  0,  'Glowstone'],
        [91,  0,  "Jack o'Lantern"],
        [113, 0,  'Nether Brick Fence'],
        [133, 0,  'Emerald Block'],
        [138, 0,  'Beacon'],
        [152, 0,  'Redstone Block'],
        [165, 0,  'Slime Block'],
    ];

    function block_name(block) {
        for(var i=0; i<blockList.length; i++){
            if(block == blockList[i][2]){
                console.log("BlockID:" + (blockList[i][0]));
                id = [parseInt(blockList[i][0]), parseInt(blockList[i][1])];
                return id;
            }
        }
        mcSend("chat.post(" + block + "is not found.)");
        return [1, 0];
    }

    ext.connect      = connect;
    ext.connect_url  = connect_url;
    ext.postToChat   = postToChat;
    ext.getBlock     = getBlock;
    ext.setBlock     = setBlock;
    ext.setBlocks    = setBlocks;
    ext.setPlayer    = setPlayer;
    ext.getPlayerPos = getPlayerPos;
    ext.playerXYZ    = getPlayerYXZ;
    ext.sendRawMsg   = sendRawMsg;
    ext.worldReset   = worldReset;
    ext.block_name   = block_name;

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
          [' ', 'connect to Minecraft', 'connect'],
          [' ', 'chat %s ', 'postToChat', 'Hello,world!' ],
          ['r', '%m.blockName', 'block_name', 'Diamond Block'],
          ['R', 'block name X:%n Y:%n Z:%n ', 'getBlock', 0,0,0 ],
          [' ', 'place %s X:%n Y:%n Z:%n ', 'setBlock', ' ',0,0,0 ],
          [' ', 'reset world', 'worldReset'],
          [' ', 'teleport X:%n Y:%n Z:%n ', 'setPlayer', 0,0,0 ],
          ['w', "get player's position", 'getPlayerPos'],
          ['r', "player's %m.pos pos", 'playerXYZ', 'x'],
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
            blockName: ['Air','Stone','Grass','Dirt','Cobblestone','Oak Planks','Spruce Planks','Birch Planks','Lava','Gold Block','Iron Block','TNT','Diamond Block','Wooden Pressure Plate','Soul Sand','Glowstone',"Jack o'lantern",'Nether Brick Fence','Emerald Block','Beacon','Redstone Block','Slime Block'],
        }
    };

    ext._getStatus = function() {
        if( mcSocket!=null && mcSocket.IsConnect==true ) {
            return { status:2, msg:'Ready' };
        }
        if(mcSocket==null) {
            mc_init(hostname);
        }
        return { status:1, msg:'NotReady' };
    };

    ext._shutdown = function() {
        console.log("_shutdown");
    };

    // Register the extension
    ScratchExtensions.register('Micratch', descriptor, ext);

    mc_init( "localhost" );


})({});
