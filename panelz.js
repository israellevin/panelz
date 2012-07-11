// Let's see if I can make the comments tell the story.

// We start with the frame of our story, which will, when the document is ready, be an existing div in the DOM.
var frame;

// We also have a bookmark, so I don't have to page from the beginning every time. TODO In the future, this value will be taken from a cookie, or the cursor position in the textarea.
var bookmark = 0;

// And last, we have the canvas, a dynamic drawing area that's currently just a div,
var canvas = $('<div class="canvas"/>');
// but once the document is ready we get the text of the script and create() it anew, filled with all of the functions and references that it needs. It is possible that frame and bookmark should also be part of it (and maybe the auxiliary functions at the bottom). We will see.
canvas.create = function(text){

    // The text gets parsed, lazily, each line when it's needed. The parsed instructions are stored as the story, so they do not need to be parsed again if you go to and fro.
    canvas.story = {};

    // Commands are put in a queue, and only executed after a draw command (empty line).
    canvas.buffer = [];

    // We save the index of the current line
    canvas.idx = -1;
    // and a reference to the current panel which, at this early point, , is initialized to a dummy panel that always returns position and size of 0 (this is done so that we have a starting position).
    canvas.cur = {
        position: function(){return posit(0, 0);},
        outerWidth: function(){return 0;},
        outerHeight: function(){return 0;},
        point: function(){return {left: 0, top: 0};}
    };

    // When it's time to draw a panel, we use this function which takes a string of space separated classes, which defines how the panel looks, and an array of up to four numbers which determines where it will be drawn (x offset, y offset, origin and destination).
    canvas.panel = function(clss, posi){

        // The panel object is a jquery div which we append to the canvas
        var p = $('<div class="panel ' + clss + '"/>').appendTo(canvas);
        // with a reference to its predecessor
        p.prev = canvas.cur;
        // and its current chunk of text.
        p.cur = false;

        // Panels are positioned relative to an anchor panel. Currently the only possible anchor panel is the previous one (TODO In the future we will have labels and this default will stop being the only option).
        p.anchor = p.prev;

        // But the anchor doesn't have to be the top-left corner of the panel (as is the CSS default). Instead, the corners are numbered clockwise from 0 to 3 starting at the top-left. Fractions are used to refer to points between the corners and all negative numbers refer to the center of the panel, just in case you ever wanna go there. Since this corner annotation is used both on the anchor panel and on the panel that is anchored to it (AKA "buoy panel"), we supply a function that translates it into CSS compatible coordinates.
        p.point = function(corner) {

            // Get position and size of element.
            var o = p.position();
            var w = p.outerWidth();
            var h = p.outerHeight();

            // A rectangle has only four corners.
            corner %= 4;

            // Negative numbers denote the middle of the element.
            if(corner < 0){
                o.left += w / 2;
                o.top += h / 2;

            // 0 to 1 is the top edge.
            }else if(corner < 1){
                o.left += corner * w;

            // 1 to 2 is the right edge.
            }else if(corner < 2){
                o.left += w;
                o.top += (corner - 1) * h;

            // 2 to 3 is the bottom edge.
            }else if(corner < 3){
                o.left += (1 - corner + 2) * w;
                o.top += h;

            // 3 to 4 is the left edge.
            }else if(corner < 4){
                o.top += (1 - corner + 3) * h;
            }

            return o;
        };

        // By default, the new panel will be 3 pixels (FIXME this should be measured in ems, really) to the left of the anchor point
        p.left = 3;
        // while keeping the same height.
        p.top = 0;
        // The default anchor point is 1, which is the top-right corner,
        p.o = 1;
        // and the default destination point on the new ("buoy", remember?) panel defaults to 0, which is the top-left corner.
        p.d = 0;

        // But we override those defaults if we are supplied with arguments.
        if('undefined' !== typeof posi[0]){
            p.left = posi[0];
            if('undefined' !== typeof posi[1]){
                p.top = posi[1];
                if('undefined' !== typeof posi[2]){
                    p.o = posi[2];
                    if('undefined' !== typeof posi[3]){
                        p.d = posi[3];
                    }
                }
            }
        }
        // Now we can calculate the desired left and top properties of the panel. This is a function because we will do it again every time the involved panels change, but don't worry, we will also call it as soon as we finish defining it.
        p.place = function(){

            // We get the origin coordinates
            var o = p.anchor.point(p.o);
            // and the offset between the destination point and the 0 point (top-left corner) of the new panel.
            var d = p.point(p.d);
            // and we can set the position of the panel.
            p.css({
                'left': (o.left + p.left - d.left) + 'px',
                'top': (o.top + p.top - d.top) + 'px'
            });
        }
        p.place();

        // When we want to add a chunk of text to the panel we use this function, which takes a string of space separated classes, which define how the chunk looks, and a string of text.
        p.chunk = function(clss, text){

            // The chunk is a jquery div which we add to the panel
            var c = $('<div class="' + clss + '">' + text + '</div>').appendTo(p);
            // with a reference to its containing panel
            c.panel = p;
            // and the chunk that preceded it.
            c.prev = p.cur;

            // All that remains it to set the new panel as the current chunk and return it.
            p.cur = c;
            return c;
        }

        // All that remains it to set the chunk we created as the current panel and return it.
        canvas.cur = p;
        return p;
    };

    // The canvas has effects you can call. Most basic of which is this animation that slides the canvas to a new position (given as left and top CSS properties - the canvas is relatively positioned within the frame).
    canvas.pan = function(l, t){
        canvas.animate(posit(l,t), {queue: false});
    }

    // Only slightly more complex is this animation, which centers the current panel. This is the default effect.
    canvas.center = function(){

        // We obtain the position of the current panel in the frame
        var p = canvas.cur.position();
        var l = p.left;
        var t = p.top;
        // and subtract it from half a frame minus half a panel.
        l = (0.5 * (frame.innerWidth() - canvas.cur.outerWidth())) - l;
        t = (0.5 * (frame.innerHeight() - canvas.cur.outerHeight())) - t;
        canvas.pan(l, t);
    };

    // The canvas can move the story forward till the next draw command
    canvas.forward = function(){
        // taking care not advance the story past the end
        if(1 === text.length - canvas.idx) return;

        // First we get the next line in the story, parsing it if hasn't been parsed yet.
        if('undefined' === typeof canvas.story[++canvas.idx]){
            canvas.story[canvas.idx] = parseLine(text[canvas.idx]);
        }
        var l = canvas.story[canvas.idx];

        // Then we buffer all commands
        if('draw' !== l.type){
            canvas.buffer.push(l);
            canvas.forward();
        // till it's time to draw.
        }else{

            // We keep a flag that sets when pans occur. If none were explicitly stated, we center the current panel as a default effect.
            var pan = false;

            // As long as there are command in the queue
            while(canvas.buffer.length > 0){
                // pop the first command out of it.
                l = canvas.buffer.shift();
                // If it's a panel, create a panel,
                if('panel' === l.type){
                    canvas.panel(l.clss, l.posi);
                // if it's a chunk, create a chunk,
                }else if('chunk' === l.type){
                    canvas.cur.chunk(l.clss, l.text);
                // and if it's an effect, execute it
                }else if('effect' === l.type){
                    if('pan' === l.command){
                        canvas.pan(l.arguments[0], l.arguments[1]);
                    }else if('center' === l.command){
                        canvas.center();
                    }
                    // and don't forget to set the flag.
                    pan = true;
                }
            }

            // If the flag was not set, we center the current panel.
            if(!pan) canvas.center();
        }
    };

    // The canvas can also move story backward
    canvas.backward = function(){
        // taking care not go back past the beginning.
        if(1 > canvas.idx){
            canvas.idx = -1;
            return;
        }

        // First we decrement the index and check the previous command.
        canvas.idx--;
        var l = canvas.story[canvas.idx];

        // If it's a draw command
        if('draw' === l.type){
            // we center the current panel.
            canvas.center();

        }else{
            // If it's an effect, we ignore it. TODO In the future we will undo it, if it's an effect worth undoing.
            if('effect' === l.type){
                ;

            // If it's a chunk,
            }else if('chunk' === l.type){
                // we remove it
                canvas.cur.cur.remove();
                // and set the previous chunk as current.
                canvas.cur.cur = canvas.cur.cur.prev;
            // And if it's a panel
            }else if('panel' === l.type){
                // we remove it
                canvas.cur.remove();
                // and set the previous panel as current.
                canvas.cur = canvas.cur.prev;
            }

            // And since it wasn't a draw command, we keep going back till we hit one or reach the start of the story.
            canvas.backward();
        }
    };
}

