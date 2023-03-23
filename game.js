//
// *** Classes
//

// Card class contains members face and suit strings
// and generates html representations with pseudo members
    
class Card {
    constructor( face, suit ){
	this.face = face;
	this.suit = suit;
    }
    get rank(){
	return faces.indexOf( this.face ) + 1;
    }
    get unicode(){
	return "1f0" +
	  {spades:"a", hearts:"b", diamonds:"c", clubs:"d"}[ this.suit ] +
	(this.rank > 11 ? this.rank+1 : this.rank).toString(16);
    }
    get entity(){
	return "&#x" + this.unicode + ";";
    }
    get card(){
	switch( this.suit ){
	default: return this.entity;
	case "hearts":
	case "diamonds": return "<font color=red>" + this.entity + "</font>";
	}
    }
    get clickableFromDeck(){
	return this.clickable( "clickDeck" );
    }
    get clickableFromBoard(){
        return this.clickable( "clickBoard" );
    }
    get cardFromHistory(){
	return '<span class="card">' + this.card +
	  ( this.hasOwnProperty("accepted") ?
	    (this.accepted ? "&#10003;" : "&#x2717;") : "" ) + '</span>';
    }
    clickable( func ){
	return '<span onclick="' + this.clickFunction(func) + '">' +
	  this.cardFromHistory + '</span>';
    }
    clickFunction( func ){
        return func + '(\'' + this.face + '\',\'' + this.suit + '\')';
    }
}



//
// *** Global variables
//


// dealerTable contains all dealer rules indexed by Mode

var dealerTable = [
  [ //mode 1  K-2
    [ "red cards",
      cards=>cards.map( card=> card.suit=="diamonds"||card.suit=="hearts" ) ],
    [ "black cards",
      cards=>cards.map( card=> card.suit=="spades"||card.suit=="clubs" ) ],
    [ "hearts",
      cards=>cards.map( card=> card.suit=="hearts" ) ],
    [ "diamonds",
      cards=>cards.map( card=> card.suit=="diamonds" ) ],
    [ "clubs",
      cards=>cards.map( card=> card.suit=="clubs" ) ],
    [ "spades",
      cards=>cards.map( card=> card.suit=="spades" ) ],
    [ "aces",
      cards=>cards.map( card=> card.face=="A" ) ],
    [ "twos",
      cards=>cards.map( card=> card.face=="2" ) ],
    [ "threes",
      cards=>cards.map( card=> card.face=="3" ) ],
  ],
    
  [ //mode 2  3-5
    [ "single-digit primes",
      cards=>cards.map( card=> [2,3,5,7].includes( card.face ) ) ],
    [ "ace + black jack",
      function(cards){
	var result = [false,false,false,false];
	var a = indexOfFace( cards, "A" );
	var j = indexOfFace( cards, "J" );
	if( a >= 0 && j >= 0 &&
	    (cards[j].suit=="spades"||cards[j].suit=="clubs") ){
	      result[a] = true;
	      result[j] = true;
	}
	return result;
      }
    ],
    [ "sum = 2", cards=>sumEquals( cards, 2 ) ],
    [ "sum = 3", cards=>sumEquals( cards, 3 ) ],
    [ "sum = 4", cards=>sumEquals( cards, 4 ) ],
  ],

  [ //mode 3  6-8
    [ "flush",
      cards=>cards.slice(1).reduce( (a,v)=>a&&v.suit==cards[0].suit, true )?
      [true,true,true,true]:[false,false,false,false] ],
    [ "4 of a kind",
      cards=>cards.slice(1).reduce( (a,v)=>a&&v.face==cards[0].face, true )?
      [true,true,true,true]:[false,false,false,false] ],
    [ "straight",
      function(cards){
	var f = cards.map( card=>faces.findIndex( x=>x==card.face ) ).sort();
	return (f[0]+1)==f[1] && (f[1]+1)==f[2] && (f[2]+1)==f[3]?
	  [true,true,true,true]:[false,false,false,false];
      }
    ],
  ],
];

