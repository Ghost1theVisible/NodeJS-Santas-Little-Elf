const express = require('express');
const app = express();
const chalk = require('chalk');//chalk allows for colors in console
require('dotenv').config();
const { response } = require('express');
const { param } = require('express/lib/request');

const Bot = require('./bot.js');
//ccxt = exchange library that helps connect to and work with various exchanges
const ccxt = require('ccxt');
const fs = require('fs');

//ALL URL THAT MANAGE THE API Stuffssssss
const nodeURLs = {
    baseURL : '/api',
    updateRequest : '/update',
    botSettings : '/botsettings',
    changeBotSettings : '/changebotsettings'
}

//create local server, listen at port 3001
const PORT = 3000;
app.listen(PORT, ()=>console.log(`Local server started. Listening at port ${PORT}...`));
//push forward public folder, index.html is assumed
app.use(express.static('public'));
app.use(express.json());

console.log('Running CCXT version: '+ccxt.version);

//console.log(ccxt.exchanges);//lists all available exchanges by id
const bybit = new ccxt.bybit({
    'apiKey':process.env.API_KEY0,
    'secret':process.env.API_SECRET0,
    'uid':process.env.uid
});
bybit.setSandboxMode(true);
console.log('Connection with exchange BYBIT has started.');

//---------------------------------------------------
//----------------Variables--------------------------
//---------------------------------------------------

//let openOrders = [];

exchange_information = {
    currentPosition:{
        currentPrice:'???',
        quantity:'???',
        value: '???',
        entryPrice: '???',
        tradeType: '???',
        lastOrderTime: '???',
        margin:'???',
        leverage:'???',
        liquidationPrice:'???',
        unrealisedPNL:'???',
        isolated: '???'
    },
    pastMonthPNL:[],
    currentPositionb:{},
    balance:{
        wallet_balance : '???',
        equity:'???',
        available_balance:'???',
        used_margin:'???',
        order_margin:'???',
        PL:'???',
        TotalPL:'???',
        totalTradesCompleted:0
    },
    exchange:{
        openOrders:0,
        currentPosition:null
    },
    botSettings:{
        commitedCapital:50,//at 40k this is 400USD
        baseorderpercentage:100,//percentage expressed in decimals
        baseSizeOrder:0.5,//commitedCapital*baseorderpecentage
        profitTarget:2,//percentage expressed in decimals
        leverage:1,
        safetyTarget:5,//percentage expressed in decimals
        safetyOrderSizeofCC:10,//percentage expressed in decimals
        safetyOrderMultiplier:1,//with each safety order, how much do you want to increase the size of every new order?
        maxSafetyOrdersPlaced:1,//max number of safety orders that can be open orders at any given time
        maxSafetyOrders:0,
        leverageSetting:'cross' //can be isolated too
    }
};

let debugbot = null;
createBot();

async function createBot(){
    //let botArray = [];
    await getCurrentBalance(); // get the balance first
    debugbot= new Bot('BTCUSD', 'inverse', exchange_information.balance.available_balance, 0.2, 0.02, 20, 0.01, 0.1);
    getInfo().catch(e=>{console.log(e)});
    //botArray += debugbot;
}



let ticks = 0;
const timestarted = Date.now();
let timePast = 0;

//const backEndickerRefreshTime = 1000*30; // 30 seconds
const backEndickerRefreshTime = 1000*60*3; // 3 minutes

//at start of the server - get info and start bot(check for active position)
//getInfo();//move geetInfo to bot creation here above so the getInfo does not crash on a bot that does not yet exist //.then(debugbot.bustAMove(exchange_information, bybit));
intervalID = setInterval(getInfoWrapper, backEndickerRefreshTime);//every x-time I want the bot to analyze its position

