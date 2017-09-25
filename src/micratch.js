
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

    // testaaa

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
    function connect(target) {
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

    function setBlock(x,y,z,block) {
        var opt = [x,y,z,block].join();
        mcSend("world.setBlock(" + opt + ")");
    }

    function setBlocks(x1,y1,z1,x2,y2,z2,block){
        var opt = [ x1, y1, z1, x2, y2, z2, block ].join();
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
        postToChat('まわりをもとにもどします')
        setBlocks(-100,  0, -100, 100, 63, 100, 0);
        setBlocks(-100, -4, -100, 100, -1, 100, 2);
        setBlocks(-100, -5, -100, 100, -5, 100, 7);
        setPlayer(0, 0, 0);
    }

    function block_name(block) {
        var blockList = [
            [0, '空気'],
            [1, '石'],
            [2, '草'],
            [3, '土'],
            [4, '丸石'],
            [5, '木材'],
            [10, '溶岩'],
            [46, 'TNT'],
            [57, 'ダイヤブロック'],
            [91, 'ジャック・オ・ランタン'],
            [152, 'レッドストーンブロック'],
        ]
        for(var i=0; i<blockList.length; i++){
            if(block == blockList[i][1]){
                console.log("BlockIDのつもり" + (blockList[i][0]));
                return parseInt(blockList[i][0]);
            }
        }
        mcSend("chat.post(" + block + "はみつかりませんでした)");
        return 1;
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
          [' ', '%s にせつぞく', 'connect', 'localhost' ],
          [' ', '%s とチャットする', 'postToChat', 'ハロー、ワールド！' ],
          ['r', '%m.blockName', 'block_name', 'ダイヤブロック'],
          ['R', 'X:%n Y:%n Z:%n のブロックをゲット', 'getBlock', 0,0,0 ],
          [' ', 'X:%n Y:%n Z:%n に %s をおく', 'setBlock', 0,0,0,' ' ],
          [' ', 'X1:%n Y1:%n Z1:%n から X2:%n Y2:%n Z2:%n まで %s をおく', 'setBlocks', 0,0,0,0,0,0," " ],
          [' ', 'ワールドをリセット', 'worldReset'],
          [' ', 'X=%n Y=%n Z=%n にプレイヤーをいどう', 'setPlayer', 0,0,0 ],
          ['w', 'プレイヤーのざひょうをゲット', 'getPlayerPos'],
          ['r', 'プレイヤーの %m.pos ざひょう', 'playerXYZ', 'x'],
          // [' ', 'プレイヤーに %n ダメージをあたえる', 'giveDamage', 1],
          // [' ', '%m.mobName をしょうかんする', 'summonMob', '羊'],
          [' ', '直接入力 %s', 'sendRawMsg', '' ], // for Extension Developper
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
            blockName: ['空気', '石', '草', '土', '丸石', '木材', '溶岩', 'TNT', 'ダイヤブロック', 'ジャック・オ・ランタン', 'レッドストーンブロック'],
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
