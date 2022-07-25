import elfHandler from './elfHandler.js'

//---------------------------------------------------
//----------------Variables--------------------------
//---------------------------------------------------
const elf = new elfHandler();
const createABotBttn = document.querySelector('#createABotImageBttn');
createABotBttn.addEventListener('click', ()=>{console.log('I see you want to create a bot')});//()=>{elf.initiateBot()});
let intervalID = 0;
const frontEndickerRefreshTime = 1000*30; // 30 seconds

let tradesCompletedToday = 0;
let tradesCompletedTotal = 0;

//Sounds
const nodeOfflineErrorSound = new Audio ('nodeOfflineErrorSound.mp3');
const nodeOfflineErrorSoundLong = new Audio ('nodeOfflineErrorSoundLong.mp3');
nodeOfflineErrorSoundLong.volume = 0.05;

const yeahBabyYeahSound = new Audio ('yeahbabyyeahtrimmed.mp3');
yeahBabyYeahSound.volume = 1;

const elfURLS = {
	updateRequest:'/api/update',
	botSettings:'/api/botsettings',
	changebotsettings : '/api/changebotsettings'
};

//DEBUG PANEL
/*
const createbotbttn = document.querySelector('#createbotbttn');
createbotbttn.addEventListener('click', ()=>elf.debug('create bot'));
const baseorderbttn = document.querySelector('#baseorderbttn');
baseorderbttn.addEventListener('click', ()=>elf.debug('place base order'));
const safetyorderbttn = document.querySelector('#safetyorderbttn');
safetyorderbttn.addEventListener('click', ()=>elf.debug('place safety order'));
const leverage10bttn = document.querySelector('#leverage10bttn');
leverage10bttn.addEventListener('click', ()=>elf.debug('leverage 10'));
const closepositionbttn = document.querySelector('#closepositionbttn');
closepositionbttn.addEventListener('click', ()=>elf.debug('close position'));
*/
//END OF DEBUG PANEL

//connection status
const connectionCircle = document.querySelector('#connectionCircle');
const connectionStatus = document.querySelector('#connectionStatus');
const jumpingElfGif = document.querySelector('#jumpingElfGif');

//symbol & current prices display
const symbolDisplayText = document.querySelector('#symbolDisplay');
const lastPriceDisplayText = document.querySelector('#lastPriceDisplay');
const dailyChangeDisplayText = document.querySelector('#dailyChange');
const askPriceDisplayText = document.querySelector('#askPriceDisplay');
const bidPriceDisplayText = document.querySelector('#bidPriceDisplay');

//ELF STATS
const UPLUSDDisplayText = document.querySelector('#UPLUSD');
const UPLpercentageDisplayText = document.querySelector('#UPLpercentage');
const UPLDisplayText = document.querySelector('#UPL');
//const tradesTodayDisplayText = document.querySelector('#tradesToday');
let previousTodaysPL = 0;

const TotalPLUSD = document.querySelector('#TotalPLUSD');
const TotalPL = document.querySelector('#TotalPL');
//const tradesTotalDisplayText = document.querySelector('#tradesTotal');

//AVERAGE RETURNS
const PerfButton = document.querySelector('#PerfTitle');
const PerfArrow = document.querySelector('#PerfArrow');
const SevenPLTotal = document.querySelector('#number-7PL');
const SevenPLPerct = document.querySelector('#number-7avggain');
const ThirtyPLTotal = document.querySelector('#number-30PL');
const ThirtyPLPerct = document.querySelector('#number-30avggain');
const PerformanceStatsDiv = document.querySelector('#PerformanceStatsDiv');
const AnnualizedReturn = document.querySelector('#number-annualizedReturn');
PerfButton.addEventListener('click', ()=>{
	PerformanceStatsDiv.classList.toggle('HideThis'); 
	if(PerfArrow.classList.contains('PerfArrowUp')){
		PerfArrow.classList.remove('PerfArrowUp');
		PerfArrow.classList.add('PerfArrowDown');
   }else{
		PerfArrow.classList.remove('PerfArrowDown');
		PerfArrow.classList.add('PerfArrowUp');
   }});