//---------------------------------------------------
//----------------Functions--------------------------
//---------------------------------------------------
function getInfoWrapper(){
    getInfo().catch(e=>{
        console.log(e);
    });
}
async function getInfo(){
    let openOrders = []; // this used to be global but saved all the data of old orders which led to 
    exchange_information.pastMonthPNL = []; //reset the array so data doesn't keep stacking infinitely
    console.log(chalk.green('Node Getting Info - getInfo()'));

    //try and get deposit history of past month for BTC
    try{
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        const depositsTemp = await bybit.fetchDeposits('BTC', d, 50);
        depositsTemp.forEach(deposit=>{
            if(deposit.info.type === 'RealisedPNL'){
                const tmp = {'date':deposit.info.exec_time.slice(0,10), 'amount':Number(deposit.info.amount).toFixed(8), 'wallet_balance':Number(deposit.info.wallet_balance).toFixed(8), 'gains':Number(Number(deposit.info.amount)/Number(deposit.info.wallet_balance)).toFixed(8)};
                //console.log(tmp);
                //console.log('added to the PL array');
                exchange_information.pastMonthPNL.push(tmp);
            }
        });
    }catch(e){
        console.log(chalk.red('Node getInfo() - fetchDeposits encountered an error, exiting the function')+e);
        return Promise.reject('getInfo() failed');
    }

    //get current pricing data
    try{
        
        exchange_information.currentPosition.currentPrice = await bybit.fetchTicker(debugbot.pair);//update current price information
        /* bybit.fetchTicker("BTCUSDT") return format:
        {
            symbol: 'BTC/USDT:USDT',
            timestamp: 1651572016013,
            datetime: '2022-05-03T10:00:16.013Z',
            high: 39353.5,
            low: 37951,
            bid: 38456.5,
            bidVolume: undefined,
            ask: 38465,
            askVolume: undefined,
            vwap: 0.000025903145508192,
            open: 38797.5,
            close: 38451.5,
            last: 38451.5,
            previousClose: undefined,
            change: -346,
            percentage: -0.8918,
            average: 38624.5,
            baseVolume: 247541365.12,
            quoteVolume: 6412.1,
            info: {
                symbol: 'BTCUSDT',
                bid_price: '38456.5',
                ask_price: '38465',
                last_price: '38451.50',
                last_tick_direction: 'ZeroPlusTick',
                prev_price_24h: '38797.50',
                price_24h_pcnt: '-0.008918',
                high_price_24h: '39353.50',
                low_price_24h: '37951.00',
                prev_price_1h: '38545.50',
                price_1h_pcnt: '-0.002438',
                mark_price: '38464.12',
                index_price: '38461.03',
                open_interest: '9932.05',
                open_value: '0.00',
                total_turnover: '17437267438.12',
                turnover_24h: '247541365.12',
                total_volume: '8759078.38',
                volume_24h: '6412.1',
                funding_rate: '0.0001',
                predicted_funding_rate: '0.0001',
                next_funding_time: '2022-05-03T16:00:00Z',
                countdown_hour: '6',
                delivery_fee_rate: '',
                predicted_delivery_price: '',
                delivery_time: ''
                }
        }*/

        //get the current balance
        const bTemp = await (await bybit.fetchBalance({"currency":"BTC"})).info.result.BTC;
        exchange_information.balance.wallet_balance = bTemp.wallet_balance;
        exchange_information.balance.equity = bTemp.equity;
        exchange_information.balance.available_balance = bTemp.available_balance;
        exchange_information.balance.used_margin = bTemp.used_margin;
        exchange_information.balance.order_margin = bTemp.order_margin;
        exchange_information.balance.PL = bTemp.realised_pnl;
        
    }catch(e){
        console.log(chalk.red('Node getInfo() - fetchTicker + fetchBalance encountered an error, exiting the function')+e);
        return Promise.reject('getInfo() failed');
        //throw new Error('Node - getInfo() failed.');
        //return Promise.resolve(); 
    }

    //get the current open orders
    try{
        const openOrdersTemp = await bybit.fetchOrders('BTCUSD');
        openOrdersTemp.forEach(openOrder=>{
            //debugbot.logData(`000000000 logging orders from fetch order 000000   ${JSON.stringify(openOrder)} 00000000 ENDENDEND`);
            if(openOrder.info.order_status != 'Filled' && openOrder.info.order_status != 'Cancelled'){// check for filled or cancelled orders, don't want to later on try delete orders that no longer exist
                console.log('Open Order order status = '+openOrder.info.order_status);
                openOrders.push(openOrder);
            }
            /*[
                {
                    info: {
                    user_id: '527100',
                    position_idx: '0',
                    order_status: 'Filled',
                    symbol: 'BTCUSD',
                    side: 'Buy',
                    order_type: 'Market',
                    price: '32876',
                    qty: '638',
                    time_in_force: 'ImmediateOrCancel',
                    order_link_id: '',
                    order_id: 'ab37f918-63c7-4ff2-a71f-df3b777f5430',
                    created_at: '2022-05-11T10:14:33.648Z',
                    updated_at: '2022-05-11T10:14:33.661Z',
                    leaves_qty: '0',
                    leaves_value: '0',
                    cum_exec_qty: '638',
                    cum_exec_value: '0.01997933',
                    cum_exec_fee: '0.00001199',
                    reject_reason: 'EC_NoError',
                    take_profit: '32580.5000',
                    stop_loss: '0.0000',
                    tp_trigger_by: 'LastPrice',
                    sl_trigger_by: 'UNKNOWN'
                    },
                    id: 'ab37f918-63c7-4ff2-a71f-df3b777f5430',
                    clientOrderId: undefined,
                    timestamp: 1652264073648,
                    datetime: '2022-05-11T10:14:33.648Z',
                    lastTradeTimestamp: undefined,
                    symbol: 'BTC/USD:BTC',
                    type: 'market',
                    timeInForce: 'IOC',
                    postOnly: false,
                    side: 'buy',
                    price: 0.000031315564263322,
                    stopPrice: undefined,
                    amount: 638,
                    cost: 0.01997933,
                    average: 0.000031315564263322,
                    filled: 638,
                    remaining: 0,
                    status: 'closed',
                    fee: { cost: 0.00001199, currency: 'BTC' },
                    trades: [],
                    fees: [ [Object] ]
                } */
        });
    }catch(e){
        console.log(chalk.red('Node getInfo() - fetchOrders encountered an error, exiting the function')+e);
        return Promise.reject('getInfo() failed');
        //throw new Error('Node - getInfo() failed.');
        //Promise.resolve(); 
    }

    //get all positions for all pairs
    try{
    const existingPositionsTemp = await bybit.fetchPositions(debugbot.pair, {'type':debugbot.type});//returns all positons in inverse perpetuals (or whatever market you ask for) but every pair is empty size and ID = 0 if no positions are open.
    //existingPositionsTemp? debugbot.logData(`####### this is the position list from getInfo() in node.js ########`) : '';
    existingPositionsTemp.forEach(position=>{
        //console.log(chalk.yellow('here is each position I get from fetchPositions()'+JSON.stringify(position)));
        if(position.data.symbol === debugbot.pair){
            debugbot.checkLeverageAndType(position, bybit);
            fillInInformation(position);
            if(position.data.size>0){
                debugbot.logData(`####### A position was found: qty=${JSON.stringify(position.data.size)} entry_price=${JSON.stringify(position.data.entry_price)} side=${JSON.stringify(position.data.side)} ########`);
                //There is a position found, have bot check what to do with it
                console.log(chalk.blue('NODE: Position found, size='+position.data.size+'entry_price='+position.data.entry_price+' bot needs to figure out what to do.'));
                const tempEmptyArr = [];
                //debugbot.logSafetyOrders(tempEmptyArr, position);
                debugbot.checkTakeProfit(position, bybit);
                debugbot.checkSafetyOrders(position, bybit, exchange_information.currentPosition.currentPrice);
                //debugbot.bustAMove(exchange_information, bybit); - dunno if I'll need this?
            }else if(position.data.size===0){
                //There is no position, have bot place base order
                debugbot.logData('_________________________________________________________');
                debugbot.logData('NODE: No position found, telling bot to place base order.');
                console.log(chalk.cyan('NODE: getInfo() No position found, telling bot to place base order.'));
                let i = 0;
                let ii = 0;
                openOrders.forEach(order=>{
                    console.log('Node - getInfo() - checking open order:');
                    //console.log(order);
                    if(order.info.side === 'Sell' && order.info.leaves_qty > 0){//when no position is active, delete any TP orders still in order book, do this before new orders are placed
                        i++;
                        console.log('Node getInfo Deletion Ticker = '+i+' number of orders in array openOrders = '+openOrders.length);
                        console.log(chalk.red('cancelling order from Node getInfo() - no active position, but I found sell orders'));
                        debugbot.cancelOrder(order.info.order_id, order.info.symbol, bybit);
                    }else if(order.info.side === 'Buy' && order.info.cum_exec_qty === '0'){//if there is no position, but an order(s) was found (unfilled) - delete them all before placing new BO
                        ii++;
                        console.log('Node getInfo Deletion Ticker = '+ii+' number of orders in array openOrders = '+openOrders.length);
                        console.log(chalk.red('cancelling order from Node getInfo() - no active position, but I found buy orders'));
                        debugbot.cancelOrder(order.info.order_id, order.info.symbol, bybit);
                        debugbot.safetyOrderCount=0;//when deleting all orders because no position, reset SO counter so it can place new ones
                    }
                });

                debugbot.placeBaseOrder(bybit);
            }
        }else{
            //console.log('set position to FALSE');
            //exchange_information.exchange.currentPosition = false;
        }
    });
    }catch(e){
        console.log(chalk.red('Node getInfo() - fetchPositions encountered an error, exiting the function')+e);
        return new Promise.reject('getInfo() failed');
        //throw new Error('Node - getInfo() failed.');
        //return Promise.reject(); 
    }
    return Promise.resolve();
    /*return format of fetchPositions
    {
data: {
    id: 0,
    position_idx: 0,
    mode: 0,
    user_id: 527100,
    risk_id: 1,
    symbol: 'BTCUSD',
    side: 'Buy',
    size: 100,
    position_value: '0.00259578',
    entry_price: '38524.06598402',
    is_isolated: false,
    auto_add_margin: 0,
    leverage: '1',
    effective_leverage: '0.01',
    position_margin: '0.00260995',
    liq_price: '200.5',
    bust_price: '200.5',
    occ_closing_fee: '0.00029926',
    occ_funding_fee: '0',
    take_profit: '0',
    stop_loss: '0',
    trailing_stop: '0',
    position_status: 'Normal',
    deleverage_indicator: 3,
    oc_calc_data: '{"blq":100,"blv":"0.00333333","slq":0,"bmp":30000.03,"smp":0,"fq":-100,"fc":-0.00333933,"bv2c":1.0018,"sv2c":1.0006}',
    order_margin: '0.00333933',
    wallet_balance: '0.49999844',
    realised_pnl: '-0.00000156',
    unrealised_pnl: -0.00001105,
    cum_realised_pnl: '-0.00000156',
    cross_seq: 5014806064,
    position_seq: 0,
    created_at: '2022-05-02T13:48:43.167473544Z',
    updated_at: '2022-05-03T15:29:13.262791845Z',
    tp_sl_mode: 'Full'
},
is_valid: true
}*/ 
    //response.end();
}
function fillInInformation(info){
    exchange_information.currentPosition.quantity = info.data.size;
    exchange_information.currentPosition.value = info.data.position_value;
    exchange_information.currentPosition.entryPrice = info.data.entry_price;
    exchange_information.currentPosition.leverage = info.data.leverage;
    exchange_information.currentPosition.liquidationPrice = info.data.liq_price;
    exchange_information.currentPosition.unrealisedPNL = info.data.unrealised_pnl;
    exchange_information.currentPosition.margin = info.data.position_margin;
    exchange_information.currentPosition.lastOrderTime = info.data.created_at;
    exchange_information.currentPosition.tradeType = info.data.side;
    exchange_information.currentPosition.isolated = info.data.is_isolated;

    exchange_information.balance.order_margin = info.data.order_margin;
    exchange_information.balance.available_balance = info.data.wallet_balance;
}

 async function getNewBTCprice(res){
    try{
        return await bybit.fetchTicker(debugbot.pair).catch(e=>console.log(e));
    }catch(e){
        console.log(chalk.red('Node getNewBTCprice() - fetchTicker encountered an error, exiting the function')+e);
        //throw new Error('Node - getNewBTCprice() failed.');
        //res.end();
        return Promise.reject('Node getNewBTCprice() failed ');
    }
    /* bybit.fetchTicker("BTCUSDT") return format:
    {
        symbol: 'BTC/USDT:USDT',
        timestamp: 1651572016013,
        datetime: '2022-05-03T10:00:16.013Z',
        high: 39353.5,
        low: 37951,
        bid: 38456.5,
        bidVolume: undefined,
        ask: 38465,
        askVolume: undefined,
        vwap: 0.000025903145508192,
        open: 38797.5,
        close: 38451.5,
        last: 38451.5,
        previousClose: undefined,
        change: -346,
        percentage: -0.8918,
        average: 38624.5,
        baseVolume: 247541365.12,
        quoteVolume: 6412.1,
        info: {
            symbol: 'BTCUSDT',
            bid_price: '38456.5',
            ask_price: '38465',
            last_price: '38451.50',
            last_tick_direction: 'ZeroPlusTick',
            prev_price_24h: '38797.50',
            price_24h_pcnt: '-0.008918',
            high_price_24h: '39353.50',
            low_price_24h: '37951.00',
            prev_price_1h: '38545.50',
            price_1h_pcnt: '-0.002438',
            mark_price: '38464.12',
            index_price: '38461.03',
            open_interest: '9932.05',
            open_value: '0.00',
            total_turnover: '17437267438.12',
            turnover_24h: '247541365.12',
            total_volume: '8759078.38',
            volume_24h: '6412.1',
            funding_rate: '0.0001',
            predicted_funding_rate: '0.0001',
            next_funding_time: '2022-05-03T16:00:00Z',
            countdown_hour: '6',
            delivery_fee_rate: '',
            predicted_delivery_price: '',
            delivery_time: ''
            }
    }*/
}

