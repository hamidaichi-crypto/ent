// Base API URL
var URL = "https://api.mhubconnect.com/";

// Function to check if user is on a mobile device
var mobileCheck = (function () {
    let isMobile = false;

    function check(userAgent) {
        // Test for a huge regex of mobile devices
        if (/(android|bb\d+|meego).../i.test(userAgent) ||
            /1207|6310|6590|3gso|.../i.test(userAgent.substr(0, 4))) {
            isMobile = true;
        }
    }

    check(navigator.userAgent || navigator.vendor || window.opera);

    return isMobile;
})();

// Initialize variables from PageConfig if available
var InitiVariables = function () {
    if (typeof PageConfig !== "undefined") {
        if (typeof PageConfig.country !== "undefined") {
            _websiteCountry = PageConfig.country;
        }
    }
};

$(function () {
    // Create KYC wrapper overlay
    var overlay = document.createElement('div');
    overlay.setAttribute('id', 'kycWrapper');
    overlay.setAttribute('style', 
        "display: flex; align-items: center; justify-content: center; position: fixed; " +
        "width: 100%; height: 100%; left: 0; top: 0; background: rgba(57, 56, 67, 0.7); " +
        "z-index: 999; font-family: Montserrat, sans-serif; font-size: 12px; font-weight: 400;"
    );

    // Create KYC content box
    var contentBox = document.createElement('div');
    contentBox.setAttribute('style', 'background:white; border-radius:5px;');

    // Interval to check for user_data in localStorage
    var checkUserData = setInterval(function () {
        var username = "";

        if (localStorage.getItem('user_data') != null) {
            var userData = JSON.parse(localStorage.getItem('user_data'));
            username = userData.username;

            clearInterval(checkUserData);

            // Prepare request to check KYC status
            var requestPayload = { "UserName": username };

            $.ajax({
                type: 'post',
                url: URL + 'KYCRequest/GetMemberKYCStatus',
                data: JSON.stringify(requestPayload),
                contentType: 'application/json; charset=utf-8'
            })
            .done(function (response) {
                response = JSON.parse(response.data);

                // If there is a popup to show
                if (response.data.KYCStatus != null) {
                    if (response.data.KYCStatus !== '1' && response.ShowPopUp) {
                        // Insert popup HTML
                        contentBox.innerHTML = response.popupcontent;
                        overlay.appendChild(contentBox);
                        document.body.appendChild(overlay);

                        // Store request info in DOM data
                        $('#kycWrapperDetails').data('kycrequest', response.request.UUID);
                        $('#kycWrapperDetails').data('kycrequestusername', username);

                        // Set width depending on device
                        $('#kycWrapperDetails').css({ width: "350px" });
                        if (!mobileCheck && window.matchMedia("(max-width: 767px)").matches) {
                            $('#kycWrapperDetails').css({ width: "350px" });
                        } else {
                            $('#kycWrapperDetails').css({ width: "445px" });
                        }

                        // If KYC status is '2', hide verify button
                        if (response.memberkyc.KYCStatus === '2') {
                            $('#btnkycverify').hide();
                        }

                        InitButtonClickFunction();
                    }
                }
            })
            .fail(function () {
                // fail silently
            });
        }
    }, 500);

    $(window).resize(function () { });
});

// Initialize button click listener
var InitButtonClickFunction = function () {
    $(document).on('click', '#btnkycverify', function () {
        var uuid = $('#kycWrapper').data('kycrequest');
        var username = $('#kycWrapper').data('kycrequestusername');

        // Redirect to KYC upload page
        window.location = URL + 'KYCRequest/Upload?UserName=' + username + '&UUID=' + uuid;
    });
};
