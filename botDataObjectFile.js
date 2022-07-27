module.exports = class Bot{

    constructor(){
        console.log('Creating new bot data set...');
        
        this.currentPosition = {
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
        this.pastMonthPNL = [],
        this.currentPositionb={},
        this.balance={
            wallet_balance : '???',
            equity:'???',
            available_balance:'???',
            used_margin:'???',
            order_margin:'???',
            PL:'???',
            TotalPL:'???',
            totalTradesCompleted:0
        },
        this.exchange={
            openOrders:0,
            currentPosition:null
        },
        this.botSettings={
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
    }
}