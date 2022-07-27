const chalk = require('chalk');//chalk allows for colors in console
const { info } = require('console');
const { json } = require('express/lib/response');
const fs = require('fs');//fs = filesystem
var os = require("os");
const logFile = './log.txt';
const dataFile = ('./dataFile.json');

module.exports = class Bot{
    constructor(pair, type, cc, bos, pt, lev, st, soscc){//}, SafetyOrderMultiplier){

        console.log('Creating new Elf.....');

        //safety trigger if number are not decimals
        if(bos>1 || pt>1 || st>1 || soscc>1){
            throw error('one of the bots initial parameters is larger than 1');
        }
        this.pair = pair; //symbol for pair
        this.type = type;
        this.commitedCapital = cc; //total capital you want the bot to work with
        this.baseOrderSize = bos;//percentage expressed in decimals. percentage of commited capital for initial orders
        this.baseOrderQty = 0; 
        this.profitTarget = pt; //percentage expressed in decimals. at which % does bot take profit?
            if(this.profitTarget <= 0.00012){//when PT is less than bybit's taker fees, set TP to double fees. So you make at least as much as the exchange does.
                this.profitTarget = 0.0024//if fee is 0,06%, you need 0,012% because the fee applies to open AND close of a position
            }
        this.leverage = lev;
        this.levType = 'cross'; //for now, standard on cross, is safer in big unexpectedcrashes, can also use margin that is in account but not part of bots' commited capital
        this.safetyTarget = st; //percentage expressed in decimals, when does bot place another order to bring down average entry price
        this.safetyOrderSizeofCC = soscc; //percentage expressed in decimals, 
        this.safetyOrderMultiplier = 2; //with each safety order, how much do you want to increase the size of every new order?
        this.maxSafetyOrdersPlaced = 3; //max number of safety orders that can be open orders at any given time
        this.liquidationLimit = 15000;
        this.maxDrop = 0.2;//percentage for calc liquidation price

        //placed orders
        this.baseOrderRef = '';
        this.contractsFilledTemp = 0;

        this.dataFiledata={
            safetyOrderCounter:0,
        };
        this.safetyOrderConfArr = [];
        
        console.log(chalk.cyan('A new elf was just created.'));
        console.log(chalk.yellow('Elf Properties: '+ 'pair: '+ pair+ ' comm capital BTC: '+ cc+ ' base order size %: '+ bos+ ' profit target %: '+ pt+ ' leverage: '+ lev+ ' safety order %: '+ st+ ' safety order size %: '+ soscc));


        //NEED TO DO: Check leverage and type (cross or iso) before setting it
        // if it doesnt match what you need, set it and forget it.
        //this check might be a cool thing if you want to adjust in the future.

    //end of constructor
    }

async checkTakeProfit(position, exchange){
    console.log(chalk.green('Node - Checking Take Profit() Heres the position I got '+JSON.stringify(position)));
    
    if(!position || position==='' || position===null || position.data.size<=0){
        console.log('Error, checkTakeProfit() got an empty position.');
        return;
    }else if(position.data.side === 'Sell'){
        const confirmation = await exchange.createMarketOrder(this.pair, 'buy', position.data.size,{'type':this.type})
        confirmation ? console.log(chalk.bgRed('Node-checkTakeProfit()  Found a short position! -- immediately placed a market order')) : '';
        return;
    }

    let takeprofittarget = this.calcTakeProfitPrice(position);

    try{
        //fetchOrders returns a mix of old n new n filled orders - filter for the new, BTCpair, sell side and unfilled ones
        const openOrdersTemp = await exchange.fetchOrders(this.pair);
        let sellOrderArr = [];
        openOrdersTemp.forEach(openOrder=>{
            
            if(openOrder.info.side === 'Sell' && openOrder.status === 'open' && openOrder.info.symbol === this.pair){
                sellOrderArr.push(openOrder);
                console.log(chalk.yellow('Found an open TP/sell order, checking it now'));
                console.log(chalk.yellow(JSON.stringify(openOrder)));
            }
        });

        this.logData('Sell Order Counter = '+sellOrderArr.length);
        sellOrderArr.forEach(order=>{
            this.logData('Logging Sell Order Data.....');
            this.logData(order);
        });
        console.log('Sell Order Counter = '+sellOrderArr.length);

        //double check if the position you got, is still legit
        //re-fetchPosition, filter, and turn on a bool that tells you a position is legitimate and needs a sell order
        //this is because we had issues with 'ghost data' - the exchange gave returned a position that might at this point no longer exist
        //causing this function to open a short position, which we want to prevent with this updated position check
        let boolPositionStillPresentSafetyCheck = false;
        const positionsTemp = await exchange.fetchPositions(this.pair, {'type':this.type});
        positionsTemp.forEach(pos=>{
            if(pos.data.symbol === this.pair){console.log(chalk.cyan('Fetched Positions again, heres the new one='+JSON.stringify(pos)));}
            if(pos.data.symbol === this.pair && pos.data.status != 'Filled' && pos.data.size > 0){
                //console.log(chalk.cyan('Fetched Positions again, heres the new one='+JSON.stringify(pos)))
                boolPositionStillPresentSafetyCheck = true;
            }
        });

        //if there are no sell orders in the books, but position is present -> create sell order
        if(sellOrderArr.length === 0 && boolPositionStillPresentSafetyCheck === true){
            console.log(chalk.yellow('checkTakeProfit() could not find a sell/TP order - there is none. Creating one now'));
            this.placeTakeProfitOrder(position, exchange);
            return;//exit if no TP was found, you create new one

        //when there is more than 1 sell order found - wipe clean, delete all. Next turn will place new sell order - starting anew brings least risk
        }else if(sellOrderArr.length > 1){
            sellOrderArr.forEach(async(sellOrder, index, arr)=>{
                console.log(chalk.red('Node - checkTakeProfit() - Found more than 1 sell order, deleting all now.'));
                console.log(`Sell order data size = ${JSON.stringify(sellOrder.info.qty)} entry_price=${JSON.stringify(sellOrder.info.price)} side=${sellOrder.info.side}`);
                this.logData(`Sell order data = ${JSON.stringify(sellOrder)}`);
                try{
                    await exchange.cancelOrder(sellOrder.id, sellOrder.symbol)
                        .then(arr.splice(index, 1));//take the order out of the array
                }catch(e){
                    console.log('error caught in checkTakeProfit() when trying to cancel order.');
                }
            });
            return;
        }
           
        //sellOrder data
        /*{"info":{"user_id":"527100","position_idx":"0","order_status":"New","symbol":"BTCUSD","side":"Sell","order_type":"Limit","price":"31673.5","qty":"566","time_in_force":"GoodTillCancel","order_link_id":"","order_id":"59a46c35-c309-4032-9cf5-909fd6f12a71","created_at":"2022-06-06T10:44:34.604Z","updated_at":"2022-06-06T10:44:37.535Z","leaves_qty":"566","leaves_value":"0.01786982","cum_exec_qty":"0","cum_exec_value":"0","cum_exec_fee":"0","reject_reason":"EC_NoError","take_profit":"0.0000","stop_loss":"0.0000","tp_trigger_by":"UNKNOWN","sl_trigger_by":"UNKNOWN"},"id":"59a46c35-c309-4032-9cf5-909fd6f12a71","timestamp":1654512274604,"datetime":"2022-06-06T10:44:34.604Z","symbol":"BTC/USD:BTC","type":"limit","timeInForce":"GTC","postOnly":false,"side":"sell","price":31673.5,"amount":566,"cost":0,"filled":0,"remaining":566,"status":"open","fee":{"cost":0,"currency":"BTC"},"trades":[],"fees":[{"cost":0,"currency":"BTC"}]}*/

        //put the single sellOrder from the array into its own object
        const sellOrder = sellOrderArr[0];
        //at this point there is a sell order, but not more than one - check if it still fits the current position which might have 
        //no need for extra check on sell orders without a position, node.js already checks for it in getInfo()
        if(sellOrder.info.price != takeprofittarget || sellOrder.info.leaves_qty != position.data.size){//|| sellOrder.info.qty != position.data.size){ //taken size out of it, contracts are sold one by one, but all at once. size check might delete sell order mid sale, causing profit to not be taken
            if(sellOrder.filled === 0 || this.contractsFilledTemp === sellOrder.filled){//only replace existing sell order when it has not yet been filled or is midway filling but pauzed - still a risk it might start filling when you replace it, leading to an excess short to occur - best to beat this by keeping track of the current position?  
                console.log(chalk.red('deleting one sell order, sell price or order size didnt match profit target or position size'));
                console.log(chalk.yellow('TP im looking for: '+takeprofittarget+' TP I found: '+sellOrder.info.price));
                console.log(chalk.yellow('Size im looking for: '+position.data.size+' Size I found: '+sellOrder.info.qty));
                try{
                    const response = await exchange.cancelOrder(sellOrder.id, sellOrder.symbol);
        
                    response ? console.log(chalk.red(`Deleted one order. sell order ID:${sellOrder.id} deleted order id:${response.info.order_id}`)) : '';
                    response ? this.logData(`Deleted one order. sell order ID:${sellOrder.id} deleted order id:${response.info.order_id}`) : '';
                    response ? this.placeTakeProfitOrder(position, exchange) : '';

                }catch(e){console.log('error caught in checkTakeProfit() when trying to cancel order and placeTPorder '+e)}
                arr.splice(index, 1);
                this.contractsFilledTemp = 0;
            }else{
                this.contractsFilledTemp = sellOrder.filled;//store filled contracts amount, if its the same next time, the order got left hanging and its okay to reset it
                console.log('Bot - CheckTakeProfit() -- I see a TP that does not match, but it was partially filled, saving data to replace order later on.')
            }
        }else{
            console.log(chalk.yellow('Checked TP/sell order, seems fine, bot rests.'));
            console.log(chalk.yellow('TP I was looking for: '+takeprofittarget+' TP I found: '+sellOrder.info.price));
            console.log(chalk.yellow('Size I was looking for: '+position.data.size+' Size I found: '+sellOrder.info.leaves_qty));
        }
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: checkTakeProfit() failed. ${e}`);
        console.log(chalk.red('ERROR BOT: checkTakeProfit() failed. ')+e);
    }
}

async placeTakeProfitOrder(position, exchange){
    console.log(chalk.yellow('Bot - placeTakeProfitOrder() activated'));
    let currentPrice;
    try{
        currentPrice = await exchange.fetchTicker(this.pair);
        currentPrice ? console.log('placeTakeProfitOrder fetchTicker = '+JSON.stringify(currentPrice)) : '';
    }catch(e){
        console.log(chalk.bgRed('Bot - placeTP() failed to check currentprice'));
    }
    if(position.data.side === 'Sell'){//is position short? CANCEL TP, it will only increase the short position and cascade into a big loss (when in up market)
        console.log(chalk.red('POSITION IS SHORT! DO NOT PLACE ANOTHER SHORT POSITION!!!!'));
        this.logData('!!!!!!!!!! Placing TP order, found current position to be short, ABORT ABORT !!!!!!!!!!');
        try{
            exchange.createMarketOrder(this.pair, 'Buy', position.data.size, {'type':this.type});
        }catch(e){
            console.log(chalk.bgRed('Bot - placeTP() failed to stop open short'));
        }
    }else{
        let takeprofittarget = this.calcTakeProfitPrice(position);
        if(takeprofittarget <= currentPrice.ask){//when the price has risen higher inbetween updates 
            takeprofittarget = currentPrice.ask*1.001;//set TP at 0,1% above asking price
        }
        let entryprice = Number(position.data.entry_price).toFixed(0);
        console.log(chalk.yellow('Creating sell order for TP of current position. TP='+takeprofittarget+' profit target % ='+this.profitTarget+' entry price='+entryprice+' size='+position.data.size));
        try{
            const lal = await exchange.createLimitOrder(position.data.symbol, 'Sell', position.data.size, takeprofittarget);
            lal ? this.logData('_________________________________________________________'):'';
            lal ? this.logData(`TakeProfit order made: TP=${takeprofittarget} profit target=${this.profitTarget} entry price=${entryprice} size=${position.data.size}`) : '';
            lal ? this.logData(`Current position size=${position.data.size} entry price=${position.data.entry_price} side=${position.data.side}`) : '';
        }catch(e){
            this.logData(`!!!!!!!!!!  ERROR BOT: placeTakeProfitOrder() failed. ${e}`);
            console.log(chalk.red('ERROR BOT: placeTakeProfitOrder() failed. ')+e);
        }
    }
}

logData(data){
    let newData = this.getCurrentMoment();
    newData +=' ';
    newData += data;
    fs.appendFile(logFile, JSON.stringify(newData, null,2) + '\r\n', ()=>{});//+ os.EOL
}

getCurrentMoment(){
    const currentTime = Date.now();
    const now = new Date(currentTime);
    return now.toUTCString();
}

calcTakeProfitPrice(position){
    let fsf = Number(position.data.entry_price).toFixed(0);
    let pft = Number(this.profitTarget)/this.leverage;
    pft += 1;
    pft = fsf*pft
    
    return pft.toFixed(0);
}

async checkSafetyOrders(position, exchange, currentPrice){//only gets called from Node - when there is a position found

    try{
        //fetch orders and filter for open SOs
        const openOrdersTemp = await exchange.fetchOrders(this.pair);

        let safetyOrderCounter = 0;
        let safetyOrderArr = [];

        openOrdersTemp.forEach(async(openOrder)=>{//collects all existing SOs for current pair
            if(openOrder.info.side === 'Buy' && openOrder.status === 'open'){
                ++safetyOrderCounter;
                safetyOrderArr.push(openOrder);
                console.log(chalk.yellow('Found an open buy order'));
            }
        });

        //if there is no position, cancel all orders!!
        if(!position){
            //close all SO
            safetyOrderArr.forEach(SO=>{
                console.log(chalk.red('Bot - CheckSafetyOrder() - Deleting one safety order'));
                try{
                    this.cancelOrder(SO.id, SO.symbol, exchange);    
                }catch(e){console.log('error caught in checkSafetyOrders() when trying to cancel order.')}
            });
            return; //we done here, no need to check other stuff
        }

        if(position.data.size <= this.calcPositionSize(currentPrice.ask)*1.2){//add 20% for fluctuations in price/posSize calculations & difference in available balance
            //later on this should be based on the safetyOrder drop % size so it can never include pos+safety if for example safety is only 10% of BO size
            this.placeSafetyOrders(position, exchange);
            return; //we done here, no need to check other stuff
        }
        
        if(safetyOrderArr.length > this.maxSafetyOrdersPlaced){
            //too many SOs
            for(;safetyOrderCounter > this.maxSafetyOrdersPlaced; --safetyOrderCounter){
                console.log(chalk.red('deleting one order, found more than the max allowed'));
                this.logData(`deleting one order, found more than the max allowed Max = ${this.maxSafetyOrdersPlaced} SO counter = ${safetyOrderCounter}`);
                try{
                    const response = await exchange.cancelOrder(safetyOrderArr[safetyOrderCounter-1].id, safetyOrderArr[safetyOrderCounter-1].symbol);
                    response ? console.log(response) : '';
                    response ? this.safetyOrderCount-- : '';
                }catch(e){console.log('error caught in checkSafetyOrders() when trying to cancel order.')}
            }
        }else{
            console.log(chalk.yellow('As far as I can see, safety orders seem okay.'));
        }
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: checkSafetyOrders() failed. ${e}`);
        console.log(chalk.red('ERROR BOT: checkSafetyOrders() failed. ')+e);
    }
}