// When the page is done loading
$(document).ready(function(){
    // we get the frame div, append the canvas to it
    frame = $('#panelz').append(canvas);
    // and initialize the canvas with an array of lines containing the text from the textarea in the frame (which we detach). TODO In the far future we may have an edit mode which brings it back.
    canvas.create(frame.find('textarea').detach().text().split("\n"));

    // On mouse down within the frame we get ready for a mouse drag which will pan the canvas. On all of the events we need to bind here (mousedown, mousemove and mouseup) we return false, to make sure they do not propagate and, e.g., start selecting pieces of the page.
    frame.mousedown(function(e){

        // First we save the starting position of the mouse drag
        var startx = e.pageX;
        var starty = e.pageY;
        // and the starting position of the canvas.
        var o = canvas.offset();
        var l = o.left;
        var t = o.top;

        // Then we bind a function so that when the mouse moves we calculate how much it moved since the drag started and modify the top and left CSS properties of the canvas to move it along with the pointer.
        frame.mousemove(function(e){
            canvas.offset(posit(
                    l + (e.pageX - startx),
                    t + (e.pageY - starty)
            ));
            return false;

        // Once the drag ends, we unbind the mouse move function.
        }).one('mouseup', function(e){
            frame.off('mousemove');
            return false;
        });
        return false;
    });

    // And now that we have basic paging defined, we forward the story to the current location.
    while(canvas.idx < bookmark) canvas.forward();

// Other than dragging to pan, all the interface is currently keyboard driven, so when a key is pressed we check if it's a known command.
}).keydown(function(e){

    // Right arrow and space go forward.
    if(39 === e.which || 32 === e.which){
        canvas.forward();

    // Left arrow goes back.
    }else if(37 === e.which){
        canvas.backward();

    // Anything else will log itself, to make it easier for me to bind new keys to new functions, and return true so that someone else will handle it.
    }else{
        console.log('unknown key', e.which);
        return true;
    }

    // If the keystroke was recognized as a command and handled, we return false, to stop propagation.
    return false;
});