var Mode;   //1:K-2,  2;3-5,  3:6-8,  4:PVP
var dealer; //randomly selected from dealerTable :[string f(card[4]):boolean[4]]
var turn;   //0:Player 1,  1:Dealer or Player 2

var faces = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
var suits = ["spades", "diamonds", "clubs", "hearts"];


const combinations = [ [0], [1], [2], [3],
			  [0,1], [0,2], [0,3], [1,2], [1,3], [2,3],
			  [0,1,2], [0,1,3], [0,2,3], [1,2,3],
			  [0,1,2,3] ];


//
// Models and associated Views
//  1. create the model
//  2. create the view
//  3. set view's html element
//  4. set view's update function
//  5. initialize model's value
//

var V = new View(); //empty view to access View functions on whole document
var GameView = new View(); //encapsulate Board, Deck, History, buttons
GameView.setHtmlElement( V.find("#game") );

var Deck = new Model();
var DeckView = new View( Deck );
DeckView.setHtmlElement( V.find("#deck") );
DeckView.onUpdate = function(deck){
  var fragment = document.createDocumentFragment();
  deck.forEach( function(card, i){
    var span = document.createElement('span');
    span.innerHTML = card.clickableFromDeck;
    fragment.appendChild(span);
    if( ((i+1) % 13) == 0 ) fragment.appendChild(document.createElement('br'));
  });
  this._htmlElement.appendChild(fragment);
}
Deck.value = buildDeck();

var Board = new Model();
var BoardView = new View( Board );
BoardView.setHtmlElement( V.find("#board") );
BoardView.onUpdate = function(board){
  // clear all cards from DOM
  var child = this._htmlElement.lastElementChild;
  while( child ){
    this._htmlElement.removeChild( child );
    child = this._htmlElement.lastElementChild;
  }
  // add all cards from Board.value to DOM
  var fragment = document.createDocumentFragment();
  board.forEach( function(card){
    var span = document.createElement('span');
    if( card.hasOwnProperty('accepted') ){
      if( Mode != 4 ){
	span.innerHTML = card.cardFromHistory;
      } else {
	span.innerHTML = card.clickableFromBoard;
      }
    } else {
      span.innerHTML = card.clickableFromBoard;
      //console.log( card.clickableFromBoard );
    }
    fragment.appendChild(span);
  });
  this._htmlElement.appendChild(fragment);
}
Board.value = new Array();

var History = new Model();
var HistoryView = new View( History );
HistoryView.setHtmlElement( HistoryView.find( "#history"));
HistoryView.onUpdate = function( hands ){
  if( hands.length > 0 ){
    var cards = hands[hands.length - 1];
    var fragment = document.createDocumentFragment();
    cards.forEach( function(card){
      var span = document.createElement('span');
      if( ! card.hasOwnProperty("accepted") ){
	card.accepted = false;
      }
      span.innerHTML = card.cardFromHistory;
      fragment.appendChild(span);
    });
    this._htmlElement.appendChild(fragment);
  }
}
History.value = new Array();

var Score = new Model();
var ScoreView = new View( Score );
ScoreView.setHtmlElement( ScoreView.find("#score") );
ScoreView.onUpdate = function(score){
  this._htmlElement.innerText = pad(score, 4);
}
Score.value = 0;

var Status = new Model();
var StatusView = new View( Status );
StatusView.setHtmlElement( StatusView.find("#status") );
StatusView.onUpdate = function(status){
  this._htmlElement.innerText = status;
}
Status.value = 'status';


//
// Functions
//


// Entry point is showGame() with the mode chosen from the menu

function showGame( mode )
{
  Mode = mode;
  GameView.show();
  hideMenu();
  startGame();
}

