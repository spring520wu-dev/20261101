/**
 * 遊戲名稱：臺灣特產與建築・環島集章大冒險
 * 說明：一款完全使用 p5.js 原生繪圖函式製作的全螢幕互動網頁遊戲。
 * 包含完整的狀態機、地圖探索、明信片過場、問答挑戰（含 24 種程序化動態選項圖形）、結算與粒子特效。
 */

// ==========================================
// 全域變數與狀態機
// ==========================================

// --------------------------------------------------
// 1. 宣告音效變數與載入線上音效網址
// --------------------------------------------------
let soundClick, soundCorrect, soundWrong;



function preload() {
  // 載入本地 assets 資料夾內的音效檔案
  soundClick = loadSound('assets/click.mp3');
  soundCorrect = loadSound('assets/correct.mp3');
  soundWrong = loadSound('assets/wrong.mp3');
}

let gameState = 'START'; // 'START', 'MAP', 'POSTCARD_MODAL', 'CHALLENGE', 'RESULT', 'FINAL_RESULT'
let globalStartTime = 0;
let totalElapsed = 0;
let particles = [];
let completedCounties = {}; // 記錄已完成的縣市與分數 { 'TPE': 100, 'TXG': 50 ... }

// 挑戰狀態專用變數
let currentCountyId = null;
let currentQuestionIndex = 0;
let currentScore = 0;
let feedbackState = 0; // 0: 等待選擇, 1: 顯示正確, 2: 顯示錯誤
let feedbackTimer = 0;
let selectedOption = -1;

// ==========================================
// 縣市資料庫設計 (Data Schema)
// ==========================================
const countyData = [
  // --- 首波完整實作示範縣市 (臺北、臺中、高雄) ---
  {
    id: 'TPE', name: '臺北市', x: 0.58, y: 0.22, color: '#FF9A9E',
    intro: '臺灣的政治與經濟中心，融合現代都會與豐富歷史文化的魅力之都。',
    questions: [
      {
        q: '請問下列哪一個是臺北市的著名地標？',
        options: [
          { text: '故宮博物院', key: 'npmpalace' },
          { text: '臺北101', key: 'taipei101' },
          { text: '貓空纜車', key: 'maokong' },
          { text: '中正紀念堂', key: 'cks_hall' }
        ],
        ans:1,
        hint: '曾經是世界第一高樓，外觀像竹節一樣節節高升！'
      },
      {
        q: '來到臺北必吃的著名平民美食是？',
        options: [
          { text: '珍珠奶茶', key: 'bubbletea' },
          { text: '牛肉麵', key: 'beefnoodle' },
          { text: '小籠包', key: 'xiaolongbao' },
          { text: '滷肉飯', key: 'luroufan' }
        ],
        ans:1,
        hint: '濃郁湯頭配上大塊牛肉，臺北還有專屬的節日呢！'
      }
    ]
  },
  {
    id: 'TXG', name: '臺中市', x: 0.48, y: 0.45, color: '#FECFEF',
    intro: '氣候宜人的文化城，擁有豐富的藝文空間與創意美食。',
    questions: [
      {
        q: '臺中知名的現代建築，以曲面設計聞名的是？',
        options: [
          { text: '高美濕地', key: 'gaomei' },
          { text: '臺中國家歌劇院', key: 'theater' },
          { text: '勤美綠園道', key: 'parklane' },
          { text: '彩虹眷村', key: 'rainbow' }
        ],
        ans: 1,
        hint: '由日本建築師伊東豊雄設計，被譽為全球最難蓋的建築之一。'
      },
      {
        q: '臺中發跡，外皮酥脆內餡麥芽甜甜的特產是？',
        options: [
          { text: '鳳梨酥', key: 'pineapple_cake' },
          { text: '太陽餅', key: 'suncake' },
          { text: '大腸包小腸', key: 'fengjia_sausage' },
          { text: '肉圓', key: 'taichung_meatball' }
        ],
        ans: 1,
        hint: '圓圓的形狀像太陽，吃的時候容易掉屑屑喔！'
      }
    ]
  },
  {
    id: 'KHH', name: '高雄市', x: 0.46, y: 0.75, color: '#A1C4FD',
    intro: '充滿熱情的南臺灣港都，擁有廣闊的海景與豐富的工業歷史。',
    questions: [
      {
        q: '高雄市最具代表性的摩天大樓是？',
        options: [
          { text: '85大樓', key: 'tower85' },
          { text: '龍虎塔', key: 'dragon_tiger' },
          { text: '駁二藝術特區', key: 'pier2' },
          { text: '愛河', key: 'love_river' }
        ],
        ans: 0,
        hint: '特殊的「高」字型建築，曾經是臺灣最高樓。'
      },
      {
        q: '高雄夜市常見，口感濃郁果香四溢的飲品是？',
        options: [
          { text: '大碗公冰', key: 'shaved_ice' },
          { text: '烤魷魚', key: 'seafood_squid' },
          { text: '鴨肉飯', key: 'duck_rice' },
          { text: '木瓜牛奶', key: 'papaya_milk' }
        ],
        ans: 3,
        hint: '南臺灣特產水果與鮮奶的完美結合，經常出現在六合夜市。'
      }
    ]
  },
  // --- 預留的 19 個縣市資料骨架 (Data Schema) ---
  // { id: 'KEE', name: '基隆市', x: 0.63, y: 0.17, color: '#D4A5A5', intro: '雨港之都，著名的廟口夜市與豐富的海產。', questions: [] },
{
  id: 'KEE', name: '基隆市', x: 0.63, y: 0.17, color: '#D4A5A5',
  intro: '雨港之都，擁有豐富的海洋文化與歷史砲台，夜市美食更是聞名全臺。',
  questions: [
    {
      q: '基隆最著名的夜市，有著標誌性黃色燈籠的是？',
      options: [
        { text: '廟口夜市', key: 'miaokou' },
        { text: '正濱漁港', key: 'zhengbin' },
        { text: '潮境公園', key: 'chaojing' },
        { text: '和平島公園', key: 'heping_island' }
      ],
      ans: 0,
      hint: '位於奠濟宮前方，有一整排黃色燈籠與各式在地小吃。'
    },
    {
      q: '基隆特有的傳統小吃，將米漿沿著鍋邊烤熟後加入湯羹中的是？',
      options: [
        { text: '泡泡冰', key: 'paopaobing' },
        { text: '鼎邊趖', key: 'dingbiansuo' },
        { text: '吉古拉', key: 'chikuwa' },
        { text: '營養三明治', key: 'nutritious_sandwich' }
      ],
      ans: 1,
      hint: '名字中的「趖」有沿著鍋邊滑動的意思！'
    }
  ]
},
  // { id: 'TYN', name: '桃園市', x: 0.54, y: 0.25, color: '#FFD3B6', intro: '國門之都，千塘之鄉，充滿多元族群文化。', questions: [] },
{
  id: 'TYN', name: '桃園市', x: 0.54, y: 0.25, color: '#FFD3B6',
  intro: '國門之都，千塘之鄉，充滿多元族群文化與休閒農場。',
  questions: [
    {
      q: '桃園著名的老街，以華麗的巴洛克式建築立面牌樓聞名的是？',
      options: [
        { text: '大溪老街', key: 'daxi_old_street' },
        { text: 'Xpark水族館', key: 'xpark' },
        { text: '小人國', key: 'window_on_china' },
        { text: '慈湖', key: 'cihu' }
      ],
      ans: 0,
      hint: '位在大漢溪旁，建築融合了洛可可與巴洛克風格。'
    },
    {
      q: '桃園大溪最出名的特產，以焦糖染色且口感紮實的是？',
      options: [
        { text: '龍岡米干', key: 'migan' },
        { text: '石門活魚', key: 'live_fish' },
        { text: '大溪豆乾', key: 'dried_tofu' },
        { text: '龍潭花生糖', key: 'peanut_candy' }
      ],
      ans: 2,
      hint: '黑黑方方的一塊，滷得很入味，是大溪老街必買伴手禮。'
    }
  ]
},
  // { id: 'HSZ', name: '新竹市', x: 0.52, y: 0.30, color: '#FFBA08', intro: '風城，科技重鎮與米粉貢丸的故鄉。', questions: [] },
  {
  id: 'HSZ', name: '新竹市', x: 0.52, y: 0.30, color: '#FFBA08',
  intro: '被稱為「風城」，擁有高科技園區，同時也是歷史悠久的竹塹古城。',
  questions: [
    {
      q: '新竹市區的歷史地標，舊稱竹塹城迎曦門的是？',
      options: [
        { text: '東門城', key: 'east_gate' },
        { text: '十七公里海岸', key: 'coastline_17km' },
        { text: '新竹火車站', key: 'hsinchu_station' },
        { text: '玻璃博物館', key: 'glass_museum' }
      ],
      ans: 0,
      hint: '位於圓環正中央，是一座古老的紅磚城門。'
    },
    {
      q: '新竹因為特有的「九降風」氣候，非常適合風乾製作的特產是？',
      options: [
        { text: '貢丸湯', key: 'meatball_soup' },
        { text: '城隍廟潤餅', key: 'lumpia' },
        { text: '水潤餅', key: 'shuirunbing' },
        { text: '新竹米粉', key: 'rice_noodles' }
      ],
      ans: 3,
      hint: '細細長長的，炒起來非常好吃，傳統作法需要靠風吹乾。'
    }
  ]
},
  // { id: 'HSQ', name: '新竹縣', x: 0.55, y: 0.33, color: '#FAA307', intro: '客家風情濃厚，擁有內灣老街與客家美食。', questions: [] },
  {
  id: 'HSQ', name: '新竹縣', x: 0.55, y: 0.33, color: '#FAA307',
  intro: '客家風情濃厚，擁有內灣老街與神木群，自然資源豐富。',
  questions: [
    {
      q: '新竹縣著名的主題樂園，結合了野生動物園與遊樂設施的是？',
      options: [
        { text: '內灣老街', key: 'neiwan_old_street' },
        { text: '司馬庫斯', key: 'smangus' },
        { text: '六福村', key: 'leofoo_village' },
        { text: '北埔冷泉', key: 'beipu_cold_spring' }
      ],
      ans: 2,
      hint: '標誌性遊樂設施是「大怒神」與「笑傲飛鷹」。'
    },
    {
      q: '新竹縣新埔鎮的秋季限定特產，將水果削皮後利用九降風風乾而成的是？',
      options: [
        { text: '柿餅', key: 'dried_persimmon' },
        { text: '客家擂茶', key: 'lei_cha' },
        { text: '野薑花粽', key: 'ginger_lily_zongzi' },
        { text: '客家粄條', key: 'hakka_bantiao' }
      ],
      ans: 0,
      hint: '一盤盤橘黃色的扁圓形水果擺在棚架上曬太陽，是著名的攝影美景。'
    }
  ]
},
  // { id: 'MIA', name: '苗栗縣', x: 0.50, y: 0.38, color: '#F48C06', intro: '山城，擁有豐富的木雕藝術與草莓園。', questions: [] },
  {
  id: 'MIA', name: '苗栗縣', x: 0.50, y: 0.38, color: '#F48C06',
  intro: '山城苗栗，擁有深厚的客家文化、勝興車站舊山線鐵道與香甜的草莓園。',
  questions: [
    {
      q: '苗栗三義著名的鐵道遺跡，因關刀山大地震而斷裂的古蹟是？',
      options: [
        { text: '勝興車站', key: 'shengxing_station' },
        { text: '飛牛牧場', key: 'flying_cow' },
        { text: '火炎山', key: 'huoyan_mountain' },
        { text: '龍騰斷橋', key: 'longteng_bridge' }
      ],
      ans: 3,
      hint: '由紅磚拱券組成的糯米橋古蹟，被譽為臺灣鐵道藝術極品。'
    },
    {
      q: '苗栗大湖最出名的水果，每年冬天吸引無數人採摘的是？',
      options: [
        { text: '客家麻糬', key: 'hakka_mochi' },
        { text: '水梨', key: 'asian_pear' },
        { text: '大湖草莓', key: 'dahu_strawberry' },
        { text: '肚仔餅', key: 'belly_cake' }
      ],
      ans: 2,
      hint: '鮮紅欲滴、口感酸甜，常被做成草莓醬或草莓冰品。'
    }
  ]
},
  // { id: 'NAN', name: '南投縣', x: 0.54, y: 0.52, color: '#E85D04', intro: '臺灣唯一不靠海的縣市，日月潭與玉山座落於此。', questions: [] },
  {
  id: 'NAN', name: '南投縣', x: 0.54, y: 0.52, color: '#E85D04',
  intro: '臺灣唯一不靠海的縣市，日月潭的高山湖泊與玉山雄姿令人心曠神怡。',
  questions: [
    {
      q: '南投縣最知名的天然湖泊，以雙潭高山水色聞名全臺的是？',
      options: [
        { text: '清境農場', key: 'chingjing' },
        { text: '日月潭', key: 'sun_moon_lake' },
        { text: '溪頭妖怪村', key: 'monster_village' },
        { text: '合歡山', key: 'hehuan_mountain' }
      ],
      ans: 1,
      hint: '湖面一邊形如日輪，另一邊形如彎月。'
    },
    {
      q: '日月潭周邊著名的特產茶葉，具有天然肉桂與薄荷香氣的是？',
      options: [
        { text: '竹山番薯包', key: 'sweet_potato_bun' },
        { text: '埔里紹興酒', key: 'shaoxing_wine' },
        { text: '凍頂烏龍茶', key: 'dongding_oolong' },
        { text: '紅玉紅茶', key: 'ruby_black_tea' }
      ],
      ans: 3,
      hint: '又稱為台茶18號，是南投非常經典的茶品。'
    }
  ]
},
  // { id: 'CWH', name: '彰化縣', x: 0.44, y: 0.50, color: '#DC2F02', intro: '八卦山大佛與豐富小吃的文化古都。', questions: [] },
  {
  id: 'CWH', name: '彰化縣', x: 0.44, y: 0.50, color: '#DC2F02',
  intro: '臺灣西海岸的文化古都，以八卦山大佛與豐富的街角小吃著稱。',
  questions: [
    {
      q: '座落於彰化八卦山頂，高達22公尺的著名地標是？',
      options: [
        { text: '鹿港天后宮', key: 'lukang_temple' },
        { text: '扇形車庫', key: 'fan_roundhouse' },
        { text: '王功漁港', key: 'wanggong_port' },
        { text: '八卦山大佛', key: 'bagua_buddha' }
      ],
      ans: 3,
      hint: '莊嚴肅穆的黑朝尊像，是彰化市最醒目的代表地標。'
    },
    {
      q: '彰化外皮外酥內Q、包裹鮮美豬肉與竹筍的代表性小吃是？',
      options: [
        { text: '鹿港牛舌餅', key: 'ox_tongue_pastry' },
        { text: '彰化肉圓', key: 'changhua_ba_wan' },
        { text: '貓鼠麵', key: 'rat_noodles' },
        { text: '爌肉飯', key: 'braised_pork_rice' }
      ],
      ans: 1,
      hint: '油炸過後皮質透明Q彈，淋上特製甜白醬十分美味。'
    }
  ]
},
  // { id: 'YUN', name: '雲林縣', x: 0.42, y: 0.58, color: '#D00000', intro: '布袋戲的故鄉，臺灣重要的農業重鎮。', questions: [] },
  {
  id: 'YUN', name: '雲林縣', x: 0.42, y: 0.58, color: '#D00000',
  intro: '臺灣的農業大縣與掌中戲（布袋戲）的故鄉，文化底蘊深厚。',
  questions: [
    {
      q: '雲林虎尾被譽為臺灣哪一種傳統民間藝術的發源地？',
      options: [
        { text: '劍湖山世界', key: 'janfusun' },
        { text: '北港朝天宮', key: 'beigang_temple' },
        { text: '西螺大橋', key: 'xiluo_bridge' },
        { text: '布袋戲', key: 'glove_puppetry' }
      ],
      ans: 3,
      hint: '「史艷文」與「素還真」等傳奇角色的搖籃。'
    },
    {
      q: '雲林古坑因得天獨厚的氣候與地形，所盛產的知名飲品作物是？',
      options: [
        { text: '古坑咖啡', key: 'gukeng_coffee' },
        { text: '西螺醬油', key: 'xiluo_soy_sauce' },
        { text: '北港花生', key: 'beigang_peanut' },
        { text: '斗六文旦', key: 'douliu_pomelo' }
      ],
      ans: 0,
      hint: '臺灣極具代表性的本土咖啡豆產區。'
    }
  ]
},
  // { id: 'CYI', name: '嘉義市', x: 0.44, y: 0.62, color: '#9D0208', intro: '阿里山森林鐵路的起點，火雞肉飯聞名全臺。', questions: [] },
  {
  id: 'CYI', name: '嘉義市', x: 0.44, y: 0.62, color: '#9D0208',
  intro: '阿里山森林鐵路的門戶，充滿木造歷史建築與火雞肉飯香。',
  questions: [
    {
      q: '嘉義市由日治時期檜木宿舍群改造、充滿日式風情的文創園區是？',
      options: [
        { text: '射日塔', key: 'sun_shooting_tower' },
        { text: '檜意森活村', key: 'hinoki_village' },
        { text: '嘉義市立美術館', key: 'chiayi_art_museum' },
        { text: '北門驛', key: 'beimen_station' }
      ],
      ans: 1,
      hint: '全臺最大日式官舍建築群，散發濃濃阿里山檜木香。'
    },
    {
      q: '來到嘉義市必吃的代表性經典美食，淋上雞油香氣四溢的是？',
      options: [
        { text: '砂鍋魚頭', key: 'casserole_fish_head' },
        { text: '方塊酥', key: 'cuboid_pastry' },
        { text: '美奶滋涼麵', key: 'mayo_cool_noodles' },
        { text: '火雞肉飯', key: 'turkey_rice' }
      ],
      ans: 3,
      hint: '切絲的嫩火雞肉鋪在熱騰騰白飯上，淋上特製雞油與醬汁。'
    }
  ]
},
  // { id: 'CYQ', name: '嘉義縣', x: 0.47, y: 0.64, color: '#6A040F', intro: '橫跨山海，從阿里山到東石漁港風景多變。', questions: [] },
  {
  id: 'CYQ', name: '嘉義縣', x: 0.47, y: 0.64, color: '#6A040F',
  intro: '橫跨山海，從阿里山的日出雲海到東石港的海鮮，美景令人流連忘返。',
  questions: [
    {
      q: '嘉義縣著名的國家森林遊樂區，以神木、日出與櫻花小火車聞名的是？',
      options: [
        { text: '阿里山', key: 'alishan' },
        { text: '故宮南院', key: 'npm_south' },
        { text: '太平雲梯', key: 'taiping_suspension_bridge' },
        { text: '高跟鞋教堂', key: 'high_heel_church' }
      ],
      ans: 0,
      hint: '紅色的復古小火車穿梭在小火車軌道與櫻花樹下。'
    },
    {
      q: '嘉義沿海東石著名的海鮮特產，有「海中牛奶」之稱的是？',
      options: [
        { text: '阿里山高山茶', key: 'alishan_tea' },
        { text: '奮起湖便當', key: 'fenqihu_bento' },
        { text: '東石蚵仔', key: 'dongshi_oyster' },
        { text: '民雄鳳梨', key: 'minxiong_pineapple' }
      ],
      ans: 2,
      hint: '蚵棚遍布海岸，常做成鮮美多汁的蚵仔煎或烤蚵。'
    }
  ]
},
  // { id: 'TNN', name: '臺南市', x: 0.43, y: 0.69, color: '#7400B8', intro: '臺灣歷史發源地，擁有數不盡的古蹟與傳統美食。', questions: [] },
  {
  id: 'TNN', name: '臺南市', x: 0.43, y: 0.69, color: '#7400B8',
  intro: '臺灣歷史發源地，擁有數不盡的國定古蹟與全臺聞名的傳統甜口小吃。',
  questions: [
    {
      q: '荷蘭時期興建，舊稱普羅民遮城，臺南代表性的國定古蹟是？',
      options: [
        { text: '安平古堡', key: 'anping_fort' },
        { text: '奇美博物館', key: 'chimei_museum' },
        { text: '神農街', key: 'shennong_street' },
        { text: '赤崁樓', key: 'chikan_tower' }
      ],
      ans: 3,
      hint: '庭園內立有九座清代鰲座碑（九龜碑），非常具有歷史特色。'
    },
    {
      q: '臺南極具代表性的牛肉小吃，用滾燙高湯直接沖入生牛肉片的是？',
      options: [
        { text: '擔仔麵', key: 'peddler_noodles' },
        { text: '文章牛肉湯', key: 'tainan_beef_soup' },
        { text: '棺材板', key: 'coffin_bread' },
        { text: '虱目魚粥', key: 'milkfish_congee' }
      ],
      ans: 1,
      hint: '講求溫體牛肉的鮮嫩度，是許多臺南人最愛的早餐。'
    }
  ]
},
  // { id: 'PIF', name: '屏東縣', x: 0.49, y: 0.85, color: '#5E60CE', intro: '國境之南，陽光、沙灘與墾丁的度假勝地。', questions: [] },
  {
  id: 'PIF', name: '屏東縣', x: 0.49, y: 0.85, color: '#5E60CE',
  intro: '國境之南，充滿熱情陽光、湛藍沙灘，擁有墾丁國家公園與豐富水果。',
  questions: [
    {
      q: '位於臺灣本島最南端，矗立於鵝鑾鼻公園內的標誌性白色建築是？',
      options: [
        { text: '墾丁大街', key: 'kenting_street' },
        { text: '海生館', key: 'nmmba' },
        { text: '鵝鑾鼻燈塔', key: 'eluanbi_lighthouse' },
        { text: '小琉球', key: 'liuqiu_island' }
      ],
      ans: 2,
      hint: '被譽為「東亞之光」，是臺灣最具代表性的燈塔之一。'
    },
    {
      q: '屏東黑珍珠品種聞名全臺，口感多汁甜美的清爽水果是？',
      options: [
        { text: '蓮霧', key: 'wax_apple' },
        { text: '萬巒豬腳', key: 'wanluan_pork_knuckle' },
        { text: '東港櫻花蝦', key: 'sakura_shrimp' },
        { text: '雙妹嘜潮州燒冷冰', key: 'chaozhou_hot_cold_ice' }
      ],
      ans: 0,
      hint: '外表紅得發黑，咬下去多汁又脆甜。'
    }
  ]
},
  // { id: 'YIL', name: '宜蘭縣', x: 0.62, y: 0.35, color: '#4EA8DE', intro: '臺北的後花園，擁有溫泉與冷泉的療癒之地。', questions: [] },
  {
  id: 'YIL', name: '宜蘭縣', x: 0.62, y: 0.35, color: '#4EA8DE',
  intro: '臺北的後花園，擁有礁溪溫泉、蘇澳冷泉與龜山島絕美景色。',
  questions: [
    {
      q: '屹立於宜蘭頭城外海，外形酷似巨大海龜的火山島屿是？',
      options: [
        { text: '蘭陽博物館', key: 'lanyang_museum' },
        { text: '羅東夜市', key: 'luodong_night_market' },
        { text: '龜山島', key: 'guishan_island' },
        { text: '清水地熱', key: 'qingshui_geothermal' }
      ],
      ans: 2,
      hint: '宜蘭地標，周邊擁有夢幻的牛乳色牛奶海景觀。'
    },
    {
      q: '宜蘭著名特有甜點，將花生糖刨成屑加上冰淇淋與香菜用餅皮包裹的是？',
      options: [
        { text: '三星蔥油餅', key: 'scallion_pancake' },
        { text: '花生卷冰淇淋', key: 'peanut_ice_cream_roll' },
        { text: '宜蘭鴨賞', key: 'yilan_duck' },
        { text: '糕渣', key: 'gaozha' }
      ],
      ans: 1,
      hint: '香甜花生碎加上濃郁冰淇淋，鹹甜交織的傳統好滋味。'
    }
  ]
},
  // { id: 'HUA', name: '花蓮縣', x: 0.60, y: 0.50, color: '#48BFE3', intro: '太魯閣峽谷的鬼斧神工，臺灣最美麗的東海岸。', questions: [] },
  {
  id: 'HUA', name: '花蓮縣', x: 0.60, y: 0.50, color: '#48BFE3',
  intro: '太魯閣峽谷的鬼斧神工與璀璨的大理石海岸，高山大海的壯麗交響曲。',
  questions: [
    {
      q: '花蓮世界級的自然奇景，以大理岩峽谷與立霧溪切割地形聞名的是？',
      options: [
        { text: '七星潭', key: 'qixingtan' },
        { text: '瑞穗牧場', key: 'ruisui_ranch' },
        { text: '赤科山金針花', key: 'chike_daylily' },
        { text: '太魯閣國家公園', key: 'taroko' }
      ],
      ans: 3,
      hint: '峭壁聳立，擁有九曲洞與燕子口等極具震撼力的峽谷景觀。'
    },
    {
      q: '花蓮歷史悠久的代表性名產，外皮Q軟內餡綿密的傳統米製糕點是？',
      options: [
        { text: '花蓮糬', key: 'hualien_mochi' },
        { text: '炸蛋蔥油餅', key: 'scallion_pancake_egg' },
        { text: '扁食', key: 'hualien_wonton' },
        { text: '剝皮辣椒', key: 'peeled_chili' }
      ],
      ans: 0,
      hint: '最早由阿美族傳統粟餅演變而來，是花蓮最受歡迎的伴手禮。'
    }
  ]
},
  // { id: 'TTT', name: '臺東縣', x: 0.55, y: 0.70, color: '#56CFE1', intro: '日昇之鄉，熱氣球嘉年華與純淨的自然風光。', questions: [] },
  {
  id: 'TTT', name: '臺東縣', x: 0.55, y: 0.70, color: '#56CFE1',
  intro: '日昇之鄉，擁有遼闊的太平洋海景、鹿野高台熱氣球與純淨的稻米之鄉。',
  questions: [
    {
      q: '臺東鹿野高台每年夏天舉辦，吸引無數遊客前來觀賞繽紛天空的是？',
      options: [
        { text: '國際熱氣球嘉年華', key: 'hot_air_balloon' },
        { text: '三仙臺', key: 'sanxiantai' },
        { text: '知本溫泉', key: 'zhiben_hot_spring' },
        { text: '伯朗大道', key: 'mr_brown_avenue' }
      ],
      ans: 0,
      hint: '巨大的五彩熱氣球緩緩升空，在晨曦與夕陽下極為壯觀。'
    },
    {
      q: '臺東特有的熱帶水果，外表鱗目狀、果肉香甜帶有微酸鳳梨香氣的是？',
      options: [
        { text: '池上便當', key: 'chishang_bento' },
        { text: '東河包子', key: 'donghe_bun' },
        { text: '釋迦', key: 'custard_apple' },
        { text: '太麻里金針山', key: 'taimali_daylily' }
      ],
      ans: 2,
      hint: '外觀酷似佛陀頭頂的髮螺，故得此名。'
    }
  ]
},
  // { id: 'PEN', name: '澎湖縣', x: 0.32, y: 0.60, color: '#64DFDF', intro: '雙心石滬與玄武岩柱，夏季花火節的璀璨島嶼。', questions: [] },
  {
  id: 'PEN', name: '澎湖縣', x: 0.32, y: 0.60, color: '#64DFDF',
  intro: '雙心石湖與玄武岩柱的故鄉，夏季花火節極具魅力的高雄外海璀璨島嶼。',
  questions: [
    {
      q: '澎湖七美島上著名的先人捕魚智慧結晶，形狀極具浪漫色彩的是？',
      options: [
        { text: '大菓葉柱狀玄武岩', key: 'basalt_columns' },
        { text: '雙心石滬', key: 'twin_heart_weir' },
        { text: '跨海大橋', key: 'penghu_cross_sea_bridge' },
        { text: '觀音亭花火節', key: 'fireworks_festival' }
      ],
      ans: 1,
      hint: '用玄武岩和珊瑚礁石堆砌，兩座心形相連的捕魚陷阱。'
    },
    {
      q: '澎湖代表性的名產甜點，外甜內香、口感香酥多層次的是？',
      options: [
        { text: '黑糖糕', key: 'brown_sugar_cake' },
        { text: '花枝丸', key: 'squid_balls' },
        { text: '仙人掌冰', key: 'cactus_ice' },
        { text: '小管乾', key: 'dried_squid' }
      ],
      ans: 0,
      hint: '傳統祭祀糕點演變而來，帶有濃郁黑糖香氣與彈牙口感。'
    }
  ]
},
  // { id: 'KIN', name: '金門縣', x: 0.25, y: 0.40, color: '#72EFDD', intro: '戰地風光與豐富的閩南傳統聚落。', questions: [] },
  {
  id: 'KIN', name: '金門縣', x: 0.25, y: 0.40, color: '#72EFDD',
  intro: '擁有深厚戰地文化史蹟、風獅爺信仰與優美閩南古厝聚落的島嶼。',
  questions: [
    {
      q: '金門人用以鎮風辟邪、矗立於村落各處的吉祥物雕像是？',
      options: [
        { text: '翟山坑道', key: 'zhaishan_tunnel' },
        { text: '莒光樓', key: 'juguang_tower' },
        { text: '得月樓', key: 'deyue_tower' },
        { text: '風獅爺', key: 'wind_lion_god' }
      ],
      ans: 3,
      hint: '姿態各異獅面人身，手持葫蘆或令旗鎮守家園。'
    },
    {
      q: '金門享譽國際的代表性烈酒，以高粱與純淨寶月神泉水釀造的是？',
      options: [
        { text: '貢糖', key: 'tribute_candy' },
        { text: '金門高粱酒', key: 'kinmen_kaoliang' },
        { text: '炮彈鋼刀', key: 'steel_knife' },
        { text: '面線', key: 'kinmen_vermicelli' }
      ],
      ans: 1,
      hint: '香醇甘冽，口感清香純正，是全臺極具盛名的名酒。'
    }
  ]
},
  // { id: 'LIE', name: '連江縣', x: 0.30, y: 0.15, color: '#80FFDB', intro: '馬祖藍眼淚的夢幻奇景，海島花崗岩地貌。', questions: [] },
  {
  id: 'LIE', name: '連江縣', x: 0.30, y: 0.15, color: '#80FFDB',
  intro: '馬祖列島，以夢幻夜光藻「藍眼淚」、芹壁石屋與老酒麵線聞名。',
  questions: [
    {
      q: '馬祖夜晚海浪掀起的夢幻藍光自然奇景，是由夜光藻形成的？',
      options: [
        { text: '芹壁聚落', key: 'qinbi_village' },
        { text: '八八坑道', key: 'baba_tunnel' },
        { text: '藍眼淚', key: 'blue_tears' },
        { text: '東湧燈塔', key: 'dongyong_lighthouse' }
      ],
      ans: 2,
      hint: '春夏季限定的藍色微光奇景，宛如掉落大海的繁星。'
    },
    {
      q: '馬祖熱騰騰的在地招牌美食，將紅麴老酒與蛋香結合溫暖人心的是？',
      options: [
        { text: '繼光餅', key: 'jiguang_cake' },
        { text: '鼎邊糊', key: 'dingbianhu' },
        { text: '淡菜', key: 'mussels' },
        { text: '老酒麵線', key: 'old_wine_vermicelli' }
      ],
      ans: 3,
      hint: '湯頭散發濃郁酒香，加上煎蛋與細麵線，補暖首選。'
    }
  ]
},
  // { id: 'NWT', name: '新北市', x: 0.59, y: 0.28, color: '#B5E2FA', intro: '環繞首都，擁有九份老街與野柳地質公園的多樣城市。', questions: [] }
  {
  id: 'NWT', name: '新北市', x: 0.59, y: 0.28, color: '#B5E2FA',
  intro: '包圍著首都的廣大都會，擁有九份老街與野柳地質公園等多樣景觀。',
  questions: [
    {
      q: '位於北海岸野柳地質公園，因風化作用形成的著名奇岩是？',
      options: [
        { text: '女王頭', key: 'queens_head' },
        { text: '九份老街', key: 'jiufen' },
        { text: '淡水情人橋', key: 'fishermans_wharf' },
        { text: '平溪天燈', key: 'pingxi_lantern' }
      ],
      ans: 0,
      hint: '外型宛如尊貴的女王側面像，但因風化有斷頸危機。'
    },
    {
      q: '淡水著名的特色小吃，將油豆腐挖空塞入冬粉並封口的是？',
      options: [
        { text: '三峽牛角麵包', key: 'croissant' },
        { text: '深坑臭豆腐', key: 'stinky_tofu' },
        { text: '阿給', key: 'agei' },
        { text: '九份芋圓', key: 'taro_balls' }
      ],
      ans: 2,
      hint: '日語「油豆腐」的發音（Age）轉化而來的名字。'
    }
  ]
}
];

