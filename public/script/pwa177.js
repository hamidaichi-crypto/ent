function initPWA177() {
	pwaDiv = document.createElement("div");
        pwaDiv.setAttribute('id', "pwa177download");
	pwaDiv.style.cssText = 'display: flex;align-items: center;height: 50px;padding: 0 15px;overflow: hidden;position: sticky;top: 50px;z-index: 500;background-color: #cdcdcd;';

	pwaDivClose = document.createElement("div");
	pwaDivClose.style.cssText = 'font-size: 20px';
	pwaDivClose.innerHTML = "X";

	pwaDivClose.addEventListener('click',() =>{
		hidePWA177();
	});

	pwaDivContent = document.createElement("div");
	pwaDivContent.style.cssText = "margin-left: 15px;display: flex;flex: 1;align-items: center;"

	pwaDivLogo = document.createElement("img");
	pwaDivLogo.src = "https://api.mhubconnect.com/js/machi.png";
	pwaDivLogo.style.cssText = "border: 1px solid #363530;border-radius: 5px;flex-shrink: 0;width: 40px;height: 40px;vertical-align: middle;margin-right: 10px;";

	pwaDivColumn = document.createElement("div");
	pwaDivColumn.style.cssText = "box-sizing: border-box;display: flex;justify-content: space-between;flex-direction: column;height: 38px;";

	pwaDivh2 = document.createElement("h2");
	pwaDivh2.style.cssText = "font-size: 11px;font-weight: 600;margin-bottom: 2px";
	if (localStorage.getItem('marketing_campaign') != null && localStorage.getItem('marketing_campaign').includes("BD_BN")) {
		pwaDivh2.innerHTML = "MachiBet | অফিসিয়াল অ্যাপ";	
	} else {
		pwaDivh2.innerHTML = "MachiBet | Official App";	
	}

	pwaDivh6 = document.createElement("h6");
	pwaDivh6.style.cssText = "font-size: 9px;font-weight: 400;";
	if (localStorage.getItem('marketing_campaign') != null && localStorage.getItem('marketing_campaign').includes("BD_BN")) {
		pwaDivh6.innerHTML = "স্পোর্টস অ্যাপ, এন্টারটেইনমেন্ট অ্যাপ<br>খেলুন এনি টাইম এনি প্লেস";
	} else {
		pwaDivh6.innerHTML = "Sports app, Entertainment app<br>Play anytime, anywhere";
	}

	pwaDivColumn.appendChild(pwaDivh2)
	pwaDivColumn.appendChild(pwaDivh6)

	pwaDivContent.appendChild(pwaDivLogo);
	pwaDivContent.appendChild(pwaDivColumn);

	pwaDivButton = document.createElement("div");
	pwaDivButton.id = "install-button"
	pwaDivButton.style.cssText = "font-size: 12px;background: linear-gradient(180deg,#016ecf,#022a6a);color: white;padding: 5px 10px;border-radius: 5px;";
	if (localStorage.getItem('marketing_campaign') != null && localStorage.getItem('marketing_campaign').includes("BD_BN")) {
		pwaDivButton.innerHTML = "ইনস্টল";
	} else {
		pwaDivButton.innerHTML = "Install";
	}

	pwaDiv.appendChild(pwaDivClose);
	pwaDiv.appendChild(pwaDivContent);
	pwaDiv.appendChild(pwaDivButton);

	ParentBody = document.body;
	ParentBody.insertBefore(pwaDiv, ParentBody.firstChild);
}

function hidePWA177(){
	pwaDiv.style.display = 'none';
}

function init177(){

if (window.location.href.includes("m.mcb177")) {
$('head').append('<link rel="manifest" href="https://api.mhubconnect.com/js/manifest177.json">');
$('head').append('<meta name="theme-color" content="#ffffff">');
}


}
init177();


if (window.location.href.includes("m.mcb177")) {
	window.addEventListener('beforeinstallprompt', event => {
		event.preventDefault();
if($('#pwa177download').length == 0){
		initPWA177();
}

		const installButton = document.getElementById('install-button');
		installButton.addEventListener('click', () => {
			event.prompt();
			hidePWA177();
		});
	});
}
