var URL = 'https://api.mhubconnect.com/';
var APIURL = 'https://api.machispinwin.com/';
var widgetContent = null;
var memberInfoContent = null;
var fetchError = null;
var isLoading = true;

$(function () {
    var iconTemplate = createIconTemplate();

    var GetVariabletimer = setInterval(function () {
        var userdata = JSON.parse(localStorage.getItem('user_data'));

        if (userdata) {
            clearInterval(GetVariabletimer);
            document.body.appendChild(iconTemplate);
            $('#WidgetMenuIcon').data('widgetmemberid', userdata.username);
            initWidgetButtonClickFunction();
            
        }
    }, 500);
});

function createIconTemplate() {
    var iconTemplate = document.createElement('div');
    iconTemplate.setAttribute('id', "WidgetMenuIcon");
    iconTemplate.setAttribute('style', "z-index: 1000000;position: fixed;bottom: 135px;right: 3px;width: 75px;height: 65px;border-radius: 34px;align-items: center;display: flex;justify-content: center;");

    var closeButton = document.createElement('span');
    closeButton.setAttribute('id', "WidgetCloseButton");
    closeButton.setAttribute('style', "color: #676262; font-weight: bold; position: absolute; top: -8px; left: 8px; font-size: 18px;");
    closeButton.innerHTML = 'x';
    closeButton.onclick = function () {
        $('#WidgetMenuIcon').remove();
    };

    var menuWidget = document.createElement('img');
    menuWidget.setAttribute('id', "MenuWidget");
    menuWidget.setAttribute('src', URL + "js/MachiWidgetIcon.png");
    menuWidget.setAttribute('style', "width: 100%");

    iconTemplate.appendChild(closeButton);
    iconTemplate.appendChild(menuWidget);

    return iconTemplate;
}

function fetchWidgetContent(userdata) {
	if(isLoading){
		 isLoading = false;
    widgetContent = null;
    fetchError = null;
	
    var userIdString = userdata.id.toString();
	
		 $.ajax({
        type: 'POST',
        url: APIURL + 'API/GetWidgetMenubyUsername',
        data: JSON.stringify({
            userName: userdata.username,
            locale: userdata.lang_code,
            memberGroup: userdata.member_group.name,
            memberId: userIdString
        }),
        contentType: 'application/json',
        success: function (response) {
            var s = JSON.parse(response.data);
            widgetContent = s.popupcontent;
            isLoading = false; // Content loaded
            updateModalContent();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Request failed: " + textStatus + ", " + errorThrown);
            fetchError = "An error occurred while fetching the widget content: " + jqXHR.responseText;
            isLoading = false; // Stop loading on error
            updateModalContent();
        }
    });
	}
   
	
   
}

function initWidgetButtonClickFunction() {
    $('body').on('click', '#MenuWidget', function () {
        var userdata = JSON.parse(localStorage.getItem('user_data'));

        // Show existing widgetContent if available, even if the API call fails
		
        if (widgetContent) {
            isLoading = false;
            showModal();
        }else{
			fetchWidgetContent(userdata);
		}

        if (userdata && userdata.member_group.name === "Normal") {
            $.ajax({
                type: 'POST',
                url: APIURL + 'API/GetQTPMemberInfo',
                data: JSON.stringify({
                    Username: userdata.username
                }),
                contentType: 'application/json',
                success: function (response) {
                    var result = response.data;
                    if (result) {
                        var totalDepositAmount = result.TotalDepositAmount || 0;
                        var totalDepositRequired = 300000;
                        var progress = (totalDepositAmount / totalDepositRequired) * 100;
                        var depositNeeded = totalDepositRequired - totalDepositAmount;

                        if (widgetContent) {
                            widgetContent = widgetContent.replace(
                                /aria-valuenow="\d+"/,
                                `aria-valuenow="${progress.toFixed(0)}"`
                            ).replace(
                                /style="width:\s*\d+%;\s*background-color:\s*#022a6a;"/,
                                `style="width: ${progress.toFixed(0)}%; background-color: #022a6a;"`
                            ).replace(
                                /\d+(\.\d+)?\s*BDT More to VIP/, 
                                `${depositNeeded.toFixed(2)} BDT More to VIP`
                            );
                        } else {
                            console.error("widgetContent is undefined in the response.");
                            fetchError = "Content could not be loaded.";
                        }
                    } else {
                        fetchError = "Failed to retrieve member information. Please retry.";
                    }

                    isLoading = false;
                    showModal();
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error("Request failed: " + textStatus + ", " + errorThrown);
                    fetchError = "An error occurred while fetching member information: " + jqXHR.responseText;
                    isLoading = false;
                    showModal();
                }
            });
        } else {
            isLoading = false;
            showModal();
        }
    });
}