// ==========================================
// p5.js 核心生命週期
// ==========================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');


// 音效音量設定
  if (soundWrong) soundWrong.setVolume(0.3);
  if (soundCorrect) soundCorrect.setVolume(0.4);
  if (soundClick) soundClick.setVolume(0.9);






}

// function setup() {
//   createCanvas(windowWidth, windowHeight);
//   textFont('sans-serif');
// }

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
// }


function draw() {
  background(245, 245, 250); // 基礎背景色
  
  switch (gameState) {
    case 'START':
      drawStartScreen();
      break;
    case 'MAP':
      drawMapScreen();
      break;
    case 'POSTCARD_MODAL':
      drawMapScreen(); // 背景保留地圖
      drawPostcardModal();
      break;
    case 'CHALLENGE':
      drawChallengeScreen();
      break;
    case 'RESULT':
      drawResultScreen();
      break;
    case 'FINAL_RESULT':
      drawFinalResultScreen();
      break;
  }

  // 繪製全域粒子特效（煙火/彩帶）
  updateAndDrawParticles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ==========================================
// 輸入處理 (Mouse Events)
// ==========================================
function mousePressed() {
  let cx = width / 2;
  let cy = height / 2;

  switch (gameState) {
    case 'START':
      if (isMouseInRect(cx - 100, cy + 100, 200, 60)) {
        globalStartTime = millis();
        gameState = 'MAP';
      }
      break;
      
    case 'MAP':
      // 偵測點擊縣市節點
      for (let c of countyData) {
        let nx = c.x * width;
        let ny = c.y * height;
        if (dist(mouseX, mouseY, nx, ny) < 25) { // 節點半徑
          currentCountyId = c.id;
          gameState = 'POSTCARD_MODAL';
          break;
        }
      }
      break;
      
    case 'POSTCARD_MODAL':
      let cData = countyData.find(c => c.id === currentCountyId);
      // 進入挑戰按鈕
      if (cData.questions.length > 0 && isMouseInRect(cx - 150, cy + 120, 140, 50)) {
        currentQuestionIndex = 0;
        currentScore = 0;
        feedbackState = 0;
        gameState = 'CHALLENGE';
      }
      // 返回按鈕
      if (isMouseInRect(cx + 10, cy + 120, 140, 50)) {
        gameState = 'MAP';
      }
      break;
      
    case 'CHALLENGE':
      if (feedbackState === 0) {
        // 點擊選項 2x2 網格
        let qData = countyData.find(c => c.id === currentCountyId).questions[currentQuestionIndex];
        // let cardW = min(width * 0.4, 300);
        // let cardH = min(height * 0.3, 200);
        // let startX = cx - cardW - 10;
        // let startY = cy - cardH / 2;


      // 請同步修改這行的 startY
       let cardW = min(width * 0.4, 300);
       let cardH = min(height * 0.3, 200);
       let startX = cx - cardW - 10;
       let startY = 150; // 🎯 改成一模一樣的 150



        for (let i = 0; i < 4; i++) {
          let col = i % 2;
          let row = floor(i / 2);
          let ox = startX + col * (cardW + 20);
          let oy = startY + row * (cardH + 20);
          // if (isMouseInRect(ox, oy, cardW, cardH)) {
          //   selectedOption = i;
          //   if (i === qData.ans) {
          //     currentScore += 50; // 每題 50 分
          //     feedbackState = 1;
          //     createParticles(mouseX, mouseY, 15, [0, 255, 0]); // 正確綠色特效
          //   } else {
          //     feedbackState = 2;
          //   }
          //   feedbackTimer = millis();
          // }

          if (isMouseInRect(ox, oy, cardW, cardH)) {
          selectedOption = i;
          
          // 🔊 答對與答錯音效 + 特效處理
          if (i === qData.ans) {
            if (soundCorrect && soundCorrect.isLoaded()) soundCorrect.play();
            currentScore += 50; // 每題 50 分
            feedbackState = 1;  // 顯示正確
            createParticles(mouseX, mouseY, 15, [0, 255, 0]); // 播放正確綠色特效
          } else {
            if (soundWrong && soundWrong.isLoaded()) soundWrong.play();
            feedbackState = 2;  // 顯示錯誤
          }
          feedbackTimer = millis();
          }


        }
      } else {
        // 點擊「下一題/看結果」按鈕
        if (millis() - feedbackTimer > 500) { // 防誤觸延遲
          if (isMouseInRect(cx - 100, height - 100, 200, 50)) {
            if (currentQuestionIndex < 1) {
              currentQuestionIndex++;
              feedbackState = 0;
            } else {
              // --- 修改重點開頭 ---
              // 只有滿分 100 分（2 題全對）才記錄為已完成並發放徽章
              if (currentScore === 100) {
                completedCounties[currentCountyId] = true;
                createParticles(width / 2, height / 2, 50); // 滿分噴發彩帶
              } 
              // 若未滿 100 分，則不寫入 completedCounties，維持未完成狀態
              
              gameState = 'RESULT';
              // --- 修改重點結尾 ---
            }
          }
        }
      }
      break;
      
    case 'RESULT':
      if (isMouseInRect(cx - 100, cy + 120, 200, 50)) {
        // 檢查是否全破 (示範 3 個縣市，實際可改為 22)
        let neededCounties = ['TPE', 'TXG', 'KHH']; 
        let allDone = neededCounties.every(id => completedCounties[id] !== undefined);
        
        if (allDone) {
          gameState = 'FINAL_RESULT';
          createParticles(width / 2, height / 2, 150); // 大噴發
        } else {
          gameState = 'MAP';
        }
      }
      break;
      
    case 'FINAL_RESULT':
      if (isMouseInRect(cx - 100, height - 100, 200, 50)) {
        // 重置遊戲
        completedCounties = {};
        gameState = 'START';
      }
      break;
  }
}




// ==========================================
// 各畫面繪製邏輯
// ==========================================

function drawStartScreen() {
  let t = millis() / 1000;
  
  // 動態背景波浪
  noStroke();
  for (let i = 0; i < 5; i++) {
    fill(200 + i * 10, 220 + i * 5, 255, 150);
    beginShape();
    vertex(0, height);
    for (let x = 0; x <= width; x += 50) {
      let y = height * 0.7 + sin(x * 0.01 + t + i) * 50 - i * 40;
      vertex(x, y);
    }
    vertex(width, height);
    endShape(CLOSE);
  }

  textAlign(CENTER, CENTER);
  fill(50);
  textSize(48);
  textStyle(BOLD);
  // 標題浮動
  text('臺灣特產與建築', width / 2, height / 3 + sin(t * 2) * 10);
  textSize(32);
  text('環島集章大冒險', width / 2, height / 3 + 60 + sin(t * 2) * 10);
  
  // 開始按鈕
  drawButton(width / 2 - 100, height / 2 + 100, 200, 60, '開始冒險', '#FF6B6B', '#FF4757');
}






function drawMapScreen() {
  // 繪製臺灣簡易輪廓 (程序化多邊形)
  // push();
  // translate(width / 2 - 50, height / 2);
  // scale(min(width / 800, height / 800) * 0.8); 
  // fill('#E0F7FA');
  // stroke('#00ACC1');
  // strokeWeight(3);
  // beginShape();
  // 簡化的臺灣形狀座標
  // let twPoints = [
    // [0, 0], [0, 100], [100, 100], [100, 0],
    //[0, -250], [50, -220], [80, -150], [90, -50], 
   //[60, 100], [20, 200], [-10, 250], [-40, 200], 
    //[-70, 100], [-80, 0], [-60, -100], [-30, -200]
  // ];

// 繪製台灣島嶼底圖

 let twPoints = [
        [0.5800, 0.1500], [0.5928, 0.1520], [0.6063, 0.1582], [0.6194, 0.1644], [0.6317, 0.1703],
  [0.6438, 0.1775], [0.6551, 0.1867], [0.6644, 0.1977], [0.6700, 0.2100], [0.6709, 0.2232],
  [0.6689, 0.2371], [0.6661, 0.2512], [0.6648, 0.2654], [0.6658, 0.2795], [0.6676, 0.2936],
  [0.6692, 0.3076], [0.6700, 0.3200], [0.6689, 0.3328], [0.6658, 0.3456], [0.6617, 0.3582],
  [0.6550, 0.3700], [0.6508, 0.3831], [0.6471, 0.3961], [0.6437, 0.4089], [0.6400, 0.4200],
  [0.6384, 0.4326], [0.6373, 0.4452], [0.6364, 0.4577], [0.6350, 0.4700], [0.6334, 0.4826],
  [0.6315, 0.4952], [0.6293, 0.5077], [0.6300, 0.5200], [0.6268, 0.5353], [0.6231, 0.5505],
  [0.6191, 0.5654], [0.6150, 0.5800], [0.6114, 0.5927], [0.6077, 0.6053], [0.6039, 0.6177],
  [0.6000, 0.6300], [0.5940, 0.6471], [0.5878, 0.6647], [0.5815, 0.6826], [0.5750, 0.7000],
  [0.5688, 0.7153], [0.5626, 0.7305], [0.5563, 0.7454], [0.5500, 0.7600], [0.5438, 0.7753],
  [0.5376, 0.7905], [0.5313, 0.8054], [0.5250, 0.8200], [0.5198, 0.8366], [0.5146, 0.8531],
  [0.5097, 0.8694], [0.5050, 0.8850], [0.5011, 0.8824], [0.4973, 0.8798], [0.4936, 0.8773],
  [0.4900, 0.8750], [0.4862, 0.8763], [0.4825, 0.8775], [0.4787, 0.8788], [0.4750, 0.8800],
  [0.4725, 0.8700], [0.4700, 0.8600], [0.4675, 0.8500], [0.4650, 0.8400], [0.4588, 0.8300],
  [0.4525, 0.8200], [0.4463, 0.8100], [0.4400, 0.8000], [0.4350, 0.7900], [0.4300, 0.7800],
  [0.4250, 0.7700], [0.4200, 0.7600], [0.4163, 0.7500], [0.4125, 0.7400], [0.4088, 0.7300],
  [0.4050, 0.7200], [0.4000, 0.7100], [0.3950, 0.7000], [0.3900, 0.6900], [0.3850, 0.6800],
  [0.3813, 0.6675], [0.3775, 0.6550], [0.3738, 0.6425], [0.3700, 0.6300], [0.3688, 0.6175],
  [0.3675, 0.6050], [0.3663, 0.5925], [0.3650, 0.5800], [0.3688, 0.5675], [0.3725, 0.5550],
  [0.3763, 0.5425], [0.3800, 0.5300], [0.3850, 0.5175], [0.3900, 0.5050], [0.3950, 0.4925],
  [0.4000, 0.4800], [0.4075, 0.4625], [0.4150, 0.4450], [0.4225, 0.4275], [0.4300, 0.4100],
  [0.4400, 0.3875], [0.4500, 0.3650], [0.4600, 0.3425], [0.4700, 0.3200], [0.4800, 0.3000],
  [0.4900, 0.2800], [0.5000, 0.2600], [0.5100, 0.2400], [0.5200, 0.2250], [0.5300, 0.2100],
  [0.5400, 0.1950], [0.5500, 0.1800], [0.5600, 0.1680], [0.5700, 0.1570], [0.5800, 0.1500]
];






// 臺灣本島輪廓座標點（以畫布寬高比例 0~1 設定，順時針繪製）
// let twPoints = [
//     [0.62, 0.15], // 1. 北端（富貴角 / 基隆上方）
//     [0.66, 0.25], // 2. 東北角（宜蘭外側）
//     [0.64, 0.42], // 3. 宜蘭/花蓮交界海岸
//     [0.63, 0.52], // 4. 花蓮海岸外側
//     [0.59, 0.68], // 5. 臺東海岸外側
//     [0.54, 0.77], // 6. 屏東東側海岸
//     [0.49, 0.87], // 7. 南端（鵝鑾鼻 / 屏東下方）
//     [0.44, 0.80], // 8. 屏東西側海岸
//     [0.41, 0.74], // 9. 高雄 / 臺南海岸外側
//     [0.39, 0.64], // 10. 西海岸凸出處（嘉義 / 雲林外側）
//     [0.42, 0.54], // 11. 彰化 / 臺中海岸外側
//     [0.47, 0.40], // 12. 苗栗 / 新竹海岸外側
//     [0.53, 0.23], // 13. 桃園海岸外側
//     [0.58, 0.17]  // 14. 新北西北海岸
// ];

    // [0.62, 0.20], // 1. 北端（富貴角 / 基隆上方）
    // [0.66, 0.30], // 2. 東北角（宜蘭外側）
    // [0.64, 0.42], // 3. 宜蘭/花蓮交界海岸
    // [0.63, 0.52], // 4. 花蓮海岸外側
    // [0.59, 0.68], // 5. 臺東海岸外側
    // [0.54, 0.77], // 6. 屏東東側海岸
    // [0.49, 0.87], // 7. 南端（鵝鑾鼻 / 屏東下方）
    // [0.44, 0.80], // 8. 屏東西側海岸
    // [0.41, 0.74], // 9. 高雄 / 臺南海岸外側
    // [0.39, 0.64], // 10. 西海岸凸出處（嘉義 / 雲林外側）
    // [0.42, 0.54], // 11. 彰化 / 臺中海岸外側
    // [0.47, 0.40], // 12. 苗栗 / 新竹海岸外側
    // [0.53, 0.28], // 13. 桃園海岸外側
    // [0.58, 0.22]  // 14. 新北西北海岸

push();
fill('#E8F5E9');       // 島嶼填滿顏色（粉綠色/淡綠色）
stroke('#81C784');     // 島嶼邊框顏色
strokeWeight(3);       // 邊框粗細

beginShape();
for (let pt of twPoints) {
  // 將 0~1 的比例座標轉換為實際像素座標
  let px = pt[0] * width;
  let py = pt[1] * height;
  vertex(px, py);
}
endShape(CLOSE); // 自動閉合多邊形
pop();

// 加上這行來顯示邊框與網格數字
 // drawDebugGrid();

  

  // 頂部 UI
  let curTime = floor((millis() - globalStartTime) / 1000);
  fill(50);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(24);
  text(`收集進度: ${Object.keys(completedCounties).length} / 3 (示範區)`, 30, 30);
  textAlign(RIGHT, TOP);
  text(`總時間: ${curTime} 秒`, width - 30, 30);

  // 繪製縣市節點
  for (let c of countyData) {
    let nx = c.x * width;
    let ny = c.y * height;
    let isHover = dist(mouseX, mouseY, nx, ny) < 25;
    let isCompleted = completedCounties[c.id] !== undefined;

    push();
    translate(nx, ny);
    // 呼吸動態
    if (isHover && !isCompleted && gameState === 'MAP') {
      scale(1.2 + sin(millis() / 200) * 0.1);
      cursor('pointer');
    }

    if (isCompleted) {
  // 繪製已完成徽章（已移除分數數字）
  fill('#FFD700');
  stroke('#DAA520');
  strokeWeight(2);
  star(0, 0, 10, 25, 5); // 五角星徽章
} else {
  // 繪製未完成節點
  fill(c.color);
  stroke(255);
  strokeWeight(3);
  ellipse(0, 0, 30, 30);
}
    
    // 縣市名稱標籤
    fill(50);
    noStroke();
    textSize(16);
    textAlign(CENTER, TOP);
    text(c.name, 0, 20);
    pop();
  }
}




function drawPostcardModal() {
  let cData = countyData.find(c => c.id === currentCountyId);
  let cx = width / 2;
  let cy = height / 2;

  // 半透明遮罩
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

 // 明信片底框
push();
translate(cx, cy);
fill(255);
stroke('#ccc');
strokeWeight(2);
rectMode(CENTER);

//rect(0, 0, 800, 350, 15); // 寬度改為 800（原本 400 的兩倍）

// 修改前：rect(0, 0, 800, 350, 15);
// 修改後：自動適應手機與電腦寬度
let modalW = min(width * 0.9, 600);
let modalH = min(height * 0.6, 350);
rect(0, 0, modalW, modalH, 15);





  // 郵票裝飾
  fill(cData.color);
  noStroke();
  rect(150, -130, 50, 60, 5);
  
  // 內容
  fill(50);
  textAlign(CENTER, CENTER);
  textSize(32);
  textStyle(BOLD);
  text(cData.name, 0, -100);
  
  textSize(18);
  textStyle(NORMAL);
  textLeading(28);
  // 自動換行處理簡化
  text(cData.intro, 0, -20, 300, 200);

  pop();

  if (cData.questions.length > 0) {
    drawButton(cx - 150, cy + 120, 140, 50, '進入挑戰', '#4ECDC4', '#45B7D1');






  } else {
    fill(150);
    textSize(16);
    textAlign(CENTER, CENTER);
    text('即將開放...', cx - 80, cy + 145);
  }
  drawButton(cx + 10, cy + 120, 140, 50, '返回地圖', '#FF6B6B', '#FF4757');
}

function drawChallengeScreen() {
  let cData = countyData.find(c => c.id === currentCountyId);
  let qData = cData.questions[currentQuestionIndex];
  let cx = width / 2;
  let cy = height / 2;
  let t = millis() / 1000;

  // 問題區域
  fill(255, 255, 255, 200);
 // rect(cx - 350, 50, 700, 100, 20);
 //rect(cx - 450, 50, 900, 100, 20); 

 // 修改前：rect(cx - 450, 50, 900, 100, 20);
// 修改後：
let qBoxW = min(width * 0.9, 800);
//rect(cx - qBoxW / 2, 40, qBoxW, 90, 15);



  rect(cx - qBoxW / 2, 50, qBoxW, 90, 15); // 👈 白框 Y 從 40 開始、高度 90（中心點在 40 + 45 = 85）










 fill(50);
  textAlign(CENTER, CENTER);

// textSize(20); // 稍微調小字體
// textStyle(BOLD);
// // 加上 width * 0.8 寬度限制，讓過長的題目自動換行
// text(`第 ${currentQuestionIndex + 1} 題：${qData.q}`, cx, 100, width * 0.8, 80);


  textSize(22);
  textStyle(BOLD);
  text(`第 ${currentQuestionIndex + 1} 題：${qData.q}`, cx, 100);




  // // 選項 2x2 網格
  // let cardW = min(width * 0.4, 300);
  // let cardH = min(height * 0.3, 200);
  // let startX = cx - cardW - 10;
  // let startY = cy - cardH / 2;

// 選項 2x2 網格
  let cardW = min(width * 0.4, 300);
  let cardH = min(height * 0.3, 200);
  let startX = cx - cardW - 10;
  let startY = 150; // 🎯 直接指定卡片從上方 Y=150 開始排，大幅往上拉近題目







  for (let i = 0; i < 4; i++) {
    let col = i % 2;
    let row = floor(i / 2);
    let ox = startX + col * (cardW + 20);
    let oy = startY + row * (cardH + 20);
    
    let isHover = isMouseInRect(ox, oy, cardW, cardH);
    
    push();
    translate(ox + cardW / 2, oy + cardH / 2);
    
    // 卡片底座
    fill(255);
    stroke(200);
    strokeWeight(2);
    
    // 點擊反饋狀態
    if (feedbackState !== 0 && i === qData.ans) {
      stroke('#4CD137'); // 正確綠色框
      strokeWeight(4);
    } else if (feedbackState !== 0 && i === selectedOption && i !== qData.ans) {
      stroke('#E84118'); // 錯誤紅色框
      strokeWeight(4);
      rotate(sin(t * 30) * 0.05); // 錯誤搖晃
    } else if (isHover && feedbackState === 0) {
      scale(1.05);
      stroke('#00A8FF');
    }
    
    rectMode(CENTER);
    rect(0, 0, cardW, cardH, 15);
    
    // 繪製程序化選項圖形
    drawProceduralGraphic(qData.options[i].key, 0, -20, cardW, cardH, t, isHover && feedbackState === 0);
    
    // 選項文字
    fill(50);
    noStroke();
    textSize(20);
    text(qData.options[i].text, 0, cardH / 2 - 30);
    pop();
  }

  // 顯示提示與繼續按鈕
  if (feedbackState !== 0) {
    fill(0, 0, 0, 150);
    rect(0, cy + cardH + 10, width, height); // 下半部遮罩
    
    fill(255);
    textSize(24);
    if (feedbackState === 1) fill('#4CD137');
    else fill('#E84118');
    text(feedbackState === 1 ? '答對了！' : '答錯了...', cx, cy + cardH + 50);
    
    fill(255);
    textSize(17);
    text(`提示：${qData.hint}`, cx, cy + cardH + 100);
    


    let btnText = currentQuestionIndex < 1 ? '下一題' : '看結算';
    drawButton(cx - 100, height - 100, 200, 50, btnText, '#4ECDC4', '#45B7D1');
  }
}

function drawResultScreen() {
  let cx = width / 2;
  let cy = height / 2;
  let cData = countyData.find(c => c.id === currentCountyId);

  fill(255, 255, 255, 230);
  rectMode(CENTER);
  rect(cx, cy, 400, 350, 20);

  fill(50);
  textAlign(CENTER, CENTER);
  textSize(36);
  textStyle(BOLD);
  text(`${cData.name} 探索完成！`, cx, cy - 80);

  textSize(64);
  if (currentScore === 100) fill('#F1C40F');
  else fill('#E67E22');
  text(`${currentScore} 分`, cx, cy);

  textSize(24);
  fill(50);
  if (currentScore === 100) text('太棒了！100分 🏆', cx, cy + 60);
  else text('再加油 💪 還有進步空間', cx, cy + 60);

  drawButton(cx - 100, cy + 120, 200, 50, '返回地圖', '#FF6B6B', '#FF4757');
}

function drawFinalResultScreen() {
  let cx = width / 2;
  let cy = height / 2;

  fill(50);
  textAlign(CENTER, CENTER);
  textSize(48);
  textStyle(BOLD);
  text('🎉 恭喜完成環島集章大冒險！ 🎉', cx, cy - 150);

  let totalScore = Object.values(completedCounties).reduce((a, b) => a + b, 0);
  textSize(32);
  text(`總得分：${totalScore}`, cx, cy - 70);

  // 繪製徽章牆 (簡化排列)
  push();
  translate(cx - 150, cy);
  let keys = Object.keys(completedCounties);
  for (let i = 0; i < keys.length; i++) {
    let col = i % 3;
    let row = floor(i / 3);
    push();
    translate(col * 150, row * 100);
    fill('#FFD700');
    stroke('#DAA520');
    strokeWeight(2);
    star(0, 0, 20, 40, 5);
    fill(0);
    noStroke();
    textSize(16);
    let name = countyData.find(c => c.id === keys[i]).name;
    text(name, 0, 50);
    pop();
  }
  pop();

  drawButton(cx - 100, height - 100, 200, 50, '再玩一次', '#4ECDC4', '#45B7D1');
}

// ==========================================
// 24 選項程序化繪圖引擎 (Procedural Graphics)
// ==========================================
function drawProceduralGraphic(key, x, y, w, h, t, isHover) {
  push();
  translate(x, y);
  scale(min(w, h) / 200); // 基準縮放
  
  // 懸浮動畫：些微上下浮動
  if (isHover) translate(0, sin(t * 5) * 5);
  
  strokeWeight(2);
  switch (key) {
    // ---- 臺北 Q1 (景點) ----
    case 'taipei101':
      fill('#81ECEC');
      stroke('#00CEC9');
      rect(0, -60, 10, 30); // 塔尖
      for (let i = 0; i < 6; i++) { // 節節高升
        quad(-20+i*2, -30+i*15, 20-i*2, -30+i*15, 15-i*2, -15+i*15, -15+i*2, -15+i*15);
      }
      rect(0, 70, 40, 20); // 底座
      break;
    case 'npmpalace': // 故宮 (中式屋頂)
      fill('#FFEAA7'); stroke('#FDCB6E');
      triangle(0, -40, -50, 0, 50, 0);
      rect(0, 30, 80, 60);
      fill('#00CEC9'); rect(0, 30, 30, 60); // 門
      break;
    case 'maokong': // 纜車
      stroke(100); line(-60, -50, 60, -20); // 纜線
      fill('#55EFC4'); stroke(50);
      let floatY = sin(t*3)*3;
      rect(0, floatY, 60, 40, 10); // 車廂
      rect(0, floatY-10, 40, 20); // 窗
      break;
    case 'cks_hall': // 中正紀念堂
      fill('#FFF'); stroke('#0984E3');
      triangle(0, -50, -40, -10, 40, -10); // 藍色八角頂簡化
      rect(0, 20, 70, 50);
      rect(0, 20, 20, 50); // 階梯門
      break;
      
    // ---- 臺北 Q2 (美食) ----
    case 'beefnoodle':
      fill('#D63031'); arc(0, 20, 100, 80, 0, PI, CHORD); // 碗
      noFill(); stroke('#FDCB6E'); strokeWeight(3);
      for(let i=-30; i<=30; i+=15) bezier(i, 20, i+10, -10, i-10, 5, i, 20); // 麵條
      fill('#632A15'); noStroke();
      rect(-20, 15, 20, 15, 5); rect(15, 10, 25, 20, 5); // 牛肉塊
      break;
    case 'xiaolongbao':
      fill('#FFEAA7'); stroke('#E17055');
      ellipse(0, 20, 70, 50); // 籠子
      fill('#FFF'); stroke(200);
      ellipse(-15, 0, 30, 25); ellipse(15, 0, 30, 25); ellipse(0, -10, 30, 25); // 包子
      break;
    case 'luroufan':
      fill('#0984E3'); arc(0, 30, 90, 70, 0, PI, CHORD); // 碗
      fill('#FFF'); arc(0, 30, 85, 40, PI, 0, CHORD); // 白飯
      fill('#632A15'); noStroke();
      ellipse(0, 15, 60, 20); // 肉燥
      break;
    case 'bubbletea':
      fill('#FFEAA7'); stroke(100); rect(0, 10, 50, 70, 5, 5, 15, 15); // 杯子
      fill('#D63031'); noStroke(); rect(10, -35, 8, 40); // 吸管
      fill('#2D3436'); 
      for(let i=0; i<5; i++) ellipse(-15+i*8, 35, 10, 10); // 珍珠
      break;

    // ---- 臺中 Q1 (景點) ----
    case 'theater': // 歌劇院曲面
      push();
      rectMode(CENTER);
      fill('#F5F6FA'); stroke(150); strokeWeight(2);
      beginShape();
      vertex(-60, 40); bezierVertex(-60, -20, -20, -50, 0, -20);
      bezierVertex(20, -50, 60, -20, 60, 40);
      endShape(CLOSE);
      fill('#74B9FF'); ellipse(-30, 10, 20, 40); ellipse(30, 10, 20, 40); // 玻璃
      pop();
      break;

    case 'gaomei': // 高美濕地 (風車與夕陽)
      push();
      rectMode(CENTER);
      fill('#FF7675'); noStroke(); ellipse(0, 10, 60, 60); // 夕陽
      fill('#00CEC9'); rect(0, 40, 120, 20); // 水面
      stroke(50); strokeWeight(2); line(-20, 40, -20, 0); // 風車柱
      translate(-20, 0); rotate(t * 2);
      line(-15, 0, 15, 0); line(0, -15, 0, 15); // 葉片
      pop();
      break;

    case 'parklane': // 綠園道
      push();
      rectMode(CENTER);
      fill('#55EFC4'); noStroke();
      ellipse(-30, 0, 40, 50); ellipse(0, -10, 50, 60); ellipse(30, 0, 40, 50); // 樹冠
      fill('#814D27'); rect(-30, 30, 10, 30); rect(0, 30, 10, 40); rect(30, 30, 10, 30); // 樹幹
      pop();
      break;

    case 'rainbow': // 彩虹眷村
      push();
      rectMode(CENTER);
      noFill(); strokeWeight(5);
      stroke('#FF7675'); arc(0, 20, 80, 80, PI, 0);
      stroke('#FDCB6E'); arc(0, 20, 60, 60, PI, 0);
      stroke('#55EFC4'); arc(0, 20, 40, 40, PI, 0);
      fill('#FFEAA7'); noStroke(); rect(0, 30, 100, 20); // 房子基底
      pop();
      break;

    // ---- 臺中 Q2 (美食) ----
    case 'suncake': // 太陽餅
      push();
      rectMode(CENTER);
      fill('#FDCB6E'); stroke('#E17055'); strokeWeight(2);
      ellipse(0, 0, 80, 80);
      noFill(); stroke('#FFEAA7');
      for(let i=0; i<3; i++) ellipse(0, 0, 60-i*15, 60-i*15); // 酥皮層次
      pop();
      break;

    case 'pineapple_cake': // 鳳梨酥
      push();
      rectMode(CENTER);
      fill('#FDCB6E'); stroke('#D35400'); strokeWeight(2);
      rect(0, 0, 60, 60, 5); // 外皮
      fill('#F1C40F'); noStroke(); rect(0, 0, 40, 40); // 內餡切面示意
      pop();
      break;

    case 'fengjia_sausage': // 大腸包小腸
      push();
      rectMode(CENTER);
      rotate(-PI/4);
      fill('#F5F6FA'); stroke(200); strokeWeight(2); ellipse(0, 0, 30, 80); // 米腸
      fill('#D63031'); stroke('#B33939'); ellipse(5, 0, 20, 70); // 香腸
      pop();
      break;

    case 'taichung_meatball': // 肉圓
      push();
      rectMode(CENTER);
      fill(245, 246, 250, 200); stroke(150); strokeWeight(2); ellipse(0, 0, 70, 50); // 透明皮 (已修復色彩格式)
      fill('#D63031'); noStroke(); ellipse(0, 5, 40, 25); // 肉餡
      fill('#FDCB6E'); arc(0, -10, 30, 20, PI, 0); // 甜麵醬
      pop();
      break;

    // ---- 高雄 Q1 (景點) ----
    case 'tower85': // 85大樓 ("高"字型)
      fill('#74B9FF'); stroke('#0984E3');
      rect(0, -40, 20, 50); // 頂部
      rect(-25, 10, 20, 50); rect(25, 10, 20, 50); // 兩側腳
      rect(0, -10, 70, 20); // 中間橫樑
      break;
    case 'dragon_tiger': // 龍虎塔 (抽象雙塔)
      fill('#F1C40F'); stroke('#D35400');
      rect(-30, 0, 30, 60); rect(30, 0, 30, 60); // 塔身
      fill('#D63031'); triangle(-45, -30, -15, -30, -30, -50); triangle(15, -30, 45, -30, 30, -50);
      fill('#00CEC9'); ellipse(-30, 30, 40, 20); fill('#FF7675'); ellipse(30, 30, 40, 20); // 龍虎口
      break;
    case 'pier2': // 駁二 (工人漁婦公仔剪影)
      fill('#2D3436'); noStroke();
      ellipse(-20, -10, 20, 20); rect(-20, 20, 15, 40); // 人偶1
      ellipse(20, -10, 20, 20); rect(20, 20, 15, 40); // 人偶2
      fill('#D63031'); rect(0, 40, 100, 10); // 貨櫃底
      break;
    case 'love_river': // 愛河 (倒影與波浪)
      fill('#0984E3'); stroke('#74B9FF');
      beginShape();
      for(let i=-50; i<=50; i+=10) vertex(i, 20 + sin(t*3 + i*0.1)*5);
      vertex(50, 50); vertex(-50, 50);
      endShape(CLOSE);
      fill('#FFEAA7'); ellipse(-30, -10, 20, 20); // 月亮/路燈
      break;

    // ---- 高雄 Q2 (美食) ----
    case 'papaya_milk':
      fill('#E17055'); stroke(100); 
      quad(-20, -20, 20, -20, 15, 40, -15, 40); // 玻璃杯
      fill('#FFF'); rect(0, -30, 5, 50); // 吸管
      fill('#FDCB6E'); noStroke(); ellipse(0, 10, 20, 10); // 果汁反光
      break;
    case 'shaved_ice':
      fill('#0984E3'); arc(0, 30, 100, 40, 0, PI, CHORD); // 大碗公
      fill('#F5F6FA'); triangle(-40, 25, 40, 25, 0, -30); // 冰山
      fill('#FF7675'); ellipse(-15, 10, 15, 15); // 草莓
      fill('#FDCB6E'); ellipse(15, 10, 15, 15); // 芒果
      break;
    case 'seafood_squid':
      fill('#D63031'); stroke('#B33939');
      ellipse(0, -10, 30, 50); // 魷魚身體
      triangle(-15, -30, 15, -30, 0, -50); // 頭部
      for(let i=-10; i<=10; i+=5) bezier(i, 15, i+10, 30, i-10, 40, i, 50); // 觸手
      break;
    case 'duck_rice': // 鴨肉飯
      fill('#F5F6FA'); arc(0, 30, 80, 40, 0, PI, CHORD); // 碗
      fill('#FDCB6E'); arc(0, 25, 75, 20, PI, 0, CHORD); // 飯
      fill('#814D27'); noStroke();
      rect(-15, 10, 15, 10); rect(5, 5, 20, 15); // 鴨肉片
      break;
      
    default: // 備用圖形
      fill(200); ellipse(0, 0, 50, 50);
      break;

    // ---- 基隆市 Q1 (景點) ----
    case 'miaokou':
      rectMode(CENTER);
      fill('#E17055'); stroke('#D63031'); strokeWeight(2);
      rect(0, -20, 80, 15, 4);
      rect(-30, 15, 12, 50); rect(30, 15, 12, 50);
      fill('#FDCB6E'); stroke('#E67E22'); strokeWeight(1.5);
      ellipse(-15, 0, 16, 22); ellipse(15, 0, 16, 22);
      ellipse(-35, 0, 14, 18); ellipse(35, 0, 14, 18);
      fill('#D63031'); noStroke();
      rect(-15, 13, 4, 6); rect(15, 13, 4, 6);
      break;

    case 'zhengbin':
      rectMode(CENTER); noStroke();
      fill('#FF7675'); rect(-30, -5, 18, 45, 2);
      fill('#FFEAA7'); rect(-11, -12, 18, 60, 2);
      fill('#74B9FF'); rect(7, -2, 16, 50, 2);
      fill('#55EFC4'); rect(25, -8, 18, 40, 2);
      fill('#D63031'); triangle(-39, -27, -21, -27, -30, -40);
      fill('#E67E22'); triangle(-20, -42, -2, -42, -11, -55);
      fill('#0984E3'); triangle(-1, -27, 15, -27, 7, -38);
      fill('#00CEC9'); triangle(16, -28, 34, -28, 25, -38);
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      arc(0, 25, 90, 30, 0, PI);
      break;

    case 'chaojing':
      noStroke(); fill('#55EFC4'); ellipse(0, 30, 80, 20);
      stroke('#632A15'); strokeWeight(4); line(-5, 20, -20, -35);
      noStroke(); fill('#FDCB6E'); triangle(-20, -35, -38, 5, -5, -5);
      stroke('#632A15'); strokeWeight(3); line(15, 22, 25, -20);
      noStroke(); fill('#FFEAA7'); triangle(25, -20, 10, 10, 35, 10);
      break;

    case 'heping_island':
      rectMode(CENTER);
      fill('#74B9FF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 20, 95, 45, 0, PI);
      fill('#FFEAA7'); stroke('#D63031'); strokeWeight(1.5);
      rect(-20, 5, 24, 25, 5); ellipse(-20, -10, 32, 20);
      rect(18, 10, 20, 20, 4); ellipse(18, -3, 26, 16);
      stroke('#E67E22'); line(-28, -10, -12, -10); line(10, -3, 24, -3);
      break;

    // ---- 基隆市 Q2 (美食) ----
    case 'dingbiansuo':
      fill('#0984E3'); stroke('#00CEC9'); strokeWeight(2);
      arc(0, 10, 90, 70, 0, PI, CHORD);
      fill('#FFF'); stroke('#FFEAA7'); strokeWeight(1); ellipse(0, 10, 85, 20);
      fill('#F5F6FA'); stroke('#B2BEC3'); strokeWeight(1);
      bezier(-30, 10, -10, -5, 10, 20, 30, 5);
      bezier(-20, 15, -5, 0, 15, 20, 25, 10);
      noStroke(); fill('#FF7675'); ellipse(-12, 8, 14, 10);
      fill('#55EFC4'); ellipse(10, 12, 8, 8); ellipse(-5, 15, 6, 6);
      break;

    case 'paopaobing':
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      quad(-25, 5, 25, 5, 18, 45, -18, 45);
      fill('#FF7675'); stroke('#E17055'); strokeWeight(1.5);
      ellipse(0, 5, 52, 28); ellipse(0, -12, 42, 26); ellipse(0, -26, 28, 22);
      noStroke(); fill('#D63031');
      ellipse(-10, -10, 7, 7); ellipse(8, -18, 6, 6); ellipse(-2, -28, 8, 8);
      break;

    case 'chikuwa':
      rotate(-PI / 6 + sin(t * 2) * 0.08);
      stroke('#632A15'); strokeWeight(5); line(-45, 0, 45, 0);
      fill('#E67E22'); stroke('#D35400'); strokeWeight(2);
      rectMode(CENTER); rect(0, 0, 55, 28, 6);
      fill('#FFEAA7'); noStroke(); ellipse(-27, 0, 8, 26);
      fill('#632A15'); ellipse(-10, -5, 8, 12); ellipse(10, 5, 10, 14); ellipse(5, -6, 7, 9);
      break;

    case 'nutritious_sandwich':
      fill('#E67E22'); stroke('#D35400'); strokeWeight(2); ellipse(0, 5, 90, 48);
      fill('#632A15'); noStroke(); ellipse(0, 5, 75, 18);
      fill('#55EFC4'); stroke('#00CEC9'); strokeWeight(1); ellipse(-22, 2, 20, 16);
      fill('#FF7675'); stroke('#D63031'); ellipse(0, 3, 22, 18);
      fill('#632A15'); stroke('#2D3436'); ellipse(22, 3, 20, 18);
      fill('#FFEAA7'); noStroke(); ellipse(22, 3, 12, 10);
      stroke('#FFF'); strokeWeight(3); noFill();
      bezier(-30, 2, -10, -6, 10, 12, 30, 2);
      break;

    // ---- 桃園市 Q1 (景點) ----
    // ==========================================
    case 'daxi_old_street': // 大溪老街 (巴洛克牌樓)
      rectMode(CENTER);
      fill('#E5C07B'); stroke('#8D5B4C'); strokeWeight(2);
      rect(0, 10, 80, 50, 4); // 牌樓主體
      fill('#D4A574');
      arc(0, -15, 70, 40, PI, 0, CHORD); // 頂部巴洛克山牆
      fill('#FFEAA7'); ellipse(0, -25, 20, 15); // 山牆雕花
      fill('#8D5B4C'); rect(-30, 15, 10, 40); rect(30, 15, 10, 40); // 柱子
      fill('#FFEAA7'); rect(0, 15, 30, 40); // 中央拱門
      break;

    case 'xpark': // Xpark水族館 (水母大水槽)
      rectMode(CENTER);
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(3);
      rect(0, 0, 85, 75, 8); // 水槽外框
      fill('#74B9FF'); noStroke(); rect(0, 0, 75, 65, 4); // 水藍海洋背景
      let jY = sin(t * 3) * 4; // 水母浮動動畫
      fill('#FF7675'); stroke('#FFF'); strokeWeight(1);
      arc(0, -10 + jY, 30, 24, PI, 0, CHORD); // 水母頭
      stroke('#FF7675'); strokeWeight(2);
      for (let i = -10; i <= 10; i += 5) {
        line(i, -10 + jY, i + sin(t * 4 + i) * 3, 10 + jY); // 擺動觸手
      }
      break;

    case 'window_on_china': // 小人國 (迷你夢幻城堡)
      rectMode(CENTER);
      fill('#2ECC71'); noStroke(); ellipse(0, 30, 85, 20); // 綠地
      fill('#F5F6FA'); stroke('#34495E'); strokeWeight(2);
      rect(0, 5, 50, 40); rect(-20, -5, 16, 50); rect(20, -5, 16, 50); // 城堡
      fill('#E74C3C'); stroke('#C0392B'); // 紅色尖頂
      triangle(-28, -30, -12, -30, -20, -50);
      triangle(12, -30, 28, -30, 20, -50);
      triangle(-15, -15, 15, -15, 0, -35);
      fill('#34495E'); arc(0, 25, 16, 20, PI, 0); // 城門
      stroke('#E74C3C'); line(0, -35, 0, -45);
      fill('#F1C40F'); noStroke(); triangle(0, -45, 10, -42, 0, -39); // 小旗子
      break;

    case 'cihu': // 慈湖 (湖畔與黑天鵝)
      rectMode(CENTER);
      fill('#00CEC9'); stroke('#55EFC4'); strokeWeight(2);
      arc(0, 15, 90, 45, 0, PI); // 湖水
      fill('#2ED573'); noStroke();
      ellipse(-25, -5, 45, 35); ellipse(25, -5, 45, 35); ellipse(0, -12, 55, 40); // 綠山
      let swanY = sin(t * 2) * 2;
      fill('#2D3436'); stroke('#636E72'); strokeWeight(1);
      ellipse(-5, 15 + swanY, 22, 14); // 天鵝身軀
      bezier(-14, 15 + swanY, -18, 5 + swanY, -10, 0 + swanY, -8, 5 + swanY); // 脖子
      fill('#D63031'); noStroke(); triangle(-14, 5 + swanY, -18, 6 + swanY, -14, 8 + swanY); // 紅嘴
      break;

    // ==========================================
    // ---- 桃園市 Q2 (美食) ----
    // ==========================================
    case 'dried_tofu': // 大溪豆乾 (黑焦糖滷豆乾)
      rectMode(CENTER);
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 15, 90, 40); // 白盤
      fill('#3D1C02'); stroke('#632A15'); strokeWeight(2);
      rect(0, 0, 50, 45, 6); // 黑豆乾主體
      stroke('#8D5B4C'); strokeWeight(1.5);
      line(-15, -12, -15, 12); line(0, -12, 0, 12); line(15, -12, 15, 12); // 壓紋
      line(-20, -5, 20, -5); line(-20, 5, 20, 5);
      noStroke();
      fill('#2ED573'); ellipse(-8, -8, 6, 6); ellipse(12, 6, 5, 5); // 蔥花
      fill('#E74C3C'); ellipse(5, -6, 5, 5); // 辣椒
      break;

    case 'migan': // 龍岡米干 (雲南米干湯碗)
      rectMode(CENTER);
      fill('#D63031'); stroke('#B33939'); strokeWeight(2);
      arc(0, 10, 90, 70, 0, PI, CHORD); // 湯碗
      fill('#FFEAA7'); stroke('#FDCB6E'); strokeWeight(1);
      ellipse(0, 10, 85, 20); // 湯面
      fill('#FFF'); noStroke();
      for (let i = -25; i <= 25; i += 10) {
        rect(i, 10, 6, 16, 2); // 寬米干條
      }
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      ellipse(-15, 8, 16, 16); // 蛋包
      fill('#632A15'); noStroke(); ellipse(15, 12, 18, 10); // 肉片
      fill('#2ED573'); ellipse(2, 6, 6, 6); // 蔥花
      break;

    case 'live_fish': // 石門活魚 (紅燒鮮魚料理)
      rectMode(CENTER);
      fill('#FFF'); stroke('#74B9FF'); strokeWeight(2);
      ellipse(0, 10, 95, 45); // 魚盤
      fill('#E67E22'); stroke('#D35400'); strokeWeight(2);
      ellipse(0, 8, 65, 26); // 魚身
      triangle(25, 8, 42, -2, 42, 18); // 尾巴
      fill('#FFF'); stroke('#2D3436'); strokeWeight(1);
      ellipse(-20, 5, 6, 6);
      fill('#2D3436'); noStroke(); ellipse(-21, 5, 3, 3); // 眼睛
      noFill(); stroke('#D35400'); strokeWeight(1.5);
      arc(-5, 8, 10, 12, -HALF_PI, HALF_PI); arc(8, 8, 10, 12, -HALF_PI, HALF_PI); // 魚鱗
      stroke('#E74C3C'); strokeWeight(2); line(-10, 3, 10, 13); // 醬汁
      break;

    case 'peanut_candy': // 龍潭花生糖 (香濃花生糖塊)
      rectMode(CENTER);
      fill('#F39C12'); stroke('#D35400'); strokeWeight(2);
      rect(0, 5, 75, 45, 6); // 底層
      fill('#F1C40F'); noStroke(); rect(0, 0, 75, 35, 6); // 主體
      fill('#F5CBA7'); stroke('#E67E22'); strokeWeight(1.5); // 嵌在裡面的花生顆粒
      ellipse(-22, -6, 14, 10); ellipse(-8, 6, 16, 10);
      ellipse(10, -5, 14, 9); ellipse(24, 5, 15, 10);
      ellipse(-5, -10, 12, 8); ellipse(8, 10, 12, 8);
      break;

// ==========================================
    // ---- 新竹市 Q1 (景點) ----
    // ==========================================
    case 'east_gate': // 東門城 (竹塹城迎曦門)
      rectMode(CENTER);
      // 紅磚石造城牆底座與中央拱門
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      rect(0, 15, 80, 40, 4);
      fill('#2D3436'); arc(0, 35, 30, 40, PI, 0);
      // 二樓傳統木造城樓
      fill('#D63031'); rect(0, -10, 60, 20);
      fill('#FFEAA7'); rect(-20, -10, 6, 20); rect(0, -10, 6, 20); rect(20, -10, 6, 20);
      // 燕尾飛檐屋頂
      fill('#27AE60'); stroke('#1E8449');
      beginShape();
      vertex(-42, -18);
      bezierVertex(-20, -25, 20, -25, 42, -18);
      vertex(35, -35);
      bezierVertex(15, -45, -15, -45, -35, -35);
      endShape(CLOSE);
      break;

    case 'coastline_17km': // 十七公里海岸 (豎琴橋與九降風)
      rectMode(CENTER);
      // 藍海與沙灘背景
      fill('#74B9FF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 20, 90, 40, 0, PI);
      // 豎琴橋弧形大樑
      noFill(); stroke('#FFF'); strokeWeight(4);
      arc(-10, 30, 90, 80, PI, TWO_PI - HALF_PI);
      // 鋼纜斜拉線
      stroke('#F5F6FA'); strokeWeight(1.5);
      for (let i = -30; i <= 20; i += 10) {
        line(i, 20, -10, -10);
      }
      // 流線微風動畫
      stroke('#FFF'); strokeWeight(2);
      let windX = (t * 40) % 60 - 30;
      line(windX, -20, windX + 20, -20);
      line(windX - 15, -30, windX + 5, -30);
      break;

    case 'hsinchu_station': // 新竹火車站 (巴洛克式古蹟車站)
      rectMode(CENTER);
      // 主體石造建築
      fill('#DFE6E9'); stroke('#636E72'); strokeWeight(2);
      rect(0, 10, 85, 45, 4);
      // 圓拱長窗與門
      fill('#2D3436');
      rect(-25, 10, 12, 20, 6, 6, 0, 0);
      rect(25, 10, 12, 20, 6, 6, 0, 0);
      rect(0, 15, 16, 25, 8, 8, 0, 0);
      // 中央陡峭鐘樓與深綠鐘樓頂
      fill('#74B9FF'); stroke('#2980B9'); rect(0, -15, 30, 25);
      fill('#2C3E50'); stroke('#1A252F');
      triangle(-18, -27, 18, -27, 0, -55);
      // 古典時鐘
      fill('#FFF'); stroke('#2C3E50'); strokeWeight(1);
      ellipse(0, -15, 12, 12);
      stroke('#D63031'); line(0, -15, 0, -19); line(0, -15, 3, -15);
      break;

    case 'glass_museum': // 玻璃博物館 (晶瑩玻璃藝術)
      rectMode(CENTER);
      // 質感黑色展示台
      fill('#2D3436'); stroke('#636E72'); strokeWeight(2);
      rect(0, 30, 70, 15, 3);
      // 半透明晶瑩湖水綠玻璃花瓶
      fill(0, 206, 201, 180); stroke('#81ECEC'); strokeWeight(2);
      beginShape();
      vertex(-15, 22);
      bezierVertex(-35, 5, -5, -20, -10, -40);
      vertex(10, -40);
      bezierVertex(5, -20, 35, 5, 15, 22);
      endShape(CLOSE);
      // 玻璃亮面反光光暈
      fill(255, 255, 255, 200); noStroke();
      ellipse(-8, -10, 6, 25);
      ellipse(5, 5, 4, 15);
      break;

    // ==========================================
    // ---- 新竹市 Q2 (美食) ----
    // ==========================================
    case 'rice_noodles': // 新竹米粉 (風乾米粉架與九降風)
      rectMode(CENTER);
      // 木質晾曬竹架
      stroke('#8D5B4C'); strokeWeight(3);
      line(-35, 30, -35, -20); line(35, 30, 35, -20);
      line(-40, -15, 40, -15); line(-40, 10, 40, 10);
      // 細白米粉絲 (波浪風吹效果)
      stroke('#FFF'); strokeWeight(1.5); noFill();
      for (let i = -30; i <= 30; i += 6) {
        beginShape();
        for (let y = -15; y <= 25; y += 10) {
          let wave = sin(t * 5 + y * 0.1) * 3;
          curveVertex(i + wave, y);
        }
        endShape();
      }
      // 風吹線條示意
      stroke('#74B9FF'); strokeWeight(1.5);
      line(-45, -30, -25, -30); line(-35, -38, -10, -38);
      break;

    case 'meatball_soup': // 貢丸湯 (彈牙貢丸與高湯)
      rectMode(CENTER);
      // 青花瓷湯碗
      fill('#F5F6FA'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 10, 90, 70, 0, PI, CHORD);
      // 金黃清澈高湯 (RGBA 格式透明度)
      fill(255, 234, 167, 220); stroke('#FDCB6E'); strokeWeight(1);
      ellipse(0, 10, 85, 22);
      // 3 顆粉嫩彈牙大貢丸
      fill('#FFB8B8'); stroke('#E17055'); strokeWeight(1.5);
      ellipse(-18, 5, 26, 24);
      ellipse(18, 5, 26, 24);
      ellipse(0, -5, 28, 26);
      // 芹菜末與香油
      noStroke();
      fill('#2ED573'); ellipse(-5, 12, 6, 6); ellipse(12, 10, 5, 5); ellipse(0, 16, 4, 4);
      fill('#E67E22'); ellipse(8, -8, 5, 5);
      break;

    case 'lumpia': // 城隍廟潤餅 (豐富餡料潤餅捲)
      rectMode(CENTER);
      rotate(-PI / 12);
      // 潤餅麵皮主體
      fill('#FFEAA7'); stroke('#D4A574'); strokeWeight(2);
      rect(0, 5, 45, 70, 20);
      // 切口露出豐盛內餡
      fill('#2ED573'); noStroke(); ellipse(-8, -20, 16, 12);
      fill('#E74C3C'); ellipse(8, -22, 14, 10);
      fill('#F1C40F'); ellipse(0, -15, 18, 12);
      fill('#8D5B4C'); ellipse(-5, -10, 12, 10);
      // 包裝紙袋底座
      fill('#F5F6FA'); stroke('#B2BEC3'); strokeWeight(1.5);
      rect(0, 22, 50, 40, 4);
      break;

    case 'shuirunbing': // 水潤餅 (古早味軟Q餅)
      rectMode(CENTER);
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 15, 90, 40); // 白盤
      // 疊放的圓形水潤餅
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      ellipse(10, 8, 55, 35); // 下層餅
      ellipse(-10, 2, 58, 38); // 上層餅
      // 烙印焦香斑紋
      fill('#8D5B4C'); noStroke();
      ellipse(-18, -3, 8, 5); ellipse(-2, 5, 10, 6); ellipse(5, -5, 7, 5);
      ellipse(15, 10, 8, 5);
      // 麵粉灑痕裝飾
      fill(255, 255, 255, 200);
      ellipse(-8, 0, 15, 10); ellipse(-20, 8, 12, 8);
      break;

// ==========================================
    // ---- 新竹縣 Q1 (景點) ----
    // ==========================================
    case 'leofoo_village': // 六福村 (阿拉伯夢幻城堡)
      rectMode(CENTER);
      // 城堡主體城牆
      fill('#F5F6FA'); stroke('#2C3E50'); strokeWeight(2);
      rect(0, 10, 75, 40, 2);
      rect(-22, -10, 18, 50); rect(22, -10, 18, 50);
      // 金黃洋蔥頭穹頂 (阿拉伯風格)
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      ellipse(0, -15, 26, 32);
      ellipse(-22, -38, 18, 22); ellipse(22, -38, 18, 22);
      // 塔尖與新月標誌
      stroke('#E67E22'); strokeWeight(1);
      line(-22, -49, -22, -58); line(22, -49, 22, -58); line(0, -31, 0, -42);
      fill('#F1C40F'); noStroke();
      ellipse(-22, -58, 4, 4); ellipse(22, -58, 4, 4); ellipse(0, -42, 6, 6);
      // 城門
      fill('#2C3E50'); arc(0, 30, 18, 24, PI, 0);
      break;

    case 'neiwan_old_street': // 內灣老街 (經典紅橋柱內灣吊橋)
      rectMode(CENTER);
      // 藍綠色油羅溪水
      fill('#00CEC9'); stroke('#55EFC4'); strokeWeight(2);
      arc(0, 22, 90, 35, 0, PI);
      // 紅色吊橋鋼纜柱 (左右兩端)
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      rect(-32, 0, 10, 50, 2); rect(32, 0, 10, 50, 2);
      rect(0, -18, 75, 6, 2); // 橫樑
      // 橋面板與懸吊鋼索
      stroke('#D63031'); strokeWeight(1.5);
      line(-32, 10, 32, 10); // 橋身
      stroke('#636E72'); strokeWeight(1);
      for (let x = -25; x <= 25; x += 10) {
        line(x, -18, x, 10);
      }
      break;

    case 'smangus': // 司馬庫斯 (上帝的部落・千年巨木)
      rectMode(CENTER);
      // 遠山綠林背景
      fill('#27AE60'); noStroke();
      ellipse(-25, 0, 55, 60); ellipse(25, 0, 55, 60);
      // 雄偉千年紅檜樹幹
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      rect(0, 12, 32, 45, 4);
      // 樹幹年輪與木紋質感
      stroke('#5D4037'); strokeWeight(1.5);
      line(-8, -2, -8, 30); line(8, 5, 8, 32);
      // 茂密巨大樹冠
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(2);
      ellipse(0, -20, 75, 45);
      ellipse(-20, -15, 45, 35); ellipse(20, -15, 45, 35);
      break;

    case 'beipu_cold_spring': // 北埔冷泉 (氣泡冷泉與溪流)
      rectMode(CENTER);
      // 周圍天然岩石
      fill('#95A5A6'); stroke('#7F8C8D'); strokeWeight(2);
      ellipse(-35, 10, 35, 25); ellipse(35, 10, 35, 25); ellipse(0, -5, 85, 30);
      // 冰涼琥珀綠冷泉水池 (使用透明度)
      fill(0, 206, 201, 200); stroke('#55EFC4'); strokeWeight(2);
      arc(0, 15, 85, 40, 0, PI);
      // 浮動冷泉氣泡動畫
      noFill(); stroke(255, 255, 255, 220); strokeWeight(1.5);
      for (let i = -25; i <= 25; i += 12) {
        let bubbleY = 15 + sin(t * 4 + i) * 6;
        ellipse(i, bubbleY, 6, 6);
      }
      break;

    // ==========================================
    // ---- 新竹縣 Q2 (美食) ----
    // ==========================================
    case 'dried_persimmon': // 柿餅 (新埔曬柿餅金黃棚架)
      rectMode(CENTER);
      // 竹編圓形晒盤底座
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      ellipse(0, 10, 90, 48);
      // 竹盤編織網格紋路
      stroke(141, 91, 76, 120); strokeWeight(1);
      for (let i = -35; i <= 35; i += 12) {
        line(i, -10, i, 30);
      }
      // 擺滿結實橙黃色柿餅 (扁圓形)
      fill('#E67E22'); stroke('#D35400'); strokeWeight(1.5);
      let persimmons = [
        [-25, -2], [0, -4], [25, -2],
        [-15, 12], [15, 12], [0, 22]
      ];
      for (let p of persimmons) {
        ellipse(p[0], p[1], 20, 14);
        fill('#27AE60'); noStroke(); // 綠色柿蒂
        ellipse(p[0], p[1] - 4, 5, 3);
        fill('#E67E22'); stroke('#D35400');
      }
      break;

    case 'lei_cha': // 客家擂茶 (擂缽、擂棍與香濃綠茶)
      rectMode(CENTER);
      // 陶土深色擂缽
      fill('#5D4037'); stroke('#3E2723'); strokeWeight(2);
      arc(0, 10, 85, 60, 0, PI, CHORD);
      // 缽內香濃綠茶膏/茶粉
      fill('#27AE60'); stroke('#2ED573'); strokeWeight(1);
      ellipse(0, 10, 75, 18);
      // 木質擂棒 (斜插在缽中)
      stroke('#D4A574'); strokeWeight(7);
      line(-10, 8, 28, -35);
      stroke('#8D5B4C'); strokeWeight(2); // 棒頭
      ellipse(28, -35, 6, 6);
      // 芝麻與花生粒裝飾
      noStroke(); fill('#F1C40F');
      ellipse(-15, 10, 4, 4); ellipse(5, 12, 5, 5); ellipse(-5, 6, 4, 4);
      break;

    case 'ginger_lily_zongzi': // 野薑花粽 (竹葉粽與白色野薑花)
      rectMode(CENTER);
      // 翠綠野薑花粽 (立體三角粽)
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(2);
      triangle(-25, 20, 25, 20, 0, -25);
      fill('#2ED573');
      triangle(-25, 20, 0, 20, 0, -25); // 粽頁陰影折角
      // 綁粽棉線
      stroke('#FFF'); strokeWeight(1.5);
      line(-12, 20, 0, -5); line(12, 20, 0, -5);
      // 優雅白色野薑花瓣點綴
      fill('#FFF'); stroke('#FFEAA7'); strokeWeight(1);
      ellipse(18, -10, 14, 8); ellipse(24, -18, 8, 14);
      fill('#F1C40F'); noStroke(); ellipse(20, -14, 4, 4); // 花蕊
      break;

    case 'hakka_bantiao': // 客家粄條 (白嫩粄條與香氣油蔥)
      rectMode(CENTER);
      // 客家花布風格紅湯碗
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      arc(0, 10, 90, 70, 0, PI, CHORD);
      // 清澈高湯
      fill(255, 234, 167, 200); stroke('#FFEAA7'); strokeWeight(1);
      ellipse(0, 10, 85, 20);
      // Q彈寬平白色粄條
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1.5);
      rect(-20, 10, 14, 18, 3);
      rect(0, 8, 16, 20, 3);
      rect(20, 12, 14, 16, 3);
      // 靈魂香噴噴油蔥酥與韭菜
      noStroke(); fill('#8D5B4C');
      ellipse(0, 12, 12, 8); ellipse(-10, 6, 8, 6);
      fill('#27AE60'); ellipse(12, 8, 6, 6); ellipse(-18, 14, 5, 5);
      break;

// ==========================================
    // ---- 苗栗縣 Q1 (景點) ----
    // ==========================================
    case 'longteng_bridge': // 龍騰斷橋 (斷裂紅磚拱橋)
      rectMode(CENTER);
      // 周圍綠意山丘
      fill('#27AE60'); noStroke();
      ellipse(-30, 20, 45, 30); ellipse(30, 20, 45, 30);
      // 紅磚斷橋主要橋墩 (左)
      fill('#B33939'); stroke('#8B0000'); strokeWeight(2);
      rect(-22, 10, 24, 45, 2);
      // 紅磚斷橋主要橋墩 (右斷壁)
      rect(22, 5, 24, 55, 2);
      // 拱門構造
      fill('#2D3436'); noStroke();
      arc(-22, 25, 16, 20, PI, 0); arc(22, 25, 16, 20, PI, 0);
      // 上方斷裂頂部綠植
      fill('#27AE60');
      ellipse(-22, -12, 22, 8); ellipse(22, -22, 22, 8);
      // 磚塊紋路細節
      stroke('#8B0000'); strokeWeight(1);
      line(-34, -2, -10, -2); line(-34, 8, -10, 8);
      line(10, -10, 34, -10); line(10, 0, 34, 0);
      break;

    case 'shengxing_station': // 勝興車站 (木造鐵道車站)
      rectMode(CENTER);
      // 木造車站主體
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      rect(0, 10, 75, 40, 3);
      // 深色日式木屋頂
      fill('#3E2723'); stroke('#1B0000');
      triangle(-45, -10, 45, -10, 0, -35);
      // 站房大門與木窗
      fill('#FFEAA7'); stroke('#5D4037'); strokeWeight(1.5);
      rect(0, 18, 18, 24, 4, 4, 0, 0); // 門
      rect(-24, 10, 14, 14); rect(24, 10, 14, 14); // 窗
      // 站牌
      fill('#FFF'); stroke('#2D3436'); strokeWeight(1);
      rect(0, -5, 24, 10, 2);
      fill('#D63031'); noStroke(); ellipse(0, -5, 4, 4); // 站牌標誌
      break;

    case 'flying_cow': // 飛牛牧場 (可愛乳牛與青草地)
      rectMode(CENTER);
      // 青青草原
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(2);
      arc(0, 20, 90, 40, 0, PI);
      // 乳牛微幅晃動動畫
      let cowY = sin(t * 3) * 2;
      // 白嫩圓滾乳牛身體
      fill('#FFF'); stroke('#2D3436'); strokeWeight(2);
      ellipse(0, 5 + cowY, 46, 32);
      // 牛頭與耳朵
      ellipse(-22, -5 + cowY, 22, 20);
      fill('#FFB8B8'); ellipse(-28, -2 + cowY, 12, 8); // 粉紅嘴巴
      fill('#2D3436'); ellipse(-20, -13 + cowY, 6, 10); // 耳朵
      // 黑色乳牛斑紋
      fill('#2D3436'); noStroke();
      ellipse(-5, 0 + cowY, 14, 12);
      ellipse(12, 8 + cowY, 12, 14);
      ellipse(8, -4 + cowY, 10, 8);
      break;

    case 'huoyan_mountain': // 火炎山 (惡地赤紅鋸齒山峰)
      rectMode(CENTER);
      // 夕陽天空背景
      fill('#FFEAA7'); noStroke();
      ellipse(0, 10, 85, 55);
      // 後層赤紅山峰
      fill('#E67E22'); stroke('#D35400'); strokeWeight(1.5);
      triangle(-40, 30, 0, 30, -20, -30);
      triangle(0, 30, 40, 30, 20, -20);
      // 前層火炎山劇烈侵蝕鋸齒惡地
      fill('#D63031'); stroke('#C0392B'); strokeWeight(2);
      beginShape();
      vertex(-45, 30);
      vertex(-30, -10); vertex(-20, 10);
      vertex(-5, -40); vertex(5, 5);
      vertex(25, -25); vertex(45, 30);
      endShape(CLOSE);
      // 礫石溝壑紋理
      stroke('#900C3F'); strokeWeight(1.5);
      line(-5, -40, -2, 20); line(-30, -10, -22, 25); line(25, -25, 20, 25);
      break;

    // ==========================================
    // ---- 苗栗縣 Q2 (美食) ----
    // ==========================================
    case 'dahu_strawberry': // 大湖草莓 (鮮紅欲滴大草莓)
      rectMode(CENTER);
      let berryY = sin(t * 3) * 3;
      // 草莓主體
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      beginShape();
      vertex(0 + berryY * 0.1, 30 + berryY);
      bezierVertex(-35, 10 + berryY, -30, -25 + berryY, 0, -18 + berryY);
      bezierVertex(30, -25 + berryY, 35, 10 + berryY, 0 + berryY * 0.1, 30 + berryY);
      endShape(CLOSE);
      // 綠色草莓蒂頭葉片
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(1.5);
      triangle(0, -18 + berryY, -18, -30 + berryY, -6, -18 + berryY);
      triangle(0, -18 + berryY, 18, -30 + berryY, 6, -18 + berryY);
      triangle(0, -18 + berryY, 0, -32 + berryY, 0, -18 + berryY);
      // 點點籽粒
      fill('#F1C40F'); noStroke();
      ellipse(-10, -5 + berryY, 3, 4); ellipse(10, -5 + berryY, 3, 4);
      ellipse(0, 5 + berryY, 3, 4); ellipse(-12, 12 + berryY, 3, 4);
      ellipse(12, 12 + berryY, 3, 4); ellipse(0, 20 + berryY, 3, 4);
      break;

    case 'hakka_mochi': // 客家麻糬 (糍粑與花生芝麻粉)
      rectMode(CENTER);
      // 木質扁盤
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      ellipse(0, 12, 90, 45);
      // 軟Q白嫩客家麻糬塊
      fill('#F5F6FA'); stroke('#DFE6E9'); strokeWeight(1.5);
      ellipse(-20, 8, 30, 22); ellipse(20, 8, 30, 22); ellipse(0, 2, 36, 26);
      // 濃郁花生芝麻粉灑落點綴
      noStroke(); fill('#E67E22');
      ellipse(-5, 0, 16, 10); ellipse(15, 6, 14, 8); ellipse(-18, 5, 12, 8);
      fill('#2D3436');
      ellipse(2, 2, 4, 4); ellipse(-10, 8, 3, 3); ellipse(10, 10, 4, 4);
      break;

    case 'asian_pear': // 卓蘭水梨 (多汁豐盈水梨)
      rectMode(CENTER);
      let pearY = sin(t * 2.5) * 2;
      // 水梨果實
      fill('#F7DC6F'); stroke('#D4AC0D'); strokeWeight(2);
      ellipse(0, 8 + pearY, 60, 54);
      ellipse(0, -8 + pearY, 44, 38);
      // 果蒂與綠葉
      stroke('#8D5B4C'); strokeWeight(3);
      line(0, -22 + pearY, 5, -35 + pearY);
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(1);
      ellipse(12, -30 + pearY, 16, 10);
      // 水梨表皮細微點點與光澤
      noStroke(); fill(255, 255, 255, 180);
      ellipse(-12, -8 + pearY, 8, 12);
      fill('#B7950B');
      ellipse(10, 5 + pearY, 2, 2); ellipse(-15, 12 + pearY, 2, 2); ellipse(5, 20 + pearY, 2, 2);
      break;

    case 'belly_cake': // 肚仔餅 / 綠豆餅 (客家傳統凸肚餅)
      rectMode(CENTER);
      // 陶瓷瓷盤底座
      fill('#FFF'); stroke('#74B9FF'); strokeWeight(2);
      ellipse(0, 15, 90, 40);
      // 金黃酥皮餅身
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      ellipse(0, 8, 65, 36);
      // 中央特徵「凸出的綠豆餡肚仔」
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      ellipse(0, 0, 32, 20);
      // 酥皮微裂紋路
      stroke('#B7950B'); strokeWeight(1);
      line(-12, 0, -6, -4); line(6, 2, 14, -2);
      break;

// ==========================================
    // ---- 南投縣 Q1 (景點) ----
    // ==========================================
    case 'sun_moon_lake': // 日月潭 (日輪彎月高山湖)
      push();
      rectMode(CENTER);
      // 青翠群山
      fill('#27AE60'); noStroke();
      ellipse(-25, -10, 50, 40); ellipse(25, -10, 50, 40);
      // 高山湛藍湖水
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      arc(0, 15, 90, 45, 0, PI);
      // 日與月意象
      fill('#F1C40F'); noStroke();
      ellipse(-15, -15, 20, 20); // 日輪
      fill('#FFF'); arc(15, -15, 18, 18, -HALF_PI, HALF_PI); // 彎月
      fill('#27AE60'); ellipse(12, -15, 14, 16); // 遮罩出月牙
      pop();
      break;

    case 'chingjing': // 清境農場 (綠色高山與可愛棉花羊)
      push();
      rectMode(CENTER);
      // 高山草原
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(2);
      arc(0, 20, 90, 40, 0, PI);
      // 可愛小綿羊 (浮動動畫)
      let sheepY = sin(t * 3) * 2;
      // 羊毛身軀
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(2);
      ellipse(0, 5 + sheepY, 36, 26);
      ellipse(-8, 0 + sheepY, 18, 18); ellipse(8, 0 + sheepY, 18, 18);
      // 黑色小羊頭
      fill('#2D3436'); noStroke();
      ellipse(18, 2 + sheepY, 14, 12);
      fill('#FFF'); ellipse(20, 0 + sheepY, 3, 3); // 眼睛
      // 羊腳
      stroke('#2D3436'); strokeWeight(2);
      line(-10, 15 + sheepY, -10, 22 + sheepY);
      line(5, 15 + sheepY, 5, 22 + sheepY);
      pop();
      break;

    case 'monster_village': // 溪頭妖怪村 (紅色日式鳥居與天狗)
      push();
      rectMode(CENTER);
      // 背景高聳杉木
      fill('#1E8449'); noStroke();
      triangle(-30, 20, -30, -30, -42, 20);
      triangle(30, 20, 30, -30, 42, 20);
      // 日式朱紅鳥居
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      rect(0, -22, 80, 10, 2); // 上橫樑
      rect(0, -12, 70, 7); // 下橫樑
      rect(-24, 8, 10, 45); rect(24, 8, 10, 45); // 立柱
      // 天狗面具
      fill('#D63031'); stroke('#900C3F'); strokeWeight(1.5);
      ellipse(0, 0, 20, 22);
      fill('#FFF'); noStroke(); ellipse(-4, -2, 4, 4); ellipse(4, -2, 4, 4);
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2); line(0, 0, 0, 10);
      pop();
      break;

    case 'hehuan_mountain': // 合歡山 (高山雪景與壯麗雲海)
      push();
      rectMode(CENTER);
      // 蔚藍天空
      fill('#74B9FF'); noStroke(); ellipse(0, 0, 85, 75);
      // 壯麗高山連峰
      fill('#34495E'); stroke('#2C3E50'); strokeWeight(2);
      triangle(-45, 30, 5, 30, -20, -30);
      triangle(-15, 30, 45, 30, 15, -20);
      // 白雪皚皚山頂
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      triangle(-20, -30, -28, -12, -12, -12);
      triangle(15, -20, 7, -5, 23, -5);
      // 下方飄渺雲海
      fill(255, 255, 255, 220); noStroke();
      ellipse(-25, 25, 45, 25); ellipse(15, 25, 55, 30); ellipse(0, 28, 65, 25);
      pop();
      break;

    // ==========================================
    // ---- 南投縣 Q2 (美食) ----
    // ==========================================
    case 'ruby_black_tea': // 紅玉紅茶 (台茶18號香醇茶湯)
      push();
      rectMode(CENTER);
      let teaY = sin(t * 3) * 2;
      // 紅棕色茶壺
      fill('#632A15'); stroke('#3E2723'); strokeWeight(2);
      ellipse(-12, 5 + teaY, 44, 34); // 壺身
      rect(-12, -14 + teaY, 18, 6, 2); // 壺蓋
      ellipse(-12, -18 + teaY, 8, 6); // 壺鈕
      // 壺嘴與壺把
      noFill(); stroke('#632A15'); strokeWeight(4);
      bezier(-32, 5 + teaY, -40, -5 + teaY, -35, -12 + teaY, -28, -10 + teaY);
      arc(8, 5 + teaY, 20, 24, -HALF_PI, HALF_PI);
      // 亮紅寶石茶湯瓷杯
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(1.5);
      rect(22, 12 + teaY, 24, 18, 2, 2, 6, 6);
      fill('#D63031'); noStroke(); ellipse(22, 6 + teaY, 20, 6); // 暖紅茶湯
      pop();
      break;

    case 'sweet_potato_bun': // 竹山番薯包 (黃/紫香Q地瓜包)
      push();
      rectMode(CENTER);
      // 蒸籠底座
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      ellipse(0, 15, 90, 40);
      // 香Q地瓜包 (黃色金薯)
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(2);
      ellipse(-18, 5, 36, 28);
      fill('#E67E22'); noStroke(); ellipse(-18, -4, 10, 6);
      // 香Q紫薯包 (紫色地瓜)
      fill('#9B59B6'); stroke('#8E44AD'); strokeWeight(2);
      ellipse(18, 5, 36, 28);
      fill('#8E44AD'); noStroke(); ellipse(18, -4, 10, 6);
      // 蒸氣裊裊動畫
      stroke(255, 255, 255, 180); strokeWeight(2); noFill();
      let steamY = sin(t * 4) * 3;
      bezier(-18, -10, -22, -18 + steamY, -14, -24 + steamY, -18, -30 + steamY);
      bezier(18, -10, 14, -18 + steamY, 22, -24 + steamY, 18, -30 + steamY);
      pop();
      break;

    case 'shaoxing_wine': // 埔里紹興酒 (古色古香陶甕酒壺)
      push();
      rectMode(CENTER);
      let wineY = sin(t * 2.5) * 2;
      // 朱紅/赤陶醇酒甕
      fill('#D63031'); stroke('#78281F'); strokeWeight(2);
      ellipse(0, 10 + wineY, 55, 45); // 甕身
      rect(0, -18 + wineY, 26, 16, 2); // 甕頸
      // 紅布封口與綁繩
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(1.5);
      rect(0, -26 + wineY, 32, 10, 3);
      stroke('#F1C40F'); strokeWeight(2); line(-16, -21 + wineY, 16, -21 + wineY);
      // 「紹興」紅酒標
      fill('#F1C40F'); stroke('#D63031'); strokeWeight(1);
      rect(0, 10 + wineY, 22, 22, 2);
      fill('#D63031'); noStroke(); rect(0, 10 + wineY, 8, 8);
      pop();
      break;

    case 'dongding_oolong': // 凍頂烏龍茶 (紫砂壺與金黃高山茶湯)
      push();
      rectMode(CENTER);
      // 紫砂功夫茶壺
      fill('#6E2C00'); stroke('#4A235A'); strokeWeight(2);
      ellipse(-10, 5, 42, 32); // 壺身
      rect(-10, -13, 16, 6, 2); // 壺蓋
      ellipse(-10, -17, 6, 5); // 壺鈕
      // 壺嘴與壺把
      noFill(); stroke('#6E2C00'); strokeWeight(3.5);
      bezier(-28, 5, -36, -5, -32, -12, -24, -10);
      arc(8, 5, 18, 22, -HALF_PI, HALF_PI);
      // 金黃清亮烏龍茶品茗杯
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(1.5);
      rect(22, 12, 22, 18, 2, 2, 5, 5);
      fill('#F1C40F'); noStroke(); ellipse(22, 6, 18, 5); // 金黃茶湯
      // 緊結半球形烏龍茶葉顆粒
      fill('#1E8449'); stroke('#145A32'); strokeWeight(1);
      ellipse(-5, 22, 8, 6); ellipse(8, 24, 7, 5); ellipse(-18, 24, 6, 5);
      pop();
      break;

     // ==========================================
    // ---- 彰化縣 Q1 (景點) ----
    // ==========================================
    case 'bagua_buddha': // 八卦山大佛 (莊嚴黑朝尊像與蓮花座)
      push();
      rectMode(CENTER);
      // 背後佛光光暈
      fill(241, 196, 15, 120); noStroke();
      ellipse(0, -12, 60, 60);
      // 粉紅/金黃蓮花台座
      fill('#FF7675'); stroke('#D63031'); strokeWeight(1.5);
      ellipse(0, 24, 75, 20);
      fill('#F1C40F'); stroke('#E67E22');
      ellipse(0, 18, 65, 14);
      // 大佛盤坐身軀與黑朝法衣
      fill('#2D3436'); stroke('#636E72'); strokeWeight(2);
      ellipse(0, 8, 48, 30); // 腿部盤坐
      rect(0, -5, 30, 24, 5); // 袈裟身軀
      // 佛頭與肉髻
      ellipse(0, -20, 22, 24);
      ellipse(0, -32, 10, 10);
      // 佛顏與眉心白毫
      fill('#F1C40F'); noStroke();
      ellipse(0, -22, 3, 3);
      pop();
      break;

    case 'lukang_temple': // 鹿港天后宮 (閩南古剎與燕尾飛檐)
      push();
      rectMode(CENTER);
      // 朱紅紅磚牆面與大門
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      rect(0, 10, 75, 38, 2);
      fill('#2D3436'); arc(0, 20, 20, 28, PI, 0); // 主門
      fill('#FFEAA7'); rect(-22, 10, 10, 18); rect(22, 10, 10, 18); // 花窗
      // 閩南經典雙層燕尾廟宇屋頂
      fill('#D63031'); stroke('#900C3F'); strokeWeight(2);
      beginShape();
      vertex(-45, -8); bezierVertex(-20, -18, 20, -18, 45, -8);
      vertex(38, -25); bezierVertex(15, -35, -15, -35, -38, -25);
      endShape(CLOSE);
      // 廟頂金黃寶塔與龍頭裝飾
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      rect(0, -30, 12, 12, 2); triangle(-8, -36, 8, -36, 0, -45);
      pop();
      break;

    case 'fan_roundhouse': // 扇形車庫 (火車轉車台與蒸氣火車頭)
      push();
      rectMode(CENTER);
      // 圓形轉車台底座
      fill('#95A5A6'); stroke('#7F8C8D'); strokeWeight(2);
      ellipse(0, 10, 85, 55);
      // 轉車台軌道 (微幅旋轉動畫)
      let railRot = sin(t * 1.5) * 0.15;
      push();
      translate(0, 10);
      rotate(railRot);
      stroke('#34495E'); strokeWeight(4); line(-35, 0, 35, 0); // 旋轉主鐵軌
      // 黑色與復古紅蒸氣火車頭
      fill('#2D3436'); stroke('#1A252F'); strokeWeight(1.5);
      rect(0, -12, 32, 20, 3); // 車廂
      fill('#E74C3C'); rect(-10, -20, 8, 12); // 煙囪
      pop();
      pop();
      break;

    case 'wanggong_port': // 王功漁港 (芳苑黑白條紋燈塔與光芒)
      push();
      rectMode(CENTER);
      // 藍海波浪
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      arc(0, 25, 90, 30, 0, PI);
      // 八角形黑白相間條紋燈塔
      fill('#F5F6FA'); stroke('#2D3436'); strokeWeight(2);
      beginShape();
      vertex(-12, 25); vertex(-8, -25); vertex(8, -25); vertex(12, 25);
      endShape(CLOSE);
      // 黑色條紋
      fill('#2D3436'); noStroke();
      quad(-11, 10, 11, 10, 10, -2, -10, -2);
      quad(-9, -12, 9, -12, 8, -22, -8, -22);
      // 頂部燈室與旋轉光束
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      rect(0, -30, 14, 10, 2);
      fill(241, 196, 15, 120); noStroke();
      let lightAngle = (t * 3) % TWO_PI;
      arc(0, -30, 80, 80, lightAngle, lightAngle + HALF_PI);
      pop();
      break;

    // ==========================================
    // ---- 彰化縣 Q2 (美食) ----
    // ==========================================
    case 'changhua_ba_wan': // 彰化肉圓 (油炸Q彈透明皮與紅白甜醬)
      push();
      rectMode(CENTER);
      // 淺醬油碟
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 12, 90, 42);
      // 油炸晶瑩透明肉圓皮
      fill(245, 246, 250, 230); stroke('#DFE6E9'); strokeWeight(2);
      ellipse(0, 5, 68, 40);
      // 隱約透出的竹筍鮮肉餡
      fill('#E17055'); noStroke(); ellipse(0, 8, 38, 20);
      // 淋上彰化特色甜白醬與甜紅醬
      fill(255, 255, 255, 220); ellipse(-10, 0, 30, 14); // 白醬
      fill('#E74C3C'); ellipse(12, 2, 28, 12); // 紅醬
      // 香菜點綴
      fill('#2ED573'); ellipse(-5, 6, 6, 6); ellipse(8, -2, 5, 5); ellipse(2, 10, 4, 4);
      pop();
      break;

    case 'ox_tongue_pastry': // 鹿港牛舌餅 (金黃香酥橢圓餅)
      push();
      rectMode(CENTER);
      // 白色擺盤
      fill('#FFF'); stroke('#74B9FF'); strokeWeight(2);
      ellipse(0, 15, 90, 38);
      // 橢圓長型金黃牛舌餅
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      ellipse(8, 8, 70, 24); // 下層
      ellipse(-8, 0, 72, 26); // 上層
      // 餅皮中間麥芽餡劃口裂紋
      fill('#8D5B4C'); noStroke();
      ellipse(-8, 0, 40, 5);
      fill('#FFEAA7'); ellipse(-8, 0, 34, 3);
      // 焦香烤痕細節
      fill('#8D5B4C');
      ellipse(-25, -2, 6, 4); ellipse(10, 2, 8, 4); ellipse(15, 10, 6, 4);
      pop();
      break;

    case 'rat_noodles': // 貓鼠麵 (清醇高湯與經典三寶丸)
      push();
      rectMode(CENTER);
      // 傳統復古花碗
      fill('#F5F6FA'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 10, 90, 70, 0, PI, CHORD);
      // 豬骨熬製金黃高湯
      fill(255, 234, 167, 220); stroke('#FFEAA7'); strokeWeight(1);
      ellipse(0, 10, 85, 20);
      // 細油黃麵條
      stroke('#F1C40F'); strokeWeight(2); noFill();
      for (let i = -25; i <= 25; i += 8) {
        bezier(i, 10, i + 5, -2, i - 5, 15, i, 18);
      }
      // 貓鼠麵靈魂三寶丸：燕丸、貢丸、雞卷
      fill('#FFB8B8'); stroke('#E17055'); strokeWeight(1.5);
      ellipse(-18, 5, 18, 18); // 燕丸
      ellipse(0, 0, 18, 18); // 貢丸
      fill('#E67E22'); stroke('#D35400');
      rect(18, 5, 16, 16, 4); // 雞卷
      // 蔥花與香油
      noStroke(); fill('#2ED573'); ellipse(-5, 12, 5, 5); ellipse(10, 10, 4, 4);
      pop();
      break;

    case 'braised_pork_rice': // 爌肉飯 (竹籤三層爌肉與黃澤庵漬)
      push();
      rectMode(CENTER);
      // 陶瓷飯碗 (修復贅字錯誤)
      fill('#F5F6FA'); stroke('#2C3E50'); strokeWeight(2);
      arc(0, 12, 85, 60, 0, PI, CHORD);
      // 白米飯
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      arc(0, 12, 80, 24, PI, 0, CHORD);
      // 爌肉本體 (三層肉：皮、油脂、瘦肉)
      fill('#5D4037'); stroke('#3E2723'); strokeWeight(2); // 滷香豬皮層
      rect(0, -6, 42, 12, 4);
      fill(255, 234, 167, 240); stroke('#8D5B4C'); strokeWeight(1); // 肥肉層
      rect(0, 0, 40, 8);
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(1.5); // 瘦肉層
      rect(0, 7, 44, 10, 2);
      // 穿過爌肉固定用的木竹籤
      stroke('#D4A574'); strokeWeight(2.5);
      line(-25, 0, 25, 0);
      // 彰化爌肉飯靈魂標配：醃黃蘿蔔
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      arc(-22, 10, 18, 18, -HALF_PI, HALF_PI);
      pop();
      break; 

