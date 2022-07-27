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

//DEBUG PANEL -- only made for first bot
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

//connection status - bot 1
const connectionCircle1 = document.querySelector('#connectionCircle1');
const connectionStatus1 = document.querySelector('#connectionStatus1');
const jumpingElfGif1 = document.querySelector('#jumpingElfGif1');
//connection status - bot 2
const connectionCircle2 = document.querySelector('#connectionCircle2');
const connectionStatus2 = document.querySelector('#connectionStatus2');
const jumpingElfGif2 = document.querySelector('#jumpingElfGif2');
//connection status - bot 3
const connectionCircle3 = document.querySelector('#connectionCircle3');
const connectionStatus3 = document.querySelector('#connectionStatus3');
const jumpingElfGif3 = document.querySelector('#jumpingElfGif3');

//symbol & current prices display - bot 1
const symbolDisplayText1 = document.querySelector('#symbolDisplay1');
const lastPriceDisplayText1 = document.querySelector('#lastPriceDisplay1');
const dailyChangeDisplayText1 = document.querySelector('#dailyChange1');
const askPriceDisplayText1 = document.querySelector('#askPriceDisplay1');
const bidPriceDisplayText1 = document.querySelector('#bidPriceDisplay1');
//symbol & current prices display - bot 2
const symbolDisplayText2 = document.querySelector('#symbolDisplay2');
const lastPriceDisplayText2 = document.querySelector('#lastPriceDisplay2');
const dailyChangeDisplayText2 = document.querySelector('#dailyChange2');
const askPriceDisplayText2 = document.querySelector('#askPriceDisplay2');
const bidPriceDisplayText2 = document.querySelector('#bidPriceDisplay2');
//symbol & current prices display - bot 3
const symbolDisplayText3 = document.querySelector('#symbolDisplay3');
const lastPriceDisplayText3 = document.querySelector('#lastPriceDisplay3');
const dailyChangeDisplayText3 = document.querySelector('#dailyChange3');
const askPriceDisplayText3 = document.querySelector('#askPriceDisplay3');
const bidPriceDisplayText3 = document.querySelector('#bidPriceDisplay3');

//ELF STATS - bot 1
const UPLUSDDisplayText1 = document.querySelector('#UPLUSD1');
const UPLpercentageDisplayText1 = document.querySelector('#UPLpercentage1');
const UPLDisplayText1 = document.querySelector('#UPL1');
//const tradesTodayDisplayText1 = document.querySelector('#tradesToday1');
let previousTodaysPL1 = 0;

const TotalPLUSD1 = document.querySelector('#TotalPLUSD1');
const TotalPL1 = document.querySelector('#TotalPL1');
//const tradesTotalDisplayText1 = document.querySelector('#tradesTotal1');
//ELF STATS - bot 2
const UPLUSDDisplayText2 = document.querySelector('#UPLUSD2');
const UPLpercentageDisplayText2 = document.querySelector('#UPLpercentage2');
const UPLDisplayText2 = document.querySelector('#UPL2');
//const tradesTodayDisplayTex2 = document.querySelector('#tradesToday2');
let previousTodaysPL2 = 0;

const TotalPLUSD2 = document.querySelector('#TotalPLUSD2');
const TotalPL2 = document.querySelector('#TotalPL2');
//const tradesTotalDisplayText2 = document.querySelector('#tradesTotal2');
//ELF STATS - bot 3
const UPLUSDDisplayText3 = document.querySelector('#UPLUSD3');
const UPLpercentageDisplayText3 = document.querySelector('#UPLpercentage3');
const UPLDisplayText3 = document.querySelector('#UPL3');
//const tradesTodayDisplayText3 = document.querySelector('#tradesToday3');
let previousTodaysPL3 = 0;

const TotalPLUSD3 = document.querySelector('#TotalPLUSD3');
const TotalPL3 = document.querySelector('#TotalPL3');
//const tradesTotalDisplayText3 = document.querySelector('#tradesTotal3');

//AVERAGE RETURNS - bot 1
const PerfButton1 = document.querySelector('#PerfTitle1');
const PerfArrow1 = document.querySelector('#PerfArrow1');
const SevenPLTotal1 = document.querySelector('#number-7PL1');
const SevenPLPerct1 = document.querySelector('#number-7avggain1');
const ThirtyPLTotal1 = document.querySelector('#number-30PL1');
const ThirtyPLPerct1 = document.querySelector('#number-30avggain1');
const PerformanceStatsDiv1 = document.querySelector('#PerformanceStatsDiv1');
const AnnualizedReturn1 = document.querySelector('#number-annualizedReturn1');
PerfButton1.addEventListener('click', ()=>{
	PerformanceStatsDiv1.classList.toggle('HideThis'); 
	if(PerfArrow1.classList.contains('PerfArrowUp')){
		PerfArrow1.classList.remove('PerfArrowUp');
		PerfArrow1.classList.add('PerfArrowDown');
   }else{
		PerfArrow1.classList.remove('PerfArrowDown');
		PerfArrow1.classList.add('PerfArrowUp');
   }});
