/* fetching data */

function fetchData(method, url, callback) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      callback(JSON.parse(xhttp.responseText));
    }
  };
  xhttp.open(method, url, true);
  xhttp.send();
}

function getItemList(callback) {
  fetchData("GET", "/api/v1/item/list", callback);
}

function getItemById(id, callback) {
  function filter (items) {
    for (i of items) {
      if (i.id == id)
        return i;
    }
    return null;
  }
  getItemList((items) => callback(filter(items)));
}

function getUserOrders(user_id, callback) {
  fetchData("GET", `/api/v1/order/user/${user_id}/list`, callback);
}

function getOrderItems(order_id, callback) {
  fetchData("GET", `/api/v1/order/list/${order_id}`, callback);
}
