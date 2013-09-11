//Hello, and welcome the javascript code of Panelz, which parses structured text and turns it into graphical, interactive panels of text on a web page. We start, as is usually recommended, by closing everything in an anonymous function, declaring strict mode and defining some vars.
(function(){'use strict'; var

    // First there's the Story, which gives us the line(idx) function that returns an instruction for a given line index. This version is initialized with an array of script lines that it parses, but it should be rather easy for anyone to implement their own Story, which is not dependant on my invented syntax.
    Story = function(lines){

        // We keep the array with the lines to be parsed,
        Story.lines = lines;
        // a cache that fills up lazily, as the lines are parsed,
        Story.cache = [];
        // And the actual parser, which involves regular expressions and is not for the weak of heart or gentle of palate.
        Story.parse = function(l){

            // First of all, we test for a line that has nothing but white-spaces, which is a stop command.
            var m = l.match(/^\s*$/);
            if(m !== null){
                return;
            }

            // Now we check if it's a valid panel command, which is easily the most complex in the system. It starts with an optional label followed by the character ']', followed by an optional list of space separated classes and, optionally, by a colon followed by optional space separated positioning instructions: x offset, y offset, origin point, destination point, and the character '[' followed by the label of a previous panel to be used as anchor.
            m = l.match(/^(?:(.*))?]([^:]*)?(?::(-?[0-9.]+)?(?: (-?[0-9.]+)(?: (-?[0-9.]+)(?: (-?[0-9.]+))?)?)?(?:\s*\[(.*))?)?$/);
            if(m !== null){
                return{
                    type: 'panel',
                    labl: m[1],
                    clss: m[2] || '',
                    posi: $.map(m.slice(3, 7), function(n){if(!isNaN(n)) return parseFloat(n, 10);}),
                    ancr: m[7]
                };
            }

            // If it's not a panel, maybe it's an effect, which means it starts with a tilde, followed by the name of the effect followed by optional (space separated) arguments.
            m = l.match(/^~(\S*)(?:\s+(.*))?$/);
            if(m !== null){
                return{
                    type: 'effect',
                    cmd: m[1],
                    args: m[2] && m[2].split(/\s+/)
                };
            }

            // Anything else is considered a chunk of text to be printed in the panel, optionally preceded by a space separated, comma terminated list of classes that apply to it.
            m = l.match(/^(?:([^:]*):)?(.*)$/);
            if(m !== null){

                // We default the classes list to empty string, for easier handling.
                if('undefined' === typeof m[1]){
                    m[1] = '';

                // If the first class in the classes list is prefixed with a plus sign, we will not create a new chunk, but try to append the text to an existing chunk of the same class.
                }else{
                    if('+' === m[1][0]){
                        m[1] = m[1].slice(1);
                        m[3] = true;
                    }
                }

                // Otherwise it's a chunk.
                return{
                    type: 'chunk',
                    clss: m[1],
                    text: m[2],
                    apnd: m[3]
                };
            }
        }

        // Then we can get a specific line.
        Story.line = function(idx){

            // We try to use the cache,
            if('undefined' !== typeof Story.cache[idx]){
                return Story.cache[idx];
            // then we try the unparsed text.
            }else if('undefined' !== typeof Story.lines[idx]){
                // Not forgetting to cache the newly parsed line.
                return (Story.cache[idx] = Story.parse(Story.lines[idx]));
            }

            // Having failed, we return undefined, which is a stop command, so the Story is infinitely padded with stop commands on both sides.
            return;
        }
    },

    // Then there's the Frame, which gets initialized with an existing DOM element and replaces it with an empty clone in which we plant the Canvas upon which we draw the Story.
    Frame = function(e){

        // We keep the original element, to protect it from harm,
        Frame.orig = $(e);
        // then we measure if
        Frame.width = Frame.orig.innerWidth();
        Frame.height = Frame.orig.innerHeight();
        // and its font size.
        Frame.fontsize = parseFloat(Frame.orig.css('fontSize').slice(0, -2), 10);
        // Than we create an empty clone of it
        Frame.ours = Frame.orig.clone().empty();
        // which can replace the original while we draw on it,
        Frame.load = function(){

            // We insert the pimped up clone after the original
            Frame.ours.insertAfter(Frame.orig);
            // which we promptly detach (replaceWith would destroy any events associated with it, and we want to be able to switch it back in with no adverse effects),
            Frame.orig.detach();
            // and then we return the new frame, so whoever is calling us can bind stuff to it.
            return Frame.ours;
        }
        // and be replaced back when we are done.
        Frame.unload = function(){

            // Here it's OK to use replaceWith (we don't mind losing our own events),
            Frame.ours.replaceWith(Frame.orig);
            // and to prove we kept the original from harm, we return it.
            return Frame.orig;
        }

        // The initializer also loads the Frame.
        return Frame.load(e);
    },

    // And the Canvas, our dynamic drawing area. It is initialized with a callback function to call every time it finishes executing an instruction. Rewind operations call it with "true" as first argument. Ordinary operations pass it a rewind function that undoes the current changes.
    Canvas = function(done){

        // First we save the callback, so we don't forget.
        Canvas.done = done;
        // Then we need an actual div to put our panels on,
        Canvas.div = $('<div class="canvas"/>');
        // a dictionary of labeled panels, which can be referenced later for all sorts of cool stuff,
        Canvas.labels = {};
        // and the scripted position of the div. Note that this does not have to be the real position. Users can scroll, animations can be stopped, and who knows what the UI is doing; but the scripted position disregards all this nonsense and pretends it lives in a perfect world.
        Canvas.pos = {left: 0, top: 0};

        // We also write a function that makes sure the Canvas is at the scripted position.
        Canvas.place = function(){
            // This is the real position
            var pos = Canvas.div.position();
            // which we compare to the scripted one.
            if(Canvas.pos.left !== pos.left || Canvas.pos.top !== pos.top){
                Canvas.div.css({left: Canvas.pos.left, top: Canvas.pos.top});
            }
        };

        // For every scripted action we preform, we want to return a function that rewinds it, as the scope and time that preforms the action is best suited to write that function, so we have a little helper function that can take a function and a data object and return them closured.
        Canvas.enclose = function(f, d){return function(){f(d)}};

        // We always maintain a reference to the current panel. At this early point, the reference is initialized to a dummy panel that always returns position and size of 0 (so that we have a starting position). Note that it will give an error if you try to create a chunk in it. For that you need a real panel, and if your script has chunks with no panels that's on you.
        Canvas.cur = {
            pos: {left: '0em', top: '0em'},
            get: function(){return {
                style: this.pos,
                offsetWidth: 0,
                offsetHeight: 0
            };},
            position: function(){return this.pos;},
            outerWidth: function(){return 0;},
            outerHeight: function(){return 0;},
            point: function(){return {left: 0, top: 0};},
            ishidden: function(){return false;}
        };

        // With this we can create and draw panels (that can create and draw chunks of text). The parameters for a new panel are a string of space separated CSS classes (which define the look of the panes) and an array of up to four numbers which determines where it will be drawn (x offset, y offset, origin on anchor and destination on target - this will be made clearer later. I hope).
        Canvas.panel = function(labl, clss, posi, ancr){

            // The panel is a jquery div which we append to the Canvas and extend with a reference to its predecessor
            var p = $('<div class="panel"/>').addClass(clss).appendTo(Canvas.div).extend({
                prv: Canvas.cur,
            });

            // If it is labeled, we should keep it in the dictionary.
            if('undefined' !== typeof labl) Canvas.labels[labl] = p;

            // Panels are positioned relative to an anchor panel. By default this is the previous one.
            p.anchor = (ancr && Canvas.labels[ancr]) || p.prv;

            // But the anchor doesn't have to be the top-left corner of the panel (as is the CSS default). Instead, the corners are numbered clockwise from 0 to 3 starting at the top-left. Fractions are used to refer to points between the corners and all negative numbers refer to the center of the panel, just in case you ever wanna go there. Since this corner annotation is used both on the anchor panel and on the panel that is anchored to it (AKA "buoy panel"), we supply the panel with a function that translates it into CSS compatible coordinates.
            p.point = function(corner){

                // First we need the size of the panel, in ems.
                p.elem = p.get(0);
                p.width = p.elem.offsetWidth / Frame.fontsize;
                p.height = p.elem.offsetHeight / Frame.fontsize;

                // Now we start with the base CSS location (top-left corner, which we call 0) and work from there.
                p.pos = {left: 0, top: 0};

                // Just remember a rectangle has 4 corners and you will be OK.
                corner %= 4;

                // Negative numbers denote the middle of the element.
                if(corner < 0){
                    p.pos.left += p.width / 2;
                    p.pos.top += p.height / 2;

                // 0 to 1 is the top edge.
                }else if(corner < 1){
                    p.pos.left += corner * p.width;

                // 1 to 2 is the right edge.
                }else if(corner < 2){
                    p.pos.left += p.width;
                    p.pos.top += (corner - 1) * p.height;

                // 2 to 3 is the bottom edge.
                }else if(corner < 3){
                    p.pos.left += (1 - corner + 2) * p.width;
                    p.pos.top += p.height;

                // 3 to 4 is the left edge.
                }else if(corner < 4){
                    p.pos.top += (1 - corner + 3) * p.height;
                }

                return p.pos;
            };

            // By default, the new panel will be 1 em to the left of the anchor point
            p.left = 1;
            // while keeping the same height.
            p.top = 0;
            // The default anchor point is 1, which is the top-right corner,
            p.origin = 1;
            // and the default destination point on the new ("buoy", remember?) panel defaults to 0, which is the top-left corner.
            p.destination = 0;

            // But we override those defaults if we are supplied with arguments.
            if('undefined' !== typeof posi[0]){
                p.left = posi[0];
                if('undefined' !== typeof posi[1]){
                    p.top = posi[1];
                    if('undefined' !== typeof posi[2]){
                        p.origin = posi[2];
                        if('undefined' !== typeof posi[3]){
                            p.destination = posi[3];
                        }
                    }
                }
            }

            // Now we can calculate the desired left and top properties of the panel. This is a function because we will do it again every time the involved panels change, but don't worry, we will also call it as soon as we finish defining it.
            p.place = function(){

                // We start with basic measurements.
                var
                    // The anchor element,
                    anchor = p.anchor.get(0),
                    // the origin point on the anchor
                    origin = p.anchor.point(p.origin),
                    // and the destination point on the current panel.
                    destin = p.point(p.destination);

                // Then we get the anchor's top left in ems (look ma, no jquery),
                anchor = {
                    top: parseFloat(anchor.style.top.slice(0, -2), 10),
                    left: parseFloat(anchor.style.left.slice(0, -2), 10)
                };
                // and set the position of the panel.
                p.css({
                    'left': (anchor.left + origin.left + p.left - destin.left) + 'em',
                    'top': (anchor.top + origin.top + p.top - destin.top) + 'em'
                });
            };
            p.place();

            // It also might come in handy to test if a panel is completely visible, so we have a function for it.
            p.ishidden = function(){

                // First we measure the distance between the panel's position and the position of the Canvas (not forgetting that the Canvas and the panel are going in opposite directions),
                var
                    pos = p.position(),
                    xoff = pos.left + Canvas.pos.left,
                    yoff = pos.top + Canvas.pos.top;

                // then check if any of the corners is out of bounds and return the result.
                return !!(
                    xoff < 0 ||
                    yoff < 0 ||
                    xoff > (Frame.width - p.outerWidth()) ||
                    yoff > (Frame.height - p.outerHeight())
                );
            }

            // And most importantly, we give the panel a function that creates and draws chunks of text. It takes a string of space separated classes, which define how the chunk looks, and a string of text for content (can be HTML).
            p.chunk = function(clss, text){

                // The chunk is a jquery div which we append to the panel and extend.
                var c = $('<div class="' + clss + '"/>').html(text).appendTo(p).extend({
                    // with a reference to its containing panel
                    panel: p,
                    // and the chunk that preceded it,
                    prv: p.cur
                });

                // Then we set the new chunk as the current.
                p.cur = c;
            };

            // Then we set the new panel as the current.
            Canvas.cur = p;
        }

        // Now we need some special effects (well, currently there are two), which are all defined, parsed and dispatched from here. The Canvas.fx function is also syntactic sugar for calling Canvas.fx.dispatch, which is given a command string and an arguments array.
        Canvas.fx = function(cmd, args){

            // If the dispatcher is already defined, we have been this way before and we can simply use it.
            if('function' === typeof Canvas.fx.draw){
                return Canvas.fx.draw(cmd, args);
            }
            // Otherwise we better define our effects.

            // The most basic effect is sliding the Canvas to a new position (given as left and top CSS properties - the Canvas is relatively positioned within the Frame). It can accept a special flag that indicates its a rewind function, in which case it should not pass Canvas.done() a rewind function of itself. This is how the callback tells rewind operations and ordinary operations apart.
            Canvas.fx.pan = function(l, t, rewind){

                // If this is not a rewind already, we prepare a rewind function, so we will have something to feed the callback with.
                if(true !== rewind){
                    rewind = Canvas.enclose(function(d){
                        Canvas.fx.pan(d.l, d.t, true);
                    // Using the scripted position, of course.
                    }, {l: Canvas.pos.left, t: Canvas.pos.top});
                }

                // Now we can enqueue the animation. Jquery does not handle zoomed webkit windows very well, so I'm using a fake properties here.
                Canvas.div.animate({
                    lleft: l,
                    ttop: t
                },{
                    step: function(x, fx){
                        Canvas.div.css(fx.prop.slice(1), x);
                    },
                    queue: 'panelz',
                    complete: function(){Canvas.done(rewind);}
                });

                // Now we can change the scripted position,
                Canvas.pos = {left: l, top: t};
                // and start the animation,
                Canvas.div.dequeue('panelz');
            };

            // Only slightly more complex is this animation, which centers a panel (it defaults to the current panel, and centering it is the default effect).
            Canvas.fx.center = function(anchor){

                // We define variables for the left and top coordinates we will pan to.
                var left, top;

                // If an anchor was given, we try to get it,
                if('string' === typeof anchor){
                    anchor = Canvas.labels[anchor];
                }
                // then we default to the current panel.
                if('undefined' === typeof anchor){
                    anchor = Canvas.cur;
                }

                // We measure the anchor
                anchor.pos = anchor.position();
                anchor.absleft = anchor.pos.left;
                anchor.abstop = anchor.pos.top;
                anchor.width = anchor.outerWidth();
                anchor.height = anchor.outerHeight();
                // and subtract its position from half the Frame's size minus half the anchor's size.
                left = (0.5 * (Frame.width - anchor.width)) - anchor.absleft;
                top = (0.5 * (Frame.height- anchor.height)) - anchor.abstop;

                // Finally we call pan, which handles the callback and rewind for us.
                Canvas.fx.pan(left, top);
            };

            // And now the dispatcher itself.
            // TODO One day we might accept plugins, but ATM if you want your own effects you just write them here. Just make sure they call Canvas.done(f) when they are done, passing it a rewind function that calls Canvas.done(true) when *it* is done.
            Canvas.fx.draw = function(cmd, args){

                // 'pan' with two numbers pans the Canvas
                if('pan' === cmd) return Canvas.fx.pan(parseFloat(args[0]), parseFloat(args[1]));
                // and 'center' centers a panel.
                if('center' === cmd) return Canvas.fx.center(args && args[0]);
                // Anything else has no effect, but still needs to call da callback with an equally lethargic rewind function.
                else return Canvas.done(function(){Canvas.done(true);});
            };

            // Anyone who gets here is just looking for the dispatcher.
            return Canvas.fx.draw(cmd, args);
        };

        // So if you give us an instruction (which the Story is pretty good at), we can make it happen on the Canvas, and we will make sure the callback gets called when it's done.
        Canvas.draw = function(i){

            // We define a variable for chunks that the current chunk might need to be appended to and one for rewind functions, just in case we run into them later on,
            var appendee, rewind;
            // finish any running animations,
            Canvas.div.finish('panelz');
            // and make sure we are at the right spot.
            Canvas.place();
            //TODO what's I'd really love to do is to tell the Canvas to speed up the animation, not just jump to the last 'frame'.

            // Don't bother with anything else unless you get specific instructions.
            if('undefined' === typeof i) return;

            // Now we check the instruction. It might be a panel,
            if('panel' === i.type){
                // and then we create it
                Canvas.panel(i.labl, i.clss, i.posi, i.ancr);
                // and return to the callback with the rewind function (no closure required).
                return Canvas.done(function(){

                    // Remove the current panel,
                    Canvas.cur.remove();
                    // set the previous panel as current
                    Canvas.cur = Canvas.cur.prv;
                    // and call the callback.
                    Canvas.done(true);
                });
            // it might be a chunk,
            }else if('chunk' === i.type){
                // and then we check if it's meant to be appended to an old chunk.
                if(true === i.apnd){
                    // in which case we go back through the chain of chunks, hoping to find one that shares the first class in the classes list with the chunk we want to add.
                    appendee = Canvas.cur.cur;
                    while('undefined' !== typeof appendee){
                        if(appendee.hasClass(i.clss.split(' ')[0])){
                            break;
                        }else{
                            appendee = appendee.prv;
                        }
                    }
                }

                // New chunks are easy:
                if('undefined' === typeof appendee){
                    // create it
                    Canvas.cur.chunk(i.clss, i.text);
                    // and create a rewind function that removes it.
                    rewind = function(){
                        Canvas.cur.cur.remove();
                        Canvas.cur.cur = Canvas.cur.cur.prv;
                    };

                // Appendages are a little trickier:
                }else{
                    // we know it might change the class attribute of whatever chunk it will be appended to, so we start by creating a closured function that will chop it off along with the classes it rode to town on. Note that we are using the html() function, as the text of the chunk may very well be.
                    rewind = Canvas.enclose(function(d){
                        d.appendee.attr('class', d.clss).html(d.txt);
                    },{appendee: appendee, clss: appendee.attr('class'), txt: appendee.html()});

                    // Only then do we append the appendage with its potentially new classes.
                    appendee.addClass(i.clss).append(i.text);
                }

                // After adding chunks we tell the containing panel to reposition itself. TODO This should probably be propagated to a chain of buoy panels, maybe also on some resize event.
                Canvas.cur.place();
                // The same is true also after removing chunks and appendages, so let's append it to our rewind function and return it already.
                return Canvas.done(Canvas.enclose(function(rewind){
                    rewind();
                    Canvas.cur.place();
                    Canvas.done(true);
                }, rewind));
            // or else it's an effect, in which case we send it to the effects dispatcher.
            }else if('effect' === i.type){
                return Canvas.fx(i.cmd, i.args);
            }
        };

        // And, as a bonus, we give you a function that checkes if the current panel is completely visible.
        Canvas.iscurhidden = function(){return Canvas.cur.ishidden();};

        // The initializer of the Canvas returns its div, for cannibalistic purposes.
        return Canvas.div;
    },

    // With these parts we can build the Artist who stretches the Canvas on the Frame and draws the Story on it. He is initialized with a script for the Story and a DOM element for the Frame. And he is also our API. What a guy.
    Artist = window.panelz = function(scriptstr, frame){

        // We will require a flag, to indicate that we are loaded,
        Artist.loaded = false;
        // a bookmark, to keep track of our position (set to -1 as we haven't even started),
        Artist.bookmark = -1;
        // a flag to indicate we are busy,
        Artist.busy = false;
        // a direction to head in,
        Artist.dir = 0;
        // a stack to keep our rewind functions,
        Artist.rewinds = [];
        // a stack to keep track of unscripted operation (currently just auto centering),
        Artist.unscripted = [];
        // and something small to hold the current instruction.
        Artist.i = {};

        // Now you can give us a positive number to advance the Story and a negative number to rewind it. This function also doubles as the callback we give to the Canvas, with which it tells us it is done and to which it passes the rewind functions (or true, when called from a rewind function).
        Artist.go = function(dir){

            // If we do not get a number, it's the Canvas telling us its done and we are staying in the same direction. If it passed us a rewind function we stash it, and in any event we are no longer busy.
            if('number' !== typeof dir){
                if('function' === typeof dir) Artist.rewinds.push(dir);
                dir = Artist.dir;
                Artist.busy = false;
            // Otherwise it is the UI asking us to go somewhere, so we set a direction and politely ask the Canvas to finish whatever it is doing.
            }else{
                dir = (dir < 0) ? -1 : 1;
                Canvas.draw();
            }

            // If we are told to go off the story borders, we do not go there. It is a silly place.
            if((Artist.bookmark + dir) === -2 || (Artist.bookmark + dir) === Story.lines.length + 1) return;

            // Otherwise we get busy, and everything from here on must never run concurrently.
            if(true == Artist.busy) return;
            Artist.busy = true;

            // We set the direction
            Artist.dir = dir;
            // and if we are rewinding, we check for unscripted operations that may need rewinding.
            if(-1 === Artist.dir){
                if(Artist.bookmark === Artist.unscripted[Artist.unscripted.length - 1]){
                    Artist.unscripted.pop();
                    return Artist.rewinds.pop()();
                }
            }

            // Only then can we advance or rewind the bookmark to get the instruction for the appropriate line.
            Artist.i = Story.line(Artist.bookmark = Artist.bookmark + Artist.dir);

            // If the Story gives us an instruction, we follow it.
            if('undefined' !== typeof Artist.i){

                // We either draw a line if we are headed forward,
                if(1 === Artist.dir) return Canvas.draw(Artist.i);
                // or rewind a line (using a stacked rewind function) if we are headed back. Note how we pop the double bubble at the end there :)
                else return Artist.rewinds.pop()();
            // Otherwise, we have arrived at a stop command.
            }else{

                // If we are going forward and the current panel is hidden, we center on it, but not before we mark this as an unscripted effect, so we will know to rewind it, and set Artist.dir to zero so we will stop moving.
                if(1 === Artist.dir && true === Canvas.iscurhidden()){
                    Artist.unscripted.push(Artist.bookmark);
                    Artist.dir = 0;
                    return Canvas.fx('center');
                }
            }

            // And if we made it up to here, we should unset the busy flag.
            Artist.busy = false;
        };

        // The load function loads the Story and the Frame and plants the Canvas in it.
        Artist.load = function(scriptstr, frame){
            // First we initialize the Story with the lines of the script,
            Story(scriptstr.split("\n"));
            // then we initialize the Frame and return our new DOM element, so the UI can use its events, to which we append the Canvas with Artist.go() as a callback.
            return Frame(frame).append(Canvas(Artist.go));
        },

        // And the unload function is even simpler.
        Artist.unload = function(){return Frame.unload()};

        // The only reason for someone to get here is if he is trying to load the Artist.
        return Artist.load(scriptstr, frame);
    };

// Then we call the anonymous function we just declared and everything should just work. Simple and fun.
}());