//AVERAGE RETURNS - bot 2
const PerfButton2 = document.querySelector('#PerfTitle2');
const PerfArrow2 = document.querySelector('#PerfArrow2');
const SevenPLTotal2 = document.querySelector('#number-7PL2');
const SevenPLPerct2 = document.querySelector('#number-7avggain2');
const ThirtyPLTotal2 = document.querySelector('#number-30PL2');
const ThirtyPLPerct2 = document.querySelector('#number-30avggain2');
const PerformanceStatsDiv2 = document.querySelector('#PerformanceStatsDiv2');
const AnnualizedReturn2 = document.querySelector('#number-annualizedReturn2');
PerfButton2.addEventListener('click', ()=>{
	PerformanceStatsDiv2.classList.toggle('HideThis'); 
	if(PerfArrow2.classList.contains('PerfArrowUp')){
		PerfArrow2.classList.remove('PerfArrowUp');
		PerfArrow2.classList.add('PerfArrowDown');
   }else{
		PerfArrow2.classList.remove('PerfArrowDown');
		PerfArrow2.classList.add('PerfArrowUp');
   }});
//AVERAGE RETURNS - bot 3
const PerfButton3 = document.querySelector('#PerfTitle3');
const PerfArrow3 = document.querySelector('#PerfArrow3');
const SevenPLTotal3 = document.querySelector('#number-7PL3');
const SevenPLPerct3 = document.querySelector('#number-7avggain3');
const ThirtyPLTotal3 = document.querySelector('#number-30PL3');
const ThirtyPLPerct3 = document.querySelector('#number-30avggain');
const PerformanceStatsDiv3 = document.querySelector('#PerformanceStatsDiv3');
const AnnualizedReturn3 = document.querySelector('#number-annualizedReturn3');
PerfButton3.addEventListener('click', ()=>{
	PerformanceStatsDiv3.classList.toggle('HideThis'); 
	if(PerfArrow3.classList.contains('PerfArrowUp')){
		PerfArrow3.classList.remove('PerfArrowUp');
		PerfArrow3.classList.add('PerfArrowDown');
   }else{
		PerfArrow3.classList.remove('PerfArrowDown');
		PerfArrow3.classList.add('PerfArrowUp');
   }});

//Account Balance title + make title clickable, hide - bot 1
const titleBalanceDisplayText1 = document.querySelector('#acBalanceTitle1');
const acBalanceDiv1 = document.querySelector('#acBalanceDiv1');
const acBalanceArrow1 = document.querySelector('#acBalanceArrow1');
titleBalanceDisplayText1.addEventListener('click', ()=>{
	 acBalanceDiv1.classList.toggle('HideThis'); 
	 if(acBalanceArrow1.classList.contains('acBalanceArrowUp')){
		 acBalanceArrow1.classList.remove('acBalanceArrowUp');
		 acBalanceArrow1.classList.add('acBalanceArrowDown');
	}else{
		acBalanceArrow1.classList.remove('acBalanceArrowDown');
		 acBalanceArrow1.classList.add('acBalanceArrowUp');
	}});
//Account Balance title + make title clickable, hide - bot 2
const titleBalanceDisplayText2 = document.querySelector('#acBalanceTitle2');
const acBalanceDiv2 = document.querySelector('#acBalanceDiv2');
const acBalanceArrow2 = document.querySelector('#acBalanceArrow2');
titleBalanceDisplayText2.addEventListener('click', ()=>{
	 acBalanceDiv2.classList.toggle('HideThis'); 
	 if(acBalanceArrow2.classList.contains('acBalanceArrowUp')){
		 acBalanceArrow2.classList.remove('acBalanceArrowUp');
		 acBalanceArrow2.classList.add('acBalanceArrowDown');
	}else{
		acBalanceArrow2.classList.remove('acBalanceArrowDown');
		 acBalanceArrow2.classList.add('acBalanceArrowUp');
	}});
//Account Balance title + make title clickable, hide - bot 3
const titleBalanceDisplayText3 = document.querySelector('#acBalanceTitle3');
const acBalanceDiv3 = document.querySelector('#acBalanceDiv3');
const acBalanceArrow3 = document.querySelector('#acBalanceArrow3');
titleBalanceDisplayText3.addEventListener('click', ()=>{
	 acBalanceDiv3.classList.toggle('HideThis'); 
	 if(acBalanceArrow3.classList.contains('acBalanceArrowUp')){
		 acBalanceArrow3.classList.remove('acBalanceArrowUp');
		 acBalanceArrow3.classList.add('acBalanceArrowDown');
	}else{
		acBalanceArrow3.classList.remove('acBalanceArrowDown');
		 acBalanceArrow3.classList.add('acBalanceArrowUp');
	}});

