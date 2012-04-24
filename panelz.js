var STORY = [
    '-p',
    '-c:Sumeria: 747AD',
    '-d:The inside of a cheap motel, a black telephone rings in the dark',
    '-b:Hello?',
    '-p',
    '-c:Now:',
    '-b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
    '-p',
    'c:Sumeria: 747AD',
    'd:The inside of a cheap motel, a black telephone rings in the dark',
    'b:Hello?',
    '-p',
    'c:Now:',
    'b:Is there anybody?',
];

var CLASSES = {
    c: 'caption',
    d: 'description',
    b: 'balloon',
};

// The current position in the story
var cur = false;

// Add a panel
function panel(autoadd){
    var p = {};
    p.prev = cur;
    p.cur = false;
    p.div = $('<div class="panel"/>');
    p.add = function(){$('#panelz').append(p.div);};
    if(autoadd) p.add();
    return cur = p;
}

function chunk(clss, text, autoadd){
    var c = {};
    c.panel = cur;
    c.prev = c.panel.cur;
    c.div = $('<div class="' + clss + '">' + text + '</div>');
    c.add = function(){c.panel.div.append(c.div);};
    if(autoadd) c.add();
    return c.panel.cur = c;
}

// Offscreen buffer
var buffer = [];

// When the page is done loading
$(document).ready(function(){
    ;
// When a key is pressed
}).keydown(function(){
    var draw = true;
    var c = STORY.shift();
    if('-' == c[0]){
        c = c.slice(1);
        draw = false;
    }
    if('p' == c[0]){
        buffer.push(panel());
    }else{
        buffer.push(chunk(CLASSES[c[0]], c.slice(c.indexOf(':') + 1)));
    }
    if(draw){
        $.each(buffer, function(i, e){
            e.add();
        });
        buffer = [];
    }else{
        $(document).keydown();
    }
});