// Parser for panelz commands.
function parseLine(l){
    var m;

    // Draw: empty line
    m = l.match(/^\s*$/);
    if(m !== null){
        return{
            type: 'draw'
        };
    }

    // Panel: starts with the character ']', followed by an optional
    // list of classes (space separated) and an optional colon with up
    // to 4 optional comma separated positioning instructions: x offset,
    // y offset, origin and destination (floating point numbers).
    m = l.match(/^]([^:]*)?(?::(-?[0-9.]+)(?:,(-?[0-9.]+)(?:,(-?[0-9.]+)(?:,(-?[0-9.]+))?)?)?)?$/);

    if(m !== null){
        return{
            type: 'panel',
            clss: m[1] || '',
            posi: $.map(m.slice(2), function(n){
                if(!isNaN(n)) return parseFloat(n, 10);
            })
        };
    }

    // Effect: starts with the character '~', followed by a commands
    // and optional arguments (space separated).
    m = l.match(/^~(\S*)\s+(.*)$/);
    if(m !== null){
        return{
            type: 'effect',
            command: m[1],
            arguments: m[2] && m[2].split(/\s+/)
        };
    }

    // Chunk: a optional list of classes (space separated) separated by
    // a colon from the optional free text of the chunk.
    m = l.match(/^(?:([^:]*):)?(.*)$/);
    if(m !== null){
        return{
            type: 'chunk',
            clss: m[1] || '',
            text: m[2]
        };
    }
}

// Objectify two numbers into jquery's position format.
function posit(left, top){
    return {
        left: parseInt(left, 10),
        top: parseInt(top, 10)
    };
}

// FIXME figure out if we need this crap.
// As panelz is so very text oriented, all sizes and measurements are done with ems, so we have a zoom-aware object that converts between pixels and ems.
var ruler = {

    // To find the current rate of pixels to ems we create an invisible div and measure it. This needs to be redone on every resize.
    init: function(){
        var d = $('<div style="width: 1em; background-color: red;">lala</div>');
        $('body').append(d);
        return 'this';
//var h, $d = $('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo($e);
    }
}
