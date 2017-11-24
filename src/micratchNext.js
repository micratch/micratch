
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
          setBlocks(70, x-30,  y-30, z-30, x+30, y+30, z+30); // 空気ブロックをしきつめる
        } else {
          setBlocks(70, x-30,  0, z-30, x+30, 30, z+30);      // 空気ブロックをしきつめる
          setBlocks(6,  x-30, -3, z-30, x+30, -1, z+30);      // 草ブロックをしきつめる
          setBlocks(72, x-30, -4, z-30, x+30, -4, z+30);      // 岩盤をしきつめる
        }

    }

    var blockList = [ // [MicratchID, BlockID, DataID, Name]
        [1,1,0,'石'],
        [2,4,0,'丸石'],
        [3,1,1,'花崗岩'],
        [4,1,3,'閃緑岩'],
        [5,1,5,'安山岩'],
        [6,2,0,'草'],
        [7,12,0,'砂'],
        [8,13,0,'砂利'],
        [9,17,0,'オークの原木'],
        [10,5,0,'オークの木材'],
        [11,17,1,'マツの原木'],
        [12,5,1,'マツの木材'],
        [13,17,2,'シラカバの原木'],
        [14,5,2,'シラカバの木材'],
        [15,17,3,'ジャングルの原木'],
        [16,5,3,'ジャングルの木材'],
        [17,162,0,'アカシアの原木'],
        [18,5,4,'アカシアの木材'],
        [19,162,1,'ダークオークの原木'],
        [20,5,5,'ダークオークの木材'],
        [21,14,0,'金鉱石'],
        [22,41,0,'金ブロック'],
        [23,15,0,'鉄鉱石'],
        [24,42,0,'鉄ブロック'],
        [25,16,0,'石炭鉱石'],
        [26,57,0,'ダイヤブロック'],
        [27,129,0,'エメラルド鉱石'],
        [28,133,0,'エメラルドブロック'],
        [29,21,0,'ラピスラズリ鉱石'],
        [30,22,0,'ラピスラズリブロック'],
        [31,87,0,'ネザーラック'],
        [32,88,0,'ソウルサンド'],
        [33,168,0,'プリズマリン'],
        [34,168,1,'プリズマリンレンガ'],
        [35,121,0,'エンドストーン'],
        [36,201,0,'プルパーブロック'],
        [37,35,0,'白色の羊毛'],
        [38,35,1,'橙色の羊毛'],
        [39,35,2,'赤紫色の羊毛'],
        [40,35,3,'空色の羊毛'],
        [41,35,4,'黄色の羊毛'],
        [42,35,5,'黄緑色の羊毛'],
        [43,35,6,'桃色の羊毛'],
        [44,35,7,'灰色の羊毛'],
        [45,35,8,'薄灰色の羊毛'],
        [46,35,9,'青緑色の羊毛'],
        [47,35,10,'紫色の羊毛'],
        [48,35,11,'青色の羊毛'],
        [49,35,12,'茶色の羊毛'],
        [50,35,13,'緑色の羊毛'],
        [51,35,14,'赤色の羊毛'],
        [52,35,15,'黒色の羊毛'],
        [53,95,0,'白色の色付きガラス'],
        [54,95,1,'橙色の色付きガラス'],
        [55,95,2,'赤紫色の色付きガラス'],
        [56,95,3,'空色の色付きガラス'],
        [57,95,4,'黄色の色付きガラス'],
        [58,95,5,'黄緑色の色付きガラス'],
        [59,95,6,'桃色の色付きガラス'],
        [60,95,7,'灰色の色付きガラス'],
        [61,95,8,'薄灰色の色付きガラス'],
        [62,95,9,'青緑色の色付きガラス'],
        [63,95,10,'紫色の色付きガラス'],
        [64,95,11,'青色の色付きガラス'],
        [65,95,12,'茶色の色付きガラス'],
        [66,95,13,'緑色の色付きガラス'],
        [67,95,14,'赤色の色付きガラス'],
        [68,95,15,'黒色の色付きガラス'],
        [69,10,0,'溶岩'],
        [70,0,0,'空気'],
        [71,46,0,'TNT'],
        [72,7,0,'岩盤'],
        [73,152,0,'レッドストーンブロック'],
        [74,89,0,'グロウストーン'],
        [75,79,0,'氷ブロック'],
        [76,169,0,'シーランタン'],
        [77,91,0,'ジャック・オ・ランタン'],
        [78,85,0,'フェンス'],
        [79,101,0,'鉄格子'],
        [80,47,0,'本棚'],
        [81,80,0,'雪ブロック'],
        [82,64,0,'オークのドア'],
        [83,61,0,'かまど'],
        [84,72,0,'木の感圧版'],
        [85,19,0,'スポンジ'],
        [86,165,0,'スライムブロック'],
        [87,54,0,'チェスト'],
        [88,138,0,'ビーコン'],
        [89,86,0,'カボチャ'],
        [90,103,1,'メロンブロック'],
        [91,37,0,'タンポポ'],
        [92,38,0,'ポピー'],
        [93,38,1,'ヒスイラン'],
        [94,38,2,'アリウム'],
        [95,38,3,'ヒナソウ'],
        [96,38,4,'赤色のチューリップ'],
        [97,38,5,'橙色のチューリップ'],
        [98,38,6,'白色のチューリップ'],
        [99,38,7,'桃色のチューリップ'],
        [100,38,8,'フランスギク'],
        [101,39,0,'茶色のキノコ'],
        [102,40,0,'赤色のキノコ'],
    ];

    function getMicratchID(blockName) {
        for(var i=0; i<blockList.length; i++){
            if(blockName == blockList[i][3]){
                return blockList[i][0];
            }
        }
        mcSend("chat.post(" + blockName + "が見つかりません)");
        return 0;
    }

    function getBlockName(micratchID){
        for(var i=0; i<blockList.length; i++){
            if(micratchID == blockList[i][0]){
                return blockList[i][3];
            }
        }
        return "マイクラッチIDを入力してください";
    }

    function getCommonBlockID(blockName){ }
    function getRareBlockID(blockName){ }
    function getColorfulWoolID(blockName){ }
    function getColorfulGlassID(blockName){ }
    function getMiscBlockID(blockName){ }
    function getPlantBlockID(blockName){ }

    // extの付いているものは、Scratch上での動作を表す
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
    ext.getBlockName = getBlockName;


    // Block and block menu descriptions
    var descriptor = {
        blocks: [
          [' ', 'マインクラフトに接続', 'connect'],
          [' ', 'チャットする %s ', 'postToChat', 'ハロー、ワールド！' ],
          [' ', '%s を置く X:%n Y:%n Z:%n ', 'setBlock', ' ',0,0,0 ],
          ['r', '%s のブロック名', 'getBlockName', ' '],
          ['r', '%m.commonBlock', 'getCommonBlockID', '石'],
          ['r', '%m.rareBlock', 'getRareBlockID', '金鉱石'],
          ['r', '%m.colorfulWool', 'getColorfulWoolID', '白色の羊毛'],
          ['r', '%m.colorfulGlass', 'getColorfulGlassID', '白色の色付きガラス'],
          ['r', '%m.miscBlock', 'getMiscBlockID', '溶岩'],
          ['r', '%m.plantBlock', 'getPlantBlockID', 'カボチャ'],
          [' ', '周囲をリセット', 'worldReset'],
          [' ', 'テレポート X:%n Y:%n Z:%n ', 'setPlayer', 0,0,0 ],
          ['w', 'プレイヤーの座標をゲット', 'getPlayerPos'],
          ['r', 'プレイヤーの %m.pos 座標', 'playerXYZ', 'x'],
          // ['R', 'X:%n Y:%n Z:%n のID', 'getBlock', 0,0,0 ],
          [' ', '直接入力 %s', 'sendRawMsg', '' ],
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
            commonBlock: ['石','丸石','花崗岩','閃緑岩','安山岩','草','砂','砂利','オークの原木','オークの木材','マツの原木','マツの木材','シラカバの原木','シラカバの木材','ジャングルの原木','ジャングルの木材','アカシアの原木','アカシアの木材','ダークオークの原木','ダークオークの木材',],
            rareBlock: ['金鉱石','金ブロック','鉄鉱石','鉄ブロック','石炭鉱石','ダイヤブロック','エメラルド鉱石','エメラルドブロック','ラピスラズリ鉱石','ラピスラズリブロック','ネザーラック','ソウルサンド','プリズマリン','プリズマリンレンガ','エンドストーン','プルパーブロック',],
            colorfulWool: ['白色の羊毛','橙色の羊毛','赤紫色の羊毛','空色の羊毛','黄色の羊毛','黄緑色の羊毛','桃色の羊毛','灰色の羊毛','薄灰色の羊毛','青緑色の羊毛','紫色の羊毛','青色の羊毛','茶色の羊毛','緑色の羊毛','赤色の羊毛','黒色の羊毛',],
            colorfulGlass: ['白色の色付きガラス','橙色の色付きガラス','赤紫色の色付きガラス','空色の色付きガラス','黄色の色付きガラス','黄緑色の色付きガラス','桃色の色付きガラス','灰色の色付きガラス','薄灰色の色付きガラス','青緑色の色付きガラス','紫色の色付きガラス','青色の色付きガラス','茶色の色付きガラス','緑色の色付きガラス','赤色の色付きガラス','黒色の色付きガラス',],
            miscBlock: ['溶岩','空気','TNT','岩盤','レッドストーンブロック','グロウストーン','氷ブロック','シーランタン','ジャック・オ・ランタン','フェンス','鉄格子','本棚','雪ブロック','オークのドア','かまど','木の感圧版','スポンジ','スライムブロック','チェスト','ビーコン',],
            plantBlock: ['カボチャ','メロンブロック','タンポポ','ポピー','ヒスイラン','アリウム','ヒナソウ','赤色のチューリップ','橙色のチューリップ','白色のチューリップ','桃色のチューリップ','フランスギク','茶色のキノコ','赤色のキノコ',],
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
    ScratchExtensions.register('マイクラッチNext', descriptor, ext);

    mc_init( "localhost" );


})({});