// ==========================================
    // ---- 雲林縣 Q1 (景點) ----
    // ==========================================
    case 'glove_puppetry': // 布袋戲 (掌中戲木偶與華麗頭冠)
      push();
      rectMode(CENTER);
      let headTilt = sin(t * 3) * 0.08;
      rotate(headTilt);
      // 刺繡戲服身軀
      fill('#D63031'); stroke('#B33939'); strokeWeight(2);
      quad(-25, 30, 25, 30, 15, -5, -15, -5);
      fill('#F1C40F'); noStroke();
      rect(0, 15, 8, 28); // 金線繡邊
      // 木偶頭部
      fill('#FFEAA7'); stroke('#D4A574'); strokeWeight(1.5);
      ellipse(0, -18, 22, 26);
      // 華麗頭冠
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      rect(0, -32, 28, 12, 3);
      ellipse(0, -38, 10, 10);
      fill('#E74C3C'); noStroke(); ellipse(-10, -32, 6, 6); ellipse(10, -32, 6, 6);
      // 五官
      stroke('#2D3436'); strokeWeight(1);
      line(-6, -18, -2, -18); line(2, -18, 6, -18);
      fill('#D63031'); noStroke(); ellipse(0, -12, 5, 3);
      pop();
      break;

    case 'janfusun': // 劍湖山世界 (摩天輪與彩虹車廂)
      push();
      rectMode(CENTER);
      // A字型底座支架
      stroke('#636E72'); strokeWeight(3);
      line(-20, 35, 0, 0); line(20, 35, 0, 0);
      // 摩天輪鋼圈旋轉動畫
      push();
      rotate(t * 0.8);
      noFill(); stroke('#0984E3'); strokeWeight(2);
      ellipse(0, 0, 60, 60);
      stroke('#74B9FF'); strokeWeight(1);
      for (let a = 0; a < TWO_PI; a += PI / 4) {
        line(0, 0, cos(a) * 30, sin(a) * 30);
      }
      // 8 個彩色車廂
      let wheelColors = ['#FF7675', '#FDCB6E', '#55EFC4', '#74B9FF'];
      for (let i = 0; i < 8; i++) {
        let angle = i * (TWO_PI / 8);
        let cx = cos(angle) * 30;
        let cy = sin(angle) * 30;
        fill(wheelColors[i % 4]); stroke('#2D3436'); strokeWeight(1);
        ellipse(cx, cy, 8, 8);
      }
      pop();
      // 中心軸點
      fill('#2D3436'); noStroke(); ellipse(0, 0, 8, 8);
      pop();
      break;

    case 'beigang_temple': // 北港朝天宮 (媽祖廟與紅燈籠)
      push();
      rectMode(CENTER);
      // 紅磚廟宇牆面
      fill('#C0392B'); stroke('#900C3F'); strokeWeight(2);
      rect(0, 12, 75, 36, 2);
      fill('#2D3436'); arc(0, 20, 22, 26, PI, 0); // 中央大門
      fill('#FFEAA7'); rect(-24, 12, 8, 16); rect(24, 12, 8, 16); // 雕花窗
      // 重簷飛檐屋頂
      fill('#F1C40F'); stroke('#D35400'); strokeWeight(2);
      beginShape();
      vertex(-42, -5); bezierVertex(-20, -15, 20, -15, 42, -5);
      vertex(35, -22); bezierVertex(15, -30, -15, -30, -38, -22);
      endShape(CLOSE);
      // 懸掛紅燈籠 (微搖晃)
      let lanternSwing = sin(t * 3) * 3;
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(1);
      ellipse(-28 + lanternSwing, -2, 10, 14); ellipse(28 + lanternSwing, -2, 10, 14);
      pop();
      break;

    case 'xiluo_bridge': // 西螺大橋 (虹橋鋼桁架與濁水溪)
      push();
      rectMode(CENTER);
      // 濁水溪水面
      fill('#74B9FF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 25, 90, 30, 0, PI);
      // 西螺紅鋼鐵桁架拱橋
      noFill(); stroke('#D63031'); strokeWeight(3);
      arc(-22, 15, 44, 35, PI, TWO_PI);
      arc(22, 15, 44, 35, PI, TWO_PI);
      // 橋面
      stroke('#B33939'); strokeWeight(3.5);
      line(-45, 15, 45, 15);
      // 桁架鋼索交錯細節
      stroke('#D63031'); strokeWeight(1);
      for (let x = -40; x <= 40; x += 10) {
        line(x, 15, x, 3);
      }
      pop();
      break;

    // ==========================================
    // ---- 雲林縣 Q2 (美食) ----
    // ==========================================
    case 'gukeng_coffee': // 古坑咖啡 (香醇熱咖啡與咖啡豆)
      push();
      rectMode(CENTER);
      let cupY = sin(t * 2.5) * 2;
      // 陶瓷咖啡盤
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 20 + cupY, 70, 24);
      // 咖啡杯身與杯把
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      rect(0, 6 + cupY, 44, 28, 2, 2, 8, 8);
      noFill(); stroke('#B2BEC3'); strokeWeight(3);
      arc(22, 6 + cupY, 16, 18, -HALF_PI, HALF_PI);
      // 香醇深棕咖啡液
      fill('#632A15'); noStroke();
      ellipse(0, -6 + cupY, 40, 10);
      // 升騰蒸氣動畫 (使用 RGBA 透明度)
      stroke(255, 255, 255, 180); strokeWeight(2); noFill();
      let s = sin(t * 4) * 2;
      bezier(-8, -10 + cupY, -12, -18 + cupY + s, -4, -24 + cupY + s, -8, -30 + cupY + s);
      bezier(8, -10 + cupY, 4, -18 + cupY + s, 12, -24 + cupY + s, 8, -30 + cupY + s);
      // 旁邊深焙咖啡豆
      fill('#3E2723'); stroke('#1B0000'); strokeWeight(1);
      ellipse(-28, 20 + cupY, 12, 8);
      stroke('#FFF'); strokeWeight(0.8); line(-31, 20 + cupY, -25, 20 + cupY);
      pop();
      break;

    case 'xiluo_soy_sauce': // 西螺醬油 (黑陶古法釀造醬油甕)
      push();
      rectMode(CENTER);
      let jarY = sin(t * 2) * 2;
      // 古法醬油黑陶甕
      fill('#3E2723'); stroke('#1B0000'); strokeWeight(2);
      ellipse(0, 8 + jarY, 52, 44); // 甕身
      rect(0, -18 + jarY, 26, 14, 2); // 甕頸
      // 傳統紅布封口與麻繩綁紮
      fill('#D63031'); stroke('#900C3F'); strokeWeight(1.5);
      rect(0, -25 + jarY, 32, 10, 3);
      stroke('#F1C40F'); strokeWeight(2); line(-16, -20 + jarY, 16, -20 + jarY);
      // 「醬」字黃標
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      rect(0, 8 + jarY, 22, 22, 2);
      fill('#D63031'); noStroke(); rect(0, 8 + jarY, 8, 8);
      pop();
      break;

    case 'beigang_peanut': // 北港花生 (雙節飽滿花生莢與花生仁)
      push();
      rectMode(CENTER);
      rotate(-PI / 8);
      // 金黃香脆花生殼 (雙節八字形)
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      ellipse(-15, 0, 36, 28); ellipse(15, 0, 38, 30);
      ellipse(0, 0, 30, 22); // 中央銜接
      // 花生網紋刻痕
      stroke('#8D5B4C'); strokeWeight(1);
      line(-25, -4, -5, -4); line(-25, 4, -5, 4);
      line(5, -4, 25, -4); line(5, 4, 25, 4);
      // 旁邊露出的紅衣花生仁
      fill('#C0392B'); stroke('#900C3F'); strokeWeight(1.5);
      ellipse(25, 18, 16, 12);
      pop();
      break;

    case 'douliu_pomelo': // 斗六文旦 (老樹水蜜文旦柚)
      push();
      rectMode(CENTER);
      let pY = sin(t * 2.5) * 2;
      // 水滴/洋梨型鮮綠文旦果實
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(2);
      beginShape();
      vertex(0, -30 + pY);
      bezierVertex(25, -15 + pY, 35, 15 + pY, 0, 25 + pY);
      bezierVertex(-35, 15 + pY, -25, -15 + pY, 0, -30 + pY);
      endShape(CLOSE);
      // 棕色果蒂與深綠嫩葉
      stroke('#8D5B4C'); strokeWeight(3);
      line(0, -30 + pY, 0, -38 + pY);
      fill('#1E8449'); stroke('#145A32'); strokeWeight(1);
      ellipse(8, -34 + pY, 14, 8);
      // 柚子毛孔與亮光細節 (RGBA 透明度)
      fill(255, 255, 255, 160); noStroke();
      ellipse(-8, -5 + pY, 6, 12);
      fill('#1E8449');
      ellipse(10, 8 + pY, 2, 2); ellipse(-10, 12 + pY, 2, 2); ellipse(2, 18 + pY, 2, 2);
      pop();
      break;