async cancelOrder(orderId, orderSymbol, exchange){
    console.log('attempting to delete one order');
    console.log('ID '+orderId);
    console.log('symbol '+orderSymbol);
    try{
        const response = await exchange.cancelOrder(orderId, orderSymbol);
        response ? console.log(chalk.red('Order deleted.')) : '';
        response ? this.logData(`Order deleted ${JSON.stringify(response)}`) : '';
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: cancelOrder() failed. ${e}`);
        console.log(chalk.red('ERROR BOT: cancelOrder() failed. ')+e.ret_msg);
    }
}

async placeSafetyOrders(position, exchange){// only gets called from checkSafetyOrders()
    let entryPriceTemp = await this.volatilityCalculator(exchange);
    entryPriceTemp = entryPriceTemp.EMAprice;
    entryPriceTemp = Number(entryPriceTemp);
    position === '' ? console.log(chalk.bgCyan('DING, when placing SO - position turned up empty')) : entryPriceTemp=position.data.entry_price;
    
    //once base order has been set, determine safety orders (size and price points) and place them
    //PLACING INITIAL SAFETY ORDERS
    try{
        const buyOrdersTempArr = await this.getCurrentOrders(exchange, 'Buy');
        //const BTCbalanceTemp = await (await exchange.fetchBalance({"currency":"BTC"})).info.result.BTC;

        if(buyOrdersTempArr.length > 0){ //since this only gets called on the creation of a baseorder, delete older SO's
            buyOrdersTempArr.forEach(safetyOrder=>{
                this.logData(`Deleting Safety order for ${safetyOrder.info.qty} at ${safetyOrder.info.price}`);
                console.log(chalk.red(`Deleting Safety order for ${safetyOrder.info.qty} at ${safetyOrder.info.price}`));
                try{
                    exchange.cancelOrder(safetyOrder.id, safetyOrder.symbol);
                }catch(e){console.log('error caught in placeSafetyOrders() when trying to cancel order.')}
            });
        }
        let currentPrice;
        try{ currentPrice = await exchange.fetchTicker(this.pair); }catch(e){console.log('Bot - placeSafetyOrders() -- failed to fetchTicker()')}
        const positionSize = this.calcPositionSize(currentPrice.ask);

        //let scalerSize = 1;
        //let scalerPrice = 4;
        //let y = 0
        let previousPriceTemp = entryPriceTemp;
            for(let i = 1; i<= this.maxSafetyOrdersPlaced; ++i){
                i === 3 ? i = 4 : '';//replace 3 by 4 so third SO becomes double of supposed position
                let soqty = positionSize*i;

                //this.safetyTarget <= 0.005 ? this.safetyTarget = 0.005 : '';//dont't set safeties too close to 
                this.safetyTarget = 0.01;
                soqty = Math.floor(soqty);

                //let soprice = currentPrice.ask*(1-(this.safetyTarget*i));//calculate price of order
                //let soprice = entryPriceTemp*(1-(this.safetyTarget*i));
                //let soprice = entryPriceTemp*(1-((this.safetyTarget*i)+(this.safetyTarget*y*scalerPrice)));
                let soprice = entryPriceTemp*(1-((this.safetyTarget*i))); // in order to get 1% 2% and 4% SO targets, just use the i interval that skips 3
                soprice > currentPrice.ask ? soprice = currentPrice.ask*(1-this.safetyTarget): '';//if (first) safety lands above askingprice, avoid a taker order and do ask minus safetytarget(which is volAdjustment)
                console.log('entryprice reduction='+(1-((this.safetyTarget*i))));
               
                console.log('making safety order, entryPriceTemp='+entryPriceTemp+' safetytarget='+this.safetyTarget+' i='+i);// +'y='+y);
                console.log('difference with last SO='+Number(1-(soprice/previousPriceTemp)));
                previousPriceTemp = soprice;
                //y++;


                if(soqty < 10){ throw new Error('SAFETY ORDER QUANTITY IS BELOW 10! Youre probably out of funds.')}
                let confirmation = await exchange.createLimitOrder(this.pair, 'buy', soqty, soprice, {'type':this.type});
                //confirmation ? console.log(JSON.stringify(confirmation)) : '';
                confirmation ? this.safetyOrderConfArr.push(confirmation) : '';
                confirmation ? console.log(chalk.bgGreen('BOT: safety order placed for '+soqty+' at '+soprice.toLocaleString(2)+' USD')): null;
                confirmation ? this.logData(`Safety order made: QTY=${soqty} price=${soprice.toLocaleString(2)} liquidation price=${this.liquidationLimit}`):'';
            }
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: placeSafetyOrders() failed. ${e}`);
        console.log(chalk.red(`BOT ERROR: placeSafetyOrders() failed.`+e));
    }
}

