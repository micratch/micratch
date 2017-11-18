
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
        postToChat('周りを元に戻します。');
        var x = getPlayerYXZ("x");
        var y = getPlayerYXZ("y");
        var z = getPlayerYXZ("z");


        if(y>30){
          setBlocks([0, 0], x-30,  y-30, z-30, x+30, y+30, z+30);
        } else {
          setBlocks([0, 0], x-30,  0, z-30, x+30, 30, z+30);
          setBlocks([2, 0], x-30, -3, z-30, x+30, -1, z+30);
          setBlocks([7, 0], x-30, -4, z-30, x+30, -4, z+30);
        }

    }

    var blockList = [
        [0,0,'空気'],
        [1,0,'石'],
        [1,1,'花崗岩'],
        [1,2,'磨かれた花崗岩'],
        [1,3,'閃緑岩'],
        [1,4,'磨かれた閃緑岩'],
        [1,5,'安山岩'],
        [1,6,'磨かれた安山岩'],
        [2,0,'草'],
        [3,0,'土'],
        [4,0,'丸石'],
        [5,0,'オークの木材'],
        [5,1,'マツの木材'],
        [5,2,'シラカバの木材'],
        [5,3,'ジャングルの木材'],
        [5,4,'アカシアの木材'],
        [5,5,'ダークオークの木材'],
        [7,0,'岩盤'],
        [10,0,'溶岩'],
        [12,0,'砂'],
        [12,1,'赤い砂'],
        [13,0,'砂利'],
        [14,0,'金鉱石'],
        [15,0,'鉄鉱石'],
        [16,0,'石炭鉱石'],
        [17,0,'オークの原木'],
        [17,1,'マツの原木'],
        [17,2,'シラカバの原木'],
        [17,3,'ジャングルの原木'],
        [35,0,'白色の羊毛'],
        [35,1,'橙色の羊毛'],
        [35,2,'赤紫色の羊毛'],
        [35,3,'空色の羊毛'],
        [35,4,'黄色の羊毛'],
        [35,5,'黄緑色の羊毛'],
        [35,6,'桃色の羊毛'],
        [35,7,'灰色の羊毛'],
        [35,8,'薄灰色の羊毛'],
        [35,9,'青緑色の羊毛'],
        [35,10,'紫色の羊毛'],
        [35,11,'青色の羊毛'],
        [35,12,'茶色の羊毛'],
        [35,13,'緑色の羊毛'],
        [35,14,'赤色の羊毛'],
        [35,15,'黒色の羊毛'],
        [37,0,'タンポポ'],
        [38,0,'ポピー'],
        [38,1,'ヒスイラン'],
        [38,2,'アリウム'],
        [38,3,'ヒナソウ'],
        [38,4,'赤色のチューリップ'],
        [38,5,'橙色のチューリップ'],
        [38,6,'白色のチューリップ'],
        [38,7,'桃色のチューリップ'],
        [38,8,'フランスギク'],
        [39,0,'茶色のキノコ'],
        [40,0,'赤色のキノコ'],
        [41,0,'金ブロック'],
        [42,0,'鉄ブロック'],
        [45,0,'レンガ'],
        [46,0,'TNT'],
        [57,0,'ダイヤブロック'],
        [64,0,'オークのドア'],
        [72,0,'木の感圧版'],
        [88,0,'ソウルサンド'],
        [91,0,'ジャック・オ・ランタン'],
        [133,0,'エメラルドブロック'],
        [138,0,'ビーコン'],
        [152,0,'レッドストーンブロック'],
        [165,0,'スライムブロック'],
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
          ['r', '%m.buildingBlock', 'block_name', 'ダイヤブロック'],
          ['r', '%m.plantBlock', 'block_name', 'ポピー'],
          ['r', '%m.specialBlock', 'block_name', '空気'],
          ['r', '%m.colorfulBlock', 'block_name', '白色の羊毛'],
          ['r', '%m.bingoBlock', 'block_name', 'ビンゴブロック'],
          ['R', 'ブロック名 X:%n Y:%n Z:%n ', 'getBlock', 0,0,0 ],
          [' ', '%s を置く X:%n Y:%n Z:%n ', 'setBlock', ' ',0,0,0 ],
          [' ', '周囲をリセット', 'worldReset'],
          [' ', 'テレポート X:%n Y:%n Z:%n ', 'setPlayer', 0,0,0 ],
          ['w', 'プレイヤーの座標をゲット', 'getPlayerPos'],
          ['r', 'プレイヤーの %m.pos 座標', 'playerXYZ', 'x'],
          //[' ', '直接入力 %s', 'sendRawMsg', '' ],
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
            buildingBlock: ['石','花崗岩','磨かれた花崗岩','閃緑岩','磨かれた閃緑岩','安山岩','磨かれた安山岩','草','土','丸石','オークの木材','マツの木材','シラカバの木材','ジャングルの木材','アカシアの木材','ダークオークの木材','岩盤','砂','赤い砂','砂利','金鉱石','鉄鉱石','石炭鉱石','オークの原木','マツの原木','シラカバの原木','ジャングルの原木','金ブロック','鉄ブロック','レンガ','ダイヤブロック','ソウルサンド','ジャック・オ・ランタン','エメラルドブロック'],
            plantBlock: ['タンポポ','ポピー','ヒスイラン','アリウム','ヒナソウ','赤色のチューリップ','橙色のチューリップ','白色のチューリップ','桃色のチューリップ','フランスギク','茶色のキノコ','赤色のキノコ',],
            specialBlock: ['空気','溶岩','TNT','オークのドア','木の感圧版','ビーコン','レッドストーンブロック','スライムブロック',],
            colorfulBlock: ['白色の羊毛','橙色の羊毛','赤紫色の羊毛','空色の羊毛','黄色の羊毛','黄緑色の羊毛','桃色の羊毛','灰色の羊毛','薄灰色の羊毛','青緑色の羊毛','紫色の羊毛','青色の羊毛','茶色の羊毛','緑色の羊毛','赤色の羊毛','黒色の羊毛',],
            bingoBlock: ['石','草','土','丸石','オークの木材','岩盤','砂','砂利','オークの原木','白色の羊毛', '空色の羊毛', '黄色の羊毛', '桃色の羊毛', '青色の羊毛', '緑色の羊毛', '赤色の羊毛', '黒色の羊毛', '金ブロック','鉄ブロック','ダイヤブロック',],
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
    ScratchExtensions.register('マイクラッチ2', descriptor, ext);

    mc_init( "localhost" );


})({});