//Account Balance - bot 1
const walletBalanceDisplayText1 = document.querySelector('#BL-walletBalance1');
const walletBalanceUSDDisplayText1 = document.querySelector('#BL-walletBalanceUSD1');
const equityBalanceDisplayText1 = document.querySelector('#BL-equity1');
const availableBalanceDisplayText1 = document.querySelector('#BL-available1');
const usedMarginBalanceDisplayText1 = document.querySelector('#BL-usedMargin1');
const orderMarginBalanceDisplayText1 = document.querySelector('#BL-orderMargin1');
//Account Balance - bot 2
const walletBalanceDisplayText2 = document.querySelector('#BL-walletBalance2');
const walletBalanceUSDDisplayText2 = document.querySelector('#BL-walletBalanceUSD2');
const equityBalanceDisplayText2 = document.querySelector('#BL-equity2');
const availableBalanceDisplayText2 = document.querySelector('#BL-available2');
const usedMarginBalanceDisplayText2 = document.querySelector('#BL-usedMargin2');
const orderMarginBalanceDisplayText2 = document.querySelector('#BL-orderMargin2');
//Account Balance - bot 3
const walletBalanceDisplayText3 = document.querySelector('#BL-walletBalance3');
const walletBalanceUSDDisplayText3 = document.querySelector('#BL-walletBalanceUSD3');
const equityBalanceDisplayText3 = document.querySelector('#BL-equity3');
const availableBalanceDisplayText3 = document.querySelector('#BL-available3');
const usedMarginBalanceDisplayText3 = document.querySelector('#BL-usedMargin3');
const orderMarginBalanceDisplayText3 = document.querySelector('#BL-orderMargin3');

//Current Position title + make title clickable, hide - bot 1
const cpTitleDisplayText1 = document.querySelector('#cpTitle1');
const cpLeftDiv1 = document.querySelector('#cpLeft1');
const cpRightDiv1 = document.querySelector('#cpRight1');
const cpArrow1 = document.querySelector('#cpArrow1');
cpTitleDisplayText1.addEventListener('click', ()=>{
	cpLeftDiv1.classList.toggle('HideThis'); 
	cpRightDiv1.classList.toggle('HideThis'); 
	 if(cpArrow1.classList.contains('cpArrowUp')){
		cpArrow1.classList.remove('cpArrowUp');
		cpArrow1.classList.add('cpArrowDown');
	}else{
		cpArrow1.classList.remove('cpArrowDown');
		cpArrow1.classList.add('cpArrowUp');
	}});
//Current Position title + make title clickable, hide - bot 2
const cpTitleDisplayText2 = document.querySelector('#cpTitle2');
const cpLeftDiv2 = document.querySelector('#cpLeft2');
const cpRightDiv2 = document.querySelector('#cpRight2');
const cpArrow2 = document.querySelector('#cpArrow2');
cpTitleDisplayText2.addEventListener('click', ()=>{
	cpLeftDiv2.classList.toggle('HideThis'); 
	cpRightDiv2.classList.toggle('HideThis'); 
	 if(cpArrow2.classList.contains('cpArrowUp')){
		cpArrow2.classList.remove('cpArrowUp');
		cpArrow2.classList.add('cpArrowDown');
	}else{
		cpArrow2.classList.remove('cpArrowDown');
		cpArrow2.classList.add('cpArrowUp');
	}});
//Current Position title + make title clickable, hide - bot 3
const cpTitleDisplayText3 = document.querySelector('#cpTitle3');
const cpLeftDiv3 = document.querySelector('#cpLeft3');
const cpRightDiv3 = document.querySelector('#cpRight3');
const cpArrow3 = document.querySelector('#cpArrow3');
cpTitleDisplayText3.addEventListener('click', ()=>{
	cpLeftDiv3.classList.toggle('HideThis'); 
	cpRightDiv3.classList.toggle('HideThis'); 
	 if(cpArrow3.classList.contains('cpArrowUp')){
		cpArrow3.classList.remove('cpArrowUp');
		cpArrow3.classList.add('cpArrowDown');
	}else{
		cpArrow3.classList.remove('cpArrowDown');
		cpArrow3.classList.add('cpArrowUp');
	}});

//Current Position stats on screen - bot 1
const cpQuantity1 = document.querySelector('#CP-quantity1');
const cpLeverage1 = document.querySelector('#CP-leverage1');
const cpLevIsIsolated1 = document.querySelector('#CP-isIsolated1');
const cpValue1 = document.querySelector('#CP-value1');

