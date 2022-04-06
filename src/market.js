function SellPixels() {
    const threshold = 8500;

    if (Game.resources.pixel == 0) {
        return;
    }
    let orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: PIXEL});
    orders = _.sortBy(orders, (o) => (-o.price));
    let available = Game.resources.pixel;
    let chances = 10;
    for (let order of orders) {
        if (order.remainingAmount > 0 && order.price >= threshold) {
            let amount = Math.min(available, order.remainingAmount);
            Game.market.deal(order.id, amount);
            available -= amount;
            if (--chances == 0 || available <= 0) {
                return;
            }
        }
    }
}

global.BuyResource = function(targetRoom, resourceType, amount, price) {
    let orders = Game.market.getAllOrders({type: ORDER_SELL, resourceType: resourceType});
    orders = _.sortBy(orders, (o) => (o.price));
    let available = amount;
    let chances = 1;
    let result = '';
    for (let order of orders) {
        if (order.remainingAmount > 0 && order.price <= price) {
            let amount = Math.min(available, order.remainingAmount);
            Game.market.deal(order.id, amount, targetRoom);
            available -= amount;
            result += `Buy ${amount} ${resourceType} @ ${order.price}\n`;
            if (--chances == 0 || available <= 0) {
                return result;
            }
        }
    }
    return result;
}

global.SellResource = function(targetRoom, resourceType, amount, price) {
    let orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: resourceType});
    orders = _.sortBy(orders, (o) => (-o.price));
    let available = amount;
    let chances = 1;
    let result = '';
    for (let order of orders) {
        if (order.remainingAmount > 0 && order.price >= price) {
            let amount = Math.min(available, order.remainingAmount);
            Game.market.deal(order.id, amount, targetRoom);
            available -= amount;
            result += `Sell ${amount} ${resourceType} @ ${order.price}\n`;
            if (--chances == 0 || available <= 0) {
                return result;
            }
        }
    }
    return result;
}

export default function MarketMain() {
    // sell pixels
    // SellPixels();
}
