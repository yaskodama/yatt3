
$(document).ready(function(){
    var lv = new LoginValidator();
    var lc = new LoginController();
	/* add by yass */
    var hc = new HomeController();
	/* add by yas */

    // Landing-page gallery: click a user icon to swap the time-table below
    // in place (no full page reload).
    $('.user-gallery').on('click', '.user-card', function(e) {
	var href = $(this).attr('href') || '';
	var m = href.match(/^\/([^\/]+)\/top$/);
	if (!m) { return; }                       // fall back to normal link
	e.preventDefault();
	var user = m[1];
	var $card = $(this);
	var $mount = $('#timetable-mount');
	$mount.addClass('is-loading');
	$.get('/api/timetable/' + encodeURIComponent(user), function(html) {
	    $mount.html(html).removeClass('is-loading');
	    $('.user-card').removeClass('is-current');
	    $card.addClass('is-current');
	    var $tag = $('#tt-tagline');
	    $tag.text('@' + user + ($tag.attr('data-suffix') || ''));
	    if (window.history && history.pushState) {
		history.pushState({ user: user }, '', '/' + user + '/top');
	    }
	}).fail(function() { window.location.href = href; });
    });
    // Back/forward should reflect the URL that was pushed.
    $(window).on('popstate', function() { window.location.reload(); });

    $("#login-form").ajaxForm({
	beforeSubmit : function(formData, jqForm, options) {
	    if (lv.validateForm() == false) {
		return false;
	    } else {
	// append 'remember-me' option to formData to write local cookie //
		formData.push({name:'remember-me', value:$("input:checkbox:checked").length == 1})
		return true;
	    }
	},
	success	: function(responseText, status, xhr, $form){
	    if (status == 'success') {
		// redirect to the logged-in user's personal home: /<user>/home
		var u = null;
		try { u = JSON.parse(responseText).user; } catch (e) {}
		window.location.href = u ? ('/' + u + '/home') : '/home';
	    }
	},
	error : function(e){
	    	lv.showLoginError('Login Failure', 'Please check your username and/or password');
	}
    }); 
    $('#user-tf').focus();
	
// login retrieval form via email //
	
    var ev = new EmailValidator();
    $('#get-credentials-form').ajaxForm({
	url: '/lost-password',
	beforeSubmit : function(formData, jqForm, options){
	    if (ev.validateEmail($('#email-tf').val())) {
	    	ev.hideEmailAlert();
		return true;
	    } else {
		ev.showEmailAlert("<b> Error!</b> Please enter a valid email address");
		return false;
	    }
	},
	success	: function(responseText, status, xhr, $form) {
	    ev.showEmailSuccess("Check your email on how to reset your password.");
	},
	error : function() {
	    ev.showEmailAlert("Sorry. There was a problem, please try again later.");
	}
    });

    // i18n is now rendered server-side (Pug __()); client-side bundle loading
    // is disabled so it does not overwrite the translated markup.
    // loadBundles(null);
    jQuery('.open-UpdateAndEnd').click(function() {
	if(jQuery('#Code').is('*')) jQuery('#input-leccode').attr({value: jQuery('#Code')[0].value });
	if(jQuery('#title').is('*')) jQuery('.input-title').attr({value: jQuery('#title')[0].value });
	if(jQuery('#objective').is('*')) jQuery('.input-objective').attr({value: jQuery('#objective')[0].value });
	if(jQuery('#textbook').is('*')) jQuery('.input-textbook').attr({value: jQuery('#textbook')[0].value });
	if(jQuery('#reference').is('*')) jQuery('.input-reference').attr({value: jQuery('#reference')[0].value });
	if(jQuery('#advreference').is('*')) jQuery('.input-advreference').attr({value: jQuery('#advreference')[0].value });
	if(jQuery('#title').is('*')) jQuery('#modal-title').empty().append(jQuery('#title')[0].value);
	if(jQuery('#objective').is('*')) jQuery('#modal-objective').empty().append(jQuery('#objective')[0].value);
	if(jQuery('#textbook').is('*')) jQuery('#modal-textbook').empty().append(jQuery('#textbook')[0].value);
	if(jQuery('#reference').is('*')) jQuery('#modal-reference').empty().append(jQuery('#reference')[0].value);
	if(jQuery('#advreference').is('*')) jQuery('#modal-advreference').empty().append(jQuery('#advreference')[0].value);
        });
    jQuery('select#lang').empty().append('<option value="browser">Indicated by the browser</option><option value="en">en</option><option value="ja">ja</option>');
    jQuery('#langbrowser').text('('+jQuery.i18n.browserLang()+')');                                      
    jQuery('#lang').change(function() {
        var selection = jQuery('#lang option:selected').val();
        jQuery('#langbrowser').append(selection);
        loadBundles(selection != 'browser' ? selection : null);
        jQuery('#langbrowser').empty();
        if(selection == 'browser') {                                                                      
            jQuery('#langbrowser').text('('+jQuery.i18n.browserLang()+')');                               
        }                                                                                                
        });
    });
    function loadBundles(lang) {
        jQuery.i18n.properties({
	    name:'Messages', 
            path:'/bundle/', 
            mode:'both',
            language:lang, 
            callback: function() {
            	updateExamples();
	    }
        });
    }
    function updateExamples() {
	jQuery('#welcome_i18n').empty().append(jQuery.i18n.prop('welcome_i18n'));
	jQuery('#timetable_i18n').empty().append(jQuery.i18n.prop('timetable_i18n'));
	jQuery('#library_i18n').empty().append(jQuery.i18n.prop('library_i18n'));
	jQuery('#lectures_i18n').empty().append(jQuery.i18n.prop('lectures_i18n'));
	jQuery('#eportfolio_i18n').empty().append(jQuery.i18n.prop('eportfolio_i18n'));
	jQuery('#ranking_i18n').empty().append(jQuery.i18n.prop('ranking_i18n'));
	jQuery('#requirements_i18n').empty().append(jQuery.i18n.prop('requirements_i18n'));
	jQuery('#username_i18n').empty().append(jQuery.i18n.prop('username_i18n'));
	jQuery('#password_i18n').empty().append(jQuery.i18n.prop('password_i18n'));
	jQuery('#login_name_i18n').empty().append(jQuery.i18n.prop('login_name_i18n'));
	jQuery('#logout_name_i18n').empty().append(jQuery.i18n.prop('logout_name_i18n'));
	jQuery('#edit_name_i18n').empty().append(jQuery.i18n.prop('edit_name_i18n'));
	jQuery('#edit_name_2_i18n').empty().append(jQuery.i18n.prop('edit_name_2_i18n'));
	jQuery('#language_i18n').empty().append(jQuery.i18n.prop('language_i18n'));
	jQuery('#event_meeting_i18n').empty().append(jQuery.i18n.prop('event_meeting_i18n'));
	jQuery('#monday_i18n').empty().append(jQuery.i18n.prop('monday_i18n'));
	jQuery('#tuesday_i18n').empty().append(jQuery.i18n.prop('tuesday_i18n'));
	jQuery('#wednesday_i18n').empty().append(jQuery.i18n.prop('wednesday_i18n'));
	jQuery('#thursday_i18n').empty().append(jQuery.i18n.prop('thursday_i18n'));
	jQuery('#friday_i18n').empty().append(jQuery.i18n.prop('friday_i18n'));
	jQuery('#saturday_i18n').empty().append(jQuery.i18n.prop('saturday_i18n'));
	jQuery('#first_lec_i18n').empty().append(jQuery.i18n.prop('first_lec_i18n'));
	jQuery('#second_lec_i18n').empty().append(jQuery.i18n.prop('second_lec_i18n'));
	jQuery('#third_lec_i18n').empty().append(jQuery.i18n.prop('third_lec_i18n'));
	jQuery('#fourth_lec_i18n').empty().append(jQuery.i18n.prop('fourth_lec_i18n'));
	jQuery('#fifth_lec_i18n').empty().append(jQuery.i18n.prop('fifth_lec_i18n'));
	jQuery('#fromthrough_i18n').empty().append(jQuery.i18n.prop('fromthrough_i18n'));
	jQuery('#signin_i18n').empty().append(jQuery.i18n.prop('signin_i18n'));
	jQuery('#username_i18n').empty().append(jQuery.i18n.prop('username_i18n'));
	jQuery('#edit2_name_2_i18n').empty().append(jQuery.i18n.prop('edit2_name_2_i18n'));
	jQuery('.confirm_i18n').empty().append(jQuery.i18n.prop('confirm_i18n'));
	jQuery('.delete_i18n').empty().append(jQuery.i18n.prop('delete_i18n'));
	jQuery('#update_and_edit_i18n').empty().append(jQuery.i18n.prop('update_and_edit_i18n'));
	jQuery('#objective_i18n').empty().append(jQuery.i18n.prop('objective_i18n'));
	jQuery('#textbooks_i18n').empty().append(jQuery.i18n.prop('textbooks_i18n'));
	jQuery('#references_i18n').empty().append(jQuery.i18n.prop('references_i18n'));
	jQuery('#advreferences_i18n').empty().append(jQuery.i18n.prop('advreferences_i18n'));
	jQuery('#modal_title_i18n').empty().append(jQuery.i18n.prop('modal_title_i18n'));
	jQuery('#modal_textbooks_i18n').empty().append(jQuery.i18n.prop('modal_textbooks_i18n'));
	jQuery('#modal_objectives_i18n').empty().append(jQuery.i18n.prop('modal_objectives_i18n'));
	jQuery('#modal_references_i18n').empty().append(jQuery.i18n.prop('modal_references_i18n'));
	jQuery('#modal_advreferences_i18n').empty().append(jQuery.i18n.prop('modal_advreferences_i18n'));
	jQuery('#modal_advreferences_i18n').empty().append(jQuery.i18n.prop('modal_advreferences_i18n'));
	jQuery('#update_button_i18n').empty().append(jQuery.i18n.prop('update_button_i18n'));
	jQuery('#cancel_and_edit_off_i18n').empty().append(jQuery.i18n.prop('cancel_and_edit_off_i18n'));
	jQuery('#signout_i18n').empty().append(jQuery.i18n.prop('signout_i18n'));
	jQuery('#signin_name_i18n').empty().append(jQuery.i18n.prop('signin_name_i18n'));
	jQuery('#message_title_i18n').empty().append(jQuery.i18n.prop('message_title_i18n'));
	jQuery('#page_not_found_i18n').empty().append(jQuery.i18n.prop('page_not_found_i18n'));
	jQuery('#author_name_i18n').empty().append(jQuery.i18n.prop('author_name_i18n'));
	jQuery('#accounts_name_i18n').empty().append(jQuery.i18n.prop('accounts_name_i18n'));
	jQuery('#log_title_i18n').empty().append(jQuery.i18n.prop('log_title_i18n'));
	jQuery('#clayout_button_i18n').empty().append(jQuery.i18n.prop('clayout_button_i18n'));
	jQuery('#edit_back_button_i18n').empty().append(jQuery.i18n.prop('edit_back_button_i18n'));
    }