async function getCurrentBalance(){
    try{
        const bTemp = await (await bybit.fetchBalance({"currency":"BTC"})).info.result.BTC;
        exchange_information.balance.equity = bTemp.equity;
        exchange_information.balance.available_balance = bTemp.available_balance;
        exchange_information.balance.used_margin = bTemp.used_margin;
        exchange_information.balance.order_margin = bTemp.order_margin;
        exchange_information.balance.TotalPL = bTemp.cum_realised_pnl;
        exchange_information.balance.PL = bTemp.realised_pnl;
    }catch(e){
        console.log(chalk.red('Node getCurrentBalance() - fetchBalance encountered an error, exiting the function')+e);
        //throw new Error('Node - getCurrentBalance() failed.');
        return Promise.reject('getCurrentBalance() failed');
    }
}

async function getCurrentPosition(){
    //console.log(chalk.green('getCurrentPosition()'));
    try{
        const pTemp = await bybit.fetchPositions(debugbot.pair, {'type':debugbot.type});
        /*
                {
                data: {
                    id: 0,
                    position_idx: 0,
                    mode: 0,
                    user_id: 527100,
                    risk_id: 1,
                    symbol: 'BTCUSD',
                    side: 'Buy',
                    size: 607,
                    position_value: '0.01997802',
                    entry_price: '30383.39134709',
                    is_isolated: false,
                    auto_add_margin: 1,
                    leverage: '10',
                    effective_leverage: '0.05',
                    position_margin: '0.00201099',
                    liq_price: '1183',
                    bust_price: '1183',
                    occ_closing_fee: '0.00030787',
                    occ_funding_fee: '0',
                    take_profit: '0',
                    stop_loss: '0',
                    trailing_stop: '0',
                    position_status: 'Normal',
                    deleverage_indicator: 3,
                    oc_calc_data: '{"blq":0,"slq":607,"slv":"0.01958633","bmp":0,"smp":30991.0024,"bv2c":0.10126,"sv2c":0.10114}',
                    order_margin: '0',
                    wallet_balance: '0.49363415',
                    realised_pnl: '-0.00001218',
                    unrealised_pnl: 0.00012472,
                    cum_realised_pnl: '-0.00636585',
                    cross_seq: 5063693295,
                    position_seq: 0,
                    created_at: '2022-05-02T13:48:43.167473544Z',
                    updated_at: '2022-05-17T08:00:00.038234853Z',
                    tp_sl_mode: 'Full'
                },
                is_valid: true
                }
                */
        pTemp.forEach( p=>{
            if(p.data.symbol === debugbot.pair){
                //console.log(p);
                exchange_information.currentPositionb = p;
                //update bot data if settings were changed behind its back
                //debugbot.leverage = p.data.leverage;
            }
        });
       // console.log(pTemp);

       // return Promise.resolve();
    }catch(e){
        console.log(chalk.red('Node getCurrentPosition() - fetchPositions encountered an error, exiting the function ')+e);
        //throw new Error('Node - getCurrentPosition() failed.');
        return Promise.reject('Node getCurrentPosition() failed ');
    }
}

