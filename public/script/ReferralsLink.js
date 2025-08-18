$(document).ready(function() {
    if (window.location.href.includes('https://m.mcb777.com/referral')) {
        var userdata = JSON.parse(localStorage.getItem('user_data'));
        if (userdata) {
            var hashMemberID = btoa(userdata.id);
            window.location.href = 'https://referral.mcbhub777.com?MemberId=' + hashMemberID;
            return;
        }
else {
            setTimeout(attemptRedirect, 500); 
        }
    }

   if (window.location.href.includes('https://m.mcb777.com/referral')) {
        attemptRedirect();
        return;
    }

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                var userdata = JSON.parse(localStorage.getItem('user_data'));
                var targetElement = $('#side-panel > div > div > div > nav > ul > li:nth-child(4)');
                
                if (userdata && targetElement.length > 0) {
                    observer.disconnect(); 
                    var hashMemberID = btoa(userdata.id);
                    InitReferralButtonClickFunction(hashMemberID);
                }
            }
        });
    });

    var config = { childList: true, subtree: true };
    observer.observe(document.body, config);
});

function InitReferralButtonClickFunction(memberID) {
    var selector = '#side-panel > div > div > div > nav > ul > li:nth-child(4)';
    $(selector).off('click').on('click', function(e) {
        e.preventDefault();  
        window.location.href = 'https://referral.mcbhub777.com?MemberId=' + memberID;
    });

    $('body').off('click', selector).on('click', selector, function (e) {
        e.preventDefault(); 
        window.location.href = 'https://referral.mcbhub777.com?MemberId=' + memberID; 
    });
}
