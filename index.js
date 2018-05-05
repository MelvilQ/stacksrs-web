if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js');
}

const storage = window.localStorage;

function isLocalStorageSupported(){
  try {
    const key = "__some_random_key_you_are_not_going_to_use__123";
    storage.setItem(key, key);
    storage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

var app = new Vue({
  el: '#app',
  data: {
    page: 'logo', // logo, local, online, review, browser
    deckList: [],
    onlineDeckList: [],
    currentDeck: {},
    front: '',
    back: '',
    isShowingAnswer: false,
    filter: ''
  },
  computed: {
    filteredCards: function(){
      return this.currentDeck.cards.filter(card => (card.front + "->" + card.back).includes(this.filter));
    }
  },
  methods: {
    showError: function(msg){
      alert(msg);
    },
    loadLocalDeckList: function(){
      let json = storage.getItem('decklist');
      if(!json){
        this.deckList = [];
      } else {
        try {
          this.deckList = JSON.parse(json);
        } catch(e){
          console.log(e);
          this.showError('Could not load local deck list.');
          this.deckList = [];
        }
      }
    },
    saveLocalDeckList: function(){
      if(!this.deckList){
        this.showError('Cannot save empty deck list.');
        return;
      }
      try {
        storage.setItem('decklist', JSON.stringify(this.deckList));
      } catch(e){
        console.log(e);
        this.showError('Could not save local deck list.');
      }
    },
    updateLocalDeckList: function(){
      this.deckList.filter(deck => deck.file === this.currentDeck.file).forEach(deck => {
        deck.total = this.currentDeck.cards.length;
        deck.known = this.currentDeck.cards.filter(card => card.level > 2).length;
        deck.unknown = deck.total - deck.known;
      });
      this.saveLocalDeckList();
    },
    loadLocalDeck: function(file){
      try {
        this.currentDeck = JSON.parse(storage.getItem('deck_' + file));
        this.goToReview();
      } catch(e){
        console.log(e);
        this.showError('Could not load deck.');
      }
    },
    saveCurrentDeck: function(){
      try {
        storage.setItem('deck_' + this.currentDeck.file, JSON.stringify(this.currentDeck));
        this.updateLocalDeckList();
      } catch(e){
        console.log(e);
        this.showError('Could not save current deck.');
      }
    },
    loadServerDeckList: function(){
      axios.get('decks.txt').then(response => {
        this.onlineDeckList = response.data.decks;
      }).catch(e => {
        console.log(e);
        this.showError('Could not load online deck collection. Please try it again later.');
      });
    },
    importServerDeck: function(file){
      if(this.deckList.filter(deck => deck.file === file).length){
        this.loadLocalDeck(file);
        return;
      }
      axios.get(file + '.txt').then(response => {
        let downloadedDeck = response.data;
        downloadedDeck.cards.forEach(card => {
          card.level = 2;
        });
        this.currentDeck = Object.assign({}, downloadedDeck);
        downloadedDeck.cards = undefined;
        this.deckList.push(downloadedDeck);
        this.saveCurrentDeck();
        this.loadLocalDeck(file);
      }).catch(e => {
        console.log(e);
        this.goToServerDecks();
        this.showError('Could not import deck. Please try it again later.');
      });
    },
    importFromFile(file){
      // TODO
    },
    createNewDeck(){
      // TODO
    },
    saveCurrentDeckToFile(){
      download(this.currentDeck.file + '.txt', JSON.stringify(this.currentDeck));
    },
    deleteLocalDeck(file){
      storage.removeItem('deck_' + file);
      this.deckList = this.deckList.filter(deck => deck.file !== file);
      this.saveLocalDeckList();
      if(!this.deckList.length){
        this.goToServerDecks();
      }
    },
    tryLoadingDeck(file){
      let key = 'deck_' + file;
      if(key in storage){
        this.loadLocalDeck(file);
      } else {
        this.importServerDeck(file);
      }
    },
    goToReview: function(){
      console.log('switch to review');
      history.pushState(this.currentDeck.file, document.title, '#' + this.currentDeck.file);
      this.page = 'review';
      this.showNextCard();
    },
    goToLocalDecks: function(){
      console.log('switch to local deck list');
      history.pushState('', document.title, '#');
      this.page = 'local';
    },
    goToServerDecks: function(){
      console.log('switch to server deck list');
      history.pushState('', document.title, '#');
      this.page = 'online';
    },
    goToDeckBrowser: function(){
      console.log('switch to deck browser');
      this.page = 'browser';
    },
    goToAboutPage: function(){
      console.log('switch to about page');
      history.pushState('about', document.title, '#about');
      this.page = 'about';
    },
    showNextCard: function(){
      this.isShowingAnswer = false;
      this.front = this.currentDeck.cards[0].front;
      this.back = this.currentDeck.cards[0].back;
    },
    continue: function(){
      if(this.isShowingAnswer){
        this.correct();
      } else {
        this.showAnswer();
      }
    },
    showAnswer: function(){
      this.isShowingAnswer = true;
    },
    wrong: function(){
      if(this.page !== 'review' || !this.isShowingAnswer){
        return;
      }
      let card = this.currentDeck.cards.shift();
      card.level = Math.max(0, card.level - 2);
      let position = Math.min(3, this.currentDeck.cards.length);
      this.currentDeck.cards.splice(position, 0, card);
      this.saveCurrentDeck();
      this.showNextCard();
    },
    correct: function(){
      if(this.page !== 'review' || !this.isShowingAnswer){
        return;
      }
      let card = this.currentDeck.cards.shift();
      card.level += 1;
      let position = 99999999;
      if(card.level < 10){
        // this is the magic SRS formula:
        // level 1 => 16 cards later
        // level 2 => 64 cards later
        // level 3 => 256 cards later
        // and so on...
        position = 1 << (card.level * 2 + 2);
        // adding some randomness so that it doesn't get too predictable
        position = Math.floor(position + (2 * Math.random() * (position / 3)) - (position / 3));
        position = Math.min(position, this.currentDeck.cards.length);
      }
      this.currentDeck.cards.splice(position, 0, card);
      this.saveCurrentDeck();
      this.showNextCard();
    },
    shuffleCurrentDeck: function(){
      this.currentDeck.cards = _.shuffle(this.currentDeck.cards);
      this.saveCurrentDeck();
      this.showNextCard();
    },
    resetStrengthOfCurrentDeck(level){
      this.currentDeck.cards.forEach(card => {
        card.level = level;
      });
      this.saveCurrentDeck();
    },
    flagUrl: function(lang){
      return lang + '.svg';
    },
    highlightColor: function(card){
      if(card.level > 2){
        return 'well-known';
      } else if(card.level === 0){
        return 'new';
      } else {
        return 'learning';
      }
    }
  },
  mounted: function(){
    if(!isLocalStorageSupported()){
      this.showError('Your browser does not support local storage. Please use Chrome or Firefox.');
      return;
    }
    if('decklist' in storage){
      this.loadLocalDeckList();
    }
    let startDeck = window.location.hash ? window.location.hash.replace(/#/g, '') : null;
    if(startDeck === 'about'){
      this.goToAboutPage();
    } else if(startDeck){
      this.tryLoadingDeck(startDeck);
    } else if(this.deckList && this.deckList.length){
      this.goToLocalDecks();
    } else {
      this.goToServerDecks();
    }
    this.loadServerDeckList();
  }
});

// keyboard shortcuts
Mousetrap.bind('w', app.wrong);
Mousetrap.bind('f', app.wrong);
Mousetrap.bind('x', app.wrong);
Mousetrap.bind('r', app.correct);
Mousetrap.bind('c', app.correct);
Mousetrap.bind('s', app.showAnswer);
Mousetrap.bind('space', app.continue);
