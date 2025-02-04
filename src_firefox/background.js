(function () {
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }
  class Queue {
    constructor(maxsize = 5) {
      this.maxsize = maxsize;
      this.array = [];
    }
    empty() {
      return this.array.length === 0;
    }
    full() {
      return this.array.length === this.maxsize;
    }
    size() {
      return this.array.length;
    }
    capacity() {
      return this.maxsize;
    }
    pop() {
      if (!this.empty()) {
        return this.array.shift();
      }
    }
    push(item) {
      if (!this.full()) {
        this.array.push(item);
        return true;
      }
      return false;
    }
  }
  class illustSource extends Queue {
    constructor(maxsize = 1) {
      super(maxsize);
      this.baseUrl = "https://www.pixiv.net";
      this.illustInfoUrl = "/ajax/illust/";
      this.maxRetries = 10;
      this.running = 0;
    }
    async fetchJson(url) {
      return fetch(url, { signal: AbortSignal.timeout(5000) })
        .then((res) => res.json())
        .then((res) => {
          return new Promise((resolve, reject) => {
            if (res.error === true) {
              reject(res);
            } else {
              resolve(res);
            }
          });
        });
    }
    async fetchImage(url) {
      return fetch(url, { signal: AbortSignal.timeout(5000) })
        .then((res) => res.blob());
    }
  }
  class DiscoverySource extends illustSource {
    constructor(maxsize = 200) {
      super(maxsize);
      // this.url = "/ajax/discovery/artworks?mode=all&limit=100";
      this.url = "/ajax/discovery/artworks?mode=all";
    }
    async getItem() {
      let item = this.pop();
      if (item === undefined) {
        let jsonResult = await this.fetchJson(this.baseUrl + this.url);
        let A = jsonResult.body.thumbnails.illust;
        let tasks = [];
        for (let i = 0; i < A.length; ++i) {
          tasks.push(this.fetchJson(this.baseUrl + this.illustInfoUrl + A[i].id)
            .then((illustInfo, reject) => {
              if (illustInfo.body.bookmarkCount + illustInfo.body.likeCount < 10000) {
                reject("too small bookmarks and likes");
              } else {
                this.push({
                  userName: illustInfo.body.userName,
                  userId: illustInfo.body.userId,
                  illustId: illustInfo.body.illustId,
                  userIdUrl: this.baseUrl + "/users/" + illustInfo.body.userId,
                  illustIdUrl: this.baseUrl + "/artworks/" + illustInfo.body.illustId,
                  title: illustInfo.body.title,
                  profileImageUrl: A[i].profileImageUrl,
                  imageObjectUrl: illustInfo.body.urls.regular,
                });
              }
            })
          );
        }
        await Promise.any(tasks);
        item = this.pop();
      }
      return item;
    }
  }

  class SearchSource extends illustSource {
    constructor(maxsize = 2) {
      super(maxsize);
      this.illustInfoPages = {};
      // this.positiveTagArray = [
      //   "オリジナル",
      //   "女の子",
      //   // "漫画",
      //   "東方",
      //   // "落書き",
      //   // "アナログ",
      //   // "創作",
      //   "艦これ",
      //   // "ポケモン",
      //   // "イラスト",
      //   // "艦隊これくしょん",
      //   "初音ミク",
      //   // "VOCALOID",
      //   // "オリキャラ",
      //   // "らくがき",
      //   "少女",
      //   // "Fate/GrandOrder",
      //   "おっぱい",
      //   "FGO",
      //   // "アイドルマスターシンデレラガールズ",
      //   // "ケモノ",
      //   "水着",
      //   // "東方Project",
      //   // "原创",
      //   // "擬人化",
      //   // "なにこれかわいい",
      //   // "練習",
      //   // "百合",
      //   // "ラブライブ!",
      //   "アイドルマスター",
      //   "バーチャルYouTuber",
      //   // "模写",
      //   // "fanart",
      //   // "魔法少女まどか☆マギカ",
      //   "巨乳",
      //   // "原創",
      //   // "うごイラ",
      //   // "girl",
      //   // "風景",
      //   // "ドット絵",
      //   // "ファンタジー",
      //   // "版権",
      //   // "制服",
      //   // "ハロウィン",
      //   // "猫",
      //   // "背景",
      //   // "コピック",
      //   // "original",
      //   // "水彩",
      //   "ロリ",
      //   // "anime",
      //   // "セーラー服",
      //   // "illustration",
      //   // "ホロライブ",
      //   // "艦これかわいい",
      //   // "けものフレンズ",
      //   // "東方project",
      //   // "うちの子",
      //   // "VTuber",
      //   // "色鉛筆",
      //   "アズールレーン",
      //   // "鏡音リン",
      //   // "クリスマス",
      //   // "デジタル",
      //   "かわいい",
      //   // "Original",
      //   // "動物",
      //   // "猫耳",
      //   // "モノクロ",
      //   // "チルノ",
      //   // "女子高生",
      //   // "アークナイツ",
      //   // "描いてもいいのよ",
      //   // "プリキュア",
      //   // "3DCG",
      //   // "art",
      //   "原神",
      //   // "ツインテール",
      //   // "ラブライブ!サンシャイン!!",
      //   // "明日方舟",
      //   // "博麗霊夢",
      //   // "ウマ娘プリティーダービー",
      //   // "ガールズ&パンツァー",
      //   // "霧雨魔理沙",
      //   "ウマ娘",
      //   // "少女前線",
      //   "ふつくしい",
      //   // "魅惑のふともも",
      //   // "ドールズフロントライン",
      //   "魅惑の谷間",
      //   // "ガンダム",
      //   // "ブラックマジシャンガール",
      //   // "スク水",
      //   // "フランドール・スカーレット",
      //   // "グランブルーファンタジー",
      //   "バニーガール",
      //   "黒タイツ",
      //   // "尻神様",
      //   "極上の乳",
      //   "おへそ",
      //   // "プリンセスコネクト!Re:Dive",
      //   // "仕事絵",
      //   // "エロマンガ先生",
      //   // "ゼノブレイド",
      //   // "パンチラ",
      //   "メイド",
      //   "可愛い",
      //   "ビキニ",
      //   "ふともも",
      //   "ぱんつ",
      //   // "パンツ",
      //   // "下着",
      //   "尻",
      // ];
      // this.negativeTagArray = [
      //   // "腐向け",
      //   "腐",
      //   // "ヘタリア",
      //   // "ケモノ",
      //   "刀剣乱舞",
      //   // "おそ松さん",
      //   // "女体化",
      //   // "男の子",
      //   // "ショタ",
      //   // "鬼滅の刃",
      //   // "僕のヒーローアカデミア",
      //   // "黒子のバスケ",
      //   // "銀魂",
      //   // "進撃の巨人",
      //   // "ハイキュー!!",
      //   // "ワンピース",
      //   // "獣人",
      //   // "テニスの王子様",
      //   // "戦国BASARA",
      //   // "忍たま",
      //   // "twst夢",
      //   // "少年",
      //   // "美男子",
      //   // "イナズマイレブン",
      //   // "デフォルメ",
      //   // "にじさんじ",
      //   // "描き方",
      //   "講座",
      //   // "作画資料",
      //   // "創作",
      //   // "素材",
      //   "漫画",
      //   // "SideM",
      //   "メイキング",
      //   "BL",
      // ];
      this.positiveTagArray = [
        "7500users入り",
        "10000users入り",
        "30000users入り",
        "50000users入り"
      ];
      this.negativeTagArray = [
        "虚偽users入りタグ",
        "描き方",
        "講座",
        "作画資料",
        "創作",
        "素材",
        "漫画",
      ];
      this.searchParam = {
        order: "date_d",
        mode: "safe",
        p: "1",
        // blt: "20000",
        s_mode: "s_tag",
        type: "illust",
      };
      this.totalPage = 300;
      this.itemsPerPage = 60;
      this.searchUrl = "/ajax/search/illustrations/";
      this.illustInfoPages = {};
    }

    replaceSpecialCharacter = (function () {
      var reg = /[!'()~]/g;
      var mapping = {
        "!": "%21",
        "'": "%27",
        "(": "%28",
        ")": "%29",
        "~": "%7E",
      };
      var map = function (e) {
        return mapping[e];
      };
      var fn = function (e) {
        return encodeURIComponent(e).replace(reg, map);
      };
      return fn;
    })();

    generateSearchUrl(p = 1) {
      let sp = this.searchParam;
      sp.p = p;
      let pWord = this.positiveTagArray.join(" OR ");
      let nWord = "-" + this.negativeTagArray.join(" -");
      let word = nWord + ' (' + pWord + ')';
      let firstPart = encodeURIComponent(word);
      let secondPartArray = [];
      secondPartArray.push("?word=" + this.replaceSpecialCharacter(word));
      for (let o in sp) {
        secondPartArray.push(`${o}=${sp[o]}`);
      }
      let secondPart = secondPartArray.join("&");
      return firstPart + secondPart;
    }

    async searchIllustPage(p) {
      let paramUrl = this.generateSearchUrl(p);
      let jsonResult = await this.fetchJson(this.baseUrl + this.searchUrl + paramUrl);
      if (!jsonResult.body || !jsonResult.body.illust || !jsonResult.body.illust.data) {
        throw new Error('empty search result');
      }
      return jsonResult;
    }

    async getRandomIllust() {
      let randomPage = getRandomInt(0, Math.min(this.totalPage, 1000)) + 1;
      if (!this.illustInfoPages[randomPage]) {
        try {
          let pageObj = await this.searchIllustPage(randomPage);
          let total = pageObj.body.illust.total;
          let tp = Math.ceil(total / this.itemsPerPage);
          if (tp > this.totalPage) {
            this.totalPage = tp;
          }
          // filter sensitive images
          // pageObj.body.illust.data = pageObj.body.illust.data.filter(
          //   (el) => el.sl < 3
          // );
          this.illustInfoPages[randomPage] = pageObj.body.illust.data;
        } catch (e) {
          throw new Error(e);
        }
      }
      let illustArray = this.illustInfoPages[randomPage];
      let randomIndex = getRandomInt(0, illustArray.length);
      if (!illustArray || !illustArray[randomIndex]) {
        throw new Error('empty illustor info');
      }
      let res = {
        illustId: illustArray[randomIndex].id,
        profileImageUrl: illustArray[randomIndex].profileImageUrl
      };
      return res;
    }

    async getItem() {
      let item = this.pop();
      let tries = 0;
      while (item === undefined) {
        ++tries;
        try {
          await this.fill();
        } catch (error) {
          if (tries < this.maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw new Error(error);
          }
        } finally {
          item = this.pop();
        }
      }
      return item;
    }

    async fill() {
      let tasks = [];
      while (this.capacity() > this.size() + this.running) {
        ++this.running;
        tasks.push(new Promise((resolve, reject) => {
          let res;
          try {
            res = this.getRandomIllust();
            resolve(res);
          } catch (e) {
            reject(res);
          }
        }).then((res) =>
          this.fetchJson(this.baseUrl + this.illustInfoUrl + res.illustId)
            .then((illustInfo) => {
              res.userName = illustInfo.body.userName;
              res.userId = illustInfo.body.userId;
              res.illustId = illustInfo.body.illustId;
              res.userIdUrl = this.baseUrl + "/users/" + illustInfo.body.userId;
              res.illustIdUrl = this.baseUrl + "/artworks/" + illustInfo.body.illustId;
              res.title = illustInfo.body.title;
              res.imageObjectUrl = illustInfo.body.urls.regular;
              this.push(res);
            })
        ).catch((e) => console.log(e))
          .finally(() => { --this.running; }));
      }
      return Promise.any(tasks);
    }
  }
  class IllustFeeder extends illustSource {
    constructor(maxsize = 2) {
      super(maxsize);
      this.sources = {
        // discoverySource: new DiscoverySource(),
        searchSource: new SearchSource()
      }
    }
    async getItem() {
      let item = this.pop();
      let tries = 0;
      while (item === undefined) {
        ++tries;
        try {
          await this.fill();
        } catch (error) {
          if (tries < this.maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            throw new Error(error);
          }
        } finally {
          item = this.pop();
        }
      }
      return item;
    }
    async fill() {
      let ss = Object.values(this.sources);
      let tasks = [];
      while (this.capacity() > this.size() + this.running) {
        ++this.running;
        tasks.push(new Promise((resolve) =>
          resolve(ss[getRandomInt(0, ss.length)].getItem())
        ).then((item) =>
          Promise.all([
            this.fetchImage(item.imageObjectUrl)
              .then((blob) => {
                return new Promise((resolve, reject) => {
                  let reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                }).then((url) => {
                  item.imageObjectUrl = url;
                });
              }),
            this.fetchImage(item.profileImageUrl)
              .then((blob) => {
                return new Promise((resolve, reject) => {
                  let reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                }).then((url) => {
                  item.profileImageUrl = url;
                });
              })
          ]).then(() => item)
        ).then((item) => {
          this.push(item);
        }).catch((e) => { console.log(e) })
          .finally(() => { --this.running; }));
      }
      return Promise.any(tasks);
    }
  }

  const illustFeeder = new IllustFeeder();

  browser.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
      let existed = false;
      let refName = "Referer";
      let refValue = "https://www.pixiv.net/";
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (
          details.requestHeaders[i].name.toLowerCase() === refName.toLowerCase()
        ) {
          details.requestHeaders[i].value = refValue;
          existed = true;
          break;
        }
      }
      if (!existed) {
        details.requestHeaders.push({
          name: refName,
          value: refValue,
        });
      }
      return { requestHeaders: details.requestHeaders };
    },
    { urls: ["*://*.pixiv.net/*", "*://*.pximg.net/*"] },
    ["blocking", "requestHeaders"]
  );

  browser.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    if (message.action === "fetchImage") {
      illustFeeder.getItem()
        .then((res) => {
          sendResponse(res);
          console.log(res);
        }).then(() => {
          illustFeeder.fill();
        }).catch((e) => {
          sendResponse(null);
          console.log(e);
        });
    }
    return true;
  });
})();