async editOpenOrder(openOrder, exchange, takeprofittarget){
    try{
        return await exchange.editOrder(openOrder.id, openOrder.symbol ,openOrder.type, openOrder.side, openOrder.info.qty, takeprofittarget);
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: editOpenOrder() failed. ${e}`);
        console.log(chalk.red(`BOT ERROR: editOpenOrder() failed.`+e)); 
    }
}

async getCurrentOrders(exchange, side){
    try{
        const openOrdersTemp = await exchange.fetchOrders(this.pair);
        let OrderCounter = 0;
        let OrderArr = [];
        openOrdersTemp.forEach(async(openOrder)=>{
            
            if(openOrder.status === 'open' && openOrder.info.side === side){
                ++OrderCounter;
                OrderArr.push(openOrder);
            }
        });
        return OrderArr;
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: getCurrentOrders() failed. ${e}`);
        console.log(chalk.red(`BOT ERROR: getCurrentOrders() failed.`+e)); 
    }
}

async placeBaseOrder(exchange){
    let baseOrderPlaceHolder = ''//for placesafetyorders at bottom
    let currentPriceTemp = '';

    try{
        currentPriceTemp = await exchange.fetchTicker(this.pair);
        this.commitedCapital = await this.getBalanceBTC(exchange);//reset CC to the amount of BTC available in account

        console.log('currentprice='+currentPriceTemp.ask);
        console.log('leverage='+this.leverage);
        this.liquidationLimit = currentPriceTemp.ask*(1-this.maxDrop);
        console.log('liquidation limit='+this.liquidationLimit);

        this.baseOrderQty = this.calcPositionSize(currentPriceTemp.ask);

        this.baseOrderQty = Math.floor(this.baseOrderQty); // dont pass a decimal, round down
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: placeBaseOrder() part 1 failed. ${e}`);
        console.log(chalk.red('BOT ERROR: placeBaseOrder() part 1 failed. '+e));
    }

    //actually place the order
    try{
        const volatileobject = await this.volatilityCalculator(exchange);

        let pricePoint = null;
        const volUSD = (parseFloat(currentPriceTemp.info.ask_price)*parseFloat(volatileobject.volAdjustment));//calc the amount to lower from askprice, based on volCalc
        const askPrice = parseFloat(currentPriceTemp.info.ask_price);
        const askPriceVolAdj = askPrice+volUSD;

        console.log('VolUSD='+volUSD);
        console.log('askPrice='+askPrice);
        console.log('askPriceVolAdj='+askPriceVolAdj);
        console.log('volatileobject.EMAprice='+volatileobject.EMAprice);
        console.log('volatileobject.volAdjustedEMAprice='+volatileobject.volAdjustedEMAprice);
        
        /*if(askPrice > volatileobject.EMAprice){//volAdjAskPrice is below EMA, but normal ask price is above it -> volAdjEMA
            console.log('ask price is above EMA - placing order at EMA');
            pricePoint = parseFloat(volatileobject.EMAprice);
            pricePoint = Math.floor(pricePoint);//round down
            this.logData(chalk.blue(`Bot - placeBaseOrder - Placing base order with the ask price ${askPrice} - placed pricepoint = ${pricePoint}`));
            this.logData(`Placing base order using the EMA ${pricePoint} vol adj = ${volUSD}`);
        }else if(askPrice > volatileobject.volAdjustedEMAprice){//ask price is between EMA and VolEMA - set order price volEMA
           console.log('ask price is below EMA but above VolEMA - placing order at volEMA');
            pricePoint = parseFloat(volatileobject.volAdjustedEMAprice);
            pricePoint = Math.floor(pricePoint);//round down
            this.logData(chalk.blue(`Bot - placeBaseOrder - Placing base order with the ask price ${askPrice} - placed pricepoint = ${pricePoint}`));
            this.logData(`Placing base order using the market price minus the vol ${pricePoint} vol adj = ${volUSD}`);
        }else if(askPrice <= volatileobject.volAdjustedEMAprice){
            console.log('ask price is below volAjEMA - doing ask price minus volUSD');
            pricePoint = parseFloat(askPrice) + parseFloat(volUSD);// add because the % of vol adj is negative and it will ALWAYS be a negative number
            pricePoint = Math.floor(pricePoint);//round down
            this.logData(chalk.blue(`Bot - placeBaseOrder - Placing base order with the ask price ${askPrice} minus vol ${volUSD} - placed pricepoint = ${pricePoint}`));
            this.logData(`Placing base order using the market price minus the vol ${pricePoint} vol adj = ${volUSD}`);
        }else{
            throw new Error('Fault in placeBaseOrder price setting logic!!!');
        }*/

        //new pricepoint formula, try get closest to a market order as possible, without getting the higher fee.
        //this gets askprice minus volatility/
        // the idea is to get in the market as soon as possible without a taker order, try and catch those runs up
        pricePoint = askPrice*0.999;// place it 0.1% below asking price
        pricePoint = Math.floor(pricePoint);//round down
        this.logData(chalk.blue(`Bot - placeBaseOrder - Placing base order with the ask price ${askPrice} minus vol ${volUSD} - placed pricepoint = ${pricePoint}`));
        this.logData(`Placing base order using the market price minus the vol ${pricePoint} vol adj = ${volUSD}`);


        //place order and log
        if(this.baseOrderQty < 10){ throw new Error('BASE ORDER QUANTITY IS BELOW 10! Youre probably out of funds.')}
        const confirmation = await exchange.createLimitOrder(this.pair, 'buy', this.baseOrderQty,pricePoint,{'type':this.type});//attempt at doing limitorder at marketprice - maybe more trades?
        //const confirmation = await exchange.createLimitOrder(this.pair, 'buy', this.baseOrderQty,pricePoint,{'type':this.type});//original
        confirmation ? console.log(chalk.bgGreen('BOT: base order placed for '+this.baseOrderQty+' at '+ pricePoint+' USD, while market price = '+currentPriceTemp.info.ask_price)): '';
        confirmation ? this.logData(`Base order made: QTY=${this.baseOrderQty} price=${pricePoint.toLocaleString(2)} market ask price=${currentPriceTemp.info.ask_price} difference=${((1-(pricePoint/currentPriceTemp.info.ask_price))*100).toLocaleString(4)}%`):'';
        confirmation ? baseOrderPlaceHolder = confirmation : '';
        //confirmation ? this.placeSafetyOrders(baseOrderPlaceHolder, exchange): '';
        confirmation ? this.baseOrderRef = confirmation : '';
        confirmation ? console.log(chalk.bgGray(JSON.stringify(confirmation))) : '';

    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: placeBaseOrder() part 2 failed. ${e}`);
        console.log(chalk.red('BOT ERROR: placing base order part 2 failed.'+e));
    }
    /* Return of market order function promise
        {
        info: {
            user_id: '527100',
            order_id: 'e2f5c3bb-3a97-4b71-b8de-e6819d06f05d',
            symbol: 'BTCUSD',
            side: 'Buy',
            order_type: 'Market',
            price: '37158.5',
            qty: '721',
            time_in_force: 'ImmediateOrCancel',
            order_status: 'Created',
            last_exec_time: '0',
            last_exec_price: '0',
            leaves_qty: '721',
            cum_exec_qty: '0',
            cum_exec_value: '0',
            cum_exec_fee: '0',
            reject_reason: 'EC_NoError',
            order_link_id: '',
            created_at: '2022-05-06T14:57:27.041Z',
            updated_at: '2022-05-06T14:57:27.041Z',
            take_profit: '0.00',
            stop_loss: '0.00',
            tp_trigger_by: 'UNKNOWN',
            sl_trigger_by: 'UNKNOWN'
        },
        id: 'e2f5c3bb-3a97-4b71-b8de-e6819d06f05d',
        clientOrderId: undefined,
        timestamp: 1651849047041,
        datetime: '2022-05-06T14:57:27.041Z',
        lastTradeTimestamp: undefined,
        symbol: 'BTC/USD:BTC',
        type: 'market',
        timeInForce: 'IOC',
        postOnly: false,
        side: 'buy',
        price: undefined,
        stopPrice: undefined,
        amount: 721,
        cost: 0,
        average: undefined,
        filled: 0,
        remaining: 721,
        status: 'open',
        fee: { cost: 0, currency: 'BTC' },
        trades: [],
        fees: [ { cost: 0, currency: 'BTC' } ]
        }
         */

    return Promise.resolve();
}

