/* fetching data */

function fetchData(method, url, success, fail) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == 4) {
      if (xhttp.status == 200) {
        success(JSON.parse(xhttp.responseText));
      } else {
        fail(xhttp.responseText);
      }
    }
  };
  xhttp.open(method, url, true);
  xhttp.send();
}

function getItemList(success, failure) {
  fetchData("GET", "/api/v1/item/list", success, failure);
}

function getItemById(id, success, failure) {
  function filter (items) {
    for (i of items) {
      if (i.id == id)
        return i;
    }
    return null;
  }
  getItemList((items) => success(filter(items)), failure);
}

function getUserOrders(user_id, success, failure) {
  fetchData("GET", `/api/v1/order/user/${user_id}/list`, success, failure);
}

function getOrderItems(order_id, success, failure) {
  fetchData("GET", `/api/v1/order/list/${order_id}`, success, failure);
}

/* pushing data */

function pushData(method, url, data, success, fail) {
  console.log("want to send: " + data);
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (xhttp.readyState == 4) {
      if (xhttp.status == 200) {
        success(xhttp.responseText);
      } else {
        fail(xhttp.responseText);
      }
    }
  };
  xhttp.error = fail;
  xhttp.open(method, url, true);
  xhttp.setRequestHeader("Content-Type", "application/json");
  xhttp.send(data);
}

function putNewItem(item, success, fail) {
  pushData("PUT", "/api/v1/item/add", JSON.stringify(item), success, fail);
}

function updateItem(item, success, fail) {
  pushData("PUT", "/api/v1/item/update", JSON.stringify(item), success, fail);
}
