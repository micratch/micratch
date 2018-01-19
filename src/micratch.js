
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

        postToChat('周りを元に戻します。');
        setBlocks([0, 0], x-30,  0, z-30, x+30, 30, z+30);
        setBlocks([2, 0], x-30, -3, z-30, x+30, -1, z+30);
        setBlocks([7, 0], x-30, -4, z-30, x+30, -4, z+30);
    }

    var blockList = [
        [0,   0,  '空気'],
        [1,   0,  '石'],
        [2,   0,  '草'],
        [3,   0,  '土'],
        [4,   0,  '丸石'],
        [5,   0,  'オークの木材'],
        [5,   1,  'マツの木材'],
        [5,   2,  'シラカバの木材'],
        [10,  0,  '溶岩'],
        [41,  0,  '金ブロック'],
        [42,  0,  '鉄ブロック'],
        [46,  0,  'TNT'],
        [57,  0,  'ダイヤブロック'],
        [72,  0,  '木の感圧版'],
        [88,  0,  'ソウルサンド'],
        [89,  0,  'グロウストーン'],
        [91,  0,  'ジャック・オ・ランタン'],
        [113, 0,  'ネザーレンガのフェンス'],
        [133, 0,  'エメラルドブロック'],
        [138, 0,  'ビーコン'],
        [152, 0,  'レッドストーンブロック'],
        [165, 0,  'スライムブロック'],
    ];

    function block_name(block) {
        for(var i=0; i<blockList.length; i++){
            if(block == blockList[i][2]){
                console.log("BlockID:" + (blockList[i][0]));
                id = [parseInt(blockList[i][0]), parseInt(blockList[i][1])];
                return id;
            }
        }
        mcSend("chat.post(" + block + "が見つかりません)");
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
          [' ', 'マインクラフトに接続', 'connect'],
          [' ', 'チャットする %s ', 'postToChat', 'ハロー、ワールド！' ],
          ['r', '%m.blockName', 'block_name', 'ダイヤブロック'],
          ['R', 'ブロック名 X:%n Y:%n Z:%n ', 'getBlock', 0,0,0 ],
          [' ', '%s を置く X:%n Y:%n Z:%n ', 'setBlock', ' ',0,0,0 ],
          [' ', '周囲をリセット', 'worldReset'],
          [' ', 'テレポート X:%n Y:%n Z:%n ', 'setPlayer', 0,0,0 ],
          ['w', 'プレイヤーの座標をゲット', 'getPlayerPos'],
          ['r', 'プレイヤーの %m.pos 座標', 'playerXYZ', 'x'],
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
            blockName: ['空気','石','草','土','丸石','オークの木材','マツの木材','シラカバの木材','溶岩','金ブロック','鉄ブロック','TNT','ダイヤブロック','木の感圧版','ソウルサンド','グロウストーン','ジャック・オ・ランタン','ネザーレンガのフェンス','エメラルドブロック','ビーコン','レッドストーンブロック','スライムブロック'],
            // mobName: ['羊', '馬', ],
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
    ScratchExtensions.register('マイクラッチ', descriptor, ext);

    mc_init( "localhost" );


})({});