async setLeverage(exchange){// in the future you'll want to change this so it can do more than just BTCUSD inverse
    
    //WARNING: Changing leverage or type to a value that it is already set to (on the exchange),
    //leads to an error being thrown back by the exchange (ByBit) and thus crashing your node
    //ONLY set the values at the beginning, and probably always first check their values before
    //attempting to change them. - Orange Matt

    try{
        const confirmation = await exchange.setLeverage(this.leverage, this.pair); //change this hardcoding so it can take other pairs later on
        confirmation ? console.log(chalk.green('Node - setLeverage - Leverage changed to '+JSON.stringify(confirmation))) : '';
    }catch(e){
        const error = e.toString();
        if(!error.includes('"ret_code\":34036')){//if leverage stayed consistent, it will always trigger this response code, so you can ignore it
            this.logData(`!!!!!!!!!!  ERROR BOT: There was an error when changing the leverage. setLeverage() ${e}`);
            console.log(chalk.cyan('setLeverage() There was an error when changing the leverage, it is probably already on the level you want it.'));
            console.log(chalk.yellow('ERROR MSG: '+e));
        }
    }
    return Promise.resolve();
}
/*//USED BY DEBUG - DO NOT DELETE
async setMarginTypeCross(exchange){
    
    //WARNING: Changing leverage or type to a value that it is already set to (on the exchange),
    //leads to an error being thrown back by the exchange (ByBit) and thus crashing your node
    //ONLY set the values at the beginning, and probably always first check their values before
    //attempting to change them. - Orange Matt

    try{
        const confirmation = await exchange.setMarginMode ('cross', this.pair); //change this hardcoding so it can take other pairs later on
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: There was an error when changing the margin type (cross). ${e}`);
        console.log(chalk.cyan('There was an error when changing the margin type (cross), it is probably already on the type you want it.'));
        console.log(chalk.yellow('ERROR MSG: '+e.ret_msg));
    }
    return Promise.resolve();
}
*/