//---------------------------------------------------
//---------------------GETS--------------------------
//---------------------------------------------------

//updateRequest GET
app.get(`${nodeURLs.baseURL+nodeURLs.updateRequest}`, (request, response) =>{

    getCurrentPosition().catch(e=>{
        console.log(e);
        return response.end;
    });
    generateUpdate(response).catch(e=>{
        console.log(e);
        return response.end;
    });
})
  
    /* try{
        getCurrentPosition().catch(e=>{
            console.log(e);
            return response.end;
        });
    }catch(e){
        console.log(chalk.red('Node app.get() - getCurrentPosition() encountered an error, exiting the function')+e);
        this.logData('Bot - app.get update request failed '+e);
        //throw new Error(`Node - app.get() - update failed. ${nodeURLs.baseURL+nodeURLs.updateRequest}`);
        return response.end;
    }
    try{
        generateUpdate(response).catch(e=>{
            console.log(e);
            return response.end;
        });
    }catch(e){
        console.log(chalk.red('Node app.get() - generateUpdate() encountered an error, exiting the function')+e);
        this.logData('Bot - app.get update request failed '+e);
        //throw new Error(`Node - app.get() - update failed. ${nodeURLs.baseURL+nodeURLs.updateRequest}`);
        return response.end;
    }
})*/