function startGame(){
  if( Mode != 4 ){
    var dealers = dealerTable[ Math.floor( Mode * Math.random() ) ];
    dealer = dealers[ Math.floor( dealers.length * Math.random() )];
  }
  turn = 0;
  Board.value = new Array();
  History.value = new Array();
  Status.value = "Select 4 cards";
  Score.value = 0;
  switch(Mode){
  case 1: showButton1(); break;
  case 2: showButton2(); break;
  case 3: break;
  case 4: hideButtons(); break;
  }
}


// Event Handler functions

function clickDeck( face, suit ){
  if( Board.value.length < 4 ){
    Board.value.push( new Card( face, suit ) );
    Board.value = Board.value;  // force update
    if( Board.value.length < 4 ){
      Status.value = 'Select ' + (4-Board.value.length) + ' cards';
    } else {
      Status.value = 'Click next to see what the dealer picks';
    }
  } else {
    Status.value = '4 cards already chosen';
  }
}

function clickBoard( face, suit ){
  if( turn == 0 ){
    removeFromBoard( face, suit );
  } else { //Dealer's turn
    if( Mode == 4 ){ //PVP mode
      toggleAccepted( face, suit );
    }
  }
}


function clickNext(){
  if( turn == 0 ){
    if( Board.value.length < 4 ){
      Status.value = 'Select ' + (4-Board.value.length) + ' more card'+
	((4-Board.value.length) > 1 ? 's' : '' ) + '!';
    } else {
      if( Mode != 4 ){
	handleDealer();
	Status.value = 'Click next for seller\'s turn';
	turn = (turn+1)%2;
      } else { //PVP Player 2
	Status.value = 'Accept or reject cards';
	turn = (turn+1)%2;
      }
    }
  } else {
    if( Mode == 4 ){
      calcScore();
    }
    handleBoard();
    Status.value = 'Select 4 cards';
    turn = (turn+1)%2;
  }
}

function handleDealer(){
  (dealer[1](Board.value)).forEach( (bool,i)=>Board.value[i].accepted=bool );
  Board.value = Board.value;  // force update
  calcScore();
}

function handleBoard(){  
  //add cards to History from Board
  History.value.push( Board.value );
  History.value = History.value;  // force update
  //clear Board
  Board.value = [];
}


// Other Functions

function buildDeck(){
  var d = new Array();
  for( var s = 0; s < suits.length; ++s ){
    for( var f = 0; f < faces.length; ++f ){
      var card = new Card( faces[f], suits[s] );
      d.push(card);
    }
  }
  return d;
}

function toggleAccepted( face, suit ){
  var cards = Board.value;

  var i = indexOfFace( cards, face );
  while(i >= 0){
    if( cards[i].suit == suit ){
      cards[i].accepted = cards[i].hasOwnProperty("accepted") ?
	( ! cards[i].accepted ) : true;
    }
    cards = cards.slice(i+1);
    i = indexOfFace( cards, face );
  }
  Board.value = Board.value;
}

function calcScore(){
  Board.value.forEach( card=> Score.value = Score.value + (card.accepted?1:0) );
}

function sumEquals( cards, x ){
  var results = new Array(4);
  results.fill(false);
  combinations.forEach( function(comb){
    var hand = comb.map( ind=> cards[ind] );
    var vals = hand.map( card=> 1 + faces.findIndex( x=>x==card.face ) );
    vals.forEach( (v,i,a)=> a[i] = v <= 10 ? v : 0 );//only number cards
    var sum = vals.reduce( (a,i)=>a+i, 0 );
    if( sum == x ){
      //hand.forEach( card=> card.accepted = true );
      comb.forEach( ind=> results[ind] = true );
    }
  });
  return results;
}

function faceCompare( a, b ){
  return faces.findIndex( x=>x==a.face ) - faces.findIndex( x=>x==b.face );
}

function indexOfFace( cards, face ){
  //console.log( cards.map( card=>card.face ) );
  return cards.map( card=> card.face ).findIndex( x=>x==face );
}

function pad( n, width ) { 
  n = n + ''; 
  return n.length >= width ? n :  
    new Array(width - n.length + 1).join('0') + n; 
} 

