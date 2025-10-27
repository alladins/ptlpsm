$(document).ready(function(){

    $("#gnb>ul>li").bind("mouseenter focusin", function(){
        $("#gnb>ul>li.on").removeClass("on");
        $(this).addClass("on");
        var depth2 = $("#gnb>ul>li").children('.submenu').innerHeight() + 90;
        $(this).find('div').slideDown(0);
        $('#header').addClass('active');
    });
    $("#gnb>ul>li").bind("mouseleave", function(){
        $("#gnb>ul>li.on").removeClass("on");
        $("#gnb>ul>li .submenu").slideUp(0);
        $('#header').removeClass('active');
    });
    $("#gnb>ul>li").on("focusout", function(){
        $(this).removeClass("on");
        $('#header').removeClass('active');
    });

    $(window).on('load resize scroll',function() {
        if($(this).scrollTop() == 0){
            $('#header').removeClass('current');
        } else {
            $('#header').addClass('current');
        }            
    });

	//all menu
	function showSidebar() {
        sidebar.show(0, function() {
            sidebar.fadeTo('200', 1);
        });
        overlay.show(0, function() {
            overlay.fadeTo('200', 0.3);
        });
    }
    function hideSidebar() {
        sidebar.fadeTo('200', 0, function() {
            sidebar.hide();
        });
        overlay.fadeTo('200', 0, function() {
            overlay.hide();
        });
    }
    var sidebar = $('.all-menu-nav');
    var button = $('.allmenu');
    var overlay = $('.page-overlay');
    overlay.parent().css('min-height', 'inherit');
    sidebar.parent().css('min-height', 'inherit');
    button.click(function() {
        if (overlay.is(':visible')) {
            hideSidebar();
            $('.all-menu-nav').removeClass('current');
        } else {
            showSidebar();
            $('.all-menu-nav').addClass('current');
        }
        return false;
    });
    overlay.click(function() {
        hideSidebar();
    });

    $('.lnb li>a.mobile').on('click', function(){
        var element = $(this).parent('li');
        if (element.hasClass('open')) {
            element.removeClass('open');
            element.find('li').removeClass('open');
            element.find('ul').slideUp(200);
        }
        else {
            element.addClass('open');
            element.children('ul').slideDown(200);
            element.siblings('li').children('ul').slideUp(200);
            element.siblings('li').removeClass('open');
        }
    });

    //page top
    $(window).scroll(function() {
        if ($(this).scrollTop() > 50) {
        $('.page-top').fadeIn();
            } else {
        $('.page-top').fadeOut();
            }
        if($(window).scrollTop() + $(window).height() > $(document).height() - 1) {
            $(".page-top").addClass("on");
        } else {
            $(".page-top").removeClass("on");
        }
    });
    $('.page-top').click(function() {
        $('html, body').animate({ scrollTop : 0 }, 200);
        return false;
    });

    AOS.init({
        once: true,
        duration: 1000
    });
    $(window).on('load', function () {
        AOS.refresh();
    });
});