/* //DEBUG PANEL DO NOT DELETE
async debug(req, res, exi, exch){
    if(req.body.data === 'debug create bot'){
        console.log(chalk.cyan('BOT debug create bot'));
    }
    if(req.body.data === 'debug place base order'){
        console.log(chalk.cyan('BOT debug place base order'));
        this.placeBaseOrder(exch);
    }
    if(req.body.data === 'debug place safety order'){
        console.log(chalk.cyan('BOT debug place safety order'));
        this.placeSafetyOrder(exch);
    }
    if(req.body.data === 'debug leverage 10'){
        console.log(chalk.cyan('BOT debug leverage 10'));
        this.setMarginTypeCross(exch);
        this.setLeverage(exch);
    }
    if(req.body.data === 'debug close position'){
        console.log(chalk.cyan('BOT debug close position'));
        //this.closePosition(exch);
    }
    return Promise.resolve();
}*/

async checkLeverageAndType(position, exchange){//receives current active position from node tick
//for some weird reason, the exchange coming in here, comes as a position from the bot's pair. THerefore I could not call requests on it. strange, need to come back to this
    console.log('checkLeverageAndType() for position ID: '+ position.data.id);
    if(exchange.leverage != this.leverage){//dunno how to look for croos/isolated yet
        //this.logData('I am in the checkLeverageAndType');
        this.setLeverage(exchange);
    }
    return Promise.resolve();
}
changeSettings(settings, exchange){

    this.commitedCapital = settings.committed_capital/100; //total capital you want the bot to work with
    this.baseOrderSize = settings.base_order_percentage/100; //percentage expressed in decimals. percentage of commited capital for initial orders
    this.profitTarget = settings.profit_target/100; //percentage expressed in decimals. at which % does bot take profit?
    this.leverage = settings.leverage;
    //this.levType = 'cross'; //for now, standard on cross, is safer in big unexpectedcrashes, can also use margin that is in account but not part of bots' commited capital
    this.safetyTarget = settings.safety_target/100; //percentage expressed in decimals, when does bot place another order to bring down average entry price
    this.safetyOrderSizeofCC = settings.safety_order_percentage/100; //percentage expressed in decimals, 
    //this.safetyOrderMultiplier = settings; //with each safety order, how much do you want to increase the size of every new order?
    this.maxSafetyOrdersPlaced = settings.max_safety_orders; //max number of safety orders that can be open orders at any given time
    //this.safetyOrderCount = 0;
    this.liquidationLimit = settings.liquidation_limit;

    console.log(chalk.yellow('The bot settings have now been changed.'));
    console.log(chalk.yellow('committed capital='+this.commitedCapital));
    console.log(chalk.yellow('base order size='+this.baseOrderSize));
    console.log(chalk.yellow('profit target='+this.profitTarget));
    console.log(chalk.yellow('safety target='+this.safetyTarget));
    console.log(chalk.yellow('max safety orders='+this.maxSafetyOrdersPlaced));
    console.log(chalk.yellow('liquidation limit='+this.liquidationLimit));

    this.volatilityCalculator(exchange);

    this.checkLeverageAndType(exchange);
}