//Account Balance title + make title clickable, hide
const titleBalanceDisplayText = document.querySelector('#acBalanceTitle');
const acBalanceDiv = document.querySelector('#acBalanceDiv');
const acBalanceArrow = document.querySelector('#acBalanceArrow');
titleBalanceDisplayText.addEventListener('click', ()=>{
	 acBalanceDiv.classList.toggle('HideThis'); 
	 if(acBalanceArrow.classList.contains('acBalanceArrowUp')){
		 acBalanceArrow.classList.remove('acBalanceArrowUp');
		 acBalanceArrow.classList.add('acBalanceArrowDown');
	}else{
		acBalanceArrow.classList.remove('acBalanceArrowDown');
		 acBalanceArrow.classList.add('acBalanceArrowUp');
	}});

//Account Balance
const walletBalanceDisplayText = document.querySelector('#BL-walletBalance');
const walletBalanceUSDDisplayText = document.querySelector('#BL-walletBalanceUSD');
const equityBalanceDisplayText = document.querySelector('#BL-equity');
const availableBalanceDisplayText = document.querySelector('#BL-available');
const usedMarginBalanceDisplayText = document.querySelector('#BL-usedMargin');
const orderMarginBalanceDisplayText = document.querySelector('#BL-orderMargin');

//Current Position title + make title clickable, hide
const cpTitleDisplayText = document.querySelector('#cpTitle');
const cpLeftDiv = document.querySelector('#cpLeft');
const cpRightDiv = document.querySelector('#cpRight');
const cpArrow = document.querySelector('#cpArrow');
cpTitleDisplayText.addEventListener('click', ()=>{
	cpLeftDiv.classList.toggle('HideThis'); 
	cpRightDiv.classList.toggle('HideThis'); 
	 if(cpArrow.classList.contains('cpArrowUp')){
		cpArrow.classList.remove('cpArrowUp');
		cpArrow.classList.add('cpArrowDown');
	}else{
		cpArrow.classList.remove('cpArrowDown');
		cpArrow.classList.add('cpArrowUp');
	}});

//Current Position stats on screen
const cpQuantity = document.querySelector('#CP-quantity');
const cpLeverage = document.querySelector('#CP-leverage');
const cpLevIsIsolated = document.querySelector('#CP-isIsolated');
const cpValue = document.querySelector('#CP-value');

const cpEntryPrice = document.querySelector('#CP-entryPrice');
const cpTradeType = document.querySelector('#CP-tradeType');
const cpLastOrderTime = document.querySelector('#CP-lastOrderTime');
const cpMargin = document.querySelector('#CP-margin');

//Bot Settings Title + make title clickable, hide
const bsDisplayText = document.querySelector('#bsTitle');
const bsDiv = document.querySelector('#bsDiv');
const bsArrow = document.querySelector('#bsArrow');
bsDisplayText.addEventListener('click', ()=>{
	bsDiv.classList.toggle('HideThis'); 
	 if(bsArrow.classList.contains('bsArrowUp')){
		bsArrow.classList.remove('bsArrowUp');
		bsArrow.classList.add('bsArrowDown');
	}else{
		bsArrow.classList.remove('bsArrowDown');
		bsArrow.classList.add('bsArrowUp');
	}});

//Bot Settings
const BsForm = document.querySelector('#botSettingsform');
const BscommittedCapitalSlider = document.querySelector('#BS-committedCapitalSlider');
const BscommittedCapitalNumber = document.querySelector('#BS-committedCapitalNumber');

const BSbaseOrderPercent = document.querySelector('#BS-baseOrderPercentSlider');
const BsbaseOrderNumber = document.querySelector('#BS-baseOrderNumber');

const BsprofitTarget = document.querySelector('#BS-profitTarget');
const BSleverage = document.querySelector('#BS-leverage');
const BssafetyTarget = document.querySelector('#BS-safetyTarget');

const BssafetyOrderPercent = document.querySelector('#BS-safetyOrderPercent');
const BssafetyOrderNumber = document.querySelector('#BS-safetyOrderNumber');

const BsmaxSafetyOrderNumber = document.querySelector('#BS-maxSafetyOrderNumber');

