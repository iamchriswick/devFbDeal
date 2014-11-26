$(document).ready(function() {

    window.localStorage.clear();

    moment.locale('nb');

    $('.brand').fitText(1.9);

    $('#fbLogin').fitText(1.5, {
        maxFontSize: '20px'
    });

    $('.heading').fitText(1.5);
    $('.paragraph').fitText(1.9);

    $('.heading.deal').fitText(1.7);
    $('.paragraph.deal.name').fitText(1.8);
    $('.paragraph.deal.header').fitText(1.8);

    $('.instructions h3').fitText(2.6);
    $('.instructions p').fitText(3);

    //$('#sectionFacebookLogin').hide();

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

    // set siteNameValue in content
    $('#siteNameValue').text(siteNameValue);

    // check if there is an end timestamp set for this deal
    localStorage.setItem('dealLimitationValue', $('#dealLimitationValue').val());
    var dealLimitationValue = localStorage.getItem("dealLimitationValue");
    $('#dealLimitationValue').remove();

    localStorage.setItem('dealLimitationHours', $('#dealLimitationHours').val());
    var dealLimitationHours = localStorage.getItem("dealLimitationHours");
    $('#dealLimitationHours').remove();

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
        // fix iOS Chrome
        if (navigator.userAgent.match('CriOS'))
            window.open('https://www.facebook.com/dialog/oauth?client_id=' + appIdValue + '&redirect_uri=' + document.location.href + '&scope=public_profile', '', statusChangeCallback(response));
        else
            FB.login(function(response) {
                // handle the response
                statusChangeCallback(response);
            }, {
                scope: 'public_profile'
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

        console.info("The Facebook SDK now running!")
        console.groupEnd();
    });

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
                        console.info('User ' + userId + ' has claimed this deal =)');

                        var firebaseUserRef = new Firebase(dealUsersRef + '/' + userId);

                        firebaseUserRef.on('value', function(snapshot) {
                            var firebaseUserInfo = snapshot.val();
                            $('#dealUserName').val(firebaseUserInfo.Name);
                            $('#dealUserEmail').val(firebaseUserInfo.Email);
                            $('#dealUserPhone').val(firebaseUserInfo.Phone);
                            var dealStatus = firebaseUserInfo.Status;

                            if (dealStatus == 'active') {
                                $('.alert-warning').hide();
                                $('#btnOrder').hide();

                                var dealVerified = moment();
                                var dealVerifiedFormat = moment().format('DD-MM-YYYY, HH:mm:ss');

                                var dealClaimedEpoch = firebaseUserInfo.DealClaimed;
                                var dealClaimed = moment.unix(dealClaimedEpoch);
                                var dealClaimedFormat = (dealClaimed.format('DD-MM-YYYY, HH:mm:ss'));

                                console.log('This deal was claimed on: ' + dealClaimedFormat);

                                function checkActivationLimitExists() {
                                    if (dealLimitationValue == 'Ja') {
                                        if (dealLimitationHours == 0) {
                                            dealActivationLimitation = '168';
                                            console.warn('This deal must be ACTIVATED within ' + dealActivationLimitation + ' hours after it was claimed.');
                                            calculateDealActivationExpiration();
                                        } else {
                                            dealActivationLimitation = dealLimitationHours;
                                            console.warn('This deal must be activated within ' + dealActivationLimitation + ' hours after it was claimed.');
                                            calculateDealActivationExpiration();
                                        }
                                    } else {
                                        dealActivationLimitation = '730';
                                        calculateDealActivationExpiration();
                                    }
                                }

                                function calculateDealActivationExpiration() {
                                    dealActivationEnds = moment(dealClaimed).add(dealActivationLimitation, 'hours');
                                    dealActivationEndsFormat = (dealActivationEnds.format('DD-MM-YYYY, HH:mm:ss'));
                                    console.log('This deal must be activated before: ' + dealActivationEndsFormat);
                                    console.groupEnd();
                                    chechDealActivationExpired();
                                }

                                function chechDealActivationExpired() {
                                    if (dealVerifiedFormat > dealActivationEndsFormat) {
                                        console.group('This deal has an activation limitation:');
                                        var dealExpiresOn = moment(dealActivationEnds).fromNow();
                                        $('.alert-danger p').text('Denne dealen gikk ut ' + dealExpiresOn + '.');
                                        $('#fbLogin').hide();
                                        $('.alert-danger').show();
                                        $('.alert h4').fitText(1);
                                        $('.alert p').fitText(1.8);
                                        console.log('Denne dealen gikk ut ' + dealExpiresOn);
                                        console.groupEnd();
                                    } else {
                                        console.group('This deal has an activation limitation:');
                                        var dealExpiresOn = moment(dealActivationEnds).fromNow(true);
                                        $('.alert-info span').text('Denne dealen må aktiveres innen ' + dealExpiresOn + '.');
                                        $('.header-background').css("background", "#64d6ff");
                                        $('#fbLogin').hide();
                                        $('.alert-info').show();
                                        $('.alert p').fitText(2.5);
                                        $('#btnActivate').show();
                                        console.log("Denne dealen deaktiveres " + dealExpiresOn);
                                        console.groupEnd();
                                    }
                                }
                                checkActivationLimitExists();
                            } else {
                                console.log('This deal is already activated... =(');
                                $('.header-background').css("background", "#FF5490");
                                $('.alert-warning p').text('Denne dealen er allerede tatt i bruk.');
                                $('#fbLogin').hide();
                                $('.alert-warning').show();
                                $('#btnOrder .text').text('Trykk her for å bestille ny Deal');
                                $('#btnOrder').show();
                            }

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
                                // return {
                                //     FacebookId: userId,
                                //     Name: userFbName,
                                //     Email: userFbEmail
                                // };
                                console.warn('This user has not claimed this deal!')
                                    //$('.header-background').css("background", "#64d6ff");
                                $('#fbLogin').hide();
                                $('.alert-warning').show();
                                $('.alert p').fitText(2.4);
                                $('#btnOrder').show();
                            }
                        }, function(error, committed, snapshot) {
                            if (error) {
                                console.error('Transaction failed abnormally!', error);
                                console.groupEnd();
                            } else if (!committed) {
                                console.warn('We aborted the transaction (because user does not exists).');
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
            //onLoginSuccess();
        });
    }

    // set login functions
    function onLoginSuccess() {
        $('#sectionFacebookLogin').hide();
        $('#sectionInviteFriends').fadeIn();
        $('#sectionFooter').fadeIn();
        // FB.Canvas.setSize({
        //     height: 1738
        // });
    }

    // triger 'Login with Facebook' button
    $('#fbLogin').click(function() {
        fbLogin();
    });

    function dealStatusActivated() {
        var dealStatusActivatedRef = new Firebase(firebaseURl + '/' + 'status/Activated');
        dealStatusActivatedRef.transaction(function(currentRank) {
            return currentRank + 1;
        });
    }

    function activateThisDeal() {
        var userFbId = localStorage.getItem('uid')
        var userId = userFbId;

        var firebaseUserRef = new Firebase(dealUsersRef + '/' + userId);

        var onComplete = function(error) {
            console.group('Firebase response:');
            if (error) {
                console.log('Synchronization failed');
                console.groupEnd();
            } else {
                console.info('Activation succeeded! The deal is now activated.');
                console.groupEnd();
                $('.header-background').css("background", "#99CC33");
                $('.alert-info').hide();
                $('#btnActivate').hide();
                $('#myModal').modal('hide');
                $('#btnOrder .text').text('Trykk her for å bestille ny Deal');
                $('#btnOrder').show();
                $('.alert-warning').hide();
                $('.instructions').hide();
                $('.page-wrapper').css("background", "#2a2f43");
                $('#confirmation').show();
                $('#confirmation h1').fitText(0.7);
                $('#confirmation h3').fitText(1);
                dealStatusActivated();
                setTimeout(function() {
                    // Do something after 30 seconds
                    location.reload();
                    console.log('Deal activation page reloaded and deal is no deactivated.')
                }, 5000);
            }
        };
        firebaseUserRef.update({
            Status: 'inactive'
        }, onComplete);
    }

    // triger 'Aktiver Dealen' button
    $('#activateThisDeal').click(function() {
        activateThisDeal();
    });
});