async volatilityCalculator(exchange){
    //call exchange, get data of last day in 5 minute intervals
    let response = undefined;

    if(exchange.has.fetchMarkOHLCV){
        try{
            const oneHourMilliseconds = 1000*60*60;
            const oneDayMilliseconds = 1000*60*60*24;
            const oneHourAgo = Date.now()-oneHourMilliseconds;
            const oneDayAgo = Date.now()-oneDayMilliseconds; // NOT A GOOD IDEA - one day EMA is in bear markets ABOVE market price, would result in constant high end market buys
            //maybe an offset of x% from daily EMA might work?? drop it like 2% or so? can math later TBD

            response = await exchange.fetchMarkOHLCV(this.pair, '5m',oneHourAgo); //does NOT return as string, dunno 
                
        }catch(e){
            this.logData(`!!!!!!!!!!  ERROR BOT: volatilityCalculator() failed. ${e}`);
            console.log(chalk.red('BOT ERROR: volatilityCalculator failed '+e));
        }
        //seperate the data into candles or rows of data
        const lal = response.toString();
        const rows = lal.split(',,');
        let ohlcvArr = [];
        //once seperate per candle, put the data into an object so we know what's what
        rows.forEach(row=>{
            const cells = row.split(',');
            ohlcvArr.push(
                {
                    'UTC':cells[0],
                    'open':cells[1],
                    'high':cells[2],
                    'low':cells[3],
                    'close':cells[4],
                    'volume':cells[5]
                }
            );
        });
        //once seperated, now it's time to calculate the difference between highs and lows, put those into an array in percentages
        //and return an average of that array, call it the avg volatility of the past hour
        let arrayOfAverages = [];
        let arrayAveragePriceperCandle = [];
        let totalTemp = 0;
        ohlcvArr.forEach(candle=>{
            const lala = 1-(candle.low/candle.high);
            arrayOfAverages.push(lala);
            totalTemp -= lala;//subtract because the outcome is a negative number ie -0,05 for a 5% drop

            //calc average price per candle between high and low
            const baba = (parseFloat(candle.low)+parseFloat(candle.high))/2;
            arrayAveragePriceperCandle.push(baba);
        });

        //with an array of average prices in the bag, lets calc the EMA price point for the current moment
        let EMA = arrayAveragePriceperCandle[0];//instead of 0, use the first price in the array to feed the next calc
        let smoothing = 2;

        arrayAveragePriceperCandle.forEach(avgPrice=>{
            EMA = (avgPrice*(smoothing/(1+12)))+EMA*(1-(smoothing/(1+12)));//12 because I want the EMA of the last hour - 5min candles * 12 = 1H
        });

        const averageVolatility = totalTemp/arrayOfAverages.length;//is a negative percentage
        const p = EMA+(EMA*averageVolatility);//add because the avgVol% is negative

        //try and set safety target by avgVol
        this.safetyTarget = 0 - averageVolatility;//detract because avgVol is negative.
        console.log('changed the safety Target in volCalc() - '+this.safetyTarget);

        
        const y = {'EMAprice':EMA,'volAdjustedEMAprice':p,'volAdjustment':averageVolatility};
        console.log(chalk.cyan('Bot - VolCalc ='+JSON.stringify(y)));
        this.logData('Bot - volCalc - VolCalc ='+JSON.stringify(y));

        return y; //returns a percentage - percentage represents the average high to low % change in 5min candles in the past hour
    }
    
//end of volatilityCalc
}

