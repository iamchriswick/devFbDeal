$(document).ready(function() {

    window.localStorage.clear();

    $('#sectionFacebookLogin').hide();
    $('#offerExpired').hide();
    $('#sectionInviteFriends').hide();
    $('#sectionUserPersonalia').hide();
    $('#sectionThankYou').hide();
    $('#sectionFooter').hide();

    //set local storage values
    localStorage.setItem('friendsInvitedOnFirstAttempt', '');
    localStorage.setItem('friendsInvitedOnSecondAttempt', '');
    localStorage.setItem('friendsInvitedOnThirdAttempt', '');
    localStorage.setItem('friendsInvitedOnFourthAttempt', '');
    localStorage.setItem('friendsInvitedOnFifthAttempt', '');
    localStorage.setItem('dealActive', '');

    // get Webhook Global Values and save to local storage
    localStorage.setItem('siteName', $('#siteName').val());
    var siteNameValue = $('#siteName').val();
    $('#siteName').remove();

    localStorage.setItem('siteUrl', $('#siteUrl').val());
    var siteUrlValue = $('#siteUrl').val();
    $('#siteUrl').remove();

    localStorage.setItem('facebookAppId', $('#appId').val());
    var appIdValue = localStorage.getItem("facebookAppId");
    $('#appId').remove();

    // get Webhook Content Type values and save to local storage
    localStorage.setItem('dealName', $('#dealName').val());
    var dealNameValue = localStorage.getItem("dealName");
    $('#dealName').remove();

    localStorage.setItem('dealHeader', $('#dealHeader').val());
    var dealHeaderValue = localStorage.getItem("dealHeader");
    $('#dealHeader').remove();

    localStorage.setItem('dealFriendInvitesNeeded', $('#dealFriendInvitesNeeded').val());
    var dealFriendInvitesNeeded = localStorage.getItem("dealFriendInvitesNeeded");
    $('#dealFriendInvitesNeeded').remove();

    // set siteNameValue in content
    $('#siteNameValue').text(siteNameValue);

    // check if there is an end timestamp set for this deal
    localStorage.setItem('dealActiveValue', $('#dealActiveValue').val());
    var dealActiveValue = localStorage.getItem("dealActiveValue");
    $('#dealActiveValue').remove();

    localStorage.setItem('dealActiveToTimestamp', $('#dealActiveToTimestamp').val());
    var dealActiveToTimestamp = localStorage.getItem("dealActiveToTimestamp");
    $('#dealActiveToTimestamp').remove();

    var timeNowEpoch = new Date().getTime() / 1000;
    var dealEndEpoch = dealActiveToTimestamp;

    function dealActiveCheck() {
        if (dealActiveValue == 'Ja') {
            if (timeNowEpoch > dealEndEpoch) {
                $('#offerExpired').fadeIn();
                $('.header-13-sub h3').fitText(0.8, {
                    maxFontSize: '29px'
                });
                console.group('This deal has a time limit enabled:');
                console.log('... and the deal has expired.');
                console.groupEnd();
            } else {
                $('#sectionFacebookLogin').fadeIn();
                $('.header-13-sub h3').fitText(0.8, {
                    maxFontSize: '29px'
                });
                console.group('This deal has a time limit enabled:');
                console.log('... and the deal is still active.');
                console.groupEnd();
            }
        } else {
            $('#sectionFacebookLogin').fadeIn();
            console.log('Det er ingen tidsbegrensning på denne dealen.');
        }
    }
    dealActiveCheck();

    // This is called with the results from from FB.getLoginStatus().
    function statusChangeCallback(response) {
        // The response object is returned with a status field that lets the app know the current login status of the person. Full docs on the response object can be found in the documentation for FB.getLoginStatus().
        if (response.status === 'connected') {
            console.info('You are logged into the app and Facebook.');
            // set user variables from Facebook data
            var accessToken = response.authResponse.accessToken;
            var uid = response.authResponse.userID;
            var userFbId = localStorage.setItem('uid', uid);
            // Logged into your app and Facebook.
            console.group('Facebook access token that allows us to make Open Graph API calls:');
            console.info(accessToken);
            console.groupEnd();
            testAPI();
        } else if (response.status === 'not_authorized') {
            // The person is logged into Facebook, but not your app.
            console.warn('You are logged into Facebook, but not this app.');
        } else {
            // The person is not logged into Facebook, so we're not sure if they are logged into this app or not.
            console.warn('You are not logged into Facebook, so we are not sure if you are logged into this app or not.');
        }
    }

    // This function is called when someone finishes with the LoginButton.
    function checkLoginState() {
        FB.getLoginStatus(function(response) {
            statusChangeCallback(response);
        });
    }

    function fbLogin() {
        console.log('Login Btn clicked!');
        FB.login(function(response) {
            // handle the response
            statusChangeCallback(response);
        }, {
            scope: 'public_profile,user_friends,email'
        });
    }

    $.ajaxSetup({
        cache: true
    });

    $.getScript('//connect.facebook.net/en_GB/all.js', function() {
        console.group('Initializing Facebook SDK...');

        FB.init({
            appId: appIdValue,
            status: true
        });

        // FB.Canvas.setSize({
        //     height: 751
        // });

        //FB.Canvas.setAutoGrow(5);
        console.info("The Facebook SDK now running!")
        console.groupEnd();

        console.group('Initializing Google URL Shortener API...');
        //jQuery.urlShortener.settings.apiKey = 'AIzaSyCVcGhZdURg9_VwD7jD7uyVjK8LdbP5lho';
        $.urlShortener({
            longUrl: smsUrlValue,
            success: function(shortUrl) {
                setURL(shortUrl);
                console.info('The Short Url is: ' + shortUrl);
                console.groupEnd();
                $('#fbLoginContainer').show();
            },
            error: function(err) {
                console.error(JSON.stringify(err));
                console.groupEnd();
            }
        });
    });

    var smsUrlValue = siteUrlValue + '.viralapps.no/activation';
    var gooGl = "";

    function setURL(url) {
        //console.info('set url ' + url);
        gooGl = url;
    }

    var firebaseURl = '//wh-why-not-zoidberg.firebaseio.com/deals/' + siteUrlValue + ',1viralapps,1no/' + dealNameValue;
    var sitesRef = new Firebase(firebaseURl);
    var dealUsersRef = (sitesRef + '/' + 'users');

    // Here we run a very simple test of the Graph API after login is successful.  See statusChangeCallback() for when this call is made.
    function testAPI() {
        console.group('Welcome!  Fetching your information.... ');
        FB.api('/me', function(response) {
            //document.getElementById('status').innerHTML = 'Thanks for logging in, ' + response.name + '!';

            var userFbId = localStorage.getItem('uid')
            var userFbName = response.name;
            var userFbEmail = response.email;

            var userId = userFbId;

            console.log('Successful login for ' + userFbName + ' with UID ' + userId + ' and Email ' + response.email + '.');
            console.groupEnd();

            function userExistsCallback(userId, exists) {
                if (exists) {
                    console.group('Firebase response:');
                    console.warn('User ' + userId + ' already exists!');

                    var firebaseUserRef = new Firebase(dealUsersRef + '/' + userId);

                    firebaseUserRef.on('value', function(snapshot) {
                        var firebaseUserInfo = snapshot.val();
                        $('#dealUserName').val(firebaseUserInfo.Name);
                        $('#dealUserEmail').val(firebaseUserInfo.Email);
                        $('#dealUserPhone').val(firebaseUserInfo.Phone);
                        console.info('Fetched the following information from Firebase – Facebook ID: ' + firebaseUserInfo.FacebookId + ', Name: ' + firebaseUserInfo.Name + ', Email: ' + firebaseUserInfo.Email + ', Phone: ' + firebaseUserInfo.Phone);
                        console.groupEnd();
                    }, function(errorObject) {
                        console.error('Reading user data from Firebase failed: ' + errorObject.code);
                        console.groupEnd();
                    });
                } else {
                    console.group('Firebase response:');
                    console.warn('User ' + userId + ' does not exist!');
                    var dealUserInfo = new Firebase(dealUsersRef + '/' + userId);
                    dealUserInfo.transaction(function(currentData) {
                        if (currentData === null) {
                            return {
                                FacebookId: userId,
                                Name: userFbName,
                                Email: userFbEmail
                            };
                        }
                    }, function(error, committed, snapshot) {
                        if (error) {
                            console.error('Transaction failed abnormally!', error);
                            console.groupEnd();
                        } else if (!committed) {
                            console.warn('We aborted the transaction (because user already exists).');
                            console.groupEnd();
                        } else {
                            console.info('User added. The following information has been saved successfully to Firebase – Facebook ID: ' + userFbId + ', Name: ' + userFbName + ', Email: ' + userFbEmail + '.');

                            var firebaseUserRef = new Firebase(dealUsersRef + '/' + userId);

                            firebaseUserRef.on('value', function(snapshot) {
                                var firebaseUserInfo = snapshot.val();
                                $('#dealUserName').val(firebaseUserInfo.Name);
                                $('#dealUserEmail').val(firebaseUserInfo.Email);
                                $('#dealUserPhone').val(firebaseUserInfo.Phone);
                                console.info('Fetched the following information from Firebase – Facebook ID: ' + firebaseUserInfo.FacebookId + ', Name: ' + firebaseUserInfo.Name + ', Email: ' + firebaseUserInfo.Email);
                                console.groupEnd();
                            }, function(errorObject) {
                                console.error('Reading user data from Firebase failed: ' + errorObject.code);
                                console.groupEnd();
                            });
                        }
                    });
                }
            }
            // Tests to see if /dealusers/<facebookId> has any data. 
            function checkIfUserExists(userId) {
                var usersRef = new Firebase(dealUsersRef);
                usersRef.child(userId).once('value', function(snapshot) {
                    var exists = (snapshot.val() !== null);
                    userExistsCallback(userId, exists);
                });
            }

            checkIfUserExists(userId);
            onLoginSuccess();
        });
    }

    // set login functions
    function onLoginSuccess() {
        $('#sectionFacebookLogin').hide();
        $('#sectionInviteFriends').fadeIn();
        $('.content-28 .dealName').fitText(0.9, {
            maxFontSize: '40px'
        });
        $('.content-28 .lead').fitText(1.6, {
            maxFontSize: '25px'
        });
        $('.content-10 .btn.fbInvite').fitText(2, {
            maxFontSize: '22px'
        });
        $('#sectionFooter').fadeIn();
        FB.Canvas.setSize({
            height: 1886
        });
    }

    // triger 'Login with Facebook' button
    $('#fbLogin').click(function() {
        //login('facebook')
        fbLogin();
    });

    // triger 'Send to Facebook Friends' button
    $('.fbInvite').click(function() {
        invite('facebook')
    });

    // set totalInvitedValue local storage  to 0 
    localStorage.setItem('friendsInvitedTotal', '0');

    // amount of friends that needs to be invited to get the deal
    var friendsToInvite = dealFriendInvitesNeeded;
    $('#friendsToInvite').text(friendsToInvite);

    // Facebook 'Invite Friends' function
    function invite(provider) {
        // Retrieve the object from storage
        var localStorageGetItems = localStorage.getItem('friendsInvitedOnFirstAttempt') + localStorage.getItem('friendsInvitedOnSecondAttempt') + localStorage.getItem('friendsInvitedOnThirdAttempt') + localStorage.getItem('friendsInvitedOnFourthAttempt') + localStorage.getItem('friendsInvitedOnFifthAttempt');

        // Remove comma after the last userId
        var localStorageRetrievedObjects = localStorageGetItems.slice(0, -1);

        // Add brackets around the userId's
        var excludeIDs = '[' + localStorageRetrievedObjects + ']';

        FB.ui({
            method: 'apprequests',
            message: dealHeaderValue,
            title: dealNameValue,
            //max_recipients: 5,
            exclude_ids: excludeIDs,
        }, function(response) {

            var justInvited = response.to.length;
            var invitesNeeded = friendsToInvite;

            var totalInvitedValue = parseInt(localStorage.getItem('friendsInvitedTotal'));
            var totalInvited = totalInvitedValue + justInvited;
            localStorage.setItem('friendsInvitedTotal', totalInvited);
            var invitesStillNeeded = invitesNeeded - totalInvited;

            $('#totalInvited').val(totalInvited);

            // set invite friends functions
            function onInviteSuccess() {
                $('#response span.success').text(sendRequestResponse);
                $('#sectionInviteFriends').hide();
                $('#sectionUserPersonalia').fadeIn();
                $("html, body").animate({
                    scrollTop: 0
                });
                $('#sectionUserPersonalia .lead').fitText(2.1, {
                    maxFontSize: '25px'
                });
                $('#dealUserPersonalia button').fitText(2.2, {
                    maxFontSize: '22px'
                });
            }

            function onInviteError() {
                $('#response span.warning').text(sendRequestResponse);
                $('#response.alert-warning').show();
                // FB.Canvas.setSize({
                //     height: 1267
                // });
            }

            // check if the needed amount of friends are invited and responses accordingly
            if (response.to !== 'undefined') {
                if (totalInvited >= friendsToInvite) {
                    FB.Canvas.scrollTo(0, 0);
                    FB.Canvas.setSize({
                        height: 951
                    });
                    $('html, body').scrollTop(300);
                    console.group('Invited Friends:');
                    console.info('Success! You have invited %d friends, and the deal is now yours to claim!', totalInvited);
                    console.groupEnd();
                    var sendRequestResponse = 'You have invited ' + totalInvited + ' friends, and the deal is now yours to claim!';
                    onInviteSuccess();
                } else {
                    console.group('Invited Friends:');
                    console.log('You just invited %d friend(s).', justInvited);
                    console.log('You have invited a total of %d friend(s).', totalInvited);
                    console.log('You need to invite at least ' + friendsToInvite + ' friends.');
                    console.info('You need to invite %d more friend(s) to get this deal.', invitesStillNeeded);
                    console.groupEnd();
                    var sendRequestResponse = 'You need to invite at least ' + invitesStillNeeded + '  more friend(s) to get this deal.';
                    onInviteError();
                    fbIDInvited = response.to + ',';

                    // Check if the object exists in local storage and adds value to it
                    if (localStorage.getItem("friendsInvitedOnFirstAttempt") == "") {
                        localStorage.setItem('friendsInvitedOnFirstAttempt', fbIDInvited);
                        var localStorageNewValue = localStorage.getItem("friendsInvitedOnFirstAttempt");
                        console.group('Local Storage response:');
                        console.log('Id(s) saved to local storage: ' + localStorageNewValue);
                        console.groupEnd();
                    } else if (localStorage.getItem("friendsInvitedOnSecondAttempt") == "") {
                        localStorage.setItem('friendsInvitedOnSecondAttempt', fbIDInvited);
                        var localStorageNewValue = localStorage.getItem("friendsInvitedOnSecondAttempt")
                        console.group('Local Storage response:');
                        console.log('Id(s) saved to local storage: ' + localStorageNewValue);
                        console.groupEnd();
                    } else if (localStorage.getItem("friendsInvitedOnThirdAttempt") == "") {
                        localStorage.setItem('friendsInvitedOnThirdAttempt', fbIDInvited);
                        var localStorageNewValue = localStorage.getItem("friendsInvitedOnThirdAttempt")
                        console.group('Local Storage response:');
                        console.log('Id(s) saved to local storage: ' + localStorageNewValue);
                        console.groupEnd();
                    } else if (localStorage.getItem("friendsInvitedOnFourthAttempt") == "") {
                        localStorage.setItem('friendsInvitedOnFourthAttempt', fbIDInvited);
                        var localStorageNewValue = localStorage.getItem("friendsInvitedOnFourthAttempt")
                        console.group('Local Storage response:');
                        console.log('Id(s) saved to local storage: ' + localStorageNewValue);
                        console.groupEnd();
                    } else if (localStorage.getItem("friendsInvitedOnFifthAttempt") == "") {
                        localStorage.setItem('friendsInvitedOnFifthAttempt', fbIDInvited);
                        var localStorageNewValue = localStorage.getItem("friendsInvitedOnFifthAttempt")
                        console.group('Local Storage response:');
                        console.log('Id(s) saved to local storage: ' + localStorageNewValue);
                        console.groupEnd();
                    }
                }
            }
        });
    };

    // Submit form
    $('#dealUserPersonalia').bootstrapValidator({
        message: 'Dette feltet er ikke gyldig.',
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        submitHandler: function(validator, form, submitButton) {

            var dealUserName = $("#dealUserName");
            var dealUserNameValue = $.trim(dealUserName.val());
            var dealUserEmail = $("#dealUserEmail");
            var dealUserEmailValue = $.trim(dealUserEmail.val());
            var dealUserPhone = $("#dealUserPhone");
            var dealUserPhoneRaw = $.trim(dealUserPhone.val());
            // var dealClaimedEpoch = Math.round((new Date()).getTime() / 1000);
            var dealClaimedEpoch = moment().unix();

            //var dealUserPhoneRaw = '+4745188735';
            console.group('Phone Number response:');
            if (/^[0-9A-Za-z]+$/.test(dealUserPhoneRaw)) {
                //there are only alphanumeric characters
                console.log(dealUserPhoneRaw + ' is a pure number baby! =)');
                console.groupEnd();
                var dealUserPhoneValue = dealUserPhoneRaw;
            } else {
                //it contains other characters
                console.log(dealUserPhoneRaw + ' is a shitty number! =(');
                dealUserPhoneValue = dealUserPhoneRaw.substring(3);
                console.log('...so we fixed it for you! ' + dealUserPhoneValue + ' is now good! =D');
                console.groupEnd();
            }

            //send SMS function
            function sendSMS() {
                console.info('The SMS Url is: ' + gooGl);
                $.ajax({
                    url: 'https://lamp.viralapps.no/twilio/send-sms.php',
                    type: 'POST',
                    dataType: 'json',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: {
                        myTwilioNumber: '+13615006582',
                        //myTwilioNumber: '+4759441055',
                        number: '+47' + dealUserPhoneValue,
                        smsContent: 'Hei! Her er dealen du nettopp bestilte. Trykk på linken for å gå til aktivering. Med hilsen ' + siteNameValue + '.',
                        dealURL: gooGl
                    },
                    success: handleData
                })
            };

            function handleData(data) {
                alert(data.number);
                //do some stuff
            }

            function dealStatusClaimed() {
                var dealStatusClaimedRef = new Firebase(firebaseURl + '/' + 'status/Claimed');
                dealStatusClaimedRef.transaction(function(currentRank) {
                    return currentRank+1;
                });
            }

            var userFbId = localStorage.getItem('uid')
            var userId = userFbId;

            var firebaseUserRef = new Firebase(dealUsersRef + '/' + userId);

            var onComplete = function(error) {
                console.group('Firebase response:');
                if (error) {
                    console.log('Synchronization failed');
                    console.groupEnd();
                } else {
                    firebaseUserRef.on('value', function(snapshot) {
                        var firebaseUserInfo = snapshot.val();
                        console.info('Synchronization succeeded! User updated with the following information  – Name: ' + firebaseUserInfo.Name + ', Email: ' + firebaseUserInfo.Email + ', Phone: ' + firebaseUserInfo.Phone);
                        console.groupEnd();
                        $('#sectionUserPersonalia').hide();
                        $('#sectionThankYou').fadeIn();
                        $('#sectionThankYou h3').fitText(1.2, {
                            maxFontSize: '35px'
                        });
                        $('#sectionThankYou .lead').fitText(1.9, {
                            maxFontSize: '25px'
                        });
                        dealStatusClaimed();

                        localStorage.clear();
                        FB.Canvas.scrollTo(0, 0);
                        FB.Canvas.setSize({
                            height: 800
                        });
                        $('.page-wrapper').css("height", "100%");
                        $('#sectionFooter').css("position", "absolute");
                    }, function(errorObject) {
                        console.error('Writing updated user data to Firebase failed: ' + errorObject.code);
                        console.groupEnd();
                    });
                    
                    sendSMS();
                }
            };
            firebaseUserRef.update({
                Email: dealUserEmailValue,
                Phone: dealUserPhoneValue,
                DealClaimed: dealClaimedEpoch,
                Status: 'active'
            }, onComplete);

            $('#responsePhoneValue').text(dealUserPhoneValue);
        },
        fields: {
            dealUserName: {
                validators: {
                    notEmpty: {
                        message: 'Vennligst skriv inn ditt navn.'
                    },
                    regexp: {
                        regexp: /^[ÆØÅæøåA-Za-z -]+$/,
                        message: 'Dette navnet er ikke gyldig.'
                    }
                }
            },
            dealUserEmail: {
                validators: {
                    notEmpty: {
                        message: 'Vennligst skriv inn din epostadresse.'
                    },
                    emailAddress: {
                        message: 'Denne epostadressen er ikke gyldig.'
                    }
                }
            },
            dealUserPhone: {
                validators: {
                    notEmpty: {
                        message: 'Vennligst skriv inn ditt mobilnummer.'
                    },
                    regexp: {
                        regexp: /^(\+47)?\s?[2-9](\s?\d){7}$/,
                        message: 'Dette mobilnummeret er ikke gyldig <i>(støtte kun for norske mobilnummer)</i>.'
                    }
                }
            }
        }
    });
});