/* generic ajax function */
function request(method, url, success, fail, data = null) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == 4) {
      if (xhttp.status == 200) {
        try {
          success(JSON.parse(xhttp.responseText));
        } catch (e) {
          success([]);
        }
      } else {
        fail(JSON.parse(xhttp.responseText));
      }
    }
  };
  xhttp.open(method, url, true);
  if (data) {
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
  } else {
    xhttp.send();
  }
}

/* Structures:
 * item = {
   * id -- int,
   * name -- str,
   * price -- int,
   * amount -- int,
   * available -- bool,
   * hidden -- bool
 * };
 * discount = {
   * id -- int,
   * item_id -- int,
   * discount -- float,
   * rule -- text
 * };
 * order = {
   * order_id -- int,
   * user_id -- int,
   * paid -- bool
 * };
 */

/* return list of items */
function getItemList(success, fail) {
  request("GET", "/api/v1/item/list", success, fail);
}

function getItemById(id, success, fail) {
  request("GET", `/api/v1/item/${id}`, success, fail);
}

/* return list of discounts */
function getDiscountList(item_id, success, fail) {
  request("GET", `/api/v1/discount/list/${item_id}`, success, fail);
}

function addRole(role, success, fail) {
  request("PUT", `/api/v1/role/add/${role}`, success, fail);
}

/* XXX: maybe not role_id but name */
function assignRole(user_id, role_id, success, fail) {
  request("PUT", `/api/v1/user/${user_id}/role/add/${role_id}`, success, fail);
}

function putNewItem(item, success, fail) {
  request("PUT", "/api/v1/item/add", success, fail, JSON.stringify(item));
}

function updateItem(item, success, fail) {
  request("PUT", "/api/v1/item/update", success, fail, JSON.stringify(item));
}

function addDiscount(discount, success, fail) {
  request("PUT", "/api/v1/discount/add", success, fail, JSON.stringify(discount));
}

function deleteDiscount(discount_id, success, fail) {
  request("DELETE", `/api/v1/discount/delete/${discount_id}`, success, fail);
}

function createOrder(success, fail) {
  request("PUT", `/api/v1/order/create`, success, fail);
}

/* returns {id} */
function getCurrentOrder(success, fail) {
  request("GET", `/api/v1/order/get`, success, fail);
}

function orderAddItem(item_id, amount, success, fail) {
  request("PUT", `/api/v1/order/add/${item_id}/${amount}`, success, fail);
}

function orderDeleteItem(item_order_id, order_id, success, fail) {
  request("DELETE", `/api/v1/order/delete/${order_id}/${item_order_id}`, success, fail);
}

/* return list of orders */
function getUserOrders(user_id, success, fail) {
  request("GET", `/api/v1/order/user/${user_id}/list`, success, fail);
}

function payOrder(order_id, success, fail) {
  request("PUT", `/api/v1/order/pay/${order_id}`, success, fail);
}

/* return list of items */
function getOrderItems(order_id, success, fail) {
  request("GET", `/api/v1/order/list/${order_id}`, success, fail);
}

function getAllOrders(success, fail) {
  request("GET", `/api/v1/order/all`, success, fail);
}

function getOrderPrice(order_id, success, fail) {
  request("GET", `/api/v1/order/${order_id}/price`, success, fail);
}

function getMe(success, fail) {
  request("GET", `/api/v1/user/me`, success, fail);
}

function getUser(user_id, success, fail) {
  request("GET", `/api/v1/user/by_id/${user_id}`, success, fail);
}

function getUserList(success, fail) {
  request("GET", `/api/v1/user/list`, success, fail);
}
