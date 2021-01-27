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
  span.innerText = ` [price: ${item.price}$]`
  li.appendChild(a1);
  li.appendChild(span);
  return li;
}

function insertOrderItems(order_id) {
  function success(items) {
    items.sort((a, b) => {return a.item_id - b.item_id});
    for (item of items) {
      getItemById(item.item_id, (item) => {
        append("orderItemList", createItemListNode(item));
      }, console.log);
    }
  }
  getOrderItems(order_id, success, console.log);
}

/* ACTIONS */
function buttonAddToCart(item_id) {
  function success(x) {
    console.log("added to cart");
  }
  getCurrentOrder(
    (x) => {console.log(x);orderAddItem(item_id, success, console.log)},
    (x) => {
      createOrder(
        (x) => {console.log(x); orderAddItem(item_id, success, console.log)},
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
