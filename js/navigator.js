function registerArticles() {
    $('.nav li h3').each(function() {
        var category = $(this).text().toLocaleLowerCase().replace(/[\.\s]+/g, '_');
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

function loadArticle(path) {
    $.ajax({
        url: 'content/' + path + '.html',
        success: function(data) {
            alert('success');
            $('#container').html(data);
        },
        error: function(xhr, error) {
            alert(error);
        }
    });
}

$('document').ready(function() {
    registerArticles();
});