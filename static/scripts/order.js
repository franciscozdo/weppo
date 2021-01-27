/* INIT */

function insertOrderList(user_id) {
  /* TODO */
  //getUserOrders
}

function createItemListNode(item, order_id) {
  let li = document.createElement("li");
  li.setAttribute("id", `item${item.item_order_id}`);
  let name = document.createElement("a");
  name.innerText = item.name;
  name.setAttribute("href", `/item/${item.id}`);
  let span = document.createElement("span");
  span.innerText = ` [price: ${item.price}$] [amount: ${item.amount}pcs]`
  let del = document.createElement("button");
  del.setAttribute("onclick", `buttonRemoveItem(${item.item_order_id}, ${order_id})`);
  del.setAttribute("class", "deleteButton");
  del.innerText = "Delete";
  li.appendChild(name);
  li.appendChild(span);
  li.appendChild(del);
  return li;
}

function insertOrderItems(order_id) {
  function success(items) {
    items.sort((a, b) => {return a.id - b.id});
    for (item of items) {
        append("orderItemList", createItemListNode(item, order_id));
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
  let amount = document.getElementById('orderAmount').value;
  /* assume we add one item only */
  getCurrentOrder(
    (x) => {console.log(x);orderAddItem(item_id, amount, success, console.log)},
    (x) => {
      createOrder(
        (x) => {console.log(x); orderAddItem(item_id, amount, success, console.log)},
        console.log)
    });
}

function buttonPayOrder(order_id) {
  /* TODO */
  //payOrder
}

function buttonRemoveItem(item_ord_id, order_id) {
  function success(x) {
    document.getElementById(`item${item_ord_id}`).remove();
  }
  orderDeleteItem(item_ord_id, order_id, success, console.log);
}