const BsLiquidationLimit = document.querySelector('#BS-LiquidationLimit');

BscommittedCapitalSlider.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BSbaseOrderPercent.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BssafetyOrderPercent.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BsForm.addEventListener('submit', (e)=>{
	e.preventDefault();
	updateBotSettings(); 
	elf.changeBotSettings(elfURLS.changebotsettings, botSettings);
});

//Bot Settings Object
let botSettings = {
	
	'committed_capital': BscommittedCapitalSlider.value,
	'base_order_percentage': BSbaseOrderPercent.value,
	'profit_target': BsprofitTarget.value,
	'leverage': BSleverage.value,
	'safety_target': BssafetyTarget.value,
	'safety_order_percentage': BssafetyOrderPercent.value,
	'max_safety_orders': BsmaxSafetyOrderNumber.value,
	'liquidation_limit': BsLiquidationLimit.value
};

//---------------------------------------------------
//----------------Functions--------------------------
//---------------------------------------------------
//trigger the below function immediately
changeTimeInterval();
elf.getUpdate(elfURLS.updateRequest);
elf.getBotSettings(elfURLS.botSettings);
connectionChange(1);

function calculateBotSettings(){
	//adjust number nexy to slider
	BscommittedCapitalNumber.innerHTML = BscommittedCapitalSlider.value;
	BsbaseOrderNumber.innerHTML = BSbaseOrderPercent.value;
	BssafetyOrderNumber.innerHTML = BssafetyOrderPercent.value;

	// calculate max number of safety orders
    if(BssafetyOrderPercent.value>(100-BSbaseOrderPercent.value)){
        //console.log('larger');
        BssafetyOrderNumber.innerHTML = 100-BSbaseOrderPercent.value;
        BssafetyOrderPercent.value = 100-BSbaseOrderPercent.value;
        BsmaxSafetyOrderNumber.innerHTML = ((100-BSbaseOrderPercent.value)/BssafetyOrderPercent.value).toFixed(0);
    }else{
        //console.log('smaller');
        BssafetyOrderNumber.innerHTML = BssafetyOrderPercent.value
        BsmaxSafetyOrderNumber.innerHTML = ((100-BSbaseOrderPercent.value)/BssafetyOrderPercent.value).toFixed(0);
    }
}
function updateBotSettings(){
	botSettings.committed_capital = BscommittedCapitalSlider.value;
	botSettings.base_order_percentage = BSbaseOrderPercent.value;
	botSettings.profit_target = BsprofitTarget.value;
	botSettings.leverage = BSleverage.value;
	botSettings.safety_target = BssafetyTarget.value;
	botSettings.safety_order_percentage = BssafetyOrderPercent.value;
	botSettings.max_safety_orders = BsmaxSafetyOrderNumber.value;
	botSettings.liquidation_limit = BsmaxSafetyOrderNumber.value;

	return botSettings;
}

