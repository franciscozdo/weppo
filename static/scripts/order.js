/* INIT */

function insertOrderList(user_id) {
  /* TODO */
  //getUserOrders
}

function createItemListNode(item) {
  let li = document.createElement("li");
  let a1 = document.createElement("a");
  a1.innerText = item.name;
  a1.setAttribute("href", `/item/${item.id}`);
  let span = document.createElement("span");
  span.innerText = ` [price: ${item.price}$] [amount: ${item.amount}pcs]`
  li.appendChild(a1);
  li.appendChild(span);
  return li;
}

function insertOrderItems(order_id) {
  function success(items) {
    items.sort((a, b) => {return a.id - b.id});
    for (item of items) {
        append("orderItemList", createItemListNode(item));
    }
  }
  getOrderItems(order_id, success, console.log);
}

/* ACTIONS */
function buttonAddToCart(item_id) {
  function success(x) {
    console.log("added to cart");
    insertItem(item_id);
  }
  /* assume we add one item only */
  getCurrentOrder(
    (x) => {console.log(x);orderAddItem(item_id, 1, success, console.log)},
    (x) => {
      createOrder(
        (x) => {console.log(x); orderAddItem(item_id, 1, success, console.log)},
        console.log)
    });
}

function buttonPayOrder(order_id) {
  /* TODO */
  //payOrder
}

function buttonRemoveItem(order_id, item_ord_id) {
  /* TODO */
  //orderDeleteItem
}