const cpEntryPrice1 = document.querySelector('#CP-entryPrice1');
const cpTradeType1 = document.querySelector('#CP-tradeType1');
const cpLastOrderTime1 = document.querySelector('#CP-lastOrderTime1');
const cpMargin1 = document.querySelector('#CP-margin1');
//Current Position stats on screen - bot 2
const cpQuantity2 = document.querySelector('#CP-quantity2');
const cpLeverage2 = document.querySelector('#CP-leverage2');
const cpLevIsIsolated2 = document.querySelector('#CP-isIsolated2');
const cpValue2 = document.querySelector('#CP-value2');

const cpEntryPrice2 = document.querySelector('#CP-entryPrice2');
const cpTradeType2 = document.querySelector('#CP-tradeType2');
const cpLastOrderTime2 = document.querySelector('#CP-lastOrderTime2');
const cpMargin2 = document.querySelector('#CP-margin2');
//Current Position stats on screen - bot 3
const cpQuantity3 = document.querySelector('#CP-quantity3');
const cpLeverage3 = document.querySelector('#CP-leverage3');
const cpLevIsIsolated3 = document.querySelector('#CP-isIsolated3');
const cpValue3 = document.querySelector('#CP-value3');

const cpEntryPrice3 = document.querySelector('#CP-entryPrice3');
const cpTradeType3 = document.querySelector('#CP-tradeType3');
const cpLastOrderTime3 = document.querySelector('#CP-lastOrderTime3');
const cpMargin3 = document.querySelector('#CP-margin3');

//Bot Settings Title + make title clickable, hide - bot 1
const bsDisplayText1 = document.querySelector('#bsTitle1');
const bsDiv1 = document.querySelector('#bsDiv1');
const bsArrow1 = document.querySelector('#bsArrow1');
bsDisplayText1.addEventListener('click', ()=>{
	bsDiv1.classList.toggle('HideThis'); 
	 if(bsArrow1.classList.contains('bsArrowUp')){
		bsArrow1.classList.remove('bsArrowUp');
		bsArrow1.classList.add('bsArrowDown');
	}else{
		bsArrow1.classList.remove('bsArrowDown');
		bsArrow1.classList.add('bsArrowUp');
	}});
//Bot Settings Title + make title clickable, hide - bot 2
const bsDisplayText2 = document.querySelector('#bsTitle2');
const bsDiv2 = document.querySelector('#bsDiv2');
const bsArrow2 = document.querySelector('#bsArrow2');
bsDisplayText2.addEventListener('click', ()=>{
	bsDiv2.classList2.toggle('HideThis'); 
	 if(bsArrow2.classList.contains('bsArrowUp')){
		bsArrow2.classList.remove('bsArrowUp');
		bsArrow2.classList.add('bsArrowDown');
	}else{
		bsArrow2.classList.remove('bsArrowDown');
		bsArrow2.classList.add('bsArrowUp');
	}});
//Bot Settings Title + make title clickable, hide - bot 3
const bsDisplayText3 = document.querySelector('#bsTitle3');
const bsDiv3 = document.querySelector('#bsDiv3');
const bsArrow3 = document.querySelector('#bsArrow3');
bsDisplayText3.addEventListener('click', ()=>{
	bsDiv3.classList.toggle('HideThis'); 
	 if(bsArrow3.classList.contains('bsArrowUp')){
		bsArrow3.classList.remove('bsArrowUp');
		bsArrow3.classList.add('bsArrowDown');
	}else{
		bsArrow3.classList.remove('bsArrowDown');
		bsArrow3.classList.add('bsArrowUp');
	}});

//Bot Settings - bot 1
const BsForm1 = document.querySelector('#botSettingsform1');
const BscommittedCapitalSlider1 = document.querySelector('#BS-committedCapitalSlider1');
const BscommittedCapitalNumber1 = document.querySelector('#BS-committedCapitalNumber1');

const BSbaseOrderPercent1 = document.querySelector('#BS-baseOrderPercentSlider1');
const BsbaseOrderNumber1 = document.querySelector('#BS-baseOrderNumber1');

const BsprofitTarget1 = document.querySelector('#BS-profitTarget1');
const BSleverage1 = document.querySelector('#BS-leverage1');
const BssafetyTarget1 = document.querySelector('#BS-safetyTarget1');

const BssafetyOrderPercent1 = document.querySelector('#BS-safetyOrderPercent1');
const BssafetyOrderNumber1 = document.querySelector('#BS-safetyOrderNumber1');

const BsmaxSafetyOrderNumber1 = document.querySelector('#BS-maxSafetyOrderNumber1');

const BsLiquidationLimit1 = document.querySelector('#BS-LiquidationLimit1');

BscommittedCapitalSlider1.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BSbaseOrderPercent1.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BssafetyOrderPercent1.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BsForm1.addEventListener('submit', (e)=>{
	e.preventDefault();
	updateBotSettings(); 
	elf.changeBotSettings(elfURLS.changebotsettings, botSettings);
});
//Bot Settings - bot 2
const BsForm2 = document.querySelector('#botSettingsform2');
const BscommittedCapitalSlider2 = document.querySelector('#BS-committedCapitalSlider2');
const BscommittedCapitalNumber2 = document.querySelector('#BS-committedCapitalNumber2');