function changeTimeInterval(){
	//clearInterval(intervalID);//old code but handy to remember how to stop the auto refresh
	intervalID = setInterval(elf.getUpdate, frontEndickerRefreshTime, elfURLS.updateRequest);//updates every 1000 milli secs*10 -> 10 secs
}
export function connectionChange(x){
	if(!x){
		connectionStatus.innerHTML = 'Connection offline';
		connectionCircle.getContext('2d').beginPath();
		connectionCircle.getContext('2d').fillStyle = '#FF0000';
		connectionCircle.getContext('2d').strokeStyle = '#FF0000';
		connectionCircle.getContext('2d').arc((connectionCircle.width / 2), (connectionCircle.height / 2), (connectionCircle.width / 2), 0, 2 * Math.PI, false);
		connectionCircle.getContext('2d').fill();
		jumpingElfGif.classList.add('HideThis');
		nodeOfflineErrorSoundLong.play();
	}else if(x){
		connectionStatus.innerHTML = 'Connection online';
		connectionCircle.getContext('2d').beginPath();
		connectionCircle.getContext('2d').fillStyle = '#00FF00';
		connectionCircle.getContext('2d').strokeStyle = '#00FF00';
		connectionCircle.getContext('2d').arc((connectionCircle.width / 2), (connectionCircle.height / 2), (connectionCircle.width / 2), 0, 2 * Math.PI, false);
		connectionCircle.getContext('2d').fill();
		jumpingElfGif.classList.remove('HideThis');
	}else{
		connectionStatus.innerHTML = 'Connection unclear, refresh page';
		connectionCircle.getContext('2d').beginPath();
		connectionCircle.getContext('2d').fillStyle = '#000000';
		connectionCircle.getContext('2d').strokeStyle = '#000000';
		connectionCircle.getContext('2d').arc((connectionCircle.width / 2), (connectionCircle.height / 2), (connectionCircle.width / 2), 0, 2 * Math.PI, false);
		connectionCircle.getContext('2d').fill();
		jumpingElfGif.classList.add('HideThis');
		nodeOfflineErrorSoundLong.play();
	}
}
export function updateDataOnScreen(a){
	try{
	//console.log(a.currentPosition.currentPrice);

	//SYMBOL DISPLAY TOP
	symbolDisplayText.innerHTML = a.currentPosition.currentPrice.symbol.substring(0,8);
	lastPriceDisplayText.innerHTML = a.currentPosition.currentPrice.last.toLocaleString()+' USD';
	dailyChangeDisplayText.innerHTML = a.currentPosition.currentPrice.percentage.toFixed(2)+' %';
	askPriceDisplayText.innerHTML = a.currentPosition.currentPrice.ask.toLocaleString()+' USD';
	bidPriceDisplayText.innerHTML = a.currentPosition.currentPrice.bid.toLocaleString()+' USD';


		//change colors on market display prices (at top) based on 24h performance
		if(a.currentPosition.currentPrice.percentage<0){
			//change color to red
			dailyChangeDisplayText.classList.remove('displayPositive');
			dailyChangeDisplayText.classList.add('displayNegative');

			lastPriceDisplayText.classList.remove('displayPositive');
			lastPriceDisplayText.classList.add('displayNegative');
		}else{//if not negative, go green
			dailyChangeDisplayText.classList.remove('displayNegative');
			dailyChangeDisplayText.classList.add('displayPositive');

			lastPriceDisplayText.classList.remove('displayNegative');
			lastPriceDisplayText.classList.add('displayPositive');
		}

	//ELF STATS
	const PL= Number(a.balance.PL);
	
	if(previousTodaysPL != 0){//play sound if previous balance is smaller than new one -> sats got stacked
		if(PL>previousTodaysPL){
			yeahBabyYeahSound.play();
		}
	}
	previousTodaysPL = PL;//enter new 'record' into previous one
	

	const pm = Number(a.currentPositionb.data.position_margin);
	const currentPrice = Number(a.currentPosition.currentPrice.bid);
	const walletBalance = Number(a.balance.equity);
	const walletValue = walletBalance*currentPrice;

	const PLUSD = PL*currentPrice;
	//UPLUSDDisplayText.innerHTML = PLUSD.toFixed(2)+' USD';
	UPLUSDDisplayText.innerHTML = PLUSD.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD'
	UPLpercentageDisplayText.innerHTML = (((PL/walletBalance)*100).toFixed(2)+' %');
	UPLDisplayText.innerHTML = PL.toFixed(8)+' BTC';
	//tradesTodayDisplayText.innerHTML = tradesCompletedToday+' Trades completed today.';

	const totalPL = Number(a.currentPositionb.data.cum_realised_pnl);
	const totalPLUSD = totalPL*currentPrice;
	TotalPLUSD.innerHTML = totalPLUSD.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD'
	TotalPL.innerHTML = totalPL.toFixed(8)+' BTC';
	//tradesTotalDisplayText.innerHTML = tradesCompletedTotal+' Trades completed total.';
	
		//change colors on market display prices (at top) based on 24h performance
		if(PLUSD<0){
			//change color to red
			UPLUSDDisplayText.classList.remove('displayPositive');
			UPLUSDDisplayText.classList.add('displayNegative');
		}else{//if not negative, go green
			UPLUSDDisplayText.classList.remove('displayNegative');
			UPLUSDDisplayText.classList.add('displayPositive');
		}
		
	//AVERAGE RETURNS

	if(a.pastMonthPNL.length>0){
		let tot = 0;
		let totAvg=0;
		let xVar = 0;
		a.pastMonthPNL.length<7 ? xVar = a.pastMonthPNL.length : xVar = 7 ;

		for(let i=(a.pastMonthPNL.length-xVar);i<a.pastMonthPNL.length;i++){
			tot += Number(a.pastMonthPNL[i].amount);
			totAvg += Number(a.pastMonthPNL[i].gains);
		}
		SevenPLTotal.innerHTML = tot.toFixed(8)+' BTC';
		SevenPLPerct.innerHTML = (totAvg/xVar*100).toFixed(2)+'%';

		a.pastMonthPNL.forEach(entry=>{
			tot += Number(entry.amount);
			totAvg += Number(entry.gains);
		});
		ThirtyPLTotal.innerHTML = tot.toFixed(8)+' BTC';
		ThirtyPLPerct.innerHTML = (totAvg/a.pastMonthPNL.length*100).toFixed(2)+'%';
		//Annualized %
		const f = 1+Number(totAvg/a.pastMonthPNL.length);
		const g = Math.pow(f,365);
		const calcTemp = (g-1)*100;//*100 because 0,01 = 1%
		AnnualizedReturn.innerHTML = calcTemp.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+'%';
	}
	
	//Current Position
	cpQuantity.innerHTML = 'Quantity: '+a.currentPosition.quantity.toLocaleString(2);
	cpLeverage.innerHTML = 'Leverage: '+a.currentPosition.leverage+'x';
	cpLevIsIsolated.innerHTML = (a.currentPosition.isolated) ? 'Margin Type: Isolated' : 'Margin Type: Cross';
	cpValue.innerHTML = 'Value: '+a.currentPosition.value.toLocaleString(8);
	
	const b = parseInt(a.currentPosition.entryPrice, 10);
	cpEntryPrice.innerHTML = 'Entry Price: '+b.toLocaleString(2);
	cpTradeType.innerHTML = 'Trade Type: '+a.currentPosition.tradeType;
	cpLastOrderTime.innerHTML = 'Last Order Time: '+a.currentPosition.lastOrderTime.substring(0,10);
	cpMargin.innerHTML = 'Margin: '+a.currentPosition.margin;
	
	//Account Balance
	//console.log(a.balance);
	walletBalanceDisplayText.innerHTML = 'Wallet Balance: '+a.balance.wallet_balance+' BTC';
	walletBalanceUSDDisplayText.innerHTML = 'Wallet Balance (USD): '+walletValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD'
	equityBalanceDisplayText.innerHTML = 'Equity: '+a.balance.equity+' BTC';
	availableBalanceDisplayText.innerHTML = 'Available Balance: '+a.balance.available_balance+' BTC';
	usedMarginBalanceDisplayText.innerHTML = 'Used Margin: '+a.balance.used_margin+' BTC';
	orderMarginBalanceDisplayText.innerHTML = 'Order Margin: '+a.balance.order_margin+' BTC';
}catch(e){console.log('error in updateDataOnScreen() '+e)}
}
export function updateBotSettingsOnScreen(a){
	//Bot Settings Section
	//this section is blocked because constant refreshing blocks the user from adjusting the settings
	//instead, adjust the settings once they're set or/and when the page refreshes. other than that do not touch it.

	BscommittedCapitalSlider.value = a.commitedCapital;
	BscommittedCapitalNumber.innerHTML = a.commitedCapital;

	BSbaseOrderPercent.value = a.baseorderpercentage;
	BsbaseOrderNumber.innerHTML = a.baseorderpercentage;

	BsprofitTarget.value = a.profitTarget;
	BSleverage.value = a.leverage;
	BssafetyTarget.value = a.safetyTarget;

	BssafetyOrderPercent.value = a.safetyOrderSizeofCC;
	//BssafetyOrderNumber.innerHTML = a.botSettings.commitedCapital;

	//BsmaxSafetyOrderNumber.innerHTML = a.botSettings.commitedCapital;
	
}