// ==========================================
    // ---- 嘉義市 Q1 (景點) ----
    // ==========================================
    case 'hinoki_village': // 檜意森活村 (日式檜木官舍與松樹)
      push();
      rectMode(CENTER);
      // 日式黑瓦屋頂
      fill('#2D3436'); stroke('#1E272C'); strokeWeight(2);
      triangle(-45, -5, 45, -5, 0, -35);
      // 檜木木造建築身軀
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      rect(0, 15, 75, 40, 2);
      // 紙障子拉門 (Shoji Window)
      fill('#FFEAA7'); stroke('#5D4037'); strokeWeight(1.5);
      rect(-20, 15, 22, 24, 2); rect(20, 15, 22, 24, 2);
      stroke('#5D4037'); strokeWeight(1);
      line(-20, 3, -20, 27); line(-31, 15, -9, 15);
      line(20, 3, 20, 27); line(9, 15, 31, 15);
      // 旁邊可愛小松樹
      fill('#1E8449'); noStroke();
      ellipse(-38, 20, 20, 25); ellipse(-38, 10, 16, 20);
      pop();
      break;

    case 'sun_shooting_tower': // 射日塔 (青銅神木造型高塔)
      push();
      rectMode(CENTER);
      let towerY = sin(t * 2) * 1.5;
      // 雙柱塔身結構
      fill('#B2BEC3'); stroke('#636E72'); strokeWeight(2);
      rect(-16, 5 + towerY, 14, 70, 3); rect(16, 5 + towerY, 14, 70, 3);
      // 頂部圓形環狀觀察台
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(2);
      ellipse(0, -32 + towerY, 48, 20);
      fill('#E67E22'); ellipse(0, -35 + towerY, 32, 10);
      // 中央青銅射日神木雕空圖騰
      fill('#D35400'); noStroke();
      rect(0, 5 + towerY, 12, 50, 4);
      fill('#F1C40F'); ellipse(0, -10 + towerY, 8, 8); // 射日太陽圖騰
      pop();
      break;

    case 'chiayi_art_museum': // 嘉義市立美術館 (古蹟石造與現代弧形玻璃)
      push();
      rectMode(CENTER);
      // 古典黃石基底主體
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      rect(0, 12, 80, 40, 4);
      // 上方湖水綠曲面玻璃帷幕 (使用 RGBA 透明度)
      fill(0, 206, 201, 180); stroke('#81ECEC'); strokeWeight(1.5);
      arc(0, -8, 76, 35, PI, TWO_PI);
      // 玻璃網格幾何線條
      stroke('#00CEC9'); strokeWeight(1);
      for (let x = -30; x <= 30; x += 15) {
        line(x, -8, x, -24);
      }
      // 圓拱典雅門窗
      fill('#2D3436'); noStroke();
      arc(-24, 18, 14, 20, PI, 0); arc(0, 18, 16, 22, PI, 0); arc(24, 18, 14, 20, PI, 0);
      pop();
      break;

    case 'beimen_station': // 北門驛 (森林鐵路綠木造車站與紅頭小火車)
      push();
      rectMode(CENTER);
      // 湖水綠/日式木造車站
      fill('#55EFC4'); stroke('#00CEC9'); strokeWeight(2);
      rect(0, -5, 75, 40, 3);
      fill('#2D3436'); stroke('#1B0000'); // 黑瓦雙層屋頂
      triangle(-45, -25, 45, -25, 0, -48);
      // 站房窗戶與門
      fill('#FFEAA7'); stroke('#00CEC9'); strokeWeight(1);
      rect(-20, -5, 14, 16); rect(20, -5, 14, 16);
      rect(0, 0, 16, 26, 4, 4, 0, 0);
      // 駛過前方的阿里山復古紅柴油火車頭
      let trainX = sin(t * 2) * 4;
      fill('#D63031'); stroke('#B33939'); strokeWeight(1.5);
      rect(trainX, 22, 50, 22, 4);
      fill('#FFEAA7'); noStroke(); // 車窗
      rect(trainX - 12, 18, 10, 8); rect(trainX + 2, 18, 10, 8); rect(trainX + 16, 18, 10, 8);
      fill('#2D3436'); ellipse(trainX - 15, 33, 8, 8); ellipse(trainX + 15, 33, 8, 8); // 車輪
      pop();
      break;

    // ==========================================
    // ---- 嘉義市 Q2 (美食) ----
    // ==========================================
    case 'turkey_rice': // 火雞肉飯 (香噴噴鮮嫩火雞肉絲飯)
      push();
      rectMode(CENTER);
      // 復古青花瓷飯碗
      fill('#F5F6FA'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 12, 85, 60, 0, PI, CHORD);
      // 晶瑩白米飯
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      arc(0, 12, 80, 24, PI, 0, CHORD);
      // 鮮嫩火雞肉絲 (層疊絲狀擬真效果)
      fill('#FFF3E0'); stroke('#D4A574'); strokeWeight(1.5);
      ellipse(-12, 2, 26, 10); ellipse(10, 0, 28, 12); ellipse(0, 6, 32, 10);
      // 靈魂香油蔥酥與雞油醬汁
      noStroke(); fill('#E67E22');
      ellipse(-5, 2, 12, 6); ellipse(12, 6, 10, 5); ellipse(2, -2, 8, 4);
      // 嘉義火雞肉飯標配：醃黃蘿蔔 (澤庵漬)
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      arc(-24, 8, 18, 18, -HALF_PI, HALF_PI);
      pop();
      break;

    case 'casserole_fish_head': // 砂鍋魚頭 (古早味砂鍋與香酥大魚頭)
      push();
      rectMode(CENTER);
      // 赤陶砂鍋底座
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2.5);
      arc(0, 10, 90, 65, 0, PI, CHORD);
      rect(-46, 0, 10, 16, 3); rect(46, 0, 10, 16, 3); // 鍋耳
      // 沙茶濃郁金黃高湯
      fill('#D35400'); stroke('#E67E22'); strokeWeight(1);
      ellipse(0, 10, 85, 22);
      // 香酥炸大魚頭 (露在湯面)
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      triangle(-25, 12, 5, -20, 20, 12);
      fill('#2D3436'); noStroke(); ellipse(-8, -4, 5, 5); // 魚眼
      // 大白菜、豆腐與黑木耳配料
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1); rect(18, 5, 16, 14, 2); // 豆腐
      fill('#27AE60'); noStroke(); ellipse(-15, 10, 14, 10); // 白菜
      fill('#2D3436'); ellipse(5, 14, 12, 8); // 木耳
      pop();
      break;

    case 'cuboid_pastry': // 方塊酥 (多層香酥方塊餅)
      push();
      rectMode(CENTER);
      // 白色擺盤
      fill('#FFF'); stroke('#74B9FF'); strokeWeight(2);
      ellipse(0, 15, 90, 38);
      // 疊放的黃金香酥方塊酥
      push();
      translate(-12, 4); rotate(-PI / 16);
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(1.5);
      rect(0, 0, 34, 34, 4); // 底層餅
      fill('#8D5B4C'); noStroke(); line(-12, -5, 12, -5); // 層次紋路
      pop();

      push();
      translate(12, -2); rotate(PI / 12);
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(1.5);
      rect(0, 0, 36, 36, 4); // 上層餅
      stroke('#E67E22'); strokeWeight(1); line(-12, -6, 12, -6); line(-12, 6, 12, 6);
      // 白芝麻粒點綴
      noStroke(); fill('#FFF');
      ellipse(-6, -4, 3, 2); ellipse(4, 6, 3, 2); ellipse(8, -6, 3, 2);
      pop();
      pop();
      break;

    case 'mayo_cool_noodles': // 美奶滋涼麵 (寬扁黃麵與特製白醋沙拉醬)
      push();
      rectMode(CENTER);
      // 竹編寬盤
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      ellipse(0, 12, 90, 45);
      // 嘉義特有寬平黃油麵
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      rect(-18, 8, 22, 14, 3);
      rect(0, 6, 24, 16, 3);
      rect(18, 10, 22, 14, 3);
      // 清爽小黃瓜絲與麻醬
      fill('#E67E22'); noStroke(); ellipse(0, 10, 35, 14); // 芝麻醬
      fill('#2ED573'); ellipse(-15, 4, 18, 8); ellipse(15, 6, 16, 8); // 小黃瓜
      // 靈魂標配：擠上特製美奶滋 (白醋沙拉醬線條)
      stroke('#FFF'); strokeWeight(4); noFill();
      bezier(-28, 6, -10, -8, 10, 18, 28, 4);
      stroke('#FFF'); strokeWeight(2.5);
      bezier(-22, 12, -5, 0, 5, 20, 22, 10);
      pop();
      break;
 