const BSbaseOrderPercent2 = document.querySelector('#BS-baseOrderPercentSlider2');
const BsbaseOrderNumber2 = document.querySelector('#BS-baseOrderNumber2');

const BsprofitTarget2 = document.querySelector('#BS-profitTarget2');
const BSleverage2 = document.querySelector('#BS-leverage2');
const BssafetyTarget2 = document.querySelector('#BS-safetyTarget2');

const BssafetyOrderPercent2 = document.querySelector('#BS-safetyOrderPercent2');
const BssafetyOrderNumber2 = document.querySelector('#BS-safetyOrderNumber2');

const BsmaxSafetyOrderNumber2 = document.querySelector('#BS-maxSafetyOrderNumber2');

const BsLiquidationLimit2 = document.querySelector('#BS-LiquidationLimit2');

BscommittedCapitalSlider2.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BSbaseOrderPercent2.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BssafetyOrderPercent2.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BsForm2.addEventListener('submit', (e)=>{
	e.preventDefault();
	updateBotSettings(); 
	elf.changeBotSettings(elfURLS.changebotsettings, botSettings);
});
//Bot Settings - bot 3
const BsForm3 = document.querySelector('#botSettingsform3');
const BscommittedCapitalSlider3 = document.querySelector('#BS-committedCapitalSlider3');
const BscommittedCapitalNumber3 = document.querySelector('#BS-committedCapitalNumber3');

const BSbaseOrderPercent3 = document.querySelector('#BS-baseOrderPercentSlider3');
const BsbaseOrderNumber3 = document.querySelector('#BS-baseOrderNumber3');

const BsprofitTarget3 = document.querySelector('#BS-profitTarget3');
const BSleverage3 = document.querySelector('#BS-leverage3');
const BssafetyTarget3 = document.querySelector('#BS-safetyTarget3');

const BssafetyOrderPercent3 = document.querySelector('#BS-safetyOrderPercent3');
const BssafetyOrderNumber3 = document.querySelector('#BS-safetyOrderNumber3');

const BsmaxSafetyOrderNumber3 = document.querySelector('#BS-maxSafetyOrderNumber3');

const BsLiquidationLimit3 = document.querySelector('#BS-LiquidationLimit3');

BscommittedCapitalSlider3.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BSbaseOrderPercent3.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BssafetyOrderPercent3.addEventListener('input', ()=> calculateBotSettings()); //when moving slider, update numer next to it
BsForm3.addEventListener('submit', (e)=>{
	e.preventDefault();
	updateBotSettings(); 
	elf.changeBotSettings(elfURLS.changebotsettings, botSettings);
});

