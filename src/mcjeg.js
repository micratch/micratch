
(function (ext) {

    var mcSocket = null;
    var MCPI = {};
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
        mcSocket.IsConnect = true;
        getPlayerPos();
    }

    function onMessage(event) {
        if (event && event.data) {
            console.log("onMessage: " + event.data);
        }
    }

    function onError(event) {
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
            if( typeof callback != "undefined" && callback!=null) {
                callback( Number(event.data.trim()) );
            }
        }
        mcSendWCB(msg, getb_cb);
    }

    function setBlock(micratchID,x,y,z) {
        for(var i=0; i<blockList.length; i++){
            if(micratchID == blockList[i][0]){
                var opt = [x,y,z,parseInt(blockList[i][1]), parseInt(blockList[i][2])];
                mcSend("world.setBlock(" + opt + ")");
            }
        }
    }

    function setBlocks(micratchID,x1,y1,z1,x2,y2,z2){
        for(var i=0; i<blockList.length; i++){
            if(micratchID == blockList[i][0]){
                var opt = [ x1, y1, z1, x2, y2, z2, parseInt(blockList[i][1]), parseInt(blockList[i][2])].join();
                mcSend( "world.setBlocks(" + opt + ")" );
            }
        }
    }

    // forJunior
    function setBlock2(micratchID,x,y){
        for(var i=0; i<blockList.length; i++){
            if(micratchID == blockList[i][0]){
                var opt = [x,y,0,parseInt(blockList[i][1]), parseInt(blockList[i][2])];
                mcSend("world.setBlock(" + opt + ")");
            }
        }
    }

    // forJunior
    function createWall(micratchID, x, y){
        setBlocks(micratchID, 0, 0, 0, x-1, y-1, 0);
    }

    // forJunior
    function setBlockNextTo(micratchID, x, quantity){
        setBlocks(micratchID, x, 0, 0, x+quantity-1, 0, 0);
    }

    function setPlayer(x,y,z) {
        var opt = [x,y,z].join();
        mcSend("player.setPos(" + opt + ")");
    }

    // forJunior
    function setPlayerToZero(){
        mcSend("player.setPos(0,0,0)");
    }

    function getPlayerPos(callback) {
        mcSocket.onmessage = function (event) {
            if(event && event.data) {
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
        postToChat('reset around.');
        var x = getPlayerYXZ("x");
        var y = getPlayerYXZ("y");
        var z = getPlayerYXZ("z");


        if(y>30){
          setBlocks(75, x-30,  y-30, z-30, x+30, y+30, z+30);
        } else {
          setBlocks(75, x-30,  0, z-30, x+30, 30, z+30);
          setBlocks(6,  x-30, -3, z-30, x+30, -1, z+30);
          setBlocks(77, x-30, -4, z-30, x+30, -4, z+30);
        }

    }

    var blockList = [ // [MicratchID, BlockID, DataID, Name]
        [1,1,0,'Stone'],
        [2,4,0,'Cobblestone'],
        [3,1,1,'Granite'],
        [4,1,3,'Diorite'],
        [5,1,5,'Andesite'],
        [6,2,0,'Grass'],
        [7,12,0,'Sand'],
        [8,13,0,'Gravel'],
        [9,17,0,'Oak Wood'],
        [10,5,0,'Oak Wood Plank'],
        [11,17,1,'Spruce Wood'],
        [12,5,1,'Spruce Wood Plank'],
        [13,17,2,'Birch Wood'],
        [14,5,2,'Birch Wood Plank'],
        [15,17,3,'Jungle Wood'],
        [16,5,3,'Jungle Wood Plank'],
        [17,162,0,'Acacia Wood'],
        [18,5,4,'Acacia Wood Plank'],
        [19,162,1,'Dark Oak Wood'],
        [20,5,5,'Dark Oak Wood Plank'],
        [21,14,0,'Gold Ore'],
        [22,41,0,'Gold Block'],
        [23,15,0,'Iron Ore'],
        [24,42,0,'Iron Block'],
        [25,16,0,'Coal Ore'],
        [26,173,0,'Block of Coal'],
        [27,56,0,'Diamond Ore'],
        [28,57,0,'Diamond Block'],
        [29,129,0,'Emerald Ore'],
        [30,133,0,'Emerald Block'],
        [31,21,0,'Lapis Lazuli Ore'],
        [32,22,0,'Lapis Lazuli Block'],
        [33,87,0,'Netherrack'],
        [34,88,0,'Soul Sand'],
        [35,168,0,'Prismarine'],
        [36,168,1,'Prismarine Bricks'],
        [37,121,0,'End Stone'],
        [38,201,0,'Purpur Block'],
        [39,35,0,'White Wool'],
        [40,35,1,'Orange Wool'],
        [41,35,2,'Magenta Wool'],
        [42,35,3,'Light Blue Wool'],
        [43,35,4,'Yellow Wool'],
        [44,35,5,'Lime Wool'],
        [45,35,6,'Pink Wool'],
        [46,35,7,'Gray Wool'],
        [47,35,8,'Light Gray Wool'],
        [48,35,9,'Cyan Wool'],
        [49,35,10,'Purple Wool'],
        [50,35,11,'Blue Wool'],
        [51,35,12,'Brown Wool'],
        [52,35,13,'Green Wool'],
        [53,35,14,'Red Wool'],
        [54,35,15,'Black Wool'],
        [55,95,0,'White Stained Glass'],
        [56,95,1,'Orange Stained Glass'],
        [57,95,2,'Magenta Stained Glass'],
        [58,95,3,'Light Blue Stained Glass'],
        [59,95,4,'Yellow Stained Glass'],
        [60,95,5,'Lime Stained Glass'],
        [61,95,6,'Pink Stained Glass'],
        [62,95,7,'Gray Stained Glass'],
        [63,95,8,'Light Gray Stained Glass'],
        [64,95,9,'Cyan Stained Glass'],
        [65,95,10,'Purple Stained Glass'],
        [66,95,11,'Blue Stained Glass'],
        [67,95,12,'Brown Stained Glass'],
        [68,95,13,'Green Stained Glass'],
        [69,95,14,'Red Stained Glass'],
        [70,95,15,'Black Stained Glass'],
        [71,10,0,'Flowing Lava'],
        [72,8,0,'Flowing Water'],
        [73,64,8,'Oak door(upside)'],
        [74,64,0,'Oak door(downside)'],
        [75,0,0,'Air'],
        [76,46,0,'TNT'],
        [77,7,0,'Bedrock'],
        [78,152,0,'Redstone Block'],
        [79,89,0,'Glowstone'],
        [80,79,0,'Ice'],
        [81,169,0,'Sea Lantern'],
        [82,91,0,"Jack o'Lantern"],
        [83,85,0,'Oak Fence'],
        [84,101,0,'Iron Bars'],
        [85,47,0,'Bookshelf'],
        [86,80,0,'Snow Block'],
        [87,50,0,'Torch'],
        [88,61,0,'Furnace'],
        [89,72,0,'Wooden Pressure Plate'],
        [90,19,0,'Sponge'],
        [91,165,0,'Slime Block'],
        [92,54,0,'Chest'],
        [93,138,0,'Beacon'],
        [94,86,0,'Pumpkin'],
        [95,103,0,'Melon Block'],
        [96,37,0,'Dandelion'],
        [97,38,0,'Poppy'],
        [98,38,1,'Blue Orchid'],
        [99,38,2,'Allium'],
        [100,38,3,'Azure Bluet'],
        [101,38,4,'Red Tulip'],
        [102,38,5,'Orange Tulip'],
        [103,38,6,'White Tulip'],
        [104,38,7,'Pink Tulip'],
        [105,38,8,'Oxeye Daisy'],
        [106,39,0,'Brown Mushroom'],
        [107,40,0,'Red Mushroom'],
        [108,123,0,'Redstone Lamp (inactive)'],
        [109,124,0,'Redstone Lamp (active)'],
        [110,69,5,'Lever'],
        [111,45,0,'Bricks'],
        [112,98,0,'Stone Bricks'],
        [113,113,0,'Nether Brick Fence'],
        [114,51,0,'Fire'],
        [115,3,0,'Dirt'],
        [116,66,0,'Rail'],
        [117,27,0,'Powered Rail'],
        [118,28,0,'Detector Rail'],
        [119,157,0,'Activator Rail'],
        [120,55,0,'Redstone'],
        [121,76,0,'Redstone Torch (on)'],
    ];

    function getMicratchID(blockName) {
        for(var i=0; i<blockList.length; i++){
            if(blockName == blockList[i][3]){
                return blockList[i][0];
            }
        }
        mcSend("chat.post(" + blockName + "is wrong blockname.)");
        return 0;
    }

    function getBlockName(micratchID){
        for(var i=0; i<blockList.length; i++){
            if(micratchID == blockList[i][0]){
                return blockList[i][3];
            }
        }
        return "input MicratchID.";
    }

    function getBlockWithData(x,y,z,callback){
        var opt = [x,y,z].join();
        var msg = "world.getBlockWithData(" + opt + ")";
        function getbwd_cb(txt) {
            if( typeof callback != "undefined" && callback!=null) {
                id = event.data.split(",");
                result = "this block is not available in Micratch";
                for(var i=0; i<blockList.length; i++){
                    if(id[0] == blockList[i][1] && id[1] == blockList[i][2]){
                        result = blockList[i][0];
                    }
                }
            }
            callback(result);
        }
        mcSendWCB(msg, getbwd_cb);
    }

    function getCommonBlockID(blockName){ }
    function getRareBlockID(blockName){ }
    function getColorfulWoolID(blockName){ }
    function getColorfulGlassID(blockName){ }
    function getMiscBlockID(blockName){ }
    function getPlantBlockID(blockName){ }
    function getPowerBlockID(blockName){ }

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
    ext.getCommonBlockID = getMicratchID;
    ext.getRareBlockID = getMicratchID;
    ext.getColorfulWoolID = getMicratchID;
    ext.getColorfulGlassID = getMicratchID;
    ext.getPlantBlockID = getMicratchID;
    ext.getMiscBlockID = getMicratchID;
    ext.getPowerBlockID = getMicratchID;
    ext.getBlockName = getBlockName;
    ext.getBlockWithData = getBlockWithData;

    // forJunior
    ext.setBlock2 = setBlock2;
    ext.createWall = createWall;
    ext.setPlayerToZero = setPlayerToZero;
    ext.setBlockNextTo = setBlockNextTo;

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
          [' ', 'connect to Minecraft', 'connect'],
          [' ', 'chat %s ', 'postToChat', 'Hello,world' ],
          [' ', 'place %s horizontal pos(x):%n vertical pos(y):%n ', 'setBlock2', ' ',0,0 ],
          [' ', "reset player's pos", 'setPlayerToZero'],
          [' ', 'reset world', 'worldReset'],
          [' ', 'place %s from x:%n to %n ', 'setBlockNextTo', ' ', 0, 3],
          [' ', 'create wall of %s width:%n height:%n', 'createWall', ' ', 2,3],
          ['r', '%m.commonBlock', 'getCommonBlockID', 'Stone'],
          ['r', '%m.rareBlock', 'getRareBlockID', 'Diamond Block'],
          ['r', '%m.colorfulWool', 'getColorfulWoolID', 'White Wool'],
          ['r', '%m.colorfulGlass', 'getColorfulGlassID', 'White Stained Glass'],
          ['r', '%m.miscBlock', 'getMiscBlockID', 'Air'],
          ['r', '%m.plantBlock', 'getPlantBlockID', 'Poppy'],
          ['r', '%m.powerBlock', 'getPowerBlockID', 'Redstone Block'],
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
            commonBlock: ['Stone','Granite','Diorite','Andesite','Grass','Dirt','Cobblestone','Oak Wood Plank','Spruce Wood Plank','Birch Wood Plank','Jungle Wood Plank','Acacia Wood Plank','Dark Oak Wood Plank','Sand','Gravel','Oak Wood','Spruce Wood','Birch Wood','Jungle Wood','Bricks','Stone Bricks','Acacia Wood','Dark Oak Wood',],
            rareBlock: ['Gold Ore','Gold Block','Iron Ore','Iron Block','Coal Ore','Block of Coal','Diamond Ore','Diamond Block','Emerald Ore','Emerald Block','Lapis Lazuli Ore','Lapis Lazuli Block','Netherrack','Soul Sand','Prismarine','Prismarine Bricks','End Stone','Purpur Block',],
            colorfulWool: ['White Wool','Orange Wool','Magenta Wool','Light Blue Wool','Yellow Wool','Lime Wool','Pink Wool','Gray Wool','Light Gray Wool','Cyan Wool','Purple Wool','Blue Wool','Brown Wool','Green Wool','Red Wool','Black Wool',],
            colorfulGlass: ['White Stained Glass','Orange Stained Glass','Magenta Stained Glass','Light Blue Stained Glass','Yellow Stained Glass','Lime Stained Glass','Pink Stained Glass','Gray Stained Glass','Light Gray Stained Glass','Cyan Stained Glass','Purple Stained Glass','Blue Stained Glass','Brown Stained Glass','Green Stained Glass','Red Stained Glass','Black Stained Glass',],
            miscBlock: ['Air','Bedrock','Flowing Water','Flowing Lava','Sponge','TNT','Bookshelf','Torch','Fire','Chest','Furnace','Oak door(upside)','Oak door(downside)','Ice','Snow Block','Oak Fence','Glowstone',"Jack o'Lantern",'Iron Bars','Nether Brick Fence','Beacon','Slime Block','Sea Lantern',],
            plantBlock: ['Pumpkin','Melon Block','Dandelion','Poppy','Blue Orchid','Allium','Azure Bluet','Red Tulip','Orange Tulip','White Tulip','Pink Tulip','Oxeye Daisy','Brown Mushroom','Red Mushroom',],
            powerBlock: ['Powered Rail','Detector Rail','Redstone','Rail','Lever','Wooden Pressure Plate','Redstone Torch (on)','Redstone Lamp (inactive)','Redstone Lamp (active)','Redstone Block','Activator Rail',],
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
    ScratchExtensions.register('MicratchJr', descriptor, ext);

    mc_init( "localhost" );


})({});
