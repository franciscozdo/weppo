/* INIT */

function createOrderListNode(order, owner) {
  let li = document.createElement("li");
  li.setAttribute("id", `item${order.id}`);
  let name = document.createElement("a");
  name.innerText = order.id;
  name.setAttribute("href", `/order/${order.id}`);
  let price = document.createElement("span");
  let paid;
  if (order.paid) {
    paid = document.createElement("span");
    paid.innerText = " [paid]"
    paid.setAttribute("style", "color:green");
  } else {
    if (owner) {
      paid = document.createElement("button");
      paid.innerText = "Pay";
      paid.setAttribute("onclick", `buttonPayOrder(${order.id})`);
      paid.setAttribute("class", `payButton`);
    } else {
      paid = document.createElement("span");
      paid.innerText = " [not paid]"
      paid.setAttribute("style", "color:red");
    }
  }
  li.appendChild(name);
  li.appendChild(paid);
  return li;
}

function insertOrderList(user_id, owner) {
  function success(orders) {
    for (order of orders) {
      console.log(order);
      append("orderList", createOrderListNode(order, owner));
    }
    if (orders.length > 0) {
      document.getElementById("oops").remove();
    }
  }
  getUserOrders(user_id, success, console.log);
}

function createItemListNode(item, order_id, paid, owner) {
  let li = document.createElement("li");
  li.setAttribute("id", `item${item.item_order_id}`);
  let name = document.createElement("a");
  name.innerText = item.name;
  name.setAttribute("href", `/item/${item.id}`);
  let span = document.createElement("span");
  span.innerText = ` [price: ${item.price}$] [amount: ${item.amount}pcs]`
  li.appendChild(name);
  li.appendChild(span);
  if (!paid && owner) {
    let del = document.createElement("button");
    del.setAttribute("onclick", `buttonRemoveItem(${item.item_order_id}, ${order_id})`);
    del.setAttribute("class", "deleteButton");
    del.innerText = "Delete";
    li.appendChild(del);
  }
  return li;
}

function insertOrderItems(order_id, paid, owner) {
  function success(items) {
    items.sort((a, b) => {return a.id - b.id});
    for (item of items) {
      append("orderItemList", createItemListNode(item, order_id, paid, owner));
    }
  }
  function fail(res) {
    let resp = res['status'];
    console.log(resp);
    document.getElementsByClassName("content")[0].innerText = "No such order";
  }
  getOrderItems(order_id, success, fail);
}

function createAllOrderListNode(order) {
  let li = document.createElement("li");
  li.setAttribute("id", `item${order.id}`);
  let name = document.createElement("a");
  name.innerText = order.id;
  name.setAttribute("href", `/order/${order.id}`);
  let user = document.createElement("span");
  user.innerText = ` for user ${order.user_id} `;
  let paid = document.createElement("span");
  if (order.paid) {
    paid.innerText = " [paid]"
    paid.setAttribute("style", "color:green");
  } else {
    paid.innerText = " [not paid]"
    paid.setAttribute("style", "color:red");
  }
  li.appendChild(name);
  li.appendChild(user);
  li.appendChild(paid);
  return li;
}

function insertAllOrders() {
  function success(orders) {
    for (order of orders) {
      append("orderList", createAllOrderListNode(order));
    }
    if (orders.length > 0) {
      document.getElementById("oops").remove();
    }
  }
  getAllOrders(success, console.log);
}

function insertPrice(order_id) {
  function success(price) {
    document.getElementById("price").innerText = price.price;
  }
  getOrderPrice(order_id, success, console.log);
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
  payOrder(order_id, () => {location.reload()}, console.log);
}

function buttonRemoveItem(item_ord_id, order_id) {
  function success(x) {
    document.getElementById(`item${item_ord_id}`).remove();
    location.reload();
  }
  orderDeleteItem(item_ord_id, order_id, success, console.log);
}
