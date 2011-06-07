function registerArticles() {
    $('.nav li h3').each(function() {
        var category = $(this).text().toLocaleLowerCase().replace(/[\.\s]+/g, '_');
        $(this).bind('click', function(evt) {
            collapseCategory($(this).siblings('ul .subnav'));
        });
        $(this).siblings('ul .subnav').each(function() {
            $(this).find('li').each(function() {
                var path = category + '/' + $(this).text().toLocaleLowerCase().replace(/[\.\s]+/g, '_');
                $(this).bind('click', function() {
                    loadArticle(path);
                });
            });
        });
    });
}

function loadArticle(path, firstTry) {
    if (path === '404' && !firstTry) {
        return;
    }

    $.ajax({
        url: 'content/' + path + '.html',
        success: function(data) {
            $('#container').html(data);
            $('pre code').each(function(i, e) {
                hljs.highlightBlock(e, '    ')
            });
        },
        error: function(xhr, error) {
            loadArticle('404', firstTry ? false : true);
        }
    });
}

function collapseCategory(category) {
    category.children().each(function() {
        $(this).toggle();
    })
}

function top() {
    $('html, body').animate({
        scrollTop: 0
    }, 'slow');
}

function scroll(anchor) {
    $('html, body').animate({
        scrollTop: $('a[name="' + anchor + '"]').offset().top - $('#conent').css('margin-top')
    }, 'slow');
}

$('document').ready(function() {
    registerArticles();

    // load home as first page to enter
    loadArticle('home');
});