calcPositionSize(currentaskprice){
    try{
        this.liquidationLimit = currentaskprice*(1-this.maxDrop);
        let positionsize = null;
        const a = this.liquidationLimit*this.commitedCapital;
        const b = a/1.01; // take out 1% in trading fees
        const inverteddrop = 1 / (1 - (this.liquidationLimit/currentaskprice)); //inverse max drop
        positionsize = b*inverteddrop;
        console.log(chalk.red('LIQUIDATION LIMIT IS '+this.liquidationLimit+' avail bal IS '+this.commitedCapital+' ask price is '+currentaskprice+' AND SO THE POSITION SIZE IS '+positionsize));
        return positionsize/8;//4 because in order to prevent liq target from inflating by safety orders (DANGEROUS!) 1 BO n 2 SO of which 2xsize = 4
        //later on this needs to be switched to a modular solution
    }catch(e){
        console.log(chalk.red('BOT ERROR in calcPositionSize(): '+e.ret_msg));
    }
}

async getBalanceBTC(exchange){
    try{
        const lal =  await exchange.fetchBalance();
        //console.log(lal);
        return lal.free.BTC;
    }catch(e){
        this.logData(`!!!!!!!!!!  ERROR BOT: getBalance() failed. ${e}`);
        console.log(chalk.red('BOT ERROR: getBalance() failed '+e));
    }
}

/* //DO NOT DELETE THIS ONE, saving data will be cool later on
readDataFile(){
    try{
        const temp = fs.readFileSync(dataFile, (e, jsonString)=>{
            if(e){throw new Error('Reading SO dataFile Error: '+e)}
            try{return jsonString;}
            catch(e){throw new Error('Reading SO dataFile Error: '+e);}     
        });
        return JSON.parse(temp); 
    }catch(e){
        console.log(chalk.red('BOT ERROR in checkPositionNew(): '+e));
    }
}*/

//end of class
}

