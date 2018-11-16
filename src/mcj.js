
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

    // forJunior
    function setBlock2(micratchID,x,y){
        for(var i=0; i<blockList.length; i++){
            if(micratchID == blockList[i][0]){
                var opt = [x,y,0,parseInt(blockList[i][1]), parseInt(blockList[i][2])];
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
    function createWall(micratchID, x, y){
        setBlocks(micratchID, 0, 0, 0, x-1, y-1, 0);
    }

    // forJunior
    function setBlockNextTo(micratchID, x, y, quantity){
        setBlocks(micratchID, x, y, 0, x+quantity-1, y, 0);
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
          setBlocks(75, x-30,  y-30, z-30, x+30, y+30, z+30); // 空気ブロックをしきつめる
        } else {
          setBlocks(75, x-30,  0, z-30, x+30, 30, z+30);      // 空気ブロックをしきつめる
          setBlocks(6,  x-30, -3, z-30, x+30, -1, z+30);      // 草ブロックをしきつめる
          setBlocks(77, x-30, -4, z-30, x+30, -4, z+30);      // 岩盤をしきつめる
        }

    }

    var blockList = [ // [MicratchID, BlockID, DataID, Name]
        [1,1,0,'石'],
        [2,4,0,'丸石'],
        [6,2,0,'草'],
        [7,12,0,'砂'],
        [8,13,0,'砂利'],
        [9,17,0,'オークのげんぼく'],
        [10,5,0,'オークのもくざい'],
        [11,17,1,'マツのげんぼく'],
        [12,5,1,'マツのもくざい'],
        [13,17,2,'シラカバのげんぼく'],
        [14,5,2,'シラカバのもくざい'],
        [15,17,3,'ジャングルのげんぼく'],
        [16,5,3,'ジャングルのもくざい'],
        [17,162,0,'アカシアのげんぼく'],
        [18,5,4,'アカシアのもくざい'],
        [19,162,1,'ダークオークのげんぼく'],
        [20,5,5,'ダークオークのもくざい'],
        [22,41,0,'金ブロック'],
        [24,42,0,'鉄ブロック'],
        [26,173,0,'石炭ブロック'],
        [28,57,0,'ダイヤブロック'],
        [30,133,0,'エメラルドブロック'],
        [32,22,0,'ラピスラズリブロック'],
        [33,87,0,'ネザーラック'],
        [34,88,0,'ソウルサンド'],
        [35,168,0,'プリズマリン'],
        [36,168,1,'プリズマリンレンガ'],
        [37,121,0,'エンドストーン'],
        [38,201,0,'プルパーブロック'],
        [39,35,0,'白色のウール'],
        [40,35,1,'オレンジのウール'],
        [41,35,2,'マゼンダのウール'],
        [42,35,3,'空色のウール'],
        [43,35,4,'黄色のウール'],
        [44,35,5,'黄緑色のウール'],
        [45,35,6,'ピンクのウール'],
        [46,35,7,'グレーのウール'],
        [47,35,8,'ライトグレーのウール'],
        [48,35,9,'シアンのウール'],
        [49,35,10,'紫色のウール'],
        [50,35,11,'青色のウール'],
        [51,35,12,'茶色のウール'],
        [52,35,13,'緑色のウール'],
        [53,35,14,'赤色のウール'],
        [54,35,15,'黒色のウール'],
        [55,95,0,'白色の色付きガラス'],
        [56,95,1,'オレンジの色付きガラス'],
        [57,95,2,'マゼンダの色付きガラス'],
        [58,95,3,'空色の色付きガラス'],
        [59,95,4,'黄色の色付きガラス'],
        [60,95,5,'黄緑色の色付きガラス'],
        [61,95,6,'ピンクの色付きガラス'],
        [62,95,7,'グレーの色付きガラス'],
        [63,95,8,'ライトグレーの色付きガラス'],
        [64,95,9,'シアンの色付きガラス'],
        [65,95,10,'紫色の色付きガラス'],
        [66,95,11,'青色の色付きガラス'],
        [67,95,12,'茶色の色付きガラス'],
        [68,95,13,'緑色の色付きガラス'],
        [69,95,14,'赤色の色付きガラス'],
        [70,95,15,'黒色の色付きガラス'],
        [71,10,0,'ようがん'],
        [72,8,0,'水'],
        [73,64,8,'オークのドア(上)'],
        [74,64,0,'オークのドア(下)'],
        [75,0,0,'空気'],
        [76,46,0,'TNT'],
        [77,7,0,'がんばん'],
        [78,152,0,'レッドストーンブロック'],
        [79,89,0,'グロウストーン'],
        [80,79,0,'氷ブロック'],
        [81,169,0,'シーランタン'],
        [82,91,0,'ジャック・オ・ランタン'],
        [83,85,0,'フェンス'],
        [84,101,0,'鉄ごうし'],
        [85,47,0,'本だな'],
        [86,80,0,'雪ブロック'],
        [87,50,0,'たいまつ'],
        [88,61,0,'かまど'],
        [89,72,0,'木の感圧板'],
        [90,19,0,'スポンジ'],
        [91,165,0,'スライムブロック'],
        [92,54,0,'チェスト'],
        [93,138,0,'ビーコン'],
        [94,86,0,'カボチャ'],
        [95,103,0,'メロンブロック'],
        [96,37,0,'タンポポ'],
        [97,38,0,'ポピー'],
        [98,38,1,'ヒスイラン'],
        [99,38,2,'アリウム'],
        [100,38,3,'ヒナソウ'],
        [101,38,4,'赤色のチューリップ'],
        [102,38,5,'オレンジのチューリップ'],
        [103,38,6,'白色のチューリップ'],
        [104,38,7,'ピンクのチューリップ'],
        [105,38,8,'フランスギク'],
        [106,39,0,'茶色のキノコ'],
        [107,40,0,'赤色のキノコ'],
        [108,123,0,'レッドストーンランプ(オフ)'],
        [109,124,0,'レッドストーンランプ(オン)'],
        [110,69,5,'レバー'],
        [111,45,0,'レンガ'],
        [112,98,0,'石レンガ'],
        [113,113,0,'ネザーレンガのフェンス'],
        [114,51,0,'炎'],
        [115,3,0,'土'],
        [116,66,0,'レール'],
        [117,27,0,'パワードレール'],
        [118,28,0,'ディテクターレール'],
        [119,157,0,'アクティベーターレール'],
        [120,55,0,'レッドストーン'],
        [121,76,0,'レッドストーントーチ'],
        [122,49,0,'黒曜石'],
        [123,107,0,'フェンスゲート'],
        [124,213,0,'マグマブロック'],
        [125,23,0,'ディスペンサー(下)'],
        [126,23,1,'ディスペンサー(上)'],
        [127,23,2,'ディスペンサー(北)'],
        [128,23,3,'ディスペンサー(南)'],
        [129,23,4,'ディスペンサー(西)'],
        [130,23,5,'ディスペンサー(東)'],
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

    function getBlockWithData(x,y,z,callback){
        var opt = [x,y,z].join();
        var msg = "world.getBlockWithData(" + opt + ")";
        function getbwd_cb(txt) {
            //console.log("getBlock : " + txt);

            if( typeof callback != "undefined" && callback!=null) {
                id = event.data.split(",");
                result = "マイクラッチにないブロックです。";
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
    ext.getPowerBlockID = getMicratchID;
    ext.getDecorativeBlockID = getMicratchID;
    ext.getBlockName = getBlockName;
    ext.getBlockWithData = getBlockWithData;
    ext.sendRawMsg = sendRawMsg;

    // forJunior
    ext.setBlock2 = setBlock2;
    ext.createWall = createWall;
    ext.setPlayerToZero = setPlayerToZero;
    ext.setBlockNextTo = setBlockNextTo;


    // Block and block menu descriptions
    var descriptor = {
        blocks: [
          [' ', 'マインクラフトにせつぞく', 'connect'],
          [' ', 'チャットする %s ', 'postToChat', 'ハロー、ワールド！' ],
          [' ', '%s をおく よこのいち(x):%n たてのいち(y):%n', 'setBlock2', ' ',0,0 ],
          [' ', 'はじめのいちにもどる', 'setPlayerToZero'],
          [' ', 'まわりをリセット', 'worldReset'],
          [' ', '%s を x:%n y:%n からよこに %n 個おく', 'setBlockNextTo', ' ', 0, 0, 3],
          [' ', '%s のかべをつくる よこの長さ:%n たての長さ:%n', 'createWall', ' ', 2,3],
          ['r', '%m.commonBlock', 'getCommonBlockID', '石'],
          ['r', '%m.rareBlock', 'getRareBlockID', 'ダイヤブロック'],
          ['r', '%m.colorfulWool', 'getColorfulWoolID', '白色のウール'],
          ['r', '%m.colorfulGlass', 'getColorfulGlassID', '白色の色付きガラス'],
          ['r', '%m.miscBlock', 'getMiscBlockID', '空気'],
          ['r', '%m.plantBlock', 'getPlantBlockID', 'ポピー'],
          ['r', '%m.decorativeBlock', 'getDecorativeBlockID', 'フェンス'],
          ['r', '%m.powerBlock', 'getPowerBlockID', 'レッドストーンブロック'],
          [' ', 'テレポート X:%n Y:%n Z:%n ', 'setPlayer', 0,0,0 ],
          ['w', 'プレイヤーのざひょうをゲット', 'getPlayerPos'],
          ['r', 'プレイヤーの %m.pos ざひょう', 'playerXYZ', 'x'],
          ['R', 'X:%n Y:%n Z:%n にあるブロック', 'getBlockWithData', 0,0,0],
        ],
        menus: {
            pos: ['x', 'y', 'z'],
            blockPos: ['abs', 'rel'],
            commonBlock: ['石','草','土','丸石','オークのもくざい','マツのもくざい','シラカバのもくざい','ジャングルのもくざい','アカシアのもくざい','ダークオークのもくざい','砂','砂利','オークのげんぼく','マツのげんぼく','シラカバのげんぼく','ジャングルのげんぼく','アカシアのげんぼく','ダークオークのげんぼく',],
            rareBlock: ['金ブロック','鉄ブロック','石炭ブロック','ダイヤブロック','エメラルドブロック','ラピスラズリブロック','レンガ','石レンガ','ネザーラック','ソウルサンド','マグマブロック','プリズマリン','プリズマリンレンガ','エンドストーン','プルパーブロック',],
            colorfulWool: ['白色のウール','オレンジのウール','マゼンダのウール','空色のウール','黄色のウール','黄緑色のウール','ピンクのウール','グレーのウール','ライトグレーのウール','シアンのウール','紫色のウール','青色のウール','茶色のウール','緑色のウール','赤色のウール','黒色のウール',],
            colorfulGlass: ['白色の色付きガラス','オレンジの色付きガラス','マゼンダの色付きガラス','空色の色付きガラス','黄色の色付きガラス','黄緑色の色付きガラス','ピンクの色付きガラス','グレーの色付きガラス','ライトグレーの色付きガラス','シアンの色付きガラス','紫色の色付きガラス','青色の色付きガラス','茶色の色付きガラス','緑色の色付きガラス','赤色の色付きガラス','黒色の色付きガラス',],
            miscBlock: ['空気','がんばん','水','ようがん','スポンジ','TNT','たいまつ','炎','氷ブロック','雪ブロック','フェンス','グロウストーン','ジャック・オ・ランタン','スライムブロック','シーランタン',],
            plantBlock: ['カボチャ','メロンブロック','タンポポ','ポピー','ヒスイラン','アリウム','ヒナソウ','赤色のチューリップ','オレンジのチューリップ','白色のチューリップ','ピンクのチューリップ','フランスギク','茶色のキノコ','赤色のキノコ',],
            powerBlock: ['パワードレール','ディテクターレール','レッドストーン','レール','レバー','木の感圧板','レッドストーントーチ','レッドストーンランプ(オフ)','レッドストーンランプ(オン)','レッドストーンブロック','アクティベーターレール',],
            decorativeBlock: ['フェンス','フェンスゲート','ネザーレンガのフェンス','鉄ごうし','本だな','チェスト','かまど','オークのドア(上)','オークのドア(下)','ビーコン',]
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
    ScratchExtensions.register('マイクラッチJr', descriptor, ext);

    mc_init( "localhost" );


})({});