// ==========================================
    // ---- 嘉義縣 Q1 (景點) ----
    // ==========================================
    case 'alishan': // 阿里山 (復古小火車與阿里山神木)
      push();
      rectMode(CENTER);
      // 後方雄偉神木與樹冠
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(2);
      ellipse(-22, -15, 45, 40);
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      rect(-22, 12, 20, 35); // 樹幹
      // 漂浮飄落粉紅櫻花瓣 (動畫)
      let sakuraY = sin(t * 3) * 2;
      fill('#FF7675'); noStroke();
      ellipse(15, -25 + sakuraY, 10, 10); ellipse(28, -15 + sakuraY, 8, 8);
      ellipse(-5, -28 + sakuraY, 7, 7);
      // 復古紅色阿里山森林小火車
      fill('#D63031'); stroke('#B33939'); strokeWeight(2);
      rect(8, 12, 48, 26, 4); // 火車頭身
      fill('#2D3436'); rect(-10, 12, 10, 26, 2, 0, 0, 2); // 駕駛艙前方
      fill('#FFEAA7'); noStroke(); // 車窗
      rect(5, 8, 8, 10); rect(18, 8, 8, 10);
      fill('#2D3436'); stroke('#1A252F'); strokeWeight(1); // 輪子
      ellipse(-6, 26, 8, 8); ellipse(8, 26, 8, 8); ellipse(22, 26, 8, 8);
      pop();
      break;

    case 'npm_south': // 故宮南院 (墨韻流線建築與雙曲橋)
      push();
      rectMode(CENTER);
      // 人工湖水面
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      arc(0, 22, 90, 35, 0, PI);
      // 水墨流線型建築主體
      fill('#2D3436'); stroke('#636E72'); strokeWeight(2);
      beginShape();
      vertex(-40, 15);
      bezierVertex(-30, -25, 10, -30, 35, 5);
      bezierVertex(20, 20, -20, 20, -40, 15);
      endShape(CLOSE);
      // 玻璃金屬幾何面 (RGBA 透明度)
      fill(116, 185, 255, 180); stroke('#74B9FF'); strokeWeight(1);
      ellipse(5, -5, 32, 16);
      // 弧形跨湖大橋
      noFill(); stroke('#FFF'); strokeWeight(3);
      arc(0, 20, 80, 25, PI, TWO_PI);
      pop();
      break;

    case 'taiping_suspension_bridge': // 太平雲梯 (高空雲霧長吊橋)
      push();
      rectMode(CENTER);
      // 山谷與飄渺雲海 (RGBA 透明度)
      fill('#27AE60'); noStroke(); ellipse(-35, 15, 40, 35); ellipse(35, 15, 40, 35);
      fill(255, 255, 255, 200); ellipse(0, 22, 90, 28);
      // 白色主塔柱
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      rect(-32, -5, 8, 48, 2); rect(32, -5, 8, 48, 2);
      // 弧形高空懸索橋身
      noFill(); stroke('#F1C40F'); strokeWeight(3);
      arc(0, -15, 75, 45, 0, PI); // 主懸索
      stroke('#FFF'); strokeWeight(2.5);
      line(-35, 8, 35, 8); // 橋面
      // 吊索垂直線
      stroke('#DFE6E9'); strokeWeight(1);
      for (let x = -28; x <= 28; x += 8) {
        line(x, 8, x, -2 + (x * x) * 0.015);
      }
      pop();
      break;

    case 'high_heel_church': // 高跟鞋教堂 (夢幻晶瑩藍色玻璃高跟鞋)
      push();
      rectMode(CENTER);
      let heelY = sin(t * 2.5) * 2;
      // 半透明水藍玻璃高跟鞋 (RGBA 透明度)
      fill(9, 132, 227, 200); stroke('#74B9FF'); strokeWeight(2);
      beginShape();
      vertex(30, 20 + heelY); // 鞋尖
      bezierVertex(5, 20 + heelY, -10, 15 + heelY, -20, -5 + heelY); // 鞋面弧度
      vertex(-22, -28 + heelY); // 鞋口後緣
      bezierVertex(-32, -15 + heelY, -30, 5 + heelY, -28, 20 + heelY); // 鞋跟連線
      endShape(CLOSE);
      // 高跟鞋細長鞋跟
      rect(-26, 8 + heelY, 6, 26, 2);
      // 玻璃幾何反射光芒
      fill(255, 255, 255, 220); noStroke();
      ellipse(10, 15 + heelY, 12, 6);
      ellipse(-12, -2 + heelY, 6, 15);
      pop();
      break;

    // ==========================================
    // ---- 嘉義縣 Q2 (美食) ----
    // ==========================================
    case 'dongshi_oyster': // 東石蚵仔 (海中牛奶肥美鮮蚵)
      push();
      rectMode(CENTER);
      let oystY = sin(t * 3) * 2;
      // 天然灰褐蚵殼底座
      fill('#7F8C8D'); stroke('#34495E'); strokeWeight(2);
      ellipse(0, 5 + oystY, 78, 52);
      fill('#95A5A6'); stroke('#7F8C8D'); strokeWeight(1.5);
      ellipse(2, 5 + oystY, 68, 42);
      // 肥美多汁嫩白蚵仔肉
      fill('#F5F6FA'); stroke('#DFE6E9'); strokeWeight(2);
      ellipse(-2, 5 + oystY, 46, 30);
      // 蚵仔黑色裙邊與部位
      fill('#2D3436'); noStroke();
      ellipse(-12, 5 + oystY, 18, 20);
      ellipse(8, 12 + oystY, 14, 10);
      // 鮮美多汁亮光
      fill(255, 255, 255, 200);
      ellipse(8, 0 + oystY, 10, 6);
      pop();
      break;

    case 'alishan_tea': // 阿里山高山茶 (手採高山烏龍茶與嫩綠茶葉)
      push();
      rectMode(CENTER);
      // 復古朱泥紫砂茶壺
      fill('#C0392B'); stroke('#900C3F'); strokeWeight(2);
      ellipse(-12, 5, 42, 32);
      rect(-12, -13, 16, 6, 2);
      ellipse(-12, -17, 6, 5); // 壺鈕
      // 壺嘴與壺把
      noFill(); stroke('#C0392B'); strokeWeight(3.5);
      bezier(-30, 5, -38, -5, -34, -12, -26, -10);
      arc(6, 5, 18, 22, -HALF_PI, HALF_PI);
      // 嫩綠手採一心二葉茶葉
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(1.5);
      ellipse(22, 10, 16, 8); ellipse(28, 0, 8, 16); ellipse(15, 2, 8, 14);
      // 阿里山清亮茶湯蒸氣 (RGBA 透明度)
      stroke(255, 255, 255, 180); strokeWeight(2); noFill();
      let teaS = sin(t * 4) * 2;
      bezier(-12, -20, -16, -28 + teaS, -8, -34 + teaS, -12, -40 + teaS);
      pop();
      break;

    case 'fenqihu_bento': // 奮起湖便當 (懷舊鐵盒大排骨便當)
      push();
      rectMode(CENTER);
      // 經典圓形不鏽鋼便當盒底座
      fill('#DFE6E9'); stroke('#636E72'); strokeWeight(2.5);
      ellipse(0, 8, 85, 52);
      // 便當邊緣凹槽
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(1.5);
      ellipse(0, 4, 78, 46);
      // 大排骨主菜 (香滷棕色)
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      ellipse(-15, 4, 38, 26);
      // 經典配料：香滷大魯蛋 + 高麗菜 + 醬菜
      fill('#E67E22'); stroke('#D35400'); strokeWeight(1.5);
      ellipse(18, -4, 20, 18); // 滷蛋
      fill('#2ED573'); noStroke();
      ellipse(18, 12, 18, 12); // 青菜
      fill('#F1C40F'); ellipse(0, -10, 12, 8); // 醃黃蘿蔔
      pop();
      break;

    case 'minxiong_pineapple': // 民雄鳳梨 (金黃果實與綠葉)
      push();
      rectMode(CENTER);
      let pineY = sin(t * 2.5) * 2;
      // 金黃香甜鳳梨果實
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(2);
      ellipse(0, 8 + pineY, 48, 54);
      // 菱形果皮紋路
      stroke('#D35400'); strokeWeight(1.2);
      line(-18, -8 + pineY, 18, 24 + pineY); line(-18, 24 + pineY, 18, -8 + pineY);
      line(-22, 8 + pineY, 22, 8 + pineY);
      // 頂部鋸齒狀茂密綠葉
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(1.5);
      triangle(0, -15 + pineY, -16, -42 + pineY, -5, -18 + pineY);
      triangle(0, -15 + pineY, 16, -42 + pineY, 5, -18 + pineY);
      triangle(0, -15 + pineY, 0, -48 + pineY, 0, -15 + pineY);
      pop();
      break;

    // ==========================================
    // ---- 臺南市 Q1 (景點) ----
    // ==========================================
    case 'chikan_tower': // 赤崁樓 (飛檐紅樓與基座龜碑)
      push();
      rectMode(CENTER);
      // 下方石造台座與石龜碑意象
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      rect(0, 22, 80, 16, 2);
      fill('#D4A574'); noStroke();
      for (let x = -30; x <= 30; x += 15) {
        ellipse(x, 24, 10, 6);
      }
      // 中層朱紅樓閣身軀
      fill('#D63031'); stroke('#B33939'); strokeWeight(2);
      rect(0, 0, 55, 30, 2);
      fill('#FFEAA7'); stroke('#5D4037'); strokeWeight(1);
      rect(-15, 0, 10, 16); rect(15, 0, 10, 16); rect(0, 2, 12, 20);
      // 上層傳統黃金飛檐屋頂
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(2);
      beginShape();
      vertex(-40, -12); bezierVertex(-20, -22, 20, -22, 40, -12);
      vertex(32, -30); bezierVertex(12, -40, -12, -40, -32, -30);
      endShape(CLOSE);
      pop();
      break;

    case 'anping_fort': // 安平古堡 (經典白瞭望台與紅磚堡壘)
      push();
      rectMode(CENTER);
      // 下方荷蘭紅磚城牆堡壘
      fill('#C0392B'); stroke('#900C3F'); strokeWeight(2);
      rect(0, 16, 80, 26, 2);
      stroke('#900C3F'); strokeWeight(1);
      line(-35, 10, 35, 10); line(-35, 20, 35, 20);
      // 佇立的白色高聳瞭望塔
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      rect(0, -10, 22, 44, 2);
      fill('#2D3436'); noStroke(); ellipse(0, -20, 6, 8); ellipse(0, -5, 6, 8);
      // 頂部尖圓紅屋頂與旗竿
      fill('#D63031'); stroke('#B33939'); strokeWeight(1.5);
      triangle(-16, -32, 16, -32, 0, -50);
      stroke('#2D3436'); line(0, -50, 0, -58);
      fill('#F1C40F'); noStroke(); triangle(0, -58, 8, -55, 0, -52);
      pop();
      break;

    case 'chimei_museum': // 奇美博物館 (白色古典歐式宮殿與圓頂)
      push();
      rectMode(CENTER);
      // 宮殿主體與兩翼
      fill('#F5F6FA'); stroke('#B2BEC3'); strokeWeight(2);
      rect(0, 12, 85, 30, 2);
      rect(-30, 0, 22, 40, 2); rect(30, 0, 22, 40, 2);
      // 中央白色圓頂
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      arc(0, -3, 34, 34, PI, TWO_PI);
      // 頂端榮耀天使金像
      fill('#F1C40F'); noStroke(); ellipse(0, -22, 6, 6);
      // 希臘式古典柱列
      stroke('#B2BEC3'); strokeWeight(1.5);
      for (let x = -15; x <= 15; x += 6) {
        line(x, 27, x, -3);
      }
      pop();
      break;

    case 'shennong_street': // 神農街 (懷舊木造老屋與大紅燈籠)
      push();
      rectMode(CENTER);
      // 兩層式清代/日治懷舊木造街屋
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      rect(0, 6, 75, 46, 2);
      // 二樓傳統木窗格與陽台
      fill('#FFEAA7'); stroke('#5D4037'); strokeWeight(1.5);
      rect(0, -4, 55, 16);
      stroke('#5D4037'); strokeWeight(1);
      line(-18, -12, -18, 4); line(0, -12, 0, 4); line(18, -12, 18, 4);
      // 門前懸掛的暖紅燈籠 (修正重複宣告錯誤)
      let streetLanternSwing = sin(t * 3) * 3;
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(1.5);
      ellipse(-26 + streetLanternSwing, 18, 12, 16); ellipse(26 + streetLanternSwing, 18, 12, 16);
      fill('#F1C40F'); noStroke(); ellipse(-26 + streetLanternSwing, 18, 4, 4); ellipse(26 + streetLanternSwing, 18, 4, 4);
      pop();
      break;

    // ==========================================
    // ---- 臺南市 Q2 (美食) ----
    // ==========================================
    case 'tainan_beef_soup': // 文章牛肉湯 (滾燙高湯與鮮嫩粉紅溫體牛)
      push();
      rectMode(CENTER);
      let soupY = sin(t * 2.5) * 1.5;
      // 陶瓷白湯碗
      fill('#FFF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 12 + soupY, 85, 60, 0, PI, CHORD);
      // 清澈深色中藥/牛骨高湯
      fill(212, 145, 100, 220); stroke('#D4A574'); strokeWeight(1);
      ellipse(0, 12 + soupY, 80, 22);
      // 鮮嫩粉紅半熟溫體牛肉片
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(1.5);
      ellipse(-15, 10 + soupY, 24, 12);
      ellipse(12, 8 + soupY, 26, 14);
      ellipse(-2, 14 + soupY, 22, 10);
      // 嫩薑絲與少許蔥花
      stroke('#F1C40F'); strokeWeight(2); line(5, 10 + soupY, 18, 14 + soupY); line(8, 6 + soupY, 16, 8 + soupY);
      noStroke(); fill('#2ED573'); ellipse(-10, 8 + soupY, 4, 4);
      pop();
      break;

    case 'peddler_noodles': // 擔仔麵 (鮮蝦、肉燥與古早味黑瓷碗)
      push();
      rectMode(CENTER);
      // 傳統復古黑碗
      fill('#2D3436'); stroke('#1A252F'); strokeWeight(2);
      arc(0, 10, 85, 65, 0, PI, CHORD);
      // 濃郁蝦頭高湯與黃油麵
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      ellipse(0, 10, 80, 20);
      // 標誌性鮮甜熟紅蝦
      fill('#FF7675'); stroke('#D63031'); strokeWeight(1.5);
      arc(-12, 2, 24, 16, PI, TWO_PI);
      stroke('#D63031'); strokeWeight(1); line(-24, 2, -30, -4);
      // 香噴噴滷肉燥與芫荽
      fill('#632A15'); noStroke(); ellipse(12, 6, 18, 12);
      fill('#2ED573'); ellipse(0, 12, 6, 6); ellipse(-5, 8, 4, 4);
      pop();
      break;

    case 'coffin_bread': // 棺材板 (香酥金黃炸吐司與濃郁海鮮內餡)
      push();
      rectMode(CENTER);
      // 白色西餐盤
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 15, 90, 38);
      // 金黃酥脆厚片炸吐司盒
      fill('#E67E22'); stroke('#D35400'); strokeWeight(2);
      rect(0, 5, 65, 44, 6);
      // 中間掀開露出的濃郁濃湯海鮮內餡
      fill('#FFEAA7'); stroke('#F1C40F'); strokeWeight(1.5);
      rect(0, 5, 50, 30, 4);
      // 內餡配料
      noStroke();
      fill('#2ED573'); ellipse(-14, 2, 6, 6); ellipse(10, 8, 6, 6);
      fill('#E74C3C'); ellipse(12, 0, 6, 6); ellipse(-6, 10, 6, 6);
      fill('#FFF'); ellipse(-2, 2, 10, 8);
      // 掀開斜放的吐司蓋子
      fill('#E67E22'); stroke('#D35400'); strokeWeight(1.5);
      rect(-15, -14, 45, 12, 3);
      pop();
      break;

    case 'milkfish_congee': // 虱目魚粥 (鮮美虱目魚肚與白米粥)
      push();
      rectMode(CENTER);
      // 傳統大白瓷碗
      fill('#F5F6FA'); stroke('#2C3E50'); strokeWeight(2);
      arc(0, 10, 90, 68, 0, PI, CHORD);
      // 白米粥湯面
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      ellipse(0, 10, 85, 22);
      // 大塊銀白鮮嫩虱目魚肚
      fill('#DFE6E9'); stroke('#95A5A6'); strokeWeight(1.5);
      ellipse(-5, 8, 48, 16);
      // 魚肚中央特徵黑色油脂線
      fill('#2D3436'); noStroke(); ellipse(-5, 8, 30, 4);
      // 油蔥酥與芹菜珠點綴
      fill('#8D5B4C'); ellipse(20, 10, 10, 6);
      fill('#2ED573'); ellipse(-20, 12, 5, 5); ellipse(10, 14, 4, 4);
      pop();
      break;

      // ==========================================
    // ---- 屏東縣 Q1 (景點) ----
    // ==========================================
    case 'eluanbi_lighthouse': // 鵝鑾鼻燈塔 (白色燈塔與掃描光束)
      push();
      rectMode(CENTER);
      // 綠意盎然草坪底座
      fill('#2ED573'); noStroke();
      ellipse(0, 25, 90, 25);
      // 白色八角形燈塔塔身
      fill('#F5F6FA'); stroke('#2D3436'); strokeWeight(2);
      quad(-14, 25, -9, -15, 9, -15, 14, 25);
      // 黑色欄杆與燈室
      fill('#2D3436'); rect(0, -18, 22, 6); rect(0, -26, 16, 12);
      // 塔頂圓頂
      fill('#F5F6FA'); arc(0, -32, 16, 14, PI, TWO_PI);
      // 旋轉黃光燈束 (擺動動畫)
      let pifBeamAngle = sin(t * 2) * 0.4;
      fill(241, 196, 15, 120); noStroke();
      arc(0, -26, 85, 85, -HALF_PI - 0.4 + pifBeamAngle, -HALF_PI + 0.4 + pifBeamAngle);
      pop();
      break;

    case 'kenting_street': // 墾丁大街 (熱帶陽傘與霓虹夜市)
      push();
      rectMode(CENTER);
      // 夜幕深藍背景
      fill('#2C3E50'); stroke('#1A252F'); strokeWeight(2);
      rect(0, 0, 85, 70, 6);
      // 熱帶椰子樹葉
      fill('#27AE60'); noStroke();
      ellipse(-30, -22, 28, 12); ellipse(-20, -26, 24, 10);
      stroke('#8D5B4C'); strokeWeight(3); line(-32, 5, -28, -20);
      // 繽紛夜市攤位與遮陽棚
      fill('#FF7675'); stroke('#D63031'); strokeWeight(1.5);
      rect(0, 18, 60, 22, 4); // 攤位櫃台
      fill('#FDCB6E'); stroke('#E67E22');
      rect(0, -2, 64, 10, 2); // 遮陽棚
      // 閃爍霓虹招牌
      fill('#00CEC9'); noStroke(); ellipse(-15, -14, 12, 12);
      fill('#FF007F'); ellipse(15, -14, 12, 12);
      pop();
      break;

    case 'nmmba': // 海生館 (湛藍海底隧道與擺尾鯨魚)
      push();
      rectMode(CENTER);
      // 湛藍海洋背景
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      ellipse(0, 0, 85, 75);
      // 海底觀景隧道弧形 (RGBA 透明度)
      noFill(); stroke(255, 255, 255, 180); strokeWeight(3);
      arc(0, 28, 70, 48, PI, TWO_PI);
      // 游動的可愛大鯨魚 (浮動動畫)
      let pifWhaleY = sin(t * 3) * 3;
      fill('#74B9FF'); stroke('#FFF'); strokeWeight(1.5);
      ellipse(-5, 0 + pifWhaleY, 44, 26); // 魚身
      triangle(12, 0 + pifWhaleY, 28, -8 + pifWhaleY, 28, 8 + pifWhaleY); // 尾巴
      fill('#2D3436'); noStroke(); ellipse(-16, -3 + pifWhaleY, 4, 4); // 眼睛
      // 水花點綴
      fill(255, 255, 255, 200); ellipse(-6, -18 + pifWhaleY, 4, 6); ellipse(-2, -22 + pifWhaleY, 3, 5);
      pop();
      break;

    case 'liuqiu_island': // 小琉球 (花瓶岩與可愛綠蠵龜)
      push();
      rectMode(CENTER);
      // 清澈碧藍水面
      fill('#00CEC9'); stroke('#55EFC4'); strokeWeight(2);
      arc(0, 20, 90, 35, 0, PI);
      // 標誌性花瓶岩 (上寬下窄天然巨岩)
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      beginShape();
      vertex(-10, 20); vertex(-18, 2); vertex(-8, -18);
      vertex(8, -18); vertex(18, 2); vertex(10, 20);
      endShape(CLOSE);
      fill('#2ED573'); noStroke(); ellipse(0, -20, 28, 12); // 岩頂植物
      // 悠游的綠蠵龜 (游動動畫)
      let pifTurtleX = sin(t * 2) * 5;
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(1.5);
      ellipse(18 + pifTurtleX, 15, 22, 16); // 龜殼
      fill('#2ED573'); noStroke();
      ellipse(30 + pifTurtleX, 15, 8, 6); // 龜頭
      ellipse(20 + pifTurtleX, 8, 6, 8); ellipse(20 + pifTurtleX, 22, 6, 8); // 前槳腳
      pop();
      break;

    // ==========================================
    // ---- 屏東縣 Q2 (美食) ----
    // ==========================================
    case 'wax_apple': // 蓮霧 (屏東黑珍珠多汁蓮霧)
      push();
      rectMode(CENTER);
      let pifWaxY = sin(t * 2.5) * 2;
      // 鐘形深紅黑珍珠蓮霧果實
      fill('#900C3F'); stroke('#581845'); strokeWeight(2);
      beginShape();
      vertex(0, -20 + pifWaxY);
      bezierVertex(-18, -15 + pifWaxY, -28, 10 + pifWaxY, -15, 22 + pifWaxY);
      bezierVertex(-5, 25 + pifWaxY, 0, 18 + pifWaxY, 5, 25 + pifWaxY);
      bezierVertex(15, 22 + pifWaxY, 28, 10 + pifWaxY, 18, -15 + pifWaxY);
      endShape(CLOSE);
      // 果實多汁光澤反光 (RGBA 透明度)
      fill(255, 255, 255, 180); noStroke();
      ellipse(-8, -2 + pifWaxY, 6, 14);
      // 果蒂與鮮綠葉片
      stroke('#8D5B4C'); strokeWeight(3); line(0, -20 + pifWaxY, 0, -28 + pifWaxY);
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(1); ellipse(8, -26 + pifWaxY, 14, 8);
      pop();
      break;

    case 'wanluan_pork_knuckle': // 萬巒豬腳 (滷香蹄膀與特製蒜蓉醬)
      push();
      rectMode(CENTER);
      // 白色陶瓷餐盤
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 12, 90, 42);
      // 香滷豬腳肉
      fill('#5D4037'); stroke('#3E2723'); strokeWeight(2);
      ellipse(-10, 5, 45, 28);
      // 亮紅棕色外皮外膠質
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(1.5);
      ellipse(-12, 0, 40, 18);
      // 豬腳骨頭截面
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      ellipse(-22, 4, 12, 10);
      // 經典標配：旁邊的蒜蓉醬油小碟
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(1.5);
      ellipse(24, 10, 22, 16);
      fill('#3D1C02'); noStroke(); ellipse(24, 10, 18, 12);
      fill('#FFF'); ellipse(22, 9, 4, 4); // 蒜泥點綴
      pop();
      break;

    case 'sakura_shrimp': // 東港櫻花蝦 (粉嫩透亮櫻花蝦陣)
      push();
      rectMode(CENTER);
      // 白色淺盤
      fill('#FFF'); stroke('#74B9FF'); strokeWeight(2);
      ellipse(0, 15, 90, 40);
      // 堆疊的粉紅透亮櫻花蝦
      let pifShrimps = [
        [-20, 10, -0.3], [0, 5, 0.2], [20, 12, -0.1],
        [-10, 2, 0.4], [10, 8, -0.4], [0, 15, 0]
      ];
      for (let s of pifShrimps) {
        push();
        translate(s[0], s[1]);
        rotate(s[2]);
        fill('#FF7675'); stroke('#D63031'); strokeWeight(1);
        arc(0, 0, 18, 10, PI, TWO_PI);
        stroke('#D63031'); strokeWeight(0.8);
        line(-8, 0, -14, -4); // 蝦鬚
        pop();
      }
      pop();
      break;

    case 'chaozhou_hot_cold_ice': // 潮州燒冷冰 (剉冰與熱騰騰餡料)
      push();
      rectMode(CENTER);
      // 冰藍色冰碗
      fill('#74B9FF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 12, 85, 60, 0, PI, CHORD);
      // 圓滾滾白色剉冰山
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1.5);
      arc(0, 12, 78, 48, PI, TWO_PI);
      // 熱騰騰餡料蒸汽 (RGBA 透明度)
      stroke(255, 255, 255, 180); strokeWeight(2); noFill();
      let pifSteamY = sin(t * 4) * 2;
      bezier(-10, -18, -14, -26 + pifSteamY, -6, -32 + pifSteamY, -10, -38 + pifSteamY);
      // 底部探出的熱配料：紫色芋圓、黃色地瓜圓、紅豆
      fill('#9B59B6'); stroke('#8E44AD'); strokeWeight(1);
      ellipse(-18, 8, 14, 14);
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      ellipse(0, 10, 14, 14);
      fill('#C0392B'); noStroke();
      ellipse(16, 12, 10, 10); ellipse(-8, 12, 8, 8);
      pop();
      break;