function showModal() {
    var existingModal = document.getElementById('popupModal');
    if (existingModal) {
        existingModal.remove();
    }

    var modalWrapper = document.createElement('div');
    modalWrapper.setAttribute('id', 'popupModal');
    modalWrapper.setAttribute('style', 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000001;');

    var modalContent = document.createElement('div');
    modalContent.setAttribute('id', 'modalContent');
    modalContent.setAttribute('style', 'background: "#ffffff00"; border-radius: 5px; position: relative; width: 90%; max-height: 80vh; overflow-y: auto; text-align: center; padding: 20px;');
    modalContent.innerHTML = 'Please wait, loading...';

    var style = document.createElement('style');
    style.innerHTML = `
        #popupModal div::-webkit-scrollbar {
            display: none;
        }

        .close-button {
            position: absolute;
            top: 10px; right: 10px;
            width: 30px; height: 30px; background: white;
            border-radius: 50%; display: flex; align-items: center;
            justify-content: center; cursor: pointer;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }

        .close-button:hover {
            background: #f0f0f0;
        }

        .close-button::before {
            content: 'X';
            font-size: 20px; color: black;
        }

        .bottom-close-button {
            position: fixed; bottom: 10px; right: 50%;
            transform: translateX(50%); width: 150px; height: 50px; cursor: pointer;
        }

        .bottom-close-button:hover {
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);

    var closeModal = document.createElement('div');
    closeModal.setAttribute('class', 'close-button');
    closeModal.onclick = function () {
        document.body.removeChild(modalWrapper);
    };

    var bottomCloseButton = document.createElement('img');
    bottomCloseButton.setAttribute('class', 'bottom-close-button');
    bottomCloseButton.setAttribute('src', URL + 'js/Assets_Close_Button.svg');
    bottomCloseButton.onclick = function () {
        document.body.removeChild(modalWrapper);
    };

    modalContent.appendChild(closeModal);
    modalWrapper.appendChild(bottomCloseButton);
    modalWrapper.appendChild(modalContent);
    document.body.appendChild(modalWrapper);

    modalWrapper.addEventListener('click', function (event) {
        if (event.target === modalWrapper) {
            document.body.removeChild(modalWrapper);
        }
    });

    if (!isLoading) {
        updateModalContent();
    }
}

function updateModalContent() {
    var modalContent = document.getElementById('modalContent');
    if (modalContent) {
        if (widgetContent) {
            modalContent.innerHTML = widgetContent;
            initializeModalContent();
        } else if (fetchError) {
            modalContent.innerHTML = fetchError;
        }
    }
}

$(document).on('click', '#btnIPLLuckyDraw', function () {
    var userdata = JSON.parse(localStorage.getItem('user_data'));
    if (userdata) {
        var username = userdata.username;
         var encodedUsername = btoa(username);

        var url = `https://luckydraw.machiplay.com/?data=${encodedUsername}`;

        window.location.href = url;
    }
});


$(document).on('click', '#btnIPL2025', function () {
    var userdata = JSON.parse(localStorage.getItem('user_data'));
    if (userdata) {
        var username = userdata.username;
        var locale = userdata.lang_code;
        var encodedUsername = btoa(username);

        var url = `https://ipl.machiplay.com/?data=${encodedUsername}&Locale=${locale}`;

        window.location.href = url;
    }
});