//Bot Settings Object
let botSettingsBot1 = {
	
	'committed_capital': BscommittedCapitalSlider1.value,
	'base_order_percentage': BSbaseOrderPercent1.value,
	'profit_target': BsprofitTarget1.value,
	'leverage': BSleverage1.value,
	'safety_target': BssafetyTarget1.value,
	'safety_order_percentage': BssafetyOrderPercent1.value,
	'max_safety_orders': BsmaxSafetyOrderNumber1.value,
	'liquidation_limit': BsLiquidationLimit1.value
};
let botSettingsBot2 = {
	
	'committed_capital': BscommittedCapitalSlider2.value,
	'base_order_percentage': BSbaseOrderPercent2.value,
	'profit_target': BsprofitTarget2.value,
	'leverage': BSleverage2.value,
	'safety_target': BssafetyTarget2.value,
	'safety_order_percentage': BssafetyOrderPercent2.value,
	'max_safety_orders': BsmaxSafetyOrderNumber2.value,
	'liquidation_limit': BsLiquidationLimit2.value
};
let botSettingsBot3 = {
	
	'committed_capital': BscommittedCapitalSlider3.value,
	'base_order_percentage': BSbaseOrderPercent3.value,
	'profit_target': BsprofitTarget3.value,
	'leverage': BSleverage3.value,
	'safety_target': BssafetyTarget3.value,
	'safety_order_percentage': BssafetyOrderPercent3.value,
	'max_safety_orders': BsmaxSafetyOrderNumber3.value,
	'liquidation_limit': BsLiquidationLimit3.value
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
		connectionStatus1.innerHTML = 'Connection offline';
		connectionCircle1.getContext('2d').beginPath();
		connectionCircle1.getContext('2d').fillStyle = '#FF0000';
		connectionCircle1.getContext('2d').strokeStyle = '#FF0000';
		connectionCircle1.getContext('2d').arc((connectionCircle1.width / 2), (connectionCircle1.height / 2), (connectionCircle1.width / 2), 0, 2 * Math.PI, false);
		connectionCircle1.getContext('2d').fill();
		jumpingElfGif1.classList.add('HideThis');
		nodeOfflineErrorSoundLong.play();
	}else if(x){
		connectionStatus1.innerHTML = 'Connection online';
		connectionCircle1.getContext('2d').beginPath();
		connectionCircle1.getContext('2d').fillStyle = '#00FF00';
		connectionCircle1.getContext('2d').strokeStyle = '#00FF00';
		connectionCircle1.getContext('2d').arc((connectionCircle1.width / 2), (connectionCircle1.height / 2), (connectionCircle1.width / 2), 0, 2 * Math.PI, false);
		connectionCircle1.getContext('2d').fill();
		jumpingElfGif1.classList.remove('HideThis');
	}else{
		connectionStatus1.innerHTML = 'Connection unclear, refresh page';
		connectionCircle1.getContext('2d').beginPath();
		connectionCircle1.getContext('2d').fillStyle = '#000000';
		connectionCircle1.getContext('2d').strokeStyle = '#000000';
		connectionCircle1.getContext('2d').arc((connectionCircle1.width / 2), (connectionCircle1.height / 2), (connectionCircle1.width / 2), 0, 2 * Math.PI, false);
		connectionCircle1.getContext('2d').fill();
		jumpingElfGif1.classList.add('HideThis');
		nodeOfflineErrorSoundLong.play();
	}
}
export function updateDataOnScreen(a){
	try{
	//console.log(a.currentPosition.currentPrice);

	//SYMBOL DISPLAY TOP
	symbolDisplayText1.innerHTML = a.bot1.currentPosition.currentPrice.symbol.substring(0,8);
	symbolDisplayText2.innerHTML = a.bot2.currentPosition.currentPrice.symbol.substring(0,8);
	symbolDisplayText3.innerHTML = a.bot3.currentPosition.currentPrice.symbol.substring(0,8);

	lastPriceDisplayText1.innerHTML = a.bot1.currentPosition.currentPrice.last.toLocaleString()+' USD';
	lastPriceDisplayText2.innerHTML = a.bot2.currentPosition.currentPrice.last.toLocaleString()+' USD';
	lastPriceDisplayText3.innerHTML = a.bot3.currentPosition.currentPrice.last.toLocaleString()+' USD';

	dailyChangeDisplayText1.innerHTML = a.bot1.currentPosition.currentPrice.percentage.toFixed(2)+' %';
	dailyChangeDisplayText2.innerHTML = a.bot2.currentPosition.currentPrice.percentage.toFixed(2)+' %';
	dailyChangeDisplayText3.innerHTML = a.bot3.currentPosition.currentPrice.percentage.toFixed(2)+' %';

	askPriceDisplayText1.innerHTML = a.bot1.currentPosition.currentPrice.ask.toLocaleString()+' USD';
	askPriceDisplayText2.innerHTML = a.bot2.currentPosition.currentPrice.ask.toLocaleString()+' USD';
	askPriceDisplayText3.innerHTML = a.bot3.currentPosition.currentPrice.ask.toLocaleString()+' USD';

	bidPriceDisplayText1.innerHTML = a.bot1.currentPosition.currentPrice.bid.toLocaleString()+' USD';
	bidPriceDisplayText2.innerHTML = a.bot2.currentPosition.currentPrice.bid.toLocaleString()+' USD';
	bidPriceDisplayText3.innerHTML = a.bot3.currentPosition.currentPrice.bid.toLocaleString()+' USD';


		//change colors on market display prices (at top) based on 24h performance
		//needs to include displays for bot 2 n 3
		if(a.bot1.currentPosition.currentPrice.percentage<0){
			//change color to red
			dailyChangeDisplayText1.classList.remove('displayPositive');
			dailyChangeDisplayText1.classList.add('displayNegative');

			lastPriceDisplayText1.classList.remove('displayPositive');
			lastPriceDisplayText1.classList.add('displayNegative');
		}else{//if not negative, go green
			dailyChangeDisplayText1.classList.remove('displayNegative');
			dailyChangeDisplayText1.classList.add('displayPositive');

			lastPriceDisplayText1.classList.remove('displayNegative');
			lastPriceDisplayText1.classList.add('displayPositive');
		}

	//ELF STATS
	//needs to include bots 2 n 3 displays
	const PLbot1= Number(a.bot1.balance.PL);
	const PLbot2= Number(a.bot2.balance.PL);
	//const PLbot3= Number(a.bot3.balance.PL);
	const PLbot3 = null;
	const previousTodaysPL3 = null;
	
	if(previousTodaysPL1 != 0 || previousTodaysPL2 != 0 || previousTodaysPL3 != 0){//play sound if previous balance is smaller than new one -> sats got stacked
		if(PLbot1>previousTodaysPL1 || PLbot3>previousTodaysPL3 || PLbot3>previousTodaysPL3){
			yeahBabyYeahSound.play();
		}
	}
	previousTodaysPL1 = PLbot1;//enter new 'record' into previous one
	previousTodaysPL2 = PLbot2;//enter new 'record' into previous one
	//previousTodaysPL3 = PLbot3;//enter new 'record' into previous one
	

	//const pm = Number(a.bot1.currentPositionb.data.position_margin);
	const currentPricebot1 = Number(a.bot1.currentPosition.currentPrice.bid);
	const walletBalancebot1 = Number(a.bot1.balance.equity);
	const walletValuebot1 = walletBalancebot1*currentPricebot1;

	const currentPricebot2 = Number(a.bot2.currentPosition.currentPrice.bid);
	const walletBalancebot2 = Number(a.bot2.balance.equity);
	const walletValuebot2 = walletBalancebot2*currentPricebot2;

	//const currentPricebot3 = Number(a.bot3.currentPosition.currentPrice.bid);
	//const walletBalancebot3 = Number(a.bot3.balance.equity);
	//const walletValuebot3 = walletBalancebot3*currentPricebot3;

	const PLUSDbot1 = PLbot1*currentPricebot1;
	const PLUSDbot2 = PLbot2*currentPricebot2;
	//const PLUSDbot3 = PLbot3*currentPricebot3;

	UPLUSDDisplayText1.innerHTML = PLUSDbot1.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD';
	UPLUSDDisplayText2.innerHTML = PLUSDbot2.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD';
	//UPLUSDDisplayText3.innerHTML = PLUSDbot3.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD';

	UPLpercentageDisplayText1.innerHTML = (((PLbot1/walletBalancebot1)*100).toFixed(2)+' %');
	UPLpercentageDisplayText2.innerHTML = (((PLbot2/walletBalancebot2)*100).toFixed(2)+' %');
	//UPLpercentageDisplayText3.innerHTML = (((PLbot3/walletBalancebot3)*100).toFixed(2)+' %');

	UPLDisplayText1.innerHTML = PLbot1.toFixed(8)+' BTC';
	//tradesTodayDisplayText.innerHTML = tradesCompletedToday+' Trades completed today.';

	const totalPLbot1 = Number(a.bot1.currentPositionb.data.cum_realised_pnl);
	const totalPLbot2 = Number(a.bot2.currentPositionb.data.cum_realised_pnl);
	//const totalPLbot3 = Number(a.bot3.currentPositionb.data.cum_realised_pnl);

	const totalPLUSDbot1 = totalPLbot1*currentPricebot1;
	const totalPLUSDbot2 = totalPLbot2*currentPricebot2;
	//const totalPLUSDbot3 = totalPLbot3*currentPricebot3;

	TotalPLUSD1.innerHTML = totalPLUSDbot1.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD';
	TotalPLUSD2.innerHTML = totalPLUSDbot2.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD';
	//TotalPLUSD3.innerHTML = totalPLUSDbot3.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD';

	TotalPL1.innerHTML = totalPLbot1.toFixed(8)+' BTC';
	TotalPL2.innerHTML = totalPLbot2.toFixed(8)+' BTC';
	//TotalPL3.innerHTML = totalPLbot3.toFixed(8)+' BTC';
	//tradesTotalDisplayText.innerHTML = tradesCompletedTotal+' Trades completed total.';
	
		//change colors on market display prices (at top) based on 24h performance
		if(PLUSDbot1<0){
			//change color to red
			UPLUSDDisplayText1.classList.remove('displayPositive');
			UPLUSDDisplayText1.classList.add('displayNegative');
		}else{//if not negative, go green
			UPLUSDDisplayText1.classList.remove('displayNegative');
			UPLUSDDisplayText1.classList.add('displayPositive');
		}
		
	//AVERAGE RETURNS

	if(a.bot1.pastMonthPNL.length>0){
		let tot = 0;
		let totAvg=0;
		let xVar = 0;
		a.bot1.pastMonthPNL.length<7 ? xVar = a.bot1.pastMonthPNL.length : xVar = 7 ;

		for(let i=(a.bot1.pastMonthPNL.length-xVar);i<a.bot1.pastMonthPNL.length;i++){
			tot += Number(a.bot1.pastMonthPNL[i].amount);
			totAvg += Number(a.bot1.pastMonthPNL[i].gains);
		}
		SevenPLTotal1.innerHTML = tot.toFixed(8)+' BTC';
		SevenPLPerct1.innerHTML = (totAvg/xVar*100).toFixed(2)+'%';

		a.bot1.pastMonthPNL.forEach(entry=>{
			tot += Number(entry.amount);
			totAvg += Number(entry.gains);
		});
		ThirtyPLTotal1.innerHTML = tot.toFixed(8)+' BTC';
		ThirtyPLPerct1.innerHTML = (totAvg/a.bot1.pastMonthPNL.length*100).toFixed(2)+'%';
		//Annualized %
		const f = 1+Number(totAvg/a.bot1.pastMonthPNL.length);
		const g = Math.pow(f,365);
		const calcTemp = (g-1)*100;//*100 because 0,01 = 1%
		AnnualizedReturn1.innerHTML = calcTemp.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+'%';
	}
	
	//Current Position
	cpQuantity1.innerHTML = 'Quantity: '+a.bot1.currentPosition.quantity.toLocaleString(2);
	cpLeverage1.innerHTML = 'Leverage: '+a.bot1.currentPosition.leverage+'x';
	cpLevIsIsolated1.innerHTML = (a.bot1.currentPosition.isolated) ? 'Margin Type: Isolated' : 'Margin Type: Cross';
	cpValue1.innerHTML = 'Value: '+a.bot1.currentPosition.value.toLocaleString(8);
	
	const b = parseInt(a.bot1.currentPosition.entryPrice, 10);
	cpEntryPrice1.innerHTML = 'Entry Price: '+b.toLocaleString(2);
	cpTradeType1.innerHTML = 'Trade Type: '+a.bot1.currentPosition.tradeType;
	cpLastOrderTime1.innerHTML = 'Last Order Time: '+a.bot1.currentPosition.lastOrderTime.substring(0,10);
	cpMargin1.innerHTML = 'Margin: '+a.bot1.currentPosition.margin;
	
	//Account Balance
	//bot1
	walletBalanceDisplayText1.innerHTML = 'Wallet Balance: '+a.bot1.balance.wallet_balance+' BTC';
	walletBalanceUSDDisplayText1.innerHTML = 'Wallet Balance (USD): '+walletValuebot1.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD'
	equityBalanceDisplayText1.innerHTML = 'Equity: '+a.bot1.balance.equity+' BTC';
	availableBalanceDisplayText1.innerHTML = 'Available Balance: '+a.bot1.balance.available_balance+' BTC';
	usedMarginBalanceDisplayText1.innerHTML = 'Used Margin: '+a.bot1.balance.used_margin+' BTC';
	orderMarginBalanceDisplayText1.innerHTML = 'Order Margin: '+a.bot1.balance.order_margin+' BTC';
	//bot2
	walletBalanceDisplayText2.innerHTML = 'Wallet Balance: '+a.bot2.balance.wallet_balance+' BTC';
	walletBalanceUSDDisplayText2.innerHTML = 'Wallet Balance (USD): '+walletValuebot2.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD'
	equityBalanceDisplayText2.innerHTML = 'Equity: '+a.bot2.balance.equity+' BTC';
	availableBalanceDisplayText2.innerHTML = 'Available Balance: '+a.bot2.balance.available_balance+' BTC';
	usedMarginBalanceDisplayText2.innerHTML = 'Used Margin: '+a.bot2.balance.used_margin+' BTC';
	orderMarginBalanceDisplayText2.innerHTML = 'Order Margin: '+a.bot2.balance.order_margin+' BTC';
	//bot3
	/*
	walletBalanceDisplayText1.innerHTML = 'Wallet Balance: '+a.bot1.balance.wallet_balance+' BTC';
	walletBalanceUSDDisplayText1.innerHTML = 'Wallet Balance (USD): '+walletValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2})+' USD'
	equityBalanceDisplayText1.innerHTML = 'Equity: '+a.bot1.balance.equity+' BTC';
	availableBalanceDisplayText1.innerHTML = 'Available Balance: '+a.bot1.balance.available_balance+' BTC';
	usedMarginBalanceDisplayText1.innerHTML = 'Used Margin: '+a.bot1.balance.used_margin+' BTC';
	orderMarginBalanceDisplayText1.innerHTML = 'Order Margin: '+a.bot1.balance.order_margin+' BTC';
	*/
}catch(e){console.log('error in updateDataOnScreen() '+e)}
}
export function updateBotSettingsOnScreen(a){
	//Bot Settings Section
	//this section is blocked because constant refreshing blocks the user from adjusting the settings
	//instead, adjust the settings once they're set or/and when the page refreshes. other than that do not touch it.

	BscommittedCapitalSlider1.value = a.commitedCapital;
	BscommittedCapitalNumber1.innerHTML = a.commitedCapital;

	BSbaseOrderPercent1.value = a.baseorderpercentage;
	BsbaseOrderNumber1.innerHTML = a.baseorderpercentage;

	BsprofitTarget1.value = a.profitTarget;
	BSleverage1.value = a.leverage;
	BssafetyTarget1.value = a.safetyTarget;

	BssafetyOrderPercent1.value = a.safetyOrderSizeofCC;
	//BssafetyOrderNumber.innerHTML = a.botSettings.commitedCapital;

	//BsmaxSafetyOrderNumber.innerHTML = a.botSettings.commitedCapital;
	
}