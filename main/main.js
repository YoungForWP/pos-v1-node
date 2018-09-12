function buildItem(barcode, name, price, unit, amount) {
    let item = {};
    item.barcode = barcode;
    item.name = name;
    item.price = price;
    item.unit = unit;
    item.amount = amount;
    return item;
}
function getPreprocessedInputs(inputs) {
    let processedInputs = inputs.map(item => {
        if (item.indexOf("-") > -1) {
            let splited = item.split("-");
            delete item;
            return new Array(parseInt(splited[1])).fill(splited[0]);
        }
        return item;
    });
    return [].concat.apply([], processedInputs);
}

function getShoppingItems(inputs) {
    let preprocessedInputs = getPreprocessedInputs(inputs);
    let uniqueInputs = preprocessedInputs.filter((item, index, array) => array.indexOf(item) === index);
    let allItems = require('./datbase').loadAllItems();

    return uniqueInputs.map(item => {
        let matchedItem = allItems.filter(each => each.barcode === item)[0];
        let amount = preprocessedInputs.filter(each => each === item).length;
        return buildItem(item, matchedItem.name, matchedItem.price, matchedItem.unit, amount);
    });
}

function getFreeItems(shoppingItems) {
    let freeItems = [];
    let promotionItems = require('./datbase').loadPromotions();

    shoppingItems
        .filter(item => item.amount > 2)
        .filter(item => {
            return promotionItems.filter(each => each.type === 'BUY_TWO_GET_ONE_FREE')
                .map(each => each.barcodes.indexOf(item) > -1)
        })
        .map(item => freeItems.push(buildItem(item.barcode, item.name, item.price, item.unit, 1)));
    return freeItems;
}

function calculateMoney(items) {
    return items.reduce((acc, item) => acc + item.price * item.amount, 0);
}

function generateShoppingListInfo(shoppingItems, freeItems) {
    let shoppingListInfo = "";
    shoppingItems.map(item => {
        let amountInCalculation = freeItems.filter(each => each.barcode === item.barcode).length > 0 ? item.amount - 1 : item.amount;
        shoppingListInfo += `名称：${item.name}，数量：${item.amount}${item.unit}，单价：${item.price.toFixed(2)}(元)，`
            + `小计：${(amountInCalculation * item.price).toFixed(2)}(元)\n`;
    });
    return shoppingListInfo;
}

function generateFreeListInfo(freeItems) {
    let freeListInfo = "";
    freeItems.map(item => {
        freeListInfo += `名称：${item.name}，数量：${item.amount}${item.unit}\n`
    });
    return freeListInfo;
}

module.exports = function printInventory(inputs) {
    let shoppingItems = getShoppingItems(inputs);
    let freeItems = getFreeItems(shoppingItems);
    let savedMoney = calculateMoney(freeItems);
    let totalMoney = calculateMoney(shoppingItems) - savedMoney;
    let info =
        `***<没钱赚商店>购物清单***\n` +
        generateShoppingListInfo(shoppingItems, freeItems) +
        `----------------------\n` +
        `挥泪赠送商品：\n` +
        generateFreeListInfo(freeItems) +
        `----------------------\n` +
        `总计：${totalMoney.toFixed(2)}(元)\n` +
        `节省：${savedMoney.toFixed(2)}(元)\n` +
        `**********************`;

    console.log(info);
};