// ==========================================
    // ---- 宜蘭縣 Q1 (景點) ----
    // ==========================================
    case 'guishan_island': { // 龜山島 (海龜島嶼與牛奶海)
      push();
      rectMode(CENTER);
      let guishanY = sin(t * 2) * 2;
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      arc(0, 20 + guishanY, 90, 35, 0, PI); // 海洋
      fill(255, 255, 255, 160); noStroke();
      ellipse(-20, 24 + guishanY, 35, 12); // 牛奶海
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(2);
      beginShape(); // 龜山島山體
      vertex(-38, 20 + guishanY);
      bezierVertex(-20, 0 + guishanY, -10, -25 + guishanY, 5, -10 + guishanY);
      bezierVertex(18, 0 + guishanY, 25, -15 + guishanY, 35, 5 + guishanY);
      vertex(38, 20 + guishanY);
      endShape(CLOSE);
      pop();
      break;
    }

    case 'lanyang_museum': { // 蘭陽博物館 (單面山建築)
      push();
      rectMode(CENTER);
      fill('#74B9FF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 25, 90, 30, 0, PI); // 倒影
      fill('#34495E'); stroke('#2C3E50'); strokeWeight(2);
      beginShape(); // 主體
      vertex(-40, 25); vertex(-25, -35); vertex(20, -10); vertex(38, 25);
      endShape(CLOSE);
      fill('#2C3E50'); noStroke();
      quad(-30, 25, -18, -20, -5, -15, -15, 25);
      fill(116, 185, 255, 180); stroke('#74B9FF'); strokeWeight(1);
      quad(-5, -15, 8, -11, 20, 25, 5, 25);
      stroke('#2C3E50'); strokeWeight(1);
      line(-25, -35, 38, 25); line(-35, 5, 28, 25);
      pop();
      break;
    }

    case 'luodong_night_market': { // 羅東夜市 (夜市門樓)
      push();
      rectMode(CENTER);
      fill('#2C3E50'); stroke('#1A252F'); strokeWeight(2);
      rect(0, 0, 85, 70, 6); // 夜空
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      arc(0, -10, 65, 35, PI, TWO_PI); // 牌樓
      fill('#F1C40F'); noStroke(); rect(0, -25, 45, 6, 2);
      let marketLight = sin(t * 3) * 2;
      fill('#FF7675'); stroke('#D63031'); strokeWeight(1);
      ellipse(-28 + marketLight, -5, 10, 14); ellipse(28 + marketLight, -5, 10, 14); // 燈籠
      fill('#FDCB6E'); stroke('#E67E22'); strokeWeight(1.5);
      rect(0, 20, 60, 20, 3); // 攤位
      fill('#D63031'); rect(0, 12, 64, 6, 2);
      pop();
      break;
    }

    case 'qingshui_geothermal': { // 清水地熱 (地熱泉與煮蛋竹籠)
      push();
      rectMode(CENTER);
      fill('#00CEC9'); stroke('#55EFC4'); strokeWeight(2);
      arc(0, 18, 85, 40, 0, PI); // 地熱池
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      rect(0, 5, 26, 28, 4); // 竹籠
      stroke('#8D5B4C'); strokeWeight(1);
      line(-13, -2, 13, -2); line(-13, 6, 13, 6);
      stroke('#8D5B4C'); strokeWeight(2.5); line(0, -9, 0, -25); // 提把
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      ellipse(-5, 2, 8, 10); ellipse(5, 2, 8, 10); // 白蛋
      stroke(255, 255, 255, 200); strokeWeight(2.5); noFill();
      let steamY = sin(t * 4) * 3;
      bezier(-12, -10, -18, -20 + steamY, -8, -28 + steamY, -14, -36 + steamY);
      bezier(12, -10, 6, -20 + steamY, 16, -28 + steamY, 10, -36 + steamY); // 蒸氣
      pop();
      break;
    }

    // ==========================================
    // ---- 宜蘭縣 Q2 (美食) ----
    // ==========================================
    case 'peanut_ice_cream_roll': { // 花生卷冰淇淋
      push();
      rectMode(CENTER);
      let rollY = sin(t * 2.5) * 2;
      rotate(-PI / 12);
      fill('#FFEAA7'); stroke('#D4A574'); strokeWeight(2);
      rect(0, 8 + rollY, 48, 55, 18); // 餅皮
      fill('#9B59B6'); stroke('#8E44AD'); strokeWeight(1.5);
      ellipse(-10, -12 + rollY, 20, 20); // 芋頭冰
      fill('#F1C40F'); stroke('#E67E22');
      ellipse(10, -12 + rollY, 20, 20); // 鳳梨冰
      fill('#E67E22'); noStroke();
      ellipse(0, -6 + rollY, 22, 10); ellipse(-8, 0 + rollY, 14, 8); // 花生碎
      fill('#2ED573'); ellipse(5, -15 + rollY, 8, 6); ellipse(-6, -18 + rollY, 7, 7); // 香菜
      pop();
      break;
    }

    case 'scallion_pancake': { // 三星蔥油餅
      push();
      rectMode(CENTER);
      fill('#FFF'); stroke('#74B9FF'); strokeWeight(2);
      ellipse(0, 15, 90, 40); // 盤子
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      ellipse(0, 5, 68, 40); // 餅身
      fill('#8D5B4C'); noStroke();
      ellipse(-15, 2, 8, 5); ellipse(12, 10, 10, 6); ellipse(8, -4, 7, 4);
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(1);
      ellipse(-5, 6, 8, 8); ellipse(15, 2, 7, 7); ellipse(-20, 8, 6, 6); // 蔥花
      ellipse(0, -6, 8, 8); ellipse(-10, -2, 6, 6);
      pop();
      break;
    }

    case 'yilan_duck': { // 宜蘭鴨賞
      push();
      rectMode(CENTER);
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      ellipse(0, 12, 90, 45); // 餐盤
      let duckSlices = [
        [-22, 10, -0.2], [-5, 5, 0.1], [15, 12, -0.3],
        [-12, 0, 0.3], [8, 2, -0.1], [0, 12, 0]
      ];
      for (let d of duckSlices) {
        push();
        translate(d[0], d[1]);
        rotate(d[2]);
        fill('#C0392B'); stroke('#900C3F'); strokeWeight(1.5);
        ellipse(0, 0, 24, 12); // 肉片
        fill('#F5CBA7'); noStroke(); ellipse(-4, 0, 14, 6);
        pop();
      }
      fill('#2ED573'); noStroke();
      ellipse(-10, 12, 14, 5); ellipse(12, 4, 12, 5); ellipse(2, -2, 10, 4); // 青蒜
      fill('#E74C3C'); ellipse(15, 14, 6, 4);
      pop();
      break;
    }

    case 'gaozha': { // 糕渣
      push();
      rectMode(CENTER);
      fill('#FFF'); stroke('#0984E3'); strokeWeight(2);
      rect(0, 12, 85, 45, 6); // 盤
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      rect(-20, 15, 22, 18, 3); rect(0, 15, 22, 18, 3); rect(20, 15, 22, 18, 3); // 糕渣塊
      rect(-10, 4, 24, 18, 3); rect(10, 4, 24, 18, 3);
      noStroke(); fill('#2D3436');
      ellipse(-8, 2, 2, 2); ellipse(12, 6, 2, 2); ellipse(-15, 12, 2, 2); ellipse(2, 14, 2, 2);
      stroke(255, 255, 255, 180); strokeWeight(1.5); noFill();
      let gaozhaSteam = sin(t * 4) * 2;
      line(-10, -6, -10, -14 + gaozhaSteam);
      line(10, -6, 10, -14 + gaozhaSteam);
      pop();
      break;
    }

    // ==========================================
    // ---- 花蓮縣 Q1 (景點) ----
    // ==========================================
    case 'taroko': { // 太魯閣國家公園 (大理石峽谷與立霧溪)
      push();
      rectMode(CENTER);
      // 大理石峽谷兩壁峭壁
      fill('#7F8C8D'); stroke('#34495E'); strokeWeight(2);
      beginShape(); vertex(-45, -35); vertex(-15, -10); vertex(-25, 35); vertex(-45, 35); endShape(CLOSE);
      beginShape(); vertex(45, -35); vertex(18, -5); vertex(28, 35); vertex(45, 35); endShape(CLOSE);
      // 碧綠立霧溪水
      fill('#00CEC9'); stroke('#55EFC4'); strokeWeight(1.5);
      beginShape(); vertex(-25, 35); vertex(-15, -10); vertex(18, -5); vertex(28, 35); endShape(CLOSE);
      // 中央朱紅慈母橋意象
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      line(-16, -2, 19, 0);
      arc(1.5, 0, 32, 12, PI, TWO_PI);
      pop();
      break;
    }

    case 'qixingtan': { // 七星潭 (新月灣浪花與鵝卵石灘)
      push();
      rectMode(CENTER);
      // 弧形湛藍太平洋海灣
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      arc(0, -5, 85, 60, 0, PI);
      // 岸邊白色浪花 (RGBA 透明度)
      fill(255, 255, 255, 180); noStroke();
      arc(0, 0, 82, 35, 0, PI);
      // 灰礫石海灘
      fill('#95A5A6'); stroke('#7F8C8D'); strokeWeight(1.5);
      arc(0, 18, 90, 35, 0, PI, CHORD);
      // 圓滾滾鵝卵石
      fill('#BDC3C7'); stroke('#7F8C8D'); strokeWeight(1);
      ellipse(-22, 22, 12, 8); ellipse(5, 25, 14, 9); ellipse(26, 20, 10, 7);
      pop();
      break;
    }

    case 'ruisui_ranch': { // 瑞穗牧場 (乳牛與鮮奶瓶)
      push();
      rectMode(CENTER);
      // 青青草原
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(2);
      arc(0, 20, 90, 35, 0, PI);
      // 可愛乳牛 (動態擺動)
      let cowY = sin(t * 3) * 2;
      fill('#FFF'); stroke('#2D3436'); strokeWeight(2);
      ellipse(-10, 5 + cowY, 36, 24); // 身軀
      fill('#2D3436'); noStroke();
      ellipse(-18, 2 + cowY, 12, 10); ellipse(-4, 8 + cowY, 10, 8); // 黑斑
      fill('#FFF'); stroke('#2D3436'); strokeWeight(1.5);
      ellipse(-26, 0 + cowY, 16, 14); // 牛頭
      fill('#FFB8B8'); noStroke(); ellipse(-29, 2 + cowY, 8, 6); // 粉紅牛鼻
      // 瑞穗鮮奶瓶
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(1.5);
      rect(22, 10 + cowY, 14, 22, 2);
      fill('#74B9FF'); rect(22, 5 + cowY, 14, 4); // 瓶蓋標籤
      pop();
      break;
    }

    case 'chike_daylily': { // 赤科山金針花 (高山金黃花海)
      push();
      rectMode(CENTER);
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(2);
      ellipse(-20, 20, 60, 40); ellipse(20, 22, 60, 35); // 綠丘
      let daylilyY = sin(t * 2.5) * 2;
      let flowers = [
        [-22, 5, 0], [0, -5, 0.2], [22, 8, -0.2], [-10, 15, -0.1], [12, 18, 0.1]
      ];
      for (let f of flowers) {
        push();
        translate(f[0], f[1] + daylilyY);
        rotate(f[2]);
        fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
        for (let a = 0; a < TWO_PI; a += PI / 3) {
          ellipse(cos(a) * 6, sin(a) * 6, 6, 12); // 花瓣
        }
        fill('#E67E22'); noStroke(); ellipse(0, 0, 4, 4); // 花心
        pop();
      }
      pop();
      break;
    }

    // ==========================================
    // ---- 花蓮縣 Q2 (美食) ----
    // ==========================================
    case 'hualien_mochi': { // 花蓮糬 (紅豆與花生Q軟糯米糬)
      push();
      rectMode(CENTER);
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      ellipse(0, 15, 90, 38); // 竹盤
      let mochiY = sin(t * 2) * 1.5;
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(2);
      ellipse(-16, 5 + mochiY, 36, 28); // 左：紅豆糬
      fill('#632A15'); noStroke(); ellipse(-16, 5 + mochiY, 20, 14); // 紅豆餡
      fill('#FFEAA7'); stroke('#F5CBA7'); strokeWeight(2);
      ellipse(16, 5 + mochiY, 36, 28); // 右：花生糬
      fill('#E67E22'); noStroke(); ellipse(16, 5 + mochiY, 20, 14); // 花生餡
      fill(255, 255, 255, 200); // 外層白粉細節
      ellipse(-22, 0 + mochiY, 8, 5); ellipse(10, 0 + mochiY, 8, 5);
      pop();
      break;
    }

    case 'scallion_pancake_egg': { // 炸蛋蔥油餅 (爆漿半熟蛋汁)
      push();
      rectMode(CENTER);
      fill('#F5F6FA'); stroke('#B2BEC3'); strokeWeight(1.5);
      rect(0, 15, 80, 40, 4); // 餐紙
      fill('#E67E22'); stroke('#D35400'); strokeWeight(2);
      ellipse(0, 5, 75, 44); // 香酥金黃餅皮
      fill('#2ED573'); noStroke();
      ellipse(-22, 4, 6, 6); ellipse(18, 10, 6, 6); ellipse(-5, 14, 5, 5); // 蔥花
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1.5);
      ellipse(2, 2, 34, 26); // 蛋白
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      ellipse(5, 0, 18, 16); // 蛋黃
      fill(241, 196, 15, 220); noStroke();
      beginShape(); // 流心蛋汁
      vertex(8, 6); bezierVertex(18, 15, 5, 22, 0, 20); vertex(2, 8);
      endShape(CLOSE);
      pop();
      break;
    }

    case 'hualien_wonton': { // 扁食 (液香/戴記皮薄餡滿花蓮扁食)
      push();
      rectMode(CENTER);
      fill('#FFF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 10, 85, 60, 0, PI, CHORD); // 青花瓷碗
      fill(255, 234, 167, 200); stroke('#FFEAA7'); strokeWeight(1);
      ellipse(0, 10, 80, 20); // 濃郁高湯
      let wontonY = sin(t * 3) * 1.5;
      let wontons = [[-18, 5], [2, 2], [20, 8]];
      for (let w of wontons) {
        fill('#F5F6FA'); stroke('#DFE6E9'); strokeWeight(1.5);
        ellipse(w[0], w[1] + wontonY, 22, 16); // 薄皮
        fill('#FFB8B8'); noStroke(); ellipse(w[0], w[1] + wontonY, 12, 10); // 鮮肉餡
      }
      fill('#8D5B4C'); noStroke(); ellipse(-10, 12, 8, 4); ellipse(12, 14, 6, 4); // 油蔥酥
      fill('#2ED573'); ellipse(10, 6, 4, 4); ellipse(-5, 14, 4, 4); // 芹菜
      pop();
      break;
    }

    case 'peeled_chili': { // 剝皮辣椒 (甘醇玻璃罐裝辣椒)
      push();
      rectMode(CENTER);
      let chiliY = sin(t * 2) * 1.5;
      fill(245, 246, 250, 180); stroke('#B2BEC3'); strokeWeight(2);
      rect(0, 8 + chiliY, 48, 50, 6); // 透明玻璃罐
      rect(0, -22 + chiliY, 24, 12, 2);
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1.5);
      rect(0, -26 + chiliY, 28, 8, 2); // 金屬蓋
      fill(62, 39, 35, 200); noStroke();
      rect(0, 15 + chiliY, 44, 32, 0, 0, 4, 4); // 醬汁
      fill('#1E8449'); stroke('#145A32'); strokeWeight(1.5);
      arc(-10, 10 + chiliY, 14, 28, -HALF_PI, HALF_PI); // 剝皮辣椒
      arc(8, 12 + chiliY, 12, 26, -HALF_PI, HALF_PI);
      stroke(255, 255, 255, 180); strokeWeight(1.5); noFill();
      line(-18, -4 + chiliY, -18, 24 + chiliY); // 反光
      pop();
      break;
    }
      // ==========================================
    // ---- 臺東縣 Q1 (景點) ----
    // ==========================================
    case 'hot_air_balloon': { // 國際熱氣球嘉年華 (鹿野高台與繽紛熱氣球)
      push();
      rectMode(CENTER);
      // 鹿野高台綠色草丘
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(2);
      arc(0, 22, 90, 35, 0, PI);
      // 熱氣球浮動動畫
      let balloonY = sin(t * 2) * 4;
      push();
      translate(0, -8 + balloonY);
      // 籐編竹籃
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(1.5);
      rect(0, 22, 10, 8, 2);
      // 連接繩索
      stroke('#636E72'); strokeWeight(1);
      line(-3, 18, -3, 14); line(3, 18, 3, 14);
      // 熱氣球球體 (繽紛鮮豔條紋)
      fill('#FF7675'); stroke('#D63031'); strokeWeight(1.5);
      ellipse(0, -2, 36, 40);
      fill('#FDCB6E'); noStroke();
      ellipse(0, -2, 20, 40);
      fill('#74B9FF');
      ellipse(0, -2, 8, 40);
      pop();
      pop();
      break;
    }

    case 'sanxiantai': { // 三仙臺 (八拱跨海大橋與海天一色)
      push();
      rectMode(CENTER);
      // 蔚藍太平洋海浪
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      arc(0, 20, 90, 35, 0, PI);
      // 遠處大理石/礁石離島
      fill('#7F8C8D'); stroke('#34495E'); strokeWeight(1.5);
      ellipse(28, 5, 24, 16); ellipse(-30, 8, 18, 12);
      // 經典八拱橋連綿意象
      noFill(); stroke('#E74C3C'); strokeWeight(2.5);
      for (let x = -30; x <= 22; x += 13) {
        arc(x + 6.5, 12, 14, 14, PI, TWO_PI);
      }
      stroke('#FFF'); strokeWeight(1.5);
      line(-30, 12, 30, 12); // 橋面
      pop();
      break;
    }

    case 'zhiben_hot_spring': { // 知本溫泉 (露天湯池與熱氣)
      push();
      rectMode(CENTER);
      // 檜木/石造湯池
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2.5);
      ellipse(0, 12, 88, 48);
      // 溫泉水面 (淡藍色)
      fill(116, 185, 255, 200); stroke('#74B9FF'); strokeWeight(1.5);
      ellipse(0, 8, 76, 36);
      // 水面木桶
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(1);
      ellipse(-18, 8, 14, 10);
      // 裊裊白煙蒸氣動畫
      stroke(255, 255, 255, 190); strokeWeight(2); noFill();
      let steamY = sin(t * 3.5) * 3;
      bezier(-10, 0, -16, -12 + steamY, -6, -20 + steamY, -12, -30 + steamY);
      bezier(12, 2, 6, -10 + steamY, 16, -18 + steamY, 10, -28 + steamY);
      pop();
      break;
    }

    case 'mr_brown_avenue': { // 伯朗大道 (金黃稻浪與金城武樹)
      push();
      rectMode(CENTER);
      // 伯朗大道金黃波浪稻田
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(2);
      rect(0, 10, 85, 45, 4);
      // 中央瀝青田園小路
      fill('#636E72'); noStroke();
      triangle(0, -10, -18, 32, 18, 32);
      stroke('#FFF'); strokeWeight(1); line(0, 5, 0, 32); // 道路中線
      // 標誌性金城武樹
      let windTree = sin(t * 2) * 1.5;
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      rect(22, 0 + windTree, 6, 20); // 樹幹
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(1.5);
      ellipse(22, -12 + windTree, 28, 24); // 樹冠
      pop();
      break;
    }

    // ==========================================
    // ---- 臺東縣 Q2 (美食) ----
    // ==========================================
    case 'custard_apple': { // 釋迦 (綠色鱗目狀釋迦果實)
      push();
      rectMode(CENTER);
      let custardY = sin(t * 2.5) * 2;
      // 釋迦基底身軀
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(2);
      ellipse(0, 5 + custardY, 52, 56);
      // 鱗目狀髮螺突起細節
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(1);
      let scales = [
        [-12, -12], [0, -16], [12, -12],
        [-18, 0], [-6, -2], [6, -2], [18, 0],
        [-14, 12], [0, 10], [14, 12], [0, 22]
      ];
      for (let s of scales) {
        ellipse(s[0], s[1] + custardY, 12, 12);
      }
      // 棕色果蒂與綠葉
      stroke('#8D5B4C'); strokeWeight(3); line(0, -22 + custardY, 0, -30 + custardY);
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(1); ellipse(8, -28 + custardY, 14, 8);
      pop();
      break;
    }

    case 'chishang_bento': { // 池上便當 (傳統池上木片便當)
      push();
      rectMode(CENTER);
      // 淺色木片便當盒
      fill('#FFEAA7'); stroke('#D4A574'); strokeWeight(2.5);
      rect(0, 5, 76, 52, 4);
      // 便當內鋪的白米飯底
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      rect(0, 5, 68, 44, 2);
      // 主菜：香煎滷排骨
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(1.5);
      rect(-12, 5, 36, 32, 4);
      // 配菜：切半滷蛋、切片香腸、黃蘿蔔
      fill('#E67E22'); stroke('#D35400'); strokeWeight(1);
      ellipse(18, -8, 16, 14); // 滷蛋
      fill('#FFF'); noStroke(); ellipse(18, -8, 8, 6);
      fill('#D63031'); stroke('#B33939'); strokeWeight(1);
      ellipse(18, 6, 14, 10); // 辣香腸片
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      rect(18, 18, 12, 8, 2); // 醃黃蘿蔔
      pop();
      break;
    }

    case 'donghe_bun': { // 東河包子 (蒸籠與香Q大肉包)
      push();
      rectMode(CENTER);
      // 蒸籠托盤
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      ellipse(0, 15, 88, 40);
      // 飽滿白嫩包子身
      let bunY = sin(t * 2) * 1.5;
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(2);
      ellipse(0, 2 + bunY, 56, 42);
      // 頂部抓皺褶痕與點紅標記
      stroke('#D4A574'); strokeWeight(1.5);
      line(-6, -12 + bunY, 0, -6 + bunY); line(6, -12 + bunY, 0, -6 + bunY);
      line(0, -14 + bunY, 0, -6 + bunY);
      fill('#E74C3C'); noStroke(); ellipse(0, -8 + bunY, 5, 5);
      // 香氣蒸氣動畫
      stroke(255, 255, 255, 180); strokeWeight(2); noFill();
      let steamB = sin(t * 4) * 2;
      bezier(-10, -18 + bunY, -14, -26 + steamB, -6, -32 + steamB, -10, -38 + steamB);
      bezier(10, -18 + bunY, 6, -26 + steamB, 14, -32 + steamB, 10, -38 + steamB);
      pop();
      break;
    }

    case 'taimali_daylily': { // 太麻里金針山 (高山太平洋花海)
      push();
      rectMode(CENTER);
      // 海天一色背景
      fill('#0984E3'); noStroke(); arc(0, 0, 85, 70, PI, TWO_PI);
      // 太麻里綠色陡峭山丘
      fill('#27AE60'); stroke('#1E8449'); strokeWeight(2);
      arc(-15, 25, 75, 45, PI, TWO_PI); arc(25, 25, 65, 40, PI, TWO_PI);
      // 金黃金針花盛開
      let daylilyY = sin(t * 2.5) * 2;
      let pos = [[-25, 5], [-10, -2], [10, 5], [25, 8], [0, 14]];
      for (let p of pos) {
        push();
        translate(p[0], p[1] + daylilyY);
        fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
        for (let a = 0; a < TWO_PI; a += PI / 3) {
          ellipse(cos(a) * 5, sin(a) * 5, 5, 10);
        }
        fill('#E67E22'); noStroke(); ellipse(0, 0, 3, 3);
        pop();
      }
      pop();
      break;
    }
      // ==========================================
    // ---- 澎湖縣 Q1 (景點) ----
    // ==========================================
    case 'twin_heart_weir': { // 雙心石滬 (雙心型捕魚石滬與湛藍海水)
      push();
      rectMode(CENTER);
      let weirY = sin(t * 2) * 2;
      // 湛藍清澈水面
      fill('#00CEC9'); stroke('#55EFC4'); strokeWeight(2);
      arc(0, 20 + weirY, 90, 35, 0, PI);
      // 雙心石滬玄武岩堆砌 (兩個交疊的心形)
      noFill(); stroke('#2D3436'); strokeWeight(3);
      // 左心
      beginShape();
      vertex(-12, -5 + weirY);
      bezierVertex(-25, -20 + weirY, -35, 5 + weirY, -12, 18 + weirY);
      bezierVertex(2, 5 + weirY, -2, -20 + weirY, -12, -5 + weirY);
      endShape();
      // 右心
      beginShape();
      vertex(12, -8 + weirY);
      bezierVertex(0, -22 + weirY, -10, 2 + weirY, 12, 16 + weirY);
      bezierVertex(28, 2 + weirY, 24, -22 + weirY, 12, -8 + weirY);
      endShape();
      pop();
      break;
    }

    case 'basalt_columns': { // 大菓葉柱狀玄武岩 (壯麗柱狀節理)
      push();
      rectMode(CENTER);
      // 下方水池倒影
      fill('#74B9FF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 25, 90, 30, 0, PI);
      // 幾何六角柱狀玄武岩牆面
      let colHeights = [45, 55, 60, 52, 58, 48];
      let xPos = [-30, -18, -6, 6, 18, 30];
      for (let i = 0; i < 6; i++) {
        fill(i % 2 === 0 ? '#4A5568' : '#2D3748'); stroke('#1A202C'); strokeWeight(1.5);
        rect(xPos[i], 20 - colHeights[i] / 2, 11, colHeights[i], 2);
      }
      pop();
      break;
    }

    case 'penghu_cross_sea_bridge': { // 跨海大橋 (經典白色拱門與碧海)
      push();
      rectMode(CENTER);
      // 碧海藍天背景
      fill('#00CEC9'); stroke('#55EFC4'); strokeWeight(2);
      arc(0, 22, 90, 35, 0, PI);
      // 跨海大橋白色標誌性拱門
      fill('#F5F6FA'); stroke('#2D3436'); strokeWeight(2);
      arc(0, 0, 70, 45, PI, TWO_PI);
      fill('#00CEC9'); noStroke();
      arc(0, 2, 50, 32, PI, TWO_PI); // 拱門鏤空
      // 橋墩兩側
      fill('#F5F6FA'); stroke('#2D3436'); strokeWeight(2);
      rect(-30, 10, 10, 24); rect(30, 10, 10, 24);
      // 拱門上方紅色標誌文字條
      fill('#E74C3C'); noStroke(); rect(0, -20, 30, 5, 2);
      pop();
      break;
    }

    case 'fireworks_festival': { // 觀音亭花火節 (夜空與璀璨煙火)
      push();
      rectMode(CENTER);
      // 夜幕背景
      fill('#1A202C'); stroke('#2D3748'); strokeWeight(2);
      rect(0, 0, 85, 70, 6);
      // 虹橋點燈輪廓
      noFill(); stroke('#E84393'); strokeWeight(2);
      arc(0, 28, 70, 30, PI, TWO_PI);
      // 綻放的花火動畫
      let fwScale = 1 + sin(t * 4) * 0.15;
      push();
      translate(-12, -10);
      scale(fwScale);
      let fwColors = ['#FF7675', '#FDCB6E', '#55EFC4', '#74B9FF', '#E84393'];
      for (let i = 0; i < 8; i++) {
        let ang = i * (TWO_PI / 8);
        stroke(fwColors[i % 5]); strokeWeight(2);
        line(cos(ang) * 6, sin(ang) * 6, cos(ang) * 22, sin(ang) * 22);
      }
      pop();
      pop();
      break;
    }

    // ==========================================
    // ---- 澎湖縣 Q2 (美食) ----
    // ==========================================
    case 'brown_sugar_cake': { // 黑糖糕 (濃郁黑糖香與白芝麻粒)
      push();
      rectMode(CENTER);
      let cakeY = sin(t * 2.5) * 1.5;
      // 擺盤
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 15 + cakeY, 90, 38);
      // 經典三角形黑糖糕切片
      fill('#6E2C00'); stroke('#3E2723'); strokeWeight(2);
      triangle(-28, 15 + cakeY, 15, 15 + cakeY, -5, -20 + cakeY);
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(1.5);
      triangle(0, 15 + cakeY, 30, 15 + cakeY, 10, -12 + cakeY);
      // 表層蓬鬆孔洞與白芝麻粒
      noStroke(); fill('#FFF');
      ellipse(-10, -5 + cakeY, 3, 2); ellipse(-15, 5 + cakeY, 3, 2);
      ellipse(5, 0 + cakeY, 3, 2); ellipse(15, 8 + cakeY, 3, 2);
      pop();
      break;
    }

    case 'squid_balls': { // 花枝丸 (金黃香酥花枝丸串)
      push();
      rectMode(CENTER);
      let ballY = sin(t * 3) * 2;
      rotate(-PI / 6);
      // 竹籤
      stroke('#D4A574'); strokeWeight(3);
      line(0, -35 + ballY, 0, 40 + ballY);
      // 3 顆香Q花枝丸
      let ballsY = [-18, 0, 18];
      for (let y of ballsY) {
        fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
        ellipse(0, y + ballY, 26, 26);
        // 金黃炸紋與胡椒鹽
        fill('#E67E22'); noStroke();
        ellipse(-4, y - 4 + ballY, 8, 5);
        fill('#2D3436'); ellipse(3, y + 3 + ballY, 2, 2);
      }
      pop();
      break;
    }

    case 'cactus_ice': { // 仙人掌冰 (鮮艷鮮紅仙人掌冰淇淋)
      push();
      rectMode(CENTER);
      let iceY = sin(t * 2.5) * 2;
      // 脆皮甜筒
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      triangle(0, 32 + iceY, -16, 2 + iceY, 16, 2 + iceY);
      stroke('#8D5B4C'); strokeWeight(1);
      line(-8, 16 + iceY, 8, 16 + iceY); line(-12, 8 + iceY, 12, 8 + iceY);
      // 鮮艷桃紅仙人掌冰淇淋雙球
      fill('#E84393'); stroke('#C71585'); strokeWeight(2);
      ellipse(0, 0 + iceY, 36, 32); // 下球
      ellipse(0, -18 + iceY, 30, 28); // 上球
      // 淋上濃郁果汁光影
      fill(255, 255, 255, 180); noStroke();
      ellipse(-6, -22 + iceY, 6, 10);
      pop();
      break;
    }

    case 'dried_squid': { // 小管乾 (澎湖特產烤小管乾)
      push();
      rectMode(CENTER);
      let squidY = sin(t * 2) * 1.5;
      rotate(PI / 12);
      // 魷魚身軀
      fill('#E67E22'); stroke('#D35400'); strokeWeight(2);
      beginShape();
      vertex(0, -30 + squidY);
      bezierVertex(20, -10 + squidY, 15, 10 + squidY, 0, 20 + squidY);
      bezierVertex(-15, 10 + squidY, -20, -10 + squidY, 0, -30 + squidY);
      endShape(CLOSE);
      // 三角形鰭尾
      triangle(0, -30 + squidY, -16, -20 + squidY, 16, -20 + squidY);
      // 烤痕條紋
      stroke('#8D5B4C'); strokeWeight(1.5);
      line(-10, -5 + squidY, 10, -5 + squidY);
      line(-12, 5 + squidY, 12, 5 + squidY);
      // 觸手
      stroke('#E67E22'); strokeWeight(2.5);
      for (let x = -8; x <= 8; x += 4) {
        line(x, 20 + squidY, x + sin(x) * 3, 34 + squidY);
      }
      pop();
      break;
    }
    // ==========================================
    // ---- 金門縣 Q1 (景點) ----
    // ==========================================
    case 'wind_lion_god': { // 風獅爺 (鎮風辟邪與紅披風)
      push();
      rectMode(CENTER);
      let lionY = sin(t * 2.5) * 2;
      // 朱紅披風
      fill('#D63031'); stroke('#B33939'); strokeWeight(1.5);
      triangle(0, -10 + lionY, -28, 25 + lionY, 28, 25 + lionY);
      // 圓滾滾黃色石獅身與獅頭
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(2);
      ellipse(0, 8 + lionY, 36, 32);
      ellipse(0, -12 + lionY, 32, 28);
      // 獅耳與雙鬢
      fill('#E67E22'); noStroke();
      ellipse(-16, -18 + lionY, 8, 8); ellipse(16, -18 + lionY, 8, 8);
      // 大眼睛與大嘴
      fill('#FFF'); stroke('#2D3436'); strokeWeight(1);
      ellipse(-7, -14 + lionY, 8, 8); ellipse(7, -14 + lionY, 8, 8);
      fill('#2D3436'); ellipse(-7, -14 + lionY, 4, 4); ellipse(7, -14 + lionY, 4, 4);
      fill('#D63031'); ellipse(0, -6 + lionY, 14, 8);
      // 手持辟邪寶葫蘆
      fill('#E67E22'); stroke('#8D5B4C'); strokeWeight(1);
      ellipse(12, 10 + lionY, 10, 10); ellipse(12, 4 + lionY, 7, 7);
      pop();
      break;
    }

    case 'zhaishan_tunnel': { // 翟山坑道 (花崗岩坑道與倒影水面)
      push();
      rectMode(CENTER);
      // 坑道深色花崗岩拱型背景
      fill('#34495E'); stroke('#1A252F'); strokeWeight(2);
      rect(0, 0, 85, 70, 6);
      fill('#2C3E50'); noStroke();
      arc(0, 15, 65, 55, PI, TWO_PI);
      // 坑道內部清澈水道 (RGBA 透明度)
      fill(0, 206, 201, 180); stroke('#55EFC4'); strokeWeight(1.5);
      rect(0, 20, 60, 26, 2);
      // 岩壁線條刻痕
      stroke('#7F8C8D'); strokeWeight(1);
      line(-30, -10, -20, 5); line(25, -15, 18, 2); line(-15, -20, -5, -8);
      pop();
      break;
    }

    case 'juguang_tower': { // 莒光樓 (宮殿式古典古蹟建築)
      push();
      rectMode(CENTER);
      // 綠草地基座
      fill('#2ED573'); stroke('#27AE60'); strokeWeight(2);
      rect(0, 28, 85, 12, 2);
      // 莒光樓白色牆面
      fill('#F5F6FA'); stroke('#2D3436'); strokeWeight(2);
      rect(0, 8, 60, 32, 2);
      // 朱紅立柱與門窗
      fill('#D63031'); noStroke();
      rect(-20, 10, 6, 26); rect(0, 10, 8, 26); rect(20, 10, 6, 26);
      // 經典藍綠色歇山頂屋頂
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      beginShape();
      vertex(-40, -8); bezierVertex(-20, -18, 20, -18, 40, -8);
      vertex(30, -28); bezierVertex(10, -35, -10, -35, -30, -28);
      endShape(CLOSE);
      // 莒光樓匾額
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      rect(0, -3, 18, 8, 1);
      pop();
      break;
    }

    case 'deyue_tower': { // 得月樓 (巴洛克式裝飾洋樓)
      push();
      rectMode(CENTER);
      let towerY = sin(t * 2) * 1.5;
      // 西式粉白古洋樓身軀
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      rect(0, 5 + towerY, 44, 55, 2);
      // 紅磚拱形窗格
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(1);
      rect(0, -10 + towerY, 14, 18, 7, 7, 0, 0);
      rect(-12, 10 + towerY, 10, 14, 5, 5, 0, 0);
      rect(12, 10 + towerY, 10, 14, 5, 5, 0, 0);
      // 頂部巴洛克花雕山牆
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      arc(0, -22 + towerY, 44, 20, PI, TWO_PI);
      fill('#F1C40F'); noStroke(); ellipse(0, -26 + towerY, 8, 8);
      pop();
      break;
    }

    // ==========================================
    // ---- 金門縣 Q2 (美食 / 特產) ----
    // ==========================================
    case 'kinmen_kaoliang': { // 金門高粱酒 (經典高粱酒瓶與玻璃酒杯)
      push();
      rectMode(CENTER);
      let bottleY = sin(t * 2.5) * 2;
      // 水晶透明酒瓶 (RGBA 透明度)
      fill(245, 246, 250, 200); stroke('#B2BEC3'); strokeWeight(2);
      rect(-10, 5 + bottleY, 32, 50, 4);
      rect(-10, -24 + bottleY, 12, 12, 2);
      // 朱紅酒瓶蓋
      fill('#D63031'); stroke('#B33939'); strokeWeight(1.5);
      rect(-10, -31 + bottleY, 14, 8, 2);
      // 金黃酒標貼紙
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      rect(-10, 5 + bottleY, 24, 26, 2);
      fill('#D63031'); noStroke(); rect(-10, 5 + bottleY, 8, 8);
      // 品嚐小酒杯
      fill(255, 255, 255, 220); stroke('#74B9FF'); strokeWeight(1.5);
      rect(20, 20 + bottleY, 16, 20, 2, 2, 5, 5);
      fill('#74B9FF'); noStroke(); ellipse(20, 14 + bottleY, 12, 4);
      pop();
      break;
    }

    case 'tribute_candy': { // 貢糖 (傳統大紅喜慶包裝與香酥花生貢糖)
      push();
      rectMode(CENTER);
      let candyY = sin(t * 2) * 1.5;
      // 傳統大紅包裝袋
      fill('#D63031'); stroke('#B33939'); strokeWeight(2);
      rect(-15, 5 + candyY, 38, 48, 6);
      fill('#F1C40F'); noStroke(); rect(-15, 5 + candyY, 20, 20, 2);
      // 切開露出的香酥花生貢糖
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      rect(18, 12 + candyY, 32, 26, 4);
      // 花生壓碎顆粒與白芝麻
      fill('#8D5B4C'); noStroke();
      ellipse(10, 12 + candyY, 12, 6); ellipse(22, 16 + candyY, 10, 5);
      fill('#FFF'); ellipse(15, 8 + candyY, 3, 2); ellipse(25, 10 + candyY, 3, 2);
      pop();
      break;
    }

    case 'steel_knife': { // 炮彈鋼刀 (炮彈殼與鋒利切刀)
      push();
      rectMode(CENTER);
      let knifeY = sin(t * 2) * 1.5;
      // 墨綠炮彈殼基底
      fill('#4A5568'); stroke('#2D3748'); strokeWeight(2);
      beginShape();
      vertex(-24, 25 + knifeY); vertex(-24, -15 + knifeY);
      bezierVertex(-20, -35 + knifeY, -10, -35 + knifeY, -6, -15 + knifeY);
      vertex(-6, 25 + knifeY);
      endShape(CLOSE);
      // 鍛造鋼刀
      push();
      translate(10, 0 + knifeY);
      rotate(-PI / 6);
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(1.5);
      rect(0, 24, 10, 20, 2); // 刀柄
      fill('#DFE6E9'); stroke('#636E72'); strokeWeight(2);
      rect(0, -10, 26, 48, 3); // 刀身
      fill('#FFF'); noStroke(); rect(-8, -10, 4, 44); // 鋼面亮光
      pop();
      pop();
      break;
    }

    case 'kinmen_vermicelli': { // 金門麵線 (風乾木架與白色線條麵線)
      push();
      rectMode(CENTER);
      // 晾曬木架
      stroke('#8D5B4C'); strokeWeight(3);
      line(-35, -20, 35, -20);
      line(-30, -20, -30, 30); line(30, -20, 30, 30);
      // 垂掛晾曬的白絲麵線
      stroke('#FFF'); strokeWeight(1.5); noFill();
      let waveW = sin(t * 3) * 2;
      for (let x = -26; x <= 26; x += 4) {
        bezier(x, -20, x + waveW, -5, x - waveW, 10, x, 25);
      }
      // 前方溫熱麵線碗
      fill('#FFF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 15, 45, 30, 0, PI, CHORD);
      fill('#F1C40F'); noStroke(); ellipse(0, 15, 40, 8);
      pop();
      break;
    }

    // ==========================================
    // ---- 連江縣 Q1 (景點) ----
    // ==========================================
    case 'blue_tears': { // 藍眼淚 (暗夜海岸與夢幻藍光)
      push();
      rectMode(CENTER);
      // 夜幕深藍背景
      fill('#1A202C'); stroke('#2D3748'); strokeWeight(2);
      rect(0, 0, 85, 70, 6);
      // 海浪輪廓
      fill('#0984E3'); noStroke();
      arc(0, 20, 85, 30, PI, TWO_PI);
      // 夢幻亮藍光浪頭 (RGBA 透明度)
      let waveGlow = sin(t * 3) * 2;
      fill(0, 206, 201, 200); stroke('#74B9FF'); strokeWeight(2);
      bezier(-40, 15, -20, 5 + waveGlow, 0, 22 + waveGlow, 40, 12);
      // 點點夜光藻螢光斑點
      noStroke(); fill('#00CEC9');
      ellipse(-25, 10 + waveGlow, 4, 4); ellipse(-10, 18 + waveGlow, 5, 5);
      ellipse(15, 8 + waveGlow, 4, 4); ellipse(28, 16 + waveGlow, 6, 6);
      pop();
      break;
    }

    case 'qinbi_village': { // 芹壁聚落 (花崗岩石屋與地中海風情)
      push();
      rectMode(CENTER);
      // 後方蔚藍大海
      fill('#74B9FF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 20, 90, 35, 0, PI);
      // 花崗岩石造屋身
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      rect(-15, 5, 42, 32, 2); rect(18, 10, 35, 26, 2);
      // 人字形花崗岩壓瓦屋頂
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      triangle(-38, -5, 8, -5, -15, -22);
      triangle(0, 0, 36, 0, 18, -14);
      // 木窗
      fill('#FFEAA7'); stroke('#5D4037'); strokeWeight(1);
      rect(-22, 5, 8, 10); rect(-8, 5, 8, 10); rect(18, 10, 8, 10);
      pop();
      break;
    }

    case 'baba_tunnel': { // 八八坑道 (花崗岩坑道與老酒甕)
      push();
      rectMode(CENTER);
      // 深色坑道洞口
      fill('#2D3748'); stroke('#1A202C'); strokeWeight(2);
      rect(0, 0, 85, 70, 6);
      fill('#1A202C'); noStroke();
      arc(0, 15, 65, 55, PI, TWO_PI);
      // 兩側擺放的老酒甕
      let tunnelY = sin(t * 2) * 1.5;
      fill('#3E2723'); stroke('#1B0000'); strokeWeight(1.5);
      ellipse(-22, 18 + tunnelY, 20, 22);
      rect(-22, 5 + tunnelY, 10, 6, 1);
      ellipse(22, 18 + tunnelY, 20, 22);
      rect(22, 5 + tunnelY, 10, 6, 1);
      fill('#D63031'); noStroke();
      rect(-22, 4 + tunnelY, 12, 4, 1); rect(22, 4 + tunnelY, 12, 4, 1);
      pop();
      break;
    }

    case 'dongyong_lighthouse': { // 東湧燈塔 (白色英式燈塔與海崖)
      push();
      rectMode(CENTER);
      // 陡峭崖壁
      fill('#7F8C8D'); stroke('#34495E'); strokeWeight(2);
      triangle(-45, 35, 10, 35, -25, -10);
      // 矗立在崖邊的純白燈塔
      fill('#FFF'); stroke('#2D3436'); strokeWeight(2);
      rect(0, 0, 18, 38, 2);
      fill('#2D3436'); rect(0, -18, 22, 6); // 燈籠欄杆
      fill('#FFF'); arc(0, -26, 18, 14, PI, TWO_PI); // 燈罩
      // 旋轉光束
      let lightBeam = sin(t * 2.5) * 0.4;
      fill(241, 196, 15, 120); noStroke();
      arc(0, -26, 75, 75, -HALF_PI - 0.4 + lightBeam, -HALF_PI + 0.4 + lightBeam);
      pop();
      break;
    }

    // ==========================================
    // ---- 連江縣 Q2 (美食) ----
    // ==========================================
    case 'old_wine_vermicelli': { // 老酒麵線 (老酒高湯、荷包蛋與細麵)
      push();
      rectMode(CENTER);
      let wineVermY = sin(t * 2.5) * 1.5;
      // 大湯碗
      fill('#FFF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 10 + wineVermY, 85, 60, 0, PI, CHORD);
      // 紅麴老酒紅褐色高湯
      fill(214, 48, 49, 200); stroke('#B33939'); strokeWeight(1);
      ellipse(0, 10 + wineVermY, 80, 20);
      // 細麵線
      stroke('#FFF'); strokeWeight(1.5); noFill();
      for (let x = -25; x <= 25; x += 8) {
        bezier(x, 10 + wineVermY, x + 3, 2 + wineVermY, x - 3, 15 + wineVermY, x, 18 + wineVermY);
      }
      // 煎荷包蛋
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      ellipse(-12, 6 + wineVermY, 26, 18);
      fill('#F1C40F'); stroke('#E67E22'); strokeWeight(1);
      ellipse(-12, 6 + wineVermY, 12, 10);
      // 枸杞點綴
      fill('#D63031'); noStroke();
      ellipse(12, 10 + wineVermY, 6, 4); ellipse(18, 6 + wineVermY, 5, 4);
      // 蒸氣
      stroke(255, 255, 255, 180); strokeWeight(2); noFill();
      let steamW = sin(t * 4) * 2;
      bezier(0, 0 + wineVermY, -4, -10 + steamW, 4, -18 + steamW, 0, -26 + steamW);
      pop();
      break;
    }

    case 'jiguang_cake': { // 繼光餅 (馬祖漢堡)
      push();
      rectMode(CENTER);
      let cakeY = sin(t * 2) * 1.5;
      // 擺盤
      fill('#FFF'); stroke('#74B9FF'); strokeWeight(2);
      ellipse(0, 15 + cakeY, 90, 40);
      // 圓形金黃烤光餅
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      ellipse(0, 12 + cakeY, 62, 22); // 下蓋
      ellipse(0, -4 + cakeY, 66, 26); // 上蓋
      // 中間夾餡：煎蛋與里肌肉片
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1.5);
      rect(0, 5 + cakeY, 58, 8, 2);
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(1.5);
      rect(0, 8 + cakeY, 54, 6, 2);
      // 白芝麻與光餅穿孔
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(1);
      ellipse(0, -6 + cakeY, 10, 6);
      noStroke(); fill('#FFF');
      ellipse(-18, -8 + cakeY, 3, 2); ellipse(15, -6 + cakeY, 3, 2); ellipse(-6, -10 + cakeY, 3, 2);
      pop();
      break;
    }

    case 'dingbianhu': { // 鼎邊糊 (鮮美海鮮高湯與米糊切片)
      push();
      rectMode(CENTER);
      fill('#F5F6FA'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 10, 85, 60, 0, PI, CHORD);
      fill(255, 234, 167, 220); stroke('#FFEAA7'); strokeWeight(1);
      ellipse(0, 10, 80, 20);
      // 白色鼎邊糊薄片
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      ellipse(-15, 6, 20, 10); ellipse(12, 8, 22, 10); ellipse(0, 12, 18, 8);
      // 海鮮配料
      fill('#FF7675'); stroke('#D63031'); strokeWeight(1);
      arc(-8, 4, 16, 10, PI, TWO_PI);
      fill('#2ED573'); noStroke();
      ellipse(10, 12, 5, 5); ellipse(-18, 12, 4, 4); ellipse(2, 6, 4, 4);
      pop();
      break;
    }

    case 'mussels': { // 淡菜 (馬祖肥美淡菜貽貝)
      push();
      rectMode(CENTER);
      let musselY = sin(t * 2.5) * 1.5;
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 12 + musselY, 90, 42);
      let positions = [
        [-22, 10, -0.3], [5, 5, 0.2], [22, 12, -0.1],
        [-8, 2, 0.4], [12, 8, -0.4]
      ];
      for (let p of positions) {
        push();
        translate(p[0], p[1] + musselY);
        rotate(p[2]);
        fill('#2D3748'); stroke('#1A202C'); strokeWeight(1.5);
        ellipse(0, 0, 28, 16); // 黑紫貽貝殼
        fill('#E67E22'); stroke('#D35400'); strokeWeight(1);
        ellipse(2, 0, 16, 10); // 橘黃嫩肉
        pop();
      }
      pop();
      break;
    }
      // ==========================================
    // ---- 新北市 Q1 (景點) ----
    // ==========================================
    case 'queens_head': { // 女王頭 (野柳地質公園尊貴側臉奇岩)
      push();
      rectMode(CENTER);
      let headY = sin(t * 2) * 1.5;
      // 蔚藍海岸與海浪
      fill('#74B9FF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 22, 85, 30, 0, PI);
      // 蕈狀石柱台座
      fill('#D4A574'); stroke('#8D5B4C'); strokeWeight(2);
      rect(0, 15, 24, 20, 3);
      // 女王頭細長脖子與高貴側臉輪廓
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      beginShape();
      vertex(-6, 8 + headY);
      bezierVertex(-4, -5 + headY, -16, -12 + headY, -18, -25 + headY); // 後腦勺髮髻
      bezierVertex(-10, -38 + headY, 10, -35 + headY, 16, -22 + headY); // 頭頂與前額
      bezierVertex(18, -12 + headY, 10, -8 + headY, 6, 8 + headY);      // 鼻尖與下巴
      endShape(CLOSE);
      // 蜂窩岩蜂巢質感斑點
      fill('#5D4037'); noStroke();
      ellipse(-5, -24 + headY, 4, 4); ellipse(2, -28 + headY, 5, 4); ellipse(6, -20 + headY, 4, 5);
      pop();
      break;
    }

    case 'jiufen': { // 九份老街 (山城階梯與掛紅燈籠)
      push();
      rectMode(CENTER);
      // 懷舊木造建築身軀
      fill('#8D5B4C'); stroke('#5D4037'); strokeWeight(2);
      rect(0, 0, 75, 55, 4);
      // 石階路梯
      fill('#B2BEC3'); stroke('#636E72'); strokeWeight(1.5);
      for (let y = 5; y <= 25; y += 8) {
        rect(0, y, 60 - y, 6, 2);
      }
      // 黑瓦斜木屋頂
      fill('#2D3436'); stroke('#1E272C'); strokeWeight(2);
      triangle(-42, -15, 42, -15, 0, -35);
      // 懸掛搖曳的大紅燈籠
      let jiufenLantern = sin(t * 3) * 3;
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(1.5);
      ellipse(-22 + jiufenLantern, -5, 14, 18);
      ellipse(22 + jiufenLantern, -5, 14, 18);
      fill('#F1C40F'); noStroke();
      ellipse(-22 + jiufenLantern, -5, 4, 4);
      ellipse(22 + jiufenLantern, -5, 4, 4);
      pop();
      break;
    }

    case 'fishermans_wharf': { // 淡水情人橋 (白色斜張橋與夕陽水景)
      push();
      rectMode(CENTER);
      // 淡水落日餘暉 (RGBA 透明度)
      fill(250, 177, 160, 220); stroke('#E17055'); strokeWeight(1.5);
      ellipse(0, -5, 75, 75);
      fill('#E17055'); noStroke(); ellipse(0, -5, 30, 30); // 暖紅夕陽
      // 弧形蔚藍海面
      fill('#0984E3'); stroke('#74B9FF'); strokeWeight(2);
      arc(0, 22, 85, 35, 0, PI);
      // 白色斜張橋高塔
      fill('#FFF'); stroke('#2D3436'); strokeWeight(2);
      quad(-28, 22, -22, 22, 18, -35, 12, -35);
      // 弧形單側橋面
      noFill(); stroke('#FFF'); strokeWeight(3);
      arc(0, 20, 75, 25, PI, TWO_PI);
      // 白色鋼纜線條
      stroke('#FFF'); strokeWeight(1);
      for (let x = -25; x <= 25; x += 10) {
        line(15, -30, x, 18);
      }
      pop();
      break;
    }

    case 'pingxi_lantern': { // 平溪天燈 (祈福夜空升空天燈)
      push();
      rectMode(CENTER);
      let lanternY = sin(t * 2) * 3;
      // 靜謐深藍夜空背景
      fill('#1A202C'); stroke('#2D3748'); strokeWeight(2);
      rect(0, 0, 85, 70, 6);
      // 暖橘紅天燈身軀
      push();
      translate(0, lanternY);
      fill('#E74C3C'); stroke('#C0392B'); strokeWeight(2);
      quad(-18, 12, 18, 12, 24, -22, -24, -22);
      arc(0, -22, 48, 14, PI, TWO_PI);
      // 底部燭光黃澄光亮 (RGBA 透明度)
      fill(241, 196, 15, 220); noStroke();
      ellipse(0, 8, 16, 10);
      fill(255, 255, 255, 200); ellipse(0, 8, 8, 5);
      // 平安祈福筆劃刻痕
      stroke('#FFF'); strokeWeight(1.5);
      line(-6, -10, 6, -10); line(0, -15, 0, -5);
      pop();
      pop();
      break;
    }

    // ==========================================
    // ---- 新北市 Q2 (美食) ----
    // ==========================================
    case 'agei': { // 淡水阿給 (油豆腐、冬粉與封口魚漿)
      push();
      rectMode(CENTER);
      let ageiY = sin(t * 2.5) * 1.5;
      // 經典青花瓷湯碗
      fill('#FFF'); stroke('#0984E3'); strokeWeight(2);
      arc(0, 12 + ageiY, 85, 60, 0, PI, CHORD);
      // 大方塊金黃油豆腐
      fill('#E67E22'); stroke('#D35400'); strokeWeight(2);
      rect(0, 5 + ageiY, 45, 38, 6);
      // 頂部鮮白魚漿封口
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1.5);
      ellipse(0, -12 + ageiY, 36, 16);
      // 靈魂阿給特調甜辣醬汁 (RGBA 透明度)
      fill(235, 77, 75, 220); noStroke();
      ellipse(5, -2 + ageiY, 32, 20);
      ellipse(-8, 8 + ageiY, 20, 12);
      // 蔥花與香菜點綴
      fill('#2ED573'); ellipse(-10, -10 + ageiY, 5, 5); ellipse(10, -6 + ageiY, 4, 4);
      pop();
      break;
    }

    case 'croissant': { // 三峽牛角麵包 (金黃香酥牛角)
      push();
      rectMode(CENTER);
      let croissantY = sin(t * 2) * 2;
      rotate(-PI / 12);
      // 白色陶瓷圓盤
      fill('#FFF'); stroke('#B2BEC3'); strokeWeight(2);
      ellipse(0, 15 + croissantY, 88, 38);
      // 金黃香酥牛角主體
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      beginShape();
      vertex(-32, 10 + croissantY);
      bezierVertex(-20, -25 + croissantY, 20, -25 + croissantY, 32, 10 + croissantY);
      bezierVertex(20, -5 + croissantY, -20, -5 + croissantY, -32, 10 + croissantY);
      endShape(CLOSE);
      // 兩側牛角尖與螺旋紋理
      fill('#E67E22'); stroke('#D35400'); strokeWeight(1.5);
      ellipse(-26, 8 + croissantY, 14, 14); ellipse(26, 8 + croissantY, 14, 14);
      ellipse(0, -14 + croissantY, 20, 14);
      // 白芝麻粒與亮澤光澤
      noStroke(); fill('#FFF');
      ellipse(-6, -16 + croissantY, 3, 2); ellipse(4, -14 + croissantY, 3, 2);
      pop();
      break;
    }

    case 'stinky_tofu': { // 深坑臭豆腐 (麻辣紅燒臭豆腐與酸菜)
      push();
      rectMode(CENTER);
      // 赤陶砂鍋底座
      fill('#5D4037'); stroke('#3E2723'); strokeWeight(2.5);
      arc(0, 10, 88, 62, 0, PI, CHORD);
      rect(-45, 0, 8, 14, 2); rect(45, 0, 8, 14, 2); // 兩側雙耳
      // 濃郁紅燒麻辣湯底
      fill('#C0392B'); stroke('#900C3F'); strokeWeight(1);
      ellipse(0, 10, 80, 22);
      // 滷至入味的方塊臭豆腐
      fill('#F5CBA7'); stroke('#D4A574'); strokeWeight(2);
      rect(-15, 6, 26, 22, 3); rect(15, 8, 26, 22, 3);
      // 特製酸菜與鮮紅辣椒切片
      fill('#27AE60'); noStroke();
      ellipse(0, 4, 18, 10);
      fill('#E74C3C'); ellipse(-8, 8, 6, 4); ellipse(18, 12, 6, 4);
      pop();
      break;
    }

    case 'taro_balls': { // 九份芋圓 (芋頭紫圓與地瓜黃圓冰品)
      push();
      rectMode(CENTER);
      let bowlY = sin(t * 2.5) * 1.5;
      // 復古黑木碗
      fill('#2D3436'); stroke('#1E272C'); strokeWeight(2);
      arc(0, 10 + bowlY, 86, 62, 0, PI, CHORD);
      // 碎冰/黑糖水冰面
      fill('#FFF'); stroke('#DFE6E9'); strokeWeight(1);
      ellipse(0, 10 + bowlY, 80, 22);
      // 香Q芋頭紫圓
      fill('#9B59B6'); stroke('#8E44AD'); strokeWeight(1.5);
      ellipse(-16, 6 + bowlY, 16, 14); ellipse(-4, 12 + bowlY, 14, 12); ellipse(-22, 14 + bowlY, 14, 12);
      // 金黃地瓜圓
      fill('#E67E22'); stroke('#D35400'); strokeWeight(1.5);
      ellipse(16, 6 + bowlY, 16, 14); ellipse(4, 4 + bowlY, 14, 12); ellipse(20, 14 + bowlY, 14, 12);
      // 香甜蜜紅豆配料
      fill('#632A15'); noStroke();
      ellipse(0, 14 + bowlY, 8, 6); ellipse(10, 12 + bowlY, 6, 5);
      pop();
      break;
    }


  }
  pop();

}