app.get(`${nodeURLs.baseURL+nodeURLs.botSettings}`, (request, response) =>{
    console.log(chalk.blue('SERVER: I have seen your request for the bot settings.'));
    const a = exchange_information.botSettings;
    console.log(a);
    return response.json(a);
})

//---------------------------------------------------
//---------------------POSTS-------------------------
//---------------------------------------------------

/*app.post(`${nodeURLs.baseURL+nodeURLs.changeBotSettings}`, (request, response) =>{
    console.log(chalk.red('SERVER: I have seen your request for bot settings change.wrgrtytyt'));
    //let bs = request.body.data.substring(30);//cut off first request
    let settingsOBJ = JSON.parse(request.body.data);//turn string back into object
    console.log('SERVER'+settingsOBJ);
    updateBotSettingsServerSide(settingsOBJ);
    return Promise.resolve();
})*/

app.post(`${nodeURLs.baseURL+nodeURLs.changeBotSettings}`, (request, response)=>{
    //console.log(chalk.green('im taking it'));
    //let bs = req.body.data.substring(30);//cut off first request
    //console.log(request.body);
    //const settingsOBJ = JSON.parse(request.body.data);//turn string back into object
    updateBotSettingsServerSide(request.body);
    return response.json('success');
})

//---------------------------------------------------
//---------------------DUNNO YET--------------------------
//---------------------------------------------------

