function place(panel){
    var x = panel.attr('data-pos-x');
    var y = panel.attr('data-pos-y');

    if('undefined' === typeof(x) && 'undefined' === typeof(y)){
        x = 105;
        y = 0;
    }else{
        if('undefined' === typeof(x)){
            x = 0;
        }else if('' === x){
            x = 105;
        }
        if('undefined' === typeof(y)){
            y = 0;
        }else if('' === y){
            y = 105;
        }
    }

    var c;
    var e = panel.prev();
    if(0 === e.length){
        e = $(window);
        c = [(e.width() / 2), e.height() / 2];

        x = x * (((e.width() / 2) - (panel.outerWidth() / 2)) / 100);
        y = y * (((e.height() / 2) - (panel.outerHeight() / 2)) / 100);

        x = x - (panel.outerWidth() / 2) + c[0];
        y = y - (panel.outerHeight() / 2) + c[1];
    }else{
        c = [e.offset().left + (e.outerWidth() / 2), e.offset().top + (e.outerHeight() / 2)];

        x = x * (((e.outerWidth() / 2) + (panel.outerWidth() / 2)) / 100);
        y = y * (((e.outerHeight() / 2) + (panel.outerHeight() / 2)) / 100);

        x = x - (panel.outerWidth() / 2) + c[0];
        y = y - (panel.outerHeight() / 2) + c[1];
    }

    panel.css('left', x);
    panel.css('top', y);

    panel.css('position', 'absolute');
    panel.css('display', 'block');
};

function next(){
    place($('div.panel:hidden').first());
//    $('div.panel:hidden').first().css('display', 'block');
//    $('span.chunk:hidden').first().css('display', 'block');
}

$(document).ready(function(){
//    $('div.panel').each(function(){
//        place($(this));
//    });
//
//    curpanel = $('div.panel').first();
//    curchunk = curpanel.find('span.chunk').first();
    $(document).keypress(function(){
        next();
    });
});