// ==========================================
// 共用 UI 元件與特效引擎
// ==========================================
function drawButton(x, y, w, h, label, col, hoverCol) {
  let isHover = isMouseInRect(x, y, w, h);
  fill(isHover ? hoverCol : col);
  noStroke();
  rectMode(CORNER);
  rect(x, y, w, h, 10);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  textStyle(BOLD);
  text(label, x + w / 2, y + h / 2);
}

function isMouseInRect(x, y, w, h) {
  return mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
}

// 繪製星形（徽章使用）
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = -PI / 2; a < TWO_PI - PI / 2; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 產生粒子
function createParticles(x, y, count, specificColor = null) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x, y: y,
      vx: random(-5, 5), vy: random(-10, 2),
      life: 255,
      color: specificColor || [random(100, 255), random(100, 255), random(100, 255)]
    });
  }
}

// 更新與繪製粒子
function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.vy += 0.2; // 重力
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 3; // 衰退
    
    fill(p.color[0], p.color[1], p.color[2], p.life);
    noStroke();
    ellipse(p.x, p.y, 8, 8);
    
    if (p.life <= 0) particles.splice(i, 1);
  }
}






// 輔助調點工具：繪製 0~1 的四角外框與 5% (0.05) 高密度細緻網格
function drawDebugGrid() {
  push();

  // 1. 用 twPoints 的四個邊角座標 [0,0], [1,0], [1,1], [0,1] 繪製外框矩形
  let bounds = [
    [0, 0], // 左上角
    [1, 0], // 右上角
    [1, 1], // 右下角
    [0, 1]  // 左下角
  ];

  stroke('#FF5722'); // 亮橘色外框
  strokeWeight(3);
  noFill();

  beginShape();
  for (let pt of bounds) {
    vertex(pt[0] * width, pt[1] * height);
  }
  endShape(CLOSE);

  // 2. 繪製 0.05 (5%) 密度的網格線與標籤
  textSize(10); // 縮小字體以防文字擠壓

  // X 軸直角網格線 (0.05, 0.10, 0.15 ... 0.95)
  for (let xR = 0.05; xR < 1.0; xR += 0.05) {
    let x = xR * width;
    let isMajor = Math.round(xR * 100) % 10 === 0; // 判斷是否為 0.10 的主刻度線

    // 主線較粗較深，副線較細較淡
    stroke(120, 120, 120, isMajor ? 160 : 60);
    strokeWeight(isMajor ? 1.5 : 0.8);
    line(x, 0, x, height);

    // 標記數字 (顯示到小數點後兩位)
    noStroke();
    fill(isMajor ? 30 : 120);
    textAlign(CENTER, TOP);
    text(xR.toFixed(2), x, 6);
  }

  // Y 軸水平網格線 (0.05, 0.10, 0.15 ... 0.95)
  for (let yR = 0.05; yR < 1.0; yR += 0.05) {
    let y = yR * height;
    let isMajor = Math.round(yR * 100) % 10 === 0; // 判斷是否為 0.10 的主刻度線

    stroke(120, 120, 120, isMajor ? 160 : 60);
    strokeWeight(isMajor ? 1.5 : 0.8);
    line(0, y, width, y);

    noStroke();
    fill(isMajor ? 30 : 120);
    textAlign(LEFT, CENTER);
    text(yR.toFixed(2), 6, y);
  }

  // 3. 標示四個頂點座標文字
  fill('#E65100');
  textSize(12);
  textAlign(LEFT, TOP);     text('[0, 0]', 12, 20);
  textAlign(RIGHT, TOP);    text('[1, 0]', width - 12, 20);
  textAlign(RIGHT, BOTTOM); text('[1, 1]', width - 12, height - 12);
  textAlign(LEFT, BOTTOM);  text('[0, 1]', 12, height - 12);

  pop();
}