/*app.post('/api', (request, response) =>{
    console.log("\x1b[43m", 'REQUEST: '+request.body.data); //log the incoming request

    if(request.body.data === 'Requesting current position'){
         //update the latest BTC price
        //getNewBTCprice(response);
        //response.end();
      
    /*}else if(request.body.data.includes('Requesting change settings bot')){
        console.log('SERVER: I have seen your request for bot settings change.');
        let bs = request.body.data.substring(30);//cut off first request
        let settingsOBJ = JSON.parse(bs);//turn string back into object
        updateBotSettingsServerSide(settingsOBJ);
        return Promise.resolve();
        //response.end();
        */
    /*}else if(request.body.data === ('Requesting bot settings')){
        console.log('SERVER: I have seen your request for the bot settings.');
        //return response.json(exchange_information.botSettings);
        //return Promise.resolve(exchange_information.botSettings);
        return exchange_information.botSettings;
        //response.end();
        

    }else if(request.body.data === 'Requesting initiate bot'){
        console.log('SERVER: I have seen your request for changing the bot settings.');
       //initiateBotServerSide(request, response);
        //response.end();

    //for now I'm goin to be working with just one request that pushes back up to date information (price, orders, balance,...)
    }else if(request.body.data === 'Requesting update'){
        console.log('SERVER: I have seen your request for an update');
        generateUpdate(response);
        //do a function, give it the response, and exit with the response via that function

    }else if(request.body.data.includes('debug')){
        console.log('SERVER: debugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebugdebug');
        
        debugbot.debug(request,response, exchange_information, bybit);
        //bybit.createMarketOrder('BTCUSD', 'buy', bos);//test for bot info
        //do a function, give it the response, and exit with the response via that function

    }else{
        console.log('I did not recognize your request');
        response.end();
        return Promise.resolve();
    }
})*/