$(document).on('click', '#btnDailyCheckIn', function () {
    var userdata = JSON.parse(localStorage.getItem('user_data'));
    if (userdata) {
        var memberId = userdata.id;
        var locale = userdata.lang_code;
        var encodedMemberId = btoa(memberId);

        var url = `https://dailymission.machispinwin.com/?MemberId=${encodedMemberId}&Locale=${locale}/#0`;

        window.location.href = url;
    }
    else {
        var url = `https://dailymission.machispinwin.com`;

        window.location.href = url;
    }
});

$(document).on('click', '#btnWayToEarn', function () {
    var userdata = JSON.parse(localStorage.getItem('user_data'));
    if (userdata) {
        var memberId = userdata.id;
        var locale = userdata.lang_code;
        var encodedMemberId = btoa(memberId);

        var url = `https://dailymission.machispinwin.com/?MemberId=${encodedMemberId}&Locale=${locale}/#1`;

        window.location.href = url;
    }
    else {
        var url = `https://dailymission.machispinwin.com`;

        window.location.href = url;
    }
});

$(document).on('click', '#btnCoinHistory', function () {
    var userdata = JSON.parse(localStorage.getItem('user_data'));
    if (userdata) {
        var memberId = userdata.id;
        var locale = userdata.lang_code;
        var encodedMemberId = btoa(memberId);

        var url = `https://dailymission.machispinwin.com/?MemberId=${encodedMemberId}&Locale=${locale}/#2`;

        window.location.href = url;
    }
    else {
        var url = `https://dailymission.machispinwin.com`;

        window.location.href = url;
    }
});

$(document).on('click', '#btnMachiFlip', function () {
    var userdata = JSON.parse(localStorage.getItem('user_data'));
    if (userdata) {
        var memberId = userdata.id;
        var locale = userdata.lang_code;
        var encodedMemberId = btoa(memberId);

        var url = `https://flip.machispinwin.com/?MemberId=${encodedMemberId}&Locale=${locale}`;

        window.location.href = url;
    }
});


function initializeModalContent() {
    $(document).ready(function () {
        var userData = JSON.parse(localStorage.getItem('user_data'));
        var userMemberGroup = userData ? userData.member_group.name : "";

        $('.countdown').each(function () {
            var $this = $(this);
            var startDate = new Date($this.data('startdate'));
            var endDate = new Date($this.data('enddate'));

            function updateCountdown() {
                var now = new Date().getTime();
                var distance = endDate - now;

                if (distance < 0) {
                    $this.find('.countdown-display').text("Event ended");
                    clearInterval(interval);
                    return;
                }

                var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                $this.find('.countdown-display').text(days + "d " + hours + "h " + minutes + "m ");
            }

            var interval = setInterval(updateCountdown, 1000);
            updateCountdown();
        });

        $('.widgetevent-item').each(function () {
            var $this = $(this);
            var startDate = new Date($this.data('startdate'));
            var endDate = new Date($this.data('enddate'));
            var minDate = new Date('0001-01-01T00:00:00');
            var now = new Date().getTime();
            var categoryId = $this.closest('[data-category-id]').data('category-id');
            var userData = JSON.parse(localStorage.getItem('user_data'));
            var userMemberGroup = userData && userData.member_group ? userData.member_group.name : "";
            
            if (categoryId === 'aab1ed03251142e582b5614c83f90e33' && userMemberGroup === "Normal") {
                $this.find('.event-image').addClass('grayscale');
                $this.append('<div class="overlay"><img src="https://www.machispinwin.com/Img/Assets_Coming_Soon.svg" style="max-width:115px;opacity: 0.5;"></div>');

                $this.on('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                });
                return; 
            }

            if (endDate.getTime() === minDate.getTime()) {
                return true;
            }

            if (now > endDate) {
                $this.find('.event-image').addClass('grayscale');
            } else if (now < startDate || (userMemberGroup === "Normal" && categoryId === 'aab1ed03251142e582b5614c83f90e33')) {
                $this.find('.event-image').addClass('grayscale');
                $this.append('<div class="overlay"><img src="https://www.machispinwin.com/Img/Assets_Coming_Soon.svg" style="max-width:115px;opacity: 0.5;"></div>');
            } else if ($this.closest('.widgetevent-container').length > 0) {
                $this.find('.event-image').addClass('reflection');
            }
        });
    });
}