function removeFromBoard( face, suit ){
  Board.value =
    Board.value.filter( card=> card.face!=face || card.suit!=suit );
}

// Functions which could be refactored
// to use V.find(), V.findAll(), V.show() and V.hide()
// and adding extra <div> higherachy to treat groups in one go

function solveGameMode1(){
    var e = document.getElementById("rulesmode1");
    var result = e.options[e.selectedIndex].text;

    document.getElementById("result").innerHTML = result;
    var randomRule = dealer[0];
    if(result === randomRule)
        {
            alert("You win, the pattern was "+dealer[0]+"! Going back to menu");
            location.reload();
        }
    else
    {
        alert("Incorrect, keep playing!");
    }
    
}

function solveGameMode2(){
    var e = document.getElementById("rulesmode2");
    var result = e.options[e.selectedIndex].text;

    document.getElementById("resultmode2").innerHTML = result;
    var randomRule = dealer[0];
    if(result === randomRule)
        {
            alert("You win, the pattern was "+dealer[0]+"! Going back to menu");
            location.reload();
        }
    else
    {
        alert("Incorrect, keep playing!");
    }
    
}

function solveGameMode3(){
    var e = document.getElementById("rulesmode3");
    var result = e.options[e.selectedIndex].text;

    document.getElementById("resultmode3").innerHTML = result;
    var randomRule = dealer[0];
    if(result === randomRule)
        {
            alert("You win, the pattern was "+dealer[0]+"! Going back to menu");
            location.reload();
        }
    else
    {
        alert("Incorrect, keep playing!");
    }
    
}

function showButton1(){
    var x = document.getElementById("rulesmode2");
    var y = document.getElementById("rulesmode3");
    var a = document.getElementById("mode2button");
    var b = document.getElementById("mode3button");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
    if (y.style.display === "none") {
    y.style.display = "block";
  } else {
    y.style.display = "none";
  }
    
     if (a.style.display === "none") {
    a.style.display = "block";
  } else {
    a.style.display = "none";
  }
    
     if (b.style.display === "none") {
    b.style.display = "block";
  } else {
    b.style.display = "none";
  }
    
}

function showButton2(){
    var y = document.getElementById("rulesmode3");
    var a = document.getElementById("mode3button");

    if (y.style.display === "none") {
    y.style.display = "block";
  } else {
    y.style.display = "none";
  }
    
     if (a.style.display === "none") {
    a.style.display = "block";
  } else {
    a.style.display = "none";
  }
}

function hideButtons(){
  V.hide( V.find("#rulesmode3") );
  V.hide( V.find("#mode3button") );
  V.hide( V.find("#rulesmode2") );
  V.hide( V.find("#mode2button") );
  V.hide( V.find("#rulesmode1") );
  V.hide( V.find("#mode1button") );
}

function solveOption() {
  document.getElementById("myDropdown").classList.toggle("show");
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns1.length; i++) {
      var openDropdown1 = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function solveOption2() {
  document.getElementById("myDropdown2").classList.toggle("show");
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content1");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function solveOption3() {
  document.getElementById("myDropdown3").classList.toggle("show");
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content2");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function hideshowMenu() {
  var x = document.getElementById("howto");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}


// Functions using jQuery

function hideMenu() {
$(document).ready(function(){
  $(".menubutton").click(function(){
    $(".menubutton").hide();
  });
  $(".btn2").click(function(){
    $("p").show();
  });
});
}

$(document).ready(function(){
  $(".menubutton").click(function(){
    $(".menubutton").hide();
  });
});
$(document).ready(function(){
  $(".menubutton").click(function(){
    $(".menubutton").hide();
  });
});
$(document).ready(function(){
  $(".menubutton").click(function(){
    $(".menubutton").hide();
  });
});
$(document).ready(function(){
$(".menubutton").click(function(){
    $(".menubutton").hide();
  });
});