async function generateUpdate(res){
    //console.log(chalk.green('generateUpdate()'));
    try{
        exchange_information.currentPosition.currentPrice = await getNewBTCprice(res).catch(e=>console.log(e));
        await getCurrentBalance().catch(e=>console.log(e));
       //return Promise.resolve();
    }catch(e){
        console.log(chalk.red('Node generateUpdate() - getNewBTCprice encountered an error, exiting the function')+e);
        //throw Error('Node - generateUpdate() failed.');
        return Promise.reject('generateUpdate() failed');
    }

    updateTimeAndTicks();

    const sendOff = exchange_information;//create copy of the object and send that off, security reasons? am too newbie
    return res.json(sendOff);
}  

function updateTimeAndTicks(){
    currentTime = Date.now();
    const now = new Date(currentTime);

    timePast = currentTime-timestarted;
    ticks++;
    
    const d = new Date(timePast);
    const days = d.getDay()-4;//for some reason, new data starts at 4 days???
    const h = d.getHours()-1;
    const m = "0"+d.getMinutes();
    const s = "0"+d.getSeconds();

    const formattedTimePast = days + ' day(s) '+ h + ":" + m.substring(m.length-2) + ":" + s.substring(s.length -2);

    console.log(chalk.gray(now.toUTCString() +' uptime: '+formattedTimePast+" - Ticks: "+ticks));
    debugbot.logData(`---------- uptime: '${formattedTimePast} - Ticks: "${ticks} ----------`);
}

function initiateBotServerSide(req, res){
    //un-JSON-stringify request - gives bot name and setting
    //const bot name = name;
    //const settings = botSettings;
    //botArray += new Bot(name, settings);

    //const sendOff = exchange_information;//create copy of the object and send that off, security reasons? am too newbie
    //res.json(sendOff);
}
function updateBotSettingsServerSide(settings){
    debugbot.changeSettings(settings, bybit);
    //console.log('these are the bot settings');
    //console.log(settings);

    //enter those settings into a local object, ... perhaps the bot should have this object and just pass it? or is that unsafe?
    exchange_information.botSettings.commitedCapital = settings.committed_capital/100;
    exchange_information.botSettings.baseorderpercentage = settings.base_order_percentage/100;
    exchange_information.botSettings.baseSizeOrder = settings.base_order_percentage*settings.commited_capital;
    exchange_information.botSettings.profitTarget = settings.profit_target/100;
    exchange_information.botSettings.leverage = settings.leverage;
    exchange_information.botSettings.safetyTarget = settings.safety_target/100;
    exchange_information.botSettings.safetyOrderSizeofCC = settings.safety_order_percentage/100;
    //console.log(chalk.blue('SERVER: changing bot settings succesful'));

    //const sendOff = exchange_information;//create copy of the object and send that off, security reasons? am too newbie
    //res.json(sendOff);
}