// --------------------------------------------------
// 行動裝置觸控事件整合（全遊戲通用版）
// --------------------------------------------------
function touchStarted() {
  let tx = mouseX;
  let ty = mouseY;

  // 1. 【開始畫面】點擊進入按鈕
  // if (gameState === 'START') {
  //   let btnX = width / 2;
  //   let btnY = height * 0.7;
  //   let btnW = min(width * 0.5, 200);
  //   let btnH = 50;

  //   if (tx > btnX - btnW/2 && tx < btnX + btnW/2 &&
  //       ty > btnY - btnH/2 && ty < btnY + btnH/2) {
  //     gameState = 'MAP';
  //   }
  // } 

// 1. 【開始畫面】點擊進入按鈕
  if (gameState === 'START') {
    let btnX = width / 2;
    let btnY = height * 0.7;
    let btnW = min(width * 0.5, 200);
    let btnH = 50;

    if (tx > btnX - btnW/2 && tx < btnX + btnW/2 &&
        ty > btnY - btnH/2 && ty < btnY + btnH/2) {
      
      // 🔊 加入這行：點擊時播放音效
      if (soundClick && soundClick.isLoaded()) soundClick.play();

      gameState = 'MAP';
    }
  }


  // 2. 【其他遊戲畫面】讓 mousePressed() 接手處理地圖點擊與答題
  else if (typeof mousePressed === 'function') {
    mousePressed();
  }

  // 3. 阻止瀏覽器預設的滑動與下拉刷新
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    return false;
  }
}

function touchMoved() {
  // 保持禁止頁面滑動
  return false;
}
