var face = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "J", "Q", "K"];
var suit = ["spades", "diamonds", "clubs", "hearts"];


var deck = new Array();


//simply iterates through and builds the deck
function build_deck() {
    d = new Array();
    for (var s = 0; s < suit.length; s++) {
        for (var f = 0; f < face.length; f++) {
            var card = [face[f], suit[s]];
            d.push(card);
        }
    }
    return d;
}
deck = build_deck();

